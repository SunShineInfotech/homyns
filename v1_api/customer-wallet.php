<?php
// Customer wallet ledger and payment receipt API.
require_once 'dbconnection.php';
if (!headers_sent()) header('Content-Type: application/json; charset=utf-8');
$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) $data = $_POST;
$type = intval($data['type'] ?? 0);
$company_id = mysqli_real_escape_string($sql, trim((string)($data['company_id'] ?? '')));
$client_id = intval($data['client_id'] ?? 0);
$response = ['status' => 'error', 'message' => 'Invalid request'];
$esc = function ($value) use ($sql) { return mysqli_real_escape_string($sql, trim((string)$value)); };

if ($company_id === '') {
    $response = ['status' => 'error', 'message' => 'Company ID is required'];
} else switch ($type) {
    case 1: // Customer statement: quotation charges and receipts.
        if ($client_id <= 0) { $response = ['status' => 'error', 'message' => 'Customer ID is required']; break; }
        $customerQuery = mysqli_query($sql, "SELECT client_id,client_name,wallet,c_date FROM tbl_client WHERE company_id='$company_id' AND client_id='$client_id' AND is_deleted='1' LIMIT 1");
        $customer = $customerQuery ? mysqli_fetch_assoc($customerQuery) : null;
        if (!$customer) { $response = ['status' => 'error', 'message' => 'Customer not found']; break; }

        $chargeQuery = mysqli_query($sql, "SELECT wallet_transaction_id AS transaction_id, DATE(created_at) AS transaction_date,
                                                  'Quotation Charge' AS transaction_type, CAST(quotation_id AS CHAR) AS reference,
                                                  remark, amount AS debit, 0 AS credit, '' AS account_name, created_at AS sort_date
                                           FROM tbl_quotation_wallet_transaction
                                           WHERE company_id='$company_id' AND client_id='$client_id'");
        $paymentQuery = mysqli_query($sql, "SELECT p.payment_id AS transaction_id, p.payment_date AS transaction_date,
                                                   'Payment Received' AS transaction_type, p.payment_number AS reference,
                                                   p.remark, 0 AS debit, p.amount AS credit, a.account_name,
                                                   CONCAT(p.payment_date,' ',TIME(p.c_date)) AS sort_date
                                            FROM tbl_customer_wallet_payment p
                                            LEFT JOIN tbl_account a ON a.company_id=p.company_id AND a.account_id=p.account_id
                                            WHERE p.company_id='$company_id' AND p.client_id='$client_id' AND p.is_deleted='1'");
        if (!$chargeQuery || !$paymentQuery) { $response = ['status' => 'error', 'message' => 'Could not fetch customer transactions']; break; }
        $charges = []; $payments = []; $chargeTotal = 0; $paymentTotal = 0;
        while ($row = mysqli_fetch_assoc($chargeQuery)) { $row['debit'] = (float)$row['debit']; $row['credit'] = 0; $chargeTotal += $row['debit']; $charges[] = $row; }
        while ($row = mysqli_fetch_assoc($paymentQuery)) { $row['credit'] = (float)$row['credit']; $row['debit'] = 0; $paymentTotal += $row['credit']; $payments[] = $row; }
        $opening = round((float)$customer['wallet'] - $chargeTotal + $paymentTotal, 2);
        $entries = array_merge($charges, $payments);
        if (abs($opening) > 0.009) {
            $entries[] = ['transaction_id' => 'OPEN-' . $client_id, 'transaction_date' => substr($customer['c_date'], 0, 10),
                          'transaction_type' => 'Opening Balance', 'reference' => 'Opening balance',
                          'remark' => 'Opening customer wallet balance', 'debit' => max(0, $opening),
                          'credit' => max(0, -$opening), 'account_name' => '', 'sort_date' => $customer['c_date']];
        }
        usort($entries, function ($a, $b) {
            $dateOrder = strcmp((string)$a['sort_date'], (string)$b['sort_date']);
            if ($dateOrder !== 0) return $dateOrder;
            return strnatcmp((string)$a['transaction_id'], (string)$b['transaction_id']);
        });
        $balance = 0; $debitTotal = 0; $creditTotal = 0;
        foreach ($entries as &$entry) {
            $debit = (float)$entry['debit']; $credit = (float)$entry['credit'];
            $debitTotal += $debit; $creditTotal += $credit; $balance += $debit - $credit;
            $entry['balance'] = round($balance, 2);
            unset($entry['sort_date']);
        }
        unset($entry);
        $response = ['status' => 'success', 'message' => 'Customer transactions fetched',
                     'customer' => ['client_id' => $customer['client_id'], 'client_name' => $customer['client_name'], 'wallet' => (float)$customer['wallet']],
                     'data' => $entries, 'total' => count($entries),
                     'totals' => ['debit' => round($debitTotal, 2), 'credit' => round($creditTotal, 2), 'balance' => round($balance, 2)]];
        break;

    case 2: // Receive payment: lower customer due and increase selected account.
        $account_id = intval($data['account_id'] ?? 0);
        $amount = round((float)($data['amount'] ?? 0), 2);
        $payment_date = $esc($data['payment_date'] ?? $date);
        $method = $esc($data['payment_method'] ?? 'Bank Transfer');
        $reference = $esc($data['reference_number'] ?? '');
        $remark = $esc($data['remark'] ?? '');
        if ($client_id <= 0 || $account_id <= 0 || $amount <= 0 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $payment_date)) {
            $response = ['status' => 'error', 'message' => 'Select a customer and account, then enter a valid payment date and amount']; break;
        }
        mysqli_begin_transaction($sql);
        $customerQuery = mysqli_query($sql, "SELECT client_id,client_name,wallet,address FROM tbl_client WHERE company_id='$company_id' AND client_id='$client_id' AND is_deleted='1' LIMIT 1 FOR UPDATE");
        $customer = $customerQuery ? mysqli_fetch_assoc($customerQuery) : null;
        $accountQuery = mysqli_query($sql, "SELECT account_id,account_name,account_balance FROM tbl_account WHERE company_id='$company_id' AND account_id='$account_id' AND is_deleted='1' LIMIT 1 FOR UPDATE");
        $account = $accountQuery ? mysqli_fetch_assoc($accountQuery) : null;
        if (!$customer || !$account) { mysqli_rollback($sql); $response = ['status' => 'error', 'message' => 'Customer or account not found']; break; }
        $wallet = round((float)$customer['wallet'], 2);
        if ($amount > $wallet + 0.001) { mysqli_rollback($sql); $response = ['status' => 'error', 'message' => 'Payment cannot be more than the customer wallet balance']; break; }

        $newWallet = round($wallet - $amount, 2);
        $newAccountBalance = round((float)$account['account_balance'] + $amount, 2);
        $paymentNumber = 'CPAY-' . date('Y') . '-' . date('ymdHis') . '-' . random_int(100, 999);
        $ledgerRemark = $remark !== '' ? $remark : 'Payment received from ' . $customer['client_name'];
        $ledgerRemark .= ' (' . $method . ($reference !== '' ? '; Ref: ' . $reference : '') . ')';
        $transactionName = $esc($customer['client_name']);
        $transactionAddress = $esc($customer['address'] ?? '');
        $fullRemark = $esc($ledgerRemark);
        $ok = mysqli_query($sql, "INSERT INTO tbl_transaction
                                  (company_id,transaction_bank_id,transaction_expense_category_id,transaction_amount,
                                   transaction_in_out,transaction_type,transaction_date,transaction_remark,
                                   transaction_name,transaction_address,is_deleted,c_date)
                                  VALUES ('$company_id','$account_id',NULL,'$amount',1,4,'$payment_date',
                                          '$fullRemark','$transactionName','$transactionAddress','1','$c_date')");
        $transaction_id = $ok ? mysqli_insert_id($sql) : 0;
        if ($ok) $ok = mysqli_query($sql, "UPDATE tbl_account SET account_balance='$newAccountBalance'
                                           WHERE company_id='$company_id' AND account_id='$account_id' AND is_deleted='1'");
        if ($ok) $ok = mysqli_query($sql, "UPDATE tbl_client SET wallet='$newWallet'
                                           WHERE company_id='$company_id' AND client_id='$client_id' AND is_deleted='1'");
        if ($ok) $ok = mysqli_query($sql, "INSERT INTO tbl_customer_wallet_payment
                                           (company_id,payment_number,client_id,account_id,transaction_id,amount,payment_date,payment_method,reference_number,remark,is_deleted,c_date)
                                           VALUES ('$company_id','" . $esc($paymentNumber) . "','$client_id','$account_id','$transaction_id',
                                                   '$amount','$payment_date','$method','$reference','$fullRemark','1','$c_date')");
        $payment_id = $ok ? mysqli_insert_id($sql) : 0;
        if ($ok) {
            mysqli_commit($sql);
            $response = ['status' => 'success', 'message' => 'Customer payment recorded; customer wallet and account balance updated',
                         'payment_id' => $payment_id, 'payment_number' => $paymentNumber,
                         'transaction_id' => $transaction_id, 'customer_wallet' => $newWallet, 'account_balance' => $newAccountBalance];
        } else {
            mysqli_rollback($sql);
            $response = ['status' => 'error', 'message' => 'Payment could not be saved; no balances were changed'];
        }
        break;

    default:
        $response = ['status' => 'error', 'message' => 'Unsupported request type'];
}

echo json_encode($response);
mysqli_close($sql);
?>

<?php
// Company-scoped finance API: expense categories, accounts, transactions, reports.
require_once 'dbconnection.php';
if (!headers_sent()) header('Content-Type: application/json; charset=utf-8');
$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) $data = $_POST;
$type = intval($data['type'] ?? 0);
$company_id = mysqli_real_escape_string($sql, trim((string)($data['company_id'] ?? '')));
$response = ['status' => 'error', 'message' => 'Unsupported request type'];

function fesc($value) { global $sql; return mysqli_real_escape_string($sql, trim((string)$value)); }
function fresult($query) { global $sql; try { return mysqli_query($sql, $query); } catch (Throwable $e) { error_log('Finance API query failed: ' . $e->getMessage()); return false; } }
function financeFail($message) { return ['status' => 'error', 'message' => $message]; }
function financeSuccess($message, $extra = []) { return array_merge(['status' => 'success', 'message' => $message], $extra); }

if ($company_id === '') {
    $response = financeFail('Company ID is required');
} else switch ($type) {
    case 1: // List expense categories.
        $q = fresult("SELECT * FROM tbl_expenses_categories WHERE company_id='$company_id' AND is_deleted='1' ORDER BY expenses_categories_title");
        if (!$q) { $response = financeFail('Could not fetch expense categories'); break; }
        $rows = []; while ($row = mysqli_fetch_assoc($q)) $rows[] = $row;
        $response = financeSuccess('Expense categories fetched', ['data' => $rows, 'total' => count($rows)]);
        break;

    case 2: // Add or update expense category.
        $id = intval($data['expenses_categories_id'] ?? 0);
        $name = fesc($data['expenses_categories_title'] ?? '');
        if ($name === '') { $response = financeFail('Category name is required'); break; }
        $dup = fresult("SELECT expenses_categories_id FROM tbl_expenses_categories WHERE company_id='$company_id' AND is_deleted='1' AND LOWER(expenses_categories_title)=LOWER('$name') AND expenses_categories_id<>$id LIMIT 1");
        if ($dup && mysqli_num_rows($dup)) { $response = financeFail('This expense category already exists'); break; }
        if ($id > 0) {
            $ok = fresult("UPDATE tbl_expenses_categories SET expenses_categories_title='$name' WHERE company_id='$company_id' AND expenses_categories_id='$id' AND is_deleted='1'");
            $response = $ok ? financeSuccess('Expense category updated') : financeFail('Could not update expense category');
        } else {
            $ok = fresult("INSERT INTO tbl_expenses_categories (company_id,expenses_categories_title,is_deleted,c_date) VALUES ('$company_id','$name','1','$c_date')");
            $response = $ok ? financeSuccess('Expense category added', ['expenses_categories_id' => mysqli_insert_id($sql)]) : financeFail('Could not add expense category');
        }
        break;

    case 3: // Archive category when unused.
        $id = intval($data['expenses_categories_id'] ?? 0);
        if ($id <= 0) { $response = financeFail('Category ID is required'); break; }
        $used = fresult("SELECT COUNT(*) AS total FROM tbl_transaction WHERE company_id='$company_id' AND transaction_expense_category_id='$id' AND transaction_type=3 AND is_deleted='1'");
        if ($used && intval(mysqli_fetch_assoc($used)['total']) > 0) { $response = financeFail('This category is used by expense records and cannot be archived'); break; }
        $ok = fresult("UPDATE tbl_expenses_categories SET is_deleted='0' WHERE company_id='$company_id' AND expenses_categories_id='$id' AND is_deleted='1'");
        $response = $ok ? financeSuccess('Expense category archived') : financeFail('Could not archive expense category');
        break;

    case 4: // List accounts with current balances.
        $q = fresult("SELECT * FROM tbl_account WHERE company_id='$company_id' AND is_deleted='1' ORDER BY account_name");
        if (!$q) { $response = financeFail('Could not fetch accounts'); break; }
        $rows = []; while ($row = mysqli_fetch_assoc($q)) $rows[] = $row;
        $response = financeSuccess('Accounts fetched', ['data' => $rows, 'total' => count($rows)]);
        break;

    case 5: // Add or update account details. Opening balance is only set at creation.
        $id = intval($data['account_id'] ?? 0);
        $name = fesc($data['account_name'] ?? '');
        if ($name === '') { $response = financeFail('Account name is required'); break; }
        $number = fesc($data['account_number'] ?? ''); $ifsc = fesc($data['account_ifsc'] ?? '');
        $branch = fesc($data['account_branch_name'] ?? ''); $holder = fesc($data['account_holder_name'] ?? '');
        $gst = fesc($data['account_gst_number'] ?? '');
        $upi_id = fesc($data['account_upi_id'] ?? '');
        $dup = fresult("SELECT account_id FROM tbl_account WHERE company_id='$company_id' AND is_deleted='1' AND LOWER(account_name)=LOWER('$name') AND account_id<>$id LIMIT 1");
        if ($dup && mysqli_num_rows($dup)) { $response = financeFail('This account name already exists'); break; }
        if ($id > 0) {
            $ok = fresult("UPDATE tbl_account SET account_name='$name',account_number='$number',account_ifsc='$ifsc',account_branch_name='$branch',account_holder_name='$holder',account_gst_number='$gst',account_upi_id='$upi_id' WHERE company_id='$company_id' AND account_id='$id' AND is_deleted='1'");
            $response = $ok ? financeSuccess('Account updated') : financeFail('Could not update account');
        } else {
            $balance = max(0, floatval($data['account_balance'] ?? 0));
            $ok = fresult("INSERT INTO tbl_account (company_id,account_name,account_number,account_ifsc,account_balance,account_branch_name,account_holder_name,account_gst_number,account_upi_id,is_deleted,c_date) VALUES ('$company_id','$name','$number','$ifsc','$balance','$branch','$holder','$gst','$upi_id','1','$c_date')");
            $response = $ok ? financeSuccess('Account added', ['account_id' => mysqli_insert_id($sql)]) : financeFail('Could not add account');
        }
        break;

    case 6: // Archive an account only if no transaction history uses it.
        $id = intval($data['account_id'] ?? 0);
        if ($id <= 0) { $response = financeFail('Account ID is required'); break; }
        $used = fresult("SELECT COUNT(*) AS total FROM tbl_transaction WHERE company_id='$company_id' AND transaction_bank_id='$id' AND is_deleted='1'");
        if ($used && intval(mysqli_fetch_assoc($used)['total']) > 0) { $response = financeFail('This account has transaction history and cannot be archived'); break; }
        $ok = fresult("UPDATE tbl_account SET is_deleted='0' WHERE company_id='$company_id' AND account_id='$id' AND is_deleted='1'");
        $response = $ok ? financeSuccess('Account archived') : financeFail('Could not archive account');
        break;

    case 7: // List expense/income entries. kind=all|expense|income.
        $kind = (string)($data['kind'] ?? 'all');
        $from = fesc($data['from_date'] ?? ''); $to = fesc($data['to_date'] ?? '');
        $account = intval($data['account_id'] ?? 0); $category = intval($data['category_id'] ?? 0);
        $transaction_id = intval($data['transaction_id'] ?? 0);
        $where = "t.company_id='$company_id' AND t.is_deleted='1' AND t.transaction_type IN (3,4)";
        if ($kind === 'expense') $where .= ' AND t.transaction_type=3';
        if ($kind === 'income') $where .= ' AND t.transaction_type=4';
        if ($from !== '') $where .= " AND t.transaction_date >= '$from'";
        if ($to !== '') $where .= " AND t.transaction_date <= '$to'";
        if ($account > 0) $where .= " AND t.transaction_bank_id='$account'";
        if ($category > 0) $where .= " AND t.transaction_expense_category_id='$category'";
        if ($transaction_id > 0) $where .= " AND t.transaction_id='$transaction_id'";
        $q = fresult("SELECT t.*,a.account_name,c.expenses_categories_title FROM tbl_transaction t LEFT JOIN tbl_account a ON a.account_id=t.transaction_bank_id AND a.company_id=t.company_id LEFT JOIN tbl_expenses_categories c ON c.expenses_categories_id=t.transaction_expense_category_id AND c.company_id=t.company_id WHERE $where ORDER BY t.transaction_date DESC,t.transaction_id DESC");
        if (!$q) { $response = financeFail('Could not fetch finance transactions'); break; }
        $rows = []; $income = 0; $expense = 0;
        while ($row = mysqli_fetch_assoc($q)) { $rows[] = $row; if (intval($row['transaction_type']) === 3) $expense += floatval($row['transaction_amount']); else $income += floatval($row['transaction_amount']); }
        $response = financeSuccess('Finance transactions fetched', ['data' => $rows, 'total' => count($rows), 'income_total' => round($income,2), 'expense_total' => round($expense,2)]);
        break;

    case 8: // Create or edit an income/expense, keeping account balance in sync.
        $id = intval($data['transaction_id'] ?? 0);
        $kind = ($data['kind'] ?? '') === 'income' ? 'income' : 'expense';
        $transaction_type = $kind === 'expense' ? 3 : 4;
        $transaction_in_out = $kind === 'expense' ? 2 : 1;
        $account_id = intval($data['transaction_bank_id'] ?? 0);
        $category_id = $kind === 'expense' ? intval($data['transaction_expense_category_id'] ?? 0) : 0;
        $amount = round(floatval($data['transaction_amount'] ?? 0), 2);
        $transaction_date = fesc($data['transaction_date'] ?? $date);
        $remark = fesc($data['transaction_remark'] ?? '');
        $name = fesc($data['transaction_name'] ?? ''); $address = fesc($data['transaction_address'] ?? '');
        if ($account_id <= 0 || $amount <= 0 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $transaction_date)) { $response = financeFail('Select an account, a valid date, and an amount greater than zero'); break; }
        if ($kind === 'expense') {
            $cq = fresult("SELECT expenses_categories_id FROM tbl_expenses_categories WHERE company_id='$company_id' AND expenses_categories_id='$category_id' AND is_deleted='1' LIMIT 1");
            if (!$cq || mysqli_num_rows($cq) === 0) { $response = financeFail('Select a valid expense category'); break; }
        }
        mysqli_begin_transaction($sql);
        $old = null;
        if ($id > 0) {
            $oq = fresult("SELECT transaction_id,transaction_type,transaction_in_out,transaction_bank_id,transaction_amount FROM tbl_transaction WHERE company_id='$company_id' AND transaction_id='$id' AND is_deleted='1' AND transaction_type IN (3,4) LIMIT 1 FOR UPDATE");
            $old = $oq ? mysqli_fetch_assoc($oq) : null;
            if (!$old || intval($old['transaction_type']) !== $transaction_type) { mysqli_rollback($sql); $response = financeFail('Transaction not found for editing'); break; }
        }
        $ids = array_unique(array_filter([$account_id, $old ? intval($old['transaction_bank_id']) : 0])); sort($ids);
        $balances = [];
        foreach ($ids as $aid) {
            $aq = fresult("SELECT account_balance FROM tbl_account WHERE company_id='$company_id' AND account_id='$aid' AND is_deleted='1' LIMIT 1 FOR UPDATE");
            $ar = $aq ? mysqli_fetch_assoc($aq) : null;
            if (!$ar) { mysqli_rollback($sql); $response = financeFail('Selected account is not available'); break 2; }
            $balances[$aid] = floatval($ar['account_balance']);
        }
        if ($old) {
            $oldAid = intval($old['transaction_bank_id']); $oldAmount = floatval($old['transaction_amount']);
            $balances[$oldAid] += intval($old['transaction_in_out']) === 2 ? $oldAmount : -$oldAmount;
        }
        $newBalance = $balances[$account_id] + ($transaction_in_out === 1 ? $amount : -$amount);
        if ($transaction_in_out === 2 && $newBalance < -0.0001) { mysqli_rollback($sql); $response = financeFail('This expense exceeds the selected account balance'); break; }
        if ($id > 0) {
            $ok = fresult("UPDATE tbl_transaction SET transaction_bank_id='$account_id',transaction_expense_category_id=" . ($category_id ?: 'NULL') . ",transaction_amount='$amount',transaction_in_out='$transaction_in_out',transaction_type='$transaction_type',transaction_date='$transaction_date',transaction_remark='$remark',transaction_name='$name',transaction_address='$address' WHERE company_id='$company_id' AND transaction_id='$id' AND is_deleted='1'");
        } else {
            $ok = fresult("INSERT INTO tbl_transaction (company_id,transaction_bank_id,transaction_expense_category_id,transaction_amount,transaction_in_out,transaction_type,transaction_date,transaction_remark,transaction_name,transaction_address,is_deleted,c_date) VALUES ('$company_id','$account_id'," . ($category_id ?: 'NULL') . ",'$amount','$transaction_in_out','$transaction_type','$transaction_date','$remark','$name','$address','1','$c_date')");
            if ($ok) $id = mysqli_insert_id($sql);
            if ($ok && $kind === 'expense') $ok = fresult("UPDATE tbl_transaction SET transaction_expance_payment_id='$id' WHERE company_id='$company_id' AND transaction_id='$id'");
        }
        if ($ok) {
            foreach ($balances as $aid => $balance) {
                $balance = round($aid === $account_id ? $newBalance : $balance, 2);
                if (!fresult("UPDATE tbl_account SET account_balance='$balance' WHERE company_id='$company_id' AND account_id='$aid' AND is_deleted='1'")) { $ok = false; break; }
            }
        }
        if ($ok) { mysqli_commit($sql); $response = financeSuccess($id > 0 && isset($data['transaction_id']) ? 'Transaction updated' : 'Transaction recorded', ['transaction_id' => $id]); }
        else { mysqli_rollback($sql); $response = financeFail('Could not save the transaction'); }
        break;

    case 9: // Delete transaction and reverse its account balance effect.
        $id = intval($data['transaction_id'] ?? 0);
        if ($id <= 0) { $response = financeFail('Transaction ID is required'); break; }
        mysqli_begin_transaction($sql);
        $q = fresult("SELECT transaction_bank_id,transaction_amount,transaction_in_out FROM tbl_transaction WHERE company_id='$company_id' AND transaction_id='$id' AND is_deleted='1' AND transaction_type IN (3,4) LIMIT 1 FOR UPDATE");
        $row = $q ? mysqli_fetch_assoc($q) : null;
        if (!$row) { mysqli_rollback($sql); $response = financeFail('Transaction not found'); break; }
        $aid = intval($row['transaction_bank_id']); $amount = floatval($row['transaction_amount']);
        $delta = intval($row['transaction_in_out']) === 2 ? $amount : -$amount;
        $ok = fresult("UPDATE tbl_account SET account_balance=account_balance+($delta) WHERE company_id='$company_id' AND account_id='$aid' AND is_deleted='1'");
        if ($ok) $ok = fresult("UPDATE tbl_transaction SET is_deleted='0' WHERE company_id='$company_id' AND transaction_id='$id' AND is_deleted='1'");
        if ($ok) { mysqli_commit($sql); $response = financeSuccess('Transaction deleted and account balance adjusted'); }
        else { mysqli_rollback($sql); $response = financeFail('Could not delete transaction'); }
        break;

    case 10: // Account transaction report with running balance.
        $account_id = intval($data['account_id'] ?? 0);
        $from = fesc($data['from_date'] ?? ''); $to = fesc($data['to_date'] ?? '');
        if ($account_id <= 0 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to) || $from > $to) {
            $response = financeFail('Select an account and a valid date range'); break;
        }
        $account_q = fresult("SELECT account_name,account_balance FROM tbl_account WHERE company_id='$company_id' AND account_id='$account_id' AND is_deleted='1' LIMIT 1");
        $account = $account_q ? mysqli_fetch_assoc($account_q) : null;
        if (!$account) { $response = financeFail('Selected account is not available'); break; }
        // Reverse all movements from the selected start date onward so the
        // report opens with the balance immediately before the first report day.
        $later_q = fresult("SELECT COALESCE(SUM(CASE WHEN transaction_in_out=1 THEN transaction_amount ELSE -transaction_amount END),0) AS later_net FROM tbl_transaction WHERE company_id='$company_id' AND transaction_bank_id='$account_id' AND is_deleted='1' AND transaction_type IN (3,4,5) AND transaction_date>='$from'");
        if (!$later_q) { $response = financeFail('Could not calculate account balance'); break; }
        $opening_balance = round(floatval($account['account_balance']) - floatval(mysqli_fetch_assoc($later_q)['later_net']), 2);
        $q = fresult("SELECT t.*,c.expenses_categories_title FROM tbl_transaction t LEFT JOIN tbl_expenses_categories c ON c.expenses_categories_id=t.transaction_expense_category_id AND c.company_id=t.company_id WHERE t.company_id='$company_id' AND t.transaction_bank_id='$account_id' AND t.is_deleted='1' AND t.transaction_type IN (3,4,5) AND t.transaction_date>='$from' AND t.transaction_date<='$to' ORDER BY t.transaction_date ASC,t.transaction_id ASC");
        if (!$q) { $response = financeFail('Could not fetch account transactions'); break; }
        $rows = []; $balance = $opening_balance; $debit_total = 0; $credit_total = 0;
        while ($row = mysqli_fetch_assoc($q)) {
            $amount = floatval($row['transaction_amount']);
            $row['transaction_debit'] = intval($row['transaction_in_out']) === 2 ? $amount : 0;
            $row['transaction_credit'] = intval($row['transaction_in_out']) === 1 ? $amount : 0;
            $debit_total += $row['transaction_debit']; $credit_total += $row['transaction_credit'];
            $balance += $row['transaction_credit'] - $row['transaction_debit'];
            $row['running_balance'] = round($balance, 2);
            $rows[] = $row;
        }
        $response = financeSuccess('Transaction report fetched', ['data' => $rows, 'total' => count($rows), 'account_name' => $account['account_name'], 'opening_balance' => $opening_balance, 'closing_balance' => round($balance, 2), 'debit_total' => round($debit_total, 2), 'credit_total' => round($credit_total, 2)]);
        break;

    case 11: // Atomically transfer funds between two accounts.
        $transfer_number = fesc($data['transfer_number'] ?? '');
        $transfer_date = fesc($data['transfer_date'] ?? $date);
        $debit_id = intval($data['debit_account_id'] ?? 0); $credit_id = intval($data['credit_account_id'] ?? 0);
        $amount = round(floatval($data['amount'] ?? 0), 2);
        $debit_remark = fesc($data['debit_remark'] ?? ''); $credit_remark = fesc($data['credit_remark'] ?? '');
        if ($debit_id <= 0 || $credit_id <= 0 || $debit_id === $credit_id || $amount <= 0 || $debit_remark === '' || $credit_remark === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $transfer_date)) {
            $response = financeFail('Select different debit and credit accounts, a valid date, amount, and both remarks'); break;
        }
        mysqli_begin_transaction($sql);
        $account_ids = [$debit_id, $credit_id]; sort($account_ids); $balances = [];
        foreach ($account_ids as $aid) {
            $aq = fresult("SELECT account_name,account_balance FROM tbl_account WHERE company_id='$company_id' AND account_id='$aid' AND is_deleted='1' LIMIT 1 FOR UPDATE");
            $ar = $aq ? mysqli_fetch_assoc($aq) : null;
            if (!$ar) { mysqli_rollback($sql); $response = financeFail('One of the selected accounts is unavailable'); break 2; }
            $balances[$aid] = ['name' => $ar['account_name'], 'balance' => floatval($ar['account_balance'])];
        }
        if ($balances[$debit_id]['balance'] + 0.0001 < $amount) { mysqli_rollback($sql); $response = financeFail('The debit account does not have enough balance'); break; }
        $debit_new_balance = round($balances[$debit_id]['balance'] - $amount, 2);
        $credit_new_balance = round($balances[$credit_id]['balance'] + $amount, 2);
        $ok = fresult("INSERT INTO tbl_transaction (company_id,transaction_bank_id,transaction_expense_category_id,transaction_amount,transaction_in_out,transaction_type,transaction_date,transaction_remark,transaction_name,transaction_address,is_deleted,c_date) VALUES ('$company_id','$debit_id',NULL,'$amount',2,5,'$transfer_date','$debit_remark','$transfer_number','','1','$c_date')");
        $debit_transaction_id = $ok ? mysqli_insert_id($sql) : 0;
        if ($ok) $ok = fresult("UPDATE tbl_transaction SET transaction_expance_payment_id='$debit_transaction_id' WHERE company_id='$company_id' AND transaction_id='$debit_transaction_id'");
        if ($ok) $ok = fresult("INSERT INTO tbl_transaction (company_id,transaction_bank_id,transaction_expense_category_id,transaction_amount,transaction_in_out,transaction_type,transaction_date,transaction_remark,transaction_name,transaction_address,transaction_expance_payment_id,is_deleted,c_date) VALUES ('$company_id','$credit_id',NULL,'$amount',1,5,'$transfer_date','$credit_remark','$transfer_number','','$debit_transaction_id','1','$c_date')");
        if ($ok) $ok = fresult("UPDATE tbl_account SET account_balance='$debit_new_balance' WHERE company_id='$company_id' AND account_id='$debit_id' AND is_deleted='1'");
        if ($ok) $ok = fresult("UPDATE tbl_account SET account_balance='$credit_new_balance' WHERE company_id='$company_id' AND account_id='$credit_id' AND is_deleted='1'");
        if ($ok) { mysqli_commit($sql); $response = financeSuccess('Account transfer completed', ['transfer_number' => $transfer_number, 'debit_transaction_id' => $debit_transaction_id]); }
        else { mysqli_rollback($sql); $response = financeFail('Could not complete account transfer'); }
        break;

    case 12: // Finance dashboard: all-time balances plus date-filtered income/expense analytics.
        $from = fesc($data['from_date'] ?? ''); $to = fesc($data['to_date'] ?? '');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to) || $from > $to) {
            $response = financeFail('Select a valid start and end date'); break;
        }
        $counts = ['customers' => 0, 'vendors' => 0, 'agencies' => 0, 'other_income' => 0, 'other_expense' => 0];
        $countQueries = [
            'customers' => "SELECT COUNT(*) n FROM tbl_client WHERE company_id='$company_id' AND is_deleted='1'",
            'vendors' => "SELECT COUNT(*) n FROM tbl_vendor WHERE company_id='$company_id' AND is_deleted='1'",
            'agencies' => "SELECT COUNT(*) n FROM tbl_agency WHERE company_id='$company_id' AND is_deleted='1'",
            'other_income' => "SELECT COUNT(*) n FROM tbl_transaction WHERE company_id='$company_id' AND transaction_type=4 AND is_deleted='1' AND transaction_date BETWEEN '$from' AND '$to'",
            'other_expense' => "SELECT COUNT(*) n FROM tbl_transaction WHERE company_id='$company_id' AND transaction_type=3 AND is_deleted='1' AND transaction_date BETWEEN '$from' AND '$to'"
        ];
        foreach ($countQueries as $key => $query) { $q = fresult($query); if ($q && ($r = mysqli_fetch_assoc($q))) $counts[$key] = intval($r['n']); }

        $customerRows = []; $vendorRows = []; $agencyRows = [];
        $q = fresult("SELECT client_id id,client_name name,GREATEST(COALESCE(wallet,0),0) amount FROM tbl_client WHERE company_id='$company_id' AND is_deleted='1' AND wallet>0 ORDER BY wallet DESC,client_name ASC LIMIT 10");
        if ($q) while ($r = mysqli_fetch_assoc($q)) $customerRows[] = ['id'=>(string)$r['id'],'name'=>$r['name'],'amount'=>(float)$r['amount']];
        $q = fresult("SELECT v.vendor_id id,v.vendor_name name,GREATEST(v.wallet+COALESCE(p.purchases,0)-COALESCE(r.returns_total,0)-COALESCE(pm.payments,0),0) amount FROM tbl_vendor v LEFT JOIN (SELECT company_id,vendor_id,SUM(total_amount) purchases FROM tbl_purchase WHERE is_deleted='1' GROUP BY company_id,vendor_id) p ON p.company_id=v.company_id AND p.vendor_id=v.vendor_id LEFT JOIN (SELECT company_id,vendor_id,SUM(total_amount) returns_total FROM tbl_purchase_return WHERE is_deleted='1' GROUP BY company_id,vendor_id) r ON r.company_id=v.company_id AND r.vendor_id=v.vendor_id LEFT JOIN (SELECT company_id,vendor_id,SUM(amount) payments FROM tbl_purchase_payment WHERE is_deleted='1' GROUP BY company_id,vendor_id) pm ON pm.company_id=v.company_id AND pm.vendor_id=v.vendor_id WHERE v.company_id='$company_id' AND v.is_deleted='1' ORDER BY amount DESC,v.vendor_name ASC LIMIT 10");
        if ($q) while ($r = mysqli_fetch_assoc($q)) $vendorRows[] = ['id'=>(string)$r['id'],'name'=>$r['name'],'amount'=>(float)$r['amount']];
        $q = fresult("SELECT agency_id id,agency_name name,GREATEST(COALESCE(wallet,0),0) amount FROM tbl_agency WHERE company_id='$company_id' AND is_deleted='1' AND wallet>0 ORDER BY wallet DESC,agency_name ASC LIMIT 10");
        if ($q) while ($r = mysqli_fetch_assoc($q)) $agencyRows[] = ['id'=>(string)$r['id'],'name'=>$r['name'],'amount'=>(float)$r['amount']];

        $monthly = [];
        $q = fresult("SELECT DATE_FORMAT(transaction_date,'%Y-%m') month,SUM(CASE WHEN transaction_type=4 THEN transaction_amount ELSE 0 END) income,SUM(CASE WHEN transaction_type=3 THEN transaction_amount ELSE 0 END) expense FROM tbl_transaction WHERE company_id='$company_id' AND is_deleted='1' AND transaction_type IN (3,4) AND transaction_date BETWEEN '$from' AND '$to' GROUP BY DATE_FORMAT(transaction_date,'%Y-%m') ORDER BY month ASC");
        if ($q) while ($r = mysqli_fetch_assoc($q)) $monthly[] = ['month'=>$r['month'],'income'=>(float)$r['income'],'expense'=>(float)$r['expense']];
        $categoryRows = [];
        $q = fresult("SELECT COALESCE(c.expenses_categories_title,'Uncategorised') name,SUM(t.transaction_amount) amount FROM tbl_transaction t LEFT JOIN tbl_expenses_categories c ON c.expenses_categories_id=t.transaction_expense_category_id AND c.company_id=t.company_id WHERE t.company_id='$company_id' AND t.is_deleted='1' AND t.transaction_type=3 AND t.transaction_date BETWEEN '$from' AND '$to' GROUP BY t.transaction_expense_category_id,c.expenses_categories_title ORDER BY amount DESC");
        if ($q) while ($r = mysqli_fetch_assoc($q)) $categoryRows[] = ['name'=>$r['name'],'amount'=>(float)$r['amount']];
        $totals = ['customer_outstanding'=>0, 'vendor_outstanding'=>0, 'agency_pending'=>0, 'other_income'=>0, 'other_expense'=>0];
        $q = fresult("SELECT COALESCE(SUM(GREATEST(wallet,0)),0) total FROM tbl_client WHERE company_id='$company_id' AND is_deleted='1'"); if ($q && ($r=mysqli_fetch_assoc($q))) $totals['customer_outstanding']=(float)$r['total'];
        $q = fresult("SELECT COALESCE(SUM(GREATEST(v.wallet+COALESCE(p.purchases,0)-COALESCE(r.returns_total,0)-COALESCE(pm.payments,0),0)),0) total FROM tbl_vendor v LEFT JOIN (SELECT company_id,vendor_id,SUM(total_amount) purchases FROM tbl_purchase WHERE is_deleted='1' GROUP BY company_id,vendor_id) p ON p.company_id=v.company_id AND p.vendor_id=v.vendor_id LEFT JOIN (SELECT company_id,vendor_id,SUM(total_amount) returns_total FROM tbl_purchase_return WHERE is_deleted='1' GROUP BY company_id,vendor_id) r ON r.company_id=v.company_id AND r.vendor_id=v.vendor_id LEFT JOIN (SELECT company_id,vendor_id,SUM(amount) payments FROM tbl_purchase_payment WHERE is_deleted='1' GROUP BY company_id,vendor_id) pm ON pm.company_id=v.company_id AND pm.vendor_id=v.vendor_id WHERE v.company_id='$company_id' AND v.is_deleted='1'");
        if ($q && ($r=mysqli_fetch_assoc($q))) $totals['vendor_outstanding']=(float)$r['total'];
        $q = fresult("SELECT COALESCE(SUM(GREATEST(wallet,0)),0) total FROM tbl_agency WHERE company_id='$company_id' AND is_deleted='1'"); if ($q && ($r=mysqli_fetch_assoc($q))) $totals['agency_pending']=(float)$r['total'];
        $q = fresult("SELECT COALESCE(SUM(CASE WHEN transaction_type=4 THEN transaction_amount ELSE 0 END),0) income,COALESCE(SUM(CASE WHEN transaction_type=3 THEN transaction_amount ELSE 0 END),0) expense FROM tbl_transaction WHERE company_id='$company_id' AND is_deleted='1' AND transaction_type IN (3,4) AND transaction_date BETWEEN '$from' AND '$to'");
        if ($q && ($r=mysqli_fetch_assoc($q))) { $totals['other_income']=(float)$r['income']; $totals['other_expense']=(float)$r['expense']; }
        $response = financeSuccess('Finance dashboard fetched', ['data'=>['counts'=>$counts,'totals'=>$totals,'customers'=>$customerRows,'vendors'=>$vendorRows,'agencies'=>$agencyRows,'monthly'=>$monthly,'expense_categories'=>$categoryRows]]);
        break;

    default:
        $response = financeFail('Unsupported request type');
}

echo json_encode($response);
mysqli_close($sql);
?>

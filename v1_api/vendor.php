<?php
// Vendor CRUD and payable balance API for the current tbl_vendor schema.
require_once 'dbconnection.php';

if (!headers_sent()) header('Content-Type: application/json; charset=utf-8');
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) $data = $_POST;
$type = isset($data['type']) ? intval($data['type']) : 0;
$company_id = mysqli_real_escape_string($sql, trim((string)($data['company_id'] ?? '')));
$vendor_id = intval($data['vendor_id'] ?? 0);
$response = ['status' => 'error', 'message' => 'Invalid request'];
$esc = function ($value) use ($sql) { return mysqli_real_escape_string($sql, trim((string)$value)); };

switch ($type) {
    case 1:
    case 2:
        if ($company_id === '') { $response = ['status' => 'error', 'message' => 'Company ID is required']; break; }
        if ($type === 2 && $vendor_id <= 0) { $response = ['status' => 'error', 'message' => 'Vendor ID is required']; break; }
        $vendor_name = $esc($data['vendor_name'] ?? '');
        if ($vendor_name === '') { $response = ['status' => 'error', 'message' => 'Vendor name is required']; break; }
        $firm_name = $esc($data['firm_name'] ?? '');
        $phone = $esc($data['phone'] ?? '');
        $whatsapp_number = $esc($data['whatsapp_number'] ?? '');
        $email = $esc($data['email'] ?? '');
        $address = $esc($data['address'] ?? '');
        $state_id = $esc($data['state_id'] ?? '');
        $city_id = $esc($data['city_id'] ?? '');
        $area_id = $esc($data['area_id'] ?? '');
        $gst_number = $esc(strtoupper((string)($data['gst_number'] ?? '')));
        $wallet = max(0, floatval($data['wallet'] ?? 0));
        $status = $esc($data['status'] ?? 'Active');
        if ($type === 1) {
            $q = "INSERT INTO tbl_vendor (company_id,vendor_name,firm_name,phone,whatsapp_number,email,address,state_id,city_id,area_id,gst_number,wallet,status,is_deleted,c_date)
                  VALUES ('$company_id','$vendor_name','$firm_name','$phone','$whatsapp_number','$email','$address','$state_id','$city_id','$area_id','$gst_number','$wallet','$status','1','$c_date')";
        } else {
            $q = "UPDATE tbl_vendor SET vendor_name='$vendor_name',firm_name='$firm_name',phone='$phone',whatsapp_number='$whatsapp_number',email='$email',address='$address',state_id='$state_id',city_id='$city_id',area_id='$area_id',gst_number='$gst_number',status='$status'
                  WHERE vendor_id='$vendor_id' AND company_id='$company_id' AND is_deleted='1'";
        }
        if (mysqli_query($sql, $q)) {
            $response = ['status' => 'success', 'message' => $type === 1 ? 'Vendor added successfully' : 'Vendor updated successfully'];
            if ($type === 1) $response['vendor_id'] = mysqli_insert_id($sql);
        } else $response = ['status' => 'error', 'message' => 'Could not save vendor'];
        break;

    case 3:
        if ($company_id === '') { $response = ['status' => 'error', 'message' => 'Company ID is required']; break; }
        $q = "SELECT v.company_id,v.vendor_id,v.vendor_name,v.firm_name,v.phone,v.whatsapp_number,v.email,v.address,v.state_id,v.city_id,v.area_id,v.gst_number,v.wallet,v.status,v.is_deleted,v.c_date,
                     v.wallet + COALESCE(p.purchases,0) - COALESCE(r.returns_total,0) - COALESCE(pm.payments,0) AS outstanding_balance
              FROM tbl_vendor v
              LEFT JOIN (SELECT company_id,vendor_id,SUM(total_amount) purchases FROM tbl_purchase WHERE is_deleted='1' GROUP BY company_id,vendor_id) p ON p.company_id=v.company_id AND p.vendor_id=v.vendor_id
              LEFT JOIN (SELECT company_id,vendor_id,SUM(total_amount) returns_total FROM tbl_purchase_return WHERE is_deleted='1' GROUP BY company_id,vendor_id) r ON r.company_id=v.company_id AND r.vendor_id=v.vendor_id
              LEFT JOIN (SELECT company_id,vendor_id,SUM(amount) payments FROM tbl_purchase_payment WHERE is_deleted='1' GROUP BY company_id,vendor_id) pm ON pm.company_id=v.company_id AND pm.vendor_id=v.vendor_id
              WHERE v.company_id='$company_id' AND v.is_deleted='1' ORDER BY v.vendor_name ASC";
        $result = mysqli_query($sql, $q);
        if (!$result) { $response = ['status' => 'error', 'message' => 'Could not fetch vendors']; break; }
        $vendors = [];
        while ($row = mysqli_fetch_assoc($result)) $vendors[] = $row;
        $response = ['status' => 'success', 'message' => 'Vendors fetched successfully', 'data' => $vendors, 'total' => count($vendors)];
        break;

    case 4:
        if ($company_id === '' || $vendor_id <= 0) { $response = ['status' => 'error', 'message' => 'Company ID and vendor ID are required']; break; }
        if (mysqli_query($sql, "UPDATE tbl_vendor SET is_deleted='0' WHERE company_id='$company_id' AND vendor_id='$vendor_id' AND is_deleted='1'"))
            $response = ['status' => 'success', 'message' => 'Vendor archived successfully'];
        else $response = ['status' => 'error', 'message' => 'Could not archive vendor'];
        break;

    case 5:
        if ($company_id === '' || $vendor_id <= 0) { $response = ['status' => 'error', 'message' => 'Company ID and vendor ID are required']; break; }
        $vendorResult = mysqli_query($sql, "SELECT vendor_id,vendor_name,wallet,c_date FROM tbl_vendor WHERE company_id='$company_id' AND vendor_id='$vendor_id' AND is_deleted='1' LIMIT 1");
        if (!$vendorResult || !($vendor = mysqli_fetch_assoc($vendorResult))) { $response = ['status' => 'error', 'message' => 'Vendor not found']; break; }
        $ledgerQuery = "SELECT transaction_date,transaction_id,transaction_type,reference,remark,credit,debit FROM (
            SELECT DATE(v.c_date) transaction_date,CONCAT('OPEN-',v.vendor_id) transaction_id,'Opening Balance' transaction_type,'Opening balance' reference,'Opening vendor wallet balance' remark,CAST(v.wallet AS DECIMAL(14,2)) credit,CAST(0 AS DECIMAL(14,2)) debit,0 sort_order FROM tbl_vendor v WHERE v.company_id='$company_id' AND v.vendor_id='$vendor_id' AND v.is_deleted='1'
            UNION ALL
            SELECT p.purchase_date, p.purchase_number, 'Purchase', COALESCE(p.invoice_number,''), COALESCE(p.remark,''), p.total_amount, 0, 1 FROM tbl_purchase p WHERE p.company_id='$company_id' AND p.vendor_id='$vendor_id' AND p.is_deleted='1'
            UNION ALL
            SELECT r.return_date, r.return_number, 'Purchase Return', p.purchase_number, COALESCE(r.remark,''), 0, r.total_amount, 2 FROM tbl_purchase_return r LEFT JOIN tbl_purchase p ON p.purchase_id=r.purchase_id AND p.company_id=r.company_id WHERE r.company_id='$company_id' AND r.vendor_id='$vendor_id' AND r.is_deleted='1'
            UNION ALL
            SELECT pm.payment_date, pm.payment_number, 'Payment', p.purchase_number, COALESCE(pm.remark,''), 0, pm.amount, 3 FROM tbl_purchase_payment pm LEFT JOIN tbl_purchase p ON p.purchase_id=pm.purchase_id AND p.company_id=pm.company_id WHERE pm.company_id='$company_id' AND pm.vendor_id='$vendor_id' AND pm.is_deleted='1'
        ) ledger_rows ORDER BY transaction_date ASC,sort_order ASC,transaction_id ASC";
        $result = mysqli_query($sql, $ledgerQuery);
        if (!$result) { $response = ['status' => 'error', 'message' => 'Could not fetch vendor transactions']; break; }
        $entries = []; $balance = 0; $totalDebit = 0; $totalCredit = 0;
        while ($row = mysqli_fetch_assoc($result)) {
            $debit = (float)$row['debit']; $credit = (float)$row['credit'];
            $totalDebit += $debit; $totalCredit += $credit; $balance += $credit - $debit;
            $row['debit'] = $debit; $row['credit'] = $credit; $row['balance'] = round($balance, 2);
            $entries[] = $row;
        }
        $response = ['status' => 'success', 'message' => 'Vendor transactions fetched successfully', 'vendor' => ['vendor_id' => $vendor['vendor_id'], 'vendor_name' => $vendor['vendor_name']], 'data' => $entries, 'totals' => ['debit' => round($totalDebit, 2), 'credit' => round($totalCredit, 2), 'balance' => round($balance, 2)]];
        break;

    default:
        $response = ['status' => 'error', 'message' => 'Unsupported request type'];
}

echo json_encode($response);
mysqli_close($sql);
?>

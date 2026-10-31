<?php
// Vendor purchasing, stock receipts, returns, supplier payments and due reminders.
require_once 'dbconnection.php';
if (!headers_sent()) header('Content-Type: application/json; charset=utf-8');
$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) $data = $_POST;
$type = intval($data['type'] ?? 0);
$company_id = mysqli_real_escape_string($sql, trim((string)($data['company_id'] ?? '')));
$response = ['status' => 'error', 'message' => 'Invalid request'];

function pstr($value) { global $sql; return mysqli_real_escape_string($sql, trim((string)$value)); }
function pstock($company_id, $item_type, $item_id, $delta, $history = null) {
    global $sql, $c_date;
    $item_id = pstr($item_id);
    $kind = $item_type === 'raw_material' ? 'raw_material' : 'product';
    $table = $kind === 'raw_material' ? 'tbl_raw_material' : 'tbl_product';
    $key = $kind === 'raw_material' ? 'rm_id' : 'product_id';
    $q = mysqli_query($sql, "SELECT current_stock FROM `$table` WHERE company_id='$company_id' AND `$key`='$item_id' AND is_deleted='1' LIMIT 1 FOR UPDATE");
    $record = $q ? mysqli_fetch_assoc($q) : null;
    if (!$record) return false;
    $old_stock = round(floatval($record['current_stock']), 3);
    $new_stock = round($old_stock + floatval($delta), 3);
    if ($new_stock < -0.0001) return false;
    $q = "INSERT INTO tbl_purchase_stock (company_id,item_type,item_id,stock_qty,updated_at)
          VALUES ('$company_id','$kind','$item_id'," . max(0, $delta) . ",'$c_date')
          ON DUPLICATE KEY UPDATE stock_qty=stock_qty+($delta),updated_at='$c_date'";
    if (!mysqli_query($sql, $q)) return false;
    $stock_update = mysqli_query($sql, "UPDATE `$table` SET current_stock='$new_stock' WHERE company_id='$company_id' AND `$key`='$item_id' AND is_deleted='1'");
    if (!$stock_update) return false;

    if (is_array($history) && abs(floatval($delta)) > 0.0001) {
        $history_date = pstr($history['date'] ?? date('Y-m-d'));
        $history_remark = pstr($history['remark'] ?? 'Purchase stock updated');
        $added_by = pstr($history['added_by'] ?? '');
        $purchase_id = intval($history['purchase_id'] ?? 0);
        if ($kind === 'raw_material') {
            $history_sql = "INSERT INTO tbl_raw_matiral_stock_trasnction (company_id,raw_matirial_id,`date`,remark,current_stock,changes_stock,new_stock,added_by,purchase_id,is_deleted,c_date)
                            VALUES ('$company_id','$item_id','$history_date','$history_remark','$old_stock','$delta','$new_stock'," . ($added_by === '' ? 'NULL' : "'$added_by'") . "," . ($purchase_id > 0 ? "'$purchase_id'" : 'NULL') . ",'1','$c_date')";
        } else {
            $history_sql = "INSERT INTO tbl_product_stock_transaciton (company_id,product_id,`date`,remark,current_stock,changes_stock,new_stock,added_by,purchase_id,is_deleted,c_date)
                            VALUES ('$company_id','$item_id','$history_date','$history_remark','$old_stock','$delta','$new_stock'," . ($added_by === '' ? 'NULL' : "'$added_by'") . "," . ($purchase_id > 0 ? "'$purchase_id'" : 'NULL') . ",'1','$c_date')";
        }
        if (!mysqli_query($sql, $history_sql)) return false;
    }
    return true;
}
function pitem($company_id, $item_type, $item_id) {
    global $sql;
    $item_id = pstr($item_id);
    if ($item_type === 'raw_material') {
        $q = "SELECT r.rm_id AS item_id,r.rm_name AS item_name,u.unit_name
              FROM tbl_raw_material r LEFT JOIN tbl_unit u ON u.unit_id=r.unit_id
              WHERE r.company_id='$company_id' AND r.rm_id='$item_id' AND r.is_deleted='1' LIMIT 1";
    } else {
        $q = "SELECT p.product_id AS item_id,p.product_name AS item_name,u.unit_name
              FROM tbl_product p LEFT JOIN tbl_unit u ON u.unit_id=p.dimension_unit_id
              WHERE p.company_id='$company_id' AND p.product_id='$item_id' AND p.is_deleted='1' LIMIT 1";
    }
    $result = mysqli_query($sql, $q);
    return $result ? mysqli_fetch_assoc($result) : null;
}
function pnumber($prefix, $id) { return $prefix . date('Y') . '-' . str_pad((string)$id, 6, '0', STR_PAD_LEFT); }

if ($company_id === '') {
    $response = ['status' => 'error', 'message' => 'Company ID is required'];
} else switch ($type) {
    case 1: // Create purchase and receive stock.
        $vendor_id = intval($data['vendor_id'] ?? 0);
        $purchase_order_id = intval($data['purchase_order_id'] ?? 0);
        $purchase_date = pstr($data['purchase_date'] ?? $date);
        $due_date = pstr($data['due_date'] ?? '');
        $invoice_number = pstr($data['invoice_number'] ?? '');
        $remark = pstr($data['remark'] ?? '');
        $discount = max(0, floatval($data['discount_amount'] ?? 0));
        $items = $data['items'] ?? [];
        if ($vendor_id <= 0 || !is_array($items) || count($items) === 0) { $response = ['status'=>'error','message'=>'Select a vendor and add at least one purchase item']; break; }
        $vq = mysqli_query($sql, "SELECT vendor_id FROM tbl_vendor WHERE company_id='$company_id' AND vendor_id='$vendor_id' AND is_deleted='1' AND status='Active' LIMIT 1");
        if (!$vq || mysqli_num_rows($vq) === 0) { $response = ['status'=>'error','message'=>'Vendor not found or inactive']; break; }
        if ($purchase_order_id > 0) {
            $poq = mysqli_query($sql, "SELECT purchase_order_id,vendor_id,status FROM tbl_purchase_order WHERE company_id='$company_id' AND purchase_order_id='$purchase_order_id' AND is_deleted='1' LIMIT 1");
            $po = $poq ? mysqli_fetch_assoc($poq) : null;
            $existing_receipt = mysqli_query($sql, "SELECT purchase_id FROM tbl_purchase WHERE company_id='$company_id' AND purchase_order_id='$purchase_order_id' AND is_deleted='1' LIMIT 1");
            if (!$po || intval($po['vendor_id']) !== $vendor_id || !in_array($po['status'], ['Pending','Approved','Received','Ordered'], true) || ($existing_receipt && mysqli_num_rows($existing_receipt) > 0)) { $response = ['status'=>'error','message'=>'The selected purchase order is invalid, cancelled, or already received']; break; }
        }
        $validated = []; $subtotal = 0; $gst_total = 0;
        foreach ($items as $item) {
            $kind = ($item['item_type'] ?? '') === 'raw_material' ? 'raw_material' : 'product';
            $record = pitem($company_id, $kind, $item['item_id'] ?? '');
            $qty = floatval($item['quantity'] ?? 0); $price = floatval($item['unit_price'] ?? 0); $gst = max(0, min(100, floatval($item['gst_percent'] ?? 0)));
            if (!$record || $qty <= 0 || $price < 0) { $validated = []; break; }
            $base = round($qty * $price, 2); $tax = round($base * $gst / 100, 2);
            $validated[] = ['kind'=>$kind,'id'=>$record['item_id'],'name'=>$record['item_name'],'unit'=>$record['unit_name'] ?? '', 'qty'=>$qty,'price'=>$price,'gst'=>$gst,'tax'=>$tax,'line'=>round($base+$tax,2)];
            $subtotal += $base; $gst_total += $tax;
        }
        if (!$validated) { $response = ['status'=>'error','message'=>'One or more purchase items are invalid']; break; }
        $discount = min($discount, $subtotal); $total = round($subtotal - $discount + $gst_total, 2);
        mysqli_begin_transaction($sql);
        $po_receive_ok = true;
        if ($purchase_order_id > 0) {
            $po_receive_ok = mysqli_query($sql, "UPDATE tbl_purchase_order SET status='Received',updated_at='$c_date' WHERE company_id='$company_id' AND purchase_order_id='$purchase_order_id' AND is_deleted='1' AND status IN ('Pending','Approved','Received','Ordered')");
            $receipt_check = mysqli_query($sql, "SELECT purchase_id FROM tbl_purchase WHERE company_id='$company_id' AND purchase_order_id='$purchase_order_id' AND is_deleted='1' LIMIT 1 FOR UPDATE");
            if (!$receipt_check || mysqli_num_rows($receipt_check) > 0) $po_receive_ok = false;
        }
        if (!$po_receive_ok) { mysqli_rollback($sql); $response = ['status'=>'error','message'=>'This purchase order has already been received or cancelled']; break; }
        $po_sql = $purchase_order_id > 0 ? "'$purchase_order_id'" : 'NULL';
        $q = "INSERT INTO tbl_purchase (company_id,purchase_number,vendor_id,purchase_order_id,invoice_number,purchase_date,due_date,subtotal,discount_amount,gst_amount,total_amount,remark,is_deleted,c_date)
              VALUES ('$company_id','TEMP-0','$vendor_id',$po_sql,'$invoice_number','$purchase_date'," . ($due_date === '' ? 'NULL' : "'$due_date'") . ",'$subtotal','$discount','$gst_total','$total','$remark','1','$c_date')";
        $ok = mysqli_query($sql, $q); $purchase_id = $ok ? mysqli_insert_id($sql) : 0;
        if ($ok) $ok = mysqli_query($sql, "UPDATE tbl_purchase SET purchase_number='" . pnumber('PUR-', $purchase_id) . "' WHERE purchase_id='$purchase_id' AND company_id='$company_id'");
        foreach ($validated as $line) {
            if (!$ok) break;
            $ok = mysqli_query($sql, "INSERT INTO tbl_purchase_item (company_id,purchase_id,item_type,item_id,item_name,unit_name,quantity,unit_price,gst_percent,gst_amount,line_total,is_deleted,c_date)
                VALUES ('$company_id','$purchase_id','{$line['kind']}','{$line['id']}','" . pstr($line['name']) . "','" . pstr($line['unit']) . "','{$line['qty']}','{$line['price']}','{$line['gst']}','{$line['tax']}','{$line['line']}','1','$c_date')");
            if ($ok) $ok = pstock($company_id, $line['kind'], $line['id'], $line['qty'], [
                'date' => $data['purchase_date'] ?? $date,
                'remark' => !empty($data['remark']) ? $data['remark'] : 'Purchase received ' . pnumber('PUR-', $purchase_id),
                'added_by' => $data['emp_id'] ?? '',
                'purchase_id' => $purchase_id,
            ]);
        }
        if ($ok) { mysqli_commit($sql); $response = ['status'=>'success','message'=>'Purchase saved and stock updated','purchase_id'=>$purchase_id,'purchase_number'=>pnumber('PUR-',$purchase_id),'total_amount'=>$total]; }
        else { mysqli_rollback($sql); $response = ['status'=>'error','message'=>'Purchase could not be saved; no stock was changed']; }
        break;

    case 2: // Purchase list.
        $q = "SELECT p.*,v.vendor_name,v.phone AS vendor_phone,
              COALESCE(ret.returned,0) AS returned_amount,COALESCE(pay.paid,0) AS paid_amount,
              GREATEST(0,p.total_amount-COALESCE(ret.returned,0)-COALESCE(pay.paid,0)) AS outstanding_amount
              FROM tbl_purchase p JOIN tbl_vendor v ON v.vendor_id=p.vendor_id AND v.company_id=p.company_id
              LEFT JOIN (SELECT company_id,purchase_id,SUM(total_amount) returned FROM tbl_purchase_return WHERE is_deleted='1' GROUP BY company_id,purchase_id) ret ON ret.company_id=p.company_id AND ret.purchase_id=p.purchase_id
              LEFT JOIN (SELECT company_id,purchase_id,SUM(amount) paid FROM tbl_purchase_payment WHERE is_deleted='1' GROUP BY company_id,purchase_id) pay ON pay.company_id=p.company_id AND pay.purchase_id=p.purchase_id
              WHERE p.company_id='$company_id' AND p.is_deleted='1' ORDER BY p.purchase_date DESC,p.purchase_id DESC";
        $result = mysqli_query($sql,$q); $rows=[];
        if ($result) { while($row=mysqli_fetch_assoc($result)) $rows[]=$row; $response=['status'=>'success','message'=>'Purchases fetched','data'=>$rows,'total'=>count($rows)]; }
        else $response=['status'=>'error','message'=>'Could not fetch purchases'];
        break;

    case 3: // Purchase details and quantities already returned.
        $purchase_id = intval($data['purchase_id'] ?? 0);
        $q = mysqli_query($sql,"SELECT p.*,v.vendor_name FROM tbl_purchase p JOIN tbl_vendor v ON v.vendor_id=p.vendor_id AND v.company_id=p.company_id WHERE p.company_id='$company_id' AND p.purchase_id='$purchase_id' AND p.is_deleted='1' LIMIT 1");
        if (!$q || mysqli_num_rows($q)===0) { $response=['status'=>'error','message'=>'Purchase not found']; break; }
        $purchase=mysqli_fetch_assoc($q); $items=[];
        $ir=mysqli_query($sql,"SELECT i.*,COALESCE(r.returned_qty,0) AS returned_qty,GREATEST(0,i.quantity-COALESCE(r.returned_qty,0)) AS returnable_qty FROM tbl_purchase_item i LEFT JOIN (SELECT company_id,purchase_item_id,SUM(quantity) returned_qty FROM tbl_purchase_return_item WHERE is_deleted='1' GROUP BY company_id,purchase_item_id) r ON r.company_id=i.company_id AND r.purchase_item_id=i.purchase_item_id WHERE i.company_id='$company_id' AND i.purchase_id='$purchase_id' AND i.is_deleted='1' ORDER BY i.purchase_item_id");
        if ($ir) while($row=mysqli_fetch_assoc($ir)) $items[]=$row;
        $purchase['items']=$items; $response=['status'=>'success','message'=>'Purchase details fetched','data'=>$purchase];
        break;

    case 4: // Returns list.
        $q=mysqli_query($sql,"SELECT r.*,p.purchase_number,v.vendor_name FROM tbl_purchase_return r JOIN tbl_purchase p ON p.purchase_id=r.purchase_id AND p.company_id=r.company_id JOIN tbl_vendor v ON v.vendor_id=r.vendor_id AND v.company_id=r.company_id WHERE r.company_id='$company_id' AND r.is_deleted='1' ORDER BY r.return_date DESC,r.return_id DESC"); $rows=[];
        if ($q) { while($row=mysqli_fetch_assoc($q)) $rows[]=$row; $response=['status'=>'success','message'=>'Returns fetched','data'=>$rows,'total'=>count($rows)]; }
        else $response=['status'=>'error','message'=>'Could not fetch returns'];
        break;

    case 5: // Create a purchase return, constrain to not-yet-returned and in-stock quantity.
        $purchase_id=intval($data['purchase_id'] ?? 0); $return_date=pstr($data['return_date'] ?? $date); $remark=pstr($data['remark'] ?? ''); $items=$data['items'] ?? [];
        $pq=mysqli_query($sql,"SELECT vendor_id FROM tbl_purchase WHERE company_id='$company_id' AND purchase_id='$purchase_id' AND is_deleted='1' LIMIT 1");
        if (!$pq || mysqli_num_rows($pq)===0 || !is_array($items) || count($items)===0) { $response=['status'=>'error','message'=>'Select a valid purchase and return item']; break; }
        $purchase=mysqli_fetch_assoc($pq); $vendor_id=intval($purchase['vendor_id']); $lines=[]; $total=0;
        foreach($items as $item) {
            $pi=intval($item['purchase_item_id'] ?? 0); $qty=floatval($item['quantity'] ?? 0);
            $ir=mysqli_query($sql,"SELECT * FROM tbl_purchase_item WHERE company_id='$company_id' AND purchase_id='$purchase_id' AND purchase_item_id='$pi' AND is_deleted='1' LIMIT 1");
            $line=$ir ? mysqli_fetch_assoc($ir) : null;
            if (!$line || $qty<=0) { $lines=[]; break; }
            $rr=mysqli_query($sql,"SELECT COALESCE(SUM(quantity),0) qty FROM tbl_purchase_return_item WHERE company_id='$company_id' AND purchase_item_id='$pi' AND is_deleted='1'"); $returned=$rr ? floatval(mysqli_fetch_assoc($rr)['qty']) : 0;
            if ($qty > floatval($line['quantity'])-$returned+0.0001) { $lines=[]; break; }
            $lt=round($qty*floatval($line['unit_price'])*(1+floatval($line['gst_percent'])/100),2);
            $lines[]=['source'=>$line,'qty'=>$qty,'total'=>$lt]; $total+=$lt;
        }
        if (!$lines) { $response=['status'=>'error','message'=>'Return quantity exceeds the remaining purchased quantity']; break; }
        mysqli_begin_transaction($sql);
        $ok=mysqli_query($sql,"INSERT INTO tbl_purchase_return (company_id,return_number,purchase_id,vendor_id,return_date,total_amount,remark,is_deleted,c_date) VALUES ('$company_id','TEMP-0','$purchase_id','$vendor_id','$return_date','$total','$remark','1','$c_date')");
        $return_id=$ok ? mysqli_insert_id($sql) : 0;
        if($ok) $ok=mysqli_query($sql,"UPDATE tbl_purchase_return SET return_number='".pnumber('PRET-',$return_id)."' WHERE return_id='$return_id' AND company_id='$company_id'");
        foreach($lines as $line) {
            if(!$ok) break; $src=$line['source'];
            $ok=mysqli_query($sql,"INSERT INTO tbl_purchase_return_item (company_id,return_id,purchase_id,purchase_item_id,item_type,item_id,item_name,quantity,unit_price,gst_percent,line_total,is_deleted,c_date) VALUES ('$company_id','$return_id','$purchase_id','{$src['purchase_item_id']}','{$src['item_type']}','{$src['item_id']}','".pstr($src['item_name'])."','{$line['qty']}','{$src['unit_price']}','{$src['gst_percent']}','{$line['total']}','1','$c_date')");
            if($ok) $ok=pstock($company_id,$src['item_type'],$src['item_id'],-$line['qty']);
        }
        if($ok) { mysqli_commit($sql); $response=['status'=>'success','message'=>'Purchase return saved and stock adjusted','return_id'=>$return_id,'return_number'=>pnumber('PRET-',$return_id)]; }
        else { mysqli_rollback($sql); $response=['status'=>'error','message'=>'Return could not be saved; stock was not changed. Check available stock.']; }
        break;

    case 6: // Payments list.
        $q=mysqli_query($sql,"SELECT pm.*,p.purchase_number,v.vendor_name FROM tbl_purchase_payment pm JOIN tbl_purchase p ON p.purchase_id=pm.purchase_id AND p.company_id=pm.company_id JOIN tbl_vendor v ON v.vendor_id=pm.vendor_id AND v.company_id=pm.company_id WHERE pm.company_id='$company_id' AND pm.is_deleted='1' ORDER BY pm.payment_date DESC,pm.payment_id DESC"); $rows=[];
        if($q) { while($row=mysqli_fetch_assoc($q)) $rows[]=$row; $response=['status'=>'success','message'=>'Payments fetched','data'=>$rows,'total'=>count($rows)]; }
        else $response=['status'=>'error','message'=>'Could not fetch payments'];
        break;

    case 7: // Create payment against an outstanding purchase.
        $purchase_id=intval($data['purchase_id'] ?? 0); $amount=round(floatval($data['amount'] ?? 0),2); $payment_date=pstr($data['payment_date'] ?? $date);
        $method=pstr($data['payment_method'] ?? 'Bank Transfer'); $reference=pstr($data['reference_number'] ?? ''); $remark=pstr($data['remark'] ?? '');
        if($purchase_id<=0 || $amount<=0) { $response=['status'=>'error','message'=>'Select a purchase and enter a payment amount']; break; }
        $q=mysqli_query($sql,"SELECT p.vendor_id,p.total_amount-COALESCE(r.returns_total,0)-COALESCE(pm.paid_total,0) outstanding FROM tbl_purchase p LEFT JOIN (SELECT company_id,purchase_id,SUM(total_amount) returns_total FROM tbl_purchase_return WHERE is_deleted='1' GROUP BY company_id,purchase_id) r ON r.company_id=p.company_id AND r.purchase_id=p.purchase_id LEFT JOIN (SELECT company_id,purchase_id,SUM(amount) paid_total FROM tbl_purchase_payment WHERE is_deleted='1' GROUP BY company_id,purchase_id) pm ON pm.company_id=p.company_id AND pm.purchase_id=p.purchase_id WHERE p.company_id='$company_id' AND p.purchase_id='$purchase_id' AND p.is_deleted='1' LIMIT 1");
        $purchase=$q ? mysqli_fetch_assoc($q) : null;
        if(!$purchase || $amount>floatval($purchase['outstanding'])+0.0001) { $response=['status'=>'error','message'=>'Payment exceeds the purchase outstanding balance']; break; }
        $vendor_id=intval($purchase['vendor_id']);
        $ok=mysqli_query($sql,"INSERT INTO tbl_purchase_payment (company_id,payment_number,purchase_id,vendor_id,payment_date,amount,payment_method,reference_number,remark,is_deleted,c_date) VALUES ('$company_id','TEMP-0','$purchase_id','$vendor_id','$payment_date','$amount','$method','$reference','$remark','1','$c_date')");
        if($ok) { $payment_id=mysqli_insert_id($sql); mysqli_query($sql,"UPDATE tbl_purchase_payment SET payment_number='".pnumber('VPAY-',$payment_id)."' WHERE payment_id='$payment_id' AND company_id='$company_id'"); $response=['status'=>'success','message'=>'Payment recorded successfully','payment_id'=>$payment_id,'payment_number'=>pnumber('VPAY-',$payment_id)]; }
        else $response=['status'=>'error','message'=>'Could not record payment'];
        break;

    case 10: // Edit a vendor payment; vendor ledger balances are recalculated from this row.
        $payment_id=intval($data['payment_id'] ?? 0); $amount=round(floatval($data['amount'] ?? 0),2); $payment_date=pstr($data['payment_date'] ?? $date);
        $method=pstr($data['payment_method'] ?? 'Bank Transfer'); $reference=pstr($data['reference_number'] ?? ''); $remark=pstr($data['remark'] ?? '');
        if($payment_id<=0 || $amount<=0) { $response=['status'=>'error','message'=>'Payment ID and a positive amount are required']; break; }
        $currentQ=mysqli_query($sql,"SELECT purchase_id FROM tbl_purchase_payment WHERE company_id='$company_id' AND payment_id='$payment_id' AND is_deleted='1' LIMIT 1");
        $current=$currentQ ? mysqli_fetch_assoc($currentQ) : null;
        if(!$current) { $response=['status'=>'error','message'=>'Vendor payment not found']; break; }
        $purchase_id=intval($current['purchase_id']);
        $q=mysqli_query($sql,"SELECT p.vendor_id,p.total_amount-COALESCE(r.returns_total,0)-COALESCE(pm.paid_total,0) outstanding FROM tbl_purchase p LEFT JOIN (SELECT company_id,purchase_id,SUM(total_amount) returns_total FROM tbl_purchase_return WHERE is_deleted='1' GROUP BY company_id,purchase_id) r ON r.company_id=p.company_id AND r.purchase_id=p.purchase_id LEFT JOIN (SELECT company_id,purchase_id,SUM(amount) paid_total FROM tbl_purchase_payment WHERE is_deleted='1' AND payment_id<>'$payment_id' GROUP BY company_id,purchase_id) pm ON pm.company_id=p.company_id AND pm.purchase_id=p.purchase_id WHERE p.company_id='$company_id' AND p.purchase_id='$purchase_id' AND p.is_deleted='1' LIMIT 1");
        $purchase=$q ? mysqli_fetch_assoc($q) : null;
        if(!$purchase || $amount>floatval($purchase['outstanding'])+0.0001) { $response=['status'=>'error','message'=>'Payment exceeds the remaining purchase balance']; break; }
        $ok=mysqli_query($sql,"UPDATE tbl_purchase_payment SET payment_date='$payment_date',amount='$amount',payment_method='$method',reference_number='$reference',remark='$remark' WHERE company_id='$company_id' AND payment_id='$payment_id' AND is_deleted='1'");
        $response=$ok ? ['status'=>'success','message'=>'Payment updated; vendor balance and transaction history now reflect the change'] : ['status'=>'error','message'=>'Could not update vendor payment'];
        break;

    case 11: // Edit a purchase and apply only stock quantity differences.
        $purchase_id=intval($data['purchase_id'] ?? 0);
        $purchase_date=pstr($data['purchase_date'] ?? $date);
        $due_date=pstr($data['due_date'] ?? '');
        $invoice_number=pstr($data['invoice_number'] ?? '');
        $remark=pstr($data['remark'] ?? '');
        $discount=max(0,floatval($data['discount_amount'] ?? 0));
        $items=$data['items'] ?? [];
        if($purchase_id<=0 || !is_array($items) || count($items)===0) { $response=['status'=>'error','message'=>'Purchase ID and at least one item are required']; break; }
        $existingQ=mysqli_query($sql,"SELECT purchase_number FROM tbl_purchase WHERE company_id='$company_id' AND purchase_id='$purchase_id' AND is_deleted='1' LIMIT 1");
        $existingPurchase=$existingQ ? mysqli_fetch_assoc($existingQ) : null;
        if(!$existingPurchase) { $response=['status'=>'error','message'=>'Purchase not found']; break; }
        $returnQ=mysqli_query($sql,"SELECT COUNT(*) AS cnt FROM tbl_purchase_return WHERE company_id='$company_id' AND purchase_id='$purchase_id' AND is_deleted='1'");
        $returnCount=$returnQ ? intval(mysqli_fetch_assoc($returnQ)['cnt']) : 0;
        if($returnCount>0) { $response=['status'=>'error','message'=>'This purchase cannot be edited because it already has a return']; break; }
        $validated=[]; $subtotal=0; $gst_total=0;
        foreach($items as $item) {
            $kind=($item['item_type'] ?? '')==='raw_material' ? 'raw_material' : 'product';
            $record=pitem($company_id,$kind,$item['item_id'] ?? '');
            $qty=floatval($item['quantity'] ?? 0); $price=floatval($item['unit_price'] ?? 0); $gst=max(0,min(100,floatval($item['gst_percent'] ?? 0)));
            if(!$record || $qty<=0 || $price<0) { $validated=[]; break; }
            $base=round($qty*$price,2); $tax=round($base*$gst/100,2);
            $validated[]=['kind'=>$kind,'id'=>$record['item_id'],'name'=>$record['item_name'],'unit'=>$record['unit_name'] ?? '', 'qty'=>$qty,'price'=>$price,'gst'=>$gst,'tax'=>$tax,'line'=>round($base+$tax,2)];
            $subtotal+=$base; $gst_total+=$tax;
        }
        if(!$validated) { $response=['status'=>'error','message'=>'One or more purchase items are invalid']; break; }
        $discount=min($discount,$subtotal); $total=round($subtotal-$discount+$gst_total,2);
        mysqli_begin_transaction($sql);
        $lockQ=mysqli_query($sql,"SELECT purchase_number FROM tbl_purchase WHERE company_id='$company_id' AND purchase_id='$purchase_id' AND is_deleted='1' FOR UPDATE");
        $lockRow=$lockQ ? mysqli_fetch_assoc($lockQ) : null;
        $oldItemsQ=mysqli_query($sql,"SELECT item_type,item_id,quantity FROM tbl_purchase_item WHERE company_id='$company_id' AND purchase_id='$purchase_id' AND is_deleted='1' FOR UPDATE");
        $stockDeltas=[];
        if($oldItemsQ) while($old=mysqli_fetch_assoc($oldItemsQ)) {
            $key=$old['item_type'].'|'.$old['item_id'];
            if(!isset($stockDeltas[$key])) $stockDeltas[$key]=['kind'=>$old['item_type'],'id'=>$old['item_id'],'delta'=>0];
            $stockDeltas[$key]['delta']-=floatval($old['quantity']);
        }
        foreach($validated as $line) {
            $key=$line['kind'].'|'.$line['id'];
            if(!isset($stockDeltas[$key])) $stockDeltas[$key]=['kind'=>$line['kind'],'id'=>$line['id'],'delta'=>0];
            $stockDeltas[$key]['delta']+=$line['qty'];
        }
        $dueSql=$due_date===''?'NULL':"'$due_date'";
        $ok=$lockRow && $oldItemsQ && mysqli_query($sql,"UPDATE tbl_purchase SET purchase_date='$purchase_date',due_date=$dueSql,invoice_number='$invoice_number',subtotal='$subtotal',discount_amount='$discount',gst_amount='$gst_total',total_amount='$total',remark='$remark' WHERE company_id='$company_id' AND purchase_id='$purchase_id' AND is_deleted='1'");
        if($ok) $ok=mysqli_query($sql,"UPDATE tbl_purchase_item SET is_deleted='0' WHERE company_id='$company_id' AND purchase_id='$purchase_id' AND is_deleted='1'");
        foreach($validated as $line) {
            if(!$ok) break;
            $ok=mysqli_query($sql,"INSERT INTO tbl_purchase_item (company_id,purchase_id,item_type,item_id,item_name,unit_name,quantity,unit_price,gst_percent,gst_amount,line_total,is_deleted,c_date) VALUES ('$company_id','$purchase_id','{$line['kind']}','{$line['id']}','".pstr($line['name'])."','".pstr($line['unit'])."','{$line['qty']}','{$line['price']}','{$line['gst']}','{$line['tax']}','{$line['line']}','1','$c_date')");
        }
        foreach($stockDeltas as $movement) {
            if(!$ok || abs($movement['delta'])<0.0001) continue;
            $ok=pstock($company_id,$movement['kind'],$movement['id'],$movement['delta'],[
                'date'=>$data['purchase_date'] ?? $date,
                'remark'=>!empty($data['remark'])?$data['remark']:'Purchase edited '.$existingPurchase['purchase_number'],
                'added_by'=>$data['emp_id'] ?? '',
                'purchase_id'=>$purchase_id,
            ]);
        }
        if($ok) { mysqli_commit($sql); $response=['status'=>'success','message'=>'Purchase updated; stock history and vendor balance were recalculated','purchase_id'=>$purchase_id,'total_amount'=>$total]; }
        else { mysqli_rollback($sql); $response=['status'=>'error','message'=>'Purchase could not be updated; stock and purchase data were rolled back']; }
        break;

    case 9: // Overdue or due-today unpaid purchase reminders.
        $q=mysqli_query($sql,"SELECT p.purchase_id,p.purchase_number,p.purchase_date,p.due_date,p.total_amount,v.vendor_id,v.vendor_name,v.phone,v.email,
              COALESCE(r.returned,0) returned_amount,COALESCE(pm.paid,0) paid_amount,
              GREATEST(0,p.total_amount-COALESCE(r.returned,0)-COALESCE(pm.paid,0)) outstanding_amount,
              DATEDIFF('$date',p.due_date) days_overdue
              FROM tbl_purchase p JOIN tbl_vendor v ON v.vendor_id=p.vendor_id AND v.company_id=p.company_id
              LEFT JOIN (SELECT company_id,purchase_id,SUM(total_amount) returned FROM tbl_purchase_return WHERE is_deleted='1' GROUP BY company_id,purchase_id) r ON r.company_id=p.company_id AND r.purchase_id=p.purchase_id
              LEFT JOIN (SELECT company_id,purchase_id,SUM(amount) paid FROM tbl_purchase_payment WHERE is_deleted='1' GROUP BY company_id,purchase_id) pm ON pm.company_id=p.company_id AND pm.purchase_id=p.purchase_id
              WHERE p.company_id='$company_id' AND p.is_deleted='1' AND p.due_date IS NOT NULL AND p.due_date<='$date'
              HAVING outstanding_amount>0 ORDER BY p.due_date ASC,p.purchase_id ASC"); $rows=[];
        if($q) { while($row=mysqli_fetch_assoc($q)) $rows[]=$row; $response=['status'=>'success','message'=>'Payment reminders fetched','data'=>$rows,'total'=>count($rows)]; }
        else $response=['status'=>'error','message'=>'Could not fetch reminders'];
        break;

    default:
        $response=['status'=>'error','message'=>'Unsupported request type'];
}

echo json_encode($response);
mysqli_close($sql);
?>

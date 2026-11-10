<?php
// Company-scoped warehouse and deck setup API.
require_once 'dbconnection.php';
if (!headers_sent()) header('Content-Type: application/json; charset=utf-8');
$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) $data = $_POST;
$type = intval($data['type'] ?? 0);
$company_id = mysqli_real_escape_string($sql, trim((string)($data['company_id'] ?? '')));
$response = ['status' => 'error', 'message' => 'Unsupported request type'];
function stockEsc($value) { global $sql; return mysqli_real_escape_string($sql, trim((string)$value)); }
function stockQuery($query) { global $sql; try { return mysqli_query($sql, $query); } catch (Throwable $e) { error_log('Stock API query failed: ' . $e->getMessage()); return false; } }
function stockFail($message) { return ['status' => 'error', 'message' => $message]; }
function stockOk($message, $extra = []) { return array_merge(['status' => 'success', 'message' => $message], $extra); }
function stockItem($company_id, $item_type, $item_id) {
    global $sql;
    $kind = $item_type === 'raw_material' ? 'raw_material' : 'product';
    $id = stockEsc($item_id);
    $query = $kind === 'product'
        ? "SELECT product_id item_id,product_name item_name,current_stock FROM tbl_product WHERE company_id='$company_id' AND product_id='$id' AND is_deleted='1' LIMIT 1"
        : "SELECT rm_id item_id,rm_name item_name,current_stock FROM tbl_raw_material WHERE company_id='$company_id' AND rm_id='$id' AND is_deleted='1' LIMIT 1";
    $q = stockQuery($query); return $q ? mysqli_fetch_assoc($q) : null;
}
function stockLocation($company_id, $warehouse_id, $deck_id) {
    $warehouse_id = intval($warehouse_id); $deck_id = intval($deck_id);
    $q = stockQuery("SELECT d.deck_id,w.warehouse_id FROM tbl_warehouse_deck d JOIN tbl_warehouse w ON w.company_id=d.company_id AND w.warehouse_id=d.warehouse_id WHERE d.company_id='$company_id' AND d.warehouse_id='$warehouse_id' AND d.deck_id='$deck_id' AND d.status='Active' AND d.is_deleted='1' AND w.status='Active' AND w.is_deleted='1' LIMIT 1");
    return $q && mysqli_num_rows($q) > 0;
}
function stockBalanceLock($company_id, $item_type, $item_id, $warehouse_id, $deck_id) {
    global $sql;
    $item_id = stockEsc($item_id); $warehouse_id = intval($warehouse_id); $deck_id = intval($deck_id);
    $ok = mysqli_query($sql, "INSERT IGNORE INTO tbl_stock_balance (company_id,item_type,item_id,warehouse_id,deck_id,quantity) VALUES ('$company_id','$item_type','$item_id','$warehouse_id','$deck_id',0)");
    if (!$ok) return null;
    $q = mysqli_query($sql, "SELECT quantity FROM tbl_stock_balance WHERE company_id='$company_id' AND item_type='$item_type' AND item_id='$item_id' AND warehouse_id='$warehouse_id' AND deck_id='$deck_id' LIMIT 1 FOR UPDATE");
    return $q ? mysqli_fetch_assoc($q) : null;
}
function stockChangeLocation($company_id, $item_type, $item_id, $warehouse_id, $deck_id, $delta) {
    global $sql, $c_date;
    $row = stockBalanceLock($company_id, $item_type, $item_id, $warehouse_id, $deck_id);
    if (!$row) return false;
    $next = round(floatval($row['quantity']) + floatval($delta), 3);
    if ($next < -0.0001) return false;
    $item_id = stockEsc($item_id); $warehouse_id = intval($warehouse_id); $deck_id = intval($deck_id);
    return mysqli_query($sql, "UPDATE tbl_stock_balance SET quantity='$next',updated_at='$c_date' WHERE company_id='$company_id' AND item_type='$item_type' AND item_id='$item_id' AND warehouse_id='$warehouse_id' AND deck_id='$deck_id'");
}
function stockInsertMovement($company_id, $movement_type, $item_type, $item, $warehouse_id, $deck_id, $quantity, $before, $after, $date, $remark, $added_by, $ref = '', $transfer_group = '') {
    global $sql,$c_date;
    $vals = array_map('stockEsc', [$ref,$item['item_name'],$remark,$added_by,$transfer_group]);
    return mysqli_query($sql, "INSERT INTO tbl_stock_movement (company_id,movement_ref,movement_type,item_type,item_id,item_name,warehouse_id,deck_id,quantity,balance_before,balance_after,transfer_group,remark,added_by,movement_date,is_deleted,c_date) VALUES ('$company_id','{$vals[0]}','$movement_type','$item_type','".stockEsc($item['item_id'])."','{$vals[1]}','".intval($warehouse_id)."','".intval($deck_id)."','$quantity','$before','$after','{$vals[4]}','{$vals[2]}',".($vals[3]===''?'NULL':"'{$vals[3]}'").",'".stockEsc($date)."','1','$c_date')");
}
function stockChangeMaster($company_id, $item_type, $item, $delta, $date, $remark, $added_by, $warehouse_id, $deck_id) {
    global $sql,$c_date;
    $table=$item_type==='product'?'tbl_product':'tbl_raw_material'; $key=$item_type==='product'?'product_id':'rm_id'; $id=stockEsc($item['item_id']);
    $q=mysqli_query($sql,"SELECT current_stock FROM `$table` WHERE company_id='$company_id' AND `$key`='$id' AND is_deleted='1' LIMIT 1 FOR UPDATE"); $row=$q?mysqli_fetch_assoc($q):null; if(!$row)return false;
    $before=round(floatval($row['current_stock']),3); $after=round($before+floatval($delta),3); if($after < -0.0001)return false;
    $kind=$item_type==='product'?'product':'raw_material';
    $ok=mysqli_query($sql,"INSERT INTO tbl_purchase_stock (company_id,item_type,item_id,stock_qty,updated_at) VALUES ('$company_id','$kind','$id','$delta','$c_date') ON DUPLICATE KEY UPDATE stock_qty=GREATEST(0,stock_qty+($delta)),updated_at='$c_date'");
    if(!$ok)return false;
    $ok=mysqli_query($sql,"UPDATE `$table` SET current_stock='$after' WHERE company_id='$company_id' AND `$key`='$id' AND is_deleted='1'");
    if(!$ok)return false;
    $history_table=$kind==='product'?'tbl_product_stock_transaciton':'tbl_raw_matiral_stock_trasnction'; $history_key=$kind==='product'?'product_id':'raw_matirial_id';
    $ok=mysqli_query($sql,"INSERT INTO `$history_table` (company_id,`$history_key`,`date`,remark,current_stock,changes_stock,new_stock,added_by,is_deleted,c_date) VALUES ('$company_id','$id','".stockEsc($date)."','".stockEsc($remark)."','$before','$delta','$after',".($added_by===''?'NULL':"'".stockEsc($added_by)."'").",'1','$c_date')");
    return $ok;
}

if ($company_id === '') $response = stockFail('Company ID is required');
else switch ($type) {
    case 1:
        $q = stockQuery("SELECT w.*,s.state_name,c.city_name,a.area_name,(SELECT COUNT(*) FROM tbl_warehouse_deck d WHERE d.company_id=w.company_id AND d.warehouse_id=w.warehouse_id AND d.is_deleted='1') AS deck_count FROM tbl_warehouse w LEFT JOIN tbl_state s ON s.state_id=w.state_id AND s.company_id=w.company_id LEFT JOIN tbl_city c ON c.city_id=w.city_id AND c.company_id=w.company_id LEFT JOIN tbl_area a ON a.area_id=w.area_id AND a.company_id=w.company_id WHERE w.company_id='$company_id' AND w.is_deleted='1' ORDER BY w.warehouse_name");
        if (!$q) { $response = stockFail('Could not load warehouses'); break; }
        $rows=[]; while ($row=mysqli_fetch_assoc($q)) $rows[]=$row;
        $response=stockOk('Warehouses loaded',['data'=>$rows,'total'=>count($rows)]); break;
    case 2:
        $id=intval($data['warehouse_id']??0); $name=stockEsc($data['warehouse_name']??''); $address=stockEsc($data['address']??''); $state_id=intval($data['state_id']??0); $city_id=intval($data['city_id']??0); $area_id=intval($data['area_id']??0); $pincode=stockEsc($data['pincode']??''); $status=($data['status']??'Active')==='Inactive'?'Inactive':'Active';
        if ($name==='') { $response=stockFail('Warehouse name is required'); break; }
        if ($id>0) $ok=stockQuery("UPDATE tbl_warehouse SET warehouse_name='$name',address='$address',state_id=".($state_id?:'NULL').",city_id=".($city_id?:'NULL').",area_id=".($area_id?:'NULL').",pincode='$pincode',status='$status',updated_at='$c_date' WHERE company_id='$company_id' AND warehouse_id='$id' AND is_deleted='1'");
        else $ok=stockQuery("INSERT INTO tbl_warehouse (company_id,warehouse_name,address,state_id,city_id,area_id,pincode,status,is_deleted,c_date) VALUES ('$company_id','$name','$address',".($state_id?:'NULL').",".($city_id?:'NULL').",".($area_id?:'NULL').",'$pincode','$status','1','$c_date')");
        $response=$ok?stockOk($id?'Warehouse updated':'Warehouse added', $id?[]:['warehouse_id'=>mysqli_insert_id($sql)]):stockFail('Could not save warehouse'); break;
    case 3:
        $id=intval($data['warehouse_id']??0); if ($id<=0) { $response=stockFail('Warehouse ID is required'); break; }
        $used=stockQuery("SELECT COUNT(*) total FROM tbl_warehouse_deck WHERE company_id='$company_id' AND warehouse_id='$id' AND is_deleted='1'");
        if ($used && intval(mysqli_fetch_assoc($used)['total'])>0) { $response=stockFail('Delete or move this warehouse’s decks before deleting the warehouse'); break; }
        $ok=stockQuery("UPDATE tbl_warehouse SET is_deleted='0',updated_at='$c_date' WHERE company_id='$company_id' AND warehouse_id='$id' AND is_deleted='1'");
        $response=$ok?stockOk('Warehouse deleted'):stockFail('Could not delete warehouse'); break;
    case 4:
        $warehouse_id=intval($data['warehouse_id']??0); if ($warehouse_id<=0) { $response=stockFail('Warehouse ID is required'); break; }
        $q=stockQuery("SELECT deck_id,company_id,warehouse_id,deck_name,deck_code,status,c_date FROM tbl_warehouse_deck WHERE company_id='$company_id' AND warehouse_id='$warehouse_id' AND is_deleted='1' ORDER BY deck_name");
        if (!$q) { $response=stockFail('Could not load decks'); break; }
        $rows=[]; while($row=mysqli_fetch_assoc($q)) $rows[]=$row;
        $response=stockOk('Decks loaded',['data'=>$rows,'total'=>count($rows)]); break;
    case 5:
        $id=intval($data['deck_id']??0); $warehouse_id=intval($data['warehouse_id']??0); $name=stockEsc($data['deck_name']??''); $deck_code=stockEsc($data['deck_code']??''); $status=($data['status']??'Active')==='Inactive'?'Inactive':'Active';
        if ($warehouse_id<=0 || $name==='') { $response=stockFail('Warehouse and deck name are required'); break; }
        $parent=stockQuery("SELECT warehouse_id FROM tbl_warehouse WHERE company_id='$company_id' AND warehouse_id='$warehouse_id' AND is_deleted='1' LIMIT 1");
        if (!$parent || mysqli_num_rows($parent)===0) { $response=stockFail('Selected warehouse is not available'); break; }
        if ($id>0) $ok=stockQuery("UPDATE tbl_warehouse_deck SET deck_name='$name',deck_code='$deck_code',status='$status',updated_at='$c_date' WHERE company_id='$company_id' AND warehouse_id='$warehouse_id' AND deck_id='$id' AND is_deleted='1'");
        else $ok=stockQuery("INSERT INTO tbl_warehouse_deck (company_id,warehouse_id,deck_name,deck_code,status,is_deleted,c_date) VALUES ('$company_id','$warehouse_id','$name','$deck_code','$status','1','$c_date')");
        $response=$ok?stockOk($id?'Deck updated':'Deck added',$id?[]:['deck_id'=>mysqli_insert_id($sql)]):stockFail('Could not save deck'); break;
    case 6:
        $id=intval($data['deck_id']??0); if ($id<=0) { $response=stockFail('Deck ID is required'); break; }
        $ok=stockQuery("UPDATE tbl_warehouse_deck SET is_deleted='0',updated_at='$c_date' WHERE company_id='$company_id' AND deck_id='$id' AND is_deleted='1'");
        $response=$ok?stockOk('Deck deleted'):stockFail('Could not delete deck'); break;
    case 7: // Current stock grouped by item and warehouse/deck.
        $filter_warehouse=intval($data['warehouse_id']??0); $filter_deck=intval($data['deck_id']??0); $filter_type=(string)($data['item_type']??'');
        $where="b.company_id='$company_id'"; if($filter_warehouse>0)$where.=" AND b.warehouse_id='$filter_warehouse'"; if($filter_deck>0)$where.=" AND b.deck_id='$filter_deck'"; if(in_array($filter_type,['product','raw_material'],true))$where.=" AND b.item_type='$filter_type'";
        $q=stockQuery("SELECT b.item_type,b.item_id,COALESCE(p.product_name,r.rm_name,b.item_id) item_name,COALESCE(up.unit_name,ur.unit_name,'') unit_name,b.warehouse_id,w.warehouse_name,b.deck_id,d.deck_name,b.quantity FROM tbl_stock_balance b JOIN tbl_warehouse w ON w.company_id=b.company_id AND w.warehouse_id=b.warehouse_id JOIN tbl_warehouse_deck d ON d.company_id=b.company_id AND d.deck_id=b.deck_id LEFT JOIN tbl_product p ON b.item_type='product' AND p.company_id=b.company_id AND p.product_id=b.item_id AND p.is_deleted='1' LEFT JOIN tbl_raw_material r ON b.item_type='raw_material' AND r.company_id=b.company_id AND r.rm_id=b.item_id AND r.is_deleted='1' LEFT JOIN tbl_unit up ON up.unit_id=p.dimension_unit_id LEFT JOIN tbl_unit ur ON ur.unit_id=r.unit_id WHERE $where AND b.quantity<>0 ORDER BY w.warehouse_name,d.deck_name,item_name");
        if(!$q){$response=stockFail('Could not load stock balances. Run sql/stock_locations_ledger.sql first.');break;}$rows=[];while($row=mysqli_fetch_assoc($q)){$row['quantity']=(float)$row['quantity'];$rows[]=$row;}$response=stockOk('Stock balances loaded',['data'=>$rows,'total'=>count($rows)]);break;
    case 8: // Stock movement history.
        $from=stockEsc($data['from_date']??'');$to=stockEsc($data['to_date']??'');$warehouse_filter=intval($data['warehouse_id']??0);$deck_filter=intval($data['deck_id']??0);$item_filter=stockEsc($data['item_id']??'');$move_filter=stockEsc($data['movement_type']??'');
        $where="m.company_id='$company_id' AND m.is_deleted='1'";if($from!=='')$where.=" AND m.movement_date>='$from'";if($to!=='')$where.=" AND m.movement_date<='$to'";if($warehouse_filter>0)$where.=" AND m.warehouse_id='$warehouse_filter'";if($deck_filter>0)$where.=" AND m.deck_id='$deck_filter'";if($item_filter!=='')$where.=" AND m.item_id='$item_filter'";if($move_filter!=='')$where.=" AND m.movement_type='$move_filter'";
        $q=stockQuery("SELECT m.*,w.warehouse_name,d.deck_name,COALESCE(p.product_name,r.rm_name,m.item_name) display_item_name,e.name added_by_name,q.quotation_number FROM tbl_stock_movement m LEFT JOIN tbl_warehouse w ON w.company_id=m.company_id AND w.warehouse_id=m.warehouse_id LEFT JOIN tbl_warehouse_deck d ON d.company_id=m.company_id AND d.deck_id=m.deck_id LEFT JOIN tbl_product p ON m.item_type='product' AND p.company_id=m.company_id AND p.product_id=m.item_id LEFT JOIN tbl_raw_material r ON m.item_type='raw_material' AND r.company_id=m.company_id AND r.rm_id=m.item_id LEFT JOIN tbl_employee e ON e.company_id=m.company_id AND e.emp_id=m.added_by LEFT JOIN tbl_quotation q ON m.movement_type='Stock OUT' AND q.company_id=m.company_id AND q.quotation_id=m.movement_ref WHERE $where ORDER BY m.movement_date DESC,m.movement_id DESC LIMIT 1000");if(!$q){$response=stockFail('Could not load stock ledger. Run sql/stock_locations_ledger.sql first.');break;}$rows=[];while($row=mysqli_fetch_assoc($q))$rows[]=$row;$response=stockOk('Stock movements loaded',['data'=>$rows,'total'=>count($rows)]);break;
    case 9: // Manual stock receipt, work issue, or dead-stock write-off; keep item totals in sync.
        $kind=($data['item_type']??'')==='raw_material'?'raw_material':'product';$item=stockItem($company_id,$kind,$data['item_id']??'');$warehouse_id=intval($data['warehouse_id']??0);$deck_id=intval($data['deck_id']??0);$quantity=round(floatval($data['quantity']??0),3);$movement_type=(string)($data['movement_type']??'');if(!in_array($movement_type,['Stock IN','Stock OUT','Dead Stock'],true)){$response=stockFail('Invalid stock movement type');break;}$delta=in_array($movement_type,['Stock OUT','Dead Stock'],true)?-$quantity:$quantity;$movement_date=stockEsc($data['movement_date']??$date);$remark=stockEsc($data['remark']??'');$added_by=stockEsc($data['added_by']??'');$movement_ref='';
        if(in_array($movement_type,['Stock OUT','Dead Stock'],true)&&$added_by===''){$response=stockFail('Employee ID is required for stock issues');break;}
        if($movement_type==='Dead Stock'&&$remark===''){$response=stockFail('A reason is required for dead stock');break;}
        if($movement_type==='Stock OUT'){$quotation_id=stockEsc($data['quotation_id']??'');if($quotation_id===''){$response=stockFail('A work quotation is required for Stock OUT');break;}$allowed_statuses="'Work In Progress','Work Completed','Work Stop Due To Payment','Closed'";$quotation_q=stockQuery("SELECT quotation_id,quotation_number,status FROM tbl_quotation WHERE company_id='$company_id' AND quotation_id='$quotation_id' AND is_deleted='1' AND status IN ($allowed_statuses) LIMIT 1");if(!$quotation_q||mysqli_num_rows($quotation_q)===0){$response=stockFail('Select a quotation with an allowed work status');break;}$quotation=mysqli_fetch_assoc($quotation_q);$movement_ref=$quotation_id;}
        if(!$item||$quantity<=0||($kind==='product'&&floor($quantity)!=$quantity)||!stockLocation($company_id,$warehouse_id,$deck_id)||!preg_match('/^\d{4}-\d{2}-\d{2}$/',$movement_date)){$response=stockFail('Select a valid item, warehouse, deck, date, and quantity');break;}
        mysqli_begin_transaction($sql);$balance=stockBalanceLock($company_id,$kind,$item['item_id'],$warehouse_id,$deck_id);$before=$balance?(float)$balance['quantity']:0;
        $ok=$balance&&($before+$delta)>=-0.0001&&stockChangeLocation($company_id,$kind,$item['item_id'],$warehouse_id,$deck_id,$delta)&&stockChangeMaster($company_id,$kind,$item,$delta,$movement_date,$remark,$added_by,$warehouse_id,$deck_id);
        if($ok){$after=round($before+$delta,3);$ok=stockInsertMovement($company_id,$movement_type,$kind,$item,$warehouse_id,$deck_id,$delta,$before,$after,$movement_date,$remark,$added_by,$movement_ref);}
        if($ok){mysqli_commit($sql);$response=stockOk($movement_type.' recorded',['balance'=>round($before+$delta,3)]);}else{mysqli_rollback($sql);$response=stockFail('Stock movement was not saved. Check available stock and database setup.');}break;
    case 10: // Transfer between two decks without changing company-wide stock.
        $kind=($data['item_type']??'')==='raw_material'?'raw_material':'product';$item=stockItem($company_id,$kind,$data['item_id']??'');$from_w=intval($data['from_warehouse_id']??0);$from_d=intval($data['from_deck_id']??0);$to_w=intval($data['to_warehouse_id']??0);$to_d=intval($data['to_deck_id']??0);$quantity=round(floatval($data['quantity']??0),3);$movement_date=stockEsc($data['movement_date']??$date);$remark=stockEsc($data['remark']??'');$added_by=stockEsc($data['added_by']??'');
        if(!$item||$quantity<=0||($kind==='product'&&floor($quantity)!=$quantity)||($from_w===$to_w&&$from_d===$to_d)||!stockLocation($company_id,$from_w,$from_d)||!stockLocation($company_id,$to_w,$to_d)||!preg_match('/^\d{4}-\d{2}-\d{2}$/',$movement_date)){$response=stockFail('Choose an item, valid source and destination decks, date, and quantity');break;}
        mysqli_begin_transaction($sql);$source=stockBalanceLock($company_id,$kind,$item['item_id'],$from_w,$from_d);$source_before=$source?(float)$source['quantity']:0;$destination=stockBalanceLock($company_id,$kind,$item['item_id'],$to_w,$to_d);$dest_before=$destination?(float)$destination['quantity']:0;$group='TR-'.$company_id.'-'.date('YmdHis').'-'.mt_rand(1000,9999);
        $ok=$source&&$destination&&$source_before+0.0001>=$quantity&&stockChangeLocation($company_id,$kind,$item['item_id'],$from_w,$from_d,-$quantity)&&stockChangeLocation($company_id,$kind,$item['item_id'],$to_w,$to_d,$quantity);
        if($ok)$ok=stockInsertMovement($company_id,'Transfer OUT',$kind,$item,$from_w,$from_d,-$quantity,$source_before,$source_before-$quantity,$movement_date,$remark,$added_by,$group,$group);
        if($ok)$ok=stockInsertMovement($company_id,'Transfer IN',$kind,$item,$to_w,$to_d,$quantity,$dest_before,$dest_before+$quantity,$movement_date,$remark,$added_by,$group,$group);
        if($ok){mysqli_commit($sql);$response=stockOk('Stock transferred and logged',['transfer_group'=>$group]);}else{mysqli_rollback($sql);$response=stockFail('Transfer was not saved. Verify the source deck has enough stock.');}break;
    case 11: // Quotations available for work-related stock issue.
        $allowed_statuses="'Work In Progress','Work Completed','Work Stop Due To Payment','Closed'";
        $q=stockQuery("SELECT q.quotation_id,q.quotation_number,q.status,q.client_id,c.client_name,c.phone AS client_phone,q.final_amount,q.quotation_date FROM tbl_quotation q LEFT JOIN tbl_client c ON c.company_id=q.company_id AND c.client_id=q.client_id AND c.is_deleted='1' WHERE q.company_id='$company_id' AND q.is_deleted='1' AND q.status IN ($allowed_statuses) ORDER BY q.quotation_id DESC");
        if(!$q){$response=stockFail('Could not load eligible work quotations');break;}$rows=[];while($row=mysqli_fetch_assoc($q))$rows[]=$row;$response=stockOk('Eligible work quotations loaded',['data'=>$rows,'total'=>count($rows)]);break;
}
echo json_encode($response);
mysqli_close($sql);
?>

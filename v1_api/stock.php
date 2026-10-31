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
}
echo json_encode($response);
mysqli_close($sql);
?>

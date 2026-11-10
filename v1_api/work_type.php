<?php
require_once 'dbconnection.php';
if (!headers_sent()) header('Content-Type: application/json; charset=utf-8');
$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) $data = $_POST;
$type = intval($data['type'] ?? 0);
$company_id = mysqli_real_escape_string($sql, trim((string)($data['company_id'] ?? '')));
$work_type_id = intval($data['work_type_id'] ?? 0);
$name = mysqli_real_escape_string($sql, trim((string)($data['name'] ?? '')));
$response = ['status'=>'error','message'=>'Invalid request type'];
switch ($type) {
  case 1:
  case 2:
    if ($company_id === '' || $name === '') { $response = ['status'=>'error','message'=>'Company ID and work type name are required']; break; }
    if ($type === 1) $query = "INSERT INTO tbl_work_type (company_id,name,is_deleted,c_date) VALUES ('$company_id','$name','1','$c_date')";
    else {
      if ($work_type_id <= 0) { $response = ['status'=>'error','message'=>'Work type ID is required']; break; }
      $query = "UPDATE tbl_work_type SET name='$name',updated_at='$c_date' WHERE company_id='$company_id' AND work_type_id='$work_type_id' AND is_deleted='1'";
    }
    if (mysqli_query($sql,$query)) $response = ['status'=>'success','message'=>$type===1?'Work type added successfully':'Work type updated successfully','work_type_id'=>$type===1?mysqli_insert_id($sql):$work_type_id];
    else $response = ['status'=>'error','message'=>'Could not save work type'];
    break;
  case 3:
    if ($company_id === '') { $response = ['status'=>'error','message'=>'Company ID is required']; break; }
    $result = mysqli_query($sql,"SELECT work_type_id,company_id,name FROM tbl_work_type WHERE company_id='$company_id' AND is_deleted='1' ORDER BY name ASC");
    if (!$result) { $response = ['status'=>'error','message'=>'Could not fetch work types']; break; }
    $rows=[]; while ($row=mysqli_fetch_assoc($result)) $rows[]=$row;
    $response=['status'=>'success','message'=>'Work types fetched successfully','data'=>$rows,'total'=>count($rows)];
    break;
  case 4:
    if ($company_id === '' || $work_type_id <= 0) { $response = ['status'=>'error','message'=>'Company ID and work type ID are required']; break; }
    if (mysqli_query($sql,"UPDATE tbl_work_type SET is_deleted='0',updated_at='$c_date' WHERE company_id='$company_id' AND work_type_id='$work_type_id' AND is_deleted='1'")) $response=['status'=>'success','message'=>'Work type deleted successfully'];
    else $response=['status'=>'error','message'=>'Could not delete work type'];
    break;
}
echo json_encode($response);
mysqli_close($sql);

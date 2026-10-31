<?php
// v1_api/rm-type.php
require_once 'dbconnection.php';

$postData = json_decode(file_get_contents('php://input'), true);

logRequest('rm-type', $postData);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('rm-type', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$rm_type_id = isset($postData['rm_type_id']) ? mysqli_real_escape_string($sql, $postData['rm_type_id']) : '';
$rm_type_name = isset($postData['rm_type_name']) ? mysqli_real_escape_string($sql, $postData['rm_type_name']) : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // ADD
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        if (empty($rm_type_name)) {
            $response = ['status' => 'error', 'message' => 'Raw material type name is required'];
            break;
        }
        
        $checkQuery = "SELECT rm_type_id FROM tbl_raw_material_type 
                       WHERE company_id = '$company_id' 
                       AND rm_type_name = '$rm_type_name' 
                       AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) > 0) {
            $response = ['status' => 'error', 'message' => 'Raw material type already exists'];
            break;
        }
        
        $query = "INSERT INTO tbl_raw_material_type (company_id, rm_type_name, is_deleted, c_date) 
                  VALUES ('$company_id', '$rm_type_name', '1', '$c_date')";
        
        if (mysqli_query($sql, $query)) {
            $new_id = mysqli_insert_id($sql);
            logMessage('rm-type', "New raw material type added: $rm_type_name (ID: $new_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Raw material type added successfully',
                'rm_type_id' => $new_id
            ];
        } else {
            $error = mysqli_error($sql);
            logError('rm-type', $error);
            $response = ['status' => 'error', 'message' => 'Failed to add raw material type: ' . $error];
        }
        break;
        
    case 2: // UPDATE
        if (empty($rm_type_id)) {
            $response = ['status' => 'error', 'message' => 'Raw material type ID is required'];
            break;
        }
        
        if (empty($rm_type_name)) {
            $response = ['status' => 'error', 'message' => 'Raw material type name is required'];
            break;
        }
        
        $checkQuery = "SELECT rm_type_id FROM tbl_raw_material_type 
                       WHERE rm_type_id = '$rm_type_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Raw material type not found'];
            break;
        }
        
        $query = "UPDATE tbl_raw_material_type SET rm_type_name = '$rm_type_name' WHERE rm_type_id = '$rm_type_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('rm-type', "Raw material type updated: $rm_type_name (ID: $rm_type_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Raw material type updated successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('rm-type', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update raw material type: ' . $error];
        }
        break;
        
    case 3: // SELECT
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        $query = "SELECT rm_type_id, company_id, rm_type_name, is_deleted, c_date 
                  FROM tbl_raw_material_type 
                  WHERE company_id = '$company_id' AND is_deleted = '1'
                  ORDER BY rm_type_name ASC";
        
        $result = mysqli_query($sql, $query);
        
        if ($result) {
            $types = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $types[] = $row;
            }
            
            logMessage('rm-type', "Fetched " . count($types) . " raw material types", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Raw material types fetched successfully',
                'data' => $types,
                'total' => count($types)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('rm-type', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch raw material types: ' . $error];
        }
        break;
        
    case 4: // DELETE
        if (empty($rm_type_id)) {
            $response = ['status' => 'error', 'message' => 'Raw material type ID is required'];
            break;
        }
        
        $checkQuery = "SELECT rm_type_name FROM tbl_raw_material_type 
                       WHERE rm_type_id = '$rm_type_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Raw material type not found or already deleted'];
            break;
        }
        
        $typeData = mysqli_fetch_assoc($checkResult);
        
        $query = "UPDATE tbl_raw_material_type SET is_deleted = '2' WHERE rm_type_id = '$rm_type_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('rm-type', "Raw material type deleted: {$typeData['rm_type_name']} (ID: $rm_type_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Raw material type deleted successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('rm-type', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete raw material type: ' . $error];
        }
        break;
        
    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('rm-type', "Invalid request type: $type");
}

logResponse('rm-type', $response);
echo json_encode($response);
mysqli_close($sql);
?>
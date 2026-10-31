<?php
// v1_api/unit.php
require_once 'dbconnection.php';

$postData = json_decode(file_get_contents('php://input'), true);

logRequest('unit', $postData);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('unit', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$unit_id = isset($postData['unit_id']) ? mysqli_real_escape_string($sql, $postData['unit_id']) : '';
$unit_name = isset($postData['unit_name']) ? mysqli_real_escape_string($sql, $postData['unit_name']) : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // ADD
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        if (empty($unit_name)) {
            $response = ['status' => 'error', 'message' => 'Unit name is required'];
            break;
        }
        
        $checkQuery = "SELECT unit_id FROM tbl_unit 
                       WHERE company_id = '$company_id' 
                       AND unit_name = '$unit_name' 
                       AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) > 0) {
            $response = ['status' => 'error', 'message' => 'Unit already exists'];
            break;
        }
        
        $query = "INSERT INTO tbl_unit (company_id, unit_name, is_deleted, c_date) 
                  VALUES ('$company_id', '$unit_name', '1', '$c_date')";
        
        if (mysqli_query($sql, $query)) {
            $new_id = mysqli_insert_id($sql);
            logMessage('unit', "New unit added: $unit_name (ID: $new_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Unit added successfully',
                'unit_id' => $new_id
            ];
        } else {
            $error = mysqli_error($sql);
            logError('unit', $error);
            $response = ['status' => 'error', 'message' => 'Failed to add unit: ' . $error];
        }
        break;
        
    case 2: // UPDATE
        if (empty($unit_id)) {
            $response = ['status' => 'error', 'message' => 'Unit ID is required'];
            break;
        }
        
        if (empty($unit_name)) {
            $response = ['status' => 'error', 'message' => 'Unit name is required'];
            break;
        }
        
        $checkQuery = "SELECT unit_id FROM tbl_unit 
                       WHERE unit_id = '$unit_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Unit not found'];
            break;
        }
        
        $query = "UPDATE tbl_unit SET unit_name = '$unit_name' WHERE unit_id = '$unit_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('unit', "Unit updated: $unit_name (ID: $unit_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Unit updated successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('unit', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update unit: ' . $error];
        }
        break;
        
    case 3: // SELECT
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        $query = "SELECT unit_id, company_id, unit_name, is_deleted, c_date 
                  FROM tbl_unit 
                  WHERE company_id = '$company_id' AND is_deleted = '1'
                  ORDER BY unit_name ASC";
        
        $result = mysqli_query($sql, $query);
        
        if ($result) {
            $units = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $units[] = $row;
            }
            
            logMessage('unit', "Fetched " . count($units) . " units", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Units fetched successfully',
                'data' => $units,
                'total' => count($units)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('unit', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch units: ' . $error];
        }
        break;
        
    case 4: // DELETE
        if (empty($unit_id)) {
            $response = ['status' => 'error', 'message' => 'Unit ID is required'];
            break;
        }
        
        $checkQuery = "SELECT unit_name FROM tbl_unit 
                       WHERE unit_id = '$unit_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Unit not found or already deleted'];
            break;
        }
        
        $unitData = mysqli_fetch_assoc($checkResult);
        
        $query = "UPDATE tbl_unit SET is_deleted = '2' WHERE unit_id = '$unit_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('unit', "Unit deleted: {$unitData['unit_name']} (ID: $unit_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Unit deleted successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('unit', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete unit: ' . $error];
        }
        break;
        
    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('unit', "Invalid request type: $type");
}

logResponse('unit', $response);
echo json_encode($response);
mysqli_close($sql);
?>
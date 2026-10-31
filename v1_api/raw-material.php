<?php
// v1_api/raw-material.php
require_once 'dbconnection.php';

$postData = json_decode(file_get_contents('php://input'), true);

logRequest('raw-material', $postData);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('raw-material', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$rm_id = isset($postData['rm_id']) ? mysqli_real_escape_string($sql, $postData['rm_id']) : '';
$rm_name = isset($postData['rm_name']) ? mysqli_real_escape_string($sql, $postData['rm_name']) : '';
$rm_type_id = isset($postData['rm_type_id']) ? mysqli_real_escape_string($sql, $postData['rm_type_id']) : '';
$unit_id = isset($postData['unit_id']) ? mysqli_real_escape_string($sql, $postData['unit_id']) : '';
$brand_id = isset($postData['brand_id']) ? mysqli_real_escape_string($sql, $postData['brand_id']) : '';
$color_code = isset($postData['color_code']) ? mysqli_real_escape_string($sql, $postData['color_code']) : '';
$description = isset($postData['description']) ? mysqli_real_escape_string($sql, $postData['description']) : '';
$current_stock = isset($postData['current_stock']) ? floatval($postData['current_stock']) : 0;
$min_stock_alert = isset($postData['min_stock_alert']) ? floatval($postData['min_stock_alert']) : 0;
$cost_price = isset($postData['cost_price']) ? floatval($postData['cost_price']) : 0;
$status = isset($postData['status']) ? mysqli_real_escape_string($sql, $postData['status']) : 'Active';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // ADD
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        if (empty($rm_name)) {
            $response = ['status' => 'error', 'message' => 'Material name is required'];
            break;
        }
        
        if (empty($rm_type_id)) {
            $response = ['status' => 'error', 'message' => 'Material type is required'];
            break;
        }
        
        if (empty($unit_id)) {
            $response = ['status' => 'error', 'message' => 'Unit is required'];
            break;
        }
        
        if (empty($brand_id)) {
            $response = ['status' => 'error', 'message' => 'Brand is required'];
            break;
        }
        
        // Check if material already exists
        $checkQuery = "SELECT rm_id FROM tbl_raw_material 
                       WHERE company_id = '$company_id' 
                       AND rm_name = '$rm_name' 
                       AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) > 0) {
            $response = ['status' => 'error', 'message' => 'Material already exists'];
            break;
        }
        
        // Insert new material
        $query = "INSERT INTO tbl_raw_material 
                  (company_id, rm_name, rm_type_id, unit_id, brand_id, color_code, description, 
                   current_stock, min_stock_alert, cost_price, status, is_deleted, c_date) 
                  VALUES 
                  ('$company_id', '$rm_name', '$rm_type_id', '$unit_id', '$brand_id', '$color_code', '$description',
                   '$current_stock', '$min_stock_alert', '$cost_price', '$status', '1', '$c_date')";
        
        if (mysqli_query($sql, $query)) {
            $new_id = mysqli_insert_id($sql);
            logMessage('raw-material', "New material added: $rm_name (ID: $new_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Material added successfully',
                'rm_id' => $new_id
            ];
        } else {
            $error = mysqli_error($sql);
            logError('raw-material', $error);
            $response = ['status' => 'error', 'message' => 'Failed to add material: ' . $error];
        }
        break;
        
    case 2: // UPDATE
        if (empty($rm_id)) {
            $response = ['status' => 'error', 'message' => 'Material ID is required'];
            break;
        }
        
        if (empty($rm_name)) {
            $response = ['status' => 'error', 'message' => 'Material name is required'];
            break;
        }
        
        // Check if material exists
        $checkQuery = "SELECT rm_id FROM tbl_raw_material 
                       WHERE rm_id = '$rm_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Material not found'];
            break;
        }
        
        // Update material
        $query = "UPDATE tbl_raw_material 
                  SET rm_name = '$rm_name', 
                      rm_type_id = '$rm_type_id', 
                      unit_id = '$unit_id', 
                      brand_id = '$brand_id', 
                      color_code = '$color_code', 
                      description = '$description', 
                      current_stock = '$current_stock', 
                      min_stock_alert = '$min_stock_alert', 
                      cost_price = '$cost_price', 
                      status = '$status' 
                  WHERE rm_id = '$rm_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('raw-material', "Material updated: $rm_name (ID: $rm_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Material updated successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('raw-material', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update material: ' . $error];
        }
        break;
        
    case 3: // SELECT
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        $query = "SELECT r.rm_id, r.company_id, r.rm_name, r.rm_type_id, r.unit_id, r.brand_id, 
                         r.color_code, r.description, r.current_stock, r.min_stock_alert, 
                         r.cost_price, r.status, r.is_deleted, r.c_date,
                         t.rm_type_name,
                         u.unit_name,
                         b.brand_name
                  FROM tbl_raw_material r
                  LEFT JOIN tbl_raw_material_type t ON r.rm_type_id = t.rm_type_id
                  LEFT JOIN tbl_unit u ON r.unit_id = u.unit_id
                  LEFT JOIN tbl_brand b ON r.brand_id = b.brand_id
                  WHERE r.company_id = '$company_id' AND r.is_deleted = '1'
                  ORDER BY r.rm_name ASC";
        
        $result = mysqli_query($sql, $query);
        
        if ($result) {
            $materials = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $materials[] = $row;
            }
            
            logMessage('raw-material', "Fetched " . count($materials) . " materials", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Materials fetched successfully',
                'data' => $materials,
                'total' => count($materials)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('raw-material', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch materials: ' . $error];
        }
        break;
        
    case 4: // DELETE
        if (empty($rm_id)) {
            $response = ['status' => 'error', 'message' => 'Material ID is required'];
            break;
        }
        
        $checkQuery = "SELECT rm_name FROM tbl_raw_material 
                       WHERE rm_id = '$rm_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Material not found or already deleted'];
            break;
        }
        
        $materialData = mysqli_fetch_assoc($checkResult);
        
        $query = "UPDATE tbl_raw_material SET is_deleted = '2' WHERE rm_id = '$rm_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('raw-material', "Material deleted: {$materialData['rm_name']} (ID: $rm_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Material deleted successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('raw-material', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete material: ' . $error];
        }
        break;
        
    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('raw-material', "Invalid request type: $type");
}

logResponse('raw-material', $response);
echo json_encode($response);
mysqli_close($sql);
?>
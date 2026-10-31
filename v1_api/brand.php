<?php
// v1_api/brand.php
require_once 'dbconnection.php';

$postData = json_decode(file_get_contents('php://input'), true);

logRequest('brand', $postData);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('brand', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$brand_id = isset($postData['brand_id']) ? mysqli_real_escape_string($sql, $postData['brand_id']) : '';
$brand_name = isset($postData['brand_name']) ? mysqli_real_escape_string($sql, $postData['brand_name']) : '';
$brand_code = isset($postData['brand_code']) ? mysqli_real_escape_string($sql, $postData['brand_code']) : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // ADD
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        if (empty($brand_name)) {
            $response = ['status' => 'error', 'message' => 'Brand name is required'];
            break;
        }
        
        $checkQuery = "SELECT brand_id FROM tbl_brand 
                       WHERE company_id = '$company_id' 
                       AND brand_name = '$brand_name' 
                       AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) > 0) {
            $response = ['status' => 'error', 'message' => 'Brand already exists'];
            break;
        }
        
        $query = "INSERT INTO tbl_brand (company_id, brand_name, brand_code, is_deleted, c_date) 
                  VALUES ('$company_id', '$brand_name', '$brand_code', '1', '$c_date')";
        
        if (mysqli_query($sql, $query)) {
            $new_id = mysqli_insert_id($sql);
            logMessage('brand', "New brand added: $brand_name (ID: $new_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Brand added successfully',
                'brand_id' => $new_id
            ];
        } else {
            $error = mysqli_error($sql);
            logError('brand', $error);
            $response = ['status' => 'error', 'message' => 'Failed to add brand: ' . $error];
        }
        break;
        
    case 2: // UPDATE
        if (empty($brand_id)) {
            $response = ['status' => 'error', 'message' => 'Brand ID is required'];
            break;
        }
        
        if (empty($brand_name)) {
            $response = ['status' => 'error', 'message' => 'Brand name is required'];
            break;
        }
        
        $checkQuery = "SELECT brand_id FROM tbl_brand 
                       WHERE brand_id = '$brand_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Brand not found'];
            break;
        }
        
        $query = "UPDATE tbl_brand 
                  SET brand_name = '$brand_name', brand_code = '$brand_code' 
                  WHERE brand_id = '$brand_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('brand', "Brand updated: $brand_name (ID: $brand_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Brand updated successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('brand', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update brand: ' . $error];
        }
        break;
        
    case 3: // SELECT
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        $query = "SELECT brand_id, company_id, brand_name, brand_code, is_deleted, c_date 
                  FROM tbl_brand 
                  WHERE company_id = '$company_id' AND is_deleted = '1'
                  ORDER BY brand_name ASC";
        
        $result = mysqli_query($sql, $query);
        
        if ($result) {
            $brands = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $brands[] = $row;
            }
            
            logMessage('brand', "Fetched " . count($brands) . " brands", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Brands fetched successfully',
                'data' => $brands,
                'total' => count($brands)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('brand', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch brands: ' . $error];
        }
        break;
        
    case 4: // DELETE
        if (empty($brand_id)) {
            $response = ['status' => 'error', 'message' => 'Brand ID is required'];
            break;
        }
        
        $checkQuery = "SELECT brand_name FROM tbl_brand 
                       WHERE brand_id = '$brand_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Brand not found or already deleted'];
            break;
        }
        
        $brandData = mysqli_fetch_assoc($checkResult);
        
        $query = "UPDATE tbl_brand SET is_deleted = '2' WHERE brand_id = '$brand_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('brand', "Brand deleted: {$brandData['brand_name']} (ID: $brand_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Brand deleted successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('brand', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete brand: ' . $error];
        }
        break;
        
    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('brand', "Invalid request type: $type");
}

logResponse('brand', $response);
echo json_encode($response);
mysqli_close($sql);
?>
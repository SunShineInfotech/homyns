<?php
// v1_api/area.php
require_once 'dbconnection.php';

// Get POST data
$postData = json_decode(file_get_contents('php://input'), true);

// Log request
logRequest('area', $postData);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('area', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$city_id = isset($postData['city_id']) ? mysqli_real_escape_string($sql, $postData['city_id']) : '';
$area_id = isset($postData['area_id']) ? mysqli_real_escape_string($sql, $postData['area_id']) : '';
$area_name = isset($postData['area_name']) ? mysqli_real_escape_string($sql, $postData['area_name']) : '';
$pincode = isset($postData['pincode']) ? mysqli_real_escape_string($sql, $postData['pincode']) : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // ADD
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        if (empty($city_id)) {
            $response = ['status' => 'error', 'message' => 'City ID is required'];
            break;
        }
        
        if (empty($area_name)) {
            $response = ['status' => 'error', 'message' => 'Area name is required'];
            break;
        }
        
        // Check if city exists and belongs to company
        $checkCity = "SELECT city_id FROM tbl_city 
                      WHERE city_id = '$city_id' 
                      AND company_id = '$company_id' 
                      AND is_deleted = '1'";
        $cityResult = mysqli_query($sql, $checkCity);
        
        if (mysqli_num_rows($cityResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Invalid city selected'];
            break;
        }
        
        // Check if area already exists
        $checkQuery = "SELECT area_id FROM tbl_area 
                       WHERE company_id = '$company_id' 
                       AND city_id = '$city_id' 
                       AND area_name = '$area_name' 
                       AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) > 0) {
            $response = ['status' => 'error', 'message' => 'Area already exists in this city'];
            break;
        }
        
        // Insert new area
        $query = "INSERT INTO tbl_area (company_id, city_id, area_name, pincode, is_deleted, c_date) 
                  VALUES ('$company_id', '$city_id', '$area_name', '$pincode', '1', '$c_date')";
        
        if (mysqli_query($sql, $query)) {
            $new_id = mysqli_insert_id($sql);
            logMessage('area', "New area added: $area_name (ID: $new_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Area added successfully',
                'area_id' => $new_id
            ];
        } else {
            $error = mysqli_error($sql);
            logError('area', $error);
            $response = ['status' => 'error', 'message' => 'Failed to add area: ' . $error];
        }
        break;
        
    case 2: // UPDATE
        if (empty($area_id)) {
            $response = ['status' => 'error', 'message' => 'Area ID is required'];
            break;
        }
        
        if (empty($area_name)) {
            $response = ['status' => 'error', 'message' => 'Area name is required'];
            break;
        }
        
        if (empty($city_id)) {
            $response = ['status' => 'error', 'message' => 'City ID is required'];
            break;
        }
        
        // Check if area exists
        $checkQuery = "SELECT area_id FROM tbl_area 
                       WHERE area_id = '$area_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Area not found'];
            break;
        }
        
        // Update area
        $query = "UPDATE tbl_area 
                  SET area_name = '$area_name', city_id = '$city_id', pincode = '$pincode' 
                  WHERE area_id = '$area_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('area', "Area updated: $area_name (ID: $area_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Area updated successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('area', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update area: ' . $error];
        }
        break;
        
    case 3: // SELECT
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        $query = "SELECT a.area_id, a.company_id, a.city_id, a.area_name, a.pincode, a.is_deleted, a.c_date,
                         c.city_name, c.state_id
                  FROM tbl_area a
                  LEFT JOIN tbl_city c ON a.city_id = c.city_id
                  WHERE a.company_id = '$company_id' 
                  AND a.is_deleted = '1'";
        
        // Filter by city if provided
        if (!empty($city_id)) {
            $query .= " AND a.city_id = '$city_id'";
        }
        
        $query .= " ORDER BY a.area_name ASC";
        
        $result = mysqli_query($sql, $query);
        
        if ($result) {
            $areas = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $areas[] = $row;
            }
            
            logMessage('area', "Fetched " . count($areas) . " areas", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Areas fetched successfully',
                'data' => $areas,
                'total' => count($areas)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('area', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch areas: ' . $error];
        }
        break;
        
    case 4: // DELETE (Soft delete)
        if (empty($area_id)) {
            $response = ['status' => 'error', 'message' => 'Area ID is required'];
            break;
        }
        
        // Check if area exists
        $checkQuery = "SELECT area_name FROM tbl_area 
                       WHERE area_id = '$area_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Area not found or already deleted'];
            break;
        }
        
        $areaData = mysqli_fetch_assoc($checkResult);
        
        // Soft delete
        $query = "UPDATE tbl_area SET is_deleted = '2' WHERE area_id = '$area_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('area', "Area deleted: {$areaData['area_name']} (ID: $area_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Area deleted successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('area', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete area: ' . $error];
        }
        break;
        
    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('area', "Invalid request type: $type");
}

// Log response
logResponse('area', $response);

echo json_encode($response);
mysqli_close($sql);
?>
<?php
// v1_api/city.php
require_once 'dbconnection.php';

// Get POST data
$postData = json_decode(file_get_contents('php://input'), true);

// Log request
logRequest('city', $postData);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('city', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$state_id = isset($postData['state_id']) ? mysqli_real_escape_string($sql, $postData['state_id']) : '';
$city_id = isset($postData['city_id']) ? mysqli_real_escape_string($sql, $postData['city_id']) : '';
$city_name = isset($postData['city_name']) ? mysqli_real_escape_string($sql, $postData['city_name']) : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // ADD - Insert new city
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        if (empty($state_id)) {
            $response = ['status' => 'error', 'message' => 'State ID is required'];
            break;
        }
        
        if (empty($city_name)) {
            $response = ['status' => 'error', 'message' => 'City name is required'];
            break;
        }
        
        // Check if state exists and belongs to company
        $checkState = "SELECT state_id FROM tbl_state 
                       WHERE state_id = '$state_id' 
                       AND company_id = '$company_id' 
                       AND is_deleted = 1";
        $stateResult = mysqli_query($sql, $checkState);
        
        if (mysqli_num_rows($stateResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Invalid state selected'];
            break;
        }
        
        // Check if city already exists for this state
        $checkQuery = "SELECT city_id FROM tbl_city 
                       WHERE company_id = '$company_id' 
                       AND state_id = '$state_id' 
                       AND city_name = '$city_name' 
                       AND is_deleted = 1";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) > 0) {
            $response = ['status' => 'error', 'message' => 'City already exists in this state'];
            break;
        }
        
        // Insert new city
        $query = "INSERT INTO tbl_city (company_id, state_id, city_name, is_deleted, c_date) 
                  VALUES ('$company_id', '$state_id', '$city_name', '1', '$c_date')";
        
        if (mysqli_query($sql, $query)) {
            $new_id = mysqli_insert_id($sql);
            logMessage('city', "New city added: $city_name (ID: $new_id) for state ID: $state_id", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'City added successfully',
                'city_id' => $new_id
            ];
        } else {
            logError('city', mysqli_error($sql));
            $response = ['status' => 'error', 'message' => 'Failed to add city'];
        }
        break;
        
    case 2: // UPDATE - Update existing city
        if (empty($city_id)) {
            $response = ['status' => 'error', 'message' => 'City ID is required'];
            break;
        }
        
        if (empty($city_name)) {
            $response = ['status' => 'error', 'message' => 'City name is required'];
            break;
        }
        
        if (empty($state_id)) {
            $response = ['status' => 'error', 'message' => 'State ID is required'];
            break;
        }
        
        // Check if city exists and is active
        $checkQuery = "SELECT city_id FROM tbl_city 
                       WHERE city_id = '$city_id' AND is_deleted = 1";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'City not found'];
            break;
        }
        
        // Update city
        $query = "UPDATE tbl_city 
                  SET city_name = '$city_name', state_id = '$state_id' 
                  WHERE city_id = '$city_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('city', "City updated: $city_name (ID: $city_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'City updated successfully'
            ];
        } else {
            logError('city', mysqli_error($sql));
            $response = ['status' => 'error', 'message' => 'Failed to update city'];
        }
        break;
        
    case 3: // SELECT - Fetch all cities
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        $query = "SELECT c.city_id, c.company_id, c.state_id, c.city_name, c.is_deleted, c.c_date,
                         s.state_name
                  FROM tbl_city c
                  LEFT JOIN tbl_state s ON c.state_id = s.state_id
                  WHERE c.company_id = '$company_id' 
                  AND c.is_deleted = 1";
        
        // Filter by state if provided
        if (!empty($state_id)) {
            $query .= " AND c.state_id = '$state_id'";
        }
        
        $query .= " ORDER BY c.city_name ASC";
        
        $result = mysqli_query($sql, $query);
        
        if ($result) {
            $cities = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $cities[] = $row;
            }
            
            logMessage('city', "Fetched " . count($cities) . " cities for company ID: $company_id", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Cities fetched successfully',
                'data' => $cities,
                'total' => count($cities)
            ];
        } else {
            logError('city', mysqli_error($sql));
            $response = ['status' => 'error', 'message' => 'Failed to fetch cities'];
        }
        break;
        
    case 4: // DELETE - Soft delete (is_deleted = 2)
        if (empty($city_id)) {
            $response = ['status' => 'error', 'message' => 'City ID is required'];
            break;
        }
        
        // Check if city exists and is active
        $checkQuery = "SELECT city_name FROM tbl_city 
                       WHERE city_id = '$city_id' AND is_deleted = 1";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'City not found or already deleted'];
            break;
        }
        
        $cityData = mysqli_fetch_assoc($checkResult);
        
        // Soft delete - set is_deleted = 2
        $query = "UPDATE tbl_city SET is_deleted = '2' WHERE city_id = '$city_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('city', "City deleted (soft): {$cityData['city_name']} (ID: $city_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'City deleted successfully'
            ];
        } else {
            logError('city', mysqli_error($sql));
            $response = ['status' => 'error', 'message' => 'Failed to delete city'];
        }
        break;
        
    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('city', "Invalid request type: $type");
}

// Log response
logResponse('city', $response);

echo json_encode($response);
mysqli_close($sql);
?>
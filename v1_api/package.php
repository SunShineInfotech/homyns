<?php
// v1_api/package.php
require_once 'dbconnection.php';

// Get POST data
$postData = json_decode(file_get_contents('php://input'), true);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('package', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$package_id = isset($postData['package_id']) ? mysqli_real_escape_string($sql, $postData['package_id']) : '';
$package_name = isset($postData['package_name']) ? mysqli_real_escape_string($sql, $postData['package_name']) : '';
$details = isset($postData['details']) ? mysqli_real_escape_string($sql, $postData['details']) : '';
$completion_days = isset($postData['completion_days']) ? intval($postData['completion_days']) : 0;
$rooms = isset($postData['rooms']) ? mysqli_real_escape_string($sql, $postData['rooms']) : '';
$created_by = isset($postData['created_by']) ? mysqli_real_escape_string($sql, $postData['created_by']) : '';
$status = isset($postData['status']) ? mysqli_real_escape_string($sql, $postData['status']) : 'Active';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // ADD
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($package_name)) {
            $response = ['status' => 'error', 'message' => 'Package name is required'];
            break;
        }
        if (empty($created_by)) {
            $response = ['status' => 'error', 'message' => 'Created by is required'];
            break;
        }
        
        // Check if package already exists
        $checkQuery = "SELECT package_id FROM tbl_package 
                       WHERE company_id = '$company_id' 
                       AND package_name = '$package_name' 
                       AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) > 0) {
            $response = ['status' => 'error', 'message' => 'Package already exists'];
            break;
        }
        
        // Insert package
        $query = "INSERT INTO tbl_package 
                  (company_id, package_name, details, completion_days, rooms, created_by, status, is_deleted, c_date) 
                  VALUES 
                  ('$company_id', '$package_name', '$details', '$completion_days', '$rooms', '$created_by', '$status', '1', '$c_date')";
        
        if (mysqli_query($sql, $query)) {
            $new_id = mysqli_insert_id($sql);
            logMessage('package', "New package added: $package_name (ID: $new_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Package added successfully',
                'package_id' => $new_id
            ];
        } else {
            $error = mysqli_error($sql);
            logError('package', $error);
            $response = ['status' => 'error', 'message' => 'Failed to add package: ' . $error];
        }
        break;
        
    case 2: // UPDATE
        if (empty($package_id)) {
            $response = ['status' => 'error', 'message' => 'Package ID is required'];
            break;
        }
        if (empty($package_name)) {
            $response = ['status' => 'error', 'message' => 'Package name is required'];
            break;
        }
        
        // Check if package exists
        $checkQuery = "SELECT package_id FROM tbl_package 
                       WHERE package_id = '$package_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Package not found'];
            break;
        }
        
        // Update package
        $query = "UPDATE tbl_package 
                  SET package_name = '$package_name', 
                      details = '$details', 
                      completion_days = '$completion_days', 
                      rooms = '$rooms', 
                      status = '$status' 
                  WHERE package_id = '$package_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('package', "Package updated: $package_name (ID: $package_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Package updated successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('package', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update package: ' . $error];
        }
        break;
        
    case 3: // SELECT
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        $query = "SELECT p.*, e.name as created_by_name
                  FROM tbl_package p
                  LEFT JOIN tbl_employee e ON p.created_by = e.emp_id
                  WHERE p.company_id = '$company_id' AND p.is_deleted = '1'
                  ORDER BY p.package_name ASC";
        
        $result = mysqli_query($sql, $query);
        
        if ($result) {
            $packages = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $packages[] = $row;
            }
            
            logMessage('package', "Fetched " . count($packages) . " packages", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Packages fetched successfully',
                'data' => $packages,
                'total' => count($packages)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('package', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch packages: ' . $error];
        }
        break;
        
    case 4: // DELETE
        if (empty($package_id)) {
            $response = ['status' => 'error', 'message' => 'Package ID is required'];
            break;
        }
        
        $checkQuery = "SELECT package_name FROM tbl_package 
                       WHERE package_id = '$package_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Package not found or already deleted'];
            break;
        }
        
        $packageData = mysqli_fetch_assoc($checkResult);
        
        $query = "UPDATE tbl_package SET is_deleted = '2' WHERE package_id = '$package_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('package', "Package deleted: {$packageData['package_name']} (ID: $package_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Package deleted successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('package', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete package: ' . $error];
        }
        break;
        
    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('package', "Invalid request type: $type");
}

logResponse('package', $response);
echo json_encode($response);
mysqli_close($sql);
?>
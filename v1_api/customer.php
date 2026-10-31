<?php
// v1_api/customer.php
require_once 'dbconnection.php';

// Get POST data
$postData = json_decode(file_get_contents('php://input'), true);

// Log request
logRequest('customer', $postData);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('customer', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$client_id = isset($postData['client_id']) ? mysqli_real_escape_string($sql, $postData['client_id']) : '';
$client_name = isset($postData['client_name']) ? mysqli_real_escape_string($sql, $postData['client_name']) : '';
$client_email = isset($postData['client_email']) ? mysqli_real_escape_string($sql, $postData['client_email']) : ''; // ADDED
$gender = isset($postData['gender']) ? mysqli_real_escape_string($sql, $postData['gender']) : '';
$phone1 = isset($postData['phone1']) ? mysqli_real_escape_string($sql, $postData['phone1']) : '';
$phone2 = isset($postData['phone2']) ? mysqli_real_escape_string($sql, $postData['phone2']) : '';
$whatsapp_number = isset($postData['whatsapp_number']) ? mysqli_real_escape_string($sql, $postData['whatsapp_number']) : '';
$address = isset($postData['address']) ? mysqli_real_escape_string($sql, $postData['address']) : '';
$state_id = isset($postData['state_id']) ? mysqli_real_escape_string($sql, $postData['state_id']) : '';
$city_id = isset($postData['city_id']) ? mysqli_real_escape_string($sql, $postData['city_id']) : '';
$area_id = isset($postData['area_id']) ? mysqli_real_escape_string($sql, $postData['area_id']) : '';
$wallet = isset($postData['wallet']) ? floatval($postData['wallet']) : 0;
$status = isset($postData['status']) ? mysqli_real_escape_string($sql, $postData['status']) : 'Active';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // ADD
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        if (empty($client_name)) {
            $response = ['status' => 'error', 'message' => 'Customer name is required'];
            break;
        }
        
        if (empty($phone1)) {
            $response = ['status' => 'error', 'message' => 'Phone 1 is required'];
            break;
        }
        
        // Check if customer already exists
        $checkQuery = "SELECT client_id FROM tbl_client 
                       WHERE company_id = '$company_id' 
                       AND phone1 = '$phone1'
                       AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) > 0) {
            $response = ['status' => 'error', 'message' => 'Customer with this name, phone or email already exists'];
            break;
        }
        
        // Insert new customer
        $query = "INSERT INTO tbl_client 
                  (company_id, client_name, client_email, gender, phone1, phone2, whatsapp_number, 
                   address, state_id, city_id, area_id, wallet, status, is_deleted, c_date) 
                  VALUES 
                  ('$company_id', '$client_name', '$client_email', '$gender', '$phone1', '$phone2', '$whatsapp_number',
                   '$address', '$state_id', '$city_id', '$area_id', '$wallet', '$status', '1', '$c_date')";
        
        if (mysqli_query($sql, $query)) {
            $new_id = mysqli_insert_id($sql);
            logMessage('customer', "New customer added: $client_name (ID: $new_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Customer added successfully',
                'client_id' => $new_id
            ];
        } else {
            $error = mysqli_error($sql);
            logError('customer', $error);
            $response = ['status' => 'error', 'message' => 'Failed to add customer: ' . $error];
        }
        break;
        
    case 2: // UPDATE
        if (empty($client_id)) {
            $response = ['status' => 'error', 'message' => 'Customer ID is required'];
            break;
        }
        
        if (empty($client_name)) {
            $response = ['status' => 'error', 'message' => 'Customer name is required'];
            break;
        }
        
        if (empty($phone1)) {
            $response = ['status' => 'error', 'message' => 'Phone 1 is required'];
            break;
        }
        
        // Check if customer exists
        $checkQuery = "SELECT client_id FROM tbl_client 
                       WHERE client_id = '$client_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Customer not found'];
            break;
        }
        
        // Update customer
        $query = "UPDATE tbl_client 
                  SET client_name = '$client_name', 
                      client_email = '$client_email', 
                      gender = '$gender', 
                      phone1 = '$phone1', 
                      phone2 = '$phone2', 
                      whatsapp_number = '$whatsapp_number', 
                      address = '$address', 
                      state_id = '$state_id', 
                      city_id = '$city_id', 
                      area_id = '$area_id', 
                      wallet = '$wallet', 
                      status = '$status' 
                  WHERE client_id = '$client_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('customer', "Customer updated: $client_name (ID: $client_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Customer updated successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('customer', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update customer: ' . $error];
        }
        break;
        
    case 3: // SELECT
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        $query = "SELECT c.*, 
                         s.state_name, 
                         ct.city_name, 
                         a.area_name
                  FROM tbl_client c
                  LEFT JOIN tbl_state s ON c.state_id = s.state_id
                  LEFT JOIN tbl_city ct ON c.city_id = ct.city_id
                  LEFT JOIN tbl_area a ON c.area_id = a.area_id
                  WHERE c.company_id = '$company_id' AND c.is_deleted = '1'
                  ORDER BY c.client_name ASC";
        
        $result = mysqli_query($sql, $query);
        
        if ($result) {
            $customers = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $customers[] = $row;
            }
            
            logMessage('customer', "Fetched " . count($customers) . " customers", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Customers fetched successfully',
                'data' => $customers,
                'total' => count($customers)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('customer', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch customers: ' . $error];
        }
        break;
        
    case 4: // DELETE
        if (empty($client_id)) {
            $response = ['status' => 'error', 'message' => 'Customer ID is required'];
            break;
        }
        
        $checkQuery = "SELECT client_name FROM tbl_client 
                       WHERE client_id = '$client_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Customer not found or already deleted'];
            break;
        }
        
        $customerData = mysqli_fetch_assoc($checkResult);
        
        $query = "UPDATE tbl_client SET is_deleted = '2' WHERE client_id = '$client_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('customer', "Customer deleted: {$customerData['client_name']} (ID: $client_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Customer deleted successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('customer', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete customer: ' . $error];
        }
        break;
        
    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('customer', "Invalid request type: $type");
}

// Log response
logResponse('customer', $response);

echo json_encode($response);
mysqli_close($sql);
?>
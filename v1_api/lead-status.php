<?php
// v1_api/lead-status.php
require_once 'dbconnection.php';

// Get POST data
$postData = json_decode(file_get_contents('php://input'), true);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('lead-status', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$status_id = isset($postData['status_id']) ? mysqli_real_escape_string($sql, $postData['status_id']) : '';
$status_name = isset($postData['status_name']) ? mysqli_real_escape_string($sql, $postData['status_name']) : '';
$font_color = isset($postData['font_color']) ? mysqli_real_escape_string($sql, $postData['font_color']) : '#ffffff';
$background_color = isset($postData['background_color']) ? mysqli_real_escape_string($sql, $postData['background_color']) : '#6b7280';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // ADD - Add new lead status
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($status_name)) {
            $response = ['status' => 'error', 'message' => 'Status name is required'];
            break;
        }

        // Check if status name already exists for this company
        $checkQuery = "SELECT status_id FROM tbl_lead_status 
                       WHERE company_id = '$company_id' 
                       AND status_name = '$status_name' 
                       AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) > 0) {
            $response = ['status' => 'error', 'message' => 'Lead status already exists'];
            break;
        }

        // Insert lead status with colors
        $query = "INSERT INTO tbl_lead_status (company_id, status_name, font_color, background_color, is_deleted, c_date) 
                  VALUES ('$company_id', '$status_name', '$font_color', '$background_color', '1', '$c_date')";
        
        if (mysqli_query($sql, $query)) {
            $new_id = mysqli_insert_id($sql);
            logMessage('lead-status', "New lead status added: $status_name (ID: $new_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Lead status added successfully',
                'status_id' => $new_id
            ];
        } else {
            $error = mysqli_error($sql);
            logError('lead-status', $error);
            $response = ['status' => 'error', 'message' => 'Failed to add lead status: ' . $error];
        }
        break;

    case 2: // UPDATE - Update lead status
        if (empty($status_id)) {
            $response = ['status' => 'error', 'message' => 'Status ID is required'];
            break;
        }
        if (empty($status_name)) {
            $response = ['status' => 'error', 'message' => 'Status name is required'];
            break;
        }

        // Check if lead status exists
        $checkQuery = "SELECT status_id FROM tbl_lead_status 
                       WHERE status_id = '$status_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Lead status not found'];
            break;
        }

        // Check if another status has the same name
        $checkQuery = "SELECT status_id FROM tbl_lead_status 
                       WHERE company_id = '$company_id' 
                       AND status_name = '$status_name' 
                       AND status_id != '$status_id'
                       AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) > 0) {
            $response = ['status' => 'error', 'message' => 'Lead status name already exists'];
            break;
        }

        // Update lead status with colors
        $query = "UPDATE tbl_lead_status 
                  SET status_name = '$status_name',
                      font_color = '$font_color',
                      background_color = '$background_color'
                  WHERE status_id = '$status_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('lead-status', "Lead status updated: $status_name (ID: $status_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Lead status updated successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('lead-status', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update lead status: ' . $error];
        }
        break;

    case 3: // SELECT - Get all lead statuses for a company
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }

        $query = "SELECT status_id, company_id, status_name, font_color, background_color, is_deleted, c_date 
                  FROM tbl_lead_status 
                  WHERE company_id = '$company_id' AND is_deleted = '1'
                  ORDER BY status_name ASC";
        
        $result = mysqli_query($sql, $query);
        
        if ($result) {
            $statuses = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $statuses[] = $row;
            }
            
            logMessage('lead-status', "Fetched " . count($statuses) . " lead statuses for company ID: $company_id", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Lead statuses fetched successfully',
                'data' => $statuses,
                'total' => count($statuses)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('lead-status', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch lead statuses: ' . $error];
        }
        break;

    case 4: // DELETE - Soft delete lead status
        if (empty($status_id)) {
            $response = ['status' => 'error', 'message' => 'Status ID is required'];
            break;
        }

        // Check if lead status exists
        $checkQuery = "SELECT status_name FROM tbl_lead_status 
                       WHERE status_id = '$status_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Lead status not found or already deleted'];
            break;
        }

        $statusData = mysqli_fetch_assoc($checkResult);

        // Soft delete lead status
        $query = "UPDATE tbl_lead_status SET is_deleted = '2' WHERE status_id = '$status_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('lead-status', "Lead status deleted: {$statusData['status_name']} (ID: $status_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Lead status deleted successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('lead-status', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete lead status: ' . $error];
        }
        break;

    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('lead-status', "Invalid request type: $type");
}

logResponse('lead-status', $response);
echo json_encode($response);
mysqli_close($sql);
?>
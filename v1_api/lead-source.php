<?php
// v1_api/lead-source.php
require_once 'dbconnection.php';

// Get POST data
$postData = json_decode(file_get_contents('php://input'), true);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('lead-source', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$source_id = isset($postData['source_id']) ? mysqli_real_escape_string($sql, $postData['source_id']) : '';
$source_name = isset($postData['source_name']) ? mysqli_real_escape_string($sql, $postData['source_name']) : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // ADD - Add new lead source
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($source_name)) {
            $response = ['status' => 'error', 'message' => 'Source name is required'];
            break;
        }

        // Check if source name already exists for this company
        $checkQuery = "SELECT source_id FROM tbl_lead_source 
                       WHERE company_id = '$company_id' 
                       AND source_name = '$source_name' 
                       AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) > 0) {
            $response = ['status' => 'error', 'message' => 'Lead source already exists'];
            break;
        }

        // Insert lead source
        $query = "INSERT INTO tbl_lead_source (company_id, source_name, is_deleted, c_date) 
                  VALUES ('$company_id', '$source_name', '1', '$c_date')";
        
        if (mysqli_query($sql, $query)) {
            $new_id = mysqli_insert_id($sql);
            logMessage('lead-source', "New lead source added: $source_name (ID: $new_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Lead source added successfully',
                'source_id' => $new_id
            ];
        } else {
            $error = mysqli_error($sql);
            logError('lead-source', $error);
            $response = ['status' => 'error', 'message' => 'Failed to add lead source: ' . $error];
        }
        break;

    case 2: // UPDATE - Update lead source
        if (empty($source_id)) {
            $response = ['status' => 'error', 'message' => 'Source ID is required'];
            break;
        }
        if (empty($source_name)) {
            $response = ['status' => 'error', 'message' => 'Source name is required'];
            break;
        }

        // Check if lead source exists
        $checkQuery = "SELECT source_id FROM tbl_lead_source 
                       WHERE source_id = '$source_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Lead source not found'];
            break;
        }

        // Check if another source has the same name
        $checkQuery = "SELECT source_id FROM tbl_lead_source 
                       WHERE company_id = '$company_id' 
                       AND source_name = '$source_name' 
                       AND source_id != '$source_id'
                       AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) > 0) {
            $response = ['status' => 'error', 'message' => 'Lead source name already exists'];
            break;
        }

        // Update lead source
        $query = "UPDATE tbl_lead_source 
                  SET source_name = '$source_name' 
                  WHERE source_id = '$source_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('lead-source', "Lead source updated: $source_name (ID: $source_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Lead source updated successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('lead-source', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update lead source: ' . $error];
        }
        break;

    case 3: // SELECT - Get all lead sources for a company
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }

        $query = "SELECT source_id, company_id, source_name, is_deleted, c_date 
                  FROM tbl_lead_source 
                  WHERE company_id = '$company_id' AND is_deleted = '1'
                  ORDER BY source_name ASC";
        
        $result = mysqli_query($sql, $query);
        
        if ($result) {
            $sources = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $sources[] = $row;
            }
            
            logMessage('lead-source', "Fetched " . count($sources) . " lead sources for company ID: $company_id", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Lead sources fetched successfully',
                'data' => $sources,
                'total' => count($sources)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('lead-source', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch lead sources: ' . $error];
        }
        break;

    case 4: // DELETE - Soft delete lead source
        if (empty($source_id)) {
            $response = ['status' => 'error', 'message' => 'Source ID is required'];
            break;
        }

        // Check if lead source exists
        $checkQuery = "SELECT source_name FROM tbl_lead_source 
                       WHERE source_id = '$source_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Lead source not found or already deleted'];
            break;
        }

        $sourceData = mysqli_fetch_assoc($checkResult);

        // Soft delete lead source
        $query = "UPDATE tbl_lead_source SET is_deleted = '2' WHERE source_id = '$source_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('lead-source', "Lead source deleted: {$sourceData['source_name']} (ID: $source_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Lead source deleted successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('lead-source', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete lead source: ' . $error];
        }
        break;

    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('lead-source', "Invalid request type: $type");
}

logResponse('lead-source', $response);
echo json_encode($response);
mysqli_close($sql);
?>
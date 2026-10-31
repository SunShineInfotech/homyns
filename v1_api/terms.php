<?php
// v1_api/terms.php
require_once 'dbconnection.php';

// Get POST data
$postData = json_decode(file_get_contents('php://input'), true);

// Log request
logRequest('terms', $postData);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('terms', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$terms_id = isset($postData['terms_id']) ? mysqli_real_escape_string($sql, $postData['terms_id']) : '';
$title = isset($postData['title']) ? mysqli_real_escape_string($sql, $postData['title']) : '';
$content = isset($postData['content']) ? mysqli_real_escape_string($sql, $postData['content']) : '';
$sort_order = isset($postData['sort_order']) ? intval($postData['sort_order']) : 0;

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // ADD
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        if (empty($title)) {
            $response = ['status' => 'error', 'message' => 'Title is required'];
            break;
        }
        
        // Check if term already exists
        $checkQuery = "SELECT terms_id FROM tbl_terms 
                       WHERE company_id = '$company_id' 
                       AND title = '$title' 
                       AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) > 0) {
            $response = ['status' => 'error', 'message' => 'Term with this title already exists'];
            break;
        }
        
        // Insert new term
        $query = "INSERT INTO tbl_terms (company_id, title, content, sort_order, is_deleted, c_date) 
                  VALUES ('$company_id', '$title', '$content', '$sort_order', '1', '$c_date')";
        
        if (mysqli_query($sql, $query)) {
            $new_id = mysqli_insert_id($sql);
            logMessage('terms', "New term added: $title (ID: $new_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Term added successfully',
                'terms_id' => $new_id
            ];
        } else {
            $error = mysqli_error($sql);
            logError('terms', $error);
            $response = ['status' => 'error', 'message' => 'Failed to add term: ' . $error];
        }
        break;
        
    case 2: // UPDATE
        if (empty($terms_id)) {
            $response = ['status' => 'error', 'message' => 'Term ID is required'];
            break;
        }
        
        if (empty($title)) {
            $response = ['status' => 'error', 'message' => 'Title is required'];
            break;
        }
        
        // Check if term exists
        $checkQuery = "SELECT terms_id FROM tbl_terms 
                       WHERE terms_id = '$terms_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Term not found'];
            break;
        }
        
        // Update term
        $query = "UPDATE tbl_terms 
                  SET title = '$title', 
                      content = '$content', 
                      sort_order = '$sort_order' 
                  WHERE terms_id = '$terms_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('terms', "Term updated: $title (ID: $terms_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Term updated successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('terms', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update term: ' . $error];
        }
        break;
        
    case 3: // SELECT
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        $query = "SELECT terms_id, company_id, title, content, sort_order, is_deleted, c_date 
                  FROM tbl_terms 
                  WHERE company_id = '$company_id' AND is_deleted = '1'
                  ORDER BY sort_order ASC, title ASC";
        
        $result = mysqli_query($sql, $query);
        
        if ($result) {
            $terms = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $terms[] = $row;
            }
            
            logMessage('terms', "Fetched " . count($terms) . " terms", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Terms fetched successfully',
                'data' => $terms,
                'total' => count($terms)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('terms', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch terms: ' . $error];
        }
        break;
        
    case 4: // DELETE
        if (empty($terms_id)) {
            $response = ['status' => 'error', 'message' => 'Term ID is required'];
            break;
        }
        
        $checkQuery = "SELECT title FROM tbl_terms 
                       WHERE terms_id = '$terms_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Term not found or already deleted'];
            break;
        }
        
        $termData = mysqli_fetch_assoc($checkResult);
        
        $query = "UPDATE tbl_terms SET is_deleted = '2' WHERE terms_id = '$terms_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('terms', "Term deleted: {$termData['title']} (ID: $terms_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Term deleted successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('terms', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete term: ' . $error];
        }
        break;
        
    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('terms', "Invalid request type: $type");
}

// Log response
logResponse('terms', $response);

echo json_encode($response);
mysqli_close($sql);
?>
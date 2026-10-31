<?php
// v1_api/project-type.php
require_once 'dbconnection.php';

$postData = json_decode(file_get_contents('php://input'), true);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$project_type_id = isset($postData['project_type_id']) ? mysqli_real_escape_string($sql, $postData['project_type_id']) : '';
$project_type_name = isset($postData['project_type_name']) ? mysqli_real_escape_string($sql, $postData['project_type_name']) : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // ADD
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($project_type_name)) {
            $response = ['status' => 'error', 'message' => 'Project type name is required'];
            break;
        }

        $checkQuery = "SELECT project_type_id FROM tbl_project_type 
                       WHERE company_id = '$company_id' 
                       AND project_type_name = '$project_type_name' 
                       AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) > 0) {
            $response = ['status' => 'error', 'message' => 'Project type already exists'];
            break;
        }

        $query = "INSERT INTO tbl_project_type (company_id, project_type_name, is_deleted, c_date) 
                  VALUES ('$company_id', '$project_type_name', '1', '$c_date')";
        
        if (mysqli_query($sql, $query)) {
            $new_id = mysqli_insert_id($sql);
            $response = [
                'status' => 'success',
                'message' => 'Project type added successfully',
                'project_type_id' => $new_id
            ];
        } else {
            $response = ['status' => 'error', 'message' => mysqli_error($sql)];
        }
        break;

    case 2: // UPDATE
        if (empty($project_type_id)) {
            $response = ['status' => 'error', 'message' => 'Project type ID is required'];
            break;
        }
        if (empty($project_type_name)) {
            $response = ['status' => 'error', 'message' => 'Project type name is required'];
            break;
        }

        $query = "UPDATE tbl_project_type 
                  SET project_type_name = '$project_type_name' 
                  WHERE project_type_id = '$project_type_id'";
        
        if (mysqli_query($sql, $query)) {
            $response = ['status' => 'success', 'message' => 'Project type updated successfully'];
        } else {
            $response = ['status' => 'error', 'message' => mysqli_error($sql)];
        }
        break;

    case 3: // SELECT
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }

        $query = "SELECT project_type_id, company_id, project_type_name, is_deleted, c_date 
                  FROM tbl_project_type 
                  WHERE company_id = '$company_id' AND is_deleted = '1'
                  ORDER BY project_type_name ASC";
        
        $result = mysqli_query($sql, $query);
        
        if ($result) {
            $types = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $types[] = $row;
            }
            $response = [
                'status' => 'success',
                'message' => 'Project types fetched successfully',
                'data' => $types,
                'total' => count($types)
            ];
        } else {
            $response = ['status' => 'error', 'message' => mysqli_error($sql)];
        }
        break;

    case 4: // DELETE
        if (empty($project_type_id)) {
            $response = ['status' => 'error', 'message' => 'Project type ID is required'];
            break;
        }

        $query = "UPDATE tbl_project_type SET is_deleted = '2' WHERE project_type_id = '$project_type_id'";
        
        if (mysqli_query($sql, $query)) {
            $response = ['status' => 'success', 'message' => 'Project type deleted successfully'];
        } else {
            $response = ['status' => 'error', 'message' => mysqli_error($sql)];
        }
        break;

    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
}

echo json_encode($response);
mysqli_close($sql);
?>
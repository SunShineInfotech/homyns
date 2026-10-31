<?php
// v1_api/state.php
require_once 'dbconnection.php';

// Get POST data
$postData = json_decode(file_get_contents('php://input'), true);

// Log request
logRequest('state', $postData);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('state', $response);
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

$type       = isset($postData['type'])       ? intval($postData['type'])                                    : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id'])     : '';
$state_id   = isset($postData['state_id'])   ? mysqli_real_escape_string($sql, $postData['state_id'])       : '';
$state_name = isset($postData['state_name']) ? mysqli_real_escape_string($sql, trim($postData['state_name'])) : '';
$state_code = isset($postData['state_code']) ? mysqli_real_escape_string($sql, strtoupper(trim($postData['state_code']))) : '';

// Always use server-side timestamp — never rely on undefined $c_date
$c_date = date('Y-m-d H:i:s');

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {

    // ------------------------------------------------------------------ ADD
    case 1:
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($state_name)) {
            $response = ['status' => 'error', 'message' => 'State name is required'];
            break;
        }

        // Duplicate check (case-insensitive)
        $checkQuery = "SELECT state_id FROM tbl_state
                       WHERE company_id = '$company_id'
                         AND LOWER(state_name) = LOWER('$state_name')
                         AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);

        if ($checkResult && mysqli_num_rows($checkResult) > 0) {
            $response = ['status' => 'error', 'message' => 'State already exists'];
            break;
        }

        $query = "INSERT INTO tbl_state (company_id, state_name, state_code, is_deleted, c_date)
                  VALUES ('$company_id', '$state_name', '$state_code', '1', '$c_date')";

        if (mysqli_query($sql, $query)) {
            $new_id = mysqli_insert_id($sql);
            logMessage('state', "New state added: $state_name (ID: $new_id)", 'INFO');

            $response = [
                'status'  => 'success',
                'message' => 'State added successfully',
                'data'    => [
                    'state_id'   => (string)$new_id,
                    'state_name' => $state_name,
                    'state_code' => $state_code,
                    'company_id' => $company_id,
                    'is_deleted' => '1',
                    'c_date'     => $c_date
                ]
            ];
        } else {
            $error = mysqli_error($sql);
            logError('state', $error);
            $response = ['status' => 'error', 'message' => 'Failed to add state: ' . $error];
        }
        break;

    // --------------------------------------------------------------- UPDATE
    case 2:
        if (empty($state_id)) {
            $response = ['status' => 'error', 'message' => 'State ID is required'];
            break;
        }
        if (empty($state_name)) {
            $response = ['status' => 'error', 'message' => 'State name is required'];
            break;
        }

        // Existence check
        $checkQuery = "SELECT state_id, company_id FROM tbl_state
                       WHERE state_id = '$state_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);

        if (!$checkResult || mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'State not found'];
            break;
        }

        $existingRow = mysqli_fetch_assoc($checkResult);

        // Duplicate name check (excluding current record)
        $dupCheck = "SELECT state_id FROM tbl_state
                     WHERE company_id = '{$existingRow['company_id']}'
                       AND LOWER(state_name) = LOWER('$state_name')
                       AND state_id != '$state_id'
                       AND is_deleted = '1'";
        $dupResult = mysqli_query($sql, $dupCheck);

        if ($dupResult && mysqli_num_rows($dupResult) > 0) {
            $response = ['status' => 'error', 'message' => 'Another state with this name already exists'];
            break;
        }

        $query = "UPDATE tbl_state
                  SET state_name = '$state_name', state_code = '$state_code'
                  WHERE state_id = '$state_id'";

        if (mysqli_query($sql, $query)) {
            logMessage('state', "State updated: $state_name (ID: $state_id)", 'INFO');

            $response = [
                'status'  => 'success',
                'message' => 'State updated successfully',
                'data'    => [
                    'state_id'   => $state_id,
                    'state_name' => $state_name,
                    'state_code' => $state_code
                ]
            ];
        } else {
            $error = mysqli_error($sql);
            logError('state', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update state: ' . $error];
        }
        break;

    // --------------------------------------------------------------- SELECT
    case 3:
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }

        $query = "SELECT company_id, state_id, state_name, state_code, is_deleted, c_date
                  FROM tbl_state
                  WHERE company_id = '$company_id' AND is_deleted = '1'
                  ORDER BY state_name ASC";

        $result = mysqli_query($sql, $query);

        if ($result) {
            $states = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $states[] = $row;
            }
            logMessage('state', 'Fetched ' . count($states) . ' states', 'INFO');

            $response = [
                'status'  => 'success',
                'message' => 'States fetched successfully',
                'data'    => $states,
                'total'   => count($states)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('state', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch states: ' . $error];
        }
        break;

    // --------------------------------------------------------------- DELETE
    case 4:
        if (empty($state_id)) {
            $response = ['status' => 'error', 'message' => 'State ID is required'];
            break;
        }

        $checkQuery = "SELECT state_name FROM tbl_state
                       WHERE state_id = '$state_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);

        if (!$checkResult || mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'State not found or already deleted'];
            break;
        }

        $stateData = mysqli_fetch_assoc($checkResult);

        $query = "UPDATE tbl_state SET is_deleted = '2' WHERE state_id = '$state_id'";

        if (mysqli_query($sql, $query)) {
            logMessage('state', "State deleted: {$stateData['state_name']} (ID: $state_id)", 'INFO');

            $response = [
                'status'  => 'success',
                'message' => 'State deleted successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('state', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete state: ' . $error];
        }
        break;

    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('state', "Invalid request type: $type");
}

logResponse('state', $response);

header('Content-Type: application/json');
echo json_encode($response);
mysqli_close($sql);
?>
<?php
// v1_api/followup.php
require_once 'dbconnection.php';

$postData = json_decode(file_get_contents('php://input'), true);

if (empty($postData)) {
    echo json_encode(['status' => 'error', 'message' => 'No data received']);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$followup_id = isset($postData['followup_id']) ? mysqli_real_escape_string($sql, $postData['followup_id']) : '';
$lead_id = isset($postData['lead_id']) ? mysqli_real_escape_string($sql, $postData['lead_id']) : '';
$followup_date = isset($postData['followup_date']) ? mysqli_real_escape_string($sql, $postData['followup_date']) : date('Y-m-d');
$next_followup_date = isset($postData['next_followup_date']) ? mysqli_real_escape_string($sql, $postData['next_followup_date']) : '';
$followup_by = isset($postData['followup_by']) ? mysqli_real_escape_string($sql, $postData['followup_by']) : '';
$mode = isset($postData['mode']) ? mysqli_real_escape_string($sql, $postData['mode']) : 'Call';
$remark = isset($postData['remark']) ? mysqli_real_escape_string($sql, $postData['remark']) : '';
$status_update = isset($postData['status_update']) ? mysqli_real_escape_string($sql, $postData['status_update']) : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // ADD
        if (empty($company_id) || empty($lead_id) || empty($remark)) {
            $response = ['status' => 'error', 'message' => 'Company, lead and remark are required'];
            break;
        }
        $query = "INSERT INTO tbl_lead_followup (company_id, lead_id, followup_date, next_followup_date, followup_by, mode, remark, status_update, is_deleted, c_date) 
                  VALUES ('$company_id', '$lead_id', '$followup_date', '$next_followup_date', '$followup_by', '$mode', '$remark', '$status_update', '1', '$c_date')";
        if (mysqli_query($sql, $query)) {
            $response = ['status' => 'success', 'message' => 'Followup added', 'followup_id' => mysqli_insert_id($sql)];
        } else {
            $response = ['status' => 'error', 'message' => mysqli_error($sql)];
        }
        break;

    case 2: // UPDATE
        if (empty($followup_id)) {
            $response = ['status' => 'error', 'message' => 'Followup ID required'];
            break;
        }
        $query = "UPDATE tbl_lead_followup SET followup_date='$followup_date', next_followup_date='$next_followup_date', followup_by='$followup_by', mode='$mode', remark='$remark', status_update='$status_update' WHERE followup_id='$followup_id'";
        if (mysqli_query($sql, $query)) {
            $response = ['status' => 'success', 'message' => 'Followup updated'];
        } else {
            $response = ['status' => 'error', 'message' => mysqli_error($sql)];
        }
        break;

    case 3: // SELECT
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID required'];
            break;
        }
        $followupType = isset($postData['followup_type']) ? $postData['followup_type'] : 'all';
        $empId = isset($postData['emp_id']) ? mysqli_real_escape_string($sql, $postData['emp_id']) : '';
        
        // Filters
        $filterEmployeeId = isset($postData['filter_employee_id']) ? mysqli_real_escape_string($sql, $postData['filter_employee_id']) : '';
        $filterLeadId = isset($postData['filter_lead_id']) ? mysqli_real_escape_string($sql, $postData['filter_lead_id']) : '';
        $filterSourceId = isset($postData['filter_source_id']) ? mysqli_real_escape_string($sql, $postData['filter_source_id']) : '';
        $filterStatusId = isset($postData['filter_status']) ? mysqli_real_escape_string($sql, $postData['filter_status']) : '';
        $startDate = isset($postData['start_date']) ? mysqli_real_escape_string($sql, $postData['start_date']) : '';
        $endDate = isset($postData['end_date']) ? mysqli_real_escape_string($sql, $postData['end_date']) : '';
        
        $query = "SELECT f.*, l.lead_name, l.phone1 as lead_phone, e.name as followup_by_name 
                  FROM tbl_lead_followup f
                  LEFT JOIN tbl_lead l ON f.lead_id = l.lead_id
                  LEFT JOIN tbl_employee e ON f.followup_by = e.emp_id
                  WHERE f.company_id = '$company_id' AND f.is_deleted = '1'";
        
        if ($followupType === 'my' && !empty($empId)) {
            $query .= " AND f.followup_by = '$empId'";
        }
        if ($followupType === 'my_today' && !empty($empId)) {
            $query .= " AND f.followup_by = '$empId' AND f.followup_date = CURDATE()";
        }
        
        // Apply filters
        if (!empty($filterEmployeeId)) {
            $query .= " AND f.followup_by = '$filterEmployeeId'";
        }
        if (!empty($filterLeadId)) {
            $query .= " AND f.lead_id = '$filterLeadId'";
        }
        if (!empty($filterSourceId)) {
            $query .= " AND l.source_id = '$filterSourceId'";
        }
        if (!empty($filterStatusId)) {
            $query .= " AND l.status = '$filterStatusId'";
        }
        if (!empty($startDate)) {
            $query .= " AND DATE(f.followup_date) >= '$startDate'";
        }
        if (!empty($endDate)) {
            $query .= " AND DATE(f.followup_date) <= '$endDate'";
        }
        
        $query .= " ORDER BY f.followup_date DESC, f.c_date DESC";
        
        $result = mysqli_query($sql, $query);
        $followups = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $followups[] = $row;
        }
        $response = ['status' => 'success', 'message' => 'Followups fetched', 'data' => $followups];
        break;

    case 4: // SELECT BY LEAD
        if (empty($lead_id)) {
            $response = ['status' => 'error', 'message' => 'Lead ID required'];
            break;
        }
        $query = "SELECT f.*, e.name as followup_by_name 
                  FROM tbl_lead_followup f
                  LEFT JOIN tbl_employee e ON f.followup_by = e.emp_id
                  WHERE f.lead_id = '$lead_id' AND f.is_deleted = '1'
                  ORDER BY f.followup_date DESC, f.c_date DESC";
        $result = mysqli_query($sql, $query);
        $followups = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $followups[] = $row;
        }
        $response = ['status' => 'success', 'message' => 'Followups fetched', 'data' => $followups];
        break;

    case 5: // DELETE
        if (empty($followup_id)) {
            $response = ['status' => 'error', 'message' => 'Followup ID required'];
            break;
        }
        $query = "UPDATE tbl_lead_followup SET is_deleted = '2' WHERE followup_id = '$followup_id'";
        if (mysqli_query($sql, $query)) {
            $response = ['status' => 'success', 'message' => 'Followup deleted'];
        } else {
            $response = ['status' => 'error', 'message' => mysqli_error($sql)];
        }
        break;

    case 6: // TRANSFER FOLLOWUPS
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID required'];
            break;
        }
        $followupIds = isset($postData['followup_ids']) ? $postData['followup_ids'] : [];
        $targetEmployeeId = isset($postData['target_employee_id']) ? mysqli_real_escape_string($sql, $postData['target_employee_id']) : '';
        
        if (empty($followupIds) || !is_array($followupIds)) {
            $response = ['status' => 'error', 'message' => 'No followups selected'];
            break;
        }
        if (empty($targetEmployeeId)) {
            $response = ['status' => 'error', 'message' => 'Target employee required'];
            break;
        }
        
        $ids = array_map(function($id) use ($sql) {
            return "'" . mysqli_real_escape_string($sql, $id) . "'";
        }, $followupIds);
        $idsString = implode(',', $ids);
        
        $query = "UPDATE tbl_lead_followup SET followup_by = '$targetEmployeeId' WHERE followup_id IN ($idsString) AND company_id = '$company_id' AND is_deleted = '1'";
        
        if (mysqli_query($sql, $query)) {
            $count = mysqli_affected_rows($sql);
            $response = ['status' => 'success', 'message' => "$count followups transferred", 'transferred' => $count];
        } else {
            $response = ['status' => 'error', 'message' => mysqli_error($sql)];
        }
        break;

    default:
        $response = ['status' => 'error', 'message' => 'Invalid type'];
}

echo json_encode($response);
mysqli_close($sql);
?>
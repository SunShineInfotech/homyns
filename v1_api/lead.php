<?php
// v1_api/lead.php
require_once 'dbconnection.php';

$postData = json_decode(file_get_contents('php://input'), true);

if (empty($postData)) {
    echo json_encode(['status' => 'error', 'message' => 'No data received']);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$lead_id = isset($postData['lead_id']) ? mysqli_real_escape_string($sql, $postData['lead_id']) : '';
$lead_name = isset($postData['lead_name']) ? mysqli_real_escape_string($sql, $postData['lead_name']) : '';
$phone1 = isset($postData['phone1']) ? mysqli_real_escape_string($sql, $postData['phone1']) : '';
$phone2 = isset($postData['phone2']) ? mysqli_real_escape_string($sql, $postData['phone2']) : '';
$whatsapp_number = isset($postData['whatsapp_number']) ? mysqli_real_escape_string($sql, $postData['whatsapp_number']) : '';
$email = isset($postData['email']) ? mysqli_real_escape_string($sql, $postData['email']) : '';
$address = isset($postData['address']) ? mysqli_real_escape_string($sql, $postData['address']) : '';
$state_id = isset($postData['state_id']) ? mysqli_real_escape_string($sql, $postData['state_id']) : '';
$city_id = isset($postData['city_id']) ? mysqli_real_escape_string($sql, $postData['city_id']) : '';
$area_id = isset($postData['area_id']) ? mysqli_real_escape_string($sql, $postData['area_id']) : '';
$source_id = isset($postData['source_id']) ? mysqli_real_escape_string($sql, $postData['source_id']) : '';
$requirement = isset($postData['requirement']) ? mysqli_real_escape_string($sql, $postData['requirement']) : '';
$budget = isset($postData['budget']) ? floatval($postData['budget']) : 0;
$assigned_to = isset($postData['assigned_to']) ? mysqli_real_escape_string($sql, $postData['assigned_to']) : '';
$status = isset($postData['status']) ? mysqli_real_escape_string($sql, $postData['status']) : '';
// New fields
$project_name = isset($postData['project_name']) ? mysqli_real_escape_string($sql, $postData['project_name']) : '';
$house_number = isset($postData['house_number']) ? mysqli_real_escape_string($sql, $postData['house_number']) : '';
$project_type_id = isset($postData['project_type_id']) ? mysqli_real_escape_string($sql, $postData['project_type_id']) : '';
$person_name = isset($postData['person_name']) ? mysqli_real_escape_string($sql, $postData['person_name']) : '';
$light_bill = isset($postData['light_bill']) ? mysqli_real_escape_string($sql, $postData['light_bill']) : '';
$light_load = isset($postData['light_load']) ? mysqli_real_escape_string($sql, $postData['light_load']) : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // ADD
        if (empty($company_id) || empty($lead_name) || empty($phone1)) {
            $response = ['status' => 'error', 'message' => 'Company, name and phone are required'];
            break;
        }
        $query = "INSERT INTO tbl_lead (company_id, lead_name, phone1, phone2, whatsapp_number, email, address, state_id, city_id, area_id, source_id, requirement, budget, assigned_to, status, project_name, house_number, project_type_id, is_deleted, c_date) 
                  VALUES ('$company_id', '$lead_name', '$phone1', '$phone2', '$whatsapp_number', '$email', '$address', '$state_id', '$city_id', '$area_id', '$source_id', '$requirement', '$budget', '$assigned_to', '$status', '$project_name', '$house_number', '$project_type_id', '1', '$c_date')";
        if (mysqli_query($sql, $query)) {
            $response = ['status' => 'success', 'message' => 'Lead added', 'lead_id' => mysqli_insert_id($sql)];
        } else {
            $response = ['status' => 'error', 'message' => mysqli_error($sql)];
        }
        break;

    case 2: // UPDATE
        if (empty($lead_id)) {
            $response = ['status' => 'error', 'message' => 'Lead ID required'];
            break;
        }
        $query = "UPDATE tbl_lead SET lead_name='$lead_name', phone1='$phone1', phone2='$phone2', whatsapp_number='$whatsapp_number', email='$email', address='$address', state_id='$state_id', city_id='$city_id', area_id='$area_id', source_id='$source_id', requirement='$requirement', budget='$budget', assigned_to='$assigned_to', status='$status', project_name='$project_name', house_number='$house_number', project_type_id='$project_type_id' WHERE lead_id='$lead_id'";
        if (mysqli_query($sql, $query)) {
            $response = ['status' => 'success', 'message' => 'Lead updated'];
        } else {
            $response = ['status' => 'error', 'message' => mysqli_error($sql)];
        }
        break;

    case 3: // SELECT
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID required'];
            break;
        }
        $leadType = isset($postData['lead_type']) ? $postData['lead_type'] : 'all';
        $empId = isset($postData['emp_id']) ? mysqli_real_escape_string($sql, $postData['emp_id']) : '';
        
        // Filters
        $filterEmployeeId = isset($postData['filter_employee_id']) ? mysqli_real_escape_string($sql, $postData['filter_employee_id']) : '';
        $filterSourceId = isset($postData['filter_source_id']) ? mysqli_real_escape_string($sql, $postData['filter_source_id']) : '';
        $filterStatusId = isset($postData['filter_status']) ? mysqli_real_escape_string($sql, $postData['filter_status']) : '';
        $filterAssignedTo = isset($postData['filter_assigned_to']) ? mysqli_real_escape_string($sql, $postData['filter_assigned_to']) : '';
        $startDate = isset($postData['start_date']) ? mysqli_real_escape_string($sql, $postData['start_date']) : '';
        $endDate = isset($postData['end_date']) ? mysqli_real_escape_string($sql, $postData['end_date']) : '';
        
        $query = "SELECT l.*, s.state_name, c.city_name, a.area_name, ls.source_name, e.name as assigned_emp_name, st.status_name, pt.project_type_name
                  FROM tbl_lead l
                  LEFT JOIN tbl_state s ON l.state_id = s.state_id
                  LEFT JOIN tbl_city c ON l.city_id = c.city_id
                  LEFT JOIN tbl_area a ON l.area_id = a.area_id
                  LEFT JOIN tbl_lead_source ls ON l.source_id = ls.source_id
                  LEFT JOIN tbl_employee e ON l.assigned_to = e.emp_id
                  LEFT JOIN tbl_lead_status st ON l.status = st.status_id
                  LEFT JOIN tbl_project_type pt ON l.project_type_id = pt.project_type_id
                  WHERE l.company_id = '$company_id' AND l.is_deleted = '1' ";
        
        if ($leadType === 'my' && !empty($empId)) {
            $query .= " AND l.assigned_to = '$empId'";
        }
        
        // Apply filters
        if (!empty($filterEmployeeId)) {
            $query .= " AND l.assigned_to = '$filterEmployeeId'";
        }
        if (!empty($filterSourceId)) {
            $query .= " AND l.source_id = '$filterSourceId'";
        }
        if (!empty($filterStatusId)) {
            $query .= " AND l.status = '$filterStatusId'";
        }
        if (!empty($filterAssignedTo)) {
            $query .= " AND l.assigned_to = '$filterAssignedTo'";
        }
        if (!empty($startDate)) {
            $query .= " AND DATE(l.c_date) >= '$startDate'";
        }
        if (!empty($endDate)) {
            $query .= " AND DATE(l.c_date) <= '$endDate'";
        }
        
        $query .= "  ORDER BY l.lead_id DESC";
        
        $result = mysqli_query($sql, $query);
        $leads = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $leads[] = $row;
        }
        $response = ['status' => 'success', 'message' => 'Leads fetched', 'data' => $leads];
        break;

    case 4: // DELETE
        if (empty($lead_id)) {
            $response = ['status' => 'error', 'message' => 'Lead ID required'];
            break;
        }
        $query = "UPDATE tbl_lead SET is_deleted = '2' WHERE lead_id = '$lead_id'";
        if (mysqli_query($sql, $query)) {
            $response = ['status' => 'success', 'message' => 'Lead deleted'];
        } else {
            $response = ['status' => 'error', 'message' => mysqli_error($sql)];
        }
        break;

    case 5: // SELECT SINGLE
        if (empty($lead_id)) {
            $response = ['status' => 'error', 'message' => 'Lead ID required'];
            break;
        }
        $query = "SELECT l.*, s.state_name, c.city_name, a.area_name, ls.source_name, e.name as assigned_emp_name, st.status_name, pt.project_type_name
                  FROM tbl_lead l
                  LEFT JOIN tbl_state s ON l.state_id = s.state_id
                  LEFT JOIN tbl_city c ON l.city_id = c.city_id
                  LEFT JOIN tbl_area a ON l.area_id = a.area_id
                  LEFT JOIN tbl_lead_source ls ON l.source_id = ls.source_id
                  LEFT JOIN tbl_employee e ON l.assigned_to = e.emp_id
                  LEFT JOIN tbl_lead_status st ON l.status = st.status_id
                  LEFT JOIN tbl_project_type pt ON l.project_type_id = pt.project_type_id
                  WHERE l.lead_id = '$lead_id' AND l.is_deleted = '1'";
        $result = mysqli_query($sql, $query);
        if ($row = mysqli_fetch_assoc($result)) {
            $response = ['status' => 'success', 'message' => 'Lead fetched', 'data' => $row];
        } else {
            $response = ['status' => 'error', 'message' => 'Lead not found'];
        }
        break;

    case 6: // CONVERT TO CLIENT
        if (empty($lead_id)) {
            $response = ['status' => 'error', 'message' => 'Lead ID required'];
            break;
        }
        
        // Get lead data
        $leadQuery = "SELECT * FROM tbl_lead WHERE lead_id = '$lead_id' AND is_deleted = '1'";
        $leadResult = mysqli_query($sql, $leadQuery);
        if (!$leadRow = mysqli_fetch_assoc($leadResult)) {
            $response = ['status' => 'error', 'message' => 'Lead not found'];
            break;
        }
        
        // Check if already converted
        if (!empty($leadRow['converted_client_id'])) {
            $response = ['status' => 'error', 'message' => 'Lead already converted to client'];
            break;
        }
        
        // Insert into client table
        $clientQuery = "INSERT INTO tbl_client (company_id, client_name, client_email, gender, phone1, phone2, whatsapp_number, address, state_id, city_id, area_id, wallet, status, is_deleted, c_date) 
                        VALUES ('{$leadRow['company_id']}', '{$leadRow['lead_name']}', '{$leadRow['email']}', '', '{$leadRow['phone1']}', '{$leadRow['phone2']}', '{$leadRow['whatsapp_number']}', '{$leadRow['address']}', '{$leadRow['state_id']}', '{$leadRow['city_id']}', '{$leadRow['area_id']}', '0', 'Active', '1', '$c_date')";
        
        if (mysqli_query($sql, $clientQuery)) {
            $clientId = mysqli_insert_id($sql);
            
            // Update lead with converted client ID
            $updateQuery = "UPDATE tbl_lead SET converted_client_id = '$clientId' WHERE lead_id = '$lead_id'";
            mysqli_query($sql, $updateQuery);
            
            $response = ['status' => 'success', 'message' => 'Lead converted to client', 'client_id' => $clientId];
        } else {
            $response = ['status' => 'error', 'message' => mysqli_error($sql)];
        }
        break;

    case 7: // TRANSFER LEADS
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID required'];
            break;
        }
        $leadIds = isset($postData['lead_ids']) ? $postData['lead_ids'] : [];
        $targetEmployeeId = isset($postData['target_employee_id']) ? mysqli_real_escape_string($sql, $postData['target_employee_id']) : '';
        
        if (empty($leadIds) || !is_array($leadIds)) {
            $response = ['status' => 'error', 'message' => 'No leads selected'];
            break;
        }
        if (empty($targetEmployeeId)) {
            $response = ['status' => 'error', 'message' => 'Target employee required'];
            break;
        }
        
        $ids = array_map(function($id) use ($sql) {
            return "'" . mysqli_real_escape_string($sql, $id) . "'";
        }, $leadIds);
        $idsString = implode(',', $ids);
        
        $query = "UPDATE tbl_lead SET assigned_to = '$targetEmployeeId' WHERE lead_id IN ($idsString) AND company_id = '$company_id' AND is_deleted = '1'";
        
        if (mysqli_query($sql, $query)) {
            $count = mysqli_affected_rows($sql);
            $response = ['status' => 'success', 'message' => "$count leads transferred", 'transferred' => $count];
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
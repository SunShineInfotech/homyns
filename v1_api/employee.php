<?php
require_once 'dbconnection.php';

// Check if it's a file upload (FormData)
$isFileUpload = isset($_POST['type']) && (!empty($_FILES) || isset($_POST['login_code']));

if ($isFileUpload) {
    // Handle file upload - data comes from $_POST
    $type = isset($_POST['type']) ? intval($_POST['type']) : 0;
    $company_id = isset($_POST['company_id']) ? mysqli_real_escape_string($sql, $_POST['company_id']) : '';
    $emp_id = isset($_POST['emp_id']) ? mysqli_real_escape_string($sql, $_POST['emp_id']) : '';
    $login_code = isset($_POST['login_code']) ? mysqli_real_escape_string($sql, $_POST['login_code']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    $name = isset($_POST['name']) ? mysqli_real_escape_string($sql, $_POST['name']) : '';
    $employee_number = isset($_POST['employee_number']) ? mysqli_real_escape_string($sql, trim($_POST['employee_number'])) : '';
    $phone1 = isset($_POST['phone1']) ? mysqli_real_escape_string($sql, $_POST['phone1']) : '';
    $phone2 = isset($_POST['phone2']) ? mysqli_real_escape_string($sql, $_POST['phone2']) : '';
    $email = isset($_POST['email']) ? mysqli_real_escape_string($sql, $_POST['email']) : '';
    $gender = isset($_POST['gender']) ? mysqli_real_escape_string($sql, $_POST['gender']) : '';
    $aadhar_card = isset($_POST['aadhar_card']) ? mysqli_real_escape_string($sql, $_POST['aadhar_card']) : '';
    $pan_card = isset($_POST['pan_card']) ? mysqli_real_escape_string($sql, $_POST['pan_card']) : '';
    $address = isset($_POST['address']) ? mysqli_real_escape_string($sql, $_POST['address']) : '';
    $joining_date = isset($_POST['joining_date']) ? mysqli_real_escape_string($sql, $_POST['joining_date']) : '';
    $birth_date = isset($_POST['birth_date']) ? mysqli_real_escape_string($sql, $_POST['birth_date']) : '';
    $access_pages = isset($_POST['access_pages']) ? mysqli_real_escape_string($sql, $_POST['access_pages']) : '';
    $status = isset($_POST['status']) ? mysqli_real_escape_string($sql, $_POST['status']) : 'Active';

    logRequest('employee', $_POST);
    
    // Upload directory
    $upload_dir = '../uploadfiles/employee/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    $image_name = '';
    $image_uploaded = false;
    
    // Handle image upload
    if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['profile_image'];
        $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        
        if (!in_array($file_ext, $allowed_ext)) {
            $response = ['status' => 'error', 'message' => 'Invalid file type. Allowed: JPG, PNG, GIF, WEBP, SVG'];
            echo json_encode($response);
            exit;
        }
        
        $image_name = time() . '_' . uniqid() . '.' . $file_ext;
        $upload_path = $upload_dir . $image_name;
        
        if (move_uploaded_file($file['tmp_name'], $upload_path)) {
            $image_uploaded = true;
        } else {
            $response = ['status' => 'error', 'message' => 'Failed to upload image'];
            echo json_encode($response);
            exit;
        }
    }
    
    $response = ['status' => 'error', 'message' => 'Invalid request'];
    
    switch ($type) {
        case 1: // ADD
            if (empty($company_id)) {
                $response = ['status' => 'error', 'message' => 'Company ID is required'];
                break;
            }
            if (empty($login_code)) {
                $response = ['status' => 'error', 'message' => 'Login code is required'];
                break;
            }
            if (empty($name)) {
                $response = ['status' => 'error', 'message' => 'Employee name is required'];
                break;
            }
            if (empty($password)) {
                $response = ['status' => 'error', 'message' => 'Password is required'];
                break;
            }
            
            // Check if login code already exists
            $checkQuery = "SELECT emp_id FROM tbl_employee 
                           WHERE company_id = '$company_id' 
                           AND login_code = '$login_code' 
                           AND is_deleted = '1'";
            $checkResult = mysqli_query($sql, $checkQuery);
            
            if (mysqli_num_rows($checkResult) > 0) {
                $response = ['status' => 'error', 'message' => 'Login code already exists'];
                break;
            }
            
            // Hash password with MD5
            $hashed_password = md5($password);
            
            // Insert employee
            $query = "INSERT INTO tbl_employee 
                      (company_id, login_code, password, name, employee_number, phone1, phone2, email, 
                       gender, aadhar_card, pan_card, address, joining_date, birth_date, 
                       profile_image, access_pages, status, is_deleted, c_date) 
                      VALUES 
                      ('$company_id', '$login_code', '$hashed_password', '$name', '$employee_number', '$phone1', '$phone2', '$email',
                       '$gender', '$aadhar_card', '$pan_card', '$address', '$joining_date', '$birth_date',
                       '$image_name', '$access_pages', '$status', '1', '$c_date')";
            
            if (mysqli_query($sql, $query)) {
                $new_id = mysqli_insert_id($sql);
                logMessage('employee', "New employee added: $name (ID: $new_id)", 'INFO');
                
                $response = [
                    'status' => 'success',
                    'message' => 'Employee added successfully',
                    'emp_id' => $new_id
                ];
            } else {
                $error = mysqli_error($sql);
                logError('employee', $error);
                $response = ['status' => 'error', 'message' => 'Failed to add employee: ' . $error];
            }
            break;
            
        case 2: // UPDATE
            if (empty($emp_id)) {
                $response = ['status' => 'error', 'message' => 'Employee ID is required'];
                break;
            }
            if (empty($login_code)) {
                $response = ['status' => 'error', 'message' => 'Login code is required'];
                break;
            }
            if (empty($name)) {
                $response = ['status' => 'error', 'message' => 'Employee name is required'];
                break;
            }
            
            // Check if employee exists
            $checkQuery = "SELECT profile_image FROM tbl_employee 
                           WHERE emp_id = '$emp_id' AND is_deleted = '1'";
            $checkResult = mysqli_query($sql, $checkQuery);
            
            if (mysqli_num_rows($checkResult) == 0) {
                $response = ['status' => 'error', 'message' => 'Employee not found'];
                break;
            }
            
            $oldData = mysqli_fetch_assoc($checkResult);
            
            // Build image field
            $image_field = '';
            if ($image_uploaded) {
                $image_field = "profile_image = '$image_name',";
                if (!empty($oldData['profile_image']) && file_exists($upload_dir . $oldData['profile_image'])) {
                    unlink($upload_dir . $oldData['profile_image']);
                }
            }
            
            // Update employee
            $query = "UPDATE tbl_employee 
                      SET login_code = '$login_code', 
                          name = '$name', 
                          employee_number = '$employee_number',
                          phone1 = '$phone1', 
                          phone2 = '$phone2', 
                          email = '$email', 
                          gender = '$gender', 
                          aadhar_card = '$aadhar_card', 
                          pan_card = '$pan_card', 
                          address = '$address', 
                          joining_date = '$joining_date', 
                          birth_date = '$birth_date', 
                          access_pages = '$access_pages', 
                          status = '$status'";
            
            if (!empty($image_field)) {
                $query .= ", $image_field";
            }
            
            $query .= " WHERE emp_id = '$emp_id'";
            
            if (mysqli_query($sql, $query)) {
                logMessage('employee', "Employee updated: $name (ID: $emp_id)", 'INFO');
                
                $response = [
                    'status' => 'success',
                    'message' => 'Employee updated successfully'
                ];
            } else {
                $error = mysqli_error($sql);
                logError('employee', $error);
                $response = ['status' => 'error', 'message' => 'Failed to update employee: ' . $error];
            }
            break;
            
        default:
            $response = ['status' => 'error', 'message' => 'Invalid request type'];
            logError('employee', "Invalid request type: $type");
    }
    
    logResponse('employee', $response);
    echo json_encode($response);
    mysqli_close($sql);
    exit;
}

// Handle JSON requests (non-file upload)
$postData = json_decode(file_get_contents('php://input'), true);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('employee', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$emp_id = isset($postData['emp_id']) ? mysqli_real_escape_string($sql, $postData['emp_id']) : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 3: // SELECT
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        $query = "SELECT emp_id, company_id, login_code, name, employee_number, phone1, phone2, email, 
                         gender, aadhar_card, pan_card, address, joining_date, birth_date, 
                         profile_image, access_pages, status, is_deleted, c_date 
                  FROM tbl_employee 
                  WHERE company_id = '$company_id' AND is_deleted = '1'
                  ORDER BY name ASC";
        
        $result = mysqli_query($sql, $query);
        
        if ($result) {
            $employees = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $employees[] = $row;
            }
            
            logMessage('employee', "Fetched " . count($employees) . " employees", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Employees fetched successfully',
                'data' => $employees,
                'total' => count($employees)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('employee', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch employees: ' . $error];
        }
        break;
        
    case 4: // DELETE
        if (empty($emp_id)) {
            $response = ['status' => 'error', 'message' => 'Employee ID is required'];
            break;
        }
        
        $checkQuery = "SELECT name FROM tbl_employee 
                       WHERE emp_id = '$emp_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Employee not found or already deleted'];
            break;
        }
        
        $employeeData = mysqli_fetch_assoc($checkResult);
        
        $query = "UPDATE tbl_employee SET is_deleted = '2' WHERE emp_id = '$emp_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('employee', "Employee deleted: {$employeeData['name']} (ID: $emp_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Employee deleted successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('employee', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete employee: ' . $error];
        }
        break;
        
    case 5: // CHANGE PASSWORD
        if (empty($emp_id)) {
            $response = ['status' => 'error', 'message' => 'Employee ID is required'];
            break;
        }
        
        $new_password = isset($postData['password']) ? $postData['password'] : '';
        
        if (empty($new_password) || strlen($new_password) < 4) {
            $response = ['status' => 'error', 'message' => 'Password must be at least 4 characters'];
            break;
        }
        
        $checkQuery = "SELECT emp_id FROM tbl_employee 
                       WHERE emp_id = '$emp_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Employee not found'];
            break;
        }
        
        $hashed_password = md5($new_password);
        $query = "UPDATE tbl_employee SET password = '$hashed_password' WHERE emp_id = '$emp_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('employee', "Password changed for employee ID: $emp_id", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Password changed successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('employee', $error);
            $response = ['status' => 'error', 'message' => 'Failed to change password: ' . $error];
        }
        break;
        
    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('employee', "Invalid request type: $type");
}

logResponse('employee', $response);
echo json_encode($response);
mysqli_close($sql);
?>

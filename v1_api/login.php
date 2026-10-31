<?php
// v1_api/login.php
require_once 'dbconnection.php';
require_once 'function.php';

// Get POST data
$postData = json_decode(file_get_contents('php://input'), true);

// Log request
logRequest('login', $postData);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('login', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_code = isset($postData['company_code']) ? mysqli_real_escape_string($sql, $postData['company_code']) : '';

// Generate unique token
function generateToken($length = 32) {
    return bin2hex(random_bytes($length));
}

// Check company existence
function verifyCompany($sql, $company_code) {
    $query = "SELECT * 
              FROM `tbl_company` 
              WHERE `company_code` = '$company_code' AND `is_deleted` = 1";
    $result = mysqli_query($sql, $query);
    
    if (mysqli_num_rows($result) > 0) {
        return mysqli_fetch_assoc($result);
    }
    return false;
}

// Check employee login with MD5 password
function verifyEmployee($sql, $login_code, $password, $company_id) {
    $md5_password = md5($password);
    
    $query = "SELECT `company_id`, `emp_id`, `login_code`, `password`, `name`, `phone1`, `phone2`, `email`, 
                     `gender`, `aadhar_card`, `pan_card`, `address`, `joining_date`, `birth_date`, 
                     `profile_image`, `access_pages`, `otp`, `status`, `is_deleted`, `c_date` 
              FROM `tbl_employee` 
              WHERE `login_code` = '$login_code' 
              AND `company_id` = '$company_id' 
              AND `password` = '$md5_password'
              AND `is_deleted` = 1 
              AND `status` = 'Active'";
    $result = mysqli_query($sql, $query);
    
    if (mysqli_num_rows($result) > 0) {
        return mysqli_fetch_assoc($result);
    }
    return false;
}

// Get employee by login_code for OTP
function getEmployeeByLoginCode($sql, $login_code, $company_id) {
    $query = "SELECT `company_id`, `emp_id`, `login_code`, `name`, `phone1`, `phone2`, `email`, `otp` 
              FROM `tbl_employee` 
              WHERE `company_id` = '$company_id' 
              AND `login_code` = '$login_code'
              AND `is_deleted` = 1 
              AND `status` = 'Active'";
    
    $result = mysqli_query($sql, $query);
    if (mysqli_num_rows($result) > 0) {
        return mysqli_fetch_assoc($result);
    }
    return false;
}

// Generate OTP
function generateOTP($length = 6) {
    $otp = '';
    for ($i = 0; $i < $length; $i++) {
        $otp .= mt_rand(0, 9);
    }
    return $otp;
}

function decodeEmployeeAccessPages($value) {
    $decoded = json_decode($value, true);
    if (is_array($decoded)) return $decoded;
    return array_values(array_filter(array_map('trim', explode(',', (string)$value))));
}

// Store OTP in employee table
function storeOTP($sql, $emp_id, $otp) {
    $query = "UPDATE `tbl_employee` SET `otp` = '$otp' WHERE `emp_id` = '$emp_id'";
    return mysqli_query($sql, $query);
}

// Verify OTP and clear it
function verifyAndClearOTP($sql, $emp_id, $otp) {
    $query = "SELECT `otp` FROM `tbl_employee` WHERE `emp_id` = '$emp_id' AND `otp` = '$otp'";
    $result = mysqli_query($sql, $query);
    
    if (mysqli_num_rows($result) > 0) {
        $clearQuery = "UPDATE `tbl_employee` SET `otp` = NULL WHERE `emp_id` = '$emp_id'";
        mysqli_query($sql, $clearQuery);
        return true;
    }
    return false;
}

// Main API Logic
$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // Verify Company or Password Login
        if (empty($company_code)) {
            $response = ['status' => 'error', 'message' => 'Company code is required'];
            break;
        }
        
        $company = verifyCompany($sql, $company_code);
        if (!$company) {
            $response = ['status' => 'error', 'message' => 'Invalid company code'];
            break;
        }
        
        // If only company verification
        if (!isset($postData['login_code']) && !isset($postData['password'])) {
            $response = [
                'status' => 'success',
                'message' => 'Company verified',
                'company' => $company
            ];
            break;
        }
        
        // Password Login
        $login_code = isset($postData['login_code']) ? mysqli_real_escape_string($sql, $postData['login_code']) : '';
        $password = isset($postData['password']) ? $postData['password'] : '';
        
        if (empty($login_code) || empty($password)) {
            $response = ['status' => 'error', 'message' => 'Login code and password are required'];
            break;
        }
        
        $employee = verifyEmployee($sql, $login_code, $password, $company['company_id']);
        if ($employee) {
            $token = generateToken();
            
            logMessage('login', "User logged in successfully: {$employee['name']} (ID: {$employee['emp_id']})", 'SUCCESS');
            
            $response = [
                'status' => 'success',
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'emp_id' => $employee['emp_id'],
                    'name' => $employee['name'],
                    'login_code' => $employee['login_code'],
                    'email' => $employee['email'],
                    'phone1' => $employee['phone1'],
                    'phone2' => $employee['phone2'],
                    'profile_image' => !empty($employee['profile_image']) ? $employee_url . $employee['profile_image'] : null,
                    'access_pages' => decodeEmployeeAccessPages($employee['access_pages'])
                ],
                'company' => $company
            ];
        } else {
            logMessage('login', "Failed login attempt for: $login_code", 'WARNING');
            $response = ['status' => 'error', 'message' => 'Invalid login credentials'];
        }
        break;
        
    case 2: // Send OTP - Only login_code
        if (empty($company_code)) {
            $response = ['status' => 'error', 'message' => 'Company code is required'];
            break;
        }
        
        $company = verifyCompany($sql, $company_code);
        if (!$company) {
            $response = ['status' => 'error', 'message' => 'Invalid company code'];
            break;
        }
        
        $login_code = isset($postData['login_code']) ? mysqli_real_escape_string($sql, $postData['login_code']) : '';
        
        if (empty($login_code)) {
            $response = ['status' => 'error', 'message' => 'Login code is required'];
            break;
        }
        
        $employee = getEmployeeByLoginCode($sql, $login_code, $company['company_id']);
        if (!$employee) {
            logMessage('login', "OTP request for non-existent user: $login_code", 'WARNING');
            $response = ['status' => 'error', 'message' => 'No user found with this login code'];
            break;
        }
        
        $otp = generateOTP();
        if (storeOTP($sql, $employee['emp_id'], $otp)) {
            // Send OTP via email
            $email_sent = false;
            if (!empty($employee['email'])) {
                $email_sent = send_otp_email($employee['email'], $otp, $company['company_name']);
            }
            
            $response = [
                'status' => 'success',
                'message' => $email_sent ? 'OTP sent successfully' : 'OTP generated but email failed',
                'otp' => $otp, // Remove in production
                'emp_id' => $employee['emp_id'],
                'email' => $employee['email']
            ];
        } else {
            logError('login', 'Failed to store OTP');
            $response = ['status' => 'error', 'message' => 'Failed to send OTP'];
        }
        break;
        
    case 3: // Verify OTP - Only login_code and otp
        if (empty($company_code)) {
            $response = ['status' => 'error', 'message' => 'Company code is required'];
            break;
        }
        
        $company = verifyCompany($sql, $company_code);
        if (!$company) {
            $response = ['status' => 'error', 'message' => 'Invalid company code'];
            break;
        }
        
        $otp = isset($postData['otp']) ? mysqli_real_escape_string($sql, $postData['otp']) : '';
        $login_code = isset($postData['login_code']) ? mysqli_real_escape_string($sql, $postData['login_code']) : '';
        
        if (empty($otp)) {
            $response = ['status' => 'error', 'message' => 'OTP is required'];
            break;
        }
        if (empty($login_code)) {
            $response = ['status' => 'error', 'message' => 'Login code is required'];
            break;
        }
        
        $employee = getEmployeeByLoginCode($sql, $login_code, $company['company_id']);
        if (!$employee) {
            $response = ['status' => 'error', 'message' => 'User not found'];
            break;
        }
        
        // Verify OTP and clear it
        if (verifyAndClearOTP($sql, $employee['emp_id'], $otp)) {
            $token = generateToken();
            
            $query = "SELECT `company_id`, `emp_id`, `login_code`, `name`, `phone1`, `phone2`, `email`, 
                             `gender`, `profile_image`, `access_pages` 
                      FROM `tbl_employee` 
                      WHERE `emp_id` = '" . $employee['emp_id'] . "'";
            $result = mysqli_query($sql, $query);
            $userData = mysqli_fetch_assoc($result);
            
            logMessage('login', "User logged in via OTP: {$userData['name']} (ID: {$userData['emp_id']})", 'SUCCESS');
            
            $response = [
                'status' => 'success',
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'emp_id' => $userData['emp_id'],
                    'name' => $userData['name'],
                    'login_code' => $userData['login_code'],
                    'email' => $userData['email'],
                    'phone1' => $userData['phone1'],
                    'phone2' => $userData['phone2'],
                    'profile_image' => !empty($userData['profile_image']) ? $employee_url . $userData['profile_image'] : null,
                    'access_pages' => decodeEmployeeAccessPages($userData['access_pages'])
                ],
                'company' => $company
            ];
        } else {
            logMessage('login', "Invalid OTP attempt for user: {$employee['name']} (ID: {$employee['emp_id']})", 'WARNING');
            $response = ['status' => 'error', 'message' => 'Invalid OTP'];
        }
        break;
        
    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('login', "Invalid request type: $type");
}

logResponse('login', $response);
echo json_encode($response);
mysqli_close($sql);
?>

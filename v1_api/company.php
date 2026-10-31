<?php
// v1_api/company.php
require_once 'dbconnection.php';

// Fallbacks if dbconnection.php doesn't define them
if (!isset($c_date) || $c_date === '') $c_date = date('Y-m-d');
if (!isset($time)   || $time   === '') $time   = date('H:i:s');

$postData = json_decode(file_get_contents('php://input'), true);

// ✅ FIX: Detect FormData by presence of $_POST['type'] alone (file is optional)
$isFormRequest = isset($_POST['type']);

/* =========================================================
 *  A) FORMDATA BRANCH (add / update, with or without logo)
 * ========================================================= */
if ($isFormRequest) {

    $type          = isset($_POST['type']) ? intval($_POST['type']) : 0;
    $company_id    = isset($_POST['company_id']) ? mysqli_real_escape_string($sql, $_POST['company_id']) : '';
    $company_name  = isset($_POST['company_name']) ? mysqli_real_escape_string($sql, $_POST['company_name']) : '';
    $owner_name    = isset($_POST['owner_name']) ? mysqli_real_escape_string($sql, $_POST['owner_name']) : '';
    $owner_employee_code = isset($_POST['owner_employee_code']) ? mysqli_real_escape_string($sql, trim($_POST['owner_employee_code'])) : '';
    $employee_number = isset($_POST['employee_number']) ? mysqli_real_escape_string($sql, trim($_POST['employee_number'])) : '';
    $owner_password = isset($_POST['owner_password']) ? $_POST['owner_password'] : '';
    $company_code  = isset($_POST['company_code']) ? mysqli_real_escape_string($sql, $_POST['company_code']) : '';
    $address       = isset($_POST['address']) ? mysqli_real_escape_string($sql, $_POST['address']) : '';
    $phone         = isset($_POST['phone']) ? mysqli_real_escape_string($sql, $_POST['phone']) : '';
    $phone2        = isset($_POST['phone2']) ? mysqli_real_escape_string($sql, $_POST['phone2']) : '';
    $whatsapp_number = isset($_POST['whatsapp_number']) ? mysqli_real_escape_string($sql, $_POST['whatsapp_number']) : '';
    $email         = isset($_POST['email']) ? mysqli_real_escape_string($sql, $_POST['email']) : '';
    $gst_number    = isset($_POST['gst_number']) ? mysqli_real_escape_string($sql, $_POST['gst_number']) : '';
    $company_expiry_date = isset($_POST['company_expiry_date']) ? mysqli_real_escape_string($sql, $_POST['company_expiry_date']) : '';

    // ✅ FIX: read theme + website fields
    $text_color       = isset($_POST['text_color']) ? mysqli_real_escape_string($sql, $_POST['text_color']) : '#111827';
    $background_color = isset($_POST['background_color']) ? mysqli_real_escape_string($sql, $_POST['background_color']) : '#f5f7fa';
    $website          = isset($_POST['website']) ? mysqli_real_escape_string($sql, $_POST['website']) : '';

    // Upload directory
    $upload_dir = '../uploadfiles/company/';
    if (!file_exists($upload_dir)) {
        @mkdir($upload_dir, 0777, true);
    }

    $image_name     = '';
    $image_uploaded = false;

    // ✅ FIX: check only if a file was actually attached
    if (isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK && !empty($_FILES['logo']['name'])) {
        $file      = $_FILES['logo'];
        $file_ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed   = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

        if (!in_array($file_ext, $allowed)) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid file type. Allowed: JPG, PNG, GIF, WEBP, SVG']);
            exit;
        }

        $image_name  = time() . '_' . uniqid() . '.' . $file_ext;
        $upload_path = $upload_dir . $image_name;

        if (move_uploaded_file($file['tmp_name'], $upload_path)) {
            $image_uploaded = true;
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to upload image']);
            exit;
        }
    }

    logRequest('company', $_POST);
    $response = ['status' => 'error', 'message' => 'Invalid request'];

    switch ($type) {

        /* ---------------- ADD ---------------- */
        case 1:
            if (empty($company_name)) {
                $response = ['status' => 'error', 'message' => 'Company name is required'];
                break;
            }
            if (empty($company_code)) {
                $response = ['status' => 'error', 'message' => 'Company code is required'];
                break;
            }

            $hasOwnerCredentials = !empty($owner_employee_code) || !empty($employee_number) || !empty($owner_password);
            if ($hasOwnerCredentials && (empty($owner_name) || empty($owner_employee_code) || empty($employee_number) || strlen($owner_password) < 4)) {
                $response = ['status' => 'error', 'message' => 'Owner name, employee code, employee number, and a password of at least 4 characters are required'];
                break;
            }

            $checkQuery  = "SELECT company_id FROM tbl_company WHERE company_code = '$company_code' AND is_deleted = '1'";
            $checkResult = mysqli_query($sql, $checkQuery);
            if ($checkResult && mysqli_num_rows($checkResult) > 0) {
                $response = ['status' => 'error', 'message' => 'Company code already exists'];
                break;
            }

            // Create company and its owner employee as one operation when credentials are supplied.
            mysqli_begin_transaction($sql);
            $query = "INSERT INTO tbl_company
                      (company_name, owner_name, owner_emp_id, company_code, address, phone, phone2, whatsapp_number,
                       email, gst_number, logo, company_expiry_date,
                       text_color, background_color, website,
                       is_deleted, c_date)
                      VALUES
                      ('$company_name', '$owner_name', NULL, '$company_code', '$address', '$phone', '$phone2', '$whatsapp_number',
                       '$email', '$gst_number', '$image_name', '$company_expiry_date',
                       '$text_color', '$background_color', '$website',
                       '1', '$c_date')";

            if (mysqli_query($sql, $query)) {
                $new_id = mysqli_insert_id($sql);
                $ownerEmpId = null;
                if ($hasOwnerCredentials) {
                    $ownerAccessPages = mysqli_real_escape_string($sql, json_encode([
                        'dashboard', 'create-quotation', 'quotations', 'clients', 'employees',
                        'vendors', 'purchase-reminders', 'purchases', 'purchase-returns', 'purchase-payments',
                        'expense-categories', 'accounts', 'transaction-reports', 'other-expense', 'other-income',
                        'my-leads', 'all-leads', 'my-followups', 'all-followups', 'today-followups', 'transfer',
                        'lead-sources', 'lead-statuses', 'units', 'brands', 'raw-material-types', 'raw-materials',
                        'categories', 'products', 'rooms', 'packages', 'terms', 'states', 'cities', 'areas',
                        'reports-low-stock', 'reports-work-order', 'company', 'how-to-use'
                    ]));
                    $hashedOwnerPassword = md5($owner_password);
                    $ownerQuery = "INSERT INTO tbl_employee
                        (company_id, login_code, password, name, employee_number, phone1, phone2, email,
                         gender, aadhar_card, pan_card, address, joining_date, birth_date, profile_image,
                         access_pages, status, is_deleted, c_date)
                        VALUES ('$new_id', '$owner_employee_code', '$hashedOwnerPassword', '$owner_name', '$employee_number',
                         '', '', '', '', '', '', '', NULL, NULL, '', '$ownerAccessPages', 'Active', '1', '$c_date')";
                    if (!mysqli_query($sql, $ownerQuery)) {
                        $error = mysqli_error($sql);
                        mysqli_rollback($sql);
                        logError('company', $error);
                        $response = ['status' => 'error', 'message' => 'Company owner account could not be created: ' . $error];
                        break;
                    }
                    $ownerEmpId = mysqli_insert_id($sql);
                    if (!mysqli_query($sql, "UPDATE tbl_company SET owner_emp_id = '$ownerEmpId' WHERE company_id = '$new_id'")) {
                        $error = mysqli_error($sql);
                        mysqli_rollback($sql);
                        logError('company', $error);
                        $response = ['status' => 'error', 'message' => 'Could not link the owner employee to the company: ' . $error];
                        break;
                    }
                }
                mysqli_commit($sql);
                logMessage('company', "New company added: $company_name (ID: $new_id)", 'INFO');
                $response = [
                    'status'     => 'success',
                    'message'    => 'Company added successfully',
                    'company_id' => $new_id,
                    'owner_emp_id' => $ownerEmpId
                ];
            } else {
                $error = mysqli_error($sql);
                mysqli_rollback($sql);
                logError('company', $error);
                $response = ['status' => 'error', 'message' => 'Failed to add company: ' . $error];
            }
            break;

        /* ---------------- UPDATE ---------------- */
        case 2:
            if (empty($company_id)) {
                $response = ['status' => 'error', 'message' => 'Company ID is required'];
                break;
            }
            if (empty($company_name)) {
                $response = ['status' => 'error', 'message' => 'Company name is required'];
                break;
            }
            if (empty($company_code)) {
                $response = ['status' => 'error', 'message' => 'Company code is required'];
                break;
            }
            if ($owner_password !== '' && strlen($owner_password) < 4) {
                $response = ['status' => 'error', 'message' => 'Owner password must be at least 4 characters'];
                break;
            }

            $checkQuery = "SELECT logo, owner_emp_id FROM tbl_company WHERE company_id = '$company_id' AND is_deleted = '1'";
            $checkResult = mysqli_query($sql, $checkQuery);
            if (!$checkResult || mysqli_num_rows($checkResult) == 0) {
                $response = ['status' => 'error', 'message' => 'Company not found'];
                break;
            }
            $oldData = mysqli_fetch_assoc($checkResult);

            // Duplicate code check (exclude self)
            $dupQuery  = "SELECT company_id FROM tbl_company
                          WHERE company_code = '$company_code'
                          AND company_id <> '$company_id'
                          AND is_deleted = '1'";
            $dupResult = mysqli_query($sql, $dupQuery);
            if ($dupResult && mysqli_num_rows($dupResult) > 0) {
                $response = ['status' => 'error', 'message' => 'Company code already exists'];
                break;
            }

            $ownerEmpId = $oldData['owner_emp_id'] ?? '';
            if (!empty($ownerEmpId) && (empty($owner_name) || empty($owner_employee_code) || empty($employee_number))) {
                $response = ['status' => 'error', 'message' => 'Owner name, employee code, and employee number are required'];
                break;
            }
            if (!empty($owner_employee_code)) {
                $loginCheck = mysqli_query($sql, "SELECT emp_id FROM tbl_employee WHERE company_id = '$company_id' AND login_code = '$owner_employee_code' AND emp_id <> '$ownerEmpId' AND is_deleted = '1' LIMIT 1");
                if ($loginCheck && mysqli_num_rows($loginCheck) > 0) {
                    $response = ['status' => 'error', 'message' => 'Employee code already exists in this company'];
                    break;
                }
            }

            // Keep company changes and owner account changes atomic.
            mysqli_begin_transaction($sql);
            $query = "UPDATE tbl_company SET
                        company_name = '$company_name',
                        owner_name = '$owner_name',
                        company_code = '$company_code',
                        address = '$address',
                        phone = '$phone',
                        phone2 = '$phone2',
                        whatsapp_number = '$whatsapp_number',
                        email = '$email',
                        gst_number = '$gst_number',
                        company_expiry_date = '$company_expiry_date',
                        text_color = '$text_color',
                        background_color = '$background_color',
                        website = '$website'";

            if ($image_uploaded) {
                $query .= ", logo = '$image_name'";
            }

            $query .= " WHERE company_id = '$company_id' AND is_deleted = '1'";

            if (mysqli_query($sql, $query)) {
                if (!empty($ownerEmpId)) {
                    $employeeSet = [];
                    if ($owner_name !== '') $employeeSet[] = "name = '$owner_name'";
                    if ($owner_employee_code !== '') $employeeSet[] = "login_code = '$owner_employee_code'";
                    if ($employee_number !== '') $employeeSet[] = "employee_number = '$employee_number'";
                    if ($owner_password !== '') $employeeSet[] = "password = '" . md5($owner_password) . "'";
                    if (!empty($employeeSet) && !mysqli_query($sql, "UPDATE tbl_employee SET " . implode(', ', $employeeSet) . " WHERE emp_id = '$ownerEmpId' AND company_id = '$company_id' AND is_deleted = '1'")) {
                        $error = mysqli_error($sql);
                        mysqli_rollback($sql);
                        logError('company', $error);
                        $response = ['status' => 'error', 'message' => 'Owner employee update failed; company changes were rolled back: ' . $error];
                        break;
                    }
                } elseif (!empty($owner_employee_code) || !empty($employee_number) || !empty($owner_password)) {
                    if (empty($owner_name) || empty($owner_employee_code) || empty($employee_number) || strlen($owner_password) < 4) {
                        mysqli_rollback($sql);
                        $response = ['status' => 'error', 'message' => 'To create the owner employee, enter name, employee code, employee number, and a password of at least 4 characters'];
                        break;
                    }
                    $ownerAccessPages = mysqli_real_escape_string($sql, json_encode([
                        'dashboard', 'create-quotation', 'quotations', 'clients', 'employees',
                        'vendors', 'purchase-reminders', 'purchases', 'purchase-returns', 'purchase-payments',
                        'expense-categories', 'accounts', 'transaction-reports', 'other-expense', 'other-income',
                        'my-leads', 'all-leads', 'my-followups', 'all-followups', 'today-followups', 'transfer',
                        'lead-sources', 'lead-statuses', 'units', 'brands', 'raw-material-types', 'raw-materials',
                        'categories', 'products', 'rooms', 'packages', 'terms', 'states', 'cities', 'areas',
                        'reports-low-stock', 'reports-work-order', 'company', 'how-to-use'
                    ]));
                    $ownerQuery = "INSERT INTO tbl_employee
                        (company_id, login_code, password, name, employee_number, phone1, phone2, email,
                         gender, aadhar_card, pan_card, address, joining_date, birth_date, profile_image,
                         access_pages, status, is_deleted, c_date)
                        VALUES ('$company_id', '$owner_employee_code', '" . md5($owner_password) . "', '$owner_name', '$employee_number',
                         '', '', '', '', '', '', '', NULL, NULL, '', '$ownerAccessPages', 'Active', '1', '$c_date')";
                    if (!mysqli_query($sql, $ownerQuery)) {
                        $error = mysqli_error($sql);
                        mysqli_rollback($sql);
                        logError('company', $error);
                        $response = ['status' => 'error', 'message' => 'Owner employee could not be created; company changes were rolled back: ' . $error];
                        break;
                    }
                    $ownerEmpId = mysqli_insert_id($sql);
                    if (!mysqli_query($sql, "UPDATE tbl_company SET owner_emp_id = '$ownerEmpId' WHERE company_id = '$company_id'")) {
                        $error = mysqli_error($sql);
                        mysqli_rollback($sql);
                        logError('company', $error);
                        $response = ['status' => 'error', 'message' => 'Could not link the owner employee to the company: ' . $error];
                        break;
                    }
                }

                mysqli_commit($sql);
                // Delete old logo only after successful DB update
                if ($image_uploaded && !empty($oldData['logo']) && file_exists($upload_dir . $oldData['logo'])) {
                    @unlink($upload_dir . $oldData['logo']);
                }

                logMessage('company', "Company updated: $company_name (ID: $company_id)", 'INFO');
                $response = [
                    'status'  => 'success',
                    'message' => 'Company updated successfully',
                    'logo'    => $image_uploaded ? $image_name : ($oldData['logo'] ?? '')
                ];
            } else {
                $error = mysqli_error($sql);
                mysqli_rollback($sql);
                logError('company', $error);
                $response = ['status' => 'error', 'message' => 'Failed to update company: ' . $error];
            }
            break;

        default:
            $response = ['status' => 'error', 'message' => 'Invalid request type'];
            logError('company', "Invalid request type: $type");
    }

    logResponse('company', $response);
    echo json_encode($response);
    mysqli_close($sql);
    exit;
}

/* =========================================================
 *  B) JSON BRANCH (select, list, delete)
 * ========================================================= */
if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('company', $response);
    echo json_encode($response);
    exit;
}

$type       = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {

    case 3: // SELECT single company
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }

        $query = "SELECT c.*, e.login_code AS owner_employee_code, e.employee_number
                  FROM tbl_company c LEFT JOIN tbl_employee e ON e.emp_id = c.owner_emp_id AND e.company_id = c.company_id AND e.is_deleted = '1'
                  WHERE c.company_id = '$company_id' AND c.is_deleted = '1'";
        $result = mysqli_query($sql, $query);

        if ($result && mysqli_num_rows($result) > 0) {
            $company = mysqli_fetch_assoc($result);

            // ✅ FIX: return only filename, not full URL (frontend builds the URL)
            // If you prefer full URL, keep the next line; otherwise leave as-is.
            // $company['logo'] = $company_url . $company['logo'];

            logMessage('company', "Fetched company details for ID: $company_id", 'INFO');

            $response = [
                'status'  => 'success',
                'message' => 'Company details fetched successfully',
                'data'    => $company
            ];
        } else {
            $response = ['status' => 'error', 'message' => 'Company not found'];
        }
        break;

    case 4: // SELECT ALL companies
        $query  = "SELECT c.*, e.login_code AS owner_employee_code, e.employee_number
                   FROM tbl_company c LEFT JOIN tbl_employee e ON e.emp_id = c.owner_emp_id AND e.company_id = c.company_id AND e.is_deleted = '1'
                   WHERE c.is_deleted = '1' ORDER BY c.company_name ASC";
        $result = mysqli_query($sql, $query);

        if ($result) {
            $companies = [];
            while ($row = mysqli_fetch_assoc($result)) {
                // $row['logo'] = $company_url . $row['logo']; // optional
                $companies[] = $row;
            }

            logMessage('company', "Fetched " . count($companies) . " companies", 'INFO');

            $response = [
                'status'  => 'success',
                'message' => 'Companies fetched successfully',
                'data'    => $companies,
                'total'   => count($companies)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('company', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch companies: ' . $error];
        }
        break;

    case 5: // DELETE (soft)
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if ($company_id == 1) {
            $response = ['status' => 'error', 'message' => 'Cannot delete the master admin company'];
            break;
        }

        $checkQuery  = "SELECT company_name FROM tbl_company WHERE company_id = '$company_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        if (!$checkResult || mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Company not found or already deleted'];
            break;
        }
        $companyData = mysqli_fetch_assoc($checkResult);

        $query = "UPDATE tbl_company SET is_deleted = '2' WHERE company_id = '$company_id'";
        if (mysqli_query($sql, $query)) {
            logMessage('company', "Company deleted: {$companyData['company_name']} (ID: $company_id)", 'INFO');
            $response = ['status' => 'success', 'message' => 'Company deleted successfully'];
        } else {
            $error = mysqli_error($sql);
            logError('company', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete company: ' . $error];
        }
        break;

    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('company', "Invalid request type: $type");
}

logResponse('company', $response);
echo json_encode($response);
mysqli_close($sql);
?>

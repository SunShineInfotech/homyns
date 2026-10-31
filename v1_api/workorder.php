<?php
// v1_api/workorder.php
// Work Order / Production Status API
require_once 'dbconnection.php';

if (!headers_sent()) {
    header('Content-Type: application/json');
}

/* ---------------------------------------------------------
 * 0) INPUT HANDLING (JSON or multipart/form-data)
 * --------------------------------------------------------- */
$contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
$isMultipart = (stripos($contentType, 'multipart/form-data') !== false);

if ($isMultipart) {
    $postData = $_POST;
    if (empty($postData) && !empty($_FILES)) {
        $postData = ['_multipart_only' => 1];
    }
} else {
    $raw = file_get_contents('php://input');
    $postData = json_decode($raw, true);
    if (!is_array($postData)) {
        $postData = [];
    }
}

logRequest('workorder', $postData);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('workorder', $response);
    echo json_encode($response);
    exit;
}

/* ---------------------------------------------------------
 * 1) MASTER STATUS / PRIORITY LABELS
 * --------------------------------------------------------- */
$PRODUCTION_STATUSES = [
    1 => 'Pending',
    2 => 'Work Started',
    3 => 'Waiting for Client Response',
    4 => 'Product Ready',
    5 => 'Product Set In Place'
];

$PRIORITY_LABELS = [
    1 => 'Low',
    2 => 'Normal',
    3 => 'High',
    4 => 'Urgent'
];

function getStatusTitle($status)
{
    global $PRODUCTION_STATUSES;
    $status = intval($status);
    return isset($PRODUCTION_STATUSES[$status]) ? $PRODUCTION_STATUSES[$status] : 'Unknown';
}

function getPriorityTitle($priority)
{
    global $PRIORITY_LABELS;
    $priority = intval($priority);
    return isset($PRIORITY_LABELS[$priority]) ? $PRIORITY_LABELS[$priority] : 'Normal';
}

/* ---------------------------------------------------------
 * 2) HELPERS
 * --------------------------------------------------------- */
$c_date = isset($c_date) ? $c_date : date('Y-m-d');
$time   = isset($time)   ? $time   : date('H:i:s');

/**
 * Save an uploaded work-order image.
 * Supports:
 *   - multipart file upload  -> $_FILES['image']
 *   - base64 json            -> $postData['image_base64']
 *
 * Returns ['path' => '...', 'error' => '']
 */
function saveWorkOrderImage($postData, $company_id)
{
    $uploadDir   = __DIR__ . '/uploads/work_order/';
    $relativeDir = 'uploads/work_order/';

    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0777, true);
    }

    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

    /* ---- Multipart file upload ---- */
    if (!empty($_FILES['image']['name']) && is_uploaded_file($_FILES['image']['tmp_name'])) {
        $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
        if ($ext === 'jpeg') $ext = 'jpg';
        if (!in_array($ext, $allowed)) {
            return ['path' => '', 'error' => 'Invalid image type. Allowed: ' . implode(', ', $allowed)];
        }
        $fileName = 'WO_' . preg_replace('/[^A-Za-z0-9]/', '', $company_id) . '_' .
                    time() . '_' . rand(1000, 9999) . '.' . $ext;

        if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $fileName)) {
            return ['path' => $relativeDir . $fileName, 'error' => ''];
        }
        return ['path' => '', 'error' => 'Failed to move uploaded image'];
    }

    /* ---- Base64 ---- */
    $base64 = '';
    if (isset($postData['image_base64']))      $base64 = $postData['image_base64'];
    elseif (isset($postData['image']))         $base64 = $postData['image'];
    elseif (isset($postData['history_image'])) $base64 = $postData['history_image'];

    if (!empty($base64) && is_string($base64)) {
        $ext = 'jpg';
        if (preg_match('/^data:image\/(\w+);base64,/', $base64, $m)) {
            $ext    = strtolower($m[1]);
            $base64 = substr($base64, strpos($base64, ',') + 1);
        }
        if ($ext === 'jpeg') $ext = 'jpg';
        if (!in_array($ext, $allowed)) {
            return ['path' => '', 'error' => 'Invalid image type. Allowed: ' . implode(', ', $allowed)];
        }

        $data = base64_decode($base64, true);
        if ($data === false || strlen($data) === 0) {
            return ['path' => '', 'error' => 'Invalid base64 image data'];
        }

        $fileName = 'WO_' . preg_replace('/[^A-Za-z0-9]/', '', $company_id) . '_' .
                    time() . '_' . rand(1000, 9999) . '.' . $ext;

        if (file_put_contents($uploadDir . $fileName, $data)) {
            return ['path' => $relativeDir . $fileName, 'error' => ''];
        }
        return ['path' => '', 'error' => 'Failed to save image'];
    }

    return ['path' => '', 'error' => ''];
}

/**
 * Generate a work order number like WO-COMP-2026-0001
 */
function generateWorkOrderNo($sql, $company_id, $company_code)
{
    $year   = date('Y');
    $prefix = 'WO-' . ($company_code !== '' ? $company_code . '-' : '') . $year . '-';

    $query  = "SELECT COUNT(*) AS cnt FROM tbl_quotation_product
               WHERE company_id = '$company_id'
               AND work_order_no IS NOT NULL
               AND work_order_no <> ''";
    $result = mysqli_query($sql, $query);
    $count  = 1;
    if ($result && mysqli_num_rows($result) > 0) {
        $row   = mysqli_fetch_assoc($result);
        $count = intval($row['cnt']) + 1;
    }

    return $prefix . str_pad($count, 4, '0', STR_PAD_LEFT);
}

/* ---------------------------------------------------------
 * 3) REQUEST PARAMS
 * --------------------------------------------------------- */
$type         = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id   = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$qp_id        = isset($postData['qp_id']) ? mysqli_real_escape_string($sql, $postData['qp_id']) : '';
$quotation_id = isset($postData['quotation_id']) ? mysqli_real_escape_string($sql, $postData['quotation_id']) : '';
$history_id   = isset($postData['history_id']) ? mysqli_real_escape_string($sql, $postData['history_id']) : '';
$emp_id       = isset($postData['emp_id']) ? mysqli_real_escape_string($sql, $postData['emp_id']) : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {

    /* =====================================================
     * CASE 1 : UPDATE PRODUCTION STATUS + ADD HISTORY
     * ===================================================== */
    case 1:
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($qp_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation Product ID (qp_id) is required'];
            break;
        }

        $production_status = isset($postData['production_status']) ? intval($postData['production_status']) : 0;
        if ($production_status < 1 || $production_status > 5) {
            $response = ['status' => 'error', 'message' => 'Invalid production status. Allowed: 1 to 5'];
            break;
        }

        $remark      = isset($postData['remark']) ? mysqli_real_escape_string($sql, $postData['remark']) : '';
        $assigned_to = isset($postData['assigned_to']) ? mysqli_real_escape_string($sql, $postData['assigned_to']) : '';
        $priority    = isset($postData['priority']) ? intval($postData['priority']) : 0;

        // Fetch the product row
        $qpQuery = "SELECT qp.*, q.quotation_number, q.client_id, pr.product_name
                    FROM tbl_quotation_product qp
                    LEFT JOIN tbl_quotation q ON qp.quotation_id = q.quotation_id
                    LEFT JOIN tbl_product  pr ON qp.product_id  = pr.product_id
                    WHERE qp.qp_id = '$qp_id'
                    AND qp.company_id = '$company_id'
                    AND qp.is_deleted = '1'
                    LIMIT 1";
        $qpResult = mysqli_query($sql, $qpQuery);

        if (!$qpResult || mysqli_num_rows($qpResult) === 0) {
            $response = ['status' => 'error', 'message' => 'Work order / product not found'];
            break;
        }
        $qpRow = mysqli_fetch_assoc($qpResult);

        $old_status = intval($qpRow['production_status']);

        // Save image if provided
        $imagePath = '';
        $imgRes    = saveWorkOrderImage($postData, $company_id);
        if (!empty($imgRes['error'])) {
            $response = ['status' => 'error', 'message' => $imgRes['error']];
            break;
        }
        $imagePath = $imgRes['path'];

        // Generate work order no if missing
        $work_order_no = isset($qpRow['work_order_no']) ? $qpRow['work_order_no'] : '';
        if (empty($work_order_no)) {
            $company_code = '';
            $cQ = mysqli_query($sql, "SELECT company_code FROM tbl_company WHERE company_id = '$company_id' LIMIT 1");
            if ($cQ && mysqli_num_rows($cQ) > 0) {
                $cRow = mysqli_fetch_assoc($cQ);
                $company_code = $cRow['company_code'];
            }
            $work_order_no = generateWorkOrderNo($sql, $company_id, $company_code);
        }

        // Build dynamic UPDATE
        $setParts = [];
        $setParts[] = "production_status = '$production_status'";
        $setParts[] = "production_status_updated_at = '$c_date $time'";
        $setParts[] = "work_order_no = '$work_order_no'";

        if (!empty($assigned_to)) {
            $setParts[] = "assigned_to = '$assigned_to'";
        }
        if ($priority >= 1 && $priority <= 4) {
            $setParts[] = "priority = '$priority'";
        }
        if ($production_status == 2 && empty($qpRow['work_start_date'])) {
            $setParts[] = "work_start_date = '$c_date'";
        }
        if ($production_status == 5) {
            $setParts[] = "work_end_date = '$c_date'";
        }

        $updateQuery = "UPDATE tbl_quotation_product SET " . implode(', ', $setParts) . "
                        WHERE qp_id = '$qp_id' AND company_id = '$company_id' AND is_deleted = '1'";

        if (!mysqli_query($sql, $updateQuery)) {
            $error = mysqli_error($sql);
            logError('workorder', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update production status: ' . $error];
            break;
        }

        // Insert history
        $status_title = mysqli_real_escape_string($sql, getStatusTitle($production_status));
        $quotation_id_hist = mysqli_real_escape_string($sql, $qpRow['quotation_id']);
        $qr_id_hist        = mysqli_real_escape_string($sql, $qpRow['qr_id']);
        $room_id_hist      = mysqli_real_escape_string($sql, $qpRow['room_id']);
        $product_id_hist   = mysqli_real_escape_string($sql, $qpRow['product_id']);
        $image_sql         = mysqli_real_escape_string($sql, $imagePath);

        $histQuery = "INSERT INTO tbl_work_status_history
                      (company_id, qp_id, quotation_id, qr_id, room_id, product_id,
                       status, status_title, remark, image, emp_id, c_date, c_time, c_datetime, is_deleted)
                      VALUES
                      ('$company_id', '$qp_id', '$quotation_id_hist', '$qr_id_hist', '$room_id_hist', '$product_id_hist',
                       '$production_status', '$status_title', '$remark', '$image_sql', '$emp_id',
                       '$c_date', '$time', '$c_date $time', '1')";
        mysqli_query($sql, $histQuery);
        $new_history_id = mysqli_insert_id($sql);

        logMessage('workorder', "Work order status updated for qp_id=$qp_id : {$old_status} -> {$production_status}", 'INFO');

        $response = [
            'status'            => 'success',
            'message'           => 'Production status updated successfully',
            'qp_id'             => intval($qp_id),
            'work_order_no'     => $work_order_no,
            'old_status'        => $old_status,
            'old_status_title'  => getStatusTitle($old_status),
            'production_status' => $production_status,
            'status_title'      => getStatusTitle($production_status),
            'image'             => $imagePath,
            'history_id'        => $new_history_id
        ];
        break;


    /* =====================================================
     * CASE 2 : WORK ORDER LIST (product-wise)
     * ===================================================== */
    case 2:
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }

        $filter_status  = isset($postData['production_status']) ? intval($postData['production_status']) : 0;
        $client_id      = isset($postData['client_id']) ? mysqli_real_escape_string($sql, $postData['client_id']) : '';
        $assigned_to_f  = isset($postData['assigned_to']) ? mysqli_real_escape_string($sql, $postData['assigned_to']) : '';
        $from_date      = isset($postData['from_date']) ? mysqli_real_escape_string($sql, $postData['from_date']) : '';
        $to_date        = isset($postData['to_date']) ? mysqli_real_escape_string($sql, $postData['to_date']) : '';
        $search         = isset($postData['search']) ? mysqli_real_escape_string($sql, $postData['search']) : '';
        $limit          = isset($postData['limit']) ? intval($postData['limit']) : 50;
        $offset         = isset($postData['offset']) ? intval($postData['offset']) : 0;
        if ($limit <= 0 || $limit > 500) $limit = 50;
        if ($offset < 0) $offset = 0;

        $where = "qp.company_id = '$company_id' AND qp.is_deleted = '1'";
        if (!empty($quotation_id)) $where .= " AND qp.quotation_id = '$quotation_id'";
        if (!empty($qp_id))        $where .= " AND qp.qp_id = '$qp_id'";
        if ($filter_status > 0)    $where .= " AND qp.production_status = '$filter_status'";
        if (!empty($client_id))    $where .= " AND q.client_id = '$client_id'";
        if (!empty($assigned_to_f)) $where .= " AND qp.assigned_to = '$assigned_to_f'";
        if (!empty($from_date))    $where .= " AND DATE(qp.c_date) >= '$from_date'";
        if (!empty($to_date))      $where .= " AND DATE(qp.c_date) <= '$to_date'";
        if (!empty($search)) {
            $where .= " AND (pr.product_name LIKE '%$search%'
                        OR q.quotation_number LIKE '%$search%'
                        OR c.client_name LIKE '%$search%'
                        OR qp.work_order_no LIKE '%$search%')";
        }

        // Total count
        $countQuery = "SELECT COUNT(*) AS total
                       FROM tbl_quotation_product qp
                       LEFT JOIN tbl_product   pr ON qp.product_id  = pr.product_id
                       LEFT JOIN tbl_quotation q  ON qp.quotation_id = q.quotation_id
                       LEFT JOIN tbl_client    c  ON q.client_id    = c.client_id
                       WHERE $where";
        $countResult = mysqli_query($sql, $countQuery);
        $total = 0;
        if ($countResult && mysqli_num_rows($countResult) > 0) {
            $cRow = mysqli_fetch_assoc($countResult);
            $total = intval($cRow['total']);
        }

        $query = "SELECT qp.*,
                         pr.product_name, pr.category_id,
                         qr.room_id, rm.room_name,
                         q.quotation_number, q.quotation_date, q.status AS quotation_status,
                         c.client_id, c.client_name, c.phone AS client_phone, c.email AS client_email,
                         c.address AS client_address,
                         e.name AS assigned_name
                  FROM tbl_quotation_product qp
                  LEFT JOIN tbl_product        pr ON qp.product_id   = pr.product_id
                  LEFT JOIN tbl_quotation_room qr ON qp.qr_id        = qr.qr_id
                  LEFT JOIN tbl_room           rm ON qr.room_id      = rm.room_id
                  LEFT JOIN tbl_quotation      q  ON qp.quotation_id = q.quotation_id
                  LEFT JOIN tbl_client         c  ON q.client_id     = c.client_id
                  LEFT JOIN tbl_employee       e  ON qp.assigned_to  = e.emp_id
                  WHERE $where
                  ORDER BY qp.production_status ASC, qp.qp_id DESC
                  LIMIT $offset, $limit";

        $result = mysqli_query($sql, $query);

        if (!$result) {
            $error = mysqli_error($sql);
            logError('workorder', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch work orders: ' . $error];
            break;
        }

        $workOrders = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $row['production_status_title'] = getStatusTitle($row['production_status']);
            $row['priority_title']          = getPriorityTitle($row['priority']);

            // Latest history entry
            $hQ = "SELECT h.history_id, h.status, h.status_title, h.remark, h.image, h.c_date, h.c_time,
                          e2.name AS emp_name
                   FROM tbl_work_status_history h
                   LEFT JOIN tbl_employee e2 ON h.emp_id = e2.emp_id
                   WHERE h.qp_id = '{$row['qp_id']}' AND h.is_deleted = '1'
                   ORDER BY h.history_id DESC LIMIT 1";
            $hR = mysqli_query($sql, $hQ);
            $row['latest_history'] = ($hR && mysqli_num_rows($hR) > 0) ? mysqli_fetch_assoc($hR) : null;

            // History count
            $hcQ = mysqli_query($sql, "SELECT COUNT(*) AS cnt FROM tbl_work_status_history
                                       WHERE qp_id = '{$row['qp_id']}' AND is_deleted = '1'");
            $row['history_count'] = ($hcQ && mysqli_num_rows($hcQ) > 0) ? intval(mysqli_fetch_assoc($hcQ)['cnt']) : 0;

            $workOrders[] = $row;
        }

        $response = [
            'status'       => 'success',
            'message'      => 'Work orders fetched successfully',
            'total'        => $total,
            'limit'        => $limit,
            'offset'       => $offset,
            'data'         => $workOrders
        ];
        break;


    /* =====================================================
     * CASE 3 : SINGLE WORK ORDER DETAIL
     * ===================================================== */
    case 3:
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($qp_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation Product ID (qp_id) is required'];
            break;
        }

        $query = "SELECT qp.*,
                         pr.product_name, pr.category_id,
                         qr.room_id, rm.room_name,
                         q.quotation_id, q.quotation_number, q.quotation_date, q.status AS quotation_status,
                         q.remark AS quotation_remark,
                         c.client_id, c.client_name, c.phone AS client_phone, c.email AS client_email,
                         c.address AS client_address, c.gst_number AS client_gst,
                         e.name AS assigned_name,
                         g.name AS generated_by_name
                  FROM tbl_quotation_product qp
                  LEFT JOIN tbl_product        pr ON qp.product_id   = pr.product_id
                  LEFT JOIN tbl_quotation_room qr ON qp.qr_id        = qr.qr_id
                  LEFT JOIN tbl_room           rm ON qr.room_id      = rm.room_id
                  LEFT JOIN tbl_quotation      q  ON qp.quotation_id = q.quotation_id
                  LEFT JOIN tbl_client         c  ON q.client_id     = c.client_id
                  LEFT JOIN tbl_employee       e  ON qp.assigned_to  = e.emp_id
                  LEFT JOIN tbl_employee       g  ON q.generated_by  = g.emp_id
                  WHERE qp.qp_id = '$qp_id'
                  AND qp.company_id = '$company_id'
                  AND qp.is_deleted = '1'
                  LIMIT 1";

        $result = mysqli_query($sql, $query);
        if (!$result || mysqli_num_rows($result) === 0) {
            $response = ['status' => 'error', 'message' => 'Work order not found'];
            break;
        }

        $row = mysqli_fetch_assoc($result);
        $row['production_status_title'] = getStatusTitle($row['production_status']);
        $row['priority_title']          = getPriorityTitle($row['priority']);

        // Raw materials
        $rmQuery = "SELECT qrm.*, rm.rm_name, b.brand_name
                    FROM tbl_quotation_raw_material qrm
                    LEFT JOIN tbl_raw_material rm ON qrm.rm_id = rm.rm_id
                    LEFT JOIN tbl_brand        b  ON rm.brand_id = b.brand_id
                    WHERE qrm.qp_id = '$qp_id' AND qrm.is_deleted = '1'";
        $rmResult = mysqli_query($sql, $rmQuery);
        $rawMaterials = [];
        while ($rmRow = mysqli_fetch_assoc($rmResult)) {
            $rawMaterials[] = $rmRow;
        }
        $row['raw_materials'] = $rawMaterials;

        // Full history
        $histQuery = "SELECT h.*, e.name AS emp_name
                      FROM tbl_work_status_history h
                      LEFT JOIN tbl_employee e ON h.emp_id = e.emp_id
                      WHERE h.qp_id = '$qp_id' AND h.is_deleted = '1'
                      ORDER BY h.history_id ASC";
        $histResult = mysqli_query($sql, $histQuery);
        $history = [];
        while ($hRow = mysqli_fetch_assoc($histResult)) {
            $hRow['status_title'] = getStatusTitle($hRow['status']);
            $history[] = $hRow;
        }
        $row['status_history'] = $history;

        $response = [
            'status'  => 'success',
            'message' => 'Work order fetched successfully',
            'data'    => $row
        ];
        break;


    /* =====================================================
     * CASE 4 : STATUS HISTORY (by qp_id OR quotation_id)
     * ===================================================== */
    case 4:
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($qp_id) && empty($quotation_id)) {
            $response = ['status' => 'error', 'message' => 'qp_id or quotation_id is required'];
            break;
        }

        $where = "h.company_id = '$company_id' AND h.is_deleted = '1'";
        if (!empty($qp_id))        $where .= " AND h.qp_id = '$qp_id'";
        if (!empty($quotation_id)) $where .= " AND h.quotation_id = '$quotation_id'";

        $query = "SELECT h.*, e.name AS emp_name, pr.product_name
                  FROM tbl_work_status_history h
                  LEFT JOIN tbl_employee e  ON h.emp_id     = e.emp_id
                  LEFT JOIN tbl_product  pr ON h.product_id = pr.product_id
                  WHERE $where
                  ORDER BY h.history_id ASC";

        $result = mysqli_query($sql, $query);
        if (!$result) {
            $error = mysqli_error($sql);
            logError('workorder', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch history: ' . $error];
            break;
        }

        $history = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $row['status_title'] = getStatusTitle($row['status']);
            $history[] = $row;
        }

        $response = [
            'status'  => 'success',
            'message' => 'Status history fetched successfully',
            'total'   => count($history),
            'data'    => $history
        ];
        break;


    /* =====================================================
     * CASE 5 : ADD NOTE / HISTORY ENTRY ONLY (no status change)
     *          If `production_status` is sent it will also update it.
     * ===================================================== */
    case 5:
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($qp_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation Product ID (qp_id) is required'];
            break;
        }

        $remark = isset($postData['remark']) ? mysqli_real_escape_string($sql, $postData['remark']) : '';
        $imagePath = '';

        $imgRes = saveWorkOrderImage($postData, $company_id);
        if (!empty($imgRes['error'])) {
            $response = ['status' => 'error', 'message' => $imgRes['error']];
            break;
        }
        $imagePath = $imgRes['path'];

        if (empty($remark) && empty($imagePath)) {
            $response = ['status' => 'error', 'message' => 'Either remark or image is required'];
            break;
        }

        $qpQuery = "SELECT qp.* FROM tbl_quotation_product qp
                    WHERE qp.qp_id = '$qp_id' AND qp.company_id = '$company_id' AND qp.is_deleted = '1' LIMIT 1";
        $qpResult = mysqli_query($sql, $qpQuery);
        if (!$qpResult || mysqli_num_rows($qpResult) === 0) {
            $response = ['status' => 'error', 'message' => 'Work order not found'];
            break;
        }
        $qpRow = mysqli_fetch_assoc($qpResult);

        $status = isset($postData['production_status']) ? intval($postData['production_status']) : intval($qpRow['production_status']);
        if ($status < 1 || $status > 5) {
            $status = intval($qpRow['production_status']);
        }

        // Update product if status explicitly changed
        if (isset($postData['production_status']) && intval($postData['production_status']) !== intval($qpRow['production_status'])) {
            mysqli_query($sql, "UPDATE tbl_quotation_product
                                SET production_status = '$status',
                                    production_status_updated_at = '$c_date $time'
                                WHERE qp_id = '$qp_id' AND is_deleted = '1'");
        }

        $status_title = mysqli_real_escape_string($sql, getStatusTitle($status));
        $qid_hist     = mysqli_real_escape_string($sql, $qpRow['quotation_id']);
        $qr_hist      = mysqli_real_escape_string($sql, $qpRow['qr_id']);
        $room_hist    = mysqli_real_escape_string($sql, $qpRow['room_id']);
        $prod_hist    = mysqli_real_escape_string($sql, $qpRow['product_id']);
        $image_sql    = mysqli_real_escape_string($sql, $imagePath);

        $histQuery = "INSERT INTO tbl_work_status_history
                      (company_id, qp_id, quotation_id, qr_id, room_id, product_id,
                       status, status_title, remark, image, emp_id, c_date, c_time, c_datetime, is_deleted)
                      VALUES
                      ('$company_id', '$qp_id', '$qid_hist', '$qr_hist', '$room_hist', '$prod_hist',
                       '$status', '$status_title', '$remark', '$image_sql', '$emp_id',
                       '$c_date', '$time', '$c_date $time', '1')";

        if (mysqli_query($sql, $histQuery)) {
            $new_history_id = mysqli_insert_id($sql);
            $response = [
                'status'     => 'success',
                'message'    => 'History entry added successfully',
                'history_id' => $new_history_id,
                'image'      => $imagePath
            ];
        } else {
            $error = mysqli_error($sql);
            logError('workorder', $error);
            $response = ['status' => 'error', 'message' => 'Failed to add history: ' . $error];
        }
        break;


    /* =====================================================
     * CASE 6 : UPLOAD / REPLACE IMAGE ON EXISTING HISTORY
     * ===================================================== */
    case 6:
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($history_id)) {
            $response = ['status' => 'error', 'message' => 'History ID is required'];
            break;
        }

        $imgRes = saveWorkOrderImage($postData, $company_id);
        if (!empty($imgRes['error'])) {
            $response = ['status' => 'error', 'message' => $imgRes['error']];
            break;
        }
        if (empty($imgRes['path'])) {
            $response = ['status' => 'error', 'message' => 'No image provided'];
            break;
        }

        $image_sql = mysqli_real_escape_string($sql, $imgRes['path']);
        $updateQuery = "UPDATE tbl_work_status_history SET image = '$image_sql'
                        WHERE history_id = '$history_id' AND company_id = '$company_id' AND is_deleted = '1'";

        if (mysqli_query($sql, $updateQuery)) {
            $response = ['status' => 'success', 'message' => 'Image uploaded successfully', 'image' => $imgRes['path']];
        } else {
            $error = mysqli_error($sql);
            logError('workorder', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update image: ' . $error];
        }
        break;


    /* =====================================================
     * CASE 7 : WORK ORDER SUMMARY / DASHBOARD COUNTS
     * ===================================================== */
    case 7:
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }

        $where = "qp.company_id = '$company_id' AND qp.is_deleted = '1'";
        if (!empty($quotation_id)) $where .= " AND qp.quotation_id = '$quotation_id'";

        $query = "SELECT qp.production_status, COUNT(*) AS cnt
                  FROM tbl_quotation_product qp
                  WHERE $where
                  GROUP BY qp.production_status
                  ORDER BY qp.production_status ASC";
        $result = mysqli_query($sql, $query);

        $counts = [];
        $total  = 0;
        foreach ($PRODUCTION_STATUSES as $sid => $stitle) {
            $counts[] = ['status' => $sid, 'status_title' => $stitle, 'count' => 0];
        }
        if ($result) {
            while ($row = mysqli_fetch_assoc($result)) {
                $sid = intval($row['production_status']);
                $cnt = intval($row['cnt']);
                $total += $cnt;
                foreach ($counts as &$c) {
                    if ($c['status'] === $sid) {
                        $c['count'] = $cnt;
                    }
                }
                unset($c);
            }
        }

        $response = [
            'status'  => 'success',
            'message' => 'Work order summary fetched successfully',
            'total'   => $total,
            'data'    => $counts
        ];
        break;


    /* =====================================================
     * CASE 8 : UPDATE WORK ORDER INFO (assign / dates / priority)
     * ===================================================== */
    case 8:
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($qp_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation Product ID (qp_id) is required'];
            break;
        }

        $setParts = [];
        if (isset($postData['assigned_to'])) {
            $assigned_to = mysqli_real_escape_string($sql, $postData['assigned_to']);
            $setParts[] = "assigned_to = '$assigned_to'";
        }
        if (isset($postData['priority'])) {
            $p = intval($postData['priority']);
            if ($p >= 1 && $p <= 4) $setParts[] = "priority = '$p'";
        }
        if (isset($postData['work_start_date'])) {
            $wsd = mysqli_real_escape_string($sql, $postData['work_start_date']);
            $setParts[] = "work_start_date = " . ($wsd === '' ? "NULL" : "'$wsd'");
        }
        if (isset($postData['work_end_date'])) {
            $wed = mysqli_real_escape_string($sql, $postData['work_end_date']);
            $setParts[] = "work_end_date = " . ($wed === '' ? "NULL" : "'$wed'");
        }

        if (empty($setParts)) {
            $response = ['status' => 'error', 'message' => 'Nothing to update'];
            break;
        }

        $updateQuery = "UPDATE tbl_quotation_product SET " . implode(', ', $setParts) . "
                        WHERE qp_id = '$qp_id' AND company_id = '$company_id' AND is_deleted = '1'";

        if (mysqli_query($sql, $updateQuery)) {
            $response = ['status' => 'success', 'message' => 'Work order updated successfully'];
        } else {
            $error = mysqli_error($sql);
            logError('workorder', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update work order: ' . $error];
        }
        break;


    /* =====================================================
     * CASE 9 : DELETE A HISTORY ENTRY (soft delete)
     * ===================================================== */
    case 9:
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($history_id)) {
            $response = ['status' => 'error', 'message' => 'History ID is required'];
            break;
        }

        $query = "UPDATE tbl_work_status_history SET is_deleted = '0'
                  WHERE history_id = '$history_id' AND company_id = '$company_id' AND is_deleted = '1'";

        if (mysqli_query($sql, $query)) {
            $response = ['status' => 'success', 'message' => 'History entry deleted successfully'];
        } else {
            $error = mysqli_error($sql);
            logError('workorder', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete history: ' . $error];
        }
        break;


    /* =====================================================
     * CASE 10 : GET MASTER STATUS / PRIORITY LIST
     * ===================================================== */
    case 10:
        $statusList = [];
        foreach ($PRODUCTION_STATUSES as $sid => $stitle) {
            $statusList[] = ['status' => $sid, 'title' => $stitle];
        }
        $priorityList = [];
        foreach ($PRIORITY_LABELS as $pid => $ptitle) {
            $priorityList[] = ['priority' => $pid, 'title' => $ptitle];
        }
        $response = [
            'status'          => 'success',
            'message'         => 'Master data fetched successfully',
            'production_statuses' => $statusList,
            'priorities'          => $priorityList
        ];
        break;


    /* =====================================================
     * DEFAULT
     * ===================================================== */
    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('workorder', "Invalid request type: $type");
        break;
}

logResponse('workorder', $response);
echo json_encode($response);
mysqli_close($sql);
?>
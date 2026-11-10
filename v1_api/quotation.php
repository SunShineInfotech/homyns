<?php
// v1_api/quotation.php
require_once 'dbconnection.php';

$postData = json_decode(file_get_contents('php://input'), true);

logRequest('quotation', $postData);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('quotation', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;

$company_id    = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$quotation_id  = isset($postData['quotation_id']) ? mysqli_real_escape_string($sql, $postData['quotation_id']) : '';
$client_id     = isset($postData['client_id']) ? mysqli_real_escape_string($sql, $postData['client_id']) : '';
$package_id    = isset($postData['package_id']) ? mysqli_real_escape_string($sql, $postData['package_id']) : '';
$generated_by  = isset($postData['generated_by']) ? mysqli_real_escape_string($sql, $postData['generated_by']) : '';
$subtotal      = isset($postData['subtotal']) ? floatval($postData['subtotal']) : 0;
$discount_type = isset($postData['discount_type']) ? mysqli_real_escape_string($sql, $postData['discount_type']) : 'INR';
$discount_value         = isset($postData['discount_value']) ? floatval($postData['discount_value']) : 0;
$discount_amount        = isset($postData['discount_amount']) ? floatval($postData['discount_amount']) : 0;
$amount_after_discount  = isset($postData['amount_after_discount']) ? floatval($postData['amount_after_discount']) : 0;
$gst_applicable = isset($postData['gst_applicable']) ? intval($postData['gst_applicable']) : 0;
$gst_percent    = isset($postData['gst_percent']) ? floatval($postData['gst_percent']) : 0;
$gst_amount     = isset($postData['gst_amount']) ? floatval($postData['gst_amount']) : 0;
$final_amount   = isset($postData['final_amount']) ? floatval($postData['final_amount']) : 0;
$remark         = isset($postData['remark']) ? mysqli_real_escape_string($sql, $postData['remark']) : '';
$rooms          = isset($postData['rooms']) ? $postData['rooms'] : [];

$status   = isset($postData['status']) ? mysqli_real_escape_string($sql, $postData['status']) : '';
$emp_id   = isset($postData['emp_id']) ? mysqli_real_escape_string($sql, $postData['emp_id']) : '';
$qr_id    = isset($postData['qr_id']) ? mysqli_real_escape_string($sql, $postData['qr_id']) : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

/* =========================================================
 * MASTER LABELS (shared with workorder.php)
 * ========================================================= */
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

// Generate quotation number e.g. Q-2026-0001
function generateQuotationNumber($sql, $company_id, $company_code) {
    $currentDate = date('Y-m-d');
    $currentYear = date('Y');
    $financialYearStart = $currentYear . '-04-01';

    if ($currentDate < $financialYearStart) {
        $financialYear = ($currentYear - 1) . '-' . $currentYear;
        $yearDisplay = $currentYear - 1;
    } else {
        $financialYear = $currentYear . '-' . ($currentYear + 1);
        $yearDisplay = $currentYear;
    }

    $query = "SELECT COUNT(*) as count FROM tbl_quotation WHERE company_id = '$company_id' AND quotation_date >= '$financialYearStart'";
    $result = mysqli_query($sql, $query);
    if ($result && mysqli_num_rows($result) > 0) {
        $row = mysqli_fetch_assoc($result);
        $count = $row['count'] + 1;
    } else {
        $count = 1;
    }

    return $company_code."-".$yearDisplay."-".str_pad($count, 4, '0', STR_PAD_LEFT);
}

function calcQty($qty_type, $qty, $height, $width, $depth, $length) {
    if ($qty_type === 'ByHWD') return round($height * $width * $depth * $qty, 2);
    if ($qty_type === 'ByHWL') return round($height * $width * $length * $qty, 2);
    if ($qty_type === 'ByHW')  return round($height * $width * $qty, 2);
    return floatval($qty);
}

function recalculateQuotationTotals($sql, $quotation_id, $company_id) {
    $roomQuery = "SELECT qr_id FROM tbl_quotation_room WHERE quotation_id = '$quotation_id' AND is_deleted = '1'";
    $roomResult = mysqli_query($sql, $roomQuery);

    $subtotal = 0;
    while ($roomRow = mysqli_fetch_assoc($roomResult)) {
        $roomTotalQuery = "SELECT COALESCE(SUM(total_price), 0) as room_total
                           FROM tbl_quotation_product
                           WHERE qr_id = '{$roomRow['qr_id']}' AND is_deleted = '1'";
        $roomTotalResult = mysqli_query($sql, $roomTotalQuery);
        if ($roomTotalResult && mysqli_num_rows($roomTotalResult) > 0) {
            $roomTotalRow = mysqli_fetch_assoc($roomTotalResult);
            $subtotal += floatval($roomTotalRow['room_total']);
        }
    }

    $quoteQuery = "SELECT discount_type, discount_value, discount_amount, gst_percent
                   FROM tbl_quotation WHERE quotation_id = '$quotation_id' AND is_deleted = '1'";
    $quoteResult = mysqli_query($sql, $quoteQuery);
    $discount_amount = 0;
    $gst_percent = 0;
    if ($quoteResult && mysqli_num_rows($quoteResult) > 0) {
        $quoteRow = mysqli_fetch_assoc($quoteResult);
        $discount_amount = floatval($quoteRow['discount_amount'] ?? 0);
        $gst_percent = floatval($quoteRow['gst_percent'] ?? 0);
    }

    $amount_after_discount = max(0, $subtotal - $discount_amount);
    $gst_amount = ($amount_after_discount * $gst_percent) / 100;
    $final_amount = $amount_after_discount + $gst_amount;

    $updateQuery = "UPDATE tbl_quotation SET
                     subtotal = '$subtotal',
                     amount_after_discount = '$amount_after_discount',
                     gst_amount = '$gst_amount',
                     final_amount = '$final_amount'
                     WHERE quotation_id = '$quotation_id' AND is_deleted = '1'";
    mysqli_query($sql, $updateQuery);
}

function getProductRawMaterials($sql, $product_id, $company_id) {
    $query = "SELECT pd.rm_id, pd.rm_qty, u.unit_name
              FROM tbl_product_details pd
              LEFT JOIN tbl_raw_material rm ON pd.rm_id = rm.rm_id
              LEFT JOIN tbl_unit u ON rm.unit_id = u.unit_id
              WHERE pd.product_id = '$product_id'
              AND pd.company_id = '$company_id'
              AND pd.is_deleted = '1'
              AND rm.is_deleted = '1'";
    $result = mysqli_query($sql, $query);
    $materials = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $materials[] = $row;
    }
    return $materials;
}

function calcRmRequiredQty($rm_qty, $calculated_qty) {
    return round($rm_qty * $calculated_qty, 3);
}

/* =========================================================
 * HELPER : Enrich a product row with work order info
 * ========================================================= */
function enrichProductWithWorkOrder($sql, &$productRow, $includeHistory = false, $includeRawMaterials = true)
{
    // Work order fields
    $productRow['production_status']            = isset($productRow['production_status']) ? intval($productRow['production_status']) : 1;
    $productRow['production_status_title']      = getStatusTitle($productRow['production_status']);
    $productRow['priority']                     = isset($productRow['priority']) ? intval($productRow['priority']) : 2;
    $productRow['priority_title']               = getPriorityTitle($productRow['priority']);
    $productRow['work_order_no']                = isset($productRow['work_order_no']) ? $productRow['work_order_no'] : '';
    $productRow['assigned_to']                  = isset($productRow['assigned_to']) ? $productRow['assigned_to'] : '';
    $productRow['work_start_date']              = isset($productRow['work_start_date']) ? $productRow['work_start_date'] : null;
    $productRow['work_end_date']                = isset($productRow['work_end_date']) ? $productRow['work_end_date'] : null;
    $productRow['production_status_updated_at'] = isset($productRow['production_status_updated_at']) ? $productRow['production_status_updated_at'] : null;

    // Assigned employee name
    $productRow['assigned_name'] = '';
    if (!empty($productRow['assigned_to'])) {
        $empQ = mysqli_query($sql, "SELECT name FROM tbl_employee
                                    WHERE emp_id = '{$productRow['assigned_to']}' AND is_deleted = '1' LIMIT 1");
        if ($empQ && mysqli_num_rows($empQ) > 0) {
            $empR = mysqli_fetch_assoc($empQ);
            $productRow['assigned_name'] = $empR['name'];
        }
    }

    // Raw materials
    if ($includeRawMaterials) {
        // Product master materials (same list shown on Product Form) are the
        // source of truth for the product-wise "Raw Materials Used" display.
        $productMasterQuery = "SELECT DISTINCT rm.rm_id, rm.rm_name, b.brand_name, u.unit_name
                               FROM tbl_product_details pd
                               INNER JOIN tbl_raw_material rm ON pd.rm_id = rm.rm_id
                               LEFT JOIN tbl_brand b ON b.brand_id = rm.brand_id AND b.company_id = pd.company_id
                               LEFT JOIN tbl_unit u ON u.unit_id = rm.unit_id
                               WHERE pd.product_id = '{$productRow['product_id']}'
                               AND pd.company_id = '{$productRow['company_id']}'
                               AND pd.is_deleted = '1'
                               AND rm.is_deleted = '1'
                               AND rm.rm_name IS NOT NULL
                               AND rm.rm_name <> ''
                               ORDER BY rm.rm_name ASC";
        $productMasterResult = mysqli_query($sql, $productMasterQuery);
        $productMasterMaterials = [];
        if ($productMasterResult) {
            while ($materialRow = mysqli_fetch_assoc($productMasterResult)) {
                $productMasterMaterials[] = $materialRow;
            }
        }
        $productRow['product_master_raw_materials'] = $productMasterMaterials;

        $rmQuery = "SELECT qrm.*, rm.rm_name, b.brand_name, u.unit_name
                    FROM tbl_quotation_raw_material qrm
                    LEFT JOIN tbl_raw_material rm ON qrm.rm_id = rm.rm_id
                    LEFT JOIN tbl_brand b ON rm.brand_id = b.brand_id AND b.company_id = qrm.company_id
                    LEFT JOIN tbl_unit u ON rm.unit_id = u.unit_id
                    WHERE qrm.quotation_id = '{$productRow['quotation_id']}'
                    AND qrm.qp_id = '{$productRow['qp_id']}'
                    AND qrm.is_deleted = '1'";
        $rmResult = mysqli_query($sql, $rmQuery);
        $rawMaterials = [];
        while ($rmRow = mysqli_fetch_assoc($rmResult)) {
            $rawMaterials[] = $rmRow;
        }
        $productRow['raw_materials'] = $rawMaterials;
    }

    // Latest work status
    $hQ = "SELECT h.history_id, h.status, h.status_title, h.remark, h.image,
                  h.c_date, h.c_time, h.c_datetime, e.name AS emp_name
           FROM tbl_work_status_history h
           LEFT JOIN tbl_employee e ON h.emp_id = e.emp_id
           WHERE h.qp_id = '{$productRow['qp_id']}' AND h.is_deleted = '1'
           ORDER BY h.history_id DESC LIMIT 1";
    $hR = mysqli_query($sql, $hQ);
    $latest = ($hR && mysqli_num_rows($hR) > 0) ? mysqli_fetch_assoc($hR) : null;
    if ($latest && empty($latest['status_title'])) {
        $latest['status_title'] = getStatusTitle($latest['status']);
    }
    $productRow['latest_work_status'] = $latest;

    // History count
    $hcQ = mysqli_query($sql, "SELECT COUNT(*) AS cnt FROM tbl_work_status_history
                               WHERE qp_id = '{$productRow['qp_id']}' AND is_deleted = '1'");
    $productRow['work_status_history_count'] =
        ($hcQ && mysqli_num_rows($hcQ) > 0) ? intval(mysqli_fetch_assoc($hcQ)['cnt']) : 0;

    // Full history (optional)
    if ($includeHistory) {
        $histQuery = "SELECT h.*, e.name AS emp_name
                      FROM tbl_work_status_history h
                      LEFT JOIN tbl_employee e ON h.emp_id = e.emp_id
                      WHERE h.qp_id = '{$productRow['qp_id']}' AND h.is_deleted = '1'
                      ORDER BY h.history_id DESC";
        $histResult = mysqli_query($sql, $histQuery);
        $history = [];
        while ($hRow = mysqli_fetch_assoc($histResult)) {
            if (empty($hRow['status_title'])) {
                $hRow['status_title'] = getStatusTitle($hRow['status']);
            }
            $history[] = $hRow;
        }
        $productRow['work_status_history'] = $history;
    }

    return $productRow;
}

switch ($type) {

    case 1: // ADD - Create new quotation with rooms + items
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($client_id)) {
            $response = ['status' => 'error', 'message' => 'Client ID is required'];
            break;
        }
        if (empty($generated_by)) {
            $response = ['status' => 'error', 'message' => 'Generated by is required'];
            break;
        }
        if (empty($rooms)) {
            $response = ['status' => 'error', 'message' => 'At least one room with items is required'];
            break;
        }

        $query = "SELECT company_id, company_name, company_code, address, phone, phone2,
                         whatsapp_number, email, gst_number, logo, company_expiry_date, is_deleted, c_date
                  FROM tbl_company
                  WHERE company_id = '$company_id' AND is_deleted = '1'";

        $result = mysqli_query($sql, $query);
        $company_code = "";
        if ($result && mysqli_num_rows($result) > 0) {
            $company = mysqli_fetch_assoc($result);
            $company_code = $company['company_code'];
        }

        $quotation_number = generateQuotationNumber($sql, $company_id, $company_code);

        $query = "INSERT INTO tbl_quotation
                   (company_id, quotation_number, client_id, package_id, generated_by,
                    subtotal, discount_type, discount_value, discount_amount, amount_after_discount,
                    gst_applicable, gst_percent, gst_amount, final_amount, remark,
                    status, is_deleted, c_date, quotation_date)
                   VALUES
                   ('$company_id', '$quotation_number', '$client_id', '$package_id', '$generated_by',
                   '$subtotal', '$discount_type', '$discount_value', '$discount_amount', '$amount_after_discount',
                   '$gst_applicable', '$gst_percent', '$gst_amount', '$final_amount', '$remark',
                   'Pending', '1', '$c_date','$date')";

        if (mysqli_query($sql, $query)) {
            $new_id = mysqli_insert_id($sql);

            $sort_order = 0;
            foreach ($rooms as $room) {
                $room_id    = isset($room['room_id']) ? mysqli_real_escape_string($sql, $room['room_id']) : '';
                $room_total = isset($room['room_total']) ? floatval($room['room_total']) : 0;

                $roomQuery = "INSERT INTO tbl_quotation_room
                               (company_id, quotation_id, room_id, room_total, sort_order, is_deleted, c_date)
                               VALUES
                               ('$company_id', '$new_id', '$room_id', '$room_total', '$sort_order', '1', '$c_date')";
                mysqli_query($sql, $roomQuery);
                $qr_id = mysqli_insert_id($sql);

                $item_sort = 0;
                foreach ($room['items'] as $item) {
                    if (isset($item['included']) && !$item['included']) {
                        continue;
                    }

                    $product_id      = isset($item['product_id']) ? mysqli_real_escape_string($sql, $item['product_id']) : '';
                    $is_special      = isset($item['is_special']) ? intval($item['is_special']) : 0;
                    $qty_type        = isset($item['qty_type']) ? mysqli_real_escape_string($sql, $item['qty_type']) : 'Fixed';
                    $qty             = isset($item['qty']) ? floatval($item['qty']) : 0;
                    $height          = isset($item['height']) ? floatval($item['height']) : 0;
                    $width           = isset($item['width']) ? floatval($item['width']) : 0;
                    $depth           = isset($item['depth']) ? floatval($item['depth']) : 0;
                    $length          = isset($item['length']) ? floatval($item['length']) : 0;
                    $dimension_unit  = isset($item['dimension_unit']) ? mysqli_real_escape_string($sql, $item['dimension_unit']) : '';
                    $unit_price      = isset($item['unit_price']) ? floatval($item['unit_price']) : 0;

                    $calculated_qty = isset($item['calculated_qty'])
                        ? floatval($item['calculated_qty'])
                        : calcQty($qty_type, $qty, $height, $width, $depth, $length);

                    $total_price = isset($item['total_price'])
                        ? floatval($item['total_price'])
                        : round($calculated_qty * $unit_price, 2);

                    $remark_item = isset($item['remark']) ? mysqli_real_escape_string($sql, $item['remark']) : '';

                    // Insert quotation product (production_status default = 1 Pending)
                    $productQuery = "INSERT INTO tbl_quotation_product
                                      (company_id, quotation_id, qr_id, room_id, product_id,
                                       is_special, qty_type, qty, height, width, depth, length,
                                       dimension_unit, unit_price, calculated_qty, total_price,
                                       remark, sort_order, production_status, is_deleted, c_date)
                                      VALUES
                                      ('$company_id', '$new_id', '$qr_id', '$room_id', '$product_id',
                                      '$is_special', '$qty_type', '$qty', '$height', '$width', '$depth', '$length',
                                      '$dimension_unit', '$unit_price', '$calculated_qty', '$total_price',
                                      '$remark_item', '$item_sort', '1', '1', '$c_date')";
                    mysqli_query($sql, $productQuery);
                    $qp_id = mysqli_insert_id($sql);

                    $raw_materials = getProductRawMaterials($sql, $product_id, $company_id);

                    if (!empty($raw_materials)) {
                        foreach ($raw_materials as $rm) {
                            $rm_id = isset($rm['rm_id']) ? mysqli_real_escape_string($sql, $rm['rm_id']) : '';
                            $rm_qty = isset($rm['rm_qty']) ? floatval($rm['rm_qty']) : 0;
                            $unit = isset($rm['unit_name']) ? mysqli_real_escape_string($sql, $rm['unit_name']) : '';
                            $required_qty = calcRmRequiredQty($rm_qty, $calculated_qty);

                            if (!empty($rm_id)) {
                                $rmQuery = "INSERT INTO tbl_quotation_raw_material
                                            (company_id, quotation_id, qp_id, rm_id, required_qty, unit, is_deleted, c_date)
                                            VALUES
                                            ('$company_id', '$new_id', '$qp_id', '$rm_id', '$required_qty', '$unit', '1', '$c_date')";
                                mysqli_query($sql, $rmQuery);
                            }
                        }
                    }

                    $item_sort++;
                }
                $sort_order++;
            }

            $empNameQuery = "SELECT name FROM tbl_employee WHERE emp_id = '$generated_by' AND is_deleted = '1'";
            $empResult = mysqli_query($sql, $empNameQuery);
            $empName = '';
            if ($empResult && mysqli_num_rows($empResult) > 0) {
                $empData = mysqli_fetch_assoc($empResult);
                $empName = $empData['name'];
            }

            $customerQuery = "SELECT client_name FROM tbl_client WHERE client_id = '$client_id' AND is_deleted = '1'";
            $customerResult = mysqli_query($sql, $customerQuery);
            $customerName = '';
            if ($customerResult && mysqli_num_rows($customerResult) > 0) {
                $customerData = mysqli_fetch_assoc($customerResult);
                $customerName = $customerData['client_name'];
            }

            $formattedDate = date('d-m-Y', strtotime($c_date));
            $formattedTime = date('h:i A', strtotime($time));

            $historyQuery = "INSERT INTO tbl_quotation_status_history
                              (company_id, quotation_id, emp_id, status, remark, c_date, c_time)
                              VALUES
                              ('$company_id', '$new_id', '$generated_by', 'Pending',
                               'Quotation created by $empName for customer $customerName on $formattedDate at $formattedTime',
                               '$c_date', '$time')";
            mysqli_query($sql, $historyQuery);
            logMessage('quotation', "New quotation created: $quotation_number (ID: $new_id)", 'INFO');

            $response = [
                'status' => 'success',
                'message' => 'Quotation created successfully',
                'quotation_id' => $new_id,
                'quotation_number' => $quotation_number
            ];
        } else {
            $error = mysqli_error($sql);
            logError('quotation', $error);
            $response = ['status' => 'error', 'message' => 'Failed to create quotation: ' . $error];
        }
        break;

    case 3: // SELECT - Get all quotations for a company (with work-order info per product)
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }

        $query = "SELECT q.*, c.*, p.package_name, e.name as generated_by_name
                   FROM tbl_quotation q
                   LEFT JOIN tbl_client c ON q.client_id = c.client_id
                   LEFT JOIN tbl_package p ON q.package_id = p.package_id
                   LEFT JOIN tbl_employee e ON q.generated_by = e.emp_id
                   WHERE q.company_id = '$company_id' AND q.is_deleted = '1'
                   ORDER BY q.quotation_id DESC";

        $result = mysqli_query($sql, $query);

        if ($result) {
            $quotations = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $roomQuery = "SELECT qr.*, r.room_name
                               FROM tbl_quotation_room qr
                               LEFT JOIN tbl_room r ON qr.room_id = r.room_id
                               WHERE qr.quotation_id = '{$row['quotation_id']}' AND qr.is_deleted = '1'
                               ORDER BY qr.sort_order ASC";
                $roomResult = mysqli_query($sql, $roomQuery);
                $roomsArr = [];
                while ($roomRow = mysqli_fetch_assoc($roomResult)) {
                    $productQuery = "SELECT qp.*, pr.product_name, pr.category_id
                                       FROM tbl_quotation_product qp
                                       LEFT JOIN tbl_product pr ON qp.product_id = pr.product_id
                                       WHERE qp.quotation_id = '{$row['quotation_id']}'
                                       AND qp.qr_id = '{$roomRow['qr_id']}'
                                       AND qp.is_deleted = '1'
                                       ORDER BY qp.sort_order ASC";
                    $productResult = mysqli_query($sql, $productQuery);
                    $products = [];
                    while ($productRow = mysqli_fetch_assoc($productResult)) {
                        // >> Attach work order info + raw materials (no full history for list)
                        $productRow = enrichProductWithWorkOrder($sql, $productRow, false, true);
                        $products[] = $productRow;
                    }
                    $roomRow['items'] = $products;
                    $roomsArr[] = $roomRow;
                }
                $row['rooms'] = $roomsArr;
                $quotations[] = $row;
            }

            $response = [
                'status' => 'success',
                'message' => 'Quotations fetched successfully',
                'data' => $quotations,
                'total' => count($quotations)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('quotation', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch quotations: ' . $error];
        }
        break;

    case 4: // DELETE - soft delete a quotation
        if (empty($quotation_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation ID is required'];
            break;
        }

        $query = "UPDATE tbl_quotation SET is_deleted = '0' WHERE quotation_id = '$quotation_id'";

        if (mysqli_query($sql, $query)) {
            mysqli_query($sql, "UPDATE tbl_quotation_room SET is_deleted = '0' WHERE quotation_id = '$quotation_id'");
            mysqli_query($sql, "UPDATE tbl_quotation_product SET is_deleted = '0' WHERE quotation_id = '$quotation_id'");
            mysqli_query($sql, "UPDATE tbl_quotation_raw_material SET is_deleted = '0' WHERE quotation_id = '$quotation_id'");
            // Also soft delete work status history rows
            mysqli_query($sql, "UPDATE tbl_work_status_history SET is_deleted = '0' WHERE quotation_id = '$quotation_id'");
            $response = ['status' => 'success', 'message' => 'Quotation deleted successfully'];
        } else {
            $error = mysqli_error($sql);
            logError('quotation', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete quotation: ' . $error];
        }
        break;

    case 5: // SELECT single quotation by id (with full work-order history per product)
        if (empty($quotation_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation ID is required'];
            break;
        }

        $query = "SELECT q.*, c.*, p.package_name, e.name as generated_by_name
                   FROM tbl_quotation q
                   LEFT JOIN tbl_client c ON q.client_id = c.client_id
                   LEFT JOIN tbl_package p ON q.package_id = p.package_id
                   LEFT JOIN tbl_employee e ON q.generated_by = e.emp_id
                   WHERE q.quotation_id = '$quotation_id' AND q.is_deleted = '1'
                   LIMIT 1";

        $result = mysqli_query($sql, $query);

        if ($result && mysqli_num_rows($result) > 0) {
            $row = mysqli_fetch_assoc($result);

            $roomQuery = "SELECT qr.*, r.room_name
                           FROM tbl_quotation_room qr
                           LEFT JOIN tbl_room r ON qr.room_id = r.room_id
                           WHERE qr.quotation_id = '$quotation_id' AND qr.is_deleted = '1'
                           ORDER BY qr.sort_order ASC";
            $roomResult = mysqli_query($sql, $roomQuery);
            $roomsArr = [];
            while ($roomRow = mysqli_fetch_assoc($roomResult)) {
                $productQuery = "SELECT qp.*, pr.product_name, pr.category_id
                                   FROM tbl_quotation_product qp
                                   LEFT JOIN tbl_product pr ON qp.product_id = pr.product_id
                                   WHERE qp.quotation_id = '$quotation_id'
                                   AND qp.qr_id = '{$roomRow['qr_id']}'
                                   AND qp.is_deleted = '1'
                                   ORDER BY qp.sort_order ASC";
                $productResult = mysqli_query($sql, $productQuery);
                $products = [];
                while ($productRow = mysqli_fetch_assoc($productResult)) {
                    // >> Attach work-order info, raw materials + full work status history
                    $productRow = enrichProductWithWorkOrder($sql, $productRow, true, true);
                    $products[] = $productRow;
                }
                $roomRow['items'] = $products;
                $roomsArr[] = $roomRow;
            }
            $row['rooms'] = $roomsArr;

            // Quotation-level work order summary
            $sumQ = "SELECT
                        COUNT(*) AS total_products,
                        SUM(CASE WHEN production_status = 1 THEN 1 ELSE 0 END) AS pending,
                        SUM(CASE WHEN production_status = 2 THEN 1 ELSE 0 END) AS work_started,
                        SUM(CASE WHEN production_status = 3 THEN 1 ELSE 0 END) AS waiting_client,
                        SUM(CASE WHEN production_status = 4 THEN 1 ELSE 0 END) AS product_ready,
                        SUM(CASE WHEN production_status = 5 THEN 1 ELSE 0 END) AS set_in_place
                     FROM tbl_quotation_product
                     WHERE quotation_id = '$quotation_id' AND is_deleted = '1'";
            $sumR = mysqli_query($sql, $sumQ);
            $row['work_order_summary'] = ($sumR && mysqli_num_rows($sumR) > 0)
                ? mysqli_fetch_assoc($sumR)
                : [
                    'total_products' => 0,
                    'pending' => 0, 'work_started' => 0,
                    'waiting_client' => 0, 'product_ready' => 0,
                    'set_in_place' => 0
                ];

            $response = [
                'status' => 'success',
                'message' => 'Quotation fetched successfully',
                'data' => $row
            ];
        } else {
            $response = ['status' => 'error', 'message' => 'Quotation not found'];
        }
        break;

    case 6: // UPDATE STATUS
        if (empty($quotation_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation ID is required'];
            break;
        }
        if (empty($status)) {
            $response = ['status' => 'error', 'message' => 'Status is required'];
            break;
        }

        mysqli_begin_transaction($sql);
        $quoteLock = mysqli_query($sql, "SELECT quotation_id, client_id, final_amount, quotation_number FROM tbl_quotation
                                         WHERE company_id = '$company_id' AND quotation_id = '$quotation_id'
                                           AND is_deleted = '1' LIMIT 1 FOR UPDATE");
        $quoteRow = $quoteLock ? mysqli_fetch_assoc($quoteLock) : null;
        if (!$quoteRow) {
            mysqli_rollback($sql);
            $response = ['status' => 'error', 'message' => 'Quotation not found'];
            break;
        }

        $query = "UPDATE tbl_quotation SET status = '$status'";

        if ($status === 'Approved by Admin') {
            $query .= ", approved_by = '$emp_id', approved_date = '$c_date', approved_time = '$time'";
        }
        if ($status === 'approved by customer') {
            $query .= ", customer_approved_date = '$c_date', customer_approved_time = '$time'";
        }
        if ($status === 'Sent to Customer') {
            $query .= ", whatsapp_sent = '1', whatsapp_sent_at = '$c_date $time'";
        }
        if ($status === 'Invoice Generated') {
            $query .= ", invoice_generated_at = '$c_date'";
        }

        $query .= " WHERE company_id = '$company_id' AND quotation_id = '$quotation_id' AND is_deleted = '1'";

        $ok = mysqli_query($sql, $query);
        if ($ok) {
            $historyQuery = "INSERT INTO tbl_quotation_status_history
                              (company_id, quotation_id, emp_id, status, remark, c_date, c_time)
                              VALUES
                              ('$company_id', '$quotation_id', '$emp_id', '$status', '$remark', '$c_date', '$time')";
            $ok = mysqli_query($sql, $historyQuery);
        }

        // Work In Progress posts the quotation total to the customer's wallet once.
        // Repeated status updates reconcile only the difference from the previously posted amount.
        $walletPosted = 0.00;
        $customerWalletBalance = null;
        if ($ok && $status === 'Work In Progress') {
            $client_id_for_wallet = intval($quoteRow['client_id']);
            $quotation_amount = round(floatval($quoteRow['final_amount']), 2);
            $walletTxnQuery = "SELECT wallet_transaction_id, amount FROM tbl_quotation_wallet_transaction
                               WHERE company_id = '$company_id' AND quotation_id = '$quotation_id'
                               LIMIT 1 FOR UPDATE";
            $walletTxnResult = mysqli_query($sql, $walletTxnQuery);
            $walletTxn = $walletTxnResult ? mysqli_fetch_assoc($walletTxnResult) : null;
            $alreadyPosted = $walletTxn ? round(floatval($walletTxn['amount']), 2) : 0;
            $walletDelta = round($quotation_amount - $alreadyPosted, 2);
            $clientQuery = mysqli_query($sql, "SELECT client_id, wallet FROM tbl_client
                                              WHERE company_id = '$company_id' AND client_id = '$client_id_for_wallet'
                                                AND is_deleted = '1' LIMIT 1 FOR UPDATE");
            $clientExists = $clientQuery && mysqli_num_rows($clientQuery) > 0;
            if (!$walletTxnResult || !$clientExists) {
                $ok = false;
            } else {
                $clientRow = mysqli_fetch_assoc($clientQuery);
                $oldCustomerWallet = round(floatval($clientRow['wallet']), 2);
                if (abs($walletDelta) > 0.0001) {
                    $ok = mysqli_query($sql, "UPDATE tbl_client SET wallet = wallet + ('$walletDelta')
                                               WHERE company_id = '$company_id' AND client_id = '$client_id_for_wallet'
                                                 AND is_deleted = '1'");
                }
                $walletPosted = max(0, $walletDelta);
                $customerWalletBalance = round($oldCustomerWallet + $walletDelta, 2);
                $walletRemark = mysqli_real_escape_string($sql, 'Quotation ' . $quoteRow['quotation_number'] . ' (' . $status . ') wallet charge; total ' . number_format($quotation_amount, 2, '.', ''));
                if ($ok && $walletTxn) {
                    $walletTxnId = intval($walletTxn['wallet_transaction_id']);
                    $ok = mysqli_query($sql, "UPDATE tbl_quotation_wallet_transaction
                                               SET client_id = '$client_id_for_wallet', amount = '$quotation_amount',
                                                   remark = '$walletRemark', updated_at = '$c_date'
                                               WHERE wallet_transaction_id = '$walletTxnId' AND company_id = '$company_id'");
                } elseif ($ok) {
                    $ok = mysqli_query($sql, "INSERT INTO tbl_quotation_wallet_transaction
                                               (company_id, quotation_id, client_id, amount, remark, created_at, updated_at)
                                               VALUES ('$company_id', '$quotation_id', '$client_id_for_wallet',
                                                       '$quotation_amount', '$walletRemark', '$c_date', '$c_date')");
                }
            }
        }

        if ($ok) {
            mysqli_commit($sql);
            $response = ['status' => 'success', 'message' => 'Quotation status updated successfully'];
            if ($status === 'Work In Progress') {
                $response['wallet_updated'] = true;
                $response['wallet_added'] = $walletPosted;
                $response['quotation_amount'] = round(floatval($quoteRow['final_amount']), 2);
                $response['customer_wallet'] = $customerWalletBalance;
            }
        } else {
            mysqli_rollback($sql);
            $error = mysqli_error($sql);
            logError('quotation', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update status: ' . $error];
        }
        break;

    case 7: // SELECT status history
        if (empty($quotation_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation ID is required'];
            break;
        }

        $query = "SELECT h.*, e.name as emp_name
                   FROM tbl_quotation_status_history h
                   LEFT JOIN tbl_employee e ON h.emp_id = e.emp_id
                   WHERE h.quotation_id = '$quotation_id'
                   ORDER BY h.history_id ASC";

        $result = mysqli_query($sql, $query);

        if ($result) {
            $history = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $history[] = $row;
            }
            $response = [
                'status' => 'success',
                'message' => 'Status history fetched successfully',
                'data' => $history,
                'total' => count($history)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('quotation', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch status history: ' . $error];
        }
        break;

    case 8: // ADD quotation product
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($quotation_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation ID is required'];
            break;
        }
        $qr_id    = isset($postData['qr_id']) ? mysqli_real_escape_string($sql, $postData['qr_id']) : '';
        $product_id    = isset($postData['product_id']) ? mysqli_real_escape_string($sql, $postData['product_id']) : '';
        if (empty($qr_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation Room ID is required'];
            break;
        }
        if (empty($product_id)) {
            $response = ['status' => 'error', 'message' => 'Product ID is required'];
            break;
        }

        $room_id     = isset($postData['room_id']) ? mysqli_real_escape_string($sql, $postData['room_id']) : '';
        $is_special  = isset($postData['is_special']) ? intval($postData['is_special']) : 0;
        $qty_type    = isset($postData['qty_type']) ? mysqli_real_escape_string($sql, $postData['qty_type']) : 'Fixed';
        $qty         = isset($postData['qty']) ? floatval($postData['qty']) : 0;
        $height      = isset($postData['height']) ? floatval($postData['height']) : 0;
        $width       = isset($postData['width']) ? floatval($postData['width']) : 0;
        $depth       = isset($postData['depth']) ? floatval($postData['depth']) : 0;
        $length      = isset($postData['length']) ? floatval($postData['length']) : 0;
        $dimension_unit = isset($postData['dimension_unit']) ? mysqli_real_escape_string($sql, $postData['dimension_unit']) : 'feet';
        $unit_price  = isset($postData['unit_price']) ? floatval($postData['unit_price']) : 0;
        $total_price = isset($postData['total_price']) ? floatval($postData['total_price']) : 0;
        $remark_item = isset($postData['remark']) ? mysqli_real_escape_string($sql, $postData['remark']) : '';

        $calculated_qty = calcQty($qty_type, $qty, $height, $width, $depth, $length);

        $sortQuery = "SELECT MAX(sort_order) as max_sort FROM tbl_quotation_product WHERE qr_id = '$qr_id' AND is_deleted = '1'";
        $sortResult = mysqli_query($sql, $sortQuery);
        $sort_order = 0;
        if ($sortResult && mysqli_num_rows($sortResult) > 0) {
            $sortRow = mysqli_fetch_assoc($sortResult);
            $sort_order = ($sortRow['max_sort'] ?? -1) + 1;
        }

        $productQuery = "INSERT INTO tbl_quotation_product
                          (company_id, quotation_id, qr_id, room_id, product_id,
                           is_special, qty_type, qty, height, width, depth, length,
                           dimension_unit, unit_price, calculated_qty, total_price,
                           remark, sort_order, production_status, is_deleted, c_date)
                          VALUES
                          ('$company_id', '$quotation_id', '$qr_id', '$room_id', '$product_id',
                          '$is_special', '$qty_type', '$qty', '$height', '$width', '$depth', '$length',
                          '$dimension_unit', '$unit_price', '$calculated_qty', '$total_price',
                          '$remark_item', '$sort_order', '1', '1', '$c_date')";

        if (mysqli_query($sql, $productQuery)) {
            $qp_id = mysqli_insert_id($sql);

            $raw_materials = getProductRawMaterials($sql, $product_id, $company_id);
            if (!empty($raw_materials)) {
                foreach ($raw_materials as $rm) {
                    $rm_id = isset($rm['rm_id']) ? mysqli_real_escape_string($sql, $rm['rm_id']) : '';
                    $rm_qty = isset($rm['rm_qty']) ? floatval($rm['rm_qty']) : 0;
                    $unit = isset($rm['unit_name']) ? mysqli_real_escape_string($sql, $rm['unit_name']) : '';
                    $required_qty = calcRmRequiredQty($rm_qty, $calculated_qty);

                    if (!empty($rm_id)) {
                        $rmQuery = "INSERT INTO tbl_quotation_raw_material
                                    (company_id, quotation_id, qp_id, rm_id, required_qty, unit, is_deleted, c_date)
                                    VALUES
                                    ('$company_id', '$quotation_id', '$qp_id', '$rm_id', '$required_qty', '$unit', '1', '$c_date')";
                        mysqli_query($sql, $rmQuery);
                    }
                }
            }

            $updateRoomTotalQuery = "UPDATE tbl_quotation_room
                                     SET room_total = (
                                         SELECT COALESCE(SUM(total_price), 0)
                                         FROM tbl_quotation_product
                                         WHERE qr_id = '$qr_id' AND is_deleted = '1'
                                     )
                                     WHERE qr_id = '$qr_id'";
            mysqli_query($sql, $updateRoomTotalQuery);

            recalculateQuotationTotals($sql, $quotation_id, $company_id);

            $response = ['status' => 'success', 'message' => 'Product added successfully', 'qp_id' => $qp_id];
        } else {
            $error = mysqli_error($sql);
            logError('quotation', $error);
            $response = ['status' => 'error', 'message' => 'Failed to add product: ' . $error];
        }
        break;

    case 9: // UPDATE quotation product
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        $qp_id    = isset($postData['qp_id']) ? mysqli_real_escape_string($sql, $postData['qp_id']) : '';
        if (empty($qp_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation Product ID is required'];
            break;
        }

        $product_id  = isset($postData['product_id']) ? mysqli_real_escape_string($sql, $postData['product_id']) : '';
        $qty_type    = isset($postData['qty_type']) ? mysqli_real_escape_string($sql, $postData['qty_type']) : 'Fixed';
        $qty         = isset($postData['qty']) ? floatval($postData['qty']) : 0;
        $height      = isset($postData['height']) ? floatval($postData['height']) : 0;
        $width       = isset($postData['width']) ? floatval($postData['width']) : 0;
        $depth       = isset($postData['depth']) ? floatval($postData['depth']) : 0;
        $length      = isset($postData['length']) ? floatval($postData['length']) : 0;
        $dimension_unit = isset($postData['dimension_unit']) ? mysqli_real_escape_string($sql, $postData['dimension_unit']) : 'feet';
        $unit_price  = isset($postData['unit_price']) ? floatval($postData['unit_price']) : 0;
        $total_price = isset($postData['total_price']) ? floatval($postData['total_price']) : 0;
        $remark_item = isset($postData['remark']) ? mysqli_real_escape_string($sql, $postData['remark']) : '';

        $calculated_qty = calcQty($qty_type, $qty, $height, $width, $depth, $length);

        $qrQuery = "SELECT qr_id FROM tbl_quotation_product WHERE qp_id = '$qp_id' AND is_deleted = '1'";
        $qrResult = mysqli_query($sql, $qrQuery);
        $qr_id = '';
        if ($qrResult && mysqli_num_rows($qrResult) > 0) {
            $qrRow = mysqli_fetch_assoc($qrResult);
            $qr_id = $qrRow['qr_id'];
        }

        $query = "UPDATE tbl_quotation_product SET
                   product_id = '$product_id',
                   qty_type = '$qty_type',
                   qty = '$qty',
                   height = '$height',
                   width = '$width',
                   depth = '$depth',
                   length = '$length',
                   dimension_unit = '$dimension_unit',
                   unit_price = '$unit_price',
                   calculated_qty = '$calculated_qty',
                   total_price = '$total_price',
                   remark = '$remark_item'
                   WHERE qp_id = '$qp_id' AND is_deleted = '1'";

        if (mysqli_query($sql, $query)) {
            if (!empty($qr_id)) {
                $updateRoomTotalQuery = "UPDATE tbl_quotation_room
                                         SET room_total = (
                                             SELECT COALESCE(SUM(total_price), 0)
                                             FROM tbl_quotation_product
                                             WHERE qr_id = '$qr_id' AND is_deleted = '1'
                                         )
                                         WHERE qr_id = '$qr_id'";
                mysqli_query($sql, $updateRoomTotalQuery);
            }

            recalculateQuotationTotals($sql, $quotation_id, $company_id);

            $response = ['status' => 'success', 'message' => 'Product updated successfully'];
        } else {
            $error = mysqli_error($sql);
            logError('quotation', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update product: ' . $error];
        }
        break;

    case 10: // DELETE quotation product
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        $qp_id    = isset($postData['qp_id']) ? mysqli_real_escape_string($sql, $postData['qp_id']) : '';
        if (empty($qp_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation Product ID is required'];
            break;
        }

        $qrQuery = "SELECT qr_id FROM tbl_quotation_product WHERE qp_id = '$qp_id' AND is_deleted = '1'";
        $qrResult = mysqli_query($sql, $qrQuery);
        $qr_id = '';
        if ($qrResult && mysqli_num_rows($qrResult) > 0) {
            $qrRow = mysqli_fetch_assoc($qrResult);
            $qr_id = $qrRow['qr_id'];
        }

        $query = "UPDATE tbl_quotation_product SET is_deleted = '0' WHERE qp_id = '$qp_id' AND is_deleted = '1'";

        if (mysqli_query($sql, $query)) {
            mysqli_query($sql, "UPDATE tbl_quotation_raw_material SET is_deleted = '0' WHERE qp_id = '$qp_id' AND is_deleted = '1'");
            // Soft delete work status history for this product
            mysqli_query($sql, "UPDATE tbl_work_status_history SET is_deleted = '0' WHERE qp_id = '$qp_id' AND is_deleted = '1'");

            if (!empty($qr_id)) {
                $updateRoomTotalQuery = "UPDATE tbl_quotation_room
                                         SET room_total = (
                                             SELECT COALESCE(SUM(total_price), 0)
                                             FROM tbl_quotation_product
                                             WHERE qr_id = '$qr_id' AND is_deleted = '1'
                                         )
                                         WHERE qr_id = '$qr_id'";
                mysqli_query($sql, $updateRoomTotalQuery);
            }

            recalculateQuotationTotals($sql, $quotation_id, $company_id);

            $response = ['status' => 'success', 'message' => 'Product deleted successfully'];
        } else {
            $error = mysqli_error($sql);
            logError('quotation', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete product: ' . $error];
        }
        break;

    case 11: // ADD ROOM TO QUOTATION
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($quotation_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation ID is required'];
            break;
        }
        $room_id = isset($postData['room_id']) ? mysqli_real_escape_string($sql, $postData['room_id']) : '';
        if (empty($room_id)) {
            $response = ['status' => 'error', 'message' => 'Room ID is required'];
            break;
        }

        $sortQuery = "SELECT MAX(sort_order) as max_sort FROM tbl_quotation_room WHERE quotation_id = '$quotation_id' AND is_deleted = '1'";
        $sortResult = mysqli_query($sql, $sortQuery);
        $sort_order = 0;
        if ($sortResult && mysqli_num_rows($sortResult) > 0) {
            $sortRow = mysqli_fetch_assoc($sortResult);
            $sort_order = ($sortRow['max_sort'] ?? -1) + 1;
        }

        $roomQuery = "INSERT INTO tbl_quotation_room
                       (company_id, quotation_id, room_id, room_total, sort_order, is_deleted, c_date)
                       VALUES
                       ('$company_id', '$quotation_id', '$room_id', '0', '$sort_order', '1', '$c_date')";

        if (mysqli_query($sql, $roomQuery)) {
            $qr_id = mysqli_insert_id($sql);
            $response = ['status' => 'success', 'message' => 'Room added successfully', 'qr_id' => $qr_id];
        } else {
            $error = mysqli_error($sql);
            logError('quotation', $error);
            $response = ['status' => 'error', 'message' => 'Failed to add room: ' . $error];
        }
        break;

    case 12: // DELETE ROOM FROM QUOTATION
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($qr_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation Room ID is required'];
            break;
        }

        $query = "UPDATE tbl_quotation_room SET is_deleted = '0' WHERE qr_id = '$qr_id' AND is_deleted = '1'";

        if (mysqli_query($sql, $query)) {
            mysqli_query($sql, "UPDATE tbl_quotation_product SET is_deleted = '0' WHERE qr_id = '$qr_id' AND is_deleted = '1'");
            mysqli_query($sql, "UPDATE tbl_quotation_raw_material SET is_deleted = '0' WHERE quotation_id = '$quotation_id' AND is_deleted = '1'");
            // Soft delete work status history for all products in this room
            mysqli_query($sql, "UPDATE tbl_work_status_history SET is_deleted = '0' WHERE qr_id = '$qr_id' AND is_deleted = '1'");

            recalculateQuotationTotals($sql, $quotation_id, $company_id);

            $response = ['status' => 'success', 'message' => 'Room deleted successfully'];
        } else {
            $error = mysqli_error($sql);
            logError('quotation', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete room: ' . $error];
        }
        break;

    case 13: // UPDATE DISCOUNT AND GST
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($quotation_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation ID is required'];
            break;
        }

        $discount_type = isset($postData['discount_type']) ? mysqli_real_escape_string($sql, $postData['discount_type']) : 'INR';
        $discount_value = isset($postData['discount_value']) ? floatval($postData['discount_value']) : 0;
        $discount_amount = isset($postData['discount_amount']) ? floatval($postData['discount_amount']) : 0;
        $amount_after_discount = isset($postData['amount_after_discount']) ? floatval($postData['amount_after_discount']) : 0;
        $gst_applicable = isset($postData['gst_applicable']) ? intval($postData['gst_applicable']) : 0;
        $gst_percent = isset($postData['gst_percent']) ? floatval($postData['gst_percent']) : 0;
        $gst_amount = isset($postData['gst_amount']) ? floatval($postData['gst_amount']) : 0;
        $final_amount = isset($postData['final_amount']) ? floatval($postData['final_amount']) : 0;

        $query = "UPDATE tbl_quotation SET
                   discount_type = '$discount_type',
                   discount_value = '$discount_value',
                   discount_amount = '$discount_amount',
                   amount_after_discount = '$amount_after_discount',
                   gst_applicable = '$gst_applicable',
                   gst_percent = '$gst_percent',
                   gst_amount = '$gst_amount',
                   final_amount = '$final_amount'
                   WHERE quotation_id = '$quotation_id' AND is_deleted = '1'";

        if (mysqli_query($sql, $query)) {
            $response = ['status' => 'success', 'message' => 'Discount and GST updated successfully'];
        } else {
            $error = mysqli_error($sql);
            logError('quotation', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update discount and GST: ' . $error];
        }
        break;

    case 14: // UPDATE REMARK
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($quotation_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation ID is required'];
            break;
        }

        $remark = isset($postData['remark']) ? mysqli_real_escape_string($sql, $postData['remark']) : '';

        $query = "UPDATE tbl_quotation SET remark = '$remark' WHERE quotation_id = '$quotation_id' AND is_deleted = '1'";

        if (mysqli_query($sql, $query)) {
            $response = ['status' => 'success', 'message' => 'Remark updated successfully'];
        } else {
            $error = mysqli_error($sql);
            logError('quotation', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update remark: ' . $error];
        }
        break;

    case 15: // UPDATE ROOM SORT ORDER
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($quotation_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation ID is required'];
            break;
        }
        $roomOrder = isset($postData['room_order']) ? $postData['room_order'] : [];
        if (empty($roomOrder) || !is_array($roomOrder)) {
            $response = ['status' => 'error', 'message' => 'Room order data is required'];
            break;
        }

        $errors = [];
        foreach ($roomOrder as $item) {
            $qr_id = isset($item['qr_id']) ? mysqli_real_escape_string($sql, $item['qr_id']) : '';
            $sort_order = isset($item['sort_order']) ? intval($item['sort_order']) : 0;
            if (empty($qr_id)) {
                $errors[] = 'Missing qr_id';
                continue;
            }
            $updateQuery = "UPDATE tbl_quotation_room
                            SET sort_order = '$sort_order'
                            WHERE qr_id = '$qr_id'
                            AND quotation_id = '$quotation_id'
                            AND company_id = '$company_id'
                            AND is_deleted = '1'";
            if (!mysqli_query($sql, $updateQuery)) {
                $errors[] = mysqli_error($sql);
            }
        }

        if (empty($errors)) {
            $response = ['status' => 'success', 'message' => 'Room order updated successfully'];
        } else {
            $response = ['status' => 'error', 'message' => 'Failed to update room order: ' . implode(', ', $errors)];
        }
        break;

    case 16: // LATEST INVOICE GENERATED STATUS HISTORY
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($quotation_id)) {
            $response = ['status' => 'error', 'message' => 'Quotation ID is required'];
            break;
        }

        $query = "SELECT h.company_id, h.history_id, h.quotation_id, h.emp_id, h.status,
                         h.remark, h.c_date, h.c_time, e.name AS emp_name
                  FROM tbl_quotation_status_history h
                  LEFT JOIN tbl_employee e ON e.emp_id = h.emp_id
                  WHERE h.company_id = '$company_id'
                    AND h.quotation_id = '$quotation_id'
                    AND h.status = 'Invoice Generated'
                  ORDER BY h.c_date DESC, h.c_time DESC, h.history_id DESC
                  LIMIT 1";
        $result = mysqli_query($sql, $query);
        if ($result) {
            $historyRow = mysqli_fetch_assoc($result);
            $response = [
                'status' => 'success',
                'message' => $historyRow ? 'Latest invoice generation date fetched' : 'No invoice generation history found',
                'data' => $historyRow ?: null
            ];
        } else {
            $error = mysqli_error($sql);
            logError('quotation', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch invoice generation date'];
        }
        break;

    case 17: // REPLACE RAW MATERIALS FOR A QUOTATION PRODUCT
        if (empty($company_id) || empty($quotation_id) || empty($postData['qp_id'])) {
            $response = ['status' => 'error', 'message' => 'Company ID, quotation ID, and quotation product ID are required'];
            break;
        }
        $qp_id = mysqli_real_escape_string($sql, $postData['qp_id']);
        $raw_materials = isset($postData['raw_materials']) && is_array($postData['raw_materials'])
            ? $postData['raw_materials']
            : null;
        if ($raw_materials === null) {
            $response = ['status' => 'error', 'message' => 'Raw materials must be provided as a list'];
            break;
        }

        $productCheck = mysqli_query($sql, "SELECT qp_id FROM tbl_quotation_product
                                             WHERE qp_id = '$qp_id'
                                               AND quotation_id = '$quotation_id'
                                               AND company_id = '$company_id'
                                               AND is_deleted = '1'
                                             LIMIT 1");
        if (!$productCheck || mysqli_num_rows($productCheck) === 0) {
            $response = ['status' => 'error', 'message' => 'Quotation product not found'];
            break;
        }

        mysqli_begin_transaction($sql);
        $saveFailed = false;
        $saveError = '';
        $deleteQuery = "UPDATE tbl_quotation_raw_material
                        SET is_deleted = '0'
                        WHERE qp_id = '$qp_id'
                          AND quotation_id = '$quotation_id'
                          AND company_id = '$company_id'
                          AND is_deleted = '1'";
        if (!mysqli_query($sql, $deleteQuery)) {
            $saveFailed = true;
            $saveError = mysqli_error($sql);
        }

        foreach ($raw_materials as $material) {
            if ($saveFailed) break;
            $rm_id = isset($material['rm_id']) ? mysqli_real_escape_string($sql, $material['rm_id']) : '';
            $required_qty = isset($material['required_qty']) ? floatval($material['required_qty']) : 0;
            $unit = isset($material['unit']) ? mysqli_real_escape_string($sql, $material['unit']) : '';
            if (empty($rm_id) || $required_qty <= 0) {
                $saveFailed = true;
                $saveError = 'Each raw material needs an ID and quantity greater than zero';
                break;
            }

            $materialCheck = mysqli_query($sql, "SELECT rm_id FROM tbl_raw_material
                                                 WHERE rm_id = '$rm_id'
                                                   AND company_id = '$company_id'
                                                   AND is_deleted = '1'
                                                 LIMIT 1");
            if (!$materialCheck || mysqli_num_rows($materialCheck) === 0) {
                $saveFailed = true;
                $saveError = 'One or more raw materials were not found';
                break;
            }

            $insertQuery = "INSERT INTO tbl_quotation_raw_material
                            (company_id, quotation_id, qp_id, rm_id, required_qty, unit, is_deleted, c_date)
                            VALUES
                            ('$company_id', '$quotation_id', '$qp_id', '$rm_id', '$required_qty', '$unit', '1', '$c_date')";
            if (!mysqli_query($sql, $insertQuery)) {
                $saveFailed = true;
                $saveError = mysqli_error($sql);
            }
        }

        if ($saveFailed) {
            mysqli_rollback($sql);
            logError('quotation', 'Failed to replace product raw materials: ' . $saveError);
            $response = ['status' => 'error', 'message' => 'Failed to update raw materials: ' . $saveError];
        } else {
            mysqli_commit($sql);
            $response = ['status' => 'success', 'message' => 'Product raw materials updated successfully'];
        }
        break;

    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('quotation', "Invalid request type: $type");
}

logResponse('quotation', $response);
echo json_encode($response);
mysqli_close($sql);
?>

<?php
// v1_api/quotation_cart.php
require_once 'dbconnection.php';

$postData = json_decode(file_get_contents('php://input'), true);

logRequest('quotation_cart', $postData);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('quotation_cart', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;

$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$cart_id = isset($postData['cart_id']) ? mysqli_real_escape_string($sql, $postData['cart_id']) : '';
$client_id = isset($postData['client_id']) ? mysqli_real_escape_string($sql, $postData['client_id']) : '';
$package_id = isset($postData['package_id']) ? mysqli_real_escape_string($sql, $postData['package_id']) : '';
$generated_by = isset($postData['generated_by']) ? mysqli_real_escape_string($sql, $postData['generated_by']) : '';
$current_step = isset($postData['current_step']) ? max(1, min(6, intval($postData['current_step']))) : 1;

$subtotal = isset($postData['subtotal']) ? floatval($postData['subtotal']) : 0;
$discount_type = isset($postData['discount_type']) ? mysqli_real_escape_string($sql, $postData['discount_type']) : 'INR';
$discount_value = isset($postData['discount_value']) ? floatval($postData['discount_value']) : 0;
$discount_amount = isset($postData['discount_amount']) ? floatval($postData['discount_amount']) : 0;
$amount_after_discount = isset($postData['amount_after_discount']) ? floatval($postData['amount_after_discount']) : 0;
$gst_applicable = isset($postData['gst_applicable']) ? intval($postData['gst_applicable']) : 0;
$gst_percent = isset($postData['gst_percent']) ? floatval($postData['gst_percent']) : 0;
$gst_amount = isset($postData['gst_amount']) ? floatval($postData['gst_amount']) : 0;
$final_amount = isset($postData['final_amount']) ? floatval($postData['final_amount']) : 0;
$remark = isset($postData['remark']) ? mysqli_real_escape_string($sql, $postData['remark']) : '';
$rooms = isset($postData['rooms']) ? $postData['rooms'] : [];
$status = isset($postData['status']) ? mysqli_real_escape_string($sql, $postData['status']) : 'Draft';

$c_date = date('Y-m-d');
$time = date('H:i:s');
$date_time = date('Y-m-d H:i:s');

$response = ['status' => 'error', 'message' => 'Invalid request'];

// Helper functions
function generateCartNumber($sql, $company_id) {
    $currentYear = date('Y');
    $query = "SELECT COUNT(*) as count FROM tbl_quotation_cart WHERE company_id = '$company_id' AND YEAR(c_date) = '$currentYear' AND is_deleted = '1'";
    $result = mysqli_query($sql, $query);
    if ($result && mysqli_num_rows($result) > 0) {
        $row = mysqli_fetch_assoc($result);
        $count = $row['count'] + 1;
    } else {
        $count = 1;
    }
    return "DRAFT-" . $currentYear . "-" . str_pad($count, 4, '0', STR_PAD_LEFT);
}

function calcQty($qty_type, $qty, $height, $width, $depth, $length) {
    if ($qty_type === 'ByHWD') return round($height * $width * $depth * $qty, 2);
    if ($qty_type === 'ByHWL') return round($height * $width * $length * $qty, 2);
    if ($qty_type === 'ByHW')  return round($height * $width * $qty, 2);
    return floatval($qty);
}

function recalculateCartTotals($sql, $cart_id, $company_id) {
    global $date_time;
    $roomQuery = "SELECT qcr_id FROM tbl_quotation_cart_room WHERE cart_id = '$cart_id' AND is_deleted = '1'";
    $roomResult = mysqli_query($sql, $roomQuery);
    
    $subtotal = 0;
    while ($roomRow = mysqli_fetch_assoc($roomResult)) {
        $roomTotalQuery = "SELECT COALESCE(SUM(total_price), 0) as room_total 
                           FROM tbl_quotation_cart_product 
                           WHERE qcr_id = '{$roomRow['qcr_id']}' AND is_deleted = '1'";
        $roomTotalResult = mysqli_query($sql, $roomTotalQuery);
        if ($roomTotalResult && mysqli_num_rows($roomTotalResult) > 0) {
            $roomTotalRow = mysqli_fetch_assoc($roomTotalResult);
            $subtotal += floatval($roomTotalRow['room_total']);
        }
    }

    $cartQuery = "SELECT discount_type, discount_value, discount_amount, gst_percent 
                   FROM tbl_quotation_cart WHERE cart_id = '$cart_id' AND is_deleted = '1'";
    $cartResult = mysqli_query($sql, $cartQuery);
    $discount_amount = 0;
    $gst_percent = 0;
    if ($cartResult && mysqli_num_rows($cartResult) > 0) {
        $cartRow = mysqli_fetch_assoc($cartResult);
        $discount_amount = floatval($cartRow['discount_amount'] ?? 0);
        $gst_percent = floatval($cartRow['gst_percent'] ?? 0);
    }

    $amount_after_discount = max(0, $subtotal - $discount_amount);
    $gst_amount = ($amount_after_discount * $gst_percent) / 100;
    $final_amount = $amount_after_discount + $gst_amount;

    $updateQuery = "UPDATE tbl_quotation_cart SET
                     subtotal = '$subtotal',
                     amount_after_discount = '$amount_after_discount',
                     gst_amount = '$gst_amount',
                     final_amount = '$final_amount',
                     updated_at = '$date_time'
                     WHERE cart_id = '$cart_id' AND is_deleted = '1'";
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

switch ($type) {

    case 1: // CREATE NEW CART/DRAFT
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

        $cart_number = generateCartNumber($sql, $company_id);

        $query = "INSERT INTO tbl_quotation_cart
                   (company_id, cart_number, client_id, package_id, generated_by, current_step,
                    subtotal, discount_type, discount_value, discount_amount, amount_after_discount,
                    gst_applicable, gst_percent, gst_amount, final_amount, remark,
                    status, is_deleted, c_date)
                   VALUES
                   ('$company_id', '$cart_number', '$client_id', '$package_id', '$generated_by', '$current_step',
                   '$subtotal', '$discount_type', '$discount_value', '$discount_amount', '$amount_after_discount',
                   '$gst_applicable', '$gst_percent', '$gst_amount', '$final_amount', '$remark',
                   'Draft', '1', '$date_time')";

        if (mysqli_query($sql, $query)) {
            $new_cart_id = mysqli_insert_id($sql);

            // Insert rooms if provided
            $sort_order = 0;
            foreach ($rooms as $room) {
                $room_id = isset($room['room_id']) ? mysqli_real_escape_string($sql, $room['room_id']) : '';
                $room_total = isset($room['room_total']) ? floatval($room['room_total']) : 0;

                $roomQuery = "INSERT INTO tbl_quotation_cart_room
                               (company_id, cart_id, room_id, room_total, sort_order, is_deleted, c_date)
                               VALUES
                               ('$company_id', '$new_cart_id', '$room_id', '$room_total', '$sort_order', '1', '$date_time')";
                mysqli_query($sql, $roomQuery);
                $qcr_id = mysqli_insert_id($sql);

                // Insert items/room products if provided
                if (isset($room['items']) && is_array($room['items'])) {
                    $item_sort = 0;
                    foreach ($room['items'] as $item) {
                        if (isset($item['included']) && !$item['included']) {
                            continue;
                        }

                        $product_id = isset($item['product_id']) ? mysqli_real_escape_string($sql, $item['product_id']) : '';
                        $is_special = isset($item['is_special']) ? intval($item['is_special']) : 0;
                        $qty_type = isset($item['qty_type']) ? mysqli_real_escape_string($sql, $item['qty_type']) : 'Fixed';
                        $qty = isset($item['qty']) ? floatval($item['qty']) : 1;
                        $height = isset($item['height']) ? floatval($item['height']) : 0;
                        $width = isset($item['width']) ? floatval($item['width']) : 0;
                        $depth = isset($item['depth']) ? floatval($item['depth']) : 0;
                        $length = isset($item['length']) ? floatval($item['length']) : 0;
                        $dimension_unit = isset($item['dimension_unit']) ? mysqli_real_escape_string($sql, $item['dimension_unit']) : '';
                        $unit_price = isset($item['unit_price']) ? floatval($item['unit_price']) : 0;
                        $calculated_qty = isset($item['calculated_qty']) ? floatval($item['calculated_qty']) : calcQty($qty_type, $qty, $height, $width, $depth, $length);
                        $total_price = isset($item['total_price']) ? floatval($item['total_price']) : round($calculated_qty * $unit_price, 2);
                        $remark_item = isset($item['remark']) ? mysqli_real_escape_string($sql, $item['remark']) : '';

                        $productQuery = "INSERT INTO tbl_quotation_cart_product
                                          (company_id, cart_id, qcr_id, room_id, product_id,
                                           is_special, qty_type, qty, height, width, depth, length,
                                           dimension_unit, unit_price, calculated_qty, total_price,
                                           remark, sort_order, is_deleted, c_date)
                                          VALUES
                                          ('$company_id', '$new_cart_id', '$qcr_id', '$room_id', '$product_id',
                                          '$is_special', '$qty_type', '$qty', '$height', '$width', '$depth', '$length',
                                          '$dimension_unit', '$unit_price', '$calculated_qty', '$total_price',
                                          '$remark_item', '$item_sort', '1', '$date_time')";
                        mysqli_query($sql, $productQuery);
                        $qcp_id = mysqli_insert_id($sql);

                        // Insert raw materials
                        $raw_materials = getProductRawMaterials($sql, $product_id, $company_id);
                        if (!empty($raw_materials)) {
                            foreach ($raw_materials as $rm) {
                                $rm_id = isset($rm['rm_id']) ? mysqli_real_escape_string($sql, $rm['rm_id']) : '';
                                $rm_qty = isset($rm['rm_qty']) ? floatval($rm['rm_qty']) : 0;
                                $unit = isset($rm['unit_name']) ? mysqli_real_escape_string($sql, $rm['unit_name']) : '';
                                $required_qty = calcRmRequiredQty($rm_qty, $calculated_qty);
                                
                                if (!empty($rm_id)) {
                                    $rmQuery = "INSERT INTO tbl_quotation_cart_raw_material
                                                (company_id, cart_id, qcp_id, rm_id, required_qty, unit, is_deleted, c_date)
                                                VALUES
                                                ('$company_id', '$new_cart_id', '$qcp_id', '$rm_id', '$required_qty', '$unit', '1', '$date_time')";
                                    mysqli_query($sql, $rmQuery);
                                }
                            }
                        }
                        $item_sort++;
                    }
                }
                $sort_order++;
            }

            $response = [
                'status' => 'success',
                'message' => 'Draft created successfully',
                'cart_id' => $new_cart_id,
                'cart_number' => $cart_number
            ];
        } else {
            $error = mysqli_error($sql);
            logError('quotation_cart', $error);
            $response = ['status' => 'error', 'message' => 'Failed to create draft: ' . $error];
        }
        break;

    case 2: // GET ALL CARTS/DRAFTS
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }

        $query = "SELECT c.*, cl.client_name, cl.client_email, cl.phone1, cl.phone2,
                         cl.whatsapp_number, cl.address, cl.state_id, cl.city_id, cl.area_id,
                         p.package_name, e.name as generated_by_name
                   FROM tbl_quotation_cart c
                   LEFT JOIN tbl_client cl ON c.client_id = cl.client_id
                   LEFT JOIN tbl_package p ON c.package_id = p.package_id
                   LEFT JOIN tbl_employee e ON c.generated_by = e.emp_id
                   WHERE c.company_id = '$company_id' AND c.status = 'Draft' AND c.is_deleted = '1'
                   ORDER BY c.cart_id DESC";

        $result = mysqli_query($sql, $query);
        if ($result) {
            $carts = [];
            while ($row = mysqli_fetch_assoc($result)) {
                // Get rooms for this cart
                $roomQuery = "SELECT qcr.*, r.room_name
                               FROM tbl_quotation_cart_room qcr
                               LEFT JOIN tbl_room r ON qcr.room_id = r.room_id
                               WHERE qcr.cart_id = '{$row['cart_id']}' AND qcr.is_deleted = '1'
                               ORDER BY qcr.sort_order ASC";
                $roomResult = mysqli_query($sql, $roomQuery);
                $roomsArr = [];
                while ($roomRow = mysqli_fetch_assoc($roomResult)) {
                    $productQuery = "SELECT qcp.*, pr.product_name
                                       FROM tbl_quotation_cart_product qcp
                                       LEFT JOIN tbl_product pr ON qcp.product_id = pr.product_id
                                       WHERE qcp.cart_id = '{$row['cart_id']}'
                                       AND qcp.qcr_id = '{$roomRow['qcr_id']}'
                                       AND qcp.is_deleted = '1'
                                       ORDER BY qcp.sort_order ASC";
                    $productResult = mysqli_query($sql, $productQuery);
                    $products = [];
                    while ($productRow = mysqli_fetch_assoc($productResult)) {
                        $rmQuery = "SELECT qcrm.*, rm.rm_name 
                                     FROM tbl_quotation_cart_raw_material qcrm
                                     LEFT JOIN tbl_raw_material rm ON qcrm.rm_id = rm.rm_id
                                     WHERE qcrm.cart_id = '{$row['cart_id']}'
                                     AND qcrm.qcp_id = '{$productRow['qcp_id']}'
                                     AND qcrm.is_deleted = '1'";
                        $rmResult = mysqli_query($sql, $rmQuery);
                        $rawMaterials = [];
                        while ($rmRow = mysqli_fetch_assoc($rmResult)) {
                            $rawMaterials[] = $rmRow;
                        }
                        $productRow['raw_materials'] = $rawMaterials;
                        $products[] = $productRow;
                    }
                    $roomRow['items'] = $products;
                    $roomsArr[] = $roomRow;
                }
                $row['rooms'] = $roomsArr;
                $carts[] = $row;
            }

            $response = [
                'status' => 'success',
                'message' => 'Drafts fetched successfully',
                'data' => $carts,
                'total' => count($carts)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('quotation_cart', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch drafts: ' . $error];
        }
        break;

    case 3: // GET SINGLE CART BY ID
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($cart_id)) {
            $response = ['status' => 'error', 'message' => 'Cart ID is required'];
            break;
        }

        $query = "SELECT c.*, cl.client_name, cl.client_email, cl.phone1, cl.phone2,
                         cl.whatsapp_number, cl.address, cl.state_id, cl.city_id, cl.area_id,
                         p.package_name, e.name as generated_by_name
                   FROM tbl_quotation_cart c
                   LEFT JOIN tbl_client cl ON c.client_id = cl.client_id
                   LEFT JOIN tbl_package p ON c.package_id = p.package_id
                   LEFT JOIN tbl_employee e ON c.generated_by = e.emp_id
                   WHERE c.cart_id = '$cart_id' AND c.company_id = '$company_id' AND c.is_deleted = '1'
                   LIMIT 1";

        $result = mysqli_query($sql, $query);
        if ($result && mysqli_num_rows($result) > 0) {
            $row = mysqli_fetch_assoc($result);

            $roomQuery = "SELECT qcr.*, r.room_name
                           FROM tbl_quotation_cart_room qcr
                           LEFT JOIN tbl_room r ON qcr.room_id = r.room_id
                           WHERE qcr.cart_id = '$cart_id' AND qcr.is_deleted = '1'
                           ORDER BY qcr.sort_order ASC";
            $roomResult = mysqli_query($sql, $roomQuery);
            $roomsArr = [];
            while ($roomRow = mysqli_fetch_assoc($roomResult)) {
                $productQuery = "SELECT qcp.*, pr.product_name
                                   FROM tbl_quotation_cart_product qcp
                                   LEFT JOIN tbl_product pr ON qcp.product_id = pr.product_id
                                   WHERE qcp.cart_id = '$cart_id'
                                   AND qcp.qcr_id = '{$roomRow['qcr_id']}'
                                   AND qcp.is_deleted = '1'
                                   ORDER BY qcp.sort_order ASC";
                $productResult = mysqli_query($sql, $productQuery);
                $products = [];
                while ($productRow = mysqli_fetch_assoc($productResult)) {
                    $rmQuery = "SELECT qcrm.*, rm.rm_name 
                                 FROM tbl_quotation_cart_raw_material qcrm
                                 LEFT JOIN tbl_raw_material rm ON qcrm.rm_id = rm.rm_id
                                 WHERE qcrm.cart_id = '$cart_id'
                                 AND qcrm.qcp_id = '{$productRow['qcp_id']}'
                                 AND qcrm.is_deleted = '1'";
                    $rmResult = mysqli_query($sql, $rmQuery);
                    $rawMaterials = [];
                    while ($rmRow = mysqli_fetch_assoc($rmResult)) {
                        $rawMaterials[] = $rmRow;
                    }
                    $productRow['raw_materials'] = $rawMaterials;
                    $products[] = $productRow;
                }
                $roomRow['items'] = $products;
                $roomsArr[] = $roomRow;
            }
            $row['rooms'] = $roomsArr;

            $response = [
                'status' => 'success',
                'message' => 'Draft fetched successfully',
                'data' => $row
            ];
        } else {
            $response = ['status' => 'error', 'message' => 'Draft not found'];
        }
        break;

    case 4: // UPDATE CART
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($cart_id)) {
            $response = ['status' => 'error', 'message' => 'Cart ID is required'];
            break;
        }
        $cartCheck = mysqli_query($sql, "SELECT cart_id FROM tbl_quotation_cart WHERE cart_id = '$cart_id' AND company_id = '$company_id' AND status = 'Draft' AND is_deleted = '1' LIMIT 1");
        if (!$cartCheck || mysqli_num_rows($cartCheck) === 0) {
            $response = ['status' => 'error', 'message' => 'Draft not found'];
            break;
        }

        $updateFields = [];
        if (isset($postData['client_id'])) $updateFields[] = "client_id = '$client_id'";
        if (isset($postData['package_id'])) $updateFields[] = "package_id = '$package_id'";
        if (isset($postData['current_step'])) $updateFields[] = "current_step = '$current_step'";
        if (isset($postData['subtotal'])) $updateFields[] = "subtotal = '$subtotal'";
        if (isset($postData['discount_type'])) $updateFields[] = "discount_type = '$discount_type'";
        if (isset($postData['discount_value'])) $updateFields[] = "discount_value = '$discount_value'";
        if (isset($postData['discount_amount'])) $updateFields[] = "discount_amount = '$discount_amount'";
        if (isset($postData['amount_after_discount'])) $updateFields[] = "amount_after_discount = '$amount_after_discount'";
        if (isset($postData['gst_applicable'])) $updateFields[] = "gst_applicable = '$gst_applicable'";
        if (isset($postData['gst_percent'])) $updateFields[] = "gst_percent = '$gst_percent'";
        if (isset($postData['gst_amount'])) $updateFields[] = "gst_amount = '$gst_amount'";
        if (isset($postData['final_amount'])) $updateFields[] = "final_amount = '$final_amount'";
        if (isset($postData['remark'])) $updateFields[] = "remark = '$remark'";
        if (isset($postData['status'])) $updateFields[] = "status = '$status'";
        $updateFields[] = "updated_at = '$date_time'";

        if (empty($updateFields)) {
            $response = ['status' => 'error', 'message' => 'No fields to update'];
            break;
        }

        $query = "UPDATE tbl_quotation_cart SET " . implode(', ', $updateFields) . " WHERE cart_id = '$cart_id' AND company_id = '$company_id' AND status = 'Draft' AND is_deleted = '1'";

        if (mysqli_query($sql, $query)) {
            // Update rooms if provided
            if (isset($postData['rooms']) && is_array($postData['rooms'])) {
                // First, soft delete existing rooms
                mysqli_query($sql, "UPDATE tbl_quotation_cart_room SET is_deleted = '0' WHERE cart_id = '$cart_id' AND is_deleted = '1'");
                
                $sort_order = 0;
                foreach ($rooms as $room) {
                    $room_id = isset($room['room_id']) ? mysqli_real_escape_string($sql, $room['room_id']) : '';
                    $room_total = isset($room['room_total']) ? floatval($room['room_total']) : 0;
                    $room_selected = isset($room['selected']) ? intval($room['selected']) : 1;

                    // Check if room already exists in cart
                    $checkQuery = "SELECT qcr_id FROM tbl_quotation_cart_room WHERE cart_id = '$cart_id' AND room_id = '$room_id' AND is_deleted = '1'";
                    $checkResult = mysqli_query($sql, $checkQuery);
                    if (mysqli_num_rows($checkResult) > 0) {
                        $checkRow = mysqli_fetch_assoc($checkResult);
                        $qcr_id = $checkRow['qcr_id'];
                        // Update room total
                        mysqli_query($sql, "UPDATE tbl_quotation_cart_room SET room_total = '$room_total', sort_order = '$sort_order' WHERE qcr_id = '$qcr_id'");
                    } else {
                        // Insert new room
                        $roomQuery = "INSERT INTO tbl_quotation_cart_room
                                       (company_id, cart_id, room_id, room_total, sort_order, is_deleted, c_date)
                                       VALUES
                                       ('$company_id', '$cart_id', '$room_id', '$room_total', '$sort_order', '1', '$date_time')";
                        mysqli_query($sql, $roomQuery);
                        $qcr_id = mysqli_insert_id($sql);
                    }

                    // Update items for this room
                    if (isset($room['items']) && is_array($room['items'])) {
                        // Soft delete existing products for this room
                        mysqli_query($sql, "UPDATE tbl_quotation_cart_product SET is_deleted = '0' WHERE qcr_id = '$qcr_id' AND is_deleted = '1'");
                        
                        $item_sort = 0;
                        foreach ($room['items'] as $item) {
                            if (isset($item['included']) && !$item['included']) {
                                continue;
                            }

                            $product_id = isset($item['product_id']) ? mysqli_real_escape_string($sql, $item['product_id']) : '';
                            $is_special = isset($item['is_special']) ? intval($item['is_special']) : 0;
                            $qty_type = isset($item['qty_type']) ? mysqli_real_escape_string($sql, $item['qty_type']) : 'Fixed';
                            $qty = isset($item['qty']) ? floatval($item['qty']) : 1;
                            $height = isset($item['height']) ? floatval($item['height']) : 0;
                            $width = isset($item['width']) ? floatval($item['width']) : 0;
                            $depth = isset($item['depth']) ? floatval($item['depth']) : 0;
                            $length = isset($item['length']) ? floatval($item['length']) : 0;
                            $dimension_unit = isset($item['dimension_unit']) ? mysqli_real_escape_string($sql, $item['dimension_unit']) : '';
                            $unit_price = isset($item['unit_price']) ? floatval($item['unit_price']) : 0;
                            $calculated_qty = isset($item['calculated_qty']) ? floatval($item['calculated_qty']) : calcQty($qty_type, $qty, $height, $width, $depth, $length);
                            $total_price = isset($item['total_price']) ? floatval($item['total_price']) : round($calculated_qty * $unit_price, 2);
                            $remark_item = isset($item['remark']) ? mysqli_real_escape_string($sql, $item['remark']) : '';

                            // Check if product already exists in this room
                            $checkProductQuery = "SELECT qcp_id FROM tbl_quotation_cart_product 
                                                   WHERE qcr_id = '$qcr_id' AND product_id = '$product_id' AND is_deleted = '1'";
                            $checkProductResult = mysqli_query($sql, $checkProductQuery);
                            
                            if (mysqli_num_rows($checkProductResult) > 0) {
                                $checkProductRow = mysqli_fetch_assoc($checkProductResult);
                                $qcp_id = $checkProductRow['qcp_id'];
                                // Update product
                                $updateProductQuery = "UPDATE tbl_quotation_cart_product SET
                                                         qty_type = '$qty_type', qty = '$qty', height = '$height',
                                                         width = '$width', depth = '$depth', length = '$length',
                                                         dimension_unit = '$dimension_unit', unit_price = '$unit_price',
                                                         calculated_qty = '$calculated_qty', total_price = '$total_price',
                                                         remark = '$remark_item', sort_order = '$item_sort'
                                                         WHERE qcp_id = '$qcp_id'";
                                mysqli_query($sql, $updateProductQuery);
                            } else {
                                $productQuery = "INSERT INTO tbl_quotation_cart_product
                                                  (company_id, cart_id, qcr_id, room_id, product_id,
                                                   is_special, qty_type, qty, height, width, depth, length,
                                                   dimension_unit, unit_price, calculated_qty, total_price,
                                                   remark, sort_order, is_deleted, c_date)
                                                  VALUES
                                                  ('$company_id', '$cart_id', '$qcr_id', '$room_id', '$product_id',
                                                  '$is_special', '$qty_type', '$qty', '$height', '$width', '$depth', '$length',
                                                  '$dimension_unit', '$unit_price', '$calculated_qty', '$total_price',
                                                  '$remark_item', '$item_sort', '1', '$date_time')";
                                mysqli_query($sql, $productQuery);
                                $qcp_id = mysqli_insert_id($sql);
                            }

                            // Update raw materials
                            mysqli_query($sql, "UPDATE tbl_quotation_cart_raw_material SET is_deleted = '0' WHERE qcp_id = '$qcp_id' AND is_deleted = '1'");
                            
                            $raw_materials = getProductRawMaterials($sql, $product_id, $company_id);
                            if (!empty($raw_materials)) {
                                foreach ($raw_materials as $rm) {
                                    $rm_id = isset($rm['rm_id']) ? mysqli_real_escape_string($sql, $rm['rm_id']) : '';
                                    $rm_qty = isset($rm['rm_qty']) ? floatval($rm['rm_qty']) : 0;
                                    $unit = isset($rm['unit_name']) ? mysqli_real_escape_string($sql, $rm['unit_name']) : '';
                                    $required_qty = calcRmRequiredQty($rm_qty, $calculated_qty);
                                    
                                    if (!empty($rm_id)) {
                                        $checkRmQuery = "SELECT qcrm_id FROM tbl_quotation_cart_raw_material 
                                                          WHERE qcp_id = '$qcp_id' AND rm_id = '$rm_id' AND is_deleted = '1'";
                                        $checkRmResult = mysqli_query($sql, $checkRmQuery);
                                        if (mysqli_num_rows($checkRmResult) > 0) {
                                            $checkRmRow = mysqli_fetch_assoc($checkRmResult);
                                            mysqli_query($sql, "UPDATE tbl_quotation_cart_raw_material SET 
                                                                required_qty = '$required_qty', unit = '$unit' 
                                                                WHERE qcrm_id = '{$checkRmRow['qcrm_id']}'");
                                        } else {
                                            $rmQuery = "INSERT INTO tbl_quotation_cart_raw_material
                                                        (company_id, cart_id, qcp_id, rm_id, required_qty, unit, is_deleted, c_date)
                                                        VALUES
                                                        ('$company_id', '$cart_id', '$qcp_id', '$rm_id', '$required_qty', '$unit', '1', '$date_time')";
                                            mysqli_query($sql, $rmQuery);
                                        }
                                    }
                                }
                            }
                            $item_sort++;
                        }
                    }
                    $sort_order++;
                }
                
                // Recalculate totals
                recalculateCartTotals($sql, $cart_id, $company_id);
            }

            $response = ['status' => 'success', 'message' => 'Draft updated successfully'];
        } else {
            $error = mysqli_error($sql);
            logError('quotation_cart', $error);
            $response = ['status' => 'error', 'message' => 'Failed to update draft: ' . $error];
        }
        break;

    case 5: // DELETE CART (soft delete)
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($cart_id)) {
            $response = ['status' => 'error', 'message' => 'Cart ID is required'];
            break;
        }
        $cartCheck = mysqli_query($sql, "SELECT cart_id FROM tbl_quotation_cart WHERE cart_id = '$cart_id' AND company_id = '$company_id' AND status = 'Draft' AND is_deleted = '1' LIMIT 1");
        if (!$cartCheck || mysqli_num_rows($cartCheck) === 0) {
            $response = ['status' => 'error', 'message' => 'Draft not found'];
            break;
        }

        $query = "UPDATE tbl_quotation_cart SET is_deleted = '0' WHERE cart_id = '$cart_id' AND company_id = '$company_id' AND status = 'Draft' AND is_deleted = '1'";

        if (mysqli_query($sql, $query)) {
            mysqli_query($sql, "UPDATE tbl_quotation_cart_room SET is_deleted = '0' WHERE cart_id = '$cart_id' AND is_deleted = '1'");
            mysqli_query($sql, "UPDATE tbl_quotation_cart_product SET is_deleted = '0' WHERE cart_id = '$cart_id' AND is_deleted = '1'");
            mysqli_query($sql, "UPDATE tbl_quotation_cart_raw_material SET is_deleted = '0' WHERE cart_id = '$cart_id' AND is_deleted = '1'");
            
            $response = ['status' => 'success', 'message' => 'Draft deleted successfully'];
        } else {
            $error = mysqli_error($sql);
            logError('quotation_cart', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete draft: ' . $error];
        }
        break;

    case 6: // CONVERT CART TO QUOTATION
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        if (empty($cart_id)) {
            $response = ['status' => 'error', 'message' => 'Cart ID is required'];
            break;
        }

        // Get cart data
        $cartQuery = "SELECT * FROM tbl_quotation_cart WHERE cart_id = '$cart_id' AND company_id = '$company_id' AND status = 'Draft' AND is_deleted = '1'";
        $cartResult = mysqli_query($sql, $cartQuery);
        if (!$cartResult || mysqli_num_rows($cartResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Draft not found'];
            break;
        }
        $cartData = mysqli_fetch_assoc($cartResult);

        // Get company code for quotation number
        $companyQuery = "SELECT company_code FROM tbl_company WHERE company_id = '{$cartData['company_id']}' AND is_deleted = '1'";
        $companyResult = mysqli_query($sql, $companyQuery);
        $company_code = "";
        if ($companyResult && mysqli_num_rows($companyResult) > 0) {
            $company = mysqli_fetch_assoc($companyResult);
            $company_code = $company['company_code'];
        }

        // Generate quotation number
        $currentDate = date('Y-m-d');
        $currentYear = date('Y');
        $financialYearStart = $currentYear . '-04-01';
        $yearDisplay = $currentYear;
        
        $countQuery = "SELECT COUNT(*) as count FROM tbl_quotation WHERE company_id = '{$cartData['company_id']}' AND quotation_date >= '$financialYearStart' AND is_deleted = '1'";
        $countResult = mysqli_query($sql, $countQuery);
        if ($countResult && mysqli_num_rows($countResult) > 0) {
            $countRow = mysqli_fetch_assoc($countResult);
            $count = $countRow['count'] + 1;
        } else {
            $count = 1;
        }
        $quotation_number = $company_code . "-" . $yearDisplay . "-" . str_pad($count, 4, '0', STR_PAD_LEFT);

        // Insert into tbl_quotation
        $insertQuery = "INSERT INTO tbl_quotation
                         (company_id, cart_id, quotation_number, client_id, package_id, generated_by,
                          subtotal, discount_type, discount_value, discount_amount, amount_after_discount,
                          gst_applicable, gst_percent, gst_amount, final_amount, remark,
                          status, is_deleted, c_date, quotation_date)
                         VALUES
                         ('{$cartData['company_id']}', '$cart_id', '$quotation_number', '{$cartData['client_id']}', '{$cartData['package_id']}', '{$cartData['generated_by']}',
                         '{$cartData['subtotal']}', '{$cartData['discount_type']}', '{$cartData['discount_value']}', '{$cartData['discount_amount']}', '{$cartData['amount_after_discount']}',
                         '{$cartData['gst_applicable']}', '{$cartData['gst_percent']}', '{$cartData['gst_amount']}', '{$cartData['final_amount']}', '{$cartData['remark']}',
                         'Pending', '1', '$date_time', '$c_date')";

        if (mysqli_query($sql, $insertQuery)) {
            $new_quotation_id = mysqli_insert_id($sql);

            // Get cart rooms
            $roomQuery = "SELECT * FROM tbl_quotation_cart_room WHERE cart_id = '$cart_id' AND is_deleted = '1' ORDER BY sort_order ASC";
            $roomResult = mysqli_query($sql, $roomQuery);
            while ($roomRow = mysqli_fetch_assoc($roomResult)) {
                // Insert into tbl_quotation_room
                $insertRoomQuery = "INSERT INTO tbl_quotation_room
                                     (company_id, quotation_id, room_id, room_total, sort_order, is_deleted, c_date)
                                     VALUES
                                     ('{$roomRow['company_id']}', '$new_quotation_id', '{$roomRow['room_id']}', '{$roomRow['room_total']}', '{$roomRow['sort_order']}', '1', '$date_time')";
                mysqli_query($sql, $insertRoomQuery);
                $qr_id = mysqli_insert_id($sql);

                // Get cart products for this room
                $productQuery = "SELECT * FROM tbl_quotation_cart_product WHERE cart_id = '$cart_id' AND qcr_id = '{$roomRow['qcr_id']}' AND is_deleted = '1' ORDER BY sort_order ASC";
                $productResult = mysqli_query($sql, $productQuery);
                while ($productRow = mysqli_fetch_assoc($productResult)) {
                    $insertProductQuery = "INSERT INTO tbl_quotation_product
                                            (company_id, quotation_id, qr_id, room_id, product_id,
                                             is_special, qty_type, qty, height, width, depth, length,
                                             dimension_unit, unit_price, calculated_qty, total_price,
                                             remark, sort_order, is_deleted, c_date)
                                            VALUES
                                            ('{$productRow['company_id']}', '$new_quotation_id', '$qr_id', '{$productRow['room_id']}', '{$productRow['product_id']}',
                                            '{$productRow['is_special']}', '{$productRow['qty_type']}', '{$productRow['qty']}', '{$productRow['height']}', '{$productRow['width']}', '{$productRow['depth']}', '{$productRow['length']}',
                                            '{$productRow['dimension_unit']}', '{$productRow['unit_price']}', '{$productRow['calculated_qty']}', '{$productRow['total_price']}',
                                            '{$productRow['remark']}', '{$productRow['sort_order']}', '1', '$date_time')";
                    mysqli_query($sql, $insertProductQuery);
                    $qp_id = mysqli_insert_id($sql);

                    // Get cart raw materials for this product
                    $rmQuery = "SELECT * FROM tbl_quotation_cart_raw_material WHERE cart_id = '$cart_id' AND qcp_id = '{$productRow['qcp_id']}' AND is_deleted = '1'";
                    $rmResult = mysqli_query($sql, $rmQuery);
                    while ($rmRow = mysqli_fetch_assoc($rmResult)) {
                        $insertRmQuery = "INSERT INTO tbl_quotation_raw_material
                                            (company_id, quotation_id, qp_id, rm_id, required_qty, unit, is_deleted, c_date)
                                            VALUES
                                            ('{$rmRow['company_id']}', '$new_quotation_id', '$qp_id', '{$rmRow['rm_id']}', '{$rmRow['required_qty']}', '{$rmRow['unit']}', '1', '$date_time')";
                        mysqli_query($sql, $insertRmQuery);
                    }
                }
            }

            // Update cart status to Converted
            mysqli_query($sql, "UPDATE tbl_quotation_cart SET status = 'Converted', updated_at = '$date_time' WHERE cart_id = '$cart_id'");

            // Add status history entry
            $empNameQuery = "SELECT name FROM tbl_employee WHERE emp_id = '{$cartData['generated_by']}' AND is_deleted = '1'";
            $empResult = mysqli_query($sql, $empNameQuery);
            $empName = '';
            if ($empResult && mysqli_num_rows($empResult) > 0) {
                $empData = mysqli_fetch_assoc($empResult);
                $empName = $empData['name'];
            }
            
            $customerQuery = "SELECT client_name FROM tbl_client WHERE client_id = '{$cartData['client_id']}' AND is_deleted = '1'";
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
                              ('{$cartData['company_id']}', '$new_quotation_id', '{$cartData['generated_by']}', 'Pending', 
                               'Quotation created from draft by $empName for customer $customerName on $formattedDate at $formattedTime', 
                               '$c_date', '$time')";
            mysqli_query($sql, $historyQuery);

            $response = [
                'status' => 'success',
                'message' => 'Draft converted to quotation successfully',
                'quotation_id' => $new_quotation_id,
                'quotation_number' => $quotation_number,
                'cart_id' => $cart_id
            ];
        } else {
            $error = mysqli_error($sql);
            logError('quotation_cart', $error);
            $response = ['status' => 'error', 'message' => 'Failed to convert draft: ' . $error];
        }
        break;

    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('quotation_cart', "Invalid request type: $type");
}

logResponse('quotation_cart', $response);
echo json_encode($response);
mysqli_close($sql);
?>

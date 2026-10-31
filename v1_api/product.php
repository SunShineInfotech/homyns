<?php
// v1_api/product.php
require_once 'dbconnection.php';

// ─────────────────────────────────────────────────────────────────────────────
// Detect request mode:
//   • FormData (multipart) → $_POST contains 'type'
//   • JSON body            → parse php://input
// The OLD bug: the file-upload branch was gated on !empty($_FILES), which meant
// a save/update WITHOUT a new image fell through to the JSON branch and got
// "No data received".  Fix: check $_POST['type'] instead.
// ─────────────────────────────────────────────────────────────────────────────
$isFormData = isset($_POST['type']);

if ($isFormData) {
    // ── Handle multipart/form-data (add / update with optional image) ─────────
    $type               = intval($_POST['type']);
    $company_id         = isset($_POST['company_id'])         ? mysqli_real_escape_string($sql, $_POST['company_id'])         : '';
    $product_id         = isset($_POST['product_id'])         ? mysqli_real_escape_string($sql, $_POST['product_id'])         : '';
    $product_name       = isset($_POST['product_name'])       ? mysqli_real_escape_string($sql, $_POST['product_name'])       : '';
    $category_id        = isset($_POST['category_id'])        ? mysqli_real_escape_string($sql, $_POST['category_id'])        : '';
    $qty_type           = isset($_POST['qty_type'])           ? mysqli_real_escape_string($sql, $_POST['qty_type'])           : 'Fixed';
    $height             = isset($_POST['height'])             ? floatval($_POST['height'])                                    : 0;
    $width              = isset($_POST['width'])              ? floatval($_POST['width'])                                     : 0;
    $depth              = isset($_POST['depth'])              ? floatval($_POST['depth'])                                     : 0;
    $length             = isset($_POST['length'])             ? floatval($_POST['length'])                                    : 0;
    $dimension_unit_id  = isset($_POST['dimension_unit_id'])  ? mysqli_real_escape_string($sql, $_POST['dimension_unit_id'])  : '';
    $price              = isset($_POST['price'])              ? floatval($_POST['price'])                                     : 0;
    $gst_percent        = isset($_POST['gst_percent'])        ? floatval($_POST['gst_percent'])                               : 0;
    $description        = isset($_POST['description'])        ? mysqli_real_escape_string($sql, $_POST['description'])        : '';
    $status             = isset($_POST['status'])             ? mysqli_real_escape_string($sql, $_POST['status'])             : 'Active';
    $product_details    = isset($_POST['product_details'])    ? json_decode($_POST['product_details'], true)                  : [];

    if (!is_array($product_details)) {
        $product_details = [];
    }

    // ── Image upload (optional) ───────────────────────────────────────────────
    $upload_dir = '../uploadfiles/product/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    $image_name     = '';
    $image_uploaded = false;

    if (isset($_FILES['product_image']) && $_FILES['product_image']['error'] === UPLOAD_ERR_OK) {
        $file      = $_FILES['product_image'];
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

    logRequest('product', $_POST);
    $response = ['status' => 'error', 'message' => 'Invalid request'];

    switch ($type) {
        // ── ADD ───────────────────────────────────────────────────────────────
        case 1:
            if (empty($company_id)) { $response = ['status' => 'error', 'message' => 'Company ID is required'];  break; }
            if (empty($product_name)) { $response = ['status' => 'error', 'message' => 'Product name is required']; break; }
            if (empty($category_id)) { $response = ['status' => 'error', 'message' => 'Category is required'];   break; }

            $query = "INSERT INTO tbl_product
                        (company_id, category_id, product_name, qty_type,
                         height, width, depth, length,
                         dimension_unit_id, price, gst_percent,
                         image, description, status, is_deleted, c_date)
                      VALUES
                        ('$company_id', '$category_id', '$product_name', '$qty_type',
                         '$height', '$width', '$depth', '$length',
                         '$dimension_unit_id', '$price', '$gst_percent',
                         '$image_name', '$description', '$status', '1', '$c_date')";

            if (mysqli_query($sql, $query)) {
                $new_id = mysqli_insert_id($sql);

                if (!empty($product_details)) {
                    foreach ($product_details as $detail) {
                        $rm_id  = isset($detail['rm_id'])  ? mysqli_real_escape_string($sql, $detail['rm_id'])  : '';
                        $rm_qty = isset($detail['rm_qty']) ? floatval($detail['rm_qty'])                         : 0;
                        $remark = isset($detail['remark']) ? mysqli_real_escape_string($sql, $detail['remark']) : '';

                        if (!empty($rm_id) && $rm_qty > 0) {
                            mysqli_query($sql, "INSERT INTO tbl_product_details
                                                  (company_id, product_id, rm_id, rm_qty, remark, is_deleted, c_date)
                                                VALUES
                                                  ('$company_id', '$new_id', '$rm_id', '$rm_qty', '$remark', '1', '$c_date')");
                        }
                    }
                }

                logMessage('product', "New product added: $product_name (ID: $new_id)", 'INFO');
                $response = ['status' => 'success', 'message' => 'Product added successfully', 'product_id' => $new_id];
            } else {
                $error    = mysqli_error($sql);
                logError('product', $error);
                $response = ['status' => 'error', 'message' => 'Failed to add product: ' . $error];
            }
            break;

        // ── UPDATE ────────────────────────────────────────────────────────────
        case 2:
            if (empty($product_id))   { $response = ['status' => 'error', 'message' => 'Product ID is required'];   break; }
            if (empty($product_name)) { $response = ['status' => 'error', 'message' => 'Product name is required']; break; }

            $checkResult = mysqli_query($sql, "SELECT image FROM tbl_product WHERE product_id = '$product_id' AND is_deleted = '1'");

            if (mysqli_num_rows($checkResult) == 0) {
                $response = ['status' => 'error', 'message' => 'Product not found'];
                break;
            }

            $oldData = mysqli_fetch_assoc($checkResult);

            // Build optional image clause
            $image_clause = '';
            if ($image_uploaded) {
                $image_clause = ", image = '$image_name'";
                // Delete old file if it exists
                if (!empty($oldData['image']) && file_exists($upload_dir . $oldData['image'])) {
                    unlink($upload_dir . $oldData['image']);
                }
            }

            $query = "UPDATE tbl_product
                      SET product_name       = '$product_name',
                          category_id        = '$category_id',
                          qty_type           = '$qty_type',
                          height             = '$height',
                          width              = '$width',
                          depth              = '$depth',
                          length             = '$length',
                          dimension_unit_id  = '$dimension_unit_id',
                          price              = '$price',
                          gst_percent        = '$gst_percent',
                          description        = '$description',
                          status             = '$status'
                          $image_clause
                      WHERE product_id = '$product_id'";

            if (mysqli_query($sql, $query)) {
                // Replace product details
                mysqli_query($sql, "DELETE FROM tbl_product_details WHERE product_id = '$product_id'");

                if (!empty($product_details)) {
                    foreach ($product_details as $detail) {
                        $rm_id  = isset($detail['rm_id'])  ? mysqli_real_escape_string($sql, $detail['rm_id'])  : '';
                        $rm_qty = isset($detail['rm_qty']) ? floatval($detail['rm_qty'])                         : 0;
                        $remark = isset($detail['remark']) ? mysqli_real_escape_string($sql, $detail['remark']) : '';

                        if (!empty($rm_id) && $rm_qty > 0) {
                            mysqli_query($sql, "INSERT INTO tbl_product_details
                                                  (company_id, product_id, rm_id, rm_qty, remark, is_deleted, c_date)
                                                VALUES
                                                  ('$company_id', '$product_id', '$rm_id', '$rm_qty', '$remark', '1', '$c_date')");
                        }
                    }
                }

                logMessage('product', "Product updated: $product_name (ID: $product_id)", 'INFO');
                $response = ['status' => 'success', 'message' => 'Product updated successfully'];
            } else {
                $error    = mysqli_error($sql);
                logError('product', $error);
                $response = ['status' => 'error', 'message' => 'Failed to update product: ' . $error];
            }
            break;

        default:
            $response = ['status' => 'error', 'message' => 'Invalid request type'];
            logError('product', "Invalid request type: $type");
    }

    logResponse('product', $response);
    echo json_encode($response);
    mysqli_close($sql);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON body requests (GET / DELETE)
// ─────────────────────────────────────────────────────────────────────────────
$postData = json_decode(file_get_contents('php://input'), true);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('product', $response);
    echo json_encode($response);
    exit;
}

$type       = isset($postData['type'])       ? intval($postData['type'])                                    : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id'])     : '';
$product_id = isset($postData['product_id']) ? mysqli_real_escape_string($sql, $postData['product_id'])     : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    // ── SELECT ALL ────────────────────────────────────────────────────────────
    case 3:
        if (empty($company_id)) { $response = ['status' => 'error', 'message' => 'Company ID is required']; break; }

        $result = mysqli_query($sql,
            "SELECT p.*, c.category_name, u.unit_name AS dimension_unit_name
               FROM tbl_product p
               LEFT JOIN tbl_product_category c ON p.category_id = c.category_id
               LEFT JOIN tbl_unit u ON p.dimension_unit_id = u.unit_id
              WHERE p.company_id = '$company_id' AND p.is_deleted = '1'
              ORDER BY p.product_name ASC"
        );

        if ($result) {
            $products = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $detailResult = mysqli_query($sql,
                    "SELECT pd.*, rm.rm_name, t.rm_type_name, u.unit_name
                       FROM tbl_product_details pd
                       LEFT JOIN tbl_raw_material rm ON pd.rm_id = rm.rm_id
                       LEFT JOIN tbl_raw_material_type t ON rm.rm_type_id = t.rm_type_id
                       LEFT JOIN tbl_unit u ON rm.unit_id = u.unit_id
                      WHERE pd.product_id = '{$row['product_id']}' AND pd.is_deleted = '1'"
                );
                $details = [];
                while ($dr = mysqli_fetch_assoc($detailResult)) {
                    $details[] = $dr;
                }
                $row['product_details'] = $details;
                $products[] = $row;
            }

            logMessage('product', 'Fetched ' . count($products) . ' products', 'INFO');
            $response = [
                'status'  => 'success',
                'message' => 'Products fetched successfully',
                'data'    => $products,
                'total'   => count($products),
            ];
        } else {
            $error    = mysqli_error($sql);
            logError('product', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch products: ' . $error];
        }
        break;

    // ── DELETE (soft) ─────────────────────────────────────────────────────────
    case 4:
        if (empty($product_id)) { $response = ['status' => 'error', 'message' => 'Product ID is required']; break; }

        $checkResult = mysqli_query($sql,
            "SELECT product_name FROM tbl_product WHERE product_id = '$product_id' AND is_deleted = '1'"
        );

        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Product not found or already deleted'];
            break;
        }

        $productData = mysqli_fetch_assoc($checkResult);

        if (mysqli_query($sql, "UPDATE tbl_product SET is_deleted = '2' WHERE product_id = '$product_id'")) {
            mysqli_query($sql, "UPDATE tbl_product_details SET is_deleted = '2' WHERE product_id = '$product_id'");
            logMessage('product', "Product deleted: {$productData['product_name']} (ID: $product_id)", 'INFO');
            $response = ['status' => 'success', 'message' => 'Product deleted successfully'];
        } else {
            $error    = mysqli_error($sql);
            logError('product', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete product: ' . $error];
        }
        break;

    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('product', "Invalid request type: $type");
}

logResponse('product', $response);
echo json_encode($response);
mysqli_close($sql);
?>
<?php
// v1_api/room.php
require_once 'dbconnection.php';

// Fix: detect FormData by $_POST['type'], NOT by !empty($_FILES).
// When updating without a new image, $_FILES is empty but the request is still
// multipart/form-data — the old check caused "No data received" on every update.
$isFileUpload = isset($_POST['type']);

if ($isFileUpload) {
    $type        = intval($_POST['type']);
    $company_id  = isset($_POST['company_id'])  ? mysqli_real_escape_string($sql, $_POST['company_id'])  : '';
    $room_id     = isset($_POST['room_id'])      ? mysqli_real_escape_string($sql, $_POST['room_id'])      : '';
    $room_name   = isset($_POST['room_name'])    ? mysqli_real_escape_string($sql, $_POST['room_name'])    : '';
    $description = isset($_POST['description'])  ? mysqli_real_escape_string($sql, $_POST['description'])  : '';
    $sort_order  = isset($_POST['sort_order'])   ? intval($_POST['sort_order'])                             : 0;
    $status      = isset($_POST['status'])       ? mysqli_real_escape_string($sql, $_POST['status'])       : 'Active';
    $room_products = isset($_POST['room_products']) ? json_decode($_POST['room_products'], true) : [];

    if (!is_array($room_products)) {
        $room_products = [];
    }

    // ── Image upload (optional) ───────────────────────────────────────────────
    $upload_dir = '../uploadfiles/room/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    $image_name     = '';
    $image_uploaded = false;

    if (isset($_FILES['room_image']) && $_FILES['room_image']['error'] === UPLOAD_ERR_OK) {
        $file     = $_FILES['room_image'];
        $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed  = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

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

    logRequest('room', $_POST);
    $response = ['status' => 'error', 'message' => 'Invalid request'];

    switch ($type) {
        // ── ADD ───────────────────────────────────────────────────────────────
        case 1:
            if (empty($company_id)) { $response = ['status' => 'error', 'message' => 'Company ID is required']; break; }
            if (empty($room_name))  { $response = ['status' => 'error', 'message' => 'Room name is required'];  break; }

            $query = "INSERT INTO tbl_room
                        (company_id, room_name, description, image, sort_order, is_deleted, c_date)
                      VALUES
                        ('$company_id', '$room_name', '$description', '$image_name', '$sort_order', '1', '$c_date')";

            if (mysqli_query($sql, $query)) {
                $new_id = mysqli_insert_id($sql);

                if (!empty($room_products)) {
                    foreach ($room_products as $product) {
                        $product_id   = isset($product['product_id'])  ? mysqli_real_escape_string($sql, $product['product_id'])  : '';
                        $default_qty  = isset($product['default_qty']) ? floatval($product['default_qty'])                         : 0;
                        $sort_order_p = isset($product['sort_order'])  ? intval($product['sort_order'])                            : 0;

                        if (!empty($product_id) && $default_qty > 0) {
                            mysqli_query($sql, "INSERT INTO tbl_room_products
                                                  (company_id, room_id, product_id, default_qty, sort_order, is_deleted, c_date)
                                                VALUES
                                                  ('$company_id', '$new_id', '$product_id', '$default_qty', '$sort_order_p', '1', '$c_date')");
                        }
                    }
                }

                logMessage('room', "New room added: $room_name (ID: $new_id)", 'INFO');
                $response = ['status' => 'success', 'message' => 'Room added successfully', 'room_id' => $new_id];
            } else {
                $error    = mysqli_error($sql);
                logError('room', $error);
                $response = ['status' => 'error', 'message' => 'Failed to add room: ' . $error];
            }
            break;

        // ── UPDATE ────────────────────────────────────────────────────────────
        case 2:
            if (empty($room_id))   { $response = ['status' => 'error', 'message' => 'Room ID is required'];   break; }
            if (empty($room_name)) { $response = ['status' => 'error', 'message' => 'Room name is required']; break; }

            $checkResult = mysqli_query($sql, "SELECT image FROM tbl_room WHERE room_id = '$room_id' AND is_deleted = '1'");

            if (mysqli_num_rows($checkResult) == 0) {
                $response = ['status' => 'error', 'message' => 'Room not found'];
                break;
            }

            $oldData = mysqli_fetch_assoc($checkResult);

            $image_clause = '';
            if ($image_uploaded) {
                $image_clause = ", image = '$image_name'";
                if (!empty($oldData['image']) && file_exists($upload_dir . $oldData['image'])) {
                    unlink($upload_dir . $oldData['image']);
                }
            }

            $query = "UPDATE tbl_room
                      SET room_name   = '$room_name',
                          description = '$description',
                          sort_order  = '$sort_order'
                          $image_clause
                      WHERE room_id = '$room_id'";

            if (mysqli_query($sql, $query)) {
                mysqli_query($sql, "DELETE FROM tbl_room_products WHERE room_id = '$room_id'");

                if (!empty($room_products)) {
                    foreach ($room_products as $product) {
                        $product_id   = isset($product['product_id'])  ? mysqli_real_escape_string($sql, $product['product_id'])  : '';
                        $default_qty  = isset($product['default_qty']) ? floatval($product['default_qty'])                         : 0;
                        $sort_order_p = isset($product['sort_order'])  ? intval($product['sort_order'])                            : 0;

                        if (!empty($product_id) && $default_qty > 0) {
                            mysqli_query($sql, "INSERT INTO tbl_room_products
                                                  (company_id, room_id, product_id, default_qty, sort_order, is_deleted, c_date)
                                                VALUES
                                                  ('$company_id', '$room_id', '$product_id', '$default_qty', '$sort_order_p', '1', '$c_date')");
                        }
                    }
                }

                logMessage('room', "Room updated: $room_name (ID: $room_id)", 'INFO');
                $response = ['status' => 'success', 'message' => 'Room updated successfully'];
            } else {
                $error    = mysqli_error($sql);
                logError('room', $error);
                $response = ['status' => 'error', 'message' => 'Failed to update room: ' . $error];
            }
            break;

        default:
            $response = ['status' => 'error', 'message' => 'Invalid request type'];
            logError('room', "Invalid request type: $type");
    }

    logResponse('room', $response);
    echo json_encode($response);
    mysqli_close($sql);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON body requests (SELECT / DELETE)
// ─────────────────────────────────────────────────────────────────────────────
$postData = json_decode(file_get_contents('php://input'), true);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('room', $response);
    echo json_encode($response);
    exit;
}

$type       = isset($postData['type'])      ? intval($postData['type'])                                : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$room_id    = isset($postData['room_id'])    ? mysqli_real_escape_string($sql, $postData['room_id'])    : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    // ── SELECT ALL ────────────────────────────────────────────────────────────
    case 3:
        if (empty($company_id)) { $response = ['status' => 'error', 'message' => 'Company ID is required']; break; }

        $result = mysqli_query($sql,
            "SELECT r.*
               FROM tbl_room r
              WHERE r.company_id = '$company_id' AND r.is_deleted = '1'
              ORDER BY r.sort_order ASC"
        );

        if ($result) {
            $rooms = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $productResult = mysqli_query($sql,
                    "SELECT rp.*, p.product_name, pc.category_name
                       FROM tbl_room_products rp
                       LEFT JOIN tbl_product p ON rp.product_id = p.product_id
                       LEFT JOIN tbl_product_category pc ON p.category_id = pc.category_id
                      WHERE rp.room_id = '{$row['room_id']}' AND rp.is_deleted = '1'
                      ORDER BY rp.sort_order ASC"
                );
                $products = [];
                while ($pr = mysqli_fetch_assoc($productResult)) {
                    $products[] = $pr;
                }
                $row['room_products'] = $products;
                $rooms[] = $row;
            }

            logMessage('room', 'Fetched ' . count($rooms) . ' rooms', 'INFO');
            $response = [
                'status'  => 'success',
                'message' => 'Rooms fetched successfully',
                'data'    => $rooms,
                'total'   => count($rooms),
            ];
        } else {
            $error    = mysqli_error($sql);
            logError('room', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch rooms: ' . $error];
        }
        break;

    // ── DELETE (soft) ─────────────────────────────────────────────────────────
    case 4:
        if (empty($room_id)) { $response = ['status' => 'error', 'message' => 'Room ID is required']; break; }

        $checkResult = mysqli_query($sql,
            "SELECT room_name FROM tbl_room WHERE room_id = '$room_id' AND is_deleted = '1'"
        );

        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Room not found or already deleted'];
            break;
        }

        $roomData = mysqli_fetch_assoc($checkResult);

        if (mysqli_query($sql, "UPDATE tbl_room SET is_deleted = '2' WHERE room_id = '$room_id'")) {
            mysqli_query($sql, "UPDATE tbl_room_products SET is_deleted = '2' WHERE room_id = '$room_id'");
            logMessage('room', "Room deleted: {$roomData['room_name']} (ID: $room_id)", 'INFO');
            $response = ['status' => 'success', 'message' => 'Room deleted successfully'];
        } else {
            $error    = mysqli_error($sql);
            logError('room', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete room: ' . $error];
        }
        break;

    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('room', "Invalid request type: $type");
}

logResponse('room', $response);
echo json_encode($response);
mysqli_close($sql);
?>
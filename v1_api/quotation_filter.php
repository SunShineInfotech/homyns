<?php
// v1_api/quotation_filter.php
require_once 'dbconnection.php';

$postData = json_decode(file_get_contents('php://input'), true);

logRequest('quotation_filter', $postData);

if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('quotation_filter', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$package_id = isset($postData['package_id']) ? mysqli_real_escape_string($sql, $postData['package_id']) : '';
$room_ids = isset($postData['room_ids']) ? $postData['room_ids'] : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 1: // GET PACKAGE DETAILS WITH ROOMS
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        if (empty($package_id)) {
            $response = ['status' => 'error', 'message' => 'Package ID is required'];
            break;
        }
        
        // Get package details
        $packageQuery = "SELECT company_id, package_id, package_name, details, completion_days, rooms, created_by, status, is_deleted, c_date 
                        FROM tbl_package 
                        WHERE package_id = '$package_id' 
                        AND company_id = '$company_id' 
                        AND is_deleted = '1'";
        
        $packageResult = mysqli_query($sql, $packageQuery);
        
        if (!$packageResult || mysqli_num_rows($packageResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Package not found'];
            break;
        }
        
        $package = mysqli_fetch_assoc($packageResult);
        
        // Get rooms based on package's room IDs
        $roomsData = [];
        if (!empty($package['rooms'])) {
            // Room IDs are stored as comma-separated values in the rooms field
            $roomIdsArray = explode(',', $package['rooms']);
            $roomIdsArray = array_map('trim', $roomIdsArray);
            $roomIdsArray = array_filter($roomIdsArray);
            
            if (!empty($roomIdsArray)) {
                // Sanitize each room ID
                $sanitizedRoomIds = array_map(function($id) use ($sql) {
                    return mysqli_real_escape_string($sql, $id);
                }, $roomIdsArray);
                
                $roomIdsString = "'" . implode("','", $sanitizedRoomIds) . "'";
                
                $roomsQuery = "SELECT company_id, room_id, room_name, description, image, sort_order, is_deleted, c_date 
                              FROM tbl_room 
                              WHERE is_deleted = '1' 
                              AND room_id IN ($roomIdsString) 
                              ORDER BY sort_order DESC";
                
                $roomsResult = mysqli_query($sql, $roomsQuery);
                
                if ($roomsResult) {
                    while ($row = mysqli_fetch_assoc($roomsResult)) {
                        $roomsData[] = $row;
                    }
                }
            }
        }
        
        logMessage('quotation_filter', "Fetched package: {$package['package_name']} with " . count($roomsData) . " rooms", 'INFO');
        
        $response = [
            'status' => 'success',
            'message' => 'Package and rooms fetched successfully',
            'data' => [
                'package' => $package,
                'rooms' => $roomsData
            ]
        ];
        break;
        
    case 2: // GET ONLY PACKAGES (for dropdown/selection)
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        $query = "SELECT company_id, package_id, package_name, details, completion_days, rooms, created_by, status, is_deleted, c_date 
                  FROM tbl_package 
                  WHERE company_id = '$company_id' 
                  AND is_deleted = '1' 
                  ORDER BY package_name ASC";
        
        $result = mysqli_query($sql, $query);
        
        if ($result) {
            $packages = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $packages[] = $row;
            }
            
            logMessage('quotation_filter', "Fetched " . count($packages) . " packages", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Packages fetched successfully',
                'data' => $packages,
                'total' => count($packages)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('quotation_filter', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch packages: ' . $error];
        }
        break;
        
    case 3: // GET ROOMS FOR MULTIPLE PACKAGE IDs
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        if (empty($room_ids)) {
            $response = ['status' => 'error', 'message' => 'Room IDs are required'];
            break;
        }
        
        // Handle room_ids as array or comma-separated string
        if (is_array($room_ids)) {
            $roomIdsArray = $room_ids;
        } else {
            $roomIdsArray = explode(',', $room_ids);
        }
        
        $roomIdsArray = array_map('trim', $roomIdsArray);
        $roomIdsArray = array_filter($roomIdsArray);
        
        if (empty($roomIdsArray)) {
            $response = ['status' => 'error', 'message' => 'No valid room IDs provided'];
            break;
        }
        
        // Sanitize each room ID
        $sanitizedRoomIds = array_map(function($id) use ($sql) {
            return mysqli_real_escape_string($sql, $id);
        }, $roomIdsArray);
        
        $roomIdsString = "'" . implode("','", $sanitizedRoomIds) . "'";
        
        $roomsQuery = "SELECT company_id, room_id, room_name, description, image, sort_order, is_deleted, c_date 
                      FROM tbl_room 
                      WHERE is_deleted = '1' 
                      AND room_id IN ($roomIdsString) 
                      ORDER BY sort_order DESC";
        
        $roomsResult = mysqli_query($sql, $roomsQuery);
        
        if ($roomsResult) {
            $roomsData = [];
            while ($row = mysqli_fetch_assoc($roomsResult)) {
                $roomsData[] = $row;
            }
            
            logMessage('quotation_filter', "Fetched " . count($roomsData) . " rooms for package(s)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Rooms fetched successfully',
                'data' => $roomsData,
                'total' => count($roomsData)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('quotation_filter', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch rooms: ' . $error];
        }
        break;
        
    case 4: // GET PACKAGE WITH PRODUCTS FOR EACH ROOM (Full quotation data)
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        if (empty($package_id)) {
            $response = ['status' => 'error', 'message' => 'Package ID is required'];
            break;
        }
        
        // Get package details
        $packageQuery = "SELECT company_id, package_id, package_name, details, completion_days, rooms, created_by, status, is_deleted, c_date 
                        FROM tbl_package 
                        WHERE package_id = '$package_id' 
                        AND company_id = '$company_id' 
                        AND is_deleted = '1'";
        
        $packageResult = mysqli_query($sql, $packageQuery);
        
        if (!$packageResult || mysqli_num_rows($packageResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Package not found'];
            break;
        }
        
        $package = mysqli_fetch_assoc($packageResult);
        
        // Get rooms with their products
        $roomsWithProducts = [];
        if (!empty($package['rooms'])) {
            $roomIdsArray = explode(',', $package['rooms']);
            $roomIdsArray = array_map('trim', $roomIdsArray);
            $roomIdsArray = array_filter($roomIdsArray);
            
            if (!empty($roomIdsArray)) {
                $sanitizedRoomIds = array_map(function($id) use ($sql) {
                    return mysqli_real_escape_string($sql, $id);
                }, $roomIdsArray);
                
                $roomIdsString = "'" . implode("','", $sanitizedRoomIds) . "'";
                
                // Fetch rooms
                $roomsQuery = "SELECT company_id, room_id, room_name, description, image, sort_order, is_deleted, c_date 
                              FROM tbl_room 
                              WHERE is_deleted = '1' 
                              AND room_id IN ($roomIdsString) 
                              ORDER BY sort_order DESC";
                
                $roomsResult = mysqli_query($sql, $roomsQuery);
                
                if ($roomsResult) {
                    while ($roomRow = mysqli_fetch_assoc($roomsResult)) {
                        // Get products for this room from room_products table
                        $roomId = $roomRow['room_id'];
                        $productsQuery = "SELECT rp.*, p.product_name, p.price, p.qty_type, p.height, p.width, p.depth, p.length,
                                         c.category_name
                                         FROM tbl_room_products rp
                                         LEFT JOIN tbl_product p ON rp.product_id = p.product_id
                                         LEFT JOIN tbl_product_category c ON p.category_id = c.category_id
                                         WHERE rp.room_id = '$roomId' 
                                         AND rp.is_deleted = '1'
                                         ORDER BY rp.sort_order ASC";
                        
                        $productsResult = mysqli_query($sql, $productsQuery);
                        $products = [];
                        
                        if ($productsResult) {
                            while ($productRow = mysqli_fetch_assoc($productsResult)) {
                                // Format product data
                                $products[] = [
                                    'rp_id' => $productRow['rp_id'],
                                    'room_id' => $productRow['room_id'],
                                    'product_id' => $productRow['product_id'],
                                    'product_name' => $productRow['product_name'] ?? 'Unknown Product',
                                    'category_name' => $productRow['category_name'] ?? '',
                                    'default_qty' => floatval($productRow['default_qty'] ?? 1),
                                    'sort_order' => intval($productRow['sort_order'] ?? 0),
                                    'price' => floatval($productRow['price'] ?? 0),
                                    'qty_type' => $productRow['qty_type'] ?? 'Fixed',
                                    'height' => floatval($productRow['height'] ?? 0),
                                    'width' => floatval($productRow['width'] ?? 0),
                                    'depth' => floatval($productRow['depth'] ?? 0),
                                    'length' => floatval($productRow['length'] ?? 0),
                                ];
                            }
                        }
                        
                        $roomsWithProducts[] = [
                            'room_id' => $roomRow['room_id'],
                            'room_name' => $roomRow['room_name'],
                            'description' => $roomRow['description'] ?? '',
                            'image' => $roomRow['image'] ?? '',
                            'sort_order' => intval($roomRow['sort_order'] ?? 0),
                            'products' => $products,
                            'product_count' => count($products)
                        ];
                    }
                }
            }
        }
        
        logMessage('quotation_filter', "Fetched full quotation data for package: {$package['package_name']}", 'INFO');
        
        $response = [
            'status' => 'success',
            'message' => 'Quotation data fetched successfully',
            'data' => [
                'package' => $package,
                'rooms' => $roomsWithProducts
            ]
        ];
        break;
        
    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('quotation_filter', "Invalid request type: $type");
}

logResponse('quotation_filter', $response);
echo json_encode($response);
mysqli_close($sql);
?>
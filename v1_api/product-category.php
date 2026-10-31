<?php
// v1_api/product-category.php
require_once 'dbconnection.php';

// Get POST data (for non-file uploads)
$postData = json_decode(file_get_contents('php://input'), true);

// Check if it's a file upload (FormData)
$isFileUpload = isset($_POST['type']) && !empty($_FILES);

if ($isFileUpload) {
    // Handle file upload
    $type = isset($_POST['type']) ? intval($_POST['type']) : 0;
    $company_id = isset($_POST['company_id']) ? mysqli_real_escape_string($sql, $_POST['company_id']) : '';
    $category_id = isset($_POST['category_id']) ? mysqli_real_escape_string($sql, $_POST['category_id']) : '';
    $category_name = isset($_POST['category_name']) ? mysqli_real_escape_string($sql, $_POST['category_name']) : '';
    $description = isset($_POST['description']) ? mysqli_real_escape_string($sql, $_POST['description']) : '';
    $sort_order = isset($_POST['sort_order']) ? intval($_POST['sort_order']) : 0;
    $remove_image = isset($_POST['remove_image']) ? intval($_POST['remove_image']) : 0;
    
    // Upload directory
    $upload_dir = '../uploadfiles/product_category/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    $image_name = '';
    $image_uploaded = false;
    
    // Handle image upload
    if (isset($_FILES['category_image']) && $_FILES['category_image']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['category_image'];
        $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        
        if (!in_array($file_ext, $allowed_ext)) {
            $response = ['status' => 'error', 'message' => 'Invalid file type. Allowed: JPG, PNG, GIF, WEBP, SVG'];
            echo json_encode($response);
            exit;
        }
        
        // Generate unique filename
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
    
    // Log request
    logRequest('product-category', $_POST);
    
    $response = ['status' => 'error', 'message' => 'Invalid request'];
    
    switch ($type) {
        case 1: // ADD
            if (empty($company_id)) {
                $response = ['status' => 'error', 'message' => 'Company ID is required'];
                break;
            }
            
            if (empty($category_name)) {
                $response = ['status' => 'error', 'message' => 'Category name is required'];
                break;
            }
            
            // Check if category already exists
            $checkQuery = "SELECT category_id FROM tbl_product_category 
                           WHERE company_id = '$company_id' 
                           AND category_name = '$category_name' 
                           AND is_deleted = '1'";
            $checkResult = mysqli_query($sql, $checkQuery);
            
            if (mysqli_num_rows($checkResult) > 0) {
                $response = ['status' => 'error', 'message' => 'Category already exists'];
                break;
            }
            
            // Insert new category
            $query = "INSERT INTO tbl_product_category 
                      (company_id, category_name, category_image, description, sort_order, is_deleted, c_date) 
                      VALUES 
                      ('$company_id', '$category_name', '$image_name', '$description', '$sort_order', '1', '$c_date')";
            
            if (mysqli_query($sql, $query)) {
                $new_id = mysqli_insert_id($sql);
                logMessage('product-category', "New category added: $category_name (ID: $new_id)", 'INFO');
                
                $response = [
                    'status' => 'success',
                    'message' => 'Category added successfully',
                    'category_id' => $new_id
                ];
            } else {
                $error = mysqli_error($sql);
                logError('product-category', $error);
                $response = ['status' => 'error', 'message' => 'Failed to add category: ' . $error];
            }
            break;
            
        case 2: // UPDATE
            if (empty($category_id)) {
                $response = ['status' => 'error', 'message' => 'Category ID is required'];
                break;
            }
            
            if (empty($category_name)) {
                $response = ['status' => 'error', 'message' => 'Category name is required'];
                break;
            }
            
            // Check if category exists
            $checkQuery = "SELECT category_image FROM tbl_product_category 
                           WHERE category_id = '$category_id' AND is_deleted = '1'";
            $checkResult = mysqli_query($sql, $checkQuery);
            
            if (mysqli_num_rows($checkResult) == 0) {
                $response = ['status' => 'error', 'message' => 'Category not found'];
                break;
            }
            
            $oldData = mysqli_fetch_assoc($checkResult);
            
            // Determine image field
            $image_field = '';
            if ($image_uploaded) {
                // New image uploaded
                $image_field = "category_image = '$image_name',";
                // Delete old image if exists
                if (!empty($oldData['category_image']) && file_exists($upload_dir . $oldData['category_image'])) {
                    unlink($upload_dir . $oldData['category_image']);
                }
            } elseif ($remove_image == 1) {
                // Image removed
                $image_field = "category_image = NULL,";
                // Delete old image if exists
                if (!empty($oldData['category_image']) && file_exists($upload_dir . $oldData['category_image'])) {
                    unlink($upload_dir . $oldData['category_image']);
                }
            } else {
                // Keep existing image
                $image_field = '';
            }
            
            // Update category
            $query = "UPDATE tbl_product_category 
                      SET category_name = '$category_name', 
                          description = '$description', 
                          sort_order = '$sort_order'";
            
            if (!empty($image_field)) {
                $query .= ", $image_field";
            }
            
            $query .= " WHERE category_id = '$category_id'";
            
            if (mysqli_query($sql, $query)) {
                logMessage('product-category', "Category updated: $category_name (ID: $category_id)", 'INFO');
                
                $response = [
                    'status' => 'success',
                    'message' => 'Category updated successfully'
                ];
            } else {
                $error = mysqli_error($sql);
                logError('product-category', $error);
                $response = ['status' => 'error', 'message' => 'Failed to update category: ' . $error];
            }
            break;
            
        default:
            $response = ['status' => 'error', 'message' => 'Invalid request type'];
            logError('product-category', "Invalid request type: $type");
    }
    
    logResponse('product-category', $response);
    echo json_encode($response);
    mysqli_close($sql);
    exit;
}

// Handle non-file upload requests (GET/POST without files)
if (empty($postData)) {
    $response = ['status' => 'error', 'message' => 'No data received'];
    logResponse('product-category', $response);
    echo json_encode($response);
    exit;
}

$type = isset($postData['type']) ? intval($postData['type']) : 0;
$company_id = isset($postData['company_id']) ? mysqli_real_escape_string($sql, $postData['company_id']) : '';
$category_id = isset($postData['category_id']) ? mysqli_real_escape_string($sql, $postData['category_id']) : '';

$response = ['status' => 'error', 'message' => 'Invalid request'];

switch ($type) {
    case 3: // SELECT
        if (empty($company_id)) {
            $response = ['status' => 'error', 'message' => 'Company ID is required'];
            break;
        }
        
        $query = "SELECT category_id, company_id, category_name, category_image, description, sort_order, is_deleted, c_date 
                  FROM tbl_product_category 
                  WHERE company_id = '$company_id' AND is_deleted = '1'
                  ORDER BY sort_order ASC, category_name ASC";
        
        $result = mysqli_query($sql, $query);
        
        if ($result) {
            $categories = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $categories[] = $row;
            }
            
            logMessage('product-category', "Fetched " . count($categories) . " categories", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Categories fetched successfully',
                'data' => $categories,
                'total' => count($categories)
            ];
        } else {
            $error = mysqli_error($sql);
            logError('product-category', $error);
            $response = ['status' => 'error', 'message' => 'Failed to fetch categories: ' . $error];
        }
        break;
        
    case 4: // DELETE
        if (empty($category_id)) {
            $response = ['status' => 'error', 'message' => 'Category ID is required'];
            break;
        }
        
        $checkQuery = "SELECT category_name, category_image FROM tbl_product_category 
                       WHERE category_id = '$category_id' AND is_deleted = '1'";
        $checkResult = mysqli_query($sql, $checkQuery);
        
        if (mysqli_num_rows($checkResult) == 0) {
            $response = ['status' => 'error', 'message' => 'Category not found or already deleted'];
            break;
        }
        
        $categoryData = mysqli_fetch_assoc($checkResult);
        
        $query = "UPDATE tbl_product_category SET is_deleted = '2' WHERE category_id = '$category_id'";
        
        if (mysqli_query($sql, $query)) {
            logMessage('product-category', "Category deleted: {$categoryData['category_name']} (ID: $category_id)", 'INFO');
            
            $response = [
                'status' => 'success',
                'message' => 'Category deleted successfully'
            ];
        } else {
            $error = mysqli_error($sql);
            logError('product-category', $error);
            $response = ['status' => 'error', 'message' => 'Failed to delete category: ' . $error];
        }
        break;
        
    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
        logError('product-category', "Invalid request type: $type");
}

logResponse('product-category', $response);
echo json_encode($response);
mysqli_close($sql);
?>
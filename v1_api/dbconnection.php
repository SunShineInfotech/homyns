<?php
// v1_api/dbconnection.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

date_default_timezone_set('Asia/Kolkata');
$c_date = date('Y-m-d H:i:s');
$date   = date('Y-m-d');
$time   = date('H:i:s');

/* ============================================
   LOGGING CONFIGURATION
   ============================================ */
// Set to true to enable logging, false to disable
$LOG_ENABLED = true;  // Change to false to stop all logging

// Log file paths
$LOG_BASE_PATH = '../log/';  // Path from API folder
$LOG_MONTH_FOLDER = date('m-Y');
$LOG_DAY_FOLDER = date('d-m-Y');
$LOG_FULL_PATH = $LOG_BASE_PATH . $LOG_MONTH_FOLDER . '/' . $LOG_DAY_FOLDER . '/';

// API usage log file (counts only)
$USAGE_LOG_FILE = $LOG_BASE_PATH . 'api_usage.log';

/* ============================================
   DATABASE CONNECTION - FIXED PASSWORD
   ============================================ */
// IMPORTANT: Use single quotes to avoid $ being interpreted as variable
$db_host = 'localhost';
$db_user = 'u362442499_interiordesig';
$db_password = 'o8&$IbZMS11AA@#';  // Use single quotes!
$db_name = 'u362442499_interiordesig';

// Create connection
$sql = mysqli_connect($db_host, $db_user, $db_password, $db_name);

// Check connection
if (mysqli_connect_errno()) {
    $error_msg = 'Connection failed: ' . mysqli_connect_error();
    
    // Try to log error if possible
    if (function_exists('logMessage')) {
        logMessage('DATABASE_ERROR', $error_msg);
    }
    
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed']));
}

// Set charset
mysqli_set_charset($sql, "utf8mb4");

// Check and add OTP column if not exists
$checkColumn = "SHOW COLUMNS FROM `tbl_employee` LIKE 'otp'";
$result = mysqli_query($sql, $checkColumn);
if (mysqli_num_rows($result) == 0) {
    $alterQuery = "ALTER TABLE `tbl_employee` ADD COLUMN `otp` VARCHAR(10) NULL DEFAULT NULL AFTER `access_pages`";
    mysqli_query($sql, $alterQuery);
    
    // Add index
    $indexQuery = "ALTER TABLE `tbl_employee` ADD INDEX `idx_otp` (`otp`)";
    mysqli_query($sql, $indexQuery);
    
    // Log column addition
    if (function_exists('logMessage')) {
        logMessage('SYSTEM', 'OTP column added to tbl_employee', 'INFO');
    }
}

/* ============================================
   URL CONFIGURATION
   ============================================ */
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$server_url = $protocol . $_SERVER['HTTP_HOST'] . '/interior_designer/';
$folder = "uploadfiles";
$upload_url = $server_url . $folder . '/';

/* Individual Folders */
$company_url          = $upload_url . 'company/';
$employee_url         = $upload_url . 'employee/';
$product_url          = $upload_url . 'product/';
$product_category_url = $upload_url . 'product_category/';
$room_url             = $upload_url . 'room/';
$other_url            = $upload_url . 'other/';

/* upload images and files */
$upload_company_url          = '../'.$folder.'company/';
$upload_employee_url         = '../'.$folder.'employee/';
$upload_product_url          = '../'.$folder.'product/';
$upload_product_category_url = '../'.$folder.'product_category/';
$upload_room_url             = '../'.$folder.'room/';
$upload_other_url            = '../'.$folder.'other/';



/* Default Images */
$no_data_found = $other_url . 'no_data_found.png';

/* Mobile App Links */
$android_store_link = "https://play.google.com/store/apps/details?id=com.sunshineinfotech.trackdeskpro";
$ios_store_link = "https://apps.apple.com/us/app/track-desk-sunshine-infotech/id6747991822";

/* ============================================
   LOGGING FUNCTIONS
   ============================================ */

/**
 * Create log directory structure
 */
function createLogDirectory($path) {
    if (!file_exists($path)) {
        mkdir($path, 0777, true);
        return true;
    }
    return true;
}

/**
 * Log API request/response
 */
function logMessage($apiName, $message, $type = 'INFO') {
    global $LOG_ENABLED, $LOG_FULL_PATH, $USAGE_LOG_FILE;
    
    if (!$LOG_ENABLED) {
        return false;
    }
    
    // Create directory structure
    createLogDirectory($LOG_FULL_PATH);
    
    // Log file path
    $logFile = $LOG_FULL_PATH . $apiName . '.log';
    
    // Prepare log entry
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
    $uri = $_SERVER['REQUEST_URI'] ?? 'UNKNOWN';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'UNKNOWN';
    
    $logEntry = "========================================\n";
    $logEntry .= "TIMESTAMP: $timestamp\n";
    $logEntry .= "TYPE: $type\n";
    $logEntry .= "IP: $ip\n";
    $logEntry .= "METHOD: $method\n";
    $logEntry .= "URI: $uri\n";
    $logEntry .= "USER_AGENT: $user_agent\n";
    $logEntry .= "MESSAGE: $message\n";
    $logEntry .= "========================================\n\n";
    
    // Write to log file
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    
    // Update usage log
    updateUsageLog($apiName);
    
    return true;
}

/**
 * Update API usage count
 */
function updateUsageLog($apiName) {
    global $LOG_ENABLED, $USAGE_LOG_FILE;
    
    if (!$LOG_ENABLED) {
        return false;
    }
    
    $date = date('Y-m-d');
    $month = date('Y-m');
    $hour = date('H:00');
    
    // Read existing usage data
    $usageData = [];
    if (file_exists($USAGE_LOG_FILE)) {
        $content = file_get_contents($USAGE_LOG_FILE);
        if ($content) {
            $usageData = json_decode($content, true) ?? [];
        }
    }
    
    // Initialize structure if not exists
    if (!isset($usageData[$date])) {
        $usageData[$date] = [];
    }
    if (!isset($usageData[$date][$apiName])) {
        $usageData[$date][$apiName] = 0;
    }
    if (!isset($usageData['monthly'][$month])) {
        $usageData['monthly'][$month] = [];
    }
    if (!isset($usageData['monthly'][$month][$apiName])) {
        $usageData['monthly'][$month][$apiName] = 0;
    }
    if (!isset($usageData['hourly'][$date][$hour])) {
        $usageData['hourly'][$date][$hour] = [];
    }
    if (!isset($usageData['hourly'][$date][$hour][$apiName])) {
        $usageData['hourly'][$date][$hour][$apiName] = 0;
    }
    
    // Increment counts
    $usageData[$date][$apiName]++;
    $usageData['monthly'][$month][$apiName]++;
    $usageData['hourly'][$date][$hour][$apiName]++;
    $usageData['last_updated'] = date('Y-m-d H:i:s');
    
    // Write to usage log
    file_put_contents($USAGE_LOG_FILE, json_encode($usageData, JSON_PRETTY_PRINT), LOCK_EX);
    
    return true;
}

/**
 * Log API request details
 */
function logRequest($apiName, $requestData) {
    global $LOG_ENABLED;
    
    if (!$LOG_ENABLED) {
        return false;
    }
    
    $message = "REQUEST DATA:\n" . print_r($requestData, true);
    logMessage($apiName, $message, 'REQUEST');
    
    return true;
}

/**
 * Log API response details
 */
function logResponse($apiName, $responseData) {
    global $LOG_ENABLED;
    
    if (!$LOG_ENABLED) {
        return false;
    }
    
    $message = "RESPONSE DATA:\n" . print_r($responseData, true);
    logMessage($apiName, $message, 'RESPONSE');
    
    return true;
}

/**
 * Log error details
 */
function logError($apiName, $error, $errorCode = null) {
    global $LOG_ENABLED;
    
    if (!$LOG_ENABLED) {
        return false;
    }
    
    $message = "ERROR CODE: $errorCode\n";
    $message .= "ERROR: " . print_r($error, true);
    logMessage($apiName, $message, 'ERROR');
    
    return true;
}

/**
 * Log database queries
 */
function logQuery($apiName, $query, $params = null) {
    global $LOG_ENABLED;
    
    if (!$LOG_ENABLED) {
        return false;
    }
    
    $message = "QUERY: $query\n";
    if ($params) {
        $message .= "PARAMS: " . print_r($params, true);
    }
    logMessage($apiName, $message, 'QUERY');
    
    return true;
}

/**
 * Get usage statistics
 */
function getUsageStats($days = 7) {
    global $USAGE_LOG_FILE;
    
    if (!file_exists($USAGE_LOG_FILE)) {
        return ['error' => 'No usage data available'];
    }
    
    $content = file_get_contents($USAGE_LOG_FILE);
    $usageData = json_decode($content, true);
    
    if (!$usageData) {
        return ['error' => 'Invalid usage data'];
    }
    
    $stats = [
        'today' => [],
        'last_7_days' => [],
        'monthly' => [],
        'hourly' => [],
        'top_apis' => []
    ];
    
    // Get today's data
    $today = date('Y-m-d');
    if (isset($usageData[$today])) {
        $stats['today'] = $usageData[$today];
    }
    
    // Get last 7 days
    for ($i = 0; $i < $days; $i++) {
        $date = date('Y-m-d', strtotime("-$i days"));
        if (isset($usageData[$date])) {
            $stats['last_7_days'][$date] = $usageData[$date];
        }
    }
    
    // Get monthly
    if (isset($usageData['monthly'])) {
        $stats['monthly'] = $usageData['monthly'];
    }
    
    // Get hourly
    if (isset($usageData['hourly'])) {
        $stats['hourly'] = $usageData['hourly'];
    }
    
    // Get top APIs (combine all)
    $allApis = [];
    foreach ($usageData as $key => $value) {
        if (is_array($value) && $key !== 'monthly' && $key !== 'hourly' && $key !== 'last_updated') {
            foreach ($value as $api => $count) {
                if (!isset($allApis[$api])) {
                    $allApis[$api] = 0;
                }
                $allApis[$api] += $count;
            }
        }
    }
    arsort($allApis);
    $stats['top_apis'] = array_slice($allApis, 0, 10);
    
    return $stats;
}

/* ============================================
   AUTO CLEANUP - Delete logs older than 30 days
   ============================================ */
function cleanupOldLogs($days = 30) {
    global $LOG_BASE_PATH;
    
    if (!file_exists($LOG_BASE_PATH)) {
        return false;
    }
    
    $files = scandir($LOG_BASE_PATH);
    $cutoff = strtotime("-$days days");
    
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        
        $filePath = $LOG_BASE_PATH . $file;
        if (is_dir($filePath)) {
            // Check month folder (format: MM-YYYY)
            if (preg_match('/^(\d{2})-(\d{4})$/', $file, $matches)) {
                $monthDate = strtotime($matches[2] . '-' . $matches[1] . '-01');
                if ($monthDate < $cutoff) {
                    // Delete entire month folder
                    deleteDirectory($filePath);
                } else {
                    // Check day folders inside
                    $dayFiles = scandir($filePath);
                    foreach ($dayFiles as $dayFile) {
                        if ($dayFile === '.' || $dayFile === '..') continue;
                        $dayPath = $filePath . '/' . $dayFile;
                        if (is_dir($dayPath) && preg_match('/^\d{2}-\d{2}-\d{4}$/', $dayFile)) {
                            $dayDate = strtotime(str_replace('-', '/', $dayFile));
                            if ($dayDate < $cutoff) {
                                deleteDirectory($dayPath);
                            }
                        }
                    }
                    // Remove empty month folder
                    if (is_dir_empty($filePath)) {
                        rmdir($filePath);
                    }
                }
            }
        }
    }
}

function deleteDirectory($dir) {
    if (!file_exists($dir)) return true;
    if (!is_dir($dir)) return unlink($dir);
    
    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') continue;
        if (!deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) return false;
    }
    return rmdir($dir);
}

function is_dir_empty($dir) {
    if (!is_readable($dir)) return true;
    $files = scandir($dir);
    return count($files) <= 2;
}

// Auto cleanup old logs (optional - run on each request or cron)
if ($LOG_ENABLED && rand(1, 100) === 1) { // 1% chance on each request
    cleanupOldLogs(30);
}

// Log initial connection if database connected successfully
if ($LOG_ENABLED && isset($sql) && $sql) {
    logMessage('SYSTEM', 'Database connected successfully', 'INFO');
}
?>
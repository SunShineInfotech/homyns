<?php
// Saved house-layout plans used by the Create 3D Quotation workflow.
require_once 'dbconnection.php';
if (!headers_sent()) header('Content-Type: application/json; charset=utf-8');
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) $input = $_POST;
$type = intval($input['type'] ?? 0);
$company_id = mysqli_real_escape_string($sql, trim((string)($input['company_id'] ?? '')));
$plan_id = intval($input['plan_id'] ?? 0);
$response = ['status' => 'error', 'message' => 'Invalid request'];

function fpesc($value) { global $sql; return mysqli_real_escape_string($sql, (string)$value); }
function fpImage($data, $company_id) {
    if (!is_string($data) || $data === '') return ['path' => '', 'error' => ''];
    if (!preg_match('/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+\/=]+)$/', $data, $m)) return ['path' => '', 'error' => 'Invalid image data'];
    $bytes = base64_decode($m[2], true);
    if ($bytes === false || strlen($bytes) > 6 * 1024 * 1024) return ['path' => '', 'error' => 'Image must be smaller than 6 MB'];
    $ext = strtolower($m[1]); if ($ext === 'jpeg') $ext = 'jpg';
    $valid = ($ext === 'png' && substr($bytes, 0, 8) === "\x89PNG\r\n\x1a\n")
        || ($ext === 'jpg' && substr($bytes, 0, 3) === "\xff\xd8\xff")
        || ($ext === 'webp' && substr($bytes, 0, 4) === 'RIFF' && substr($bytes, 8, 4) === 'WEBP');
    if (!$valid) return ['path' => '', 'error' => 'The uploaded image content does not match its file type'];
    $dir = __DIR__ . '/uploads/3d_floor_plans/';
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) return ['path' => '', 'error' => 'Could not create the plan image folder'];
    $name = 'plan_' . preg_replace('/[^A-Za-z0-9]/', '', $company_id) . '_' . bin2hex(random_bytes(16)) . '.' . $ext;
    if (file_put_contents($dir . $name, $bytes, LOCK_EX) === false) return ['path' => '', 'error' => 'Could not save the plan image'];
    return ['path' => 'uploads/3d_floor_plans/' . $name, 'error' => ''];
}

if ($company_id === '') {
    $response = ['status' => 'error', 'message' => 'Company ID is required'];
} else switch ($type) {
    case 1: // List saved plans.
        $q = mysqli_query($sql, "SELECT p.plan_id,p.company_id,p.client_id,p.project_title,p.bhk,p.bedroom_count,p.site_type,p.ceiling_height_ft,p.thumbnail_path,p.map_image_path,p.status,p.version,p.created_by,p.c_date,p.updated_at,c.client_name,c.phone1 FROM tbl_3d_floor_plan p LEFT JOIN tbl_client c ON c.client_id=p.client_id AND c.company_id=p.company_id WHERE p.company_id='$company_id' AND p.is_deleted='1' ORDER BY COALESCE(p.updated_at,p.c_date) DESC,p.plan_id DESC");
        if (!$q) { $response = ['status' => 'error', 'message' => 'Could not fetch saved plans']; break; }
        $rows = []; while ($row = mysqli_fetch_assoc($q)) $rows[] = $row;
        $response = ['status' => 'success', 'message' => 'Saved plans fetched', 'data' => $rows, 'total' => count($rows)];
        break;

    case 2: // Get a plan.
        if ($plan_id <= 0) { $response = ['status' => 'error', 'message' => 'Plan ID is required']; break; }
        $q = mysqli_query($sql, "SELECT p.*,c.client_name,c.phone1,c.client_email,c.address AS client_address FROM tbl_3d_floor_plan p LEFT JOIN tbl_client c ON c.client_id=p.client_id AND c.company_id=p.company_id WHERE p.company_id='$company_id' AND p.plan_id='$plan_id' AND p.is_deleted='1' LIMIT 1");
        $row = $q ? mysqli_fetch_assoc($q) : null;
        if (!$row) { $response = ['status' => 'error', 'message' => 'Saved plan not found']; break; }
        $decoded = json_decode($row['plan_data'], true);
        $row['plan_data'] = is_array($decoded) ? $decoded : [];
        $response = ['status' => 'success', 'message' => 'Plan fetched', 'data' => $row];
        break;

    case 3: // Create or update plan and optionally store map/thumbnail images.
        $title = trim((string)($input['project_title'] ?? ''));
        $client_id = intval($input['client_id'] ?? 0);
        $bedrooms = max(1, min(20, intval($input['bedroom_count'] ?? 1)));
        $bhk = fpesc($input['bhk'] ?? ($bedrooms . ' BHK'));
        $site_type = fpesc($input['site_type'] ?? 'Flat');
        $ceiling = floatval($input['ceiling_height_ft'] ?? 10);
        $status = in_array(($input['status'] ?? 'Draft'), ['Draft','Completed'], true) ? $input['status'] : 'Draft';
        $creator = fpesc($input['created_by'] ?? '');
        $plan_data = $input['plan_data'] ?? null;
        if ($title === '' || !is_array($plan_data) || $ceiling <= 0 || $ceiling > 40) { $response = ['status' => 'error', 'message' => 'Project title, valid ceiling height, and plan data are required']; break; }
        if ($client_id > 0) {
            $cr = mysqli_query($sql, "SELECT client_id FROM tbl_client WHERE company_id='$company_id' AND client_id='$client_id' AND is_deleted='1' LIMIT 1");
            if (!$cr || mysqli_num_rows($cr) === 0) { $response = ['status' => 'error', 'message' => 'Selected customer was not found']; break; }
        }
        $json = json_encode($plan_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) { $response = ['status' => 'error', 'message' => 'Could not encode the plan data']; break; }
        $json = fpesc($json);
        $thumb = fpImage($input['thumbnail_base64'] ?? '', $company_id);
        if ($thumb['error'] !== '') { $response = ['status' => 'error', 'message' => $thumb['error']]; break; }
        $map = fpImage($input['map_image_base64'] ?? '', $company_id);
        if ($map['error'] !== '') { $response = ['status' => 'error', 'message' => $map['error']]; break; }
        $thumb_sql = $thumb['path'] !== '' ? "'" . fpesc($thumb['path']) . "'" : 'NULL';
        $map_sql = $map['path'] !== '' ? "'" . fpesc($map['path']) . "'" : 'NULL';
        if ($plan_id > 0) {
            $q = mysqli_query($sql, "UPDATE tbl_3d_floor_plan SET client_id=" . ($client_id > 0 ? "'$client_id'" : 'NULL') . ",project_title='" . fpesc($title) . "',bhk='$bhk',bedroom_count='$bedrooms',site_type='$site_type',ceiling_height_ft='$ceiling',plan_data='$json',thumbnail_path=COALESCE($thumb_sql,thumbnail_path),map_image_path=COALESCE($map_sql,map_image_path),status='" . fpesc($status) . "',updated_at='$c_date' WHERE company_id='$company_id' AND plan_id='$plan_id' AND is_deleted='1'");
            if ($q && mysqli_affected_rows($sql) >= 0) $response = ['status' => 'success', 'message' => 'Plan saved', 'plan_id' => $plan_id];
            else $response = ['status' => 'error', 'message' => 'Could not save plan'];
        } else {
            $q = mysqli_query($sql, "INSERT INTO tbl_3d_floor_plan (company_id,client_id,project_title,bhk,bedroom_count,site_type,ceiling_height_ft,plan_data,thumbnail_path,map_image_path,status,version,created_by,is_deleted,c_date,updated_at) VALUES ('$company_id'," . ($client_id > 0 ? "'$client_id'" : 'NULL') . ",'" . fpesc($title) . "','$bhk','$bedrooms','$site_type','$ceiling','$json',$thumb_sql,$map_sql,'" . fpesc($status) . "',1,'$creator','1','$c_date','$c_date')");
            if ($q) $response = ['status' => 'success', 'message' => 'Plan created', 'plan_id' => mysqli_insert_id($sql)];
            else $response = ['status' => 'error', 'message' => 'Could not create plan'];
        }
        break;

    case 4: // Soft-delete plan.
        if ($plan_id <= 0) { $response = ['status' => 'error', 'message' => 'Plan ID is required']; break; }
        $q = mysqli_query($sql, "UPDATE tbl_3d_floor_plan SET is_deleted='0',updated_at='$c_date' WHERE company_id='$company_id' AND plan_id='$plan_id' AND is_deleted='1'");
        $response = $q ? ['status' => 'success', 'message' => 'Plan deleted'] : ['status' => 'error', 'message' => 'Could not delete plan'];
        break;

    case 5: // Duplicate plan as a new editable draft.
        if ($plan_id <= 0) { $response = ['status' => 'error', 'message' => 'Plan ID is required']; break; }
        $q = mysqli_query($sql, "INSERT INTO tbl_3d_floor_plan (company_id,client_id,project_title,bhk,bedroom_count,site_type,ceiling_height_ft,plan_data,thumbnail_path,map_image_path,status,version,created_by,is_deleted,c_date,updated_at) SELECT company_id,client_id,CONCAT(project_title,' (Copy)'),bhk,bedroom_count,site_type,ceiling_height_ft,plan_data,thumbnail_path,map_image_path,'Draft',version+1,'" . fpesc($input['created_by'] ?? '') . "','1','$c_date','$c_date' FROM tbl_3d_floor_plan WHERE company_id='$company_id' AND plan_id='$plan_id' AND is_deleted='1'");
        if ($q && mysqli_affected_rows($sql) === 1) $response = ['status' => 'success', 'message' => 'Plan duplicated', 'plan_id' => mysqli_insert_id($sql)];
        else $response = ['status' => 'error', 'message' => 'Could not duplicate plan'];
        break;

    default:
        $response = ['status' => 'error', 'message' => 'Invalid request type'];
}

echo json_encode($response);
mysqli_close($sql);
?>

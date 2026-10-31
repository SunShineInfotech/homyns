<?php
require_once 'dbconnection.php';
if (!headers_sent()) header('Content-Type: application/json; charset=utf-8');
$data=json_decode(file_get_contents('php://input'),true); if(!is_array($data)) $data=$_POST;
$type=intval($data['type']??0); $company_id=mysqli_real_escape_string($sql,trim((string)($data['company_id']??'')));
$response=['status'=>'error','message'=>'Unsupported request type'];
function attEsc($v){global $sql;return mysqli_real_escape_string($sql,trim((string)$v));}
function attQuery($q){global $sql;$GLOBALS['attLastError']='';try{$result=mysqli_query($sql,$q);if($result===false)$GLOBALS['attLastError']=mysqli_error($sql);return $result;}catch(Throwable $e){$GLOBALS['attLastError']=$e->getMessage();error_log('Attendance API query failed: '.$e->getMessage());return false;}}
function attDbFail($fallback){$message=(string)($GLOBALS['attLastError']??'');if(stripos($message,"doesn't exist")!==false||stripos($message,'no such table')!==false)return attFail('Attendance table is missing. Run sql/attendance.sql on the same database used by this API.');if(stripos($message,'Unknown column')!==false||stripos($message,'has no column named')!==false)return attFail('The existing attendance table has an older schema. The new attendance fields are missing; upgrade the table schema before using attendance.');if(stripos($message,'Duplicate entry')!==false)return attFail('Attendance is already marked for today. Refresh the page and try again.');return attFail($fallback);}
function attFail($m){return ['status'=>'error','message'=>$m];}
function attOk($m,$extra=[]){return array_merge(['status'=>'success','message'=>$m],$extra);}
function attListQuery($company,$where,$order='a.attendance_date DESC,a.attendance_id DESC'){
  return attQuery("SELECT a.*,a.check_in AS check_in_at,a.lunch_start AS lunch_start_at,a.lunch_stop AS lunch_stop_at,a.check_out AS check_out_at,e.name AS employee_name,e.employee_number,
    CASE WHEN a.lunch_start IS NOT NULL AND a.lunch_stop IS NOT NULL THEN TIMESTAMPDIFF(SECOND,a.lunch_start,a.lunch_stop) ELSE 0 END AS total_lunch_seconds,
    CASE WHEN a.check_in IS NOT NULL AND a.check_out IS NOT NULL THEN GREATEST(0,TIMESTAMPDIFF(SECOND,a.check_in,a.check_out)-CASE WHEN a.lunch_start IS NOT NULL AND a.lunch_stop IS NOT NULL THEN TIMESTAMPDIFF(SECOND,a.lunch_start,a.lunch_stop) ELSE 0 END) ELSE 0 END AS total_work_seconds
    FROM tbl_attendance a LEFT JOIN tbl_employee e ON e.emp_id=a.emp_id AND e.company_id=a.company_id WHERE a.company_id='$company' AND a.is_deleted='1' $where ORDER BY $order");
}
if($company_id==='') $response=attFail('Company ID is required');
else switch($type){
  case 1: // My attendance history and summary.
    $emp=intval($data['emp_id']??0);$from=attEsc($data['from_date']??'');$to=attEsc($data['to_date']??'');
    if($emp<=0||$from===''||$to===''){$response=attFail('Employee and date range are required');break;}
    $q=attListQuery($company_id,"AND a.emp_id='$emp' AND a.attendance_date BETWEEN '$from' AND '$to'");
    if(!$q){$response=attFail('Could not load attendance');break;}
    $rows=[];$summary=['present'=>0,'half_day'=>0,'absent'=>0,'total_work_seconds'=>0];
    while($row=mysqli_fetch_assoc($q)){$rows[]=$row;$s=strtolower($row['status']);if($s==='present')$summary['present']++;elseif($s==='half day')$summary['half_day']++;elseif($s==='absent')$summary['absent']++;$summary['total_work_seconds']+=intval($row['total_work_seconds']);}
    $response=attOk('Attendance fetched',['data'=>$rows,'total'=>count($rows),'summary'=>$summary]);break;
  case 2: // All employees attendance for a date range.
    $from=attEsc($data['from_date']??'');$to=attEsc($data['to_date']??'');$emp=intval($data['emp_id']??0);
    if($from===''||$to===''){$response=attFail('Date range is required');break;}
    $where="AND a.attendance_date BETWEEN '$from' AND '$to'";if($emp>0)$where.=" AND a.emp_id='$emp'";
    $q=attListQuery($company_id,$where);
    if(!$q){$response=attFail('Could not load attendance');break;}$rows=[];while($r=mysqli_fetch_assoc($q))$rows[]=$r;
    $response=attOk('All attendance fetched',['data'=>$rows,'total'=>count($rows)]);break;
  case 3: // Today’s attendance action state.
    $emp=intval($data['emp_id']??0);if($emp<=0){$response=attFail('Employee ID is required');break;}
    $q=attListQuery($company_id,"AND a.emp_id='$emp' AND a.attendance_date='$date'",'a.attendance_id DESC');
    if(!$q){$response=attDbFail('Could not load today attendance. Check the attendance database setup.');break;}$row=mysqli_fetch_assoc($q);
    $response=attOk('Today attendance fetched',['data'=>$row?:null]);break;
  case 4: // Sequential check-in / lunch / check-out actions.
    $emp=intval($data['emp_id']??0);$action=(string)($data['action']??'');
    if($emp<=0){$response=attFail('Employee ID is required');break;}
    $check=attQuery("SELECT attendance_id,check_in AS check_in_at,lunch_start AS lunch_start_at,lunch_stop AS lunch_stop_at,check_out AS check_out_at,is_deleted FROM tbl_attendance WHERE company_id='$company_id' AND emp_id='$emp' AND attendance_date='$date' ORDER BY attendance_id DESC LIMIT 1");
    $row=$check?mysqli_fetch_assoc($check):null;
    if(!$check){$response=attDbFail('Could not load today attendance. Check the attendance database setup.');break;}
    if($action==='check_in'){
      if($row){$ok=attQuery("UPDATE tbl_attendance SET status='Present',check_in=NOW(),lunch_start=NULL,lunch_stop=NULL,check_out=NULL,total_working_hrs=0,total_hrs=0,is_deleted='1' WHERE company_id='$company_id' AND attendance_id='{$row['attendance_id']}'");$response=$ok?attOk('Checked in'):attDbFail('Could not check in');break;}
      $ok=attQuery("INSERT INTO tbl_attendance (company_id,emp_id,attendance_date,check_in,total_working_hrs,total_hrs,status,is_deleted,c_date) VALUES ('$company_id','$emp','$date',NOW(),0,0,'Present','1','$c_date')");
      $response=$ok?attOk('Checked in'):attDbFail('Could not check in');break;
    }
    if(!$row||$row['is_deleted']!=='1'){$response=attFail('Check in before recording attendance actions');break;}
    if($row['check_out_at']){$response=attFail('You have already checked out today');break;}
    if($action==='lunch_start'){
      if(!$row['check_in_at']||$row['lunch_start_at']||$row['lunch_stop_at']){$response=attFail('Lunch can only be started once after check-in');break;}
      $ok=attQuery("UPDATE tbl_attendance SET lunch_start=NOW() WHERE company_id='$company_id' AND attendance_id='{$row['attendance_id']}' AND lunch_start IS NULL AND check_out IS NULL AND is_deleted='1'");
    }elseif($action==='lunch_stop'){
      if(!$row['lunch_start_at']||$row['lunch_stop_at']){$response=attFail('Start lunch before stopping it');break;}
      $ok=attQuery("UPDATE tbl_attendance SET lunch_stop=NOW() WHERE company_id='$company_id' AND attendance_id='{$row['attendance_id']}' AND lunch_start IS NOT NULL AND lunch_stop IS NULL AND check_out IS NULL AND is_deleted='1'");
    }elseif($action==='check_out'){
      if($row['lunch_start_at']&&!$row['lunch_stop_at']){$response=attFail('Stop lunch before checking out');break;}
      $ok=attQuery("UPDATE tbl_attendance SET check_out=NOW(),total_hrs=SEC_TO_TIME(TIMESTAMPDIFF(SECOND,check_in,NOW())),total_working_hrs=SEC_TO_TIME(GREATEST(0,TIMESTAMPDIFF(SECOND,check_in,NOW())-CASE WHEN lunch_start IS NOT NULL AND lunch_stop IS NOT NULL THEN TIMESTAMPDIFF(SECOND,lunch_start,lunch_stop) ELSE 0 END)) WHERE company_id='$company_id' AND attendance_id='{$row['attendance_id']}' AND check_out IS NULL AND is_deleted='1'");
    }else{$response=attFail('Unsupported attendance action');break;}
    $response=$ok?attOk('Attendance action saved'):attFail('Could not save attendance action');break;
  case 5: // Admin attendance correction.
    $id=intval($data['attendance_id']??0);$emp=intval($data['emp_id']??0);$day=attEsc($data['attendance_date']??'');$status=attEsc($data['status']??'Present');
    if($id<=0||$emp<=0||$day===''){$response=attFail('Attendance, employee and date are required');break;}
    $fields=[];foreach(['check_in_at'=>'check_in','lunch_start_at'=>'lunch_start','lunch_stop_at'=>'lunch_stop','check_out_at'=>'check_out'] as $input=>$column){$v=attEsc($data[$input]??'');$fields[]="$column=".($v===''?'NULL':"'$v'");}
    $ok=attQuery("UPDATE tbl_attendance SET attendance_date='$day',status='$status',".implode(',',$fields)." WHERE company_id='$company_id' AND attendance_id='$id' AND is_deleted='1'");
    $response=$ok?attOk('Attendance updated'):attFail('Could not update attendance');break;
  case 6:
    $id=intval($data['attendance_id']??0);if($id<=0){$response=attFail('Attendance ID is required');break;}
    $ok=attQuery("UPDATE tbl_attendance SET is_deleted='0' WHERE company_id='$company_id' AND attendance_id='$id' AND is_deleted='1'");
    $response=$ok?attOk('Attendance deleted'):attFail('Could not delete attendance');break;
  case 7: // Monthly sheet records.
    $year=intval($data['year']??date('Y'));$month=intval($data['month']??date('n'));$emp=intval($data['emp_id']??0);
    if($year<2000||$year>2100||$month<1||$month>12){$response=attFail('Select a valid month');break;}
    $from=sprintf('%04d-%02d-01',$year,$month);$to=date('Y-m-t',strtotime($from));$where="AND a.attendance_date BETWEEN '$from' AND '$to'";if($emp>0)$where.=" AND a.emp_id='$emp'";
    $q=attListQuery($company_id,$where,'e.name ASC,a.attendance_date ASC');if(!$q){$response=attFail('Could not load attendance sheet');break;}$rows=[];while($r=mysqli_fetch_assoc($q))$rows[]=$r;
    $response=attOk('Attendance sheet fetched',['data'=>$rows,'total'=>count($rows),'year'=>$year,'month'=>$month]);break;
  default:$response=attFail('Unsupported request type');
}
echo json_encode($response);mysqli_close($sql);
?>

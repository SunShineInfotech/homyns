<?php
// Company-scoped agency CRUD API.
require_once 'dbconnection.php';
if (!headers_sent()) header('Content-Type: application/json; charset=utf-8');
$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) $data = $_POST;
$type = intval($data['type'] ?? 0);
$company_id = mysqli_real_escape_string($sql, trim((string)($data['company_id'] ?? '')));
$agency_id = intval($data['agency_id'] ?? 0);
$response = ['status' => 'error', 'message' => 'Unsupported request type'];
$esc = function ($value) use ($sql) { return mysqli_real_escape_string($sql, trim((string)$value)); };

switch ($type) {
    case 1:
    case 2:
        if ($company_id === '') { $response = ['status'=>'error','message'=>'Company ID is required']; break; }
        if ($type === 2 && $agency_id <= 0) { $response = ['status'=>'error','message'=>'Agency ID is required']; break; }
        $agency_name = $esc($data['agency_name'] ?? '');
        if ($agency_name === '') { $response = ['status'=>'error','message'=>'Agency name is required']; break; }
        $firm_name = $esc($data['firm_name'] ?? '');
        $contact_person = $esc($data['contact_person'] ?? '');
        $phone = $esc($data['phone'] ?? '');
        $whatsapp_number = $esc($data['whatsapp_number'] ?? '');
        $email = $esc($data['email'] ?? '');
        $address = $esc($data['address'] ?? '');
        $state_id = intval($data['state_id'] ?? 0);
        $city_id = intval($data['city_id'] ?? 0);
        $area_id = intval($data['area_id'] ?? 0);
        $gst_number = $esc(strtoupper((string)($data['gst_number'] ?? '')));
        $status = ($data['status'] ?? 'Active') === 'Inactive' ? 'Inactive' : 'Active';
        if ($type === 1) {
            $wallet = round(max(0, floatval($data['wallet'] ?? 0)), 2);
            $query = "INSERT INTO tbl_agency (company_id,agency_name,firm_name,contact_person,phone,whatsapp_number,email,address,state_id,city_id,area_id,gst_number,wallet,status,is_deleted,c_date)
                      VALUES ('$company_id','$agency_name','$firm_name','$contact_person','$phone','$whatsapp_number','$email','$address'," . ($state_id ?: 'NULL') . "," . ($city_id ?: 'NULL') . "," . ($area_id ?: 'NULL') . ",'$gst_number','$wallet','$status','1','$c_date')";
        } else {
            $query = "UPDATE tbl_agency SET agency_name='$agency_name',firm_name='$firm_name',contact_person='$contact_person',phone='$phone',whatsapp_number='$whatsapp_number',email='$email',address='$address',state_id=" . ($state_id ?: 'NULL') . ",city_id=" . ($city_id ?: 'NULL') . ",area_id=" . ($area_id ?: 'NULL') . ",gst_number='$gst_number',status='$status',updated_at='$c_date' WHERE company_id='$company_id' AND agency_id='$agency_id' AND is_deleted='1'";
        }
        mysqli_begin_transaction($sql);
        if (mysqli_query($sql, $query)) {
            $link_agency_id = $type === 1 ? intval(mysqli_insert_id($sql)) : $agency_id;
            $work_type_ids = $data['work_type_ids'] ?? [];
            if (!is_array($work_type_ids)) $work_type_ids = [];
            $links_ok = mysqli_query($sql, "DELETE FROM tbl_agency_work_type WHERE company_id='$company_id' AND agency_id='$link_agency_id'");
            foreach (array_unique(array_map('intval', $work_type_ids)) as $work_type_id) {
                if (!$links_ok || $work_type_id <= 0) continue;
                $valid = mysqli_query($sql, "SELECT work_type_id FROM tbl_work_type WHERE company_id='$company_id' AND work_type_id='$work_type_id' AND is_deleted='1' LIMIT 1");
                if (!$valid || mysqli_num_rows($valid) === 0 || !mysqli_query($sql, "INSERT INTO tbl_agency_work_type (agency_id,work_type_id,company_id) VALUES ('$link_agency_id','$work_type_id','$company_id')")) $links_ok = false;
            }
            if (!$links_ok) {
                mysqli_rollback($sql);
                $response = ['status'=>'error','message'=>'Could not save agency work types. Run the Work Types SQL setup and retry.'];
                break;
            }
            mysqli_commit($sql);
            $response = ['status'=>'success','message'=>$type === 1 ? 'Agency added successfully' : 'Agency updated successfully'];
            if ($type === 1) $response['agency_id'] = $link_agency_id;
        } else { mysqli_rollback($sql); $response = ['status'=>'error','message'=>'Could not save agency']; }
        break;
    case 3:
        if ($company_id === '') { $response = ['status'=>'error','message'=>'Company ID is required']; break; }
        $query = "SELECT a.agency_id,a.company_id,a.agency_name,a.firm_name,a.contact_person,a.phone,a.whatsapp_number,a.email,a.address,a.state_id,a.city_id,a.area_id,a.gst_number,a.wallet,a.status,a.is_deleted,a.c_date,s.state_name,c.city_name,ar.area_name FROM tbl_agency a LEFT JOIN tbl_state s ON s.state_id=a.state_id LEFT JOIN tbl_city c ON c.city_id=a.city_id LEFT JOIN tbl_area ar ON ar.area_id=a.area_id WHERE a.company_id='$company_id' AND a.is_deleted='1' ORDER BY a.agency_name ASC";
        $result = mysqli_query($sql, $query);
        if (!$result) { $response = ['status'=>'error','message'=>'Could not fetch agencies']; break; }
        $agencies = []; while ($row = mysqli_fetch_assoc($result)) {
            $row['work_type_ids'] = [];
            $row['work_type_names'] = [];
            $links = mysqli_query($sql, "SELECT aw.work_type_id,wt.name FROM tbl_agency_work_type aw LEFT JOIN tbl_work_type wt ON wt.work_type_id=aw.work_type_id AND wt.company_id=aw.company_id AND wt.is_deleted='1' WHERE aw.company_id='$company_id' AND aw.agency_id='{$row['agency_id']}' ORDER BY wt.name ASC");
            if ($links) while ($link = mysqli_fetch_assoc($links)) {
                $row['work_type_ids'][] = (string)$link['work_type_id'];
                if (!empty($link['name'])) $row['work_type_names'][] = $link['name'];
            }
            $agencies[] = $row;
        }
        $response = ['status'=>'success','message'=>'Agencies fetched successfully','data'=>$agencies,'total'=>count($agencies)];
        break;
    case 4:
        if ($company_id === '' || $agency_id <= 0) { $response = ['status'=>'error','message'=>'Company ID and agency ID are required']; break; }
        if (mysqli_query($sql, "UPDATE tbl_agency SET is_deleted='0',updated_at='$c_date' WHERE company_id='$company_id' AND agency_id='$agency_id' AND is_deleted='1'")) $response = ['status'=>'success','message'=>'Agency deleted successfully'];
        else $response = ['status'=>'error','message'=>'Could not delete agency'];
        break;
    case 5: // Agency wallet ledger
        if ($company_id === '' || $agency_id <= 0) { $response = ['status'=>'error','message'=>'Company ID and agency ID are required']; break; }
        $agencyResult = mysqli_query($sql, "SELECT agency_id,agency_name,wallet,c_date FROM tbl_agency WHERE company_id='$company_id' AND agency_id='$agency_id' AND is_deleted='1' LIMIT 1");
        $agency = $agencyResult ? mysqli_fetch_assoc($agencyResult) : null;
        if (!$agency) { $response = ['status'=>'error','message'=>'Agency not found']; break; }
        $ledgerQuery = "SELECT * FROM (
            SELECT DATE(a.c_date) transaction_date,CONCAT('OPEN-',a.agency_id) transaction_id,NULL entry_id,'Opening Balance' transaction_type,'Opening balance' reference,'Opening agency wallet balance' remark,CAST(a.wallet - COALESCE((SELECT SUM(IF(e0.entry_type='Credit',e0.amount,-e0.amount)) FROM tbl_agency_wallet_entry e0 WHERE e0.company_id=a.company_id AND e0.agency_id=a.agency_id AND e0.is_deleted='1'),0) AS DECIMAL(14,2)) credit,CAST(0 AS DECIMAL(14,2)) debit,0 sort_order,0 is_locked FROM tbl_agency a WHERE a.company_id='$company_id' AND a.agency_id='$agency_id' AND a.is_deleted='1'
            UNION ALL
            SELECT e.entry_date,CAST(e.entry_id AS CHAR),e.entry_id,e.entry_type,IF(qw.assignment_id IS NULL,'Manual entry',CONCAT('Quotation ',q.quotation_number,' · ',wt.name)),COALESCE(qw.remark,e.remark,''),IF(e.entry_type='Credit',e.amount,0),IF(e.entry_type='Debit',e.amount,0),1,IF(qw.assignment_id IS NULL,0,1) FROM tbl_agency_wallet_entry e LEFT JOIN tbl_quotation_agency_work qw ON qw.wallet_entry_id=e.entry_id AND qw.company_id=e.company_id LEFT JOIN tbl_quotation q ON q.quotation_id=qw.quotation_id LEFT JOIN tbl_work_type wt ON wt.work_type_id=qw.work_type_id WHERE e.company_id='$company_id' AND e.agency_id='$agency_id' AND e.is_deleted='1'
        ) ledger_rows ORDER BY transaction_date ASC,sort_order ASC,transaction_id ASC";
        $ledgerResult = mysqli_query($sql, $ledgerQuery);
        if (!$ledgerResult) { $response = ['status'=>'error','message'=>'Could not fetch agency wallet entries']; break; }
        $entries = []; $balance = 0; $totalDebit = 0; $totalCredit = 0;
        while ($entry = mysqli_fetch_assoc($ledgerResult)) {
            $entry['debit'] = (float)$entry['debit']; $entry['credit'] = (float)$entry['credit'];
            $totalDebit += $entry['debit']; $totalCredit += $entry['credit'];
            $balance += $entry['credit'] - $entry['debit']; $entry['balance'] = round($balance, 2);
            $entries[] = $entry;
        }
        $response = ['status'=>'success','message'=>'Agency wallet entries fetched successfully','agency'=>['agency_id'=>$agency['agency_id'],'agency_name'=>$agency['agency_name'],'wallet'=>(float)$agency['wallet']],'data'=>$entries,'totals'=>['debit'=>round($totalDebit,2),'credit'=>round($totalCredit,2),'balance'=>round($balance,2)]];
        break;
    case 6: // Add agency wallet entry
        if ($company_id === '' || $agency_id <= 0) { $response = ['status'=>'error','message'=>'Company ID and agency ID are required']; break; }
        $entry_type = ($data['entry_type'] ?? '') === 'Debit' ? 'Debit' : 'Credit';
        $amount = round(floatval($data['amount'] ?? 0), 2);
        $entry_date = $esc($data['entry_date'] ?? date('Y-m-d'));
        $remark = $esc($data['remark'] ?? '');
        if ($amount <= 0) { $response = ['status'=>'error','message'=>'Amount must be greater than zero']; break; }
        mysqli_begin_transaction($sql);
        $agencyResult = mysqli_query($sql, "SELECT wallet FROM tbl_agency WHERE company_id='$company_id' AND agency_id='$agency_id' AND is_deleted='1' LIMIT 1 FOR UPDATE");
        $agency = $agencyResult ? mysqli_fetch_assoc($agencyResult) : null;
        $effect = $entry_type === 'Credit' ? $amount : -$amount;
        $newWallet = $agency ? round((float)$agency['wallet'] + $effect, 2) : 0;
        $ok = $agency && mysqli_query($sql, "INSERT INTO tbl_agency_wallet_entry (company_id,agency_id,entry_date,entry_type,amount,remark,is_deleted,c_date) VALUES ('$company_id','$agency_id','$entry_date','$entry_type','$amount','$remark','1','$c_date')");
        if ($ok) $ok = mysqli_query($sql, "UPDATE tbl_agency SET wallet='$newWallet',updated_at='$c_date' WHERE company_id='$company_id' AND agency_id='$agency_id' AND is_deleted='1'");
        if ($ok) { mysqli_commit($sql); $response = ['status'=>'success','message'=>'Agency wallet entry added','entry_id'=>mysqli_insert_id($sql),'wallet'=>$newWallet]; }
        else { mysqli_rollback($sql); $response = ['status'=>'error','message'=>$agency?'Could not save agency wallet entry':'Agency not found']; }
        break;
    case 7: // Edit agency wallet entry and adjust current wallet by the difference
        $entry_id = intval($data['entry_id'] ?? 0);
        if ($company_id === '' || $agency_id <= 0 || $entry_id <= 0) { $response = ['status'=>'error','message'=>'Company ID, agency ID, and entry ID are required']; break; }
        $entry_type = ($data['entry_type'] ?? '') === 'Debit' ? 'Debit' : 'Credit';
        $amount = round(floatval($data['amount'] ?? 0), 2);
        $entry_date = $esc($data['entry_date'] ?? date('Y-m-d'));
        $remark = $esc($data['remark'] ?? '');
        if ($amount <= 0) { $response = ['status'=>'error','message'=>'Amount must be greater than zero']; break; }
        mysqli_begin_transaction($sql);
        $agencyResult = mysqli_query($sql, "SELECT wallet FROM tbl_agency WHERE company_id='$company_id' AND agency_id='$agency_id' AND is_deleted='1' LIMIT 1 FOR UPDATE");
        $agency = $agencyResult ? mysqli_fetch_assoc($agencyResult) : null;
        $entryResult = mysqli_query($sql, "SELECT entry_type,amount FROM tbl_agency_wallet_entry WHERE company_id='$company_id' AND agency_id='$agency_id' AND entry_id='$entry_id' AND is_deleted='1' LIMIT 1 FOR UPDATE");
        $oldEntry = $entryResult ? mysqli_fetch_assoc($entryResult) : null;
        if (!$agency || !$oldEntry) { mysqli_rollback($sql); $response = ['status'=>'error','message'=>'Agency or wallet entry not found']; break; }
        $linked = mysqli_query($sql, "SELECT assignment_id FROM tbl_quotation_agency_work WHERE company_id='$company_id' AND wallet_entry_id='$entry_id' LIMIT 1");
        if ($linked && mysqli_num_rows($linked) > 0) { mysqli_rollback($sql); $response = ['status'=>'error','message'=>'Quotation work assignments are locked and cannot be edited']; break; }
        $oldEffect = $oldEntry['entry_type'] === 'Credit' ? (float)$oldEntry['amount'] : -(float)$oldEntry['amount'];
        $newEffect = $entry_type === 'Credit' ? $amount : -$amount;
        $newWallet = round((float)$agency['wallet'] - $oldEffect + $newEffect, 2);
        $ok = mysqli_query($sql, "UPDATE tbl_agency_wallet_entry SET entry_date='$entry_date',entry_type='$entry_type',amount='$amount',remark='$remark',updated_at='$c_date' WHERE company_id='$company_id' AND agency_id='$agency_id' AND entry_id='$entry_id' AND is_deleted='1'");
        if ($ok) $ok = mysqli_query($sql, "UPDATE tbl_agency SET wallet='$newWallet',updated_at='$c_date' WHERE company_id='$company_id' AND agency_id='$agency_id' AND is_deleted='1'");
        if ($ok) { mysqli_commit($sql); $response = ['status'=>'success','message'=>'Agency wallet entry updated','wallet'=>$newWallet]; }
        else { mysqli_rollback($sql); $response = ['status'=>'error','message'=>'Could not update agency wallet entry']; }
        break;
    case 8: // Delete agency wallet entry and reverse its wallet impact
        $entry_id = intval($data['entry_id'] ?? 0);
        if ($company_id === '' || $agency_id <= 0 || $entry_id <= 0) { $response = ['status'=>'error','message'=>'Company ID, agency ID, and entry ID are required']; break; }
        mysqli_begin_transaction($sql);
        $agencyResult = mysqli_query($sql, "SELECT wallet FROM tbl_agency WHERE company_id='$company_id' AND agency_id='$agency_id' AND is_deleted='1' LIMIT 1 FOR UPDATE");
        $agency = $agencyResult ? mysqli_fetch_assoc($agencyResult) : null;
        $entryResult = mysqli_query($sql, "SELECT entry_type,amount FROM tbl_agency_wallet_entry WHERE company_id='$company_id' AND agency_id='$agency_id' AND entry_id='$entry_id' AND is_deleted='1' LIMIT 1 FOR UPDATE");
        $entry = $entryResult ? mysqli_fetch_assoc($entryResult) : null;
        if (!$agency || !$entry) { mysqli_rollback($sql); $response = ['status'=>'error','message'=>'Agency or wallet entry not found']; break; }
        $linked = mysqli_query($sql, "SELECT assignment_id FROM tbl_quotation_agency_work WHERE company_id='$company_id' AND wallet_entry_id='$entry_id' LIMIT 1");
        if ($linked && mysqli_num_rows($linked) > 0) { mysqli_rollback($sql); $response = ['status'=>'error','message'=>'Quotation work assignments are locked and cannot be deleted']; break; }
        $effect = $entry['entry_type'] === 'Credit' ? (float)$entry['amount'] : -(float)$entry['amount'];
        $newWallet = round((float)$agency['wallet'] - $effect, 2);
        $ok = mysqli_query($sql, "UPDATE tbl_agency_wallet_entry SET is_deleted='0',updated_at='$c_date' WHERE company_id='$company_id' AND agency_id='$agency_id' AND entry_id='$entry_id' AND is_deleted='1'");
        if ($ok) $ok = mysqli_query($sql, "UPDATE tbl_agency SET wallet='$newWallet',updated_at='$c_date' WHERE company_id='$company_id' AND agency_id='$agency_id' AND is_deleted='1'");
        if ($ok) { mysqli_commit($sql); $response = ['status'=>'success','message'=>'Agency wallet entry deleted','wallet'=>$newWallet]; }
        else { mysqli_rollback($sql); $response = ['status'=>'error','message'=>'Could not delete agency wallet entry']; }
        break;
    case 9: // Read quotation agency assignments
        $quotation_id = intval($data['quotation_id'] ?? 0);
        if ($company_id === '' || $quotation_id <= 0) { $response = ['status'=>'error','message'=>'Company ID and quotation ID are required']; break; }
        $result = mysqli_query($sql, "SELECT x.assignment_id,x.quotation_id,x.work_type_id,wt.name AS work_type_name,x.agency_id,a.agency_name,a.firm_name,a.phone,a.contact_person,x.amount,x.remark,x.wallet_entry_id,we.agency_id AS wallet_agency_id,x.c_date FROM tbl_quotation_agency_work x LEFT JOIN tbl_work_type wt ON wt.work_type_id=x.work_type_id AND wt.company_id=x.company_id LEFT JOIN tbl_agency a ON a.agency_id=x.agency_id AND a.company_id=x.company_id LEFT JOIN tbl_agency_wallet_entry we ON we.entry_id=x.wallet_entry_id AND we.company_id=x.company_id WHERE x.company_id='$company_id' AND x.quotation_id='$quotation_id' ORDER BY wt.name ASC");
        if (!$result) { $response=['status'=>'error','message'=>'Could not load quotation agency assignments']; break; }
        $rows=[]; while ($row=mysqli_fetch_assoc($result)) { $row['amount']=(float)$row['amount']; $rows[]=$row; }
        $response=['status'=>'success','message'=>'Quotation agency assignments fetched successfully','data'=>$rows,'total'=>count($rows),'locked'=>count($rows)>0];
        break;
    case 10: // Replace quotation agency assignments and reconcile wallets atomically
        $quotation_id = intval($data['quotation_id'] ?? 0);
        $assignments = $data['assignments'] ?? [];
        $emp_id = $esc($data['emp_id'] ?? '');
        if ($company_id === '' || $quotation_id <= 0 || !is_array($assignments)) { $response=['status'=>'error','message'=>'Quotation and agency assignment details are required']; break; }
        mysqli_begin_transaction($sql);
        $quoteResult = mysqli_query($sql, "SELECT quotation_number,status FROM tbl_quotation WHERE company_id='$company_id' AND quotation_id='$quotation_id' AND is_deleted='1' LIMIT 1 FOR UPDATE");
        $quote = $quoteResult ? mysqli_fetch_assoc($quoteResult) : null;
        if (!$quote) { mysqli_rollback($sql); $response=['status'=>'error','message'=>'Quotation not found']; break; }
        if ($quote['status'] !== 'Work In Progress') { mysqli_rollback($sql); $response=['status'=>'error','message'=>'Agency assignments can only be saved while the quotation is Work In Progress']; break; }
        $existing = mysqli_query($sql, "SELECT x.assignment_id,x.work_type_id,x.agency_id,x.amount,x.wallet_entry_id,we.agency_id AS wallet_agency_id,we.amount AS wallet_entry_amount,we.entry_type AS wallet_entry_type FROM tbl_quotation_agency_work x LEFT JOIN tbl_agency_wallet_entry we ON we.entry_id=x.wallet_entry_id AND we.company_id=x.company_id WHERE x.company_id='$company_id' AND x.quotation_id='$quotation_id' FOR UPDATE");
        if (!$existing) { mysqli_rollback($sql); $response=['status'=>'error','message'=>'Could not load existing agency assignments']; break; }
        $oldAssignments=[]; $oldByType=[]; while ($old=mysqli_fetch_assoc($existing)) { $oldAssignments[]=$old; $oldByType[(string)$old['work_type_id']]=$old; }
        $newByType=[]; foreach ($assignments as $item) $newByType[(string)intval($item['work_type_id'] ?? 0)]=$item;
        $failed='';
        foreach ($oldAssignments as $old) {
            $oldAgencyId=intval($old['wallet_agency_id'] ?: $old['agency_id']); $oldAmount=round(floatval($old['wallet_entry_amount'] ?? 0),2); $oldEntryId=intval($old['wallet_entry_id']);
            $replacement=$newByType[(string)$old['work_type_id']] ?? null;
            $agencyChanged=$replacement && intval($replacement['agency_id'] ?? 0)!==intval($old['agency_id']);
            $preserveOldDeal=$replacement && (($agencyChanged && empty($replacement['cancel_previous_deal'])) || !empty($replacement['preserve_wallet_entry']));
            if ($preserveOldDeal) continue;
            if ($oldEntryId > 0 && $oldAmount > 0) {
                $oldAgencyResult=mysqli_query($sql,"SELECT wallet FROM tbl_agency WHERE company_id='$company_id' AND agency_id='$oldAgencyId' LIMIT 1 FOR UPDATE");
                $oldAgency=$oldAgencyResult?mysqli_fetch_assoc($oldAgencyResult):null;
                if (!$oldAgency) { $failed='An agency from the saved assignments could not be found; no changes were made'; break; }
                $walletEffect=$old['wallet_entry_type']==='Debit' ? -$oldAmount : $oldAmount;
                $reversedWallet=round(floatval($oldAgency['wallet'])-$walletEffect,2);
                if (!mysqli_query($sql,"UPDATE tbl_agency SET wallet='$reversedWallet',updated_at='$c_date' WHERE company_id='$company_id' AND agency_id='$oldAgencyId'")) { $failed='Could not reverse the previous agency wallet amount'; break; }
                if (!mysqli_query($sql,"UPDATE tbl_agency_wallet_entry SET is_deleted='0',updated_at='$c_date' WHERE company_id='$company_id' AND agency_id='$oldAgencyId' AND entry_id='$oldEntryId' AND is_deleted='1'")) { $failed='Could not close a previous agency wallet entry'; break; }
            }
        }
        if ($failed==='') {
            $deleteAssignments=mysqli_query($sql,"DELETE FROM tbl_quotation_agency_work WHERE company_id='$company_id' AND quotation_id='$quotation_id'");
            if (!$deleteAssignments) $failed='Could not replace the existing agency assignments';
        }
        $seen=[]; $totalAmount=0;
        foreach ($assignments as $item) {
            if ($failed!=='') break;
            $work_type_id=intval($item['work_type_id'] ?? 0); $agency_id=intval($item['agency_id'] ?? 0);
            $amount=round(floatval($item['amount'] ?? 0),2); $remark=$esc($item['remark'] ?? '');
            if ($work_type_id<=0 || $agency_id<=0 || $amount<0) { $failed='Select an agency person and enter a valid non-negative amount'; break; }
            if (isset($seen[$work_type_id])) { $failed='Each work type can be assigned only once'; break; }
            $seen[$work_type_id]=true;
            $typeCheck=mysqli_query($sql,"SELECT name FROM tbl_work_type WHERE company_id='$company_id' AND work_type_id='$work_type_id' AND is_deleted='1' LIMIT 1");
            $typeRow=$typeCheck?mysqli_fetch_assoc($typeCheck):null;
            $agencyCheck=mysqli_query($sql,"SELECT a.agency_id,a.wallet,a.contact_person FROM tbl_agency a INNER JOIN tbl_agency_work_type aw ON aw.agency_id=a.agency_id AND aw.company_id=a.company_id WHERE a.company_id='$company_id' AND a.agency_id='$agency_id' AND aw.work_type_id='$work_type_id' AND a.is_deleted='1' AND a.status='Active' LIMIT 1 FOR UPDATE");
            $agency=$agencyCheck?mysqli_fetch_assoc($agencyCheck):null;
            if (!$typeRow || !$agency || trim((string)$agency['contact_person'])==='') { $failed='Selected agency person is not active or is not assigned to the selected work type'; break; }
            $oldRow=$oldByType[(string)$work_type_id] ?? null;
            $agencyChangedWithoutCancel=$oldRow && intval($oldRow['agency_id'])!==$agency_id && empty($item['cancel_previous_deal']);
            $preserveExistingEntry=$agencyChangedWithoutCancel || !empty($item['preserve_wallet_entry']);
            $wallet_entry_id=$preserveExistingEntry && $oldRow && !empty($oldRow['wallet_entry_id']) ? (string)$oldRow['wallet_entry_id'] : 'NULL';
            if ($amount > 0 && !$preserveExistingEntry) {
                $walletRemark=$esc('Quotation '.$quote['quotation_number'].' · '.$typeRow['name'].($remark !== '' ? ' · '.$remark : ''));
                $newWallet=round((float)$agency['wallet']+$amount,2);
                $entryOk=mysqli_query($sql,"INSERT INTO tbl_agency_wallet_entry (company_id,agency_id,entry_date,entry_type,amount,remark,is_deleted,c_date) VALUES ('$company_id','$agency_id',DATE('$c_date'),'Credit','$amount','$walletRemark','1','$c_date')");
                if (!$entryOk) { $failed='Could not create agency wallet transaction'; break; }
                $wallet_entry_id=(string)mysqli_insert_id($sql);
                if (!mysqli_query($sql,"UPDATE tbl_agency SET wallet='$newWallet',updated_at='$c_date' WHERE company_id='$company_id' AND agency_id='$agency_id' AND is_deleted='1'")) { $failed='Could not update agency wallet balance'; break; }
            }
            $quotationRemark=$esc($item['remark']);
            if (!mysqli_query($sql,"INSERT INTO tbl_quotation_agency_work (company_id,quotation_id,work_type_id,agency_id,amount,remark,wallet_entry_id,emp_id,c_date) VALUES ('$company_id','$quotation_id','$work_type_id','$agency_id','$amount','$quotationRemark'," . ($wallet_entry_id === 'NULL' ? 'NULL' : "'$wallet_entry_id'") . ",'$emp_id','$c_date')")) { $failed='Could not save quotation agency assignment'; break; }
            $totalAmount += $amount;
        }
        if ($failed!=='') { mysqli_rollback($sql); $response=['status'=>'error','message'=>$failed]; break; }
        mysqli_commit($sql);
        $response=['status'=>'success','message'=>'Agency assignments updated and wallet balances reconciled','total_amount'=>round($totalAmount,2),'assignment_count'=>count($seen)];
        break;
}
echo json_encode($response);
mysqli_close($sql);
?>

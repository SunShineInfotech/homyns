import { ApiResponse, BaseService } from "./api.config";

export interface AttendanceRecord {
  attendance_id?: string;
  company_id?: string;
  emp_id: string;
  employee_name?: string;
  employee_number?: string;
  attendance_date: string;
  status: string;
  check_in_at?: string | null;
  lunch_start_at?: string | null;
  lunch_stop_at?: string | null;
  check_out_at?: string | null;
  total_lunch_seconds?: number;
  total_work_seconds?: number;
  c_date?: string;
}

class AttendanceService extends BaseService {
  constructor() { super("attendance.php"); }
  mine(company_id: string, emp_id: string, from_date: string, to_date: string) { return this.post<ApiResponse<AttendanceRecord[]> & { summary?: Record<string, number> }>({ type: 1, company_id, emp_id, from_date, to_date }); }
  all(company_id: string, filters: { from_date: string; to_date: string; emp_id?: string }) { return this.post<ApiResponse<AttendanceRecord[]>>({ type: 2, company_id, ...filters }); }
  today(company_id: string, emp_id: string) { return this.post<ApiResponse<AttendanceRecord | null>>({ type: 3, company_id, emp_id }); }
  action(company_id: string, emp_id: string, action: "check_in" | "lunch_start" | "lunch_stop" | "check_out") { return this.post<ApiResponse<AttendanceRecord>>({ type: 4, company_id, emp_id, action }); }
  update(company_id: string, item: AttendanceRecord) { return this.post<ApiResponse>({ type: 5, company_id, ...item }); }
  delete(company_id: string, attendance_id: string) { return this.post<ApiResponse>({ type: 6, company_id, attendance_id }); }
  monthly(company_id: string, year: number, month: number, emp_id?: string) { return this.post<ApiResponse<AttendanceRecord[]>>({ type: 7, company_id, year: String(year), month: String(month), emp_id: emp_id || "" }); }
}

export const attendanceService = new AttendanceService();

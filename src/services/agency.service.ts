import { BaseService, ApiResponse } from "./api.config";

export interface Agency {
  agency_id?: string;
  company_id?: string;
  agency_name: string;
  firm_name?: string;
  contact_person?: string;
  phone?: string;
  whatsapp_number?: string;
  email?: string;
  address?: string;
  state_id?: string;
  city_id?: string;
  area_id?: string;
  gst_number?: string;
  wallet?: number | string;
  state_name?: string;
  city_name?: string;
  area_name?: string;
  status?: string;
  c_date?: string;
  work_type_ids?: string[];
  work_type_names?: string[];
}

class AgencyService extends BaseService {
  constructor() { super("agency.php"); }
  list(company_id: string) { return this.post<ApiResponse<Agency[]>>({ type: 3, company_id }); }
  save(agency: Agency, company_id: string) {
    const fields = { ...agency };
    if (agency.agency_id) delete fields.wallet;
    return this.post<ApiResponse & { agency_id?: number }>({ type: agency.agency_id ? 2 : 1, company_id, ...fields });
  }
  remove(agency_id: string, company_id: string) { return this.post<ApiResponse>({ type: 4, company_id, agency_id }); }
  ledger(agency_id: string, company_id: string) { return this.post<ApiResponse<any[]>>({ type: 5, company_id, agency_id }); }
  addEntry(data: Record<string, any>) { return this.post<ApiResponse>({ type: 6, ...data }); }
  updateEntry(data: Record<string, any>) { return this.post<ApiResponse>({ type: 7, ...data }); }
  deleteEntry(company_id: string, agency_id: string, entry_id: string) { return this.post<ApiResponse>({ type: 8, company_id, agency_id, entry_id }); }
  quotationAssignments(company_id: string, quotation_id: string) { return this.post<ApiResponse<any[]>>({ type: 9, company_id, quotation_id }); }
  saveQuotationAssignments(company_id: string, quotation_id: string, emp_id: string, assignments: any[]) { return this.post<ApiResponse>({ type: 10, company_id, quotation_id, emp_id, assignments }); }
}

export const agencyService = new AgencyService();

import { BaseService, ApiResponse } from "./api.config";

export interface WorkType { work_type_id: string; company_id?: string; name: string; }

class WorkTypeService extends BaseService {
  constructor() { super("work_type.php"); }
  list(company_id: string) { return this.post<ApiResponse<WorkType[]>>({ type: 3, company_id }); }
  save(company_id: string, name: string, work_type_id?: string) { return this.post<ApiResponse>({ type: work_type_id ? 2 : 1, company_id, name, work_type_id }); }
  remove(company_id: string, work_type_id: string) { return this.post<ApiResponse>({ type: 4, company_id, work_type_id }); }
}

export const workTypeService = new WorkTypeService();

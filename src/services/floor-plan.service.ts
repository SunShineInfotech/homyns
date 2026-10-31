import { ApiResponse, API_URL, BaseService } from "./api.config";
import { FloorPlan, PlanData } from "@/3d-plans/types";

class FloorPlanService extends BaseService {
  constructor() { super("floor_plan.php"); }
  list(company_id: string) { return this.post<ApiResponse<FloorPlan[]>>({ type: 1, company_id }); }
  get(company_id: string, plan_id: string) { return this.post<ApiResponse<FloorPlan>>({ type: 2, company_id, plan_id }); }
  save(payload: { company_id: string; plan_id?: string; client_id?: string | null; project_title: string; bhk: string; bedroom_count: number; site_type: string; ceiling_height_ft: number; status: "Draft" | "Completed"; created_by?: string; plan_data: PlanData; thumbnail_base64?: string; map_image_base64?: string }) {
    return this.post<ApiResponse<FloorPlan> & { plan_id?: number }>({ type: 3, ...payload });
  }
  remove(company_id: string, plan_id: string) { return this.post<ApiResponse>({ type: 4, company_id, plan_id }); }
  duplicate(company_id: string, plan_id: string, created_by?: string) { return this.post<ApiResponse & { plan_id?: number }>({ type: 5, company_id, plan_id, created_by }); }
}

export const floorPlanService = new FloorPlanService();
export const floorPlanAssetUrl = (path?: string) => path ? `${API_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}` : "";

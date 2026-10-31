import { ApiResponse, BaseService } from "./api.config";

export const PRODUCTION_STATUSES = [
  { value: 1, label: "Pending" },
  { value: 2, label: "Work Started" },
  { value: 3, label: "Waiting for Client Response" },
  { value: 4, label: "Product Ready" },
  { value: 5, label: "Product Set In Place" },
] as const;

export const WORK_ORDER_PRIORITIES = [
  { value: 1, label: "Low" },
  { value: 2, label: "Normal" },
  { value: 3, label: "High" },
  { value: 4, label: "Urgent" },
] as const;

export interface WorkOrderHistoryEntry {
  history_id: string;
  qp_id: string;
  status: number | string;
  status_title?: string;
  remark?: string;
  image?: string;
  emp_id?: string;
  emp_name?: string;
  c_date?: string;
  c_time?: string;
  c_datetime?: string;
}

interface WorkOrderHistoryResponse extends ApiResponse<WorkOrderHistoryEntry[]> {
  data?: WorkOrderHistoryEntry[];
}

interface UpdateWorkOrderResponse extends ApiResponse {
  qp_id?: number;
  work_order_no?: string;
  production_status?: number;
  status_title?: string;
}

class WorkOrderService extends BaseService {
  constructor() {
    super("workorder.php");
  }

  async getProductHistory(companyId: string, qpId: string): Promise<WorkOrderHistoryResponse> {
    try {
      return await this.post<WorkOrderHistoryResponse>({
        type: 4,
        company_id: companyId,
        qp_id: qpId,
      });
    } catch (error: any) {
      return {
        status: "error",
        message: error.response?.data?.message || "Failed to load work order history",
        data: [],
      };
    }
  }

  async updateProduct(data: {
    company_id: string;
    qp_id: string;
    emp_id: string;
    production_status: number;
    assigned_to: string;
    priority: number;
    remark: string;
    image_base64?: string;
  }): Promise<UpdateWorkOrderResponse> {
    try {
      return await this.post<UpdateWorkOrderResponse>({ type: 1, ...data });
    } catch (error: any) {
      return {
        status: "error",
        message: error.response?.data?.message || "Failed to update product work order",
      };
    }
  }
}

export const workOrderService = new WorkOrderService();

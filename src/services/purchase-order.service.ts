import { ApiResponse, BaseService } from "./api.config";

export interface PurchaseOrderLineInput {
  item_type: "raw_material" | "product";
  material_id: string;
  quantity: number;
  rate: number;
  gst_percent: number;
}

export interface PurchaseOrderInput {
  company_id: string;
  order_date: string;
  vendor_id: string;
  generated_by: string;
  warehouse_id: string;
  expected_delivery_date: string;
  items: PurchaseOrderLineInput[];
}

class PurchaseOrderService extends BaseService {
  constructor() { super("purchase-order.php"); }
  list(company_id: string) { return this.post<ApiResponse<any[]> & { total?: number }>({ type: 2, company_id }); }
  detail(company_id: string, purchase_order_id: string) { return this.post<ApiResponse<any>>({ type: 3, company_id, purchase_order_id }); }
  create(data: PurchaseOrderInput) { return this.post<ApiResponse & { purchase_order_id?: number; po_number?: string }>({ type: 1, ...data }); }
  updateStatus(company_id: string, purchase_order_id: string, status: string) { return this.post<ApiResponse>({ type: 4, company_id, purchase_order_id, status }); }
}

export const purchaseOrderService = new PurchaseOrderService();

import { BaseService, ApiResponse } from "./api.config";

export interface Vendor {
  vendor_id?: string;
  company_id?: string;
  vendor_name: string;
  firm_name?: string;
  phone?: string;
  whatsapp_number?: string;
  email?: string;
  address?: string;
  state_id?: string;
  city_id?: string;
  area_id?: string;
  gst_number?: string;
  wallet?: number | string;
  outstanding_balance?: number | string;
  status?: string;
  c_date?: string;
}

export interface PurchaseItem {
  purchase_item_id?: string;
  item_type: "product" | "raw_material";
  item_id: string;
  item_name?: string;
  unit_name?: string;
  quantity: number;
  unit_price: number;
  gst_percent: number;
  gst_amount?: number;
  line_total?: number;
  returnable_qty?: number;
}

export interface VendorLedgerEntry {
  transaction_date: string;
  transaction_id: string;
  transaction_type: string;
  reference: string;
  remark: string;
  debit: number | string;
  credit: number | string;
  balance: number | string;
}

class VendorService extends BaseService {
  constructor() { super("vendor.php"); }
  list(company_id: string) { return this.post<ApiResponse<Vendor[]>>({ type: 3, company_id }); }
  save(vendor: Vendor, company_id: string) {
    const updateFields = { ...vendor };
    delete updateFields.wallet;
    return this.post<ApiResponse & { vendor_id?: number }>({ type: vendor.vendor_id ? 2 : 1, company_id, ...(vendor.vendor_id ? updateFields : vendor) });
  }
  archive(vendor_id: string, company_id: string) { return this.post<ApiResponse>({ type: 4, vendor_id, company_id }); }
  ledger(vendor_id: string, company_id: string) { return this.post<ApiResponse<VendorLedgerEntry[]>>({ type: 5, vendor_id, company_id }); }
}

class PurchasingService extends BaseService {
  constructor() { super("purchasing.php"); }
  purchases(company_id: string) { return this.post<ApiResponse<any[]>>({ type: 2, company_id }); }
  purchase(purchase_id: string, company_id: string) { return this.post<ApiResponse<any>>({ type: 3, purchase_id, company_id }); }
  createPurchase(data: Record<string, any>) { return this.post<ApiResponse & { purchase_id?: number }>({ type: 1, ...data }); }
  updatePurchase(data: Record<string, any>) { return this.post<ApiResponse & { purchase_id?: number; total_amount?: number }>({ type: 11, ...data }); }
  returns(company_id: string) { return this.post<ApiResponse<any[]>>({ type: 4, company_id }); }
  createReturn(data: Record<string, any>) { return this.post<ApiResponse>({ type: 5, ...data }); }
  payments(company_id: string) { return this.post<ApiResponse<any[]>>({ type: 6, company_id }); }
  createPayment(data: Record<string, any>) { return this.post<ApiResponse>({ type: 7, ...data }); }
  updatePayment(data: Record<string, any>) { return this.post<ApiResponse>({ type: 10, ...data }); }
  reminders(company_id: string) { return this.post<ApiResponse<any[]>>({ type: 9, company_id }); }
}

export const vendorService = new VendorService();
export const purchasingService = new PurchasingService();

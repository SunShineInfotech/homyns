import { ApiResponse, BaseService } from "./api.config";

export interface Warehouse {
  warehouse_id?: string;
  company_id?: string;
  warehouse_name: string;
  address?: string;
  state_id?: string;
  city_id?: string;
  area_id?: string;
  pincode?: string;
  state_name?: string;
  city_name?: string;
  area_name?: string;
  status?: string;
  deck_count?: number;
}

export interface WarehouseDeck {
  deck_id?: string;
  warehouse_id: string;
  company_id?: string;
  deck_name: string;
  deck_code?: string;
  status?: string;
}

export interface StockItemLine {
  key?: string;
  item_type: "product" | "raw_material";
  item_id: string;
  item_name?: string;
  unit_name?: string;
  quantity: number;
  warehouse_id: string;
  deck_id: string;
}

export interface StockBalanceRow extends StockItemLine {
  warehouse_name: string;
  deck_name: string;
  quantity: number;
}

class StockService extends BaseService {
  constructor() { super("stock.php"); }
  warehouses(company_id: string) { return this.post<ApiResponse<Warehouse[]>>({ type: 1, company_id }); }
  saveWarehouse(company_id: string, item: Warehouse) { return this.post<ApiResponse>({ type: 2, company_id, ...item }); }
  deleteWarehouse(company_id: string, warehouse_id: string) { return this.post<ApiResponse>({ type: 3, company_id, warehouse_id }); }
  decks(company_id: string, warehouse_id: string) { return this.post<ApiResponse<WarehouseDeck[]>>({ type: 4, company_id, warehouse_id }); }
  saveDeck(company_id: string, item: WarehouseDeck) { return this.post<ApiResponse>({ type: 5, company_id, ...item }); }
  deleteDeck(company_id: string, deck_id: string) { return this.post<ApiResponse>({ type: 6, company_id, deck_id }); }
  balances(company_id: string, filters: Record<string, string> = {}) { return this.post<ApiResponse<StockBalanceRow[]>>({ type: 7, company_id, action: "balances", ...filters }); }
  movements(company_id: string, filters: Record<string, string> = {}) { return this.post<ApiResponse<any[]>>({ type: 8, company_id, action: "movements", ...filters }); }
  workQuotations(company_id: string) { return this.post<ApiResponse<any[]>>({ type: 11, company_id }); }
  receiveOrIssue(company_id: string, movement_type: "Stock IN" | "Stock OUT" | "Dead Stock", item: StockItemLine & { movement_date: string; remark: string; added_by: string; quotation_id?: string }) { return this.post<ApiResponse>({ type: 9, company_id, movement_type, ...item }); }
  transfer(company_id: string, item: StockItemLine & { from_warehouse_id: string; from_deck_id: string; to_warehouse_id: string; to_deck_id: string; movement_date: string; remark: string; added_by: string }) { return this.post<ApiResponse>({ type: 10, company_id, ...item }); }
}

export const stockService = new StockService();

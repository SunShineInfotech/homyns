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

class StockService extends BaseService {
  constructor() { super("stock.php"); }
  warehouses(company_id: string) { return this.post<ApiResponse<Warehouse[]>>({ type: 1, company_id }); }
  saveWarehouse(company_id: string, item: Warehouse) { return this.post<ApiResponse>({ type: 2, company_id, ...item }); }
  deleteWarehouse(company_id: string, warehouse_id: string) { return this.post<ApiResponse>({ type: 3, company_id, warehouse_id }); }
  decks(company_id: string, warehouse_id: string) { return this.post<ApiResponse<WarehouseDeck[]>>({ type: 4, company_id, warehouse_id }); }
  saveDeck(company_id: string, item: WarehouseDeck) { return this.post<ApiResponse>({ type: 5, company_id, ...item }); }
  deleteDeck(company_id: string, deck_id: string) { return this.post<ApiResponse>({ type: 6, company_id, deck_id }); }
}

export const stockService = new StockService();

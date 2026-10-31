import { ApiResponse, BaseService } from "@/services/api.config";

export interface CustomerWalletLedgerEntry {
  transaction_id: string | number;
  transaction_date: string;
  transaction_type: string;
  reference?: string;
  remark?: string;
  account_name?: string;
  debit: number | string;
  credit: number | string;
  balance?: number | string;
}

export interface CustomerWalletPayment {
  client_id: string;
  account_id: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference_number?: string;
  remark?: string;
}

class CustomerWalletService extends BaseService {
  constructor() { super("customer-wallet.php"); }
  ledger(company_id: string, client_id: string) {
    return this.post<ApiResponse<CustomerWalletLedgerEntry[]> & { customer?: any; totals?: any }>({ type: 1, company_id, client_id });
  }
  collectPayment(company_id: string, item: CustomerWalletPayment) {
    return this.post<ApiResponse & { payment_id?: number; transaction_id?: number }>({ type: 2, company_id, ...item });
  }
}

export const customerWalletService = new CustomerWalletService();

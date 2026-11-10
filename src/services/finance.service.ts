import { ApiResponse, BaseService } from "./api.config";

export interface ExpenseCategory {
  expenses_categories_id?: string;
  company_id?: string;
  expenses_categories_title: string;
  c_date?: string;
}

export interface FinanceAccount {
  account_id?: string;
  company_id?: string;
  account_name: string;
  account_number?: string;
  account_ifsc?: string;
  account_balance?: number | string;
  account_branch_name?: string;
  account_holder_name?: string;
  account_gst_number?: string;
  account_upi_id?: string;
}

export function createUpiPaymentUri(account: FinanceAccount, amount?: number | string) {
  if (!account.account_upi_id?.trim()) return "";
  const params = new URLSearchParams({ pa: account.account_upi_id.trim(), pn: account.account_holder_name?.trim() || account.account_name, cu: "INR" });
  const value = Number(amount);
  if (Number.isFinite(value) && value > 0) params.set("am", value.toFixed(2));
  return `upi://pay?${params.toString()}`;
}

export interface FinanceTransaction {
  transaction_id?: string;
  transaction_type: number;
  transaction_in_out: number;
  transaction_bank_id: string;
  transaction_expense_category_id?: string;
  transaction_amount: number | string;
  transaction_date: string;
  transaction_remark?: string;
  transaction_name?: string;
  transaction_address?: string;
  account_name?: string;
  expenses_categories_title?: string;
}

export interface FinanceLedgerRow extends FinanceTransaction {
  transaction_debit: number | string;
  transaction_credit: number | string;
  running_balance: number | string;
}

export interface FinanceDashboardData {
  counts: { customers: number; vendors: number; agencies: number; other_income: number; other_expense: number };
  totals: { customer_outstanding: number; vendor_outstanding: number; agency_pending: number; other_income: number; other_expense: number };
  customers: Array<{ id: string; name: string; amount: number }>;
  vendors: Array<{ id: string; name: string; amount: number }>;
  agencies: Array<{ id: string; name: string; amount: number }>;
  monthly: Array<{ month: string; income: number; expense: number }>;
  expense_categories: Array<{ name: string; amount: number }>;
}

class FinanceService extends BaseService {
  constructor() { super("finance.php"); }
  categories(company_id: string) { return this.post<ApiResponse<ExpenseCategory[]>>({ type: 1, company_id }); }
  saveCategory(company_id: string, item: ExpenseCategory) { return this.post<ApiResponse>({ type: 2, company_id, ...item }); }
  archiveCategory(company_id: string, expenses_categories_id: string) { return this.post<ApiResponse>({ type: 3, company_id, expenses_categories_id }); }
  accounts(company_id: string) { return this.post<ApiResponse<FinanceAccount[]>>({ type: 4, company_id }); }
  saveAccount(company_id: string, item: FinanceAccount) { return this.post<ApiResponse>({ type: 5, company_id, ...item }); }
  archiveAccount(company_id: string, account_id: string) { return this.post<ApiResponse>({ type: 6, company_id, account_id }); }
  transactions(company_id: string, filters: Record<string, string> = {}) { return this.post<ApiResponse<FinanceTransaction[]> & { income_total?: number; expense_total?: number }>({ type: 7, company_id, ...filters }); }
  accountLedger(company_id: string, filters: { account_id: string; from_date: string; to_date: string }) { return this.post<ApiResponse<FinanceLedgerRow[]> & { account_name?: string; opening_balance?: number; closing_balance?: number; debit_total?: number; credit_total?: number }>({ type: 10, company_id, ...filters }); }
  transferBetweenAccounts(company_id: string, item: { transfer_number?: string; transfer_date: string; debit_account_id: string; credit_account_id: string; amount: number | string; debit_remark: string; credit_remark: string }) { return this.post<ApiResponse>({ type: 11, company_id, ...item }); }
  dashboard(company_id: string, from_date: string, to_date: string) { return this.post<ApiResponse<FinanceDashboardData>>({ type: 12, company_id, from_date, to_date }); }
  saveTransaction(company_id: string, kind: "expense" | "income", item: Partial<FinanceTransaction>) { return this.post<ApiResponse>({ type: 8, company_id, kind, ...item }); }
  deleteTransaction(company_id: string, transaction_id: string) { return this.post<ApiResponse>({ type: 9, company_id, transaction_id }); }
}

export const financeService = new FinanceService();

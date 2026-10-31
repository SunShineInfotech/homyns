// src/services/quotation-status.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface QuotationStatusHistory {
  history_id?: string;
  company_id?: string;
  quotation_id?: string;
  emp_id?: string;
  emp_name?: string;
  status: string;
  remark?: string;
  c_date?: string;
  c_time?: string;
}

export const QUOTATION_STATUSES = [
  'Pending',
  'Approved by Admin',
  'Sent to Customer',
  'Revision Requested',
  'Approved by Customer',
  'Rejected by Customer',
  'Invoice Generated',
  'Work In Progress',
  'Work Completed',
  'Work Stop Due To Payment',
  'Closed',
  'Rejected'
];

export class QuotationStatusService extends BaseService {
  constructor() {
    super('quotation.php');
  }

  /**
   * Update quotation status
   */
  async updateStatus(data: {
    quotation_id: string;
    company_id: string;
    emp_id: string;
    status: string;
    remark?: string;
  }): Promise<ApiResponse> {
    try {
      const payload = {
        type: 6,
        quotation_id: data.quotation_id,
        company_id: data.company_id,
        emp_id: data.emp_id,
        status: data.status,
        remark: data.remark || ''
      };
      
      console.log('Updating status payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update status error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update status'
      };
    }
  }

  /**
   * Get status history for a quotation
   */
  async getStatusHistory(quotationId: string): Promise<ApiResponse<QuotationStatusHistory[]>> {
    try {
      const payload = {
        type: 7,
        quotation_id: quotationId
      };
      
      console.log('Get status history payload:', payload);
      
      const response = await this.post<ApiResponse<QuotationStatusHistory[]>>(payload);
      return response;
    } catch (error: any) {
      console.error('Get status history error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch status history',
        data: []
      };
    }
  }

  /** Get the most recent date/time when an invoice was generated for a quotation. */
  async getLatestInvoiceGenerated(quotationId: string, companyId: string): Promise<ApiResponse<QuotationStatusHistory>> {
    try {
      return await this.post<ApiResponse<QuotationStatusHistory>>({
        type: 16,
        quotation_id: quotationId,
        company_id: companyId,
      });
    } catch (error: any) {
      console.error('Get invoice generated date error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch invoice generation date',
      };
    }
  }
}

// Export singleton instance
export const quotationStatusService = new QuotationStatusService();

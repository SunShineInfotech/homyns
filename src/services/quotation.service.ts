// src/services/quotation.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface Quotation {
  quotation_id?: string;
  company_id?: string;
  quotation_number?: string;
  client_id?: string;
  client_name?: string;
  package_id?: string;
  package_name?: string;
  generated_by?: string;
  generated_by_name?: string;
  subtotal?: number;
  discount_type?: 'Percent' | 'INR';
  discount_value?: number;
  discount_amount?: number;
  amount_after_discount?: number;
  gst_applicable?: boolean;
  gst_percent?: number;
  gst_amount?: number;
  final_amount?: number;
  remark?: string;
  status?: string;
  approved_by?: string;
  approved_date?: string;
  approved_time?: string;
  customer_approved_date?: string;
  customer_approved_time?: string;
  whatsapp_sent?: boolean;
  whatsapp_sent_at?: string;
  is_deleted?: string;
  c_date?: string;
  rooms?: any[];
}

export class QuotationService extends BaseService {
  constructor() {
    super('quotation.php');
  }

  /**
   * Fetch all quotations for a company
   */
  async getQuotations(companyId: string): Promise<ApiResponse<Quotation[]>> {
    try {
      const response = await this.post<ApiResponse<Quotation[]>>({
        type: 3,
        company_id: companyId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get quotations error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch quotations',
        data: []
      };
    }
  }

  /**
   * Get a single quotation by ID
   */
  async getQuotation(quotationId: string): Promise<ApiResponse<Quotation>> {
    try {
      const response = await this.post<ApiResponse<Quotation>>({
        type: 5,
        quotation_id: quotationId
      });
      
      return response;
    } catch (error: any) {
      console.error('Get quotation error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch quotation',
        data: undefined
      };
    }
  }

  /**
   * Create a new quotation
   */
  async createQuotation(data: any): Promise<ApiResponse> {
    try {
      const payload = {
        type: 1,
        ...data
      };
      
      console.log('Creating quotation payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Create quotation error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to create quotation'
      };
    }
  }

  /**
   * Delete a quotation (soft delete)
   */
  async deleteQuotation(quotationId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        quotation_id: quotationId
      };
      
      console.log('Delete quotation payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete quotation error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete quotation'
      };
    }
  }
}

// Export singleton instance
export const quotationService = new QuotationService();
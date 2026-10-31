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
  package_details?: string;
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
  invoice_generated_at?: string;
  is_deleted?: string;
  c_date?: string;
  /** Quotation date (YYYY-MM-DD) — exists only in tbl_quotation */
  quotation_date?: string;
  /** Client's own created date / status (returned separately by the API) */
  client_c_date?: string;
  client_status?: string;
  rooms?: any[];
  // Client fields
  phone?: string;
  phone1?: string;
  phone2?: string;
  whatsapp_number?: string;
  email?: string;
  client_email?: string;
  address?: string;
  city?: string;
  client_city?: string;
  state?: string;
  client_state?: string;
  gst_number?: string;
  client_gst?: string;
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

  /**
   * Update a quotation product
   */
  async updateQuotationProduct(data: any): Promise<ApiResponse> {
    try {
      // Ensure all required fields are present
      const payload = {
        type: 9,
        quotation_id: data.quotation_id,
        qp_id: data.qp_id, // This is critical
        product_id: data.product_id,
        qty_type: data.qty_type,
        qty: data.qty || 1,
        height: data.height || 0,
        width: data.width || 0,
        depth: data.depth || 0,
        length: data.length || 0,
        dimension_unit: data.dimension_unit || "feet",
        unit_price: data.unit_price || 0,
        total_price: data.total_price || 0,
        remark: data.remark || "",
        company_id: data.company_id,
      };

      console.log('Update quotation product payload:', payload);

      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update quotation product error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update product'
      };
    }
  }

  /**
   * Delete a quotation product
   */
  async deleteQuotationProduct(data: any): Promise<ApiResponse> {
    try {
      const payload = {
        type: 10,
        ...data
      };

      console.log('Delete quotation product payload:', payload);

      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete quotation product error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete product'
      };
    }
  }

  /**
   * Add a quotation product
   */
  async addQuotationProduct(data: any): Promise<ApiResponse> {
    try {
      // Ensure all required fields are present
      const payload = {
        type: 8,
        quotation_id: data.quotation_id,
        qr_id: data.qr_id, // This is critical
        room_id: data.room_id || "",
        product_id: data.product_id,
        qty_type: data.qty_type || "Fixed",
        qty: data.qty || 1,
        height: data.height || 0,
        width: data.width || 0,
        depth: data.depth || 0,
        length: data.length || 0,
        dimension_unit: data.dimension_unit || "feet",
        unit_price: data.unit_price || 0,
        total_price: data.total_price || 0,
        remark: data.remark || "",
        company_id: data.company_id,
      };

      console.log('Add quotation product payload:', payload);

      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Add quotation product error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add product'
      };
    }
  }

  /**
   * Add a room to quotation
   */
  async addQuotationRoom(data: any): Promise<ApiResponse> {
    try {
      const payload = {
        type: 11,
        quotation_id: data.quotation_id,
        room_id: data.room_id, // This is critical
        company_id: data.company_id,
      };

      console.log('Add quotation room payload:', payload);

      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Add quotation room error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add room'
      };
    }
  }


  /**
   * Delete a room from quotation
   */
  async deleteQuotationRoom(data: any): Promise<ApiResponse> {
    try {
      const payload = {
        type: 12,
        ...data
      };

      console.log('Delete quotation room payload:', payload);

      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete quotation room error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete room'
      };
    }
  }

  /**
   * Update quotation discount and GST
   */
  async updateQuotationDiscountGst(data: any): Promise<ApiResponse> {
    try {
      const payload = {
        type: 13,
        ...data
      };

      console.log('Update discount GST payload:', payload);

      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update discount GST error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update discount and GST'
      };
    }
  }

  /**
   * Update quotation remark
   */
  async updateQuotationRemark(data: any): Promise<ApiResponse> {
    try {
      const payload = {
        type: 14,
        ...data
      };

      console.log('Update remark payload:', payload);

      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update remark error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update remark'
      };
    }
  }

  /**
   * Replace the raw materials of one quotation product (Edit Item).
   * The list sent is the final list: missing rows are removed, existing ones
   * updated and new ones added. The product master is not changed.
   */
  async updateQuotationProductRawMaterials(data: {
    quotation_id: string;
    qp_id: string;
    company_id: string;
    raw_materials: { rm_id: string; required_qty: number; unit?: string }[];
  }): Promise<ApiResponse> {
    try {
      const payload = {
        type: 17,
        quotation_id: data.quotation_id,
        qp_id: data.qp_id,
        company_id: data.company_id,
        raw_materials: data.raw_materials,
      };

      console.log('Update quotation product raw materials payload:', payload);

      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update quotation product raw materials error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update raw materials'
      };
    }
  }

  // Add this private method to get company_id from localStorage
  private getCompanyId(): string {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      return "";
    }
    return "";
  }

  /**
   * Update room sort order
   */
  async updateRoomSortOrder(quotationId: string, roomOrder: { qr_id: string; sort_order: number }[]): Promise<ApiResponse> {
    try {
      const payload = {
        type: 15,
        quotation_id: quotationId,
        room_order: roomOrder,
        company_id: this.getCompanyId(),
      };
      console.log('Update room sort order payload:', payload);
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update room sort order error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update room order'
      };
    }
  }
}



// Export singleton instance
export const quotationService = new QuotationService();
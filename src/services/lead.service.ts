// src/services/lead.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface Lead {
  lead_id?: string;
  company_id?: string;
  lead_name: string;
  phone1?: string;
  phone2?: string;
  whatsapp_number?: string;
  email?: string;
  address?: string;
  state_id?: string;
  city_id?: string;
  area_id?: string;
  source_id?: string;
  requirement?: string;
  budget?: number;
  assigned_to?: string;
  status?: string;
  converted_client_id?: string;
  is_deleted?: string;
  c_date?: string;
  // Joined fields
  state_name?: string;
  city_name?: string;
  area_name?: string;
  source_name?: string;
  assigned_emp_name?: string;
  status_name?: string;
}

export interface LeadFollowup {
  followup_id?: string;
  company_id?: string;
  lead_id?: string;
  followup_date?: string;
  next_followup_date?: string;
  followup_by?: string;
  mode?: string;
  remark?: string;
  status_update?: string;
  is_deleted?: string;
  c_date?: string;
  // Joined fields
  followup_by_name?: string;
  lead_name?: string;
}

export class LeadService extends BaseService {
  constructor() {
    super('lead.php');
  }

  /**
   * Get all leads for a company
   */
  async getLeads(companyId: string, type: 'all' | 'my' = 'all', empId?: string): Promise<ApiResponse<Lead[]>> {
    try {
      const payload: any = {
        type: 3,
        company_id: companyId,
        lead_type: type
      };
      if (empId) {
        payload.emp_id = empId;
      }
      const response = await this.post<ApiResponse<Lead[]>>(payload);
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get leads error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch leads',
        data: []
      };
    }
  }

  /**
   * Get a single lead by ID
   */
  async getLead(leadId: string): Promise<ApiResponse<Lead>> {
    try {
      const response = await this.post<ApiResponse<Lead>>({
        type: 5,
        lead_id: leadId
      });
      return response;
    } catch (error: any) {
      console.error('Get lead error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch lead',
        data: undefined
      };
    }
  }

  /**
   * Add a new lead
   */
  async addLead(data: any): Promise<ApiResponse> {
    try {
      const payload = {
        type: 1,
        ...data
      };
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Add lead error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add lead'
      };
    }
  }

  /**
   * Update a lead
   */
  async updateLead(data: any): Promise<ApiResponse> {
    try {
      const payload = {
        type: 2,
        ...data
      };
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update lead error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update lead'
      };
    }
  }

  /**
   * Delete a lead
   */
  async deleteLead(leadId: string): Promise<ApiResponse> {
    try {
      const response = await this.post<ApiResponse>({
        type: 4,
        lead_id: leadId
      });
      return response;
    } catch (error: any) {
      console.error('Delete lead error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete lead'
      };
    }
  }
}

export const leadService = new LeadService();
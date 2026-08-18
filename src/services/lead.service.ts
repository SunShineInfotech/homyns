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
  project_name?: string;
  house_number?: string;
  project_type_id?: string;
  person_name?: string;
  light_bill?: string;
  light_load?: string;
  // Joined fields
  state_name?: string;
  city_name?: string;
  area_name?: string;
  source_name?: string;
  assigned_emp_name?: string;
  status_name?: string;
  project_type_name?: string;
  is_converted?: boolean;
  lead_added_by?: string;
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

export interface LeadFilters {
  employee_id?: string;
  start_date?: string;
  end_date?: string;
  lead_id?: string;
  source_id?: string;
  status?: string;
  assigned_to?: string;
}

export class LeadService extends BaseService {
  constructor() {
    super('lead.php');
  }

  /**
   * Get all leads for a company with filters
   */
  async getLeads(
    companyId: string, 
    type: 'all' | 'my' = 'all', 
    empId?: string,
    filters?: LeadFilters
  ): Promise<ApiResponse<Lead[]>> {
    try {
      const payload: any = {
        type: 3,
        company_id: companyId,
        lead_type: type
      };
      if (empId) {
        payload.emp_id = empId;
      }
      if (filters) {
        if (filters.employee_id) payload.filter_employee_id = filters.employee_id;
        if (filters.start_date) payload.start_date = filters.start_date;
        if (filters.end_date) payload.end_date = filters.end_date;
        if (filters.source_id) payload.filter_source_id = filters.source_id;
        if (filters.status) payload.filter_status = filters.status;
        if (filters.assigned_to) payload.filter_assigned_to = filters.assigned_to;
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

  /**
   * Convert lead to client
   */
  async convertToClient(leadId: string): Promise<ApiResponse> {
    try {
      const response = await this.post<ApiResponse>({
        type: 6,
        lead_id: leadId
      });
      return response;
    } catch (error: any) {
      console.error('Convert lead error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to convert lead'
      };
    }
  }

  /**
   * Transfer leads to another employee
   */
  async transferLeads(leadIds: string[], targetEmployeeId: string): Promise<ApiResponse> {
    try {
      const response = await this.post<ApiResponse>({
        type: 7,
        lead_ids: leadIds,
        target_employee_id: targetEmployeeId
      });
      return response;
    } catch (error: any) {
      console.error('Transfer leads error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to transfer leads'
      };
    }
  }
}

export const leadService = new LeadService();
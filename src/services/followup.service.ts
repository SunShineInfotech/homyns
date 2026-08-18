// src/services/followup.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface Followup {
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
  lead_phone?: string;
}

export interface FollowupFilters {
  employee_id?: string;
  start_date?: string;
  end_date?: string;
  lead_id?: string;
  source_id?: string;
  status?: string;
}

export class FollowupService extends BaseService {
  constructor() {
    super('followup.php');
  }

  /**
   * Get all followups for a company
   */
  async getFollowups(
    companyId: string, 
    type: 'all' | 'my' | 'my_today' = 'all', 
    empId?: string,
    filters?: FollowupFilters
  ): Promise<ApiResponse<Followup[]>> {
    try {
      const payload: any = {
        type: 3,
        company_id: companyId,
        followup_type: type
      };
      if (empId) {
        payload.emp_id = empId;
      }
      if (filters) {
        if (filters.employee_id) payload.filter_employee_id = filters.employee_id;
        if (filters.start_date) payload.start_date = filters.start_date;
        if (filters.end_date) payload.end_date = filters.end_date;
        if (filters.lead_id) payload.filter_lead_id = filters.lead_id;
        if (filters.source_id) payload.filter_source_id = filters.source_id;
        if (filters.status) payload.filter_status = filters.status;
      }
      const response = await this.post<ApiResponse<Followup[]>>(payload);
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get followups error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch followups',
        data: []
      };
    }
  }

  /**
   * Get followups for a specific lead
   */
  async getLeadFollowups(leadId: string): Promise<ApiResponse<Followup[]>> {
    try {
      const response = await this.post<ApiResponse<Followup[]>>({
        type: 4,
        lead_id: leadId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get lead followups error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch followups',
        data: []
      };
    }
  }

  /**
   * Add a new followup
   */
  async addFollowup(data: any): Promise<ApiResponse> {
    try {
      const payload = {
        type: 1,
        ...data
      };
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Add followup error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add followup'
      };
    }
  }

  /**
   * Update a followup
   */
  async updateFollowup(data: any): Promise<ApiResponse> {
    try {
      const payload = {
        type: 2,
        ...data
      };
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update followup error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update followup'
      };
    }
  }

  /**
   * Delete a followup
   */
  async deleteFollowup(followupId: string): Promise<ApiResponse> {
    try {
      const response = await this.post<ApiResponse>({
        type: 5,
        followup_id: followupId
      });
      return response;
    } catch (error: any) {
      console.error('Delete followup error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete followup'
      };
    }
  }

  /**
   * Transfer followups to another employee
   */
  async transferFollowups(followupIds: string[], targetEmployeeId: string): Promise<ApiResponse> {
    try {
      const response = await this.post<ApiResponse>({
        type: 6,
        followup_ids: followupIds,
        target_employee_id: targetEmployeeId
      });
      return response;
    } catch (error: any) {
      console.error('Transfer followups error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to transfer followups'
      };
    }
  }
}

export const followupService = new FollowupService();
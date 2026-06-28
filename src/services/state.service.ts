// src/services/state.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface State {
  state_id?: string;
  company_id?: string;
  state_name: string;
  state_code?: string;
  is_deleted?: string;
  c_date?: string;
}

export class StateService extends BaseService {
  constructor() {
    // Make sure endpoint has .php extension
    super('state.php');
    console.log('StateService initialized with endpoint: state.php'); // Debug
  }

  /**
   * Fetch all states for a company
   */
  async getStates(companyId: string): Promise<ApiResponse<State[]>> {
    try {
      console.log('Fetching states for company:', companyId);
      
      const response = await this.post<ApiResponse<State[]>>({
        type: 3,
        company_id: companyId
      });
      
      console.log('Get states raw response:', response);
      
      // Ensure we always return an array
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get states error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || error.message || 'Failed to fetch states',
        data: []
      };
    }
  }

  /**
   * Add a new state
   */
  async addState(data: Partial<State>): Promise<ApiResponse> {
    try {
      const payload = {
        type: 1,
        company_id: data.company_id,
        state_name: data.state_name,
        state_code: data.state_code || ''
      };
      
      console.log('Adding state payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      console.log('Add state response:', response);
      
      return response;
    } catch (error: any) {
      console.error('Add state error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || error.message || 'Failed to add state'
      };
    }
  }

  /**
   * Update an existing state
   */
  async updateState(data: State): Promise<ApiResponse> {
    try {
      const payload = {
        type: 2,
        state_id: data.state_id,
        state_name: data.state_name,
        state_code: data.state_code || ''
      };
      
      console.log('Update state payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      console.log('Update state response:', response);
      
      return response;
    } catch (error: any) {
      console.error('Update state error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || error.message || 'Failed to update state'
      };
    }
  }

  /**
   * Delete a state (soft delete)
   */
  async deleteState(stateId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        state_id: stateId
      };
      
      console.log('Delete state payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      console.log('Delete state response:', response);
      
      return response;
    } catch (error: any) {
      console.error('Delete state error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || error.message || 'Failed to delete state'
      };
    }
  }
}

// Export singleton instance
export const stateService = new StateService();
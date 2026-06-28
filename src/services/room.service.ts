// src/services/room.service.ts
import { BaseService, ApiResponse, apiClient } from './api.config';

export interface Room {
  room_id?: string;
  company_id?: string;
  room_name: string;
  description?: string;
  image?: string;
  sort_order?: number;
  is_deleted?: string;
  c_date?: string;
  room_products?: RoomProduct[];
}

export interface RoomProduct {
  rp_id?: string;
  room_id?: string;
  product_id?: string;
  product_name?: string;
  category_name?: string;
  default_qty?: number;
  sort_order?: number;
  is_deleted?: string;
  c_date?: string;
}

export class RoomService extends BaseService {
  constructor() {
    super('room.php');
  }

  /**
   * Fetch all rooms for a company
   */
  async getRooms(companyId: string): Promise<ApiResponse<Room[]>> {
    try {
      const response = await this.post<ApiResponse<Room[]>>({
        type: 3,
        company_id: companyId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get rooms error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch rooms',
        data: []
      };
    }
  }

  /**
   * Add a new room with image
   */
  async addRoom(data: FormData): Promise<ApiResponse> {
    try {
      const response = await this.postFormData<ApiResponse>(data);
      return response;
    } catch (error: any) {
      console.error('Add room error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add room'
      };
    }
  }

  /**
   * Update an existing room with image
   */
  async updateRoom(data: FormData): Promise<ApiResponse> {
    try {
      const response = await this.postFormData<ApiResponse>(data);
      return response;
    } catch (error: any) {
      console.error('Update room error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update room'
      };
    }
  }

  /**
   * Delete a room (soft delete)
   */
  async deleteRoom(roomId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        room_id: roomId
      };
      
      console.log('Delete room payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete room error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete room'
      };
    }
  }

  /**
   * Helper method for FormData POST
   */
  private async postFormData<T>(data: FormData): Promise<T> {
    try {
      const response = await apiClient.post(this.apiEndpoint, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error(`API Error (${this.apiEndpoint}):`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const roomService = new RoomService();
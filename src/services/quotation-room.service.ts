// src/services/quotation-room.service.ts
// NEW FILE - does not modify room.service.ts
// Purpose: resolve a package's rooms (with default room_products) for the
// quotation wizard's Package -> Rooms -> Items flow.
import { BaseService, ApiResponse } from './api.config';

export interface PackageRoomProduct {
  rp_id?: string;
  room_id?: string;
  product_id?: string;
  product_name?: string;
  category_id?: string;
  category_name?: string;
  qty_type?: string;          // 'Fixed' | 'ByHWD' | 'ByHWL'
  height?: number;
  width?: number;
  depth?: number;
  length?: number;
  dimension_unit_id?: string;
  price?: number;
  default_qty?: number;
  sort_order?: number;
}

export interface PackageRoom {
  room_id?: string;
  company_id?: string;
  room_name: string;
  description?: string;
  image?: string;
  icon?: string;
  sort_order?: number;
  room_products?: PackageRoomProduct[];
}

/**
 * Calls the new quotation-room.php endpoint (type=8) to fetch rooms that
 * belong to a specific package, each with its default product list
 * pre-resolved. This is a dedicated new endpoint so room.php (your working
 * room master CRUD) is never touched.
 */
export class QuotationRoomService extends BaseService {
  constructor() {
    super('quotation-room.php');
  }

  async getRoomsByPackage(companyId: string, packageId: string): Promise<ApiResponse<PackageRoom[]>> {
    try {
      const response = await this.post<ApiResponse<PackageRoom[]>>({
        type: 8,
        company_id: companyId,
        package_id: packageId
      });

      if (response.status === 'success' && !response.data) {
        response.data = [];
      }

      return response;
    } catch (error: any) {
      console.error('Get rooms by package error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch package rooms',
        data: []
      };
    }
  }
}

export const quotationRoomService = new QuotationRoomService();
// src/services/quotation_filter.service.ts
import { BaseService, ApiResponse, apiClient } from './api.config';

// ─── Type Definitions ──────────────────────────────────────────────────────

/**
 * Package data structure from the database
 */
export interface QuotationPackage {
  company_id: string;
  package_id: string;
  package_name: string;
  details: string | null;
  completion_days: number | null;
  rooms: string; // Comma-separated room IDs
  created_by: string | null;
  status: string | null;
  is_deleted: string;
  c_date: string;
  icon?: string;
}

/**
 * Room data structure from the database
 */
export interface QuotationRoom {
  company_id: string;
  room_id: string;
  room_name: string;
  description: string | null;
  image: string | null;
  sort_order: number;
  is_deleted: string;
  c_date: string;
  products?: QuotationRoomProduct[];
  product_count?: number;
}

/**
 * Room product data structure
 */
export interface QuotationRoomProduct {
  rp_id: string;
  room_id: string;
  product_id: string;
  product_name: string;
  category_name: string;
  default_qty: number;
  sort_order: number;
  price: number;
  qty_type: 'Fixed' | 'ByHW' | 'ByHWD' | 'ByHWL';
  height: number;
  width: number;
  depth: number;
  length: number;
}

/**
 * Full quotation data response
 */
export interface QuotationData {
  package: QuotationPackage;
  rooms: QuotationRoom[];
}

/**
 * Package list response
 */
export interface PackageListResponse {
  packages: QuotationPackage[];
  total: number;
}

// ─── Service Class ──────────────────────────────────────────────────────

export class QuotationFilterService extends BaseService {
  constructor() {
    super('quotation_filter.php');
  }

  /**
   * Get package details with associated rooms
   * Type: 1
   */
  async getPackageWithRooms(
    companyId: string,
    packageId: string
  ): Promise<ApiResponse<QuotationData>> {
    try {
      const response = await this.post<ApiResponse<QuotationData>>({
        type: 1,
        company_id: companyId,
        package_id: packageId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = {
          package: {} as QuotationPackage,
          rooms: []
        };
      }
      
      return response;
    } catch (error: any) {
      console.error('Get package with rooms error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch package data',
        data: {
          package: {} as QuotationPackage,
          rooms: []
        }
      };
    }
  }

  /**
   * Get all packages for a company (for dropdown selection)
   * Type: 2
   */
  async getPackages(
    companyId: string
  ): Promise<ApiResponse<QuotationPackage[]>> {
    try {
      const response = await this.post<ApiResponse<QuotationPackage[]>>({
        type: 2,
        company_id: companyId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get packages error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch packages',
        data: []
      };
    }
  }

  /**
   * Get rooms for specific room IDs (comma-separated or array)
   * Type: 3
   */
  async getRoomsByIds(
    companyId: string,
    roomIds: string | string[]
  ): Promise<ApiResponse<QuotationRoom[]>> {
    try {
      // Convert array to comma-separated string if needed
      const roomIdsString = Array.isArray(roomIds) ? roomIds.join(',') : roomIds;
      
      const response = await this.post<ApiResponse<QuotationRoom[]>>({
        type: 3,
        company_id: companyId,
        room_ids: roomIdsString
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get rooms by IDs error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch rooms',
        data: []
      };
    }
  }

  /**
   * Get full quotation data with package, rooms, and products
   * Type: 4
   */
  async getFullQuotationData(
    companyId: string,
    packageId: string
  ): Promise<ApiResponse<QuotationData>> {
    try {
      const response = await this.post<ApiResponse<QuotationData>>({
        type: 4,
        company_id: companyId,
        package_id: packageId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = {
          package: {} as QuotationPackage,
          rooms: []
        };
      }
      
      return response;
    } catch (error: any) {
      console.error('Get full quotation data error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch quotation data',
        data: {
          package: {} as QuotationPackage,
          rooms: []
        }
      };
    }
  }

  /**
   * Helper method to parse room IDs from package rooms field
   */
  parseRoomIdsFromPackage(pkg: QuotationPackage): string[] {
    if (!pkg.rooms || pkg.rooms.trim() === '') {
      return [];
    }
    return pkg.rooms
      .split(',')
      .map(id => id.trim())
      .filter(id => id !== '');
  }

  /**
   * Helper method to check if a room is in the package
   */
  isRoomInPackage(pkg: QuotationPackage, roomId: string): boolean {
    const roomIds = this.parseRoomIdsFromPackage(pkg);
    return roomIds.includes(roomId);
  }
}

// Export singleton instance
export const quotationFilterService = new QuotationFilterService();
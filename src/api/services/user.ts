import type { User } from '@/types/auth';
import { ApiError } from '../client';

/**
 * User service for profile and user-related operations
 */
export class UserService {
  
  /**
   * Get current user profile using access token
   */
  async getProfile(accessToken: string): Promise<User> {
    if (!accessToken) {
      throw new ApiError(400, 'MISSING_TOKEN', 'Access token is required for profile request');
    }

    // Specific headers for Zero.tech API compatibility
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:141.0) Gecko/20100101 Firefox/141.0',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'X-APP-PLATFORM': 'zos',
      'Origin': 'https://zos.zero.tech',
      'Sec-GPC': '1',
      'Connection': 'keep-alive',
      'Referer': 'https://zos.zero.tech/',
      'Cookie': `zos_access_token=${accessToken}`,
      'Authorization': `Bearer ${accessToken}`,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'TE': 'trailers'
    };
    
    const response = await fetch('https://zosapi.zero.tech/api/users/current', {
      method: 'GET',
      headers,
      mode: 'cors',
      credentials: 'include',
      cache: 'no-cache'
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          code: 'PROFILE_FETCH_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      
      throw new ApiError(
        response.status,
        errorData.code || 'PROFILE_FETCH_ERROR',
        errorData.message || 'Failed to fetch user profile',
        errorData.details
      );
    }
    
    return response.json();
  }

  /**
   * Get user by ZID (Zero ID)
   */
  async getUserByZid(zid: string): Promise<User> {
    const response = await fetch(`https://zosapi.zero.tech/api/users/zids/${zid}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new ApiError(
        response.status,
        'USER_FETCH_ERROR',
        `Failed to fetch user with ZID: ${zid}`
      );
    }

    return response.json();
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>, accessToken: string): Promise<User> {
    if (!accessToken) {
      throw new ApiError(400, 'MISSING_TOKEN', 'Access token is required for profile update');
    }

    const response = await fetch('https://zosapi.zero.tech/api/users/current', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': `zos_access_token=${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new ApiError(
        response.status,
        'PROFILE_UPDATE_ERROR',
        'Failed to update user profile'
      );
    }

    return response.json();
  }
}

// Export singleton instance
export const userService = new UserService();

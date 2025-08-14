import db from './appwrite/dbServices';
import { Query } from '@/appwrite/config';

export interface User {
  $id: string;
  name: string;
  email: string;
  profile_url?: string;
  created?: string;
  last_active?: string;
  is_online?: boolean;
}

class UserService {
  /**
   * Get all users from the database
   * @param limit Maximum number of users to return (default: 50)
   * @returns Array of user objects
   */
  async getAllUsers(limit = 50): Promise<User[]> {
    try {
      const response = await db.Users.list([
        Query.limit(limit),
        Query.orderDesc('$createdAt')
      ]);
      
      return response.documents as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  /**
   * Get a user by ID
   * @param userId The user ID to fetch
   * @returns User object or null if not found
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await db.Users.get(userId);
      return user as User;
    } catch (error) {
      console.error(`Error fetching user with ID ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get a user by email
   * @param email The email to search for
   * @returns User object or null if not found
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const response = await db.Users.list([
        Query.equal('email', email)
      ]);
      
      if (response.documents && response.documents.length > 0) {
        return response.documents[0] as User;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching user with email ${email}:`, error);
      return null;
    }
  }

  /**
   * Update user's online status
   * @param userId The user ID to update
   * @param isOnline Whether the user is online
   * @returns Success status
   */
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<boolean> {
    try {
      if (!userId) return false;
      
      const updateData = {
        is_online: isOnline,
        last_active: new Date().toISOString()
      };
      
      await db.Users.update(userId, updateData);
      
      console.log(`User ${userId} marked as ${isOnline ? 'online' : 'offline'}`);
      return true;
    } catch (error) {
      console.error(`Error updating online status for user ${userId}:`, error);
      
      // If it's a network error and we're trying to mark offline, 
      // store it for later processing
      if (!isOnline && error instanceof Error && error.message.includes('network')) {
        try {
          const pendingOffline = {
            userId,
            timestamp: Date.now(),
            retryCount: 0
          };
          localStorage.setItem(`offline_retry_${userId}`, JSON.stringify(pendingOffline));
        } catch (storageError) {
          console.error('Error storing offline retry data:', storageError);
        }
      }
      
      return false;
    }
  }

  /**
   * Get online users
   * @param limit Maximum number of users to return
   * @returns Array of online users
   */
  async getOnlineUsers(limit = 20): Promise<User[]> {
    try {
      const response = await db.Users.list([
        Query.equal('is_online', true),
        Query.orderDesc('last_active'),
        Query.limit(limit)
      ]);
      
      return response.documents as User[];
    } catch (error) {
      console.error('Error fetching online users:', error);
      return [];
    }
  }

  /**
   * Mark users as offline if they haven't been active in the specified timeframe
   * @param minutes Number of minutes of inactivity to consider a user offline
   * @returns Success status
   */
  async markInactiveUsersOffline(minutes = 2): Promise<boolean> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);
      
      // Find users who are marked online but haven't been active
      const response = await db.Users.list([
        Query.equal('is_online', true),
        Query.lessThan('last_active', cutoffTime.toISOString()),
        Query.limit(100) // Limit to avoid overwhelming the database
      ]);
      
      if (response.documents && response.documents.length > 0) {
        console.log(`Marking ${response.documents.length} inactive users as offline`);
        
        // Update each user to offline
        const updatePromises = response.documents.map(user => 
          db.Users.update(user.$id, { 
            is_online: false,
            last_active: new Date().toISOString() // Update last_active to current time
          })
        );
        
        await Promise.all(updatePromises);
        console.log(`Successfully marked ${response.documents.length} users as offline`);
      }
      
      return true;
    } catch (error) {
      console.error('Error marking inactive users as offline:', error);
      return false;
    }
  }
}

export const userService = new UserService(); 
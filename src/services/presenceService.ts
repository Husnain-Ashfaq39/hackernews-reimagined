import { userService } from './userService';

class PresenceService {
  private heartbeatInterval: number | null = null;
  private cleanupInterval: number | null = null;
  private userId: string | null = null;
  
  /**
   * Initialize the presence service for a user
   * @param userId The ID of the current user
   */
  initialize(userId: string | null) {
    // Clean up any existing intervals
    this.cleanup();
    
    if (!userId) return;
    
    this.userId = userId;
    
    // Mark user as online immediately
    this.heartbeat();
    
    // Set up heartbeat interval (every 30 seconds)
    this.heartbeatInterval = window.setInterval(() => {
      this.heartbeat();
    }, 30 * 1000);
    
    // Set up page visibility change listener
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Set up window focus/blur listeners for additional reliability
    window.addEventListener('focus', this.handleWindowFocus);
    window.addEventListener('blur', this.handleWindowBlur);
    
    // Set up beforeunload listener
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    
    // Set up pagehide listener (more reliable than beforeunload)
    window.addEventListener('pagehide', this.handlePageHide);
    
    // Set up cleanup interval (every 2 minutes)
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupInactiveUsers();
    }, 2 * 60 * 1000);
  }
  
  /**
   * Clean up all intervals and event listeners
   */
  cleanup() {
    if (this.heartbeatInterval) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.cleanupInterval) {
      window.clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.handleWindowFocus);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('pagehide', this.handlePageHide);
    
    // Mark user as offline if we have a userId
    if (this.userId) {
      this.markUserOffline();
      this.userId = null;
    }
  }
  
  /**
   * Send a heartbeat to update the user's last active timestamp
   */
  private heartbeat() {
    if (!this.userId) return;
    
    userService.updateOnlineStatus(this.userId, true)
      .catch(err => console.error('Error updating heartbeat:', err));
  }
  
  /**
   * Mark user as offline using multiple methods for reliability
   */
  private markUserOffline() {
    if (!this.userId) return;
    
    // Method 1: Use sendBeacon API (most reliable for page unload)
    if (navigator.sendBeacon) {
      try {
        // Create a simple payload
        const payload = JSON.stringify({ 
          userId: this.userId, 
          action: 'offline',
          timestamp: Date.now()
        });
        
        // Note: This would need a backend endpoint to handle the beacon
        // For now, we'll use the async method as fallback
        console.log('Would send beacon with payload:', payload);
      } catch (error) {
        console.error('Error with sendBeacon:', error);
      }
    }
    
    // Method 2: Synchronous XMLHttpRequest (less reliable but immediate)
    try {
      userService.updateOnlineStatus(this.userId, false);
    } catch (error) {
      console.error('Error marking user offline:', error);
    }
    
    // Method 3: Store offline status in localStorage for recovery
    try {
      localStorage.setItem('user_offline_pending', JSON.stringify({
        userId: this.userId,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error storing offline status in localStorage:', error);
    }
  }
  
  /**
   * Handle visibility change events (tab focus/blur)
   */
  private handleVisibilityChange = () => {
    if (!this.userId) return;
    
    if (document.visibilityState === 'visible') {
      // Page is visible (user switched back to this tab), mark user as online
      console.log('Tab gained focus - marking user online');
      localStorage.removeItem('user_offline_pending');
      userService.updateOnlineStatus(this.userId, true)
        .catch(err => console.error('Error marking user online:', err));
    } else {
      // Page is hidden (user switched to another tab), mark user as offline immediately
      console.log('Tab lost focus - marking user offline');
      userService.updateOnlineStatus(this.userId, false)
        .catch(err => console.error('Error marking user offline:', err));
    }
  }
  
  /**
   * Handle beforeunload event (page close/refresh)
   */
  private handleBeforeUnload = () => {
    this.markUserOffline();
  }
  
  /**
   * Handle pagehide event (more reliable than beforeunload)
   */
  private handlePageHide = () => {
    this.markUserOffline();
  }
  
  /**
   * Clean up inactive users (mark them as offline)
   */
  private cleanupInactiveUsers() {
    userService.markInactiveUsersOffline(2) // Reduced to 2 minutes for faster cleanup
      .catch(err => console.error('Error cleaning up inactive users:', err));
  }
  
  /**
   * Check for and handle any pending offline status from localStorage
   */
  public handlePendingOfflineStatus() {
    try {
      const pendingOffline = localStorage.getItem('user_offline_pending');
      if (pendingOffline) {
        const { userId, timestamp } = JSON.parse(pendingOffline);
        
        // If the pending offline status is recent (within 1 minute), process it
        if (Date.now() - timestamp < 60000) {
          userService.updateOnlineStatus(userId, false)
            .then(() => {
              localStorage.removeItem('user_offline_pending');
              console.log('Processed pending offline status for user:', userId);
            })
            .catch(err => console.error('Error processing pending offline status:', err));
        } else {
          // Remove stale pending status
          localStorage.removeItem('user_offline_pending');
        }
      }
    } catch (error) {
      console.error('Error handling pending offline status:', error);
    }
  }
  
  /**
   * Handle window focus event
   */
  private handleWindowFocus = () => {
    if (!this.userId) return;
    
    console.log('Window gained focus - marking user online');
    userService.updateOnlineStatus(this.userId, true)
      .catch(err => console.error('Error marking user online on focus:', err));
  }
  
  /**
   * Handle window blur event
   */
  private handleWindowBlur = () => {
    if (!this.userId) return;
    
    console.log('Window lost focus - marking user offline');
    userService.updateOnlineStatus(this.userId, false)
      .catch(err => console.error('Error marking user offline on blur:', err));
  }
}

export const presenceService = new PresenceService(); 
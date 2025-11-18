/**
 * Mini Arcade Keep-Alive System
 * 
 * Prevents Render free tier cold starts by pinging the health endpoint
 * every 60 seconds when the user has the website open.
 * 
 * Features:
 * - Lightweight background pinging
 * - Automatic start/stop on page load/unload
 * - Error handling with exponential backoff
 * - No UI blocking or gameplay interference
 * - Configurable ping interval
 */

class KeepAliveManager {
    constructor() {
        this.KEEP_ALIVE_INTERVAL = 60000; // 60 seconds
        this.MAX_RETRY_INTERVAL = 300000; // 5 minutes max retry
        this.keepAliveTimer = null;
        this.retryCount = 0;
        this.isActive = false;
        
        this.bindEvents();
        console.log('MINI-ARCADE: Keep-alive system initialized');
    }

    /**
     * Start the keep-alive ping system
     */
    startKeepAlive() {
        if (this.keepAliveTimer) {
            console.log('MINI-ARCADE: Keep-alive already running');
            return;
        }

        this.isActive = true;
        this.retryCount = 0;
        
        // Initial ping
        this.pingHealth();
        
        // Start regular pinging
        this.keepAliveTimer = setInterval(() => {
            this.pingHealth();
        }, this.KEEP_ALIVE_INTERVAL);
        
        console.log('MINI-ARCADE: Keep-alive started (60s intervals)');
    }

    /**
     * Stop the keep-alive ping system
     */
    stopKeepAlive() {
        if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = null;
            this.isActive = false;
            console.log('MINI-ARCADE: Keep-alive stopped');
        }
    }

    /**
     * Ping the health endpoint
     */
    async pingHealth() {
        if (!this.isActive) return;

        try {
            const startTime = Date.now();
            const response = await fetch('/health', {
                method: 'GET',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const responseTime = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                
                // Reset retry count on success
                this.retryCount = 0;
                
                console.log(`MINI-ARCADE: Keep-alive ping successful (${responseTime}ms) - Status: ${data.status}`);
                
                // Optional: Update UI indicator if element exists
                this.updateHealthIndicator(true, responseTime);
                
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

        } catch (error) {
            console.warn('MINI-ARCADE: Keep-alive ping failed:', error.message);
            this.handlePingError();
        }
    }

    /**
     * Handle ping errors with exponential backoff
     */
    handlePingError() {
        this.retryCount++;
        this.updateHealthIndicator(false);

        // Exponential backoff for retries
        if (this.retryCount <= 3) {
            const retryDelay = Math.min(
                this.KEEP_ALIVE_INTERVAL * Math.pow(2, this.retryCount - 1),
                this.MAX_RETRY_INTERVAL
            );

            console.log(`MINI-ARCADE: Will retry keep-alive in ${retryDelay / 1000}s (attempt ${this.retryCount})`);

            // Clear current timer and set retry timer
            this.stopKeepAlive();
            
            setTimeout(() => {
                if (this.isActive) {
                    this.startKeepAlive();
                }
            }, retryDelay);
        } else {
            console.error('MINI-ARCADE: Keep-alive failed after 3 retries, stopping');
            this.stopKeepAlive();
        }
    }

    /**
     * Update health indicator in UI (if element exists)
     */
    updateHealthIndicator(isHealthy, responseTime = null) {
        const indicator = document.getElementById('health-indicator');
        if (!indicator) return;

        if (isHealthy) {
            indicator.className = 'health-indicator healthy';
            indicator.title = `Server responsive (${responseTime}ms)`;
            indicator.style.color = '#10b981'; // green
        } else {
            indicator.className = 'health-indicator unhealthy';
            indicator.title = 'Server connection issues';
            indicator.style.color = '#ef4444'; // red
        }
    }

    /**
     * Bind page lifecycle events
     */
    bindEvents() {
        // Start keep-alive when page loads
        window.addEventListener('load', () => {
            // Delay start to avoid interfering with page load
            setTimeout(() => {
                this.startKeepAlive();
            }, 5000); // 5 second delay
        });

        // Stop keep-alive when page unloads
        window.addEventListener('beforeunload', () => {
            this.stopKeepAlive();
        });

        // Handle page visibility changes (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden/tab switched - continue but reduce frequency
                console.log('MINI-ARCADE: Page hidden, keep-alive continues');
            } else {
                // Page is visible again - ensure keep-alive is running
                if (!this.keepAliveTimer && this.isActive) {
                    console.log('MINI-ARCADE: Page visible, restarting keep-alive');
                    this.startKeepAlive();
                }
            }
        });

        // Handle online/offline events
        window.addEventListener('online', () => {
            console.log('MINI-ARCADE: Connection restored, restarting keep-alive');
            if (!this.keepAliveTimer) {
                this.startKeepAlive();
            }
        });

        window.addEventListener('offline', () => {
            console.log('MINI-ARCADE: Connection lost, stopping keep-alive');
            this.stopKeepAlive();
        });
    }

    /**
     * Get keep-alive status for debugging
     */
    getStatus() {
        return {
            active: this.isActive,
            timerSet: !!this.keepAliveTimer,
            retryCount: this.retryCount,
            interval: this.KEEP_ALIVE_INTERVAL / 1000 + 's'
        };
    }

    /**
     * Manual health check for testing
     */
    async testHealth() {
        console.log('MINI-ARCADE: Manual health check...');
        await this.pingHealth();
    }
}

// Create global instance
const keepAliveManager = new KeepAliveManager();

// Export for debugging
window.keepAliveDebug = {
    start: () => keepAliveManager.startKeepAlive(),
    stop: () => keepAliveManager.stopKeepAlive(),
    test: () => keepAliveManager.testHealth(),
    status: () => keepAliveManager.getStatus()
};

// Expose basic functions globally for backward compatibility
window.startKeepAlive = () => keepAliveManager.startKeepAlive();
window.stopKeepAlive = () => keepAliveManager.stopKeepAlive();

console.log('MINI-ARCADE: Keep-alive pinger loaded');
console.log('MINI-ARCADE: Type "keepAliveDebug" in console for debugging tools');
"use strict";

/**
 * TimerManager - Unified timer management for tracking and cleaning up all timers
 * Prevents memory leaks by ensuring all timers are properly tracked and cleaned up
 */
class TimerManager {
    constructor() {
        this.intervals = new Set();
        this.timeouts = new Set();
        this.isShuttingDown = false;
    }

    /**
     * Register and track a setInterval
     * @param {Function} callback - Function to execute
     * @param {number} delay - Delay in milliseconds
     * @returns {NodeJS.Timeout} The interval ID
     */
    setInterval(callback, delay) {
        if (this.isShuttingDown) {
            console.warn('[TimerManager] Attempted to create interval during shutdown, ignoring');
            return null;
        }

        const intervalId = setInterval(() => {
            if (this.isShuttingDown) {
                clearInterval(intervalId);
                this.intervals.delete(intervalId);
                return;
            }
            callback();
        }, delay);

        this.intervals.add(intervalId);
        return intervalId;
    }

    /**
     * Register and track a setTimeout
     * @param {Function} callback - Function to execute
     * @param {number} delay - Delay in milliseconds
     * @returns {NodeJS.Timeout} The timeout ID
     */
    setTimeout(callback, delay) {
        if (this.isShuttingDown) {
            console.warn('[TimerManager] Attempted to create timeout during shutdown, ignoring');
            return null;
        }

        const timeoutId = setTimeout(() => {
            this.timeouts.delete(timeoutId);
            if (!this.isShuttingDown) {
                callback();
            }
        }, delay);

        this.timeouts.add(timeoutId);
        return timeoutId;
    }

    /**
     * Clear a tracked interval
     * @param {NodeJS.Timeout} intervalId - The interval ID to clear
     */
    clearInterval(intervalId) {
        if (intervalId) {
            clearInterval(intervalId);
            this.intervals.delete(intervalId);
        }
    }

    /**
     * Clear a tracked timeout
     * @param {NodeJS.Timeout} timeoutId - The timeout ID to clear
     */
    clearTimeout(timeoutId) {
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.timeouts.delete(timeoutId);
        }
    }

    /**
     * Clear all tracked intervals and timeouts
     */
    clearAll() {
        console.log(`[TimerManager] Clearing ${this.intervals.size} intervals and ${this.timeouts.size} timeouts`);
        
        for (const intervalId of this.intervals) {
            clearInterval(intervalId);
        }
        this.intervals.clear();

        for (const timeoutId of this.timeouts) {
            clearTimeout(timeoutId);
        }
        this.timeouts.clear();
    }

    /**
     * Mark as shutting down and prevent new timers
     */
    shutdown() {
        this.isShuttingDown = true;
        this.clearAll();
    }

    /**
     * Get statistics about tracked timers
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            intervals: this.intervals.size,
            timeouts: this.timeouts.size,
            isShuttingDown: this.isShuttingDown
        };
    }
}

// Export singleton instance
// Since timer-manager.js doesn't depend on other modules, there's no circular dependency risk
// Other modules can safely require this directly
module.exports = new TimerManager();


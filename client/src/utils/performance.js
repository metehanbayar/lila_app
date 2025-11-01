// Performance utilities for handling browser extension conflicts and optimization

/**
 * Debounce function - delays execution until after wait milliseconds have passed
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @param {boolean} immediate - Execute on leading edge
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * Throttle function - limits execution to once per wait milliseconds
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Safe setTimeout wrapper that handles browser extension conflicts
 * @param {Function} callback - Function to execute
 * @param {number} delay - Delay in milliseconds
 * @returns {number} Timeout ID
 */
export function safeSetTimeout(callback, delay = 0) {
  try {
    return setTimeout(() => {
      try {
        callback();
      } catch (error) {
        console.warn('setTimeout callback error:', error);
      }
    }, delay);
  } catch (error) {
    console.warn('setTimeout error:', error);
    return null;
  }
}

/**
 * Safe setInterval wrapper that handles browser extension conflicts
 * @param {Function} callback - Function to execute
 * @param {number} interval - Interval in milliseconds
 * @returns {number} Interval ID
 */
export function safeSetInterval(callback, interval) {
  try {
    return setInterval(() => {
      try {
        callback();
      } catch (error) {
        console.warn('setInterval callback error:', error);
      }
    }, interval);
  } catch (error) {
    console.warn('setInterval error:', error);
    return null;
  }
}

/**
 * Clear timeout safely
 * @param {number} timeoutId - Timeout ID to clear
 */
export function safeClearTimeout(timeoutId) {
  if (timeoutId) {
    try {
      clearTimeout(timeoutId);
    } catch (error) {
      console.warn('clearTimeout error:', error);
    }
  }
}

/**
 * Clear interval safely
 * @param {number} intervalId - Interval ID to clear
 */
export function safeClearInterval(intervalId) {
  if (intervalId) {
    try {
      clearInterval(intervalId);
    } catch (error) {
      console.warn('clearInterval error:', error);
    }
  }
}

/**
 * Suppress browser extension console messages
 */
export function suppressExtensionMessages() {
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  console.warn = function(...args) {
    const message = args[0];
    // Suppress common extension messages
    if (
      typeof message === 'string' && (
        message.includes('AdUnit') ||
        message.includes('content-script') ||
        message.includes('Violation') ||
        message.includes('setTimeout') ||
        message.includes('setInterval')
      )
    ) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
  
  console.error = function(...args) {
    const message = args[0];
    // Suppress common extension errors
    if (
      typeof message === 'string' && (
        message.includes('AdUnit') ||
        message.includes('content-script') ||
        message.includes('Extension context invalidated')
      )
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  /**
   * Measure function execution time
   * @param {Function} fn - Function to measure
   * @param {string} name - Name for logging
   * @returns {*} Function result
   */
  measure(fn, name = 'Function') {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    // Performance monitoring disabled
    return result;
  },

  /**
   * Measure async function execution time
   * @param {Function} fn - Async function to measure
   * @param {string} name - Name for logging
   * @returns {Promise<*>} Function result
   */
  async measureAsync(fn, name = 'Async Function') {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    // Performance monitoring disabled
    return result;
  }
};

// Initialize suppression on module load
if (typeof window !== 'undefined') {
  suppressExtensionMessages();
}

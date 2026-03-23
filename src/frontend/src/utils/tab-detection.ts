/**
 * Tab detection utility
 */

const TAB_DETECTION_KEY = 'pomodoro-tms-tab-id';
const TAB_CHECK_INTERVAL = 1000; // Check every second

let tabId: string | null = null;
let checkInterval: number | null = null;

/**
 * Initialize tab detection
 */
export function initTabDetection(): void {
  // Generate or load tab ID
  tabId = localStorage.getItem(TAB_DETECTION_KEY);
  
  if (!tabId) {
    tabId = generateTabId();
    localStorage.setItem(TAB_DETECTION_KEY, tabId);
  }
  
  // Start checking for other tabs
  startTabCheck();
  
  // Listen for storage events
  window.addEventListener('storage', handleStorageEvent);
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);
}

/**
 * Generate unique tab ID
 */
function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Start checking for other tabs
 */
function startTabCheck(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  checkInterval = window.setInterval(() => {
    const currentTabId = localStorage.getItem(TAB_DETECTION_KEY);
    
    if (currentTabId && currentTabId !== tabId) {
      // Another tab is active
      showTabWarning();
    }
  }, TAB_CHECK_INTERVAL);
}

/**
 * Stop checking for other tabs
 */
function stopTabCheck(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

/**
 * Handle storage events
 */
function handleStorageEvent(event: StorageEvent): void {
  if (event.key === TAB_DETECTION_KEY && event.newValue) {
    if (event.newValue !== tabId) {
      // Another tab became active
      showTabWarning();
    }
  }
}

/**
 * Show tab warning
 */
function showTabWarning(): void {
  // Check if warning is already shown
  if (document.getElementById('tab-warning')) {
    return;
  }
  
  const warning = document.createElement('div');
  warning.id = 'tab-warning';
  warning.className = 'tab-warning';
  warning.innerHTML = `
    <div class="tab-warning-content">
      <p>⚠️ Приложение открыто в нескольких вкладках</p>
      <p>Пожалуйста, закройте другие вкладки, чтобы избежать проблем с синхронизацией.</p>
      <button onclick="this.parentElement.parentElement.remove()" class="btn btn-primary">Понятно</button>
    </div>
  `;
  
  document.body.appendChild(warning);
}

/**
 * Cleanup
 */
function cleanup(): void {
  stopTabCheck();
  window.removeEventListener('storage', handleStorageEvent);
  window.removeEventListener('beforeunload', cleanup);
  
  // Clear tab ID if this was the last tab
  if (tabId) {
    const currentTabId = localStorage.getItem(TAB_DETECTION_KEY);
    if (currentTabId === tabId) {
      localStorage.removeItem(TAB_DETECTION_KEY);
    }
  }
}

/**
 * Check if this is the only active tab
 */
export function isOnlyTab(): boolean {
  const currentTabId = localStorage.getItem(TAB_DETECTION_KEY);
  return currentTabId === tabId;
}

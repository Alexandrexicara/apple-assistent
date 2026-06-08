const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras ao renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Informações do app
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  generateSessionId: () => ipcRenderer.invoke('generate-session-id'),
  
  // Navegação
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Logging e consentimento
  logClientAction: (data) => ipcRenderer.invoke('log-client-action', data),
  saveConsent: (data) => ipcRenderer.invoke('save-consent', data),
  
  // Diagnóstico
  diagnoseCase: (data) => ipcRenderer.invoke('diagnose-case', data),
  
  // UI
  showDialog: (options) => ipcRenderer.invoke('show-dialog', options),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // Event listeners
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
  
  // Remover listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Expor constantes úteis
contextBridge.exposeInMainWorld('APP_CONSTANTS', {
  APPLE_URLS: {
    IFORGOT: 'https://iforgot.apple.com',
    SUPPORT: 'https://support.apple.com',
    ICLOUD: 'https://www.icloud.com',
    FIND_MY: 'https://www.icloud.com/find'
  },
  PROBLEM_TYPES: {
    FORGOT_PASSWORD: 'forgot-password',
    TWO_FACTOR: 'two-factor',
    ACTIVATION_LOCK: 'activation-lock',
    ACCOUNT_LOCKED: 'account-locked',
    DEVICE_USED: 'device-used'
  },
  SEVERITY_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  }
});

console.log('Preload script carregado com sucesso');

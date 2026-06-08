const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const { v4: uuidv4 } = require('uuid');

// Configurações de logging
const log = require('electron-log');
log.transports.file.level = 'info';

// Janela principal
let mainWindow;

// Configurações da aplicação
const APP_CONFIG = {
  name: 'Apple ID Assistant',
  version: app.getVersion(),
  environment: process.env.NODE_ENV || 'production',
  apiUrl: process.env.API_URL || 'https://api.bayreset.com',
  socketUrl: process.env.SOCKET_URL || 'wss://api.bayreset.com'
};

// Criar janela principal
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: APP_CONFIG.name,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    },
    show: false,
    titleBarStyle: 'default'
  });

  // Carregar interface
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Mostrar janela quando pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Abrir DevTools em desenvolvimento
    if (APP_CONFIG.environment === 'development') {
      mainWindow.webContents.openDevTools();
    }
  });

  // Lidar com fechamento
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Bloquear navegação externa não autorizada
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowedHosts = [
      'iforgot.apple.com',
      'apple.com',
      'icloud.com',
      'support.apple.com'
    ];
    
    const urlObj = new URL(url);
    const isAllowed = allowedHosts.some(host => 
      urlObj.hostname === host || urlObj.hostname.endsWith('.' + host)
    );
    
    if (!isAllowed && !url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

// Inicialização do app
app.whenReady().then(() => {
  createMainWindow();
  
  // Verificar atualizações
  if (APP_CONFIG.environment === 'production') {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Sair quando todas as janelas forem fechadas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ==================== IPC Handlers ====================

// Gerar ID único da sessão
ipcMain.handle('generate-session-id', () => {
  return uuidv4();
});

// Obter informações do app
ipcMain.handle('get-app-info', () => {
  return {
    name: APP_CONFIG.name,
    version: APP_CONFIG.version,
    environment: APP_CONFIG.environment
  };
});

// Abrir link externo
ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    log.error('Erro ao abrir link externo:', error);
    return { success: false, error: error.message };
  }
});

// Registrar log do cliente
ipcMain.handle('log-client-action', (event, data) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    sessionId: data.sessionId,
    action: data.action,
    details: data.details,
    ip: 'local'
  };
  
  log.info('Client Action:', logEntry);
  return { success: true };
});

// Salvar consentimento do usuário
ipcMain.handle('save-consent', (event, data) => {
  const consentData = {
    sessionId: data.sessionId,
    email: data.email,
    consentGiven: data.consentGiven,
    timestamp: new Date().toISOString(),
    ip: 'local',
    userAgent: data.userAgent
  };
  
  log.info('User Consent:', consentData);
  return { success: true, consentId: uuidv4() };
});

// Diagnóstico do caso
ipcMain.handle('diagnose-case', (event, data) => {
  const { problemType, hasDeviceInfo, hasProofOfPurchase } = data;
  
  let diagnosis = {
    type: problemType,
    severity: 'unknown',
    recoverable: false,
    requiresAppleSupport: false,
    estimatedTime: 'unknown',
    steps: []
  };
  
  switch (problemType) {
    case 'forgot-password':
      diagnosis.severity = 'low';
      diagnosis.recoverable = true;
      diagnosis.requiresAppleSupport = false;
      diagnosis.estimatedTime = '15-30 minutos';
      diagnosis.steps = [
        'Acessar iforgot.apple.com',
        'Verificar identidade',
        'Redefinir senha'
      ];
      break;
      
    case 'two-factor':
      diagnosis.severity = 'medium';
      diagnosis.recoverable = true;
      diagnosis.requiresAppleSupport = true;
      diagnosis.estimatedTime = '1-3 dias';
      diagnosis.steps = [
        'Verificar dispositivos confiáveis',
        'Contatar suporte Apple',
        'Aguardar verificação'
      ];
      break;
      
    case 'activation-lock':
      diagnosis.severity = 'high';
      diagnosis.recoverable = hasProofOfPurchase;
      diagnosis.requiresAppleSupport = true;
      diagnosis.estimatedTime = hasProofOfPurchase ? '3-7 dias' : 'Não recuperável';
      diagnosis.steps = hasProofOfPurchase ? [
        'Preparar comprovante de compra',
        'Solicitar remoção do bloqueio',
        'Aguardar análise Apple'
      ] : [
        'Verificar comprovante de compra',
        'Entrar em contato com vendedor',
        'Considerar alternativas'
      ];
      break;
      
    case 'account-locked':
      diagnosis.severity = 'medium';
      diagnosis.recoverable = true;
      diagnosis.requiresAppleSupport = true;
      diagnosis.estimatedTime = '24-48 horas';
      diagnosis.steps = [
        'Verificar motivo do bloqueio',
        'Seguir instruções de recuperação',
        'Aguardar liberação'
      ];
      break;
  }
  
  return diagnosis;
});

// Mostrar caixa de diálogo
ipcMain.handle('show-dialog', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: options.type || 'info',
    title: options.title || APP_CONFIG.name,
    message: options.message,
    detail: options.detail || '',
    buttons: options.buttons || ['OK'],
    defaultId: options.defaultId || 0,
    cancelId: options.cancelId || 0
  });
  
  return result;
});

// Obter caminho de armazenamento local
ipcMain.handle('get-app-path', () => {
  return {
    userData: app.getPath('userData'),
    logs: app.getPath('logs'),
    temp: app.getPath('temp')
  };
});

// ==================== Auto Updater Events ====================

autoUpdater.on('checking-for-update', () => {
  log.info('Verificando atualizações...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Atualização disponível:', info);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Nenhuma atualização disponível');
});

autoUpdater.on('error', (err) => {
  log.error('Erro no auto-updater:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let logMessage = `Download: ${progressObj.percent}%`;
  log.info(logMessage);
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Atualização baixada');
  autoUpdater.quitAndInstall();
});

// ==================== Segurança ====================

// Prevenir novas janelas
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Lidar com permissões
session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
  const allowedPermissions = ['clipboard-read', 'clipboard-write'];
  
  if (allowedPermissions.includes(permission)) {
    callback(true);
  } else {
    log.warn(`Permissão negada: ${permission}`);
    callback(false);
  }
});

// Headers de segurança
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;"
      ],
      'X-Content-Type-Options': ['nosniff'],
      'X-Frame-Options': ['DENY'],
      'Referrer-Policy': ['strict-origin-when-cross-origin']
    }
  });
});

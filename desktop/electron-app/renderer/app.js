/**
 * Apple ID Assistant - Main Application Logic
 * 
 * Este arquivo contém toda a lógica do frontend da aplicação Electron
 * gerenciando fluxos de navegação, diagnóstico e recuperação.
 */

// ==================== Estado da Aplicação ====================
const AppState = {
    sessionId: null,
    email: '',
    problemType: null,
    consentGiven: false,
    diagnosis: null,
    history: [],
    currentStep: 'welcome'
};

// ==================== Inicialização ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Apple ID Assistant - Inicializando...');
    
    // Gerar ID de sessão
    if (window.electronAPI) {
        AppState.sessionId = await window.electronAPI.generateSessionId();
    } else {
        AppState.sessionId = generateLocalSessionId();
    }
    
    // Carregar informações do app
    await loadAppInfo();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Atualizar histórico
    addToHistory('Sistema iniciado');
    
    console.log('Sessão:', AppState.sessionId);
});

// ==================== Funções Auxiliares ====================

function generateLocalSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function loadAppInfo() {
    const versionElement = document.getElementById('version');
    if (window.electronAPI && versionElement) {
        try {
            const info = await window.electronAPI.getAppInfo();
            versionElement.textContent = `v${info.version}`;
        } catch (error) {
            versionElement.textContent = 'v1.0.0';
        }
    }
}

function addToHistory(action) {
    const timestamp = new Date().toLocaleString('pt-BR');
    AppState.history.push({ timestamp, action });
    
    // Atualizar UI se o painel estiver visível
    const historyList = document.getElementById('history-list');
    const historyStart = document.getElementById('history-start');
    
    if (historyStart) {
        historyStart.textContent = timestamp;
    }
}

// ==================== Navegação ====================

function navigateTo(step) {
    // Esconder todos os steps
    document.querySelectorAll('.step').forEach(el => {
        el.classList.remove('active');
    });
    
    // Mostrar step atual
    const targetStep = document.getElementById(`step-${step}`);
    if (targetStep) {
        targetStep.classList.add('active');
        AppState.currentStep = step;
    }
    
    // Registrar navegação
    addToHistory(`Navegou para: ${step}`);
    
    // Log para analytics
    logAction('navigation', { step });
}

// ==================== Event Listeners ====================

function setupEventListeners() {
    // Step 1: Welcome - Seleção de problema
    document.querySelectorAll('.problem-card').forEach(card => {
        card.addEventListener('click', () => {
            // Remover seleção anterior
            document.querySelectorAll('.problem-card').forEach(c => {
                c.classList.remove('selected');
            });
            
            // Selecionar atual
            card.classList.add('selected');
            AppState.problemType = card.dataset.type;
            
            // Habilitar botão continuar
            document.getElementById('btn-continue').disabled = false;
        });
    });
    
    // Step 1: Continue button
    document.getElementById('btn-continue').addEventListener('click', () => {
        const emailInput = document.getElementById('apple-id-email');
        AppState.email = emailInput.value.trim();
        
        if (!AppState.problemType) {
            showAlert('Por favor, selecione um tipo de problema', 'warning');
            return;
        }
        
        navigateTo('consent');
    });
    
    // Step 2: Consent checkboxes
    const consentCheckboxes = [
        document.getElementById('consent-owner'),
        document.getElementById('consent-legal'),
        document.getElementById('consent-terms')
    ];
    
    consentCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateConsentButton);
    });
    
    // Step 2: Back button
    document.getElementById('btn-back-welcome').addEventListener('click', () => {
        navigateTo('welcome');
    });
    
    // Step 2: Confirm consent
    document.getElementById('btn-confirm-consent').addEventListener('click', async () => {
        const consentData = {
            sessionId: AppState.sessionId,
            email: AppState.email,
            consentGiven: true,
            userAgent: navigator.userAgent
        };
        
        // Salvar consentimento
        if (window.electronAPI) {
            await window.electronAPI.saveConsent(consentData);
        }
        
        AppState.consentGiven = true;
        addToHistory('Consentimento confirmado');
        
        // Ir para diagnóstico
        navigateTo('diagnosis');
        
        // Iniciar diagnóstico
        performDiagnosis();
    });
    
    // Step 3: Back button
    document.getElementById('btn-back-consent').addEventListener('click', () => {
        navigateTo('consent');
    });
    
    // Step 3: Start recovery
    document.getElementById('btn-start-recovery').addEventListener('click', () => {
        navigateTo('recovery');
        loadRecoveryContent();
    });
    
    // Step 4: Back button
    document.getElementById('btn-back-diagnosis').addEventListener('click', () => {
        navigateTo('diagnosis');
    });
    
    // Step 4: View dashboard
    document.getElementById('btn-view-dashboard').addEventListener('click', () => {
        navigateTo('dashboard');
    });
    
    // Step 5: New request
    document.getElementById('btn-new-request').addEventListener('click', () => {
        resetAppState();
        navigateTo('welcome');
    });
    
    // Step 5: Contact support
    document.getElementById('btn-contact-support').addEventListener('click', () => {
        showAlert('Sistema de tickets em desenvolvimento', 'info');
    });
    
    // Links úteis
    document.querySelectorAll('.link-list a').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const url = link.dataset.url;
            if (url && window.electronAPI) {
                await window.electronAPI.openExternal(url);
            } else if (url) {
                window.open(url, '_blank');
            }
        });
    });
    
    // Footer links
    document.getElementById('link-terms').addEventListener('click', (e) => {
        e.preventDefault();
        showAlert('Termos de uso: Este sistema é um assistente de suporte guiado. Não realizamos bypass ou desbloqueio ilegal.', 'info');
    });
    
    document.getElementById('link-privacy').addEventListener('click', (e) => {
        e.preventDefault();
        showAlert('Privacidade: Seus dados são criptografados e armazenados de forma segura.', 'info');
    });
    
    document.getElementById('link-support').addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('dashboard');
    });
}

function updateConsentButton() {
    const allChecked = 
        document.getElementById('consent-owner').checked &&
        document.getElementById('consent-legal').checked &&
        document.getElementById('consent-terms').checked;
    
    document.getElementById('btn-confirm-consent').disabled = !allChecked;
}

// ==================== Diagnóstico ====================

async function performDiagnosis() {
    const loadingEl = document.getElementById('diagnosis-loading');
    const resultEl = document.getElementById('diagnosis-result');
    
    // Mostrar loading
    loadingEl.classList.remove('hidden');
    resultEl.classList.add('hidden');
    
    // Simular análise
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Realizar diagnóstico
    let diagnosis;
    if (window.electronAPI) {
        diagnosis = await window.electronAPI.diagnoseCase({
            problemType: AppState.problemType,
            hasDeviceInfo: false,
            hasProofOfPurchase: false
        });
    } else {
        diagnosis = getLocalDiagnosis(AppState.problemType);
    }
    
    AppState.diagnosis = diagnosis;
    
    // Atualizar UI
    updateDiagnosisUI(diagnosis);
    
    // Esconder loading, mostrar resultado
    loadingEl.classList.add('hidden');
    resultEl.classList.remove('hidden');
    
    // Registrar
    addToHistory(`Diagnóstico concluído: ${diagnosis.type}`);
    logAction('diagnosis_completed', diagnosis);
}

function getLocalDiagnosis(problemType) {
    const diagnoses = {
        'forgot-password': {
            type: 'Senha Esquecida',
            severity: 'low',
            recoverable: true,
            requiresAppleSupport: false,
            estimatedTime: '15-30 minutos',
            steps: [
                'Acessar iforgot.apple.com',
                'Verificar identidade via e-mail ou telefone',
                'Redefinir senha com nova senha segura',
                'Atualizar senha em todos os dispositivos'
            ]
        },
        'two-factor': {
            type: 'Verificação em 2 Etapas',
            severity: 'medium',
            recoverable: true,
            requiresAppleSupport: true,
            estimatedTime: '1-3 dias',
            steps: [
                'Verificar dispositivos confiáveis cadastrados',
                'Tentar recuperação via número de telefone',
                'Contatar suporte Apple se necessário',
                'Aguardar verificação de identidade'
            ]
        },
        'activation-lock': {
            type: 'Bloqueio de Ativação (iCloud)',
            severity: 'high',
            recoverable: false,
            requiresAppleSupport: true,
            estimatedTime: 'Não recuperável sem comprovante',
            steps: [
                'Verificar se possui comprovante de compra original',
                'Se tiver comprovante: solicitar remoção via Apple',
                'Se não tiver: entrar em contato com vendedor anterior',
                'Considerar alternativas legais'
            ]
        },
        'account-locked': {
            type: 'Conta Inacessível',
            severity: 'medium',
            recoverable: true,
            requiresAppleSupport: true,
            estimatedTime: '24-48 horas',
            steps: [
                'Verificar motivo do bloqueio (e-mail da Apple)',
                'Seguir instruções de recuperação enviadas',
                'Verificar identidade conforme solicitado',
                'Aguardar liberação da conta'
            ]
        }
    };
    
    return diagnoses[problemType] || diagnoses['forgot-password'];
}

function updateDiagnosisUI(diagnosis) {
    // Badge de severidade
    const severityBadge = document.getElementById('severity-badge');
    severityBadge.className = `severity-badge ${diagnosis.severity}`;
    
    const severityText = {
        'low': 'Baixa Severidade',
        'medium': 'Média Severidade',
        'high': 'Alta Severidade'
    };
    severityBadge.querySelector('.level').textContent = severityText[diagnosis.severity];
    
    // Detalhes
    document.getElementById('diagnosis-type').textContent = diagnosis.type;
    document.getElementById('recoverable-status').textContent = diagnosis.recoverable ? 'Sim ✓' : 'Não ✗';
    document.getElementById('recoverable-status').style.color = diagnosis.recoverable ? 'var(--secondary-color)' : 'var(--danger-color)';
    document.getElementById('apple-support-status').textContent = diagnosis.requiresAppleSupport ? 'Sim' : 'Não';
    document.getElementById('estimated-time').textContent = diagnosis.estimatedTime;
    
    // Passos
    const stepsList = document.getElementById('recovery-steps');
    stepsList.innerHTML = '';
    diagnosis.steps.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        stepsList.appendChild(li);
    });
}

// ==================== Recuperação ====================

function loadRecoveryContent() {
    const container = document.getElementById('recovery-content');
    const content = getRecoveryContent(AppState.problemType);
    container.innerHTML = content;
    
    // Adicionar event listeners aos botões de link
    container.querySelectorAll('[data-external-link]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const url = btn.dataset.externalLink;
            if (window.electronAPI) {
                await window.electronAPI.openExternal(url);
            } else {
                window.open(url, '_blank');
            }
        });
    });
}

function getRecoveryContent(problemType) {
    const contents = {
        'forgot-password': `
            <div class="recovery-section">
                <h3>🔑 Recuperação de Senha</h3>
                <p>O processo de recuperação de senha é feito diretamente pelo site oficial da Apple.</p>
                
                <h4>Passo a Passo:</h4>
                <ol>
                    <li>Clique no botão abaixo para acessar o site oficial da Apple</li>
                    <li>Digite seu Apple ID (e-mail)</li>
                    <li>Escolha como deseja redefinir: e-mail ou número de telefone</li>
                    <li>Siga as instruções enviadas</li>
                    <li>Crie uma nova senha forte (mínimo 8 caracteres, letras, números e símbolos)</li>
                </ol>
                
                <div class="actions" style="margin-top: 1.5rem;">
                    <button class="btn-primary" data-external-link="https://iforgot.apple.com">
                        Abrir iforgot.apple.com
                    </button>
                </div>
            </div>
            
            <div class="recovery-section">
                <h4>💡 Dicas de Segurança:</h4>
                <ul>
                    <li>Nunca compartilhe sua senha com ninguém</li>
                    <li>Use senhas únicas para cada serviço</li>
                    <li>Ative a verificação em duas etapas quando recuperar o acesso</li>
                    <li>Guarde suas perguntas de segurança em local seguro</li>
                </ul>
            </div>
        `,
        
        'two-factor': `
            <div class="recovery-section">
                <h3>🔐 Verificação em 2 Etapas</h3>
                <p>A verificação em duas etapas adiciona uma camada extra de segurança. Se você perdeu acesso ao método de verificação, siga os passos abaixo.</p>
                
                <h4>Opções de Recuperação:</h4>
                <ol>
                    <li><strong>Dispositivos Confiáveis:</strong> Verifique se algum dispositivo ainda está logado</li>
                    <li><strong>Número de Recuperação:</strong> Use o número de telefone de recuperação cadastrado</li>
                    <li><strong>Chave de Recuperação:</strong> Se tiver salvo a chave de 28 caracteres</li>
                    <li><strong>Suporte Apple:</strong> Última opção, requer verificação de identidade</li>
                </ol>
            </div>
            
            <div class="recovery-section">
                <div class="actions" style="margin-top: 1.5rem;">
                    <button class="btn-primary" data-external-link="https://iforgot.apple.com">
                        Iniciar Recuperação
                    </button>
                    <button class="btn-secondary" data-external-link="https://support.apple.com/pt-br/HT204152">
                        Ver Guia Oficial Apple
                    </button>
                </div>
            </div>
            
            <div class="recovery-section">
                <div class="info-box">
                    <strong>⚠️ Importante:</strong>
                    <p>O suporte Apple pode levar 24-72 horas para verificar sua identidade. Tenha documentos pessoais em mãos.</p>
                </div>
            </div>
        `,
        
        'activation-lock': `
            <div class="recovery-section">
                <h3>📱 Bloqueio de Ativação (Activation Lock)</h3>
                <p class="warning-text">O Bloqueio de Ativação é um recurso de segurança da Apple que impede o uso de dispositivos perdidos ou roubados. <strong>Não existe bypass legítimo.</strong></p>
                
                <div class="severity-badge high" style="margin: 1rem 0;">
                    <span class="level">ALTA SEVERIDADE</span>
                </div>
            </div>
            
            <div class="recovery-section">
                <h4>✅ Opção 1: Você tem o comprovante de compra?</h4>
                <p>Se você é o proprietário legítimo e tem a nota fiscal:</p>
                <ol>
                    <li>Prepare o comprovante de compra original (PDF ou foto nítida)</li>
                    <li>Acesse o suporte Apple e abra um chamado</li>
                    <li>Forneça o IMEI do dispositivo (nas configurações ou caixa)</li>
                    <li>Aguarde 3-7 dias úteis para análise</li>
                </ol>
                <div class="actions" style="margin-top: 1rem;">
                    <button class="btn-primary" data-external-link="https://support.apple.com">
                        Contatar Suporte Apple
                    </button>
                </div>
            </div>
            
            <div class="recovery-section">
                <h4>⚠️ Opção 2: Comprou usado sem comprovante?</h4>
                <p>Infelizmente, sem comprovante de compra original, a Apple não removerá o bloqueio. Opções:</p>
                <ul>
                    <li>Entrar em contato com o vendedor anterior</li>
                    <li>Verificar se o dispositivo foi reportado como roubado (fazer BO se necessário)</li>
                    <li>Consultar um advogado sobre direitos do consumidor</li>
                </ul>
                <div class="info-box" style="background: var(--danger-bg); border-color: var(--danger-color);">
                    <strong style="color: var(--danger-color);">🚫 Não caia em golpes!</strong>
                    <p>Serviços que prometem "desbloqueio iCloud" são fraudulentos. Não existe método legítimo de bypass.</p>
                </div>
            </div>
        `,
        
        'account-locked': `
            <div class="recovery-section">
                <h3>🔒 Conta Inacessível</h3>
                <p>Contas Apple podem ser bloqueadas por segurança (tentativas de senha incorretas) ou por violação dos termos de uso.</p>
                
                <h4>Identifique o Motivo:</h4>
                <ol>
                    <li>Verifique seus e-mails (incluindo lixo eletrônico) da Apple</li>
                    <li>Leia a mensagem de erro ao tentar logar</li>
                    <li>Verifique se recebeu alertas de segurança recentemente</li>
                </ol>
            </div>
            
            <div class="recovery-section">
                <h4>Ações Recomendadas:</h4>
                <ul>
                    <li><strong>Bloqueio de segurança:</strong> Aguarde 24 horas e tente novamente</li>
                    <li><strong>Suspeita de invasão:</strong> Redefina senha imediatamente via iforgot.apple.com</li>
                    <li><strong>Violação de termos:</strong> Contate o suporte Apple para entender o motivo</li>
                </ul>
                
                <div class="actions" style="margin-top: 1.5rem;">
                    <button class="btn-primary" data-external-link="https://iforgot.apple.com">
                        Tentar Recuperar Acesso
                    </button>
                    <button class="btn-secondary" data-external-link="https://support.apple.com">
                        Falar com Suporte
                    </button>
                </div>
            </div>
        `
    };
    
    return contents[problemType] || contents['forgot-password'];
}

// ==================== Utilitários ====================

function resetAppState() {
    AppState.email = '';
    AppState.problemType = null;
    AppState.consentGiven = false;
    AppState.diagnosis = null;
    AppState.history = [];
    
    // Resetar UI
    document.getElementById('apple-id-email').value = '';
    document.querySelectorAll('.problem-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('btn-continue').disabled = true;
    
    // Resetar checkboxes
    document.getElementById('consent-owner').checked = false;
    document.getElementById('consent-legal').checked = false;
    document.getElementById('consent-terms').checked = false;
    document.getElementById('btn-confirm-consent').disabled = true;
}

async function logAction(action, details = {}) {
    const logData = {
        sessionId: AppState.sessionId,
        action,
        details,
        timestamp: new Date().toISOString()
    };
    
    if (window.electronAPI) {
        await window.electronAPI.logClientAction(logData);
    }
    
    console.log('Action logged:', logData);
}

function showAlert(message, type = 'info') {
    // Implementação simples de alerta
    // Em produção, usar um componente de toast/modal mais elegante
    
    if (window.electronAPI) {
        window.electronAPI.showDialog({
            type: type === 'warning' ? 'warning' : 'info',
            title: 'Apple ID Assistant',
            message: message,
            buttons: ['OK']
        });
    } else {
        alert(message);
    }
}

// ==================== Exportar para Debug ====================
window.AppState = AppState;
window.navigateTo = navigateTo;
console.log('Apple ID Assistant - Sistema carregado');

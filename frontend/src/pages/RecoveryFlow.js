import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle,
  Lock,
  Key,
  Smartphone,
  Mail,
  Shield
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const RecoveryFlow = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    problemType: '',
    consentGiven: false,
    consentLegal: false,
    consentTerms: false
  });
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    // Criar sessão ao carregar
    createSession();
  }, []);

  const createSession = async () => {
    try {
      const response = await api.post('/sessions', {});
      setSessionId(response.data.session.id);
    } catch (error) {
      toast.error('Erro ao iniciar sessão');
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.problemType) {
      toast.error('Selecione um tipo de problema');
      return;
    }
    
    if (currentStep === 2) {
      if (!formData.consentGiven || !formData.consentLegal || !formData.consentTerms) {
        toast.error('Aceite todos os termos para continuar');
        return;
      }
      submitConsent();
    }
    
    if (currentStep === 3) {
      performDiagnosis();
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitConsent = async () => {
    if (!sessionId) return;
    
    try {
      await api.post(`/sessions/${sessionId}/consent`, {
        email: formData.email,
        consentGiven: true,
        userAgent: navigator.userAgent
      });
      toast.success('Consentimento registrado');
    } catch (error) {
      toast.error('Erro ao registrar consentimento');
    }
  };

  const performDiagnosis = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const response = await api.post('/diagnosis', {
        sessionId,
        problemType: formData.problemType,
        hasProofOfPurchase: false,
        hasDeviceAccess: false
      });
      
      setDiagnosis(response.data.diagnosis);
    } catch (error) {
      toast.error('Erro ao realizar diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  const getProblemIcon = (type) => {
    switch (type) {
      case 'forgot-password': return <Key className="w-6 h-6" />;
      case 'two-factor': return <Shield className="w-6 h-6" />;
      case 'activation-lock': return <Lock className="w-6 h-6" />;
      case 'account-locked': return <Smartphone className="w-6 h-6" />;
      default: return <Mail className="w-6 h-6" />;
    }
  };

  const getProblemLabel = (type) => {
    const labels = {
      'forgot-password': 'Esqueci a Senha',
      'two-factor': 'Verificação em 2 Etapas',
      'activation-lock': 'Bloqueio de Ativação',
      'account-locked': 'Conta Inacessível',
      'device-used': 'Dispositivo Usado'
    };
    return labels[type] || type;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getSeverityLabel = (severity) => {
    const labels = {
      'low': 'Baixa Severidade',
      'medium': 'Média Severidade',
      'high': 'Alta Severidade'
    };
    return labels[severity] || severity;
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold
                ${currentStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-400 border border-gray-700'}
              `}>
                {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {step < 4 && (
                <div className={`w-16 h-1 mx-2 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-800'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Problema</span>
          <span>Consentimento</span>
          <span>Diagnóstico</span>
          <span>Recuperação</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        {/* Step 1: Problem Selection */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Qual é o seu problema?</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">E-mail do Apple ID (opcional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'forgot-password', icon: <Key />, label: 'Esqueci a Senha' },
                { id: 'two-factor', icon: <Shield />, label: 'Verificação em 2 Etapas' },
                { id: 'activation-lock', icon: <Lock />, label: 'Bloqueio de Ativação' },
                { id: 'account-locked', icon: <Smartphone />, label: 'Conta Inacessível' },
              ].map((problem) => (
                <button
                  key={problem.id}
                  onClick={() => setFormData({...formData, problemType: problem.id})}
                  className={`
                    p-6 rounded-xl border-2 text-left transition-all
                    ${formData.problemType === problem.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800'}
                  `}
                >
                  <div className="text-blue-400 mb-3">{problem.icon}</div>
                  <div className="font-semibold">{problem.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Consent */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Confirmação de Propriedade</h2>
            
            <div className="bg-amber-900/20 border border-amber-700 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200">
                  Antes de prosseguir, você deve confirmar que é o proprietário legítimo 
                  deste dispositivo/conta. Seu IP e data/hora serão registrados.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-750">
                <input
                  type="checkbox"
                  checked={formData.consentGiven}
                  onChange={(e) => setFormData({...formData, consentGiven: e.target.checked})}
                  className="mt-1 w-5 h-5 rounded border-gray-600"
                />
                <span className="text-sm">
                  Confirmo que sou o proprietário legítimo deste dispositivo/conta Apple ID
                </span>
              </label>

              <label className="flex items-start gap-3 p-4 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-750">
                <input
                  type="checkbox"
                  checked={formData.consentLegal}
                  onChange={(e) => setFormData({...formData, consentLegal: e.target.checked})}
                  className="mt-1 w-5 h-5 rounded border-gray-600"
                />
                <span className="text-sm">
                  Declaro que não estou tentando acessar dispositivo de terceiros sem autorização
                </span>
              </label>

              <label className="flex items-start gap-3 p-4 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-750">
                <input
                  type="checkbox"
                  checked={formData.consentTerms}
                  onChange={(e) => setFormData({...formData, consentTerms: e.target.checked})}
                  className="mt-1 w-5 h-5 rounded border-gray-600"
                />
                <span className="text-sm">
                  Aceito os termos de uso e política de privacidade
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Diagnosis */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Análise do Caso</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-400">Analisando seu caso...</p>
              </div>
            ) : diagnosis ? (
              <div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 ${getSeverityColor(diagnosis.severity)}`}>
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold text-sm">{getSeverityLabel(diagnosis.severity)}</span>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold mb-4 text-lg">Diagnóstico: {diagnosis.type}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <div className="text-gray-400 text-sm mb-1">Recuperável</div>
                      <div className={`font-semibold ${diagnosis.recoverable ? 'text-green-400' : 'text-red-400'}`}>
                        {diagnosis.recoverable ? 'Sim' : 'Não'}
                      </div>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <div className="text-gray-400 text-sm mb-1">Suporte Apple</div>
                      <div className="font-semibold">
                        {diagnosis.requires_apple_support ? 'Necessário' : 'Não necessário'}
                      </div>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <div className="text-gray-400 text-sm mb-1">Tempo Estimado</div>
                      <div className="font-semibold">{diagnosis.estimated_time}</div>
                    </div>
                  </div>

                  <h4 className="font-semibold mb-3">Passos Recomendados:</h4>
                  <ol className="space-y-2">
                    {diagnosis.steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </span>
                        <span className="text-gray-300">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {diagnosis.notes && (
                  <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4">
                    <p className="text-sm text-blue-200">{diagnosis.notes}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Step 4: Recovery Guide */}
        {currentStep === 4 && diagnosis && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Guia de Recuperação</h2>
            
            <RecoveryGuide problemType={formData.problemType} diagnosis={diagnosis} />
            
            <div className="mt-8 p-6 bg-gray-800 rounded-xl">
              <h3 className="font-semibold mb-4">Acompanhar Progresso</h3>
              <p className="text-gray-400 mb-4">
                Acesse seu painel para acompanhar o status da recuperação e receber atualizações.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all"
              >
                Ir para o Painel
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          
          {currentStep < 4 && (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all"
            >
              {currentStep === 3 ? 'Ver Guia' : 'Continuar'}
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const RecoveryGuide = ({ problemType, diagnosis }) => {
  const openExternal = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (problemType === 'forgot-password') {
    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-400" />
            Recuperação de Senha
          </h3>
          
          <p className="text-gray-400 mb-4">
            O processo de recuperação de senha é feito diretamente pelo site oficial da Apple.
          </p>

          <ol className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <span className="text-gray-300">Acesse iforgot.apple.com clicando no botão abaixo</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <span className="text-gray-300">Digite seu Apple ID (e-mail)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <span className="text-gray-300">Escolha entre receber código por e-mail ou SMS</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
              <span className="text-gray-300">Crie uma nova senha forte (mínimo 8 caracteres)</span>
            </li>
          </ol>

          <button
            onClick={() => openExternal('https://iforgot.apple.com')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all"
          >
            Abrir iforgot.apple.com
          </button>
        </div>

        <div className="bg-green-900/20 border border-green-700 rounded-xl p-4">
          <h4 className="font-semibold text-green-400 mb-2">💡 Dicas de Segurança</h4>
          <ul className="text-sm text-green-200 space-y-1">
            <li>• Nunca compartilhe sua senha com ninguém</li>
            <li>• Use um gerenciador de senhas</li>
            <li>• Ative verificação em duas etapas após recuperar</li>
            <li>• Use senhas únicas para cada serviço</li>
          </ul>
        </div>
      </div>
    );
  }

  if (problemType === 'activation-lock') {
    return (
      <div className="space-y-6">
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-400 mb-1">Aviso Importante</h4>
              <p className="text-sm text-red-200">
                Não existe bypass legítimo para o Bloqueio de Ativação. Sem comprovante de compra, 
                o dispositivo permanece bloqueado permanentemente.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Opções de Recuperação</h3>

          <div className="space-y-4">
            <div className="p-4 bg-gray-900 rounded-lg">
              <h4 className="font-semibold mb-2 text-green-400">✅ Opção 1: Tem comprovante de compra?</h4>
              <p className="text-gray-400 text-sm mb-3">
                Se você tem a nota fiscal original, a Apple pode remover o bloqueio após verificação.
              </p>
              <ol className="text-sm text-gray-400 space-y-1 mb-4">
                <li>1. Prepare: nota fiscal, IMEI, número de série</li>
                <li>2. Acesse o suporte Apple online ou presencial</li>
                <li>3. Abra um chamado de remoção de Activation Lock</li>
                <li>4. Aguarde 3-7 dias úteis para análise</li>
              </ol>
              <button
                onClick={() => openExternal('https://support.apple.com')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-all"
              >
                Contatar Suporte Apple
              </button>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg">
              <h4 className="font-semibold mb-2 text-yellow-400">⚠️ Opção 2: Comprou usado sem comprovante?</h4>
              <p className="text-gray-400 text-sm mb-3">
                Infelizmente, sem comprovante a Apple não remove o bloqueio.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Entre em contato IMEDIATAMENTE com o vendedor</li>
                <li>• Peça para ele remover o dispositivo do iCloud</li>
                <li>• Verifique se o IMEI está em listas de roubo</li>
                <li>• Considere ações legais se for golpe</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-amber-900/20 border border-amber-700 rounded-xl p-4">
          <h4 className="font-semibold text-amber-400 mb-2">🚫 Não caia em golpes!</h4>
          <p className="text-sm text-amber-200">
            Serviços que prometem "desbloqueio iCloud" via software, DNS ou hardware são 
            fraudulentos. Não existe método legítimo de bypass fora da Apple.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <p className="text-gray-400">
        Guia específico para {diagnosis.type} será exibido aqui baseado no diagnóstico.
      </p>
    </div>
  );
};

export default RecoveryFlow;

import React, { useState } from 'react';
import { Smartphone, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, Shield, Key, Monitor, FileText } from 'lucide-react';
import { technicianApi, devicesApi } from '../services/api';
import toast from 'react-hot-toast';

const IPHONE_MODELS = [
  'iPhone XR', 'iPhone XS', 'iPhone XS Max',
  'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
  'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max', 'iPhone 12 Mini',
  'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 13 Mini',
  'iPhone 14', 'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 14 Plus',
  'iPhone 15', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 15 Plus',
  'iPhone SE (2020)', 'iPhone SE (2022)'
];

const ResetWithPassword = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deviceCheck, setDeviceCheck] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [guide, setGuide] = useState(null);
  const [formData, setFormData] = useState({
    imei: '',
    serialNumber: '',
    model: '',
    hasPassword: true,
    findMyStatus: 'on',
    conditionStatus: 'good',
    notes: ''
  });
  const [completedSteps, setCompletedSteps] = useState([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmHello, setConfirmHello] = useState(false);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.imei || formData.imei.replace(/\s/g, '').length < 14) {
        toast.error('Digite um IMEI válido (15 dígitos)');
        return;
      }
      if (!formData.model) {
        toast.error('Selecione o modelo do dispositivo');
        return;
      }
      verifyDevice();
    }

    if (currentStep === 3) {
      loadResetGuide();
    }

    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const verifyDevice = async () => {
    setLoading(true);
    try {
      const response = await technicianApi.resetFlow({
        imei: formData.imei,
        hasPassword: formData.hasPassword,
        findMyStatus: formData.findMyStatus
      });

      setDeviceCheck(response.data.device);
      setEligibility(response.data.eligibility);

      if (response.data.device.valid) {
        toast.success('Dispositivo verificado com sucesso');
      } else {
        toast.error('IMEI inválido — verifique os dígitos');
      }
    } catch (error) {
      // Fallback para funcionar offline
      const imeiClean = formData.imei.replace(/\s/g, '');
      const valid = imeiClean.length === 15 && /^\d+$/.test(imeiClean);

      setDeviceCheck({
        valid,
        imei: imeiClean,
        checksum_valid: valid,
        format_valid: valid
      });

      setEligibility({
        eligible: formData.hasPassword,
        method: 'reset-with-password',
        estimated_time: '5-10 minutos',
        requires_password: true,
        steps: [
          'Acessar Ajustes > [nome] > Sair (Sign Out)',
          'Digitar a senha do iCloud',
          'Desativar Buscar iPhone',
          'Apagar Conteúdo e Ajustes',
          'Aguardar reinicialização'
        ],
        warnings: []
      });

      if (valid) {
        toast.success('Dispositivo verificado (modo offline)');
      } else {
        toast.error('IMEI inválido');
        setCurrentStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadResetGuide = async () => {
    try {
      const response = await technicianApi.resetGuide('reset-with-password');
      setGuide(response.data.guide);
    } catch (error) {
      setGuide({
        title: 'Reset Profissional com Senha iCloud',
        estimatedTime: '5-10 minutos',
        steps: [
          { order: 1, title: 'Acessar Ajustes', description: 'Abra o app Ajustes no iPhone', detail: 'Toque no nome do proprietário no topo da tela' },
          { order: 2, title: 'Sair da conta iCloud', description: 'Role para baixo e toque em Sair (Sign Out)', detail: 'Será solicitada a senha do iCloud' },
          { order: 3, title: 'Digitar senha do iCloud', description: 'Digite a senha do iCloud do cliente', detail: 'Isto desativará o Buscar iPhone' },
          { order: 4, title: 'Aguardar remoção', description: 'Aguarde o dispositivo processar a saída', detail: 'Pode demorar 1-2 minutos' },
          { order: 5, title: 'Apagar conteúdo', description: 'Acesse Ajustes > Geral > Transferir ou Redefinir', detail: 'Toque em Apagar Conteúdo e Ajustes' },
          { order: 6, title: 'Confirmar', description: 'Confirme a ação', detail: 'O iPhone irá reiniciar' },
          { order: 7, title: 'Verificar ecrã Hello', description: 'Confirme o ecrã de Boas-vindas', detail: 'Dispositivo pronto' }
        ],
        tips: [
          'Certifique-se de que o cliente tem backup',
          'Bateria mínima de 20%',
          'Tenha a senha confirmada ANTES de iniciar'
        ]
      });
    }
  };

  const toggleStepComplete = (stepIndex) => {
    setCompletedSteps(prev =>
      prev.includes(stepIndex)
        ? prev.filter(s => s !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  const allStepsComplete = guide?.steps.every((_, i) => completedSteps.includes(i));

  const handleFinish = () => {
    if (!confirmReset) {
      toast.error('Confirme que o dispositivo foi apagado');
      return;
    }
    if (!confirmHello) {
      toast.error('Confirme que o ecrã Hello está ativo');
      return;
    }
    toast.success('Serviço finalizado! Gerando relatório...');
  };

  const getEligibilityColor = (method) => {
    switch (method) {
      case 'reset-with-password': return 'bg-green-500/20 text-green-400 border-green-500';
      case 'reset-without-password-no-find-my': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'needs-recovery': return 'bg-red-500/20 text-red-400 border-red-500';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Smartphone className="w-8 h-8 text-blue-400" />
          Reset com Senha iCloud
        </h1>
        <p className="text-gray-400">Processo profissional 100% legal de reset de dispositivo</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Dispositivo', 'Elegibilidade', 'Guia', 'Execução', 'Finalizar'].map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep > i + 1 ? 'bg-green-600 text-white' :
                currentStep === i + 1 ? 'bg-blue-600 text-white' :
                'bg-gray-800 text-gray-500'
              }`}>
                {currentStep > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-xs text-gray-500 hidden sm:block">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 lg:p-8">
        {/* Step 1: Device Identification */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Identificação do Dispositivo</h2>

            <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-200">
                <strong>Dica:</strong> Encontre o IMEI em Ajustes {'>'} Geral {'>'} Sobre ou disque *#06# no teclado
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">IMEI do Dispositivo *</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.imei}
                    onChange={(e) => setFormData({...formData, imei: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="000000000000000"
                    maxLength={17}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">15 dígitos — use *#06# para obter</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Número de Série (opcional)</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Serial number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Modelo do iPhone *</label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Selecionar modelo...</option>
                  {IPHONE_MODELS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Estado do Dispositivo</label>
                <select
                  value={formData.conditionStatus}
                  onChange={(e) => setFormData({...formData, conditionStatus: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="good">Bom estado</option>
                  <option value="fair">Estado razoável</option>
                  <option value="damaged">Danificado</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Eligibility Check */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Verificação de Elegibilidade</h2>

            <div className="space-y-5 mb-6">
              <div className="p-4 bg-gray-800 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasPassword}
                    onChange={(e) => setFormData({...formData, hasPassword: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-600"
                  />
                  <div>
                    <p className="font-medium">Cliente tem a senha do iCloud?</p>
                    <p className="text-sm text-gray-400">Senha necessária para desativar o Buscar iPhone</p>
                  </div>
                </label>
              </div>

              <div className="p-4 bg-gray-800 rounded-xl">
                <label className="block font-medium mb-3">Status do Find My (Buscar iPhone)</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'on', label: 'Ativo', icon: <Shield className="w-4 h-4" /> },
                    { value: 'off', label: 'Desativado', icon: <CheckCircle className="w-4 h-4" /> },
                    { value: 'unknown', label: 'Verificar', icon: <AlertTriangle className="w-4 h-4" /> }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFormData({...formData, findMyStatus: opt.value})}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        formData.findMyStatus === opt.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex justify-center mb-1">{opt.icon}</div>
                      <span className="text-sm">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {eligibility && (
              <div className={`p-6 rounded-xl border ${getEligibilityColor(eligibility.method)}`}>
                <div className="flex items-start gap-3">
                  {eligibility.eligible ? (
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {eligibility.eligible ? 'Reset Possível' : 'Reset Não Recomendado'}
                    </h3>
                    <p className="text-sm mb-3">Tempo estimado: {eligibility.estimated_time}</p>
                    {eligibility.warnings?.map((w, i) => (
                      <p key={i} className="text-sm text-amber-300 mb-1">⚠ {w}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Reset Guide */}
        {currentStep === 3 && guide && (
          <div>
            <h2 className="text-2xl font-bold mb-2">{guide.title}</h2>
            <p className="text-gray-400 mb-6">Tempo estimado: {guide.estimatedTime}</p>

            {guide.legalNotice && (
              <div className="bg-green-900/20 border border-green-700 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-green-400">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">{guide.legalNotice}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {guide.steps.map((step, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition-all ${
                    completedSteps.includes(index)
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-gray-700 bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleStepComplete(index)}
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        completedSteps.includes(index)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {completedSteps.includes(index) ? <CheckCircle className="w-4 h-4" /> : step.order}
                    </button>
                    <div className="flex-1">
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="text-gray-400 text-sm">{step.description}</p>
                      {step.detail && (
                        <p className="text-blue-400 text-xs mt-1">{step.detail}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {guide.tips && (
              <div className="mt-6 bg-amber-900/20 border border-amber-700 rounded-xl p-4">
                <h4 className="font-semibold text-amber-400 mb-2">Dicas Importantes</h4>
                <ul className="text-sm text-amber-200 space-y-1">
                  {guide.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Execution */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Execução do Reset</h2>

            {guide && (
              <div className="space-y-4 mb-6">
                {guide.steps.map((step, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${
                      completedSteps.includes(index)
                        ? 'border-green-500 bg-green-500/5'
                        : 'border-gray-700 bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleStepComplete(index)}
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          completedSteps.includes(index) ? 'bg-green-600 text-white' : 'bg-gray-700'
                        }`}
                      >
                        {completedSteps.includes(index) ? <CheckCircle className="w-4 h-4" /> : step.order}
                      </button>
                      <div>
                        <h4 className="font-semibold">{step.title}</h4>
                        <p className="text-sm text-gray-400">{step.detail || step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={`p-4 rounded-xl border ${allStepsComplete ? 'border-green-500 bg-green-500/5' : 'border-gray-700 bg-gray-800'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${allStepsComplete ? 'bg-green-500' : 'bg-gray-500'}`} />
                <span className="text-sm text-gray-400">
                  {allStepsComplete ? 'Todos os passos concluídos' : `${completedSteps.length} de ${guide?.steps.length || 7} passos concluídos`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Confirmation & Finish */}
        {currentStep === 5 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Confirmação Final</h2>

            <div className="bg-green-900/20 border border-green-700 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-600 rounded-xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Reset Concluído?</h3>
                  <p className="text-sm text-green-200">
                    Confirme os itens abaixo para finalizar o serviço e gerar o relatório profissional.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <label className="flex items-start gap-3 p-4 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-750">
                <input
                  type="checkbox"
                  checked={confirmReset}
                  onChange={(e) => setConfirmReset(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-600"
                />
                <div>
                  <p className="font-medium">Dispositivo foi apagado com sucesso</p>
                  <p className="text-sm text-gray-400">O conteúdo foi removido e o dispositivo reiniciou</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-750">
                <input
                  type="checkbox"
                  checked={confirmHello}
                  onChange={(e) => setConfirmHello(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-600"
                />
                <div>
                  <p className="font-medium">Ecrã de Boas-vindas (Hello) ativo</p>
                  <p className="text-sm text-gray-400">O dispositivo mostra o ecrã de configuração inicial</p>
                </div>
              </label>

              <div>
                <label className="block text-sm font-medium mb-2">Notas do Técnico</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                  placeholder="Observações sobre o serviço..."
                />
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-200">
                  Ao finalizar, um <strong>relatório profissional</strong> será gerado automaticamente com os dados do serviço, dispositivo e cliente.
                </p>
              </div>
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

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {currentStep === 1 ? 'Verificar Dispositivo' : currentStep === 2 ? 'Ver Guia' : currentStep === 3 ? 'Começar Reset' : 'Finalizar'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!confirmReset || !confirmHello}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed rounded-xl font-semibold transition-all"
            >
              <CheckCircle className="w-5 h-5" />
              Finalizar Serviço
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetWithPassword;

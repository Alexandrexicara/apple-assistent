import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Upload, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { paymentsApi } from '../services/api';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

const Payment = () => {
  const navigate = useNavigate();
  const { user, logout } = useStore();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await paymentsApi.myStatus();
      setStatus(res.data);
    } catch (error) {
      console.error('Erro ao buscar status de pagamento:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!imageBase64) {
      toast.error('Selecione o comprovante de pagamento');
      return;
    }

    setLoading(true);
    try {
      await paymentsApi.upload(imageBase64, description);
      toast.success('Comprovante enviado com sucesso!');
      setImageBase64(null);
      setImagePreview(null);
      setDescription('');
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao enviar comprovante');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    if (!status?.paymentStatus) return null;

    switch (status.paymentStatus) {
      case 'approved':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: 'Pagamento Aprovado',
          message: 'Sua conta está ativa. Você já pode usar o sistema.',
          color: 'green',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30'
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: 'Pagamento Rejeitado',
          message: status.payment?.notes || 'Entre em contato com o suporte.',
          color: 'red',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30'
        };
      case 'pending':
        return {
          icon: <Clock className="w-16 h-16 text-yellow-500" />,
          title: 'Aguardando Aprovação',
          message: 'Seu comprovante está sendo analisado. Aguarde.',
          color: 'yellow',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30'
        };
      default:
        return null;
    }
  };

  const statusDisplay = getStatusDisplay();

  // Se pagamento aprovado, redirecionar
  if (status?.paymentStatus === 'approved') {
    setTimeout(() => navigate('/technician'), 2000);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <CreditCard className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Ativação de Conta</h1>
          <p className="text-gray-400">Envie o comprovante de pagamento para ativar sua conta</p>
        </div>

        {/* Valor do pagamento */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400">Valor da licença</span>
            <span className="text-3xl font-bold text-white">R$ 7.000,00</span>
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <p>• Acesso completo ao sistema</p>
            <p>• Suporte técnico ilimitado</p>
            <p>• Atualizações gratuitas</p>
          </div>
        </div>

        {/* Status do pagamento */}
        {statusDisplay && (
          <div className={`${statusDisplay.bgColor} border ${statusDisplay.borderColor} rounded-2xl p-6 mb-6`}>
            <div className="flex flex-col items-center text-center">
              {statusDisplay.icon}
              <h2 className="text-xl font-bold mt-4 mb-2">{statusDisplay.title}</h2>
              <p className="text-gray-300">{statusDisplay.message}</p>
              {status?.paymentStatus === 'approved' && (
                <p className="text-green-400 mt-4 animate-pulse">Redirecionando para o painel...</p>
              )}
            </div>
          </div>
        )}

        {/* Upload de comprovante */}
        {!status?.paymentStatus || status.paymentStatus === 'rejected' || status.paymentStatus === 'pending' ? (
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">
              {status?.paymentStatus === 'pending' ? 'Enviar novo comprovante' : 'Upload do Comprovante'}
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Imagem do comprovante (JPG, PNG)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="proof-upload"
                />
                <label
                  htmlFor="proof-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 transition-colors"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-44 rounded-lg" />
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-500 mb-2" />
                      <p className="text-gray-500">Clique para selecionar imagem</p>
                      <p className="text-xs text-gray-600 mt-1">Máx. 5MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Descrição (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: PIX realizado em 18/05/2026"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !imageBase64}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Enviar Comprovante
                </>
              )}
            </button>

            {status?.paymentStatus === 'pending' && (
              <div className="mt-4 flex items-center gap-2 text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Aguardando aprovação do administrador</span>
              </div>
            )}
          </form>
        ) : null}

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full mt-4 py-3 text-gray-400 hover:text-white transition-colors"
        >
          Voltar ao login
        </button>
      </div>
    </div>
  );
};

export default Payment;

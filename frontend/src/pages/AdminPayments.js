import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Shield, ShieldOff, Users, Clock, CreditCard, Ban } from 'lucide-react';
import { paymentsApi } from '../services/api';
import toast from 'react-hot-toast';

const AdminPayments = () => {
  const [activeTab, setActiveTab] = useState('payments');
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectNotes, setRejectNotes] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (activeTab === 'payments') fetchPayments();
    else fetchUsers();
  }, [activeTab]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.adminAll();
      setPayments(res.data.payments || []);
    } catch (error) {
      toast.error('Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.adminUsers();
      setUsers(res.data.users || []);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId) => {
    try {
      await paymentsApi.adminApprove(paymentId);
      toast.success('Pagamento aprovado!');
      fetchPayments();
    } catch (error) {
      toast.error('Erro ao aprovar');
    }
  };

  const handleReject = async (paymentId) => {
    try {
      await paymentsApi.adminReject(paymentId, rejectNotes[paymentId] || '');
      toast.success('Pagamento rejeitado');
      setRejectNotes(prev => ({ ...prev, [paymentId]: '' }));
      fetchPayments();
    } catch (error) {
      toast.error('Erro ao rejeitar');
    }
  };

  const handleBlock = async (userId, block) => {
    try {
      await paymentsApi.adminBlockUser(userId, block);
      toast.success(block ? 'Usuário bloqueado' : 'Usuário desbloqueado');
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Aprovado</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Rejeitado</span>;
      default:
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Pendente</span>;
    }
  };

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <CreditCard className="w-8 h-8 text-blue-500" />
        <h1 className="text-3xl font-bold">Gerenciamento de Pagamentos</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
            activeTab === 'payments' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Pagamentos
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-yellow-500 text-black rounded-full text-xs">{pendingCount}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
            activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Usuários
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {payments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum pagamento registrado</p>
                </div>
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Info do pagamento */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-bold text-lg">{payment.userName}</h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        <p className="text-gray-400 text-sm mb-1">{payment.userEmail}</p>
                        <p className="text-2xl font-bold text-green-400 mb-2">
                          R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Enviado: {new Date(payment.submittedAt).toLocaleString('pt-BR')}
                        </p>
                        {payment.reviewedAt && (
                          <p className="text-gray-500 text-xs">
                            Revisado: {new Date(payment.reviewedAt).toLocaleString('pt-BR')}
                          </p>
                        )}
                        {payment.notes && (
                          <p className="text-gray-400 text-sm mt-2 italic">"{payment.notes}"</p>
                        )}
                      </div>

                      {/* Preview do comprovante */}
                      {payment.proofImage && (
                        <div className="w-full lg:w-48">
                          <img
                            src={payment.proofImage}
                            alt="Comprovante"
                            className="w-full h-32 object-cover rounded-xl cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setPreviewImage(payment.proofImage)}
                          />
                        </div>
                      )}

                      {/* Ações */}
                      {payment.status === 'pending' && (
                        <div className="flex flex-col gap-2 lg:w-48">
                          <button
                            onClick={() => handleApprove(payment.id)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl font-medium transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprovar
                          </button>
                          <input
                            type="text"
                            placeholder="Motivo (opcional)"
                            value={rejectNotes[payment.id] || ''}
                            onChange={(e) => setRejectNotes(prev => ({ ...prev, [payment.id]: e.target.value }))}
                            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm"
                          />
                          <button
                            onClick={() => handleReject(payment.id)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Rejeitar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Nome</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Pagamento</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">{u.role}</span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(u.paymentStatus)}</td>
                      <td className="px-4 py-3">
                        {u.isBlocked ? (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs flex items-center gap-1 w-fit">
                            <Ban className="w-3 h-3" /> Bloqueado
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Ativo</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleBlock(u.id, !u.isBlocked)}
                            className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-1 mx-auto ${
                              u.isBlocked
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            {u.isBlocked ? (
                              <><Shield className="w-4 h-4" /> Desbloquear</>
                            ) : (
                              <><ShieldOff className="w-4 h-4" /> Bloquear</>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="Comprovante" className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}
    </div>
  );
};

export default AdminPayments;

import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, ClipboardList, Smartphone, User, Clock, CheckCircle, XCircle, Play, Flag, FileText, X, Filter, ChevronDown, ArrowRight, Calendar } from 'lucide-react';
import { serviceOrdersApi, clientsApi, devicesApi } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_MAP = {
  pending:      { label: 'Pendente',     color: 'bg-gray-500/20 text-gray-400',    icon: Clock },
  in_progress:  { label: 'Em Andamento', color: 'bg-yellow-500/20 text-yellow-400', icon: Play },
  completed:    { label: 'Concluído',    color: 'bg-green-500/20 text-green-400',   icon: CheckCircle },
  delivered:    { label: 'Entregue',     color: 'bg-blue-500/20 text-blue-400',     icon: Flag },
  cancelled:    { label: 'Cancelado',    color: 'bg-red-500/20 text-red-400',       icon: XCircle },
};

const SERVICE_TYPES = [
  'reset-with-password',
  'screen-replacement',
  'battery-replacement',
  'data-transfer',
  'diagnosis',
  'unlock-carrier',
  'repair-other',
];

const SERVICE_TYPE_LABELS = {
  'reset-with-password': 'Reset com Senha iCloud',
  'screen-replacement':  'Troca de Ecrã',
  'battery-replacement': 'Troca de Bateria',
  'data-transfer':       'Transferência de Dados',
  'diagnosis':           'Diagnóstico',
  'unlock-carrier':      'Desbloqueio de Operadora',
  'repair-other':        'Outro Reparo',
};

const ServiceOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const response = await serviceOrdersApi.list(params);
      setOrders(response.data.orders || []);
    } catch (error) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ordens de Serviço</h1>
          <p className="text-gray-400">Gerir serviços e acompanhar execuções</p>
        </div>
        <button
          onClick={() => setShowNewOrder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          Nova OS
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
            placeholder="Buscar por cliente, dispositivo ou IMEI..."
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="">Todos os Status</option>
            {Object.entries(STATUS_MAP).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Orders List */}
      {orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => {
            const StatusIcon = STATUS_MAP[order.status]?.icon || Clock;
            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${STATUS_MAP[order.status]?.color || 'bg-gray-500/20'}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {order.clientName || 'Cliente'} — {SERVICE_TYPE_LABELS[order.serviceType] || order.serviceType}
                      </p>
                      <p className="text-sm text-gray-400 truncate">
                        {order.deviceModel || 'Dispositivo'}
                        {order.deviceImei ? ` • IMEI: ${String(order.deviceImei).slice(0,6)}***${String(order.deviceImei).slice(-4)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_MAP[order.status]?.color || 'bg-gray-500/20 text-gray-400'}`}>
                      {STATUS_MAP[order.status]?.label || order.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma ordem de serviço</h3>
          <p className="text-gray-400 mb-6">Crie a primeira ordem de serviço para começar</p>
          <button
            onClick={() => setShowNewOrder(true)}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl font-medium transition-all"
          >
            Criar Nova OS
          </button>
        </div>
      )}

      {/* New Order Modal */}
      {showNewOrder && (
        <NewOrderModal
          onClose={() => setShowNewOrder(false)}
          onSuccess={() => { setShowNewOrder(false); loadOrders(); }}
        />
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={loadOrders}
        />
      )}
    </div>
  );
};

const NewOrderModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    clientId: '', deviceId: '', serviceType: 'reset-with-password', notes: ''
  });
  const [clients, setClients] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsRes, devicesRes] = await Promise.all([
          clientsApi.list({}),
          devicesApi.list({})
        ]);
        setClients(clientsRes.data.clients || []);
        setDevices(devicesRes.data.devices || []);
      } catch (error) {
        // Fallback: empty lists
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientId) { toast.error('Selecione um cliente'); return; }
    if (!formData.deviceId) { toast.error('Selecione um dispositivo'); return; }
    setSubmitting(true);
    try {
      await serviceOrdersApi.create(formData);
      toast.success('Ordem de serviço criada!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao criar OS');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6" onClick={e => e.stopPropagation()}>
          <div className="animate-spin w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-400 mt-4">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Nova Ordem de Serviço</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium mb-2">Cliente *</label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({...formData, clientId: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
              required
            >
              <option value="">Selecionar cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `— ${c.phone}` : ''}</option>
              ))}
            </select>
            {clients.length === 0 && (
              <p className="text-yellow-400 text-xs mt-1">Nenhum cliente registado. Registe um cliente primeiro.</p>
            )}
          </div>

          {/* Device */}
          <div>
            <label className="block text-sm font-medium mb-2">Dispositivo *</label>
            <select
              value={formData.deviceId}
              onChange={(e) => setFormData({...formData, deviceId: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
              required
            >
              <option value="">Selecionar dispositivo...</option>
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.model || 'iPhone'} — IMEI: {d.imei ? `${String(d.imei).slice(0,6)}***${String(d.imei).slice(-4)}` : 'N/D'}
                </option>
              ))}
            </select>
            {devices.length === 0 && (
              <p className="text-yellow-400 text-xs mt-1">Nenhum dispositivo registado. Registe um dispositivo primeiro.</p>
            )}
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Serviço *</label>
            <select
              value={formData.serviceType}
              onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
              required
            >
              {SERVICE_TYPES.map(t => (
                <option key={t} value={t}>{SERVICE_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notas / Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none resize-none"
              rows={3}
              placeholder="Detalhes do serviço, condição do dispositivo, solicitações do cliente..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-gray-600 hover:border-gray-500 rounded-xl font-medium transition-all">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || clients.length === 0 || devices.length === 0}
              className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              {submitting ? 'Criando...' : (
                <><ClipboardList className="w-4 h-4" /> Criar OS</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OrderDetailModal = ({ order, onClose, onUpdate }) => {
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState(order.notes || '');

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      if (newStatus === 'completed') {
        await serviceOrdersApi.complete(order.id, { notes });
        toast.success('Serviço concluído! Relatório gerado.');
      } else {
        await serviceOrdersApi.update(order.id, { status: newStatus, notes });
        toast.success(`Status atualizado para: ${STATUS_MAP[newStatus]?.label || newStatus}`);
      }
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  };

  const StatusIcon = STATUS_MAP[order.status]?.icon || Clock;

  const getAvailableActions = () => {
    switch (order.status) {
      case 'pending':     return ['in_progress', 'cancelled'];
      case 'in_progress': return ['completed', 'cancelled'];
      case 'completed':   return ['delivered'];
      default:            return [];
    }
  };

  const availableActions = getAvailableActions();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">OS #{String(order.id).slice(0, 8)}</h2>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${STATUS_MAP[order.status]?.color}`}>
              <StatusIcon className="w-3 h-3" />
              {STATUS_MAP[order.status]?.label || order.status}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4 mb-6">
          <DetailRow icon={<User className="w-4 h-4" />} label="Cliente" value={order.clientName || '-'} />
          <DetailRow icon={<Smartphone className="w-4 h-4" />} label="Dispositivo" value={order.deviceModel || '-'} />
          {order.deviceImei && <DetailRow icon={<Smartphone className="w-4 h-4" />} label="IMEI" value={String(order.deviceImei)} mono />}
          <DetailRow icon={<ClipboardList className="w-4 h-4" />} label="Tipo de Serviço" value={SERVICE_TYPE_LABELS[order.serviceType] || order.serviceType} />
          {order.createdAt && (
            <DetailRow icon={<Calendar className="w-4 h-4" />} label="Criado em" value={new Date(order.createdAt).toLocaleString('pt-BR')} />
          )}
          {order.completedAt && (
            <DetailRow icon={<CheckCircle className="w-4 h-4" />} label="Concluído em" value={new Date(order.completedAt).toLocaleString('pt-BR')} />
          )}
          {order.technicianName && <DetailRow icon={<User className="w-4 h-4" />} label="Técnico" value={order.technicianName} />}
        </div>

        {/* Actions */}
        {availableActions.length > 0 && (
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-sm text-gray-400">Ações Disponíveis</h3>
            <div className="flex flex-wrap gap-2">
              {availableActions.includes('in_progress') && (
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 rounded-lg font-medium transition-all text-sm"
                >
                  <Play className="w-4 h-4" /> Iniciar Serviço
                </button>
              )}
              {availableActions.includes('completed') && (
                <button
                  onClick={() => handleStatusChange('completed')}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded-lg font-medium transition-all text-sm"
                >
                  <CheckCircle className="w-4 h-4" /> Concluir Serviço
                </button>
              )}
              {availableActions.includes('delivered') && (
                <button
                  onClick={() => handleStatusChange('delivered')}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg font-medium transition-all text-sm"
                >
                  <Flag className="w-4 h-4" /> Marcar Entregue
                </button>
              )}
              {availableActions.includes('cancelled') && (
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/30 hover:bg-red-600/50 disabled:bg-red-900/30 text-red-300 rounded-lg font-medium transition-all text-sm"
                >
                  <XCircle className="w-4 h-4" /> Cancelar OS
                </button>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="p-3 bg-gray-800 rounded-lg mb-6">
            <p className="text-xs text-gray-500 mb-1">Notas</p>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}

        {/* Report Link (if completed) */}
        {(order.status === 'completed' || order.status === 'delivered') && (
          <a
            href={`/technician/reports?orderId=${order.id}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 rounded-xl font-medium transition-all text-blue-400"
          >
            <FileText className="w-4 h-4" />
            Ver Relatório de Serviço
          </a>
        )}
      </div>
    </div>
  );
};

const DetailRow = ({ icon, label, value, mono }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
    <div className="text-gray-400 mt-0.5">{icon}</div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-medium ${mono ? 'font-mono tracking-wider' : ''}`}>{value}</p>
    </div>
  </div>
);

export default ServiceOrder;

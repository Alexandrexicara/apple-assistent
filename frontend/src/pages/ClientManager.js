import React, { useEffect, useState } from 'react';
import { Search, Plus, User, Phone, Mail, FileText, X } from 'lucide-react';
import { clientsApi } from '../services/api';
import toast from 'react-hot-toast';

const ClientManager = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => { loadClients(); }, [search]);

  const loadClients = async () => {
    try {
      const response = await clientsApi.list({ search: search || undefined });
      setClients(response.data.clients || []);
    } catch (error) {
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Clientes</h1>
          <p className="text-gray-400">Gerir cadastro de clientes</p>
        </div>
        <button
          onClick={() => setShowNewClient(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Buscar por nome ou telefone..."
        />
      </div>

      {/* Client List */}
      {clients.length > 0 ? (
        <div className="space-y-3">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className="p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{client.name}</p>
                    <p className="text-sm text-gray-400">{client.phone || 'Sem telefone'}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold mb-2">Nenhum cliente ainda</h3>
          <p className="text-gray-400 mb-6">Comece registando o primeiro cliente</p>
          <button
            onClick={() => setShowNewClient(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-all"
          >
            Registar Cliente
          </button>
        </div>
      )}

      {/* New Client Modal */}
      {showNewClient && <NewClientModal onClose={() => setShowNewClient(false)} onSuccess={() => { setShowNewClient(false); loadClients(); }} />}

      {/* Client Detail Modal */}
      {selectedClient && <ClientDetailModal client={selectedClient} onClose={() => setSelectedClient(null)} />}
    </div>
  );
};

const NewClientModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', document: '', address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Nome é obrigatório'); return; }
    setSubmitting(true);
    try {
      await clientsApi.create(formData);
      toast.success('Cliente registado com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao registar cliente');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Novo Cliente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nome completo" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Telefone</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="cliente@email.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Documento (CPF/CNPJ)</label>
            <input type="text" value={formData.document} onChange={(e) => setFormData({...formData, document: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="000.000.000-00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Morada</label>
            <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Morada completa" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-gray-600 hover:border-gray-500 rounded-xl font-medium transition-all">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-xl font-medium transition-all">
              {submitting ? 'Registando...' : 'Registar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ClientDetailModal = ({ client, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{client.name}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      <div className="space-y-4">
        <DetailRow icon={<Phone className="w-4 h-4" />} label="Telefone" value={client.phone || '-'} />
        <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={client.email || '-'} />
        <DetailRow icon={<FileText className="w-4 h-4" />} label="Documento" value={client.document || '-'} />
        {client.address && <DetailRow icon={<FileText className="w-4 h-4" />} label="Morada" value={client.address} />}
      </div>
    </div>
  </div>
);

const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
    <div className="text-gray-400 mt-0.5">{icon}</div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

export default ClientManager;

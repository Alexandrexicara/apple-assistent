import React, { useEffect, useState } from 'react';
import { Plus, MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { ticketsApi } from '../services/api';
import toast from 'react-hot-toast';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const response = await ticketsApi.list();
      setTickets(response.data.tickets || []);
    } catch (error) {
      toast.error('Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'open': 'Aberto',
      'in_progress': 'Em Andamento',
      'waiting_user': 'Aguardando Usuário',
      'resolved': 'Resolvido',
      'closed': 'Fechado'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'open': 'bg-red-500/20 text-red-400',
      'in_progress': 'bg-yellow-500/20 text-yellow-400',
      'waiting_user': 'bg-blue-500/20 text-blue-400',
      'resolved': 'bg-green-500/20 text-green-400',
      'closed': 'bg-gray-500/20 text-gray-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'bg-gray-500/20 text-gray-400',
      'medium': 'bg-blue-500/20 text-blue-400',
      'high': 'bg-yellow-500/20 text-yellow-400',
      'urgent': 'bg-red-500/20 text-red-400'
    };
    return colors[priority] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Meus Tickets</h1>
          <p className="text-gray-400">Gerencie seus chamados de suporte</p>
        </div>
        <button
          onClick={() => setShowNewTicket(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Ticket
        </button>
      </div>

      {/* Tickets List */}
      {tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{ticket.category}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Criado em {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                    <span>•</span>
                    <span>{ticket.messageCount || 0} mensagens</span>
                  </div>
                </div>
                <div className="text-gray-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold mb-2">Nenhum ticket ainda</h3>
          <p className="text-gray-400 mb-6">Você ainda não abriu nenhum chamado de suporte</p>
          <button
            onClick={() => setShowNewTicket(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-all"
          >
            Abrir primeiro ticket
          </button>
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicket && (
        <NewTicketModal
          onClose={() => setShowNewTicket(false)}
          onSuccess={() => {
            setShowNewTicket(false);
            loadTickets();
          }}
        />
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={loadTickets}
        />
      )}
    </div>
  );
};

const NewTicketModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'password',
    priority: 'medium'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await ticketsApi.create(formData);
      toast.success('Ticket criado com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao criar ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Novo Ticket de Suporte</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Assunto</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Resumo do problema"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Categoria</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="password">Recuperação de Senha</option>
              <option value="icloud">Problemas iCloud</option>
              <option value="device">Dispositivo Bloqueado</option>
              <option value="account">Conta Apple ID</option>
              <option value="other">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Prioridade</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
              placeholder="Descreva seu problema em detalhes..."
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-600 hover:border-gray-500 rounded-xl font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-xl font-medium transition-all"
            >
              {submitting ? 'Criando...' : 'Criar Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TicketDetailModal = ({ ticket, onClose, onUpdate }) => {
  const [messages, setMessages] = useState(ticket.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await ticketsApi.addMessage(ticket.id, newMessage);
      setMessages([...messages, {
        from: 'user',
        content: newMessage,
        timestamp: new Date()
      }]);
      setNewMessage('');
      onUpdate();
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{ticket.subject}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-1">{ticket.category}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-xl ${
                msg.from === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : msg.from === 'system'
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-800 text-white'
              }`}>
                <p className="text-sm mb-1 opacity-75">
                  {msg.from === 'user' ? 'Você' : msg.from === 'system' ? 'Sistema' : 'Suporte'}
                </p>
                <p>{msg.content}</p>
                <p className="text-xs mt-2 opacity-50">
                  {new Date(msg.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-xl font-medium transition-all"
            >
              {sending ? '...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Tickets;

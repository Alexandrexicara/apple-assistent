import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Activity, 
  Settings, 
  FileText, 
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { adminApi, sessionsApi } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [dashboardRes, coreStatsRes] = await Promise.all([
        adminApi.dashboard(),
        sessionsApi.stats()
      ]);
      
      setStats({
        ...dashboardRes.data,
        coreStats: coreStatsRes.data.stats
      });
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
        <p className="text-gray-400">Gerenciamento do sistema e monitoramento</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-800 flex-wrap">
        {[
          { id: 'overview', label: 'Visão Geral', icon: Activity },
          { id: 'users', label: 'Usuários', icon: Users },
          { id: 'sessions', label: 'Sessões', icon: FileText },
          { id: 'settings', label: 'Configurações', icon: Settings }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
        <Link
          to="/admin/payments"
          className="flex items-center gap-2 px-4 py-3 font-medium text-gray-400 hover:text-white transition-all"
        >
          <CreditCard className="w-4 h-4" />
          Pagamentos
        </Link>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* System Status */}
          <div className="grid md:grid-cols-3 gap-4">
            <StatusCard
              title="API Backend"
              status="online"
              icon={<Shield className="w-6 h-6" />}
            />
            <StatusCard
              title="Core Engine"
              status={stats?.dashboard?.systemStatus?.coreEngine === 'online' ? 'online' : 'offline'}
              icon={<Activity className="w-6 h-6" />}
            />
            <StatusCard
              title="Database"
              status="online"
              icon={<FileText className="w-6 h-6" />}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard
              title="Total Sessões"
              value={stats?.coreStats?.total_sessions || 0}
              change="+12%"
              icon={<FileText className="w-5 h-5" />}
            />
            <StatCard
              title="Diagnósticos"
              value={stats?.coreStats?.diagnoses_completed || 0}
              change="+8%"
              icon={<Activity className="w-5 h-5" />}
            />
            <StatCard
              title="Sessões Ativas"
              value={stats?.coreStats?.active_sessions || 0}
              change="+5%"
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <StatCard
              title="Consentimentos"
              value={stats?.coreStats?.consent_given || 0}
              change="+15%"
              icon={<CheckCircle className="w-5 h-5" />}
            />
          </div>

          {/* Problem Distribution */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Distribuição de Problemas</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {stats?.coreStats?.problem_type_distribution && 
                Object.entries(stats.coreStats.problem_type_distribution).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <span className="capitalize">{type.replace(/-/g, ' ')}</span>
                    <span className="font-semibold text-blue-400">{count}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && <UsersTab />}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && <SessionsTab />}

      {/* Settings Tab */}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  );
};

const StatusCard = ({ title, status, icon }) => (
  <div className={`p-6 rounded-xl border ${
    status === 'online' 
      ? 'bg-green-900/20 border-green-700' 
      : 'bg-red-900/20 border-red-700'
  }`}>
    <div className="flex items-center justify-between mb-4">
      <div className={status === 'online' ? 'text-green-400' : 'text-red-400'}>
        {icon}
      </div>
      <div className={`w-3 h-3 rounded-full ${
        status === 'online' ? 'bg-green-500' : 'bg-red-500'
      }`} />
    </div>
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className={`text-sm ${status === 'online' ? 'text-green-400' : 'text-red-400'}`}>
      {status === 'online' ? 'Operacional' : 'Offline'}
    </p>
  </div>
);

const StatCard = ({ title, value, change, icon }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="text-blue-400">{icon}</div>
      <span className="text-green-400 text-sm font-medium">{change}</span>
    </div>
    <p className="text-gray-400 text-sm">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const UsersTab = () => {
  const [users, setUsers] = useState([]);

  // Mock data - substituir por chamada real à API
  const mockUsers = [
    { id: 1, name: 'João Silva', email: 'joao@email.com', role: 'user', status: 'active', createdAt: '2024-01-15' },
    { id: 2, name: 'Maria Santos', email: 'maria@email.com', role: 'support', status: 'active', createdAt: '2024-01-10' },
    { id: 3, name: 'Admin User', email: 'admin@email.com', role: 'admin', status: 'active', createdAt: '2024-01-01' }
  ];

  useEffect(() => {
    setUsers(mockUsers);
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Gerenciamento de Usuários</h3>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all">
          + Novo Usuário
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 px-4 font-medium text-gray-400">Usuário</th>
              <th className="text-left py-3 px-4 font-medium text-gray-400">Role</th>
              <th className="text-left py-3 px-4 font-medium text-gray-400">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-400">Criado em</th>
              <th className="text-left py-3 px-4 font-medium text-gray-400">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-800/50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                    user.role === 'support' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-3 px-4">
                  <button className="text-blue-400 hover:text-blue-300 text-sm">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SessionsTab = () => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
    <h3 className="text-lg font-semibold mb-4">Sessões Ativas</h3>
    <div className="text-center py-8 text-gray-400">
      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>Visualização detalhada de sessões em desenvolvimento</p>
    </div>
  </div>
);

const SettingsTab = () => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
    <h3 className="text-lg font-semibold mb-6">Configurações do Sistema</h3>
    
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
        <div>
          <p className="font-medium">Modo Manutenção</p>
          <p className="text-sm text-gray-400">Bloquear acesso aos usuários durante manutenção</p>
        </div>
        <button className="relative w-12 h-6 bg-gray-700 rounded-full transition-colors">
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
        </button>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
        <div>
          <p className="font-medium">Registros Abertos</p>
          <p className="text-sm text-gray-400">Permitir novos registros de usuários</p>
        </div>
        <button className="relative w-12 h-6 bg-blue-600 rounded-full transition-colors">
          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
        </button>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
        <div>
          <p className="font-medium">Logs Detalhados</p>
          <p className="text-sm text-gray-400">Registrar todas as operações do sistema</p>
        </div>
        <button className="relative w-12 h-6 bg-blue-600 rounded-full transition-colors">
          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
        </button>
      </div>
    </div>

    <div className="mt-6 pt-6 border-t border-gray-800">
      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all">
        Salvar Configurações
      </button>
    </div>
  </div>
);

export default AdminPanel;

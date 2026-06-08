import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  FileText,
  Shield
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { sessionsApi } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await sessionsApi.stats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentActivity = [
    { id: 1, type: 'diagnosis', message: 'Diagnóstico realizado: Senha Esquecida', time: '2 horas atrás', status: 'success' },
    { id: 2, type: 'session', message: 'Nova sessão iniciada', time: '5 horas atrás', status: 'info' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Painel de Controle</h1>
        <p className="text-gray-400">Bem-vindo de volta, {user?.name || user?.email}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/recovery"
          className="p-6 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-8 h-8" />
            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="font-semibold text-lg">Nova Recuperação</h3>
          <p className="text-blue-200 text-sm">Iniciar processo de recuperação Apple ID</p>
        </Link>

        <Link
          to="/tickets"
          className="p-6 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-purple-400" />
            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="font-semibold text-lg">Meus Tickets</h3>
          <p className="text-gray-400 text-sm">Visualizar e gerenciar tickets de suporte</p>
        </Link>

        <div className="p-6 bg-gray-800 border border-gray-700 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="font-semibold text-lg">Status da Conta</h3>
          <p className="text-green-400 text-sm flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Ativa e funcionando
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total de Sessões"
          value={stats?.total_sessions || 0}
          icon={<Activity className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Diagnósticos"
          value={stats?.diagnoses_completed || 0}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Em Andamento"
          value={stats?.active_sessions || 0}
          icon={<Clock className="w-5 h-5" />}
          color="yellow"
        />
        <StatCard
          title="Consentimentos"
          value={stats?.consent_given || 0}
          icon={<Shield className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-6">Atividade Recente</h2>
        
        {recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.status === 'success' ? 'bg-green-500/20 text-green-400' :
                    activity.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {activity.type === 'diagnosis' ? <Activity className="w-5 h-5" /> :
                     activity.type === 'session' ? <Clock className="w-5 h-5" /> :
                     <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium">{activity.message}</p>
                    <p className="text-sm text-gray-400">{activity.time}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  activity.status === 'success' ? 'bg-green-500/20 text-green-400' :
                  activity.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {activity.status === 'success' ? 'Concluído' :
                   activity.status === 'warning' ? 'Atenção' :
                   'Info'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma atividade recente</p>
            <Link to="/recovery" className="text-blue-400 hover:underline mt-2 inline-block">
              Iniciar primeira recuperação
            </Link>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Precisa de ajuda?</h3>
            <p className="text-gray-300 mb-4">
              Nosso suporte está disponível para ajudar com qualquer dúvida sobre o processo de recuperação.
            </p>
            <Link
              to="/tickets/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all"
            >
              Abrir ticket de suporte
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    purple: 'bg-purple-500/20 text-purple-400',
    red: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default Dashboard;

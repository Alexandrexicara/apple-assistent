import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Smartphone, ClipboardList, CheckCircle, Plus, ArrowRight } from 'lucide-react';
import { technicianApi } from '../services/api';

const TechnicianDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await technicianApi.dashboard();
      setStats({
        totalClients: response.data.dashboard?.totalClients || 0,
        totalDevices: response.data.dashboard?.totalDevices || 0,
        activeOrders: response.data.dashboard?.activeOrders || 0,
        completedToday: response.data.dashboard?.completedToday || 0,
        recentOrders: response.data.dashboard?.recentOrders || []
      });
    } catch (error) {
      // Dados mock para desenvolvimento
      setStats({
        totalClients: 0,
        totalDevices: 0,
        activeOrders: 0,
        completedToday: 0,
        recentOrders: []
      });
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
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Painel do Técnico</h1>
        <p className="text-gray-400">Gestão profissional de serviços Apple</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Link to="/technician/reset" className="p-4 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-3">
          <Smartphone className="w-5 h-5 flex-shrink-0" />
          <div className="text-left">
            <div className="font-semibold text-sm">Reset com Senha</div>
            <div className="text-blue-200 text-xs">Novo serviço</div>
          </div>
        </Link>
        <Link to="/technician/clients" className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all flex items-center gap-3">
          <Users className="w-5 h-5 flex-shrink-0 text-purple-400" />
          <div className="text-left">
            <div className="font-semibold text-sm">Clientes</div>
            <div className="text-gray-400 text-xs">Gerir clientes</div>
          </div>
        </Link>
        <Link to="/technician/devices" className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all flex items-center gap-3">
          <Smartphone className="w-5 h-5 flex-shrink-0 text-green-400" />
          <div className="text-left">
            <div className="font-semibold text-sm">Dispositivos</div>
            <div className="text-gray-400 text-xs">Registar</div>
          </div>
        </Link>
        <Link to="/technician/orders" className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all flex items-center gap-3">
          <ClipboardList className="w-5 h-5 flex-shrink-0 text-yellow-400" />
          <div className="text-left">
            <div className="font-semibold text-sm">Ordens Serviço</div>
            <div className="text-gray-400 text-xs">Ver todas</div>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Clientes" value={stats.totalClients} icon={<Users className="w-5 h-5" />} color="purple" />
        <StatCard title="Dispositivos" value={stats.totalDevices} icon={<Smartphone className="w-5 h-5" />} color="green" />
        <StatCard title="OS Ativas" value={stats.activeOrders} icon={<ClipboardList className="w-5 h-5" />} color="yellow" />
        <StatCard title="Hoje" value={stats.completedToday} icon={<CheckCircle className="w-5 h-5" />} color="blue" />
      </div>

      {/* Recent Orders */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Ordens de Serviço Recentes</h2>
          <Link to="/technician/orders" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
            Ver todas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {stats.recentOrders.length > 0 ? (
          <div className="space-y-3">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">{order.clientName}</p>
                    <p className="text-sm text-gray-400">{order.deviceModel} — {order.serviceType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    order.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {order.status === 'completed' ? 'Concluído' :
                     order.status === 'in_progress' ? 'Em andamento' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma ordem de serviço ainda</p>
            <Link to="/technician/reset" className="text-blue-400 hover:underline mt-2 inline-flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Iniciar primeiro serviço
            </Link>
          </div>
        )}
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
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default TechnicianDashboard;

import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Smartphone, Hash, Palette, AlertCircle, Check, X, Info, Cpu } from 'lucide-react';
import { devicesApi } from '../services/api';
import toast from 'react-hot-toast';

const IPHONE_MODELS = [
  'iPhone SE (1ª geração)', 'iPhone SE (2ª geração)', 'iPhone SE (3ª geração)',
  'iPhone 6', 'iPhone 6 Plus', 'iPhone 6s', 'iPhone 6s Plus',
  'iPhone 7', 'iPhone 7 Plus', 'iPhone 8', 'iPhone 8 Plus',
  'iPhone X', 'iPhone XR', 'iPhone XS', 'iPhone XS Max',
  'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
  'iPhone 12', 'iPhone 12 mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
  'iPhone 13', 'iPhone 13 mini', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
  'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
  'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
  'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
  'iPhone 16e'
];

// Luhn algorithm for IMEI validation
const validateIMEI = (imei) => {
  if (!/^\d{15}$/.test(imei)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(imei[i], 10);
    if (i % 2 === 0) digit *= 2;
    if (digit > 9) digit -= 9;
    sum += digit;
  }
  return sum % 10 === 0;
};

const DeviceRegistration = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewDevice, setShowNewDevice] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const loadDevices = useCallback(async () => {
    try {
      const response = await devicesApi.list({ search: search || undefined });
      setDevices(response.data.devices || []);
    } catch (error) {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadDevices(); }, [loadDevices]);

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
          <h1 className="text-3xl font-bold mb-2">Dispositivos</h1>
          <p className="text-gray-400">Registar e gerir iPhones</p>
        </div>
        <button
          onClick={() => setShowNewDevice(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Dispositivo
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
          placeholder="Buscar por IMEI, modelo ou número de série..."
        />
      </div>

      {/* Device List */}
      {devices.length > 0 ? (
        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              onClick={() => setSelectedDevice(device)}
              className="p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{device.model || 'Modelo desconhecido'}</p>
                    <p className="text-sm text-gray-400">
                      IMEI: {device.imei ? `${device.imei.slice(0,6)}****${device.imei.slice(-4)}` : 'N/D'}
                      {device.serial ? ` • SN: ${device.serial.slice(0,3)}***${device.serial.slice(-2)}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  device.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  device.status === 'locked' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {device.status === 'active' ? 'Ativo' :
                   device.status === 'locked' ? 'Bloqueado' : 'Desconhecido'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <Smartphone className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold mb-2">Nenhum dispositivo</h3>
          <p className="text-gray-400 mb-6">Registe o primeiro iPhone no sistema</p>
          <button
            onClick={() => setShowNewDevice(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-medium transition-all"
          >
            Registar Dispositivo
          </button>
        </div>
      )}

      {/* New Device Modal */}
      {showNewDevice && (
        <NewDeviceModal
          onClose={() => setShowNewDevice(false)}
          onSuccess={() => { setShowNewDevice(false); loadDevices(); }}
        />
      )}

      {/* Device Detail Modal */}
      {selectedDevice && (
        <DeviceDetailModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
};

const NewDeviceModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    imei: '', serial: '', model: '', color: '', status: 'unknown', clientId: '', notes: ''
  });
  const [imeiValid, setImeiValid] = useState(null);
  const [imeiChecking, setImeiChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deviceCheck, setDeviceCheck] = useState(null);

  const handleIMEIChange = async (value) => {
    const clean = value.replace(/\D/g, '').slice(0, 15);
    setFormData(prev => ({ ...prev, imei: clean }));
    setDeviceCheck(null);

    if (clean.length === 15) {
      const valid = validateIMEI(clean);
      setImeiValid(valid);
      if (valid) {
        setImeiChecking(true);
        try {
          const response = await devicesApi.check(clean);
          setDeviceCheck(response.data);
        } catch (error) {
          setDeviceCheck(null);
        } finally {
          setImeiChecking(false);
        }
      }
    } else {
      setImeiValid(clean.length > 0 ? false : null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imei || !validateIMEI(formData.imei)) {
      toast.error('IMEI inválido — deve ter 15 dígitos válidos');
      return;
    }
    if (!formData.model) {
      toast.error('Selecione o modelo do iPhone');
      return;
    }
    setSubmitting(true);
    try {
      await devicesApi.create(formData);
      toast.success('Dispositivo registado com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao registar dispositivo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Novo Dispositivo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* IMEI */}
          <div>
            <label className="block text-sm font-medium mb-2">
              IMEI *
              <span className="text-gray-500 font-normal ml-2">(15 dígitos — disque *#06#)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.imei}
                onChange={(e) => handleIMEIChange(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-xl focus:ring-2 outline-none font-mono tracking-wider ${
                  imeiValid === true ? 'border-green-600 focus:ring-green-500' :
                  imeiValid === false ? 'border-red-600 focus:ring-red-500' :
                  'border-gray-700 focus:ring-green-500'
                }`}
                placeholder="000000000000000"
                maxLength={15}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {imeiChecking ? (
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                ) : imeiValid === true ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : imeiValid === false ? (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                ) : null}
              </div>
            </div>
            {imeiValid === false && formData.imei.length === 15 && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> IMEI inválido — verifique os dígitos
              </p>
            )}
            {deviceCheck && (
              <div className="mt-2 p-3 bg-gray-800 rounded-lg space-y-1">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> {deviceCheck.brand || 'Apple'}
                  {deviceCheck.model_hint ? ` — ${deviceCheck.model_hint}` : ''}
                </p>
                {deviceCheck.carrier && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Operadora: {deviceCheck.carrier}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium mb-2">Modelo *</label>
            <select
              value={formData.model}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              required
            >
              <option value="">Selecionar modelo...</option>
              {IPHONE_MODELS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Serial */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Nº de Série
                <span className="text-gray-500 font-normal ml-2">(opcional)</span>
              </label>
              <input
                type="text"
                value={formData.serial}
                onChange={(e) => setFormData({...formData, serial: e.target.value.toUpperCase()})}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono"
                placeholder="ABC123XYZ"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Palette className="w-4 h-4 inline mr-1" />
                Cor
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Preto, Branco, Azul..."
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Estado do Dispositivo</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="unknown">Desconhecido</option>
              <option value="active">Ativo / Funcional</option>
              <option value="locked">Bloqueado (iCloud ativo)</option>
              <option value="clean">Limpo (pronto para usar)</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notas do Técnico</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none"
              rows={2}
              placeholder="Observações sobre o dispositivo..."
            />
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-medium">Dica profissional</p>
              <p className="text-xs text-blue-400/70 mt-1">
                O IMEI está em Ajustes {'>'} Geral {'>'} Sobre ou pode ser obtido discando *#06# no telefone.
                O número de série está na mesma tela ou gravado na parte traseira do iPhone.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-gray-600 hover:border-gray-500 rounded-xl font-medium transition-all">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              {submitting ? 'Registando...' : (
                <><Hash className="w-4 h-4" /> Registar Dispositivo</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeviceDetailModal = ({ device, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{device.model || 'Dispositivo'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      <div className="space-y-4">
        <DetailRow icon={<Hash className="w-4 h-4" />} label="IMEI" value={device.imei || '-'} mono />
        <DetailRow icon={<Cpu className="w-4 h-4" />} label="Nº de Série" value={device.serial || '-'} mono />
        <DetailRow icon={<Smartphone className="w-4 h-4" />} label="Modelo" value={device.model || '-'} />
        <DetailRow icon={<Palette className="w-4 h-4" />} label="Cor" value={device.color || '-'} />
        <DetailRow icon={<AlertCircle className="w-4 h-4" />} label="Estado" value={
          device.status === 'active' ? 'Ativo / Funcional' :
          device.status === 'locked' ? 'Bloqueado (iCloud)' :
          device.status === 'clean' ? 'Limpo / Pronto' : 'Desconhecido'
        } />
        {device.notes && <DetailRow icon={<Info className="w-4 h-4" />} label="Notas" value={device.notes} />}
        {device.createdAt && (
          <DetailRow icon={<Info className="w-4 h-4" />} label="Registado em" value={new Date(device.createdAt).toLocaleString('pt-BR')} />
        )}
      </div>
    </div>
  </div>
);

const DetailRow = ({ icon, label, value, mono }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
    <div className="text-gray-400 mt-0.5">{icon}</div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-medium ${mono ? 'font-mono tracking-wider' : ''}`}>{value}</p>
    </div>
  </div>
);

export default DeviceRegistration;

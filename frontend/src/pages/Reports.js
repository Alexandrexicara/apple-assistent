import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Printer, FileText, Shield, CheckCircle } from 'lucide-react';
import { reportsApi } from '../services/api';
import toast from 'react-hot-toast';

const Reports = () => {
  const [searchParams] = useSearchParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState(searchParams.get('orderId') || '');
  const [searchClientId, setSearchClientId] = useState('');
  const [clientReports, setClientReports] = useState([]);
  const [mode, setMode] = useState('order'); // 'order' | 'client'

  const loadReportByOrder = useCallback(async (orderId) => {
    if (!orderId) return;
    setLoading(true);
    try {
      const response = await reportsApi.getByOrder(orderId);
      setReport(response.data.report || response.data);
      setClientReports([]);
    } catch (error) {
      // Dados mock para preview
      setReport(generateMockReport(orderId));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReportsByClient = useCallback(async (clientId) => {
    if (!clientId) return;
    setLoading(true);
    try {
      const response = await reportsApi.getByClient(clientId);
      setClientReports(response.data.reports || []);
      setReport(null);
    } catch (error) {
      setClientReports([]);
      toast.error('Cliente não encontrado ou sem histórico');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      setSearchOrderId(orderId);
      setMode('order');
      loadReportByOrder(orderId);
    }
  }, [searchParams, loadReportByOrder]);

  const handleSearchOrder = (e) => {
    e.preventDefault();
    loadReportByOrder(searchOrderId);
  };

  const handleSearchClient = (e) => {
    e.preventDefault();
    loadReportsByClient(searchClientId);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Relatórios de Serviço</h1>
        <p className="text-gray-400">Relatórios profissionais para documentação legal</p>
      </div>

      {/* Search Section - no-print */}
      <div className="no-print mb-8">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setMode('order'); setReport(null); setClientReports([]); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${mode === 'order' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            Por OS
          </button>
          <button
            onClick={() => { setMode('client'); setReport(null); setClientReports([]); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${mode === 'client' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            Por Cliente
          </button>
        </div>

        {mode === 'order' ? (
          <form onSubmit={handleSearchOrder} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="ID da Ordem de Serviço..."
              />
            </div>
            <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-all">
              Buscar
            </button>
          </form>
        ) : (
          <form onSubmit={handleSearchClient} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchClientId}
                onChange={(e) => setSearchClientId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="ID do Cliente..."
              />
            </div>
            <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-all">
              Buscar
            </button>
          </form>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Single Report View */}
      {report && !loading && (
        <>
          {/* Print Button */}
          <div className="no-print flex justify-end mb-4">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all"
            >
              <Printer className="w-4 h-4" />
              Imprimir Relatório
            </button>
          </div>

          {/* Report Content */}
          <div className="print-area">
            <ProfessionalReport data={report} />
          </div>
        </>
      )}

      {/* Client Reports List */}
      {clientReports.length > 0 && !loading && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Histórico de Serviços ({clientReports.length})
          </h2>
          {clientReports.map((r) => (
            <div
              key={r.id}
              onClick={() => loadReportByOrder(r.id)}
              className="p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    r.status === 'completed' ? 'bg-green-500/20' :
                    r.status === 'delivered' ? 'bg-blue-500/20' : 'bg-gray-500/20'
                  }`}>
                    <CheckCircle className={`w-5 h-5 ${
                      r.status === 'completed' ? 'text-green-400' :
                      r.status === 'delivered' ? 'text-blue-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold">{r.serviceTypeLabel || r.serviceType}</p>
                    <p className="text-sm text-gray-400">{r.deviceModel} — IMEI: {String(r.deviceImei || '').slice(-4)}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString('pt-BR') : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!report && clientReports.length === 0 && !loading && (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold mb-2">Nenhum relatório</h3>
          <p className="text-gray-400">Pesquise por uma Ordem de Serviço ou Cliente para ver o relatório</p>
        </div>
      )}
    </div>
  );
};

/* ============================================
   Professional Report Layout
   ============================================ */
const ProfessionalReport = ({ data }) => {
  const {
    id, clientName, clientPhone, clientDocument, clientAddress,
    deviceModel, deviceImei, deviceSerial,
    serviceType, serviceTypeLabel, technicianName,
    createdAt, completedAt, status,
  } = data;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try { return new Date(dateStr).toLocaleString('pt-BR'); }
    catch { return dateStr; }
  };

  const formatIMEI = (imei) => {
    if (!imei) return '-';
    const s = String(imei);
    return `${s.slice(0,6)} ${s.slice(6,8)} ${s.slice(8,14)} ${s.slice(14)}`;
  };

  const statusLabel = status === 'completed' ? 'CONCLUÍDO' :
    status === 'delivered' ? 'ENTREGUE' :
    status === 'in_progress' ? 'EM ANDAMENTO' : 'PENDENTE';

  return (
    <div className="bg-white text-black rounded-none">
      {/* Cabeçalho */}
      <div className="print-header text-center border-b-2 border-double border-black pb-6 mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Shield className="w-8 h-8 text-black" />
        </div>
        <h1 className="text-xl font-bold uppercase tracking-wide">Apple ID Assistant</h1>
        <p className="print-subtitle text-lg font-semibold mt-2">Relatório de Serviço Profissional</p>
        <p className="print-subtitle text-sm mt-1">OS #{String(id).slice(0, 8).toUpperCase()}</p>
      </div>

      {/* Dados do Cliente */}
      <div className="print-section mb-6">
        <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">Dados do Cliente</h3>
        <table className="print-table w-full">
          <tbody>
            <tr>
              <td className="font-semibold w-1/4">Nome:</td>
              <td>{clientName || '-'}</td>
            </tr>
            <tr>
              <td className="font-semibold">Telefone:</td>
              <td>{clientPhone || '-'}</td>
            </tr>
            {clientDocument && (
              <tr>
                <td className="font-semibold">Documento:</td>
                <td>{clientDocument}</td>
              </tr>
            )}
            {clientAddress && (
              <tr>
                <td className="font-semibold">Morada:</td>
                <td>{clientAddress}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dados do Dispositivo */}
      <div className="print-section mb-6">
        <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">Dados do Dispositivo</h3>
        <table className="print-table w-full">
          <tbody>
            <tr>
              <td className="font-semibold w-1/4">Modelo:</td>
              <td>{deviceModel || '-'}</td>
            </tr>
            <tr>
              <td className="font-semibold">IMEI:</td>
              <td className="font-mono">{formatIMEI(deviceImei)}</td>
            </tr>
            {deviceSerial && (
              <tr>
                <td className="font-semibold">Nº Série:</td>
                <td className="font-mono">{deviceSerial}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dados do Serviço */}
      <div className="print-section mb-6">
        <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">Dados do Serviço</h3>
        <table className="print-table w-full">
          <tbody>
            <tr>
              <td className="font-semibold w-1/4">Serviço:</td>
              <td>{serviceTypeLabel || serviceType || '-'}</td>
            </tr>
            <tr>
              <td className="font-semibold">Técnico:</td>
              <td>{technicianName || '-'}</td>
            </tr>
            <tr>
              <td className="font-semibold">Data:</td>
              <td>{formatDate(createdAt)}</td>
            </tr>
            {completedAt && (
              <tr>
                <td className="font-semibold">Conclusão:</td>
                <td>{formatDate(completedAt)}</td>
              </tr>
            )}
            <tr>
              <td className="font-semibold">Status:</td>
              <td className="font-bold">{statusLabel}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Checklist do Serviço */}
      <div className="print-section mb-6">
        <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">Checklist de Verificação</h3>
        <table className="print-table w-full">
          <thead>
            <tr>
              <th className="w-8 text-center">✓</th>
              <th>Item Verificado</th>
              <th className="w-24 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-center">☐</td>
              <td>Senha iCloud verificada e aceite</td>
              <td className="text-center font-bold">OK</td>
            </tr>
            <tr>
              <td className="text-center">☐</td>
              <td>Buscar iPhone (Find My) desativado</td>
              <td className="text-center font-bold">OK</td>
            </tr>
            <tr>
              <td className="text-center">☐</td>
              <td>Dispositivo apagado com sucesso</td>
              <td className="text-center font-bold">OK</td>
            </tr>
            <tr>
              <td className="text-center">☐</td>
              <td>Ecrã de Hello/Bem-vindo confirmado</td>
              <td className="text-center font-bold">OK</td>
            </tr>
            <tr>
              <td className="text-center">☐</td>
              <td>Dispositivo pronto para nova configuração</td>
              <td className="text-center font-bold">OK</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notas */}
      {data.notes && (
        <div className="print-section mb-6">
          <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">Observações</h3>
          <p className="text-sm">{data.notes}</p>
        </div>
      )}

      {/* Disclaimer Legal */}
      <div className="print-footer mt-8 pt-4 border-t border-black text-center">
        <p className="text-xs font-semibold mb-1">DECLARAÇÃO LEGAL</p>
        <p className="text-xs leading-relaxed">
          Este serviço foi realizado exclusivamente com a senha iCloud fornecida pelo legítimo proprietário do dispositivo,
          seguindo rigorosamente os procedimentos oficiais da Apple Inc. Não foi realizado nenhum tipo de bypass,
          desbloqueio ilegal, ou remoção não autorizada do iCloud. O técnico responsável certifica que todos os
          procedimentos foram executados de acordo com as diretrizes da Apple e legislação aplicável.
        </p>
        <p className="text-xs mt-2">
          Em conformidade com a Lei de Direitos Autorais do Milênio Digital (DMCA) e regulamentações locais.
        </p>
      </div>

      {/* Assinaturas */}
      <div className="print-signature flex justify-between mt-12 pt-4">
        <div className="w-[45%] text-center">
          <div className="border-t border-black pt-2">
            <p className="text-xs font-semibold">Assinatura do Técnico</p>
            <p className="text-xs text-gray-500 mt-1">{technicianName || '_________________'}</p>
          </div>
        </div>
        <div className="w-[45%] text-center">
          <div className="border-t border-black pt-2">
            <p className="text-xs font-semibold">Assinatura do Cliente</p>
            <p className="text-xs text-gray-500 mt-1">{clientName || '_________________'}</p>
          </div>
        </div>
      </div>

      {/* Data de Impressão */}
      <p className="text-center text-xs text-gray-500 mt-8">
        Documento gerado em {new Date().toLocaleString('pt-BR')} • Apple ID Assistant — Ferramenta Profissional Legal
      </p>
    </div>
  );
};

/* ============================================
   Mock Data Generator (Desenvolvimento)
   ============================================ */
const generateMockReport = (orderId) => ({
  id: orderId || 'OS-2026-0001',
  clientName: 'João Silva',
  clientPhone: '(11) 99999-9999',
  clientDocument: '***.123.456-**',
  clientAddress: 'Rua Exemplo, 123 — São Paulo/SP',
  deviceModel: 'iPhone 13 Pro Max',
  deviceImei: '123456789012345',
  deviceSerial: 'ABC123XYZ789',
  serviceType: 'reset-with-password',
  serviceTypeLabel: 'Reset com Senha iCloud',
  technicianName: 'Maria Santos',
  createdAt: new Date().toISOString(),
  completedAt: new Date(Date.now() - 300000).toISOString(),
  status: 'completed',
  notes: 'Cliente trouxe o dispositivo com a senha iCloud. Serviço realizado sem intercorrências. Dispositivo limpo e pronto para nova configuração.',
});

export default Reports;

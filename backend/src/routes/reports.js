/**
 * Reports Routes
 * ==============
 * Geracao de relatorios profissionais de servico
 */

const express = require('express');
const { param, validationResult } = require('express-validator');
const axios = require('axios');
const router = express.Router();

const CORE_ENGINE_URL = process.env.CORE_ENGINE_URL || 'http://localhost:8000';

// Middleware
const requireTechnician = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }
  const token = authHeader.substring(7);
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'technician' && decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Gerar relatorio de uma OS
router.get('/:orderId', [
  param('orderId').isUUID()
], requireTechnician, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Em producao: buscar dados da OS, cliente e dispositivo no banco
  // Mock para desenvolvimento
  const mockReport = {
    reportId: `RPT-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    title: 'Apple ID Assistant — Relatório de Serviço',
    disclaimer: 'Este serviço foi realizado seguindo os processos oficiais da Apple. Não realizamos bypass ou desbloqueio ilegal de iCloud.',
    client: {
      name: req.query.clientName || 'Nome do Cliente',
      phone: req.query.clientPhone || '(00) 00000-0000',
      document: req.query.clientDocument || '***.000.000-**',
      email: req.query.clientEmail || 'cliente@email.com'
    },
    device: {
      model: req.query.deviceModel || 'iPhone Modelo',
      imei: req.query.deviceImei || '000000000000000',
      serialNumber: req.query.deviceSerial || 'ABC123XYZ',
      color: req.query.deviceColor || 'Preto',
      condition: req.query.deviceCondition || 'Bom'
    },
    service: {
      type: req.query.serviceType || 'reset-with-password',
      status: 'completed',
      technician: req.user.name || req.user.email,
      date: new Date().toISOString(),
      stepsCompleted: [
        'Dispositivo identificado e registado',
        'Senha iCloud verificada',
        'Buscar iPhone desativado',
        'Dispositivo apagado com sucesso',
        'Ecrã de Boas-vindas confirmado'
      ],
      result: 'Dispositivo apagado e pronto para nova configuração',
      notes: 'Reset 100% legal. Sem bypass ou métodos não oficiais.'
    },
    signatures: {
      technician: '_________________________',
      client: '_________________________',
      date: new Date().toLocaleString('pt-BR')
    }
  };

  res.json({
    success: true,
    report: mockReport
  });
});

// Historico de servicos de um cliente
router.get('/client/:clientId', [
  param('clientId').isUUID()
], requireTechnician, (req, res) => {
  // Mock - em producao consultar banco de dados
  res.json({
    success: true,
    clientId: req.params.clientId,
    reports: [],
    totalServices: 0
  });
});

// Gerar relatorio em formato de impressao
router.post('/generate', requireTechnician, async (req, res) => {
  const { clientData, deviceData, serviceData } = req.body;

  if (!clientData || !deviceData || !serviceData) {
    return res.status(400).json({ error: 'Dados incompletos. Necessário: clientData, deviceData, serviceData' });
  }

  try {
    // Chamar Core Engine para gerar relatorio estruturado
    const response = await axios.post(`${CORE_ENGINE_URL}/api/service-report`, {
      client_data: clientData,
      device_data: deviceData,
      service_data: serviceData
    });

    res.json({
      success: true,
      report: response.data
    });
  } catch (error) {
    // Fallback se Core Engine nao estiver disponivel
    res.json({
      success: true,
      report: {
        reportId: `RPT-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        title: 'Apple ID Assistant — Relatório de Serviço',
        disclaimer: 'Este serviço foi realizado seguindo os processos oficiais da Apple.',
        client: clientData,
        device: deviceData,
        service: {
          ...serviceData,
          technician: req.user.name || req.user.email,
          date: new Date().toISOString()
        },
        signatures: {
          technician: '_________________________',
          client: '_________________________',
          date: new Date().toLocaleString('pt-BR')
        }
      }
    });
  }
});

module.exports = router;

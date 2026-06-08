/**
 * Technician Routes
 * =================
 * Rotas do painel do tecnico
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const router = express.Router();

const CORE_ENGINE_URL = process.env.CORE_ENGINE_URL || 'http://localhost:8000';

// Middleware de autenticacao para tecnico/admin
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
      return res.status(403).json({ error: 'Acesso restrito a técnicos e administradores' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Dashboard do tecnico
router.get('/dashboard', requireTechnician, (req, res) => {
  // Mock - em producao, consultar base de dados
  res.json({
    success: true,
    dashboard: {
      totalClients: 0,
      totalDevices: 0,
      activeOrders: 0,
      completedToday: 0,
      recentOrders: []
    }
  });
});

// Estatisticas do tecnico
router.get('/stats', requireTechnician, async (req, res) => {
  try {
    const coreStats = await axios.get(`${CORE_ENGINE_URL}/api/stats`);
    
    res.json({
      success: true,
      stats: {
        coreEngine: coreStats.data,
        technician: {
          name: req.user.name || req.user.email,
          role: req.user.role
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      stats: {
        coreEngine: { total_sessions: 0, active_sessions: 0 },
        technician: { name: req.user.name || req.user.email, role: req.user.role },
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Iniciar fluxo de reset com senha
router.post('/reset-flow', [
  body('imei').isLength({ min: 14, max: 17 }),
  body('hasPassword').isBoolean(),
  body('findMyStatus').optional().isIn(['on', 'off', 'unknown'])
], requireTechnician, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { imei, hasPassword, findMyStatus = 'unknown' } = req.body;

  try {
    // Verificar dispositivo no Core Engine
    const deviceCheck = await axios.post(`${CORE_ENGINE_URL}/api/devices/check`, { imei });
    
    // Verificar elegibilidade
    const eligibility = await axios.post(`${CORE_ENGINE_URL}/api/devices/reset-eligibility`, {
      has_password: hasPassword,
      find_my_status: findMyStatus
    });

    res.json({
      success: true,
      device: deviceCheck.data,
      eligibility: eligibility.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao iniciar fluxo de reset',
      details: error.message
    });
  }
});

// Guia de reset passo a passo
router.get('/reset-guide/:type', requireTechnician, (req, res) => {
  const guides = {
    'reset-with-password': {
      title: 'Reset Profissional com Senha iCloud',
      estimatedTime: '5-10 minutos',
      legalNotice: 'Processo 100% legal seguindo procedimentos oficiais da Apple.',
      steps: [
        { order: 1, title: 'Acessar Ajustes', description: 'Abra o app Ajustes no iPhone', detail: 'Toque no nome do proprietário no topo da tela' },
        { order: 2, title: 'Sair da conta iCloud', description: 'Role para baixo e toque em Sair (Sign Out)', detail: 'Será solicitada a senha do iCloud para desativar o Buscar iPhone' },
        { order: 3, title: 'Digitar senha do iCloud', description: 'Digite a senha do iCloud do cliente', detail: 'Isto desativará o Buscar iPhone e removerá a conta do dispositivo' },
        { order: 4, title: 'Aguardar remoção', description: 'Aguarde o dispositivo processar a saída', detail: 'Pode demorar 1-2 minutos dependendo dos dados' },
        { order: 5, title: 'Apagar conteúdo', description: 'Acesse Ajustes > Geral > Transferir ou Redefinir', detail: 'Toque em "Apagar Conteúdo e Ajustes"' },
        { order: 6, title: 'Confirmar', description: 'Confirme a ação e digite o código do dispositivo', detail: 'O iPhone irá reiniciar e mostrar o ecrã de Boas-vindas' },
        { order: 7, title: 'Verificar ecrã Hello', description: 'Confirme que o iPhone mostra o ecrã de configuração inicial', detail: 'Dispositivo pronto para nova configuração' }
      ],
      tips: [
        'Certifique-se de que o cliente tem backup dos dados',
        'O dispositivo precisa de bateria suficiente (mínimo 20%)',
        'Tenha a senha do iCloud confirmada ANTES de iniciar',
        'Se o Find My não desativar, verifique a senha'
      ]
    },
    'forgot-password': {
      title: 'Recuperação de Senha Esquecida',
      estimatedTime: '15-30 minutos',
      steps: [
        { order: 1, title: 'Acessar iforgot.apple.com', description: 'Abra o site oficial no navegador' },
        { order: 2, title: 'Digitar Apple ID', description: 'Informe o e-mail do Apple ID' },
        { order: 3, title: 'Verificar identidade', description: 'Escolha método de recuperação (e-mail/SMS)' },
        { order: 4, title: 'Redefinir senha', description: 'Crie nova senha forte' }
      ]
    }
  };

  const guide = guides[req.params.type];
  if (!guide) {
    return res.status(404).json({ error: 'Guia não encontrado', availableTypes: Object.keys(guides) });
  }

  res.json({ success: true, guide });
});

module.exports = router;

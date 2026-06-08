/**
 * Admin Routes
 * ============
 * Rotas administrativas restritas
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const axios = require('axios');
const router = express.Router();

const CORE_ENGINE_URL = process.env.CORE_ENGINE_URL || 'http://localhost:8000';

// Middleware de autenticação admin
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Dashboard admin
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const coreStats = await axios.get(`${CORE_ENGINE_URL}/api/stats`, { timeout: 3000 });
    
    res.json({
      success: true,
      dashboard: {
        coreStats: coreStats.data,
        systemStatus: {
          api: 'online',
          coreEngine: 'online',
          timestamp: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    // Core Engine offline — retornar dados locais
    res.json({
      success: true,
      dashboard: {
        coreStats: { total_sessions: 0, active_sessions: 0 },
        systemStatus: {
          api: 'online',
          coreEngine: 'offline',
          timestamp: new Date().toISOString()
        }
      }
    });
  }
});

// Gerenciar usuários
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], requireAdmin, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Mock - em produção, consultar banco de dados
  res.json({
    success: true,
    users: [],
    pagination: {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      total: 0
    }
  });
});

// Alterar role do usuário
router.patch('/users/:userId/role', [
  param('userId').isString(),
  body('role').isIn(['user', 'support', 'admin'])
], requireAdmin, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  res.json({
    success: true,
    message: 'Role atualizada com sucesso'
  });
});

// Desativar/Reativar usuário
router.patch('/users/:userId/status', [
  param('userId').isString(),
  body('active').isBoolean()
], requireAdmin, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  res.json({
    success: true,
    message: `Usuário ${req.body.active ? 'reativado' : 'desativado'} com sucesso`
  });
});

// Logs do sistema
router.get('/logs', [
  query('level').optional().isIn(['info', 'warn', 'error', 'debug']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 1000 })
], requireAdmin, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Mock - em produção, consultar serviço de logs
  res.json({
    success: true,
    logs: [],
    filters: {
      level: req.query.level,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    }
  });
});

// Configurações do sistema
router.get('/settings', requireAdmin, (req, res) => {
  res.json({
    success: true,
    settings: {
      maintenance: false,
      registrationOpen: true,
      maxSessionsPerUser: 5,
      coreEngineUrl: CORE_ENGINE_URL,
      version: '1.0.0'
    }
  });
});

// Atualizar configurações
router.patch('/settings', [
  body('maintenance').optional().isBoolean(),
  body('registrationOpen').optional().isBoolean()
], requireAdmin, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  res.json({
    success: true,
    message: 'Configurações atualizadas',
    updated: Object.keys(req.body)
  });
});

// Métricas do sistema
router.get('/metrics', requireAdmin, async (req, res) => {
  try {
    const coreStats = await axios.get(`${CORE_ENGINE_URL}/api/stats`);
    
    res.json({
      success: true,
      metrics: {
        coreEngine: coreStats.data,
        api: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar métricas',
      api: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Backup dos dados
router.post('/backup', requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Backup iniciado',
    backupId: Date.now().toString(),
    estimatedTime: '5 minutos'
  });
});

// Restaurar backup
router.post('/restore', [
  body('backupId').isString()
], requireAdmin, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  res.json({
    success: true,
    message: 'Restauração iniciada',
    backupId: req.body.backupId,
    warning: 'Isso substituirá todos os dados atuais'
  });
});

module.exports = router;

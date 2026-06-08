/**
 * Sessions Routes
 * ===============
 * Gerenciamento de sessões de recuperação
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Core Engine URL
const CORE_ENGINE_URL = process.env.CORE_ENGINE_URL || 'http://localhost:8000';

// Mock storage (substituir por Redis/DB)
const sessions = new Map();

// Middleware de autenticação
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Criar nova sessão (sem depender do Core Engine)
router.post('/', [
  body('email').optional().isEmail(),
  body('problemType').optional().isIn([
    'forgot-password', 
    'two-factor', 
    'activation-lock', 
    'account-locked',
    'device-used',
    'reset-with-password'
  ])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const sessionId = uuidv4();
    
    const sessionData = {
      session_id: sessionId,
      userEmail: req.body.email || null,
      problemType: req.body.problemType || null,
      status: 'created',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Tentar Core Engine (modo offline se indisponível)
    try {
      const response = await axios.post(`${CORE_ENGINE_URL}/api/sessions`, {
        email: req.body.email || null
      }, { timeout: 3000 });
      Object.assign(sessionData, response.data);
    } catch (ceError) {
      // Core Engine offline — usar dados locais
    }
    
    sessions.set(sessionId, sessionData);
    
    res.status(201).json({
      success: true,
      session: {
        id: sessionData.session_id,
        status: sessionData.status,
        createdAt: sessionData.createdAt
      }
    });
    
  } catch (error) {
    console.error('Erro ao criar sessão:', error.message);
    res.status(500).json({ 
      error: 'Erro ao criar sessão',
      details: error.message 
    });
  }
});

// Obter sessão
router.get('/:sessionId', [
  param('sessionId').isUUID()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { sessionId } = req.params;
  
  try {
    // Consultar Core Engine
    const response = await axios.get(`${CORE_ENGINE_URL}/api/sessions/${sessionId}`);
    
    res.json({
      success: true,
      session: response.data
    });
    
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }
    
    res.status(500).json({ 
      error: 'Erro ao buscar sessão',
      details: error.message 
    });
  }
});

// Atualizar sessão
router.patch('/:sessionId', [
  param('sessionId').isUUID(),
  body('email').optional().isEmail(),
  body('problemType').optional().isString(),
  body('status').optional().isString()
], authenticate, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Sessão não encontrada' });
  }
  
  // Atualizar campos permitidos
  const allowedUpdates = ['email', 'problemType', 'status', 'notes'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      session[field] = req.body[field];
    }
  });
  
  session.updatedAt = new Date();
  sessions.set(sessionId, session);
  
  res.json({
    success: true,
    session: {
      id: sessionId,
      ...session
    }
  });
});

// Registrar consentimento (com fallback offline)
router.post('/:sessionId/consent', [
  param('sessionId').isUUID(),
  body('consentGiven').isBoolean(),
  body('userAgent').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { sessionId } = req.params;
  const { consentGiven, userAgent } = req.body;
  
  // Atualizar sessão local
  const session = sessions.get(sessionId);
  if (session) {
    session.consentGiven = consentGiven;
    session.consentId = `consent-${Date.now()}`;
    session.consentAt = new Date();
    session.status = 'consent_given';
    session.updatedAt = new Date();
    sessions.set(sessionId, session);
  }
  
  // Tentar Core Engine
  try {
    const response = await axios.post(`${CORE_ENGINE_URL}/api/consent`, {
      session_id: sessionId,
      email: req.body.email || null,
      consent_given: consentGiven,
      user_agent: userAgent
    }, { timeout: 3000 });
    
    if (session) {
      session.consentId = response.data.consent_id;
      sessions.set(sessionId, session);
    }
    
    res.json({ success: true, consent: response.data });
  } catch (error) {
    // Fallback offline
    res.json({
      success: true,
      consent: {
        consent_id: session?.consentId || `consent-${Date.now()}`,
        status: 'recorded',
        offline: true
      }
    });
  }
});

// Listar sessões
router.get('/', authenticate, async (req, res) => {
  const sessionList = Array.from(sessions.values()).map(s => ({
    id: s.session_id,
    status: s.status,
    createdAt: s.createdAt,
    problemType: s.problemType,
    userEmail: s.userEmail
  }));
  
  res.json({
    success: true,
    count: sessionList.length,
    sessions: sessionList
  });
});

// Estatísticas (responde offline se Core Engine indisponível)
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const response = await axios.get(`${CORE_ENGINE_URL}/api/stats`, { timeout: 3000 });
    res.json({ success: true, stats: response.data });
  } catch (error) {
    // Fallback offline
    res.json({
      success: true,
      stats: {
        total_sessions: sessions.size,
        active_sessions: 0,
        completed_sessions: 0,
        problems_by_type: {},
        status: 'offline'
      }
    });
  }
});

module.exports = router;

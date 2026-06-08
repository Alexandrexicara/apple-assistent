/**
 * Users Routes
 * ============
 * Rotas de perfil e gestão de usuários
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const router = express.Router();

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

// Mock storage
const users = new Map();

// Perfil do usuário logado
router.get('/profile', authenticate, (req, res) => {
  const user = users.get(req.user.email);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || null
    }
  });
});

// Atualizar perfil
router.patch('/profile', authenticate, [
  body('name').optional().isLength({ min: 2 }),
  body('email').optional().isEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const user = users.get(req.user.email);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  // Atualizar campos permitidos
  if (req.body.name) {
    user.name = req.body.name;
  }
  
  user.updatedAt = new Date();
  users.set(user.email, user);
  
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      updatedAt: user.updatedAt
    }
  });
});

// Alterar senha
router.post('/change-password', authenticate, [
  body('currentPassword').exists(),
  body('newPassword').isLength({ min: 8 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { currentPassword, newPassword } = req.body;
  const user = users.get(req.user.email);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  // Verificar senha atual
  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Senha atual incorreta' });
  }
  
  // Hash nova senha
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.updatedAt = new Date();
  
  users.set(user.email, user);
  
  res.json({
    success: true,
    message: 'Senha alterada com sucesso'
  });
});

// Histórico de atividades
router.get('/activity', authenticate, (req, res) => {
  // Mock - em produção, consultar logs
  res.json({
    success: true,
    activities: [
      {
        type: 'login',
        timestamp: new Date(Date.now() - 86400000),
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      }
    ]
  });
});

// Sessões ativas
router.get('/sessions', authenticate, (req, res) => {
  // Mock - em produção, consultar Redis/sessões
  res.json({
    success: true,
    sessions: [
      {
        id: 'current',
        device: 'Windows PC',
        location: 'São Paulo, BR',
        lastActive: new Date(),
        isCurrent: true
      }
    ]
  });
});

// Encerrar sessão específica
router.delete('/sessions/:sessionId', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Sessão encerrada'
  });
});

module.exports = router;

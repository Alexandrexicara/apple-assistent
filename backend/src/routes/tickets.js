/**
 * Tickets Routes
 * ==============
 * Sistema de tickets de suporte
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Mock storage
const tickets = new Map();

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

// Status dos tickets
const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_USER: 'waiting_user',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

// Prioridades
const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Criar ticket
router.post('/', [
  body('subject').isLength({ min: 5, max: 200 }),
  body('description').isLength({ min: 10 }),
  body('category').isIn(['password', 'icloud', 'device', 'account', 'other']),
  body('priority').optional().isIn(Object.values(PRIORITIES)),
  body('sessionId').optional().isUUID()
], authenticate, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { subject, description, category, priority = 'medium', sessionId } = req.body;
  
  const ticket = {
    id: uuidv4(),
    subject,
    description,
    category,
    priority,
    status: TICKET_STATUS.OPEN,
    createdBy: req.user.email,
    sessionId: sessionId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [{
      id: uuidv4(),
      from: 'user',
      author: req.user.email,
      content: description,
      timestamp: new Date()
    }],
    assignedTo: null,
    resolution: null
  };
  
  tickets.set(ticket.id, ticket);
  
  res.status(201).json({
    success: true,
    ticket: {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt
    }
  });
});

// Listar tickets do usuário
router.get('/my', authenticate, (req, res) => {
  const userTickets = Array.from(tickets.values())
    .filter(t => t.createdBy === req.user.email)
    .map(t => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      category: t.category,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
  
  res.json({
    success: true,
    count: userTickets.length,
    tickets: userTickets
  });
});

// Obter ticket específico
router.get('/:ticketId', [
  param('ticketId').isUUID()
], authenticate, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { ticketId } = req.params;
  const ticket = tickets.get(ticketId);
  
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket não encontrado' });
  }
  
  // Verificar permissão
  if (ticket.createdBy !== req.user.email && req.user.role !== 'admin' && req.user.role !== 'support') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  res.json({
    success: true,
    ticket
  });
});

// Adicionar mensagem ao ticket
router.post('/:ticketId/messages', [
  param('ticketId').isUUID(),
  body('content').isLength({ min: 1 })
], authenticate, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { ticketId } = req.params;
  const { content } = req.body;
  
  const ticket = tickets.get(ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket não encontrado' });
  }
  
  // Verificar permissão
  if (ticket.createdBy !== req.user.email && req.user.role !== 'admin' && req.user.role !== 'support') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  const message = {
    id: uuidv4(),
    from: ticket.createdBy === req.user.email ? 'user' : 'support',
    author: req.user.email,
    content,
    timestamp: new Date()
  };
  
  ticket.messages.push(message);
  ticket.updatedAt = new Date();
  
  // Atualizar status se necessário
  if (ticket.status === TICKET_STATUS.WAITING_USER) {
    ticket.status = TICKET_STATUS.IN_PROGRESS;
  }
  
  tickets.set(ticketId, ticket);
  
  res.json({
    success: true,
    message
  });
});

// Atualizar status do ticket (admin/support)
router.patch('/:ticketId/status', [
  param('ticketId').isUUID(),
  body('status').isIn(Object.values(TICKET_STATUS)),
  body('resolution').optional().isString()
], authenticate, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Verificar permissão
  if (req.user.role !== 'admin' && req.user.role !== 'support') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  const { ticketId } = req.params;
  const { status, resolution } = req.body;
  
  const ticket = tickets.get(ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket não encontrado' });
  }
  
  const oldStatus = ticket.status;
  ticket.status = status;
  ticket.updatedAt = new Date();
  
  if (resolution) {
    ticket.resolution = resolution;
  }
  
  // Adicionar mensagem de sistema
  ticket.messages.push({
    id: uuidv4(),
    from: 'system',
    author: 'Sistema',
    content: `Status atualizado de "${oldStatus}" para "${status}" por ${req.user.email}`,
    timestamp: new Date()
  });
  
  tickets.set(ticketId, ticket);
  
  res.json({
    success: true,
    ticket: {
      id: ticket.id,
      status: ticket.status,
      updatedAt: ticket.updatedAt
    }
  });
});

// Listar todos os tickets (admin)
router.get('/', [
  query('status').optional().isIn(Object.values(TICKET_STATUS)),
  query('priority').optional().isIn(Object.values(PRIORITIES)),
  query('category').optional().isString()
], authenticate, (req, res) => {
  // Verificar permissão
  if (req.user.role !== 'admin' && req.user.role !== 'support') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  let ticketList = Array.from(tickets.values());
  
  // Filtros
  if (req.query.status) {
    ticketList = ticketList.filter(t => t.status === req.query.status);
  }
  if (req.query.priority) {
    ticketList = ticketList.filter(t => t.priority === req.query.priority);
  }
  if (req.query.category) {
    ticketList = ticketList.filter(t => t.category === req.query.category);
  }
  
  // Ordenação
  ticketList.sort((a, b) => {
    // Prioridade primeiro
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // Depois data
    return b.createdAt - a.createdAt;
  });
  
  const formatted = ticketList.map(t => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    category: t.category,
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    messageCount: t.messages.length
  }));
  
  res.json({
    success: true,
    count: formatted.length,
    tickets: formatted
  });
});

// Estatísticas de tickets
router.get('/stats/overview', authenticate, (req, res) => {
  const allTickets = Array.from(tickets.values());
  
  const stats = {
    total: allTickets.length,
    byStatus: {},
    byPriority: {},
    byCategory: {},
    averageResolution: null
  };
  
  allTickets.forEach(t => {
    stats.byStatus[t.status] = (stats.byStatus[t.status] || 0) + 1;
    stats.byPriority[t.priority] = (stats.byPriority[t.priority] || 0) + 1;
    stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + 1;
  });
  
  res.json({
    success: true,
    stats
  });
});

module.exports = router;

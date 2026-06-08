/**
 * Clients Routes
 * ==============
 * Gestao de clientes
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Mock storage
const clients = new Map();

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
      return res.status(403).json({ error: 'Acesso restrito' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Listar clientes
router.get('/', [
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], requireTechnician, (req, res) => {
  let clientList = Array.from(clients.values());
  
  // Busca por nome ou telefone
  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    clientList = clientList.filter(c => 
      c.name.toLowerCase().includes(search) || 
      (c.phone && c.phone.includes(search))
    );
  }
  
  // Ordenacao por data de criacao (mais recente primeiro)
  clientList.sort((a, b) => b.createdAt - a.createdAt);
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  const paginated = clientList.slice(start, start + limit);
  
  res.json({
    success: true,
    count: clientList.length,
    page,
    limit,
    clients: paginated.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      document: c.document,
      createdAt: c.createdAt
    }))
  });
});

// Obter cliente por ID
router.get('/:clientId', [
  param('clientId').isUUID()
], requireTechnician, (req, res) => {
  const { clientId } = req.params;
  const client = clients.get(clientId);
  
  if (!client) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }
  
  res.json({
    success: true,
    client: {
      ...client,
      devices: client.devices || [],
      serviceHistory: client.serviceHistory || []
    }
  });
});

// Criar novo cliente
router.post('/', [
  body('name').isLength({ min: 2, max: 255 }).withMessage('Nome deve ter entre 2 e 255 caracteres'),
  body('phone').optional().isString(),
  body('email').optional().isEmail(),
  body('document').optional().isString(),
  body('address').optional().isString(),
  body('notes').optional().isString()
], requireTechnician, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, phone, email, document, address, notes } = req.body;

  const client = {
    id: uuidv4(),
    name,
    phone: phone || null,
    email: email || null,
    document: document || null,
    address: address || null,
    notes: notes || null,
    technicianId: req.user.userId,
    devices: [],
    serviceHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  clients.set(client.id, client);

  res.status(201).json({
    success: true,
    client: {
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      createdAt: client.createdAt
    }
  });
});

// Atualizar cliente
router.patch('/:clientId', [
  param('clientId').isUUID(),
  body('name').optional().isLength({ min: 2 }),
  body('phone').optional().isString(),
  body('email').optional().isEmail(),
  body('document').optional().isString(),
  body('address').optional().isString(),
  body('notes').optional().isString()
], requireTechnician, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { clientId } = req.params;
  const client = clients.get(clientId);
  
  if (!client) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }

  const allowedUpdates = ['name', 'phone', 'email', 'document', 'address', 'notes'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      client[field] = req.body[field];
    }
  });
  
  client.updatedAt = new Date();
  clients.set(clientId, client);

  res.json({
    success: true,
    client: {
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      updatedAt: client.updatedAt
    }
  });
});

module.exports = router;

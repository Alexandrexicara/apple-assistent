/**
 * Service Orders Routes
 * =====================
 * Ordens de servico
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Mock storage
const serviceOrders = new Map();

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

const ORDER_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

const SERVICE_TYPES = [
  'reset-with-password',
  'forgot-password',
  'two-factor',
  'activation-lock',
  'account-locked',
  'device-used',
  'screen-repair',
  'battery-replacement',
  'other'
];

// Listar ordens de servico
router.get('/', [
  query('status').optional().isIn(Object.values(ORDER_STATUS)),
  query('clientId').optional().isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], requireTechnician, (req, res) => {
  let orderList = Array.from(serviceOrders.values());

  if (req.query.status) {
    orderList = orderList.filter(o => o.status === req.query.status);
  }
  if (req.query.clientId) {
    orderList = orderList.filter(o => o.clientId === req.query.clientId);
  }

  orderList.sort((a, b) => b.createdAt - a.createdAt);

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  const paginated = orderList.slice(start, start + limit);

  res.json({
    success: true,
    count: orderList.length,
    page,
    limit,
    orders: paginated.map(o => ({
      id: o.id,
      clientId: o.clientId,
      clientName: o.clientName,
      deviceModel: o.deviceModel,
      serviceType: o.serviceType,
      status: o.status,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt
    }))
  });
});

// Obter OS por ID
router.get('/:orderId', [
  param('orderId').isUUID()
], requireTechnician, (req, res) => {
  const order = serviceOrders.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
  }

  res.json({ success: true, order });
});

// Criar nova OS
router.post('/', [
  body('clientId').isUUID().withMessage('Cliente é obrigatório'),
  body('clientName').isString().notEmpty(),
  body('deviceId').optional().isUUID(),
  body('deviceModel').optional().isString(),
  body('deviceImei').optional().isString(),
  body('serviceType').isIn(SERVICE_TYPES).withMessage('Tipo de serviço inválido'),
  body('notes').optional().isString()
], requireTechnician, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    clientId, clientName, deviceId, deviceModel, deviceImei, serviceType, notes
  } = req.body;

  const order = {
    id: uuidv4(),
    clientId,
    clientName,
    deviceId: deviceId || null,
    deviceModel: deviceModel || null,
    deviceImei: deviceImei || null,
    serviceType,
    status: ORDER_STATUS.PENDING,
    technicianId: req.user.userId,
    technicianName: req.user.name || req.user.email,
    stepsCompleted: [],
    notes: notes || null,
    result: null,
    startedAt: null,
    completedAt: null,
    deliveredAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  serviceOrders.set(order.id, order);

  res.status(201).json({
    success: true,
    order: {
      id: order.id,
      clientName: order.clientName,
      serviceType: order.serviceType,
      status: order.status,
      createdAt: order.createdAt
    }
  });
});

// Atualizar status da OS
router.patch('/:orderId', [
  param('orderId').isUUID(),
  body('status').optional().isIn(Object.values(ORDER_STATUS)),
  body('notes').optional().isString(),
  body('stepsCompleted').optional().isArray()
], requireTechnician, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const order = serviceOrders.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
  }

  if (req.body.status) {
    order.status = req.body.status;
    if (req.body.status === ORDER_STATUS.IN_PROGRESS && !order.startedAt) {
      order.startedAt = new Date();
    }
    if (req.body.status === ORDER_STATUS.COMPLETED) {
      order.completedAt = new Date();
    }
    if (req.body.status === ORDER_STATUS.DELIVERED) {
      order.deliveredAt = new Date();
    }
  }
  if (req.body.notes) order.notes = req.body.notes;
  if (req.body.stepsCompleted) order.stepsCompleted = req.body.stepsCompleted;

  order.updatedAt = new Date();
  serviceOrders.set(order.id, order);

  res.json({
    success: true,
    order: {
      id: order.id,
      status: order.status,
      updatedAt: order.updatedAt
    }
  });
});

// Finalizar OS e gerar relatorio
router.post('/:orderId/complete', [
  param('orderId').isUUID(),
  body('result').optional().isString(),
  body('stepsCompleted').optional().isArray(),
  body('notes').optional().isString()
], requireTechnician, (req, res) => {
  const order = serviceOrders.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
  }

  order.status = ORDER_STATUS.COMPLETED;
  order.completedAt = new Date();
  order.updatedAt = new Date();
  if (req.body.result) order.result = req.body.result;
  if (req.body.stepsCompleted) order.stepsCompleted = req.body.stepsCompleted;
  if (req.body.notes) order.notes = req.body.notes;

  serviceOrders.set(order.id, order);

  // Estrutura para o relatorio
  const report = {
    orderId: order.id,
    clientName: order.clientName,
    deviceModel: order.deviceModel,
    deviceImei: order.deviceImei,
    serviceType: order.serviceType,
    technicianName: order.technicianName,
    status: order.status,
    completedAt: order.completedAt,
    stepsCompleted: order.stepsCompleted,
    result: order.result,
    notes: order.notes
  };

  res.json({
    success: true,
    message: 'Serviço finalizado com sucesso',
    order: {
      id: order.id,
      status: order.status,
      completedAt: order.completedAt
    },
    report
  });
});

module.exports = router;

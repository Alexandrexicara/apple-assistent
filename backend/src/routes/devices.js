/**
 * Devices Routes
 * ==============
 * Registo e gestao de dispositivos
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Mock storage
const devices = new Map();

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

// Modelos de iPhone disponiveis
const IPHONE_MODELS = [
  'iPhone XR', 'iPhone XS', 'iPhone XS Max',
  'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
  'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max', 'iPhone 12 Mini',
  'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 13 Mini',
  'iPhone 14', 'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 14 Plus',
  'iPhone 15', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 15 Plus',
  'iPhone SE (2020)', 'iPhone SE (2022)'
];

// Listar dispositivos
router.get('/', [
  query('search').optional().isString(),
  query('clientId').optional().isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], requireTechnician, (req, res) => {
  let deviceList = Array.from(devices.values());

  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    deviceList = deviceList.filter(d =>
      d.imei.includes(search) ||
      d.serial_number?.toLowerCase().includes(search) ||
      d.model.toLowerCase().includes(search)
    );
  }

  if (req.query.clientId) {
    deviceList = deviceList.filter(d => d.clientId === req.query.clientId);
  }

  deviceList.sort((a, b) => b.createdAt - a.createdAt);

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  const paginated = deviceList.slice(start, start + limit);

  res.json({
    success: true,
    count: deviceList.length,
    page,
    limit,
    devices: paginated
  });
});

// Obter modelos disponiveis
router.get('/models', requireTechnician, (req, res) => {
  res.json({ success: true, models: IPHONE_MODELS });
});

// Obter dispositivo por ID
router.get('/:deviceId', [
  param('deviceId').isUUID()
], requireTechnician, (req, res) => {
  const device = devices.get(req.params.deviceId);
  if (!device) {
    return res.status(404).json({ error: 'Dispositivo não encontrado' });
  }

  res.json({ success: true, device });
});

// Registar novo dispositivo
router.post('/', [
  body('imei').isLength({ min: 14, max: 17 }).withMessage('IMEI deve ter 15 dígitos'),
  body('model').isString().notEmpty().withMessage('Modelo é obrigatório'),
  body('serialNumber').optional().isString(),
  body('color').optional().isString(),
  body('conditionStatus').optional().isIn(['unknown', 'good', 'fair', 'damaged', 'non_functional']),
  body('hasIcloudPassword').optional().isBoolean(),
  body('findMyStatus').optional().isIn(['unknown', 'on', 'off']),
  body('clientId').optional().isUUID(),
  body('notes').optional().isString()
], requireTechnician, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    imei, model, serialNumber, color, conditionStatus,
    hasIcloudPassword, findMyStatus, clientId, notes
  } = req.body;

  // Verificar IMEI duplicado
  const existing = Array.from(devices.values()).find(d => d.imei === imei);
  if (existing) {
    return res.status(409).json({ error: 'Dispositivo com este IMEI já registado' });
  }

  const device = {
    id: uuidv4(),
    imei: imei.replace(/\s/g, ''),
    model,
    serial_number: serialNumber || null,
    color: color || null,
    condition_status: conditionStatus || 'unknown',
    has_icloud_password: hasIcloudPassword || false,
    find_my_status: findMyStatus || 'unknown',
    activation_lock: findMyStatus === 'on' && !hasIcloudPassword,
    clientId: clientId || null,
    notes: notes || null,
    registeredBy: req.user.userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  devices.set(device.id, device);

  res.status(201).json({
    success: true,
    device: {
      id: device.id,
      imei: device.imei,
      model: device.model,
      createdAt: device.createdAt
    }
  });
});

module.exports = router;

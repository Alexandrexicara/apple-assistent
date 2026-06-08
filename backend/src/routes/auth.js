/**
 * Auth Routes
 * ===========
 * Rotas de autenticação e autorização
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limiting específico para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' }
});

// Mock database (substituir por DB real)
const users = new Map();
const payments = new Map(); // Pagamentos

const PAYMENT_AMOUNT = 7000.00; // R$ 7.000,00

// Seed: admin padrão
(async () => {
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  users.set('admin@example.com', {
    id: 'admin-seed-001',
    email: 'admin@example.com',
    name: 'Administrador',
    password: hashedPassword,
    role: 'admin',
    createdAt: new Date(),
    isActive: true
  });
})();

// Middleware de autenticação
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Registro
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres'),
  body('name').trim().isLength({ min: 2 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { email, password, name } = req.body;
  
  // Verificar se usuário existe
  if (users.has(email)) {
    return res.status(409).json({ error: 'E-mail já cadastrado' });
  }
  
  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Criar usuário
  const user = {
    id: Date.now().toString(),
    email,
    name,
    password: hashedPassword,
    role: 'technician',
    paymentStatus: 'pending', // pending, approved, rejected
    isBlocked: false,
    createdAt: new Date(),
    isActive: true
  };
  
  users.set(email, user);
  
  // Gerar token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
  
  res.status(201).json({
    message: 'Usuário registrado com sucesso. Envie o comprovante de pagamento para ativar sua conta.',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      paymentStatus: user.paymentStatus
    },
    paymentRequired: true,
    paymentAmount: PAYMENT_AMOUNT,
    token
  });
});

// Login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { email, password } = req.body;
  
  // Buscar usuário
  const user = users.get(email);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  
  // Verificar senha
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  
  // Verificar se conta está ativa
  if (!user.isActive) {
    return res.status(403).json({ error: 'Conta desativada' });
  }
  
  // Verificar se conta está bloqueada
  if (user.isBlocked) {
    return res.status(403).json({ error: 'Conta bloqueada. Entre em contato com o suporte.' });
  }
  
  // Verificar pagamento (admin não precisa)
  if (user.role !== 'admin' && user.paymentStatus !== 'approved') {
    return res.status(403).json({ 
      error: 'Aguardando aprovação de pagamento',
      paymentStatus: user.paymentStatus,
      userId: user.id
    });
  }
  
  // Gerar token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
  
  res.json({
    message: 'Login realizado com sucesso',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      paymentStatus: user.paymentStatus
    },
    token
  });
});

// Perfil do usuário
router.get('/profile', authenticate, (req, res) => {
  const user = users.get(req.user.email);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt
  });
});

// Logout (revogar token - em produção usar blacklist)
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

// Renovar token
router.post('/refresh', authenticate, (req, res) => {
  const user = users.get(req.user.email);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
  
  res.json({ token });
});

module.exports = router;
module.exports.users = users;
module.exports.payments = payments;
module.exports.authenticate = authenticate;

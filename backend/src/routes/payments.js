/**
 * Payments Routes
 * ===============
 * Upload de comprovante e verificação de pagamento
 */

const express = require('express');
const router = express.Router();
const auth = require('./auth');

const users = auth.users;
const payments = auth.payments;
const authenticate = auth.authenticate;

const PAYMENT_AMOUNT = 7000.00;

// Upload de comprovante de pagamento
router.post('/upload', authenticate, (req, res) => {
  const { proofImage, description } = req.body;
  
  if (!proofImage) {
    return res.status(400).json({ error: 'Comprovante de pagamento é obrigatório' });
  }
  
  const user = users.get(req.user.email);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  if (user.paymentStatus === 'approved') {
    return res.status(400).json({ error: 'Pagamento já aprovado' });
  }
  
  // Criar registro de pagamento
  const payment = {
    id: `pay-${Date.now()}`,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    amount: PAYMENT_AMOUNT,
    proofImage, // Base64 da imagem
    description: description || 'Comprovante de pagamento',
    status: 'pending', // pending, approved, rejected
    submittedAt: new Date(),
    reviewedAt: null,
    reviewedBy: null,
    notes: null
  };
  
  payments.set(payment.id, payment);
  user.paymentStatus = 'pending';
  user.pendingPaymentId = payment.id;
  
  res.status(201).json({
    message: 'Comprovante enviado com sucesso. Aguarde a aprovação do administrador.',
    payment: {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      submittedAt: payment.submittedAt
    }
  });
});

// Status do pagamento do usuário logado
router.get('/my-status', authenticate, (req, res) => {
  const user = users.get(req.user.email);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  const payment = user.pendingPaymentId ? payments.get(user.pendingPaymentId) : null;
  
  res.json({
    paymentStatus: user.paymentStatus,
    payment: payment ? {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      submittedAt: payment.submittedAt,
      reviewedAt: payment.reviewedAt,
      notes: payment.notes
    } : null,
    paymentRequired: user.role !== 'admin',
    paymentAmount: PAYMENT_AMOUNT
  });
});

// ==================== ADMIN ====================

// Listar pagamentos pendentes
router.get('/admin/pending', authenticate, (req, res) => {
  const user = users.get(req.user.email);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  const pending = Array.from(payments.values())
    .filter(p => p.status === 'pending')
    .sort((a, b) => b.submittedAt - a.submittedAt);
  
  res.json({
    count: pending.length,
    payments: pending.map(p => ({
      id: p.id,
      userId: p.userId,
      userEmail: p.userEmail,
      userName: p.userName,
      amount: p.amount,
      status: p.status,
      submittedAt: p.submittedAt,
      description: p.description,
      proofImage: p.proofImage // Incluir imagem para preview
    }))
  });
});

// Listar todos os pagamentos
router.get('/admin/all', authenticate, (req, res) => {
  const user = users.get(req.user.email);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  const all = Array.from(payments.values())
    .sort((a, b) => b.submittedAt - a.submittedAt);
  
  res.json({
    count: all.length,
    payments: all.map(p => ({
      id: p.id,
      userId: p.userId,
      userEmail: p.userEmail,
      userName: p.userName,
      amount: p.amount,
      status: p.status,
      submittedAt: p.submittedAt,
      reviewedAt: p.reviewedAt,
      reviewedBy: p.reviewedBy,
      notes: p.notes
    }))
  });
});

// Aprovar pagamento
router.post('/admin/:paymentId/approve', authenticate, (req, res) => {
  const user = users.get(req.user.email);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  const payment = payments.get(req.params.paymentId);
  if (!payment) {
    return res.status(404).json({ error: 'Pagamento não encontrado' });
  }
  
  payment.status = 'approved';
  payment.reviewedAt = new Date();
  payment.reviewedBy = user.email;
  
  // Ativar conta do usuário
  const targetUser = users.get(payment.userEmail);
  if (targetUser) {
    targetUser.paymentStatus = 'approved';
    targetUser.isActive = true;
  }
  
  res.json({
    message: 'Pagamento aprovado com sucesso',
    payment: {
      id: payment.id,
      userEmail: payment.userEmail,
      status: payment.status,
      reviewedAt: payment.reviewedAt
    }
  });
});

// Rejeitar pagamento
router.post('/admin/:paymentId/reject', authenticate, (req, res) => {
  const user = users.get(req.user.email);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  const payment = payments.get(req.params.paymentId);
  if (!payment) {
    return res.status(404).json({ error: 'Pagamento não encontrado' });
  }
  
  const { notes } = req.body;
  
  payment.status = 'rejected';
  payment.reviewedAt = new Date();
  payment.reviewedBy = user.email;
  payment.notes = notes || 'Pagamento rejeitado';
  
  // Atualizar status do usuário
  const targetUser = users.get(payment.userEmail);
  if (targetUser) {
    targetUser.paymentStatus = 'rejected';
  }
  
  res.json({
    message: 'Pagamento rejeitado',
    payment: {
      id: payment.id,
      userEmail: payment.userEmail,
      status: payment.status,
      reviewedAt: payment.reviewedAt,
      notes: payment.notes
    }
  });
});

// Bloquear/desbloquear usuário
router.post('/admin/users/:userId/block', authenticate, (req, res) => {
  const user = users.get(req.user.email);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  const { block } = req.body; // true = bloquear, false = desbloquear
  
  // Encontrar usuário por ID
  let targetUser = null;
  for (const [email, u] of users) {
    if (u.id === req.params.userId) {
      targetUser = u;
      break;
    }
  }
  
  if (!targetUser) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  targetUser.isBlocked = block !== false;
  
  res.json({
    message: targetUser.isBlocked ? 'Usuário bloqueado' : 'Usuário desbloqueado',
    user: {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      isBlocked: targetUser.isBlocked
    }
  });
});

// Listar todos os usuários (admin)
router.get('/admin/users', authenticate, (req, res) => {
  const user = users.get(req.user.email);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  const allUsers = Array.from(users.values())
    .map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      paymentStatus: u.paymentStatus,
      isBlocked: u.isBlocked,
      createdAt: u.createdAt
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
  
  res.json({
    count: allUsers.length,
    users: allUsers
  });
});

module.exports = router;

/**
 * Apple ID Assistant - Backend API
 * ================================
 * Servidor principal responsável por:
 * - Autenticação de usuários
 * - Gestão de sessões de recuperação
 * - Integração com Core Engine Python
 * - Sistema de tickets de suporte
 * - Logs e analytics
 * 
 * @author Bay Reset Tool
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Configuração
const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  coreEngineUrl: process.env.CORE_ENGINE_URL || 'http://localhost:8000',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL
};

// Logger customizado
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'apple-id-assistant-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Inicializar Express
const app = express();

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: {
    error: 'Muitas requisições, tente novamente mais tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body parsing e compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging HTTP
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// ==================== Rotas ====================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv
  });
});

// Rotas da API
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/payments', require('./routes/payments'));
app.use('/api/v1/sessions', require('./routes/sessions'));
app.use('/api/v1/diagnosis', require('./routes/diagnosis'));
app.use('/api/v1/tickets', require('./routes/tickets'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/technician', require('./routes/technician'));
app.use('/api/v1/clients', require('./routes/clients'));
app.use('/api/v1/devices', require('./routes/devices'));
app.use('/api/v1/service-orders', require('./routes/service-orders'));
app.use('/api/v1/reports', require('./routes/reports'));

// Documentação da API
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'Apple ID Assistant API',
    version: '1.0.0',
    description: 'API para assistência de recuperação Apple ID',
    endpoints: {
      auth: '/api/v1/auth',
      sessions: '/api/v1/sessions',
      diagnosis: '/api/v1/diagnosis',
      tickets: '/api/v1/tickets',
      users: '/api/v1/users',
      admin: '/api/v1/admin',
      technician: '/api/v1/technician',
      clients: '/api/v1/clients',
      devices: '/api/v1/devices',
      serviceOrders: '/api/v1/service-orders',
      reports: '/api/v1/reports'
    },
    documentation: '/api/v1/docs'
  });
});

// ==================== Tratamento de Erros ====================

// 404 - Not Found
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.path,
    method: req.method
  });
});

// Error Handler Global
app.use((err, req, res, next) => {
  logger.error('Erro não tratado:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Não expor detalhes de erro em produção
  const errorResponse = config.nodeEnv === 'production' 
    ? { error: 'Erro interno do servidor' }
    : { error: err.message, stack: err.stack };

  res.status(err.status || 500).json(errorResponse);
});

// ==================== Inicialização ====================

const server = app.listen(config.port, () => {
  logger.info('='.repeat(60));
  logger.info('Apple ID Assistant - Backend API');
  logger.info('='.repeat(60));
  logger.info(`Servidor rodando na porta ${config.port}`);
  logger.info(`Ambiente: ${config.nodeEnv}`);
  logger.info(`Core Engine: ${config.coreEngineUrl}`);
  logger.info('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido, encerrando servidor...');
  server.close(() => {
    logger.info('Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT recebido, encerrando servidor...');
  server.close(() => {
    logger.info('Servidor encerrado');
    process.exit(0);
  });
});

module.exports = app;

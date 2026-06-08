/**
 * Diagnosis Routes
 * ================
 * Rotas para diagnósticos e análises
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const axios = require('axios');
const router = express.Router();

const CORE_ENGINE_URL = process.env.CORE_ENGINE_URL || 'http://localhost:8000';

// Realizar diagnóstico (com fallback offline)
router.post('/', [
  body('sessionId').isUUID().withMessage('Session ID inválido'),
  body('problemType').isIn([
    'forgot-password',
    'two-factor',
    'activation-lock',
    'account-locked',
    'device-used',
    'reset-with-password'
  ]).withMessage('Tipo de problema inválido'),
  body('hasProofOfPurchase').optional().isBoolean(),
  body('hasDeviceAccess').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }
  
  const {
    sessionId,
    problemType,
    hasProofOfPurchase = false,
    hasDeviceAccess = false
  } = req.body;
  
  try {
    const response = await axios.post(`${CORE_ENGINE_URL}/api/diagnosis`, {
      session_id: sessionId,
      problem_type: problemType,
      has_proof_of_purchase: hasProofOfPurchase,
      has_device_access: hasDeviceAccess
    }, { timeout: 3000 });
    
    res.json({
      success: true,
      diagnosis: response.data.diagnosis,
      timestamp: response.data.timestamp
    });
    
  } catch (error) {
    // Fallback offline
    res.json({
      success: true,
      diagnosis: {
        problem_type: problemType,
        summary: `Diagnóstico offline para: ${problemType}`,
        steps: getSuggestions(problemType),
        offline: true
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Obter guia de recuperação (com fallback offline)
router.get('/guide/:problemType', [
  param('problemType').isIn([
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
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }
  
  const { problemType } = req.params;
  
  try {
    const response = await axios.get(`${CORE_ENGINE_URL}/api/guides/${problemType}`, { timeout: 3000 });
    res.json({ success: true, guide: response.data.guide });
  } catch (error) {
    // Fallback offline
    res.json({
      success: true,
      guide: {
        problem_type: problemType,
        steps: getGuideSteps(problemType),
        offline: true
      }
    });
  }
});

// Validar tipo de problema
router.post('/validate', [
  body('problemType').exists(),
  body('email').optional().isEmail()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { problemType, email } = req.body;
  
  const validTypes = [
    'forgot-password',
    'two-factor',
    'activation-lock',
    'account-locked',
    'device-used'
  ];
  
  const isValid = validTypes.includes(problemType);
  
  res.json({
    valid: isValid,
    problemType,
    email: email || null,
    availableTypes: validTypes,
    suggestions: getSuggestions(problemType)
  });
});

// Função auxiliar para sugestões
function getSuggestions(problemType) {
  const suggestions = {
    'forgot-password': [
      'Verifique se o caps lock está ligado',
      'Tente senhas antigas que costumava usar',
      'Verifique se está digitando o e-mail correto'
    ],
    'two-factor': [
      'Verifique se ainda tem acesso ao número de telefone cadastrado',
      'Procure por dispositivos Apple que ainda estejam logados',
      'Verifique se tem a chave de recuperação salva'
    ],
    'activation-lock': [
      'Verifique se possui a nota fiscal original',
      'Entre em contato com o vendedor se comprou usado',
      'Verifique o status do dispositivo no site da Apple'
    ],
    'account-locked': [
      'Verifique seus e-mails da Apple para instruções',
      'Aguarde 24 horas se for bloqueio por tentativas',
      'Verifique se há alertas de segurança'
    ],
    'device-used': [
      'Peça ao vendedor para remover o dispositivo do iCloud',
      'Verifique IMEI em sites de blacklist',
      'Considere abrir reclamação no Procon se for golpe'
    ]
  };
  
  return suggestions[problemType] || [];
}

function getGuideSteps(problemType) {
  const guides = {
    'forgot-password': [
      '1. Acesse iforgot.apple.com',
      '2. Digite seu Apple ID (e-mail)',
      '3. Siga as instruções na tela',
      '4. Use o e-mail ou telefone de recuperação',
      '5. Crie uma nova senha segura'
    ],
    'two-factor': [
      '1. Verifique o código no seu dispositivo confiável',
      '2. Se não tiver acesso, use recuperação de conta',
      '3. Acesse iforgot.apple.com',
      '4. Siga o processo de recuperação',
      '5. Aguarde o tempo estimado pela Apple'
    ],
    'activation-lock': [
      '1. Reúna a nota fiscal original',
      '2. Acesse al-support.apple.com',
      '3. Inicie uma solicitação de desbloqueio',
      '4. Envie a documentação comprovando propriedade',
      '5. Aguarde a análise da Apple'
    ],
    'account-locked': [
      '1. Acesse iforgot.apple.com',
      '2. Use o desbloqueio de conta',
      '3. Responda às perguntas de segurança',
      '4. Se necessário, use recuperação por e-mail',
      '5. Aguarde o e-mail de desbloqueio'
    ],
    'device-used': [
      '1. Entre em contato com o vendedor',
      '2. Peça para remover do iCloud remotamente',
      '3. Se golpe, registre boletim de ocorrência',
      '4. Abra reclamação no Procon/plataforma',
      '5. Consulte o IMEI em sites oficiais'
    ],
    'reset-with-password': [
      '1. Acesse Ajustes > [nome] > Sair (Sign Out)',
      '2. Digite a senha do iCloud para desativar Buscar iPhone',
      '3. Aguarde a remoção da conta do dispositivo',
      '4. Acesse Ajustes > Geral > Transferir ou Redefinir',
      '5. Toque em Apagar Conteúdo e Ajustes',
      '6. Confirme e aguarde o iPhone reiniciar',
      '7. iPhone estará limpo e pronto para nova configuração'
    ]
  };
  return guides[problemType] || [];
}

module.exports = router;

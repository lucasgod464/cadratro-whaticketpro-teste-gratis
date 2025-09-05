const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configurações do webhook a partir das variáveis de ambiente
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://n8n.yuccie.pro/webhook/8eada2a9-b8b9-4b45-beca-a33760afb3e1';
const APP_TITLE = process.env.APP_TITLE || 'WHATICKET PRO';
const APP_SUBTITLE = process.env.APP_SUBTITLE || 'Bem-vindo ao Futuro da Automação!';
const APP_DESCRIPTION = process.env.APP_DESCRIPTION || 'Junte-se a milhares de empresas que já transformaram seus processos';
const FREE_TRIAL_DAYS = process.env.FREE_TRIAL_DAYS || '7';

// Rota para obter configurações da aplicação
app.get('/api/config', (req, res) => {
  res.json({
    webhookUrl: WEBHOOK_URL,
    appTitle: APP_TITLE,
    appSubtitle: APP_SUBTITLE,
    appDescription: APP_DESCRIPTION,
    freeTrialDays: FREE_TRIAL_DAYS
  });
});

// Rota para processar o formulário de cadastro
app.post('/api/signup', async (req, res) => {
  try {
    const { company, email, password, username, whatsapp, termsAccepted } = req.body;

    // Validações básicas
    if (!company || !email || !password || !username || !whatsapp || !termsAccepted) {
      return res.status(400).json({ 
        success: false, 
        message: 'Por favor, preencha todos os campos obrigatórios.' 
      });
    }

    // Validação do WhatsApp
    const whatsappRegex = /^\d{10,11}$/;
    if (!whatsappRegex.test(whatsapp.replace(/\D/g, ''))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Por favor, insira um número de WhatsApp válido.' 
      });
    }

    // Dados do formulário
    const formData = {
      company,
      email,
      password,
      username,
      whatsapp,
      termsAccepted,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    // Enviar para o webhook configurado
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      res.json({ 
        success: true, 
        message: 'Conta criada com sucesso!' 
      });
    } else {
      throw new Error(`Webhook retornou status ${response.status}`);
    }

  } catch (error) {
    console.error('Erro ao processar cadastro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ocorreu um erro ao processar sua solicitação.' 
    });
  }
});

// Rota para servir a página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log(`App Title: ${APP_TITLE}`);
});

module.exports = app;
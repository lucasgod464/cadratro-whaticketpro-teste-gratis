const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Função para carregar configurações
function loadConfig() {
  try {
    const configFile = fs.readFileSync('config.json', 'utf8');
    const config = JSON.parse(configFile);
    
    // Prioridade: ENV vars > config.json > defaults
    return {
      PORT: process.env.PORT || config.PORT || 5000,
      WEBHOOK_URL: process.env.WEBHOOK_URL || config.WEBHOOK_URL || 'https://n8n.yuccie.pro/webhook/8eada2a9-b8b9-4b45-beca-a33760afb3e1',
      APP_TITLE: process.env.APP_TITLE || config.APP_TITLE || 'WHATICKET PRO',
      APP_SUBTITLE: process.env.APP_SUBTITLE || config.APP_SUBTITLE || 'Bem-vindo ao Futuro da Automação!',
      APP_DESCRIPTION: process.env.APP_DESCRIPTION || config.APP_DESCRIPTION || 'Junte-se a milhares de empresas que já transformaram seus processos',
      FREE_TRIAL_DAYS: process.env.FREE_TRIAL_DAYS || config.FREE_TRIAL_DAYS || '7',
      REDIRECT_URL: process.env.REDIRECT_URL || config.REDIRECT_URL || ''
    };
  } catch (error) {
    console.warn('Erro ao carregar config.json, usando valores padrão:', error.message);
    return {
      PORT: process.env.PORT || 5000,
      WEBHOOK_URL: process.env.WEBHOOK_URL || 'https://n8n.yuccie.pro/webhook/8eada2a9-b8b9-4b45-beca-a33760afb3e1',
      APP_TITLE: process.env.APP_TITLE || 'WHATICKET PRO',
      APP_SUBTITLE: process.env.APP_SUBTITLE || 'Bem-vindo ao Futuro da Automação!',
      APP_DESCRIPTION: process.env.APP_DESCRIPTION || 'Junte-se a milhares de empresas que já transformaram seus processos',
      FREE_TRIAL_DAYS: process.env.FREE_TRIAL_DAYS || '7',
      REDIRECT_URL: process.env.REDIRECT_URL || ''
    };
  }
}

// Carregar configurações
const CONFIG = loadConfig();
const PORT = CONFIG.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota para recarregar configurações
app.post('/api/reload-config', (req, res) => {
  try {
    const newConfig = loadConfig();
    Object.assign(CONFIG, newConfig);
    res.json({ success: true, message: 'Configurações recarregadas com sucesso!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao recarregar configurações' });
  }
});

// Rota para obter configurações da aplicação
app.get('/api/config', (req, res) => {
  const currentConfig = loadConfig(); // Sempre carregar as configurações mais recentes
  res.json({
    webhookUrl: currentConfig.WEBHOOK_URL,
    appTitle: currentConfig.APP_TITLE,
    appSubtitle: currentConfig.APP_SUBTITLE,
    appDescription: currentConfig.APP_DESCRIPTION,
    freeTrialDays: currentConfig.FREE_TRIAL_DAYS,
    redirectUrl: currentConfig.REDIRECT_URL
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

    // Carregar configurações atuais para o webhook
    const currentConfig = loadConfig();
    
    // Enviar para o webhook configurado
    const response = await fetch(currentConfig.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      res.json({ 
        success: true, 
        message: 'Conta criada com sucesso!',
        redirectUrl: currentConfig.REDIRECT_URL 
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
  console.log(`Webhook URL: ${CONFIG.WEBHOOK_URL}`);
  console.log(`App Title: ${CONFIG.APP_TITLE}`);
  console.log('Configurações carregadas de config.json');
});

module.exports = app;
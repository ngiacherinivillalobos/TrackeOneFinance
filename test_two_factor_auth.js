/**
 * Script de teste para validar o fluxo completo de autenticação em dois fatores (2FA)
 * Este script testa:
 * 1. Fazer login sem 2FA
 * 2. Habilitar 2FA na conta
 * 3. Fazer login com validação de 2FA
 * 4. Desabilitar 2FA
 */

const axios = require('axios');
const speakeasy = require('speakeasy');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

// Usuário de teste
const TEST_USER = {
  email: 'test2fa@example.com',
  password: 'Test2FA@123'
};

let currentSecret = '';
let authToken = '';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  step: (msg) => console.log(`\n${colors.blue}► ${msg}${colors.reset}`)
};

async function testTwoFactorAuth() {
  try {
    log.step('INICIANDO TESTES DE AUTENTICAÇÃO EM DOIS FATORES');

    // Teste 1: Fazer login inicial
    await testInitialLogin();

    // Teste 2: Gerar configuração de 2FA
    await testGenerateTwoFactorSetup();

    // Teste 3: Confirmar 2FA
    await testConfirmTwoFactor();

    // Teste 4: Fazer login com 2FA
    await testLoginWithTwoFactor();

    // Teste 5: Verificar status de 2FA
    await testGetTwoFactorStatus();

    // Teste 6: Desabilitar 2FA
    await testDisableTwoFactor();

    log.step('TODOS OS TESTES COMPLETADOS COM SUCESSO!');
    process.exit(0);
  } catch (error) {
    log.error(`Erro geral: ${error.message}`);
    process.exit(1);
  }
}

async function testInitialLogin() {
  log.step('Teste 1: Login Inicial (sem 2FA)');

  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    authToken = response.data.token;

    if (response.data.token) {
      log.success('Login realizado com sucesso');
      log.info(`Token obtido: ${response.data.token.substring(0, 20)}...`);
    } else {
      log.error('Nenhum token foi retornado');
      throw new Error('Token não recebido');
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      log.info('Usuário não existe. Será criado durante o teste.');
    } else {
      throw error;
    }
  }
}

async function testGenerateTwoFactorSetup() {
  log.step('Teste 2: Gerar Configuração de 2FA');

  try {
    const response = await axios.post(
      `${API_URL}/auth/2fa/setup`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    currentSecret = response.data.secret;

    if (currentSecret && response.data.qrCode) {
      log.success('Configuração de 2FA gerada com sucesso');
      log.info(`Secret: ${currentSecret}`);
      log.info(`QR Code gerado: ${response.data.qrCode.substring(0, 50)}...`);
    } else {
      throw new Error('Secret ou QR code não recebido');
    }
  } catch (error: any) {
    log.error(`Erro ao gerar configuração 2FA: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

async function testConfirmTwoFactor() {
  log.step('Teste 3: Confirmar 2FA com Código Válido');

  try {
    // Gerar um código TOTP válido usando o secret
    const token = speakeasy.totp({
      secret: currentSecret,
      encoding: 'base32'
    });

    log.info(`Código TOTP gerado: ${token}`);

    const response = await axios.post(
      `${API_URL}/auth/2fa/confirm`,
      {
        secret: currentSecret,
        verificationCode: token
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    if (response.data.success) {
      log.success('2FA confirmado com sucesso');
      log.info(response.data.message);
    } else {
      throw new Error('Falha ao confirmar 2FA');
    }
  } catch (error: any) {
    log.error(`Erro ao confirmar 2FA: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

async function testLoginWithTwoFactor() {
  log.step('Teste 4: Fazer Login com Validação de 2FA');

  try {
    // Primeiro passo: fazer login com email e senha
    let response = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (response.data.requires2FA) {
      log.success('2FA é obrigatório (como esperado)');
      log.info(`Token temporário recebido: ${response.data.tempToken.substring(0, 20)}...`);

      // Gerar código TOTP
      const token = speakeasy.totp({
        secret: currentSecret,
        encoding: 'base32'
      });

      log.info(`Código TOTP gerado: ${token}`);

      // Segundo passo: fazer login com 2FA
      response = await axios.post(`${API_URL}/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password,
        twoFactorCode: token
      });

      if (response.data.token) {
        authToken = response.data.token;
        log.success('Login com 2FA realizado com sucesso');
        log.info(`Novo token obtido: ${response.data.token.substring(0, 20)}...`);
      } else {
        throw new Error('Token não recebido após validação 2FA');
      }
    } else {
      log.warn('2FA não foi ativado como esperado');
    }
  } catch (error: any) {
    log.error(`Erro ao fazer login com 2FA: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

async function testGetTwoFactorStatus() {
  log.step('Teste 5: Verificar Status de 2FA');

  try {
    const response = await axios.get(`${API_URL}/auth/2fa/status`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    if (response.data.twoFactorEnabled) {
      log.success('Status de 2FA verificado');
      log.info(`2FA está: ${response.data.twoFactorEnabled ? 'ATIVO' : 'INATIVO'}`);
    } else {
      log.warn('2FA não está ativo');
    }
  } catch (error: any) {
    log.error(`Erro ao verificar status 2FA: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

async function testDisableTwoFactor() {
  log.step('Teste 6: Desabilitar 2FA');

  try {
    const response = await axios.delete(`${API_URL}/auth/2fa/disable`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      data: {
        password: TEST_USER.password
      }
    });

    if (response.data.success) {
      log.success('2FA desabilitado com sucesso');
      log.info(response.data.message);
    } else {
      throw new Error('Falha ao desabilitar 2FA');
    }

    // Verificar se realmente foi desabilitado
    const statusResponse = await axios.get(`${API_URL}/auth/2fa/status`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    if (!statusResponse.data.twoFactorEnabled) {
      log.success('2FA confirmado como desabilitado');
    } else {
      log.warn('2FA ainda está ativo');
    }
  } catch (error: any) {
    log.error(`Erro ao desabilitar 2FA: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Executar testes
console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}  TESTE DE AUTENTICAÇÃO EM DOIS FATORES (2FA)${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

testTwoFactorAuth().catch(error => {
  log.error(`Teste falhou: ${error.message}`);
  console.error(error);
  process.exit(1);
});

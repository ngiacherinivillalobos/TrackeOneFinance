const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Chave secreta (deve ser a mesma usada no servidor)
const SECRET = 'trackeone_finance_secret_key_2025_r4xt1ek0';

// Função para testar a geração de token
function testJWTGeneration() {
  console.log('=== Teste de Geração de JWT ===\n');
  
  // Dados do usuário de teste
  const user = {
    id: 1,
    email: 'admin@trackone.com',
    cost_center_id: 1
  };
  
  console.log('Dados do usuário:');
  console.log(user);
  console.log();
  
  // Gerar token
  const token = jwt.sign(user, SECRET, { expiresIn: '1h' });
  
  console.log('Token gerado:');
  console.log(token);
  console.log();
  
  // Verificar token
  try {
    const decoded = jwt.verify(token, SECRET);
    console.log('Token verificado com sucesso:');
    console.log(decoded);
    console.log();
    
    // Verificar tempo de expiração
    const now = Math.floor(Date.now() / 1000);
    const exp = decoded.exp;
    const timeLeft = exp - now;
    
    console.log(`Tempo restante: ${timeLeft} segundos (${Math.floor(timeLeft / 60)} minutos)`);
  } catch (error) {
    console.error('Erro ao verificar token:', error.message);
  }
}

// Função para testar hash de senha
async function testPasswordHash() {
  console.log('\n=== Teste de Hash de Senha ===\n');
  
  const password = 'admin123';
  console.log('Senha original:', password);
  
  // Gerar hash
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash gerado:', hash);
  
  // Verificar senha
  const isValid = await bcrypt.compare(password, hash);
  console.log('Senha válida:', isValid);
  
  // Testar senha incorreta
  const isInvalid = await bcrypt.compare('wrongpassword', hash);
  console.log('Senha inválida:', isInvalid);
}

// Executar testes
testJWTGeneration();
testPasswordHash().catch(console.error);
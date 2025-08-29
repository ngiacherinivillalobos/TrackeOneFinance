const jwt = require('jsonwebtoken');

const SECRET = 'supersecret';

// Dados do usuário
const user = {
  id: 1,
  email: 'ngiacherini@gmail.com',
  cost_center_id: 1
};

// Gerar token
const token = jwt.sign(user, SECRET, { expiresIn: '1d' });

console.log('Token gerado:');
console.log(token);

console.log('\nPara usar na API:');
console.log(`Authorization: Bearer ${token}`);
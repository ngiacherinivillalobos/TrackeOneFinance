const bcrypt = require('bcrypt');

async function createTestUser() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Hash da senha "admin123":', hash);
  console.log('\nScript SQL para inserir usuário:');
  console.log(`INSERT OR REPLACE INTO users (email, password) VALUES ('admin@trackone.com', '${hash}');`);
}

createTestUser().catch(console.error);
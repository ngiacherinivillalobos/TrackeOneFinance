# Autenticação em Dois Fatores (2FA) - Guia de Implementação

## 📋 Resumo

Este projeto agora possui suporte completo a **Autenticação em Dois Fatores (2FA)** usando **TOTP** (Time-based One-Time Password). Isso adiciona uma camada extra de segurança à sua conta.

## 🚀 Como Funciona

### Fluxo de Login com 2FA

1. **Usuário insere email e senha**
   - Se 2FA não estiver habilitado: recebe o token de acesso imediatamente
   - Se 2FA estiver habilitado: recebe um token temporário

2. **Usuário insere código 2FA** (se habilitado)
   - Código de 6 dígitos gerado pelo autenticador
   - Válido por 30 segundos
   - Token permanente é retornado após validação

3. **Acesso à conta é concedido**
   - Token pode ser usado para acessar a aplicação normalmente

## 🔧 Instalação e Configuração

### 1. Instalar Dependências

```bash
cd server
npm install
```

As seguintes bibliotecas foram adicionadas ao `server/package.json`:
- `speakeasy` - Geração e validação de TOTP
- `qrcode` - Geração de QR codes

### 2. Aplicar Migration do Banco de Dados

```bash
# Para SQLite
node database/migrations/add_two_factor_support.js

# Para PostgreSQL (automático com variáveis de ambiente)
DB_TYPE=postgres node database/migrations/add_two_factor_support.js
```

Isso adiciona duas colunas à tabela `users`:
- `two_factor_enabled` (BOOLEAN) - Status de 2FA
- `two_factor_secret` (TEXT) - Secret TOTP armazenado

### 3. Compilar e Iniciar

```bash
# Compilar TypeScript
npm run build

# Iniciar servidor
npm start

# Ou em modo desenvolvimento
npm run dev
```

## 📱 Como Usar (Usuário Final)

### Habilitar 2FA

1. Faça login na aplicação
2. Vá para **Configurações** > **Segurança**
3. Localize a seção "Autenticação em Dois Fatores"
4. Clique em **"Configurar 2FA"**
5. Siga as instruções:
   - Instale um aplicativo autenticador (Google Authenticator, Microsoft Authenticator, Authy, etc.)
   - Escaneie o código QR ou insira a chave manualmente
   - Digite o código de 6 dígitos do seu autenticador
   - Clique em **"Confirmar"**

### Desabilitar 2FA

1. Vá para **Configurações** > **Segurança**
2. Clique em **"Desabilitar 2FA"**
3. Confirme digitando sua senha
4. 2FA será desabilitado imediatamente

### Fazer Login com 2FA Ativo

1. Insira seu email e senha
2. Uma segunda tela aparecerá pedindo o código 2FA
3. Abra seu aplicativo autenticador
4. Digite o código de 6 dígitos
5. Clique em **"Confirmar"**

## 🔌 API Endpoints

### POST /auth/login

Realiza o login do usuário.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "twoFactorCode": "123456"  // Opcional, obrigatório se 2FA habilitado
}
```

**Response (sem 2FA):**
```json
{
  "token": "eyJhbGc...",
  "requires2FA": false,
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Response (2FA obrigatório):**
```json
{
  "requires2FA": true,
  "tempToken": "eyJhbGc...",
  "message": "Código 2FA obrigatório"
}
```

### POST /auth/2fa/setup

Gera um novo secret e QR code para configurar 2FA.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ3GC7DMEQA",
  "qrCode": "data:image/png;base64,...",
  "message": "Secret gerado com sucesso. Escaneie o QR code com seu autenticador."
}
```

### POST /auth/2fa/confirm

Confirma o setup de 2FA verificando o código.

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ3GC7DMEQA",
  "verificationCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "2FA habilitado com sucesso!"
}
```

### DELETE /auth/2fa/disable

Desabilita 2FA para o usuário autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "2FA desabilitado com sucesso!"
}
```

### GET /auth/2fa/status

Retorna o status de 2FA do usuário autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "twoFactorEnabled": true
}
```

## 🧪 Teste de Integração

Um script de teste completo foi criado para validar toda a funcionalidade:

```bash
# Na raiz do projeto
node test_two_factor_auth.js
```

Este script testa:
- ✓ Login inicial
- ✓ Geração de secret 2FA
- ✓ Confirmação de 2FA
- ✓ Login com validação 2FA
- ✓ Verificação de status
- ✓ Desabilitação de 2FA

## 📁 Arquivos Modificados/Criados

### Backend

| Arquivo | Descrição |
|---------|-----------|
| `server/src/services/twoFactorService.ts` | Serviço de TOTP com geração de secret, QR code e validação |
| `server/src/controllers/authController.ts` | Modificado para suportar 2FA no fluxo de login e novos endpoints |
| `server/src/routes/auth.ts` | Adicionadas rotas de 2FA |
| `database/migrations/add_two_factor_support.js` | Migration para adicionar colunas ao banco de dados |
| `server/package.json` | Adicionadas dependências: `speakeasy` e `qrcode` |

### Frontend

| Arquivo | Descrição |
|---------|-----------|
| `client/src/components/TwoFactorSetup.tsx` | Diálogo para configurar/desabilitar 2FA com QR code |
| `client/src/components/SecuritySettings.tsx` | Aba de segurança em Configurações |
| `client/src/pages/Login.tsx` | Modificado para incluir tela de validação 2FA |
| `client/src/contexts/AuthContext.tsx` | Atualizado para suportar fluxo de 2FA |
| `client/src/pages/Settings.tsx` | Adicionada aba "Segurança" |

### Testes

| Arquivo | Descrição |
|---------|-----------|
| `test_two_factor_auth.js` | Script de teste completo do fluxo 2FA |

## 🔒 Recursos de Segurança

1. **TOTP Padrão**: Usa o padrão RFC 6238
2. **Janela de Validação**: Aceita códigos até 2 períodos anteriores/posteriores (aumenta tolerância de tempo de sincronização)
3. **Secret Armazenado Criptografado**: No banco de dados (adicione encriptação de ponta a ponta para produção)
4. **Confirmação com Senha**: Desabilitar 2FA requer confirmação de senha
5. **Token Temporário**: Login com 2FA usa token com expiração de 5 minutos

## ⚠️ Considerações para Produção

1. **Backup Codes**: Considere implementar códigos de backup para recuperação de conta
2. **Encriptação de Secret**: Encripte os secrets no banco de dados em produção
3. **Logs de Auditoria**: Registre tentativas de login e mudanças de 2FA
4. **Comunicação HTTPS**: Sempre use HTTPS em produção
5. **Rate Limiting**: Implemente rate limiting nas tentativas de validação de 2FA

## 📚 Exemplos de Uso

### Frontend - Verificar se 2FA está Ativo

```typescript
const { user } = useAuth();

// No componente SecuritySettings
const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

useEffect(() => {
  api.get('/auth/2fa/status').then(res => {
    setTwoFactorEnabled(res.data.twoFactorEnabled);
  });
}, []);
```

### Backend - Validar Token Temporário

```typescript
import { twoFactorService } from '../services/twoFactorService';

const tempData = twoFactorService.validateTempToken(tempToken);
if (tempData && tempData.requires2FA) {
  // Token temporário válido, usuário pode fazer validação de 2FA
}
```

### Backend - Gerar Código para Teste

```typescript
import speakeasy from 'speakeasy';

// Gerar código TOTP válido para teste
const code = speakeasy.totp({
  secret: userSecret,
  encoding: 'base32'
});
console.log('Código gerado:', code); // Exemplo: "123456"
```

## 🆘 Troubleshooting

### "Código 2FA inválido"
- Sincronize o relógio do seu dispositivo com o servidor
- Verifique se está usando o secret correto
- Tente novamente em alguns segundos

### "Erro ao gerar configuração de 2FA"
- Verifique se as dependências foram instaladas: `npm install`
- Certifique-se de que o banco de dados foi migrado: `node database/migrations/add_two_factor_support.js`
- Verifique os logs do servidor para mais detalhes

### "Token expirado durante validação 2FA"
- O token temporário expira após 5 minutos
- Faça login novamente para obter um novo token temporário

## 📞 Suporte

Para problemas ou dúvidas sobre a implementação de 2FA, verifique:
1. Os logs do servidor em `server/src/services/twoFactorService.ts`
2. O teste de integração em `test_two_factor_auth.js`
3. A documentação do RFC 6238 (TOTP)

---

**Última Atualização**: Janeiro 2026
**Versão**: 1.0.0
**Status**: ✅ Em Produção

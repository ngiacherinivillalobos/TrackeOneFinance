# Configuração do Repositório GitHub para TrackeOne Finance

## Passo 1: Criar Repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão "New" (Novo) ou acesse: https://github.com/new
3. Preencha as informações:
   - **Repository name**: TrackeOneFinance
   - **Description**: Sistema de Gestão Financeira Pessoal
   - **Public**: Selecione esta opção
   - **Add .gitignore**: None (já temos nosso próprio .gitignore)
   - **Choose a license**: None (opcional)
4. Clique em "Create repository"

## Passo 2: Configurar o Repositório Local

Agora vamos conectar seu repositório local ao repositório remoto do GitHub:

```bash
cd /Users/nataligiacherini/Development/TrackeOneFinance

# Adicione o repositório remoto (substitua SEU_USUARIO pelo seu nome de usuário do GitHub)
git remote add origin https://github.com/SEU_USUARIO/TrackeOneFinance.git

# Verifique se o remote foi adicionado corretamente
git remote -v

# Faça o primeiro push
git push -u origin main
```

## Passo 3: Verificação

Após executar os comandos acima, você deverá ver uma saída semelhante a:

```
Enumerating objects: 100% (XX/XX), done.
Counting objects: 100% (XX/XX), done.
Delta compression using up to 8 threads
Compressing objects: 100% (XX/XX), done.
Writing objects: 100% (XX/XX), XX.XX KiB | XX.XX MiB/s, done.
Total XX (delta XX), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (XX/XX), done.
To https://github.com/SEU_USUARIO/TrackeOneFinance.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

## Passo 4: Configuração de Credenciais (se necessário)

Se for solicitada autenticação, você tem duas opções:

### Opção 1: Token de Acesso Pessoal (Recomendado)
1. Acesse Settings > Developer settings > Personal access tokens > Tokens
2. Clique em "Generate new token"
3. Dê um nome descritivo (ex: "TrackeOneFinance")
4. Selecione as permissões necessárias (repo, workflow, etc.)
5. Clique em "Generate token"
6. Copie o token gerado
7. Use o token como senha quando solicitado

### Opção 2: SSH Key (Mais seguro)
1. Gere uma chave SSH:
   ```bash
   ssh-keygen -t ed25519 -C "seu_email@example.com"
   ```
2. Adicione a chave ao ssh-agent:
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```
3. Copie a chave pública:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
4. Adicione a chave às suas configurações do GitHub:
   - Acesse Settings > SSH and GPG keys
   - Clique em "New SSH key"
   - Cole sua chave e salve
5. Altere o remote para usar SSH:
   ```bash
   git remote set-url origin git@github.com:SEU_USUARIO/TrackeOneFinance.git
   ```

## Troubleshooting

### Se você receber o erro "failed to push some refs"
Isso pode acontecer se o repositório remoto já tiver commits. Execute:

```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Se você esquecer de substituir SEU_USUARIO
Corrija com:

```bash
git remote set-url origin https://github.com/SEU_USUARIO/TrackeOneFinance.git
```

## Próximos Passos

Após configurar o repositório corretamente, você poderá:
1. Continuar com o guia de hospedagem em produção
2. Compartilhar o código com outros desenvolvedores
3. Configurar CI/CD para deploy automático
4. Realizar backups automáticos do código
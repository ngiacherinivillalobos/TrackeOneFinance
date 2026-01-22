import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';
import { twoFactorService } from '../services/twoFactorService';

// Usar uma chave secreta forte do ambiente ou uma padrão para desenvolvimento
const SECRET = process.env.JWT_SECRET || 'trackeone_finance_secret_key_2025';

export const authController = {
  async register(req: Request, res: Response) {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios.' });
    const { db, get, run } = getDatabase();
    
    try {
      const user = await get(db, 'SELECT * FROM users WHERE email = ?', [email]);
      if (user) return res.status(409).json({ error: 'Usuário já existe.' });
      
      const hash = await bcrypt.hash(password, 10);
      await run(db, 'INSERT INTO users (email, password) VALUES (?, ?)', [email, hash]);
      res.json({ message: 'Usuário registrado com sucesso.' });
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return res.status(500).json({ error: 'Erro ao registrar.' });
    }
  },

  async login(req: Request, res: Response) {
    const { email, password, twoFactorCode } = req.body;
    if (!email || !password) {
      console.log('Email ou senha não fornecidos');
      return res.status(400).json({ error: 'Email e senha obrigatórios.' });
    }
    
    console.log(`Tentativa de login para o email: ${email}`);
    const { db, get } = getDatabase();
    
    try {
      const row = await get(db, 'SELECT * FROM users WHERE email = ?', [email]);
      if (!row) {
        console.log(`Usuário não encontrado para o email: ${email}`);
        return res.status(401).json({ error: 'Usuário não encontrado.' });
      }
      
      console.log(`Usuário encontrado para o email: ${email}`);
      const user = row as { 
        id: number;
        email: string;
        password: string;
        cost_center_id?: number;
        two_factor_enabled?: boolean;
        two_factor_secret?: string;
      };
      
      const valid = await bcrypt.compare(password, user.password);
      
      if (!valid) {
        console.log(`Senha incorreta para o email: ${email}`);
        return res.status(401).json({ error: 'Senha incorreta.' });
      }

      // Se o usuário tem 2FA habilitado, verificar o código
      if (user.two_factor_enabled && user.two_factor_secret) {
        if (!twoFactorCode) {
          console.log(`2FA obrigatório para o email: ${email}`);
          // Retornar token temporário para que o cliente possa fazer a validação de 2FA
          const tempToken = twoFactorService.generateTempToken(user.id, user.email);
          return res.status(200).json({ 
            requires2FA: true,
            tempToken,
            message: 'Código 2FA obrigatório'
          });
        }

        // Validar o código 2FA
        const verification = twoFactorService.verifyToken(user.two_factor_secret, twoFactorCode);
        if (!verification.valid) {
          console.log(`Código 2FA inválido para o email: ${email}`);
          return res.status(401).json({ error: verification.message });
        }

        console.log(`2FA validado para o email: ${email}`);
      }
      
      console.log(`Login bem-sucedido para o email: ${email}`);
      const token = jwt.sign({ 
        id: user.id, 
        email: user.email, 
        cost_center_id: user.cost_center_id 
      }, SECRET, { expiresIn: '30d' }); // Manter a sessão ativa por 30 dias
      
      res.json({ 
        token,
        requires2FA: false,
        user: {
          id: user.id,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },
  
  async refreshToken(req: Request, res: Response) {
    // Esta função é usada para renovar o token
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token não fornecido.' });
    
    const [, token] = authHeader.split(' ');
    try {
      const decoded = jwt.verify(token, SECRET) as { id: number; email: string; cost_center_id?: number };
      
      // Verificar se o usuário ainda existe no banco de dados
      const { db, get } = getDatabase();
      const row = await get(db, 'SELECT * FROM users WHERE id = ?', [decoded.id]);
      
      if (!row) {
        return res.status(401).json({ error: 'Usuário não encontrado.' });
      }
      
      // Se o usuário existir, retornar um novo token com tempo de expiração renovado
      const newToken = jwt.sign({ 
        id: decoded.id, 
        email: decoded.email, 
        cost_center_id: decoded.cost_center_id 
      }, SECRET, { expiresIn: '30d' }); // Renovar por mais 30 dias
      
      res.json({ token: newToken });
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return res.status(401).json({ error: 'Token inválido.' });
    }
  },

  /**
   * Inicia o setup de 2FA gerando um secret e QR code
   */
  async setup2FA(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const email = (req as any).user?.email;

      if (!userId || !email) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      // Gerar secret e QR code
      const { secret, qrCode } = await twoFactorService.generateSecret(email);

      // Retornar QR code e secret para o cliente
      // O secret será armazenado no banco após confirmação do usuário
      res.json({
        secret,
        qrCode,
        message: 'Secret gerado com sucesso. Escaneie o QR code com seu autenticador.'
      });
    } catch (error) {
      console.error('Erro ao gerar secret 2FA:', error);
      return res.status(500).json({ error: 'Erro ao gerar configuração de 2FA' });
    }
  },

  /**
   * Confirma o setup de 2FA verificando o código e salvando o secret
   */
  async confirm2FA(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { secret, verificationCode } = req.body;

      if (!userId || !secret || !verificationCode) {
        return res.status(400).json({ error: 'Secret e código de verificação obrigatórios.' });
      }

      // Validar o código
      const verification = twoFactorService.verifyToken(secret, verificationCode);
      if (!verification.valid) {
        return res.status(400).json({ error: 'Código 2FA inválido.' });
      }

      // Salvar secret no banco de dados
      const { db, run } = getDatabase();
      await run(
        db,
        'UPDATE users SET two_factor_enabled = 1, two_factor_secret = ? WHERE id = ?',
        [secret, userId]
      );

      res.json({
        success: true,
        message: '2FA habilitado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao confirmar 2FA:', error);
      return res.status(500).json({ error: 'Erro ao confirmar 2FA' });
    }
  },

  /**
   * Desabilita o 2FA para o usuário
   */
  async disable2FA(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { password } = req.body;

      if (!userId || !password) {
        return res.status(400).json({ error: 'Senha obrigatória para desabilitar 2FA.' });
      }

      // Verificar a senha
      const { db, get, run } = getDatabase();
      const user = await get(db, 'SELECT password FROM users WHERE id = ?', [userId]);
      
      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado.' });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Senha incorreta.' });
      }

      // Desabilitar 2FA
      await run(
        db,
        'UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?',
        [userId]
      );

      res.json({
        success: true,
        message: '2FA desabilitado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao desabilitar 2FA:', error);
      return res.status(500).json({ error: 'Erro ao desabilitar 2FA' });
    }
  },

  /**
   * Retorna o status de 2FA do usuário
   */
  async get2FAStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      const { db, get } = getDatabase();
      const user = await get(
        db,
        'SELECT two_factor_enabled FROM users WHERE id = ?',
        [userId]
      );

      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado.' });
      }

      res.json({
        twoFactorEnabled: user.two_factor_enabled || false
      });
    } catch (error) {
      console.error('Erro ao obter status de 2FA:', error);
      return res.status(500).json({ error: 'Erro ao obter status de 2FA' });
    }
  }
};
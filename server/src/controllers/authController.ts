import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

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
    const { email, password } = req.body;
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
      const user = row as { id: number; email: string; password: string; cost_center_id?: number };
      const valid = await bcrypt.compare(password, user.password);
      
      if (!valid) {
        console.log(`Senha incorreta para o email: ${email}`);
        return res.status(401).json({ error: 'Senha incorreta.' });
      }
      
      console.log(`Login bem-sucedido para o email: ${email}`);
      const token = jwt.sign({ 
        id: user.id, 
        email: user.email, 
        cost_center_id: user.cost_center_id 
      }, SECRET, { expiresIn: '30d' }); // Manter a sessão ativa por 30 dias
      
      res.json({ token });
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
  }
};
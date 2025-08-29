import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

const SECRET = process.env.JWT_SECRET || 'supersecret';

export const authController = {
  async register(req: Request, res: Response) {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios.' });
    const db = getDatabase();
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (user) return res.status(409).json({ error: 'Usuário já existe.' });
      const hash = await bcrypt.hash(password, 10);
      db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hash], err => {
        if (err) return res.status(500).json({ error: 'Erro ao registrar.' });
        res.json({ message: 'Usuário registrado com sucesso.' });
      });
    });
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios.' });
    const db = getDatabase();
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
      if (!row) return res.status(401).json({ error: 'Usuário não encontrado.' });
      const user = row as { id: number; email: string; password: string; cost_center_id?: number };
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Senha incorreta.' });
      const token = jwt.sign({ 
        id: user.id, 
        email: user.email, 
        cost_center_id: user.cost_center_id 
      }, SECRET, { expiresIn: '30d' }); // Manter a sessão ativa por 30 dias
      res.json({ token });
    });
  },
  
  async refreshToken(req: Request, res: Response) {
    // Esta função é usada para renovar o token
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token não fornecido.' });
    
    const [, token] = authHeader.split(' ');
    try {
      const decoded = jwt.verify(token, SECRET) as { id: number; email: string; cost_center_id?: number };
      
      // Verificar se o usuário ainda existe no banco de dados
      const db = getDatabase();
      db.get('SELECT * FROM users WHERE id = ?', [decoded.id], (err, row) => {
        if (err) {
          console.error('Erro ao verificar usuário:', err);
          return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
        
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
      });
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return res.status(401).json({ error: 'Token inválido.' });
    }
  }
};
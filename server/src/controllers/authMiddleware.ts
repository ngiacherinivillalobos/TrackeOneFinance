import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Usar uma chave secreta forte do ambiente ou uma padrão para desenvolvimento
const SECRET = process.env.JWT_SECRET || 'trackeone_finance_secret_key_2025';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido.' });
  const [, token] = authHeader.split(' ');
  try {
    const decoded = jwt.verify(token, SECRET);
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido.' });
  }
}
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
}

export interface TwoFactorVerification {
  valid: boolean;
  message: string;
}

/**
 * Serviço de autenticação em dois fatores usando TOTP
 * (Time-based One-Time Password)
 */
export const twoFactorService = {
  /**
   * Gera um novo secret para TOTP e retorna QR code para o usuário
   * @param email Email do usuário
   * @param appName Nome da aplicação (padrão: TrackOne Finance)
   * @returns Objeto com secret e QR code em formato data URL
   */
  async generateSecret(email: string, appName = 'TrackOne Finance'): Promise<TwoFactorSetup> {
    try {
      // Gerar secret
      const secret = speakeasy.generateSecret({
        name: `${appName} (${email})`,
        issuer: appName,
        length: 32 // 256 bits de segurança
      });

      if (!secret.otpauth_url) {
        throw new Error('Falha ao gerar URL de autenticação');
      }

      // Gerar QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url);

      return {
        secret: secret.base32,
        qrCode
      };
    } catch (error) {
      console.error('Erro ao gerar secret 2FA:', error);
      throw new Error('Falha ao gerar configuração de 2FA');
    }
  },

  /**
   * Verifica se o código TOTP fornecido é válido
   * @param secret Secret do usuário armazenado no banco de dados
   * @param token Código TOTP fornecido pelo usuário (6 dígitos)
   * @param window Janela de tempo para aceitar códigos anteriores/posteriores (padrão: 2)
   * @returns Objeto com resultado da validação
   */
  verifyToken(secret: string, token: string, window = 2): TwoFactorVerification {
    try {
      // Remover qualquer espaço do token
      const cleanToken = token.replace(/\s/g, '');

      // Validar formato: deve ser 6 dígitos
      if (!/^\d{6}$/.test(cleanToken)) {
        return {
          valid: false,
          message: 'Código deve ser 6 dígitos'
        };
      }

      // Verificar o token
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: cleanToken,
        window: window
      });

      if (verified) {
        return {
          valid: true,
          message: 'Código 2FA válido'
        };
      } else {
        return {
          valid: false,
          message: 'Código 2FA inválido ou expirado'
        };
      }
    } catch (error) {
      console.error('Erro ao verificar token 2FA:', error);
      return {
        valid: false,
        message: 'Erro ao validar código'
      };
    }
  },

  /**
   * Gera um token temporário para o usuário enquanto aguarda validação de 2FA
   * Este token tem expiração curta (5 minutos)
   * @param userId ID do usuário
   * @param email Email do usuário
   * @returns Token temporário
   */
  generateTempToken(userId: number, email: string): string {
    const jwt = require('jsonwebtoken');
    const SECRET = process.env.JWT_SECRET || 'trackeone_finance_secret_key_2025';
    
    return jwt.sign(
      {
        id: userId,
        email: email,
        tempToken: true,
        requires2FA: true
      },
      SECRET,
      { expiresIn: '5m' } // 5 minutos
    );
  },

  /**
   * Valida um token temporário
   * @param token Token temporário a validar
   * @returns Dados do token se válido, null se inválido
   */
  validateTempToken(token: string): any {
    const jwt = require('jsonwebtoken');
    const SECRET = process.env.JWT_SECRET || 'trackeone_finance_secret_key_2025';
    
    try {
      const decoded = jwt.verify(token, SECRET);
      if (decoded.tempToken && decoded.requires2FA) {
        return decoded;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
};

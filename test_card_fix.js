#!/usr/bin/env node

/**
 * TESTE DA CORREÇÃO - Fix Card Number Length
 * Este script testa o endpoint de correção em produção
 */

const axios = require('axios');

async function testCardLengthFix() {
    console.log('🧪 TESTE DA CORREÇÃO - Fix Card Number Length');
    console.log('====================================================');
    
    // URL da API em produção
    const API_URL = 'https://ngvtech.com.br/api';
    
    try {
        console.log('🔗 Testando endpoint de correção...');
        
        // Fazer request para o endpoint de correção
        const response = await axios.post(`${API_URL}/cards/fix-card-number-length`, {}, {
            headers: {
                'Content-Type': 'application/json',
                // Adicionar headers de auth se necessário
            },
            timeout: 30000
        });
        
        console.log('✅ Resposta recebida:', response.data);
        
        if (response.data.success) {
            console.log('🎉 CORREÇÃO APLICADA COM SUCESSO!');
            console.log('📊 Informações da coluna:', response.data.columnInfo);
        } else {
            console.log('⚠️ Correção não aplicada:', response.data.message);
        }
        
    } catch (error) {
        if (error.response) {
            console.error('❌ Erro na API:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('❌ Erro de conexão:', error.message);
        } else {
            console.error('❌ Erro:', error.message);
        }
    }
}

// Executar teste
testCardLengthFix().catch(console.error);
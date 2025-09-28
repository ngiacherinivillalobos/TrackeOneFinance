#!/usr/bin/env node

/**
 * VERIFICAÇÃO DE DEPLOY - TrackeOne Finance
 * Verifica se o deploy foi aplicado corretamente no Vercel
 */

const axios = require('axios');

async function checkDeployStatus() {
    console.log('🔍 VERIFICAÇÃO DE DEPLOY - TrackeOne Finance');
    console.log('================================================');
    
    const FRONTEND_URL = 'https://ngvtech.com.br';
    
    try {
        console.log('🌐 Testando acesso ao frontend...');
        
        const response = await axios.get(FRONTEND_URL, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Deploy-Checker/1.0',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        
        console.log(`✅ Frontend acessível: ${response.status}`);
        console.log(`📊 Tamanho da resposta: ${response.data.length} bytes`);
        
        // Verificar se contém o script principal
        if (response.data.includes('index-') && response.data.includes('.js')) {
            console.log('✅ Scripts JS detectados no HTML');
        } else {
            console.log('⚠️ Scripts JS não detectados');
        }
        
        // Verificar último deploy
        const headers = response.headers;
        console.log('📋 Headers relevantes:');
        console.log(`   - Server: ${headers.server || 'N/A'}`);
        console.log(`   - Date: ${headers.date || 'N/A'}`);
        console.log(`   - Cache-Control: ${headers['cache-control'] || 'N/A'}`);
        
        // Verificar se há meta tags atualizadas
        if (response.data.includes('TrackeOne Finance')) {
            console.log('✅ Meta tags do projeto detectadas');
        }
        
        console.log('\n🎯 RECOMENDAÇÕES:');
        console.log('1. Acesse: https://ngvtech.com.br/clear-cache.html');
        console.log('2. Ou force refresh: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)');
        console.log('3. Aguarde 2-3 minutos para propagação completa do CDN');
        
    } catch (error) {
        console.error('❌ Erro ao verificar deploy:', error.message);
        
        if (error.code === 'ECONNABORTED') {
            console.log('⏱️ Timeout - Deploy pode estar em andamento');
        } else if (error.response) {
            console.log(`🔍 Status HTTP: ${error.response.status}`);
        } else {
            console.log('🌐 Erro de conexão - Verifique conectividade');
        }
    }
}

// Executar verificação
checkDeployStatus().catch(console.error);
// Endpoint de teste temporário para verificar se as correções estão funcionando
const testCorrections = async (req: Request, res: Response) => {
  try {
    const { db, all, get, run } = getDatabase();
    
    // Teste 1: Verificar se coluna is_paid existe
    const tableInfo = await all(db, "PRAGMA table_info(transactions)");
    const isPaidColumn = tableInfo.find((col: any) => col.name === 'is_paid');
    
    // Teste 2: Verificar ambiente e função de data
    const isProduction = process.env.NODE_ENV === 'production';
    const currentDateFunction = isProduction ? 'CURRENT_DATE' : "date('now')";
    
    // Teste 3: Verificar se há transações com is_paid
    const transactionsWithIsPaid = await all(db, "SELECT id, is_paid, payment_status_id FROM transactions LIMIT 5");
    
    // Teste 4: Criar uma transação de teste com is_paid=true
    const testResult = {
      test1_isPaidColumn: isPaidColumn ? 'EXISTS' : 'NOT_EXISTS',
      test2_environment: {
        NODE_ENV: process.env.NODE_ENV,
        isProduction,
        currentDateFunction
      },
      test3_sampleTransactions: transactionsWithIsPaid,
      test4_createTransactionLogic: {
        is_paid_true_should_set_status: 2,
        current_logic: 'if (is_paid === true) { finalPaymentStatusId = 2; }'
      }
    };
    
    res.json(testResult);
  } catch (error) {
    console.error('Error in test corrections:', error);
    res.status(500).json({ error: error.message });
  }
};

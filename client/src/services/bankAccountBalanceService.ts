import api from '../lib/axios';
import { BankAccount } from './bankAccountService';

export interface BankAccountBalance extends BankAccount {
  initial_balance: number;
  current_balance: number;
  total_movements: number;
}

export const bankAccountBalanceService = {
  async getBankAccountsWithBalances(): Promise<BankAccountBalance[]> {
    const response = await api.get('/bank-accounts/balances');
    return response.data;
  },

  async getBankAccountBalance(bankAccountId: number): Promise<BankAccountBalance> {
    const response = await api.get(`/bank-accounts/${bankAccountId}/balance`);
    return response.data;
  }
};

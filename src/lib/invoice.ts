import { useEffect } from 'react';

import { addInvoice as dbAddInvoice } from './db';
import { errorHandler } from './errorHandler';
import { subscriptionPlans } from './subscription-plans';
import { useKV } from './kv';

import { useAuth } from '@/contexts/AuthContext';

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  planName: string;
  status: 'paid' | 'pending' | 'failed';
  downloadUrl?: string;
}

export function createInvoiceRecord(
  planId: 'advanced' | 'expert',
  amount: number,
): Invoice {
  const plan = subscriptionPlans.find((p) => p.id === planId);
  return {
    id: `inv_${Date.now()}`,
    date: new Date().toISOString(),
    amount,
    planName: plan?.name ?? 'Unknown Plan',
    status: 'paid',
  };
}

export function useInvoiceHistory(): {
  invoices: Invoice[];
  addInvoice: (planId: 'advanced' | 'expert', amount: number) => void;
} {
  const [invoices, setInvoices] = useKV<Invoice[]>('user-invoices', []);
  const { user } = useAuth();

  useEffect(() => {}, [user]);

  const addInvoice = (planId: 'advanced' | 'expert', amount: number): void => {
    const newInvoice = createInvoiceRecord(planId, amount);
    setInvoices((current) => [newInvoice, ...current].slice(0, 12));

    if (user) {
      dbAddInvoice({
        user_id: user.id,
        date: new Date().toISOString(),
        amount,
        plan_name: newInvoice.planName,
        status: 'paid',
        download_url: null,
      }).catch((error) => {
        errorHandler.handleDatabaseError(
          'add invoice to database',
          error instanceof Error ? error : new Error(String(error)),
          {
            userId: user.id,
            component: 'invoice',
            metadata: {
              amount,
              planName: newInvoice.planName,
            },
          },
        );
      });
    }
  };

  return { invoices, addInvoice };
}

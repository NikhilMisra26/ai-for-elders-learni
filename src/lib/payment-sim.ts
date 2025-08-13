export interface PaymentMethod {
  id: string;
  type: 'card';
  last4: string;
  brand: string;
  expiry: string;
  isDefault: boolean;
}

export async function simulatePaymentFlow(planId: string): Promise<{
  success: boolean;
  paymentMethod?: PaymentMethod;
  error?: string;
}> {
  return new Promise((resolve) => {
    setTimeout((): void => {
      console.debug(`Simulating payment for plan: ${planId}`);
      const success = Math.random() > 0.05;

      if (success) {
        const paymentMethod: PaymentMethod = {
          id: `pm_${Date.now()}`,
          type: 'card',
          last4: Math.floor(Math.random() * 9000 + 1000).toString(),
          brand: ['visa', 'mastercard', 'amex'][Math.floor(Math.random() * 3)],
          expiry: '12/28',
          isDefault: true,
        };
        resolve({ success: true, paymentMethod });
      } else {
        resolve({
          success: false,
          error:
            'Payment failed. Please check your card details and try again.',
        });
      }
    }, 2000);
  });
}

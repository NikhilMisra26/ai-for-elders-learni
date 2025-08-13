import { strict as assert } from 'assert';
import { createInvoiceRecord } from '../src/lib/invoice';

const invoice = createInvoiceRecord('advanced', 1.99);
assert.equal(invoice.planName, 'Advanced Learning');
assert.equal(invoice.amount, 1.99);
assert.equal(invoice.status, 'paid');
console.log('invoice tests passed');

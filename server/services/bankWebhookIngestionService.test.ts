import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractInvoiceReference,
  ingestBankWebhook,
} from './bankWebhookIngestionService.ts';
import { upsertBusinessEntity, getBusinessEntity } from './businessDataService.ts';

test('bankWebhookIngestionService - extractInvoiceReference parses multiple invoice patterns', () => {
  assert.equal(extractInvoiceReference('Thanh toan INV-2026-001 mua ban quyen'), 'INV-2026-001');
  assert.equal(extractInvoiceReference('CT HD8899 mua goi SaaS'), 'HD8899');
  assert.equal(extractInvoiceReference('Chuyen tien BILL-456'), 'BILL-456');
  assert.equal(extractInvoiceReference('Khong co ma hoa don nao'), null);
});

test('bankWebhookIngestionService - ingestBankWebhook auto-reconciles invoice and updates customer LTV', () => {
  // Tạo customer và invoice mẫu trong businessDataService
  const customer = upsertBusinessEntity({
    id: 'cust_acme_corp',
    type: 'customer',
    data: { name: 'Acme Corp', totalSpent: 5000000 },
  });

  const invoice = upsertBusinessEntity({
    id: 'inv_test_999',
    type: 'invoice',
    data: {
      invoiceCode: 'INV-999',
      customerId: customer.id,
      amount: 15000000,
      status: 'pending',
    },
  });

  const webhookResult = ingestBankWebhook({
    transactionId: 'MB_TXN_88888',
    amount: 15000000,
    description: 'Cong ty ABC thanh toan INV-999',
    bank: 'MBBank',
  });

  assert.equal(webhookResult.success, true);
  assert.equal(webhookResult.reconciled, true);
  assert.equal(webhookResult.matchedInvoice?.id, invoice.id);
  assert.equal(webhookResult.matchedInvoice?.newStatus, 'paid');
  assert.equal(webhookResult.matchedCustomer?.newTotalSpent, 20000000);

  // Kiểm tra entity thực tế đã được cập nhật
  const updatedInvoice = getBusinessEntity(invoice.id);
  assert.equal(updatedInvoice?.data.status, 'paid');
  assert.equal(updatedInvoice?.data.isPaid, true);

  const updatedCustomer = getBusinessEntity(customer.id);
  assert.equal(updatedCustomer?.data.totalSpent, 20000000);
});

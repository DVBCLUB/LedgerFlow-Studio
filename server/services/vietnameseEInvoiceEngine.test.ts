import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateEInvoiceXML } from './vietnameseEInvoiceEngine.ts';

describe('vietnameseEInvoiceEngine - Circular 78 & Decree 123 e-Invoice XML', () => {
  it('generates valid e-Invoice XML with VAT and digital signature hash', () => {
    const result = generateEInvoiceXML({
      sellerTaxCode: '0312345678',
      sellerName: 'CÔNG TY TNHH CÔNG NGHỆ LEDGERFLOW STUDIO',
      sellerAddress: 'Tòa nhà Landmark 81, TP. Hồ Chí Minh',
      buyerName: 'CÔNG TY CỔ PHẦN ĐẦU TƯ SỐ VIỆT',
      buyerTaxCode: '0109876543',
      buyerEmail: 'ke_toan@dautuso.vn',
      paymentMethod: 'CK',
      provider: 'misa',
      items: [
        {
          name: 'Gói Thuê bao Phần mềm LedgerFlow ERP (1 năm)',
          unit: 'Gói',
          quantity: 1,
          unitPrice: 20000000,
          vatRatePercent: 10,
          totalAmount: 20000000,
          vatAmount: 2000000,
        },
        {
          name: 'Khóa Huấn Luyện AI Staff Cho Kế Toán',
          unit: 'Khóa',
          quantity: 2,
          unitPrice: 5000000,
          vatRatePercent: 8,
          totalAmount: 10000000,
          vatAmount: 800000,
        },
      ],
    });

    assert.ok(result.invoiceId.startsWith('EINV_'));
    assert.equal(result.subTotalVnd, 30000000);
    assert.equal(result.totalVatVnd, 2800000); // 20M*10% + 10M*8% = 2M + 800k = 2.8M
    assert.equal(result.grandTotalVnd, 32800000);
    assert.ok(result.xmlContent.includes('<HDon>'));
    assert.ok(result.xmlContent.includes('<MST>0312345678</MST>'));
    assert.ok(result.xmlContent.includes('<MST>0109876543</MST>'));
    assert.ok(result.xmlContent.includes('<NCCap>MISA</NCCap>'));
    assert.ok(result.xmlHashSha256.length === 64);
    assert.equal(result.status, 'signed');
  });
});

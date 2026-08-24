import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { withTestServer } from './testAppHelper.ts';

// Cô lập business store vào file tạm — test KHÔNG bao giờ chạm runtime thật.
process.env.BUSINESS_DATA_FILE = path.join(os.tmpdir(), `test_business_${Date.now()}.json`);
process.env.BUSINESS_DATA_SQLITE_FILE = path.join(os.tmpdir(), `test_business_${Date.now()}.sqlite3`);

describe('API Integration - Zero-Touch Commerce Loop closes the money loop', () => {
  test('loop → invoice → business store (accountCode 131)', async () => {
    await withTestServer(async (baseUrl) => {
      // 1. Khởi động vòng lặp
      const startRes = await fetch(`${baseUrl}/api/commerce/loop/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'prod_itest_001' }),
      });
      const startData: any = await startRes.json();
      assert.equal(startData.success, true);
      const id = startData.run.id;

      // 2. signal → build → market → sell (không có cổng trước sell→invoice)
      let run: any = startData.run;
      for (let i = 0; i < 3; i += 1) {
        const r = await fetch(`${baseUrl}/api/commerce/loop/${id}/advance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approve: false }),
        });
        run = (await r.json()).run;
      }
      assert.equal(run.stage, 'sell');

      // 3. sell → invoice BẮT BUỘC phê duyệt: không approve thì dừng chờ
      const gateRes = await fetch(`${baseUrl}/api/commerce/loop/${id}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve: false }),
      });
      const gateData: any = await gateRes.json();
      assert.equal(gateData.run.status, 'awaiting_approval');
      assert.equal(gateData.run.stage, 'sell');

      // 4. Phê duyệt → invoice
      const approvedRes = await fetch(`${baseUrl}/api/commerce/loop/${id}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve: true }),
      });
      const approvedData: any = await approvedRes.json();
      assert.equal(approvedData.run.stage, 'invoice');

      // 5. Ghi doanh thu (route sẽ persist invoice entity)
      const revRes = await fetch(`${baseUrl}/api/commerce/loop/${id}/revenue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revenueVnd: 120_000_000, costVnd: 80_000_000 }),
      });
      assert.equal((await revRes.json()).success, true);

      // 6. Xác minh business store đã có invoice accountCode 131 cho run này
      const { listBusinessEntities } = await import('../businessDataService.ts');
      const invoices = listBusinessEntities('invoice', 100);
      const invoice = invoices.find((e) => e.data?.loopId === id);
      assert.ok(invoice, 'invoice entity should be persisted');
      assert.equal(invoice.data.accountCode, 131);
      assert.equal(invoice.data.amountVnd, 120_000_000);

      // deal cũng phải được ghi khi chạm sell
      const deals = listBusinessEntities('deal', 100);
      const deal = deals.find((e) => e.data?.loopId === id);
      assert.ok(deal, 'deal entity should be persisted');
    });
  });
});

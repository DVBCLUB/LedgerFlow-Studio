import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { withTestServer } from './testAppHelper.ts';

describe('API Integration - Vietnamese Privacy Masker (Nghị định 13/2023/NĐ-CP)', () => {
  test('POST /api/privacy/mask masks Vietnamese PII accurately', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/privacy/mask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hợp đồng số 123 của khách hàng Nguyễn Văn A, CCCD: 079123456789, SĐT: 0912345678, MST: 0312345678.',
        }),
      });

      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.maskedText);
      assert.ok(!data.maskedText.includes('079123456789'), 'CCCD must be masked');
      assert.ok(!data.maskedText.includes('0912345678'), 'Phone must be masked');
    });
  });

  test('POST /api/voice/call/turn responds to interactive voice speech', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/voice/call/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speakerRole: 'role_chief_of_staff',
          spokenUserText: 'Báo cáo doanh thu tháng này thế nào?',
        }),
      });

      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.turn.aiSpokenResponseVi);
    });
  });

});

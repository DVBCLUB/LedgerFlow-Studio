import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  submitCrossDeptRequest,
  respondToCrossDeptRequest,
  completeCrossDeptRequest,
  listCrossDeptRequests,
  autoOrchestrateClosedDeal,
  __resetCrossDeptRequestsForTesting,
} from './crossDepartmentRequestBridge.ts';

describe('crossDepartmentRequestBridge - Cross-Department Collaboration', () => {
  beforeEach(() => {
    __resetCrossDeptRequestsForTesting();
  });

  it('submits a request from Growth to Product and routes to Chief of Staff', () => {
    const req = submitCrossDeptRequest({
      fromDepartment: 'GROWTH',
      fromRoleId: 'role_ai_market_scout',
      toDepartment: 'PRODUCT',
      title: 'Tạo Landing Page cho chiến dịch TikTok Mới',
      description: 'Cần 1 trang đích có form thu lead và kết nối webhook.',
      priority: 'HIGH',
    });

    assert.ok(req.requestId.startsWith('xdept_'));
    assert.equal(req.toManagerRoleId, 'role_chief_of_staff');
    assert.equal(req.status, 'SUBMITTED');
  });

  it('allows manager to accept and auto-delegate to team member, then complete', () => {
    const req = submitCrossDeptRequest({
      fromDepartment: 'FINANCE',
      fromRoleId: 'role_ai_cfo_director',
      toDepartment: 'SECURITY',
      title: 'Kiểm toán mã nguồn module VietQR Reconciler',
      description: 'Rà soát logic gạch nợ trước kỳ quyết toán.',
    });

    const accepted = respondToCrossDeptRequest({
      requestId: req.requestId,
      decision: 'ACCEPTED',
      responseComment: 'Đã tiếp nhận, giao cho Security Judge rà soát ngay.',
      assignToWorkerRoleId: 'role_ai_security_judge',
    });

    assert.equal(accepted.status, 'IN_PROGRESS');
    assert.equal(accepted.assignedWorkerRoleId, 'role_ai_security_judge');

    const completed = completeCrossDeptRequest(req.requestId, 'Rà soát hoàn tất, không có lỗ hổng.');
    assert.equal(completed.status, 'COMPLETED');
  });

  it('orchestrates closed sales deal to auto-provision customer, delivery task, and invoice', async () => {
    const result = await autoOrchestrateClosedDeal({
      dealId: 'deal_enterprise_99',
      customerName: 'VinTech Solutions',
      customerEmail: 'cto@vintech.local',
      amountVnd: 75_000_000,
      productName: 'LedgerFlow Enterprise Hub',
    });

    assert.ok(result.customerId.startsWith('cust_'));
    assert.ok(result.taskId.startsWith('task_delivery_'));
    assert.ok(result.invoiceId.startsWith('inv_'));
    assert.ok(result.crossDeptRequestId.startsWith('xdept_'));
  });

  it('lists cross-department requests with filters', () => {
    submitCrossDeptRequest({
      fromDepartment: 'MEDIA',
      fromRoleId: 'role_ai_market_scout',
      toDepartment: 'PRODUCT',
      title: 'Render asset 3D game',
      description: 'Asset cho Phaser.js demo',
    });

    const list = listCrossDeptRequests({ department: 'PRODUCT' });
    assert.ok(list.length >= 1);
  });
});

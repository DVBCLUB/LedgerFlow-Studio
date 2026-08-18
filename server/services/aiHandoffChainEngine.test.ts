import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startSoftwareReleaseChain, advanceHandoffChain, listHandoffChains } from './aiHandoffChainEngine.ts';

describe('aiHandoffChainEngine - Automated Multi-Agent Handoffs', () => {
  it('initializes software release chain across 4 specialized roles', () => {
    const chain = startSoftwareReleaseChain({
      featureTitle: 'Tích hợp Thanh Toán VietQR Tự Động',
    });

    assert.ok(chain.chainId.startsWith('chn_sw_'));
    assert.equal(chain.steps.length, 4);
    assert.equal(chain.currentStepIndex, 0);
    assert.equal(chain.status, 'IN_PROGRESS');
  });

  it('advances step by step until reaching human approval gateway', () => {
    const chain = startSoftwareReleaseChain({
      featureTitle: 'Bổ sung Báo Cáo Kế Toán VAS 200',
    });

    // Step 0: Dev completes coding
    const step1 = advanceHandoffChain({
      chainId: chain.chainId,
      stepOutputSummary: 'Đã hoàn thành 100% component và types.',
      isSuccess: true,
    });
    assert.equal(step1.currentStepIndex, 1);

    // Step 1: QA completes test
    const step2 = advanceHandoffChain({
      chainId: chain.chainId,
      stepOutputSummary: '16/16 test suites đạt 100% pass.',
      isSuccess: true,
    });
    assert.equal(step2.currentStepIndex, 2);

    // Step 2: Security Judge completes scan
    const step3 = advanceHandoffChain({
      chainId: chain.chainId,
      stepOutputSummary: 'Không có lỗ hổng bảo mật hay secret leak.',
      isSuccess: true,
    });
    assert.equal(step3.currentStepIndex, 3);
    assert.equal(step3.status, 'WAITING_FOUNDER_APPROVAL');
  });

  it('lists all active and past chains', () => {
    const chains = listHandoffChains();
    assert.ok(chains.length >= 2);
  });
});

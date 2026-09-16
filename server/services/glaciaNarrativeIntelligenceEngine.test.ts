import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  frameDataIntoStory,
  crystallizeCompanyMythAndLesson,
  listNarratives,
} from './glaciaNarrativeIntelligenceEngine.ts';

describe('Glacia Narrative Intelligence Engine (Epoch 8)', () => {
  it('frames raw data metrics into compelling 3-act executive narratives for the CEO', () => {
    const story = frameDataIntoStory('Tỷ lệ chuyển đổi khách hàng tăng từ 5% lên 18%', 'CEO', 'executive_three_act');

    assert.ok(story.storyId.startsWith('story-'));
    assert.equal(story.audience, 'CEO');
    assert.ok(story.act1_SettingAndContext.length > 10);
    assert.ok(story.act2_ConflictAndClimax.length > 10);
    assert.ok(story.act3_ResolutionAndAction.length > 10);
    assert.ok(story.persuasivePowerScore >= 90);
  });

  it('tailors narratives dynamically for Client and Investor personas', () => {
    const clientStory = frameDataIntoStory('Tự động hóa 100% hóa đơn Nghị định 123', 'CLIENT');
    const investorStory = frameDataIntoStory('Tăng trưởng doanh thu 300%', 'INVESTOR');

    assert.ok(clientStory.title.includes('Khách Hàng'));
    assert.ok(investorStory.title.includes('Nhà Đầu Tư'));
  });

  it('crystallizes organizational challenges into permanent executive wisdom and folklore', () => {
    const lore = crystallizeCompanyMythAndLesson(
      'Hệ thống quá tải khi phát hành 10,000 hóa đơn đồng thời',
      'Viết lại thuật toán batching xử lý bất đồng bộ',
      'Kiến trúc bất đồng bộ là nền tảng sống còn của hệ thống chịu tải cao'
    );

    assert.ok(lore.lessonId.startsWith('lore-'));
    assert.ok(lore.crystallizedWisdom.includes('Kiến trúc'));
  });

  it('retrieves persistent narrative stories history cleanly', () => {
    const list = listNarratives();
    assert.ok(list.length >= 1);
  });
});

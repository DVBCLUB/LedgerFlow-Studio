import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateGameAssetBundle,
  listGameAssetBundles,
  updateGameAssetStatus,
} from './gameAssetPipeline.ts';

test('gameAssetPipeline - generates complete 5-stage bundle and tracks in registry', async () => {
  const bundle = await generateGameAssetBundle({
    assetName: 'Cyber Ninja Shadow',
    category: 'character',
    genre: 'rpg',
    style: 'pixel_16bit',
    customRequirements: 'Có kỹ năng tàng hình và phi tiêu',
  });

  assert.ok(bundle.id.startsWith('asset_'));
  assert.equal(bundle.assetName, 'Cyber Ninja Shadow');
  assert.ok(bundle.conceptArt.prompt.length > 0);
  assert.ok(bundle.spriteSpec.dimensions.length > 0);
  assert.ok(bundle.spriteSpec.frameAnimations.length > 0);
  assert.ok(bundle.audioSpec.sfxPrompt.length > 0);
  assert.ok(bundle.dialogueAndLore.loreSnippet.length > 0);
  assert.ok(bundle.statBalance.hp > 0);
  assert.equal(bundle.status, 'draft');

  // List and check
  const list = listGameAssetBundles();
  const found = list.find((b) => b.id === bundle.id);
  assert.ok(found);

  // Approve
  const updated = updateGameAssetStatus(bundle.id, 'approved', 'CEO Test');
  assert.ok(updated);
  assert.equal(updated?.status, 'approved');
  assert.equal(updated?.approvedBy, 'CEO Test');
});

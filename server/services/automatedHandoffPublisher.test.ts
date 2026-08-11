import assert from 'node:assert/strict';
import test from 'node:test';
import {
  publishAutomatedReleaseHandoff,
  getReleaseHandoffPackage,
  listReleaseHandoffPackages,
} from './automatedHandoffPublisher.ts';

test('publishAutomatedReleaseHandoff packages features and calculates SHA-256 checksum', async () => {
  const pkg = await publishAutomatedReleaseHandoff({
    version: 'v1.50.0',
    title: 'Autonomous System Level 5 Core',
    author: 'AI Workforce Lead',
    features: [
      {
        id: 'ft_100',
        title: 'Executive Autonomy Cockpit',
        category: 'automation',
        summary: 'Calculates Enterprise Autonomy Score 0-100%.',
      },
    ],
  });

  assert.ok(pkg.id.startsWith('rel_'));
  assert.equal(pkg.version, 'v1.50.0');
  assert.ok(pkg.checksum.length === 64); // SHA-256 hex string length
  assert.ok(pkg.markdownContent.includes('SHA-256 Checksum:'));

  const retrieved = getReleaseHandoffPackage(pkg.id);
  assert.equal(retrieved?.id, pkg.id);

  const retrievedByVer = getReleaseHandoffPackage('v1.50.0');
  assert.equal(retrievedByVer?.id, pkg.id);
});

test('listReleaseHandoffPackages lists published release packages', async () => {
  const list = listReleaseHandoffPackages(10);
  assert.ok(list.length >= 1);
});

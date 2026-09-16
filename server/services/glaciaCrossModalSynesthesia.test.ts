import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  transmuteDataDomain,
  listSynesthesiaRecords,
} from './glaciaCrossModalSynesthesia.ts';

describe('Glacia Universal Cross-Modal Synesthesia Engine (Epoch 11)', () => {
  it('transmutes financial flow into harmonic audio frequencies and 3D terrain meshes', () => {
    const res = transmuteDataDomain('financial_flow', '3d_spatial_mesh', 'Dòng tiền dương 185tr/tháng, $0 token');

    assert.ok(res.transmutationId.startsWith('syn-'));
    assert.equal(res.harmonicAudioMap.baseFrequencyHz, 432);
    assert.equal(res.harmonicAudioMap.chordType, 'C_Major_7th');
    assert.equal(res.spatial3dMeshDescriptor.vertexCount, 4096);
    assert.ok(res.executiveSynestheticInsight.includes('432Hz'));
  });

  it('retrieves persistent synesthesia transmutation records cleanly', () => {
    const list = listSynesthesiaRecords();
    assert.ok(list.length >= 1);
  });
});

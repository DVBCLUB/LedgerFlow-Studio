import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateGameDistributionPackage,
  loadDistributionPackages,
  getVirtualCastRoster,
} from './glaciaAutonomousGameDistributor.ts';

describe('glaciaAutonomousGameDistributor - Level 5 Distribution & Virtual Cast', () => {
  it('generates a full multi-platform distribution package with PWA and Press Kit', () => {
    const pkg = generateGameDistributionPackage({
      gameTitle: 'Titan Cyber Rift 2026',
      genre: 'space_shooter',
    });

    assert.ok(pkg.id.startsWith('dist-pkg-'));
    assert.equal(pkg.gameTitle, 'Titan Cyber Rift 2026');
    assert.equal(pkg.genre, 'space_shooter');
    assert.ok(pkg.pwaManifest.name.includes('Titan Cyber Rift'));
    assert.equal(pkg.pwaManifest.display, 'standalone');
    assert.ok(pkg.pressKit.keyFeatures.length >= 4);
    assert.ok(pkg.pressKit.viralSocialHooks.length >= 3);
    assert.ok(pkg.storefrontMetadata.itchIoTags.length >= 5);
  });

  it('loads existing distribution packages from storage', () => {
    const list = loadDistributionPackages();
    assert.ok(Array.isArray(list));
    assert.ok(list.length > 0);
  });

  it('retrieves the virtual 3D cast roster with complete specs and Blender scripts', () => {
    const cast = getVirtualCastRoster();
    assert.ok(Array.isArray(cast));
    assert.ok(cast.length >= 4);

    const valkyrie = cast.find((c) => c.id === 'cast-glacia-valkyrie');
    assert.ok(valkyrie);
    assert.equal(valkyrie.archetype, 'protagonist');
    assert.ok(valkyrie.animationClips.length >= 3);
    assert.ok(valkyrie.blenderScriptSnippet.includes('bpy'));
  });
});

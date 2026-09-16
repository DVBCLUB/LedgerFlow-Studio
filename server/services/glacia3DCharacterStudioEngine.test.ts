import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESET_ARCHETYPES,
  generate3DCharacterModel,
  generateGlaciaPresetAvatar,
  type CharacterCustomizationOptions,
} from './glacia3DCharacterStudioEngine.ts';

describe('glacia3DCharacterStudioEngine - 3D Character Studio & Avatar Generator', () => {
  it('loads preset archetypes with valid colors and weapons', () => {
    assert.ok(PRESET_ARCHETYPES.length >= 5);
    const cyberGlacia = PRESET_ARCHETYPES.find((a) => a.id === 'cyber_glacia_prime');
    assert.ok(cyberGlacia);
    assert.equal(cyberGlacia.defaultWeapon, 'laser_katana');
    assert.ok(cyberGlacia.defaultColors.primary.startsWith('#'));
  });

  it('generates a custom 3D character model with Three.js code and mesh descriptor', () => {
    const options: CharacterCustomizationOptions = {
      archetypeId: 'valkyrie_warrior',
      characterName: 'Valkyrie Sigma',
      primaryColorHex: '#a855f7',
      emissiveColorHex: '#c084fc',
      armorMetallic: 0.85,
      glowIntensity: 2.5,
      weaponAttachment: 'laser_katana',
      auraParticleType: 'plasma_sparks',
      activeAnimation: 'attack',
      lipSyncVisemePreset: 'smile',
    };

    const character = generate3DCharacterModel(options);

    assert.ok(character.id.startsWith('char_'));
    assert.equal(character.name, 'Valkyrie Sigma');
    assert.equal(character.customization.armorMetallic, 0.85);
    assert.ok(character.meshDescriptor.headGeometry);
    assert.ok(character.meshDescriptor.materials.bodyMaterial.metallic === 0.85);
    assert.ok(character.threeJsRenderCode.includes('THREE.Group'));
    assert.ok(character.gltfExportBlueprint.nodeCount >= 10);
    assert.equal(character.gltfExportBlueprint.isMobileOptimized, true);
  });

  it('generates default Glacia preset avatar successfully', () => {
    const glaciaAvatar = generateGlaciaPresetAvatar();

    assert.equal(glaciaAvatar.name, 'Glacia Sovereign Prime');
    assert.ok(glaciaAvatar.archetype.includes('Glacia Prime'));
    assert.equal(glaciaAvatar.customization.weaponAttachment, 'laser_katana');
    assert.ok(glaciaAvatar.threeJsRenderCode.includes('THREE.Mesh'));
    assert.ok(glaciaAvatar.animationTimings.attackSpeedSec > 0);
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateBlenderPythonScript,
  generateGraphicDesignAutomationPlan,
  generateFfmpegVideoScript,
  bridge3DCharacterToGame,
  bridge3DCharacterToVideoStage,
  type BlenderCharacterSpec,
} from './freeToolRobotBridge.ts';
import { executeSoftwareRobotWorkflow } from './softwareRobotOrchestrator.ts';


test('Free Tool Robot Bridge: 1. Sinh script Python Blender (bpy) Headless $0 3D Modeling', () => {
  const spec: BlenderCharacterSpec = {
    characterName: 'GlaciaCyber',
    archetype: 'humanoid',
    meshDetails: {
      height: 1.75,
      headScale: 1.0,
      primaryColorHex: '#38bdf8',
      secondaryColorHex: '#1e293b',
      metallic: 0.8,
      roughness: 0.2,
    },
    exportFormat: 'glb',
    outputFilename: 'runtime/avatar_glacia.glb',
    includeArmatureRig: true,
  };

  const script = generateBlenderPythonScript(spec);
  assert.ok(script.includes('import bpy'));
  assert.ok(script.includes('bpy.ops.wm.read_factory_settings'));
  assert.ok(script.includes('GlaciaCyber_Head'));
  assert.ok(script.includes('GlaciaCyber_Torso'));
  assert.ok(script.includes('GlaciaCyber_Rig'));
  assert.ok(script.includes('export_scene.gltf'));
  assert.ok(script.includes('avatar_glacia.glb'));
});

test('Free Tool Robot Bridge: 2. Sinh kế hoạch tự động hóa đồ họa Canva / Photopea $0', () => {
  const plan = generateGraphicDesignAutomationPlan({
    title: 'Phần Mềm Quản Trị Doanh Nghiệp Tự Động',
    theme: 'dark_cyber',
    dimensions: { width: 1200, height: 630 },
  });

  assert.ok(plan.id.startsWith('graphic_'));
  assert.equal(plan.toolTarget, 'canva');
  assert.equal(plan.dimensions.width, 1200);
  assert.equal(plan.dimensions.height, 630);
  assert.ok(plan.elements.length >= 4);
  assert.ok(plan.domExecutionScript.includes('canvas.getContext'));
});

test('Free Tool Robot Bridge: 3. Sinh script render video đa phân cảnh FFmpeg $0', () => {
  const videoScript = generateFfmpegVideoScript({
    outputName: 'viral_product_intro',
    totalDurationSec: 45,
    scenesCount: 5,
    hasVoiceNarration: true,
  });

  assert.equal(videoScript.outputVideoFile, 'viral_product_intro.mp4');
  assert.equal(videoScript.durationSec, 45);
  assert.ok(videoScript.powershellScript.includes('ffmpeg'));
  assert.ok(videoScript.powershellScript.includes('viral_product_intro.mp4'));
  assert.ok(videoScript.bashScript.includes('ffmpeg'));
});

test('Free Tool Robot Bridge: 4. Điều phối Software Robot chạy các action Blender, Canva, FFmpeg', async () => {
  const workflow = await executeSoftwareRobotWorkflow({
    name: 'Zero-Cost Multi-Tool Production Workflow',
    actions: [
      {
        id: 'act_blender',
        type: 'blender_script',
        name: '3D Character Generation',
        payload: { outputFilename: 'model.glb' },
      },
      {
        id: 'act_canva',
        type: 'canva_automation',
        name: 'Banner Poster Graphic Design',
        payload: { title: 'Launch Banner' },
      },
      {
        id: 'act_ffmpeg',
        type: 'ffmpeg_render',
        name: 'Multi-Track Video Stitching',
        payload: { durationSec: 30 },
      },
    ],
    requestedBy: 'free_tool_nexus',
  });

  assert.equal(workflow.status, 'completed');
  assert.equal(workflow.checkpoints.length, 3);
  assert.ok(workflow.checkpoints.every((cp) => cp.status === 'passed'));
  assert.ok(workflow.checkpoints[0].evidenceSummary.includes('Blender 3D headless robot'));
  assert.ok(workflow.checkpoints[1].evidenceSummary.includes('Canva/Graphic robot'));
  assert.ok(workflow.checkpoints[2].evidenceSummary.includes('FFmpeg robot'));
});

test('Free Tool Robot Bridge: 5. Cầu nối Siêu Nhẹ 3D Character -> Game Playable Hero (WASD & Mobile Touch)', () => {
  const spec = {
    characterName: 'GlaciaHero',
    archetype: 'humanoid' as const,
    meshDetails: { height: 1.8, headScale: 1.0, primaryColorHex: '#38bdf8', secondaryColorHex: '#0f172a', metallic: 0.5, roughness: 0.5 },
    exportFormat: 'glb' as const,
    outputFilename: 'runtime/glacia_hero.glb',
  };

  const gameBinding = bridge3DCharacterToGame(spec, 'hybrid');
  assert.equal(gameBinding.characterName, 'GlaciaHero');
  assert.equal(gameBinding.modelPath, 'runtime/glacia_hero.glb');
  assert.ok(gameBinding.controls.moveForward.includes('KeyW'));
  assert.ok(gameBinding.animations.some((a: any) => a.name === 'idle'));
  assert.ok(gameBinding.animations.some((a: any) => a.name === 'run'));
});

test('Free Tool Robot Bridge: 6. Cầu nối Siêu Nhẹ 3D Character -> Video AI MC (Chroma-Key & Viseme)', () => {
  const spec = {
    characterName: 'GlaciaMC',
    archetype: 'stylized_avatar' as const,
    meshDetails: { height: 1.7, headScale: 1.0, primaryColorHex: '#10b981', secondaryColorHex: '#020617', metallic: 0.3, roughness: 0.7 },
    exportFormat: 'glb' as const,
    outputFilename: 'runtime/glacia_mc.glb',
  };

  const videoBinding = bridge3DCharacterToVideoStage(spec, {
    backgroundVideo: 'demo_bg.mp4',
    outputVideo: 'final_demo.mp4',
  });
  assert.equal(videoBinding.actorName, 'GlaciaMC');
  assert.equal(videoBinding.chromaKeyColorHex, '#00FF00');
  assert.ok(videoBinding.ffmpegChromaOverlayCommand.includes('colorkey'));
  assert.ok(videoBinding.ffmpegChromaOverlayCommand.includes('demo_bg.mp4'));
});



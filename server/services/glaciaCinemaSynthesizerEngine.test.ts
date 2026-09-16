import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  synthesizeCinemaProject,
  type CinemaSynthesisRequest,
} from './glaciaCinemaSynthesizerEngine.ts';

describe('glaciaCinemaSynthesizerEngine - One-Click Cinema Synthesizer', () => {
  it('synthesizes full 5-stage cinema project from short idea prompt', () => {
    const req: CinemaSynthesisRequest = {
      ideaPrompt: 'Glacia thám hiểm không gian và xây dựng trạm vũ trụ AI',
      genreStyle: 'space_epic',
      aspectRatio: '16:9',
      voiceActorMood: 'epic_narrator',
    };

    const project = synthesizeCinemaProject(req);

    assert.ok(project.id.startsWith('cinema_'));
    assert.ok(project.title.includes('Phim AI'));
    assert.equal(project.genreStyle, 'space_epic');
    assert.equal(project.aspectRatio, '16:9');
    assert.ok(project.totalDurationSec >= 20);
    assert.equal(project.shots.length, 5);

    // Verify shot details
    assert.equal(project.shots[0].shotNumber, 1);
    assert.ok(project.shots[0].scriptVoiceoverVi.length > 10);
    assert.ok(project.shots[0].visualPrompt.includes('8k resolution'));
    assert.ok(project.shots[0].soundFxCue);

    // Verify audio synthesis preset & FFmpeg command
    assert.ok(project.webAudioSynthPreset.chordsBpm > 0);
    assert.ok(project.ffmpegRenderCommand.includes('ffmpeg'));
    assert.ok(project.fullScriptNarration.length > 50);
  });

  it('handles empty prompt by falling back to default theme', () => {
    const req: CinemaSynthesisRequest = {
      ideaPrompt: '',
      genreStyle: 'cyberpunk_scifi',
      aspectRatio: '9:16',
      voiceActorMood: 'cyber_glacia',
    };

    const project = synthesizeCinemaProject(req);

    assert.ok(project.id);
    assert.equal(project.shots.length, 5);
    assert.ok(project.originalIdea.includes('Glacia'));
  });
});

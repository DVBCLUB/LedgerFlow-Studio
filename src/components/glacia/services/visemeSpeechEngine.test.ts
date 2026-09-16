import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateVisemeMorph } from './visemeSpeechEngine.ts';

test('visemeSpeechEngine - calculateVisemeMorph returns SILENCE when not speaking', () => {
  const morph = calculateVisemeMorph(0.0, false, 'neutral', 0);
  assert.equal(morph.phoneme, 'SILENCE');
  assert.equal(morph.intensity, 0);
  assert.equal(morph.scaleY, 1.0);
});

test('visemeSpeechEngine - calculateVisemeMorph returns smiling shape when happy in silence', () => {
  const morph = calculateVisemeMorph(0.0, false, 'happy', 0);
  assert.equal(morph.phoneme, 'SILENCE');
  assert.ok(morph.scaleX > 1.0);
  assert.ok(morph.smileCurvature > 0);
});

test('visemeSpeechEngine - calculateVisemeMorph cycles through phonemes with audio amplitude', () => {
  const morphAA = calculateVisemeMorph(0.5, true, 'neutral', 0.0); // cycle 0 => AA
  assert.equal(morphAA.phoneme, 'AA');
  assert.ok(morphAA.scaleY > 1.5);
  assert.ok(morphAA.jawDrop > 0);

  const morphEE = calculateVisemeMorph(0.5, true, 'neutral', 0.2); // cycle 1 => EE
  assert.equal(morphEE.phoneme, 'EE');
  assert.ok(morphEE.scaleX > 1.3);
});

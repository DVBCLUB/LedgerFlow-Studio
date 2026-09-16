import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadEvolutionaryState,
  breedNextGeneration,
  createDefaultEvolutionSession,
} from './glaciaEvolutionaryGeneticEngine.ts';

describe('glaciaEvolutionaryGeneticEngine - Level 5 Genetic Code & Shader Breeding', () => {
  it('loads default evolutionary state with F2 population', () => {
    const state = loadEvolutionaryState();
    assert.ok(state.population.length >= 3);
    assert.ok(state.bestVariantOverall.fitnessScore >= 90);
    assert.ok(state.evolutionHistory.length >= 2);
  });

  it('breeds next generation and increases generation number with improved champion', () => {
    const initial = createDefaultEvolutionSession('Test Objective');
    const bred = breedNextGeneration({ targetObjective: 'Optimized Game Shaders' });
    assert.ok(bred.currentGeneration > initial.currentGeneration);
    assert.ok(bred.bestVariantOverall.name.includes('Champion') || bred.bestVariantOverall.name.includes('Quantum'));
    assert.ok(bred.bestVariantOverall.fitnessScore >= 98);
  });
});

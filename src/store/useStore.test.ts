import { beforeEach, describe, expect, it } from 'vitest';
import type { UnexpectedIdea } from '../types';
import { useStore } from './useStore';

const testIdea: UnexpectedIdea = {
  id: 'idea_test_product',
  title: 'Test Product Studio Idea',
  type: 'saas',
  nicheAudience: 'Small software product team',
  pricePoint: 100_000,
  speedRating: 7,
  costRating: 8,
  marketPain: 9,
  viralPotential: 5,
  description: 'A deterministic idea fixture for store tests.',
  guerrillaScore: 8.2,
  createdAt: '2026-06-15',
};

describe('useStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState({
      userEmail: '',
      isOfflineMode: false,
      activeIdea: testIdea,
    });
  });

  it('sets and persists user email', () => {
    useStore.getState().setUserEmail('founder@example.com');

    expect(useStore.getState().userEmail).toBe('founder@example.com');
    expect(localStorage.getItem('lf_user_email')).toBe('founder@example.com');
  });

  it('toggles and persists offline mode', () => {
    useStore.getState().toggleOfflineMode();

    expect(useStore.getState().isOfflineMode).toBe(true);
    expect(localStorage.getItem('lf_offline_mode')).toBe('true');
  });

  it('sets and persists active idea', () => {
    useStore.getState().setActiveIdea(testIdea);

    expect(useStore.getState().activeIdea.id).toBe(testIdea.id);
    expect(JSON.parse(localStorage.getItem('guerrilla_active_idea') || '{}')).toMatchObject({
      id: testIdea.id,
      title: testIdea.title,
    });
  });
});

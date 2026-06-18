import { describe, it, expect } from 'vitest';
import { MatcherService } from '../../src/features/analyzer/matcher.service';
import type { Profile } from '../../src/core/types/profile';

describe('MatcherService', () => {
  const mockProfile = {
    personal: { name: 'Test', email: 'test@example.com' },
    education: [],
    experience: [],
    projects: [],
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'React Native']
  } as unknown as Profile;

  it('should calculate 100% score for exact matches', () => {
    const jdText = "We are looking for someone with TypeScript, React, Node.js, and PostgreSQL. Experience in React Native is a plus.";
    const result = MatcherService.calculateMatch(jdText, mockProfile);
    expect(result.score).toBe(100);
    expect(result.missing.length).toBe(0);
    expect(result.matched).toEqual(['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'React Native']);
  });

  it('should correctly identify missing skills', () => {
    const jdText = "Looking for a React developer with PostgreSQL knowledge.";
    const result = MatcherService.calculateMatch(jdText, mockProfile);
    expect(result.score).toBe(40); // 2 out of 5
    expect(result.matched).toContain('React');
    expect(result.matched).toContain('PostgreSQL');
    expect(result.missing).toContain('TypeScript');
    expect(result.missing).toContain('Node.js');
    expect(result.missing).toContain('React Native');
  });

  it('should handle case insensitivity and punctuation safely', () => {
    const jdText = "Requirements: TYPESCRIPT. React! Node.js? Postgresql, react native;";
    const result = MatcherService.calculateMatch(jdText, mockProfile);
    expect(result.score).toBe(100);
  });

  it('should return 0 score if profile has no skills', () => {
    const emptyProfile = { ...mockProfile, skills: [] } as unknown as Profile;
    const jdText = "React TypeScript";
    const result = MatcherService.calculateMatch(jdText, emptyProfile);
    expect(result.score).toBe(0);
    expect(result.matched.length).toBe(0);
  });
});

import type { Profile } from '../../core/types/profile';
import { KeywordExtractor } from './keyword.extractor';

export interface MatchResult {
  score: number;
  matched: string[];
  missing: string[];
}

export class MatcherService {
  /**
   * Determines exact matches by checking if the Profile's listed skills 
   * are present exactly (case-insensitive) in the normalized JD text.
   */
  static calculateMatch(jdText: string, profile: Profile): MatchResult {
    const jdKeywords = KeywordExtractor.extractUniqueWords(jdText);
    
    // We also construct a full normalized JD string to check multi-word skills (like "React Native")
    const normalizedJD = KeywordExtractor.normalize(jdText);

    const matched: string[] = [];
    const missing: string[] = [];

    // All skills defined by the user
    const userSkills = profile.skills || [];

    if (userSkills.length === 0) {
      return { score: 0, matched: [], missing: [] };
    }

    userSkills.forEach(skill => {
      const normalizedSkill = KeywordExtractor.normalize(skill);
      const isMultiWord = normalizedSkill.includes(' ');

      if (isMultiWord) {
        // Exact substring match for multi-word
        if (normalizedJD.includes(normalizedSkill)) {
          matched.push(skill);
        } else {
          missing.push(skill);
        }
      } else {
        // Set membership for single words (faster, safer bounds)
        if (jdKeywords.has(normalizedSkill)) {
          matched.push(skill);
        } else {
          missing.push(skill);
        }
      }
    });

    const score = Math.round((matched.length / userSkills.length) * 100);

    return {
      score,
      matched,
      missing
    };
  }
}

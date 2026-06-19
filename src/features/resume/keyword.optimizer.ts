import type { Resume } from '../../core/types/resume';

export interface KeywordMatch {
  keyword: string;
  found: boolean;
}

export class KeywordOptimizer {
  /**
   * Extremely simple keyword extractor.
   * In a real system this might use NLP, but for now we just tokenise and remove stop words.
   */
  static extractKeywords(text: string): string[] {
    if (!text) return [];
    
    const stopWords = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'for', 'is', 'on', 'with', 'as', 'by', 'an', 'this']);
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    
    const counts = new Map<string, number>();
    for (const w of words) {
      if (w.length > 2 && !stopWords.has(w)) {
        counts.set(w, (counts.get(w) || 0) + 1);
      }
    }

    // Sort by frequency, return top 20
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(e => e[0]);
  }

  static compareKeywords(resume: Resume, jdKeywords: string[]): KeywordMatch[] {
    // Stringify the whole resume data to do a naive search
    const resumeText = JSON.stringify(resume).toLowerCase();
    
    return jdKeywords.map(keyword => ({
      keyword,
      found: resumeText.includes(keyword.toLowerCase())
    }));
  }

  static suggestMissingKeywords(resume: Resume, jdKeywords: string[]): string[] {
    return this.compareKeywords(resume, jdKeywords)
      .filter(k => !k.found)
      .map(k => k.keyword);
  }
}

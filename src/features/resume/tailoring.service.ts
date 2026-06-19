import type { Resume } from '../../core/types/resume';
import { AIProvider } from '../../core/api/ai.provider';
import { KeywordOptimizer } from './keyword.optimizer';

export class TailoringService {
  constructor(private readonly provider: AIProvider) {}

  /**
   * Tailors a resume based on a Job Description string.
   * Returns a deeply cloned, mutated Resume object.
   */
  async tailorResume(resume: Resume, jdText: string): Promise<Resume> {
    const keywords = KeywordOptimizer.extractKeywords(jdText);
    const missing = KeywordOptimizer.suggestMissingKeywords(resume, keywords);

    const prompt = `
You are an expert resume writer and ATS optimizer. 
Your task is to tailor the provided Resume JSON to better match the provided Job Description.

CRITICAL RULES (NO HALLUCINATION):
1. NEVER invent new skills, tools, or technologies not already present in the original resume.
2. NEVER invent past experiences, roles, companies, or projects.
3. You may reorder bullet points so the most relevant ones appear first.
4. You may rephrase existing bullet points to highlight skills relevant to the Job Description.
5. If the Job Description requires a skill that is implicitly present in the experience but not explicitly named, you may explicitly name it (using keywords from the JD).
6. Missing keywords from JD: ${missing.join(', ')}. If any of these are truly implicit in the experience, surface them. If not, IGNORE THEM.

Output Format:
You MUST return ONLY valid JSON matching the exact schema of the provided Resume. Do not include markdown code blocks (e.g. \`\`\`json) or any conversational text.

Input Resume JSON:
${JSON.stringify(resume.sections, null, 2)}

Job Description:
${jdText}
`;

    const responseText = await this.provider.generateContent(prompt);
    
    let tailoredSections;
    try {
      // Clean up potential markdown formatting from AI
      const cleanJson = responseText.replace(/^```(json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      tailoredSections = JSON.parse(cleanJson);
    } catch (e: any) {
      throw new Error(`Failed to parse AI response as JSON. Raw response: ${responseText}`, { cause: e });
    }

    // Return a new tailored resume object
    return {
      ...resume,
      sections: tailoredSections,
      updatedAt: Date.now()
    };
  }
}

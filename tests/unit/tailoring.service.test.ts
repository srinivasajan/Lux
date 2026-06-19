import { describe, it, expect } from 'vitest';
import { TailoringService } from '../../src/features/resume/tailoring.service';
import { MockProvider } from '../../src/core/api/ai.provider';
import type { Resume } from '../../src/core/types/resume';

describe('TailoringService', () => {
  const baseResume: Resume = {
    id: 1,
    name: 'Original',
    templateId: 'modern',
    createdAt: 1000,
    updatedAt: 1000,
    sections: [
      {
        id: 's1',
        type: 'experience',
        title: 'Experience',
        order: 0,
        data: {
          role: 'Software Engineer',
          bullets: ['Built a web app']
        }
      }
    ]
  };

  it('mutates sections based on AI output and updates timestamp', async () => {
    // Mock the AI provider to return a modified JSON string
    const mockOutput = `[
      {
        "id": "s1",
        "type": "experience",
        "title": "Experience",
        "order": 0,
        "data": {
          "role": "Software Engineer",
          "bullets": ["Engineered a high-performance web application"]
        }
      }
    ]`;
    
    const provider = new MockProvider(mockOutput);
    const service = new TailoringService(provider);

    const tailored = await service.tailorResume(baseResume, 'Looking for high-performance engineers.');
    
    expect(tailored.name).toBe('Original'); // Name should not change
    expect(tailored.updatedAt).toBeGreaterThan(1000); // Timestamp should update
    
    const bullet = (tailored.sections[0]!.data as any).bullets[0];
    expect(bullet).toBe('Engineered a high-performance web application');
  });

  it('cleans up markdown json wrappers', async () => {
    const mockOutput = `\`\`\`json
[{"id":"s2","type":"skills","title":"Skills","order":0,"data":{"items":["TypeScript"]}}]
\`\`\``;
    
    const provider = new MockProvider(mockOutput);
    const service = new TailoringService(provider);

    const tailored = await service.tailorResume(baseResume, 'Need TypeScript');
    expect(tailored.sections[0]!.type).toBe('skills');
    expect((tailored.sections[0]!.data as any).items[0]).toBe('TypeScript');
  });
});

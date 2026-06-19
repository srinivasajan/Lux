export interface AIProvider {
  /**
   * Generates content using the AI provider.
   * Expects a JSON structure back (ensure the prompt explicitly requests JSON).
   */
  generateContent(prompt: string): Promise<string>;
}

/**
 * Real Gemini API implementation using the standard REST endpoint.
 */
export class GeminiProvider implements AIProvider {
  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
  }

  async generateContent(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    
    // We enforce JSON output strictly for tailoring, so we enable JSON response mode
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error('Invalid response format from Gemini API');
    }

    return textResult;
  }
}

/**
 * Mock provider for testing to prevent real API calls.
 */
export class MockProvider implements AIProvider {
  constructor(private readonly mockResponse: string) {}

  async generateContent(_prompt: string): Promise<string> {
    return Promise.resolve(this.mockResponse);
  }
}

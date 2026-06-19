# Tailoring Architecture

## Overview

The AI Tailoring Engine bridges the gap between generic resumes and targeted job applications. It uses a provider-based architecture to allow swapping the underlying LLM (e.g., Gemini) while maintaining strict constraints to prevent hallucination.

## Provider Abstraction

1. **`AIProvider` (`src/core/api/ai.provider.ts`)**: The core interface that any AI implementation must satisfy. It requires a `generateContent(prompt: string)` method that returns a `Promise<string>`.
2. **`GeminiProvider`**: The production implementation. It makes REST calls to the `generativelanguage.googleapis.com` endpoint using the `gemini-1.5-flash` model. It explicitly sets the `responseMimeType` to `application/json` to enforce strict structured output.
3. **`MockProvider`**: Used in unit tests (`tailoring.service.test.ts`) to return fixed JSON strings without making real network requests.

## Workflow

1. **Keyword Extraction**: The `KeywordOptimizer` parses the user-provided Job Description (JD) and extracts the most relevant keywords.
2. **Comparison**: The `KeywordOptimizer` compares the JD keywords against the entire JSON payload of the original Resume.
3. **Tailoring Prompt**: The `TailoringService` constructs a prompt with strict instructions:
   - "NEVER invent new skills."
   - "NEVER invent past experiences."
   - "You may reorder bullet points."
   - "You may rephrase existing bullet points."
   - Output must be strict JSON matching the exact Resume Section schema.
4. **Parsing & Snapshot**: The `TailoringService` cleans the output of any markdown (e.g., ```json) and deeply merges the new sections into the original Resume. The UI layer then creates a `ResumeVersion` snapshot so the user can easily revert if the AI modifies something undesirable.

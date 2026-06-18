# Keyword Matching Strategy

This document outlines the reasoning and logic behind the Milestone 2 skill matching algorithm.

## 1. Current Formula
The system employs **Exact Normalized Keyword Matching**.

**Flow:**
1. Both the Job Description (JD) and User Profile skills are passed through a `normalize()` function.
2. Normalization lowercases all text and converts standard punctuation to spaces, *except* for specific tech-friendly characters (e.g., `#`, `.`, `+` to preserve "C#", "Node.js", "C++").
3. Standard English stop-words ("the", "and", "is", etc.) are stripped from the JD to reduce set size.
4. The remaining JD words are loaded into a highly performant JavaScript `Set`.
5. For each skill in the user's Profile:
   - If it's a single word, we check if the `Set` `has()` the normalized skill.
   - If it's a multi-word skill ("React Native"), we check if the fully normalized JD string `includes()` the substring.

**Match Score Formula:**
```
(Matched Skills / Total Profile Skills) * 100
```

## 2. Why this implementation was chosen
- **Zero Privacy Risk:** By avoiding third-party LLMs (AI APIs), no job descriptions or user skill sets ever leave the browser.
- **Zero CPU Overhead:** NLP and Vector Embedding models (e.g., TensorFlow.js) require significant CPU, memory overhead, and massive bundle sizes (often >50MB). A simple token set intersection takes `< 1ms`.
- **Absolute Explainability:** The user can instantly look at the "Missing Skills" and "Matched Skills" lists and understand precisely why the score is what it is. There are no black-box hallucinations.

## 3. Known Limitations
- **Lack of Semantic Understanding:** "JS" and "JavaScript" are treated as completely different skills unless the user explicitly adds both to their profile.
- **Context Ignorance:** If the JD states "No React experience required", the matcher will flag "React" as a matched skill because the word exists in the text.
- **Keyword Stuffing:** If a JD lists a massive block of irrelevant tags at the bottom, it will inflate the match score.

## 4. Future Alternatives
If accuracy needs to scale beyond exact strings without sacrificing local-first privacy:
- Introduce a local synonym dictionary (e.g., mapping `['js', 'javascript', 'ecmascript']` to a single token).
- Implement TF-IDF (Term Frequency-Inverse Document Frequency) locally to weigh importance rather than just boolean existence.
- Integrate lightweight WebAssembly (WASM) based NLP models (e.g., ONNX runtime) for true semantic context, provided the user's machine can handle the memory footprint.

# LinkedIn Selector Strategy

This document details the strategies and specific CSS selectors utilized in the `LinkedInExtractor` module to parse job details.

## 1. Job Title Extraction

| Layer | Selector | Reason Chosen | Failure Behavior |
|-------|----------|---------------|------------------|
| **Primary** | `.job-details-jobs-unified-top-card__job-title` | Exact class used in authenticated unified job cards. | Falls back to secondary. |
| **Secondary** | `.top-card-layout__title` | Class used in logged-out or legacy views. | Falls back to generic. |
| **Fallback** | `h1` | Highly probable semantic match if LinkedIn revamps UI entirely. | If missing, title defaults to empty string. |

## 2. Company Name Extraction

| Layer | Selector | Reason Chosen | Failure Behavior |
|-------|----------|---------------|------------------|
| **Primary** | `.job-details-jobs-unified-top-card__company-name` | Exact class in authenticated unified job cards. | Falls back to secondary. |
| **Secondary** | `.topcard__org-name-link` | Logged-out view company link. | Falls back to tertiary. |
| **Tertiary** | `.job-details-jobs-unified-top-card__primary-description a` | Grabs the first anchor tag within the description block (often the company). | Defaults to empty string. |

## 3. Job Description Extraction

| Layer | Selector | Reason Chosen | Failure Behavior |
|-------|----------|---------------|------------------|
| **Primary** | `#job-details` | Stable ID wrapper across most unified views. | Falls back to secondary. |
| **Secondary** | `.jobs-description-content__text` | Standard class in split-screen search views. | Falls back to fallback. |
| **Fallback** | `.description__text` | Often used in mobile or logged-out views. | Defaults to empty string. |

## 4. Explicit Skills Extraction

| Layer | Selector | Reason Chosen | Failure Behavior |
|-------|----------|---------------|------------------|
| **Primary** | `.job-details-how-you-match-card__skills-item` | Extracts strictly required skills listed in the "How you match" block. | Ignores explicit injection and relies strictly on generic JD text parsing. |

## Graceful Degradation Model
If LinkedIn undergoes a complete structural rewrite causing all selectors to fail:
1. Properties gracefully fall back to empty strings without throwing DOM errors.
2. The `LinkedInExtractor.extract()` method will detect an empty state (`!title && !description`) and return `null`.
3. The content script orchestrator (`analyzer.ts`) natively halts when receiving `null`, preventing crash loops or injecting empty UI elements.

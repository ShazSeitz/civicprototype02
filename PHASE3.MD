# Phase 3: Live Data Integration - Recommendation API Endpoint

This document outlines the steps to design and implement the `recommendations` Supabase Edge Function.

## Guiding Principles
- Leverage existing Supabase infrastructure and patterns.
- Refactor reusable logic from `supabase/functions/analyze-priorities/index.ts` into shared modules.
- Integrate the core logic from `src/services/recommendation-service.ts`.
- Incorporate a database-backed manual keyword table for the hybrid model.

## Phase A: New `recommendations` Function & Core Logic Refactoring

### 1. Define API Contract (for `/functions/v1/recommendations`)
- [x] **Route:** `/functions/v1/recommendations` (standard Supabase Edge Function route).
- [x] **HTTP Method:** `POST`.
- [x] **Request Body Structure (JSON):**
  ```json
  {
    "priorities": ["string", "string", ...],
    "zipCode": "string",
    "mode": "string" // e.g., "current", "election", "demo"
  }
  ```
- [x] **Request Body Structure (JSON):** (Defined and used)
- [~] **Success Response Structure (JSON):** (Evolving; currently includes LLM analysis, representatives, and API errors. Alignment with a final `RecommendationResponse` is ongoing)
  ```json
  {
    "candidates": [/* CandidateMatch objects */],
    "ballotMeasures": [/* BallotMeasureMatch objects */],
    "policyRecommendations": [/* PolicyRecommendation objects */],
    "errors": [/* Error objects, if any */]
  }
  ```
- [x] **Error Response Structure (JSON):**
  ```json
  { "error": "Descriptive error message" }
  ```
  (With appropriate HTTP status codes like 400, 500).

### 2. Create New `recommendations` Supabase Edge Function
- [x] **Create Directory:** `supabase/functions/recommendations`.
- [x] **Create Main File:** `supabase/functions/recommendations/index.ts`.
- [x] **Basic Deno HTTP Handler:** Set up `serve` from `std/http/server.ts`.
- [x] **CORS Handling:**
    - CORS headers defined locally in `recommendations/index.ts`.
    - Handles `OPTIONS` preflight requests.
- [x] **Request Parsing:** Parse JSON request body.
- [x] **Basic Input Validation:** Check for presence and basic types of `priorities`, `zipCode`, `mode`.

### 3. Refactor Logic from `analyze-priorities` into Shared Modules
- [ ] **LLM-based Priority Analysis Service:**
    - [x] **Identify Logic:** Isolate the OpenAI call and related prompt engineering within `analyze-priorities/index.ts` that maps user `priorities` to terms/categories.
    - [x] **Create Shared Module:** Moved to `supabase/functions/_shared/llm_priority_analyzer.ts`.
    - [x] **Define Interface:** Accepts `priorities` and `openAIApiKey`, returns `LLMAnalysisResult`.
    - [ ] **Update `analyze-priorities` (Optional):** If `analyze-priorities` still needs to perform this specific analysis for its other tasks (like email drafting), it should now call this new shared module. (Decision pending on `analyze-priorities` future)
- [~] **External Data Fetcher Services:**
    - [~] **Google Civic API:** Implemented `fetchRepresentativesFromGoogleCivic` directly in `recommendations/index.ts`. Decision pending on moving to `_shared/google_civic_api.ts`.
    - [ ] **FEC API:** (Not started for `recommendations` function)
    - [ ] **Ballotpedia API:** (Not started for `recommendations` function)
    - [~] **Modularize:** `fetchRepresentativesFromGoogleCivic` is modular; types defined in `recommendations/index.ts`.

### 4. Initial Integration in `recommendations/index.ts`
- [x] **Import Shared Modules:** Imported `llm_priority_analyzer`.
- [ ] **Orchestrate Initial Flow (Mocked `RecommendationService`):**
    - [x] Call `llm_priority_analyzer.ts` with input `priorities`.
    - [~] (For now) Use mock data or a simplified placeholder for candidate/ballot measure data. (Progressed to fetching real representative data from Google Civic API).
    - [ ] (For now) Use a placeholder for the `RecommendationService` output. (Focusing on data aggregation first).
    - [x] *Goal: Test the new function's structure, shared module usage, and basic request/response flow.* (Achieved for LLM part, in progress for external APIs)
- [ ] **API Key Management:** Ensure API keys (`OPENAI_API_KEY`, etc.) are correctly accessed via `Deno.env.get()`.

### 5. Local Testing & Deployment (Initial `recommendations` function)
- [x] **Local Serving:** `supabase functions serve recommendations --no-verify-jwt` (Assumed as part of testing cycle).
- [x] **Manual Testing:** Use `curl` to send `POST` requests with sample `priorities` and `zipCode`. Verified responses for LLM and initial Google Civic API integration.
- [ ] **Initial Deployment:** `supabase functions deploy recommendations --no-verify-jwt`. (Not yet deployed)

## Phase B: Full Service Integration & Database

### 6. Integrate `src/services/recommendation-service.ts`
- [ ] **Address Deno Compatibility:**
    - **Analyze Dependencies:** Identify Node.js built-ins or npm packages used by `RecommendationService` and its local dependencies (`src/utils/`, `src/types/` etc.) that are not Deno-native.
    - **Bundling Strategy:** Investigate using `esbuild` (or similar) to bundle `RecommendationService` and its necessary `src/` dependencies into a single, Deno-compatible ES module. This bundle would exclude Node.js built-ins if they can be shimmed or are not strictly needed in the Deno context.
    - **Adaptation:** If bundling is insufficient, selectively adapt parts of `RecommendationService` or its helpers for Deno (e.g., path handling, different import specifiers for Deno standard library).
- [ ] **Import & Use:** Import the bundled/adapted `RecommendationService` into `recommendations/index.ts`.
- [ ] **Data Mapping:** Ensure data from LLM analysis and external API fetchers is correctly mapped to the input format expected by `RecommendationService`.

### 7. Database for Manual Keyword Table (Hybrid Model - Part 1)
- [ ] **Schema Design:** Define PostgreSQL table(s) in Supabase for keywords, phrases, political categories, and any weighting/metadata.
- [ ] **Create Migration:** Use `supabase db diff` (if changes made via Studio) or write SQL manually; then `supabase migration new <migration_name>`.
- [ ] **Apply Migration:** `supabase db push` (or `supabase start` locally).
- [ ] **Database Access Logic:**
    - Create a shared module (e.g., `supabase/functions/_shared/keyword_service.ts`).
    - This service will use the Supabase client (`import { supabase } from '@/integrations/supabase/client';`) to query the keyword table.
- [ ] **Integrate with Recommendation Flow:**
    - The `recommendations/index.ts` function will call the `keyword_service.ts`.
    - The results from the keyword table need to be combined/reconciled with the LLM-based priority analysis before or during the `RecommendationService` execution.

### 8. Full Data Orchestration in `recommendations/index.ts`
- [ ] **Fetch Analyzed Priorities:** Call the shared `llm_priority_analyzer.ts`.
- [ ] **Fetch Keyword Mappings:** Call the shared `keyword_service.ts`.
- [ ] **Derive State:** Implement logic to derive `state` from `zipCode` if needed by data fetchers.
- [ ] **Fetch External Data:** Call refactored data fetchers (`google_civic_api.ts`, `fec_api.ts`, `ballotpedia_api.ts`) using `zipCode` or derived `state`.
- [ ] **Execute `RecommendationService`:** Pass all collated and processed data (LLM analysis, keyword results, candidate data, ballot data) to the integrated `RecommendationService`.
- [ ] **Return Final Response:** Send the comprehensive `RecommendationResponse`.

### 9. Advanced Error Handling & Logging
- [ ] Implement robust `try...catch` blocks around all major operations (API calls, service calls, DB queries).
- [ ] Use `console.error()` for detailed server-side logging, accessible via Supabase dashboard.
- [ ] Ensure appropriate HTTP error codes and user-friendly error messages are returned.

## Phase C: Feedback Loop & Iteration

### 10. Database for User Feedback (Hybrid Model - Part 2)
- [ ] **Schema Design:** Define table(s) for storing user feedback (e.g., original priorities, system's interpretation, user's corrected interpretation, timestamps).
- [ ] **Create Migration & Apply.**
- [ ] **Feedback API Endpoint:**
    - Create a *new, separate* Supabase Edge Function (e.g., `submit-feedback`).
    - This endpoint will receive feedback data from the client and store it in the database.
- [ ] **(Future) Learning Logic:** Design and implement processes (manual or automated) to analyze stored feedback and update the manual keyword table or refine LLM prompts.

### 11. Testing & Documentation
- [ ] **Unit/Integration Tests for Shared Modules:** Write Deno-based tests for the refactored shared modules if feasible.
- [ ] **End-to-End Testing:** Manually test the `recommendations` function thoroughly with various inputs.
- [ ] **Update `RECOMMENDATIONS_TODO.MD`:** Mark completed tasks.
- [ ] **Update `TESTING.MD`:** Document new API endpoints and testing strategies.

---
This provides a more detailed roadmap. The most challenging technical parts will likely be the Deno compatibility for `RecommendationService` and designing the interaction between the LLM analysis and your manual keyword table.


This document outlines the steps to design and implement the API endpoints for the recommendation engine.

## Phase A: Endpoint Setup & Basic Logic (REST API)

### 1. Define API Contract
- [ ] **Route:** Define the API endpoint path (e.g., `/api/recommendations`).
- [ ] **HTTP Method:** `POST` (since we're sending data to create/fetch recommendations).
- [ ] **Request Body Structure (JSON):**
  ```json
  {
    "priorities": ["string", "string", ...],
    "zipCode": "string",
    "mode": "string" // e.g., "current", "election"
  }
  ```
- [ ] **Success Response Structure (JSON):** (Should align with `RecommendationResponse` type from `src/types/recommendation.ts`)
  ```json
  {
    "candidates": [/* CandidateMatch objects */],
    "ballotMeasures": [/* BallotMeasureMatch objects */],
    "policyRecommendations": [/* PolicyRecommendation objects */],
    "errors": [/* Error objects, if any */]
  }
  ```
- [ ] **Error Response Structure (JSON):**
  ```json
  { "error": "Descriptive error message" }
  ```
  (Accompany with appropriate HTTP status codes like 400 for bad input, 500 for server errors).

### 2. Set up API Server Environment
- [ ] **Choose Framework/Library:** Decide on a Node.js framework (e.g., Express.js is common and lightweight).
- [ ] **Install Dependencies:** Add necessary packages (e.g., `express`, `cors`, and their `@types/` equivalents for TypeScript).
- [ ] **Create API Server Entry Point:** (e.g., `src/server/index.ts` or `api/server.ts`).
- [ ] **Create API Route Handler File:** (e.g., `src/server/routes/recommendations.ts`).
- [ ] **Basic HTTP Server Setup:** Initialize your chosen framework in the server entry point to listen on a port.
- [ ] **CORS Configuration:** Implement CORS middleware (e.g., `cors` package for Express) to allow requests from your frontend.
- [ ] **Request Body Parsing:** Configure middleware to parse JSON request bodies (e.g., `express.json()` for Express).

### 3. Implement API Endpoint Logic (Initial - Mocked)
- [ ] **Create Route:** In your route handler file, define the `POST` route for `/api/recommendations`.
- [ ] **Input Validation (Basic):**
    - In the route handler, retrieve `priorities`, `zipCode`, and `mode` from the request body.
    - Perform basic checks (e.g., ensure they exist and `priorities` is an array).
    - If validation fails, send a 400 Bad Request response with an error message.
- [ ] **Integrate Recommendation Logic (Mocked):**
    - For now, *do not* call the full `RecommendationService` yet.
    - Create a simple mock function or inline logic that returns predefined mock data matching the `RecommendationResponse` structure.
    - *Goal: Test the API plumbing (routing, request/response, CORS) before integrating the complex service.*

### 4. Response Handling
- [ ] **Success Response:** If basic input validation passes and mock logic executes, send a 200 OK response with the mock JSON data.
- [ ] **Error Response:** Ensure 400/500 status codes are sent for validation or unexpected errors, along with a JSON error message.

### 5. Local Testing & Initial Run
- [ ] **Add Server Start Script:** Add a script to `package.json` to run your new API server (e.g., `"start:api": "ts-node src/server/index.ts"` or similar, depending on your setup).
- [ ] **Run Server Locally:** Execute the new script (e.g., `npm run start:api`).
- [ ] **Test Manually:**
    - Use a tool like `curl`, Postman, or Insomnia.
    - Send `POST` requests to your local API endpoint (e.g., `http://localhost:YOUR_API_PORT/api/recommendations`).
    - Include a sample JSON body.
    - Verify the responses (status codes, headers, and mock data).

---
*(Phase B will cover integrating the actual `RecommendationService`, advanced error handling, etc.)*

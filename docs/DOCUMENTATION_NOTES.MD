# Documentation Notes

This file serves as a scratchpad and collection point for higher-level documentation ideas, architectural decisions, and notes about external API integrations as the project evolves.

## Key Areas for Documentation:

- [ ] Overall system architecture (diagram?)
- [ ] Data flow for recommendations
- [ ] Supabase Edge Functions overview
  - [ ] `recommendations` function
  - [ ] `analyze-priorities` function (if still separate or its logic is merged)
- [ ] Shared modules (e.g., `llm_priority_analyzer.ts`)
- [ ] External API Integrations
  - [ ] OpenAI API
    - Purpose: LLM analysis of user priorities.
    - Key management: `OPENAI_API_KEY` in `supabase/functions/.env` (local) / Supabase secrets (deployed).
  - [ ] FEC API
    - Purpose: (To be detailed - e.g., fetching candidate/committee info)
    - Key management: `VITE_FEC_API_KEY` in `supabase/functions/.env` (local) / Supabase secrets (deployed).
  - [ ] Google Civic Information API
    - Purpose: (To be detailed - e.g., fetching representatives, ballot measures)
    - Key management: `VITE_GOOGLE_CIVIC_API_KEY` in `supabase/functions/.env` (local) / Supabase secrets (deployed).
- [ ] Local Development Setup
  - [ ] Supabase CLI commands (`supabase start`, `supabase functions serve`)
  - [ ] Environment variable management (`supabase/functions/.env`)
- [ ] Deployment Process
- [ ] Testing Strategy

## Notes During Development (Add as you go):

- (Example) 2025-05-26: Decided to use `gpt-4` without explicit JSON mode for now, relying on prompt engineering. If parsing issues arise, switch to `gpt-4-turbo-preview` with `response_format: { type: "json_object" }`.


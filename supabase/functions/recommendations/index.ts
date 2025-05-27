import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  analyzeAndMapPrioritiesWithLLM,
  LLMAnalysisResult,
} from "../_shared/llm_priority_analyzer.ts";

// Basic CORS headers - can be moved to a shared module later
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-voter-mode',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Declare Deno global for environment variable access (if not already covered by Supabase types)
declare const Deno: {
  env: {
    get(key: string): string | undefined;
    toObject(): Record<string, string>; // Added toObject method
  };
};

console.log(`Recommendations function initialized`);

serve(async (req: Request) => {


  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Log all Deno environment variables for debugging
  // console.log("Deno Environment Variables:", JSON.stringify(Deno.env.toObject()));

  try {
    // Ensure the request is a POST request
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the request body
    const { priorities, zipCode, mode } = await req.json();

    // Basic input validation
    if (!priorities || !Array.isArray(priorities) || priorities.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or invalid priorities' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!zipCode || typeof zipCode !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid zipCode' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (mode && typeof mode !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid mode' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Received priorities:', priorities);
    console.log('Received zipCode:', zipCode);
    console.log('Received mode:', mode);

    // Get OpenAI API Key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is not set in environment variables.');
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing OpenAI API Key' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call LLM Priority Analyzer
    let llmAnalysis: LLMAnalysisResult | null = null;
    let llmError: string | null = null;
    try {
      llmAnalysis = await analyzeAndMapPrioritiesWithLLM(priorities, openAIApiKey);
      console.log('LLM Analysis successful:', llmAnalysis);
    } catch (e) {
      console.error('Error calling LLM priority analyzer:', e);
      llmError = e.message || 'Failed to analyze priorities with LLM';
      // Optionally, you might want to return a 500 error here if LLM analysis is critical
      // For now, we'll include the error in the response and continue
    }

    const recommendationResults = {
      message: "Recommendation logic with LLM analysis (initial integration).",
      receivedPriorities: priorities,
      receivedZipCode: zipCode,
      receivedMode: mode,
      llmAnalysis: llmAnalysis,
      llmError: llmError,
      // Future integrations:
      // candidates: [],
      // ballotMeasures: [],
      // policyRecommendations: [],
      // errors: [] // for other types of errors
    };

    return new Response(
      JSON.stringify(recommendationResults),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    // Catch errors from req.json() or other unexpected issues
    console.error('Error in recommendations function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      {
        status: 500, // Or 400 if it's a client-side JSON parsing error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

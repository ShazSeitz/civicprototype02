import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  analyzeAndMapPrioritiesWithLLM,
  LLMAnalysisResult,
} from "../_shared/llm_priority_analyzer.ts";

// Interface for the result of fetching representatives, including the URL for debugging
interface FetchVoterInfoResult {
  contests: any[]; // Changed from representatives: RepresentativeInfo[]
  constructedUrl: string;
}

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

// --- Google Civic API Data Structures ---

/**
 * Represents a channel of communication for an official (e.g., social media).
 */
interface GoogleCivicChannel {
  type: string; // e.g., "Facebook", "Twitter"
  id: string;   // The identifier for the official on that platform
}

/**
 * Represents a political official from the Google Civic API.
 */
interface GoogleCivicOfficial {
  name: string;
  address?: Array<{ // Physical address
    locationName?: string;
    line1?: string;
    line2?: string;
    line3?: string;
    city?: string;
    state?: string;
    zip?: string;
  }>;
  party?: string; // Political party affiliation
  phones?: string[];
  urls?: string[]; // Official websites
  photoUrl?: string;
  emails?: string[];
  channels?: GoogleCivicChannel[];
}

/**
 * Represents a government office from the Google Civic API.
 */
interface GoogleCivicOffice {
  name: string; // e.g., "President of the United States"
  divisionId: string; // Opaque ID for the geographic division
  levels?: string[]; // e.g., ["country"]
  roles?: string[];  // e.g., ["headOfState", "headOfGovernment"]
  officialIndices: number[]; // Indices into the 'officials' array for this office
}

/**
 * Represents the raw response from the Google Civic API's representatives endpoint.
 * @see https://developers.google.com/civic-information/docs/v2/representatives/representativeInfoByAddress
 */
interface GoogleCivicRepresentativeInfoResponse {
  normalizedInput?: {
    line1?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  divisions?: {
    [divisionId: string]: {
      name: string;
      scope: string; // e.g., "congressional", "stateUpper", "county"
      officeIndices?: number[]; // Indices into the 'officials' array
    };
  };
  offices?: GoogleCivicOffice[];
  officials?: GoogleCivicOfficial[];
}

/**
 * A processed and more user-friendly structure for representative information.
 */
export interface RepresentativeInfo {
  officeName: string;
  officialName: string;
  party?: string;
  phones?: string[];
  urls?: string[];
  photoUrl?: string;
  emails?: string[];
  socialMedia?: Array<{ platform: string; id: string }>;
  address?: string; // A formatted address string
  divisionName?: string; // Name of the political division for the office
}

// --- End Google Civic API Data Structures ---

// --- Google Civic API Helper Function ---

/**
 * Fetches representative information from the Google Civic Information API.
 *
 * @param addressQuery The address or ZIP code to query for. For ZIP codes, precision may be limited.
 * @param apiKey The Google Civic API key.
 * @returns A Promise that resolves to an array of RepresentativeInfo objects.
 * @throws An error if the API call fails or returns an unexpected structure.
 * @see https://developers.google.com/civic-information/docs/v2/representatives/representativeInfoByAddress
 */
async function fetchVoterInfoFromGoogleCivic(
  fullAddress: string,
  apiKey: string,
  currentApiErrors: string[] // Pass the apiErrors array to be mutated directly
): Promise<FetchVoterInfoResult> {
  const baseUrl = "https://www.googleapis.com/civicinfo/v2/voterinfo";
  const electionId = "2000"; // Using VIP Test Election ID for now

  let url = `${baseUrl}?key=${apiKey}&address=${encodeURIComponent(fullAddress)}&electionId=${electionId}`;

  console.log(`Fetching Google Civic API URL: ${url}`);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Google Civic API (voterInfoQuery) error: ${response.status} ${response.statusText}`, errorBody);
      currentApiErrors.push(`Google Civic API (voterInfoQuery) request failed with status ${response.status}: ${errorBody}`);
      return { contests: [], constructedUrl: url };
    }

    const data = (await response.json()) as any;
    // The voterInfoQuery response has a 'contests' array which contains office and candidate info.
    // We will also look for 'state' array which might contain polling locations or state-level election admin info.
    const contests = data.contests || [];
    // const pollingLocations = data.pollingLocations || []; // Example, if needed later
    // const stateElectionInfo = data.state && data.state.length > 0 ? data.state[0].electionAdministrationBody : {}; // Example

    // For now, we're primarily interested in the contests for representative information.
    // We can refine parsing of 'contests' later to match the 'Representative' structure if needed.

    return {
      contests: contests, // Return the raw contests array for now
      constructedUrl: url,
    };
  } catch (error) {
    console.error('Network or other error within fetchVoterInfoFromGoogleCivic:', error);
    currentApiErrors.push(`Google Civic API (voterInfoQuery) request error: ${error.message}`);
    return { contests: [], constructedUrl: "Error constructing URL or making request" };
  }
}

// --- End Google Civic API Helper Function ---

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
    const { priorities, address, mode } = await req.json();

    // Basic input validation
    if (!priorities || !Array.isArray(priorities) || priorities.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or invalid priorities' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Validate address (basic validation - ensure it's a non-empty string)
    if (!address || typeof address !== 'string' || address.trim() === '') {
      return new Response(JSON.stringify({ error: 'Invalid or missing address. Must be a non-empty string.' }), {
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
    console.log('Received address:', address);
    console.log('Received mode:', mode);

    // Get API Keys
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const googleApiKey = Deno.env.get('VITE_GOOGLE_CIVIC_API_KEY');
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

    // Fetch Representatives from Google Civic API
    let contestsFromCivicAPI: any[] = []; // Changed to store contests
    let googleCivicApiUrlDebug: string | undefined = undefined;
    const apiErrors: string[] = []; // To collect errors from various API calls

    if (!googleApiKey) {
      console.warn('VITE_GOOGLE_CIVIC_API_KEY is not set. Skipping representative fetching.');
      apiErrors.push('Google Civic API key not configured.');
    } else if (llmAnalysis && !llmError) { // Optionally, only fetch if LLM analysis was successful
      try {
        const civicResult = await fetchVoterInfoFromGoogleCivic(address, googleApiKey, apiErrors);
        contestsFromCivicAPI = civicResult.contests;
        googleCivicApiUrlDebug = civicResult.constructedUrl;
      } catch (error) {
        console.error('Error fetching from Google Civic API:', error);
        apiErrors.push(`Network or other error fetching from Google Civic API: ${error.message}`);
      }
    } else if (llmError) {
      apiErrors.push('Skipped fetching representatives due to LLM analysis error.');
    }

    // Prepare results
    const recommendationResults = {
      message: 'Recommendation logic with LLM analysis (initial integration).',
      receivedPriorities: priorities,
      receivedAddress: address,
      receivedMode: mode,
      llmAnalysis: llmAnalysis,
      llmError: llmError,
      representatives: contestsFromCivicAPI, // Temporarily assigning contests here, will need further processing
      apiErrors: apiErrors.length > 0 ? apiErrors : null, // Only include apiErrors if there are any
      debug_googleCivicApiUrl: googleCivicApiUrlDebug, // Add the debug URL
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

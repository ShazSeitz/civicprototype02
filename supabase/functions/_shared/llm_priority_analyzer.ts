// supabase/functions/_shared/llm_priority_analyzer.ts

interface LLMMapping {
  [priority: string]: string[];
}

interface LLMConflict {
  priority1: string;
  priority2: string;
  reason: string;
}

interface LLMConfidenceScores {
  [priority: string]: number;
}

export interface LLMAnalysisResult {
  mappings: LLMMapping;
  analysis: string;
  conflicts: LLMConflict[];
  confidenceScores: LLMConfidenceScores;
  // Add any other fields that might be part of the LLM's JSON output
}

/**
 * Analyzes user priorities using an LLM to map them to political terms and categories.
 * @param priorities An array of user-defined priority strings.
 * @param openAIApiKey The OpenAI API key.
 * @returns A Promise that resolves to the structured analysis from the LLM.
 */
export async function analyzeAndMapPrioritiesWithLLM(
  priorities: string[],
  openAIApiKey: string,
): Promise<LLMAnalysisResult> {
  console.log('LLM Service: Analyzing priorities:', priorities);

  if (!openAIApiKey) {
    console.error('LLM Service: OPENAI_API_KEY is not provided.');
    throw new Error('OPENAI_API_KEY is required for LLM analysis.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4', // Consider making this configurable if needed
        messages: [
          {
            role: 'system',
            content: `You are a political analyst expert who maps voter priorities to standardized policy terms and identifies potential conflicts.\n\nInstructions:\n1. Map each priority to relevant policy areas and political terminology.\n2. Identify any conflicting priorities.\n3. Generate a brief analysis explaining the relationships.\n4. Provide confidence scores for each mapping.\n\nOutput Format (JSON only, no preamble or explanation outside the JSON structure):\n{\n  "mappings": {\n    "[priority string from input]": ["mapped term 1", "mapped term 2"]\n  },\n  "analysis": "Multi-paragraph analysis with line breaks, focusing on the political implications and connections between priorities.",\n  "conflicts": [\n    {\n      "priority1": "first priority string from input",\n      "priority2": "second priority string from input",\n      "reason": "explanation of why these priorities conflict"\n    }\n  ],\n  "confidenceScores": {\n    "[priority string from input]": 0.95\n  }\n}`,
          },
          {
            role: 'user',
            content: `Analyze these voter priorities: ${JSON.stringify(priorities)}`,
          },
        ],
        temperature: 0.3, // Adjust for desired creativity/determinism
        max_tokens: 1500, // Adjust based on expected output size
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LLM Service: OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Newer models with response_format: { type: "json_object" } might return the JSON directly.
    // Older models or if JSON mode isn't strictly enforced, the content is in choices[0].message.content.
    let rawContent = data.choices?.[0]?.message?.content;

    if (typeof rawContent === 'object') { // If JSON object is directly in content
        console.log('LLM Service: Parsed mapping result (direct object):', rawContent);
        return rawContent as LLMAnalysisResult;
    } else if (typeof rawContent === 'string') { // If content is a string needing parsing
        try {
            const mappingResult = JSON.parse(rawContent);
            console.log('LLM Service: Parsed mapping result (from string):', mappingResult);
            return mappingResult as LLMAnalysisResult;
        } catch (parseError) {
            console.error('LLM Service: Failed to parse OpenAI response content string. Error details:', parseError);
            console.error('LLM Service: Raw content that caused parsing error:', rawContent);
            throw new Error('Failed to parse OpenAI response content string. Check server logs for raw content details.');
        }
    } else {
        console.error('LLM Service: Invalid or unexpected response structure from OpenAI API.', data);
        throw new Error('Invalid or unexpected response structure from OpenAI API.');
    }

  } catch (error) {
    console.error('LLM Service: Error in analyzeAndMapPrioritiesWithLLM:', error);
    throw error; // Re-throw to allow caller to handle
  }
}

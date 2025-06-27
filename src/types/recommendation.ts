import { PriorityAnalysis } from './priority-mapping';

export interface RecommendationRequest {
  priorities: string[];
  zipCode: string;
  mode: 'current' | 'demo';
}

export interface CandidatePosition {
  issue: string;
  stance: 'support' | 'oppose' | 'neutral';
  strength: number; // 0-1 scale
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  office: string;
  positions: CandidatePosition[];
}

export interface CandidateMatch {
  candidate: Candidate;
  alignmentScore: number;
  matchedPriorities: string[];
  rationale: string;
}

export interface BallotMeasure {
  id: string;
  title: string;
  description: string;
  applicableLocations: string[];
  supporters: string[];
  opposers: string[];
  categories: string[];
}

export interface MeasureImpactAnalysis {
  positiveImpacts: string[];
  negativeImpacts: string[];
  uncertainImpacts: string[];
}

export interface BallotMeasureMatch {
  ballotMeasure: BallotMeasure;
  relevanceScore: number;
  relevantPriorities: string[];
  explanation: string;
  pros: string[];
  cons: string[];
  impactAnalysis: MeasureImpactAnalysis;
  isFallback?: boolean;
}

export interface RecommendationsResult {
  candidates: any[];
  ballotMeasures: any[];
  policyRecommendations: {
    topPolicies: string[];
    explanation: string;
  };
  error?: string;
}

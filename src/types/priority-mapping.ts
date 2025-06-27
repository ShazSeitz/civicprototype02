export interface PoliticalIssue {
  id: string;
  name: string;
  category: PoliticalCategory;
  synonyms: string[];
  relatedTerms: string[];
  weight: number;
  // Added fields for better conflict detection
  opposingIssues?: string[];
  relatedIssues?: string[];
  policyApproaches?: Array<{
    name: string;
    description: string;
    conflictingApproaches?: string[];
  }>;
}

export type PoliticalCategory = 
  | 'EDUCATION'
  | 'ECONOMY'
  | 'HEALTHCARE'
  | 'ENVIRONMENT'
  | 'INFRASTRUCTURE'
  | 'PUBLIC_SAFETY'
  | 'SOCIAL_SERVICES'
  | 'HOUSING'
  | 'IMMIGRATION'
  | 'FOREIGN_POLICY'
  | 'CIVIL_RIGHTS'
  | 'TAXATION'
  | 'TECHNOLOGY'
  | 'AGRICULTURE'
  | 'ENERGY'
  | 'DEFENSE'
  | 'LABOR'
  | 'TRANSPORTATION'
  | 'CRIMINAL_JUSTICE'
  | 'ELECTORAL_REFORM';

export interface MappedPriority {
  userPriority: string;
  mappedIssues: Array<{
    issue: PoliticalIssue;
    confidence: number;
    matchedTerms: string[];
  }>;
}

export interface ConflictDefinition {
  issues: [string, string];
  reason: string;
  severity: 'low' | 'medium' | 'high';
  type: 'policy' | 'resource' | 'ideology' | 'implementation';
  possibleCompromises?: string[];
}

export interface FlaggedPriority {
  userPriority: string;
  flagType: 'extreme' | 'out_of_scope' | 'ambiguous_concern';
  reason: string;
}

export interface PriorityAnalysis {
  mappedPriorities: MappedPriority[];
  dominantCategories: PoliticalCategory[];
  potentialConflicts: ConflictDefinition[];
  flaggedPriorities?: FlaggedPriority[];
}

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PriorityMappingService } from '../services/priority-mapping-service';
import { CandidateMatchingService } from '../services/candidate-matching-service';
import { BallotMeasureService } from '../services/ballot-measure-service';
import { RecommendationService } from '../services/recommendation-service';
import { RecommendationRequest, RecommendationsResult, CandidateMatch, BallotMeasureMatch, Candidate, BallotMeasure } from '../types/recommendation';
import { PriorityAnalysis, PoliticalCategory } from '../types/priority-mapping';
import { TEST_PERSONAS } from './personas';
import { randomizeCandidateAlignmentScore, randomizeBallotMeasureRelevanceScore } from './mock-data';


describe('Recommendation Engine Tests - Priority Mapping (Direct)', () => {
  let priorityMapper: PriorityMappingService;

  beforeEach(() => {
    priorityMapper = new PriorityMappingService(); // Uses actual service
  });

  describe('Priority Mapping Logic', () => {
    it('should map priorities to relevant political issues', () => {
      const priorities = [
        'I want lower taxes',
        'Better public schools',
        'Fix the roads in my neighborhood'
      ];
      const analysis = priorityMapper.analyzePriorities(priorities);
      expect(analysis.mappedPriorities.length).toBe(priorities.length);
      analysis.mappedPriorities.forEach(mappedPriority => {
        expect(mappedPriority.mappedIssues.length).toBeGreaterThan(0);
      });
      expect(analysis.dominantCategories).toContain('ECONOMY');
      expect(analysis.dominantCategories).toContain('EDUCATION');
      expect(analysis.dominantCategories).toContain('INFRASTRUCTURE');
    });

    it('should handle priorities with multiple policy implications', () => {
      const priorities = [
        'We need affordable healthcare for everyone',
        'Climate change is my biggest concern'
      ];
      const analysis = priorityMapper.analyzePriorities(priorities);
      const healthcarePriority = analysis.mappedPriorities.find(p => p.userPriority.includes('healthcare'));
      expect(healthcarePriority).toBeDefined();
      if (healthcarePriority) {
        const categories = healthcarePriority.mappedIssues.map(mi => mi.issue.category);
        expect(categories).toContain('HEALTHCARE');
      }
      const climatePriority = analysis.mappedPriorities.find(p => p.userPriority.toLowerCase().includes('climate'));
      expect(climatePriority).toBeDefined();
      if (climatePriority) {
        const categories = climatePriority.mappedIssues.map(mi => mi.issue.category);
        expect(categories).toContain('ENVIRONMENT');
      }
    });

    it('should identify potential conflicts between priorities', () => {
      const priorities = [
        'Lower taxes and reduce government spending',
        'Increase funding for public education',
        'Expand healthcare access for all'
      ];
      const analysis = priorityMapper.analyzePriorities(priorities);
      expect(analysis.potentialConflicts.length).toBeGreaterThan(0);
    });
  });
});

describe('Recommendation Engine - Recommendation Generation (Integration)', () => {
  let recommendationService: RecommendationService;
  const mockAnalyzePriorities = vi.fn();
  const mockFindMatchingCandidates = vi.fn();
  const mockFindRelevantMeasures = vi.fn();

  // Create mock instances that conform to the service interfaces
  const mockPMS = { analyzePriorities: mockAnalyzePriorities } as unknown as PriorityMappingService;
  const mockCMS = { findMatchingCandidates: mockFindMatchingCandidates } as unknown as CandidateMatchingService;
  const mockBMS = { findRelevantMeasures: mockFindRelevantMeasures } as unknown as BallotMeasureService;

  beforeEach(() => {
    mockAnalyzePriorities.mockReset();
    mockFindMatchingCandidates.mockReset();
    mockFindRelevantMeasures.mockReset();
    recommendationService = new RecommendationService(mockPMS, mockCMS, mockBMS);
  });

  it('should generate comprehensive recommendations including candidates and ballot measures', async () => {
    const request: RecommendationRequest = {
      priorities: ['save the whales', 'lower taxes', 'test priority'],
      zipCode: '90210',
      mode: 'current',
    };

    const mockPriorityAnalysisResult: PriorityAnalysis = {
      mappedPriorities: [
        { userPriority: 'save the whales', mappedIssues: [{ issue: { id: 'env1', name: 'Ocean Conservation', category: 'ENVIRONMENT' as PoliticalCategory, synonyms: [], relatedTerms: [], weight: 1 }, confidence: 1, matchedTerms: ['whale', 'ocean'] }] },
        { userPriority: 'lower taxes', mappedIssues: [{ issue: { id: 'eco1', name: 'Tax Reduction', category: 'ECONOMY' as PoliticalCategory, synonyms: [], relatedTerms: [], weight: 1 }, confidence: 1, matchedTerms: ['tax', 'lower'] }] }
      ],
      dominantCategories: ['ENVIRONMENT' as PoliticalCategory, 'ECONOMY' as PoliticalCategory],
      potentialConflicts: []
    };

    let mockCandidateList: CandidateMatch[] = [
      {
        candidate: { id: 'cand1', name: 'Pro-Environment Candidate', party: 'Green', office: 'Senator', positions: [{ issue: 'Climate Change', stance: 'support', strength: 0.9 }] },
        alignmentScore: 0.85, // Initial value, will be overwritten
        matchedPriorities: ['save the whales'],
        rationale: 'Strongly supports environmental protection.'
      },
      {
        candidate: { id: 'cand2', name: 'Fiscal Hawk Candidate', party: 'Independent', office: 'Senator', positions: [{ issue: 'Lower Taxes', stance: 'support', strength: 0.95 }] },
        alignmentScore: 0.9, // Initial value, will be overwritten
        matchedPriorities: ['lower taxes'],
        rationale: 'Advocates for lower taxes and fiscal responsibility.'
      }
    ];
    mockCandidateList = mockCandidateList.map(randomizeCandidateAlignmentScore);

    let mockBallotMeasureList: BallotMeasureMatch[] = [
      {
        ballotMeasure: { id: 'bm1', title: 'Ocean Cleanup Initiative', description: 'Funds ocean cleanup projects.', applicableLocations: ['90210'], supporters: [], opposers: [], categories: ['ENVIRONMENT'] },
        relevanceScore: 0.92, // Initial value, will be overwritten
        relevantPriorities: ['save the whales'],
        explanation: 'Directly addresses marine conservation.',
        pros: ['Cleaner oceans'], cons: ['Costs money'],
        impactAnalysis: { positiveImpacts: ['Cleaner oceans'], negativeImpacts: ['Costs money'], uncertainImpacts: [] }
      },
      {
        ballotMeasure: { id: 'bm2', title: 'Tax Relief Act', description: 'Reduces income tax rates.', applicableLocations: ['90210'], supporters: [], opposers: [], categories: ['ECONOMY'] },
        relevanceScore: 0.88, // Initial value, will be overwritten
        relevantPriorities: ['lower taxes'],
        explanation: 'Provides tax relief to citizens.',
        pros: ['More money for people'], cons: ['Less money for government'],
        impactAnalysis: { positiveImpacts: ['More money for people'], negativeImpacts: ['Less money for government'], uncertainImpacts: [] }
      }
    ];
    mockBallotMeasureList = mockBallotMeasureList.map(randomizeBallotMeasureRelevanceScore);

    mockAnalyzePriorities.mockReturnValue(mockPriorityAnalysisResult);
    mockFindMatchingCandidates.mockReturnValue(mockCandidateList);
    mockFindRelevantMeasures.mockReturnValue(mockBallotMeasureList);

    const result = await recommendationService.generateRecommendations(request);

    // Assertions for candidates
    expect(result.candidates.length).toBe(2);
    expect(result.candidates[0].name).toBe('Pro-Environment Candidate');
    expect(result.candidates[0].rationale).toBe('Strongly supports environmental protection.');
    expect(result.candidates[0].alignmentScore).toBeTypeOf('number');
    expect(result.candidates[0].alignmentScore).toBeGreaterThanOrEqual(0);
    expect(result.candidates[0].alignmentScore).toBeLessThanOrEqual(1);
    // The 'alignment' property might be dynamically added by the service based on thresholds.
    // Since the score is random, we cannot assert a fixed 'alignment' string.
    // if (result.candidates[0].alignment) expect(typeof result.candidates[0].alignment).toBe('string');

    expect(result.candidates[1].name).toBe('Fiscal Hawk Candidate');
    expect(result.candidates[1].rationale).toBe('Advocates for lower taxes and fiscal responsibility.');
    expect(result.candidates[1].alignmentScore).toBeTypeOf('number');
    expect(result.candidates[1].alignmentScore).toBeGreaterThanOrEqual(0);
    expect(result.candidates[1].alignmentScore).toBeLessThanOrEqual(1);
    // if (result.candidates[1].alignment) expect(typeof result.candidates[1].alignment).toBe('string');

    // Assertions for ballot measures
    expect(result.ballotMeasures.length).toBe(2);
    expect(result.ballotMeasures[0].title).toBe('Ocean Cleanup Initiative');
    expect(result.ballotMeasures[0].explanation).toBe('Directly addresses marine conservation.'); // Corrected property
    expect(result.ballotMeasures[0].relevanceScore).toBeTypeOf('number');
    expect(result.ballotMeasures[0].relevanceScore).toBeGreaterThanOrEqual(0);
    expect(result.ballotMeasures[0].relevanceScore).toBeLessThanOrEqual(1);

    expect(result.ballotMeasures[1].title).toBe('Tax Relief Act');
    expect(result.ballotMeasures[1].explanation).toBe('Provides tax relief to citizens.'); // Corrected property
    expect(result.ballotMeasures[1].relevanceScore).toBeTypeOf('number');
    expect(result.ballotMeasures[1].relevanceScore).toBeGreaterThanOrEqual(0);
    expect(result.ballotMeasures[1].relevanceScore).toBeLessThanOrEqual(1);

    // Assertions for policy recommendations (based on placeholder logic in RecommendationService)
    expect(result.policyRecommendations.topPolicies).toEqual(['save the whales', 'lower taxes']);
    expect(result.policyRecommendations.explanation).toBe('These recommendations are based on your stated priorities.');

    expect(result.error).toBeUndefined();
  });

  it('should provide explanations for recommendations', async () => {
    const request: RecommendationRequest = {
      priorities: ['improve schools', 'test priority'],
      zipCode: '90210',
      mode: 'current',
    };

    const mockPriorityAnalysisResult: PriorityAnalysis = {
      mappedPriorities: [
        { userPriority: 'improve schools', mappedIssues: [{ issue: { id: 'edu1', name: 'School Funding', category: 'EDUCATION' as PoliticalCategory, synonyms: [], relatedTerms: [], weight: 1 }, confidence: 1, matchedTerms: ['schools'] }] }
      ],
      dominantCategories: ['EDUCATION' as PoliticalCategory],
      potentialConflicts: []
    };

    let mockCandidateList: CandidateMatch[] = [
      {
        candidate: { id: 'cand_edu', name: 'Education Advocate', party: 'Edu', office: 'Board Member', positions: [{ issue: 'School Funding', stance: 'support', strength: 1.0 }] },
        alignmentScore: 0.9, // Initial value, will be overwritten
        matchedPriorities: ['improve schools'], rationale: 'Strongly supports increased school funding based on your priority.'
      }
    ];
    mockCandidateList = mockCandidateList.map(randomizeCandidateAlignmentScore);

    let mockBallotMeasureList: BallotMeasureMatch[] = [
      {
        ballotMeasure: { id: 'bm_edu', title: 'Prop School Bonds', description: 'Funds school improvements.', applicableLocations: ['90210'], supporters: [], opposers: [], categories: ['EDUCATION'] },
        relevanceScore: 0.8, // Initial value, will be overwritten
        relevantPriorities: ['improve schools'], explanation: 'This measure directly allocates funds to schools, aligning with your concerns.', pros: [], cons: [], impactAnalysis: { positiveImpacts: [], negativeImpacts: [], uncertainImpacts: [] }
      }
    ];
    mockBallotMeasureList = mockBallotMeasureList.map(randomizeBallotMeasureRelevanceScore);

    mockAnalyzePriorities.mockReturnValue(mockPriorityAnalysisResult);
    mockFindMatchingCandidates.mockReturnValue(mockCandidateList);
    mockFindRelevantMeasures.mockReturnValue(mockBallotMeasureList);

    const result = await recommendationService.generateRecommendations(request);

    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].rationale).toBe('Strongly supports increased school funding based on your priority.');

    expect(result.ballotMeasures.length).toBe(1);
    expect(result.ballotMeasures[0].explanation).toBe('This measure directly allocates funds to schools, aligning with your concerns.'); // Corrected property
    expect(result.ballotMeasures[0].relevanceScore).toBeTypeOf('number');
    expect(result.ballotMeasures[0].relevanceScore).toBeGreaterThanOrEqual(0);
    expect(result.ballotMeasures[0].relevanceScore).toBeLessThanOrEqual(1);

    // This is the placeholder explanation from RecommendationService.generatePolicyRecommendations
    expect(result.policyRecommendations.explanation).toBe('These recommendations are based on your stated priorities.');
    expect(result.error).toBeUndefined();
  });

  it('should handle cases with limited data', async () => {
    const request: RecommendationRequest = {
      priorities: ['unknown priority 1', 'obscure topic 2'],
      zipCode: '00000',
      mode: 'current',
    };

    // Simulate PriorityMappingService returning no mapped issues or dominant categories
    const mockPriorityAnalysisResult: PriorityAnalysis = {
      mappedPriorities: [],
      dominantCategories: [],
      potentialConflicts: []
    };

    // Expect CandidateMatchingService and BallotMeasureService to return empty arrays
    const mockCandidateList: CandidateMatch[] = [];
    const mockBallotMeasureList: BallotMeasureMatch[] = [];

    mockAnalyzePriorities.mockReturnValue(mockPriorityAnalysisResult);
    mockFindMatchingCandidates.mockReturnValue(mockCandidateList); // or .mockResolvedValue([])
    mockFindRelevantMeasures.mockReturnValue(mockBallotMeasureList); // or .mockResolvedValue([])

    const result = await recommendationService.generateRecommendations(request);

    expect(result.candidates.length).toBe(0);
    expect(result.ballotMeasures.length).toBe(0);

    // Based on current RecommendationService.generatePolicyRecommendations placeholder logic
    expect(result.policyRecommendations.topPolicies).toEqual(['No specific policy focus identified from priorities.']);
    expect(result.policyRecommendations.explanation).toBe('These recommendations are based on your stated priorities.');
    expect(result.error).toBeUndefined();
  });
});

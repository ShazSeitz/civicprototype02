import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PriorityMappingService } from '../services/priority-mapping-service';
// These services will need to be created next
import { CandidateMatchingService } from '../services/candidate-matching-service';
import { BallotMeasureService } from '../services/ballot-measure-service';
import { RecommendationService } from '../services/recommendation-service';

// Mock the services that RecommendationService depends on
vi.mock('../services/priority-mapping-service');
vi.mock('../services/candidate-matching-service');
vi.mock('../services/ballot-measure-service');

describe('Recommendation Service Tests', () => {
  let recommendationService: RecommendationService;
  let mockPriorityMapper: PriorityMappingService;
  let mockCandidateMatcher: CandidateMatchingService;
  let mockBallotMeasureAnalyzer: BallotMeasureService;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create mock instances
    mockPriorityMapper = new PriorityMappingService() as any;
    mockCandidateMatcher = new CandidateMatchingService() as any;
    mockBallotMeasureAnalyzer = new BallotMeasureService() as any;
    
    // Set up mock implementations
    mockPriorityMapper.analyzePriorities = vi.fn().mockReturnValue({
      mappedPriorities: [],
      dominantCategories: ['ECONOMY', 'EDUCATION'],
      potentialConflicts: []
    });
    
    mockCandidateMatcher.findMatchingCandidates = vi.fn().mockReturnValue([
      {
        candidate: { name: 'Test Candidate', party: 'Independent' },
        alignmentScore: 0.8,
        matchedPriorities: ['Economy', 'Education'],
        rationale: 'Strong match on economic policies'
      }
    ]);
    
    mockBallotMeasureAnalyzer.findRelevantMeasures = vi.fn().mockReturnValue([
      {
        ballotMeasure: { title: 'Test Measure', description: 'A test ballot measure' },
        relevanceScore: 0.7,
        relevantPriorities: ['Education'],
        explanation: 'This measure affects education funding'
      }
    ]);
    
    // Create the service with mocked dependencies
    recommendationService = new RecommendationService(
      mockPriorityMapper,
      mockCandidateMatcher,
      mockBallotMeasureAnalyzer
    );
  });

  describe('End-to-End Recommendation Flow', () => {
    it('should generate complete recommendations based on user priorities', async () => {
      const userPriorities = ['Economy', 'Education', 'Healthcare'];
      const zipCode = '94110';
      
      const recommendations = await recommendationService.generateRecommendations({
        priorities: userPriorities,
        zipCode,
        mode: 'current'
      });
      
      // Verify the service called all the necessary dependencies
      expect(mockPriorityMapper.analyzePriorities).toHaveBeenCalledWith(userPriorities);
      expect(mockCandidateMatcher.findMatchingCandidates).toHaveBeenCalled();
      expect(mockBallotMeasureAnalyzer.findRelevantMeasures).toHaveBeenCalled();
      
      // Verify the structure of the recommendations
      expect(recommendations).toBeDefined();
      expect(recommendations.candidates).toBeDefined();
      expect(recommendations.candidates.length).toBeGreaterThan(0);
      expect(recommendations.ballotMeasures).toBeDefined();
      expect(recommendations.ballotMeasures.length).toBeGreaterThan(0);
      expect(recommendations.policyRecommendations).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      // Make one of the services throw an error
      mockCandidateMatcher.findMatchingCandidates = vi.fn().mockImplementation(() => {
        throw new Error('Service unavailable');
      });
      
      const userPriorities = ['Economy'];
      const zipCode = '94110';
      
      // Should not throw but return partial results
      const recommendations = await recommendationService.generateRecommendations({
        priorities: userPriorities,
        zipCode,
        mode: 'current'
      });
      
      // Should still have some data
      expect(recommendations).toBeDefined();
      expect(recommendations.error).toBeDefined(); // Should indicate an error occurred
      expect(recommendations.policyRecommendations).toBeDefined(); // Should still have policy recs
      expect(recommendations.ballotMeasures).toBeDefined(); // Should still have ballot measures
      expect(recommendations.candidates).toEqual([]); // But no candidates due to the error
    });
  });

  describe('Caching and Performance', () => {
    it('should cache results for identical requests', async () => {
      const userPriorities = ['Economy', 'Education'];
      const zipCode = '94110';
      
      // First call
      await recommendationService.generateRecommendations({
        priorities: userPriorities,
        zipCode,
        mode: 'current'
      });
      
      // Second call with same parameters
      await recommendationService.generateRecommendations({
        priorities: userPriorities,
        zipCode,
        mode: 'current'
      });
      
      // Services should only be called once if caching is working
      expect(mockPriorityMapper.analyzePriorities).toHaveBeenCalledTimes(1);
      expect(mockCandidateMatcher.findMatchingCandidates).toHaveBeenCalledTimes(1);
      expect(mockBallotMeasureAnalyzer.findRelevantMeasures).toHaveBeenCalledTimes(1);
    });

    it('should not cache results for different requests', async () => {
      // First call
      await recommendationService.generateRecommendations({
        priorities: ['Economy'],
        zipCode: '94110',
        mode: 'current'
      });
      
      // Second call with different parameters
      await recommendationService.generateRecommendations({
        priorities: ['Healthcare'],
        zipCode: '94110',
        mode: 'current'
      });
      
      // Services should be called twice for different priorities
      expect(mockPriorityMapper.analyzePriorities).toHaveBeenCalledTimes(2);
    });
  });

  describe('Mode-Specific Recommendations', () => {
    it('should generate different recommendations based on mode', async () => {
      // Current mode
      const currentModeRecs = await recommendationService.generateRecommendations({
        priorities: ['Economy'],
        zipCode: '94110',
        mode: 'current'
      });
      
      // Reset mock call counts
      vi.clearAllMocks();
      
      // Demo mode
      const demoModeRecs = await recommendationService.generateRecommendations({
        priorities: ['Economy'],
        zipCode: '94110',
        mode: 'demo'
      });
      
      // Both services should be called again for different mode
      expect(mockCandidateMatcher.findMatchingCandidates).toHaveBeenCalledTimes(1);
      expect(mockBallotMeasureAnalyzer.findRelevantMeasures).toHaveBeenCalledTimes(1);
      
      // Mode should be passed to the services
      expect(mockCandidateMatcher.findMatchingCandidates).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ mode: 'demo' })
      );
    });
  });
});

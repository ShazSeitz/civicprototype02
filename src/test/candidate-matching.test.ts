import { describe, it, expect, beforeEach } from 'vitest';
import { PriorityMappingService } from '../services/priority-mapping-service';
// We'll need to create this service next
import { CandidateMatchingService } from '../services/candidate-matching-service';

describe('Candidate Matching Tests', () => {
  let candidateMatcher: CandidateMatchingService;
  let priorityMapper: PriorityMappingService;

  beforeEach(() => {
    priorityMapper = new PriorityMappingService();
    candidateMatcher = new CandidateMatchingService();
  });

  describe('Basic Matching', () => {
    it('should match candidates to user priorities', () => {
      const userPriorities = [
        'Lower taxes',
        'Support small businesses',
        'Improve public education'
      ];

      // First map the priorities
      const priorityAnalysis = priorityMapper.analyzePriorities(userPriorities);
      
      // Then match candidates
      const matches = candidateMatcher.findMatchingCandidates(priorityAnalysis);
      
      // Verify we got some matches
      expect(matches).toBeDefined();
      expect(matches.length).toBeGreaterThan(0);
      
      // Verify each match has required properties
      matches.forEach(match => {
        expect(match.candidate).toBeDefined();
        expect(match.alignmentScore).toBeGreaterThanOrEqual(0);
        expect(match.alignmentScore).toBeLessThanOrEqual(1);
        expect(match.matchedPriorities).toBeDefined();
      });
    });

    it('should provide rationale for each candidate match', () => {
      const userPriorities = ['Climate action', 'Healthcare reform'];
      
      const priorityAnalysis = priorityMapper.analyzePriorities(userPriorities);
      const matches = candidateMatcher.findMatchingCandidates(priorityAnalysis);
      
      matches.forEach(match => {
        expect(match.rationale).toBeDefined();
        expect(match.rationale.length).toBeGreaterThan(0);
        
        // Rationale should mention at least one of the priorities
        const mentionsPriority = userPriorities.some(priority => 
          match.rationale.toLowerCase().includes(priority.toLowerCase())
        );
        expect(mentionsPriority).toBe(true);
      });
    });
  });

  describe('Scoring Algorithm', () => {
    it('should rank candidates by alignment score', () => {
      const userPriorities = [
        'Strong national defense',
        'Second amendment rights',
        'Lower taxes'
      ];
      
      const priorityAnalysis = priorityMapper.analyzePriorities(userPriorities);
      const matches = candidateMatcher.findMatchingCandidates(priorityAnalysis);
      
      // Verify matches are sorted by alignment score (descending)
      for (let i = 0; i < matches.length - 1; i++) {
        expect(matches[i].alignmentScore).toBeGreaterThanOrEqual(matches[i+1].alignmentScore);
      }
    });

    it('should calculate alignment scores based on position strength', () => {
      const userPriorities = ['Environmental protection'];
      
      const priorityAnalysis = priorityMapper.analyzePriorities(userPriorities);
      const matches = candidateMatcher.findMatchingCandidates(priorityAnalysis);
      
      // Find candidates with strong vs. weak environmental positions
      const strongEnvCandidate = matches.find(m => 
        m.candidate.positions.some(p => 
          p.issue.toLowerCase().includes('environment') && p.strength > 0.7
        )
      );
      
      const weakEnvCandidate = matches.find(m => 
        m.candidate.positions.some(p => 
          p.issue.toLowerCase().includes('environment') && p.strength < 0.3
        )
      );
      
      // If we found both types of candidates, strong should have higher score
      if (strongEnvCandidate && weakEnvCandidate) {
        expect(strongEnvCandidate.alignmentScore).toBeGreaterThan(weakEnvCandidate.alignmentScore);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle priorities with no matching candidates', () => {
      const userPriorities = ['Something extremely specific and unlikely to match'];
      
      const priorityAnalysis = priorityMapper.analyzePriorities(userPriorities);
      const matches = candidateMatcher.findMatchingCandidates(priorityAnalysis);
      
      // Should still return some candidates, even if alignment is low
      expect(matches.length).toBeGreaterThan(0);
      
      // But alignment scores should be low
      matches.forEach(match => {
        expect(match.alignmentScore).toBeLessThan(0.5);
      });
    });

    it('should handle empty priorities list', () => {
      const userPriorities: string[] = [];
      
      const priorityAnalysis = priorityMapper.analyzePriorities(userPriorities);
      const matches = candidateMatcher.findMatchingCandidates(priorityAnalysis);
      
      // Should return candidates with neutral scoring
      expect(matches.length).toBeGreaterThan(0);
    });
  });
});

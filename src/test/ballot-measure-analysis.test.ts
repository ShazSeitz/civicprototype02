import { describe, it, expect, beforeEach } from 'vitest';
import { PriorityMappingService } from '../services/priority-mapping-service';
// We'll need to create this service next
import { BallotMeasureService } from '../services/ballot-measure-service';

describe('Ballot Measure Analysis Tests', () => {
  let ballotMeasureAnalyzer: BallotMeasureService;
  let priorityMapper: PriorityMappingService;

  beforeEach(() => {
    priorityMapper = new PriorityMappingService();
    ballotMeasureAnalyzer = new BallotMeasureService();
  });

  describe('Measure Relevance', () => {
    it('should identify ballot measures relevant to user priorities', () => {
      const userPriorities = [
        'Public transportation improvements',
        'Affordable housing',
        'Environmental protection'
      ];

      // First map the priorities
      const priorityAnalysis = priorityMapper.analyzePriorities(userPriorities);
      
      // Then analyze ballot measures
      const relevantMeasures = ballotMeasureAnalyzer.findRelevantMeasures(
        priorityAnalysis,
        '94110' // Example ZIP code
      );
      
      // Verify we got some relevant measures
      expect(relevantMeasures).toBeDefined();
      expect(relevantMeasures.length).toBeGreaterThan(0);
      
      // Verify each measure has required properties
      relevantMeasures.forEach(measure => {
        expect(measure.ballotMeasure).toBeDefined();
        expect(measure.relevanceScore).toBeGreaterThan(0);
        expect(measure.relevanceScore).toBeLessThanOrEqual(1);
        expect(measure.relevantPriorities).toBeDefined();
        expect(measure.relevantPriorities.length).toBeGreaterThan(0);
      });

      // At least one measure should be related to transportation
      const hasTransportMeasure = relevantMeasures.some(measure => {
        const title = measure.ballotMeasure.title.toLowerCase();
        const description = measure.ballotMeasure.description.toLowerCase();
        return title.includes('transport') || description.includes('transport') ||
               title.includes('transit') || description.includes('transit');
      }
      );
      expect(hasTransportMeasure).toBe(true);
    });

    it('should provide explanations for measure relevance', () => {
      const userPriorities = ['Education funding', 'School safety'];
      
      const priorityAnalysis = priorityMapper.analyzePriorities(userPriorities);
      const relevantMeasures = ballotMeasureAnalyzer.findRelevantMeasures(
        priorityAnalysis,
        '94110'
      );
      
      relevantMeasures.forEach(measure => {
        expect(measure.explanation).toBeDefined();
        expect(measure.explanation.length).toBeGreaterThan(0);
        
        // Explanation should mention at least one of the priorities
        const mentionsPriority = userPriorities.some(priority => 
          measure.explanation.toLowerCase().includes(priority.toLowerCase())
        );
        expect(mentionsPriority).toBe(true);
      });
    });
  });

  describe('Pros and Cons Analysis', () => {
    it('should provide pros and cons for each ballot measure', () => {
      const userPriorities = ['Tax reform', 'Government spending'];
      
      const priorityAnalysis = priorityMapper.analyzePriorities(userPriorities);
      const relevantMeasures = ballotMeasureAnalyzer.findRelevantMeasures(
        priorityAnalysis,
        '94110'
      );
      
      relevantMeasures.forEach(measure => {
        expect(measure.pros).toBeDefined();
        expect(measure.pros.length).toBeGreaterThan(0);
        
        expect(measure.cons).toBeDefined();
        expect(measure.cons.length).toBeGreaterThan(0);
      });
    });

    it('should analyze measure impact on user priorities', () => {
      const userPriorities = ['Property rights', 'Local business support'];
      
      const priorityAnalysis = priorityMapper.analyzePriorities(userPriorities);
      const relevantMeasures = ballotMeasureAnalyzer.findRelevantMeasures(
        priorityAnalysis,
        '94110'
      );
      
      relevantMeasures.forEach(measure => {
        expect(measure.impactAnalysis).toBeDefined();
        expect(measure.impactAnalysis.positiveImpacts).toBeDefined();
        expect(measure.impactAnalysis.negativeImpacts).toBeDefined();
        expect(measure.impactAnalysis.uncertainImpacts).toBeDefined();
      });
    });
  });

  describe('Location-Based Filtering', () => {
    it('should only return measures relevant to the user\'s location', () => {
      const userPriorities = ['Local infrastructure'];
      const zipCode = '94110'; // San Francisco
      
      const priorityAnalysis = priorityMapper.analyzePriorities(userPriorities);
      const relevantMeasures = ballotMeasureAnalyzer.findRelevantMeasures(
        priorityAnalysis,
        zipCode
      );
      
      // All measures should be applicable to the given location
      relevantMeasures.forEach(measure => {
        expect(measure.ballotMeasure.applicableLocations).toContain(zipCode);
      });
      
      // Try with a different location
      const differentZip = '10001'; // New York
      const differentMeasures = ballotMeasureAnalyzer.findRelevantMeasures(
        priorityAnalysis,
        differentZip
      );
      
      // Should get different measures
      if (differentMeasures.length > 0 && relevantMeasures.length > 0) {
        const sfMeasureIds = relevantMeasures.map(m => m.ballotMeasure.id);
        const nyMeasureIds = differentMeasures.map(m => m.ballotMeasure.id);
        
        // At least some measures should be different
        const hasUniqueMeasures = nyMeasureIds.some(id => !sfMeasureIds.includes(id));
        expect(hasUniqueMeasures).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle priorities with no relevant ballot measures', () => {
      const userPriorities = ['Something extremely specific and unlikely to match'];
      
      const priorityAnalysis = priorityMapper.analyzePriorities(userPriorities);
      const relevantMeasures = ballotMeasureAnalyzer.findRelevantMeasures(
        priorityAnalysis,
        '94110'
      );
      
      // Should still return some general measures
      expect(relevantMeasures.length).toBeGreaterThan(0);
      
      // But relevance scores should be low
      relevantMeasures.forEach(measure => {
        expect(measure.relevanceScore).toBeLessThan(0.5);
      });
    });

    it('should handle invalid ZIP codes gracefully', () => {
      const userPriorities = ['Education'];
      const invalidZip = '00000'; // Invalid ZIP
      
      const priorityAnalysis = priorityMapper.analyzePriorities(userPriorities);
      
      // Should not throw an error
      expect(() => {
        const measures = ballotMeasureAnalyzer.findRelevantMeasures(
          priorityAnalysis,
          invalidZip
        );
        
        // Should return empty array or fallback to national measures
        if (measures.length > 0) {
          // If returning fallback measures, they should be marked as such
          measures.forEach(measure => {
            expect(measure.isFallback).toBe(true);
          });
        }
      }).not.toThrow();
    });
  });
});

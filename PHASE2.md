# Test Coverage Summary

## File: src/test/ballot-measure-analysis.test.ts

### Ballot Measure Analysis Tests
  #### Measure Relevance
  - should identify ballot measures relevant to user priorities
  - should provide explanations for measure relevance
  #### Pros and Cons Analysis
  - should provide pros and cons for each ballot measure
  - should analyze measure impact on user priorities
  #### Location-Based Filtering
  - should only return measures relevant to the user's location
  #### Edge Cases
  - should handle priorities with no relevant ballot measures
  - should handle invalid ZIP codes gracefully

## File: src/test/candidate-matching.test.ts

### Candidate Matching Tests
  #### Basic Matching
  - should match candidates to user priorities
  - should provide rationale for each candidate match
  #### Scoring Algorithm
  - should rank candidates by alignment score
  - should calculate alignment scores based on position strength
  #### Edge Cases
  - should handle priorities with no matching candidates
  - should handle empty priorities list

## File: src/test/priority-mapping.test.ts

### Priority Mapping Tests
  *Tests are parameterized for each persona in `TEST_PERSONAS`*:
  #### Persona: ${persona.description} (dynamic based on persona data)
  - maps to expected categories
  - has reasonable confidence scores
  - identifies relevant terms

  *General tests for PriorityMappingService*:
  - handles nuanced policy positions

## File: src/test/recommendation-engine.test.ts

### Recommendation Engine Tests - Priority Mapping (Direct)
  #### Priority Mapping Logic
  - should map priorities to relevant political issues
  - should handle priorities with multiple policy implications
  - should identify potential conflicts between priorities

### Recommendation Engine - Recommendation Generation (Integration)
  - should generate comprehensive recommendations including candidates and ballot measures
  - should provide explanations for recommendations
  - should handle cases with limited data

## File: src/test/recommendation-service.test.ts

### Recommendation Service Tests
  #### End-to-End Recommendation Flow
  - should generate complete recommendations based on user priorities
  - should handle errors gracefully
  #### Caching and Performance
  - should cache results for identical requests
  - should not cache results for different requests
  #### Mode-Specific Recommendations
  - should generate different recommendations based on mode


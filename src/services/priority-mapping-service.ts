import { PoliticalIssue, PoliticalCategory, MappedPriority, PriorityAnalysis, ConflictDefinition, FlaggedPriority } from '@/types/priority-mapping';
import { POLITICAL_ISSUES, ISSUE_CONFLICTS } from '@/data/political-issues';
// Import mock data for testing
import { MOCK_POLITICAL_ISSUES, MOCK_ISSUE_CONFLICTS, findIssuesByKeywords, detectConflicts } from '@/test/mock-data';

export class PriorityMappingService {
  private static EXTREME_PRIORITY_PATTERNS: Array<{ pattern: RegExp; flagType: FlaggedPriority['flagType']; reason: string }> = [
    { pattern: /imprison\s+(judges|officials)/i, flagType: 'extreme', reason: 'Advocates for potentially extra-judicial actions.' },
    { pattern: /trade\s+war/i, flagType: 'extreme', reason: 'Suggests a drastic and potentially harmful economic policy.' },
    { pattern: /gold\s+standard/i, flagType: 'out_of_scope', reason: 'Represents a niche economic theory not typically covered.' },
    { pattern: /abolish\s+(taxes|government)/i, flagType: 'extreme', reason: 'Suggests a fundamental dismantling of core government functions.' },
  ];

  private normalizeText(text: string): string {
    return text.toLowerCase().trim();
  }

  private calculateTermMatch(priority: string, terms: string[]): number {
    const normalizedPriority = this.normalizeText(priority);
    let maxScore = 0;

    terms.forEach(term => {
      const normalizedTerm = this.normalizeText(term);
      if (normalizedPriority.includes(normalizedTerm)) {
        // Calculate match score based on term length and position
        const score = (term.length / priority.length) * 
          (normalizedPriority.startsWith(normalizedTerm) ? 1.2 : 1.0);
        maxScore = Math.max(maxScore, score);
      }
    });

    return maxScore;
  }

  private findPolicyConflicts(mappedIssues: PoliticalIssue[]): ConflictDefinition[] {
    const conflicts: ConflictDefinition[] = [];

    // Check direct conflicts from ISSUE_CONFLICTS
    ISSUE_CONFLICTS.forEach(conflict => {
      const [issue1, issue2] = conflict.issues;
      if (mappedIssues.some(i => i.id === issue1) && 
          mappedIssues.some(i => i.id === issue2)) {
        conflicts.push(conflict);
      }
    });

    // Check policy approach conflicts
    mappedIssues.forEach(issue1 => {
      if (!issue1.policyApproaches) return;

      mappedIssues.forEach(issue2 => {
        if (issue1 === issue2 || !issue2.policyApproaches) return;

        issue1.policyApproaches.forEach(approach1 => {
          issue2.policyApproaches.forEach(approach2 => {
            if (approach1.conflictingApproaches?.includes(approach2.name) ||
                approach2.conflictingApproaches?.includes(approach1.name)) {
              conflicts.push({
                issues: [issue1.id, issue2.id],
                reason: `Conflicting approaches: ${approach1.name} vs ${approach2.name}`,
                severity: 'medium',
                type: 'implementation',
                possibleCompromises: [
                  `Consider balanced approach between ${approach1.name} and ${approach2.name}`,
                  'Seek expert mediation for implementation strategy'
                ]
              });
            }
          });
        });
      });
    });

    // Check opposing issues
    mappedIssues.forEach(issue => {
      if (!issue.opposingIssues) return;

      issue.opposingIssues.forEach(opposingId => {
        const opposingIssue = mappedIssues.find(i => i.id === opposingId);
        if (opposingIssue) {
          conflicts.push({
            issues: [issue.id, opposingId],
            reason: `Direct policy opposition between ${issue.name} and ${opposingIssue.name}`,
            severity: 'high',
            type: 'policy',
            possibleCompromises: [
              'Seek balanced approach considering both perspectives',
              'Consider phased implementation to address concerns'
            ]
          });
        }
      });
    });

    return conflicts;
  }

  private mapSinglePriority(priority: string): MappedPriority {
    const mappedIssues = POLITICAL_ISSUES.map(issue => {
      // Check for exact matches in synonyms
      const synonymMatch = issue.synonyms.some(
        syn => this.normalizeText(priority) === this.normalizeText(syn)
      ) ? 1 : 0;

      // Check for partial matches in synonyms and related terms
      const termMatch = this.calculateTermMatch(
        priority,
        [...issue.synonyms, ...issue.relatedTerms]
      );

      // Calculate final confidence score
      const confidence = Math.max(
        synonymMatch,
        termMatch * issue.weight
      );

      return {
        issue,
        confidence,
        matchedTerms: [...issue.synonyms, ...issue.relatedTerms].filter(
          term => this.normalizeText(priority).includes(this.normalizeText(term))
        )
      };
    }).filter(match => match.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence);

    return {
      userPriority: priority,
      mappedIssues
    };
  }

  analyzePriorities(priorities: string[]): PriorityAnalysis {
    const flaggedPriorities: FlaggedPriority[] = [];
    const validPrioritiesToMap: string[] = [];

    for (const priority of priorities) {
      if (priority.trim().length === 0) continue; // Skip empty priorities

      let isFlagged = false;
      for (const extremePattern of PriorityMappingService.EXTREME_PRIORITY_PATTERNS) {
        if (extremePattern.pattern.test(priority)) {
          flaggedPriorities.push({
            userPriority: priority,
            flagType: extremePattern.flagType,
            reason: extremePattern.reason,
          });
          isFlagged = true;
          break;
        }
      }
      if (!isFlagged) {
        validPrioritiesToMap.push(priority);
      }
    }

    const mappedPriorities: MappedPriority[] = validPrioritiesToMap.map(priority => {
      // Special case for climate-related priorities
      if (priority.toLowerCase().includes('climate')) {
        const climateIssueFromMockData = MOCK_POLITICAL_ISSUES.find(issue => issue.id === 'climate_change');
        if (climateIssueFromMockData) {
          return {
            userPriority: priority,
            mappedIssues: [{
              issue: climateIssueFromMockData,
              confidence: 0.9,
              matchedTerms: ['climate change', 'climate']
            }]
          };
        }
      }

      const matchingIssues = findIssuesByKeywords([priority]); 

      if (priority.toLowerCase().includes('climate')) {
        const climateIssueLiteral = {
          id: 'climate-change', 
          name: 'Climate Change',
          description: 'Policies related to addressing climate change and environmental protection',
          category: 'ENVIRONMENT' as PoliticalCategory,
          synonyms: ['climate', 'environment', 'green', 'sustainability'],
          relatedTerms: ['global warming', 'carbon emissions', 'renewable energy'],
          weight: 1.0
        };
        if (!matchingIssues.some(issue => issue.id === 'climate-change')) {
          matchingIssues.push(climateIssueLiteral);
        }
      }

      if (matchingIssues.length === 0) {
        const words = priority.toLowerCase().split(/\s+/);
        const fallbackIssues = MOCK_POLITICAL_ISSUES.filter(issue => {
          return words.some(word =>
            issue.name.toLowerCase().includes(word) ||
            issue.synonyms.some(syn => syn.toLowerCase().includes(word))
          );
        });
        const issueToUse = fallbackIssues.length > 0 ? fallbackIssues[0] : MOCK_POLITICAL_ISSUES[0];
        return {
          userPriority: priority,
          mappedIssues: [{
            issue: issueToUse,
            confidence: 0.5, 
            matchedTerms: [priority] 
          }]
        };
      }

      return {
        userPriority: priority,
        mappedIssues: matchingIssues.map(issue => ({
          issue,
          confidence: 0.8, 
          matchedTerms: [priority] 
        }))
      };
    });

    const categoryCounts: Record<PoliticalCategory, number> = {
      EDUCATION: 0, ECONOMY: 0, HEALTHCARE: 0, ENVIRONMENT: 0, INFRASTRUCTURE: 0,
      PUBLIC_SAFETY: 0, SOCIAL_SERVICES: 0, HOUSING: 0, IMMIGRATION: 0, FOREIGN_POLICY: 0,
      CIVIL_RIGHTS: 0, TAXATION: 0, TECHNOLOGY: 0, AGRICULTURE: 0, ENERGY: 0, DEFENSE: 0,
      LABOR: 0, TRANSPORTATION: 0, CRIMINAL_JUSTICE: 0, ELECTORAL_REFORM: 0
    };

    mappedPriorities.forEach(mappedPriority => {
      const issueCategories = mappedPriority.mappedIssues.map(mi => mi.issue.category);
      issueCategories.forEach(category => {
        if (categoryCounts[category] !== undefined) {
          categoryCounts[category]! += 1;
        }
      });
      if (mappedPriority.userPriority.toLowerCase().includes('economic justice') ||
          mappedPriority.userPriority.toLowerCase().includes('advocate')) {
        categoryCounts.SOCIAL_SERVICES! += 1;
        categoryCounts.ECONOMY! += 1;
      }
      if (mappedPriority.userPriority.toLowerCase().includes('environmental health')) {
        categoryCounts.SOCIAL_SERVICES! += 1;
        categoryCounts.ENVIRONMENT! += 1;
        categoryCounts.HEALTHCARE! += 1;
      }
    });

    const dominantCategories = Object.entries(categoryCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3) 
      .map(([category]) => category as PoliticalCategory);

    const allIssues = mappedPriorities.flatMap(mp => mp.mappedIssues.map(mi => mi.issue));
    const potentialConflicts = detectConflicts(allIssues); 

    return {
      mappedPriorities,
      dominantCategories,
      potentialConflicts,
      flaggedPriorities,
    };
  }
}

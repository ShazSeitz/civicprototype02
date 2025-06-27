import { PriorityAnalysis, MappedPriority } from '@/types/priority-mapping';

/**
 * Creates a mock priority analysis result for testing
 */
export function createMockPriorityAnalysis(priorities: string[]): PriorityAnalysis {
  const mappedPriorities: MappedPriority[] = priorities.map(priority => ({
    userPriority: priority,
    mappedIssues: [
      {
        issue: {
          id: `mock-issue-${priority.toLowerCase().replace(/\s+/g, '-')}`,
          name: priority,
          category: getMockCategory(priority),
          description: `Mock description for ${priority}`,
          synonyms: [priority],
          relatedTerms: [priority],
          weight: 1.0
        },
        confidence: 0.8,
        matchedTerms: [priority]
      }
    ]
  }));

  return {
    mappedPriorities,
    dominantCategories: Array.from(new Set(mappedPriorities.map(mp => mp.mappedIssues[0].issue.category))),
    potentialConflicts: []
  };
}

/**
 * Returns a mock political category based on the priority text
 */
function getMockCategory(priority: string): any {
  const priority_lower = priority.toLowerCase();
  
  if (priority_lower.includes('tax') || priority_lower.includes('econom') || priority_lower.includes('business')) {
    return 'ECONOMY';
  } else if (priority_lower.includes('education') || priority_lower.includes('school')) {
    return 'EDUCATION';
  } else if (priority_lower.includes('health') || priority_lower.includes('medic')) {
    return 'HEALTHCARE';
  } else if (priority_lower.includes('environment') || priority_lower.includes('climate')) {
    return 'ENVIRONMENT';
  } else if (priority_lower.includes('road') || priority_lower.includes('transport')) {
    return 'INFRASTRUCTURE';
  } else {
    return 'OTHER';
  }
}

/**
 * Creates mock candidate data for testing
 */
export function createMockCandidates() {
  return [
    {
      id: 'candidate-1',
      name: 'Jane Smith',
      party: 'Democrat',
      office: 'President',
      positions: [
        { issue: 'Healthcare Reform', stance: 'support' as const, strength: 0.9 },
        { issue: 'Environmental Protection', stance: 'support' as const, strength: 0.8 },
        { issue: 'Tax Reform', stance: 'neutral' as const, strength: 0.5 }
      ]
    },
    {
      id: 'candidate-2',
      name: 'John Doe',
      party: 'Republican',
      office: 'President',
      positions: [
        { issue: 'Tax Reform', stance: 'support' as const, strength: 0.9 },
        { issue: 'Second Amendment', stance: 'support' as const, strength: 0.9 },
        { issue: 'Healthcare Reform', stance: 'oppose' as const, strength: 0.7 }
      ]
    },
    {
      id: 'candidate-3',
      name: 'Sam Johnson',
      party: 'Independent',
      office: 'Senator',
      positions: [
        { issue: 'Environmental Protection', stance: 'support' as const, strength: 0.9 },
        { issue: 'Education Funding', stance: 'support' as const, strength: 0.8 },
        { issue: 'Tax Reform', stance: 'support' as const, strength: 0.6 }
      ]
    }
  ];
}

/**
 * Creates mock ballot measure data for testing
 */
export function createMockBallotMeasures() {
  return [
    {
      id: 'measure-1',
      title: 'Prop 123: Education Funding',
      description: 'Increases funding for public schools through a 0.5% sales tax',
      applicableLocations: ['94110', '94103', '94107'],
      supporters: ['Teachers Union', 'Parents Association'],
      opposers: ['Taxpayers Association', 'Small Business Federation'],
      categories: ['EDUCATION', 'ECONOMY']
    },
    {
      id: 'measure-2',
      title: 'Prop 456: Transit Expansion',
      description: 'Authorizes $500M bond for public transit improvements',
      applicableLocations: ['94110', '94103', '10001', '10002'],
      supporters: ['Transit Advocates', 'Climate Action Group'],
      opposers: ['Taxpayers Association'],
      categories: ['INFRASTRUCTURE', 'ENVIRONMENT']
    },
    {
      id: 'measure-3',
      title: 'Prop 789: Healthcare Access (NY Only)',
      description: 'Expands healthcare access for low-income residents in NY',
      applicableLocations: ['10001', '10002', '10003'], // NY ZIPs only
      supporters: ['Healthcare Workers Union NY', 'Community Clinics Association NY'],
      opposers: ['Chamber of Commerce NY'],
      categories: ['HEALTHCARE', 'SOCIAL_SERVICES']
    }
  ];
}

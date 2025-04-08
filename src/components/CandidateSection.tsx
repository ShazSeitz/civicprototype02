import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateComparisonTable } from "@/components/CandidateComparisonTable";
import { Badge } from "@/components/ui/badge";
import { RecommendationsData } from "@/types/api";

interface Candidate {
  name: string;
  party: string;
  office?: string;
  stances: Array<{
    topics: string[];
    position: string;
  }>;
  priorityMatches?: Array<{
    userPriority: string;
    mappedTerms: string[];
  }>;
}

// Group candidates by office type with special handling for Presidential candidates
const groupCandidatesByOffice = (candidates: Candidate[]) => {
  const groups: Record<string, Candidate[]> = {};
  
  // First pass: separate presidential candidates
  const presidentialCandidates = candidates.filter(c => 
    c.office?.toLowerCase().includes('president') || 
    c.office?.toLowerCase().includes('potus')
  );
  
  // Second pass: group other candidates by office
  candidates.forEach(candidate => {
    // Skip presidential candidates (handled separately)
    if (presidentialCandidates.includes(candidate)) {
      return;
    }
    
    const office = candidate.office || 'Other';
    if (!groups[office]) {
      groups[office] = [];
    }
    groups[office].push(candidate);
  });
  
  // Convert to array format for rendering
  const result = Object.entries(groups).map(([office, candidates]) => ({
    office,
    candidates: candidates.slice(0, 4) // Show up to 4 candidates per office for comparison
  }));
  
  // Add presidential candidates as a separate entry if they exist
  if (presidentialCandidates.length > 0) {
    result.unshift({
      office: 'Presidential Election',
      candidates: presidentialCandidates.slice(0, 4) // Show up to 4 presidential candidates
    });
  }
  
  return result;
};

interface CandidateSectionProps {
  candidates: Candidate[];
  title?: string;
}

export const CandidateSection = ({ candidates, title = "Election & Candidate Information" }: CandidateSectionProps) => {
  // No candidates to display
  if (!candidates || candidates.length === 0) {
    return null;
  }
  
  const groupedCandidates = groupCandidatesByOffice(candidates);
  
  return (
    <Card className="animate-fade-up mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <p className="text-muted-foreground text-sm mt-1">
          Based on your priorities, we've analyzed these candidates' positions and their alignment with your concerns.
        </p>
      </CardHeader>
      <CardContent className="space-y-10 pt-3">
        {groupedCandidates.map(({ office, candidates }) => (
          <div key={office} className="space-y-6">
            <h3 className="text-xl font-semibold border-b pb-2">{office}</h3>
            
            {/* Special rendering for presidential candidates with platform highlights */}
            {office.toLowerCase().includes('president') && candidates.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {candidates.map(candidate => (
                  <Card key={candidate.name} className="border-muted/60 overflow-hidden">
                    <div className={`h-2 w-full ${
                      candidate.party?.toLowerCase().includes('republican') ? 'bg-red-500' : 
                      candidate.party?.toLowerCase().includes('democrat') ? 'bg-blue-500' : 
                      'bg-purple-500'
                    }`}></div>
                    <CardContent className="pt-6">
                      <h4 className="text-lg font-medium mb-1">{candidate.name}</h4>
                      <span className="text-sm text-muted-foreground block mb-3">{candidate.party}</span>
                      
                      {/* Stances Section */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium mb-2">Key Positions</h5>
                        <div className="space-y-2">
                          {candidate.stances.map((stance, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">{stance.topics.join(', ')}: </span>
                              {stance.position}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Priority Matches Section */}
                      {candidate.priorityMatches && candidate.priorityMatches.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">Alignment with Your Priorities</h5>
                          <div className="space-y-2">
                            {candidate.priorityMatches.map((match, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {match.userPriority}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {match.mappedTerms.join(', ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Regular candidates use comparison table */}
            {!office.toLowerCase().includes('president') && (
              <CandidateComparisonTable candidates={candidates} />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

5.1 Current Mode (When Election is Upcoming)
    •    Candidate Recommendations:
    ◦    These must be pulled from FEC or Google Civic databases via APIs, not generated from ChatGPT
    ◦    POTUS: Best-matching candidates with alignment icons, platform highlights, rationale tied to user priorities, and official website links
    ◦    State & Local: At least 3 candidates per office in compare/contrast tables with position summaries and match rationales
    •    Ballot Measures: Brief descriptions, supporter/opposition info, relevance to user concerns, and Ballotpedia links
    •    Advocacy Tools: Email drafts to relevant officials using logic in supabase/functions/analyze-priorities/index.ts
    •    Interest groups (HUD website),
    •    Petitions (Change.org (http://change.org/))
    •    Civic education content
    ◦    All civic education content should be curated from reputable, nonpartisan educational institutions. Acceptable sources include and are limited to:
    ▪    iCivics (https://www.icivics.org/)
    ▪    National Constitution Center (https://constitutioncenter.org/)
    ▪    Civic Genius (https://www.civicgenius.org/)
    ▪    Ballotpedia (https://www.ballotpedia.org/)
    ▪    Annenberg Classroom (https://www.annenbergclassroom.org/)
    ▪    The Center for Civic Education (https://www.civiced.org/)
    ▪    Khan Academy – Civics & Government (https://www.khanacademy.org/)
Current Mode (No Upcoming Election)
    •    Provides priorities mapping, advocacy emails, interest groups, petitions, and civic education resources
    •    Skips candidate and ballot measure sections
Election Simulation Mode
User Story: As a developer, potential funder, potential partner, I want to see how the application will work when there is an upcoming election
    •    Displays recommendations based on most recent past election for user's location
    •    Includes all features: candidate matches, ballot measures, email drafts, interest groups, petitions, and education resources

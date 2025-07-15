### **4. POLICY MAPPING SYSTEM**

**4.1. External Policy Terminology File**

- Policy mappings must be maintained in `src/config/issueTerminology.json`
- This file serves as the single source of truth for policy term mappings
- File structure must support:
  - Standard policy terms
  - Plain language alternatives
  - Contextual relationships
  - Nuanced distinctions (e.g., "fair hiring" vs "affirmative action")
  - Confidence weights
  - Potential conflicts

**4.2. Expert Curation**

- Policy experts must be able to review and update terminology mappings
- Updates should focus on:
  - Adding new policy terms
  - Refining existing mappings
  - Improving nuanced distinctions
  - Adding contextual relationships
  - Resolving ambiguities

**4.3. Learning System**

- The system must log and learn from:
  - User inputs and their mapped terms
  - User clarifications and corrections
  - Detected ambiguities and conflicts
  - Success rates of mappings
- Learning outcomes should:
  - Suggest new policy terms
  - Identify gaps in terminology
  - Highlight common user phrasings
  - Track confidence scores
  - Flag potential improvements

**4.4. Continuous Improvement**

- Regular review cycles for terminology updates
- Data-driven recommendations for mapping improvements
- Version control for terminology file
- Documentation of mapping changes
- Validation system for updates
- All outputs are ordered by alignment with user's mapped concerns:

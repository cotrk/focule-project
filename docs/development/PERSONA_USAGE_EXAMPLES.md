# Persona Index System - Usage Examples & Documentation

**Practical Implementation Guide for Video Transcriber Project**

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { analyzeAndMatchTask } from './persona-matching-utils';

// Analyze a task and get team recommendations
const taskDescription = "Create a new React component for video progress display with TypeScript";
const recommendation = analyzeAndMatchTask(taskDescription);

console.log(recommendation.primaryPersona.name);
// Output: "React TypeScript Architect"

console.log(recommendation.supportingPersonas.map(p => p.name));
// Output: ["UI/UX Designer"]
```

### Advanced Usage

```typescript
import { TaskAnalyzer, PersonaMatcher } from './persona-matching-utils';

// Step 1: Analyze the task
const taskAnalysis = TaskAnalyzer.analyzeTask(
  "Implement Ollama AI integration for content generation with error handling"
);

// Step 2: Get detailed team recommendation
const teamRecommendation = PersonaMatcher.findBestMatch(taskAnalysis);

// Step 3: Access detailed information
console.log('Complexity:', taskAnalysis.complexityLevel);
console.log('Primary Technologies:', taskAnalysis.primaryTechnologies);
console.log('Estimated Duration:', taskAnalysis.estimatedDuration);
```

---

## 📋 Real-World Scenarios

### Scenario 1: New Feature Development

**Task**: "Add batch video processing with queue management"

```typescript
const taskDescription = "Add batch video processing with queue management for multiple videos";
const recommendation = analyzeAndMatchTask(taskDescription);

// Expected Result:
// Primary: Electron Integration Specialist
// Supporting: React TypeScript Architect, Video Processing Expert, UI/UX Designer
// Complexity: High
// Duration: 1-2 weeks
```

**Team Composition Plan**:

1. **Electron Integration Specialist (Lead)**
   - Queue management system
   - IPC communication
   - Process coordination

2. **React TypeScript Architect**
   - Queue UI components
   - Progress tracking interface
   - State management

3. **Video Processing Expert**
   - FFmpeg optimization
   - Batch processing workflows
   - Error handling

4. **UI/UX Designer**
   - Queue visualization
   - Progress indication
   - User interaction patterns

### Scenario 2: Critical Bug Fix

**Task**: "Fix memory leak when processing large video files on Windows"

```typescript
const taskDescription = "Fix memory leak when processing large video files on Windows";
const recommendation = analyzeAndMatchTask(taskDescription);

// Expected Result:
// Primary: Bug Detective
// Supporting: Performance Engineer, Video Processing Expert
// Complexity: Medium
// Duration: 3-7 days
```

**Debugging Workflow**:

1. **Bug Detective (Lead)**
   - Root cause analysis
   - Reproduction scenarios
   - Cross-platform testing

2. **Performance Engineer**
   - Memory profiling
   - Leak detection
   - Optimization strategies

3. **Video Processing Expert**
   - FFmpeg configuration
   - Process management
   - Resource cleanup

### Scenario 3: UI/UX Enhancement

**Task**: "Redesign the results view with tabbed organization and better copy functionality"

```typescript
const taskDescription = "Redesign the results view with tabbed organization and better copy functionality";
const recommendation = analyzeAndMatchTask(taskDescription);

// Expected Result:
// Primary: UI/UX Designer
// Supporting: React TypeScript Architect
// Complexity: Medium
// Duration: 3-7 days
```

**Design Implementation**:

1. **UI/UX Designer (Lead)**
   - User research
   - Wireframing
   - Interaction design
   - Accessibility compliance

2. **React TypeScript Architect**
   - Component implementation
   - State management
   - Performance optimization

---

## 🎯 Component-Specific Examples

### PrerequisitesCheck Component

**Task**: "Improve prerequisites checking with better UX and auto-installation"

```typescript
const taskDescription = "Improve prerequisites checking with better UX and auto-installation";
const recommendation = analyzeAndMatchTask(taskDescription);

// Optimal Team: UI/UX Designer + Electron Integration Specialist
```

**Implementation Strategy**:

- **UI/UX Designer**: Progressive disclosure, human-friendly language
- **Electron Integration Specialist**: Auto-installation, system detection

### URLInput Component

**Task**: "Add real-time validation with platform-specific hints"

```typescript
const taskDescription = "Add real-time validation with platform-specific hints for URL input";
const recommendation = analyzeAndMatchTask(taskDescription);

// Optimal Team: React TypeScript Architect + UI/UX Designer
```

**Implementation Strategy**:

- **React TypeScript Architect**: Validation logic, state management
- **UI/UX Designer**: Visual feedback, error states, accessibility

### ResultsView Component

**Task**: "Optimize large text display performance and add export functionality"

```typescript
const taskDescription = "Optimize large text display performance and add export functionality";
const recommendation = analyzeAndMatchTask(taskDescription);

// Optimal Team: React TypeScript Architect + Performance Engineer
```

**Implementation Strategy**:

- **React TypeScript Architect**: Component architecture, export logic
- **Performance Engineer**: Memory optimization, rendering performance

---

## 🔧 Integration with Development Workflows

### Sprint Planning Integration

```typescript
// Automated task assignment for sprint planning
const sprintTasks = [
  "Fix cross-platform compatibility issues",
  "Add AI model selection interface",
  "Improve transcription progress UI",
  "Optimize application startup time"
];

const sprintAssignments = sprintTasks.map(task => ({
  task,
  recommendation: analyzeAndMatchTask(task),
  estimatedStoryPoints: calculateStoryPoints(task)
}));

// Generate sprint plan
console.log('Sprint Team Assignments:');
sprintAssignments.forEach(({ task, recommendation }) => {
  console.log(`${task}: ${recommendation.primaryPersona.name} (Lead)`);
  recommendation.supportingPersonas.forEach(persona => {
    console.log(`  - ${persona.name} (Support)`);
  });
});
```

### Code Review Specialist Selection

```typescript
// Automatically suggest code reviewers based on PR content
function suggestCodeReviewers(prDescription: string, changedFiles: string[]) {
  const recommendation = analyzeAndMatchTask(prDescription);
  
  const reviewers = [
    recommendation.primaryPersona,
    ...recommendation.supportingPersonas
  ];
  
  return reviewers.map(persona => ({
    name: persona.name,
    expertise: persona.coreCompetencies.technicalSkills.slice(0, 3),
    reason: getReviewReason(persona, prDescription)
  }));
}
```

### Bug Triage Automation

```typescript
// Automated bug triage and assignment
function triageBug(bugReport: string) {
  const recommendation = analyzeAndMatchTask(bugReport);
  
  return {
    priority: determinePriority(bugReport),
    assignee: recommendation.primaryPersona.name,
    supportingTeam: recommendation.supportingPersonas.map(p => p.name),
    estimatedFixTime: recommendation.estimatedDuration,
    requiredExpertise: recommendation.primaryPersona.coreCompetencies.technicalSkills
  };
}
```

---

## 📊 Performance Metrics & Analytics

### Team Effectiveness Tracking

```typescript
interface TeamMetrics {
  taskCompletionTime: number;
  codeQuality: number;
  bugRate: number;
  collaborationEfficiency: number;
}

function trackTeamPerformance(taskId: string, team: TeamRecommendation): TeamMetrics {
  // Implementation would track actual performance data
  return {
    taskCompletionTime: measureCompletionTime(taskId),
    codeQuality: calculateCodeQuality(taskId),
    bugRate: calculateBugRate(taskId),
    collaborationEfficiency: measureCollaboration(team)
  };
}
```

### Persona Matching Accuracy

```typescript
// Track accuracy of persona recommendations
function evaluateMatchingAccuracy() {
  const historicalData = loadHistoricalAssignments();
  let correctPredictions = 0;
  
  historicalData.forEach(assignment => {
    const predictedTeam = analyzeAndMatchTask(assignment.task);
    const actualTeam = assignment.actualTeam;
    
    if (isTeamMatch(predictedTeam, actualTeam)) {
      correctPredictions++;
    }
  });
  
  return correctPredictions / historicalData.length;
}
```

---

## 🛠️ Advanced Configuration

### Custom Persona Creation

```typescript
// Add project-specific personas
const customPersona: Persona = {
  id: 'warhammer-domain-expert',
  name: 'Warhammer Domain Expert',
  role: 'Specialist in Warhammer lore and content generation',
  coreCompetencies: {
    technicalSkills: ['Content generation', 'Domain knowledge', 'Lore accuracy'],
    architecturalThinking: ['Content structure', 'User context', 'Domain modeling']
  },
  taskSuitability: {
    idealTasks: ['Content generation', 'Domain validation', 'User guidance'],
    avoidTasks: ['System architecture', 'Performance optimization']
  },
  collaborationStyle: {
    worksBestWith: ['ai-integration-specialist', 'ui-ux-designer'],
    leadershipSituations: ['Content strategy', 'Domain decisions'],
    supportNeeds: ['Technical requirements', 'User feedback']
  },
  expertiseLevel: 8,
  availabilityScore: 6
};

// Add to persona database
PERSONA_DATABASE.push(customPersona);
```

### Custom Technology Keywords

```typescript
// Extend technology keywords for project-specific needs
const CUSTOM_TECHNOLOGY_KEYWORDS = {
  'warhammer': ['warhammer', 'lore', 'miniatures', 'games workshop'],
  'content': ['content', 'generation', 'writing', 'creative'],
  'domain': ['domain', 'expertise', 'specialized', 'knowledge']
};

// Merge with existing keywords
Object.assign(TECHNOLOGY_KEYWORDS, CUSTOM_TECHNOLOGY_KEYWORDS);
```

---

## 📱 IDE Integration Examples

### VS Code Extension Integration

```typescript
// VS Code extension for real-time persona suggestions
import * as vscode from 'vscode';

function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'persona-analyzer.analyzeTask',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.document.getText(editor.selection);
        const recommendation = analyzeAndMatchTask(selection);
        
        // Show recommendation in VS Code UI
        vscode.window.showInformationMessage(
          `Recommended Lead: ${recommendation.primaryPersona.name}`
        );
      }
    }
  );
  
  context.subscriptions.push(disposable);
}
```

### Git Hooks Integration

```bash
#!/bin/bash
# pre-commit hook for persona-based code review suggestions

COMMIT_MSG=$(git log -1 --pretty=%B)
RECOMMENDATION=$(node -e "
  const { analyzeAndMatchTask } = require('./persona-matching-utils');
  const result = analyzeAndMatchTask('$COMMIT_MSG');
  console.log(\`Suggested reviewers: \${result.primaryPersona.name}, \${result.supportingPersonas.map(p => p.name).join(', ')}\`);
")

echo "📋 $RECOMMENDATION"
```

---

## 🎓 Training & Onboarding

### New Team Member Onboarding

```typescript
// Generate personalized onboarding plans
function generateOnboardingPlan(newMemberPersona: string) {
  const persona = PERSONA_DATABASE.find(p => p.id === newMemberPersona);
  
  return {
    recommendedMentor: persona.collaborationStyle.worksBestWith[0],
    trainingModules: getTrainingModules(persona.coreCompetencies.technicalSkills),
    initialTasks: getStarterTasks(persona.taskSuitability.idealTasks),
    collaborationGuidelines: persona.collaborationStyle
  };
}
```

### Skill Development Tracking

```typescript
// Track skill development and growth opportunities
function identifySkillGaps(personaId: string, completedTasks: string[]) {
  const persona = PERSONA_DATABASE.find(p => p.id === personaId);
  const usedSkills = analyzeUsedSkills(completedTasks);
  const unusedSkills = persona.coreCompetencies.technicalSkills.filter(
    skill => !usedSkills.includes(skill)
  );
  
  return {
    strengths: usedSkills,
    developmentOpportunities: unusedSkills,
    recommendedNextTasks: getTasksForSkills(unusedSkills)
  };
}
```

---

## 🚨 Troubleshooting Common Issues

### Issue: No Suitable Persona Found

```typescript
// Handle cases where no good match is found
function handleNoMatch(taskDescription: string) {
  const taskAnalysis = TaskAnalyzer.analyzeTask(taskDescription);
  
  // Suggest creating a new persona or using a generalist
  if (taskAnalysis.complexityLevel === 'critical') {
    return {
      suggestion: 'Consider creating a specialized persona or using a team of specialists',
      fallbackTeam: ['react-typescript-architect', 'electron-integration-specialist']
    };
  }
  
  return {
    suggestion: 'Use a generalist persona with supporting specialists',
    fallbackTeam: ['react-typescript-architect']
  };
}
```

### Issue: Conflicting Recommendations

```typescript
// Resolve conflicts between multiple good matches
function resolveConflicts(recommendations: TeamRecommendation[]) {
  // Use additional criteria to break ties
  return recommendations.sort((a, b) => {
    // Prefer higher availability
    if (a.primaryPersona.availabilityScore !== b.primaryPersona.availabilityScore) {
      return b.primaryPersona.availabilityScore - a.primaryPersona.availabilityScore;
    }
    
    // Prefer higher expertise
    return b.primaryPersona.expertiseLevel - a.primaryPersona.expertiseLevel;
  })[0];
}
```

---

## 📈 Best Practices

### 1. Regular Updates

- **Monthly**: Review and update persona competencies
- **Quarterly**: Analyze task patterns and adjust matching algorithms
- **Annually**: Evaluate overall system effectiveness

### 2. Feedback Loops

```typescript
// Collect feedback on persona recommendations
function collectFeedback(taskId: string, recommendation: TeamRecommendation, feedback: {
  accuracy: number; // 1-10 scale
  effectiveness: number; // 1-10 scale
  comments: string;
}) {
  // Store feedback for continuous improvement
  saveFeedback(taskId, recommendation, feedback);
  
  // Update persona scores based on feedback
  updatePersonaScores(recommendation, feedback);
}
```

### 3. Documentation Maintenance

- Keep persona definitions up to date
- Document successful team compositions
- Share lessons learned and best practices

---

*Version 1.0 - January 2026*
*Last Updated: Usage examples for Focule Video Transcriber*

/**
 * Persona Matching Algorithm Utilities
 * Video Transcriber Project - Task Analysis & Team Composition System
 */

// Core persona definitions
export interface Persona {
  id: string;
  name: string;
  role: string;
  coreCompetencies: {
    technicalSkills: string[];
    architecturalThinking: string[];
  };
  taskSuitability: {
    idealTasks: string[];
    avoidTasks: string[];
  };
  collaborationStyle: {
    worksBestWith: string[];
    leadershipSituations: string[];
    supportNeeds: string[];
  };
  expertiseLevel: number; // 1-10 scale
  availabilityScore: number; // 1-10 scale
}

// Task analysis result
export interface TaskAnalysis {
  taskDescription: string;
  keywords: string[];
  primaryTechnologies: string[];
  complexityLevel: 'low' | 'medium' | 'high' | 'critical';
  collaborationNeeds: 'frontend-only' | 'backend-only' | 'full-stack' | 'cross-functional';
  expertiseRequirements: string[];
  estimatedDuration: string;
  riskLevel: 'low' | 'medium' | 'high';
}

// Team composition recommendation
export interface TeamRecommendation {
  primaryPersona: Persona;
  supportingPersonas: Persona[];
  leadershipRecommendation: string;
  collaborationPlan: string[];
  riskMitigation: string[];
  estimatedTeamSize: number;
  successFactors: string[];
}

// Persona database for video transcriber project
export const PERSONA_DATABASE: Persona[] = [
  {
    id: 'react-typescript-architect',
    name: 'React TypeScript Architect',
    role: 'Frontend component specialist with TypeScript expertise for desktop applications',
    coreCompetencies: {
      technicalSkills: [
        'React hooks and patterns mastery',
        'Advanced TypeScript type system',
        'State management for desktop apps',
        'Component lifecycle optimization',
        'Props interface design'
      ],
      architecturalThinking: [
        'Component composition patterns',
        'Electron renderer process architecture',
        'Reusability principles',
        'Performance considerations',
        'Testing strategies'
      ]
    },
    taskSuitability: {
      idealTasks: [
        'New React component creation',
        'Complex state management implementation',
        'TypeScript type system design',
        'Component library development',
        'Performance-critical UI features'
      ],
      avoidTasks: [
        'Electron main process development',
        'Native system integration',
        'FFmpeg/Audio processing',
        'Cross-platform packaging'
      ]
    },
    collaborationStyle: {
      worksBestWith: ['ui-ux-designer', 'electron-integration-specialist', 'testing-engineer'],
      leadershipSituations: ['Frontend architecture decisions', 'Component library standards'],
      supportNeeds: ['Design requirements', 'Electron APIs', 'User feedback']
    },
    expertiseLevel: 9,
    availabilityScore: 8
  },
  {
    id: 'electron-integration-specialist',
    name: 'Electron Integration Specialist',
    role: 'Electron desktop application expert with system integration focus',
    coreCompetencies: {
      technicalSkills: [
        'Electron main/renderer process architecture',
        'IPC (Inter-Process Communication)',
        'Native API integration',
        'Cross-platform compatibility',
        'Application packaging and distribution'
      ],
      architecturalThinking: [
        'Security best practices',
        'Performance optimization for desktop',
        'System resource management',
        'Auto-update mechanisms',
        'Error handling and logging'
      ]
    },
    taskSuitability: {
      idealTasks: [
        'Electron main process development',
        'IPC communication setup',
        'Native tool integration (FFmpeg, yt-dlp)',
        'Cross-platform build configuration',
        'Application security implementation'
      ],
      avoidTasks: [
        'UI component development',
        'Visual design implementation',
        'Complex business logic',
        'Database operations'
      ]
    },
    collaborationStyle: {
      worksBestWith: ['react-typescript-architect', 'video-processing-expert', 'bug-detective'],
      leadershipSituations: ['Electron architecture decisions', 'System integration strategy'],
      supportNeeds: ['Frontend requirements', 'System specifications', 'Security requirements']
    },
    expertiseLevel: 9,
    availabilityScore: 7
  },
  {
    id: 'ui-ux-designer',
    name: 'UI/UX Designer',
    role: 'User interface and experience specialist for desktop applications',
    coreCompetencies: {
      technicalSkills: [
        'Modern CSS and Tailwind CSS',
        'Desktop UI/UX patterns',
        'Design system development',
        'Accessibility compliance (WCAG)',
        'Animation and interaction design'
      ],
      architecturalThinking: [
        'Desktop application UX patterns',
        'Visual hierarchy and layout',
        'Interaction patterns and affordances',
        'Accessibility and inclusive design',
        'Performance impact of design choices'
      ]
    },
    taskSuitability: {
      idealTasks: [
        'UI component styling and theming',
        'Desktop layout implementation',
        'Design system creation',
        'Accessibility improvements',
        'User interaction optimization'
      ],
      avoidTasks: [
        'Electron main process development',
        'System integration',
        'Complex business logic',
        'Audio/video processing'
      ]
    },
    collaborationStyle: {
      worksBestWith: ['react-typescript-architect', 'accessibility-auditor', 'testing-engineer'],
      leadershipSituations: ['Design system decisions', 'UX strategy', 'Accessibility standards'],
      supportNeeds: ['Component requirements', 'User research', 'Brand guidelines']
    },
    expertiseLevel: 8,
    availabilityScore: 8
  },
  {
    id: 'video-processing-expert',
    name: 'Video Processing Expert',
    role: 'Audio/video processing and external tools integration specialist',
    coreCompetencies: {
      technicalSkills: [
        'FFmpeg command-line interface',
        'yt-dlp integration and configuration',
        'Audio format conversion',
        'Process management and monitoring',
        'Error handling for external tools'
      ],
      architecturalThinking: [
        'Workflow optimization',
        'Progress tracking implementation',
        'Error recovery strategies',
        'Resource management',
        'Cross-platform tool compatibility'
      ]
    },
    taskSuitability: {
      idealTasks: [
        'FFmpeg integration and optimization',
        'yt-dlp wrapper development',
        'Audio extraction workflows',
        'Progress tracking implementation',
        'External tool error handling'
      ],
      avoidTasks: [
        'UI component development',
        'React state management',
        'Visual design implementation',
        'Database operations'
      ]
    },
    collaborationStyle: {
      worksBestWith: ['electron-integration-specialist', 'performance-engineer', 'bug-detective'],
      leadershipSituations: ['Video processing architecture', 'Tool integration strategy'],
      supportNeeds: ['UI requirements', 'Performance constraints', 'Error handling specifications']
    },
    expertiseLevel: 8,
    availabilityScore: 6
  },
  {
    id: 'ai-integration-specialist',
    name: 'AI Integration Specialist',
    role: 'AI/ML integration expert with focus on local model deployment',
    coreCompetencies: {
      technicalSkills: [
        'Ollama API integration',
        'Whisper model configuration',
        'Local AI model management',
        'Async processing patterns',
        'Model performance optimization'
      ],
      architecturalThinking: [
        'Model selection and configuration',
        'Prompt engineering for content generation',
        'Error handling for AI services',
        'Performance optimization for AI workloads',
        'Resource management for local models'
      ]
    },
    taskSuitability: {
      idealTasks: [
        'Ollama integration and configuration',
        'Whisper transcription setup',
        'AI content generation workflows',
        'Model management interface',
        'AI service error handling'
      ],
      avoidTasks: [
        'UI component development',
        'System integration',
        'Visual design implementation',
        'Database operations'
      ]
    },
    collaborationStyle: {
      worksBestWith: ['react-typescript-architect', 'performance-engineer', 'documentation-writer'],
      leadershipSituations: ['AI architecture decisions', 'Model selection strategy'],
      supportNeeds: ['Frontend requirements', 'Performance constraints', 'Content specifications']
    },
    expertiseLevel: 7,
    availabilityScore: 7
  },
  {
    id: 'performance-engineer',
    name: 'Performance Engineer',
    role: 'Application performance optimization specialist for desktop applications',
    coreCompetencies: {
      technicalSkills: [
        'Performance profiling and analysis',
        'Memory management and leak detection',
        'Electron performance optimization',
        'React rendering optimization',
        'Network and file I/O optimization'
      ],
      architecturalThinking: [
        'Performance budgeting',
        'Measurement and monitoring',
        'Bottleneck identification',
        'Optimization prioritization',
        'User experience impact assessment'
      ]
    },
    taskSuitability: {
      idealTasks: [
        'Performance bottleneck resolution',
        'Memory leak investigation',
        'Rendering optimization',
        'File processing optimization',
        'Electron app performance tuning'
      ],
      avoidTasks: [
        'Feature development from scratch',
        'Visual design implementation',
        'Business logic development',
        'System integration'
      ]
    },
    collaborationStyle: {
      worksBestWith: ['react-typescript-architect', 'electron-integration-specialist', 'bug-detective'],
      leadershipSituations: ['Performance strategy', 'Optimization priorities', 'Performance budgets'],
      supportNeeds: ['Performance requirements', 'User expectations', 'Technical constraints']
    },
    expertiseLevel: 8,
    availabilityScore: 7
  },
  {
    id: 'bug-detective',
    name: 'Bug Detective',
    role: 'Systematic debugging and problem resolution expert for desktop applications',
    coreCompetencies: {
      technicalSkills: [
        'Advanced debugging techniques',
        'Electron debugging tools',
        'React DevTools mastery',
        'Cross-platform issue reproduction',
        'Fix validation and testing'
      ],
      architecturalThinking: [
        'Systematic problem decomposition',
        'Hypothesis formation and testing',
        'Pattern recognition in bugs',
        'Logical deduction and reasoning',
        'Documentation and knowledge transfer'
      ]
    },
    taskSuitability: {
      idealTasks: [
        'Complex bug investigation',
        'Cross-platform compatibility issues',
        'Electron-specific debugging',
        'Systematic troubleshooting',
        'Knowledge base development'
      ],
      avoidTasks: [
        'Feature development',
        'Architecture design',
        'Performance optimization',
        'Visual design work'
      ]
    },
    collaborationStyle: {
      worksBestWith: ['testing-engineer', 'code-reviewer', 'domain specialists'],
      leadershipSituations: ['Bug triage process', 'Debugging standards', 'Knowledge sharing'],
      supportNeeds: ['Bug reports and reproduction steps', 'System context', 'Technical documentation']
    },
    expertiseLevel: 9,
    availabilityScore: 8
  }
];

// Technology keyword mapping
export const TECHNOLOGY_KEYWORDS = {
  'react': ['react', 'tsx', 'jsx', 'component', 'hook', 'state', 'props'],
  'typescript': ['typescript', 'ts', 'type', 'interface', 'generic', 'typing'],
  'electron': ['electron', 'main', 'renderer', 'ipc', 'desktop', 'app'],
  'video': ['video', 'ffmpeg', 'yt-dlp', 'download', 'extract', 'transcode'],
  'audio': ['audio', 'whisper', 'transcription', 'speech', 'voice'],
  'ai': ['ai', 'ollama', 'llm', 'model', 'prompt', 'generation'],
  'ui': ['ui', 'ux', 'design', 'interface', 'layout', 'styling'],
  'performance': ['performance', 'optimization', 'memory', 'speed', 'efficiency'],
  'bug': ['bug', 'error', 'issue', 'crash', 'debug', 'fix'],
  'testing': ['test', 'testing', 'unit', 'integration', 'e2e']
};

// Task analysis engine
export class TaskAnalyzer {
  static analyzeTask(taskDescription: string): TaskAnalysis {
    const keywords = this.extractKeywords(taskDescription);
    const primaryTechnologies = this.identifyTechnologies(keywords);
    const complexityLevel = this.assessComplexity(taskDescription, keywords);
    const collaborationNeeds = this.determineCollaborationNeeds(primaryTechnologies);
    const expertiseRequirements = this.identifyExpertiseRequirements(keywords);
    const estimatedDuration = this.estimateDuration(complexityLevel);
    const riskLevel = this.assessRisk(taskDescription, complexityLevel);

    return {
      taskDescription,
      keywords,
      primaryTechnologies,
      complexityLevel,
      collaborationNeeds,
      expertiseRequirements,
      estimatedDuration,
      riskLevel
    };
  }

  private static extractKeywords(description: string): string[] {
    const words = description.toLowerCase().split(/\s+/);
    const keywords: string[] = [];
    
    for (const [tech, techKeywords] of Object.entries(TECHNOLOGY_KEYWORDS)) {
      for (const keyword of techKeywords) {
        if (words.some(word => word.includes(keyword))) {
          keywords.push(tech);
          break;
        }
      }
    }
    
    return [...new Set(keywords)];
  }

  private static identifyTechnologies(keywords: string[]): string[] {
    return keywords.filter(keyword => 
      ['react', 'typescript', 'electron', 'video', 'audio', 'ai', 'ui'].includes(keyword)
    );
  }

  private static assessComplexity(description: string, keywords: string[]): 'low' | 'medium' | 'high' | 'critical' {
    const complexityIndicators = {
      low: ['simple', 'small', 'minor', 'quick', 'basic'],
      medium: ['update', 'improve', 'enhance', 'modify', 'refactor'],
      high: ['new', 'create', 'implement', 'build', 'develop', 'integrate'],
      critical: ['architecture', 'migration', 'rewrite', 'system', 'platform']
    };

    const desc = description.toLowerCase();
    
    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      if (indicators.some(indicator => desc.includes(indicator))) {
        return level as 'low' | 'medium' | 'high' | 'critical';
      }
    }

    // Default based on keyword count
    if (keywords.length <= 2) return 'low';
    if (keywords.length <= 4) return 'medium';
    if (keywords.length <= 6) return 'high';
    return 'critical';
  }

  private static determineCollaborationNeeds(technologies: string[]): 'frontend-only' | 'backend-only' | 'full-stack' | 'cross-functional' {
    const frontendTech = ['react', 'typescript', 'ui'];
    const backendTech = ['electron', 'video', 'audio', 'ai'];
    
    const hasFrontend = technologies.some(tech => frontendTech.includes(tech));
    const hasBackend = technologies.some(tech => backendTech.includes(tech));
    
    if (hasFrontend && hasBackend) return 'full-stack';
    if (hasFrontend) return 'frontend-only';
    if (hasBackend) return 'backend-only';
    return 'cross-functional';
  }

  private static identifyExpertiseRequirements(keywords: string[]): string[] {
    const requirements: string[] = [];
    
    if (keywords.includes('react')) requirements.push('React development');
    if (keywords.includes('typescript')) requirements.push('TypeScript expertise');
    if (keywords.includes('electron')) requirements.push('Electron architecture');
    if (keywords.includes('video')) requirements.push('Video processing');
    if (keywords.includes('audio')) requirements.push('Audio processing');
    if (keywords.includes('ai')) requirements.push('AI integration');
    if (keywords.includes('ui')) requirements.push('UI/UX design');
    if (keywords.includes('performance')) requirements.push('Performance optimization');
    if (keywords.includes('bug')) requirements.push('Debugging expertise');
    if (keywords.includes('testing')) requirements.push('Testing strategy');
    
    return requirements;
  }

  private static estimateDuration(complexity: 'low' | 'medium' | 'high' | 'critical'): string {
    const durations = {
      low: '1-3 days',
      medium: '3-7 days',
      high: '1-2 weeks',
      critical: '2-4 weeks'
    };
    return durations[complexity];
  }

  private static assessRisk(description: string, complexity: 'low' | 'medium' | 'high' | 'critical'): 'low' | 'medium' | 'high' {
    const riskIndicators = ['critical', 'production', 'security', 'performance', 'migration'];
    const desc = description.toLowerCase();
    
    if (riskIndicators.some(indicator => desc.includes(indicator))) return 'high';
    if (complexity === 'critical') return 'high';
    if (complexity === 'high') return 'medium';
    return 'low';
  }
}

// Persona matching engine
export class PersonaMatcher {
  static findBestMatch(taskAnalysis: TaskAnalysis): TeamRecommendation {
    const scoredPersonas = this.scorePersonas(taskAnalysis);
    const sortedPersonas = scoredPersonas.sort((a, b) => b.score - a.score);
    
    const primaryPersona = sortedPersonas[0].persona;
    const supportingPersonas = this.selectSupportingTeam(primaryPersona, sortedPersonas.slice(1), taskAnalysis);
    
    return {
      primaryPersona,
      supportingPersonas,
      leadershipRecommendation: this.determineLeadership(primaryPersona, taskAnalysis),
      collaborationPlan: this.createCollaborationPlan(primaryPersona, supportingPersonas, taskAnalysis),
      riskMitigation: this.identifyRisks(primaryPersona, supportingPersonas, taskAnalysis),
      estimatedTeamSize: 1 + supportingPersonas.length,
      successFactors: this.identifySuccessFactors(primaryPersona, supportingPersonas, taskAnalysis)
    };
  }

  private static scorePersonas(taskAnalysis: TaskAnalysis): Array<{ persona: Persona; score: number }> {
    return PERSONA_DATABASE.map(persona => ({
      persona,
      score: this.calculatePersonaScore(persona, taskAnalysis)
    }));
  }

  private static calculatePersonaScore(persona: Persona, taskAnalysis: TaskAnalysis): number {
    let score = 0;
    
    // Core competency alignment (40% weight)
    score += this.calculateCompetencyScore(persona, taskAnalysis) * 0.4;
    
    // Task type specialization (25% weight)
    score += this.calculateSpecializationScore(persona, taskAnalysis) * 0.25;
    
    // Collaboration compatibility (20% weight)
    score += this.calculateCollaborationScore(persona, taskAnalysis) * 0.2;
    
    // Availability and workload (15% weight)
    score += (persona.availabilityScore / 10) * 0.15;
    
    return score;
  }

  private static calculateCompetencyScore(persona: Persona, taskAnalysis: TaskAnalysis): number {
    const allSkills = [...persona.coreCompetencies.technicalSkills, ...persona.coreCompetencies.architecturalThinking];
    const matchingSkills = allSkills.filter(skill => 
      taskAnalysis.expertiseRequirements.some(requirement => 
        skill.toLowerCase().includes(requirement.toLowerCase()) || 
        requirement.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    return matchingSkills.length / Math.max(allSkills.length, 1);
  }

  private static calculateSpecializationScore(persona: Persona, taskAnalysis: TaskAnalysis): number {
    const idealTaskMatches = persona.taskSuitability.idealTasks.filter(task =>
      taskAnalysis.keywords.some(keyword => 
        task.toLowerCase().includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(task.toLowerCase())
      )
    );
    
    const avoidTaskMatches = persona.taskSuitability.avoidTasks.filter(task =>
      taskAnalysis.keywords.some(keyword => 
        task.toLowerCase().includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(task.toLowerCase())
      )
    );
    
    const baseScore = idealTaskMatches.length / Math.max(persona.taskSuitability.idealTasks.length, 1);
    const penalty = avoidTaskMatches.length * 0.5;
    
    return Math.max(0, baseScore - penalty);
  }

  private static calculateCollaborationScore(persona: Persona, taskAnalysis: TaskAnalysis): number {
    // This would be enhanced with actual team dynamics data
    return persona.collaborationStyle.worksBestWith.length / 10;
  }

  private static selectSupportingTeam(primary: Persona, candidates: Array<{ persona: Persona; score: number }>, taskAnalysis: TaskAnalysis): Persona[] {
    const supporting: Persona[] = [];
    const maxTeamSize = this.getOptimalTeamSize(taskAnalysis.complexityLevel) - 1;
    
    // Select based on complementary skills
    for (const candidate of candidates.slice(0, maxTeamSize * 2)) {
      if (supporting.length >= maxTeamSize) break;
      
      const isComplementary = this.isComplementary(primary, candidate.persona, taskAnalysis);
      if (isComplementary) {
        supporting.push(candidate.persona);
      }
    }
    
    return supporting;
  }

  private static getOptimalTeamSize(complexity: 'low' | 'medium' | 'high' | 'critical'): number {
    const sizes = { low: 1, medium: 2, high: 3, critical: 4 };
    return sizes[complexity];
  }

  private static isComplementary(primary: Persona, candidate: Persona, taskAnalysis: TaskAnalysis): boolean {
    // Check if candidate has skills that complement the primary persona
    const primarySkills = new Set([...primary.coreCompetencies.technicalSkills, ...primary.coreCompetencies.architecturalThinking]);
    const candidateSkills = new Set([...candidate.coreCompetencies.technicalSkills, ...candidate.coreCompetencies.architecturalThinking]);
    
    // Check for collaboration compatibility
    const worksWellTogether = primary.collaborationStyle.worksBestWith.includes(candidate.id) ||
                             candidate.collaborationStyle.worksBestWith.includes(primary.id);
    
    return worksWellTogether;
  }

  private static determineLeadership(primary: Persona, taskAnalysis: TaskAnalysis): string {
    if (taskAnalysis.complexityLevel === 'critical') {
      return `${primary.name} should lead with support from ${primary.collaborationStyle.worksBestWith.join(' and ')}`;
    }
    return `${primary.name} is recommended as the primary lead for this task`;
  }

  private static createCollaborationPlan(primary: Persona, supporting: Persona[], taskAnalysis: TaskAnalysis): string[] {
    const plan: string[] = [];
    
    plan.push(`${primary.name} leads the ${taskAnalysis.collaborationNeeds} aspects`);
    
    supporting.forEach(supporter => {
      plan.push(`${supporter.name} provides specialized support in ${supporter.coreCompetencies.technicalSkills.slice(0, 2).join(' and ')}`);
    });
    
    if (taskAnalysis.riskLevel === 'high') {
      plan.push('Daily check-ins recommended due to high risk level');
    }
    
    return plan;
  }

  private static identifyRisks(primary: Persona, supporting: Persona[], taskAnalysis: TaskAnalysis): string[] {
    const risks: string[] = [];
    
    if (taskAnalysis.complexityLevel === 'critical' && supporting.length < 2) {
      risks.push('Critical complexity with limited team size');
    }
    
    if (primary.availabilityScore < 5) {
      risks.push('Primary persona has limited availability');
    }
    
    if (taskAnalysis.riskLevel === 'high') {
      risks.push('High-risk task requires additional oversight');
    }
    
    return risks;
  }

  private static identifySuccessFactors(primary: Persona, supporting: Persona[], taskAnalysis: TaskAnalysis): string[] {
    const factors: string[] = [];
    
    factors.push(`Strong ${primary.name} expertise in core requirements`);
    factors.push(`Complementary skills from supporting team members`);
    
    if (taskAnalysis.collaborationNeeds === 'full-stack') {
      factors.push('Full-stack capability ensures complete solution coverage');
    }
    
    if (supporting.some(s => s.id === 'performance-engineer')) {
      factors.push('Performance optimization built into the solution');
    }
    
    return factors;
  }
}

// Main matching function
export function analyzeAndMatchTask(taskDescription: string): TeamRecommendation {
  const taskAnalysis = TaskAnalyzer.analyzeTask(taskDescription);
  return PersonaMatcher.findBestMatch(taskAnalysis);
}

// Example usage and testing
export const EXAMPLE_TASKS = [
  'Create a new React component for video progress display with TypeScript',
  'Fix memory leak when processing large video files in Electron',
  'Implement Ollama AI integration for content generation',
  'Design and implement a responsive settings panel UI',
  'Optimize FFmpeg video processing performance',
  'Debug cross-platform compatibility issues on Windows and macOS'
];

# Persona Index System - Video Transcriber Project

**Development Team Architecture & Human Capital Mapping System**

---

## 🎯 Project Context

**Focule** - A desktop application built with Electron + React + TypeScript that:
- Downloads videos from YouTube/Twitch using yt-dlp
- Transcribes audio using OpenAI Whisper (local)
- Generates social media content using Ollama LLM
- Exports transcripts and AI-generated content

**Tech Stack**: React 18, TypeScript, Electron 28, Tailwind CSS, Vite

---

## 📋 Task Type Categorization

### 1. Building New Features
**Description**: Creating new functionality from scratch

**Primary Personas**:
- `react-typescript-architect`
- `electron-integration-specialist` 
- `ui-ux-designer`

**Collaboration Patterns**:
- **Frontend-heavy**: architect + designer
- **Desktop-app**: architect + integration specialist
- **Full-stack**: all three with clear boundaries

### 2. Fixing Problems
**Description**: Resolving issues and bugs in desktop application

**Primary Personas**:
- `bug-detective`
- `performance-engineer`
- `electron-debug-specialist`

**Collaboration Patterns**:
- **Systematic debugging**: bug-detective lead
- **Performance issues**: performance-engineer lead
- **Electron-specific**: integration specialist + bug-detective

### 3. Improving Code
**Description**: Enhancing existing codebase quality

**Primary Personas**:
- `refactoring-specialist`
- `testing-engineer`
- `code-reviewer`

**Collaboration Patterns**:
- **Quality improvement**: reviewer + specialist
- **Test coverage**: testing-engineer with domain expert
- **Architecture cleanup**: refactoring-specialist lead

### 4. Domain Understanding
**Description**: Context and knowledge development for video/AI domain

**Primary Personas**:
- `video-processing-expert`
- `ai-integration-specialist`
- `documentation-writer`

**Collaboration Patterns**:
- **Knowledge transfer**: domain expert + writer
- **Technical documentation**: writer with specialist
- **AI/ML integration**: AI specialist with architect

---

## 🏗️ Component Type Specialization

### Video Processing Components
**Optimal Team**: [`electron-integration-specialist`, `video-processing-expert`]
**Expertise Focus**: 
- FFmpeg integration
- yt-dlp wrapper implementation
- Audio extraction workflows
**Success Factors**: 
- Robust error handling
- Progress tracking
- Cross-platform compatibility

### Transcription Interface
**Optimal Team**: [`react-typescript-architect`, `ui-ux-designer`]
**Expertise Focus**:
- Real-time progress display
- File upload/download UI
- Settings management
**Success Factors**:
- Clear progress indication
- Intuitive file management
- Responsive design

### AI Content Generation
**Optimal Team**: [`ai-integration-specialist`, `react-typescript-architect`]
**Expertise Focus**:
- Ollama API integration
- Content display components
- Model selection interface
**Success Factors**:
- Async handling
- Error recovery
- Model compatibility

### Settings & Configuration
**Optimal Team**: [`ui-ux-designer`, `electron-integration-specialist`]
**Expertise Focus**:
- Prerequisites checking
- Path configuration
- Model selection UI
**Success Factors**:
- Clear validation feedback
- Cross-platform paths
- User-friendly setup

### Export & Results Display
**Optimal Team**: [`react-typescript-architect`, `performance-engineer`]
**Expertise Focus**:
- Large text display
- Copy-to-clipboard functionality
- File export workflows
**Success Factors**:
- Performance optimization
- Memory efficiency
- User-friendly export

---

## 👥 Persona Specifications

### react-typescript-architect
**Role Definition**: Frontend component specialist with TypeScript expertise for desktop applications

**Core Competencies**:
- **Technical Skills**:
  - React hooks and patterns mastery
  - Advanced TypeScript type system
  - State management for desktop apps
  - Component lifecycle optimization
  - Props interface design
- **Architectural Thinking**:
  - Component composition patterns
  - Electron renderer process architecture
  - Reusability principles
  - Performance considerations
  - Testing strategies

**Task Suitability**:
- **Ideal Tasks**:
  - New React component creation
  - Complex state management implementation
  - TypeScript type system design
  - Component library development
  - Performance-critical UI features
- **Avoid Tasks**:
  - Electron main process development
  - Native system integration
  - FFmpeg/Audio processing
  - Cross-platform packaging

**Collaboration Style**:
- **Works Best With**: ui-ux-designer, electron-integration-specialist, testing-engineer
- **Leadership Situations**: Frontend architecture decisions, Component library standards
- **Support Needs**: Design requirements, Electron APIs, User feedback

### electron-integration-specialist
**Role Definition**: Electron desktop application expert with system integration focus

**Core Competencies**:
- **Technical Skills**:
  - Electron main/renderer process architecture
  - IPC (Inter-Process Communication)
  - Native API integration
  - Cross-platform compatibility
  - Application packaging and distribution
- **Integration Thinking**:
  - Security best practices
  - Performance optimization for desktop
  - System resource management
  - Auto-update mechanisms
  - Error handling and logging

**Task Suitability**:
- **Ideal Tasks**:
  - Electron main process development
  - IPC communication setup
  - Native tool integration (FFmpeg, yt-dlp)
  - Cross-platform build configuration
  - Application security implementation
- **Avoid Tasks**:
  - UI component development
  - Visual design implementation
  - Complex business logic
  - Database operations

**Collaboration Style**:
- **Works Best With**: react-typescript-architect, video-processing-expert, bug-detective
- **Leadership Situations**: Electron architecture decisions, System integration strategy
- **Support Needs**: Frontend requirements, System specifications, Security requirements

### ui-ux-designer
**Role Definition**: User interface and experience specialist for desktop applications

**Core Competencies**:
- **Technical Skills**:
  - Modern CSS and Tailwind CSS
  - Desktop UI/UX patterns
  - Design system development
  - Accessibility compliance (WCAG)
  - Animation and interaction design
- **Design Thinking**:
  - Desktop application UX patterns
  - Visual hierarchy and layout
  - Interaction patterns and affordances
  - Accessibility and inclusive design
  - Performance impact of design choices

**Task Suitability**:
- **Ideal Tasks**:
  - UI component styling and theming
  - Desktop layout implementation
  - Design system creation
  - Accessibility improvements
  - User interaction optimization
- **Avoid Tasks**:
  - Electron main process development
  - System integration
  - Complex business logic
  - Audio/video processing

**Collaboration Style**:
- **Works Best With**: react-typescript-architect, accessibility-auditor, testing-engineer
- **Leadership Situations**: Design system decisions, UX strategy, Accessibility standards
- **Support Needs**: Component requirements, User research, Brand guidelines

### video-processing-expert
**Role Definition**: Audio/video processing and external tools integration specialist

**Core Competencies**:
- **Technical Skills**:
  - FFmpeg command-line interface
  - yt-dlp integration and configuration
  - Audio format conversion
  - Process management and monitoring
  - Error handling for external tools
- **Processing Thinking**:
  - Workflow optimization
  - Progress tracking implementation
  - Error recovery strategies
  - Resource management
  - Cross-platform tool compatibility

**Task Suitability**:
- **Ideal Tasks**:
  - FFmpeg integration and optimization
  - yt-dlp wrapper development
  - Audio extraction workflows
  - Progress tracking implementation
  - External tool error handling
- **Avoid Tasks**:
  - UI component development
  - React state management
  - Visual design implementation
  - Database operations

**Collaboration Style**:
- **Works Best With**: electron-integration-specialist, performance-engineer, bug-detective
- **Leadership Situations**: Video processing architecture, Tool integration strategy
- **Support Needs**: UI requirements, Performance constraints, Error handling specifications

### ai-integration-specialist
**Role Definition**: AI/ML integration expert with focus on local model deployment

**Core Competencies**:
- **Technical Skills**:
  - Ollama API integration
  - Whisper model configuration
  - Local AI model management
  - Async processing patterns
  - Model performance optimization
- **AI Thinking**:
  - Model selection and configuration
  - Prompt engineering for content generation
  - Error handling for AI services
  - Performance optimization for AI workloads
  - Resource management for local models

**Task Suitability**:
- **Ideal Tasks**:
  - Ollama integration and configuration
  - Whisper transcription setup
  - AI content generation workflows
  - Model management interface
  - AI service error handling
- **Avoid Tasks**:
  - UI component development
  - System integration
  - Visual design implementation
  - Database operations

**Collaboration Style**:
- **Works Best With**: react-typescript-architect, performance-engineer, documentation-writer
- **Leadership Situations**: AI architecture decisions, Model selection strategy
- **Support Needs**: Frontend requirements, Performance constraints, Content specifications

### performance-engineer
**Role Definition**: Application performance optimization specialist for desktop applications

**Core Competencies**:
- **Technical Skills**:
  - Performance profiling and analysis
  - Memory management and leak detection
  - Electron performance optimization
  - React rendering optimization
  - Network and file I/O optimization
- **Optimization Thinking**:
  - Performance budgeting
  - Measurement and monitoring
  - Bottleneck identification
  - Optimization prioritization
  - User experience impact assessment

**Task Suitability**:
- **Ideal Tasks**:
  - Performance bottleneck resolution
  - Memory leak investigation
  - Rendering optimization
  - File processing optimization
  - Electron app performance tuning
- **Avoid Tasks**:
  - Feature development from scratch
  - Visual design implementation
  - Business logic development
  - System integration

**Collaboration Style**:
- **Works Best With**: react-typescript-architect, electron-integration-specialist, bug-detective
- **Leadership Situations**: Performance strategy, Optimization priorities, Performance budgets
- **Support Needs**: Performance requirements, User expectations, Technical constraints

### bug-detective
**Role Definition**: Systematic debugging and problem resolution expert for desktop applications

**Core Competencies**:
- **Technical Skills**:
  - Advanced debugging techniques
  - Electron debugging tools
  - React DevTools mastery
  - Cross-platform issue reproduction
  - Fix validation and testing
- **Analytical Thinking**:
  - Systematic problem decomposition
  - Hypothesis formation and testing
  - Pattern recognition in bugs
  - Logical deduction and reasoning
  - Documentation and knowledge transfer

**Task Suitability**:
- **Ideal Tasks**:
  - Complex bug investigation
  - Cross-platform compatibility issues
  - Electron-specific debugging
  - Systematic troubleshooting
  - Knowledge base development
- **Avoid Tasks**:
  - Feature development
  - Architecture design
  - Performance optimization
  - Visual design work

**Collaboration Style**:
- **Works Best With**: testing-engineer, code-reviewer, domain specialists
- **Leadership Situations**: Bug triage process, Debugging standards, Knowledge sharing
- **Support Needs**: Bug reports and reproduction steps, System context, Technical documentation

---

## 🎯 Task Analysis & Matching Algorithm

### Task Analysis Process
1. **Parse task description** for technical keywords
2. **Identify primary technology requirements** (React, Electron, AI, Video)
3. **Assess complexity and scope factors** (single component vs system-wide)
4. **Determine collaboration needs** (frontend-only vs full-stack)
5. **Evaluate expertise requirements** (specialized vs general)

### Persona Selection Criteria
- **Core competency alignment** (40% weight)
- **Task type specialization** (25% weight)
- **Collaboration compatibility** (20% weight)
- **Availability and workload** (15% weight)

### Team Composition Rules
- **Avoid single-person teams** for complex tasks
- **Ensure complementary skill coverage**
- **Define clear leadership responsibilities**
- **Plan communication and coordination**
- **Consider skill development opportunities**

---

## 🔄 Workflow Integration

### Development Workflow Integration
- **Sprint planning task assignment**
- **Code review specialist selection**
- **Bug triage and routing**
- **Knowledge sharing session planning**

### Tool Integration Points
- **IDE plugin for real-time persona suggestions**
- **Project management tool automation**
- **Documentation system cross-referencing**
- **Learning and development tracking**

---

## 📊 Success Metrics

### Accuracy Metrics
- **Persona-task matching accuracy** (>90%)
- **Team composition effectiveness** (>85% satisfaction)
- **Task completion time improvement** (>20% faster)

### Quality Metrics
- **Code quality improvement** (fewer bugs)
- **Knowledge transfer effectiveness** (skill development)
- **Collaboration efficiency** (communication overhead reduction)

---

## 📚 Usage Examples

### Example 1: New Feature - "Batch Video Processing"
**Task Analysis**:
- Keywords: "batch", "multiple videos", "queue"
- Technologies: React, Electron, FFmpeg
- Complexity: High (multiple components, state management)
- Collaboration: Full-stack required

**Recommended Team**:
- **Lead**: `electron-integration-specialist` (queue management)
- **Frontend**: `react-typescript-architect` (UI components)
- **Processing**: `video-processing-expert` (FFmpeg optimization)
- **UX**: `ui-ux-designer` (progress indication)

### Example 2: Bug Fix - "Memory Leak on Large Files"
**Task Analysis**:
- Keywords: "memory leak", "large files", "crash"
- Technologies: Electron, React, file processing
- Complexity: Medium (specific issue)
- Collaboration: Debugging focused

**Recommended Team**:
- **Lead**: `bug-detective` (root cause analysis)
- **Support**: `performance-engineer` (memory optimization)
- **Validation**: `testing-engineer` (regression testing)

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation
- [ ] Create persona database
- [ ] Develop task analysis algorithm
- [ ] Build matching engine
- [ ] Create team composition rules

### Phase 2: Integration
- [ ] IDE plugin development
- [ ] Project management tool integration
- [ ] Documentation system linking
- [ ] Feedback collection system

### Phase 3: Optimization
- [ ] Machine learning for matching improvement
- [ ] Performance analytics
- [ ] Continuous improvement loop
- [ ] Knowledge base expansion

---

## 📖 Documentation & Maintenance

### Regular Updates
- **Monthly**: Persona skill updates
- **Quarterly**: Task pattern analysis
- **Bi-annually**: Team composition review
- **Annually**: System architecture evaluation

### Knowledge Management
- **Decision logging**: Track persona assignment rationale
- **Success metrics**: Measure team effectiveness
- **Lessons learned**: Document best practices
- **Skill development**: Track growth opportunities

---

*Version 1.0 - January 2026*
*Last Updated: Project-specific for Focule Video Transcriber*

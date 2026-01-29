#!/usr/bin/env node

/**
 * Persona Index System Demo
 * Video Transcriber Project - Interactive Demo
 */

import { analyzeAndMatchTask, EXAMPLE_TASKS, PERSONA_DATABASE } from './persona-matching-utils';

/**
 * Demo function to showcase persona matching capabilities
 */
function runDemo() {
  console.log('🎯 Persona Index System Demo - Video Transcriber Project');
  console.log('=' .repeat(60));
  console.log();

  // Display available personas
  console.log('👥 Available Personas:');
  PERSONA_DATABASE.forEach((persona, index) => {
    console.log(`${index + 1}. ${persona.name}`);
    console.log(`   Role: ${persona.role}`);
    console.log(`   Expertise Level: ${persona.expertiseLevel}/10`);
    console.log(`   Availability: ${persona.availabilityScore}/10`);
    console.log();
  });

  console.log('🔍 Analyzing Example Tasks:');
  console.log('-'.repeat(40));

  // Analyze each example task
  EXAMPLE_TASKS.forEach((task, index) => {
    console.log(`\n${index + 1}. Task: "${task}"`);
    console.log('-'.repeat(50));

    const recommendation = analyzeAndMatchTask(task);

    console.log(`📋 Analysis Results:`);
    console.log(`   Primary Persona: ${recommendation.primaryPersona.name}`);
    console.log(`   Team Size: ${recommendation.estimatedTeamSize} people`);
    
    if (recommendation.supportingPersonas.length > 0) {
      console.log(`   Supporting Team:`);
      recommendation.supportingPersonas.forEach((persona, i) => {
        console.log(`     ${i + 1}. ${persona.name}`);
      });
    }

    console.log(`\n🎯 Leadership Recommendation:`);
    console.log(`   ${recommendation.leadershipRecommendation}`);

    console.log(`\n🤝 Collaboration Plan:`);
    recommendation.collaborationPlan.forEach((plan, i) => {
      console.log(`   ${i + 1}. ${plan}`);
    });

    if (recommendation.riskMitigation.length > 0) {
      console.log(`\n⚠️  Risk Mitigation:`);
      recommendation.riskMitigation.forEach((risk, i) => {
        console.log(`   ${i + 1}. ${risk}`);
      });
    }

    console.log(`\n✅ Success Factors:`);
    recommendation.successFactors.forEach((factor, i) => {
      console.log(`   ${i + 1}. ${factor}`);
    });

    console.log('\n' + '='.repeat(60));
  });

  // Interactive mode
  console.log('\n🎮 Interactive Mode - Enter your own task description:');
  console.log('Type "exit" to quit\n');

  // For demo purposes, show how to use interactively
  const interactiveExample = "Create a new settings panel with dark mode support";
  console.log(`Example input: "${interactiveExample}"`);
  
  const customRecommendation = analyzeAndMatchTask(interactiveExample);
  console.log(`\n🎯 Recommended Team:`);
  console.log(`   Lead: ${customRecommendation.primaryPersona.name}`);
  customRecommendation.supportingPersonas.forEach((persona, i) => {
    console.log(`   Support ${i + 1}: ${persona.name}`);
  });
}

/**
 * Component-specific analysis demo
 */
function componentAnalysisDemo() {
  console.log('\n🏗️  Component-Specific Analysis:');
  console.log('=' .repeat(40));

  const componentTasks = [
    {
      component: 'PrerequisitesCheck',
      task: 'Improve prerequisites checking with auto-installation and better UX'
    },
    {
      component: 'URLInput',
      task: 'Add real-time validation with platform-specific hints and paste functionality'
    },
    {
      component: 'ResultsView',
      task: 'Optimize large text display performance and add tabbed organization'
    },
    {
      component: 'SettingsPanel',
      task: 'Add model selection interface and cross-platform path configuration'
    }
  ];

  componentTasks.forEach(({ component, task }) => {
    console.log(`\n📦 Component: ${component}`);
    console.log(`📝 Task: ${task}`);
    
    const recommendation = analyzeAndMatchTask(task);
    const taskAnalysis = require('./persona-matching-utils').TaskAnalyzer.analyzeTask(task);
    
    console.log(`👥 Optimal Team:`);
    console.log(`   Lead: ${recommendation.primaryPersona.name}`);
    recommendation.supportingPersonas.forEach((persona, i) => {
      console.log(`   ${i + 1}. ${persona.name}`);
    });
    
    console.log(`⏱️  Estimated Duration: ${taskAnalysis.estimatedDuration}`);
    console.log(`🎯 Focus: ${recommendation.primaryPersona.coreCompetencies.technicalSkills.slice(0, 2).join(', ')}`);
  });
}

/**
 * Performance metrics demo
 */
function performanceMetricsDemo() {
  console.log('\n📊 Performance Metrics Demo:');
  console.log('=' .repeat(40));

  // Simulate performance tracking
  const metrics = {
    totalTasksAnalyzed: EXAMPLE_TASKS.length,
    averageTeamSize: 2.3,
    mostCommonPersona: 'React TypeScript Architect',
    averageComplexity: 'Medium',
    successRate: '92%'
  };

  console.log(`📈 System Performance:`);
  console.log(`   Total Tasks Analyzed: ${metrics.totalTasksAnalyzed}`);
  console.log(`   Average Team Size: ${metrics.averageTeamSize} people`);
  console.log(`   Most Common Lead Persona: ${metrics.mostCommonPersona}`);
  console.log(`   Average Complexity: ${metrics.averageComplexity}`);
  console.log(`   Predicted Success Rate: ${metrics.successRate}`);

  console.log('\n🎯 Persona Utilization:');
  const personaUsage = new Map<string, number>();
  
  EXAMPLE_TASKS.forEach(task => {
    const recommendation = analyzeAndMatchTask(task);
    const leadName = recommendation.primaryPersona.name;
    personaUsage.set(leadName, (personaUsage.get(leadName) || 0) + 1);
  });

  personaUsage.forEach((count, persona) => {
    const percentage = ((count / EXAMPLE_TASKS.length) * 100).toFixed(1);
    console.log(`   ${persona}: ${count} tasks (${percentage}%)`);
  });
}

/**
 * Main execution function
 */
function main() {
  try {
    runDemo();
    componentAnalysisDemo();
    performanceMetricsDemo();
    
    console.log('\n🎉 Demo completed successfully!');
    console.log('💡 To use this system in your project:');
    console.log('   1. Import { analyzeAndMatchTask } from "./persona-matching-utils"');
    console.log('   2. Call analyzeAndMatchTask(taskDescription)');
    console.log('   3. Use the returned TeamRecommendation for team composition');
    console.log('\n📚 For more examples, see persona-usage-examples.md');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  main();
}

export { runDemo, componentAnalysisDemo, performanceMetricsDemo };

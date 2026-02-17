import { useState, useCallback } from 'react';
import { logger } from '../utils/logger';
import { ErrorHandler } from '../utils/errors';

interface MarketingContent {
  title: string;
  description: string;
  hashtags: string[];
  hooks: string[];
  callToAction: string;
  targetAudience: string;
  contentType: 'trailer' | 'highlights' | 'analysis' | 'reaction';
  gameSpecific: {
    game: string;
    event: string;
    teams?: string[];
    players?: string[];
    moments: string[];
  };
}

interface MarketingContentGeneratorProps {
  transcript: string;
  videoTitle: string;
  onContentGenerated?: (content: MarketingContent[]) => void;
}

export function MarketingContentGenerator({ 
  transcript, 
  videoTitle, 
  onContentGenerated 
}: MarketingContentGeneratorProps): JSX.Element {
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentType, setContentType] = useState<'trailer' | 'highlights' | 'analysis' | 'reaction'>('highlights');
  const [generatedContent, setGeneratedContent] = useState<MarketingContent[]>([]);
  const [selectedGame, setSelectedGame] = useState('league-of-legends');

  const gameTemplates = {
    'league-of-legends': {
      name: 'League of Legends',
      events: ['Worlds Championship', 'MSI', 'LCS', 'LEC', 'LCK', 'LPL'],
      hashtags: ['#LoL', '#LeagueOfLegends', '#Worlds2024', '#Esports', '#Gaming'],
      moments: ['Pentakill', 'Baron Steal', 'Dragon Soul', 'Inhibitor Take', 'Clutch Play'],
      callToActions: [
        'Watch the full VOD now! 🎮',
        'Don\'t miss the next match! 🔥',
        'Subscribe for more LoL content! ⚡',
        'Join the discussion in comments! 💬'
      ]
    },
    'valorant': {
      name: 'Valorant',
      events: ['Champions Tour', 'Masters', 'Game Changers'],
      hashtags: ['#Valorant', '#VCT', '#Esports', '#FPS', 'TacticalFPS'],
      moments: ['Ace', 'Clutch 1v5', 'Ultimate Play', 'Spike Defuse', 'Operator Shot'],
      callToActions: [
        'Watch the full match! 🎯',
        'Level up your Valorant skills! 📈',
        'Check out our agent guides! 📚',
        'Join our Discord community! 🎮'
      ]
    },
    'cs2': {
      name: 'Counter-Strike 2',
      events: ['Major Championship', 'IEM', 'Blast Premier'],
      hashtags: ['#CS2', '#CounterStrike', '#Esports', '#FPS', 'PCGaming'],
      moments: ['Ace Round', 'Clutch Play', 'Knife Kill', 'Smoke Setup', 'Flash Bang'],
      callToActions: [
        'Watch the full VOD! 🎥',
        'Improve your aim with our guides! 🎯',
        'Get the best CS2 settings! ⚙️',
        'Join our CS community! 👥'
      ]
    }
  };

  const detectGameContent = useCallback((text: string): string => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('league of legends') || lowerText.includes('lol') || 
        lowerText.includes('worlds') || lowerText.includes('summoner') ||
        lowerText.includes('champion') || lowerText.includes('baron') ||
        lowerText.includes('dragon') || lowerText.includes('inhibitor')) {
      return 'league-of-legends';
    }
    
    if (lowerText.includes('valorant') || lowerText.includes('vct') ||
        lowerText.includes('agent') || lowerText.includes('spike') ||
        lowerText.includes('ultimate') || lowerText.includes('reyna')) {
      return 'valorant';
    }
    
    if (lowerText.includes('counter-strike') || lowerText.includes('cs2') ||
        lowerText.includes('terrorist') || lowerText.includes('counter') ||
        lowerText.includes('bomb') || lowerText.includes('awp')) {
      return 'cs2';
    }
    
    return selectedGame;
  }, [selectedGame]);

  const generateMarketingContent = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      const detectedGame = detectGameContent(transcript);
      const template = gameTemplates[detectedGame as keyof typeof gameTemplates];
      
      if (!template) {
        throw new Error('Game template not found');
      }

      logger.info('Generating marketing content', 'marketing', {
        game: detectedGame,
        contentType,
        transcriptLength: transcript.length
      });

      // Simulate AI processing - in real implementation, this would call your AI service
      const content: MarketingContent[] = await new Promise((resolve) => {
        setTimeout(() => {
          const generated = generateContentForType(transcript, videoTitle, contentType, template, detectedGame);
          resolve(generated);
        }, 2000);
      });

      setGeneratedContent(content);
      onContentGenerated?.(content);
      
      logger.info('Marketing content generated successfully', 'marketing', {
        contentCount: content.length,
        game: detectedGame
      });
      
    } catch (error) {
      const appError = ErrorHandler.handle(error, 'marketing');
      logger.error('Failed to generate marketing content', 'marketing', {
        error: appError.message,
        contentType,
        game: detectGameContent(transcript)
      });
    } finally {
      setIsGenerating(false);
    }
  }, [transcript, videoTitle, contentType, detectGameContent, onContentGenerated]);

  const generateContentForType = (
    text: string, 
    title: string, 
    type: string, 
    template: any, 
    game: string
  ): MarketingContent[] => {
    const content: MarketingContent[] = [];
    
    // Extract key moments from transcript (simplified)
    const moments = extractKeyMoments(text, template.moments);
    
    // Generate content based on type
    switch (type) {
      case 'trailer':
        content.push({
          title: `🎬 ${title} - Official Trailer`,
          description: `Get ready for the most intense ${template.name} action! 🎮 This trailer showcases the best moments from recent matches.`,
          hashtags: [...template.hashtags, '#Trailer', '#Official'],
          hooks: [
            `🔥 The ${template.name} moments you CAN'T miss!`,
            `⚡ This trailer will give you CHILLS!`,
            `🏆 The best ${template.name} plays of the season!`
          ],
          callToAction: template.callToActions[0],
          targetAudience: 'General Gaming Fans',
          contentType: 'trailer',
          gameSpecific: {
            game,
            event: template.events[0],
            moments
          }
        });
        break;
        
      case 'highlights':
        content.push({
          title: `⚡ ${title} - Best Highlights`,
          description: `Relive the most insane ${template.name} moments! 🎯 These plays will blow your mind!`,
          hashtags: [...template.hashtags, '#Highlights', '#BestPlays'],
          hooks: [
            `🤯 You WON'T BELIEVE these ${template.name} plays!`,
            `💀 These moments are ABSOLUTELY INSANE!`,
            `🔥 The most clutch ${template.name} moments ever!`
          ],
          callToAction: template.callToActions[1],
          targetAudience: 'Competitive Players',
          contentType: 'highlights',
          gameSpecific: {
            game,
            event: template.events[0],
            moments
          }
        });
        break;
        
      case 'analysis':
        content.push({
          title: `🧠 ${title} - Pro Analysis`,
          description: `Deep dive into the strategy behind these ${template.name} plays. Learn from the pros! 📚`,
          hashtags: [...template.hashtags, '#Analysis', '#Strategy'],
          hooks: [
            `🎓 How PROS think in ${template.name}!`,
            `📈 Improve your ${template.name} game NOW!`,
            `🧩 The strategy behind these INSANE plays!`
          ],
          callToAction: template.callToActions[2],
          targetAudience: 'Serious Players',
          contentType: 'analysis',
          gameSpecific: {
            game,
            event: template.events[0],
            moments
          }
        });
        break;
        
      case 'reaction':
        content.push({
          title: `😱 ${title} - Live Reaction`,
          description: `Our genuine reactions to these mind-blowing ${template.name} moments! You won't believe our faces! 😮`,
          hashtags: [...template.hashtags, '#Reaction', '#Live'],
          hooks: [
            `😱 MY REACTION to these ${template.name} moments!`,
            `🤯 I CAN'T BELIEVE what just happened!`,
            `💀 This ${template.name} play left me SPEECHLESS!`
          ],
          callToAction: template.callToActions[3],
          targetAudience: 'Entertainment Seekers',
          contentType: 'reaction',
          gameSpecific: {
            game,
            event: template.events[0],
            moments
          }
        });
        break;
    }
    
    return content;
  };

  const extractKeyMoments = (text: string, templateMoments: string[]): string[] => {
    const moments: string[] = [];
    const lowerText = text.toLowerCase();
    
    templateMoments.forEach(moment => {
      if (lowerText.includes(moment.toLowerCase())) {
        moments.push(moment);
      }
    });
    
    return moments.length > 0 ? moments : ['Epic Gameplay', 'Clutch Moment', 'Team Fight'];
  };

  const copyToClipboard = async (content: MarketingContent) => {
    try {
      const formattedContent = `
${content.title}

${content.description}

${content.hooks.join('\n')}

${content.hashtags.join(' ')}

${content.callToAction}
      `.trim();
      
      await navigator.clipboard.writeText(formattedContent);
      logger.info('Marketing content copied to clipboard', 'marketing', {
        contentType: content.contentType,
        game: content.gameSpecific.game
      });
    } catch (error) {
      const appError = ErrorHandler.handle(error, 'marketing');
      logger.error('Failed to copy marketing content', 'marketing', {
        error: appError.message
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl p-6 border border-purple-700/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">TRP8 Marketing Generator</h3>
          <p className="text-purple-300 text-sm">Create viral gaming content for social media</p>
        </div>
      </div>

      {/* Game Detection */}
      <div className="mb-6">
        <label className="block text-purple-300 text-sm font-medium mb-2">Game Type</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(gameTemplates).map(([key, template]) => (
            <button
              key={key}
              onClick={() => setSelectedGame(key)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${selectedGame === key 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
                }
              `}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content Type Selection */}
      <div className="mb-6">
        <label className="block text-purple-300 text-sm font-medium mb-2">Content Type</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'trailer', label: '🎬 Trailer', desc: 'Official trailers' },
            { value: 'highlights', label: '⚡ Highlights', desc: 'Best moments' },
            { value: 'analysis', label: '🧠 Analysis', desc: 'Strategy breakdown' },
            { value: 'reaction', label: '😱 Reaction', desc: 'Live reactions' }
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setContentType(type.value as any)}
              className={`
                p-3 rounded-lg text-left transition-all
                ${contentType === type.value 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
                }
              `}
            >
              <div className="font-medium">{type.label}</div>
              <div className="text-xs opacity-80">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateMarketingContent}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-purple-800 disabled:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating Viral Content...
          </span>
        ) : (
          '🚀 Generate Marketing Content'
        )}
      </button>

      {/* Generated Content */}
      {generatedContent.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="text-white font-semibold">Generated Content</h4>
          {generatedContent.map((content, index) => (
            <div key={index} className="bg-purple-900/30 rounded-xl p-4 border border-purple-700/50">
              <div className="flex justify-between items-start mb-3">
                <h5 className="text-white font-medium">{content.title}</h5>
                <button
                  onClick={() => copyToClipboard(content)}
                  className="text-purple-300 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              
              <p className="text-purple-200 text-sm mb-3">{content.description}</p>
              
              <div className="space-y-2">
                <div>
                  <span className="text-purple-400 text-xs font-medium">Hooks:</span>
                  <div className="mt-1 space-y-1">
                    {content.hooks.map((hook, hookIndex) => (
                      <div key={hookIndex} className="text-purple-200 text-sm">• {hook}</div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="text-purple-400 text-xs font-medium">Hashtags:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {content.hashtags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="px-2 py-1 bg-purple-800/50 text-purple-200 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="text-purple-300 text-sm italic">
                  {content.callToAction}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

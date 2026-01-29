// Dynamic tips and educational content for processing states
// Keeps users engaged and informed during long operations

export interface Tip {
  text: string;
  type: 'tip' | 'fact' | 'info' | 'model-info';
  category: 'general' | 'whisper' | 'ollama' | 'youtube' | 'productivity';
}

// Educational tips database
const TIPS_DATABASE: Tip[] = [
  // General Tips
  {
    text: "💡 Did you know? Focule processes everything locally on your machine - no cloud uploads required!",
    type: 'fact',
    category: 'general'
  },
  {
    text: "⚡ Pro tip: Use keyboard shortcuts to speed up your workflow. Press Ctrl+K to quickly paste a new URL.",
    type: 'tip',
    category: 'productivity'
  },
  {
    text: "🔒 Privacy first: Your video files and transcriptions never leave your computer.",
    type: 'info',
    category: 'general'
  },
  {
    text: "📊 Fact: The average YouTube video is 11.7 minutes long, but Focule can handle hours of content!",
    type: 'fact',
    category: 'general'
  },
  {
    text: "🎯 Productivity hack: Set up a dedicated folder for your transcribed content to stay organized.",
    type: 'tip',
    category: 'productivity'
  },

  // Whisper Model Information
  {
    text: "🧠 Whisper AI: Developed by OpenAI, trained on 680,000 hours of multilingual audio data.",
    type: 'model-info',
    category: 'whisper'
  },
  {
    text: "⚙️ Whisper models: Tiny (39M) → Base (74M) → Small (244M) → Medium (769M) → Large (1550M) parameters.",
    type: 'model-info',
    category: 'whisper'
  },
  {
    text: "🎵 Whisper can transcribe speech in 99 different languages with high accuracy.",
    type: 'fact',
    category: 'whisper'
  },
  {
    text: "⚡ The 'tiny' Whisper model is 32x faster than 'large' but slightly less accurate.",
    type: 'model-info',
    category: 'whisper'
  },
  {
    text: "🔊 Whisper handles background noise, multiple speakers, and various audio qualities well.",
    type: 'info',
    category: 'whisper'
  },

  // Ollama AI Information
  {
    text: "🤖 Ollama: Run large language models locally on your machine without internet connection.",
    type: 'model-info',
    category: 'ollama'
  },
  {
    text: "🦙 Llama 3 models excel at understanding context and generating coherent social media content.",
    type: 'model-info',
    category: 'ollama'
  },
  {
    text: "💬 Ollama models process your transcript locally, ensuring complete privacy of your content.",
    type: 'info',
    category: 'ollama'
  },
  {
    text: "🎨 Different AI models have different personalities - try various ones for unique content styles!",
    type: 'tip',
    category: 'ollama'
  },
  {
    text: "📈 Model sizes: 7B (7 billion) parameters are great for social media, 13B+ for detailed analysis.",
    type: 'model-info',
    category: 'ollama'
  },

  // YouTube/Platform Information
  {
    text: "📺 YouTube processes over 500 hours of video content every minute!",
    type: 'fact',
    category: 'youtube'
  },
  {
    text: "🎥 yt-dlp supports over 1000 websites including YouTube, Twitch, TikTok, and more.",
    type: 'info',
    category: 'youtube'
  },
  {
    text: "⚠️ YouTube's anti-bot measures may temporarily block downloads - this is normal and usually resolves quickly.",
    type: 'info',
    category: 'youtube'
  },
  {
    text: "🔄 Twitch VODs and clips are fully supported with timestamp preservation.",
    type: 'fact',
    category: 'youtube'
  },
  {
    text: "📱 Pro tip: Shorter videos (under 10 minutes) process faster and give better AI content results.",
    type: 'tip',
    category: 'youtube'
  },

  // Productivity & Workflow
  {
    text: "📝 Best practice: Review your transcript before generating social content for better results.",
    type: 'tip',
    category: 'productivity'
  },
  {
    text: "🎯 Focus on quality: One well-transcribed video is better than three rushed ones.",
    type: 'tip',
    category: 'productivity'
  },
  {
    text: "📚 Organize your exports: Use descriptive filenames like 'Interview_JohnDoe_2025-01-29'.",
    type: 'tip',
    category: 'productivity'
  },
  {
    text: "⏰ Time saver: Batch process multiple videos when you have a good workflow established.",
    type: 'tip',
    category: 'productivity'
  },
  {
    text: "🔄 Regular updates keep yt-dlp working with the latest YouTube changes.",
    type: 'info',
    category: 'general'
  }
];

// Tips categorized by processing stage
export const STAGE_SPECIFIC_TIPS = {
  downloading: [
    "⬇️ Downloading: Focule uses yt-dlp to get the highest quality video available.",
    "🌐 Network speed affects download time - WiFi is recommended for large files.",
    "📹 Video formats are automatically optimized for transcription quality.",
    "🔐 All downloads are encrypted and stored securely on your local machine."
  ],
  extracting: [
    "🎵 Audio extraction: FFmpeg isolates the audio track for optimal transcription.",
    "🔊 Audio is normalized to ensure consistent volume levels.",
    "📊 Sample rate is optimized for Whisper AI processing.",
    "⚡ This step usually takes 10-30 seconds depending on video length."
  ],
  transcribing: [
    "🧠 AI transcription: Whisper analyzes audio patterns and converts them to text.",
    "🌍 Whisper supports 99 languages with native-level accuracy.",
    "⏱️ Transcription time varies: ~1 minute per 10 minutes of audio on average.",
    "🎯 The AI identifies different speakers and punctuation automatically."
  ],
  processing: [
    "✨ Content generation: Ollama creates engaging social media content from your transcript.",
    "📝 Multiple content formats are generated: hooks, descriptions, hashtags, keywords.",
    "🎨 AI adapts tone based on your content type (educational, entertainment, business).",
    "🔄 Different AI models can create unique variations of the same content."
  ]
};

export class DynamicTipsManager {
  private usedTips: Set<string> = new Set();
  private currentStage: keyof typeof STAGE_SPECIFIC_TIPS = 'downloading';
  private rotationInterval: NodeJS.Timeout | null = null;
  private currentTip: Tip | null = null;

  constructor() {
    this.usedTips.clear();
  }

  // Set the current processing stage
  setStage(stage: keyof typeof STAGE_SPECIFIC_TIPS) {
    this.currentStage = stage;
  }

  // Get a random tip for the current stage
  getTipForStage(): Tip {
    const stageTips = STAGE_SPECIFIC_TIPS[this.currentStage];
    
    // 70% chance to show stage-specific tip, 30% chance for general tip
    if (Math.random() < 0.7 && stageTips.length > 0) {
      const randomIndex = Math.floor(Math.random() * stageTips.length);
      return {
        text: stageTips[randomIndex],
        type: 'info',
        category: 'general'
      };
    }

    return this.getRandomGeneralTip();
  }

  // Get a random general tip
  getRandomGeneralTip(): Tip {
    const availableTips = TIPS_DATABASE.filter(tip => !this.usedTips.has(tip.text));
    
    if (availableTips.length === 0) {
      // Reset used tips if we've shown all of them
      this.usedTips.clear();
      return TIPS_DATABASE[Math.floor(Math.random() * TIPS_DATABASE.length)];
    }

    const randomTip = availableTips[Math.floor(Math.random() * availableTips.length)];
    this.usedTips.add(randomTip.text);
    
    return randomTip;
  }

  // Get a tip based on category
  getTipByCategory(category: Tip['category']): Tip {
    const categoryTips = TIPS_DATABASE.filter(tip => tip.category === category);
    return categoryTips[Math.floor(Math.random() * categoryTips.length)];
  }

  // Get current tip
  getCurrentTip(): Tip | null {
    return this.currentTip;
  }

  // Start automatic rotation
  startRotation(callback: (tip: Tip) => void, intervalMs: number = 8000) {
    this.stopRotation(); // Clear any existing rotation
    
    this.rotationInterval = setInterval(() => {
      this.currentTip = this.getTipForStage();
      callback(this.currentTip);
    }, intervalMs);

    // Show first tip immediately
    this.currentTip = this.getTipForStage();
    callback(this.currentTip);
  }

  // Stop automatic rotation
  stopRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
  }

  // Get tip count by type
  getTipStats() {
    return {
      total: TIPS_DATABASE.length,
      byType: TIPS_DATABASE.reduce((acc, tip) => {
        acc[tip.type] = (acc[tip.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: TIPS_DATABASE.reduce((acc, tip) => {
        acc[tip.category] = (acc[tip.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

// Singleton instance
export const tipsManager = new DynamicTipsManager();

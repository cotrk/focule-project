import * as http from 'http';
import * as path from 'path';
import * as os from 'os';

export interface SocialContent {
  hooks: string[];  // Now supports multiple hook/title options
  description: string;
  hashtags: string[];
  keywords: string[];
  filenames: string[];
  imagePrompts: string[];
}

export interface OllamaResult {
  socialContent: SocialContent;
}

export interface RecommendedModel {
  name: string;
  tier: 'lightweight' | 'balanced' | 'performance';
  paramRange: string;
  vram: string;
  description: string;
  url: string;
}

const OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_MODELS_PATH = path.join(os.homedir(), '.ollama', 'models', 'manifests', 'registry.ollama.ai', 'library');

// Extract parameter count from model name (e.g., "mistral-nemo:12b" -> 12)
function getModelParams(modelName: string): number | null {
  const match = modelName.match(/(\d+\.?\d*)b/i);
  return match ? parseFloat(match[1]) : null;
}

// Categorize a model by its parameter count
function getModelTier(params: number | null): 'lightweight' | 'balanced' | 'performance' | 'unknown' {
  if (params === null) return 'unknown';
  if (params < 8) return 'lightweight';
  if (params <= 20) return 'balanced';
  return 'performance';
}

export async function getAvailableModels(): Promise<string[]> {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:11434/api/tags', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.models && Array.isArray(response.models)) {
            const names = response.models.map((m: any) => m.name).sort();
            console.log('[Ollama] Available models:', names);
            resolve(names);
          } else {
            resolve([]);
          }
        } catch {
          resolve([]);
        }
      });
    });
    
    req.on('error', () => resolve([]));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve([]);
    });
  });
}

// Get recommended models from user's installed models, categorized by tier
export function categorizeInstalledModels(installedModels: string[]): {
  lightweight: string[];
  balanced: string[];
  performance: string[];
} {
  const categorized = {
    lightweight: [] as string[],
    balanced: [] as string[],
    performance: [] as string[],
  };

  for (const model of installedModels) {
    const params = getModelParams(model);
    const tier = getModelTier(params);
    
    if (tier === 'lightweight') categorized.lightweight.push(model);
    else if (tier === 'balanced') categorized.balanced.push(model);
    else if (tier === 'performance') categorized.performance.push(model);
    else {
      // Unknown param count - put in balanced by default
      categorized.balanced.push(model);
    }
  }

  return categorized;
}

// Get recommended models for new users who don't have any installed
export function getStarterRecommendations(): RecommendedModel[] {
  return [
    {
      name: 'llama3.2:3b',
      tier: 'lightweight',
      paramRange: 'Under 8B',
      vram: '4-6 GB',
      description: 'Fast and efficient. Great for quick processing on most systems. Perfect for laptops and older GPUs.',
      url: 'https://ollama.com/library/llama3.2',
    },
    {
      name: 'mistral-nemo:12b',
      tier: 'balanced',
      paramRange: '8B - 20B',
      vram: '8-16 GB',
      description: 'Best balance of quality and speed. Recommended for most users with dedicated GPUs like RTX 3060/4060.',
      url: 'https://ollama.com/library/mistral-nemo',
    },
    {
      name: 'qwen2.5:14b',
      tier: 'balanced',
      paramRange: '8B - 20B',
      vram: '12-16 GB',
      description: 'Excellent for content generation. Great multilingual support. Works well on RTX 3070/4070 or better.',
      url: 'https://ollama.com/library/qwen2.5',
    },
    {
      name: 'llama3.1:70b',
      tier: 'performance',
      paramRange: '20B+',
      vram: '48+ GB',
      description: 'Maximum quality output. Requires high-end hardware like RTX 4090, 5090, or multiple GPUs.',
      url: 'https://ollama.com/library/llama3.1:70b',
    },
    {
      name: 'qwen2.5:32b',
      tier: 'performance',
      paramRange: '20B+',
      vram: '24-32 GB',
      description: 'Professional-grade results. For RTX 4080/4090 or workstation GPUs with 24GB+ VRAM.',
      url: 'https://ollama.com/library/qwen2.5:32b',
    },
  ];
}

// Dynamically pick recommended models from installed list
export function getRecommendedFromInstalled(installedModels: string[]): string[] {
  const categorized = categorizeInstalledModels(installedModels);
  const recommended: string[] = [];

  // Prioritize known good models for content generation
  const priorityPatterns = ['mistral', 'llama', 'qwen', 'gemma', 'phi'];
  
  const findBest = (models: string[]): string | null => {
    // First try to find a priority model
    for (const pattern of priorityPatterns) {
      const match = models.find(m => m.toLowerCase().includes(pattern));
      if (match) return match;
    }
    // Otherwise return first available
    return models[0] || null;
  };

  // Get one from each tier if available
  const balancedPick = findBest(categorized.balanced);
  const lightPick = findBest(categorized.lightweight);
  const perfPick = findBest(categorized.performance);

  if (balancedPick) recommended.push(balancedPick);
  if (lightPick) recommended.push(lightPick);
  if (perfPick) recommended.push(perfPick);

  // If we still need more, just add any remaining
  if (recommended.length < 2) {
    for (const model of installedModels) {
      if (!recommended.includes(model) && recommended.length < 3) {
        recommended.push(model);
      }
    }
  }

  return recommended.slice(0, 3);
}

async function checkOllamaAvailable(): Promise<boolean> {
  const urls = [
    'http://127.0.0.1:11434/api/tags',
    'http://localhost:11434/api/tags',
  ];

  for (const url of urls) {
    console.log('[Ollama] Checking availability at', url);
    
    const available = await new Promise<boolean>((resolve) => {
      const req = http.get(url, (res) => {
        console.log('[Ollama] Response status:', res.statusCode);
        resolve(res.statusCode === 200);
      });

      req.on('error', (err) => {
        console.log('[Ollama] Connection error:', err.message);
        resolve(false);
      });

      req.setTimeout(5000, () => {
        console.log('[Ollama] Connection timeout');
        req.destroy();
        resolve(false);
      });
    });

    if (available) return true;
  }

  return false;
}

async function callOllama(prompt: string, model: string = 'llama3'): Promise<string> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model,
      prompt,
      stream: false,
    });

    console.log(`[Ollama] Calling model: ${model}`);

    const options = {
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 300000,
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`[Ollama] Response received, length: ${data.length}`);
        try {
          const response = JSON.parse(data);
          console.log(`[Ollama] Response keys:`, Object.keys(response));
          
          if (response.response) {
            console.log(`[Ollama] Got response text, length: ${response.response.length}`);
            resolve(response.response);
          } else if (response.error) {
            console.log(`[Ollama] Error from API:`, response.error);
            reject(new Error(`AI engine error: ${response.error}`));
          } else {
            console.log(`[Ollama] Unexpected response:`, JSON.stringify(response).substring(0, 500));
            reject(new Error('AI engine returned an unexpected response. Please try again.'));
          }
        } catch (error: any) {
          console.log(`[Ollama] Parse error, raw data:`, data.substring(0, 500));
          reject(new Error('Failed to process AI response. Please try again.'));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error('Cannot connect to AI engine. Please make sure Ollama is running.'));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('AI engine took too long to respond. Try a faster model or shorter video.'));
    });

    req.write(postData);
    req.end();
  });
}

function parseSocialContent(response: string): SocialContent {
  const content: SocialContent = {
    hooks: [],
    description: '',
    hashtags: [],
    keywords: [],
    filenames: [],
    imagePrompts: [],
  };

  // Try to parse JSON first
  try {
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed.hooks)) content.hooks = parsed.hooks;
    else if (parsed.hook) content.hooks = [parsed.hook];
    if (parsed.description) content.description = parsed.description;
    if (Array.isArray(parsed.hashtags)) content.hashtags = parsed.hashtags;
    if (Array.isArray(parsed.keywords)) content.keywords = parsed.keywords;
    if (Array.isArray(parsed.filenames)) content.filenames = parsed.filenames;
    if (Array.isArray(parsed.imagePrompts)) content.imagePrompts = parsed.imagePrompts;
    return content;
  } catch {
    // Parse text format
  }

  const lines = response.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    const lowerLine = trimmed.toLowerCase();
    
    if (lowerLine.includes('hook') || lowerLine.includes('title')) {
      currentSection = 'hooks';
      continue;
    } else if (lowerLine.includes('description')) {
      currentSection = 'description';
      continue;
    } else if (lowerLine.includes('hashtag')) {
      currentSection = 'hashtags';
      continue;
    } else if (lowerLine.includes('keyword')) {
      currentSection = 'keywords';
      continue;
    } else if (lowerLine.includes('filename')) {
      currentSection = 'filenames';
      continue;
    } else if (lowerLine.includes('image') || lowerLine.includes('prompt')) {
      currentSection = 'imagePrompts';
      continue;
    }

    if (!trimmed || trimmed.startsWith('---')) continue;

    switch (currentSection) {
      case 'hooks':
        // Parse numbered list items as separate hooks
        if (trimmed.match(/^\d+[\.\)]/)) {
          // Handle "1." or "1)" format
          const hookText = trimmed.replace(/^\d+[\.\)]\s*/, '').replace(/^["'\[\]]+|["'\[\]]+$/g, '').trim();
          if (hookText.length > 10) {
            content.hooks.push(hookText);
          }
        } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
          // Handle bullet points
          const hookText = trimmed.replace(/^[-•]\s*/, '').replace(/^["'\[\]]+|["'\[\]]+$/g, '').trim();
          if (hookText.length > 10) {
            content.hooks.push(hookText);
          }
        } else if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
          // Handle quoted hooks
          const hookText = trimmed.replace(/^["']+|["']+$/g, '').trim();
          if (hookText.length > 10) {
            content.hooks.push(hookText);
          }
        } else if (trimmed.length > 15 && !trimmed.startsWith('[') && content.hooks.length < 3) {
          // Non-formatted hook (fallback for plain text responses)
          content.hooks.push(trimmed.replace(/^["'\[\]]+|["'\[\]]+$/g, ''));
        }
        break;
      case 'description':
        content.description = (content.description ? content.description + ' ' : '') + trimmed;
        break;
      case 'hashtags':
        const tags = trimmed.match(/#\w+/g);
        if (tags) content.hashtags.push(...tags);
        else if (trimmed.startsWith('-') || trimmed.match(/^\d+\./)) {
          content.hashtags.push('#' + trimmed.replace(/^[-\d.\s]+/, '').replace(/\s+/g, ''));
        }
        break;
      case 'keywords':
        const kws = trimmed.split(/[,;]/).map(k => k.trim()).filter(k => k);
        content.keywords.push(...kws);
        break;
      case 'filenames':
        if (trimmed.startsWith('-') || trimmed.match(/^\d+\./)) {
          content.filenames.push(trimmed.replace(/^[-\d.\s]+/, '').trim());
        } else if (trimmed) {
          content.filenames.push(trimmed);
        }
        break;
      case 'imagePrompts':
        if (trimmed.length > 20) {
          content.imagePrompts.push(trimmed);
        }
        break;
    }
  }

  return content;
}

export async function processWithOllama(
  transcript: string,
  model: string = 'llama3'
): Promise<OllamaResult> {
  const available = await checkOllamaAvailable();
  if (!available) {
    throw new Error('AI engine is not running. Please start Ollama and try again.');
  }

  const socialPrompt = `Analyze this video transcript and create social media marketing content. Respond in this EXACT format:

HOOK/TITLE OPTIONS:
1. [First compelling 50-60 character hook - use first person "I made...", include specific numbers or names from the transcript]
2. [Second hook variation - try a different angle or emotion, maybe a question or bold statement]
3. [Third hook variation - focus on the most surprising or unique aspect of the content]

DESCRIPTION:
[Write a YouTube-style description. Start with keywords from the hook in the first sentence. Include a call to action. Keep it engaging and SEO-friendly, 100-200 characters for the key opening]

HASHTAGS:
#hashtag1
#hashtag2
#hashtag3
#hashtag4
#hashtag5
#hashtag6
#hashtag7
#hashtag8
#hashtag9
#hashtag10
[Mix of broad, niche, and hyper-targeted hashtags]

KEYWORDS:
keyword1, keyword2, keyword3, keyword4, keyword5, keyword6, keyword7, keyword8, keyword9, keyword10
[Mix of broad, niche, and long-tail keywords separated by commas]

FILENAMES:
1. filename_suggestion_1
2. filename_suggestion_2
3. filename_suggestion_3
4. filename_suggestion_4
5. filename_suggestion_5
[SEO-friendly filename suggestions]

IMAGE PROMPTS FOR GOOGLE IMAGEFX:
1. [Detailed prompt for generating a thumbnail or cover image, include style, mood, colors, composition]
2. [Another creative prompt variation]
3. [Third prompt with different angle or style]

Transcript:
${transcript.substring(0, 6000)}${transcript.length > 6000 ? '...' : ''}

Generate the social media content now:`;

  try {
    console.log(`[Ollama] Generating social media content with model: ${model}`);
    const response = await callOllama(socialPrompt, model);
    console.log(`[Ollama] Got response, parsing social content`);
    const socialContent = parseSocialContent(response);
    
    // Ensure we have reasonable defaults
    if (socialContent.hooks.length === 0) {
      socialContent.hooks = ['Check out this amazing video content!'];
    }
    if (!socialContent.description) {
      socialContent.description = 'Watch the full video for more insights.';
    }
    if (socialContent.hashtags.length === 0) {
      socialContent.hashtags = ['#content', '#video', '#viral'];
    }
    if (socialContent.keywords.length === 0) {
      socialContent.keywords = ['video', 'content', 'watch'];
    }
    if (socialContent.filenames.length === 0) {
      socialContent.filenames = ['video_content.mp4'];
    }
    if (socialContent.imagePrompts.length === 0) {
      socialContent.imagePrompts = ['A vibrant, eye-catching thumbnail with bold text overlay'];
    }

    return { socialContent };
  } catch (error: any) {
    throw new Error(`Content generation failed: ${error.message}`);
  }
}

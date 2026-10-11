import * as http from 'http';

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

const OLLAMA_BASE_URL = 'http://127.0.0.1:11434';

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

export function isEmbeddingModelName(modelName: string): boolean {
  return /embed(?:ding)?/i.test(modelName);
}

export async function getAvailableModels(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const req = http.get(`${OLLAMA_BASE_URL}/api/tags`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response: unknown = JSON.parse(data);
          if (
            typeof response === 'object' &&
            response !== null &&
            'models' in response &&
            Array.isArray(response.models)
          ) {
            const names = response.models
              .filter((model): model is { name: string } =>
                typeof model === 'object' &&
                model !== null &&
                'name' in model &&
                typeof model.name === 'string'
              )
              .map(model => model.name)
              .filter(name => !isEmbeddingModelName(name))
              .sort();
            console.log('[Ollama] Available models:', names);
            resolve(names);
          } else {
            reject(new Error('Ollama returned an invalid model list.'));
          }
        } catch (error) {
          reject(new Error(`Could not read Ollama's local model list: ${String(error)}`));
        }
      });
    });
    
    req.on('error', () => reject(new Error('Cannot connect to Ollama at 127.0.0.1:11434. Start Ollama and try again.')));
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Ollama did not respond within 5 seconds.'));
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
      name: 'qwen3.5:4b',
      tier: 'lightweight',
      paramRange: '4B',
      vram: '4-6 GB',
      description: 'Packaged Focule model. Local inference, Apache-2.0 licensed, and suitable for most desktop GPUs.',
      url: 'https://ollama.com/library/qwen3.5',
    },
  ];
}

// Dynamically pick recommended models from installed list
export function getRecommendedFromInstalled(installedModels: string[]): string[] {
  const categorized = categorizeInstalledModels(installedModels);
  const recommended: string[] = [];
  const contentModels = installedModels.filter(model =>
    !isEmbeddingModelName(model) && !/coder|code-/i.test(model)
  );

  // Prioritize known good models for content generation
  const priorityPatterns = ['qwen3.5', 'qwen', 'mistral', 'gemma', 'llama', 'phi'];
  
  const findBest = (models: string[]): string | null => {
    // First try to find a priority model
    for (const pattern of priorityPatterns) {
      const match = models.find(m =>
        contentModels.includes(m) && m.toLowerCase().includes(pattern)
      );
      if (match) return match;
    }
    // Otherwise return first available
    return models.find(model => contentModels.includes(model)) || null;
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
    for (const model of contentModels) {
      if (!recommended.includes(model) && recommended.length < 3) {
        recommended.push(model);
      }
    }
  }

  return recommended.slice(0, 3);
}

async function checkOllamaAvailable(): Promise<boolean> {
  const url = `${OLLAMA_BASE_URL}/api/tags`;
  console.log('[Ollama] Checking availability at', url);

  return new Promise<boolean>((resolve) => {
    const req = http.get(url, (res) => {
      console.log('[Ollama] Response status:', res.statusCode);
      const available = res.statusCode === 200;
      res.resume();
      resolve(available);
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
}

async function callOllama(prompt: string, model: string): Promise<string> {
  if (isEmbeddingModelName(model)) {
    throw new Error(`${model} is an embedding-only model. Choose a text-generation model in Settings.`);
  }

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model,
      prompt,
      stream: false,
      think: false,
      options: {
        num_ctx: 16384,
        num_predict: 2048,
      },
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
  model: string = 'qwen3.5:4b'
): Promise<OllamaResult> {
  const normalizedTranscript = transcript.trim();
  if (!normalizedTranscript) {
    throw new Error('No speech was transcribed. The audio may be silent or too unclear to recognize.');
  }
  if (normalizedTranscript.length > 28000) {
    throw new Error('This transcript is too long for reliable local content generation. Try a shorter video or split the audio into sections.');
  }

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
${normalizedTranscript}

Generate the social media content now:`;

  try {
    console.log(`[Ollama] Generating social media content with model: ${model}`);
    const response = await callOllama(socialPrompt, model);
    console.log(`[Ollama] Got response, parsing social content`);
    const socialContent = parseSocialContent(response);
    
    if (
      socialContent.hooks.length === 0 ||
      !socialContent.description ||
      socialContent.hashtags.length === 0 ||
      socialContent.keywords.length === 0 ||
      socialContent.filenames.length === 0 ||
      socialContent.imagePrompts.length === 0
    ) {
      throw new Error('The local model returned incomplete content. Try again or choose a different Ollama model.');
    }

    return { socialContent };
  } catch (error: any) {
    throw new Error(`Content generation failed: ${error.message}`);
  }
}

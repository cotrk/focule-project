// Job Queue Service for YouTube and Twitch processing
import { create } from 'zustand';
import type { TranscriptionResult } from '../types';

export interface Job {
  id: string;
  type: 'youtube' | 'twitch' | 'local';
  url?: string;
  filePath?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  result?: {
    transcript: string;
    summary: string;
    metadata: Partial<TranscriptionResult>;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

interface JobQueueState {
  jobs: Job[];
  maxConcurrent: number;
  isProcessing: boolean;
}

export const useJobQueue = create<JobQueueState>((set, get) => ({
  jobs: [],
  maxConcurrent: 3,
  isProcessing: false,

  addJob: (job: Omit<Job, 'id' | 'createdAt'>) => {
    const newJob: Job = {
      ...job,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      status: 'queued',
      progress: 0,
    };

    set((state) => ({
      ...state,
      jobs: [...state.jobs, newJob],
    }));

    // Auto-start processing if not already running
    if (!get().isProcessing) {
      set((state) => ({ ...state, isProcessing: true }));
      processNextJob();
    }
  },

  updateJobStatus: (jobId: string, updates: Partial<Job>) => {
    set((state) => ({
      ...state,
      jobs: state.jobs.map((job) =>
        job.id === jobId ? { ...job, ...updates } : job
      ),
    }));
  },

  removeJob: (jobId: string) => {
    set((state) => ({
      ...state,
      jobs: state.jobs.filter((job) => job.id !== jobId),
    }));
  },

  clearCompleted: () => {
    set((state) => ({
      ...state,
      jobs: state.jobs.filter((job) => job.status !== 'completed'),
    }));
  },

  startProcessing: () => {
    set((state) => ({ ...state, isProcessing: true }));
    processNextJob();
  },

  stopProcessing: () => {
    set((state) => ({ ...state, isProcessing: false }));
  },
}));

// Job processing functions
async function processNextJob() {
  const state = useJobQueue.getState();
  const queuedJobs = state.jobs.filter((job) => job.status === 'queued');
  
  if (queuedJobs.length === 0) {
    useJobQueue.setState({ ...state, isProcessing: false });
    return;
  }

  const job = queuedJobs[0];
  const activeJobs = state.jobs.filter((j) => j.status === 'processing');
  
  if (activeJobs.length >= state.maxConcurrent) {
    return; // Max concurrent jobs reached
  }

  // Start processing the job
  useJobQueue.getState().updateJobStatus(job.id, {
    status: 'processing',
    startedAt: new Date(),
    progress: 0,
  });

  try {
    if (job.type === 'youtube') {
      await processYouTubeJob(job);
    } else if (job.type === 'twitch') {
      await processTwitchJob(job);
    } else if (job.type === 'local') {
      await processLocalJob(job);
    }
  } catch (error) {
    useJobQueue.getState().updateJobStatus(job.id, {
      status: 'failed',
      error: error.message,
    });
  }

  // Continue processing next job
  setTimeout(() => processNextJob(), 1000);
}

async function processYouTubeJob(job: Job) {
  if (!job.url) {
    throw new Error('YouTube job requires URL');
  }

  // Update progress
  useJobQueue.getState().updateJobStatus(job.id, { progress: 10 });
  
  try {
    // This would integrate with yt-dlp or similar
    const result = await downloadYouTubeVideo(job.url);
    
    useJobQueue.getState().updateJobStatus(job.id, { progress: 50 });
    
    // Process with existing transcription service
    const transcript = await transcribeVideo(result.filePath);
    
    useJobQueue.getState().updateJobStatus(job.id, { progress: 90 });
    
    // Generate summary with AI
    const summary = await generateSummary(transcript);
    
    useJobQueue.getState().updateJobStatus(job.id, {
      status: 'completed',
      progress: 100,
      completedAt: new Date(),
      result: {
        transcript,
        summary,
        metadata: result.metadata,
      },
    });
  } catch (error) {
    throw error;
  }
}

async function processTwitchJob(job: Job) {
  if (!job.url) {
    throw new Error('Twitch job requires URL');
  }

  useJobQueue.getState().updateJobStatus(job.id, { progress: 10 });
  
  try {
    // This would integrate with Twitch downloader
    const result = await downloadTwitchVideo(job.url);
    
    useJobQueue.getState().updateJobStatus(job.id, { progress: 50 });
    
    const transcript = await transcribeVideo(result.filePath);
    
    useJobQueue.getState().updateJobStatus(job.id, { progress: 90 });
    
    const summary = await generateSummary(transcript);
    
    useJobQueue.getState().updateJobStatus(job.id, {
      status: 'completed',
      progress: 100,
      completedAt: new Date(),
      result: {
        transcript,
        summary,
        metadata: result.metadata,
      },
    });
  } catch (error) {
    throw error;
  }
}

async function processLocalJob(job: Job) {
  if (!job.filePath) {
    throw new Error('Local job requires file path');
  }

  useJobQueue.getState().updateJobStatus(job.id, { progress: 20 });
  
  try {
    const transcript = await transcribeVideo(job.filePath);
    
    useJobQueue.getState().updateJobStatus(job.id, { progress: 80 });
    
    const summary = await generateSummary(transcript);
    
    useJobQueue.getState().updateJobStatus(job.id, {
      status: 'completed',
      progress: 100,
      completedAt: new Date(),
      result: {
        transcript,
        summary,
      },
    });
  } catch (error) {
    throw error;
  }
}

// Placeholder functions - these would integrate with actual services
async function downloadYouTubeVideo(url: string) {
  // Integration with yt-dlp or YouTube API
  return {
    filePath: `downloads/${Date.now()}_youtube.mp4`,
    metadata: { title: 'YouTube Video', duration: '10:30' },
  };
}

async function downloadTwitchVideo(url: string) {
  // Integration with Twitch downloader
  return {
    filePath: `downloads/${Date.now()}_twitch.mp4`,
    metadata: { title: 'Twitch Stream', duration: '45:20' },
  };
}

async function transcribeVideo(filePath: string) {
  // Integration with existing transcription service
  return 'Sample transcript content...';
}

async function generateSummary(transcript: string) {
  // Integration with AI service
  return 'Sample AI-generated summary...';
}

export { useJobQueue as useJobQueueService, type Job };

---
title: Focule Redesign - Visual Reference & User Flows
format: ASCII Mockups + Interaction Diagrams
---

# 🎬 FOCULE REDESIGN - VISUAL REFERENCE GUIDE

## MOCKUP 1: PREREQUISITES CHECK REDESIGN

### Desktop View (1024px)

```
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║                    (Dark background overlay)                       ║
║                                                                    ║
║         ╔──────────────────────────────────────────────────╗       ║
║         │                                                  │       ║
║         │  🚀 Getting Your Tools Ready                    │       ║
║         │  Focule needs a few tools to transcribe videos. │       ║
║         │  We'll help you set them up (2-5 minutes).      │       ║
║         │                                                  │       ║
║         ├──────────────────────────────────────────────────┤       ║
║         │                                                  │       ║
║         │ Setup Progress                      3 of 6      │       ║
║         │ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │       ║
║         │                                                  │       ║
║         ├──────────────────────────────────────────────────┤       ║
║         │                                                  │       ║
║         │ REQUIRED TOOLS (3 missing)                       │       ║
║         │                                                  │       ║
║         │ ╔────────────────────────────────────────────╗   │       ║
║         │ │ ❌ Video Processor                         │   │       ║
║         │ │ Extracts audio from videos so we can       │   │       ║
║         │ │ transcribe them.                           │   │       ║
║         │ │                                            │   │       ║
║         │ │                  [↓ Download FFmpeg]       │   │       ║
║         │ └────────────────────────────────────────────┘   │       ║
║         │                                                  │       ║
║         │ ╔────────────────────────────────────────────╗   │       ║
║         │ │ ❌ Video Downloader                        │   │       ║
║         │ │ Downloads videos from YouTube and Twitch.  │   │       ║
║         │ │                                            │   │       ║
║         │ │                [⌨ Install yt-dlp]        │   │       ║
║         │ └────────────────────────────────────────────┘   │       ║
║         │                                                  │       ║
║         │ ╔────────────────────────────────────────────╗   │       ║
║         │ │ ❌ Voice Transcriber                       │   │       ║
║         │ │ Converts speech to text with high accuracy │   │       ║
║         │ │                                            │   │       ║
║         │ │         [⌨ Install openai-whisper]        │   │       ║
║         │ └────────────────────────────────────────────┘   │       ║
║         │                                                  │       ║
║         ├──────────────────────────────────────────────────┤       ║
║         │ OPTIONAL ENHANCEMENTS (1)                        │       ║
║         │                                                  │       ║
║         │ ╔────────────────────────────────────────────╗   │       ║
║         │ │ ℹ AI Assistant                             │   │       ║
║         │ │ Generates social media captions. You can   │   │       ║
║         │ │ skip this for now.                         │   │       ║
║         │ │                                            │   │       ║
║         │ │             [📚 Learn About Ollama]        │   │       ║
║         │ └────────────────────────────────────────────┘   │       ║
║         │                                                  │       ║
║         ├──────────────────────────────────────────────────┤       ║
║         │                                                  │       ║
║         │            [Complete Setup to Continue]        │       ║
║         │            [⊕ Already set up? Skip →]          │       ║
║         │                                                  │       ║
║         └──────────────────────────────────────────────────┘       ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

### Card States Detail

```
MISSING (Red border, red icon)
┌─────────────────────────────────────┐
│ ❌ Video Processor                  │
│                                     │
│ Extracts audio from videos so we    │
│ can transcribe them.                │
│                                     │
│               [↓ Download FFmpeg]   │
└─────────────────────────────────────┘

INSTALLING (Yellow border, spinner)
┌─────────────────────────────────────┐
│ ⏳ Voice Transcriber                 │
│                                     │
│ Installing... (please wait)         │
│                                     │
│     [⏳ Installing...] ✓ (disabled)  │
└─────────────────────────────────────┘

COMPLETED (Green border, checkmark)
┌─────────────────────────────────────┐
│ ✅ AI Assistant                     │
│                                     │
│ Generates social media captions.    │
│                                     │
│                   v0.2.1 Ready      │
└─────────────────────────────────────┘
```

---

## MOCKUP 2: URL INPUT REDESIGN

### Desktop View (1024px)

```
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║                                                                    ║
║  Transcribe a Video                                              ║
║                                                                    ║
║  Paste a YouTube or Twitch link below to get started.            ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────┐    ║
║  │ Supported:  ▶ YouTube  |  🟣 Twitch                      │    ║
║  └──────────────────────────────────────────────────────────┘    ║
║                                                                    ║
║  ▶ Video URL                                                      ║
║                                                                    ║
║  ┌──────────────────────────────────────────────┐ ┌──────────┐   ║
║  │ Paste your YouTube or Twitch link...    ✅  │ │ Transcri │   ║
║  │                                              │ │ be Video │   ║
║  │                                              │ │    ➜     │   ║
║  └──────────────────────────────────────────────┘ └──────────┘   ║
║                                                                    ║
║  ✨ Ready to transcribe! This usually takes 5-15 minutes.        ║
║                                                                    ║
║  ──────────────────────────────────────────────────────────────   ║
║  💡 Pro Tips                                                      ║
║  • Shorter videos transcribe faster (1-30 min is ideal)          ║
║  • Clearer audio = more accurate transcription                   ║
║  • First run takes longer; subsequent videos are faster          ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

### Input States Detail

```
EMPTY STATE
┌────────────────────────────────┐ ┌────────┐
│ Paste your link...             │ │Process │
└────────────────────────────────┘ └────────┘
                                    (disabled)

TYPING (INVALID)
┌────────────────────────────────┐ ┌────────┐
│ https://example.com        ❌   │ │Transcri│
└────────────────────────────────┘ └────────┘
❌ That doesn't look like a valid URL...    (disabled)

VALID
┌────────────────────────────────┐ ┌────────┐
│ https://youtube.com/watch...✅ │ │Transcri│ ← ENABLED
└────────────────────────────────┘ └────────┘
✨ Ready to transcribe! (5-15 min)
```

### Mobile View (375px)

```
┌──────────────────────────────────┐
│                                  │
│  Transcribe a Video              │
│  Paste a link below to start.    │
│                                  │
│  ┌────────────────────────────┐  │
│  │ YouTube │ Twitch           │  │
│  └────────────────────────────┘  │
│                                  │
│  Video URL                       │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Paste your YouTube...  ✅  │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Transcribe Video (5-15m)  │  │
│  └────────────────────────────┘  │
│                                  │
│  ✨ Ready!                       │
│                                  │
│  ──────────────────────────────  │
│  💡 Shorter videos transcribe    │
│  faster                          │
│                                  │
└──────────────────────────────────┘
```

---

## MOCKUP 3: RESULTS VIEW REDESIGN

### Tab Navigation

```
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ ✅ Transcription Complete!                                   │ ║
║  │                                                              │ ║
║  │ Your video has been processed. Copy what you need below.    │ ║
║  │                                                              │ ║
║  │ Video: How to Build Habits                                 │ ║
║  │ Transcription: Whisper (base)  |  AI Content: Llama3        │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  ───────────────────────────────────────────────────────────────  ║
║                                                                    ║
║  📄 Transcript [2]  │  ✨ Social Media [4]  │  ⚙ Details [3]      ║
║  ──────────────────                                               ║
║                                                                    ║
║  Active Tab: TRANSCRIPT                                           ║
║                                                                    ║
║  📝 TRANSCRIPT                                                     ║
║  For blog posts, show notes, or documentation.                   ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ So in today's episode, we're gonna talk about building       │ ║
║  │ habits. And I know what you're probably thinking... habits   │ ║
║  │ are hard. You need willpower. You need discipline. But the   │ ║
║  │ truth is, most of what we do every day is actually          │ ║
║  │ automatic...                                                 │ ║
║  │                                 [scroll for more ↓]          │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║  [📋 Copy Transcript]                                            ║
║                                                                    ║
║  ───────────────────────────────────────────────────────────────  ║
║                                                                    ║
║  📝 WITH TIMESTAMPS                                               ║
║  Perfect for creating video captions or finding specific moments  ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ [00:00:00] So in today's episode, we're gonna talk about...  │ ║
║  │ [00:00:05] And I know what you're probably thinking...       │ ║
║  │ [00:00:12] But the truth is, most of what we do every day...│ ║
║  │                                 [scroll for more ↓]          │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║  [📋 Copy with Timestamps]                                       ║
║                                                                    ║
║  ───────────────────────────────────────────────────────────────  ║
║                                                                    ║
║  [⬇️ Export All Results]  [✨ Generate Different Version]         ║
║                          [Start Another Video →]                  ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

### Social Media Tab View

```
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ [Header - same as above]                                     │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  📄 Transcript [2]  │  ✨ Social Media [4]  │  ⚙ Details [3]      ║
║                        ──────────────────                         ║
║                                                                    ║
║  Active Tab: SOCIAL MEDIA                                         ║
║                                                                    ║
║  🎣 VIDEO HOOKS                                                    ║
║  Opening lines to grab attention on social media.                ║
║                                                                    ║
║  Hook 1                                                           ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ "What if I told you the secret to building habits isn't     │ ║
║  │  willpower—it's something far simpler?"                      │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║  [Copy Hook]                                                      ║
║                                                                    ║
║  Hook 2                                                           ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ "The neurobiologist reveals why 97% of people fail at       │ ║
║  │  habits (and what to do instead)"                            │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║  [Copy Hook]                                                      ║
║                                                                    ║
║  Hook 3                                                           ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ "If you struggle to stick with goals, listen to this—the    │ ║
║  │  answer isn't motivation, it's systems"                      │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║  [Copy Hook]                                                      ║
║                                                                    ║
║  ───────────────────────────────────────────────────────────────  ║
║                                                                    ║
║  📝 VIDEO DESCRIPTION                                             ║
║  Ready-to-use for YouTube, LinkedIn, or your blog.              ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ In this episode, we explore the science of habit formation  │ ║
║  │ and reveal the surprising truth: willpower isn't the key.   │ ║
║  │ Instead, successful people rely on systems and environmental │ ║
║  │ design to make good habits automatic...                      │ ║
║  │                                 [scroll for more ↓]          │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║  [📋 Copy Description]                                           ║
║                                                                    ║
║  ───────────────────────────────────────────────────────────────  ║
║                                                                    ║
║  #️⃣ HASHTAGS                                                       ║
║  Trending tags for Twitter, Instagram, and TikTok.              ║
║                                                                    ║
║  [#HabitBuilding] [#PersonalGrowth] [#Productivity] [#Motivation]║
║  [#SelfImprovement] [#Discipline] [#GoalSetting] [#Success]     ║
║                                                                    ║
║  [📋 Copy All Hashtags]                                          ║
║                                                                    ║
║  ───────────────────────────────────────────────────────────────  ║
║                                                                    ║
║  [⬇️ Export All Results]  [✨ Generate Different Version]         ║
║                          [Start Another Video →]                  ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

### Details Tab View (Technical)

```
┌──────────────────────────────────────────────────────────────┐
│ ⚙ KEYWORDS                                                    │
│ For SEO and content categorization.                          │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ habits, psychology, behavioral change, motivation,     │   │
│ │ discipline, goal setting, systems, success, personal   │   │
│ │ development, productivity, neuroscience, behavior       │   │
│ └────────────────────────────────────────────────────────┘   │
│ [📋 Copy Keywords]                                          │
│                                                              │
│ ──────────────────────────────────────────────────────────   │
│                                                              │
│ 🎨 IMAGE PROMPTS                                             │
│ For DALL-E, Midjourney, or Stable Diffusion.              │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ A minimalist illustration of a person with a light     │   │
│ │ bulb above their head, surrounded by circular arrows   │   │
│ │ forming a habit loop. Soft blues and purples...        │   │
│ │                         [scroll for more ↓]           │   │
│ └────────────────────────────────────────────────────────┘   │
│ [📋 Copy Prompts]                                           │
│                                                              │
│ ──────────────────────────────────────────────────────────   │
│                                                              │
│ 📁 FILENAMES                                                 │
│ Organized names for your saved transcript and files.        │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ 2026-01-12_building_habits_transcript.txt              │   │
│ │ 2026-01-12_building_habits_social_content.json         │   │
│ │ 2026-01-12_building_habits_captions.srt                │   │
│ └────────────────────────────────────────────────────────┘   │
│ [📋 Copy Filenames]                                         │
│                                                              │
│ ──────────────────────────────────────────────────────────   │
│                                                              │
│ [⬇️ Export All Results]  [✨ Generate Different Version]    │
│                         [Start Another Video →]             │
└──────────────────────────────────────────────────────────────┘
```

---

## USER FLOWS

### Prerequisites Check Flow

```
┌─────────────┐
│  App Loads  │
└──────┬──────┘
       │
       ▼
    ┌─ Check Prerequisites (silent) ─┐
    │                                 │
    │  All critical tools OK?         │
    │         ↙          ↘            │
    │       YES          NO           │
    │        │            │           │
    │        │            ▼           │
    │        │    ┌──────────────────┐│
    │        │    │ Show Modal       ││
    │        │    │                  ││
    │        │    │ [❌ FFmpeg       ││
    │        │    │  ❌ yt-dlp       ││
    │        │    │  ❌ Whisper]     ││
    │        │    │                  ││
    │        │    │ [Complete Setup] ││
    │        │    │ [Skip Anyway]    ││
    │        │    └──────────────────┘│
    │        │            │           │
    │        │      User installs     │
    │        │            │           │
    │        │            ▼           │
    │        │    ┌──────────────────┐│
    │        │    │ Check again      ││
    │        │    │ (auto-refresh)   ││
    │        │    └──────────────────┘│
    │        │            │           │
    │        └─────┬──────┘           │
    └────────────┬─────────────────────┘
                 │
                 ▼
        ┌───────────────────┐
        │ Show URL Input    │
        │ (main interface)  │
        └───────────────────┘
```

### URL Input Validation Flow

```
User Types → Real-Time Validate → Visual Feedback
                                       │
                                       ├─ Empty: No action
                                       ├─ Valid: ✓ Green
                                       └─ Invalid: ✗ Red

User Submits
    │
    ├─ If Empty → "Please enter a URL"
    ├─ If Invalid → "Doesn't look like YouTube/Twitch"
    └─ If Valid → Start Transcription
```

### Results Page Navigation Flow

```
┌─────────────────────────────────────────┐
│  Results Complete                       │
├─────────────────────────────────────────┤
│ [Transcript] │ [Social] │ [Details]     │
│  ──────────────────────                 │
│                                         │
│  Display: Full Transcript + Timestamps  │
│                                         │
├─────────────────────────────────────────┤
│  [Export All] [Generate Variant]        │
│              [Start Over]               │
└─────────────────────────────────────────┘
    ▲                       ▼
    │                       │
    │                   User clicks
    │                   "Generate Variant"
    │                       │
    │                       ▼
    │              ┌────────────────────┐
    │              │ Show model options │
    │              │ [Model A] [Model B]│
    │              └────────────────────┘
    │                       │
    │                       ▼
    │              Re-run transcription
    └───────────────with different model
```

---

## INTERACTION DETAILS

### Copy Button Lifecycle

```
STATE 1: DEFAULT
┌───────────────────┐
│ 📋 Copy Transcript│
└───────────────────┘
Background: Gray
Cursor: Pointer

        User clicks
             │
             ▼
STATE 2: COPYING
┌───────────────────┐
│ 📋 Copying...     │
└───────────────────┘
Background: Light gray
Cursor: Wait

        Clipboard write
             │
             ▼
STATE 3: COPIED
┌───────────────────┐
│ ✓ Copied!        │
└───────────────────┘
Background: Cyan
Text: Cyan
Duration: 2000ms

        Timeout
             │
             ▼
        Return to STATE 1
```

### Tab Switching Animation

```
Before Tab Switch:
─────────────────
Transcript content visible
Social tab not visible

During Switch (200ms fade):
──────────────────────────
Transcript fades out
Social fades in

After Tab Switch:
─────────────────
Social content visible
Transcript hidden (but cached in DOM)
```

### Input Validation Animation

```
INVALID ──────────────────► VALID
   │                          ▲
   │                          │
   ▼                          │
Red border (2px)      Green border (2px)
❌ icon (red)           ✓ icon (cyan)
Error text (red)        Success text (cyan)

Duration: 150ms ease-in-out
```

---

## COLOR REFERENCE

### Severity States

```
CRITICAL (Red)
- Background: rgba(239, 68, 68, 0.05)  // #EF4444 with 5% opacity
- Border: #EF4444 with 20% opacity
- Icon: #EF4444
- Text: White

DEGRADED (Yellow)
- Background: rgba(250, 204, 21, 0.05)  // #FACCB5 with 5% opacity
- Border: #FCD34D with 20% opacity
- Icon: #FCCB5
- Text: White

OPTIONAL (Purple)
- Background: rgba(189, 0, 255, 0.05)  // #BD00FF with 5% opacity
- Border: #BD00FF with 20% opacity
- Icon: #BD00FF
- Text: Cyan or white

SUCCESS (Cyan)
- Background: rgba(0, 240, 255, 0.05)
- Border: #00F0FF with 50% opacity
- Icon: #00F0FF
- Text: Cyan
```

---

**Design File**: DESIGN_SPECIFICATION.md
**Components**: PrerequisitesCheckRedesigned.tsx, URLInputRedesigned.tsx, ResultsViewRedesigned.tsx
**Status**: Ready for Integration & Testing

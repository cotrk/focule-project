---
title: Integration Guide - Redesigned Components
subtitle: Step-by-step guide to integrate the 3 new components into Focule
date: January 2026
---

# 🚀 INTEGRATION GUIDE: REDESIGNED FOCULE COMPONENTS

## Quick Start

**3 new React components are ready:**

1. `PrerequisitesCheckRedesigned.tsx` - Stealth prerequisites modal
2. `URLInputRedesigned.tsx` - Real-time URL validation input
3. `ResultsViewRedesigned.tsx` - Tabbed results organization

**Files to review:**

- `DESIGN_SPECIFICATION.md` - Complete design system, specs, and developer notes
- `VISUAL_REFERENCE.md` - ASCII mockups and user flows
- `src/components/[name]Redesigned.tsx` - React components

---

## Step 1: Review the Designs (15 min)

### For Product/Design:

1. Open `VISUAL_REFERENCE.md` - View mockups side-by-side
2. Open `DESIGN_SPECIFICATION.md` - Review design system and interaction details
3. Validate with team: "Do these address the friction points?"

### For Developers:

1. Review components in `src/components/`
2. Check Tailwind classes and CSS variables used
3. Note accessibility features (aria-labels, focus states)

---

## Step 2: Integrate into App.tsx (30 min)

### Option A: Gradual Migration (Recommended)

Replace components one at a time.

```tsx
// src/App.tsx - BEFORE
import { PrerequisitesCheck } from "./components/PrerequisitesCheck";
import { URLInput } from "./components/URLInput";
import { ResultsView } from "./components/ResultsView";

// src/App.tsx - AFTER
import { PrerequisitesCheckRedesigned } from "./components/PrerequisitesCheckRedesigned";
import { URLInputRedesigned } from "./components/URLInputRedesigned";
import { ResultsViewRedesigned } from "./components/ResultsViewRedesigned";
```

### Update App Logic

```tsx
function App() {
  const { state, startTranscription, reset } = useTranscription();
  const [showPrerequisites, setShowPrerequisites] = useState(true);
  const [prerequisitesOk, setPrerequisitesOk] = useState(false);

  // ... existing state and effects

  return (
    <div className="min-h-screen bg-[var(--focule-bg-primary)] p-6">
      <div className="max-w-4xl mx-auto">
        {/* PREREQUISITES CHECK - Redesigned */}
        {showPrerequisites && !prerequisitesOk && (
          <PrerequisitesCheckRedesigned
            onComplete={(ok) => {
              setPrerequisitesOk(ok);
              if (ok) setShowPrerequisites(false);
            }}
          />
        )}

        {/* URL INPUT - Redesigned */}
        {!showPrerequisites && state.status === "idle" && (
          <URLInputRedesigned
            onStart={handleStartTranscription}
            disabled={state.status !== "idle"}
          />
        )}

        {/* PROGRESS INDICATOR */}
        {state.status !== "idle" && state.status !== "complete" && (
          <ProgressBar label={state.message} percent={state.progress} />
        )}

        {/* RESULTS VIEW - Redesigned */}
        {state.status === "complete" && state.result && (
          <ResultsViewRedesigned
            transcript={state.result.transcript}
            transcriptWithTimestamps={state.result.transcriptWithTimestamps}
            socialContent={state.result.socialContent}
            title={state.result.title}
            whisperModel={state.result.whisperModel}
            ollamaModel={state.result.ollamaModel}
            onExport={handleExport}
            onRunAgain={() => setShowRunAgain(true)}
            onStartOver={handleStartOver}
          />
        )}

        {/* ERROR STATE */}
        {state.status === "error" && (
          <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-lg">
            <p className="text-red-400 font-medium">{state.error}</p>
            <button
              onClick={reset}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Option B: Feature Flag (For A/B Testing)

```tsx
const USE_REDESIGNED = process.env.REACT_APP_USE_REDESIGNED === "true";

{
  USE_REDESIGNED ? (
    <PrerequisitesCheckRedesigned {...props} />
  ) : (
    <PrerequisitesCheck {...props} />
  );
}
```

---

## Step 3: Component Props

### PrerequisitesCheckRedesigned

```tsx
interface PrerequisitesCheckRedesignedProps {
  onComplete?: (allRequiredInstalled: boolean) => void;
}

<PrerequisitesCheckRedesigned
  onComplete={(ok) => {
    if (ok) moveToNextStep();
  }}
/>;
```

### URLInputRedesigned

```tsx
interface URLInputRedesignedProps {
  onStart: (url: string) => void;
  disabled?: boolean;
}

<URLInputRedesigned
  onStart={(url) => startTranscription(url)}
  disabled={isProcessing}
/>;
```

### ResultsViewRedesigned

```tsx
interface ResultsViewRedesignedProps {
  transcript: string;
  transcriptWithTimestamps: string;
  socialContent?: SocialContent;
  title: string;
  videoPath?: string;
  whisperModel?: string;
  ollamaModel?: string;
  onExport?: () => void;
  onRunAgain?: () => void;
  onStartOver?: () => void;
}

<ResultsViewRedesigned
  transcript={result.transcript}
  transcriptWithTimestamps={result.transcriptWithTimestamps}
  socialContent={result.socialContent}
  title={result.title}
  whisperModel="base"
  ollamaModel="llama3"
  onExport={() => handleExport()}
  onRunAgain={() => setShowRunAgain(true)}
  onStartOver={() => reset()}
/>;
```

---

## Step 4: Testing Checklist

### Functionality Testing

- [ ] Prerequisites modal shows when tools missing
- [ ] Prerequisites modal hides when all tools installed
- [ ] URL input validates in real-time
- [ ] URL input shows appropriate error/success messages
- [ ] Copy buttons work on all browsers
- [ ] Tab switching updates content
- [ ] Export button triggers dialog
- [ ] "Run Again" button restarts flow
- [ ] "Start Over" clears results

### Accessibility Testing

- [ ] Tab navigation works (keyboard-only users)
- [ ] Focus indicators visible on all interactive elements
- [ ] Color contrast passes WCAG AA (4.5:1 minimum)
- [ ] Screen reader announces all text
- [ ] Forms have associated labels
- [ ] Error messages linked to inputs
- [ ] All images/icons have alt text or aria-labels

### Visual Testing

- [ ] Mobile view (375px): no horizontal scroll, touch targets 44px+
- [ ] Tablet view (768px): proper spacing and alignment
- [ ] Desktop view (1024px): max-width respected
- [ ] Animations smooth (60fps, no jank)
- [ ] Colors match design spec
- [ ] Typography matches (Montserrat for headings, Lato for body)

### Performance Testing

- [ ] Component re-renders only when props change
- [ ] No memory leaks (check DevTools)
- [ ] Copy-to-clipboard doesn't block UI
- [ ] Tab switching <100ms

### Browser Support

- [ ] Chrome/Edge v100+
- [ ] Firefox v95+
- [ ] Safari v15+
- [ ] Mobile Safari (iOS 14+)
- [ ] Chrome Mobile (Android 11+)

---

## Step 5: Deployment

### Environment Setup

```bash
# 1. Install dependencies (if new ones added)
npm install

# 2. Build and test
npm run build

# 3. Run locally
npm run dev

# 4. Manual testing in Electron
npm run dev  # Opens app in dev mode
```

### Code Review Checklist

- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Props properly typed
- [ ] Accessibility features included
- [ ] Error handling for edge cases
- [ ] Performance optimized (no unnecessary re-renders)

### Staging Deploy

```bash
# Build production bundle
npm run build

# Test in staging environment
# Visit: https://staging.focule.app

# Verify:
# - Load times acceptable
# - Mobile experience works
# - Export functionality works
# - Analytics tracking works (if applicable)
```

### Production Deploy

```bash
# Create release tag
git tag -a v1.1.0 -m "UI/UX redesign: Top 3 friction points"
git push origin v1.1.0

# Build and deploy
npm run build
# ... deploy via your CI/CD pipeline

# Monitor:
# - Error rates (Sentry/Rollbar)
# - User feedback
# - Performance metrics
```

---

## Step 6: Post-Launch Monitoring

### Analytics to Track

```javascript
// Track component interactions
mixpanel.track("Prerequisites_Shown", { tool_count: 3 });
mixpanel.track("URL_Validated", { is_valid: true });
mixpanel.track("Results_Tab_Switched", { tab: "social" });
mixpanel.track("Copy_Button_Clicked", { content_type: "transcript" });
```

### Metrics to Monitor

- **Prerequisites Modal**: Dismissal rate, completion rate
- **URL Input**: Validation success rate, error frequency
- **Results Page**: Tab click distribution (which tabs are used most?)
- **Copy Buttons**: Click-through rate, time-to-copy
- **Overall**: User satisfaction, support ticket volume

### Rollback Plan

If issues discovered:

```bash
# Revert to previous version
git revert HEAD
npm run build
# Deploy previous version
```

---

## Step 7: Iterate Based on User Feedback

### Feedback Collection (Week 1-2)

1. **Hallway Testing** (3-5 users, 15 min each)

   - Task: "Transcribe a YouTube video"
   - Observe: Where do they get stuck?
   - Note: Any confusing language?

2. **In-App Feedback Widget**

   ```
   "How was your experience?" [😞] [😐] [😊]
   ```

3. **Analytics Review**
   - Which tab is most clicked on results page?
   - How many users skip prerequisites?
   - What's the error rate on URL input?

### Iteration Priorities

1. **High Impact**: Issues blocking core functionality

   - Example: "Copy button doesn't work on Safari"
   - Fix Timeline: Same day

2. **Medium Impact**: UX friction that causes confusion

   - Example: "Users don't understand what 'Ollama' is"
   - Fix Timeline: 1-2 weeks

3. **Low Impact**: Polish and micro-interactions
   - Example: "Toast animation could be smoother"
   - Fix Timeline: Next sprint

---

## Troubleshooting

### Issue: "Prerequisites modal shows even after setup"

**Solution**: Clear localStorage

```javascript
localStorage.removeItem("skipPrerequisitesCheck");
location.reload();
```

### Issue: "URL input validation not working"

**Solution**: Check regex patterns

```javascript
const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;
console.log(youtubePattern.test("https://youtube.com/watch?v=...")); // Should be true
```

### Issue: "Copy button not copying in Firefox"

**Solution**: Use modern clipboard API

```javascript
// Use navigator.clipboard.writeText() - supported in all modern browsers
navigator.clipboard
  .writeText(content)
  .then(() => console.log("Copied!"))
  .catch((err) => console.error("Copy failed:", err));
```

### Issue: "Tabs not switching on mobile"

**Solution**: Check event handling

```javascript
// Ensure onClick handler is on button, not parent div
<button onClick={() => setActiveTab("social")}>{/* content */}</button>
```

---

## Next Steps (Optional Enhancements)

### Phase 2: Error States & Edge Cases

- [ ] Design error states (network failure, API down)
- [ ] Add retry logic with exponential backoff
- [ ] Show helpful error messages with recovery steps

### Phase 3: Settings Panel Reorganization

- [ ] Move model selection to results page (quick access)
- [ ] Add guided setup for new users
- [ ] Simplify settings to 3 main options

### Phase 4: Micro-interactions & Polish

- [ ] Add success confetti animation
- [ ] Add subtle audio feedback (optional)
- [ ] Add keyboard shortcuts (Cmd+C, etc.)
- [ ] Add dark/light theme toggle

### Phase 5: Advanced Features

- [ ] Batch processing (multiple videos)
- [ ] Video preview with scrubber
- [ ] Search within transcript
- [ ] Export to multiple formats

---

## Files Created

```
src/components/
├── PrerequisitesCheckRedesigned.tsx    (450 lines)
├── URLInputRedesigned.tsx               (380 lines)
└── ResultsViewRedesigned.tsx            (520 lines)

Documentation/
├── DESIGN_SPECIFICATION.md              (1200+ lines)
├── VISUAL_REFERENCE.md                  (800+ lines)
└── INTEGRATION_GUIDE.md                 (this file)

Total New Code: ~2,500 lines of React + docs
```

---

## Support & Questions

**For Design Questions:**

- Review `DESIGN_SPECIFICATION.md` section on the component
- Check `VISUAL_REFERENCE.md` for mockups
- Refer to design system tokens at bottom of spec

**For Development Questions:**

- Component code is well-commented with context
- Props are fully typed with JSDoc comments
- Check "Troubleshooting" section above

**For User Feedback:**

- Implement analytics tracking (see "Post-Launch Monitoring")
- Conduct A/B testing if doing gradual rollout
- Iterate based on user data, not assumptions

---

**Status**: ✅ Complete & Ready for Integration
**Estimated Integration Time**: 2-4 hours
**Estimated Testing Time**: 1-2 days
**Go-Live Timeline**: 1-2 weeks

Questions? Check DESIGN_SPECIFICATION.md or VISUAL_REFERENCE.md first! 🚀

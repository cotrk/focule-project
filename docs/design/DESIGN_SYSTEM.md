# 🎨 Design System & UI Components

> Complete design system for Focule Video Transcriber

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Target Audience:** Designers, Frontend Developers

---

## 🎯 Design Philosophy

Focule's design system prioritizes **clarity**, **efficiency**, and **professionalism** for content creators and professionals who need to transform video into actionable insights.

### Core Principles

1. **Progressive Disclosure** - Show only what's necessary, reveal complexity when needed
2. **Cognitive Load Reduction** - Organize information hierarchically to prevent overwhelm
3. **Action Clarity** - Primary actions are obvious, secondary actions are accessible
4. **Professional Aesthetics** - Clean, modern interface that respects user intelligence
5. **Accessibility First** - WCAG 2.1 AA compliance as baseline requirement

---

## 🎨 Visual Identity

### Color Palette

| Color | Hex | Usage | Purpose |
|-------|-----|-------|---------|
| **Electric Cyan** | `#00F0FF` | Primary actions, highlights | Calls attention, indicates interactivity |
| **Void Purple** | `#BD00FF` | Accents, gradients | Visual interest, brand recognition |
| **Ore Black** | `#0B0B0D` | Background | Professional foundation, reduces eye strain |
| **Surface** | `#161618` | Cards, elevated surfaces | Content separation, depth |
| **Text Primary** | `#FFFFFF` | Primary text | Maximum readability |
| **Text Secondary** | `#A0A0A0` | Secondary text | Hierarchy, metadata |

### Brand Gradient

```css
background: linear-gradient(135deg, #00F0FF 0%, #BD00FF 100%);
```

**Usage:** Hero sections, major CTAs, brand elements

---

## 📐 Typography

### Font Stack

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| **Headings** | Montserrat | Bold/ExtraBold | Page titles, section headers |
| **Body Text** | Lato | Light/Regular/Bold | Content, descriptions |
| **UI Elements** | Nunito Sans | Light/Regular/SemiBold | Buttons, labels, controls |

### Type Scale

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **H1** | 2.5rem | ExtraBold | 1.2 | Page titles |
| **H2** | 2rem | Bold | 1.3 | Section headers |
| **H3** | 1.5rem | Bold | 1.4 | Component titles |
| **Body** | 1rem | Regular | 1.6 | Main content |
| **Small** | 0.875rem | Regular | 1.5 | Metadata, captions |
| **UI Label** | 0.875rem | SemiBold | 1.4 | Buttons, controls |

---

## 🧩 Component Library

### 🎯 Primary Actions

#### Button Primary
```tsx
<button className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200">
  Primary Action
</button>
```

**Usage:** Main CTAs, start processing, export actions

#### Button Secondary
```tsx
<button className="bg-surface text-text-primary px-4 py-2 rounded-lg font-medium hover:bg-surface-hover transition-colors">
  Secondary Action
</button>
```

**Usage:** Alternative actions, settings, advanced options

---

### 📊 Cards & Containers

#### Surface Card
```tsx
<div className="bg-surface rounded-xl p-6 border border-surface-border">
  <h3 className="text-xl font-bold mb-4">Card Title</h3>
  <p className="text-text-secondary">Card content goes here</p>
</div>
```

**Usage:** Content sections, results display, settings panels

#### Interactive Card
```tsx
<div className="bg-surface rounded-xl p-6 border border-surface-border hover:border-cyan-500/50 transition-all duration-200 cursor-pointer">
  <!-- Content -->
</div>
```

**Usage:** Selectable items, hover states, interactive elements

---

### 📝 Input Components

#### Text Input
```tsx
<input 
  type="text" 
  className="w-full bg-surface border border-surface-border rounded-lg px-4 py-3 text-text-primary placeholder-text-secondary focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
  placeholder="Enter URL..."
/>
```

#### Select Dropdown
```tsx
<select className="w-full bg-surface border border-surface-border rounded-lg px-4 py-3 text-text-primary focus:border-cyan-500 focus:outline-none">
  <option>Option 1</option>
</select>
```

---

### 📈 Progress & Status

#### Progress Bar
```tsx
<div className="w-full bg-surface rounded-full h-2">
  <div className="bg-gradient-to-r from-cyan-500 to-purple-600 h-2 rounded-full transition-all duration-300" style={{width: '60%'}}></div>
</div>
```

#### Status Indicators
```tsx
<!-- Processing -->
<div className="flex items-center gap-2">
  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
  <span className="text-sm text-text-secondary">Processing...</span>
</div>

<!-- Complete -->
<div className="flex items-center gap-2">
  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
  <span className="text-sm text-text-secondary">Complete</span>
</div>
```

---

### 📋 Tab System

#### Primary Tabs
```tsx
<div className="flex border-b border-surface-border mb-6">
  <button className="px-6 py-3 font-medium text-cyan-500 border-b-2 border-cyan-500">
    Active Tab
  </button>
  <button className="px-6 py-3 font-medium text-text-secondary hover:text-text-primary transition-colors">
    Inactive Tab
  </button>
</div>
```

**Usage:** Results view, settings sections, multi-step processes

---

## 🎭 Interactive States

### Hover Effects
```css
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 240, 255, 0.1);
}
```

### Focus States
```css
.focus-ring {
  transition: outline 0.2s ease;
}

.focus-ring:focus {
  outline: 2px solid #00F0FF;
  outline-offset: 2px;
}
```

### Loading States
```tsx
<div className="animate-pulse">
  <div className="h-4 bg-surface rounded mb-2"></div>
  <div className="h-4 bg-surface rounded w-3/4"></div>
</div>
```

---

## 📱 Responsive Design

### Breakpoints
| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| **Mobile** | 320px | Basic layout, stacked elements |
| **Tablet** | 768px | Side-by-side layouts, enhanced navigation |
| **Desktop** | 1024px | Full layout, multi-column designs |
| **Large** | 1440px | Optimized for large screens |

### Mobile Adaptations
- **Touch Targets:** Minimum 44px tap targets
- **Navigation:** Bottom sheet modals, slide-out menus
- **Content:** Single column, prioritized information

---

## ♿ Accessibility Standards

### WCAG 2.1 AA Compliance

#### Color Contrast
- **Normal Text:** 4.5:1 minimum contrast ratio
- **Large Text:** 3:1 minimum contrast ratio
- **Interactive Elements:** 3:1 minimum contrast ratio

#### Keyboard Navigation
- **Tab Order:** Logical, predictable navigation
- **Focus Indicators:** Visible, high-contrast focus states
- **Shortcuts:** Keyboard shortcuts for power users

#### Screen Reader Support
- **Semantic HTML:** Proper heading hierarchy, landmark elements
- **ARIA Labels:** Descriptive labels for custom components
- **Announcements:** Dynamic content changes announced

---

## 🎪 Animation Guidelines

### Micro-interactions
```css
.micro-interaction {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.micro-interaction:hover {
  transform: scale(1.02);
}

.micro-interaction:active {
  transform: scale(0.98);
}
```

### Page Transitions
```css
.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 🔧 Implementation Guidelines

### CSS Architecture
```css
/* Base styles */
.btn {
  /* Base button styles */
}

/* Modifiers */
.btn--primary {
  /* Primary button styles */
}

.btn--secondary {
  /* Secondary button styles */
}

/* States */
.btn:hover {
  /* Hover styles */
}

.btn:focus {
  /* Focus styles */
}
```

### TypeScript Props
```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}
```

---

## 📚 Component Usage Examples

### Results View Redesign
The new ResultsViewRedesigned component demonstrates our design principles:

1. **Three-Tier Hierarchy:** Transcript (primary), Social Media (secondary), Technical (tertiary)
2. **Tab Organization:** Reduces cognitive load
3. **Clear Actions:** Export (primary), Generate Variants (secondary), Start Over (tertiary)
4. **Professional Formatting:** Clean, readable transcript display

### Dynamic Tips System
Educational content during processing states:
- **Engagement:** Keeps users informed during long operations
- **Education:** Teaches about the underlying technology
- **Brand Building:** Reinforces Focule's value proposition

---

## 🔍 Design Tokens

### Spacing Scale
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
```

### Border Radius
```css
--radius-sm: 0.25rem;  /* 4px */
--radius-md: 0.5rem;   /* 8px */
--radius-lg: 0.75rem;  /* 12px */
--radius-xl: 1rem;     /* 16px */
```

---

## 🎯 Design Review Checklist

### Before Implementation
- [ ] Does this follow our hierarchy principles?
- [ ] Is the cognitive load appropriate for the context?
- [ ] Are primary actions clearly distinguished?
- [ ] Does it meet accessibility standards?

### After Implementation
- [ ] Are all interactive states defined?
- [ ] Is responsive behavior tested?
- [ ] Are animations performant?
- [ ] Is keyboard navigation functional?

---

## 🔗 Related Documentation

- [User Flows](./USER_FLOWS.md) - User journey and interaction patterns
- [Accessibility Guide](./ACCESSIBILITY.md) - Detailed accessibility requirements
- [Component Library](../development/API_REFERENCE.md) - Technical implementation details

---

## 📞 Design Support

**Design Questions:** Contact design team  
**Implementation Issues:** Create GitHub issue with `design` label  
**Component Requests:** Submit design brief with use case

---

*Last Updated: January 2026 • Version 1.0.0*

# Nored - AI Menstrual Cycle Tracker

Nored is a French-language web application for tracking menstrual cycles with AI-powered analysis and predictions. It's a Progressive Web App (PWA) with a custom component architecture.

## Architecture Overview

-   **Frontend**: Vanilla JavaScript with custom web components
-   **Backend**: Minimal Express.js static file server (`src/server.js`) (no need to run manually)
-   **Styling**: SCSS compiled to CSS (done automatically, no need to run manually)
-   **External Dependencies**: NoSuite authentication system, AI service, cloud storage
-   **Target**: Mobile-first design (shows warning on desktop)

### Naming Conventions

-   **Classes**: PascalCase (`MainApp`, `CalendarPage`, `CustomElement`)
-   **Variables/Constants**: snake_case (`analysis_button`, `next_period_date`, `days_since_last_entry`)
-   **DOM IDs**: kebab-case (`analysis-clock`, `cycle-start-date`, `menu-back`)
-   **CSS Classes**: kebab-case (`.cycle-graph`, `.panel-wrapper`, `.clock-content`)
-   **Component Methods/Functions**: camelCase (`analyzeCycleData`, `getDayTile`, `showCycleDetails`)

## Component Architecture

All UI components extend `CustomElement` (from external `utils.js`):

```javascript
class ComponentName extends CustomElement {
	constructor() {
		super();
		this.whenReady(() => {
			this.innerHTML = html`<!-- Component inner HTML goes here -->`;
		});
	}
}

defineComponent(html`<component-name />`);
```

### Key Components

-   `main-app`: Root component, orchestrates data flow and AI analysis
-   `calendar-page`: Main calendar view with menstrual data input
-   `analysis-page`: AI-powered cycle analysis and predictions
-   `calendar-month`: Individual month grid with day tiles
-   `basic-panel`: Reusable UI panel component

## Critical Patterns

### Data Storage

-   Monthly data stored as `{year}-{month}.json` via `STORAGE.read/write`
-   AI analysis cached in localStorage with date validation
-   Data format: `{date: {flow: 0-4, pain: 0-4}}`

### AI Integration

The app heavily relies on AI analysis with specific prompt patterns:

-   Main analysis: Generates cycle predictions, ovulation dates, health insights
-   Daily analysis: Current phase, pregnancy probability/risk
-   Chat assistant: Answers menstrual health questions

AI responses use XML-like tags: `<cycle-analysis>`, `<next-cycles>`, `<next-ovulation>`

### DOM Utilities

-   `$(selector)`: querySelector shorthand
-   `$$(selector)`: querySelectorAll shorthand
-   `html`: Tag function for template literals (does nothing, just for syntax highlighting)
-   `delay(ms)`: Promise-based timeout
-   `body_class`: document.body.classList shorthand

### Calendar Data Flow

1. `calendar-month` loads monthly data from storage
2. User interactions update day tiles with `user-flow`/`user-pain` attributes
3. `main-app.analyzeCycleData()` processes all entries for AI analysis
4. AI predictions add `ai-flow`/`ai-pain` attributes and `ai-ovulation` classes

## Development Workflow

### Build Commands

```bash
npm start          # Production server (port 8016)
npm run dev        # Development with nodemon
npm run scss       # Watch SCSS compilation
npm run kill       # Kill process on port 8016
```

### File Structure

-   `public/scripts/components/`: All component files
-   `public/scss/`: SCSS source files (compiled to `public/css/`)
-   `public/css/`: Compiled CSS (don't edit directly)
-   `src/server.js`: Express server

## Key Conventions

-   **French Language**: All UI text, AI prompts, and user-facing content in French
-   **Mobile-First**: Responsive design prioritizing mobile experience
-   **Async Patterns**: Heavy use of async/await for AI calls and data operations
-   **Event-Driven**: Custom events for component communication (`date-selected`, `ready`)
-   **Attribute-Based Styling**: Components use data attributes for CSS styling
-   **Vibration Feedback**: `navigator.vibrate?.()` for tactile feedback on interactions

## Integration Points

-   **NoSuite Auth**: External authentication system via `account.nosuite.fr`
-   **AI Service**: Custom AI.generate() function for cycle analysis
-   **Cloud Storage**: STORAGE API for cross-device data sync
-   **Material Icons**: Google Material Symbols for UI icons

## Development Notes

-   Components self-register with `defineComponent()`
-   Use `this.whenReady()` for component initialization
-   Data changes trigger `clearAnalysisData()` to invalidate AI cache
-   Weather metaphors used for cycle visualization (sunny=no period, rainy=heavy flow)
-   Cycle analysis includes statistical calculations (averages, standard deviation)

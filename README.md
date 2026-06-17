# Reflection Coach

An AI-powered reflective practice tool that guides structured coaching conversations — not a chatbot, but a dialogue system built around established reflective frameworks.

## What it does

Reflection Coach runs a four-stage session (Context → Questioning → Insights → Actions) and uses Claude to ask one targeted question at a time. The AI tracks where you are in the reflection process, adapts its questioning strategy based on the depth of your responses, and manages time so sessions close with concrete actions rather than drifting.

At the end of a session, you can export a structured Markdown summary: context, key analysis, reflection level achieved, any deep topics flagged for future sessions, and a dated action plan.

## The methodology

The questioning logic is built on three established frameworks:

- **Gibbs Reflective Cycle** — moves from description through feelings and evaluation to analysis and action
- **Driscoll's What / So What / Now What** — drives from event to meaning to behaviour change
- **Reflective Practice Iceberg Model** — distinguishes three levels of reflection:
  - *Technical* (describing what happened)
  - *Practical* (examining thinking and intention)
  - *Critical* (surfacing assumptions, values, taken-for-granted beliefs)

The system classifies each user response into one of these three levels using keyword markers, then adjusts its prompt strategy accordingly. A response that stays at the technical level triggers a push toward practical. A practical response triggers a push toward critical. The coach only moves to insights and action planning once there is evidence of critical-level engagement.

This is the core design decision: the AI is not answering questions, it is holding a process. The frameworks determine which question to ask next, not a general-purpose conversation model.

### Deep topic detection

The system monitors for language markers associated with identity, trauma, fear, or grief. When detected, it acknowledges the topic explicitly, flags it for a separate dedicated session, and does not attempt to resolve it within the current conversation. This boundary — knowing what a 20-minute structured reflection session should not try to do — is deliberate.

### Time management

Sessions have a configurable target duration (15 / 20 / 30 / 45 minutes). The system tracks elapsed time and applies wrap-up logic at 80% of the target: the AI begins transitioning toward closure rather than opening new threads. At 90%, a "Wrap Up" control appears so the user can force synthesis. This prevents the common failure mode where reflection conversations run long and never produce action.

## AI integration

The app calls the Anthropic Claude API directly from the browser (`claude-sonnet-4-20250514`). Each request sends:

- A stage-specific system prompt containing the relevant framework instructions and behavioural constraints
- The full conversation history as the `messages` array
- A snapshot of the current session state (elapsed time, exchange count, detected reflection level, flagged deep topics)

There is no backend. Nothing is stored beyond the browser session.

The system prompt is generated fresh on every exchange — it reflects the current stage, time position, detected reflection level, and any wrap-up signals. This means the AI behaviour shifts progressively across a session without any fine-tuning or retrieval layer.

## Who it's for

Built primarily for coaches and practitioners who want to run structured self-reflections between supervision sessions. Also useful for anyone who has a coaching or professional reflective practice and finds free-form journaling too unstructured to produce insight.

The ICF / EMCC / AC coaching standards framing in the system prompt means the AI's questioning approach maps to professional coaching practice rather than therapy or mentoring.

## Stack

- React 19 + Vite
- Tailwind CSS
- Lucide React icons
- Anthropic Claude API (direct browser fetch)

No database, no auth, no backend.

## Running it

```bash
npm install
npm run dev
```

The app expects an Anthropic API key. Because this runs entirely in the browser, you will need to either add your key directly to the fetch headers in `src/App.jsx` for local use, or proxy the API call through a lightweight server if deploying publicly.

## Session export

The Export button generates a Markdown file containing the full conversation, detected reflection level, any deep topics identified, and the action plan. Filename format: `reflection-YYYY-MM-DD.md`.

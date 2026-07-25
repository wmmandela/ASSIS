# ASSIS: AI-Powered Student Support Information System

ASSIS combines a Django + Django REST Framework backend with a React + Tailwind frontend. The chatbot is included, but the main product is a broader AI ecosystem for recommendations, academic risk prediction, semantic knowledge search, sentiment analysis, and proactive student support.

## Setup
```bash
cd "/Users/macheraweine/Documents/ASSIS"
python3 -m venv venv
venv/bin/pip install --upgrade pip
venv/bin/pip install -r requirements.txt
npm install
```

## Run
Backend:
```bash
cd "/Users/macheraweine/Documents/ASSIS"
venv/bin/python manage.py runserver 127.0.0.1:8000
```

Frontend:
```bash
cd "/Users/macheraweine/Documents/ASSIS"
npm run dev
```

Open the React dashboard at `http://127.0.0.1:5173`.

## PostgreSQL
SQLite is used by default for local development. To use PostgreSQL, set:

```bash
export POSTGRES_DB=assis
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=your_password
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
```

## API
- `GET /api/status/`
- `GET /api/students/`
- `GET /api/recommendations/?student_id=S1001`
- `GET /api/risk/`
- `POST /api/risk/`
- `GET /api/knowledge-search/?q=tutoring`
- `POST /api/sentiment/`
- `POST /api/chatbot/`

## AI Layer
- Recommendation engine: profile-to-course/resource scoring using vector similarity and student success rules.
- Academic risk prediction: interpretable early-alert scoring from attendance, grades, activity, assignments, GPA, and wellbeing.
- Intelligent knowledge search: semantic-style vector retrieval over institutional documents with generated summaries.
- Sentiment analysis: feedback classification with issue trend extraction.
- Chatbot: retrieves and summarizes knowledge-base results instead of operating as the only AI feature.

The code is structured so production models can replace the local fallbacks:
- OpenAI API for chatbot response generation.
- scikit-learn, pandas, and NumPy for trained recommendation/risk pipelines.
- sentence-transformers + FAISS or ChromaDB for document embeddings.
- Hugging Face transformers for local sentiment models.

## Requirements
- `requirements.txt` is included.

## Universal Design (UD) Implementation

The frontend (`src/main.jsx`, `src/styles.css`, `index.html`) has been updated to follow all seven Universal Design principles:

| # | Principle | Implementation |
|---|-----------|---------------|
| 1 | **Equitable Use** | Skip-navigation link in `index.html` so keyboard-only and screen-reader users can jump directly to main content |
| 2 | **Flexibility in Use** | `prefers-reduced-motion` CSS media query disables animations; all features work with keyboard, mouse, or touch |
| 3 | **Simple & Intuitive Use** | Explicit `<label>` elements for all form inputs; plain-language headings and button labels; consistent tab-panel layout |
| 4 | **Perceptible Information** | ARIA landmark roles (`banner`, `main`, `navigation`, `contentinfo`); `role="tablist"` / `role="tab"` / `role="tabpanel"` for the sidebar nav; `role="progressbar"` with `aria-valuenow/min/max/valuetext` on progress bars; `<dl>/<dt>/<dd>` for stat cards; hidden live region for dynamic announcements |
| 5 | **Tolerance for Error** | Error notices use `role="alert"` (assertive); status notices use `role="status"` (polite); loading state announced to screen readers; no destructive defaults |
| 6 | **Low Physical Effort** | Arrow-key navigation between tabs; Enter key submits search/chatbot inputs; minimum 44 × 44 px touch targets enforced in CSS; `:focus-visible` ring on all interactive elements |
| 7 | **Size & Space for Approach and Use** | Responsive CSS grid (single-column on mobile, multi-column on desktop); minimum touch targets via CSS; adequate spacing throughout |

### Key files changed
- `index.html` — `lang="en"`, `<meta name="description">`, skip link
- `src/styles.css` — skip-link styles, `.sr-only` utility, focus ring, `prefers-reduced-motion`, `forced-colors` support, 44px touch targets
- `src/main.jsx` — landmark roles, ARIA attributes, keyboard navigation, live region, semantic HTML (`<ul>/<li>`, `<dl>/<dt>/<dd>`, `<article>`, `<section>`, `<header>`, `<footer>`, `<nav>`, `<main>`)

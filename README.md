# ASSIS: AI-Powered Student Support Information System

ASSIS is a comprehensive, accessible student support platform combining a **Django + Django REST Framework** backend with a modern **React + Vite + Tailwind CSS** frontend.

Beyond standard student management, ASSIS delivers an AI-driven academic ecosystem featuring personalised course & activity recommendations, interpretable early-alert risk prediction, semantic knowledge search, sentiment analysis, text-to-speech accessibility, and an automated email notification subsystem.

---

## Key Features

- **Personalised AI Recommendations**: Profile-to-course and optional activity scoring using vector similarity, academic level matching, and student success rules.
- **Academic Risk Prediction**: Interpretable early-alert scoring based on attendance, assignment submissions, grades, activity levels, GPA, and student wellbeing indicators.
- **Semantic Knowledge Search & AI Assistant**: Natural language document search over institutional policies and resources with concise AI-generated summaries.
- **Text-to-Speech Overview Reader**: Built-in Web Speech API voice synthesis enabling audio reading of dashboard overviews, announcements, and key content.
- **Course & Timetable Management**: Seamless unit enrollment, non-clashing section allocation, unit dropping, and interactive timetable grid rendering.
- **Admin Portal & Analytics**: Staff dashboard for assignment management, student risk filtering, grade entries, and event publishing.
- **Automated Email Notifications**: Gmail SMTP integration (with dev console fallback) for automated risk alerts, grade dispatches, and event notifications.
- **Universal Design (UD) & Accessibility**: Built from the ground up following all 7 Universal Design principles, WCAG standards, ARIA landmark roles, screen reader support, and cross-platform keyboard shortcuts (including macOS `⌥ Option` key support).

---

## Tech Stack & Architecture

- **Backend**: Python 3.14+, Django 6.0+, Django REST Framework, CORS Headers
- **Frontend**: React 18+, Vite, Tailwind CSS, Web Speech API
- **Database**: SQLite3 (default for local development) or PostgreSQL
- **AI/ML Layer**: NumPy, scikit-learn, vector similarity matching, fallback pipeline modularity for OpenAI / Hugging Face integrations

---

## Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/wmmandela/ASSIS.git
cd ASSIS

# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt

# Install Frontend dependencies
npm install
```

---

## Running the Application

### 1. Backend Server (Django)
```bash
# Run migrations & start Django development server
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```
Backend API will be live at `http://127.0.0.1:8000/api/`

### 2. Frontend Development Server (Vite)
```bash
# Start Vite development server
npm run dev
```
Open your browser and navigate to `http://127.0.0.1:5173/`

---

## Environment Variables & Configuration

### PostgreSQL (Optional)
To switch from local SQLite to PostgreSQL, configure the following environment variables:

```bash
export POSTGRES_DB=assis
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=your_password
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
```

### Email Notifications (Gmail SMTP)
By default, emails log to the development terminal console (`console.EmailBackend`). To enable live Gmail SMTP dispatch:

```bash
export EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
export EMAIL_HOST=smtp.gmail.com
export EMAIL_PORT=587
export EMAIL_USE_TLS=True
export EMAIL_HOST_USER=your_email@gmail.com
export EMAIL_HOST_PASSWORD=your_app_password
```

---

## API Reference

### Authentication & User Profile
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Register a new student/user account |
| `POST` | `/api/auth/login/` | Log in and obtain session |
| `POST` | `/api/auth/logout/` | Log out user |
| `GET` | `/api/me/` | Retrieve current authenticated user profile |

### AI Engine & Analytics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/recommendations/?student_id=S1001` | Profile-tailored course & activity recommendations |
| `GET` / `POST` | `/api/risk/` | Retrieve or recalculate student academic risk scores |
| `GET` | `/api/knowledge-search/?q=query` | Natural language knowledge search with AI summary |
| `POST` | `/api/sentiment/` | Classify feedback sentiment & extract issue trends |
| `POST` | `/api/chatbot/` | Query the AI assistant for contextual student support |

### Course & Timetable Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/units/` | List available units |
| `GET` | `/api/units/recommendations/` | Level-tailored unit recommendations |
| `POST` | `/api/units/enroll/` | Enroll in a unit (auto-allocates non-clashing section) |
| `POST` | `/api/units/drop/` | Drop an enrolled unit |
| `GET` | `/api/timetable/` | Retrieve weekly schedule and timetable grid |

### Staff / Admin Portal
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/overview/` | Staff dashboard overview metrics & risk counts |
| `POST` | `/api/admin/grade-student/` | Update overall student grade |
| `POST` | `/api/admin/grade-item/` | Grade individual assignment submission |
| `POST` | `/api/admin/add-assignment/` | Publish new course assignment |
| `POST` | `/api/admin/add-event/` | Publish new campus/academic event |

---

## Universal Design (UD) & Accessibility Implementation

ASSIS implements all seven Universal Design principles to guarantee full accessibility for diverse learners, keyboard-only users, screen readers, and motor/sensory impairments:

| # | Principle | Technical Implementation |
|---|-----------|--------------------------|
| 1 | **Equitable Use** | Skip-navigation link in `index.html` allowing keyboard and screen-reader users to bypass top navigation. |
| 2 | **Flexibility in Use** | `prefers-reduced-motion` media queries disable complex animations; full support for keyboard, mouse, and touch interactions. |
| 3 | **Simple & Intuitive Use** | Plain-language UI labels, clear form inputs with explicit `<label>` bindings, and consistent tabbed layout. |
| 4 | **Perceptible Information** | ARIA landmark roles (`banner`, `main`, `navigation`, `contentinfo`), `role="tablist"`/`tabpanel` pattern, dynamic live announcements, and high contrast ratios (`forced-colors` support). |
| 5 | **Tolerance for Error** | Non-destructive defaults, ARIA alert regions (`role="alert"` / `role="status"`), and explicit confirmation for unit drops. |
| 6 | **Low Physical Effort** | Full keyboard shortcuts (including macOS `⌥ Option` physical key code matching), minimum 44×44px touch targets, and focus indicator rings (`:focus-visible`). |
| 7 | **Size & Space for Approach and Use** | Responsive CSS grid (single-column mobile, multi-column desktop), flexible typography, and adaptive spacing. |

### Keyboard Shortcuts
- `Tab` / `Shift + Tab`: Navigate interactive controls
- `Enter` / `Space`: Activate buttons and select tabs
- `⌥ Option + 1-8` (macOS) / `Alt + 1-8`: Quick tab navigation across dashboard views
- `Esc`: Close modals and popovers

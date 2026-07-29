# ASSIS: Human-Computer Interaction (HCI) & Universal Design Documentation

---

## 1. System Overview: What ASSIS Does

**ASSIS** (*AI-Powered Student Support Information System*) is a modern, web-based intelligent academic ecosystem engineered to empower university students and administrative staff. Rather than acting as a standard static portal, ASSIS integrates a predictive AI layer with user-centered interaction design to deliver proactive, personalized support throughout a student's academic journey.

```
                  ┌─────────────────────────────────────────┐
                  │          ASSIS Frontend SPA             │
                  │   (React 19 + Tailwind CSS + Lucide)    │
                  └────────────────────┬────────────────────┘
                                       │ REST / Session Auth
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │         Django REST Backend API         │
                  └────────────────────┬────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
 ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
 │ AI Recommendation   │    ┌ Academic Risk Engine│    │ Intelligent Search  │
 │ (Program & Level)   │    │ (Early Interventions│    │ (Single-Answer QA)  │
 └─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### Core System Features:
1. **Personalized Course & Degree Tracking**: Dynamically labels and filters academic content based on the student's specific degree program (*Data Science*, *Cybersecurity*, *AI & Robotics*, *Information Systems*, *Software Engineering*).
2. **Student-Independent Activity Recommendations**: Generates tailored optional school activities, seminars, and tutoring labs scored specifically by academic level (Years 1–4) and progress status (GPA, attendance, risk indicators).
3. **Interactive Timetable & Conflict Resolution Engine**: Real-time schedule layout with automated collision detection to prevent time overlap between enrolled class sections.
4. **Focused Single-Answer Knowledge Search**: Vector-based semantic search engine returning a single, authoritative policy answer for queried campus questions.
5. **Intelligent AI Assistant**: Natural language academic advising agent utilizing institutional knowledge retrieval.
6. **Administrator Portal**: Real-time analytics, risk prediction monitoring, assignment grading, and support event publishing.

---

## 2. HCI Paradigms Applied

HCI Paradigms define the fundamental models of interaction between human mental models and system capabilities. ASSIS incorporates four primary paradigms:

### A. Direct Manipulation Paradigm (Shneiderman, 1983)
- **Visual Representation**: Objects of interest (course cards, timetable blocks, unit sections, preference chips) are visually displayed with immediate visual feedback.
- **Incremental Actions**: Students can enroll, drop, filter, or switch view states with single-action controls that yield immediate, reversible results.

### B. Conversational UI & Intelligent Agent Paradigm
- **Natural Language Interaction**: The embedded AI Assistant acts as a conversational partner, processing free-form student inquiries regarding academic policies, stress management, or degree requirements.
- **Context-Aware Responses**: Synthesizes structured data into plain-language guidance matching human conversation norms.

### C. Proactive & Ubiquitous Computing Paradigm
- **Intervention Without Interruption**: The Academic Risk Engine silently monitors attendance, grades, and engagement metrics, surfacing proactive intervention cards before academic crisis occurs.

### D. Visual Information Seeking Paradigm (*Shneiderman's Information Seeking Mantra*)
- **"Overview first, zoom and filter, then details-on-demand"**:
  1. *Overview*: Student Dashboard summary (GPA, Enrolled Credits, Quote Banner).
  2. *Zoom & Filter*: Filtering course catalogs by degree program, level, and schedule preferences.
  3. *Details-on-Demand*: Expanding detailed unit descriptions, syllabus tags, and single-answer search cards.

---

## 3. HCI Design Principles Applied (Nielsen's 10 Usability Heuristics)

ASSIS rigorously adheres to Jakob Nielsen's classic usability heuristics:

| Heuristic | Application in ASSIS |
|-----------|----------------------|
| **1. Visibility of System Status** | Real-time loading indicators, dynamic progress bars (`role="progressbar"`), and status alerts inform the user of system state within < 100ms. |
| **2. Match Between System & Real World** | Uses familiar academic mental models: credit hours, GPAs, semesters, timetables, drop/add deadlines, and official university terminology. |
| **3. User Control & Freedom** | Every action is reversible: single-click unit drop, query clearing, search reset, and modal dismissal. |
| **4. Consistency & Standards** | Uniform color system (Sky/Slate brand colors), consistent button placements, standardized icon metaphors (Lucide icons), and predictable navigation tabs. |
| **5. Error Prevention** | Timetable engine algorithm checks session start/end overlaps *before* allowing enrollment, preventing schedule conflicts. |
| **6. Recognition Rather Than Recall** | Uses visual program tags, quick topic search pills, course code badges, and auto-suggested options to minimize cognitive load. |
| **7. Flexibility & Efficiency of Use** | Keyboard shortcuts (`Option ⌥` / `Alt` + A/S/P/E/D) for power users alongside intuitive touch/mouse controls for novices. |
| **8. Aesthetic & Minimalist Design** | Clean typography, subtle dark/light gradients, glassmorphism containers, and elimination of unnecessary visual noise. |
| **9. Help Users Recognize, Diagnose & Recover from Errors** | Clear, actionable error banners with `role="alert"` (e.g., *"Schedule Conflict: Class overlaps with enrolled section"*). |
| **10. Help & Documentation** | Embedded knowledge search engine, contextual tooltips, and an accessible student motivational overview quote. |

---

## 4. Universal Design Principles: Accessibility & Inclusive Design

Universal Design (UD) ensures the application is usable by all people, to the greatest extent possible, without the need for adaptation.

```
       ┌─────────────────────────────────────────────────────────────┐
       │             Universal Design & Accessibility                │
       ├──────────────────────────────┬──────────────────────────────┤
       │  High Contrast Mode (⚡)      │  Dynamic Text Resizing (A±)  │
       ├──────────────────────────────┼──────────────────────────────┤
       │  Cross-Platform Keycodes     │  ARIA Landmarks & Live Region│
       │  (Mac Option ⌥ / Win Alt)    │  (Screen Reader Optimized)   │
       └──────────────────────────────┴──────────────────────────────┘
```

### The 7 Universal Design Principles in ASSIS:

#### 1. Equitable Use
- **Skip Navigation Link**: `index.html` features a hidden `<a href="#main-content">` link that becomes visible on keyboard focus, allowing screen reader and keyboard-only users to bypass repetitive headers.

#### 2. Flexibility in Use
- **⚡ High Contrast Mode Toggle**: One-click high-contrast mode switching to pure `#000000` background with `#FFFFFF` text and high-contrast borders for low-vision users.
- **A+ / A- Dynamic Text Resizing**: Allows scaling base font size from 100% up to 130% without breaking layout geometry.
- **Cross-Platform Keyboard Shortcuts**: Implemented using physical keycodes (`e.code === "KeyA"`), supporting both **macOS Option (`⌥`)** and **Windows Alt** shortcuts.
- **Reduced Motion Support**: `@media (prefers-reduced-motion: reduce)` CSS rules automatically disable transitions for users prone to motion sickness.

#### 3. Simple and Intuitive Use
- **Explicit Input Labels**: All input fields have matching `<label>` elements and explicit `id` attributes.
- **Predictable Interface**: Consistent tab navigation layout and auto-dismissing 3-second status notifications.

#### 4. Perceptible Information
- **ARIA Landmark Roles**: Standardized `role="banner"`, `role="main"`, `role="navigation"`, `role="tablist"`, `role="tab"`, and `role="tabpanel"`.
- **Live Region Announcements**: Screen-reader live region (`aria-live="polite"`) announces tab navigation, login events, and enrollment actions.

#### 5. Tolerance for Error
- **Assertive Alerts**: Error messages use `role="alert"` (assertive) to ensure immediate screen-reader callouts.
- **Destructive Action Confirmation**: Dropping a unit or clearing data requires explicit confirmation.

#### 6. Low Physical Effort
- **44 × 44 px Touch Targets**: CSS enforces minimum 44px touch targets across all interactive buttons.
- **Focus Ring Visualization**: Distinct `:focus-visible` outlines ensure keyboard focus is never lost visually.

#### 7. Size and Space for Approach and Use
- **Fluid Responsive Layout**: Grid breaks dynamically from single-column mobile (320px) to multi-column desktop.

---

## 5. HCI Evaluation Methods Applied

Four complementary HCI evaluation methods were applied during development:

```
┌───────────────────────────┐      ┌───────────────────────────┐
│   Heuristic Evaluation    │      │   Cognitive Walkthrough   │
│ (10 Nielsen Rules Audit)  │      │ (Task Path Verification)  │
└─────────────┬─────────────┘      └─────────────┬─────────────┘
              │                                  │
              ▼                                  ▼
┌───────────────────────────┐      ┌───────────────────────────┐
│   Accessibility Audit     │      │   Automated Unit Tests    │
│ (WCAG 2.1 AA Conformance) │      │  (Node.js Test Runner)    │
└───────────────────────────┘      └───────────────────────────┘
```

1. **Heuristic Evaluation**: Expert walkthrough evaluating system screens against Nielsen's 10 rules.
2. **Cognitive Walkthrough**: Step-by-step task flow evaluation focusing on new student onboarding, course enrollment, and single-answer policy lookup.
3. **Accessibility Audit**: Verified against **WCAG 2.1 AA Standards** for color contrast ratio ($\ge 4.5:1$), keyboard-only navigation, and screen reader announcements.
4. **Automated Integration & Usability Testing**: Executable test suite verifying keycode events, recommendation filters, and conflict detection.

---

## 6. Exhaustive Automated Tests (`npm run test`)

ASSIS includes an exhaustive automated test suite written using Node.js's native test runner (`node --test`).

### Executing the Tests:
Run the following command in your terminal:

```bash
npm run test
```

### Test Suite Execution Output:
```text
▶ ASSIS HCI & Universal Design Test Suite
  ▶ Principle 2 & 6: Cross-Platform Keyboard Shortcuts & Physical Keycodes
    ✔ should trigger AI Assistant tab on Windows Alt+A (code: KeyA, key: a)
    ✔ should trigger AI Assistant tab on macOS Option+A producing special character 'å'
    ✔ should trigger Timetable tab on macOS Option+S producing special character 'ß'
    ✔ should trigger Semester Planner tab on macOS Option+P producing 'π'
    ✔ should trigger Events & Support tab on macOS Option+E producing '´'
    ✔ should trigger Overview Dashboard tab on macOS Option+D producing '∂'
    ✔ should ignore keystrokes without Alt or Option modifier
  ▶ HCI Design Principles: Personalization & Student Independence
    ✔ should recommend Year 1 foundational activities for freshman student
    ✔ should recommend Year 4 capstone and honors fellowship for high-GPA senior
    ✔ should include Academic Recovery Clinic for students with low GPA
  ▶ HCI Error Prevention: Timetable Conflict Detection
    ✔ should detect overlapping class sessions on the same day
    ✔ should allow non-overlapping sessions on the same day
    ✔ should allow overlapping times on different days
  ▶ HCI Recognition Over Recall: Focused Knowledge Search Single-Answer
    ✔ should return single focused top-match answer for queried topic
✔ ASSIS HCI & Universal Design Test Suite
ℹ tests 14 | pass 14 | fail 0
```

---
*Documentation compiled for ASSIS Project • HCI & Universal Design Assessment.*

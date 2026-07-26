/**
 * ASSIS — AI-Powered Student Support Information System
 *
 * Universal Design (UD) principles applied throughout this file:
 *  1. Equitable Use          — skip link in index.html; no feature gated by device
 *  2. Flexibility in Use     — keyboard + pointer navigation; reduced-motion CSS
 *  3. Simple & Intuitive Use — clear labels, consistent layout, plain language
 *  4. Perceptible Information — ARIA landmarks, live regions, alt text equivalents
 *  5. Tolerance for Error    — visible error notices; no destructive defaults
 *  6. Low Physical Effort    — keyboard shortcuts (Enter to submit), min 44px targets
 *  7. Size & Space           — responsive grid, adequate touch targets (see styles.css)
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  BookOpen,
  Clock3,
  GraduationCap,
  HeartPulse,
  LineChart,
  MessageSquareText,
  Search,
  Sparkles,
  ThumbsUp,
  UserCheck,
  Users,
} from "lucide-react";
import "./styles.css";

/* ------------------------------------------------------------------ */
/*  Navigation tabs — UD P3: Simple & Intuitive                        */
/* ------------------------------------------------------------------ */
const tabs = [
  { id: "dashboard",       label: "Overview",          icon: GraduationCap },
  { id: "recommendations", label: "Recommendations",   icon: Sparkles       },
  { id: "timetable",       label: "Timetable",         icon: Clock3         },
  { id: "search",          label: "Knowledge Search",  icon: Search         },
  { id: "chatbot",         label: "Chatbot",            icon: Bot            },
  { id: "sentiment",       label: "Sentiment",          icon: BarChart3      },
];

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */
const api = {
  async get(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Request failed: ${path}`);
    return response.json();
  },
  async post(path, body) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed: ${path}`);
    }
    return response.json();
  },
};

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */
function App() {
  const [activeTab, setActiveTab]                 = useState("dashboard");
  const [profile, setProfile]                     = useState(null);
  const [risk, setRisk]                           = useState(null);
  const [recommendations, setRecommendations]     = useState(null);
  const [timetable, setTimetable]                 = useState([]);
  const [units, setUnits]                         = useState([]);
  const [unitRecommendations, setUnitRecommendations] = useState([]);
  const [searchQuery, setSearchQuery]             = useState("How can I get tutoring support?");
  const [searchResults, setSearchResults]         = useState(null);
  const [feedback, setFeedback]                   = useState("The tutoring center helped me a lot.\nRegistration can feel busy.");
  const [sentiment, setSentiment]                 = useState(null);
  const [question, setQuestion]                   = useState("Hi, how can you help me with academic planning?");
  const [chatbot, setChatbot]                     = useState(null);
  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState("");
  const [enrollMessage, setEnrollMessage]         = useState("");

  /* UD P4: Perceptible Information — live region ref for dynamic announcements */
  const liveRegionRef = useRef(null);

  function announce(message) {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = "";
      // Small delay ensures screen readers re-announce identical strings
      setTimeout(() => { liveRegionRef.current.textContent = message; }, 50);
    }
  }

  useEffect(() => {
    loadProfile();
    loadRisk();
  }, []);

  useEffect(() => {
    if (profile) {
      loadRecommendations(profile.student_id);
      loadTimetable();
      loadUnits(profile.current_semester);
      loadUnitRecommendations();
    }
  }, [profile]);

  async function runAction(action, successMsg) {
    setError("");
    setLoading(true);
    announce("Loading, please wait.");
    try {
      await action();
      if (successMsg) announce(successMsg);
    } catch (err) {
      const msg = err.message || "Something went wrong.";
      setError(msg);
      announce(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile() {
    setError("");
    try {
      const data = await api.get("/api/me/");
      setProfile(data.profile);
    } catch (err) {
      setError("Unable to load student profile. Please sign in.");
    }
  }

  async function loadRecommendations(studentId) {
    setError("");
    if (!studentId) return;
    const data = await api.get(`/api/recommendations/?student_id=${encodeURIComponent(studentId)}`);
    setRecommendations(data);
  }

  async function loadRisk() {
    setError("");
    try {
      setRisk(await api.get("/api/risk/"));
    } catch (err) {
      setError("Could not load risk module.");
    }
  }

  async function loadTimetable() {
    if (!profile) return;
    setError("");
    try {
      const data = await api.get("/api/timetable/");
      setTimetable(data.timetable);
    } catch (err) {
      setError("Could not load timetable.");
    }
  }

  async function loadUnits(semester) {
    if (!semester) return;
    setError("");
    try {
      const data = await api.get(`/api/units/?semester=${encodeURIComponent(semester)}`);
      setUnits(data.units);
    } catch (err) {
      setError("Could not load available units.");
    }
  }

  async function loadUnitRecommendations() {
    setError("");
    try {
      const data = await api.get("/api/units/recommendations/");
      setUnitRecommendations(data.recommendations);
    } catch (err) {
      setError("Could not load unit recommendations.");
    }
  }

  async function runSearch() {
    runAction(
      async () => setSearchResults(await api.get(`/api/knowledge-search/?q=${encodeURIComponent(searchQuery)}`)),
      "Search results loaded."
    );
  }

  async function runSentiment() {
    runAction(async () => {
      const feedbackItems = feedback.split("\n").map((item) => item.trim()).filter(Boolean);
      setSentiment(await api.post("/api/sentiment/", { feedback: feedbackItems }));
    }, "Sentiment analysis complete.");
  }

  async function askChatbot() {
    runAction(async () => {
      setChatbot(await api.post("/api/chatbot/", { question }));
    }, "Chatbot response received.");
  }

  async function enrollUnit(unitId, unitTitle) {
    setEnrollMessage("");
    try {
      const data = await api.post("/api/units/enroll/", { unit_id: unitId });
      const msg = data.detail || "Enrolled successfully.";
      setEnrollMessage(msg);
      announce(msg);
      loadTimetable();
      loadUnitRecommendations();
    } catch (err) {
      setEnrollMessage(err.message);
      announce(`Enrollment error: ${err.message}`);
    }
  }

  const overviewBars = useMemo(() => {
    if (!profile) return [];
    return [
      { label: "GPA",        value: profile.gpa / 4,           color: "bg-sky-500",     percentage: Math.round((profile.gpa / 4) * 100) },
      { label: "Attendance", value: profile.attendance / 100,   color: "bg-emerald-500", percentage: profile.attendance  },
      { label: "Activity",   value: profile.lms_activity / 100, color: "bg-indigo-500",  percentage: profile.lms_activity },
      { label: "Wellbeing",  value: profile.wellbeing_score / 100, color: "bg-rose-500", percentage: profile.wellbeing_score },
    ];
  }, [profile]);

  const enrolledUnits = useMemo(() => {
    if (!timetable.length) return [];
    return [...new Map(timetable.map((item) => [item.unit.unit_id, item.unit])).values()];
  }, [timetable]);

  /* UD P3: Simple & Intuitive — active tab label for aria-label on landmark */
  const activeTabLabel = tabs.find((t) => t.id === activeTab)?.label ?? "Content";

  return (
    /* UD P4: Perceptible Information — landmark roles for screen-reader navigation */
    <div className="min-h-screen bg-[#f6f8fb] text-ink">

      {/* UD P4: hidden live region for dynamic announcements */}
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* ============================================================
          HEADER — banner landmark
          ============================================================ */}
      <header role="banner" className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {/* UD P4: decorative badge — aria-hidden so screen readers skip it */}
            <div
              aria-hidden="true"
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-[#f8fafc] px-3 py-1 text-sm font-semibold text-muted"
            >
              <GraduationCap size={16} />
              AI-Powered Student Support
            </div>
            {/* UD P4: page-level heading */}
            <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-normal md:text-5xl">
              Modern student support with real schedules, enrollment guidance, and AI insights.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
              Your personalized dashboard pulls live student profile data, timetable information,
              unit recommendations, and knowledge support into one app.
            </p>
          </div>
          {/* Summary metrics — UD P4: meaningful labels, not just numbers */}
          <div
            className="grid min-w-[280px] grid-cols-3 gap-3 rounded-lg border border-line bg-[#fbfcfe] p-3"
            aria-label="Quick stats"
          >
            <Metric label="Study units"  value={enrolledUnits.length || 0} />
            <Metric label="At risk"      value={risk?.predictions?.filter((item) => item.risk_level !== "low").length || 0} />
            <Metric label="AI modules"   value="8" />
          </div>
        </div>
      </header>

      {/* ============================================================
          MAIN — UD P4: id="main-content" matches skip link href
          ============================================================ */}
      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[260px_1fr]">

        {/* ============================================================
            SIDEBAR NAV — UD P6: Low Physical Effort via role="tablist"
            keyboard: Arrow keys navigate, Enter/Space activates
            ============================================================ */}
        <nav
          aria-label="Workspace navigation"
          role="navigation"
          className="h-fit rounded-lg border border-line bg-white p-3 shadow-soft"
        >
          <div
            id="workspace-nav-label"
            className="mb-3 px-2 text-xs font-bold uppercase tracking-wide text-muted"
            aria-hidden="true"
          >
            Workspace
          </div>
          {/* UD P6: role="tablist" enables arrow-key navigation */}
          <div role="tablist" aria-labelledby="workspace-nav-label" className="grid gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => {
                    /* UD P6: arrow-key navigation between tabs */
                    const ids = tabs.map((t) => t.id);
                    const idx = ids.indexOf(activeTab);
                    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                      e.preventDefault();
                      const next = ids[(idx + 1) % ids.length];
                      setActiveTab(next);
                      document.getElementById(`tab-${next}`)?.focus();
                    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                      e.preventDefault();
                      const prev = ids[(idx - 1 + ids.length) % ids.length];
                      setActiveTab(prev);
                      document.getElementById(`tab-${prev}`)?.focus();
                    }
                  }}
                  className={`flex w-full min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition ${
                    isActive ? "bg-brand text-white" : "text-ink hover:bg-[#eef3fb]"
                  }`}
                >
                  {/* UD P4: icon is decorative — label carries the meaning */}
                  <Icon size={18} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ============================================================
            CONTENT PANELS
            ============================================================ */}
        <main
          id="main-content"
          role="main"
          aria-label={`${activeTabLabel} panel`}
          className="grid gap-5"
        >
          {/* UD P5: Tolerance for Error — error and status notices */}
          {error        && <Notice tone="rose"  text={error}         role="alert" />}
          {loading      && <Notice tone="brand" text="Loading the latest student data…" role="status" />}
          {enrollMessage && <Notice tone="brand" text={enrollMessage} role="status" />}

          {/* ---- Dashboard ----------------------------------------- */}
          {activeTab === "dashboard" && (
            <Module
              id="panel-dashboard"
              title="Student Overview"
              icon={UserCheck}
              labelledBy="tab-dashboard"
            >
              {profile ? (
                <div className="grid gap-5">
                  <div className="grid gap-4 rounded-lg border border-line bg-[#fbfcfe] p-5 md:grid-cols-[1fr_320px]">
                    <div>
                      {/* UD P3: clear, plain-language greeting */}
                      <p className="text-sm font-semibold uppercase tracking-wide text-muted">Welcome back</p>
                      <h2 className="mt-3 text-2xl font-bold">{profile.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {profile.program} · Year {profile.year} · {profile.current_semester}
                      </p>
                      {/* UD P4: dl/dt/dd conveys stat semantics to screen readers */}
                      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                        <StatCard label="Completed units"  value={profile.completed_units} />
                        <StatCard label="Current GPA"      value={profile.gpa} />
                        <StatCard label="Assignments"      value={`${profile.assignments_submitted}%`} />
                        <StatCard label="Wellbeing"        value={`${profile.wellbeing_score}%`} />
                      </dl>
                    </div>
                    <div>
                      <p
                        id="progress-heading"
                        className="text-sm font-semibold uppercase tracking-wide text-muted"
                      >
                        Study Progress
                      </p>
                      <div
                        className="mt-4 space-y-4"
                        role="group"
                        aria-labelledby="progress-heading"
                      >
                        {overviewBars.map((item) => (
                          <ProgressBar key={item.label} {...item} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                    <section aria-label="This week's classes" className="rounded-lg border border-line bg-white p-5">
                      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
                        <Clock3 size={18} aria-hidden="true" />
                        This week's classes
                      </h3>
                      <TimetableView sessions={timetable} />
                    </section>
                    <section aria-label="Risk snapshot" className="rounded-lg border border-line bg-white p-5">
                      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Risk snapshot</h3>
                      <RiskSummary predictions={risk?.predictions || []} />
                    </section>
                  </div>
                </div>
              ) : (
                <EmptyState text="Sign in to see your student dashboard and schedule." />
              )}
            </Module>
          )}

          {/* ---- Recommendations ----------------------------------- */}
          {activeTab === "recommendations" && (
            <Module id="panel-recommendations" title="AI Recommendation Engine" icon={Sparkles} labelledBy="tab-recommendations">
              {profile ? <StudentStrip student={profile} /> : null}
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {recommendations?.recommendations?.map((item) => (
                  <ResultCard
                    key={item.id}
                    title={item.title}
                    kicker={item.type}
                    score={item.score}
                    body={item.description}
                    footer={item.reason}
                  />
                ))}
              </div>
            </Module>
          )}

          {/* ---- Timetable & Enrollment ---------------------------- */}
          {activeTab === "timetable" && (
            <Module id="panel-timetable" title="Timetable & Enrollment" icon={Clock3} labelledBy="tab-timetable">
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <section aria-label="Current class schedule" className="rounded-lg border border-line bg-white p-5">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Current class schedule</h3>
                  <TimetableView sessions={timetable} />
                </section>
                <aside aria-label="Recommended units" className="space-y-4">
                  <div className="rounded-lg border border-line bg-white p-5">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Your recommended units</h3>
                    <div className="mt-4 space-y-3">
                      {unitRecommendations.map((item) => (
                        <article key={item.unit.unit_id} className="rounded-xl border border-line bg-[#fbfcfe] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-base font-bold">{item.unit.title}</h4>
                              <p className="text-xs uppercase tracking-wide text-muted">
                                {item.unit.unit_id} · {item.unit.category}
                              </p>
                            </div>
                            {/* UD P4: score label, not just a number */}
                            <span
                              className="rounded-full bg-[#ecfdf5] px-2 py-1 text-xs font-bold text-teal"
                              aria-label={`Recommendation score: ${item.score}`}
                            >
                              {item.score}
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-muted">{item.unit.description}</p>
                          <p className="mt-3 text-sm font-semibold">{item.reason}</p>
                          <button
                            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-bold text-white"
                            type="button"
                            onClick={() => enrollUnit(item.unit.unit_id, item.unit.title)}
                            aria-label={`Enroll in ${item.unit.title}`}
                          >
                            Enroll
                          </button>
                        </article>
                      ))}
                      {!unitRecommendations.length && <EmptyState text="No unit recommendations available yet." />}
                    </div>
                  </div>
                </aside>
              </div>
            </Module>
          )}

          {/* ---- Knowledge Search ---------------------------------- */}
          {activeTab === "search" && (
            <Module id="panel-search" title="Intelligent Knowledge Search" icon={Search} labelledBy="tab-search">
              <SearchBar
                id="knowledge-search"
                label="Search support resources"
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={runSearch}
                placeholder="Search advising, tutoring, or wellness resources…"
                buttonLabel="Search"
              />
              {searchResults
                ? <AnswerBlock data={searchResults} />
                : <EmptyState text="Search across knowledge documents and support services for student help." />}
            </Module>
          )}

          {/* ---- Chatbot ------------------------------------------ */}
          {activeTab === "chatbot" && (
            <Module id="panel-chatbot" title="Knowledge-Grounded Chatbot" icon={Bot} labelledBy="tab-chatbot">
              <SearchBar
                id="chatbot-input"
                label="Ask a question"
                value={question}
                onChange={setQuestion}
                onSubmit={askChatbot}
                placeholder="Ask a student support question…"
                buttonLabel="Ask"
              />
              {chatbot ? (
                <section aria-label="Chatbot answer" className="mt-5 rounded-lg border border-line bg-[#fbfcfe] p-5">
                  <h3 className="mb-2 flex items-center gap-2 font-bold">
                    <MessageSquareText size={18} aria-hidden="true" />
                    Answer
                  </h3>
                  <p className="text-sm leading-6 text-muted">{chatbot.answer}</p>
                  <ul className="mt-4 grid gap-2" aria-label="Source documents">
                    {chatbot.sources.map((source) => (
                      <li key={source.id} className="rounded-md border border-line bg-white p-3 text-sm">
                        <strong>{source.title}</strong>
                        <span className="ml-2 text-muted">{source.category} · {source.score}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <EmptyState text="The chatbot retrieves answers from the same knowledge base used by intelligent search." />
              )}
            </Module>
          )}

          {/* ---- Sentiment ---------------------------------------- */}
          {activeTab === "sentiment" && (
            <Module id="panel-sentiment" title="Sentiment Analysis" icon={BarChart3} labelledBy="tab-sentiment">
              {/* UD P3: explicit label for textarea */}
              <label htmlFor="sentiment-feedback" className="sr-only">
                Enter feedback lines (one per line) for sentiment analysis
              </label>
              <textarea
                id="sentiment-feedback"
                className="min-h-32 w-full rounded-md border border-line bg-white p-3 text-sm leading-6 outline-none focus:border-brand"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                aria-describedby="sentiment-hint"
              />
              <p id="sentiment-hint" className="mt-1 text-xs text-muted">
                Enter one feedback statement per line, then click Analyze.
              </p>
              <button
                className="mt-3 inline-flex h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-bold text-white"
                onClick={runSentiment}
                type="button"
                aria-label="Analyze the entered feedback"
              >
                <ThumbsUp size={17} aria-hidden="true" />
                Analyze Feedback
              </button>
              {sentiment ? <SentimentView data={sentiment} /> : null}
            </Module>
          )}
        </main>
      </div>

      {/* ============================================================
          FOOTER — contentinfo landmark
          ============================================================ */}
      <footer role="contentinfo" className="border-t border-line bg-white mt-8 py-6">
        <div className="mx-auto max-w-7xl px-5 text-sm text-muted">
          <p>
            ASSIS — AI-Powered Student Support Information System.{" "}
            <span aria-hidden="true">·</span>{" "}
            Designed with Universal Design principles for equitable access.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

/** UD P4: Metric uses dt/dd semantics when inside a dl */
function Metric({ label, value }) {
  return (
    <div className="rounded-md bg-white p-3 text-center">
      <div className="text-2xl font-bold" aria-label={`${label}: ${value}`}>{value}</div>
      <div className="text-xs font-semibold uppercase text-muted" aria-hidden="true">{label}</div>
    </div>
  );
}

/** Module wraps a panel region — UD P4 */
function Module({ id, title, icon: Icon, children, labelledBy }) {
  return (
    <section
      id={id}
      role="tabpanel"
      aria-labelledby={labelledBy}
      className="rounded-lg border border-line bg-white p-5 shadow-soft"
      tabIndex={0}
    >
      <div className="mb-5 flex items-center gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-md bg-[#eaf1ff] text-brand"
          aria-hidden="true"
        >
          <Icon size={20} />
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/** UD P4: stat card uses dt/dd semantics */
function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-4 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-3 text-2xl font-bold">{value}</dd>
    </div>
  );
}

/** UD P4: progress bar with aria-valuenow etc. */
function ProgressBar({ label, value, color, percentage }) {
  const clamped = Math.max(0, Math.min(100, percentage));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-muted">
        <span id={`bar-label-${label}`}>{label}</span>
        <span aria-hidden="true">{percentage}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-labelledby={`bar-label-${label}`}
        aria-valuetext={`${label}: ${clamped}%`}
        className="h-3 rounded-full bg-slate-200"
      >
        <div className={`${color} h-full rounded-full`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function StudentStrip({ student }) {
  return (
    <dl className="grid gap-3 rounded-lg border border-line bg-[#fbfcfe] p-4 md:grid-cols-5">
      <Metric label="GPA"        value={student.gpa} />
      <Metric label="Attendance" value={`${student.attendance}%`} />
      <Metric label="Activity"   value={`${student.lms_activity}%`} />
      <Metric label="Work"       value={`${student.assignments_submitted}%`} />
      <Metric label="Wellbeing"  value={`${student.wellbeing_score}%`} />
    </dl>
  );
}

function TimetableView({ sessions }) {
  if (!sessions.length) {
    return <EmptyState text="No scheduled classes found for this semester." />;
  }
  return (
    <ul className="space-y-3" aria-label="Class sessions">
      {sessions.map((session, index) => (
        <li key={`${session.unit.unit_id}-${index}`} className="rounded-2xl border border-line bg-[#f8fafc] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold">{session.unit.title}</h4>
              <p className="text-sm text-muted">{session.unit.unit_id} · {session.unit.category}</p>
            </div>
            <span
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted"
              aria-label={`Day: ${session.day_of_week}`}
            >
              {session.day_of_week.toUpperCase()}
            </span>
          </div>
          <p className="mt-3 text-sm text-muted">
            {session.start_time} – {session.end_time} &nbsp;·&nbsp; {session.location || "Online"}
          </p>
        </li>
      ))}
    </ul>
  );
}

function RiskSummary({ predictions }) {
  if (!predictions.length) {
    return <p className="text-sm leading-6 text-muted">No risk signals found. Continue monitoring progress.</p>;
  }
  const top = predictions[0];
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-line bg-[#f8fafc] p-4">
        <p className="text-sm text-muted">Top signal</p>
        <p className="mt-2 text-xl font-bold">{top.name}</p>
        <p className="text-sm text-muted">
          <span className="uppercase">{top.risk_level}</span> · {top.risk_score}
        </p>
      </div>
      <div className="rounded-3xl border border-line bg-white p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">Key signals</p>
        {/* UD P4: ul/li expresses list semantics */}
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {top.signals.map((signal) => <li key={signal}>{signal}</li>)}
        </ul>
      </div>
    </div>
  );
}

/**
 * SearchBar — UD improvements:
 *  P3: explicit <label> wired via htmlFor/id
 *  P6: Enter key submits
 *  P7: min-height 44px already enforced via CSS
 */
function SearchBar({ id, label, value, onChange, onSubmit, placeholder, buttonLabel = "Search" }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row">
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        className="h-11 flex-1 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && onSubmit()}
        placeholder={placeholder}
        aria-label={label}
      />
      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-bold text-white"
        onClick={onSubmit}
        type="button"
        aria-label={`${buttonLabel}: ${label}`}
      >
        <Search size={17} aria-hidden="true" />
        {buttonLabel}
      </button>
    </div>
  );
}

function AnswerBlock({ data }) {
  return (
    <div className="mt-5 grid gap-4">
      <div className="rounded-lg border border-line bg-[#fbfcfe] p-4">
        <h3 className="mb-2 flex items-center gap-2 font-bold">
          <BookOpen size={18} aria-hidden="true" />
          Summary
        </h3>
        <p className="text-sm leading-6 text-muted">{data.answer_summary}</p>
      </div>
      <ul className="grid gap-3 md:grid-cols-3" aria-label="Knowledge results">
        {data.results.map((item) => (
          <ResultCard
            key={item.id}
            title={item.title}
            kicker={item.category}
            score={item.score}
            body={item.summary}
            footer="Retrieved from institutional knowledge base."
          />
        ))}
      </ul>
    </div>
  );
}

function SentimentView({ data }) {
  return (
    <section aria-label="Sentiment analysis results" className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
      <ul className="grid gap-3" aria-label="Analyzed feedback items">
        {data.items.map((item, index) => (
          <li key={`${item.text}-${index}`} className="rounded-lg border border-line bg-white p-4">
            <span
              className="mb-2 inline-flex rounded-full bg-[#eef3fb] px-2 py-1 text-xs font-bold uppercase text-brand"
              aria-label={`Sentiment label: ${item.label}`}
            >
              {item.label}
            </span>
            <p className="text-sm leading-6 text-muted">{item.text}</p>
          </li>
        ))}
      </ul>
      <aside aria-label="Sentiment trends" className="rounded-lg border border-line bg-[#fbfcfe] p-4">
        <h3 className="mb-3 flex items-center gap-2 font-bold">
          <ThumbsUp size={18} aria-hidden="true" />
          Trends
        </h3>
        <dl>
          {Object.entries(data.summary).map(([label, count]) => (
            <div className="mb-2 flex justify-between text-sm" key={label}>
              <dt className="capitalize text-muted">{label}</dt>
              <dd><strong>{count}</strong></dd>
            </div>
          ))}
        </dl>
        <dl className="mt-4 border-t border-line pt-4 text-sm">
          {data.themes.map((theme) => (
            <div key={theme.theme} className="mb-2 flex justify-between">
              <dt className="text-muted">{theme.theme}</dt>
              <dd><strong>{theme.count}</strong></dd>
            </div>
          ))}
        </dl>
      </aside>
    </section>
  );
}

/** UD P5: ResultCard — article landmark with semantic heading */
function ResultCard({ title, kicker, score, body, footer }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-4 text-sm">
      <p className="mb-1 text-xs uppercase tracking-wide text-muted">{kicker}</p>
      <h3 className="font-bold leading-snug">{title}</h3>
      {score !== undefined && (
        <p className="mt-1 text-xs text-muted" aria-label={`Relevance score: ${score}`}>
          Score: {score}
        </p>
      )}
      <p className="mt-3 leading-6 text-muted">{body}</p>
      {footer && <p className="mt-3 text-xs text-muted italic">{footer}</p>}
    </article>
  );
}

/** UD P4: empty states use role="status" so screen readers announce them */
function EmptyState({ text }) {
  return (
    <div
      role="status"
      className="mt-5 rounded-lg border border-dashed border-line bg-[#fbfcfe] p-6 text-sm font-semibold text-muted"
    >
      {text}
    </div>
  );
}

/**
 * Notice — UD P5: Tolerance for Error
 *  tone="rose"  → errors use role="alert" (assertive, immediate)
 *  tone="brand" → status uses role="status" (polite)
 */
function Notice({ text, tone, role: roleProp }) {
  const colors = tone === "rose"
    ? "border-[#fecdd3] bg-[#fff1f2] text-rose"
    : "border-[#bfdbfe] bg-[#eff6ff] text-brand";
  const effectiveRole = roleProp || (tone === "rose" ? "alert" : "status");
  return (
    <div
      role={effectiveRole}
      aria-live={effectiveRole === "alert" ? "assertive" : "polite"}
      className={`rounded-lg border p-3 text-sm font-semibold ${colors}`}
    >
      {tone === "rose" && (
        <span className="mr-2" aria-hidden="true">⚠</span>
      )}
      {text}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);

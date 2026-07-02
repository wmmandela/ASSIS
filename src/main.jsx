import React, { useEffect, useMemo, useState } from "react";
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

const tabs = [
  { id: "dashboard", label: "Overview", icon: GraduationCap },
  { id: "recommendations", label: "Recommendations", icon: Sparkles },
  { id: "timetable", label: "Timetable", icon: Clock3 },
  { id: "search", label: "Knowledge Search", icon: Search },
  { id: "chatbot", label: "Chatbot", icon: Bot },
  { id: "sentiment", label: "Sentiment", icon: BarChart3 },
];

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

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [risk, setRisk] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [units, setUnits] = useState([]);
  const [unitRecommendations, setUnitRecommendations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("How can I get tutoring support?");
  const [searchResults, setSearchResults] = useState(null);
  const [feedback, setFeedback] = useState("The tutoring center helped me a lot.\nRegistration can feel busy.");
  const [sentiment, setSentiment] = useState(null);
  const [question, setQuestion] = useState("Hi, how can you help me with academic planning?");
  const [chatbot, setChatbot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enrollMessage, setEnrollMessage] = useState("");

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

  async function runAction(action) {
    setError("");
    setLoading(true);
    try {
      await action();
    } catch (err) {
      setError(err.message || "Something went wrong.");
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
    runAction(async () => {
      setSearchResults(await api.get(`/api/knowledge-search/?q=${encodeURIComponent(searchQuery)}`));
    });
  }

  async function runSentiment() {
    runAction(async () => {
      const feedbackItems = feedback.split("\n").map((item) => item.trim()).filter(Boolean);
      setSentiment(await api.post("/api/sentiment/", { feedback: feedbackItems }));
    });
  }

  async function askChatbot() {
    runAction(async () => {
      setChatbot(await api.post("/api/chatbot/", { question }));
    });
  }

  async function enrollUnit(unitId) {
    setEnrollMessage("");
    try {
      const data = await api.post("/api/units/enroll/", { unit_id: unitId });
      setEnrollMessage(data.detail || "Enrolled successfully.");
      loadTimetable();
      loadUnitRecommendations();
    } catch (err) {
      setEnrollMessage(err.message);
    }
  }

  const overviewBars = useMemo(() => {
    if (!profile) return [];
    return [
      { label: "GPA", value: profile.gpa / 4, color: "bg-sky-500", percentage: Math.round((profile.gpa / 4) * 100) },
      { label: "Attendance", value: profile.attendance / 100, color: "bg-emerald-500", percentage: profile.attendance },
      { label: "Activity", value: profile.lms_activity / 100, color: "bg-indigo-500", percentage: profile.lms_activity },
      { label: "Wellbeing", value: profile.wellbeing_score / 100, color: "bg-rose-500", percentage: profile.wellbeing_score },
    ];
  }, [profile]);

  const enrolledUnits = useMemo(() => {
    if (!timetable.length) return [];
    return [...new Map(timetable.map((item) => [item.unit.unit_id, item.unit])).values()];
  }, [timetable]);

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-ink">
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-[#f8fafc] px-3 py-1 text-sm font-semibold text-muted">
              <GraduationCap size={16} />
              AI-Powered Student Support
            </div>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-normal md:text-5xl">
              Modern student support with real schedules, enrollment guidance, and AI insights.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
              Your personalized dashboard pulls live student profile data, timetable information, unit recommendations, and knowledge support into one app.
            </p>
          </div>
          <div className="grid min-w-[280px] grid-cols-3 gap-3 rounded-lg border border-line bg-[#fbfcfe] p-3">
            <Metric label="Study units" value={enrolledUnits.length || 0} />
            <Metric label="At risk" value={risk?.predictions?.filter((item) => item.risk_level !== "low").length || 0} />
            <Metric label="AI modules" value="8" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-lg border border-line bg-white p-3 shadow-soft">
          <div className="mb-3 px-2 text-xs font-bold uppercase tracking-wide text-muted">Workspace</div>
          <div className="grid gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition ${
                    isActive ? "bg-brand text-white" : "text-ink hover:bg-[#eef3fb]"
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="grid gap-5">
          {error ? <Notice tone="rose" text={error} /> : null}
          {loading ? <Notice tone="brand" text="Loading the latest student data..." /> : null}
          {enrollMessage ? <Notice tone="brand" text={enrollMessage} /> : null}

          {activeTab === "dashboard" && (
            <Module title="Student Overview" icon={UserCheck}>
              {profile ? (
                <div className="grid gap-5">
                  <div className="grid gap-4 rounded-lg border border-line bg-[#fbfcfe] p-5 md:grid-cols-[1fr_320px]">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-muted">Welcome back</p>
                      <h2 className="mt-3 text-2xl font-bold">{profile.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted">{profile.program} · Year {profile.year} · {profile.current_semester}</p>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <StatCard label="Completed units" value={profile.completed_units} />
                        <StatCard label="Current GPA" value={profile.gpa} />
                        <StatCard label="Assignments" value={`${profile.assignments_submitted}%`} />
                        <StatCard label="Wellbeing" value={`${profile.wellbeing_score}%`} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-muted">Study Progress</p>
                      <div className="mt-4 space-y-4">
                        {overviewBars.map((item) => (
                          <ProgressBar key={item.label} {...item} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                    <div className="rounded-lg border border-line bg-white p-5">
                      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
                        <Clock3 size={18} /> This week’s classes
                      </div>
                      <TimetableView sessions={timetable} />
                    </div>
                    <div className="rounded-lg border border-line bg-white p-5">
                      <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Risk snapshot</p>
                      <RiskSummary predictions={risk?.predictions || []} />
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState text="Sign in to see your student dashboard and schedule." />
              )}
            </Module>
          )}

          {activeTab === "recommendations" && (
            <Module title="AI Recommendation Engine" icon={Sparkles}>
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

          {activeTab === "timetable" && (
            <Module title="Timetable & Enrollment" icon={Clock3}>
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="rounded-lg border border-line bg-white p-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted">Current class schedule</p>
                  <TimetableView sessions={timetable} />
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg border border-line bg-white p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-muted">Your recommended units</p>
                    <div className="mt-4 space-y-3">
                      {unitRecommendations.map((item) => (
                        <div key={item.unit.unit_id} className="rounded-xl border border-line bg-[#fbfcfe] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-base font-bold">{item.unit.title}</h3>
                              <p className="text-xs uppercase tracking-wide text-muted">{item.unit.unit_id} · {item.unit.category}</p>
                            </div>
                            <span className="rounded-full bg-[#ecfdf5] px-2 py-1 text-xs font-bold text-teal">{item.score}</span>
                          </div>
                          <p className="mt-3 text-sm text-muted">{item.unit.description}</p>
                          <p className="mt-3 text-sm font-semibold">{item.reason}</p>
                          <button
                            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-bold text-white"
                            type="button"
                            onClick={() => enrollUnit(item.unit.unit_id)}
                          >
                            Enroll
                          </button>
                        </div>
                      ))}
                      {!unitRecommendations.length ? <EmptyState text="No unit recommendations available yet." /> : null}
                    </div>
                  </div>
                </div>
              </div>
            </Module>
          )}

          {activeTab === "search" && (
            <Module title="Intelligent Knowledge Search" icon={Search}>
              <SearchBar value={searchQuery} onChange={setSearchQuery} onSubmit={runSearch} placeholder="Search advising, tutoring, or wellness resources..." />
              {searchResults ? <AnswerBlock data={searchResults} /> : <EmptyState text="Search across knowledge documents and support services for student help." />}
            </Module>
          )}

          {activeTab === "chatbot" && (
            <Module title="Knowledge-Grounded Chatbot" icon={Bot}>
              <SearchBar value={question} onChange={setQuestion} onSubmit={askChatbot} placeholder="Ask a student support question..." buttonLabel="Ask" />
              {chatbot ? (
                <div className="mt-5 rounded-lg border border-line bg-[#fbfcfe] p-5">
                  <div className="mb-2 flex items-center gap-2 font-bold"><MessageSquareText size={18} /> Answer</div>
                  <p className="text-sm leading-6 text-muted">{chatbot.answer}</p>
                  <div className="mt-4 grid gap-2">
                    {chatbot.sources.map((source) => (
                      <div key={source.id} className="rounded-md border border-line bg-white p-3 text-sm">
                        <strong>{source.title}</strong>
                        <span className="ml-2 text-muted">{source.category} · {source.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <EmptyState text="The chatbot retrieves answers from the same knowledge base used by intelligent search." />}
            </Module>
          )}

          {activeTab === "sentiment" && (
            <Module title="Sentiment Analysis" icon={BarChart3}>
              <textarea
                className="min-h-32 w-full rounded-md border border-line bg-white p-3 text-sm leading-6 outline-none focus:border-brand"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
              />
              <button className="mt-3 inline-flex h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-bold text-white" onClick={runSentiment} type="button">
                <ThumbsUp size={17} />
                Analyze Feedback
              </button>
              {sentiment ? <SentimentView data={sentiment} /> : null}
            </Module>
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md bg-white p-3 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-semibold uppercase text-muted">{label}</div>
    </div>
  );
}

function Module({ title, icon: Icon, children }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-[#eaf1ff] text-brand">
          <Icon size={20} />
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StudentStrip({ student }) {
  return (
    <div className="grid gap-3 rounded-lg border border-line bg-[#fbfcfe] p-4 md:grid-cols-5">
      <Metric label="GPA" value={student.gpa} />
      <Metric label="Attendance" value={`${student.attendance}%`} />
      <Metric label="Activity" value={`${student.lms_activity}%`} />
      <Metric label="Work" value={`${student.assignments_submitted}%`} />
      <Metric label="Wellbeing" value={`${student.wellbeing_score}%`} />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-4 text-sm">
      <p className="text-muted">{label}</p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}

function ProgressBar({ label, value, color, percentage }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-muted">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-3 rounded-full bg-slate-200">
        <div className={`${color} h-full rounded-full`} style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} />
      </div>
    </div>
  );
}

function TimetableView({ sessions }) {
  if (!sessions.length) {
    return <EmptyState text="No scheduled classes found for this semester." />;
  }
  return (
    <div className="space-y-3">
      {sessions.map((session, index) => (
        <div key={`${session.unit.unit_id}-${index}`} className="rounded-2xl border border-line bg-[#f8fafc] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold">{session.unit.title}</h3>
              <p className="text-sm text-muted">{session.unit.unit_id} · {session.unit.category}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted">{session.day_of_week.toUpperCase()}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
            <span>{session.start_time} - {session.end_time}</span>
            <span>{session.location || "Online"}</span>
          </div>
        </div>
      ))}
    </div>
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
        <p className="text-sm text-muted">{top.risk_level.toUpperCase()} · {top.risk_score}</p>
      </div>
      <div className="rounded-3xl border border-line bg-white p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">Key signals</p>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {top.signals.map((signal) => <li key={signal}>• {signal}</li>)}
        </ul>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, onSubmit, placeholder, buttonLabel = "Search" }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row">
      <input
        className="h-11 flex-1 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && onSubmit()}
        placeholder={placeholder}
      />
      <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-bold text-white" onClick={onSubmit} type="button">
        <Search size={17} />
        {buttonLabel}
      </button>
    </div>
  );
}

function AnswerBlock({ data }) {
  return (
    <div className="mt-5 grid gap-4">
      <div className="rounded-lg border border-line bg-[#fbfcfe] p-4">
        <div className="mb-2 flex items-center gap-2 font-bold"><BookOpen size={18} /> Summary</div>
        <p className="text-sm leading-6 text-muted">{data.answer_summary}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {data.results.map((item) => (
          <ResultCard key={item.id} title={item.title} kicker={item.category} score={item.score} body={item.summary} footer="Retrieved from institutional knowledge base." />
        ))}
      </div>
    </div>
  );
}

function SentimentView({ data }) {
  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="grid gap-3">
        {data.items.map((item, index) => (
          <div key={`${item.text}-${index}`} className="rounded-lg border border-line bg-white p-4">
            <span className="mb-2 inline-flex rounded-full bg-[#eef3fb] px-2 py-1 text-xs font-bold uppercase text-brand">{item.label}</span>
            <p className="text-sm leading-6 text-muted">{item.text}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-line bg-[#fbfcfe] p-4">
        <div className="mb-3 flex items-center gap-2 font-bold"><ThumbsUp size={18} /> Trends</div>
        {Object.entries(data.summary).map(([label, count]) => (
          <div className="mb-2 flex justify-between text-sm" key={label}><span className="capitalize text-muted">{label}</span><strong>{count}</strong></div>
        ))}
        <div className="mt-4 border-t border-line pt-4 text-sm">
          {data.themes.map((theme) => <div key={theme.theme} className="mb-2 flex justify-between"><span className="text-muted">{theme.theme}</span><strong>{theme.count}</strong></div>)}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="mt-5 rounded-lg border border-dashed border-line bg-[#fbfcfe] p-6 text-sm font-semibold text-muted">{text}</div>;
}

function Notice({ text, tone }) {
  const colors = tone === "rose" ? "border-[#fecdd3] bg-[#fff1f2] text-rose" : "border-[#bfdbfe] bg-[#eff6ff] text-brand";
  return <div className={`rounded-lg border p-3 text-sm font-semibold ${colors}`}>{text}</div>;
}

createRoot(document.getElementById("root")).render(<App />);

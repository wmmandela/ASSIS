import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  GraduationCap,
  HeartPulse,
  LineChart,
  LogOut,
  MessageSquareText,
  PanelLeft,
  PanelLeftClose,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import "./styles.css";

/* ------------------------------------------------------------------ */
/*  Navigation tabs                                                    */
/* ------------------------------------------------------------------ */
const tabs = [
  { id: "dashboard",       label: "Overview",          icon: GraduationCap },
  { id: "planner",         label: "Semester Planner",  icon: Calendar      },
  { id: "recommendations", label: "Recommendations",   icon: Sparkles       },
  { id: "timetable",       label: "Timetable",         icon: Clock3         },
  { id: "events",          label: "Events & Support",  icon: HeartPulse     },
  { id: "search",          label: "Knowledge Search",  icon: Search         },
  { id: "chatbot",         label: "AI Assistant",      icon: Bot            },
  { id: "sentiment",       label: "Sentiment",          icon: BarChart3      },
  { id: "admin",           label: "Admin Portal",      icon: ShieldCheck    },
];

/* ------------------------------------------------------------------ */
/*  API Helper                                                         */
/* ------------------------------------------------------------------ */
const api = {
  async get(path) {
    let response;
    try {
      response = await fetch(path, { credentials: "include" });
    } catch (netErr) {
      throw new Error(`Unable to connect to server. Please ensure the Django backend is running on port 8000.`);
    }
    if (!response.ok) {
      const errorText = await response.text();
      let message = "";
      try {
        const parsed = JSON.parse(errorText);
        message = parsed.detail || parsed.error || parsed.message || (Array.isArray(parsed.non_field_errors) ? parsed.non_field_errors.join(", ") : "");
      } catch (e) {
        message = errorText;
      }
      throw new Error(message || `Server error (${response.status}) on ${path}`);
    }
    return response.json();
  },
  async post(path, body) {
    let response;
    try {
      response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
    } catch (netErr) {
      throw new Error(`Unable to connect to server. Please ensure the Django backend is running on port 8000.`);
    }
    if (!response.ok) {
      const errorText = await response.text();
      let message = "";
      try {
        const parsed = JSON.parse(errorText);
        message = parsed.detail || parsed.error || parsed.message || (Array.isArray(parsed.non_field_errors) ? parsed.non_field_errors.join(", ") : "");
      } catch (e) {
        message = errorText;
      }
      throw new Error(message || `Server error (${response.status}) on ${path}`);
    }
    return response.json();
  },
};

/* ------------------------------------------------------------------ */
/*  App Component                                                      */
/* ------------------------------------------------------------------ */
function App() {
  const [activeTab, setActiveTab]                     = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed]       = useState(false);
  const [recommendationsCollapsed, setRecommendationsCollapsed] = useState(false);
  const [plannerCollapsed, setPlannerCollapsed]       = useState(false);
  const [timetableCollapsed, setTimetableCollapsed]   = useState(false);
  const [enrolledTableCollapsed, setEnrolledTableCollapsed] = useState(false);

  const [profile, setProfile]                         = useState(null);
  const [risk, setRisk]                               = useState(null);
  const [recommendations, setRecommendations]         = useState(null);
  const [timetable, setTimetable]                     = useState([]);
  const [units, setUnits]                             = useState([]);
  const [unitRecommendations, setUnitRecommendations] = useState([]);
  const [events, setEvents]                           = useState([]);
  const [supportEvents, setSupportEvents]             = useState([]);
  const [assignments, setAssignments]                 = useState([]);
  const [searchQuery, setSearchQuery]                 = useState("");
  const [searchResults, setSearchResults]             = useState(null);
  const [hasSearched, setHasSearched]                 = useState(false);
  const [selectedDocument, setSelectedDocument]       = useState(null);

  const [feedback, setFeedback]                       = useState("The tutoring center helped me a lot in Calculus.\nRegistration website was easy to navigate.\nAcademic advising appointments fill up quickly.");
  const [sentiment, setSentiment]                     = useState(null);
  const [question, setQuestion]                       = useState("How do I add or drop units in ASSIS?");
  const [chatbot, setChatbot]                         = useState(null);
  const [loading, setLoading]                         = useState(false);
  const [error, setError]                             = useState("");
  const [enrollMessage, setEnrollMessage]             = useState("");
  const [highContrast, setHighContrast]               = useState(false);
  const [fontSize, setFontSize]                       = useState(100);
  const [plannerPage, setPlannerPage]                 = useState(0);

  /* Student Preferences */
  const [preferredTime, setPreferredTime]             = useState("any");
  const [preferredLecturer, setPreferredLecturer]     = useState("any");

  /* Auth & Landing Page View state */
  const [isSignedOut, setIsSignedOut]                 = useState(false);
  const [authView, setAuthView]                       = useState("landing"); // "landing" | "signin" | "signup"
  const [authUsername, setAuthUsername]               = useState("");
  const [authPassword, setAuthPassword]               = useState("");
  const [authName, setAuthName]                       = useState("");
  const [authProgram, setAuthProgram]                 = useState("Bachelor of Science in Software Engineering");
  const [authYear, setAuthYear]                       = useState(1);
  const [authError, setAuthError]                     = useState("");

  /* Admin State */
  const [isAdmin, setIsAdmin]                         = useState(false);
  const [adminData, setAdminData]                     = useState(null);
  const [adminSubTab, setAdminSubTab]                 = useState("students");
  const [adminMsg, setAdminMsg]                       = useState("");

  /* Admin Form Inputs */
  const [newAssignTitle, setNewAssignTitle]           = useState("");
  const [newAssignType, setNewAssignType]             = useState("assignment");
  const [newAssignUnit, setNewAssignUnit]             = useState("");
  const [newAssignStudent, setNewAssignStudent]       = useState("all");
  const [newAssignPoints, setNewAssignPoints]         = useState(100);
  const [newAssignDueDate, setNewAssignDueDate]       = useState("");

  const [newEventTitle, setNewEventTitle]             = useState("");
  const [newEventCategory, setNewEventCategory]       = useState("School Event");
  const [newEventDate, setNewEventDate]               = useState("");
  const [newEventUnit, setNewEventUnit]               = useState("");
  const [newEventStudent, setNewEventStudent]         = useState("all");

  const [gradeScoreInput, setGradeScoreInput]         = useState({});

  async function loadAdminData() {
    try {
      const data = await api.get("/api/admin/overview/");
      setAdminData(data);
    } catch (err) {
      console.log("Admin load error", err);
    }
  }

  async function handleAdminAddAssignment(e) {
    e.preventDefault();
    setAdminMsg("");
    try {
      const res = await api.post("/api/admin/add-assignment/", {
        title: newAssignTitle,
        assignment_type: newAssignType,
        unit_id: newAssignUnit,
        student_id: newAssignStudent,
        max_score: Number(newAssignPoints),
        due_date: newAssignDueDate || new Date().toISOString().split("T")[0],
      });
      setAdminMsg(res.message || "Assignment added!");
      setNewAssignTitle("");
      loadAdminData();
    } catch (err) {
      setAdminMsg(err.message || "Could not add assignment");
    }
  }

  async function handleAdminAddEvent(e) {
    e.preventDefault();
    setAdminMsg("");
    try {
      const res = await api.post("/api/admin/add-event/", {
        title: newEventTitle,
        category: newEventCategory,
        event_date: newEventDate || new Date().toISOString().split("T")[0],
        unit_id: newEventUnit,
        student_id: newEventStudent,
      });
      setAdminMsg(res.message || "Event published!");
      setNewEventTitle("");
      loadAdminData();
    } catch (err) {
      setAdminMsg(err.message || "Could not publish event");
    }
  }

  async function handleAdminGradeItem(assignmentId, score) {
    setAdminMsg("");
    try {
      const res = await api.post("/api/admin/grade-item/", {
        assignment_id: assignmentId,
        score: Number(score),
        status: "Graded",
      });
      setAdminMsg(res.message || "Item graded successfully!");
      loadAdminData();
    } catch (err) {
      setAdminMsg(err.message || "Could not grade item");
    }
  }

  async function handleSignOut(e) {
    if (e) e.preventDefault();
    try {
      await api.post("/api/auth/logout/", {});
    } catch (err) {
      console.log("Logged out locally");
    }
    // Reset all app state to clean defaults
    setProfile(null);
    setRisk(null);
    setRecommendations(null);
    setTimetable([]);
    setUnits([]);
    setUnitRecommendations([]);
    setEvents([]);
    setSupportEvents([]);
    setAssignments([]);
    setSearchResults(null);
    setSelectedDocument(null);
    setSentiment(null);
    setChatbot(null);
    setError("");
    setEnrollMessage("");
    setAuthView("landing");
    setIsSignedOut(true);
    setIsAdmin(false);
    setAdminData(null);
    announce("Signed out of ASSIS. Showing landing page.");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    const loginUser = authUsername.trim();
    try {
      const res = await api.post("/api/auth/login/", { username: loginUser, password: authPassword });
      if (res.success) {
        setIsSignedOut(false);
        const lowerUser = loginUser.toLowerCase();
        if (res.is_admin || lowerUser.includes("admin")) {
          setIsAdmin(true);
          setActiveTab("admin");
          loadAdminData();
        } else {
          setActiveTab("dashboard");
        }
        setAuthUsername("");
        setAuthPassword("");
        // Reload profile to pick up the authenticated session
        const profileData = await api.get("/api/me/");
        if (profileData && profileData.authenticated && profileData.profile) {
          setProfile(profileData.profile);
        }
        announce("Successfully signed in!");
      }
    } catch (err) {
      setAuthError(err.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register/", {
        username: authUsername,
        password: authPassword,
        name: authName,
        program: authProgram,
        year: authYear,
      });
      if (res.success) {
        setIsSignedOut(false);
        setIsAdmin(false);
        setActiveTab("dashboard");
        setAuthUsername("");
        setAuthPassword("");
        setAuthName("");
        // Reload profile to pick up the authenticated session
        const profileData = await api.get("/api/me/");
        if (profileData && profileData.authenticated && profileData.profile) {
          setProfile(profileData.profile);
        }
        announce("Welcome to ASSIS! Account created successfully.");
      }
    } catch (err) {
      setAuthError(err.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  const liveRegionRef = useRef(null);

  function announce(message) {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = "";
      setTimeout(() => { liveRegionRef.current.textContent = message; }, 50);
    }
  }

  /* 3-Second Auto-Dismiss Notifications */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (enrollMessage) {
      const timer = setTimeout(() => setEnrollMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [enrollMessage]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
      announce("High contrast mode enabled");
    } else {
      document.documentElement.classList.remove("high-contrast");
      announce("High contrast mode disabled");
    }
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
  }, [fontSize]);

  /* Keyboard shortcuts (Universal Design Principle 2) */
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setActiveTab("chatbot");
        announce("Navigated to AI Assistant via Alt+A shortcut");
      } else if (e.altKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        setActiveTab("timetable");
        announce("Navigated to Timetable Engine via Alt+S shortcut");
      } else if (e.altKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        setActiveTab("planner");
        announce("Navigated to Semester Planner via Alt+P shortcut");
      } else if (e.altKey && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        setActiveTab("events");
        announce("Navigated to Events & Support via Alt+E shortcut");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    loadProfile();
    loadRisk();
  }, []);

  useEffect(() => {
    if (profile) {
      loadRecommendations(profile.student_id);
      loadTimetable();
      loadUnits(profile.current_semester);
      loadUnitRecommendations(preferredTime, preferredLecturer);
      loadEvents();
      loadAssignments();
    }
  }, [profile]);

  useEffect(() => {
    setPlannerPage(0);
  }, [units]);

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
    try {
      const data = await api.get("/api/me/");
      if (data && data.authenticated && data.profile) {
        setProfile(data.profile);
        setIsSignedOut(false);
        const isAdminUser = Boolean(data.is_admin);
        setIsAdmin(isAdminUser);
        if (isAdminUser) {
          loadAdminData();
        } else if (activeTab === "admin") {
          setActiveTab("dashboard");
        }
      } else {
        // User is not authenticated - show landing page
        setProfile(null);
        setIsSignedOut(true);
        setIsAdmin(false);
      }
    } catch (err) {
      console.log("Profile load notice", err);
      setProfile(null);
      setIsSignedOut(true);
    }
  }

  async function loadRecommendations(studentId) {
    if (!studentId) return;
    try {
      const data = await api.get(`/api/recommendations/?student_id=${encodeURIComponent(studentId)}`);
      setRecommendations(data);
    } catch (err) {
      /* ignore */
    }
  }

  async function loadRisk() {
    try {
      setRisk(await api.get("/api/risk/"));
    } catch (err) {
      /* ignore */
    }
  }

  async function loadTimetable() {
    try {
      const data = await api.get("/api/timetable/");
      setTimetable(data.timetable || []);
    } catch (err) {
      /* ignore */
    }
  }

  async function loadUnits(semester) {
    if (!semester) return;
    try {
      const data = await api.get(`/api/units/?semester=${encodeURIComponent(semester)}`);
      setUnits(data.units || []);
    } catch (err) {
      /* ignore */
    }
  }

  async function loadUnitRecommendations(timePref = preferredTime, lecPref = preferredLecturer) {
    try {
      const url = `/api/units/recommendations/?preferred_time=${encodeURIComponent(timePref)}&preferred_lecturer=${encodeURIComponent(lecPref)}`;
      const data = await api.get(url);
      setUnitRecommendations(data.recommendations || []);
    } catch (err) {
      /* ignore */
    }
  }

  function handlePreferenceChange(timeVal, lecVal) {
    setPreferredTime(timeVal);
    setPreferredLecturer(lecVal);
    loadUnitRecommendations(timeVal, lecVal);
    announce(`Preferences updated: Time ${timeVal}, Lecturer ${lecVal}`);
  }

  async function loadEvents() {
    try {
      const data = await api.get("/api/events/");
      setEvents(data.activities || data.events || []);
      setSupportEvents(data.support_events || []);
    } catch (err) {
      /* ignore */
    }
  }

  async function loadAssignments() {
    try {
      const data = await api.get("/api/assignments/");
      setAssignments(data.assignments || []);
    } catch (err) {
      /* ignore */
    }
  }

  async function enrollUnit(unitId) {
    setEnrollMessage("");
    setError("");
    try {
      const data = await api.post("/api/units/enroll/", { unit_id: unitId });
      const msg = data.detail || "Enrolled successfully.";
      setEnrollMessage(msg);
      announce(msg);
      loadTimetable();
      loadUnitRecommendations(preferredTime, preferredLecturer);
      if (profile) loadUnits(profile.current_semester);
    } catch (err) {
      const msg = err.message || "Enrollment error.";
      setEnrollMessage(msg);
      announce(msg);
    }
  }

  async function dropUnit(unitId) {
    setEnrollMessage("");
    setError("");
    try {
      const data = await api.post("/api/units/drop/", { unit_id: unitId });
      const msg = data.detail || "Dropped unit successfully.";
      setEnrollMessage(msg);
      announce(msg);
      loadTimetable();
      loadUnitRecommendations(preferredTime, preferredLecturer);
      if (profile) loadUnits(profile.current_semester);
    } catch (err) {
      const msg = err.message || "Drop error.";
      setEnrollMessage(msg);
      announce(msg);
    }
  }

  async function runSearch(queryToUse) {
    const q = typeof queryToUse === "string" ? queryToUse : searchQuery;
    if (!q || !q.trim()) return;
    setHasSearched(true);
    runAction(
      async () => setSearchResults(await api.get(`/api/knowledge-search/?q=${encodeURIComponent(q)}`)),
      "Search results loaded."
    );
  }

  async function runSentiment() {
    runAction(async () => {
      const feedbackItems = feedback.split("\n").map((item) => item.trim()).filter(Boolean);
      setSentiment(await api.post("/api/sentiment/", { feedback: feedbackItems }));
    }, "Sentiment analysis complete.");
  }

  async function askChatbot(overrideQuestion) {
    const q = typeof overrideQuestion === "string" ? overrideQuestion : question;
    if (!q || !q.trim()) return;
    runAction(async () => {
      setChatbot(await api.post("/api/chatbot/", { question: q, student_id: profile?.student_id }));
    }, "AI Assistant response received.");
  }

  /* Safely compute riskInfo to prevent crashes */
  const riskInfo = useMemo(() => {
    if (!risk) return null;
    if (risk.score !== undefined && risk.level !== undefined) return risk;
    if (risk.predictions && risk.predictions.length > 0) {
      const pred = risk.predictions[0];
      const score = pred.risk_score || 0;
      const level = pred.risk_level || (score >= 70 ? "high" : score >= 40 ? "moderate" : "low");
      const tone = level === "high" ? "danger" : level === "moderate" ? "warning" : "success";
      return {
        score,
        level,
        tone,
        signals: pred.signals || [],
        interventions: pred.interventions || [],
      };
    }
    return null;
  }, [risk]);

  /* List of enrolled unit IDs */
  const enrolledUnitIds = useMemo(() => {
    if (!timetable.length) return new Set();
    return new Set(timetable.map((item) => item.unit?.unit_id).filter(Boolean));
  }, [timetable]);

  const enrolledUnitsList = useMemo(() => {
    if (!timetable.length) return [];
    const map = new Map();
    timetable.forEach((item) => {
      if (item.unit && item.unit.unit_id) {
        if (!map.has(item.unit.unit_id)) {
          map.set(item.unit.unit_id, {
            unit: item.unit,
            section: item.section,
            sessions: timetable.filter((s) => s.unit?.unit_id === item.unit.unit_id),
          });
        }
      }
    });
    return [...map.values()];
  }, [timetable]);

  /* Helper: Detect if a unit's sessions conflict with any existing session in timetable */
  function findScheduleConflict(targetUnit) {
    if (!targetUnit) return null;
    const targetUnitId = targetUnit.unit_id;
    if (enrolledUnitIds.has(targetUnitId)) return null;

    const sections = targetUnit.sections || [];
    if (!sections.length) return null;

    const firstSec = sections[0];
    const newSessions = firstSec.sessions || [];

    for (const newSess of newSessions) {
      const newDay = (newSess.day_of_week || "").toLowerCase();
      const newStart = newSess.start_time || "";
      const newEnd = newSess.end_time || "";
      if (!newDay || !newStart || !newEnd) continue;

      for (const exSess of timetable) {
        const exUnitId = exSess.unit?.unit_id;
        if (!exUnitId || exUnitId === targetUnitId) continue;

        const exDay = (exSess.day_of_week || "").toLowerCase();
        if (newDay === exDay) {
          const exStart = exSess.start_time || "";
          const exEnd = exSess.end_time || "";
          if (newStart < exEnd && exStart < newEnd) {
            return {
              day: newDay.toUpperCase(),
              time: `${newStart}-${newEnd}`,
              conflictingUnit: exUnitId,
            };
          }
        }
      }
    }
    return null;
  }

  /* Organize timetable by day of week */
  const daysOfWeek = ["mon", "tue", "wed", "thu", "fri", "sat"];
  const dayNames = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" };

  const timetableByDay = useMemo(() => {
    const map = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [] };
    timetable.forEach((session) => {
      const day = (session.day_of_week || "").toLowerCase();
      if (map[day]) {
        map[day].push(session);
      }
    });
    Object.keys(map).forEach((d) => {
      map[d].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
    });
    return map;
  }, [timetable]);

  /* ------------------------------------------------------------------ */
  /*  Full-Screen Standalone Light-Themed Landing Page View              */
  /* ------------------------------------------------------------------ */
  if (isSignedOut) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] text-slate-800 flex flex-col font-sans selection:bg-sky-600 selection:text-white antialiased">
        <div ref={liveRegionRef} role="status" aria-live="polite" className="sr-only" />

        {/* Navigation Bar */}
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAuthView("landing")}>
              <div className="p-2.5 rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
                <GraduationCap size={24} />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900">ASSIS</span>
                <span className="block text-[10px] text-sky-600 font-bold uppercase tracking-widest">Academic Support System</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setAuthView("signin"); setAuthError(""); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${authView === "signin" ? "bg-sky-600 text-white shadow-md shadow-sky-600/20" : "text-slate-700 hover:bg-slate-100"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthView("signup"); setAuthError(""); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${authView === "signup" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-slate-900 text-white hover:bg-slate-800"}`}
              >
                Join ASSIS
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-7xl w-full mx-auto">
          {authError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 max-w-md w-full shadow-sm">
              <AlertTriangle size={18} className="text-rose-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* VIEW 1: LANDING PAGE OVERVIEW */}
          {authView === "landing" && (
            <div className="w-full space-y-12 py-6 animate-fade-in">
              {/* Hero Header */}
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200/80 shadow-xs">
                  <Sparkles size={14} className="text-sky-600" />
                  Official Academic Support & Student Success Portal
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  All-in-One Academic Support <br className="hidden sm:inline" />& Course Guidance Portal
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
                  ASSIS provides university students with a unified workspace to manage course registrations, organize weekly schedules, search institutional policies, access 24/7 AI academic guidance, and track academic wellbeing.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthView("signin")}
                    className="px-6 py-3 rounded-2xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-all shadow-md shadow-sky-600/20 cursor-pointer hover:scale-105"
                  >
                    Sign In to Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthView("signup")}
                    className="px-6 py-3 rounded-2xl bg-white text-slate-800 text-xs font-bold hover:bg-slate-50 transition-all border border-slate-300 shadow-xs cursor-pointer hover:scale-105"
                  >
                    Create Student Account
                  </button>
                </div>
              </div>

              {/* 4 Main Core Functions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-sky-300 transition-all space-y-3 group shadow-xs hover:shadow-md">
                  <div className="p-3 rounded-2xl bg-sky-100 text-sky-700 w-fit group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Calendar size={24} />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900">Semester Planning & Course Registration</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Browse degree curriculum units, review core prerequisites, enroll in semester courses, and track completed credits towards graduation.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-indigo-300 transition-all space-y-3 group shadow-xs hover:shadow-md">
                  <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-700 w-fit group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Clock3 size={24} />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900">Weekly Timetable Management</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    View your weekly class schedule organized cleanly by day and time slots with detailed room locations, lecturers, and section codes.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-purple-300 transition-all space-y-3 group shadow-xs hover:shadow-md">
                  <div className="p-3 rounded-2xl bg-purple-100 text-purple-700 w-fit group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Bot size={24} />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900">24/7 AI Assistant & Search</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Search official university policy documents, query add/drop guidelines, and receive instant, personalized AI answers for your academic questions.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-amber-300 transition-all space-y-3 group shadow-xs hover:shadow-md">
                  <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 w-fit group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <BarChart3 size={24} />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900">Academic Analytics & Wellbeing</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Monitor attendance rates, GPA benchmarks, upcoming assignment deadlines, early-risk alerts, and upcoming campus support workshops.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: SIGN IN FORM */}
          {authView === "signin" && (
            <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 animate-scale-up">
              <div className="text-center space-y-2">
                <div className="p-3 rounded-2xl bg-sky-100 text-sky-700 w-fit mx-auto">
                  <GraduationCap size={28} />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Sign In to ASSIS</h2>
                <p className="text-xs text-slate-500">Enter your credentials to access your student workspace</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username / Student ID</label>
                  <input
                    type="text"
                    required
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="e.g. admin or 669767"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-all shadow-md shadow-sky-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </form>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAuthView("landing")}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  ← Back to Overview
                </button>
                <button
                  type="button"
                  onClick={() => setAuthView("signup")}
                  className="text-sky-600 font-bold hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: SIGN UP FORM */}
          {authView === "signup" && (
            <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5 animate-scale-up">
              <div className="text-center space-y-2">
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 w-fit mx-auto">
                  <Sparkles size={28} />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Join ASSIS Platform</h2>
                <p className="text-xs text-slate-500">Create your student profile for personalized course guidance</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username / Student ID</label>
                  <input
                    type="text"
                    required
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="Choose a username or student ID"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Choose a password"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Degree Program</label>
                  <select
                    value={authProgram}
                    onChange={(e) => setAuthProgram(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="Bachelor of Science in Software Engineering">Bachelor of Science in Software Engineering</option>
                    <option value="Bachelor of Science in Data Science and Analytics">Bachelor of Science in Data Science and Analytics</option>
                    <option value="Bachelor of Science in Artificial Intelligence and Robotics">Bachelor of Science in Artificial Intelligence and Robotics</option>
                    <option value="Bachelor of Science in Information Systems Technology">Bachelor of Science in Information Systems Technology</option>
                    <option value="Bachelor of Science in Applied Computer Technology">Bachelor of Science in Applied Computer Technology</option>
                    <option value="Bachelor of Science in Cybersecurity">Bachelor of Science in Cybersecurity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Study Year</label>
                  <select
                    value={authYear}
                    onChange={(e) => setAuthYear(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value={1}>Year 1 (Freshman)</option>
                    <option value={2}>Year 2 (Sophomore)</option>
                    <option value={3}>Year 3 (Junior)</option>
                    <option value={4}>Year 4 (Senior)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Creating Account..." : "Create Account & Sign In"}
                </button>
              </form>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAuthView("landing")}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  ← Back to Overview
                </button>
                <button
                  type="button"
                  onClick={() => setAuthView("signin")}
                  className="text-sky-600 font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f6f8fb] text-slate-800 antialiased font-sans">
      <div ref={liveRegionRef} role="status" aria-live="polite" className="sr-only" />

      {/* ============================================================
          SIDEBAR — Full-Height (100vh), Collapsible
          ============================================================ */}
      <aside
        className={`sticky top-0 h-screen flex-shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between transition-all duration-300 z-30 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
        aria-label="Main Navigation"
      >
        <div>
          {/* Sidebar Header */}
          <div className="flex h-14 items-center justify-between border-b border-slate-100 px-3">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white font-black text-sm shadow-xs">
                  A
                </div>
                <span className="font-extrabold text-slate-900 text-base tracking-tight">ASSIS</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* Nav Links */}
          <nav className="p-2 space-y-1">
            {tabs
              .filter((t) => (isAdmin ? t.id === "admin" : t.id !== "admin"))
              .map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    title={sidebarCollapsed ? t.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-sky-50 text-sky-700 font-bold border border-sky-200"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
                  >
                    <Icon size={18} className={isActive ? "text-sky-600" : "text-slate-400"} />
                    {!sidebarCollapsed && <span>{t.label}</span>}
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Sidebar Footer / User Profile summary */}
        {!sidebarCollapsed && profile && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs border border-sky-300">
                {profile.name ? profile.name.charAt(0).toUpperCase() : "S"}
              </div>
              <div className="overflow-hidden text-left">
                <div className="text-xs font-bold text-slate-900 truncate">{profile.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{isAdmin ? "Administrator" : (profile.program || "Student")}</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ============================================================
          MAIN WRAPPER — Aesthetic Header + View Content
          ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Aesthetic Header Bar */}
        <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[11px] font-bold text-sky-700">
                  <GraduationCap size={12} /> {isAdmin ? "Admin Portal" : "AI Student Support"}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                {isAdmin
                  ? "Administrator Portal • System Management & Student Support Overview"
                  : `${profile?.program || "Academic Program"} • Intelligent Recommendations & Schedule Planner`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {profile && (
              <span className="hidden xl:inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{profile.name}</span>
                <span className="text-slate-400">•</span>
                <span>{isAdmin ? "System Administrator" : `${profile.program || "Student"} (Year ${profile.year})`}</span>
              </span>
            )}

            {/* Accessibility toggles */}
            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {highContrast ? "Normal Contrast" : "⚡ High Contrast"}
            </button>

            <div className="hidden sm:flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setFontSize((prev) => Math.min(130, prev + 10))}
                className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-white rounded transition-colors"
                title="Increase text size"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSize((prev) => Math.max(90, prev - 10))}
                className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-white rounded transition-colors"
                title="Decrease text size"
              >
                A-
              </button>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors shrink-0 cursor-pointer shadow-xs"
              title="Sign Out of ASSIS"
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        </header>

        {/* Content Container */}
        <main className="p-5 max-w-7xl w-full mx-auto space-y-5">

          {/* 3-Second Auto-Dismiss Notification Banners */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs transition-all duration-300 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Auto-dismiss in 3s</span>
            </div>
          )}

          {enrollMessage && (
            <div className={`p-3.5 rounded-xl border text-sm flex items-center justify-between shadow-xs transition-all duration-300 animate-fade-in ${
              enrollMessage.toLowerCase().includes("conflict") || enrollMessage.toLowerCase().includes("error") || enrollMessage.toLowerCase().includes("maximum")
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}>
              <div className="flex items-center gap-2">
                {enrollMessage.toLowerCase().includes("conflict") || enrollMessage.toLowerCase().includes("error") ? (
                  <AlertTriangle size={18} className="shrink-0 text-rose-600" />
                ) : (
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                )}
                <span>{enrollMessage}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Auto-dismiss in 3s</span>
            </div>
          )}

          {/* ============================================================
              TAB 1: OVERVIEW / DASHBOARD
              ============================================================ */}
          {activeTab === "dashboard" && (
            <div className="space-y-5">
              {/* Student Motivational Quote Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 shrink-0 border border-sky-400/30">
                    <Sparkles size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-semibold italic text-sky-100 leading-relaxed">
                      "Knowledge is power. ASSIS is designed to empower your academic journey—simplifying course selection, schedule organization, and proactive campus support every step of the way."
                    </p>
                    <div className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5 pt-0.5">
                      <GraduationCap size={13} />
                      <span>ASSIS Student Academic Success Promise</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Card */}
              {profile && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">{profile.name}</h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Student ID: <span className="font-bold text-slate-700">{profile.student_id}</span> • Course: <span className="font-bold text-slate-700">{profile.program}</span> (Year {profile.year})
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 font-bold text-xs self-start sm:self-auto">
                      {profile.current_semester || "Fall"} Semester
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-slate-50 text-center"><span className="font-bold text-slate-800">Attendance</span><br /><span className="text-slate-500">{profile?.attendance || 0}%</span></div>
                    <div className="p-2 rounded bg-slate-50 text-center"><span className="font-bold text-slate-800">GPA Score</span><br /><span className="text-slate-500">{profile?.gpa ? Number(profile.gpa).toFixed(2) : "N/A"}</span></div>
                    <div className="p-2 rounded bg-slate-50 text-center"><span className="font-bold text-slate-800">LMS Activity</span><br /><span className="text-slate-500">{profile?.lms_activity || 0}%</span></div>
                    <div className="p-2 rounded bg-slate-50 text-center"><span className="font-bold text-slate-800">Assignments</span><br /><span className="text-slate-500">{profile?.assignments_submitted || 0}%</span></div>
                    <div className="p-2 rounded bg-slate-50 text-center"><span className="font-bold text-slate-800">Wellbeing</span><br /><span className="text-slate-500">{profile?.wellbeing_score || 0}/100</span></div>
                  </div>
                </div>
              )}

              {/* Academic Risk Banner */}
              {riskInfo && (
                <div className={`p-4 rounded-xl border ${riskInfo.tone === "danger" ? "bg-rose-50/50 border-rose-200" : riskInfo.tone === "warning" ? "bg-amber-50/50 border-amber-200" : "bg-emerald-50/50 border-emerald-200"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                      <AlertTriangle size={18} className={riskInfo.tone === "danger" ? "text-rose-600" : riskInfo.tone === "warning" ? "text-amber-600" : "text-emerald-600"} />
                      <span>Academic Early Alert Status</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${riskInfo.tone === "danger" ? "bg-rose-100 text-rose-800" : riskInfo.tone === "warning" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {riskInfo.level} Risk ({riskInfo.score}%)
                    </span>
                  </div>
                  {riskInfo.signals?.length > 0 && (
                    <div className="text-xs text-slate-600 mt-1">
                      <span className="font-semibold text-slate-800">Signals: </span>
                      {riskInfo.signals.join(" • ")}
                    </div>
                  )}
                </div>
              )}

              {/* 3-column grid: Timetable + Upcoming Assignments + Events */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Timetable */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Clock3 size={16} className="text-sky-600" />
                      Class Schedule
                    </h3>
                    <button type="button" onClick={() => setActiveTab("timetable")} className="text-xs font-bold text-sky-600 hover:underline">
                      Full View &rarr;
                    </button>
                  </div>
                  {timetable.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No units enrolled yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {timetable.slice(0, 5).map((session, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                          <div>
                            <div className="font-bold text-slate-900">{session.unit?.unit_id}: {session.unit?.title}</div>
                            <div className="text-slate-500 text-[11px]">{session.section?.section_code || "Sec A"} • {session.venue || "Campus"}</div>
                          </div>
                          <span className="px-2 py-1 rounded bg-sky-100 text-sky-800 font-semibold uppercase text-[11px] shrink-0 ml-1">
                            {session.day_of_week} {session.start_time}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upcoming Assignments */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <FileText size={16} className="text-indigo-600" />
                      Upcoming Assignments
                    </h3>
                    <span className="text-xs text-slate-500 font-semibold">{assignments.length} total</span>
                  </div>
                  {assignments.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No assignments found.</p>
                  ) : (
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {assignments.slice(0, 5).map((a, idx) => {
                        const dueDate = a.due_date ? new Date(a.due_date + "T00:00:00") : null;
                        const formatted = dueDate ? dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
                        const isOverdue = dueDate && dueDate < new Date();
                        const isGraded = a.status === "Graded" || a.status === "Completed";
                        return (
                          <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-slate-900 truncate">{a.title}</div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ml-1 ${isGraded ? "bg-emerald-100 text-emerald-800" : isOverdue ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                                {isGraded ? "✓ Graded" : isOverdue ? "Overdue" : formatted}
                              </span>
                            </div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              {a.assignment_type || "Assignment"} {a.unit?.unit_id ? `• ${a.unit.unit_id}` : ""}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Events Preview */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <HeartPulse size={16} className="text-rose-500" />
                      Events & Support
                    </h3>
                    <button type="button" onClick={() => setActiveTab("events")} className="text-xs font-bold text-sky-600 hover:underline">
                      View All &rarr;
                    </button>
                  </div>
                  {events.length === 0 && supportEvents.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No upcoming events.</p>
                  ) : (
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {[...supportEvents.slice(0, 3), ...events.slice(0, 2)].map((evt, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 truncate">{evt.title}</div>
                            <div className="text-slate-500 text-[11px] truncate">
                              {evt.type === "support_event" ? (evt.tags?.join(", ") || "Support") : evt.category}
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 font-bold text-[11px] shrink-0 ml-2">
                            Academic
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 2: SEMESTER PLANNER
              (Order: 1. Recommendations -> 2. Catalog -> 3. Currently Enrolled Table AT BOTTOM)
              ============================================================ */}
          {activeTab === "planner" && (
            <div className="space-y-5">

              {/* CARD 1: Student Preferences Selector & Top 5 AI Recommended Units */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500" />
                    <div>
                      <h2 className="font-bold text-slate-900 text-base">Top 5 Recommended Units ({profile?.program ? profile.program.replace(/^Bachelor of Science in /i, "") : "Your Track"})</h2>
                      <p className="text-[11px] text-slate-500">Filtered for {profile?.program || "Degree Track"} • Year {profile?.year || 1} • Prerequisites Met • Zero Clashes</p>
                    </div>
                  </div>

                  {/* Preference Controls Bar */}
                  <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Filter size={13} className="text-sky-600" /> Preferences:
                    </span>
                    <select
                      value={preferredTime}
                      onChange={(e) => handlePreferenceChange(e.target.value, preferredLecturer)}
                      className="px-2 py-1 rounded border border-slate-300 text-xs bg-slate-50 font-medium focus:outline-hidden"
                    >
                      <option value="any">Any Time Slot</option>
                      <option value="morning">Morning (7 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                      <option value="evening">Evening (4 PM - 9 PM)</option>
                    </select>

                    <select
                      value={preferredLecturer}
                      onChange={(e) => handlePreferenceChange(preferredTime, e.target.value)}
                      className="px-2 py-1 rounded border border-slate-300 text-xs bg-slate-50 font-medium focus:outline-hidden"
                    >
                      <option value="any">Any Lecturer</option>
                      <option value="Alice Johnson">Dr. Alice Johnson</option>
                      <option value="David Smith">Prof. David Smith</option>
                      <option value="Michael Lee">Dr. Michael Lee</option>
                    </select>
                  </div>
                </div>

                <div className="p-4">
                  {unitRecommendations.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No matching unit recommendations available for current preferences.
                    </p>
                  ) : (
                    <div className="border border-slate-100 rounded-lg divide-y divide-slate-100">
                      {unitRecommendations.slice(0, 5).map((rec, idx) => {
                        const unit = rec.unit || rec;
                        const isEnrolled = enrolledUnitIds.has(unit.unit_id);
                        const conflict = findScheduleConflict(unit);

                        return (
                          <div key={idx} className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{unit.unit_id}</span>
                                <span className="font-semibold text-slate-800 truncate">{unit.title}</span>
                                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[11px] font-bold">
                                  {rec.score || 95}% Match
                                </span>
                              </div>
                              <p className="text-slate-500 text-[11px] mt-0.5 truncate max-w-xl">
                                {rec.reason || `Required for ${profile?.program || "degree"} track.`}
                              </p>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                              {isEnrolled ? (
                                <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                                  <CheckCircle2 size={13} /> Enrolled
                                </span>
                              ) : conflict ? (
                                <button
                                  type="button"
                                  onClick={() => setEnrollMessage(`Schedule Conflict: ${unit.unit_id} (${conflict.day} ${conflict.time}) conflicts with enrolled ${conflict.conflictingUnit}. Student cannot have 2 classes at the same time.`)}
                                  className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-bold text-xs border border-amber-300 flex items-center gap-1 hover:bg-amber-100"
                                >
                                  <AlertTriangle size={13} /> Time Conflict
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => enrollUnit(unit.unit_id)}
                                  className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-xs"
                                >
                                  <PlusCircle size={14} /> Select Unit
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 2: Course Catalog */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Calendar size={18} className="text-sky-600" />
                      Course Catalog ({profile?.program ? profile.program.replace(/^Bachelor of Science in /i, "") : "All Courses"})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Showing course units for {profile?.current_semester || "Fall"} semester.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPlannerCollapsed(!plannerCollapsed)}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
                  >
                    {plannerCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {!plannerCollapsed && (
                  <div className="p-4">
                    {units.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">Loading course units...</p>
                    ) : (
                      <>
                        <div className="border border-slate-100 rounded-lg divide-y divide-slate-100">
                          {units.slice(plannerPage * 5, plannerPage * 5 + 5).map((unit) => {
                            const isEnrolled = enrolledUnitIds.has(unit.unit_id);
                            const sectionInfo = unit.sections?.[0];
                            const timeDisplay = sectionInfo?.sessions?.[0]
                              ? `${sectionInfo.sessions[0].day_of_week?.toUpperCase()} ${sectionInfo.sessions[0].start_time}`
                              : "TBD";
                            const conflict = findScheduleConflict(unit);

                            return (
                              <div key={unit.unit_id} className="p-3 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">{unit.unit_id}</span>
                                    <span className="font-semibold text-slate-700 truncate">{unit.title}</span>
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                                      {unit.credits || 12} credits
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                                    <span>🕐 {timeDisplay}</span>
                                    <span>🏫 {sectionInfo?.section_code || "Section A"}</span>
                                  </div>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                  {isEnrolled ? (
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                                        <CheckCircle2 size={13} /> Enrolled
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => dropUnit(unit.unit_id)}
                                        className="px-2 py-1 rounded text-rose-600 hover:bg-rose-50 font-semibold text-xs border border-rose-200"
                                      >
                                        Drop
                                      </button>
                                    </div>
                                  ) : conflict ? (
                                    <button
                                      type="button"
                                      onClick={() => setEnrollMessage(`Schedule Conflict: ${unit.unit_id} (${conflict.day} ${conflict.time}) conflicts with enrolled ${conflict.conflictingUnit}. Student cannot have 2 classes at the same time.`)}
                                      className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-bold text-xs border border-amber-300 flex items-center gap-1 hover:bg-amber-100"
                                    >
                                      <AlertTriangle size={13} /> Time Conflict
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => enrollUnit(unit.unit_id)}
                                      className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors flex items-center gap-1"
                                    >
                                      <PlusCircle size={14} /> Select Unit
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                          <span className="text-[11px] text-slate-500">
                            Showing {plannerPage * 5 + 1}–{Math.min(plannerPage * 5 + 5, units.length)} of {units.length} course units
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPlannerPage(Math.max(0, plannerPage - 1))}
                              disabled={plannerPage === 0}
                              className="px-3 py-1 rounded text-xs font-bold border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                            >
                              ← Prev
                            </button>
                            <button
                              type="button"
                              onClick={() => setPlannerPage(Math.min(Math.ceil(units.length / 5) - 1, plannerPage + 1))}
                              disabled={plannerPage >= Math.ceil(units.length / 5) - 1}
                              className="px-3 py-1 rounded text-xs font-bold border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                            >
                              Next →
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* CARD 3: Currently Enrolled Units Table (MOVED TO BOTTOM OF PLANNER PAGE) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <h2 className="font-bold text-slate-900 text-base">Currently Enrolled Units</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      enrolledUnitIds.size >= 5 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      Enrolled: {enrolledUnitIds.size} / 5 Max Units
                    </span>
                    <button
                      type="button"
                      onClick={() => setEnrolledTableCollapsed(!enrolledTableCollapsed)}
                      className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
                    >
                      {enrolledTableCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {!enrolledTableCollapsed && (
                  <div className="p-4">
                    {enrolledUnitsList.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">
                        You have not enrolled in any units yet for {profile?.current_semester || "Fall"} semester. Select units above to add them to your plan.
                      </p>
                    ) : (
                      <div className="border border-slate-100 rounded-lg divide-y divide-slate-100">
                        {enrolledUnitsList.map(({ unit, section, sessions }) => {
                          const timeDisplay = sessions && sessions.length > 0
                            ? sessions.map((s) => `${s.day_of_week?.toUpperCase()} ${s.start_time}-${s.end_time}`).join(", ")
                            : "TBD";
                          return (
                            <div key={unit.unit_id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm">{unit.unit_id}</span>
                                  <span className="font-semibold text-slate-800 truncate">{unit.title}</span>
                                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                    {unit.credits || 12} credits
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                                  <span>🕐 {timeDisplay}</span>
                                  <span>🏫 {section?.section_code || "Section A"}</span>
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => dropUnit(unit.unit_id)}
                                  className="px-3 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors flex items-center gap-1.5"
                                >
                                  <Trash2 size={14} /> Drop Unit
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ============================================================
              TAB 3: RECOMMENDATIONS
              ============================================================ */}
          {activeTab === "recommendations" && (
            <div className="space-y-5">
              {/* Course Recommendations */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500" />
                    <h2 className="font-bold text-slate-900 text-base">Top 5 Recommended Units ({profile?.program ? profile.program.replace(/^Bachelor of Science in /i, "") : "Your Track"})</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecommendationsCollapsed(!recommendationsCollapsed)}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
                  >
                    {recommendationsCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {!recommendationsCollapsed && (
                  <div className="p-4">
                    {unitRecommendations.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No unit recommendations available.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {unitRecommendations.slice(0, 5).map((rec, idx) => {
                          const unit = rec.unit || rec;
                          const isEnrolled = enrolledUnitIds.has(unit.unit_id);
                          const conflict = findScheduleConflict(unit);

                          return (
                            <div key={idx} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-900 text-sm">{unit.unit_id}</span>
                                  <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[11px] font-bold">
                                    Match Score: {rec.score || 95}%
                                  </span>
                                </div>
                                <h4 className="font-semibold text-slate-800 text-xs mb-1">{unit.title}</h4>
                                <p className="text-slate-500 text-[11px] line-clamp-2">
                                  {rec.reason || `Recommended for ${profile?.program || "degree"} track.`}
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {unit.credits || 12} credits
                                </span>
                                {isEnrolled ? (
                                  <span className="px-3 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                                    <CheckCircle2 size={13} /> Enrolled
                                  </span>
                                ) : conflict ? (
                                  <button
                                    type="button"
                                    onClick={() => setEnrollMessage(`Schedule Conflict: ${unit.unit_id} (${conflict.day} ${conflict.time}) conflicts with enrolled ${conflict.conflictingUnit}. Student cannot have 2 classes at the same time.`)}
                                    className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-bold text-xs border border-amber-300 flex items-center gap-1 hover:bg-amber-100"
                                  >
                                    <AlertTriangle size={13} /> Time Conflict
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => enrollUnit(unit.unit_id)}
                                    className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors flex items-center gap-1"
                                  >
                                    <PlusCircle size={13} /> Enroll Now
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Student Support & Optional School Activities Recommendations */}
              {recommendations?.recommendations && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                        <HeartPulse size={18} className="text-rose-500" />
                        Recommended Optional School Activities & Workshops
                      </h3>
                      <p className="text-xs text-slate-500">
                        Personalized optional activities tailored for Year {profile?.year || 1} level & current academic status ({profile?.gpa ? `GPA ${Number(profile.gpa).toFixed(2)}` : "Good Standing"})
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shrink-0">
                      Student-Independent Recommendations
                    </span>
                  </div>

                  <div className="space-y-3">
                    {recommendations.recommendations.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all text-xs space-y-2 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">{item.title}</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px]">
                              {item.category || "Optional Activity"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                              {item.level_label || `Year ${profile?.year || 1}`}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              item.status_label?.includes("High") ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            }`}>
                              {item.status_label || "Academic Progress"}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{item.description}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                          <span className="text-slate-500 font-medium italic">💡 {item.reason || "Optional activity based on academic level & progress."}</span>
                          <span className="px-3 py-1 rounded bg-slate-900 text-white font-bold text-[10px] cursor-pointer hover:bg-slate-800">
                            Optional • RSVP Activity
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB 4: TIMETABLE
              ============================================================ */}
          {activeTab === "timetable" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Clock3 size={18} className="text-sky-600" />
                    Weekly Class Schedule & Timetable Engine
                  </h2>
                  <p className="text-xs text-slate-500">
                    Total Enrolled Sessions: {timetable.length}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTimetableCollapsed(!timetableCollapsed)}
                  className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  {timetableCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {!timetableCollapsed && (
                <div className="p-4">
                  {timetable.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">
                      No classes enrolled yet. Head to the Semester Planner to choose your units.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {daysOfWeek.map((day) => {
                        const sessions = timetableByDay[day] || [];
                        return (
                          <div key={day} className="rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col">
                            {/* Day Header */}
                            <div className="p-2.5 border-b border-slate-200 text-center font-bold text-xs bg-slate-100 text-slate-800 uppercase tracking-wider">
                              {dayNames[day]}
                              <span className="ml-1 text-[10px] text-slate-500 font-normal">({sessions.length})</span>
                            </div>

                            {/* Sessions List */}
                            <div className="p-2 space-y-2 flex-1 min-h-[160px]">
                              {sessions.length === 0 ? (
                                <div className="text-[11px] text-slate-400 text-center py-6">No classes</div>
                              ) : (
                                sessions.map((sess, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded-md border border-sky-200 bg-sky-50/80 text-xs shadow-2xs space-y-1"
                                  >
                                    <div className="font-bold text-sky-950 text-xs leading-tight">
                                      {sess.unit?.unit_id}
                                    </div>
                                    <div className="text-sky-900 text-[11px] font-medium line-clamp-1">
                                      {sess.unit?.title}
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-sky-700 font-semibold pt-1 border-t border-sky-200/60">
                                      <span>{sess.start_time} - {sess.end_time}</span>
                                      <span>{sess.venue || "Room 101"}</span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB 5: EVENTS & SUPPORT PAGE
              ============================================================ */}
          {activeTab === "events" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <HeartPulse size={18} className="text-rose-500" />
                      Academic Events, Workshops & Support Services
                    </h2>
                    <p className="text-xs text-slate-500">
                      Explore academic workshops, tutoring, peer study groups, and support resources.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-xs">
                    {events.length + supportEvents.length} Active Events
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Academic Activities & Workshops */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Academic Coaching & Workshops
                    </h3>
                    {events.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4">No scheduled workshops.</p>
                    ) : (
                      events.map((evt, idx) => (
                        <div key={idx} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">{evt.title}</span>
                            <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10px]">
                              {evt.category || "Academic"}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px]">
                            Scheduled Date: {evt.event_date || "Upcoming"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Support Resources & Institutional Events */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Institutional Support Resources
                    </h3>
                    {supportEvents.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4">No support items listed.</p>
                    ) : (
                      supportEvents.map((evt, idx) => (
                        <div key={idx} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">{evt.title}</span>
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                              Support Event
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px]">
                            {evt.tags?.join(" • ") || "General Support"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 6: KNOWLEDGE SEARCH (With Interactive Document Viewer Modal)
              ============================================================ */}
          {activeTab === "search" && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Search size={18} className="text-sky-600" />
                Intelligent Institutional Knowledge Base Search
              </h2>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
                    placeholder="Search policies (e.g. How to add or drop units, Financial Aid, Tutoring)..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-sky-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => runSearch()}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Search size={14} /> Search
                  </button>
                </div>
                {/* Search Quick Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="font-semibold">Quick Topics:</span>
                  {[
                    "How to add or drop units",
                    "Financial Aid & Scholarships",
                    "Tutoring Labs",
                    "Timetable Conflict Rules",
                    "Academic Risk Policy",
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setSearchQuery(chip); runSearch(chip); }}
                      className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-sky-100 hover:text-sky-800 text-slate-700 transition-colors border border-slate-200 font-medium"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {hasSearched && searchResults ? (
                <div className="space-y-4 pt-3 border-t border-slate-100 animate-fade-in">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-sky-200 text-xs space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen size={18} className="text-sky-600 shrink-0" />
                        <h3 className="font-extrabold text-slate-900 text-sm">
                          Answer for: "{searchResults.query}"
                        </h3>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto">
                        {searchResults.documents?.[0]?.category || "Official University Answer"}
                      </span>
                    </div>

                    {/* Direct Answer Content */}
                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800 leading-relaxed text-xs font-medium whitespace-pre-line shadow-2xs">
                      {searchResults.answer_summary || searchResults.documents?.[0]?.content || searchResults.documents?.[0]?.summary || "No answer found for this query."}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <span>Verified from official institutional policies and student handbook.</span>
                      <button
                        type="button"
                        onClick={() => { setHasSearched(false); setSearchQuery(""); }}
                        className="text-sky-600 font-bold hover:underline cursor-pointer"
                      >
                        Clear Answer & Search Another Question
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2 border-t border-slate-100">
                  <BookOpen size={36} className="mx-auto text-sky-500/80" />
                  <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
                    Type a question or select a Quick Topic above to search official university policies and documents.
                  </p>
                </div>
              )}

              {/* Interactive Document Reader Modal */}
              {selectedDocument && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 shadow-xl p-6 space-y-4">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold uppercase tracking-wider">
                          {selectedDocument.category || "Official Document"}
                        </span>
                        <h2 className="text-lg font-extrabold text-slate-900 mt-1">{selectedDocument.title}</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedDocument(null)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="text-xs text-slate-700 leading-relaxed space-y-3 font-normal whitespace-pre-line">
                      {selectedDocument.content || selectedDocument.summary}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">ASSIS Official Knowledge System</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDocument(null)}
                        className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        Close Document
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB 7: KNOWLEDGE-GROUNDED AI ASSISTANT
              ============================================================ */}
          {activeTab === "chatbot" && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Bot size={18} className="text-sky-600" />
                  Knowledge-Grounded AI Assistant
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ask any question about using the ASSIS app, course enrollment, financial aid, tutoring, wellness, or university policies.
                </p>
              </div>

              {/* Sample Suggestion Chips */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  "How do I add or drop units in ASSIS?",
                  "What are the financial aid and scholarship options?",
                  "Where can I find tutoring for my course units?",
                  "How does schedule conflict prevention work?",
                ].map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuestion(promptText);
                      askChatbot(promptText);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-800 font-medium border border-slate-200 transition-colors text-left text-[11px]"
                  >
                    💡 {promptText}
                  </button>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askChatbot(); } }}
                  rows={3}
                  className="w-full p-3 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-sky-500 font-medium"
                  placeholder="Ask a question about your academic path, adding/dropping units, financial aid..."
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => askChatbot()}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Bot size={15} /> Send Question
                  </button>
                </div>
              </div>

              {chatbot && (
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <Sparkles size={15} className="text-amber-500" />
                      ASSIS AI Answer
                    </span>
                    <span className="text-[10px] text-slate-500">Query: "{chatbot.question || question}"</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed text-xs whitespace-pre-line font-medium">
                    {chatbot.answer || chatbot.response}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB 8: STUDENT-FRIENDLY SENTIMENT ANALYSIS DASHBOARD
              ============================================================ */}
          {activeTab === "sentiment" && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <BarChart3 size={18} className="text-sky-600" />
                  Student Experience & Voice Feedback Analysis
                </h2>
                <p className="text-xs text-slate-500">
                  Submit student comments to extract satisfaction metrics, key sentiment themes, and improvement areas.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Student Feedback Comments (One comment per line):</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full p-3 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-sky-500 font-sans"
                  placeholder="Enter student comments..."
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={runSentiment}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <BarChart3 size={15} /> Analyze Feedback
                  </button>
                </div>
              </div>

              {/* Student-Friendly Sentiment Visual Dashboard */}
              {sentiment && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm">Student Sentiment Dashboard</h3>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <span className="text-xs font-bold text-emerald-800">Positive Comments</span>
                      <div className="text-2xl font-extrabold text-emerald-900 mt-1">
                        {sentiment.summary?.positive || 0}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                      <span className="text-xs font-bold text-amber-800">Neutral Comments</span>
                      <div className="text-2xl font-extrabold text-amber-900 mt-1">
                        {sentiment.summary?.neutral || 0}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                      <span className="text-xs font-bold text-rose-800">Needs Attention</span>
                      <div className="text-2xl font-extrabold text-rose-900 mt-1">
                        {sentiment.summary?.negative || 0}
                      </div>
                    </div>
                  </div>

                  {/* Individual Analyzed Comments */}
                  {sentiment.items && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Analyzed Student Comments:</h4>
                      <div className="space-y-2">
                        {sentiment.items.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs gap-3">
                            <span className="text-slate-800 font-medium truncate min-w-0 flex-1">"{item.text}"</span>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase shrink-0 ${
                              item.label === "positive" ? "bg-emerald-100 text-emerald-800" : item.label === "negative" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                            }`}>
                              {item.label === "positive" ? "✓ Positive" : item.label === "negative" ? "⚠️ Needs Attention" : "• Neutral"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB 9: ADMIN DASHBOARD (system management & grading)
              ============================================================ */}
          {activeTab === "admin" && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-sky-400" size={24} />
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">ASSIS Administrator Portal</h2>
                  </div>
                  <p className="text-xs text-slate-300">
                    System Oversight, Enrolled Class Roster, Assignment & Quiz Grading, and Campus Event Publisher
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Logged in as: <strong>admin@gmail.com</strong></span>
                </div>
              </div>

              {adminMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
                  <span>✓ {adminMsg}</span>
                  <button type="button" onClick={() => setAdminMsg("")} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-sky-100 text-sky-700">
                    <Users size={22} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enrolled Students</div>
                    <div className="text-2xl font-black text-slate-900">{adminData?.students?.length || 0}</div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-indigo-100 text-indigo-700">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course Units</div>
                    <div className="text-2xl font-black text-slate-900">{adminData?.units?.length || 0}</div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-100 text-purple-700">
                    <FileText size={22} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assignments & Quizzes</div>
                    <div className="text-2xl font-black text-slate-900">{adminData?.assignments?.length || 0}</div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Published Events</div>
                    <div className="text-2xl font-black text-slate-900">{adminData?.events?.length || 0}</div>
                  </div>
                </div>
              </div>

              {/* Sub-Tab Navigation Bar */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setAdminSubTab("students")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    adminSubTab === "students" ? "bg-sky-600 text-white shadow-xs" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  🎓 Enrolled Students & Classes
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSubTab("assignments")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    adminSubTab === "assignments" ? "bg-sky-600 text-white shadow-xs" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  📝 Assignments, Quizzes & Grading
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSubTab("events")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    adminSubTab === "events" ? "bg-sky-600 text-white shadow-xs" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  📅 Class & School Events Publisher
                </button>
              </div>

              {/* SUB-TAB 1: ENROLLED STUDENTS & CLASSES */}
              {adminSubTab === "students" && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">Enrolled Students & Course Unit Schedules</h3>
                      <p className="text-xs text-slate-500">Overview of all active students and their currently enrolled classes</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <th className="p-3 font-bold">Student ID</th>
                          <th className="p-3 font-bold">Student Name</th>
                          <th className="p-3 font-bold">Degree Program</th>
                          <th className="p-3 font-bold">Year</th>
                          <th className="p-3 font-bold">GPA</th>
                          <th className="p-3 font-bold">Attendance</th>
                          <th className="p-3 font-bold">Currently Enrolled Units & Sections</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {adminData?.students?.map((stu, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-bold text-sky-700">{stu.student_id}</td>
                            <td className="p-3 font-bold text-slate-900">{stu.name}</td>
                            <td className="p-3 text-slate-600 max-w-xs">{stu.program}</td>
                            <td className="p-3 text-slate-700 font-semibold">Year {stu.year}</td>
                            <td className="p-3 font-bold text-slate-900">{stu.gpa}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                stu.attendance >= 80 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                              }`}>
                                {stu.attendance}%
                              </span>
                            </td>
                            <td className="p-3">
                              {stu.enrolled_units?.length === 0 ? (
                                <span className="text-slate-400 italic">No enrolled units</span>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {stu.enrolled_units?.map((u, uIdx) => (
                                    <span key={uIdx} className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 font-bold text-[11px]">
                                      {u.unit_id} ({u.section || "Sec A"})
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: ASSIGNMENTS, QUIZZES & GRADING */}
              {adminSubTab === "assignments" && (
                <div className="space-y-6">
                  {/* Create Assignment / Quiz Form */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <PlusCircle className="text-sky-600" size={20} />
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">Assign New Assignment, Quiz or Project</h3>
                        <p className="text-xs text-slate-500">Publish a coursework activity for a specific class or all students</p>
                      </div>
                    </div>

                    <form onSubmit={handleAdminAddAssignment} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Title / Description</label>
                        <input
                          type="text"
                          required
                          value={newAssignTitle}
                          onChange={(e) => setNewAssignTitle(e.target.value)}
                          placeholder="e.g. Midterm Quiz 1 or Project Lab"
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Activity Type</label>
                        <select
                          value={newAssignType}
                          onChange={(e) => setNewAssignType(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        >
                          <option value="assignment">Assignment</option>
                          <option value="quiz">Quiz</option>
                          <option value="project">Project / Lab</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Target Student</label>
                        <select
                          value={newAssignStudent}
                          onChange={(e) => setNewAssignStudent(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        >
                          <option value="all">All Students</option>
                          {adminData?.students?.map((s) => (
                            <option key={s.student_id} value={s.student_id}>
                              {s.name} ({s.student_id})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Select Unit / Course</label>
                        <select
                          value={newAssignUnit}
                          onChange={(e) => setNewAssignUnit(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        >
                          <option value="">General (All Units)</option>
                          {adminData?.units?.map((u) => (
                            <option key={u.unit_id} value={u.unit_id}>
                              {u.unit_id} - {u.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Max Total Score</label>
                        <input
                          type="number"
                          value={newAssignPoints}
                          onChange={(e) => setNewAssignPoints(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                        <input
                          type="date"
                          value={newAssignDueDate}
                          onChange={(e) => setNewAssignDueDate(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 shadow-md shadow-sky-600/20 cursor-pointer"
                        >
                          Publish Activity
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Interactive Grading Table */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">Grading & Submissions Roster</h3>
                        <p className="text-xs text-slate-500">Grade assigned student submissions directly</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <th className="p-3 font-bold">Student</th>
                            <th className="p-3 font-bold">Activity Title</th>
                            <th className="p-3 font-bold">Type</th>
                            <th className="p-3 font-bold">Unit</th>
                            <th className="p-3 font-bold">Due Date</th>
                            <th className="p-3 font-bold">Status</th>
                            <th className="p-3 font-bold">Score</th>
                            <th className="p-3 font-bold text-right">Grade Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {adminData?.assignments?.map((a) => (
                            <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-bold text-slate-900">{a.student_name} ({a.student_id})</td>
                              <td className="p-3 font-bold text-sky-900">{a.title}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold uppercase text-[10px]">
                                  {a.assignment_type}
                                </span>
                              </td>
                              <td className="p-3 text-slate-700 font-semibold">{a.unit_id || "General"}</td>
                              <td className="p-3 text-slate-600">{a.due_date}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                  a.status.includes("Completed") || a.status === "Graded" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                }`}>
                                  {a.status}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-slate-900">
                                {a.score} / {a.max_score}
                              </td>
                              <td className="p-3 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <input
                                    type="number"
                                    placeholder={a.score.toString()}
                                    onChange={(e) => setGradeScoreInput({ ...gradeScoreInput, [a.id]: e.target.value })}
                                    className="w-16 px-2 py-1 rounded border border-slate-300 text-xs text-center"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAdminGradeItem(a.id, gradeScoreInput[a.id] ?? a.score)}
                                    className="px-3 py-1 rounded-lg bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 cursor-pointer shadow-2xs"
                                  >
                                    Save
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: EVENTS PUBLISHER */}
              {adminSubTab === "events" && (
                <div className="space-y-6">
                  {/* Publish Event Form */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Calendar className="text-sky-600" size={20} />
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">Publish Class or School Event</h3>
                        <p className="text-xs text-slate-500">Add workshops, exam dates, guest lectures, or support events</p>
                      </div>
                    </div>

                    <form onSubmit={handleAdminAddEvent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Event Title</label>
                        <input
                          type="text"
                          required
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          placeholder="e.g. Guest Lecture or Exam Review"
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                        <select
                          value={newEventCategory}
                          onChange={(e) => setNewEventCategory(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        >
                          <option value="School Event">School Event</option>
                          <option value="Class Event">Class Event</option>
                          <option value="Academic">Academic Workshop</option>
                          <option value="Support">Support & Counseling</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Date</label>
                        <input
                          type="date"
                          value={newEventDate}
                          onChange={(e) => setNewEventDate(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Unit / Course</label>
                        <select
                          value={newEventUnit}
                          onChange={(e) => setNewEventUnit(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        >
                          <option value="">All Units</option>
                          {adminData?.units?.map((u) => (
                            <option key={u.unit_id} value={u.unit_id}>
                              {u.unit_id} - {u.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                        <select
                          value={newEventStudent}
                          onChange={(e) => setNewEventStudent(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        >
                          <option value="all">All Students</option>
                          {adminData?.students?.map((s) => (
                            <option key={s.student_id} value={s.student_id}>
                              {s.name} ({s.student_id})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 shadow-md shadow-sky-600/20 cursor-pointer"
                        >
                          Publish Event
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Events List */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <h3 className="font-extrabold text-slate-900 text-base">Published Class & Campus Events</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {adminData?.events?.map((ev) => (
                        <div key={ev.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">{ev.title}</span>
                            <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10px]">
                              {ev.category}
                            </span>
                          </div>
                          <div className="text-slate-600 flex items-center justify-between text-[11px]">
                            <span>Date: <strong>{ev.event_date}</strong></span>
                            <span>Audience: <strong>{ev.student_name}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mount React Root                                                   */
/* ------------------------------------------------------------------ */
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

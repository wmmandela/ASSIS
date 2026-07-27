import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import RecommendationPanel from "./components/RecommendationPanel";
import TimetablePanel from "./components/TimetablePanel";
import SearchPanel from "./components/SearchPanel";
import ChatbotPanel from "./components/ChatbotPanel";
import SentimentPanel from "./components/SentimentPanel";
import Notice from "./components/Notice";

/* ------------------------------------------------------------------ */
/* API Helper                                                          */
/* ------------------------------------------------------------------ */

const api = {
  async get(path) {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(`Request failed: ${path}`);
    }

    return response.json();
  },

  async post(path, body) {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
/* APP                                                                 */
/* ------------------------------------------------------------------ */

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const [profile, setProfile] = useState(null);
  const [risk, setRisk] = useState(null);

  const [recommendations, setRecommendations] = useState(null);

  const [timetable, setTimetable] = useState([]);
  const [units, setUnits] = useState([]);
  const [unitRecommendations, setUnitRecommendations] = useState([]);

  const [searchQuery, setSearchQuery] = useState(
    "How can I get tutoring support?"
  );
  const [searchResults, setSearchResults] = useState(null);

  const [feedback, setFeedback] = useState(
    "The tutoring center helped me a lot.\nRegistration can feel busy."
  );
  const [sentiment, setSentiment] = useState(null);

  const [question, setQuestion] = useState(
    "Hi, how can you help me with academic planning?"
  );
  const [chatbot, setChatbot] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enrollMessage, setEnrollMessage] = useState("");

  const liveRegionRef = useRef(null);

  function announce(message) {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = "";

      setTimeout(() => {
        liveRegionRef.current.textContent = message;
      }, 50);
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

  async function runAction(action, successMessage) {
    setError("");
    setLoading(true);

    announce("Loading...");

    try {
      await action();

      if (successMessage) {
        announce(successMessage);
      }
    } catch (err) {
      const message = err.message || "Something went wrong.";

      setError(message);
      announce(message);
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile() {
    setError("");

    try {
      const data = await api.get("/api/me/");
      setProfile(data.profile);
    } catch {
      setError("Unable to load student profile.");
    }
  }

  async function loadRisk() {
    setError("");

    try {
      const data = await api.get("/api/risk/");
      setRisk(data);
    } catch {
      setError("Could not load risk information.");
    }
  }

  async function loadRecommendations(studentId) {
    if (!studentId) return;

    const data = await api.get(
      `/api/recommendations/?student_id=${encodeURIComponent(studentId)}`
    );

    setRecommendations(data);
  }

  async function loadTimetable() {
    if (!profile) return;

    try {
      const data = await api.get("/api/timetable/");
      setTimetable(data.timetable);
    } catch {
      setError("Could not load timetable.");
    }
  }

  async function loadUnits(semester) {
    if (!semester) return;

    try {
      const data = await api.get(
        `/api/units/?semester=${encodeURIComponent(semester)}`
      );

      setUnits(data.units);
    } catch {
      setError("Could not load units.");
    }
  }

  async function loadUnitRecommendations() {
    try {
      const data = await api.get("/api/units/recommendations/");
      setUnitRecommendations(data.recommendations);
    } catch {
      setError("Could not load unit recommendations.");
    }
  }

  async function runSearch() {
    runAction(async () => {
      const data = await api.get(
        `/api/knowledge-search/?q=${encodeURIComponent(searchQuery)}`
      );

      setSearchResults(data);
    }, "Search complete.");
  }

  async function askChatbot() {
    runAction(async () => {
      const data = await api.post("/api/chatbot/", {
        question,
      });

      setChatbot(data);
    }, "Chatbot response received.");
  }

  async function runSentiment() {
    runAction(async () => {
      const feedbackItems = feedback
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      const data = await api.post("/api/sentiment/", {
        feedback: feedbackItems,
      });

      setSentiment(data);
    }, "Sentiment analysis complete.");
  }

  async function enrollUnit(unitId) {
    setEnrollMessage("");

    try {
      const data = await api.post("/api/units/enroll/", {
        unit_id: unitId,
      });

      setEnrollMessage(data.detail || "Enrollment successful.");

      loadTimetable();
      loadUnitRecommendations();
    } catch (err) {
      setEnrollMessage(err.message);
    }
  }

  const enrolledUnits = useMemo(() => {
    if (!timetable.length) return [];

    return [
      ...new Map(
        timetable.map((item) => [item.unit.unit_id, item.unit])
      ).values(),
    ];
  }, [timetable]);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Screen reader announcements */}
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <div className="mx-auto flex max-w-[1700px] gap-8 p-6">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <Header profile={profile} enrolledUnits={enrolledUnits} risk={risk} />

          {/* Notifications */}
          <div className="mb-6 space-y-4">
            {error && <Notice tone="rose" text={error} role="alert" />}
            {loading && <Notice tone="brand" text="Loading..." role="status" />}
            {enrollMessage && (
              <Notice tone="brand" text={enrollMessage} role="status" />
            )}
          </div>

          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <Dashboard
              profile={profile}
              enrolledUnits={enrolledUnits}
              timetable={timetable}
              setActiveTab={setActiveTab}
            />
          )}

          {/* Recommendations */}
          {activeTab === "recommendations" && (
            <RecommendationPanel
              profile={profile}
              recommendations={recommendations}
            />
          )}

          {/* Timetable */}
          {activeTab === "timetable" && (
            <TimetablePanel
              timetable={timetable}
              unitRecommendations={unitRecommendations}
              enrollUnit={enrollUnit}
            />
          )}

          {/* Knowledge Search */}
          {activeTab === "search" && (
            <SearchPanel
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              runSearch={runSearch}
              searchResults={searchResults}
            />
          )}

          {/* Chatbot */}
          {activeTab === "chatbot" && (
            <ChatbotPanel
              question={question}
              setQuestion={setQuestion}
              askChatbot={askChatbot}
              chatbot={chatbot}
            />
          )}

          {/* Sentiment */}
          {activeTab === "sentiment" && (
            <SentimentPanel
              feedback={feedback}
              setFeedback={setFeedback}
              runSentiment={runSentiment}
              sentiment={sentiment}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 rounded-3xl bg-white p-6 shadow-lg">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h3 className="text-lg font-bold text-slate-900">ASSIS</h3>
            <p className="text-sm text-slate-500">
              AI-Powered Student Support Information System
            </p>
          </div>
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} ASSIS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
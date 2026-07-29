import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

// Mock helper functions representing ASSIS HCI & Universal Design Logic

function evaluateKeyboardShortcut(event) {
  const isModifier = event.altKey || (event.metaKey && event.altKey) || (event.ctrlKey && event.altKey);
  if (!isModifier) return null;

  const code = event.code;
  const key = event.key?.toLowerCase();

  if (code === "KeyA" || key === "a" || key === "å") return "chatbot";
  if (code === "KeyS" || key === "s" || key === "ß") return "timetable";
  if (code === "KeyP" || key === "p" || key === "π") return "planner";
  if (code === "KeyE" || key === "e" || key === "´") return "events";
  if (code === "KeyD" || key === "d" || key === "∂") return "dashboard";
  return null;
}

function recommendOptionalActivities(student) {
  const year = student.year || 1;
  const gpa = student.gpa || 3.0;
  const attendance = student.attendance || 85;

  const levelActivities = {
    1: ["First-Year Academic Transition Seminar", "Peer Mentorship Night"],
    2: ["Sophomore Career Pathways Panel", "Intermediate Coaching Groups"],
    3: ["Junior Industry Internship Prep", "Elective Advisory Clinic"],
    4: ["Senior Capstone Project Showcase", "Grad School Seminar"],
  };

  const activities = levelActivities[year] || levelActivities[1];
  const results = activities.map((act) => ({
    title: act,
    level: `Year ${year}`,
    status: gpa >= 3.4 ? "High Academic Progress" : (gpa < 2.8 || attendance < 80 ? "Academic Support Targeted" : "On-Track Progress"),
  }));

  if (gpa >= 3.5) {
    results.push({
      title: "Honors Research Fellowship",
      level: `Year ${year} Honors`,
      status: "High Academic Progress",
    });
  } else if (gpa < 2.8 || attendance < 80) {
    results.push({
      title: "Proactive Academic Recovery Clinic",
      level: `Year ${year} Support`,
      status: "Academic Support Targeted",
    });
  }

  return results;
}

function checkTimetableConflict(sessionA, sessionB) {
  if (sessionA.day !== sessionB.day) return false;
  return sessionA.start < sessionB.end && sessionB.start < sessionA.end;
}

function synthesizeSingleAnswerSearch(query, documents) {
  if (!query || !documents || documents.length === 0) {
    return { query, answer: "No direct answer found for this query." };
  }
  const topDoc = documents[0];
  return {
    query,
    answer: topDoc.content || topDoc.summary,
    category: topDoc.category || "Official University Answer",
  };
}

describe("ASSIS HCI & Universal Design Test Suite", () => {
  
  describe("Principle 2 & 6: Cross-Platform Keyboard Shortcuts & Physical Keycodes", () => {
    it("should trigger AI Assistant tab on Windows Alt+A (code: KeyA, key: a)", () => {
      const event = { altKey: true, code: "KeyA", key: "a" };
      assert.equal(evaluateKeyboardShortcut(event), "chatbot");
    });

    it("should trigger AI Assistant tab on macOS Option+A producing special character 'å'", () => {
      const event = { altKey: true, code: "KeyA", key: "å" };
      assert.equal(evaluateKeyboardShortcut(event), "chatbot");
    });

    it("should trigger Timetable tab on macOS Option+S producing special character 'ß'", () => {
      const event = { altKey: true, code: "KeyS", key: "ß" };
      assert.equal(evaluateKeyboardShortcut(event), "timetable");
    });

    it("should trigger Semester Planner tab on macOS Option+P producing 'π'", () => {
      const event = { altKey: true, code: "KeyP", key: "π" };
      assert.equal(evaluateKeyboardShortcut(event), "planner");
    });

    it("should trigger Events & Support tab on macOS Option+E producing '´'", () => {
      const event = { altKey: true, code: "KeyE", key: "´" };
      assert.equal(evaluateKeyboardShortcut(event), "events");
    });

    it("should trigger Overview Dashboard tab on macOS Option+D producing '∂'", () => {
      const event = { altKey: true, code: "KeyD", key: "∂" };
      assert.equal(evaluateKeyboardShortcut(event), "dashboard");
    });

    it("should ignore keystrokes without Alt or Option modifier", () => {
      const event = { altKey: false, code: "KeyA", key: "a" };
      assert.equal(evaluateKeyboardShortcut(event), null);
    });
  });

  describe("HCI Design Principles: Personalization & Student Independence", () => {
    it("should recommend Year 1 foundational activities for freshman student", () => {
      const student = { year: 1, gpa: 3.2, attendance: 90 };
      const recs = recommendOptionalActivities(student);
      assert.equal(recs[0].title, "First-Year Academic Transition Seminar");
      assert.equal(recs[0].level, "Year 1");
      assert.equal(recs[0].status, "On-Track Progress");
    });

    it("should recommend Year 4 capstone and honors fellowship for high-GPA senior", () => {
      const student = { year: 4, gpa: 3.8, attendance: 95 };
      const recs = recommendOptionalActivities(student);
      assert.equal(recs[0].title, "Senior Capstone Project Showcase");
      assert.equal(recs[0].level, "Year 4");
      assert.equal(recs[0].status, "High Academic Progress");
      assert.equal(recs[2].title, "Honors Research Fellowship");
    });

    it("should include Academic Recovery Clinic for students with low GPA", () => {
      const student = { year: 2, gpa: 2.3, attendance: 65 };
      const recs = recommendOptionalActivities(student);
      assert.equal(recs[0].status, "Academic Support Targeted");
      assert.equal(recs[2].title, "Proactive Academic Recovery Clinic");
    });
  });

  describe("HCI Error Prevention: Timetable Conflict Detection", () => {
    it("should detect overlapping class sessions on the same day", () => {
      const session1 = { day: "Monday", start: "09:00", end: "11:00" };
      const session2 = { day: "Monday", start: "10:00", end: "12:00" };
      assert.equal(checkTimetableConflict(session1, session2), true);
    });

    it("should allow non-overlapping sessions on the same day", () => {
      const session1 = { day: "Monday", start: "09:00", end: "11:00" };
      const session2 = { day: "Monday", start: "11:15", end: "13:00" };
      assert.equal(checkTimetableConflict(session1, session2), false);
    });

    it("should allow overlapping times on different days", () => {
      const session1 = { day: "Monday", start: "09:00", end: "11:00" };
      const session2 = { day: "Tuesday", start: "09:00", end: "11:00" };
      assert.equal(checkTimetableConflict(session1, session2), false);
    });
  });

  describe("HCI Recognition Over Recall: Focused Knowledge Search Single-Answer", () => {
    it("should return single focused top-match answer for queried topic", () => {
      const docs = [
        {
          id: "K01",
          title: "Unit Add/Drop Policy",
          category: "Academic Policy",
          content: "Students may add or drop units up to the end of Week 2 without financial penalty.",
        },
        {
          id: "K02",
          title: "Library Services",
          category: "Campus Facilities",
          content: "The main library is open 24/7 during exam periods.",
        },
      ];
      const result = synthesizeSingleAnswerSearch("How to add or drop units", docs);
      assert.equal(result.answer, "Students may add or drop units up to the end of Week 2 without financial penalty.");
      assert.equal(result.category, "Academic Policy");
    });
  });
});

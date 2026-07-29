from __future__ import annotations

import re
from collections import Counter

from .text import cosine_similarity, short_summary, term_vector, tokenize
from ..models import KnowledgeDocument, StudentProfile, SupportItem

POSITIVE_TERMS = {
    "accessible",
    "clear",
    "confident",
    "easy",
    "excellent",
    "good",
    "great",
    "helped",
    "helpful",
    "responsive",
    "supportive",
}

NEGATIVE_TERMS = {
    "bad",
    "confusing",
    "delayed",
    "difficult",
    "frustrated",
    "hard",
    "late",
    "stressful",
    "unclear",
    "worried",
}

GREETING_PATTERN = re.compile(r"\b(hi|hello|hey|good morning|good afternoon|good evening)\b", re.I)


def _student_to_dict(student: StudentProfile) -> dict:
    return {
        "id": student.student_id,
        "student_id": student.student_id,
        "name": student.name,
        "program": student.program,
        "year": student.year,
        "interests": list(student.interests or []),
        "gpa": float(student.gpa),
        "attendance": student.attendance,
        "lms_activity": student.lms_activity,
        "assignments_submitted": student.assignments_submitted,
        "recent_grade": student.recent_grade,
        "wellbeing_score": student.wellbeing_score,
    }


def _support_item_to_dict(item: SupportItem) -> dict:
    return {
        "id": item.item_id,
        "type": item.item_type,
        "title": item.title,
        "description": item.description,
        "tags": list(item.tags or []),
        "active": item.active,
        "category": item.get_item_type_display(),
    }


def _knowledge_doc_to_dict(document: KnowledgeDocument) -> dict:
    return {
        "id": document.document_id,
        "title": document.title,
        "category": document.category,
        "content": document.content,
        "summary": short_summary(document.content),
    }


def get_students() -> list[dict]:
    return [_student_to_dict(student) for student in StudentProfile.objects.order_by("name")]


def find_student(student_id: str | None) -> StudentProfile | None:
    if student_id:
        student = StudentProfile.objects.filter(student_id=student_id).first()
        if student:
            return student
    return StudentProfile.objects.first()


OPTIONAL_ACTIVITIES_BY_LEVEL = {
    1: [
        {
            "id": "OPT-Y1-01",
            "title": "First-Year Academic Transition & Time Management Seminar",
            "type": "event",
            "category": "Academic Workshop",
            "description": "Optional interactive workshop for freshman students focusing on college-level study strategies, exam preparation, and balancing workload.",
            "level_label": "Year 1 (Freshman)",
            "status_label": "Foundational Skills",
            "tags": ["study skills", "time management", "freshman"],
        },
        {
            "id": "OPT-Y1-02",
            "title": "Peer Mentorship & Student Club Discovery Night",
            "type": "event",
            "category": "School Event",
            "description": "Optional networking event connecting first-year students with senior peer mentors and academic student organizations.",
            "level_label": "Year 1 (Freshman)",
            "status_label": "Peer Engagement",
            "tags": ["mentorship", "clubs", "networking"],
        },
        {
            "id": "OPT-Y1-03",
            "title": "Introductory Problem-Solving & Coding Lab",
            "type": "support",
            "category": "Tutoring Lab",
            "description": "Optional drop-in tutoring lab for strengthening core logic, quantitative reasoning, and programming fundamentals.",
            "level_label": "Year 1 (Freshman)",
            "status_label": "Academic Support",
            "tags": ["tutoring", "programming", "math"],
        },
    ],
    2: [
        {
            "id": "OPT-Y2-01",
            "title": "Sophomore Career Pathways & Industry Internship Panel",
            "type": "event",
            "category": "Career Event",
            "description": "Optional panel discussion with alumni and industry leaders on securing sophomore internships and building professional portfolios.",
            "level_label": "Year 2 (Sophomore)",
            "status_label": "Career Development",
            "tags": ["internships", "career", "networking"],
        },
        {
            "id": "OPT-Y2-02",
            "title": "Intermediate Subject Coaching & Peer Review Groups",
            "type": "support",
            "category": "Academic Support",
            "description": "Optional collaborative study circles led by top performing upperclassmen for 200-level core courses.",
            "level_label": "Year 2 (Sophomore)",
            "status_label": "Course Progress",
            "tags": ["study group", "coaching", "academics"],
        },
        {
            "id": "OPT-Y2-03",
            "title": "Undergraduate Research & Innovation Challenge",
            "type": "event",
            "category": "Research Workshop",
            "description": "Optional hands-on research workshop for sophomore students interested in joining faculty lab projects.",
            "level_label": "Year 2 (Sophomore)",
            "status_label": "Enrichment & Research",
            "tags": ["research", "innovation", "projects"],
        },
    ],
    3: [
        {
            "id": "OPT-Y3-01",
            "title": "Junior Industry Internship Prep & Technical Interview Bootcamp",
            "type": "event",
            "category": "Career Workshop",
            "description": "Optional intensive clinic for junior students preparing for summer corporate internships and technical interviews.",
            "level_label": "Year 3 (Junior)",
            "status_label": "Career Readiness",
            "tags": ["internships", "interviews", "career"],
        },
        {
            "id": "OPT-Y3-02",
            "title": "Advanced Elective & Specialization Advisory Clinic",
            "type": "event",
            "category": "Academic Advising",
            "description": "Optional advising session to help juniors choose specialized elective tracks matching their career goals.",
            "level_label": "Year 3 (Junior)",
            "status_label": "Degree Specialization",
            "tags": ["electives", "advising", "specialization"],
        },
        {
            "id": "OPT-Y3-03",
            "title": "GPA Optimization & Exam Performance Coaching",
            "type": "support",
            "category": "Academic Support",
            "description": "Optional 1-on-1 coaching session to optimize study plans and maintain high GPA performance ahead of senior year.",
            "level_label": "Year 3 (Junior)",
            "status_label": "Academic Status",
            "tags": ["gpa boost", "coaching", "exam prep"],
        },
    ],
    4: [
        {
            "id": "OPT-Y4-01",
            "title": "Senior Capstone Project Showcase & Industry Expo",
            "type": "event",
            "category": "Campus Showcase",
            "description": "Optional premier networking showcase for graduating seniors to exhibit capstone projects to corporate recruiters.",
            "level_label": "Year 4 (Senior)",
            "status_label": "Senior Showcase",
            "tags": ["capstone", "showcase", "recruiting"],
        },
        {
            "id": "OPT-Y4-02",
            "title": "Graduate School & Professional Certification Seminar",
            "type": "event",
            "category": "Professional Development",
            "description": "Optional seminar detailing master's applications, GRE/GMAT prep, and professional industry certifications.",
            "level_label": "Year 4 (Senior)",
            "status_label": "Post-Grad Preparation",
            "tags": ["grad school", "certifications", "career"],
        },
        {
            "id": "OPT-Y4-03",
            "title": "Graduation Degree Audit & Final Progress Check",
            "type": "support",
            "category": "Academic Advising",
            "description": "Optional appointment with degree auditors to verify credit completion and clear graduation requirements.",
            "level_label": "Year 4 (Senior)",
            "status_label": "Graduation Status",
            "tags": ["graduation", "audit", "credits"],
        },
    ],
}


def recommend_for_student(student_id: str | None = None, limit: int = 6) -> dict:
    student = find_student(student_id)
    if not student:
        return {"student": None, "recommendations": []}

    year = getattr(student, "year", 1) or 1
    gpa = float(getattr(student, "gpa", 3.0) or 3.0)
    attendance = float(getattr(student, "attendance", 85) or 85)

    level_activities = OPTIONAL_ACTIVITIES_BY_LEVEL.get(year, OPTIONAL_ACTIVITIES_BY_LEVEL[1])
    recommendations = []

    for item in level_activities:
        reason = f"Optional activity tailored for Year {year} academic level."
        if gpa >= 3.4:
            reason += f" High academic progress (GPA {gpa:.2f})."
        elif gpa < 2.8 or attendance < 80:
            reason += " Targeted academic support & progress assistance."
        
        recommendations.append(
            {
                "id": item["id"],
                "title": item["title"],
                "type": item["type"],
                "category": item["category"],
                "description": item["description"],
                "level_label": item["level_label"],
                "status_label": "High Academic Progress" if gpa >= 3.4 else ("Academic Support Targeted" if (gpa < 2.8 or attendance < 80) else "On-Track Progress"),
                "reason": reason,
                "score": 0.95 if gpa >= 3.4 else 0.88,
                "tags": item["tags"],
            }
        )

    # Add optional high-performer or academic-support activity depending on status/progress
    if gpa >= 3.5:
        recommendations.append(
            {
                "id": "OPT-HONORS",
                "title": "Honors Research Fellowship & Academic Leadership Seminar",
                "type": "event",
                "category": "Honors Enrichment",
                "description": "Optional leadership & research grant opportunity for students maintaining a GPA >= 3.5.",
                "level_label": f"Year {year} Honors",
                "status_label": "High Academic Progress",
                "reason": f"Recommended for high cumulative GPA ({gpa:.2f}).",
                "score": 0.98,
                "tags": ["honors", "research", "leadership"],
            }
        )
    elif gpa < 2.8 or attendance < 80:
        recommendations.append(
            {
                "id": "OPT-RECOVERY",
                "title": "Proactive Academic Recovery & Study Strategy Clinic",
                "type": "support",
                "category": "Academic Support",
                "description": "Optional 1-on-1 coaching clinic to boost GPA and improve course attendance.",
                "level_label": f"Year {year} Support",
                "status_label": "Academic Support Targeted",
                "reason": f"Recommended to support current academic status (GPA {gpa:.2f}, Attendance {attendance:.0f}%).",
                "score": 0.96,
                "tags": ["recovery", "support", "coaching"],
            }
        )

    return {"student": _student_to_dict(student), "recommendations": recommendations[:limit]}


def _recommendation_reason(student: dict, item: dict) -> str:
    matches = sorted(set(student["interests"]) & set(item["tags"]))
    if matches:
        return f"Matches interests in {', '.join(matches)}."
    if student["gpa"] < 2.5 and item["type"] in {"resource", "support"}:
        return "Prioritizes support because recent academic indicators show risk."
    return "Relevant to the student's program and success profile."


def predict_academic_risk(records: list[dict] | None = None) -> dict:
    if records is None:
        records = [_student_to_dict(student) for student in StudentProfile.objects.order_by("student_id")]
    predictions = []
    for student in records:
        risk_score = _risk_score(student)
        level = "high" if risk_score >= 70 else "moderate" if risk_score >= 40 else "low"
        predictions.append(
            {
                "student_id": student.get("id") or student.get("student_id"),
                "name": student.get("name"),
                "program": student.get("program"),
                "risk_score": risk_score,
                "risk_level": level,
                "signals": _risk_signals(student),
                "interventions": _interventions(student, level),
            }
        )
    predictions.sort(key=lambda item: item["risk_score"], reverse=True)
    return {"predictions": predictions}


def _risk_score(student: dict) -> int:
    attendance_gap = max(0, 85 - student.get("attendance", 0)) * 1.2
    activity_gap = max(0, 70 - student.get("lms_activity", 0)) * 0.8
    assignment_gap = max(0, 85 - student.get("assignments_submitted", 0)) * 0.9
    grade_gap = max(0, 70 - student.get("recent_grade", 0)) * 1.1
    gpa_gap = max(0, 2.7 - student.get("gpa", 0)) * 12
    wellbeing_gap = max(0, 65 - student.get("wellbeing_score", 0)) * 0.5
    return min(100, round(attendance_gap + activity_gap + assignment_gap + grade_gap + gpa_gap + wellbeing_gap))


def _risk_signals(student: dict) -> list[str]:
    signals = []
    if student.get("attendance", 0) < 75:
        signals.append("Attendance below support threshold")
    if student.get("lms_activity", 0) < 60:
        signals.append("Low LMS activity")
    if student.get("assignments_submitted", 0) < 75:
        signals.append("Missing or late coursework")
    if student.get("recent_grade", 0) < 65:
        signals.append("Recent grade decline")
    if student.get("wellbeing_score", 0) < 60:
        signals.append("Wellbeing check-in recommended")
    return signals or ["No urgent risk signals"]


def _interventions(student: dict, level: str) -> list[str]:
    if level == "high":
        return [
            "Schedule advisor outreach within 48 hours",
            "Create tutoring and assignment recovery plan",
            "Offer wellbeing check-in and financial aid review if relevant",
        ]
    if level == "moderate":
        return [
            "Invite student to academic coaching",
            "Recommend targeted tutoring or study lab",
            "Monitor LMS engagement next week",
        ]
    return ["Continue positive reinforcement and recommend enrichment opportunities"]


def search_knowledge(query: str, limit: int = 5) -> dict:
    query_vector = term_vector(query)
    results = []

    for document in KnowledgeDocument.objects.all():
        document_text = f"{document.title} {document.category} {document.content}"
        sim = round(cosine_similarity(query_vector, term_vector(document_text)), 3)
        query_words = [w.lower() for w in re.findall(r"\w+", query) if len(w) > 2]
        match_count = sum(1 for w in query_words if w in document_text.lower())
        score = sim + (match_count * 0.25)
        results.append(
            {
                **_knowledge_doc_to_dict(document),
                "score": round(score, 3),
            }
        )

    for item in SupportItem.objects.filter(active=True):
        source_text = f"{item.title} {' '.join(item.tags)} {item.description}"
        sim = round(cosine_similarity(query_vector, term_vector(source_text)), 3)
        query_words = [w.lower() for w in re.findall(r"\w+", query) if len(w) > 2]
        match_count = sum(1 for w in query_words if w in source_text.lower())
        score = sim + (match_count * 0.25)
        results.append(
            {
                **_support_item_to_dict(item),
                "score": round(score, 3),
                "summary": short_summary(item.description),
            }
        )

    results.sort(key=lambda item: item["score"], reverse=True)
    top_results = results[:limit] if results else []
    return {
        "query": query,
        "results": top_results,
        "documents": top_results,
        "answer_summary": synthesize_answer(query, top_results),
    }


def synthesize_answer(query: str, documents: list[dict], student: StudentProfile | None = None) -> str:
    normalized = query.strip().lower()
    if not normalized:
        return "Hello! Ask me any question about your courses, class schedule, GPA, financial aid, tutoring, wellness, or academic policies."

    # Intent 0: How-To ASSIS App Features (Add/Drop units, view timetable, preferences)
    if any(w in normalized for w in ["how to add", "how do i add", "how to drop", "how do i drop", "how to enroll", "how do i enroll", "how to select unit", "how do i select"]):
        return (
            "How to Add or Drop Units in ASSIS:\n\n"
            "1. Open the 'Semester Planner' tab from the left navigation menu.\n"
            "2. Browse the 'Top 5 Recommended Units' or the 'Course Catalog'.\n"
            "3. Click the blue 'Select Unit' button next to any unit to enroll immediately.\n"
            "4. To drop a unit, scroll down to the 'Currently Enrolled Units' table at the bottom of the Semester Planner page.\n"
            "5. Click the red 'Drop Unit' button next to the unit you wish to remove.\n\n"
            "Note: ASSIS automatically checks for schedule conflicts in real time (preventing 2 classes at the same time) and enforces the 5-unit semester maximum."
        )

    # Intent 1: Financial Aid / Tuition / FAFSA / Costs / Scholarships
    if any(w in normalized for w in ["financial", "aid", "fafsa", "scholarship", "bursary", "tuition", "cost", "fee", "payment", "bursar"]):
        return (
            "Financial Aid & Tuition Support Information:\n"
            "• FAFSA Institution Code: 003920. Deadline for priority processing is March 1.\n"
            "• Merit Scholarships: Students with a GPA of 3.50 or higher are eligible for the Dean's Academic Excellence Award.\n"
            "• Emergency Bursary Grants: Work-study placement and interest-free emergency tuition installment plans are available through the Financial Aid Office.\n"
            "• Contact: finaid@assis.edu | Office Hours: Mon-Fri 8:00 AM - 5:00 PM."
        )

    # Intent 2: Tutoring / Academic Support / Writing / Labs
    if any(w in normalized for w in ["tutor", "tutoring", "calculus", "writing", "study", "lab", "coaching", "math lab", "cs lab"]):
        return (
            "Tutoring & Academic Coaching Services:\n"
            "• Math & Science Lab: Mon-Thu 10:00 AM - 6:00 PM (Building B, Room 204). Special support for Calculus, Discrete Math, and Statistics.\n"
            "• Computer Science Coding Lab: Daily drop-in sessions for Python, Java, C++, and Web Development in Science Center 102.\n"
            "• Writing & Communication Center: Free 45-minute 1-on-1 essay and term paper feedback sessions.\n"
            "• Booking: Walk-in or schedule online via ASSIS Support Services tab."
        )

    # Intent 3: Mental Health / Wellbeing / Counseling / Stress
    if any(w in normalized for w in ["stress", "counseling", "mental", "health", "burnout", "anxiety", "wellness", "counsellor"]):
        return (
            "Student Wellbeing & Counseling Services:\n"
            "• Free Confidential Counseling: Professional licensed counselors available for stress management, personal wellbeing, and exam anxiety.\n"
            "• 24/7 Crisis Hotline: Call 1-800-273-TALK or text HOME to 741741 for immediate assistance.\n"
            "• Student Wellness Center: Student Union, Suite 300 | Appointment booking available directly in ASSIS."
        )

    # Intent 4: Academic Risk / Performance / GPA / Attendance
    if any(w in normalized for w in ["gpa", "grade", "risk", "failing", "attendance", "lms", "assignment", "performance", "progress", "score"]):
        if student:
            return (
                f"Academic Performance Summary for {student.name}: "
                f"Your current Cumulative GPA is {student.gpa}, Attendance rate is {student.attendance}%, "
                f"LMS Activity level is {student.lms_activity}%, and Recent Grade Average is {student.recent_grade}%. "
                f"Assignments Submitted: {student.assignments_submitted}%. "
                + ("You are currently in good academic standing! Keep up the great work."
                   if student.gpa >= 2.5 and student.attendance >= 75
                   else "Notice: Some academic indicators need attention. We recommend scheduling an advisor consultation and attending peer tutoring labs.")
            )
        return (
            "Academic Performance Overview: ASSIS tracks your cumulative GPA, course attendance, LMS activity, "
            "assignment submissions, and recent quiz scores to calculate early academic risk predictions. "
            "If your attendance falls below 75% or GPA drops below 2.50, our system automatically alerts your advisor and suggests targeted tutoring labs."
        )

    # Intent 5: Course / Timetable / Schedule Recommendations
    if any(w in normalized for w in ["schedule", "timetable", "recommend", "conflict", "clash", "prerequisite"]):
        student_name = student.name if student else "Student"
        program = student.program if (student and student.program) else "Academic Program"
        gpa = float(student.gpa) if student else 3.5
        return (
            f"Hello {student_name}! Based on your program in {program} (GPA {gpa:.2f}), "
            "I recommend enrolling in balanced 15-credit (5 course) schedule options with zero time clashes. "
            "You can use our main AI Timetable Engine to pick your preferences (e.g. Morning classes, No Friday classes) "
            "and generate, review, or manually modify section slots."
        )

    # Intent 6: Policy / Drop Course / Graduation / Regulations
    if any(w in normalized for w in ["drop", "withdraw", "dean", "graduation", "policy", "transcript", "rule", "deadline"]):
        return (
            "University Academic Policy Guidelines:\n"
            "• Course Add/Drop Period: Open during the first 2 weeks of the semester without academic penalty.\n"
            "• Course Withdrawal ('W' Grade): Open until Week 10. Consult your academic advisor before withdrawing.\n"
            "• Minimum Graduation Requirement: Completion of 120-150 credit units with a minimum cumulative GPA of 2.00."
        )

    # Intent 7: Synthesize Knowledge Base Documents if match score > 0
    if documents and any(doc.get("score", 0) > 0.05 for doc in documents):
        best_docs = [doc for doc in documents if doc.get("score", 0) > 0.05]
        joined = " ".join(document.get("summary", "") or document.get("content", "")[:200] for document in best_docs)
        summary = short_summary(joined, max_sentences=3)
        if summary:
            return summary

    # Intent 8: Universal Intelligent Fallback Generator for ANY custom prompt
    prompt_words = [w for w in normalized.split() if len(w) > 3]
    topic = " ".join(prompt_words[:4]) if prompt_words else "your inquiry"
    return (
        f"Regarding {topic}: "
        "ASSIS provides integrated guidance to support your university journey. "
        "Here are key steps to address your request:\n"
        "1. Check your student dashboard for relevant course modules, deadlines, and grade dynamics.\n"
        "2. Consult institutional policy documents under Knowledge Search or request advising support.\n"
        "3. For specialized help, connect with academic coaching, tutoring labs, or administrative services."
    )


def app_overview() -> str:
    return (
        "I am ASSIS, your student support AI assistant. "
        "I can help you with course registration, timetable planning, GPA tracking, financial aid, tutoring, wellness resources, and university policies."
    )


def analyze_sentiment(feedback_items: list[str] | None = None) -> dict:
    items = feedback_items or []
    analyzed = []
    totals = Counter()
    themes = Counter()

    for text in items:
        tokens = tokenize(text)
        positive = sum(1 for token in tokens if token in POSITIVE_TERMS)
        negative = sum(1 for token in tokens if token in NEGATIVE_TERMS)
        score = positive - negative
        label = "positive" if score > 0 else "negative" if score < 0 else "neutral"
        totals[label] += 1
        for theme in _extract_themes(tokens):
            themes[theme] += 1
        analyzed.append({"text": text, "label": label, "score": score})

    return {
        "items": analyzed,
        "summary": dict(totals),
        "themes": [{"theme": theme, "count": count} for theme, count in themes.most_common(5)],
    }


def _extract_themes(tokens: list[str]) -> list[str]:
    theme_map = {
        "advising": {"advisor", "advising", "appointment", "course", "planning"},
        "financial aid": {"financial", "aid", "fafsa"},
        "registration": {"registration", "classes", "schedule"},
        "wellbeing": {"counseling", "wellness", "stress", "supportive"},
        "tutoring": {"tutoring", "calculus", "study"},
    }
    token_set = set(tokens)
    return [theme for theme, words in theme_map.items() if token_set & words]


def chatbot_response(question: str, student_id: str | None = None) -> dict:
    normalized = question.strip()
    student = find_student(student_id)

    if not normalized:
        return {"question": question, "answer": app_overview(), "sources": []}

    if GREETING_PATTERN.search(normalized):
        greeting_sources = search_knowledge("student support", limit=2)["results"]
        name_str = f" {student.name}" if student else ""
        return {
            "question": question,
            "answer": (
                f"Hello{name_str}! I am ASSIS, your AI student support assistant. "
                "Ask me about course recommendations, timetable planning, your GPA & attendance, "
                "financial aid, tutoring labs, wellness services, or academic policies!"
            ),
            "sources": [
                {"id": item["id"], "title": item["title"], "category": item["category"], "score": item["score"]}
                for item in greeting_sources
            ],
        }

    search = search_knowledge(normalized, limit=3)
    answer = synthesize_answer(normalized, search["results"], student=student)

    return {
        "question": question,
        "answer": answer,
        "sources": [
            {"id": item["id"], "title": item["title"], "category": item["category"], "score": item["score"]}
            for item in search["results"]
        ],
    }



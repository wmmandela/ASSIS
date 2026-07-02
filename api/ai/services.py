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


def recommend_for_student(student_id: str | None = None, limit: int = 6) -> dict:
    student = find_student(student_id)
    if not student:
        return {"student": None, "recommendations": []}

    profile_text = " ".join(
        [
            student.program,
            *student.interests,
            "academic support" if student.gpa < 2.5 else "advanced opportunities",
            "wellbeing support" if student.wellbeing_score < 60 else "career growth",
        ]
    )
    profile_vector = term_vector(profile_text)
    catalog = SupportItem.objects.filter(active=True)
    recommendations = []

    for item in catalog:
        item_vector = term_vector(" ".join([item.title, item.description, *item.tags]))
        score = cosine_similarity(profile_vector, item_vector)
        if student.gpa < 2.5 and item.item_type in {"resource", "support"}:
            score += 0.15
        if student.year == 1 and "study skills" in item.tags:
            score += 0.12
        recommendations.append(
            {
                **_support_item_to_dict(item),
                "score": round(score, 3),
                "reason": _recommendation_reason(_student_to_dict(student), _support_item_to_dict(item)),
            }
        )

    recommendations.sort(key=lambda item: item["score"], reverse=True)
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


def search_knowledge(query: str, limit: int = 3) -> dict:
    query_vector = term_vector(query)
    results = []

    for document in KnowledgeDocument.objects.all():
        document_text = f"{document.title} {document.category} {document.content}"
        results.append(
            {
                **_knowledge_doc_to_dict(document),
                "score": round(cosine_similarity(query_vector, term_vector(document_text)), 3),
            }
        )

    for item in SupportItem.objects.filter(active=True):
        source_text = f"{item.title} {' '.join(item.tags)} {item.description}"
        results.append(
            {
                **_support_item_to_dict(item),
                "score": round(cosine_similarity(query_vector, term_vector(source_text)), 3),
                "summary": short_summary(item.description),
            }
        )

    results.sort(key=lambda item: item["score"], reverse=True)
    top_results = [item for item in results[:limit] if item["score"] > 0] or results[: min(len(results), 1)]
    return {
        "query": query,
        "results": top_results,
        "answer_summary": synthesize_answer(query, top_results),
    }


def synthesize_answer(query: str, documents: list[dict]) -> str:
    if not query.strip():
        return "Ask a question about advising, financial aid, tutoring, wellness, or career services."

    if not documents:
        return app_overview()

    joined = " ".join(document.get("summary", "") for document in documents)
    summary = short_summary(joined, max_sentences=3)
    return summary or app_overview()


def app_overview() -> str:
    return (
        "This student support chatbot can answer questions about advising, financial aid, tutoring, wellness, career support, "
        "and academic success resources. It searches the app's knowledge documents and support services to provide helpful guidance."
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


def chatbot_response(question: str) -> dict:
    normalized = question.strip()
    if not normalized:
        return {"question": question, "answer": app_overview(), "sources": []}

    if GREETING_PATTERN.search(normalized):
        greeting_sources = search_knowledge("student support", limit=2)["results"]
        return {
            "question": question,
            "answer": (
                "Hello! I am ASSIS, your student support assistant. "
                "Ask me about advising, financial aid, tutoring, wellness services, career resources, or academic planning."
            ),
            "sources": [
                {"id": item["id"], "title": item["title"], "category": item["category"], "score": item["score"]}
                for item in greeting_sources
            ],
        }

    search = search_knowledge(normalized, limit=3)
    answer = search["answer_summary"] or app_overview()
    return {
        "question": question,
        "answer": answer,
        "sources": [
            {"id": item["id"], "title": item["title"], "category": item["category"], "score": item["score"]}
            for item in search["results"]
        ],
    }


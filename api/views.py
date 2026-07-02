import datetime     
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib import messages

from .ai.services import (
    analyze_sentiment,
    chatbot_response,
    get_students,
    predict_academic_risk,
    recommend_for_student,
    search_knowledge,
)
from .models import (
    Assignment,
    Activity,
    ClassSession,
    Course,
    KnowledgeDocument,
    StudentProfile,
    StudentUnitEnrollment,
    SupportItem,
    Unit,
    UnitSection,
)
from .ai.sample_data import KNOWLEDGE_DOCUMENTS, RESOURCES
from .seed_data import (
    COURSES as CURRICULUM_COURSES,
    DEMO_STUDENTS,
    GENERAL_ELECTIVES,
    OTHER_PROGRAM_UNITS,
    SOFTWARE_ELECTIVES,
    SOFTWARE_ENGINEERING_UNITS,
    seed_catalog_and_demo_data,
)
from .serializers import (
    AssignmentSerializer,
    ActivitySerializer,
    ClassSessionSerializer,
    StudentProfileSerializer,
    UnitSerializer,
)


def landing(request):
    if request.user.is_authenticated:
        return redirect("dashboard")
    return render(request, "api/landing.html")


@login_required(login_url="/login/login/")
def dashboard(request):
    profile = _get_current_profile(request)
    if not profile:
        return redirect("login")

    _seed_sample_courses()
    _seed_support_content()
    profile = _ensure_student_success_data(profile)
    upcoming_classes = _order_sessions(
        ClassSession.objects.filter(
            section__unit__enrollments__student=profile,
            section__unit__enrollments__status="enrolled",
        )
    )[:5]
    assignments = profile.assignments.order_by("due_date")[:5]
    activities = profile.activities.order_by("event_date")[:5]
    enrollments = list(
        profile.enrollments.select_related("unit", "section").filter(status="enrolled")
    )
    for enrollment in enrollments:
        if getattr(enrollment, "unit", None) is None and getattr(enrollment, "section", None) is not None:
            enrollment.unit = enrollment.section.unit

    risk = _profile_risk_context(profile)
    recommendations = recommend_for_student(student_id=profile.student_id, limit=4).get("recommendations", [])
    support_items = SupportItem.objects.filter(active=True).order_by("item_type", "title")[:4]

    return render(
        request,
        "api/dashboard.html",
        {
            "profile": profile,
            "upcoming_classes": upcoming_classes,
            "assignments": assignments,
            "activities": activities,
            "enrollments": enrollments,
            "risk": risk,
            "recommendations": recommendations,
            "support_items": support_items,
        },
    )


@login_required(login_url="/login/login/")
def ai_recommendations_ui(request):
    profile = _get_current_profile(request)
    if not profile:
        return redirect("login")
    _seed_support_content()
    data = recommend_for_student(student_id=profile.student_id, limit=8)
    return render(request, "api/ai_recommendations.html", {"profile": profile, "recommendations": data.get("recommendations", [])})


@login_required(login_url="/login/login/")
def academic_analytics_ui(request):
    profile = _get_current_profile(request)
    if not profile:
        return redirect("login")
    _seed_sample_courses()
    profile = _ensure_student_success_data(profile)
    sessions = _order_sessions(ClassSession.objects.filter(
        section__unit__enrollments__student=profile,
        section__unit__enrollments__status="enrolled",
    ))
    return render(
        request,
        "api/academic_analytics.html",
        {"profile": profile, "risk": _profile_risk_context(profile), "sessions": sessions},
    )


@login_required(login_url="/login/login/")
def knowledge_search_ui(request):
    profile = _get_current_profile(request)
    if not profile:
        return redirect("login")
    _seed_support_content()
    documents = KnowledgeDocument.objects.order_by("category", "title")[:6]
    support_items = SupportItem.objects.filter(active=True).order_by("item_type", "title")[:6]
    return render(
        request,
        "api/knowledge_search.html",
        {"profile": profile, "documents": documents, "support_items": support_items},
    )


@login_required(login_url="/login/login/")
def events_ui(request):
    profile = _get_current_profile(request)
    if not profile:
        return redirect("login")
    _seed_sample_courses()
    _seed_support_content()
    profile = _ensure_student_success_data(profile)
    activities = profile.activities.order_by("event_date")
    support_events = SupportItem.objects.filter(active=True, item_type="event").order_by("title")
    return render(
        request,
        "api/events.html",
        {"profile": profile, "activities": activities, "support_events": support_events},
    )


@login_required(login_url="/login/login/")
def my_profile_ui(request):
    profile = _get_current_profile(request)
    if not profile:
        return redirect("login")
    profile = _ensure_student_success_data(profile)
    return render(request, "api/my_profile.html", {"profile": profile, "risk": _profile_risk_context(profile)})


@login_required(login_url="/login/login/")
def my_courses_ui(request):
    profile = _get_current_profile(request)
    if not profile:
        return redirect("login")
    _seed_sample_courses()
    profile = _ensure_student_success_data(profile)
    enrollments = profile.enrollments.select_related("unit", "section").filter(status="enrolled")
    sessions = _order_sessions(ClassSession.objects.filter(
        section__unit__enrollments__student=profile,
        section__unit__enrollments__status="enrolled",
    ))
    return render(
        request,
        "api/my_courses.html",
        {"profile": profile, "enrollments": enrollments, "sessions": sessions},
    )


@login_required(login_url="/login/login/")
def ai_assistant_ui(request):
    profile = _get_current_profile(request)
    if not profile:
        return redirect("login")
    _seed_support_content()
    starters = [
        "How can I improve my academic risk score?",
        "What support services are available for tutoring?",
        "How should I plan my classes this semester?",
    ]
    return render(request, "api/ai_assistant.html", {"profile": profile, "starters": starters})


@login_required(login_url="/login/login/")
def settings_ui(request):
    profile = _get_current_profile(request)
    if not profile:
        return redirect("login")
    return render(request, "api/settings.html", {"profile": profile})





@login_required(login_url="/login/login/")
def choose_classes(request):
    profile = _get_current_profile(request)
    if not profile:
        return redirect("login")

    _seed_sample_courses()


    current_enrolled_qs = profile.enrollments.filter(status="enrolled", semester=profile.current_semester)
    enrolled_unit_ids = set(current_enrolled_qs.values_list("unit__unit_id", flat=True))
    completed_unit_ids = set(
        profile.enrollments.filter(status="completed").values_list("unit__unit_id", flat=True)
    )

    def _unit_missing_prereqs(unit):
        return [
            prereq.unit_id
            for prereq in unit.prerequisites.all()
            if prereq.unit_id not in completed_unit_ids
        ]

    def _section_score_for_unit(unit, section):
        # Simple heuristics: reward interest match, penalize missing prereqs, and
        # slightly penalize overlap with existing enrolled classes.
        interest_score = sum(
            1
            for interest in profile.interests or []
            if interest.lower() in f"{unit.title} {unit.description}".lower()
        )
        missing_prereqs = _unit_missing_prereqs(unit)
        year_bonus = 0.5 if profile.year == 1 and unit.unit_id and unit.unit_id[0].isalpha() and unit.unit_id[1:].isdigit() else 0.0
        if profile.year == 1 and len(unit.unit_id) >= 3:
            try:
                unit_number = int(unit.unit_id[-3:])
            except ValueError:
                unit_number = 999
            if unit_number < 200:
                year_bonus += 0.4
        score = 1.0 + interest_score * 0.25 + year_bonus - len(missing_prereqs) * 0.35

        if _section_conflicts_with_enrollment(profile, section):
            score -= 2.0
        return max(0.0, round(score, 3))

    def _pick_best_sections_for_units(units):
        # For each unit pick the best non-conflicting section (relative to existing enrollments).
        picked = {}
        for unit in units:
            sections = unit.sections.filter(active=True).order_by("section_code")
            if not sections:
                continue

            scored = [(s, _section_score_for_unit(unit, s)) for s in sections]
            # Prefer highest score; if all conflict heavily, still pick highest score.
            scored.sort(key=lambda x: x[1], reverse=True)
            picked[unit.unit_id] = scored[0][0]
        return picked

    def _schedule_conflicts_for_selected(picked_sections):
        # Ensure the chosen sections don't overlap each other.
        selected_sessions = []
        for section in picked_sections.values():
            for s in section.sessions.all():
                selected_sessions.append(s)

        for i in range(len(selected_sessions)):
            for j in range(i + 1, len(selected_sessions)):
                if _sessions_overlap(selected_sessions[i], selected_sessions[j]):
                    return True
        return False

    if request.method == "POST":
        drop_unit_id = request.POST.get("drop_unit_id")
        if drop_unit_id:
            enrollment = profile.enrollments.filter(unit__unit_id=drop_unit_id, status="enrolled").first()
            if enrollment:
                enrollment.delete()
                messages.success(request, f"{drop_unit_id} has been dropped from your plan.")
            else:
                messages.error(request, f"{drop_unit_id} is not currently in your plan.")
            return redirect("choose_classes")

        # New UX: accept up to 5 chosen units (unit_ids[]).
        unit_ids = request.POST.getlist("unit_ids[]")
        if not unit_ids:
            # Backwards compatible: old flow posted section_id.
            section_id = request.POST.get("section_id")
            if section_id:
                unit_ids = []
                try:
                    section = UnitSection.objects.get(pk=section_id, active=True)
                    unit_ids = [section.unit.unit_id]
                except UnitSection.DoesNotExist:
                    messages.error(request, "The selected section was not found.")

        if not unit_ids:
            messages.error(request, "No units selected.")
            return redirect("choose_classes")

        # Normalize/unique
        unit_ids = list(dict.fromkeys(unit_ids))

        if len(unit_ids) > 5:
            messages.error(request, "You can only enroll in up to 5 units per semester.")
            return redirect("choose_classes")

        # Validate semester + active
        units = list(
            Unit.objects.filter(active=True, semester=profile.current_semester, unit_id__in=unit_ids)
        )
        found_ids = {u.unit_id for u in units}
        missing = [u for u in unit_ids if u not in found_ids]
        if missing:
            messages.error(request, f"Some selected units were not found/available: {', '.join(missing)}")
            return redirect("choose_classes")

        # Prereqs
        missing_prereqs_map = {u.unit_id: _unit_missing_prereqs(u) for u in units}
        prereq_fail = {k: v for k, v in missing_prereqs_map.items() if v}
        if prereq_fail:
            parts = [f"{uid}: {', '.join(reqs)}" for uid, reqs in prereq_fail.items()]
            messages.error(request, f"Cannot enroll due to missing prerequisites — { ' | '.join(parts) }")
            return redirect("choose_classes")

        # Capacity (count distinct enrolled units this semester)
        new_units_count = len([uid for uid in unit_ids if uid not in enrolled_unit_ids])
        if current_enrolled_qs.count() + new_units_count > 5:
            messages.error(request, "You can only enroll in up to 5 units per semester.")
            return redirect("choose_classes")

        # Pick best sections for each selected unit.
        picked_sections = _pick_best_sections_for_units(units)

        # Conflict check among chosen sections.
        if _schedule_conflicts_for_selected(picked_sections):
            messages.error(
                request,
                "Schedule conflict: the selected unit set overlaps. Try a different combination."
            )
            return redirect("choose_classes")

        # Enroll
        for unit in units:
            section = picked_sections.get(unit.unit_id)
            if not section:
                messages.error(request, f"No available section found for {unit.unit_id}.")
                continue
            StudentUnitEnrollment.objects.update_or_create(
                student=profile,
                unit=unit,
                defaults={
                    "section": section,
                    "status": "enrolled",
                    "semester": profile.current_semester,
                },
            )

        messages.success(request, "Your class plan has been enrolled successfully.")
        return redirect("choose_classes")

    # GET: compute full unit list + recommended top 5
    course_list = Course.objects.filter(active=True).prefetch_related("units__sections__sessions")
    available_units = _get_available_units_for_profile(profile)

    candidates = [u for u in available_units if u.unit_id not in enrolled_unit_ids]

    if profile.year == 1:
        candidates = sorted(
            candidates,
            key=lambda unit: (
                0 if not _unit_missing_prereqs(unit) else 1,
                0 if len(unit.unit_id) >= 3 and int(unit.unit_id[-3:]) < 200 else 1,
                unit.unit_id,
            ),
        )

    # Pre-score each unit using its best section score.
    scored = []
    for unit in candidates:
        best_section = None
        best_score = 0.0
        for section in unit.sections.filter(active=True).order_by("section_code"):
            s = _section_score_for_unit(unit, section)
            if s > best_score:
                best_score = s
                best_section = section
        scored.append(
            {
                "unit": unit,
                "sections": unit.sections.filter(active=True).order_by("section_code"),
                "score": round(best_score, 3),
                "missing_prereqs": _unit_missing_prereqs(unit),
            }
        )

    scored.sort(key=lambda item: item["score"], reverse=True)
    recommended_units = scored[:5]

    enrollments = profile.enrollments.select_related("unit", "section").filter(status="enrolled")

    return render(
        request,
        "api/choose_classes.html",
        {
            "profile": profile,
            "courses": course_list,
            "available_units": available_units,
            "recommended_units": recommended_units,
            "enrolled_unit_ids": enrolled_unit_ids,
            "enrollments": enrollments,
        },
    )



def _get_current_profile(request):
    if not request.user.is_authenticated:
        return None

    try:
        return request.user.student_profile
    except StudentProfile.DoesNotExist:
        student_id = f"{request.user.username[:8].upper()}{request.user.id:03d}"
        profile = StudentProfile.objects.create(
            user=request.user,
            student_id=student_id,
            name=request.user.get_full_name() or request.user.username,
            program="General Studies",
            year=1,
            current_semester="Fall",
            gpa=0,
            attendance=0,
            lms_activity=0,
            assignments_submitted=0,
            recent_grade=0,
            wellbeing_score=0,
            completed_units=0,
        )
        return profile


def _get_available_units_for_profile(profile):
    current_semester = (profile.current_semester or "Fall").strip() or "Fall"
    base_qs = Unit.objects.filter(active=True).select_related("course")
    semester_qs = base_qs.filter(semester__iexact=current_semester)

    program_text = (profile.program or "").lower().strip()
    if program_text:
        matched_qs = semester_qs.filter(course__title__icontains=program_text)
        if not matched_qs.exists():
            aliases = {
                "cs": ["computer science", "software", "technology", "engineering"],
                "software engineering": ["software engineering", "software"],
                "it": ["information technology", "technology"],
                "software": ["software"],
            }
            keywords = [program_text] + aliases.get(program_text, [])
            matched_qs = base_qs.none()
            for kw in keywords:
                if not kw:
                    continue
                matched_qs = matched_qs.union(
                    semester_qs.filter(course__title__icontains=kw)
                ).union(
                    semester_qs.filter(course__department__icontains=kw)
                )
        if not matched_qs.exists():
            matched_qs = semester_qs
    else:
        matched_qs = semester_qs

    if not matched_qs.exists():
        matched_qs = base_qs

    return list(matched_qs.order_by("unit_id"))


def _student_record(profile):
    return {
        "id": profile.student_id,
        "student_id": profile.student_id,
        "name": profile.name,
        "program": profile.program,
        "year": profile.year,
        "interests": list(profile.interests or []),
        "gpa": float(profile.gpa),
        "attendance": profile.attendance,
        "lms_activity": profile.lms_activity,
        "assignments_submitted": profile.assignments_submitted,
        "recent_grade": profile.recent_grade,
        "wellbeing_score": profile.wellbeing_score,
    }


def _profile_risk_context(profile):
    prediction = predict_academic_risk(records=[_student_record(profile)]).get("predictions", [{}])[0]
    score = prediction.get("risk_score", 0)
    if score >= 70:
        label = "high"
        tone = "danger"
    elif score >= 40:
        label = "moderate"
        tone = "warning"
    else:
        label = "low"
        tone = "success"
    return {
        "score": score,
        "level": prediction.get("risk_level", label),
        "tone": tone,
        "signals": prediction.get("signals", []),
        "interventions": prediction.get("interventions", []),
    }


def _order_sessions(sessions):
    day_order = {"mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6}
    return sorted(sessions, key=lambda item: (day_order.get(item.day_of_week, 99), item.start_time))


def _ensure_student_success_data(profile):
    seed_catalog_and_demo_data()
    if not profile.student_id:
        return

    existing_student = StudentProfile.objects.filter(student_id=profile.student_id).first()
    if existing_student and existing_student.pk != profile.pk:
        profile = existing_student

    fallback_unit = Unit.objects.filter(course__course_id="BSE").first() or Unit.objects.first()

    if profile.assignments.count() < 3:
        coursework_items = [
            {"title": "Quiz 1: Foundations check", "days": 2, "status": "Pending"},
            {"title": "Assignment 2: Weekly reflection", "days": 7, "status": "In progress"},
            {"title": "Quiz 2: Concepts review", "days": 12, "status": "Pending"},
        ]
        for item in coursework_items:
            Assignment.objects.get_or_create(
                student=profile,
                title=item["title"],
                defaults={
                    "due_date": datetime.date.today() + datetime.timedelta(days=item["days"]),
                    "status": item["status"],
                    "unit": fallback_unit,
                },
            )
    if profile.activities.count() < 2:
        activity_items = [
            {"title": "Academic coaching session", "days": -2, "category": "Academic"},
            {"title": "Study group workshop", "days": -5, "category": "Academic"},
        ]
        for item in activity_items:
            Activity.objects.get_or_create(
                student=profile,
                title=item["title"],
                defaults={
                    "event_date": datetime.date.today() + datetime.timedelta(days=item["days"]),
                    "category": item["category"],
                    "unit": fallback_unit,
                },
            )

    if profile.activities.count() < 2:
        activity_items = [
            {"title": "Academic coaching session", "days": -2, "category": "Academic"},
            {"title": "Study group workshop", "days": -5, "category": "Academic"},
        ]
        for item in activity_items:
            Activity.objects.get_or_create(
                student=profile,
                title=item["title"],
                defaults={
                    "event_date": datetime.date.today() + datetime.timedelta(days=item["days"]),
                    "category": item["category"],
                    "unit": fallback_unit,
                },
            )

    if profile.attendance <= 0:
        profile.attendance = 80
    if profile.lms_activity <= 0:
        profile.lms_activity = 75
    if profile.assignments_submitted <= 0:
        profile.assignments_submitted = 80
    if profile.recent_grade <= 0:
        profile.recent_grade = 78
    if profile.wellbeing_score <= 0:
        profile.wellbeing_score = 70
    if profile.completed_units <= 0:
        profile.completed_units = 4
    profile.save(update_fields=[
        "attendance",
        "lms_activity",
        "assignments_submitted",
        "recent_grade",
        "wellbeing_score",
        "completed_units",
    ])
    profile.refresh_from_db()
    return profile


def _seed_support_content():
    for item in RESOURCES:
        SupportItem.objects.update_or_create(
            item_id=item["id"],
            defaults={
                "item_type": item["type"],
                "title": item["title"],
                "description": item["description"],
                "tags": item["tags"],
                "active": True,
            },
        )
    for document in KNOWLEDGE_DOCUMENTS:
        KnowledgeDocument.objects.update_or_create(
            document_id=document["id"],
            defaults={
                "title": document["title"],
                "category": document["category"],
                "content": document["content"],
            },
        )


def _to_time(value):
    if isinstance(value, datetime.time):
        return value
    return datetime.datetime.strptime(value, "%H:%M").time()


def _sessions_overlap(a, b):
    if a.day_of_week != b.day_of_week:
        return False
    return a.start_time < b.end_time and b.start_time < a.end_time


def _section_conflicts_with_enrollment(profile, section):
    existing_sessions = ClassSession.objects.filter(
        section__unit__enrollments__student=profile,
        section__unit__enrollments__status="enrolled",
    )
    for new_session in section.sessions.all():
        for existing_session in existing_sessions.filter(day_of_week=new_session.day_of_week):
            if _sessions_overlap(new_session, existing_session):
                return True
    return False


def _normalize_section_days(section_days, section_code):
    day_set = {day for day, _, _ in section_days}
    if day_set == {"mon", "wed"}:
        time_map = {
            "A": ("07:00", "08:40"),
            "B": ("09:00", "10:40"),
            "C": ("11:00", "12:40"),
            "D": ("14:00", "15:40"),
            "E": ("16:00", "17:40"),
        }
        start, end = time_map.get(section_code, ("07:00", "08:40"))
        return [("mon", start, end), ("wed", start, end)]
    if day_set == {"tue", "thu"}:
        time_map = {
            "A": ("07:00", "08:40"),
            "B": ("09:00", "10:40"),
            "C": ("11:00", "12:40"),
            "D": ("14:00", "15:40"),
            "E": ("16:00", "17:40"),
        }
        start, end = time_map.get(section_code, ("07:00", "08:40"))
        return [("tue", start, end), ("thu", start, end)]
    if day_set == {"fri"}:
        time_map = {
            "A": ("09:00", "12:00"),
            "B": ("12:30", "15:30"),
            "C": ("16:00", "19:00"),
            "D": ("18:00", "21:00"),
            "E": ("07:00", "10:00"),
        }
        start, end = time_map.get(section_code, ("09:00", "12:00"))
        return [("fri", start, end)]
    if day_set == {"sat"}:
        time_map = {
            "A": ("09:00", "12:00"),
            "B": ("12:30", "15:30"),
            "C": ("16:00", "19:00"),
            "D": ("18:00", "21:00"),
        }
        start, end = time_map.get(section_code, ("09:00", "12:00"))
        return [("sat", start, end)]
    return [(day, start, end) for day, start, end in section_days]


def _seed_sample_courses():
    seed_catalog_and_demo_data()
    return


@api_view(["GET"])
def api_status(request):
    return Response(
        {
            "status": "ok",
            "system": "AI-Powered Student Support Information System",
            "modules": [
                "AI Recommendation Engine",
                "Academic Risk Prediction",
                "Intelligent Knowledge Search",
                "Sentiment Analysis",
                "Knowledge-grounded Chatbot",
                "Student Profile",
                "Timetable",
                "Unit Recommendations",
            ],
        }
    )


@api_view(["GET"])
def me(request):
    profile = _get_current_profile(request)
    if not profile:
        return Response({"detail": "Student profile not found."}, status=404)
    return Response({"profile": StudentProfileSerializer(profile).data})


@api_view(["GET"])
def timetable(request):
    profile = _get_current_profile(request)
    if not profile:
        return Response({"detail": "Student profile not found."}, status=404)

    sessions = _order_sessions(ClassSession.objects.filter(
        section__unit__enrollments__student=profile,
        section__unit__enrollments__status="enrolled",
    ))
    return Response({"timetable": ClassSessionSerializer(sessions, many=True).data})


@api_view(["GET"])
def units(request):
    semester = request.query_params.get("semester")
    queryset = Unit.objects.filter(active=True)
    if semester:
        queryset = queryset.filter(semester__iexact=semester)
    return Response({"units": UnitSerializer(queryset, many=True).data})


@api_view(["GET"])
def unit_recommendations(request):
    profile = _get_current_profile(request)
    if not profile:
        return Response({"detail": "Student profile not found."}, status=404)

    completed_unit_ids = set(
        profile.enrollments.filter(status="completed").values_list("unit__unit_id", flat=True)
    )
    enrolled_unit_ids = set(
        profile.enrollments.filter(status="enrolled").values_list("unit__unit_id", flat=True)
    )

    recommendations = []
    for unit in Unit.objects.filter(active=True, semester=profile.current_semester).exclude(
        unit_id__in=enrolled_unit_ids
    ):
        text = f"{unit.title} {unit.description} {unit.category}".lower()
        interest_matches = sum(
            1 for interest in profile.interests or [] if interest.lower() in text
        )
        missing_prereqs = [
            prereq.unit_id for prereq in unit.prerequisites.all() if prereq.unit_id not in completed_unit_ids
        ]
        score = 0.3 + interest_matches * 0.25 - len(missing_prereqs) * 0.35
        score = max(round(score, 3), 0.0)
        reason_fragments = []
        if interest_matches:
            reason_fragments.append(f"Matches interests: {', '.join(profile.interests[:3])}")
        if missing_prereqs:
            reason_fragments.append(f"Missing prerequisites: {', '.join(missing_prereqs)}")
        else:
            reason_fragments.append("Prerequisites satisfied")
        recommendations.append(
            {
                "unit": UnitSerializer(unit).data,
                "score": score,
                "reason": " · ".join(reason_fragments),
                "prereqs_met": not missing_prereqs,
                "missing_prereqs": missing_prereqs,
            }
        )

    recommendations.sort(key=lambda item: item["score"], reverse=True)
    return Response({"recommendations": recommendations[:6]})


@api_view(["POST"])
def enroll_unit(request):
    profile = _get_current_profile(request)
    if not profile:
        return Response({"detail": "Student profile not found."}, status=404)

    unit_id = request.data.get("unit_id")
    semester = profile.current_semester
    if not unit_id:
        return Response({"detail": "unit_id is required."}, status=400)

    current_enrolled = profile.enrollments.filter(status="enrolled", semester=semester).count()
    if current_enrolled >= 5:
        return Response({"detail": "Maximum 5 enrolled units allowed per semester."}, status=400)

    try:
        unit = Unit.objects.get(unit_id=unit_id, active=True)
    except Unit.DoesNotExist:
        return Response({"detail": "Unit not found."}, status=404)

    completed_unit_ids = set(profile.enrollments.filter(status="completed").values_list("unit__unit_id", flat=True))
    missing_prereqs = [
        prereq.unit_id for prereq in unit.prerequisites.all() if prereq.unit_id not in completed_unit_ids
    ]
    if missing_prereqs:
        return Response({"detail": f"Missing prerequisites: {', '.join(missing_prereqs)}"}, status=400)

    enrollment, created = StudentUnitEnrollment.objects.get_or_create(
        student=profile,
        unit=unit,
        defaults={"status": "enrolled", "semester": semester},
    )
    if not created and enrollment.status == "enrolled":
        return Response({"detail": "Already enrolled in this unit."}, status=400)

    if enrollment.status != "enrolled":
        enrollment.status = "enrolled"
        enrollment.semester = semester
        enrollment.save()

    return Response({"detail": "Unit enrolled successfully."})


@api_view(["GET"])
def students(request):
    return Response({"students": get_students()})


@api_view(["GET"])
def recommendations(request):
    student_id = request.query_params.get("student_id")
    return Response(recommend_for_student(student_id=student_id))


@api_view(["GET", "POST"])
def academic_risk(request):
    records = request.data.get("students") if request.method == "POST" else None
    return Response(predict_academic_risk(records=records))


@api_view(["GET"])
def knowledge_search(request):
    query = request.query_params.get("q", "")
    return Response(search_knowledge(query=query))


@api_view(["POST"])
def sentiment(request):
    feedback = request.data.get("feedback")
    if isinstance(feedback, str):
        feedback = [feedback]
    return Response(analyze_sentiment(feedback_items=feedback))


@api_view(["POST"])
def chatbot(request):
    question = request.data.get("question", "")
    return Response(chatbot_response(question=question))

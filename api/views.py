import datetime
from django.shortcuts import redirect, render
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.db import models
from django.db.models import Q

from .ai.services import (
    _student_to_dict,
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
    InterventionRecommendation,
    StudentFeedback,
)
from django.db.models import Avg, Count, Max, Q
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


@login_required(login_url="/login/")
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


@login_required(login_url="/login/")
def ai_recommendations_ui(request):
    profile = _get_current_profile(request)
    if not profile:
        return redirect("login")
    _seed_support_content()
    data = recommend_for_student(student_id=profile.student_id, limit=8)
    return render(request, "api/ai_recommendations.html", {"profile": profile, "recommendations": data.get("recommendations", [])})


@login_required(login_url="/login/")
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


@login_required(login_url="/login/")
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


@login_required(login_url="/login/")
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


@login_required(login_url="/login/")
def my_profile_ui(request):
    profile = _get_current_profile(request)
    if not profile:
        return redirect("login")
    profile = _ensure_student_success_data(profile)
    return render(request, "api/my_profile.html", {"profile": profile, "risk": _profile_risk_context(profile)})


@login_required(login_url="/login/")
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


@login_required(login_url="/login/")
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


@login_required(login_url="/login/")
def settings_ui(request):
    profile = _get_current_profile(request)
    if not profile:
        return redirect("login")
    return render(request, "api/settings.html", {"profile": profile})





@login_required(login_url="/login/")
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

    def _get_schedule_conflicts_for_selected(picked_sections):
        # Ensure the chosen sections don't overlap each other.
        # Returns a list of human-readable overlap descriptions.
        selected_sessions = []
        for section in picked_sections.values():
            for s in section.sessions.all():
                selected_sessions.append(s)

        overlaps = []
        for i in range(len(selected_sessions)):
            for j in range(i + 1, len(selected_sessions)):
                a = selected_sessions[i]
                b = selected_sessions[j]
                if _sessions_overlap(a, b):
                    overlaps.append(
                        f"{a.section.unit.unit_id} ({a.day_of_week.upper()} {a.start_time}-{a.end_time}) overlaps with {b.section.unit.unit_id} ({b.day_of_week.upper()} {b.start_time}-{b.end_time})"
                    )
        # Deduplicate while preserving order
        seen = set()
        unique_overlaps = []
        for item in overlaps:
            if item not in seen:
                seen.add(item)
                unique_overlaps.append(item)
        return unique_overlaps


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

        # Conflict check among chosen sections (with detailed feedback).
        conflict_details = _get_schedule_conflicts_for_selected(picked_sections)
        if conflict_details:
            conflict_msg = "Schedule conflict: the selected unit set overlaps. "
            conflict_msg += "Overlaps: " + "; ".join(conflict_details)
            messages.error(request, conflict_msg)
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
                # Pick the best section up-front so the template can preview a schedule.
                "best_section": (
                    (lambda: next(
                        (
                            section
                            for section in unit.sections.filter(active=True).order_by("section_code")
                            if _section_score_for_unit(unit, section) == max(
                                _section_score_for_unit(unit, s)
                                for s in unit.sections.filter(active=True).order_by("section_code")
                            )
                        ),
                        None,
                    ))()
                ),
            }
        )


    scored.sort(key=lambda item: item["score"], reverse=True)
    recommended_units = scored[:5]

    enrollments = profile.enrollments.select_related("unit", "section").filter(status="enrolled")

    # Prepare a preview schedule for the recommended plan.
    preview_sessions = []
    if recommended_units:
        seen_preview = set()
        for item in recommended_units:
            bs = item.get("best_section")
            if bs is None:
                continue
            # Collect all sessions under the chosen best section.
            for sess in bs.sessions.all():
                key = (sess.pk)
                if key in seen_preview:
                    continue
                seen_preview.add(key)
                preview_sessions.append(sess)


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
            "preview_sessions": preview_sessions,
        },
    )




def _get_current_profile(request):
    if hasattr(request, "user") and request.user and request.user.is_authenticated:
        # Admin users are not students and should not have a student profile
        if request.user.is_staff or request.user.is_superuser or (request.user.username and request.user.username.lower().startswith("admin")):
            return None
        try:
            return request.user.student_profile
        except StudentProfile.DoesNotExist:
            student_id = f"STU{request.user.id:04d}"
            profile = StudentProfile.objects.create(
                user=request.user,
                student_id=student_id,
                name=request.user.get_full_name() or request.user.username,
                program="Bachelor of Science in Software Engineering",
                year=1,
                current_semester="Fall",
                gpa=3.5,
                attendance=85,
                lms_activity=80,
                assignments_submitted=80,
                recent_grade=82,
                wellbeing_score=75,
            )
            return profile

    # For unauthenticated users, return None so the caller can handle appropriately
    return None


@api_view(["GET"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def me(request):
    is_authenticated = bool(hasattr(request, "user") and request.user and request.user.is_authenticated)
    
    if not is_authenticated:
        return Response({"authenticated": False, "profile": None})
    
    is_admin = bool(request.user.is_staff or request.user.is_superuser or (request.user.username and request.user.username.lower().startswith("admin")))
    profile = None if is_admin else _get_current_profile(request)

    return Response({
        "authenticated": True,
        "username": request.user.username,
        "is_admin": is_admin,
        "profile": StudentProfileSerializer(profile).data if profile else None
    })

def _get_available_units_for_profile(profile):
    current_semester = (profile.current_semester or "Fall").strip() or "Fall"
    base_qs = Unit.objects.filter(active=True).select_related("course")
    semester_qs = base_qs.filter(semester__iexact=current_semester)

    program_text = (profile.program or "").lower().strip()
    if "software" in program_text or "engineering" in program_text:
        se_qs = semester_qs.filter(
            Q(course__course_id="BSE")
            | Q(course__department__icontains="Software")
            | Q(course__title__icontains="Software")
            | Q(unit_id__startswith="SWE")
            | Q(unit_id__startswith="APT")
            | Q(unit_id__startswith="CS")
            | Q(unit_id__startswith="MTH")
        )
        return list(se_qs.distinct().order_by("unit_id"))
    elif "data" in program_text or "analytics" in program_text:
        dsa_qs = semester_qs.filter(
            Q(course__course_id="BDSA")
            | Q(course__department__icontains="Data")
            | Q(course__title__icontains="Data")
            | Q(unit_id__startswith="DSA")
            | Q(unit_id__startswith="APT")
            | Q(unit_id__startswith="MTH")
        )
        return list(dsa_qs.distinct().order_by("unit_id"))
    elif "cyber" in program_text or "security" in program_text:
        cyb_qs = semester_qs.filter(
            Q(course__course_id="BCYB")
            | Q(course__department__icontains="Security")
            | Q(course__title__icontains="Cyber")
            | Q(unit_id__startswith="CYB")
            | Q(unit_id__startswith="APT")
        )
        return list(cyb_qs.distinct().order_by("unit_id"))
    elif "robotics" in program_text or "artificial" in program_text or "intelligence" in program_text:
        air_qs = semester_qs.filter(
            Q(course__course_id="BAIR")
            | Q(course__department__icontains="Intelligence")
            | Q(course__title__icontains="Artificial")
            | Q(unit_id__startswith="AIR")
            | Q(unit_id__startswith="APT")
        )
        return list(air_qs.distinct().order_by("unit_id"))
    elif "information" in program_text or "system" in program_text:
        ist_qs = semester_qs.filter(
            Q(course__course_id="BIST")
            | Q(course__department__icontains="Information")
            | Q(course__title__icontains="Information")
            | Q(unit_id__startswith="IST")
            | Q(unit_id__startswith="APT")
        )
        return list(ist_qs.distinct().order_by("unit_id"))
    elif "applied" in program_text or "technology" in program_text:
        act_qs = semester_qs.filter(
            Q(course__course_id="BACT")
            | Q(course__department__icontains="Technology")
            | Q(course__title__icontains="Applied")
            | Q(unit_id__startswith="ACT")
            | Q(unit_id__startswith="APT")
        )
        return list(act_qs.distinct().order_by("unit_id"))

    if program_text:
        matched_qs = semester_qs.filter(
            Q(course__title__icontains=program_text) | Q(course__department__icontains=program_text)
        )
        if matched_qs.exists():
            return list(matched_qs.order_by("unit_id"))

    return list(semester_qs.order_by("unit_id"))


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
    if not profile or not profile.student_id:
        return profile

    existing_student = StudentProfile.objects.filter(student_id=profile.student_id).first()
    if existing_student and existing_student.pk != profile.pk:
        profile = existing_student

    # Return immediately if profile values are already initialized to prevent DB locks
    if profile.attendance > 0 and profile.lms_activity > 0 and profile.assignments_submitted > 0:
        return profile

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
    return profile


def _seed_support_content():
    if SupportItem.objects.exists() and KnowledgeDocument.objects.exists():
        return
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


def _ensure_sections_for_all_units():
    units_without_sections = Unit.objects.filter(sections__isnull=True).distinct()
    for unit in units_without_sections:
        sec_a, _ = UnitSection.objects.get_or_create(
            unit=unit,
            section_code="Section A",
            defaults={"instructor_name": "Dr. Academic Advisor", "room": "Hall 101", "active": True},
        )
        if not sec_a.sessions.exists():
            ClassSession.objects.create(
                section=sec_a,
                day_of_week="Monday",
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 30),
                room="Hall 101",
            )
            ClassSession.objects.create(
                section=sec_a,
                day_of_week="Wednesday",
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 30),
                room="Hall 101",
            )

    for enrollment in StudentUnitEnrollment.objects.filter(section__isnull=True):
        sec = enrollment.unit.sections.filter(active=True).first() or enrollment.unit.sections.first()
        if sec:
            enrollment.section = sec
            enrollment.save()


def _seed_sample_courses():
    if not Course.objects.exists():
        seed_catalog_and_demo_data()
    _ensure_sections_for_all_units()
    return


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
        section__enrollments__student=profile,
        section__enrollments__status="enrolled",
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





@csrf_exempt
@api_view(["GET"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def timetable(request):
    profile = _get_current_profile(request)
    if not profile:
        return Response({"detail": "Student profile not found."}, status=404)

    # Ensure all enrolled units have an assigned section and sessions so their sessions appear on timetable
    enrolled_enrollments = list(profile.enrollments.filter(status="enrolled"))
    for enrollment in enrolled_enrollments:
        if not enrollment.section or not enrollment.section.sessions.exists():
            sec = enrollment.unit.sections.filter(active=True).first()
            if not sec:
                sec = UnitSection.objects.create(
                    unit=enrollment.unit,
                    section_code="Section A",
                    instructor_name="Dr. Academic Advisor",
                    room="Hall 101",
                    active=True,
                )
            if not sec.sessions.exists():
                ClassSession.objects.create(
                    section=sec,
                    day_of_week="Monday",
                    start_time=datetime.time(9, 0),
                    end_time=datetime.time(10, 30),
                    room="Hall 101",
                )
                ClassSession.objects.create(
                    section=sec,
                    day_of_week="Wednesday",
                    start_time=datetime.time(9, 0),
                    end_time=datetime.time(10, 30),
                    room="Hall 101",
                )
            enrollment.section = sec
            enrollment.save()

    enrolled_unit_ids = [e.unit.unit_id for e in enrolled_enrollments]

    # Collect class sessions for all enrolled sections
    session_qs = ClassSession.objects.filter(
        section__enrollments__student=profile,
        section__enrollments__status="enrolled",
    ).distinct()

    if not session_qs.exists() and enrolled_unit_ids:
        session_qs = ClassSession.objects.filter(
            section__unit__unit_id__in=enrolled_unit_ids,
            section__active=True
        ).distinct()

    sessions = _order_sessions(session_qs)
    return Response({"timetable": ClassSessionSerializer(sessions, many=True).data})


@csrf_exempt
@api_view(["GET"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def units(request):
    profile = _get_current_profile(request)
    if profile:
        available_units = _get_available_units_for_profile(profile)
        return Response({"units": UnitSerializer(available_units, many=True).data})

    semester = request.query_params.get("semester")
    queryset = Unit.objects.filter(active=True)
    if semester:
        queryset = queryset.filter(semester__iexact=semester)
    return Response({"units": UnitSerializer(queryset, many=True).data})


@csrf_exempt
@api_view(["GET"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def unit_recommendations(request):
    profile = _get_current_profile(request)
    if not profile:
        return Response({"recommendations": []})

    preferred_time = (request.query_params.get("preferred_time") or "").lower().strip()
    preferred_lecturer = (request.query_params.get("preferred_lecturer") or "").strip()

    completed_unit_ids = set(
        profile.enrollments.filter(status="completed").values_list("unit__unit_id", flat=True)
    )
    enrolled_unit_ids = set(
        profile.enrollments.filter(status="enrolled").values_list("unit__unit_id", flat=True)
    )

    # Get existing enrolled class sessions for clash detection
    existing_sessions = list(
        ClassSession.objects.filter(
            section__enrollments__student=profile,
            section__enrollments__status="enrolled",
        )
    )

    available_units = _get_available_units_for_profile(profile)

    recommendations = []
    for unit in available_units:
        if unit.unit_id in enrolled_unit_ids or unit.unit_id in completed_unit_ids:
            continue

        # Prerequisite check: must meet ALL prerequisites
        missing_prereqs = [
            prereq.unit_id for prereq in unit.prerequisites.all() if prereq.unit_id not in completed_unit_ids
        ]
        if missing_prereqs:
            continue

        # Check for schedule clashes against current timetable (try all active sections)
        active_sections = unit.sections.filter(active=True)
        active_section = None
        for candidate_sec in active_sections:
            has_clash = False
            for new_sess in candidate_sec.sessions.all():
                for ex_sess in existing_sessions:
                    if new_sess.day_of_week.lower() == ex_sess.day_of_week.lower():
                        if new_sess.start_time < ex_sess.end_time and ex_sess.start_time < new_sess.end_time:
                            has_clash = True
                            break
                if has_clash:
                    break
            if not has_clash:
                active_section = candidate_sec
                break

        if not active_section and active_sections.exists():
            continue

        # Calculate score (base 82)
        score_val = 82

        # 1st Year student priority (favor 100-level units)
        is_first_year_unit = False
        unit_num = "".join(c for c in unit.unit_id if c.isdigit())
        if unit_num and (unit_num.startswith("1") or int(unit_num) < 200):
            is_first_year_unit = True

        if profile.year == 1 and is_first_year_unit:
            score_val += 8
        elif profile.year > 1 and not is_first_year_unit:
            score_val += 5

        # Preferred time slot check
        if active_section and preferred_time and preferred_time != "any":
            for sess in active_section.sessions.all():
                start_h = sess.start_time.hour if hasattr(sess.start_time, "hour") else 9
                if preferred_time == "morning" and 7 <= start_h < 12:
                    score_val += 5
                    break
                elif preferred_time == "afternoon" and 12 <= start_h < 16:
                    score_val += 5
                    break
                elif preferred_time == "evening" and start_h >= 16:
                    score_val += 5
                    break

        # Preferred lecturer check
        if active_section and preferred_lecturer and preferred_lecturer != "any":
            if preferred_lecturer.lower() in (active_section.lecturer or "").lower():
                score_val += 5

        score_val = min(score_val, 99)

        reason = f"Required for {profile.program} degree track."
        if profile.year == 1 and is_first_year_unit:
            reason += " Fits Year 1 core requirements."

        recommendations.append(
            {
                "unit": UnitSerializer(unit).data,
                "score": score_val,
                "reason": reason,
                "prereqs_met": True,
                "missing_prereqs": [],
            }
        )

    recommendations.sort(key=lambda item: item["score"], reverse=True)
    return Response({"recommendations": recommendations[:5]})


@csrf_exempt
@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
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

    # Find active section for the target unit (prefer non-clashing section)
    active_sections = unit.sections.filter(active=True)
    section = None
    clash_detail = None

    existing_sessions = list(
        ClassSession.objects.filter(
            section__enrollments__student=profile,
            section__enrollments__status="enrolled",
        )
    )

    for candidate_sec in active_sections:
        has_clash = False
        temp_clash_msg = None
        for new_sess in candidate_sec.sessions.all():
            for ex_sess in existing_sessions:
                if new_sess.day_of_week.lower() == ex_sess.day_of_week.lower():
                    if new_sess.start_time < ex_sess.end_time and ex_sess.start_time < new_sess.end_time:
                        has_clash = True
                        ex_unit = ex_sess.section.unit.unit_id if ex_sess.section and ex_sess.section.unit else "Enrolled Unit"
                        day_str = new_sess.day_of_week.upper()
                        temp_clash_msg = f"Schedule Conflict: {unit.unit_id} ({day_str} {new_sess.start_time}-{new_sess.end_time}) overlaps with enrolled {ex_unit} ({day_str} {ex_sess.start_time}-{ex_sess.end_time}). Student cannot have 2 classes at the same time."
                        break
            if has_clash:
                break

        if not has_clash:
            section = candidate_sec
            break
        elif not clash_detail:
            clash_detail = temp_clash_msg

    if not section:
        if active_sections.exists() and clash_detail:
            return Response({"detail": clash_detail}, status=400)
        section = active_sections.first()

    enrollment, created = StudentUnitEnrollment.objects.get_or_create(
        student=profile,
        unit=unit,
        defaults={"status": "enrolled", "semester": semester, "section": section},
    )
    if not created and enrollment.status == "enrolled":
        return Response({"detail": "Already enrolled in this unit."}, status=400)

    if enrollment.status != "enrolled" or (section and enrollment.section != section):
        enrollment.status = "enrolled"
        enrollment.semester = semester
        if section:
            enrollment.section = section
        enrollment.save()

    return Response({"detail": "Unit enrolled successfully."})


@api_view(["GET"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def students(request):
    return Response({"students": get_students()})


@csrf_exempt
@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def drop_unit(request):
    profile = _get_current_profile(request)
    if not profile:
        return Response({"detail": "Student profile not found."}, status=404)

    unit_id = request.data.get("unit_id")
    if not unit_id:
        return Response({"detail": "unit_id is required."}, status=400)

    unit_id_clean = str(unit_id).strip()
    enrollment = profile.enrollments.filter(unit__unit_id__iexact=unit_id_clean).first()
    if enrollment:
        enrollment.delete()
        return Response({"detail": f"Unit {unit_id_clean} dropped successfully."})

    return Response({"detail": f"Unit {unit_id_clean} is not currently enrolled."}, status=400)


@csrf_exempt
@api_view(["GET"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def recommendations(request):
    student_id = request.query_params.get("student_id")
    return Response(recommend_for_student(student_id=student_id))


@csrf_exempt
@api_view(["GET"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def assignments_api(request):
    profile = _get_current_profile(request)
    if not profile:
        return Response({"detail": "Student profile not found."}, status=404)
    _seed_sample_courses()
    profile = _ensure_student_success_data(profile)
    qs = profile.assignments.select_related("unit").order_by("due_date")
    return Response({"assignments": AssignmentSerializer(qs, many=True).data})


@csrf_exempt
@api_view(["GET"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def events(request):
    profile = _get_current_profile(request)
    if not profile:
        return Response({"detail": "Student profile not found."}, status=404)

    _seed_sample_courses()
    _seed_support_content()
    profile = _ensure_student_success_data(profile)

    # Get student's enrolled units
    enrolled_unit_ids = profile.enrollments.filter(status="enrolled").values_list("unit_id", flat=True)

    # Student's activities + general school/class events
    student_activities = Activity.objects.filter(
        models.Q(student=profile) | models.Q(student__isnull=True, unit__in=enrolled_unit_ids) | models.Q(student__isnull=True, unit__isnull=True)
    ).order_by("-event_date").distinct()

    # Support items that are events
    support_events_qs = SupportItem.objects.filter(active=True, item_type="event").order_by("title")

    # Serialize
    activity_list = []
    for a in student_activities:
        activity_list.append({
            "id": a.pk,
            "title": a.title,
            "event_date": a.event_date.isoformat(),
            "category": a.category,
            "unit": a.unit.unit_id if a.unit else None,
            "type": "activity",
        })

    support_list = []
    for s in support_events_qs:
        support_list.append({
            "id": s.item_id,
            "title": s.title,
            "description": s.description,
            "tags": list(s.tags or []),
            "type": "support_event",
        })

    return Response({
        "activities": activity_list,
        "events": activity_list,
        "support_events": support_list,
    })


@csrf_exempt
@api_view(["GET", "POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def academic_risk(request):
    records = request.data.get("students") if request.method == "POST" else None
    return Response(predict_academic_risk(records=records))


@csrf_exempt
@api_view(["GET"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def knowledge_search(request):
    query = request.query_params.get("q", "")
    return Response(search_knowledge(query=query))


@csrf_exempt
@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def sentiment(request):
    feedback = request.data.get("feedback")
    if isinstance(feedback, str):
        feedback = [feedback]
    return Response(analyze_sentiment(feedback_items=feedback))


@csrf_exempt
@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def chatbot(request):
    question = request.data.get("question", "")
    profile = _get_current_profile(request)
    student_id = profile.student_id if profile else request.data.get("student_id")
    return Response(chatbot_response(question=question, student_id=student_id))



@login_required(login_url="/login/")
def admin_dashboard(request):
    if request.method == "POST":
        action = request.POST.get("action")
        if action == "grade_student":
            student_id = request.POST.get("student_id")
            profile = StudentProfile.objects.filter(student_id=student_id).first()
            if profile:
                try:
                    profile.gpa = float(request.POST.get("gpa", profile.gpa))
                    profile.attendance = int(request.POST.get("attendance", profile.attendance))
                    profile.lms_activity = int(request.POST.get("lms_activity", profile.lms_activity))
                    profile.recent_grade = int(request.POST.get("recent_grade", profile.recent_grade))
                    profile.wellbeing_score = int(request.POST.get("wellbeing_score", profile.wellbeing_score))
                    profile.save()

                    # Recalculate academic risk score and save InterventionRecommendation
                    student_dict = _student_to_dict(profile)
                    risk_data = predict_academic_risk([student_dict])["predictions"][0]
                    InterventionRecommendation.objects.create(
                        student=profile,
                        risk_score=risk_data["risk_score"],
                        risk_level=risk_data["risk_level"],
                        signals=risk_data["signals"],
                        interventions=risk_data["interventions"],
                    )
                    messages.success(request, f"Updated grade dynamics directly in DB for {profile.name} ({profile.student_id}). Risk recalculated!")
                except Exception as e:
                    messages.error(request, f"Error updating student dynamics: {e}")

        elif action == "add_assignment":
            student_id = request.POST.get("student_id")
            unit_id = request.POST.get("unit_id")
            title = request.POST.get("title", "").strip()
            due_date_str = request.POST.get("due_date")
            assignment_type = request.POST.get("assignment_type", "assignment")
            score = float(request.POST.get("score", 0))
            max_score = float(request.POST.get("max_score", 100))

            profile = StudentProfile.objects.filter(student_id=student_id).first()
            unit = Unit.objects.filter(unit_id=unit_id).first()
            if profile and title and due_date_str:
                try:
                    due_date = datetime.datetime.strptime(due_date_str, "%Y-%m-%d").date()
                    status = "Graded" if score > 0 else "Pending"
                    Assignment.objects.create(
                        student=profile,
                        unit=unit,
                        title=title,
                        due_date=due_date,
                        assignment_type=assignment_type,
                        score=score,
                        max_score=max_score,
                        status=status,
                    )
                    messages.success(request, f"Added {assignment_type.title()} '{title}' directly to DB for {profile.name}!")
                except Exception as e:
                    messages.error(request, f"Error creating assignment: {e}")

        elif action == "add_event":
            student_id = request.POST.get("student_id")
            unit_id = request.POST.get("unit_id")
            title = request.POST.get("title", "").strip()
            event_date_str = request.POST.get("event_date")
            category = request.POST.get("category", "Campus Life")

            profile = StudentProfile.objects.filter(student_id=student_id).first()
            unit = Unit.objects.filter(unit_id=unit_id).first()
            if profile and title and event_date_str:
                try:
                    event_date = datetime.datetime.strptime(event_date_str, "%Y-%m-%d").date()
                    Activity.objects.create(
                        student=profile,
                        unit=unit,
                        title=title,
                        event_date=event_date,
                        category=category,
                    )
                    messages.success(request, f"Added Event '{title}' directly to DB for {profile.name}!")
                except Exception as e:
                    messages.error(request, f"Error creating event: {e}")

    students_qs = StudentProfile.objects.all().order_by("name")
    total_students = students_qs.count()

    avg_gpa = students_qs.aggregate(avg=Avg("gpa"))["avg"] or 0
    avg_attendance = students_qs.aggregate(avg=Avg("attendance"))["avg"] or 0
    avg_wellbeing = students_qs.aggregate(avg=Avg("wellbeing_score"))["avg"] or 0

    latest_risk_ids = (
        InterventionRecommendation.objects.values("student_id")
        .annotate(latest_id=Max("id"))
        .values_list("latest_id", flat=True)
    )
    latest_risks = InterventionRecommendation.objects.filter(
        id__in=latest_risk_ids
    ).select_related("student")

    avg_risk_score = latest_risks.aggregate(avg=Avg("risk_score"))["avg"] or 0
    at_risk_students = latest_risks.filter(risk_level__iexact="high").order_by("-risk_score")

    unit_enrollment = (
        Unit.objects.filter(active=True)
        .annotate(
            enrolled_count=Count(
                "enrollments", filter=Q(enrollments__status="enrolled")
            )
        )
        .order_by("-enrolled_count")[:8]
    )

    recent_feedback = StudentFeedback.objects.select_related("student").order_by("-created_at")[:5]
    pending_assignments = Assignment.objects.filter(status__iexact="Pending").count()
    all_units = Unit.objects.filter(active=True).order_by("unit_id")
    all_assignments = Assignment.objects.select_related("student", "unit").order_by("-due_date")[:15]
    all_activities = Activity.objects.select_related("student", "unit").order_by("-event_date")[:15]

    context = {
        "students": students_qs,
        "total_students": total_students,
        "avg_gpa": round(avg_gpa, 2),
        "avg_attendance": round(avg_attendance, 1),
        "avg_wellbeing": round(avg_wellbeing, 1),
        "avg_risk_score": round(avg_risk_score, 1),
        "at_risk_students": at_risk_students,
        "unit_enrollment": unit_enrollment,
        "recent_feedback": recent_feedback,
        "pending_assignments": pending_assignments,
        "total_units": all_units.count(),
        "total_courses": Course.objects.filter(active=True).count(),
        "all_units": all_units,
        "all_assignments": all_assignments,
        "all_activities": all_activities,
    }
    return render(request, "api/admin_dashboard.html", context)


@csrf_exempt
@api_view(["GET"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def admin_overview_api(request):
    students_qs = StudentProfile.objects.filter(
        user__is_staff=False,
        user__is_superuser=False
    ).exclude(
        user__username__icontains="admin"
    ).exclude(
        name__icontains="admin"
    ).order_by("student_id")
    students_list = []
    for s in students_qs:
        enrollments = StudentUnitEnrollment.objects.filter(student=s).select_related("unit", "section")
        enrolled_units = [
            {
                "unit_id": e.unit.unit_id,
                "title": e.unit.title,
                "section": e.section.section_code if e.section else "A",
                "status": e.status,
            }
            for e in enrollments
        ]
        students_list.append({
            "student_id": s.student_id,
            "name": s.name,
            "program": s.program,
            "year": s.year,
            "gpa": s.gpa,
            "attendance": s.attendance,
            "wellbeing_score": s.wellbeing_score,
            "enrolled_units": enrolled_units,
        })

    units_qs = Unit.objects.all().order_by("unit_id")
    units_list = [
        {
            "unit_id": u.unit_id,
            "title": u.title,
            "level": getattr(u, "category", "General"),
            "course": u.course.course_id if u.course else "",
            "sections": [sec.section_code for sec in u.sections.all()],
        }
        for u in units_qs
    ]

    assignments_qs = Assignment.objects.all().order_by("-due_date")
    assignments_list = [
        {
            "id": a.id,
            "title": a.title,
            "student_id": a.student.student_id if a.student else "",
            "student_name": a.student.name if a.student else "",
            "unit_id": a.unit.unit_id if a.unit else "",
            "assignment_type": a.assignment_type,
            "due_date": a.due_date.strftime("%Y-%m-%d") if a.due_date else "",
            "status": a.status,
            "score": a.score,
            "max_score": a.max_score,
        }
        for a in assignments_qs
    ]

    events_qs = Activity.objects.all().order_by("-event_date")
    events_list = [
        {
            "id": ev.id,
            "title": ev.title,
            "category": ev.category,
            "event_date": ev.event_date.strftime("%Y-%m-%d") if ev.event_date else "",
            "student_id": ev.student.student_id if ev.student else "",
            "student_name": ev.student.name if ev.student else "All Students",
            "unit_id": ev.unit.unit_id if ev.unit else "",
        }
        for ev in events_qs
    ]

    return Response({
        "students": students_list,
        "units": units_list,
        "assignments": assignments_list,
        "events": events_list,
    })


@csrf_exempt
@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def admin_grade_student_api(request):
    student_id = request.data.get("student_id")
    profile = StudentProfile.objects.filter(student_id=student_id).first()
    if not profile:
        return Response({"error": "Student not found"}, status=404)

    if "gpa" in request.data:
        profile.gpa = float(request.data["gpa"])
    if "attendance" in request.data:
        profile.attendance = int(request.data["attendance"])
    if "lms_activity" in request.data:
        profile.lms_activity = int(request.data["lms_activity"])
    if "recent_grade" in request.data:
        profile.recent_grade = int(request.data["recent_grade"])
    if "wellbeing_score" in request.data:
        profile.wellbeing_score = int(request.data["wellbeing_score"])
    profile.save()

    student_dict = _student_to_dict(profile)
    risk_data = predict_academic_risk([student_dict])["predictions"][0]
    InterventionRecommendation.objects.create(
        student=profile,
        risk_score=risk_data["risk_score"],
        risk_level=risk_data["risk_level"],
        signals=risk_data["signals"],
        interventions=risk_data["interventions"],
    )
    return Response({"message": f"Updated dynamics for {profile.name}", "profile": _student_to_dict(profile)})


@csrf_exempt
@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def admin_grade_item_api(request):
    assignment_id = request.data.get("assignment_id")
    score = float(request.data.get("score", 0))
    status = request.data.get("status", "Graded")

    assignment = Assignment.objects.filter(id=assignment_id).first()
    if not assignment:
        return Response({"error": "Assignment not found"}, status=404)

    assignment.score = score
    assignment.status = status
    assignment.save()
    return Response({"message": f"Graded {assignment.title} with {score}/{assignment.max_score}"})


@csrf_exempt
@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def admin_add_assignment_api(request):
    student_id = request.data.get("student_id")
    unit_id = request.data.get("unit_id")
    title = request.data.get("title")
    due_date_str = request.data.get("due_date", datetime.date.today().strftime("%Y-%m-%d"))
    assignment_type = request.data.get("assignment_type", "assignment")
    score = float(request.data.get("score", 0))
    max_score = float(request.data.get("max_score", 100))

    unit = Unit.objects.filter(unit_id=unit_id).first() if unit_id else None
    if not title:
        return Response({"error": "title is required"}, status=400)

    due_date = datetime.datetime.strptime(due_date_str, "%Y-%m-%d").date()
    status = "Graded" if score > 0 else "Pending"

    if not student_id or student_id == "all":
        profiles = StudentProfile.objects.all()
        created_count = 0
        for profile in profiles:
            Assignment.objects.create(
                student=profile,
                unit=unit,
                title=title,
                due_date=due_date,
                assignment_type=assignment_type,
                score=score,
                max_score=max_score,
                status=status,
            )
            created_count += 1
        return Response({"message": f"Created {assignment_type} '{title}' for {created_count} students"})
    else:
        profile = StudentProfile.objects.filter(student_id=student_id).first()
        if not profile:
            return Response({"error": "Student not found"}, status=404)
        assignment = Assignment.objects.create(
            student=profile,
            unit=unit,
            title=title,
            due_date=due_date,
            assignment_type=assignment_type,
            score=score,
            max_score=max_score,
            status=status,
        )
        return Response({"message": f"Created {assignment_type} '{title}' for {profile.name}"})


@csrf_exempt
@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def admin_add_event_api(request):
    student_id = request.data.get("student_id")
    unit_id = request.data.get("unit_id")
    title = request.data.get("title")
    event_date_str = request.data.get("event_date", datetime.date.today().strftime("%Y-%m-%d"))
    category = request.data.get("category", "School Event")

    unit = Unit.objects.filter(unit_id=unit_id).first() if unit_id else None
    if not title:
        return Response({"error": "title is required"}, status=400)

    event_date = datetime.datetime.strptime(event_date_str, "%Y-%m-%d").date()

    if not student_id or student_id == "all":
        profiles = StudentProfile.objects.all()
        for profile in profiles:
            Activity.objects.create(
                student=profile,
                unit=unit,
                title=title,
                event_date=event_date,
                category=category,
            )
        return Response({"message": f"Created event '{title}' for all students"})
    else:
        profile = StudentProfile.objects.filter(student_id=student_id).first()
        activity = Activity.objects.create(
            student=profile,
            unit=unit,
            title=title,
            event_date=event_date,
            category=category,
        )
        return Response({"message": f"Created event '{title}' for {profile.name if profile else 'Class'}"})


@csrf_exempt
@api_view(["POST", "GET"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def api_logout(request):
    logout(request)
    return Response({"logged_out": True, "detail": "Successfully logged out."})


@csrf_exempt
@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def api_login(request):
    try:
        username = str(request.data.get("username", "")).strip()
        password = str(request.data.get("password", ""))

        if not username or not password:
            return Response({"detail": "Username and password are required."}, status=400)

        # Search for user by case-insensitive username or email
        user_obj = (
            User.objects.filter(username__iexact=username).first() or
            User.objects.filter(email__iexact=username).first()
        )
        if not user_obj:
            return Response({"detail": "Account does not exist. Please create an account (Sign Up) first."}, status=400)

        user = authenticate(request, username=user_obj.username, password=password)

        if user:
            login(request, user)
            is_admin = user.is_staff or user.is_superuser or user.username.startswith("admin")
            return Response({"success": True, "username": user.username, "is_admin": is_admin, "detail": "Logged in successfully."})
        return Response({"detail": "Incorrect password. Please check your password and try again."}, status=400)
    except Exception as e:
        return Response({"detail": f"Login failed: {str(e)}"}, status=500)


@csrf_exempt
@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def api_register(request):
    try:
        username = str(request.data.get("username", "")).strip()
        password = str(request.data.get("password", ""))
        name = str(request.data.get("name", "")).strip() or username
        program = str(request.data.get("program", "")).strip() or "Bachelor of Science in Software Engineering"
        try:
            year = int(request.data.get("year", 1))
        except (ValueError, TypeError):
            year = 1

        if not username or not password:
            return Response({"detail": "Username and password are required."}, status=400)

        if User.objects.filter(username__iexact=username).exists():
            return Response({"detail": "Username already exists. Please choose a different username."}, status=400)

        user = User.objects.create_user(username=username, password=password)
        student_id = f"STU{user.id:04d}"
        profile = StudentProfile.objects.create(
            user=user,
            student_id=student_id,
            name=name,
            program=program,
            year=year,
            current_semester="Fall",
            gpa=3.5,
            attendance=85,
            lms_activity=80,
            assignments_submitted=80,
            recent_grade=82,
            wellbeing_score=75,
        )
        login(request, user)
        return Response({"success": True, "username": user.username, "student_id": student_id, "detail": "Account created and logged in."})
    except Exception as e:
        return Response({"detail": f"Registration failed: {str(e)}"}, status=500)



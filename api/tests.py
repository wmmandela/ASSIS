from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import ClassSession, Course, KnowledgeDocument, StudentProfile, SupportItem, Unit, UnitSection, StudentUnitEnrollment
from .seed_data import seed_catalog_and_demo_data


class LandingAndDashboardFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(username="student1", password="secret123")
        self.profile = StudentProfile.objects.create(
            user=self.user,
            student_id="S9001",
            name="Ari Clarke",
            program="Computer Science",
            year=2,
            current_semester="Fall",
        )

    def test_landing_page_is_public_and_mentions_sign_in(self):
        response = self.client.get(reverse("landing"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Sign in")

    def test_authenticated_user_is_sent_to_dashboard_from_landing(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse("landing"))
        self.assertRedirects(response, reverse("dashboard"))

    def test_login_redirects_to_dashboard(self):
        response = self.client.post(
            reverse("login"),
            {"username": "student1", "password": "secret123"},
            follow=False,
        )
        self.assertRedirects(response, reverse("dashboard"))

    def test_dashboard_renders_when_student_has_enrollment_sections(self):
        course = Course.objects.create(course_id="TEST", title="Test Course", department="Test", description="Test")
        unit = Unit.objects.create(
            course=course,
            unit_id="TEST101",
            title="Test Unit",
            description="Test",
            semester="Fall",
            category="Core",
        )
        section = UnitSection.objects.create(unit=unit, section_code="A", lecturer="Dr. Test", semester="Fall", active=True)
        ClassSession.objects.create(
            section=section,
            day_of_week="mon",
            start_time="09:00:00",
            end_time="10:30:00",
            location="Room 101",
        )
        StudentUnitEnrollment.objects.create(student=self.profile, unit=unit, section=section, status="enrolled", semester="Fall")

        self.client.force_login(self.user)
        response = self.client.get(reverse("dashboard"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Test Unit")

    def test_dashboard_creates_progress_metrics_for_authenticated_user_without_profile(self):
        user = get_user_model().objects.create_user(username="progressuser", password="secret123")
        self.client.force_login(user)

        response = self.client.get(reverse("dashboard"))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(hasattr(user, "student_profile"))
        self.assertIsNotNone(user.student_profile)
        self.assertGreater(user.student_profile.attendance, 0)
        self.assertGreater(user.student_profile.lms_activity, 0)
        self.assertGreater(user.student_profile.assignments_submitted, 0)
        self.assertGreater(user.student_profile.recent_grade, 0)
        self.assertGreater(user.student_profile.wellbeing_score, 0)


class SeedDataTests(TestCase):
    def test_catalog_seed_creates_program_units_sections_and_demo_student_activity(self):
        seed_catalog_and_demo_data()

        self.assertTrue(Course.objects.filter(course_id="BSE").exists())
        self.assertTrue(Unit.objects.filter(unit_id="IST1020").exists())
        self.assertTrue(Unit.objects.filter(unit_id="SWE3090").exists())
        self.assertTrue(Unit.objects.filter(unit_id="DSA101").exists())

        bse_sections = UnitSection.objects.filter(unit__course__course_id="BSE")
        self.assertGreater(bse_sections.count(), 0)
        self.assertGreater(ClassSession.objects.count(), 0)

        profile = StudentProfile.objects.filter(student_id="SWE2024").first()
        self.assertIsNotNone(profile)
        self.assertGreater(profile.assignments.count(), 0)
        self.assertGreater(profile.activities.count(), 0)
        self.assertGreater(profile.gpa, 0)
        self.assertGreater(profile.attendance, 0)

    def test_first_year_units_get_multiple_non_conflicting_sections(self):
        seed_catalog_and_demo_data()

        unit = Unit.objects.filter(unit_id="IST1020").first()
        self.assertIsNotNone(unit)
        sections = list(unit.sections.order_by("section_code"))
        self.assertGreaterEqual(len(sections), 3)

        distinct_lecturers = {section.lecturer for section in sections}
        self.assertGreaterEqual(len(distinct_lecturers), 3)

        distinct_sessions = {
            (session.day_of_week, session.start_time.strftime("%H:%M"), session.end_time.strftime("%H:%M"), session.location)
            for section in sections
            for session in section.sessions.all()
        }
        self.assertGreaterEqual(len(distinct_sessions), 3)


class AiApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        StudentProfile.objects.bulk_create(
            [
                StudentProfile(
                    student_id="S1001",
                    name="Maya Chen",
                    program="Computer Science",
                    year=2,
                    interests=["data science", "career planning", "research"],
                    gpa=3.4,
                    attendance=88,
                    lms_activity=79,
                    assignments_submitted=92,
                    recent_grade=84,
                    wellbeing_score=73,
                ),
                StudentProfile(
                    student_id="S1002",
                    name="Jordan Reyes",
                    program="Business Administration",
                    year=1,
                    interests=["finance", "study skills", "student clubs"],
                    gpa=2.1,
                    attendance=61,
                    lms_activity=38,
                    assignments_submitted=58,
                    recent_grade=57,
                    wellbeing_score=49,
                ),
                StudentProfile(
                    student_id="S1003",
                    name="Amina Patel",
                    program="Psychology",
                    year=3,
                    interests=["mental health", "community service", "statistics"],
                    gpa=3.8,
                    attendance=94,
                    lms_activity=87,
                    assignments_submitted=98,
                    recent_grade=91,
                    wellbeing_score=82,
                ),
            ]
        )

        SupportItem.objects.bulk_create(
            [
                SupportItem(
                    item_id="R01",
                    item_type="resource",
                    title="Academic Success Coaching",
                    description="One-on-one coaching for study planning, organization, and recovery plans.",
                    tags=["study skills", "academic support", "time management"],
                    active=True,
                ),
                SupportItem(
                    item_id="R02",
                    item_type="support",
                    title="Counseling and Wellness Center",
                    description="Confidential counseling appointments, wellness workshops, and crisis referrals.",
                    tags=["mental health", "wellbeing", "stress", "support"],
                    active=True,
                ),
            ]
        )

        KnowledgeDocument.objects.bulk_create(
            [
                KnowledgeDocument(
                    document_id="K01",
                    title="Academic Advising Policy",
                    category="Academic Support",
                    content=(
                        "Students should meet with an academic advisor at least once each term before registration. "
                        "Advisors help review degree progress, course sequencing, academic difficulty, and referrals "
                        "to tutoring, coaching, or department offices."
                    ),
                ),
                KnowledgeDocument(
                    document_id="K02",
                    title="Financial Aid Renewal Guide",
                    category="Financial Aid",
                    content=(
                        "Financial aid renewal requires satisfactory academic progress, annual FAFSA completion, "
                        "and prompt submission of requested documents. Students with changed financial circumstances "
                        "may request a professional judgment review."
                    ),
                ),
            ]
        )

    def test_status_lists_ai_modules(self):
        response = self.client.get("/api/status/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("AI Recommendation Engine", response.data["modules"])

    def test_recommendations_return_student_context(self):
        response = self.client.get("/api/recommendations/?student_id=S1002")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["student"]["id"], "S1002")
        self.assertGreater(len(response.data["recommendations"]), 0)

    def test_risk_prediction_identifies_high_risk_student(self):
        response = self.client.get("/api/risk/")
        self.assertEqual(response.status_code, 200)
        top = response.data["predictions"][0]
        self.assertEqual(top["student_id"], "S1002")
        self.assertEqual(top["risk_level"], "high")

    def test_knowledge_search_returns_summary(self):
        response = self.client.get("/api/knowledge-search/?q=Where can I get tutoring?")
        self.assertEqual(response.status_code, 200)
        self.assertIn("answer_summary", response.data)
        self.assertGreater(len(response.data["results"]), 0)

    def test_sentiment_accepts_feedback_payload(self):
        response = self.client.post(
            "/api/sentiment/",
            {"feedback": ["The advisor was helpful", "Registration is stressful"]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["items"]), 2)

    def test_chatbot_returns_sources(self):
        response = self.client.post(
            "/api/chatbot/",
            {"question": "How do I renew financial aid?"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("answer", response.data)
        self.assertGreater(len(response.data["sources"]), 0)

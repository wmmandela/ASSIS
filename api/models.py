from django.conf import settings
from django.db import models


class Course(models.Model):
    course_id = models.CharField(max_length=24, unique=True)
    title = models.CharField(max_length=160)
    department = models.CharField(max_length=120, default="General Studies")
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.course_id} — {self.title}"


class Unit(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="units")
    unit_id = models.CharField(max_length=24, unique=True)
    title = models.CharField(max_length=160)
    description = models.TextField()
    credits = models.PositiveSmallIntegerField(default=3)
    semester = models.CharField(max_length=24, default="Fall")
    category = models.CharField(max_length=80, default="General")
    prerequisites = models.ManyToManyField("self", symmetrical=False, blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.unit_id} — {self.title}"


class UnitSection(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name="sections")
    section_code = models.CharField(max_length=24)
    lecturer = models.CharField(max_length=120)
    semester = models.CharField(max_length=24, default="Fall")
    active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("unit", "section_code")

    def __str__(self):
        return f"{self.unit.unit_id} {self.section_code} — {self.lecturer}"


class StudentProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="student_profile")
    student_id = models.CharField(max_length=24, unique=True)
    name = models.CharField(max_length=120)
    program = models.CharField(max_length=120)
    year = models.PositiveSmallIntegerField(default=1)
    current_semester = models.CharField(max_length=24, default="Fall")
    interests = models.JSONField(default=list, blank=True)
    gpa = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    attendance = models.PositiveSmallIntegerField(default=0)
    lms_activity = models.PositiveSmallIntegerField(default=0)
    assignments_submitted = models.PositiveSmallIntegerField(default=0)
    recent_grade = models.PositiveSmallIntegerField(default=0)
    wellbeing_score = models.PositiveSmallIntegerField(default=0)
    completed_units = models.PositiveSmallIntegerField(default=0)
    enrolled_units = models.ManyToManyField(Unit, through="StudentUnitEnrollment", related_name="students", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.student_id})"


class ClassSession(models.Model):
    DAY_CHOICES = [
        ("mon", "Monday"),
        ("tue", "Tuesday"),
        ("wed", "Wednesday"),
        ("thu", "Thursday"),
        ("fri", "Friday"),
        ("sat", "Saturday"),
    ]

    section = models.ForeignKey(UnitSection, on_delete=models.CASCADE, related_name="sessions")
    day_of_week = models.CharField(max_length=3, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    location = models.CharField(max_length=120, blank=True)

    def __str__(self):
        return f"{self.section.unit.unit_id} {self.section.section_code} {self.get_day_of_week_display()} {self.start_time.strftime('%H:%M')}"


class StudentUnitEnrollment(models.Model):
    STATUS_CHOICES = [
        ("enrolled", "Enrolled"),
        ("completed", "Completed"),
        ("waitlist", "Waitlisted"),
    ]

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="enrollments")
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name="enrollments")
    section = models.ForeignKey(UnitSection, null=True, blank=True, on_delete=models.SET_NULL, related_name="enrollments")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="enrolled")
    semester = models.CharField(max_length=24, default="Fall")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "unit")

    def __str__(self):
        return f"{self.student.student_id} — {self.unit.unit_id} ({self.status})"


class Assignment(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="assignments")
    title = models.CharField(max_length=180)
    due_date = models.DateField()
    status = models.CharField(max_length=24, default="Pending")
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.title} — {self.status}"


class Activity(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="activities")
    title = models.CharField(max_length=180)
    event_date = models.DateField()
    category = models.CharField(max_length=120, default="Campus Life")
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.title} on {self.event_date}"


class SupportItem(models.Model):
    ITEM_TYPES = [
        ("course", "Course"),
        ("resource", "Resource"),
        ("event", "Event"),
        ("support", "Support Service"),
    ]

    item_id = models.CharField(max_length=24, unique=True)
    item_type = models.CharField(max_length=16, choices=ITEM_TYPES)
    title = models.CharField(max_length=160)
    description = models.TextField()
    tags = models.JSONField(default=list, blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class KnowledgeDocument(models.Model):
    document_id = models.CharField(max_length=24, unique=True)
    title = models.CharField(max_length=160)
    category = models.CharField(max_length=80)
    content = models.TextField()
    embedding_reference = models.CharField(max_length=255, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class StudentFeedback(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.SET_NULL, null=True, blank=True)
    text = models.TextField()
    sentiment_label = models.CharField(max_length=24, blank=True)
    sentiment_score = models.FloatField(default=0)
    themes = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text[:80]


class InterventionRecommendation(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    risk_score = models.PositiveSmallIntegerField(default=0)
    risk_level = models.CharField(max_length=24)
    signals = models.JSONField(default=list, blank=True)
    interventions = models.JSONField(default=list, blank=True)
    reviewed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.student_id}: {self.risk_level}"

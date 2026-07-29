from rest_framework import serializers

from .models import (
    Activity,
    Assignment,
    ClassSession,
    Course,
    StudentProfile,
    StudentUnitEnrollment,
    SupportItem,
    Unit,
    UnitSection,
)


class StudentProfileSerializer(serializers.ModelSerializer):
    enrolled_units = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            "student_id",
            "name",
            "program",
            "year",
            "current_semester",
            "interests",
            "gpa",
            "attendance",
            "lms_activity",
            "assignments_submitted",
            "recent_grade",
            "wellbeing_score",
            "completed_units",
            "enrolled_units",
        ]

    def get_enrolled_units(self, obj):
        return list(obj.enrollments.filter(status="enrolled").values_list("unit__unit_id", flat=True))


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["course_id", "title", "department", "description", "active"]


class UnitSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitSection
        fields = ["id", "section_code", "lecturer", "semester", "active"]


class UnitSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    prerequisites = serializers.SlugRelatedField(slug_field="unit_id", many=True, read_only=True)
    sections = UnitSectionSerializer(many=True, read_only=True)

    class Meta:
        model = Unit
        fields = [
            "unit_id",
            "title",
            "description",
            "credits",
            "semester",
            "category",
            "course",
            "prerequisites",
            "sections",
        ]


class ClassSessionSerializer(serializers.ModelSerializer):
    section = UnitSectionSerializer(read_only=True)
    unit = UnitSerializer(source="section.unit", read_only=True)

    class Meta:
        model = ClassSession
        fields = ["section", "unit", "day_of_week", "start_time", "end_time", "location"]



class EnrollmentSerializer(serializers.ModelSerializer):
    unit = UnitSerializer(read_only=True)
    section = UnitSectionSerializer(read_only=True)

    class Meta:
        model = StudentUnitEnrollment
        fields = ["unit", "section", "status", "semester", "created_at"]


class AssignmentSerializer(serializers.ModelSerializer):
    unit = UnitSerializer(read_only=True)

    class Meta:
        model = Assignment
        fields = ["id", "title", "due_date", "status", "unit", "assignment_type", "score", "max_score"]



class ActivitySerializer(serializers.ModelSerializer):
    unit = UnitSerializer(read_only=True)

    class Meta:
        model = Activity
        fields = ["title", "event_date", "category", "unit"]


class SupportItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportItem
        fields = ["item_id", "item_type", "title", "description", "tags", "active"]

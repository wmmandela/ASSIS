from django.contrib import admin

from .models import (
    ClassSession,
    InterventionRecommendation,
    KnowledgeDocument,
    StudentFeedback,
    StudentProfile,
    StudentUnitEnrollment,
    SupportItem,
    Unit,
)


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("student_id", "name", "program", "year", "gpa", "attendance", "lms_activity")
    search_fields = ("student_id", "name", "program")


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("unit_id", "title", "semester", "category", "active")
    list_filter = ("semester", "category", "active")
    search_fields = ("unit_id", "title", "description")


@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    list_display = ("unit_display", "day_of_week", "start_time", "end_time", "location")
    list_filter = ("day_of_week",)
    search_fields = ("section__unit__unit_id", "section__unit__title", "location")

    def unit_display(self, obj):
        return obj.section.unit if obj.section else "-"
    unit_display.short_description = "Unit"


@admin.register(StudentUnitEnrollment)
class StudentUnitEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "unit", "status", "semester", "created_at")
    list_filter = ("status", "semester")
    search_fields = ("student__student_id", "unit__unit_id")


@admin.register(SupportItem)
class SupportItemAdmin(admin.ModelAdmin):
    list_display = ("item_id", "title", "item_type", "active")
    list_filter = ("item_type", "active")
    search_fields = ("title", "description")


@admin.register(KnowledgeDocument)
class KnowledgeDocumentAdmin(admin.ModelAdmin):
    list_display = ("document_id", "title", "category", "updated_at")
    list_filter = ("category",)
    search_fields = ("title", "content")


@admin.register(StudentFeedback)
class StudentFeedbackAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "sentiment_label", "sentiment_score", "created_at")
    list_filter = ("sentiment_label",)
    search_fields = ("text",)


@admin.register(InterventionRecommendation)
class InterventionRecommendationAdmin(admin.ModelAdmin):
    list_display = ("student", "risk_level", "risk_score", "reviewed", "created_at")
    list_filter = ("risk_level", "reviewed")

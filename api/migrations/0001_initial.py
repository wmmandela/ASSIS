# Generated for ASSIS AI student support models.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="KnowledgeDocument",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("document_id", models.CharField(max_length=24, unique=True)),
                ("title", models.CharField(max_length=160)),
                ("category", models.CharField(max_length=80)),
                ("content", models.TextField()),
                ("embedding_reference", models.CharField(blank=True, max_length=255)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="StudentProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("student_id", models.CharField(max_length=24, unique=True)),
                ("name", models.CharField(max_length=120)),
                ("program", models.CharField(max_length=120)),
                ("year", models.PositiveSmallIntegerField(default=1)),
                ("interests", models.JSONField(blank=True, default=list)),
                ("gpa", models.DecimalField(decimal_places=2, default=0, max_digits=3)),
                ("attendance", models.PositiveSmallIntegerField(default=0)),
                ("lms_activity", models.PositiveSmallIntegerField(default=0)),
                ("assignments_submitted", models.PositiveSmallIntegerField(default=0)),
                ("recent_grade", models.PositiveSmallIntegerField(default=0)),
                ("wellbeing_score", models.PositiveSmallIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="SupportItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("item_id", models.CharField(max_length=24, unique=True)),
                ("item_type", models.CharField(choices=[("course", "Course"), ("resource", "Resource"), ("event", "Event"), ("support", "Support Service")], max_length=16)),
                ("title", models.CharField(max_length=160)),
                ("description", models.TextField()),
                ("tags", models.JSONField(blank=True, default=list)),
                ("active", models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name="StudentFeedback",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("text", models.TextField()),
                ("sentiment_label", models.CharField(blank=True, max_length=24)),
                ("sentiment_score", models.FloatField(default=0)),
                ("themes", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("student", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="api.studentprofile")),
            ],
        ),
        migrations.CreateModel(
            name="InterventionRecommendation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("risk_score", models.PositiveSmallIntegerField(default=0)),
                ("risk_level", models.CharField(max_length=24)),
                ("signals", models.JSONField(blank=True, default=list)),
                ("interventions", models.JSONField(blank=True, default=list)),
                ("reviewed", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="api.studentprofile")),
            ],
        ),
    ]

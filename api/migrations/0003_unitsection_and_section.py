# Generated manually to add UnitSection and migrate ClassSession to reference it.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_studentprofile_completed_units_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="UnitSection",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("section_code", models.CharField(max_length=24)),
                ("lecturer", models.CharField(max_length=120)),
                ("semester", models.CharField(default="Fall", max_length=24)),
                ("active", models.BooleanField(default=True)),
                (
                    "unit",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sections",
                        to="api.Unit",
                    ),
                ),
            ],
            options={
                "unique_together": {("unit", "section_code")},
            },
        ),
        migrations.AddField(
            model_name="classsession",
            name="section",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="sessions",
                to="api.UnitSection",
            ),
        ),
        migrations.RemoveField(
            model_name="classsession",
            name="unit",
        ),
    ]

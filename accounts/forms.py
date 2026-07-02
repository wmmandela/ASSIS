from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm


class StudentRegistrationForm(UserCreationForm):
    full_name = forms.CharField(max_length=120, required=True, label="Full name")
    student_id = forms.CharField(max_length=24, required=True, label="Student ID")
    program = forms.CharField(max_length=120, required=True, label="Program")
    year = forms.IntegerField(min_value=1, max_value=8, initial=1, required=True, label="Year")

    class Meta:
        model = get_user_model()
        fields = ["username", "full_name", "student_id", "program", "year", "password1", "password2"]

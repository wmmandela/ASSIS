from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect, render

from .forms import StudentRegistrationForm
from api.models import StudentProfile


def login_view(request: HttpRequest) -> HttpResponse:
    if request.user.is_authenticated:
        if request.user.is_superuser or request.user.is_staff:
            return redirect("admin_dashboard")
        return redirect("dashboard")

    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            if user.is_superuser or user.is_staff:
                return redirect("admin_dashboard")
            return redirect("dashboard")
    else:
        form = AuthenticationForm(request)

    return render(request, "accounts/login.html", {"form": form})



def register_view(request: HttpRequest) -> HttpResponse:
    if request.user.is_authenticated:
        return redirect("dashboard")

    if request.method == "POST":
        form = StudentRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            profile = StudentProfile.objects.create(
                user=user,
                student_id=form.cleaned_data["student_id"],
                name=form.cleaned_data["full_name"],
                program=form.cleaned_data["program"],
                year=form.cleaned_data["year"],
                gpa=0,
                attendance=0,
                lms_activity=0,
                assignments_submitted=0,
                recent_grade=0,
                wellbeing_score=0,
            )
            login(request, user)
            messages.success(request, "Welcome to ASSIS! Your student profile is ready.")
            return redirect("choose_classes")
    else:
        form = StudentRegistrationForm()

    return render(request, "accounts/register.html", {"form": form})


@login_required
def logout_view(request: HttpRequest) -> HttpResponse:
    logout(request)
    messages.info(request, "You have been logged out.")
    return redirect("login")


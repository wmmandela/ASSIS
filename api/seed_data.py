from __future__ import annotations

import datetime

from .models import (
    Activity,
    Assignment,
    ClassSession,
    Course,
    StudentProfile,
    StudentUnitEnrollment,
    Unit,
    UnitSection,
)


COURSES = [
    {
        "course_id": "BSE",
        "title": "Bachelor of Science in Software Engineering",
        "department": "School of Science and Technology",
        "description": "A 150-unit software engineering pathway covering programming, systems, software process, security, testing, project work, internship, and capstone delivery.",
    },
    {
        "course_id": "BDSA",
        "title": "Bachelor of Science in Data Science and Analytics",
        "department": "School of Science and Technology",
        "description": "Builds statistical, analytical, machine learning, data engineering, visualization, and decision-support capability.",
    },
    {
        "course_id": "BAIR",
        "title": "Bachelor of Science in Artificial Intelligence and Robotics",
        "department": "School of Science and Technology",
        "description": "Combines software, AI, embedded systems, robotics, automation, and responsible intelligent systems design.",
    },
    {
        "course_id": "BIST",
        "title": "Bachelor of Science in Information Systems Technology",
        "department": "School of Science and Technology",
        "description": "Prepares students to design, govern, secure, and support organizational information systems.",
    },
    {
        "course_id": "BACT",
        "title": "Bachelor of Science in Applied Computer Technology",
        "department": "School of Science and Technology",
        "description": "A practical computing program focused on web systems, networks, databases, cloud, and enterprise technology.",
    },
    {
        "course_id": "BCYB",
        "title": "Bachelor of Science in Cybersecurity",
        "department": "School of Science and Technology",
        "description": "Develops defensive security, network protection, secure coding, forensics, governance, and cyber operations skills.",
    },
]


SOFTWARE_ENGINEERING_UNITS = [
    ("SUS1010", "Strategies for University Success", "First Year", []),
    ("IST1020", "Introduction to Information Systems", "First Year", []),
    ("ENG1106", "Composition I", "First Year", []),
    ("MTH1109", "College Algebra", "First Year", []),
    ("FIL1010", "Fundamentals of Information Literacy", "First Year", []),
    ("GRM2000", "Introduction to Research Methods", "First Year", ["SUS1010"]),
    ("MTH1110", "Calculus", "First Year", ["MTH1109"]),
    ("APT1040", "Introduction to Web Design and Applications", "First Year", ["IST1020"]),
    ("MTH2010", "Probability and Statistics", "First Year", ["MTH1109"]),
    ("IST1025", "Introduction to Programming", "First Year", ["IST1020"]),
    ("MTH2215", "Discrete Mathematics", "First Year", ["MTH1109"]),
    ("APT1050", "Database Systems", "First Year", ["IST1025"]),
    ("IST2010", "Computer Organization and Assembly Programming", "First Year", ["IST1025"]),
    ("NSC2215", "General Education Elective I", "First Year", []),
    ("SWE1020", "Data Structures and Algorithms Analysis", "First Year", ["IST1025"]),
    ("APT2080", "Introduction to Software Engineering", "Second Year", ["IST1020"]),
    ("ENG2206", "Composition II", "Second Year", ["GRM2000", "ENG1106"]),
    ("FLG1000", "Foreign Language I", "Second Year", []),
    ("APT2050", "Computer Networks and Telecommunications", "Second Year", ["IST2010", "ENG2206"]),
    ("APT2030", "Digital Electronics", "Second Year", ["MTH2215"]),
    ("APT3010", "Introduction to Artificial Intelligence", "Second Year", ["APT2080"]),
    ("FLG1001", "Foreign Language II", "Second Year", ["FLG1000"]),
    ("SWE2020", "Machine Learning and Big Data", "Second Year", ["APT3010"]),
    ("SWE2030", "Software Requirements Engineering", "Second Year", ["APT2080"]),
    ("MTH2030", "Numerical Analysis and its Applications", "Second Year", ["MTH2010"]),
    ("APT2010", "System Analysis and Design", "Second Year", ["SWE2030"]),
    ("CMS3700", "Community Service", "Second Year", []),
    ("IST3020", "Principles of Operating Systems", "Second Year", ["IST2010"]),
    ("GED2000", "General Education Elective II", "Second Year", []),
    ("SWE2040", "Programming with Networks", "Second Year", ["APT3040"]),
    ("APT3040", "Object Oriented Analysis, Design and Programming", "Third Year", ["APT2010"]),
    ("SWE3010", "Security and Business Continuity", "Third Year", ["APT2050"]),
    ("APT3060", "Mobile Programming", "Third Year", ["APT3040"]),
    ("APT3020", "Knowledge-Based Systems", "Third Year", ["APT3010"]),
    ("APT3080", "Management Information Systems", "Third Year", ["APT1050"]),
    ("SWE3090", "Software Engineering Project I", "Third Year", ["CMS3700"]),
    ("APP4080", "Collaborative Software Development", "Third Year", ["APT2080"]),
    ("SWE3020", "Software Quality Assurance and Security", "Third Year", ["SWE3050"]),
    ("SWE3030", "Software Costing and Estimation", "Third Year", ["SWE3050"]),
    ("SWE3040", "Software Engineering Process", "Third Year", ["SWE3050"]),
    ("SWE4010", "Human Computer Interaction", "Third Year", ["APT2080"]),
    ("SWE3050", "Software Verification, Validation and Testing", "Third Year", ["SWE3020"]),
    ("SWE4015", "Software Configuration Management", "Third Year", ["SWE3050"]),
    ("SWE4040", "Software Construction and Development", "Third Year", ["SWE3050"]),
    ("SWE4050", "Software Engineering Elective I", "Third Year", []),
    ("SWE4055", "Software Engineering Elective II", "Fourth Year", []),
    ("SWE4060", "Software Project Planning and Management", "Fourth Year", ["SWE3050"]),
    ("SWE4900", "Software Engineering Capstone Project II", "Fourth Year", ["SWE3090"]),
    ("SWE4910", "Software Engineering Internship", "Fourth Year", []),
    ("SEN4800", "Integrated Seminar", "Fourth Year", ["ENG2206"]),
]


GENERAL_ELECTIVES = [
    ("PHL3310", "Ethics and Value Theory"),
    ("SOC2201", "Introduction to Sociology"),
    ("MGT3010", "Overview of Management Practice"),
    ("MKT3010", "Principles of Marketing"),
    ("JRN3015", "Media Management"),
]


SOFTWARE_ELECTIVES = [
    ("APT3095", "Cloud Computing and Virtualization"),
    ("SWE4070", "Advanced Web-Based Systems Development"),
    ("SWE4080", "Computer and Network Security"),
    ("DST4010", "Distributed Systems"),
    ("SWE4090", "Enterprise Resource Planning Systems"),
]


OTHER_PROGRAM_UNITS = {
    "BDSA": [
        ("DSA101", "Data Science Fundamentals", "Foundations", []),
        ("DSA120", "Python for Analytics", "Programming", []),
        ("DSA210", "Data Wrangling and Warehousing", "Data Engineering", ["DSA120"]),
        ("DSA220", "Statistical Modeling", "Analytics", ["MTH2010"]),
        ("DSA230", "Business Intelligence Dashboards", "Analytics", ["DSA101"]),
        ("DSA310", "Machine Learning Operations", "AI", ["DSA210"]),
        ("DSA320", "Big Data Platforms", "Data Engineering", ["DSA210"]),
        ("DSA330", "Data Visualization Studio", "Analytics", ["DSA230"]),
        ("DSA410", "Applied Predictive Analytics", "AI", ["DSA310"]),
        ("DSA490", "Data Science Capstone", "Capstone", ["DSA410"]),
    ],
    "BAIR": [
        ("AIR101", "AI and Robotics Foundations", "Foundations", []),
        ("AIR120", "Programming Intelligent Agents", "Programming", []),
        ("AIR210", "Sensors and Embedded Systems", "Robotics", ["AIR101"]),
        ("AIR220", "Robot Kinematics", "Robotics", ["MTH1110"]),
        ("AIR230", "Computer Vision", "AI", ["AIR120"]),
        ("AIR310", "Autonomous Systems", "Robotics", ["AIR210"]),
        ("AIR320", "Deep Learning for Robotics", "AI", ["AIR230"]),
        ("AIR330", "Human-Robot Interaction", "Design", ["AIR101"]),
        ("AIR410", "Responsible AI Systems", "Ethics", ["AIR320"]),
        ("AIR490", "AI and Robotics Capstone", "Capstone", ["AIR310"]),
    ],
    "BIST": [
        ("IST101", "Information Systems Foundations", "Foundations", []),
        ("IST120", "Business Process Modeling", "Systems", []),
        ("IST210", "Enterprise Database Applications", "Data", ["IST101"]),
        ("IST220", "Systems Administration", "Infrastructure", ["IST101"]),
        ("IST230", "IT Project Management", "Management", ["IST120"]),
        ("IST310", "Enterprise Systems Integration", "Systems", ["IST210"]),
        ("IST320", "Information Security Governance", "Security", ["IST220"]),
        ("IST330", "Digital Transformation Strategy", "Management", ["IST230"]),
        ("IST410", "Service Management and ITIL", "Management", ["IST330"]),
        ("IST490", "Information Systems Capstone", "Capstone", ["IST310"]),
    ],
    "BACT": [
        ("ACT101", "Applied Computing Fundamentals", "Foundations", []),
        ("ACT120", "Web Application Development", "Programming", []),
        ("ACT210", "Cloud Application Platforms", "Cloud", ["ACT120"]),
        ("ACT220", "Network Administration", "Infrastructure", ["ACT101"]),
        ("ACT230", "Database Application Development", "Data", ["ACT120"]),
        ("ACT310", "DevOps Practices", "Cloud", ["ACT210"]),
        ("ACT320", "Mobile and Responsive Systems", "Programming", ["ACT120"]),
        ("ACT330", "Enterprise Application Support", "Operations", ["ACT230"]),
        ("ACT410", "Technology Innovation Lab", "Innovation", ["ACT310"]),
        ("ACT490", "Applied Computing Capstone", "Capstone", ["ACT410"]),
    ],
    "BCYB": [
        ("CYB101", "Cybersecurity Foundations", "Foundations", []),
        ("CYB120", "Secure Programming", "Programming", []),
        ("CYB210", "Network Defense", "Security", ["CYB101"]),
        ("CYB220", "Linux and Security Operations", "Operations", ["CYB101"]),
        ("CYB230", "Cryptography Fundamentals", "Security", ["MTH2215"]),
        ("CYB310", "Digital Forensics", "Security", ["CYB210"]),
        ("CYB320", "Ethical Hacking", "Security", ["CYB220"]),
        ("CYB330", "Security Governance and Risk", "Governance", ["CYB101"]),
        ("CYB410", "Incident Response Lab", "Operations", ["CYB310"]),
        ("CYB490", "Cybersecurity Capstone", "Capstone", ["CYB410"]),
    ],
}


DEMO_STUDENTS = [
    {
        "student_id": "SWE2024",
        "name": "Amani Mwangi",
        "program": "Bachelor of Science in Software Engineering",
        "year": 2,
        "current_semester": "Fall",
        "interests": ["software engineering", "web systems", "testing"],
        "gpa": 3.42,
        "attendance": 91,
        "lms_activity": 84,
        "assignments_submitted": 88,
        "recent_grade": 82,
        "wellbeing_score": 76,
    },
    {
        "student_id": "DSA2024",
        "name": "Brian Otieno",
        "program": "Bachelor of Science in Data Science and Analytics",
        "year": 3,
        "current_semester": "Fall",
        "interests": ["data science", "machine learning", "visualization"],
        "gpa": 3.68,
        "attendance": 88,
        "lms_activity": 91,
        "assignments_submitted": 93,
        "recent_grade": 89,
        "wellbeing_score": 72,
    },
    {
        "student_id": "AIR2024",
        "name": "Leila Hassan",
        "program": "Bachelor of Science in Artificial Intelligence and Robotics",
        "year": 2,
        "current_semester": "Fall",
        "interests": ["robotics", "computer vision", "responsible ai"],
        "gpa": 2.58,
        "attendance": 73,
        "lms_activity": 62,
        "assignments_submitted": 69,
        "recent_grade": 64,
        "wellbeing_score": 58,
    },
    {
        "student_id": "IST2024",
        "name": "Kevin Njoroge",
        "program": "Bachelor of Science in Information Systems Technology",
        "year": 1,
        "current_semester": "Fall",
        "interests": ["information systems", "project management", "security"],
        "gpa": 2.91,
        "attendance": 81,
        "lms_activity": 71,
        "assignments_submitted": 77,
        "recent_grade": 73,
        "wellbeing_score": 66,
    },
]


PROGRAM_COURSE_MAP = {
    "Bachelor of Science in Software Engineering": "BSE",
    "Bachelor of Science in Data Science and Analytics": "BDSA",
    "Bachelor of Science in Artificial Intelligence and Robotics": "BAIR",
    "Bachelor of Science in Information Systems Technology": "BIST",
    "Bachelor of Science in Applied Computer Technology": "BACT",
    "Bachelor of Science in Cybersecurity": "BCYB",
}


PROGRAM_UNIT_SPECS = {
    "BSE": SOFTWARE_ENGINEERING_UNITS,
    "BDSA": OTHER_PROGRAM_UNITS["BDSA"],
    "BAIR": OTHER_PROGRAM_UNITS["BAIR"],
    "BIST": OTHER_PROGRAM_UNITS["BIST"],
    "BACT": OTHER_PROGRAM_UNITS["BACT"],
    "BCYB": OTHER_PROGRAM_UNITS["BCYB"],
}


def _normalize_schedule(day_set, section_code):
    if day_set == {"mon", "wed"}:
        base_times = {"A": (("09:00", "10:30"), ("09:00", "10:30")), "B": (("11:00", "12:30"), ("11:00", "12:30")), "C": (("13:00", "14:30"), ("13:00", "14:30"))}
        start_end = base_times.get(section_code, (("09:00", "10:30"), ("09:00", "10:30")))
        return [("mon", start_end[0][0], start_end[0][1]), ("wed", start_end[1][0], start_end[1][1])]
    if day_set == {"tue", "thu"}:
        base_times = {"A": (("09:00", "10:30"), ("09:00", "10:30")), "B": (("11:00", "12:30"), ("11:00", "12:30")), "C": (("13:00", "14:30"), ("13:00", "14:30"))}
        start_end = base_times.get(section_code, (("09:00", "10:30"), ("09:00", "10:30")))
        return [("tue", start_end[0][0], start_end[0][1]), ("thu", start_end[1][0], start_end[1][1])]
    if day_set == {"fri"}:
        return [("fri", "09:00", "12:00")]
    if day_set == {"sat"}:
        return [("sat", "09:00", "12:00")]
    return [("mon", "09:00", "10:30")]


def _coerce_time(value):
    if isinstance(value, datetime.time):
        return value
    return datetime.datetime.strptime(value, "%H:%M").time()


def seed_catalog_and_demo_data():
    for course in COURSES:
        course_obj, _ = Course.objects.update_or_create(
            course_id=course["course_id"],
            defaults={
                "title": course["title"],
                "department": course["department"],
                "description": course["description"],
                "active": True,
            },
        )

        unit_specs = PROGRAM_UNIT_SPECS.get(course["course_id"], [])
        for unit_data in unit_specs:
            if isinstance(unit_data, tuple):
                unit_id, title, year_or_group, prereqs = unit_data
                description = (
                    f"{title} is part of the {course['title']} curriculum and supports the student's academic progression."
                )
                category = year_or_group
                semester = "Fall"
            else:
                unit_id = unit_data["unit_id"]
                title = unit_data["title"]
                description = unit_data.get("description", "")
                semester = unit_data.get("semester", "Fall")
                category = unit_data.get("category", "Core")
                prereqs = unit_data.get("prerequisites", [])

            unit_obj, _ = Unit.objects.update_or_create(
                unit_id=unit_id,
                defaults={
                    "course": course_obj,
                    "title": title,
                    "description": description,
                    "credits": 3,
                    "semester": semester,
                    "category": category,
                    "active": True,
                },
            )
            unit_obj.prerequisites.clear()
            for prereq_id in prereqs:
                prereq_obj = Unit.objects.filter(unit_id=prereq_id).first()
                if prereq_obj:
                    unit_obj.prerequisites.add(prereq_obj)

            day_set = {"mon", "wed"} if unit_obj.unit_id.startswith(("SWE", "APT", "IST", "ENG", "MTH", "FIL")) else {"tue", "thu"}
            section_codes = ["A", "B", "C"] if unit_obj.category in {"First Year", "Foundations"} else ["A"]
            for section_code in section_codes:
                lecturer_name = {
                    "A": f"Dr. {course_obj.course_id} Faculty",
                    "B": f"Prof. {course_obj.course_id} Teaching Team",
                    "C": f"Ms. {course_obj.course_id} Learning Lab",
                }.get(section_code, f"Dr. {course_obj.course_id} Faculty")
                section_obj, _ = UnitSection.objects.get_or_create(
                    unit=unit_obj,
                    section_code=section_code,
                    defaults={
                        "lecturer": lecturer_name,
                        "semester": semester,
                        "active": True,
                    },
                )
                for day, start, end in _normalize_schedule(day_set, section_code):
                    room_name = {
                        "A": "Main Campus 101",
                        "B": "Studio 204",
                        "C": "Innovation Lab 305",
                    }.get(section_code, "Main Campus")
                    ClassSession.objects.get_or_create(
                        section=section_obj,
                        day_of_week=day,
                        start_time=_coerce_time(start),
                        end_time=_coerce_time(end),
                        defaults={"location": room_name},
                    )

    for student_data in DEMO_STUDENTS:
        profile, _ = StudentProfile.objects.update_or_create(
            student_id=student_data["student_id"],
            defaults={
                "name": student_data["name"],
                "program": student_data["program"],
                "year": student_data["year"],
                "current_semester": student_data["current_semester"],
                "interests": student_data.get("interests", []),
                "gpa": student_data.get("gpa", 0),
                "attendance": student_data.get("attendance", 0),
                "lms_activity": student_data.get("lms_activity", 0),
                "assignments_submitted": student_data.get("assignments_submitted", 0),
                "recent_grade": student_data.get("recent_grade", 0),
                "wellbeing_score": student_data.get("wellbeing_score", 0),
            },
        )

        course_id = PROGRAM_COURSE_MAP.get(profile.program)
        if course_id:
            course_units = list(Unit.objects.filter(course__course_id=course_id).order_by("unit_id"))
            if course_units:
                completed_units = course_units[:4]
                enrolled_units = course_units[4:6]
                for unit in completed_units:
                    StudentUnitEnrollment.objects.get_or_create(
                        student=profile,
                        unit=unit,
                        defaults={
                            "section": unit.sections.first(),
                            "status": "completed",
                            "semester": profile.current_semester,
                        },
                    )
                for unit in enrolled_units:
                    section = unit.sections.first()
                    StudentUnitEnrollment.objects.get_or_create(
                        student=profile,
                        unit=unit,
                        defaults={
                            "section": section,
                            "status": "enrolled",
                            "semester": profile.current_semester,
                        },
                    )

        for idx, title in enumerate(["Programming lab reflection", "Advising check-in", "Career readiness workshop"]):
            due_date = datetime.date.today() + datetime.timedelta(days=idx * 7 + 2)
            Assignment.objects.get_or_create(
                student=profile,
                title=title,
                defaults={
                    "due_date": due_date,
                    "status": f"Completed ({profile.recent_grade - idx}%)" if profile.recent_grade else "Pending",
                    "unit": Unit.objects.filter(course__course_id=course_id).first() if course_id else None,
                },
            )

        for idx, title in enumerate(["Academic coaching session", "Tutoring workshop", "Wellness check"]):
            Activity.objects.get_or_create(
                student=profile,
                title=title,
                defaults={
                    "event_date": datetime.date.today() - datetime.timedelta(days=idx * 4 + 1),
                    "category": "Support" if idx % 2 else "Academic",
                    "unit": Unit.objects.filter(course__course_id=course_id).first() if course_id else None,
                },
            )

    return True

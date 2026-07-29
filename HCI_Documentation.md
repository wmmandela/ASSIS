# ASSIS Human Computer Interaction and AI System Documentation

AI Powered Student Support Information System Documentation

## 1. System Overview: What ASSIS Does

ASSIS is a web application designed to help university students manage their academic work and assist university staff in monitoring student progress. It combines a Django backend with a React user interface to provide simple navigation, timetable scheduling, degree planning, and academic recommendations.

Main capabilities of ASSIS:
* **Student Dashboard:** Displays student details, enrolled units, overall grade point average, and attendance status.
* **Semester Planner:** Allows students to select core and elective courses based on their degree program.
* **Timetable Engine:** Displays class times and automatically detects time overlaps to prevent schedule conflicts.
* **Knowledge Base Search:** Returns a single direct answer card when students search university policy documents.
* **AI Advising Assistant:** Provides direct answers to student academic questions.
* **Smart Text to Speech Reader:** Provides a Listen Overview button in the navigation header that reads a narrative summary of the active screen aloud.
* **Staff Portal:** Allows staff to grade assignments, post campus events, and review student academic risk.

## 2. Artificial Intelligence Features

ASSIS uses artificial intelligence to personalize student guidance and simplify administrative tasks.

### Student Activity Recommendation Engine
The recommendation engine suggests optional academic activities tailored to student academic year and standing:
* **Year 1 Freshman:** Orientation workshops, mentorship programs, and basic logic labs.
* **Year 2 Sophomore:** Career panels, intermediate skills coaching, and undergraduate research.
* **Year 3 Junior:** Internship preparation clinics and elective specialization advising.
* **Year 4 Senior:** Capstone showcases and graduate school application seminars.
* **High Academic Performance:** Students with high grade point averages receive honors research opportunities.
* **Academic Recovery:** Students needing support receive academic recovery and tutoring clinics.

### Academic Risk Score Model
ASSIS monitors student engagement metrics to identify students who require academic support. The risk score calculation evaluates five factors:
* **1. Attendance Rate:** Attendance percentage weighted at 30 percent.
* **2. Assignment Submissions:** Assignment completion rate weighted at 25 percent.
* **3. Grade Point Average:** Grade point average weighted at 20 percent.
* **4. Learning Platform Activity:** System activity index weighted at 15 percent.
* **5. Student Wellbeing Index:** Student wellness indicator weighted at 10 percent.

### Single Answer Knowledge Search
The knowledge search system processes policy text to return a single focused answer card. This avoids presenting a long list of confusing search results.

### Smart Text to Speech Narrative Reader
ASSIS includes a non automatic speech synthesis reader triggered by a Listen Overview button strategically placed in the top navigation header. Instead of reading raw buttons or table codes, the system generates a natural language narrative summarizing current enrollments, academic standing, timetable schedules, and recommended activities. Users can start or stop speech at any time using the header button.

### AI Assistant and Sentiment Analysis
* **AI Advising Assistant:** Answers student queries about university policies and academic procedures.
* **Sentiment Analysis:** Analyzes student feedback to identify recurring academic concerns for staff review.

## 3. Human Computer Interaction Paradigms Applied

From the fundamental human computer interaction paradigms, ASSIS incorporates the following specific paradigms:

* **1. Direct Manipulation:** Users interact directly with visible objects through actions such as clicking buttons to enroll in sections, dropping units, and selecting degree plans with instant visual feedback.
* **2. Graphical Displays:** Uses visual output such as interactive timetable grids, progress bars, grade breakdown charts, and formatted status cards instead of plain text terminal output.
* **3. The World Wide Web:** Provides universal access to academic information, timetables, and enrollment services through standard web technologies and browser protocols.
* **4. Hypertext:** Supports non linear navigation by allowing students to move seamlessly between linked tabs including dashboard overview, course catalog, timetable, and policy search.
* **5. Agent Based Interfaces:** Uses intelligent background components that calculate academic risk scores, recommend tailored activities, and alert staff to students needing support.
* **6. Networking:** Connects student clients to central university backend servers to share course schedules, grade records, and policy documents.

### Best Paradigm Applied
The best paradigm applied in ASSIS is Direct Manipulation. Direct manipulation gives students immediate visual control over their academic schedule. Students interact directly with visual timetable blocks, course section buttons, and unit cards. Action results are shown instantly with zero command line syntax required, enabling error free unit management and clear schedule planning.

## 4. Human Computer Interaction Design Principles Applied

ASSIS implements Jakob Nielsen ten usability heuristics to ensure ease of use:

| Number | Nielsen Heuristic | Implementation in ASSIS |
| --- | --- | --- |
| 1 | Visibility of System Status | Shows immediate status updates and clear loading indicators for all user actions. |
| 2 | Match Between System and Real World | Uses standard academic terms such as units, credits, grades, and semester timetables. |
| 3 | User Control and Freedom | Provides single click unit removal, easy search reset, and speech stop buttons. |
| 4 | Consistency and Standards | Uses uniform font sizes, standard button shapes, and consistent tab layouts. |
| 5 | Error Prevention | Checks class times before enrollment to prevent schedule overlaps. |
| 6 | Recognition Rather Than Recall | Displays major badges, clear unit chips, and quick search buttons. |
| 7 | Flexibility and Efficiency of Use | Supports physical keyboard shortcuts, mouse clicks, and audio overview reading. |
| 8 | Aesthetic and Minimalist Design | Presents clean text layouts and avoids unnecessary visual clutter. |
| 9 | Help Users Recognize and Recover Errors | Displays clear error messages explaining exact reasons for enrollment failures. |
| 10 | Help and Documentation | Includes an embedded policy search tool, Listen Overview button, and contextual help text. |

## 5. Universal Design Principles and Accessibility

ASSIS implements universal design principles to support all students regardless of ability or hardware:

* **1. Equitable Use:** Includes a skip link allowing keyboard users to jump directly to main page content.
* **2. Flexibility in Use:** Provides high contrast mode, text size adjustment, keyboard navigation, and a Listen Overview speech button.
* **3. Simple and Intuitive Use:** Uses clear form labels and predictable interface responses.
* **4. Perceptible Information:** Uses semantic tags, screen reader live notification regions, and text to speech audio overview reading.
* **5. Tolerance for Error:** Displays clear notices and validates data to prevent accidental errors.
* **6. Low Physical Effort:** Uses large target buttons and simple single click actions.
* **7. Size and Space for Use:** Scales smoothly across mobile phones, tablets, and desktop screens.

### Cross Platform Keyboard Shortcuts
ASSIS uses physical key codes so keyboard shortcuts work identically on macOS and Windows laptops:

| macOS Shortcut | Windows Shortcut | Navigation Target |
| --- | --- | --- |
| Option plus A | Alt plus A | Open AI Assistant Chatbot |
| Option plus S | Alt plus S | Open Timetable Schedule |
| Option plus P | Alt plus P | Open Semester Planner |
| Option plus E | Alt plus E | Open Events and Support |
| Option plus D | Alt plus D | Open Overview Dashboard |

## 6. Human Computer Interaction Evaluation Methods

The application interface was evaluated using four standard usability methods:
* **1. Heuristic Evaluation:** Screen layouts were checked against Nielsen usability principles to remove friction.
* **2. Cognitive Walkthrough:** Common student tasks were tested step by step to ensure clear completion paths.
* **3. Accessibility Audit:** Checked text contrast ratios and screen reader compatibility against web accessibility standards.
* **4. Automated Usability Testing:** Automated JavaScript tests verified shortcut handlers, conflict algorithms, and recommendation rules.

## 7. Exhaustive Automated Test Suite

ASSIS includes an automated test suite executed using the command npm run test. The suite contains 14 tests across four functional areas:
* **1. Keyboard Shortcuts:** Verifies Option plus key and Alt plus key shortcuts across operating systems.
* **2. Activity Recommendations:** Validates student recommendations based on academic year and performance status.
* **3. Timetable Conflict Detection:** Verifies that overlapping class times are correctly detected and non overlapping classes are allowed.
* **4. Knowledge Search:** Confirms that policy queries return a single direct answer card.

## 8. Citations and References

Nielsen, J. 1994. Enhancing the explanatory power of usability heuristics. Proceedings of the SIGCHI Conference on Human Factors in Computing Systems, 152-158.

Norman, D. A. 2013. The Design of Everyday Things. Revised and expanded edition. Basic Books.

Shneiderman, B. 1983. Direct manipulation for comprehensible, language-based, and controllable user interfaces. IEEE Computer, 16(8), 57-69.

Story, M. F. 1998. Maximizing usability through universal design. Assistive Technology, 10(1), 4-12.

W3C. 2018. Web Content Accessibility Guidelines version 2.1. World Wide Web Consortium.

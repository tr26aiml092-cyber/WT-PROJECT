# StudySync — Student Study Planner
> **Tagline:** *Plan smarter. Study better.*  
> **Course:** Web Technology Laboratory Project  

StudySync is an offline-first, client-side web application designed to help college and university students organize courses, track assignment deadlines, manage daily study timetables, prepare for upcoming exams, and maintain deep focus habits.

Built strictly using vanilla **HTML5**, **CSS3**, and **JavaScript**, StudySync runs directly in any modern web browser without dependencies, external servers, package managers, or cloud logins.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technologies Used](#technologies-used)
4. [Folder Structure](#folder-structure)
5. [How to Run](#how-to-run)
6. [GitHub Repository & Deployment](#github-repository--deployment)
7. [Viva Questions & Answers (Web Technology)](#viva-questions--answers)

---

## Project Overview
Modern college students juggle heavy academic workloads spanning diverse subjects, coursework deadlines, lab practicals, midterms, and project submissions. StudySync provides a clean, responsive single-page application built on standard web technologies that offers dynamic progress visualizations, daily study hour tracking against goals, an interactive academic calendar, exam countdown reminders, an auto-logging Pomodoro focus timer, and full offline data portability through JSON backup export and import.

---

## Key Features
* **Dashboard (Main Module):** Welcome header with student name and date, 4 real-time stat cards, daily study goal progress bar, weekly Mon–Sun bar chart drawn with plain divs and CSS heights, 3 preview grids (Today's Sessions, Next 3 Exams, Next 5 Pending Tasks), and course progress bars.
* **Subjects Management:** Full course CRUD with custom color coding, target hours, and cascade deletion.
* **Tasks & Assignments:** Filter by status, priority, subject, category; search and sort by deadline/priority.
* **Daily Timetable:** Daily study schedule with date navigation, planned hours count, and status flags (Completed, Upcoming, Overdue).
* **Academic Calendar:** Monthly grid starting on Monday, leap-year handling, colored event dots, and day inspection panel.
* **Upcoming Exams:** Countdown badges (*"Today"*, *"Tomorrow"*, *"X days left"*, *"Past exam"*).
* **Focus Timer:** Pomodoro interval timer with auto-session logging and anti-throttling timestamp math.
* **Progress Analytics:** Completed vs pending tasks, completion rate (guaranteed 0% when empty, never NaN), total study hours, consecutive study streak, and subject breakdown bars.
* **Settings & Data Portability:** Customize student name, daily goal (0.5–16 hours), light/dark theme switch, JSON export (`Blob`), schema-validated JSON import, and clear data confirmation.

---

## Technologies Used
* **HTML5:** Semantic architecture (`<header>`, `<aside>`, `<nav>`, `<main>`, `<section>`), form controls with native constraints (`min`, `max`, `step`, `required`).
* **CSS3:** Custom properties for light/dark themes, Flexbox & Grid layouts, and responsive breakpoints at `1024px`, `768px`, and `480px`.
* **Vanilla JavaScript:** Clean client-side DOM scripting, timezone-safe date math, Pomodoro timestamp logic, and `localStorage` persistence.

---

## Folder Structure
```
WT-PROJECT /
│
├── index.html          # Main HTML5 semantic shell and single-page container
├── README.md           # Project readme and viva guide
├── .gitignore          # Git ignore rules
├── css/
│   └── style.css       # CSS design system, themes, components, and media queries
└── js/
    └── app.js          # Core JavaScript application logic and storage manager
```

---

## How to Run
1. Locate the file `StudySync/index.html`.
2. Double-click `index.html` to open it in any web browser (Chrome, Edge, Firefox, Safari).
3. Works completely offline via `file://`.

---

## GitHub Repository & Deployment
* **GitHub Repository:** [https://github.com/tr26aiml092-cyber/WT-PROJECT](https://github.com/tr26aiml092-cyber/WT-PROJECT)
* **Live Deployment (GitHub Pages):** [https://tr26aiml092-cyber.github.io/WT-PROJECT/](https://tr26aiml092-cyber.github.io/WT-PROJECT/)

---

## Viva Questions & Answers

### 1. What is the difference between `localStorage` and `sessionStorage` in HTML5?
**Answer:** `localStorage` persists data indefinitely until explicitly cleared by the user or script, surviving browser restarts. `sessionStorage` stores data only for the duration of the current page session (it is cleared immediately when the browser tab or window is closed).

### 2. Why did you use `parseDate()` with string splitting instead of `new Date("YYYY-MM-DD")`?
**Answer:** In JavaScript, passing a date string formatted as `"YYYY-MM-DD"` to `new Date()` is parsed as UTC midnight. In local timezones behind UTC (such as the Americas), this causes the date to display as the previous day. Splitting the string into year, month, and day integers and constructing `new Date(year, month - 1, day)` guarantees correct local calendar dates.

### 3. How does StudySync protect against Cross-Site Scripting (XSS) attacks?
**Answer:** StudySync never injects user-entered text into `innerHTML`. Instead, all dynamic user text is inserted using `element.textContent` or `document.createTextNode()`, which automatically escapes HTML tags and prevents script injection.

### 4. How is the Light / Dark theme toggling implemented without third-party libraries?
**Answer:** Themes are implemented using CSS custom properties (variables) defined on the `:root` pseudo-class and overridden under the `[data-theme="dark"]` attribute selector. When toggled, JavaScript updates `document.documentElement.setAttribute("data-theme", theme)` and persists the user's preference in `localStorage`.

### 5. Why does the Focus Timer calculate remaining time using timestamps rather than simple `setInterval` decrementing?
**Answer:** Modern web browsers throttle `setInterval` and `setTimeout` timers in inactive or background tabs to save battery and CPU cycles, causing simple integer counters to lose significant time. By calculating `remainingSeconds = Math.round((timerEndTime - Date.now()) / 1000)`, the timer stays mathematically accurate regardless of tab switching or throttling.

### 6. How does the Calendar calculate month lengths and leap years in vanilla JavaScript?
**Answer:** In JavaScript, the `Date` constructor accepts a day index of `0` to return the last day of the previous month. Therefore, `new Date(year, month + 1, 0).getDate()` automatically returns the exact total number of days in the specified month (28, 29, 30, or 31), accurately handling leap years without manual arithmetic.

### 7. How is the weekly study bar chart drawn without Canvas or external charting libraries?
**Answer:** The weekly chart is constructed using semantic `<div>` elements inside a CSS Flexbox container with `align-items: flex-end`. The height of each bar fill is set dynamically in JavaScript via inline CSS (`fill.style.height = heightPct + "%"`), calculated proportionally relative to the maximum study hours in the current week.

### 8. How does the study streak algorithm work?
**Answer:** The algorithm collects all unique dates with completed sessions into a set. It checks if a session was completed today or yesterday. If so, it increments a counter and iterates backward day-by-day (`getRelativeDate(-1)`, `getRelativeDate(-2)`, etc.) until an unstudied day is reached, correctly identifying consecutive study streaks.

### 9. How does the JSON import feature prevent corrupted files from breaking the application?
**Answer:** The file is read as text and parsed inside a `try...catch` block. Before overwriting the current state, a validation check verifies that `subjects`, `tasks`, `sessions`, and `exams` are valid arrays and `settings` is an object. If the file is invalid or missing required keys, an error is caught, an alert is displayed, and existing data is kept completely safe.

### 10. What is the difference between semantic HTML and non-semantic HTML, and why does StudySync use semantic tags?
**Answer:** Semantic tags (such as `<header>`, `<nav>`, `<aside>`, `<main>`, `<section>`, and `<article>`) convey the meaning and purpose of their enclosed content to browsers, search engines, and assistive technologies. Non-semantic tags (like `<div>` and `<span>`) provide no structural information. StudySync uses semantic elements to improve accessibility, maintainability, and document hierarchy.

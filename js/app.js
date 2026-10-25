// ==========================================================================
// StudySync - Student Study Planner
// Plain JavaScript without frameworks or complex abstractions
// ==========================================================================

// Global application data
var appData = getDefaultData();
var currentPage = "dashboard";

// Get default empty planner data
function getDefaultData() {
  return {
    settings: { name: "Student", dailyGoal: 2, theme: "light" },
    subjects: [],
    tasks: [],
    sessions: [],
    exams: [],
    welcomeDismissed: false
  };
}

// Splits YYYY-MM-DD to avoid timezone bugs
function parseDate(dateString) {
  if (!dateString) return new Date();
  var parts = dateString.split("-");
  var year = parseInt(parts[0], 10);
  var month = parseInt(parts[1], 10) - 1;
  var day = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

// Get today's local date as YYYY-MM-DD
function getTodayDate() {
  var now = new Date();
  var y = now.getFullYear();
  var m = String(now.getMonth() + 1).padStart(2, "0");
  var d = String(now.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

// Get a date string offset by days from today
function getRelativeDate(daysOffset) {
  var now = new Date();
  var target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysOffset);
  var y = target.getFullYear();
  var m = String(target.getMonth() + 1).padStart(2, "0");
  var d = String(target.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

// Format date for display like "Oct 24, 2026"
function formatDisplayDate(dateString) {
  if (!dateString) return "";
  var d = parseDate(dateString);
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}

// Load data from localStorage
function loadData() {
  try {
    var saved = localStorage.getItem("studysync");
    if (saved) {
      var parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        appData = parsed;
        if (!appData.subjects) appData.subjects = [];
        if (!appData.tasks) appData.tasks = [];
        if (!appData.sessions) appData.sessions = [];
        if (!appData.exams) appData.exams = [];
        if (!appData.settings) appData.settings = { name: "Student", dailyGoal: 2, theme: "light" };
      }
    }
  } catch (err) {
    console.log("Could not load saved data, starting fresh.");
    appData = getDefaultData();
  }
}

// Save data to localStorage
function saveData() {
  try {
    localStorage.setItem("studysync", JSON.stringify(appData));
  } catch (err) {
    showToast("Error saving data to browser storage.");
  }
}

// Show temporary toast message
function showToast(message) {
  var toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(function () {
    toast.style.display = "none";
  }, 2500);
}

// Apply theme to document
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  var themeBtn = document.getElementById("theme-btn");
  if (themeBtn) {
    themeBtn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
  }
}

// Toggle light and dark theme
function toggleTheme() {
  var currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  var newTheme = currentTheme === "dark" ? "light" : "dark";
  appData.settings.theme = newTheme;
  saveData();
  applyTheme(newTheme);
  showToast("Switched to " + newTheme + " mode");
}

// Switch between pages and update sidebar
function showPage(pageName) {
  currentPage = pageName;

  // Hide all sections
  var sections = document.querySelectorAll(".page-section");
  sections.forEach(function (sec) {
    sec.style.display = "none";
  });

  // Show active section
  var targetSection = document.getElementById("page-" + pageName);
  if (targetSection) {
    targetSection.style.display = "block";
  }

  // Update nav links
  var navLinks = document.querySelectorAll(".nav-item");
  navLinks.forEach(function (link) {
    if (link.getAttribute("data-page") === pageName) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Update title
  var titleElement = document.getElementById("page-title");
  var titleMap = {
    dashboard: "Dashboard",
    subjects: "Subjects & Courses",
    tasks: "Tasks & Assignments",
    timetable: "Study Timetable",
    calendar: "Academic Calendar",
    exams: "Upcoming Exams",
    timer: "Focus Timer",
    progress: "Study Progress & Analytics",
    settings: "Settings & Data"
  };
  titleElement.textContent = titleMap[pageName] || "StudySync";

  // Close mobile drawer if open
  closeMobileMenu();

  // Render current view
  if (pageName === "dashboard") {
    renderDashboard();
  } else if (pageName === "subjects") {
    renderSubjects();
  } else if (pageName === "tasks") {
    populateSubjectFilter();
    renderTasks();
  } else if (pageName === "timetable") {
    renderTimetable();
  } else if (pageName === "calendar") {
    renderCalendar();
  } else if (pageName === "exams") {
    renderExams();
  } else if (pageName === "timer") {
    renderTimer();
  } else if (pageName === "progress") {
    renderProgress();
  } else if (pageName === "settings") {
    renderSettings();
  }
}

// Open mobile drawer
function openMobileMenu() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("mobile-overlay").classList.add("active");
}

// Close mobile drawer
function closeMobileMenu() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("mobile-overlay").classList.remove("active");
}

// Open modal dialog
function openModal(title, contentElement) {
  document.getElementById("modal-title").textContent = title;
  var body = document.getElementById("modal-body");
  body.innerHTML = "";
  body.appendChild(contentElement);
  document.getElementById("modal").style.display = "flex";
}

// Close modal dialog
function closeModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("modal-body").innerHTML = "";
}

// Calculate hours studied for a subject
function getSubjectStudiedHours(subjectId) {
  var totalMinutes = 0;
  for (var i = 0; i < appData.sessions.length; i++) {
    var sess = appData.sessions[i];
    if (sess.subjectId === subjectId && sess.done === true) {
      totalMinutes += Number(sess.minutes) || 0;
    }
  }
  return (totalMinutes / 60).toFixed(1);
}

// Check if any sample demo records exist
function hasDemoData() {
  var inSubs = appData.subjects.some(function (s) { return s.isDemo === true; });
  var inTasks = appData.tasks.some(function (t) { return t.isDemo === true; });
  var inSess = appData.sessions.some(function (s) { return s.isDemo === true; });
  var inExams = appData.exams.some(function (e) { return e.isDemo === true; });
  return inSubs || inTasks || inSess || inExams;
}

// Helper to determine session status
function getSessionStatus(session) {
  if (session.done) return "Completed";
  var now = new Date();
  var today = getTodayDate();
  var currentHours = String(now.getHours()).padStart(2, "0");
  var currentMinutes = String(now.getMinutes()).padStart(2, "0");
  var currentTime = currentHours + ":" + currentMinutes;
  if (session.date < today || (session.date === today && session.startTime < currentTime)) {
    return "Overdue";
  }
  return "Upcoming";
}

// Helper to calculate days countdown for exams
function getExamCountdown(examDate) {
  var today = getTodayDate();
  var diffDays = Math.round((parseDate(examDate) - parseDate(today)) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return { text: "Today", isUrgent: true, isPast: false };
  if (diffDays === 1) return { text: "Tomorrow", isUrgent: true, isPast: false };
  if (diffDays > 1 && diffDays <= 7) return { text: diffDays + " days left", isUrgent: true, isPast: false };
  if (diffDays > 7) return { text: diffDays + " days left", isUrgent: false, isPast: false };
  return { text: "Past exam", isUrgent: false, isPast: true };
}

// Render Subject Progress Bars for Dashboard and Progress Page
function renderSubjectProgressBars(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  if (appData.subjects.length === 0) {
    var empty = document.createElement("div");
    empty.className = "preview-empty";
    empty.textContent = "No subjects added yet. Add a subject to track course progress.";
    container.appendChild(empty);
    return;
  }

  for (var i = 0; i < appData.subjects.length; i++) {
    var sub = appData.subjects[i];
    var studied = parseFloat(getSubjectStudiedHours(sub.id));
    if (isNaN(studied)) studied = 0;
    var target = parseFloat(sub.targetHours) || 0;
    var pct = target > 0 ? Math.min(100, Math.round((studied / target) * 100)) : 0;

    var item = document.createElement("div");
    item.className = "subject-progress-item";

    var header = document.createElement("div");
    header.className = "subj-prog-header";

    var title = document.createElement("span");
    title.className = "subj-prog-title";
    var dot = document.createElement("span");
    dot.className = "subject-tag";
    dot.style.backgroundColor = sub.color;
    title.appendChild(dot);
    var nameText = document.createTextNode(sub.name);
    title.appendChild(nameText);

    var hoursInfo = document.createElement("span");
    hoursInfo.className = "subj-prog-hours";
    hoursInfo.textContent = studied.toFixed(1) + " / " + target + " hrs (" + pct + "%)";

    header.appendChild(title);
    header.appendChild(hoursInfo);

    var barBg = document.createElement("div");
    barBg.className = "subj-prog-bar";

    var barFill = document.createElement("div");
    barFill.className = "subj-prog-fill";
    barFill.style.width = pct + "%";
    barFill.style.backgroundColor = sub.color;
    barBg.appendChild(barFill);

    item.appendChild(header);
    item.appendChild(barBg);
    container.appendChild(item);
  }
}

// Render Dashboard statistics, cards, charts, and previews
function renderDashboard() {
  var studentName = (appData.settings && appData.settings.name) ? appData.settings.name : "Student";
  var welcomeText = document.getElementById("dash-welcome-text");
  if (welcomeText) welcomeText.textContent = "Welcome back, " + studentName + "! 👋";

  var dateText = document.getElementById("dash-date-text");
  if (dateText) {
    var now = new Date();
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    dateText.textContent = "Today is " + days[now.getDay()] + ", " + months[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear();
  }

  // Sidebar student name
  var sidebarName = document.getElementById("student-name-display");
  if (sidebarName) sidebarName.textContent = studentName;

  // First-visit welcome card
  var welcomeCard = document.getElementById("welcome-card");
  if (welcomeCard) {
    if (!appData.welcomeDismissed && appData.subjects.length === 0 && appData.tasks.length === 0) {
      welcomeCard.style.display = "block";
    } else {
      welcomeCard.style.display = "none";
    }
  }

  // Sample data notice banner
  var demoNoticeCard = document.getElementById("demo-notice-card");
  if (demoNoticeCard) {
    demoNoticeCard.style.display = hasDemoData() ? "block" : "none";
  }

  var todayDateStr = getTodayDate();

  // 1. Planned study hours today
  var plannedMinutesToday = 0;
  var doneMinutesToday = 0;
  for (var i = 0; i < appData.sessions.length; i++) {
    var sess = appData.sessions[i];
    if (sess.date === todayDateStr) {
      plannedMinutesToday += Number(sess.minutes) || 0;
      if (sess.done === true) {
        doneMinutesToday += Number(sess.minutes) || 0;
      }
    }
  }
  var plannedHrsToday = (plannedMinutesToday / 60).toFixed(1);
  var plannedElem = document.getElementById("dash-planned-hours");
  if (plannedElem) plannedElem.textContent = plannedHrsToday + " hrs";

  // 2. Total tasks, completed tasks, pending tasks
  var totalTasks = appData.tasks.length;
  var completedTasks = 0;
  for (var j = 0; j < appData.tasks.length; j++) {
    if (appData.tasks[j].done === true) completedTasks++;
  }
  var pendingTasks = totalTasks - completedTasks;

  var totalTasksEl = document.getElementById("dash-total-tasks");
  if (totalTasksEl) totalTasksEl.textContent = totalTasks;

  var compTasksEl = document.getElementById("dash-completed-tasks");
  if (compTasksEl) compTasksEl.textContent = completedTasks;

  var pendTasksEl = document.getElementById("dash-pending-tasks");
  if (pendTasksEl) pendTasksEl.textContent = pendingTasks;

  // 3. Daily goal progress bar (done hours today vs goal)
  var doneHoursToday = doneMinutesToday / 60;
  var dailyGoal = (appData.settings && appData.settings.dailyGoal) ? Number(appData.settings.dailyGoal) : 2;
  if (isNaN(dailyGoal) || dailyGoal <= 0) dailyGoal = 2;

  var goalPct = dailyGoal > 0 ? Math.min(100, Math.round((doneHoursToday / dailyGoal) * 100)) : 0;
  var goalTextEl = document.getElementById("dash-goal-text");
  if (goalTextEl) {
    goalTextEl.textContent = doneHoursToday.toFixed(1) + " / " + dailyGoal.toFixed(1) + " hrs (" + goalPct + "%)";
  }
  var goalBarEl = document.getElementById("dash-goal-bar");
  if (goalBarEl) {
    goalBarEl.style.width = goalPct + "%";
  }

  // 4. Weekly bar chart (Mon-Sun, done hours per day)
  var todayObj = new Date();
  var dayOfWeek = todayObj.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
  var diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  var monObj = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate() + diffToMon);

  var dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var weekStats = [];
  var totalWeekMinutes = 0;
  var maxHoursInWeek = 2; // minimum scale of 2 hrs

  for (var w = 0; w < 7; w++) {
    var curD = new Date(monObj.getFullYear(), monObj.getMonth(), monObj.getDate() + w);
    var yStr = curD.getFullYear();
    var mStr = String(curD.getMonth() + 1).padStart(2, "0");
    var dStr = String(curD.getDate()).padStart(2, "0");
    var curDateStr = yStr + "-" + mStr + "-" + dStr;

    var dayMinutes = 0;
    for (var s = 0; s < appData.sessions.length; s++) {
      var itemSess = appData.sessions[s];
      if (itemSess.date === curDateStr && itemSess.done === true) {
        dayMinutes += Number(itemSess.minutes) || 0;
      }
    }
    var dayHrs = dayMinutes / 60;
    totalWeekMinutes += dayMinutes;
    if (dayHrs > maxHoursInWeek) maxHoursInWeek = dayHrs;

    weekStats.push({
      dayLabel: dayNames[w],
      dateStr: curDateStr,
      isToday: curDateStr === todayDateStr,
      hours: dayHrs
    });
  }

  var weeklyTotalBadge = document.getElementById("dash-weekly-total");
  if (weeklyTotalBadge) {
    weeklyTotalBadge.textContent = "Total: " + (totalWeekMinutes / 60).toFixed(1) + " hrs";
  }

  var chartContainer = document.getElementById("weekly-chart");
  if (chartContainer) {
    chartContainer.innerHTML = "";
    for (var c = 0; c < weekStats.length; c++) {
      var stat = weekStats[c];
      var heightPct = maxHoursInWeek > 0 ? Math.round((stat.hours / maxHoursInWeek) * 100) : 0;

      var col = document.createElement("div");
      col.className = "bar-col" + (stat.isToday ? " is-today" : "");

      var val = document.createElement("span");
      val.className = "bar-val";
      val.textContent = stat.hours > 0 ? stat.hours.toFixed(1) + "h" : "0h";

      var track = document.createElement("div");
      track.className = "bar-track";

      var fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.style.height = heightPct + "%";
      track.appendChild(fill);

      var label = document.createElement("span");
      label.className = "bar-label";
      label.textContent = stat.dayLabel;

      col.appendChild(val);
      col.appendChild(track);
      col.appendChild(label);
      chartContainer.appendChild(col);
    }
  }

  // 5. Previews: Today's sessions
  var todaySessionsContainer = document.getElementById("dash-today-sessions");
  if (todaySessionsContainer) {
    todaySessionsContainer.innerHTML = "";
    var todaySessions = appData.sessions.filter(function (s) {
      return s.date === todayDateStr;
    }).sort(function (a, b) {
      return (a.startTime || "").localeCompare(b.startTime || "");
    });

    if (todaySessions.length === 0) {
      var sessEmpty = document.createElement("div");
      sessEmpty.className = "preview-empty";
      sessEmpty.textContent = "No study sessions scheduled for today.";
      todaySessionsContainer.appendChild(sessEmpty);
    } else {
      for (var ts = 0; ts < todaySessions.length; ts++) {
        var sessObj = todaySessions[ts];
        var subObj = appData.subjects.find(function (s) { return s.id === sessObj.subjectId; });

        var sessItem = document.createElement("div");
        sessItem.className = "preview-item";
        if (subObj) sessItem.style.borderLeftColor = subObj.color;

        var sessInfo = document.createElement("div");
        sessInfo.className = "preview-item-info";

        var sessTitle = document.createElement("span");
        sessTitle.className = "preview-item-title";
        sessTitle.textContent = sessObj.topic || (subObj ? subObj.name : "Study Session");

        var sessSub = document.createElement("span");
        sessSub.className = "preview-item-sub";
        sessSub.textContent = (subObj ? subObj.name + " • " : "") + sessObj.startTime + " (" + sessObj.minutes + "m)";

        sessInfo.appendChild(sessTitle);
        sessInfo.appendChild(sessSub);
        sessItem.appendChild(sessInfo);

        var sessStatus = getSessionStatus(sessObj);
        var statusSpan = document.createElement("span");
        statusSpan.className = "badge " + (sessStatus === "Completed" ? "badge-success" : (sessStatus === "Overdue" ? "badge-danger" : "badge-info"));
        statusSpan.textContent = sessStatus;
        sessItem.appendChild(statusSpan);

        todaySessionsContainer.appendChild(sessItem);
      }
    }
  }

  // 6. Previews: Next 3 exams
  var examsContainer = document.getElementById("dash-upcoming-exams");
  if (examsContainer) {
    examsContainer.innerHTML = "";
    var sortedExams = appData.exams.slice().sort(function (a, b) {
      return a.date.localeCompare(b.date);
    });
    var upcomingExams = sortedExams.filter(function (e) {
      return e.date >= todayDateStr;
    });
    if (upcomingExams.length === 0) upcomingExams = sortedExams;
    var nextExams = upcomingExams.slice(0, 3);

    if (nextExams.length === 0) {
      var examsEmpty = document.createElement("div");
      examsEmpty.className = "preview-empty";
      examsEmpty.textContent = "No upcoming exams scheduled.";
      examsContainer.appendChild(examsEmpty);
    } else {
      for (var ex = 0; ex < nextExams.length; ex++) {
        var examObj = nextExams[ex];
        var examSub = appData.subjects.find(function (s) { return s.id === examObj.subjectId; });
        var countdown = getExamCountdown(examObj.date);

        var examItem = document.createElement("div");
        examItem.className = "preview-item";
        if (examSub) examItem.style.borderLeftColor = examSub.color;

        var examInfo = document.createElement("div");
        examInfo.className = "preview-item-info";

        var examTitle = document.createElement("span");
        examTitle.className = "preview-item-title";
        examTitle.textContent = examObj.title;

        var examSubText = document.createElement("span");
        examSubText.className = "preview-item-sub";
        examSubText.textContent = (examSub ? examSub.name + " • " : "") + formatDisplayDate(examObj.date);

        examInfo.appendChild(examTitle);
        examInfo.appendChild(examSubText);
        examItem.appendChild(examInfo);

        var cdBadge = document.createElement("span");
        cdBadge.className = "badge " + (countdown.isUrgent ? "badge-danger" : "badge-primary");
        cdBadge.textContent = countdown.text;
        examItem.appendChild(cdBadge);

        examsContainer.appendChild(examItem);
      }
    }
  }

  // 7. Previews: Next 5 pending tasks
  var tasksContainer = document.getElementById("dash-next-tasks");
  if (tasksContainer) {
    tasksContainer.innerHTML = "";
    var pendingTaskList = appData.tasks.filter(function (t) {
      return !t.done;
    }).sort(function (a, b) {
      return a.dueDate.localeCompare(b.dueDate);
    });
    var nextTasks = pendingTaskList.slice(0, 5);

    if (nextTasks.length === 0) {
      var tasksEmpty = document.createElement("div");
      tasksEmpty.className = "preview-empty";
      tasksEmpty.textContent = "No pending tasks. Great job! 🎉";
      tasksContainer.appendChild(tasksEmpty);
    } else {
      for (var pt = 0; pt < nextTasks.length; pt++) {
        (function (taskObj) {
          var taskSub = appData.subjects.find(function (s) { return s.id === taskObj.subjectId; });

          var taskItem = document.createElement("div");
          taskItem.className = "preview-item";
          if (taskSub) taskItem.style.borderLeftColor = taskSub.color;

          var taskInfo = document.createElement("div");
          taskInfo.className = "preview-item-info";

          var taskTitle = document.createElement("span");
          taskTitle.className = "preview-item-title";
          taskTitle.textContent = taskObj.title;

          var taskSubText = document.createElement("span");
          taskSubText.className = "preview-item-sub";
          taskSubText.textContent = (taskSub ? taskSub.name + " • " : "") + "Due " + formatDisplayDate(taskObj.dueDate);

          taskInfo.appendChild(taskTitle);
          taskInfo.appendChild(taskSubText);
          taskItem.appendChild(taskInfo);

          var doneBtn = document.createElement("button");
          doneBtn.className = "btn btn-secondary btn-sm";
          doneBtn.textContent = "✓ Done";
          doneBtn.title = "Mark task completed";
          doneBtn.onclick = function () {
            toggleTaskDone(taskObj.id);
            renderDashboard();
          };
          taskItem.appendChild(doneBtn);

          tasksContainer.appendChild(taskItem);
        })(nextTasks[pt]);
      }
    }
  }

  // 8. Subject-wise progress bars
  renderSubjectProgressBars("dash-subjects-progress");
}

// Load college sample demo data with isDemo flag
function loadDemoData() {
  var sub1 = "sub_" + Date.now();
  var sub2 = "sub_" + (Date.now() + 1);
  var sub3 = "sub_" + (Date.now() + 2);
  var sub4 = "sub_" + (Date.now() + 3);

  appData.subjects = [
    { id: sub1, name: "Web Technology", color: "#4f46e5", targetHours: 20, isDemo: true },
    { id: sub2, name: "Java Programming", color: "#06b6d4", targetHours: 25, isDemo: true },
    { id: sub3, name: "Mathematics", color: "#10b981", targetHours: 15, isDemo: true },
    { id: sub4, name: "Data Structures", color: "#f59e0b", targetHours: 30, isDemo: true }
  ];

  appData.tasks = [
    { id: "task_1", title: "Design StudySync wireframes", description: "Create responsive layouts for web planner", subjectId: sub1, dueDate: getRelativeDate(1), priority: "High", category: "Assignment", done: true, isDemo: true },
    { id: "task_2", title: "Implement Binary Search Tree", description: "Insert, delete and traversal methods in C++", subjectId: sub4, dueDate: getRelativeDate(2), priority: "High", category: "Homework", done: false, isDemo: true },
    { id: "task_3", title: "Solve Linear Algebra problem set", description: "Eigenvalues and matrix inverses", subjectId: sub3, dueDate: getRelativeDate(4), priority: "Medium", category: "Revision", done: false, isDemo: true },
    { id: "task_4", title: "Write Java multithreading demo", description: "Producer-consumer problem using threads", subjectId: sub2, dueDate: getRelativeDate(-1), priority: "High", category: "Assignment", done: false, isDemo: true }
  ];

  appData.sessions = [
    { id: "sess_1", subjectId: sub1, topic: "CSS Grid & Flexbox", date: getTodayDate(), startTime: "10:00", minutes: 60, done: true, isDemo: true },
    { id: "sess_2", subjectId: sub4, topic: "Binary Search Trees", date: getTodayDate(), startTime: "14:00", minutes: 90, done: true, isDemo: true },
    { id: "sess_3", subjectId: sub3, topic: "Matrix Operations", date: getRelativeDate(1), startTime: "16:00", minutes: 45, done: false, isDemo: true },
    { id: "sess_4", subjectId: sub2, topic: "Java Thread Lifecycle", date: getRelativeDate(-1), startTime: "11:00", minutes: 60, done: true, isDemo: true },
    { id: "sess_5", subjectId: sub1, topic: "DOM Event Listeners", date: getRelativeDate(-2), startTime: "15:00", minutes: 75, done: true, isDemo: true }
  ];

  appData.exams = [
    { id: "exam_1", title: "Data Structures Midterm", subjectId: sub4, date: getRelativeDate(10), isDemo: true },
    { id: "exam_2", title: "Web Tech Practical Viva", subjectId: sub1, date: getRelativeDate(15), isDemo: true }
  ];

  appData.welcomeDismissed = true;
  saveData();
  renderDashboard();
  showToast("Demo college data loaded!");
}

// Remove only sample demo records from saved data
function removeDemoData() {
  appData.subjects = appData.subjects.filter(function (s) { return !s.isDemo; });
  appData.tasks = appData.tasks.filter(function (t) { return !t.isDemo; });
  appData.sessions = appData.sessions.filter(function (s) { return !s.isDemo; });
  appData.exams = appData.exams.filter(function (e) { return !e.isDemo; });
  saveData();
  renderDashboard();
  showToast("Sample demo data removed.");
}

// Start with empty planner
function startEmpty() {
  appData.welcomeDismissed = true;
  saveData();
  renderDashboard();
  showToast("Started fresh! Add your first subject.");
}

// Calculate consecutive study streak ending today or yesterday
function calculateStudyStreak() {
  var doneDates = {};
  for (var i = 0; i < appData.sessions.length; i++) {
    var sess = appData.sessions[i];
    if (sess.done === true && sess.date) {
      doneDates[sess.date] = true;
    }
  }

  var todayStr = getTodayDate();
  var yesterdayStr = getRelativeDate(-1);

  // Check if streak is active (ends today or yesterday)
  var offset = 0;
  if (doneDates[todayStr]) {
    offset = 0;
  } else if (doneDates[yesterdayStr]) {
    offset = -1;
  } else {
    return 0; // Streak broken: neither today nor yesterday had a study session
  }

  var streak = 0;
  while (true) {
    var checkDateStr = getRelativeDate(offset);
    if (doneDates[checkDateStr]) {
      streak++;
      offset--;
    } else {
      break;
    }
  }
  return streak;
}

// Render Progress Page metrics & subject breakdown
function renderProgress() {
  var totalTasks = appData.tasks.length;
  var completedTasks = 0;
  for (var i = 0; i < appData.tasks.length; i++) {
    if (appData.tasks[i].done === true) completedTasks++;
  }
  var pendingTasks = totalTasks - completedTasks;
  // Completion percentage: strictly 0% when no tasks, never NaN
  var completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  var totalDoneMinutes = 0;
  for (var j = 0; j < appData.sessions.length; j++) {
    var s = appData.sessions[j];
    if (s.done === true) {
      totalDoneMinutes += Number(s.minutes) || 0;
    }
  }
  var totalDoneHours = (totalDoneMinutes / 60).toFixed(1);

  var streak = calculateStudyStreak();

  var compEl = document.getElementById("prog-completed-tasks");
  if (compEl) compEl.textContent = completedTasks;

  var pendEl = document.getElementById("prog-pending-tasks");
  if (pendEl) pendEl.textContent = pendingTasks;

  var rateEl = document.getElementById("prog-completion-rate");
  if (rateEl) rateEl.textContent = completionRate + "%";

  var hrsEl = document.getElementById("prog-total-hours");
  if (hrsEl) hrsEl.textContent = totalDoneHours + " hrs";

  var streakEl = document.getElementById("prog-study-streak");
  if (streakEl) streakEl.textContent = streak + (streak === 1 ? " day" : " days");

  renderSubjectProgressBars("prog-subject-bars");
}

// Render Settings form
function renderSettings() {
  var nameInput = document.getElementById("set-name-input");
  var goalInput = document.getElementById("set-goal-input");
  var themeSelect = document.getElementById("set-theme-select");

  if (nameInput) nameInput.value = (appData.settings && appData.settings.name) ? appData.settings.name : "Student";
  if (goalInput) goalInput.value = (appData.settings && appData.settings.dailyGoal) ? appData.settings.dailyGoal : 2;
  if (themeSelect) themeSelect.value = (appData.settings && appData.settings.theme) ? appData.settings.theme : "light";
}

// Save user settings & preferences
function saveSettings() {
  var nameInput = document.getElementById("set-name-input");
  var goalInput = document.getElementById("set-goal-input");
  var themeSelect = document.getElementById("set-theme-select");

  var nameVal = nameInput ? nameInput.value.trim() : "";
  if (!nameVal) {
    showToast("Please enter a student name.");
    return;
  }

  var goalVal = goalInput ? parseFloat(goalInput.value) : 2;
  if (isNaN(goalVal) || goalVal < 0.5 || goalVal > 16) {
    showToast("Daily goal must be between 0.5 and 16 hours.");
    return;
  }

  if (!appData.settings) appData.settings = {};
  appData.settings.name = nameVal;
  appData.settings.dailyGoal = goalVal;
  appData.settings.theme = themeSelect ? themeSelect.value : "light";

  saveData();
  applyTheme(appData.settings.theme);

  var nameDisplay = document.getElementById("student-name-display");
  if (nameDisplay) nameDisplay.textContent = appData.settings.name;

  showToast("Preferences saved successfully!");
}

// Export planner data as a .json file Blob download
function exportData() {
  try {
    var dataStr = JSON.stringify(appData, null, 2);
    var blob = new Blob([dataStr], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "studysync_backup.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Planner data exported as JSON backup.");
  } catch (err) {
    showToast("Error exporting backup file.");
  }
}

// Import a .json file with validation
function importData(file) {
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var parsed = JSON.parse(e.target.result);
      if (!parsed || typeof parsed !== "object") {
        throw new Error("File content is not a valid JSON object.");
      }
      if (!Array.isArray(parsed.subjects) ||
          !Array.isArray(parsed.tasks) ||
          !Array.isArray(parsed.sessions) ||
          !Array.isArray(parsed.exams) ||
          !parsed.settings || typeof parsed.settings !== "object") {
        throw new Error("Missing required data arrays (subjects, tasks, sessions, exams) or settings object.");
      }
      // Valid data: replace state
      appData = parsed;
      saveData();
      applyTheme(appData.settings.theme || "light");
      var nameDisplay = document.getElementById("student-name-display");
      if (nameDisplay) nameDisplay.textContent = appData.settings.name || "Student";
      renderSettings();
      renderDashboard();
      showToast("Data imported successfully!");
    } catch (err) {
      alert("Import Failed: " + err.message + "\n\nYour existing data was kept safe.");
      showToast("Import failed: invalid JSON format. Existing data kept.");
    }
  };
  reader.readAsText(file);
}

// Clear all data with confirmation
function clearAllData() {
  var confirmed = window.confirm("Are you sure you want to permanently clear all planner data? This cannot be undone.");
  if (confirmed) {
    appData = getDefaultData();
    saveData();
    applyTheme("light");
    var nameDisplay = document.getElementById("student-name-display");
    if (nameDisplay) nameDisplay.textContent = "Student";
    renderSettings();
    renderDashboard();
    showToast("All planner data cleared.");
  }
}

// Render subjects list
function renderSubjects() {
  var container = document.getElementById("subjects-list");
  container.innerHTML = "";

  if (appData.subjects.length === 0) {
    var emptyDiv = document.createElement("div");
    emptyDiv.className = "card empty-card";
    emptyDiv.style.gridColumn = "1 / -1";
    emptyDiv.textContent = "No subjects added yet. Click '+ Add Subject' above to begin!";
    container.appendChild(emptyDiv);
    return;
  }

  appData.subjects.forEach(function (subject) {
    var card = document.createElement("div");
    card.className = "subject-card";
    card.style.borderTopColor = subject.color || "#4f46e5";

    // Header with title and buttons
    var header = document.createElement("div");
    header.className = "subject-header";

    var title = document.createElement("h3");
    title.className = "subject-title";
    title.textContent = subject.name;

    var actions = document.createElement("div");
    actions.className = "subject-actions";

    var editBtn = document.createElement("button");
    editBtn.className = "btn btn-secondary btn-sm";
    editBtn.textContent = "Edit";
    editBtn.onclick = function () {
      openSubjectModal(subject);
    };

    var deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger btn-sm";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = function () {
      deleteSubject(subject.id);
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    header.appendChild(title);
    header.appendChild(actions);

    // Progress bar calculations
    var studied = getSubjectStudiedHours(subject.id);
    var target = subject.targetHours || 1;
    var percent = Math.min(100, Math.round((studied / target) * 100));

    var progressBox = document.createElement("div");
    progressBox.className = "progress-container";

    var infoRow = document.createElement("div");
    infoRow.className = "progress-info";
    infoRow.innerHTML = "<span>Studied: " + studied + " / " + target + " hrs</span><span>" + percent + "%</span>";

    var barBg = document.createElement("div");
    barBg.className = "progress-bar-bg";

    var barFill = document.createElement("div");
    barFill.className = "progress-bar-fill";
    barFill.style.width = percent + "%";
    barFill.style.backgroundColor = subject.color || "#4f46e5";

    barBg.appendChild(barFill);
    progressBox.appendChild(infoRow);
    progressBox.appendChild(barBg);

    card.appendChild(header);
    card.appendChild(progressBox);
    container.appendChild(card);
  });
}

// Open modal to add or edit a subject
function openSubjectModal(subjectToEdit) {
  var isEdit = Boolean(subjectToEdit);
  var form = document.createElement("form");

  form.innerHTML = `
    <div class="form-group">
      <label for="sub-name">Subject Name *</label>
      <input type="text" id="sub-name" placeholder="e.g. Data Structures">
      <span id="sub-name-error" class="error-text" style="display:none;"></span>
    </div>
    <div class="form-group">
      <label for="sub-color">Card Color</label>
      <input type="color" id="sub-color" value="#4f46e5" style="height: 40px; padding: 2px;">
    </div>
    <div class="form-group">
      <label for="sub-target">Target Study Hours *</label>
      <input type="number" id="sub-target" min="1" step="0.5" placeholder="e.g. 20">
      <span id="sub-target-error" class="error-text" style="display:none;"></span>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button type="submit" class="btn btn-primary">${isEdit ? "Update Subject" : "Add Subject"}</button>
    </div>
  `;

  // Pre-fill if editing
  if (isEdit) {
    form.querySelector("#sub-name").value = subjectToEdit.name;
    form.querySelector("#sub-color").value = subjectToEdit.color || "#4f46e5";
    form.querySelector("#sub-target").value = subjectToEdit.targetHours || 20;
  }

  // Handle submit with simple validation
  form.onsubmit = function (e) {
    e.preventDefault();
    var nameVal = form.querySelector("#sub-name").value.trim();
    var colorVal = form.querySelector("#sub-color").value;
    var targetVal = parseFloat(form.querySelector("#sub-target").value);

    var hasError = false;

    var nameError = form.querySelector("#sub-name-error");
    if (!nameVal) {
      nameError.textContent = "Subject name is required.";
      nameError.style.display = "block";
      hasError = true;
    } else {
      nameError.style.display = "none";
    }

    var targetError = form.querySelector("#sub-target-error");
    if (isNaN(targetVal) || targetVal <= 0) {
      targetError.textContent = "Target hours must be greater than 0.";
      targetError.style.display = "block";
      hasError = true;
    } else {
      targetError.style.display = "none";
    }

    if (hasError) return;

    if (isEdit) {
      subjectToEdit.name = nameVal;
      subjectToEdit.color = colorVal;
      subjectToEdit.targetHours = targetVal;
      showToast("Subject updated!");
    } else {
      var newSubject = {
        id: "sub_" + Date.now(),
        name: nameVal,
        color: colorVal,
        targetHours: targetVal
      };
      appData.subjects.push(newSubject);
      showToast("Subject added!");
    }

    saveData();
    closeModal();
    renderSubjects();
    renderDashboard();
  };

  openModal(isEdit ? "Edit Subject" : "Add New Subject", form);
}

// Delete subject and cascade delete tasks, sessions, exams
function deleteSubject(subjectId) {
  var subject = null;
  for (var i = 0; i < appData.subjects.length; i++) {
    if (appData.subjects[i].id === subjectId) {
      subject = appData.subjects[i];
      break;
    }
  }
  if (!subject) return;

  var tasksCount = 0;
  for (var t = 0; t < appData.tasks.length; t++) {
    if (appData.tasks[t].subjectId === subjectId) tasksCount++;
  }

  var sessionsCount = 0;
  for (var s = 0; s < appData.sessions.length; s++) {
    if (appData.sessions[s].subjectId === subjectId) sessionsCount++;
  }

  var examsCount = 0;
  for (var e = 0; e < appData.exams.length; e++) {
    if (appData.exams[e].subjectId === subjectId) examsCount++;
  }

  var message = 'Deleting "' + subject.name + '" will also delete ' + tasksCount + " task(s), " + sessionsCount + " session(s), and " + examsCount + " exam(s). Are you sure?";

  if (window.confirm(message)) {
    // Filter out subject and related items
    appData.subjects = appData.subjects.filter(function (sub) {
      return sub.id !== subjectId;
    });
    appData.tasks = appData.tasks.filter(function (task) {
      return task.subjectId !== subjectId;
    });
    appData.sessions = appData.sessions.filter(function (sess) {
      return sess.subjectId !== subjectId;
    });
    appData.exams = appData.exams.filter(function (exam) {
      return exam.subjectId !== subjectId;
    });

    saveData();
    renderSubjects();
    renderDashboard();
    showToast("Subject and related items deleted.");
  }
}

// Populate subject dropdown in task filter
function populateSubjectFilter() {
  var select = document.getElementById("task-filter-subject");
  var previousVal = select.value;
  select.innerHTML = '<option value="all">All Subjects</option>';

  appData.subjects.forEach(function (sub) {
    var opt = document.createElement("option");
    opt.value = sub.id;
    opt.textContent = sub.name;
    select.appendChild(opt);
  });

  if (previousVal) select.value = previousVal;
}

// Render tasks list with search, filters, and sorting
function renderTasks() {
  var container = document.getElementById("tasks-list");
  container.innerHTML = "";

  var searchQuery = (document.getElementById("task-search").value || "").toLowerCase().trim();
  var filterStatus = document.getElementById("task-filter-status").value;
  var filterPriority = document.getElementById("task-filter-priority").value;
  var filterSubject = document.getElementById("task-filter-subject").value;
  var filterCategory = document.getElementById("task-filter-category").value;
  var sortBy = document.getElementById("task-sort").value;

  var filteredTasks = appData.tasks.filter(function (task) {
    // Search match
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery)) {
      return false;
    }
    // Status match
    if (filterStatus === "pending" && task.done) return false;
    if (filterStatus === "done" && !task.done) return false;
    // Priority match
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    // Subject match
    if (filterSubject !== "all" && task.subjectId !== filterSubject) return false;
    // Category match
    if (filterCategory !== "all" && task.category !== filterCategory) return false;

    return true;
  });

  // Sort tasks
  var priorityOrder = { High: 1, Medium: 2, Low: 3 };
  filteredTasks.sort(function (a, b) {
    if (sortBy === "priority") {
      var pA = priorityOrder[a.priority] || 4;
      var pB = priorityOrder[b.priority] || 4;
      if (pA !== pB) return pA - pB;
      return a.dueDate.localeCompare(b.dueDate);
    } else {
      // Default: sort by dueDate
      return a.dueDate.localeCompare(b.dueDate);
    }
  });

  // Empty state
  if (filteredTasks.length === 0) {
    var emptyDiv = document.createElement("div");
    emptyDiv.className = "card empty-card";
    emptyDiv.textContent = appData.tasks.length === 0 
      ? "No tasks created yet. Click '+ Add Task' above to add your first assignment!" 
      : "No tasks match your selected search and filters.";
    container.appendChild(emptyDiv);
    return;
  }

  var today = getTodayDate();

  filteredTasks.forEach(function (task) {
    var card = document.createElement("div");
    card.className = "task-card";

    var isOverdue = !task.done && task.dueDate < today;
    if (isOverdue) {
      card.classList.add("task-overdue");
    }

    // Left section: checkbox + details
    var left = document.createElement("div");
    left.className = "task-left";

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = Boolean(task.done);
    checkbox.onclick = function () {
      toggleTaskDone(task.id);
    };

    var details = document.createElement("div");
    details.className = "task-details";

    var title = document.createElement("h4");
    title.className = "task-title";
    if (task.done) title.classList.add("task-done-title");
    title.textContent = task.title;

    details.appendChild(title);

    if (task.description) {
      var desc = document.createElement("p");
      desc.className = "task-desc";
      desc.textContent = task.description;
      details.appendChild(desc);
    }

    // Meta row (subject badge, priority, category, due date)
    var meta = document.createElement("div");
    meta.className = "task-meta";

    // Find subject
    var subObj = appData.subjects.find(function (s) { return s.id === task.subjectId; });
    var subBadge = document.createElement("span");
    subBadge.className = "task-badge badge-subject";
    subBadge.textContent = subObj ? subObj.name : "General";
    subBadge.style.backgroundColor = subObj ? subObj.color : "#4f46e5";
    meta.appendChild(subBadge);

    var priorityBadge = document.createElement("span");
    priorityBadge.className = "task-badge badge-priority-" + task.priority;
    priorityBadge.textContent = task.priority;
    meta.appendChild(priorityBadge);

    var categoryBadge = document.createElement("span");
    categoryBadge.className = "task-badge badge-category";
    categoryBadge.textContent = task.category || "Task";
    meta.appendChild(categoryBadge);

    var dateSpan = document.createElement("span");
    dateSpan.className = "task-date";
    if (isOverdue) dateSpan.classList.add("date-overdue");
    dateSpan.textContent = (isOverdue ? "Overdue: " : "Due: ") + formatDisplayDate(task.dueDate);
    meta.appendChild(dateSpan);

    details.appendChild(meta);
    left.appendChild(checkbox);
    left.appendChild(details);

    // Right section: Edit and Delete buttons
    var right = document.createElement("div");
    right.className = "task-right";

    var editBtn = document.createElement("button");
    editBtn.className = "btn btn-secondary btn-sm";
    editBtn.textContent = "Edit";
    editBtn.onclick = function () {
      openTaskModal(task);
    };

    var deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger btn-sm";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = function () {
      deleteTask(task.id);
    };

    right.appendChild(editBtn);
    right.appendChild(deleteBtn);

    card.appendChild(left);
    card.appendChild(right);
    container.appendChild(card);
  });
}

// Open modal to add or edit a task
function openTaskModal(taskToEdit) {
  var isEdit = Boolean(taskToEdit);

  if (appData.subjects.length === 0) {
    showToast("Please add at least one subject before creating a task!");
    showPage("subjects");
    openSubjectModal();
    return;
  }

  var form = document.createElement("form");

  var subjectsOptions = appData.subjects.map(function (sub) {
    return '<option value="' + sub.id + '">' + sub.name + '</option>';
  }).join("");

  form.innerHTML = `
    <div class="form-group">
      <label for="task-title-input">Task Title *</label>
      <input type="text" id="task-title-input" placeholder="e.g. Solve Chapter 3 Problems">
      <span id="task-title-error" class="error-text" style="display:none;"></span>
    </div>
    <div class="form-group">
      <label for="task-desc-input">Description (Optional)</label>
      <textarea id="task-desc-input" placeholder="Add extra notes or problem numbers..."></textarea>
    </div>
    <div class="form-group">
      <label for="task-subject-input">Subject *</label>
      <select id="task-subject-input">
        ${subjectsOptions}
      </select>
      <span id="task-subject-error" class="error-text" style="display:none;"></span>
    </div>
    <div class="form-group">
      <label for="task-due-input">Due Date *</label>
      <input type="date" id="task-due-input">
      <span id="task-due-error" class="error-text" style="display:none;"></span>
    </div>
    <div class="form-group">
      <label for="task-priority-input">Priority</label>
      <select id="task-priority-input">
        <option value="High">High</option>
        <option value="Medium" selected>Medium</option>
        <option value="Low">Low</option>
      </select>
    </div>
    <div class="form-group">
      <label for="task-category-input">Category</label>
      <select id="task-category-input">
        <option value="Assignment">Assignment</option>
        <option value="Homework">Homework</option>
        <option value="Revision">Revision</option>
        <option value="Other">Other</option>
      </select>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button type="submit" class="btn btn-primary">${isEdit ? "Update Task" : "Create Task"}</button>
    </div>
  `;

  // Pre-fill fields if editing
  if (isEdit) {
    form.querySelector("#task-title-input").value = taskToEdit.title;
    form.querySelector("#task-desc-input").value = taskToEdit.description || "";
    form.querySelector("#task-subject-input").value = taskToEdit.subjectId;
    form.querySelector("#task-due-input").value = taskToEdit.dueDate;
    form.querySelector("#task-priority-input").value = taskToEdit.priority;
    form.querySelector("#task-category-input").value = taskToEdit.category || "Assignment";
  } else {
    form.querySelector("#task-due-input").value = getRelativeDate(1);
  }

  // Handle form submission with inline validation
  form.onsubmit = function (e) {
    e.preventDefault();
    var titleVal = form.querySelector("#task-title-input").value.trim();
    var descVal = form.querySelector("#task-desc-input").value.trim();
    var subjectVal = form.querySelector("#task-subject-input").value;
    var dueVal = form.querySelector("#task-due-input").value;
    var priorityVal = form.querySelector("#task-priority-input").value;
    var categoryVal = form.querySelector("#task-category-input").value;

    var hasError = false;

    var titleError = form.querySelector("#task-title-error");
    if (!titleVal) {
      titleError.textContent = "Task title is required.";
      titleError.style.display = "block";
      hasError = true;
    } else {
      titleError.style.display = "none";
    }

    var subjectError = form.querySelector("#task-subject-error");
    if (!subjectVal) {
      subjectError.textContent = "Please select a subject.";
      subjectError.style.display = "block";
      hasError = true;
    } else {
      subjectError.style.display = "none";
    }

    var dueError = form.querySelector("#task-due-error");
    if (!dueVal) {
      dueError.textContent = "Due date is required.";
      dueError.style.display = "block";
      hasError = true;
    } else {
      dueError.style.display = "none";
    }

    if (hasError) return;

    if (isEdit) {
      taskToEdit.title = titleVal;
      taskToEdit.description = descVal;
      taskToEdit.subjectId = subjectVal;
      taskToEdit.dueDate = dueVal;
      taskToEdit.priority = priorityVal;
      taskToEdit.category = categoryVal;
      showToast("Task updated!");
    } else {
      var newTask = {
        id: "task_" + Date.now(),
        title: titleVal,
        description: descVal,
        subjectId: subjectVal,
        dueDate: dueVal,
        priority: priorityVal,
        category: categoryVal,
        done: false
      };
      appData.tasks.push(newTask);
      showToast("Task created!");
    }

    saveData();
    closeModal();
    renderTasks();
    renderDashboard();
  };

  openModal(isEdit ? "Edit Task" : "Add New Task", form);
}

// Toggle task completion
function toggleTaskDone(taskId) {
  var task = appData.tasks.find(function (t) { return t.id === taskId; });
  if (task) {
    task.done = !task.done;
    saveData();
    renderTasks();
    renderDashboard();
    showToast(task.done ? "Task marked as completed!" : "Task marked as pending.");
  }
}

// ==========================================================================
// TIMETABLE MODULE
// ==========================================================================

var selectedTimetableDate = getTodayDate();

// Change timetable date by offset days
function changeTimetableDate(daysOffset) {
  var d = parseDate(selectedTimetableDate);
  d.setDate(d.getDate() + daysOffset);
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  selectedTimetableDate = y + "-" + m + "-" + day;
  renderTimetable();
}

// Render timetable sessions for the selected date
function renderTimetable() {
  var dateInput = document.getElementById("timetable-date-input");
  if (dateInput) dateInput.value = selectedTimetableDate;

  var container = document.getElementById("timetable-sessions-list");
  container.innerHTML = "";

  // Filter sessions for selected date
  var daySessions = appData.sessions.filter(function (s) {
    return s.date === selectedTimetableDate;
  });

  // Sort sessions by startTime
  daySessions.sort(function (a, b) {
    return (a.startTime || "").localeCompare(b.startTime || "");
  });

  // Calculate planned hours
  var totalMinutes = 0;
  for (var i = 0; i < daySessions.length; i++) {
    totalMinutes += Number(daySessions[i].minutes) || 0;
  }
  var plannedHours = (totalMinutes / 60).toFixed(1);
  var plannedBadge = document.getElementById("timetable-planned-hours");
  if (plannedBadge) {
    plannedBadge.textContent = "Planned: " + plannedHours + " hrs";
  }

  if (daySessions.length === 0) {
    var emptyDiv = document.createElement("div");
    emptyDiv.className = "card empty-card";
    emptyDiv.textContent = "No study sessions planned for this day. Click '+ Add Session' above to plan one!";
    container.appendChild(emptyDiv);
    return;
  }

  var today = getTodayDate();
  var now = new Date();
  var currentTime = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");

  daySessions.forEach(function (session) {
    var card = document.createElement("div");
    card.className = "session-card";

    var subject = appData.subjects.find(function (s) { return s.id === session.subjectId; });
    card.style.borderLeftColor = subject ? (subject.color || "#4f46e5") : "#4f46e5";

    // Left side: time box + topic
    var left = document.createElement("div");
    left.className = "session-left";

    var timeBox = document.createElement("div");
    timeBox.className = "session-time-box";
    timeBox.innerHTML = "<span>" + (session.startTime || "--:--") + "</span><span class=\"session-duration\">" + session.minutes + "m</span>";

    var details = document.createElement("div");
    details.className = "session-details";

    var topic = document.createElement("h4");
    topic.className = "session-topic";
    topic.textContent = session.topic;

    var subName = document.createElement("span");
    subName.className = "session-sub-name";
    subName.textContent = subject ? subject.name : "General Study";

    // Status text
    var statusBadge = document.createElement("span");
    statusBadge.className = "status-badge";
    if (session.done) {
      statusBadge.classList.add("status-completed");
      statusBadge.textContent = "Completed";
    } else if (session.date < today || (session.date === today && session.startTime < currentTime)) {
      statusBadge.classList.add("status-overdue");
      statusBadge.textContent = "Overdue";
    } else {
      statusBadge.classList.add("status-upcoming");
      statusBadge.textContent = "Upcoming";
    }

    details.appendChild(topic);
    details.appendChild(subName);
    details.appendChild(statusBadge);

    left.appendChild(timeBox);
    left.appendChild(details);

    // Right side: toggle done, edit, delete buttons
    var right = document.createElement("div");
    right.className = "button-row";

    var doneBtn = document.createElement("button");
    doneBtn.className = "btn btn-sm " + (session.done ? "btn-secondary" : "btn-primary");
    doneBtn.textContent = session.done ? "Undo" : "Mark Done";
    doneBtn.onclick = function () {
      toggleSessionDone(session.id);
    };

    var editBtn = document.createElement("button");
    editBtn.className = "btn btn-secondary btn-sm";
    editBtn.textContent = "Edit";
    editBtn.onclick = function () {
      openSessionModal(session);
    };

    var deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger btn-sm";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = function () {
      deleteSession(session.id);
    };

    right.appendChild(doneBtn);
    right.appendChild(editBtn);
    right.appendChild(deleteBtn);

    card.appendChild(left);
    card.appendChild(right);
    container.appendChild(card);
  });
}

// Open modal to add or edit study session
function openSessionModal(sessionToEdit, prefilledDate) {
  var isEdit = Boolean(sessionToEdit);

  if (appData.subjects.length === 0) {
    showToast("Please add a subject first!");
    showPage("subjects");
    openSubjectModal();
    return;
  }

  var form = document.createElement("form");
  var subjectsOptions = appData.subjects.map(function (sub) {
    return '<option value="' + sub.id + '">' + sub.name + '</option>';
  }).join("");

  form.innerHTML = `
    <div class="form-group">
      <label for="sess-subject">Subject *</label>
      <select id="sess-subject">${subjectsOptions}</select>
    </div>
    <div class="form-group">
      <label for="sess-topic">Study Topic *</label>
      <input type="text" id="sess-topic" placeholder="e.g. Graph Algorithms">
      <span id="sess-topic-error" class="error-text" style="display:none;"></span>
    </div>
    <div class="form-group">
      <label for="sess-date">Session Date *</label>
      <input type="date" id="sess-date">
      <span id="sess-date-error" class="error-text" style="display:none;"></span>
    </div>
    <div class="form-group">
      <label for="sess-time">Start Time *</label>
      <input type="time" id="sess-time">
      <span id="sess-time-error" class="error-text" style="display:none;"></span>
    </div>
    <div class="form-group">
      <label for="sess-duration">Duration in Minutes (5 - 480) *</label>
      <input type="number" id="sess-duration" min="5" max="480" step="5" value="60">
      <span id="sess-duration-error" class="error-text" style="display:none;"></span>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button type="submit" class="btn btn-primary">${isEdit ? "Update Session" : "Schedule Session"}</button>
    </div>
  `;

  // Pre-fill fields
  if (isEdit) {
    form.querySelector("#sess-subject").value = sessionToEdit.subjectId;
    form.querySelector("#sess-topic").value = sessionToEdit.topic;
    form.querySelector("#sess-date").value = sessionToEdit.date;
    form.querySelector("#sess-time").value = sessionToEdit.startTime || "10:00";
    form.querySelector("#sess-duration").value = sessionToEdit.minutes;
  } else {
    form.querySelector("#sess-date").value = prefilledDate || selectedTimetableDate || getTodayDate();
    form.querySelector("#sess-time").value = "10:00";
  }

  form.onsubmit = function (e) {
    e.preventDefault();
    var subVal = form.querySelector("#sess-subject").value;
    var topicVal = form.querySelector("#sess-topic").value.trim();
    var dateVal = form.querySelector("#sess-date").value;
    var timeVal = form.querySelector("#sess-time").value;
    var durVal = parseInt(form.querySelector("#sess-duration").value, 10);

    var hasError = false;
    var topicErr = form.querySelector("#sess-topic-error");
    if (!topicVal) {
      topicErr.textContent = "Study topic is required.";
      topicErr.style.display = "block";
      hasError = true;
    } else {
      topicErr.style.display = "none";
    }

    var dateErr = form.querySelector("#sess-date-error");
    if (!dateVal) {
      dateErr.textContent = "Date is required.";
      dateErr.style.display = "block";
      hasError = true;
    } else {
      dateErr.style.display = "none";
    }

    var timeErr = form.querySelector("#sess-time-error");
    if (!timeVal) {
      timeErr.textContent = "Start time is required.";
      timeErr.style.display = "block";
      hasError = true;
    } else {
      timeErr.style.display = "none";
    }

    var durErr = form.querySelector("#sess-duration-error");
    if (isNaN(durVal) || durVal < 5 || durVal > 480) {
      durErr.textContent = "Duration must be between 5 and 480 minutes.";
      durErr.style.display = "block";
      hasError = true;
    } else {
      durErr.style.display = "none";
    }

    if (hasError) return;

    if (isEdit) {
      sessionToEdit.subjectId = subVal;
      sessionToEdit.topic = topicVal;
      sessionToEdit.date = dateVal;
      sessionToEdit.startTime = timeVal;
      sessionToEdit.minutes = durVal;
      showToast("Session updated!");
    } else {
      var newSession = {
        id: "sess_" + Date.now(),
        subjectId: subVal,
        topic: topicVal,
        date: dateVal,
        startTime: timeVal,
        minutes: durVal,
        done: false
      };
      appData.sessions.push(newSession);
      showToast("Session scheduled!");
    }

    selectedTimetableDate = dateVal;
    saveData();
    closeModal();
    renderTimetable();
    renderCalendar();
    renderDashboard();
    renderSubjects();
  };

  openModal(isEdit ? "Edit Study Session" : "Schedule Study Session", form);
}

// Toggle session completion
function toggleSessionDone(sessionId) {
  var session = appData.sessions.find(function (s) { return s.id === sessionId; });
  if (session) {
    session.done = !session.done;
    saveData();
    renderTimetable();
    renderDashboard();
    renderSubjects();
    showToast(session.done ? "Session marked completed!" : "Session marked upcoming.");
  }
}

// Delete study session
function deleteSession(sessionId) {
  var session = appData.sessions.find(function (s) { return s.id === sessionId; });
  if (!session) return;

  if (window.confirm('Delete study session "' + session.topic + '"?')) {
    appData.sessions = appData.sessions.filter(function (s) { return s.id !== sessionId; });
    saveData();
    renderTimetable();
    renderCalendar();
    renderDashboard();
    renderSubjects();
    showToast("Session deleted.");
  }
}


// ==========================================================================
// CALENDAR MODULE
// ==========================================================================

var calendarYear = new Date().getFullYear();
var calendarMonth = new Date().getMonth();
var calendarSelectedDate = getTodayDate();

// Change calendar month with December-January rollover
function changeCalendarMonth(offset) {
  calendarMonth += offset;
  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear--;
  } else if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear++;
  }
  renderCalendar();
}

// Render monthly academic calendar grid
function renderCalendar() {
  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var titleEl = document.getElementById("cal-month-title");
  if (titleEl) {
    titleEl.textContent = monthNames[calendarMonth] + " " + calendarYear;
  }

  var grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  // Week starts Monday: (getDay() + 6) % 7
  var firstDayIndex = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
  var totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  var prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();

  var today = getTodayDate();

  // 1. Previous month padding cells
  for (var p = firstDayIndex - 1; p >= 0; p--) {
    var prevDayNum = prevMonthDays - p;
    var prevCell = document.createElement("div");
    prevCell.className = "cal-cell cal-cell-other-month";
    prevCell.innerHTML = "<span class=\"cal-cell-num\">" + prevDayNum + "</span>";
    grid.appendChild(prevCell);
  }

  // 2. Current month cells
  for (var day = 1; day <= totalDays; day++) {
    var dateString = calendarYear + "-" + String(calendarMonth + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");

    var cell = document.createElement("div");
    cell.className = "cal-cell";
    if (dateString === today) cell.classList.add("cal-cell-today");
    if (dateString === calendarSelectedDate) cell.classList.add("cal-cell-selected");

    var dayNum = document.createElement("span");
    dayNum.className = "cal-cell-num";
    dayNum.textContent = day;
    cell.appendChild(dayNum);

    // Add colored dots
    var dotsContainer = document.createElement("div");
    dotsContainer.className = "cal-cell-dots";

    // Exam dot (red)
    var hasExam = appData.exams.some(function (e) { return e.date === dateString; });
    if (hasExam) {
      var dExam = document.createElement("span");
      dExam.className = "legend-dot dot-exam";
      dExam.title = "Exam on this date";
      dotsContainer.appendChild(dExam);
    }

    // Task due dot (orange)
    var hasTask = appData.tasks.some(function (t) { return t.dueDate === dateString; });
    if (hasTask) {
      var dTask = document.createElement("span");
      dTask.className = "legend-dot dot-task";
      dTask.title = "Task due date";
      dotsContainer.appendChild(dTask);
    }

    // Session dot (blue)
    var hasSession = appData.sessions.some(function (s) { return s.date === dateString; });
    if (hasSession) {
      var dSess = document.createElement("span");
      dSess.className = "legend-dot dot-session";
      dSess.title = "Study session";
      dotsContainer.appendChild(dSess);
    }

    cell.appendChild(dotsContainer);

    // Click date to select and show items panel
    (function (dateStr) {
      cell.onclick = function () {
        calendarSelectedDate = dateStr;
        renderCalendar();
      };
    })(dateString);

    grid.appendChild(cell);
  }

  // 3. Next month trailing padding cells to complete rows
  var totalRendered = firstDayIndex + totalDays;
  var trailingCells = (7 - (totalRendered % 7)) % 7;
  for (var n = 1; n <= trailingCells; n++) {
    var nextCell = document.createElement("div");
    nextCell.className = "cal-cell cal-cell-other-month";
    nextCell.innerHTML = "<span class=\"cal-cell-num\">" + n + "</span>";
    grid.appendChild(nextCell);
  }

  // Render details for currently selected date
  renderCalendarDayItems();
}

// Render items for selected calendar date
function renderCalendarDayItems() {
  var titleEl = document.getElementById("cal-selected-date-title");
  if (titleEl) {
    titleEl.textContent = "Items for " + formatDisplayDate(calendarSelectedDate);
  }

  var listContainer = document.getElementById("cal-day-items-list");
  listContainer.innerHTML = "";

  var examsToday = appData.exams.filter(function (e) { return e.date === calendarSelectedDate; });
  var tasksToday = appData.tasks.filter(function (t) { return t.dueDate === calendarSelectedDate; });
  var sessionsToday = appData.sessions.filter(function (s) { return s.date === calendarSelectedDate; });

  if (examsToday.length === 0 && tasksToday.length === 0 && sessionsToday.length === 0) {
    var empty = document.createElement("p");
    empty.className = "text-muted";
    empty.style.fontSize = "0.85rem";
    empty.textContent = "No exams, tasks, or sessions scheduled on this date.";
    listContainer.appendChild(empty);
    return;
  }

  // Render exams
  examsToday.forEach(function (e) {
    var item = document.createElement("div");
    item.className = "cal-day-item";
    var sub = appData.subjects.find(function (s) { return s.id === e.subjectId; });
    item.innerHTML = '<span><span class="legend-dot dot-exam"></span> <strong>Exam:</strong> ' + e.title + ' (' + (sub ? sub.name : 'General') + ')</span>';
    listContainer.appendChild(item);
  });

  // Render tasks
  tasksToday.forEach(function (t) {
    var item = document.createElement("div");
    item.className = "cal-day-item";
    var sub = appData.subjects.find(function (s) { return s.id === t.subjectId; });
    item.innerHTML = '<span><span class="legend-dot dot-task"></span> <strong>Task:</strong> ' + t.title + ' [' + t.priority + '] (' + (sub ? sub.name : 'General') + ')</span>';
    listContainer.appendChild(item);
  });

  // Render sessions
  sessionsToday.forEach(function (s) {
    var item = document.createElement("div");
    item.className = "cal-day-item";
    var sub = appData.subjects.find(function (sub) { return sub.id === s.subjectId; });
    item.innerHTML = '<span><span class="legend-dot dot-session"></span> <strong>Session:</strong> ' + s.topic + ' at ' + s.startTime + ' (' + s.minutes + 'm) ' + (s.done ? '✓ Completed' : 'Pending') + '</span>';
    listContainer.appendChild(item);
  });
}


// ==========================================================================
// EXAMS MODULE
// ==========================================================================

// Render exams page
function renderExams() {
  var container = document.getElementById("exams-list");
  container.innerHTML = "";

  if (appData.exams.length === 0) {
    var emptyDiv = document.createElement("div");
    emptyDiv.className = "card empty-card";
    emptyDiv.style.gridColumn = "1 / -1";
    emptyDiv.textContent = "No exams added yet. Click '+ Add Exam' above to track midterms and finals!";
    container.appendChild(emptyDiv);
    return;
  }

  var today = getTodayDate();

  // Sort exams by date
  var sortedExams = appData.exams.slice();
  sortedExams.sort(function (a, b) {
    return a.date.localeCompare(b.date);
  });

  sortedExams.forEach(function (exam) {
    var card = document.createElement("div");
    card.className = "exam-card";

    var subject = appData.subjects.find(function (s) { return s.id === exam.subjectId; });
    if (subject && subject.color) {
      card.style.borderTopColor = subject.color;
    }

    var diffDays = Math.round((parseDate(exam.date) - parseDate(today)) / (1000 * 60 * 60 * 24));
    var isPast = diffDays < 0;
    if (isPast) card.classList.add("exam-past");

    // Header
    var header = document.createElement("div");
    header.className = "exam-header";

    var title = document.createElement("h3");
    title.className = "exam-title";
    title.textContent = exam.title;

    var countdownBadge = document.createElement("span");
    countdownBadge.className = "exam-countdown";

    if (diffDays === 0) {
      countdownBadge.className += " countdown-urgent";
      countdownBadge.textContent = "Today";
    } else if (diffDays === 1) {
      countdownBadge.className += " countdown-urgent";
      countdownBadge.textContent = "Tomorrow";
    } else if (diffDays > 1 && diffDays <= 7) {
      countdownBadge.className += " countdown-urgent";
      countdownBadge.textContent = diffDays + " days left";
    } else if (diffDays > 7) {
      countdownBadge.className += " countdown-normal";
      countdownBadge.textContent = diffDays + " days left";
    } else {
      countdownBadge.className += " countdown-past";
      countdownBadge.textContent = "Past exam (" + Math.abs(diffDays) + "d ago)";
    }

    header.appendChild(title);
    header.appendChild(countdownBadge);
    card.appendChild(header);

    // Subject name & date
    var subEl = document.createElement("p");
    subEl.className = "exam-subject";
    subEl.textContent = (subject ? subject.name : "General") + " • " + formatDisplayDate(exam.date);
    card.appendChild(subEl);

    // Notes if present
    if (exam.notes) {
      var notesEl = document.createElement("p");
      notesEl.className = "exam-notes";
      notesEl.textContent = exam.notes;
      card.appendChild(notesEl);
    }

    // Actions
    var actions = document.createElement("div");
    actions.className = "exam-actions";

    var editBtn = document.createElement("button");
    editBtn.className = "btn btn-secondary btn-sm";
    editBtn.textContent = "Edit";
    editBtn.onclick = function () {
      openExamModal(exam);
    };

    var deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger btn-sm";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = function () {
      deleteExam(exam.id);
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    container.appendChild(card);
  });
}

// Open modal to add or edit an exam
function openExamModal(examToEdit, prefilledDate) {
  var isEdit = Boolean(examToEdit);

  if (appData.subjects.length === 0) {
    showToast("Please add a subject first!");
    showPage("subjects");
    openSubjectModal();
    return;
  }

  var form = document.createElement("form");
  var subjectsOptions = appData.subjects.map(function (sub) {
    return '<option value="' + sub.id + '">' + sub.name + '</option>';
  }).join("");

  form.innerHTML = `
    <div class="form-group">
      <label for="exam-title-input">Exam / Test Title *</label>
      <input type="text" id="exam-title-input" placeholder="e.g. Midterm Theory Exam">
      <span id="exam-title-error" class="error-text" style="display:none;"></span>
    </div>
    <div class="form-group">
      <label for="exam-subject-input">Subject *</label>
      <select id="exam-subject-input">${subjectsOptions}</select>
    </div>
    <div class="form-group">
      <label for="exam-date-input">Exam Date *</label>
      <input type="date" id="exam-date-input">
      <span id="exam-date-error" class="error-text" style="display:none;"></span>
    </div>
    <div class="form-group">
      <label for="exam-notes-input">Notes / Syllabus (Optional)</label>
      <textarea id="exam-notes-input" placeholder="Chapters 1 to 4, Formulas to remember..."></textarea>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button type="submit" class="btn btn-primary">${isEdit ? "Update Exam" : "Add Exam"}</button>
    </div>
  `;

  // Pre-fill
  if (isEdit) {
    form.querySelector("#exam-title-input").value = examToEdit.title;
    form.querySelector("#exam-subject-input").value = examToEdit.subjectId;
    form.querySelector("#exam-date-input").value = examToEdit.date;
    form.querySelector("#exam-notes-input").value = examToEdit.notes || "";
  } else {
    form.querySelector("#exam-date-input").value = prefilledDate || getRelativeDate(14);
  }

  form.onsubmit = function (e) {
    e.preventDefault();
    var titleVal = form.querySelector("#exam-title-input").value.trim();
    var subVal = form.querySelector("#exam-subject-input").value;
    var dateVal = form.querySelector("#exam-date-input").value;
    var notesVal = form.querySelector("#exam-notes-input").value.trim();

    var hasError = false;
    var titleErr = form.querySelector("#exam-title-error");
    if (!titleVal) {
      titleErr.textContent = "Exam title is required.";
      titleErr.style.display = "block";
      hasError = true;
    } else {
      titleErr.style.display = "none";
    }

    var dateErr = form.querySelector("#exam-date-error");
    if (!dateVal) {
      dateErr.textContent = "Exam date is required.";
      dateErr.style.display = "block";
      hasError = true;
    } else {
      dateErr.style.display = "none";
    }

    if (hasError) return;

    if (isEdit) {
      examToEdit.title = titleVal;
      examToEdit.subjectId = subVal;
      examToEdit.date = dateVal;
      examToEdit.notes = notesVal;
      showToast("Exam updated!");
    } else {
      var newExam = {
        id: "exam_" + Date.now(),
        title: titleVal,
        subjectId: subVal,
        date: dateVal,
        notes: notesVal
      };
      appData.exams.push(newExam);
      showToast("Exam scheduled!");
    }

    saveData();
    closeModal();
    renderExams();
    renderCalendar();
    renderDashboard();
  };

  openModal(isEdit ? "Edit Exam" : "Schedule New Exam", form);
}

// Delete exam
function deleteExam(examId) {
  var exam = appData.exams.find(function (e) { return e.id === examId; });
  if (!exam) return;

  if (window.confirm('Delete exam "' + exam.title + '"?')) {
    appData.exams = appData.exams.filter(function (e) { return e.id !== examId; });
    saveData();
    renderExams();
    renderCalendar();
    renderDashboard();
    showToast("Exam deleted.");
  }
}


// ==========================================================================
// FOCUS TIMER MODULE
// ==========================================================================

var timerMode = "focus";
var timerDurationSeconds = 25 * 60;
var timerRemainingSeconds = 25 * 60;
var timerInterval = null;
var timerRunning = false;
var timerEndTime = null;
var timerSessionSaved = false;

// Render focus timer view
function renderTimer() {
  populateTimerSubjects();
  updateTimerDisplay();
  updateTimerButtons();
}

// Populate subject dropdown on focus timer
function populateTimerSubjects() {
  var select = document.getElementById("timer-subject-select");
  if (!select) return;
  var currentVal = select.value;
  select.innerHTML = '<option value="">General Study</option>';
  appData.subjects.forEach(function (sub) {
    var opt = document.createElement("option");
    opt.value = sub.id;
    opt.textContent = sub.name;
    select.appendChild(opt);
  });
  if (currentVal) select.value = currentVal;
}

// Switch between focus and break modes (or custom minutes)
function setTimerMode(mode, customMinutes) {
  // Clear running timer
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = false;
  timerMode = mode;
  timerSessionSaved = false;

  if (customMinutes) {
    timerDurationSeconds = customMinutes * 60;
  } else if (mode === "focus") {
    timerDurationSeconds = 25 * 60;
  } else {
    timerDurationSeconds = 5 * 60;
  }

  timerRemainingSeconds = timerDurationSeconds;

  // Update mode buttons
  var focusBtn = document.getElementById("timer-mode-focus");
  var breakBtn = document.getElementById("timer-mode-break");
  var testBtn = document.getElementById("timer-mode-test");

  if (focusBtn && breakBtn) {
    if (customMinutes === 1) {
      if (testBtn) testBtn.className = "btn btn-primary btn-sm";
      focusBtn.className = "btn btn-secondary";
      breakBtn.className = "btn btn-secondary";
    } else if (mode === "focus") {
      focusBtn.className = "btn btn-primary";
      breakBtn.className = "btn btn-secondary";
      if (testBtn) testBtn.className = "btn btn-secondary btn-sm";
    } else {
      focusBtn.className = "btn btn-secondary";
      breakBtn.className = "btn btn-primary";
      if (testBtn) testBtn.className = "btn btn-secondary btn-sm";
    }
  }

  updateTimerDisplay();
  updateTimerButtons();
}

// Start timer
function startTimer() {
  if (timerRunning) return;
  clearInterval(timerInterval);

  timerRunning = true;
  timerSessionSaved = false;
  timerEndTime = Date.now() + timerRemainingSeconds * 1000;

  updateTimerButtons();
  timerInterval = setInterval(timerTick, 250);
}

// Periodic tick calculating remaining time from end timestamp
function timerTick() {
  var now = Date.now();
  var remaining = Math.max(0, Math.ceil((timerEndTime - now) / 1000));
  timerRemainingSeconds = remaining;

  updateTimerDisplay();

  if (timerRemainingSeconds <= 0) {
    finishTimerSession();
  }
}

// Pause timer
function pauseTimer() {
  if (!timerRunning) return;
  timerRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  updateTimerButtons();
}

// Resume timer
function resumeTimer() {
  if (timerRunning || timerRemainingSeconds <= 0) return;
  startTimer();
}

// Reset timer
function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = false;
  timerSessionSaved = false;
  timerRemainingSeconds = timerDurationSeconds;

  updateTimerDisplay();
  updateTimerButtons();
}

// Handle completion of timer session
function finishTimerSession() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = false;

  // Only save for focus session and ensure flag prevents duplicate saves
  if (timerMode === "focus" && !timerSessionSaved) {
    timerSessionSaved = true;

    var selectedSubId = document.getElementById("timer-subject-select") ? document.getElementById("timer-subject-select").value : "";
    var subObj = appData.subjects.find(function (s) { return s.id === selectedSubId; });
    var studyMinutes = Math.round(timerDurationSeconds / 60) || 1;

    var newSession = {
      id: "sess_" + Date.now(),
      subjectId: selectedSubId || (appData.subjects[0] ? appData.subjects[0].id : ""),
      topic: "Focus Timer Session" + (subObj ? " (" + subObj.name + ")" : ""),
      date: getTodayDate(),
      startTime: String(new Date().getHours()).padStart(2, "0") + ":" + String(new Date().getMinutes()).padStart(2, "0"),
      minutes: studyMinutes,
      done: true
    };

    appData.sessions.push(newSession);
    saveData();
    renderDashboard();
    renderSubjects();
    showToast("Focus session complete! 1 study session logged.");
  } else if (timerMode === "break") {
    showToast("Break time is over! Ready for another focus session?");
  }

  updateTimerButtons();
}

// Update MM:SS clock and progress bar
function updateTimerDisplay() {
  var minutes = Math.floor(timerRemainingSeconds / 60);
  var seconds = timerRemainingSeconds % 60;
  var formatted = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");

  var displayEl = document.getElementById("timer-display");
  if (displayEl) displayEl.textContent = formatted;

  var progressEl = document.getElementById("timer-progress");
  if (progressEl) {
    var percent = timerDurationSeconds > 0 ? (timerRemainingSeconds / timerDurationSeconds) * 100 : 0;
    progressEl.style.width = percent + "%";
  }
}

// Update visibility of timer action buttons
function updateTimerButtons() {
  var startBtn = document.getElementById("timer-start-btn");
  var pauseBtn = document.getElementById("timer-pause-btn");
  var resumeBtn = document.getElementById("timer-resume-btn");
  var resetBtn = document.getElementById("timer-reset-btn");

  if (!startBtn || !pauseBtn || !resumeBtn) return;

  if (timerRunning) {
    startBtn.style.display = "none";
    pauseBtn.style.display = "inline-flex";
    resumeBtn.style.display = "none";
  } else if (timerRemainingSeconds < timerDurationSeconds && timerRemainingSeconds > 0) {
    startBtn.style.display = "none";
    pauseBtn.style.display = "none";
    resumeBtn.style.display = "inline-flex";
  } else {
    startBtn.style.display = "inline-flex";
    pauseBtn.style.display = "none";
    resumeBtn.style.display = "none";
  }
}


// Set up UI event listeners
function initEventListeners() {
  // Navigation clicks
  document.querySelectorAll(".nav-item").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var page = this.getAttribute("data-page");
      if (page) showPage(page);
    });
  });

  // Mobile menu buttons
  var menuBtn = document.getElementById("menu-btn");
  if (menuBtn) menuBtn.addEventListener("click", openMobileMenu);

  var overlay = document.getElementById("mobile-overlay");
  if (overlay) overlay.addEventListener("click", closeMobileMenu);

  // Theme toggle
  var themeBtn = document.getElementById("theme-btn");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

  // Welcome card buttons
  var loadDemoBtn = document.getElementById("load-demo-btn");
  if (loadDemoBtn) loadDemoBtn.addEventListener("click", loadDemoData);

  var startEmptyBtn = document.getElementById("start-empty-btn");
  if (startEmptyBtn) startEmptyBtn.addEventListener("click", startEmpty);

  // Add Subject button
  var addSubjectBtn = document.getElementById("add-subject-btn");
  if (addSubjectBtn) addSubjectBtn.addEventListener("click", function () {
    openSubjectModal();
  });

  // Add Task button
  var addTaskBtn = document.getElementById("add-task-btn");
  if (addTaskBtn) addTaskBtn.addEventListener("click", function () {
    openTaskModal();
  });

  // Modal close button
  var modalCloseBtn = document.getElementById("modal-close-btn");
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);

  // Close modal when clicking on overlay background
  var modalOverlay = document.getElementById("modal");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Task search and filter inputs
  var taskSearch = document.getElementById("task-search");
  if (taskSearch) taskSearch.addEventListener("input", renderTasks);

  var taskStatus = document.getElementById("task-filter-status");
  if (taskStatus) taskStatus.addEventListener("change", renderTasks);

  var taskPriority = document.getElementById("task-filter-priority");
  if (taskPriority) taskPriority.addEventListener("change", renderTasks);

  var taskSubject = document.getElementById("task-filter-subject");
  if (taskSubject) taskSubject.addEventListener("change", renderTasks);

  var taskCategory = document.getElementById("task-filter-category");
  if (taskCategory) taskCategory.addEventListener("change", renderTasks);

  var taskSort = document.getElementById("task-sort");
  if (taskSort) taskSort.addEventListener("change", renderTasks);

  // Timetable controls
  var ttPrev = document.getElementById("timetable-prev-btn");
  if (ttPrev) ttPrev.addEventListener("click", function () { changeTimetableDate(-1); });

  var ttNext = document.getElementById("timetable-next-btn");
  if (ttNext) ttNext.addEventListener("click", function () { changeTimetableDate(1); });

  var ttToday = document.getElementById("timetable-today-btn");
  if (ttToday) ttToday.addEventListener("click", function () {
    selectedTimetableDate = getTodayDate();
    renderTimetable();
  });

  var ttDateInput = document.getElementById("timetable-date-input");
  if (ttDateInput) ttDateInput.addEventListener("change", function () {
    if (this.value) {
      selectedTimetableDate = this.value;
      renderTimetable();
    }
  });

  var addSessBtn = document.getElementById("add-session-btn");
  if (addSessBtn) addSessBtn.addEventListener("click", function () {
    openSessionModal(null, selectedTimetableDate);
  });

  // Calendar controls
  var calPrev = document.getElementById("cal-prev-btn");
  if (calPrev) calPrev.addEventListener("click", function () { changeCalendarMonth(-1); });

  var calNext = document.getElementById("cal-next-btn");
  if (calNext) calNext.addEventListener("click", function () { changeCalendarMonth(1); });

  var calToday = document.getElementById("cal-today-btn");
  if (calToday) calToday.addEventListener("click", function () {
    calendarYear = new Date().getFullYear();
    calendarMonth = new Date().getMonth();
    calendarSelectedDate = getTodayDate();
    renderCalendar();
  });

  var calAddSess = document.getElementById("cal-add-session-btn");
  if (calAddSess) calAddSess.addEventListener("click", function () {
    openSessionModal(null, calendarSelectedDate);
  });

  var calAddExam = document.getElementById("cal-add-exam-btn");
  if (calAddExam) calAddExam.addEventListener("click", function () {
    openExamModal(null, calendarSelectedDate);
  });

  // Exams controls
  var addExamBtn = document.getElementById("add-exam-btn");
  if (addExamBtn) addExamBtn.addEventListener("click", function () {
    openExamModal();
  });

  // Timer controls
  var timerModeFocus = document.getElementById("timer-mode-focus");
  if (timerModeFocus) timerModeFocus.addEventListener("click", function () { setTimerMode("focus"); });

  var timerModeBreak = document.getElementById("timer-mode-break");
  if (timerModeBreak) timerModeBreak.addEventListener("click", function () { setTimerMode("break"); });

  var timerModeTest = document.getElementById("timer-mode-test");
  if (timerModeTest) timerModeTest.addEventListener("click", function () { setTimerMode("focus", 1); });

  var timerStart = document.getElementById("timer-start-btn");
  if (timerStart) timerStart.addEventListener("click", startTimer);

  var timerPause = document.getElementById("timer-pause-btn");
  if (timerPause) timerPause.addEventListener("click", pauseTimer);

  var timerResume = document.getElementById("timer-resume-btn");
  if (timerResume) timerResume.addEventListener("click", resumeTimer);

  var timerReset = document.getElementById("timer-reset-btn");
  if (timerReset) timerReset.addEventListener("click", resetTimer);

  // Phase 3: Remove sample data button
  var removeDemoBtn = document.getElementById("remove-demo-btn");
  if (removeDemoBtn) removeDemoBtn.addEventListener("click", removeDemoData);

  // Phase 3: Settings and data portability controls
  var saveSettingsBtn = document.getElementById("save-settings-btn");
  if (saveSettingsBtn) saveSettingsBtn.addEventListener("click", saveSettings);

  var exportDataBtn = document.getElementById("export-data-btn");
  if (exportDataBtn) exportDataBtn.addEventListener("click", exportData);

  var importDataBtn = document.getElementById("import-data-btn");
  var importFileInput = document.getElementById("import-file-input");
  if (importDataBtn && importFileInput) {
    importDataBtn.addEventListener("click", function () {
      importFileInput.click();
    });
    importFileInput.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        importData(this.files[0]);
        this.value = "";
      }
    });
  }

  var clearDataBtn = document.getElementById("clear-data-btn");
  if (clearDataBtn) clearDataBtn.addEventListener("click", clearAllData);

  // Listen for hashchange
  window.addEventListener("hashchange", function () {
    var hash = window.location.hash.replace("#", "") || "dashboard";
    showPage(hash);
  });
}

// Application startup
window.onload = function () {
  loadData();
  applyTheme(appData.settings.theme || "light");
  initEventListeners();

  var initialPage = window.location.hash.replace("#", "") || "dashboard";
  showPage(initialPage);
};

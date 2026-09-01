/* ============================================================
   DEMO STATE INITIALIZER & LOCAL STORAGE SYNC
   ============================================================ */
const INITIAL_DATA = {
  teachers: [
    { id: "T101", name: "Dr. Sarah Jenkins", subject: "Mathematics", email: "s.jenkins@school.edu", phone: "+1 555-0101" },
    { id: "T102", name: "Prof. Alan Turing", subject: "Computer Science", email: "a.turing@school.edu", phone: "+1 555-0102" },
    { id: "T103", name: "Mrs. Marie Curie", subject: "Physics", email: "m.curie@school.edu", phone: "+1 555-0103" },
    { id: "T104", name: "Mr. Robert Frost", subject: "English", email: "r.frost@school.edu", phone: "+1 555-0104" },
    { id: "T105", name: "Dr. Gregor Mendel", subject: "Biology", email: "g.mendel@school.edu", phone: "+1 555-0105" }
  ],
  classes: ["Grade 9-A", "Grade 10-A", "Grade 11-Science", "Grade 12-Science"],
  subjects: ["Mathematics", "Computer Science", "Physics", "Chemistry", "Biology", "English", "History", "Physical Ed"],
  attendanceHistory: [
    {
      date: "2026-08-31",
      records: {
        "T101": "Present",
        "T102": "Present",
        "T103": "On Leave",
        "T104": "Present",
        "T105": "Absent"
      }
    }
  ],
  timetables: {
    "Grade 10-A": {
      "Monday-P1": { subject: "Mathematics", teacher: "Dr. Sarah Jenkins" },
      "Monday-P2": { subject: "Physics", teacher: "Mrs. Marie Curie" },
      "Tuesday-P1": { subject: "Computer Science", teacher: "Prof. Alan Turing" },
      "Wednesday-P3": { subject: "English", teacher: "Mr. Robert Frost" }
    }
  }
};

// Retrieve stored state or set default
let store = JSON.parse(localStorage.getItem("eduAdminDB")) || INITIAL_DATA;
function saveStore() {
  localStorage.setItem("eduAdminDB", JSON.stringify(store));
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = ["P1", "P2", "P3", "P4", "P5", "P6"];

/* ============================================================
   AUTHENTICATION LOGIC (Demo Session)
   ============================================================ */
const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");

if (sessionStorage.getItem("eduAdminAuth") === "true") {
  showApp();
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();

  if (user === "admin" && pass === "admin123") {
    sessionStorage.setItem("eduAdminAuth", "true");
    showApp();
  } else {
    alert("Invalid credentials! Use admin / admin123");
  }
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("eduAdminAuth");
  appScreen.classList.remove("active");
  authScreen.classList.add("active");
});

function showApp() {
  authScreen.classList.remove("active");
  appScreen.classList.add("active");
  initApp();
}

/* ============================================================
   NAVIGATION & TABS
   ============================================================ */
const navButtons = document.querySelectorAll(".nav-btn");
const views = document.querySelectorAll(".content-view");
const pageTitle = document.getElementById("page-title");

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-target");
    switchView(target);
  });
});

function switchView(viewName) {
  navButtons.forEach(b => b.classList.toggle("active", b.getAttribute("data-target") === viewName));
  views.forEach(v => v.classList.toggle("active", v.id === `view-${viewName}`));
  
  const titleMap = {
    dashboard: "Dashboard Overview",
    teachers: "Teacher Management",
    attendance: "Daily Teacher Attendance",
    history: "Attendance Log History",
    classes: "Classes & Subjects Configuration",
    timetable: "Class Timetable Manager"
  };
  pageTitle.innerText = titleMap[viewName] || "Dashboard";

  // Trigger UI Rerenders
  if (viewName === "dashboard") renderDashboard();
  if (viewName === "teachers") renderTeachers();
  if (viewName === "attendance") renderAttendance();
  if (viewName === "history") renderHistory();
  if (viewName === "classes") renderClassesAndSubjects();
  if (viewName === "timetable") renderTimetable();
}

/* ============================================================
   INIT & DASHBOARD
   ============================================================ */
function initApp() {
  document.getElementById("live-date").innerText = new Date().toDateString();
  const dateInput = document.getElementById("attendance-date");
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }
  renderDashboard();
  populateDropdowns();
}

function renderDashboard() {
  const totalT = store.teachers.length;
  const totalC = store.classes.length;
  const today = document.getElementById("attendance-date").value || new Date().toISOString().split("T")[0];
  const recordToday = store.attendanceHistory.find(r => r.date === today);

  let present = 0;
  let absentOrLeave = 0;

  if (recordToday) {
    Object.values(recordToday.records).forEach(status => {
      if (status === "Present") present++;
      else absentOrLeave++;
    });
  }

  document.getElementById("stat-total-teachers").innerText = totalT;
  document.getElementById("stat-present-today").innerText = recordToday ? present : "—";
  document.getElementById("stat-absent-today").innerText = recordToday ? absentOrLeave : "—";
  document.getElementById("stat-total-classes").innerText = totalC;

  const dashSummary = document.getElementById("dash-attendance-summary");
  if (!recordToday) {
    dashSummary.innerHTML = `<p style="color:var(--text-muted);">No attendance marked for today (${today}). Click 'Mark Attendance' to begin.</p>`;
  } else {
    let rows = store.teachers.map(t => {
      const status = recordToday.records[t.id] || "Unmarked";
      const badgeClass = status === "Present" ? "badge-present" : (status === "Absent" ? "badge-absent" : "badge-leave");
      return `<tr><td><strong>${t.name}</strong></td><td><span class="badge ${badgeClass}">${status}</span></td></tr>`;
    }).join("");
    dashSummary.innerHTML = `<table class="data-table"><thead><tr><th>Teacher</th><th>Today's Status</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
}

/* ============================================================
   TEACHER DIRECTORY
   ============================================================ */
const teachersTableBody = document.getElementById("teachers-table-body");
const teacherModal = document.getElementById("teacher-modal");
const openTeacherModalBtn = document.getElementById("open-teacher-modal");
const closeTeacherModalBtn = document.getElementById("close-teacher-modal");
const cancelTeacherModalBtn = document.getElementById("cancel-teacher-modal");
const teacherForm = document.getElementById("teacher-form");

function renderTeachers() {
  teachersTableBody.innerHTML = store.teachers.map(t => `
    <tr>
      <td><code>${t.id}</code></td>
      <td><strong>${t.name}</strong></td>
      <td>${t.subject}</td>
      <td>${t.email}</td>
      <td>${t.phone}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="editTeacher('${t.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteTeacher('${t.id}')">Delete</button>
      </td>
    </tr>
  `).join("");
}

function populateTeacherSubjectSelect() {
  const select = document.getElementById("teacher-subject");
  select.innerHTML = store.subjects.map(s => `<option value="${s}">${s}</option>`).join("");
}

openTeacherModalBtn.onclick = () => {
  teacherForm.reset();
  document.getElementById("teacher-id").value = "";
  document.getElementById("teacher-modal-title").innerText = "Add Teacher";
  populateTeacherSubjectSelect();
  teacherModal.classList.add("active");
};

closeTeacherModalBtn.onclick = cancelTeacherModalBtn.onclick = () => {
  teacherModal.classList.remove("active");
};

teacherForm.onsubmit = (e) => {
  e.preventDefault();
  const id = document.getElementById("teacher-id").value || "T" + Math.floor(100 + Math.random() * 900);
  const name = document.getElementById("teacher-name").value.trim();
  const subject = document.getElementById("teacher-subject").value;
  const email = document.getElementById("teacher-email").value.trim();
  const phone = document.getElementById("teacher-phone").value.trim();

  const existingIndex = store.teachers.findIndex(t => t.id === id);
  if (existingIndex > -1) {
    store.teachers[existingIndex] = { id, name, subject, email, phone };
  } else {
    store.teachers.push({ id, name, subject, email, phone });
  }

  saveStore();
  teacherModal.classList.remove("active");
  renderTeachers();
  populateDropdowns();
};

window.editTeacher = (id) => {
  const t = store.teachers.find(x => x.id === id);
  if (!t) return;
  populateTeacherSubjectSelect();
  document.getElementById("teacher-id").value = t.id;
  document.getElementById("teacher-name").value = t.name;
  document.getElementById("teacher-subject").value = t.subject;
  document.getElementById("teacher-email").value = t.email;
  document.getElementById("teacher-phone").value = t.phone;
  document.getElementById("teacher-modal-title").innerText = "Edit Teacher";
  teacherModal.classList.add("active");
};

window.deleteTeacher = (id) => {
  if (confirm("Are you sure you want to remove this teacher?")) {
    store.teachers = store.teachers.filter(t => t.id !== id);
    saveStore();
    renderTeachers();
    populateDropdowns();
  }
};

/* ============================================================
   DAILY ATTENDANCE
   ============================================================ */
const attendanceDateInput = document.getElementById("attendance-date");
const attendanceTableBody = document.getElementById("attendance-table-body");
const saveAttendanceBtn = document.getElementById("save-attendance-btn");

attendanceDateInput.onchange = () => renderAttendance();

function renderAttendance() {
  const selectedDate = attendanceDateInput.value;
  const existingLog = store.attendanceHistory.find(h => h.date === selectedDate);
  const records = existingLog ? existingLog.records : {};

  attendanceTableBody.innerHTML = store.teachers.map(t => {
    const status = records[t.id] || "Present";
    return `
      <tr>
        <td><strong>${t.name}</strong></td>
        <td>${t.subject}</td>
        <td>
          <select class="attendance-select" data-tid="${t.id}">
            <option value="Present" ${status === "Present" ? "selected" : ""}>Present</option>
            <option value="Absent" ${status === "Absent" ? "selected" : ""}>Absent</option>
            <option value="On Leave" ${status === "On Leave" ? "selected" : ""}>On Leave</option>
          </select>
        </td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="setQuickAttendance('${t.id}', 'Present')">Present</button>
          <button class="btn btn-outline btn-sm" onclick="setQuickAttendance('${t.id}', 'Absent')">Absent</button>
        </td>
      </tr>
    `;
  }).join("");
}

window.setQuickAttendance = (tid, val) => {
  const select = document.querySelector(`.attendance-select[data-tid="${tid}"]`);
  if (select) select.value = val;
};

saveAttendanceBtn.onclick = () => {
  const date = attendanceDateInput.value;
  const selects = document.querySelectorAll(".attendance-select");
  const records = {};

  selects.forEach(s => {
    records[s.getAttribute("data-tid")] = s.value;
  });

  const existingIndex = store.attendanceHistory.findIndex(h => h.date === date);
  if (existingIndex > -1) {
    store.attendanceHistory[existingIndex].records = records;
  } else {
    store.attendanceHistory.push({ date, records });
  }

  saveStore();
  alert(`Attendance for ${date} successfully recorded!`);
  renderDashboard();
};

/* ============================================================
   ATTENDANCE HISTORY
   ============================================================ */
const historyTableBody = document.getElementById("history-table-body");
const clearHistoryBtn = document.getElementById("clear-history-btn");

function renderHistory() {
  if (store.attendanceHistory.length === 0) {
    historyTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No history recorded yet.</td></tr>`;
    return;
  }

  // Sort descending by date
  const sorted = [...store.attendanceHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

  historyTableBody.innerHTML = sorted.map(row => {
    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    const values = Object.values(row.records);

    values.forEach(v => {
      if (v === "Present") presentCount++;
      else if (v === "Absent") absentCount++;
      else if (v === "On Leave") leaveCount++;
    });

    const total = values.length || 1;
    const pct = Math.round((presentCount / total) * 100);

    return `
      <tr>
        <td><strong>${row.date}</strong></td>
        <td><span class="badge badge-present">${presentCount} Present</span></td>
        <td><span class="badge badge-absent">${absentCount} Absent</span></td>
        <td><span class="badge badge-leave">${leaveCount} On Leave</span></td>
        <td><strong>${pct}%</strong></td>
      </tr>
    `;
  }).join("");
}

clearHistoryBtn.onclick = () => {
  if (confirm("Clear all attendance history logs?")) {
    store.attendanceHistory = [];
    saveStore();
    renderHistory();
    renderDashboard();
  }
};

/* ============================================================
   CLASSES & SUBJECTS
   ============================================================ */
const addClassForm = document.getElementById("add-class-form");
const addSubjectForm = document.getElementById("add-subject-form");
const classList = document.getElementById("class-list");
const subjectList = document.getElementById("subject-list");

function renderClassesAndSubjects() {
  classList.innerHTML = store.classes.map(c => `
    <li>${c} <span class="del" onclick="removeClass('${c}')">&times;</span></li>
  `).join("");

  subjectList.innerHTML = store.subjects.map(s => `
    <li>${s} <span class="del" onclick="removeSubject('${s}')">&times;</span></li>
  `).join("");
}

addClassForm.onsubmit = (e) => {
  e.preventDefault();
  const val = document.getElementById("class-name").value.trim();
  if (val && !store.classes.includes(val)) {
    store.classes.push(val);
    saveStore();
    document.getElementById("class-name").value = "";
    renderClassesAndSubjects();
    populateDropdowns();
  }
};

addSubjectForm.onsubmit = (e) => {
  e.preventDefault();
  const val = document.getElementById("subject-name").value.trim();
  if (val && !store.subjects.includes(val)) {
    store.subjects.push(val);
    saveStore();
    document.getElementById("subject-name").value = "";
    renderClassesAndSubjects();
    populateDropdowns();
  }
};

window.removeClass = (className) => {
  store.classes = store.classes.filter(c => c !== className);
  saveStore();
  renderClassesAndSubjects();
  populateDropdowns();
};

window.removeSubject = (subjectName) => {
  store.subjects = store.subjects.filter(s => s !== subjectName);
  saveStore();
  renderClassesAndSubjects();
  populateDropdowns();
};

/* ============================================================
   TIMETABLE BUILDER & EXPORT
   ============================================================ */
const timetableClassSelect = document.getElementById("timetable-class-select");
const timetableBody = document.getElementById("timetable-body");
const slotModal = document.getElementById("slot-modal");
const slotForm = document.getElementById("slot-form");
const closeSlotModalBtn = document.getElementById("close-slot-modal");
const clearSlotBtn = document.getElementById("clear-slot-btn");

function populateDropdowns() {
  timetableClassSelect.innerHTML = store.classes.map(c => `<option value="${c}">${c}</option>`).join("");
}

timetableClassSelect.onchange = () => renderTimetable();

function renderTimetable() {
  const selectedClass = timetableClassSelect.value;
  document.getElementById("timetable-title-display").innerText = `Weekly Timetable — ${selectedClass || "No Class Selected"}`;

  if (!selectedClass) {
    timetableBody.innerHTML = `<tr><td colspan="7">Please add and select a class.</td></tr>`;
    return;
  }

  const classData = store.timetables[selectedClass] || {};

  timetableBody.innerHTML = DAYS.map(day => {
    const periodCols = PERIODS.map(period => {
      const slotKey = `${day}-${period}`;
      const assignment = classData[slotKey];
      if (assignment) {
        return `
          <td class="slot-cell" onclick="openSlotModal('${day}', '${period}')">
            <span class="slot-subject">${assignment.subject}</span>
            <span class="slot-teacher">${assignment.teacher}</span>
          </td>
        `;
      }
      return `
        <td class="slot-cell empty" onclick="openSlotModal('${day}', '${period}')">
          <span>+ Assign</span>
        </td>
      `;
    }).join("");

    return `<tr><th><strong>${day}</strong></th>${periodCols}</tr>`;
  }).join("");
}

window.openSlotModal = (day, period) => {
  const selectedClass = timetableClassSelect.value;
  document.getElementById("slot-modal-title").innerText = `Assign Slot (${day} - Period ${period.replace('P','')})`;
  document.getElementById("slot-day").value = day;
  document.getElementById("slot-period").value = period;

  // Fill subjects
  const subjSelect = document.getElementById("slot-subject");
  subjSelect.innerHTML = store.subjects.map(s => `<option value="${s}">${s}</option>`).join("");

  // Fill teachers
  const teachSelect = document.getElementById("slot-teacher");
  teachSelect.innerHTML = store.teachers.map(t => `<option value="${t.name}">${t.name} (${t.subject})</option>`).join("");

  // Prepopulate if slot exists
  const existing = store.timetables[selectedClass]?.[`${day}-${period}`];
  if (existing) {
    subjSelect.value = existing.subject;
    teachSelect.value = existing.teacher;
  }

  slotModal.classList.add("active");
};

closeSlotModalBtn.onclick = () => slotModal.classList.remove("active");

slotForm.onsubmit = (e) => {
  e.preventDefault();
  const selectedClass = timetableClassSelect.value;
  const day = document.getElementById("slot-day").value;
  const period = document.getElementById("slot-period").value;
  const subject = document.getElementById("slot-subject").value;
  const teacher = document.getElementById("slot-teacher").value;

  if (!store.timetables[selectedClass]) store.timetables[selectedClass] = {};
  store.timetables[selectedClass][`${day}-${period}`] = { subject, teacher };

  saveStore();
  slotModal.classList.remove("active");
  renderTimetable();
};

clearSlotBtn.onclick = () => {
  const selectedClass = timetableClassSelect.value;
  const day = document.getElementById("slot-day").value;
  const period = document.getElementById("slot-period").value;

  if (store.timetables[selectedClass]?.[`${day}-${period}`]) {
    delete store.timetables[selectedClass][`${day}-${period}`];
    saveStore();
  }
  slotModal.classList.remove("active");
  renderTimetable();
};

/* ============================================================
   DOWNLOAD AS IMAGE & PRINT FUNCTIONALITY
   ============================================================ */
document.getElementById("btn-print-timetable").addEventListener("click", () => {
  window.print();
});

document.getElementById("btn-download-timetable").addEventListener("click", () => {
  const node = document.getElementById("timetable-capture-node");
  const selectedClass = timetableClassSelect.value || "Class";

  // Use html2canvas from CDN
  html2canvas(node, {
    scale: 2, // High resolution export
    backgroundColor: "#ffffff"
  }).then(canvas => {
    const link = document.createElement("a");
    link.download = `Timetable_${selectedClass.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
});

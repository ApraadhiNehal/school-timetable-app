/* ============================================================
   DATA STORE & LOCAL STORAGE
   ============================================================ */
const INITIAL_DATA = {
  teachers: [
    { id: "T101", name: "Dr. Sarah Jenkins", subject: "Mathematics", email: "s.jenkins@school.edu", phone: "+1 555-0101" },
    { id: "T102", name: "Prof. Alan Turing", subject: "Computer Science", email: "a.turing@school.edu", phone: "+1 555-0102" },
    { id: "T103", name: "Mrs. Marie Curie", subject: "Physics", email: "m.curie@school.edu", phone: "+1 555-0103" },
    { id: "T104", name: "Mr. Robert Frost", subject: "English", email: "r.frost@school.edu", phone: "+1 555-0104" },
    { id: "T105", name: "Dr. Gregor Mendel", subject: "Biology", email: "g.mendel@school.edu", phone: "+1 555-0105" },
    { id: "T106", name: "Mr. Dmitri Mendeleev", subject: "Chemistry", email: "d.mendeleev@school.edu", phone: "+1 555-0106" },
    { id: "T107", name: "Coach Jesse Owens", subject: "Physical Ed", email: "j.owens@school.edu", phone: "+1 555-0107" }
  ],
  classes: ["Grade 9-A", "Grade 10-A", "Grade 11-Science", "Grade 12-Science"],
  subjects: ["Mathematics", "Computer Science", "Physics", "Chemistry", "Biology", "English", "History", "Physical Ed"],
  attendanceHistory: [
    {
      date: "2026-08-31",
      records: { "T101": "Present", "T102": "Present", "T103": "On Leave", "T104": "Present", "T105": "Absent" }
    }
  ],
  timetables: {}
};

let store = JSON.parse(localStorage.getItem("eduAdminDB")) || INITIAL_DATA;
function saveStore() {
  localStorage.setItem("eduAdminDB", JSON.stringify(store));
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];

/* ============================================================
   GLOBAL TOGGLE & NAVIGATION
   ============================================================ */
window.toggleSidebar = function(open) {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (sidebar && backdrop) {
    if (open) {
      sidebar.classList.add("open");
      backdrop.classList.add("active");
    } else {
      sidebar.classList.remove("open");
      backdrop.classList.remove("active");
    }
  }
};

window.switchView = function(viewName) {
  const navBtns = document.querySelectorAll(".nav-btn");
  const views = document.querySelectorAll(".content-view");
  const pageTitle = document.getElementById("page-title");

  views.forEach(v => {
    v.classList.toggle("active", v.id === `view-${viewName}`);
  });

  navBtns.forEach(btn => {
    const text = btn.innerText.toLowerCase();
    btn.classList.toggle("active", text.includes(viewName.substring(0, 4)));
  });

  const titleMap = {
    dashboard: "Dashboard Overview",
    teachers: "Teacher Management",
    attendance: "Daily Teacher Attendance",
    history: "Attendance Log History",
    classes: "Classes & Subjects",
    timetable: "Class Timetable Manager"
  };
  if (pageTitle) pageTitle.innerText = titleMap[viewName] || "Dashboard";

  window.toggleSidebar(false);

  if (viewName === "dashboard") renderDashboard();
  if (viewName === "teachers") renderTeachers();
  if (viewName === "attendance") renderAttendance();
  if (viewName === "history") renderHistory();
  if (viewName === "classes") renderClassesAndSubjects();
  if (viewName === "timetable") renderTimetable();
};

/* ============================================================
   AUTH HANDLING
   ============================================================ */
window.handleLogout = function() {
  sessionStorage.removeItem("eduAdminAuth");
  document.getElementById("app-screen").classList.remove("active");
  document.getElementById("auth-screen").classList.add("active");
};

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard() {
  const totalT = store.teachers.length;
  const totalC = store.classes.length;
  const today = document.getElementById("attendance-date")?.value || new Date().toISOString().split("T")[0];
  const recordToday = store.attendanceHistory.find(r => r.date === today);

  let present = 0;
  let absentOrLeave = 0;

  if (recordToday) {
    Object.values(recordToday.records).forEach(status => {
      if (status === "Present") present++;
      else absentOrLeave++;
    });
  }

  const statTeachers = document.getElementById("stat-total-teachers");
  const statPresent = document.getElementById("stat-present-today");
  const statAbsent = document.getElementById("stat-absent-today");
  const statClasses = document.getElementById("stat-total-classes");

  if (statTeachers) statTeachers.innerText = totalT;
  if (statPresent) statPresent.innerText = recordToday ? present : "—";
  if (statAbsent) statAbsent.innerText = recordToday ? absentOrLeave : "—";
  if (statClasses) statClasses.innerText = totalC;

  const dashSummary = document.getElementById("dash-attendance-summary");
  if (dashSummary) {
    if (!recordToday) {
      dashSummary.innerHTML = `<p style="color:var(--text-muted); padding: 0.5rem 0;">No attendance marked for today (${today}).</p>`;
    } else {
      let rows = store.teachers.map(t => {
        const status = recordToday.records[t.id] || "Unmarked";
        const badgeClass = status === "Present" ? "badge-present" : (status === "Absent" ? "badge-absent" : "badge-leave");
        return `<tr><td><strong>${t.name}</strong></td><td><span class="badge ${badgeClass}">${status}</span></td></tr>`;
      }).join("");
      dashSummary.innerHTML = `<table class="data-table"><thead><tr><th>Teacher</th><th>Today's Status</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
  }
}

/* ============================================================
   TEACHERS
   ============================================================ */
function renderTeachers() {
  const tbody = document.getElementById("teachers-table-body");
  if (!tbody) return;

  if (store.teachers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No teachers available. Click "+ Add New Teacher" to add.</td></tr>`;
    return;
  }

  tbody.innerHTML = store.teachers.map(t => `
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

window.openTeacherModal = function() {
  const form = document.getElementById("teacher-form");
  if (form) form.reset();
  document.getElementById("teacher-id").value = "";
  document.getElementById("teacher-modal-title").innerText = "Add Teacher";
  
  const select = document.getElementById("teacher-subject");
  if (select) {
    select.innerHTML = store.subjects.map(s => `<option value="${s}">${s}</option>`).join("");
  }
  document.getElementById("teacher-modal").classList.add("active");
};

window.closeTeacherModal = function() {
  document.getElementById("teacher-modal").classList.remove("active");
};

window.editTeacher = function(id) {
  const t = store.teachers.find(x => x.id === id);
  if (!t) return;
  window.openTeacherModal();
  document.getElementById("teacher-id").value = t.id;
  document.getElementById("teacher-name").value = t.name;
  document.getElementById("teacher-subject").value = t.subject;
  document.getElementById("teacher-email").value = t.email;
  document.getElementById("teacher-phone").value = t.phone;
  document.getElementById("teacher-modal-title").innerText = "Edit Teacher";
};

window.deleteTeacher = function(id) {
  if (confirm("Are you sure you want to delete this teacher?")) {
    store.teachers = store.teachers.filter(t => t.id !== id);
    saveStore();
    renderTeachers();
    renderDashboard();
  }
};

window.clearAllTeachers = function() {
  if (confirm("⚠️ WARNING: Do you want to clear ALL teachers?")) {
    store.teachers = [];
    saveStore();
    renderTeachers();
    renderDashboard();
  }
};

/* ============================================================
   ATTENDANCE
   ============================================================ */
function renderAttendance() {
  const dateInput = document.getElementById("attendance-date");
  const tbody = document.getElementById("attendance-table-body");
  if (!dateInput || !tbody) return;

  const selectedDate = dateInput.value;
  const existingLog = store.attendanceHistory.find(h => h.date === selectedDate);
  const records = existingLog ? existingLog.records : {};

  if (store.teachers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No teachers found. Please add teachers first.</td></tr>`;
    return;
  }

  tbody.innerHTML = store.teachers.map(t => {
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

window.setQuickAttendance = function(tid, val) {
  const select = document.querySelector(`.attendance-select[data-tid="${tid}"]`);
  if (select) select.value = val;
};

window.saveAttendance = function() {
  const date = document.getElementById("attendance-date").value;
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
  alert(`Attendance for ${date} successfully saved!`);
  renderDashboard();
};

function renderHistory() {
  const tbody = document.getElementById("history-table-body");
  if (!tbody) return;

  if (store.attendanceHistory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No history recorded yet.</td></tr>`;
    return;
  }

  const sorted = [...store.attendanceHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = sorted.map(row => {
    let presentCount = 0, absentCount = 0, leaveCount = 0;
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
        <td><span class="badge badge-leave">${leaveCount} Leave</span></td>
        <td><strong>${pct}%</strong></td>
      </tr>
    `;
  }).join("");
}

window.clearHistory = function() {
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
function renderClassesAndSubjects() {
  const classList = document.getElementById("class-list");
  const subjectList = document.getElementById("subject-list");

  if (classList) {
    classList.innerHTML = store.classes.map(c => `
      <li>${c} <span class="del" onclick="removeClass('${c}')">&times;</span></li>
    `).join("");
  }

  if (subjectList) {
    subjectList.innerHTML = store.subjects.map(s => `
      <li>${s} <span class="del" onclick="removeSubject('${s}')">&times;</span></li>
    `).join("");
  }
}

window.removeClass = function(className) {
  store.classes = store.classes.filter(c => c !== className);
  saveStore();
  renderClassesAndSubjects();
  populateDropdowns();
  renderDashboard();
};

window.removeSubject = function(subjectName) {
  store.subjects = store.subjects.filter(s => s !== subjectName);
  saveStore();
  renderClassesAndSubjects();
  populateDropdowns();
};

/* ============================================================
   TIMETABLE & CONFLICT-FREE AUTO ENGINE
   ============================================================ */
function populateDropdowns() {
  const select = document.getElementById("timetable-class-select");
  if (!select) return;
  const curr = select.value;
  select.innerHTML = store.classes.map(c => `<option value="${c}">${c}</option>`).join("");
  if (curr && store.classes.includes(curr)) {
    select.value = curr;
  }
}

function renderTimetable() {
  const select = document.getElementById("timetable-class-select");
  const tbody = document.getElementById("timetable-body");
  const titleDisplay = document.getElementById("timetable-title-display");
  if (!select || !tbody) return;

  const selectedClass = select.value;
  if (titleDisplay) titleDisplay.innerText = `Weekly Timetable — ${selectedClass || "No Class Selected"}`;

  if (!selectedClass) {
    tbody.innerHTML = `<tr><td colspan="9">Please add and select a class.</td></tr>`;
    return;
  }

  if (!store.timetables) store.timetables = {};
  const classData = store.timetables[selectedClass] || {};

  tbody.innerHTML = DAYS.map(day => {
    const periodCols = PERIODS.map(period => {
      const slotKey = `${day}-${period}`;
      const assignment = classData[slotKey];
      if (assignment) {
        const isFree = assignment.subject === "Free Period";
        return `
          <td class="slot-cell ${isFree ? 'free-period' : ''}" onclick="openSlotModal('${day}', '${period}')">
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

    return `<tr><th class="day-col"><strong>${day}</strong></th>${periodCols}</tr>`;
  }).join("");
}

window.openSlotModal = function(day, period) {
  const selectedClass = document.getElementById("timetable-class-select").value;
  document.getElementById("slot-modal-title").innerText = `Assign (${day} - ${period})`;
  document.getElementById("slot-day").value = day;
  document.getElementById("slot-period").value = period;

  const subjSelect = document.getElementById("slot-subject");
  const allSubjects = ["Free Period", ...store.subjects];
  subjSelect.innerHTML = allSubjects.map(s => `<option value="${s}">${s}</option>`).join("");

  const teachSelect = document.getElementById("slot-teacher");
  if (store.teachers.length === 0) {
    teachSelect.innerHTML = `<option value="Self Study">Self Study (No Teachers)</option>`;
  } else {
    teachSelect.innerHTML = `
      <option value="Self Study / Library">Self Study / Library</option>
      ${store.teachers.map(t => `<option value="${t.name}">${t.name} (${t.subject})</option>`).join("")}
    `;
  }

  const existing = store.timetables[selectedClass]?.[`${day}-${period}`];
  if (existing) {
    subjSelect.value = existing.subject;
    teachSelect.value = existing.teacher;
  }

  document.getElementById("slot-modal").classList.add("active");
};

window.closeSlotModal = function() {
  document.getElementById("slot-modal").classList.remove("active");
};

window.clearCurrentSlot = function() {
  const selectedClass = document.getElementById("timetable-class-select").value;
  const day = document.getElementById("slot-day").value;
  const period = document.getElementById("slot-period").value;

  if (store.timetables[selectedClass]?.[`${day}-${period}`]) {
    delete store.timetables[selectedClass][`${day}-${period}`];
    saveStore();
  }
  window.closeSlotModal();
  renderTimetable();
};

/* 1. MASTER TIMETABLE GENERATOR (Conflict-Free Across All Classes + Auto Free Periods) */
window.autoBuildAllClassesTimetable = function() {
  const classesList = store.classes;
  const teachersList = store.teachers;

  if (!classesList || classesList.length === 0) return alert("Please add classes first in 'Classes & Subjects'!");
  if (!teachersList || teachersList.length === 0) return alert("Please add teachers first in 'Teachers' tab!");

  if (!confirm("Generate conflict-free master timetable for ALL classes? (Teachers will never clash in the same period and free periods will be auto-assigned)")) return;

  const newTimetables = {};
  classesList.forEach(cls => newTimetables[cls] = {});

  const totalTeachers = teachersList.length;

  DAYS.forEach((day, dayIdx) => {
    PERIODS.forEach((period, periodIdx) => {
      const busyTeachersThisSlot = new Set();

      classesList.forEach((cls, clsIdx) => {
        const slotKey = `${day}-${period}`;
        let teacherAssigned = false;

        for (let attempt = 0; attempt < totalTeachers; attempt++) {
          const candidateIdx = (dayIdx * 3 + periodIdx * 2 + clsIdx + attempt) % totalTeachers;
          const candidateTeacher = teachersList[candidateIdx];

          if (!busyTeachersThisSlot.has(candidateTeacher.name)) {
            busyTeachersThisSlot.add(candidateTeacher.name);
            newTimetables[cls][slotKey] = {
              subject: candidateTeacher.subject || "General",
              teacher: candidateTeacher.name
            };
            teacherAssigned = true;
            break;
          }
        }

        // Agar koi teacher free nahi hai iss period me, toh Free Period
        if (!teacherAssigned) {
          newTimetables[cls][slotKey] = {
            subject: "Free Period",
            teacher: "Self Study / Library"
          };
        }
      });
    });
  });

  store.timetables = newTimetables;
  saveStore();
  renderTimetable();
  alert("✅ Conflict-free master timetable generated for all classes!");
};

/* 2. SINGLE CLASS GENERATOR */
window.autoBuildSingleClassTimetable = function() {
  const selectedClass = document.getElementById("timetable-class-select").value;
  if (!selectedClass) return alert("Please select a class first!");

  const teachersList = store.teachers;
  if (!teachersList || teachersList.length === 0) {
    return alert("Please add teachers in 'Teachers' tab first!");
  }

  const newMatrix = {};
  const totalTeachers = teachersList.length;
  let pointer = 0;

  DAYS.forEach((day, dayIdx) => {
    PERIODS.forEach((period, pIdx) => {
      // Periodic free period rotation
      if ((dayIdx + pIdx) % 7 === 0 && totalTeachers > 2) {
        newMatrix[`${day}-${period}`] = {
          subject: "Free Period",
          teacher: "Self Study"
        };
      } else {
        const t = teachersList[pointer % totalTeachers];
        newMatrix[`${day}-${period}`] = {
          subject: t.subject || "General",
          teacher: t.name
        };
        pointer++;
      }
    });
  });

  if (!store.timetables) store.timetables = {};
  store.timetables[selectedClass] = newMatrix;
  saveStore();
  renderTimetable();
  alert(`✅ Timetable generated for ${selectedClass}!`);
};

window.clearCurrentTimetable = function() {
  const selectedClass = document.getElementById("timetable-class-select").value;
  if (!selectedClass) return;
  if (confirm(`Clear all slots for ${selectedClass}?`)) {
    store.timetables[selectedClass] = {};
    saveStore();
    renderTimetable();
  }
};

window.downloadTimetableImage = function() {
  const node = document.getElementById("timetable-capture-node");
  const selectedClass = document.getElementById("timetable-class-select").value || "Class";

  html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    scrollX: 0,
    scrollY: 0
  }).then(canvas => {
    const link = document.createElement("a");
    link.download = `Timetable_${selectedClass.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
};

/* ============================================================
   APP INITIALIZATION ON PAGE LOAD
   ============================================================ */
function initAll() {
  const liveDate = document.getElementById("live-date");
  if (liveDate) liveDate.innerText = new Date().toDateString();

  const dateInput = document.getElementById("attendance-date");
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }

  populateDropdowns();
  renderDashboard();
  renderTeachers();
  renderAttendance();
  renderHistory();
  renderClassesAndSubjects();
  renderTimetable();

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.onsubmit = function(e) {
      e.preventDefault();
      const user = document.getElementById("username").value.trim();
      const pass = document.getElementById("password").value.trim();
      if (user === "admin" && pass === "admin123") {
        sessionStorage.setItem("eduAdminAuth", "true");
        document.getElementById("auth-screen").classList.remove("active");
        document.getElementById("app-screen").classList.add("active");
        initAll();
      } else {
        alert("Invalid login! Use admin / admin123");
      }
    };
  }

  const teacherForm = document.getElementById("teacher-form");
  if (teacherForm) {
    teacherForm.onsubmit = function(e) {
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
      window.closeTeacherModal();
      renderTeachers();
      renderDashboard();
    };
  }

  const addClassForm = document.getElementById("add-class-form");
  if (addClassForm) {
    addClassForm.onsubmit = function(e) {
      e.preventDefault();
      const val = document.getElementById("class-name").value.trim();
      if (val && !store.classes.includes(val)) {
        store.classes.push(val);
        saveStore();
        document.getElementById("class-name").value = "";
        renderClassesAndSubjects();
        populateDropdowns();
        renderDashboard();
      }
    };
  }

  const addSubjectForm = document.getElementById("add-subject-form");
  if (addSubjectForm) {
    addSubjectForm.onsubmit = function(e) {
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
  }

  const slotForm = document.getElementById("slot-form");
  if (slotForm) {
    slotForm.onsubmit = function(e) {
      e.preventDefault();
      const selectedClass = document.getElementById("timetable-class-select").value;
      const day = document.getElementById("slot-day").value;
      const period = document.getElementById("slot-period").value;
      const subject = document.getElementById("slot-subject").value;
      const teacher = document.getElementById("slot-teacher").value;

      if (!store.timetables) store.timetables = {};
      if (!store.timetables[selectedClass]) store.timetables[selectedClass] = {};
      store.timetables[selectedClass][`${day}-${period}`] = { subject, teacher };

      saveStore();
      window.closeSlotModal();
      renderTimetable();
    };
  }
}

window.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("eduAdminAuth") === "true") {
    document.getElementById("auth-screen").classList.remove("active");
    document.getElementById("app-screen").classList.add("active");
  }
  initAll();
});

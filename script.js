/* ============================================================
   DEFAULT DATA & LOCALSTORAGE PERSISTENCE
   ============================================================ */
const INITIAL_DATA = {
  // Pre-loaded Teachers: 6 Junior Wing + 6 Senior Wing
  teachers: [
    // Junior Wing (Classes 6-9)
    { id: "TJ101", name: "Mrs. Sharma", tier: "Junior", subject: "Mathematics", email: "sharma.math@school.edu" },
    { id: "TJ102", name: "Mr. Verma", tier: "Junior", subject: "Science", email: "verma.sci@school.edu" },
    { id: "TJ103", name: "Ms. Anita", tier: "Junior", subject: "English", email: "anita.eng@school.edu" },
    { id: "TJ104", name: "Mr. Gupta", tier: "Junior", subject: "Social Science", email: "gupta.sst@school.edu" },
    { id: "TJ105", name: "Mrs. Neha", tier: "Junior", subject: "Hindi", email: "neha.hindi@school.edu" },
    { id: "TJ106", name: "Mr. Rajesh", tier: "Junior", subject: "Computer", email: "rajesh.comp@school.edu" },
    // Senior Wing (Classes 10-12)
    { id: "TS201", name: "Dr. R.K. Singh", tier: "Senior", subject: "Physics", email: "singh.phy@school.edu" },
    { id: "TS202", name: "Dr. Meenakshi", tier: "Senior", subject: "Chemistry", email: "meenakshi.chem@school.edu" },
    { id: "TS203", name: "Prof. Kapoor", tier: "Senior", subject: "Mathematics", email: "kapoor.math@school.edu" },
    { id: "TS204", name: "Dr. Roy", tier: "Senior", subject: "Biology", email: "roy.bio@school.edu" },
    { id: "TS205", name: "Mrs. D'Souza", tier: "Senior", subject: "English", email: "dsouza.eng@school.edu" },
    { id: "TS206", name: "Mr. Amit Kumar", tier: "Senior", subject: "Computer Science", email: "amit.cs@school.edu" }
  ],
  classes: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
  subjects: ["Mathematics", "Science", "Physics", "Chemistry", "Biology", "English", "Social Science", "Hindi", "Computer", "Computer Science"],
  attendanceHistory: [],
  masterTimetables: {}
};

let store = JSON.parse(localStorage.getItem("eduAdminDB")) || INITIAL_DATA;
function saveStore() {
  localStorage.setItem("eduAdminDB", JSON.stringify(store));
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];

/* ============================================================
   NAVIGATION & MOBILE DRAWER
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

  views.forEach(v => v.classList.toggle("active", v.id === `view-${viewName}`));

  navBtns.forEach(btn => {
    const text = btn.innerText.toLowerCase();
    btn.classList.toggle("active", text.includes(viewName.substring(0, 4)));
  });

  const titleMap = {
    dashboard: "Dashboard Overview",
    teachers: "Faculty & Teacher Management",
    attendance: "Daily Faculty Attendance",
    history: "Attendance Log History",
    classes: "Classes & Wings Configuration",
    timetable: "Dynamic Timetable & Proxy Engine"
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
   AUTH
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
  if (statAbsent) statAbsent.innerText = recordToday ? absentOrLeave : "0";
  if (statClasses) statClasses.innerText = totalC;

  const dashSummary = document.getElementById("dash-attendance-summary");
  if (dashSummary) {
    if (!recordToday) {
      dashSummary.innerHTML = `<p style="color:var(--text-muted); padding: 0.5rem 0;">No attendance marked for today (${today}). Click 'Mark Teacher Attendance' above.</p>`;
    } else {
      let rows = store.teachers.map(t => {
        const status = recordToday.records[t.id] || "Unmarked";
        const badgeClass = status === "Present" ? "badge-present" : (status === "Absent" ? "badge-absent" : "badge-leave");
        return `<tr><td><strong>${t.name}</strong> (${t.tier})</td><td><span class="badge ${badgeClass}">${status}</span></td></tr>`;
      }).join("");
      dashSummary.innerHTML = `<table class="data-table"><thead><tr><th>Teacher</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
  }
}

/* ============================================================
   TEACHERS DIRECTORY
   ============================================================ */
function renderTeachers() {
  const tbody = document.getElementById("teachers-table-body");
  if (!tbody) return;

  if (store.teachers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No faculty members available.</td></tr>`;
    return;
  }

  tbody.innerHTML = store.teachers.map(t => `
    <tr>
      <td><code>${t.id}</code></td>
      <td><strong>${t.name}</strong></td>
      <td><span class="badge ${t.tier === 'Junior' ? 'badge-junior' : 'badge-senior'}">${t.tier} Wing</span></td>
      <td>${t.subject}</td>
      <td>${t.email}</td>
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
  document.getElementById("teacher-tier").value = t.tier || "Junior";
  document.getElementById("teacher-subject").value = t.subject;
  document.getElementById("teacher-email").value = t.email;
  document.getElementById("teacher-modal-title").innerText = "Edit Teacher";
};

window.deleteTeacher = function(id) {
  if (confirm("Are you sure you want to remove this teacher?")) {
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
   DAILY ATTENDANCE
   ============================================================ */
function renderAttendance() {
  const dateInput = document.getElementById("attendance-date");
  const tbody = document.getElementById("attendance-table-body");
  if (!dateInput || !tbody) return;

  const selectedDate = dateInput.value;
  const existingLog = store.attendanceHistory.find(h => h.date === selectedDate);
  const records = existingLog ? existingLog.records : {};

  if (store.teachers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No teachers found.</td></tr>`;
    return;
  }

  tbody.innerHTML = store.teachers.map(t => {
    const status = records[t.id] || "Present";
    return `
      <tr>
        <td><strong>${t.name}</strong></td>
        <td><span class="badge ${t.tier === 'Junior' ? 'badge-junior' : 'badge-senior'}">${t.tier}</span> - ${t.subject}</td>
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
  alert(`✅ Attendance for ${date} saved! Timetable dynamic proxy is now updated.`);
  renderDashboard();
  renderTimetable();
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
  if (confirm("Clear all attendance logs?")) {
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
   SMART DYNAMIC TIMETABLE ENGINE (With Proxy / Substitution)
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

// Master Schedule Builder (Zero Clash + Tier Logic)
window.autoBuildAllClassesTimetable = function() {
  if (store.teachers.length === 0) return alert("Pehle Teachers add karein!");
  if (store.classes.length === 0) return alert("Pehle Classes add karein!");

  if (!confirm("Generate conflict-free master timetable for Classes 6 to 12?")) return;

  const juniorTeachers = store.teachers.filter(t => t.tier === "Junior");
  const seniorTeachers = store.teachers.filter(t => t.tier === "Senior");

  const newTimetables = {};
  store.classes.forEach(c => newTimetables[c] = {});

  DAYS.forEach((day, dayIdx) => {
    PERIODS.forEach((period, pIdx) => {
      const busyTeachersInSlot = new Set();

      store.classes.forEach((className, cIdx) => {
        const slotKey = `${day}-${period}`;
        
        // Determine wing (6-9 = Junior, 10-12 = Senior)
        const isJuniorClass = ["6", "7", "8", "9"].some(digit => className.includes(digit));
        const primaryPool = isJuniorClass ? (juniorTeachers.length ? juniorTeachers : store.teachers) 
                                          : (seniorTeachers.length ? seniorTeachers : store.teachers);

        let assigned = false;

        // Periodic natural free period (e.g. 1 in 7 periods)
        if ((dayIdx + pIdx + cIdx) % 6 === 0) {
          newTimetables[className][slotKey] = { subject: "Free Period", teacher: "Self Study" };
          return;
        }

        // Search available conflict-free teacher in primary wing
        for (let i = 0; i < primaryPool.length; i++) {
          const cand = primaryPool[(dayIdx * 2 + pIdx + cIdx + i) % primaryPool.length];
          if (!busyTeachersInSlot.has(cand.name)) {
            busyTeachersInSlot.add(cand.name);
            newTimetables[className][slotKey] = { subject: cand.subject, teacher: cand.name };
            assigned = true;
            break;
          }
        }

        // If no primary teacher is free, search across secondary wing
        if (!assigned) {
          for (let j = 0; j < store.teachers.length; j++) {
            const cand = store.teachers[j];
            if (!busyTeachersInSlot.has(cand.name)) {
              busyTeachersInSlot.add(cand.name);
              newTimetables[className][slotKey] = { subject: cand.subject, teacher: cand.name };
              assigned = true;
              break;
            }
          }
        }

        // If all teachers are occupied, assign free period
        if (!assigned) {
          newTimetables[className][slotKey] = { subject: "Free Period", teacher: "Self Study" };
        }
      });
    });
  });

  store.masterTimetables = newTimetables;
  saveStore();
  renderTimetable();
  alert("✅ Master conflict-free schedule generated for all classes!");
};

// Render Timetable (Calculates Dynamic Proxies Based on Today's Attendance)
function renderTimetable() {
  const select = document.getElementById("timetable-class-select");
  const tbody = document.getElementById("timetable-body");
  const titleDisplay = document.getElementById("timetable-title-display");
  if (!select || !tbody) return;

  const selectedClass = select.value;
  if (titleDisplay) titleDisplay.innerText = `Weekly Timetable — ${selectedClass || "Select Class"}`;

  if (!selectedClass) {
    tbody.innerHTML = `<tr><td colspan="9">Please add and select a class.</td></tr>`;
    return;
  }

  // Get Today's Absent Teachers
  const today = document.getElementById("attendance-date")?.value || new Date().toISOString().split("T")[0];
  const recordToday = store.attendanceHistory.find(r => r.date === today);
  const absentTeacherNames = new Set();

  if (recordToday) {
    store.teachers.forEach(t => {
      if (recordToday.records[t.id] === "Absent" || recordToday.records[t.id] === "On Leave") {
        absentTeacherNames.add(t.name);
      }
    });
  }

  const classData = store.masterTimetables[selectedClass] || {};

  tbody.innerHTML = DAYS.map(day => {
    const periodCols = PERIODS.map(period => {
      const slotKey = `${day}-${period}`;
      const assignment = classData[slotKey];

      if (!assignment) {
        return `<td class="slot-cell empty" onclick="openSlotModal('${day}', '${period}')">+ Assign</td>`;
      }

      const isFree = assignment.subject === "Free Period" || assignment.teacher === "Self Study";
      const isOriginalTeacherAbsent = absentTeacherNames.has(assignment.teacher);

      // Handle Proxy substitution if original teacher is absent
      if (isOriginalTeacherAbsent && !isFree) {
        // Find which teachers are already busy during this slot across all classes
        const busyInSlot = new Set();
        store.classes.forEach(c => {
          const otherSlot = store.masterTimetables[c]?.[slotKey];
          if (otherSlot && !absentTeacherNames.has(otherSlot.teacher) && otherSlot.teacher !== "Self Study") {
            busyInSlot.add(otherSlot.teacher);
          }
        });

        // 1. Check Junior Wing Free Teacher
        let proxyTeacher = store.teachers.find(t => t.tier === "Junior" && !absentTeacherNames.has(t.name) && !busyInSlot.has(t.name));

        // 2. Check Senior Wing Free Teacher
        if (!proxyTeacher) {
          proxyTeacher = store.teachers.find(t => t.tier === "Senior" && !absentTeacherNames.has(t.name) && !busyInSlot.has(t.name));
        }

        if (proxyTeacher) {
          return `
            <td class="slot-cell slot-proxy" onclick="openSlotModal('${day}', '${period}')">
              <span class="slot-subject">${assignment.subject}</span>
              <span class="slot-teacher"><span class="proxy-badge">Proxy</span> ${proxyTeacher.name}</span>
            </td>
          `;
        } else {
          return `
            <td class="slot-cell slot-free" onclick="openSlotModal('${day}', '${period}')">
              <span class="slot-subject">Free Period</span>
              <span class="slot-teacher">Self Study (Staff Absent)</span>
            </td>
          `;
        }
      }

      return `
        <td class="slot-cell ${isFree ? 'slot-free' : ''}" onclick="openSlotModal('${day}', '${period}')">
          <span class="slot-subject">${assignment.subject}</span>
          <span class="slot-teacher">${assignment.teacher}</span>
        </td>
      `;
    }).join("");

    return `<tr><th class="day-col"><strong>${day}</strong></th>${periodCols}</tr>`;
  }).join("");
}

// Single Class Timetable Builder
window.autoBuildSingleClassTimetable = function() {
  const selectedClass = document.getElementById("timetable-class-select").value;
  if (!selectedClass) return alert("Select a class first!");
  if (store.teachers.length === 0) return alert("Please add teachers first!");

  const isJuniorClass = ["6", "7", "8", "9"].some(digit => selectedClass.includes(digit));
  const pool = store.teachers.filter(t => isJuniorClass ? t.tier === "Junior" : t.tier === "Senior");
  const effectivePool = pool.length ? pool : store.teachers;

  const newMatrix = {};
  let pointer = 0;

  DAYS.forEach((day, dayIdx) => {
    PERIODS.forEach((period, pIdx) => {
      if ((dayIdx + pIdx) % 6 === 0) {
        newMatrix[`${day}-${period}`] = { subject: "Free Period", teacher: "Self Study" };
      } else {
        const t = effectivePool[pointer % effectivePool.length];
        newMatrix[`${day}-${period}`] = { subject: t.subject, teacher: t.name };
        pointer++;
      }
    });
  });

  if (!store.masterTimetables) store.masterTimetables = {};
  store.masterTimetables[selectedClass] = newMatrix;
  saveStore();
  renderTimetable();
  alert(`✅ Timetable generated for ${selectedClass}!`);
};

window.clearCurrentTimetable = function() {
  const selectedClass = document.getElementById("timetable-class-select").value;
  if (!selectedClass) return;
  if (confirm(`Clear all slots for ${selectedClass}?`)) {
    store.masterTimetables[selectedClass] = {};
    saveStore();
    renderTimetable();
  }
};

window.openSlotModal = function(day, period) {
  const selectedClass = document.getElementById("timetable-class-select").value;
  document.getElementById("slot-modal-title").innerText = `Assign (${day} - ${period})`;
  document.getElementById("slot-day").value = day;
  document.getElementById("slot-period").value = period;

  const subjSelect = document.getElementById("slot-subject");
  subjSelect.innerHTML = ["Free Period", ...store.subjects].map(s => `<option value="${s}">${s}</option>`).join("");

  const teachSelect = document.getElementById("slot-teacher");
  teachSelect.innerHTML = `
    <option value="Self Study">Self Study (Free)</option>
    ${store.teachers.map(t => `<option value="${t.name}">${t.name} (${t.tier} - ${t.subject})</option>`).join("")}
  `;

  const existing = store.masterTimetables[selectedClass]?.[`${day}-${period}`];
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

  if (store.masterTimetables[selectedClass]?.[`${day}-${period}`]) {
    delete store.masterTimetables[selectedClass][`${day}-${period}`];
    saveStore();
  }
  window.closeSlotModal();
  renderTimetable();
};

window.downloadTimetableImage = function() {
  const node = document.getElementById("timetable-capture-node");
  const selectedClass = document.getElementById("timetable-class-select").value || "Class";

  html2canvas(node, { scale: 2, backgroundColor: "#ffffff" }).then(canvas => {
    const link = document.createElement("a");
    link.download = `Timetable_${selectedClass.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
};

/* ============================================================
   PAGE INITIALIZATION
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

  // If no master timetable exists, generate once automatically
  if (!store.masterTimetables || Object.keys(store.masterTimetables).length === 0) {
    autoBuildAllClassesTimetable();
  } else {
    renderTimetable();
  }

  // Forms Binding
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
      const tier = document.getElementById("teacher-tier").value;
      const subject = document.getElementById("teacher-subject").value;
      const email = document.getElementById("teacher-email").value.trim();

      const existingIndex = store.teachers.findIndex(t => t.id === id);
      if (existingIndex > -1) {
        store.teachers[existingIndex] = { id, name, tier, subject, email };
      } else {
        store.teachers.push({ id, name, tier, subject, email });
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

      if (!store.masterTimetables[selectedClass]) store.masterTimetables[selectedClass] = {};
      store.masterTimetables[selectedClass][`${day}-${period}`] = { subject, teacher };

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

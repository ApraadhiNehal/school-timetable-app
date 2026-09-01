# 🏫 School Admin & Timetable Management Portal

A lightweight, serverless School Admin Dashboard, Teacher Attendance Register, and Timetable Management Application built purely with standard HTML5, CSS3, and modern Vanilla JavaScript.

## 🚀 Live Demo Deployment (GitHub Pages)

This project has **zero backend runtime dependencies** (no Node.js, Python, PHP, or SQL databases required). It runs entirely in any modern browser.

### Steps to Deploy:
1. Create a new GitHub repository (e.g., `school-timetable`).
2. Upload `index.html`, `style.css`, `script.js`, and `README.md` directly into the repository root.
3. On GitHub, navigate to **Settings** → **Pages**.
4. Under **Branch**, select `main` (or `master`) and directory `/root`.
5. Click **Save**.
6. Access your application immediately at `https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/`.

---

## 🔑 Demo Credentials
- **Username:** `admin`
- **Password:** `admin123`

---

## ✨ Features
- **Frontend Admin Authentication:** Login and session preservation using `sessionStorage`.
- **Teacher Directory:** Add, edit, list, and delete teachers with specific subject specializations.
- **Daily Attendance Tracker:** Mark teachers as Present, Absent, or On Leave with single-click quick actions.
- **Attendance History Log:** Track attendance percentages across dates stored persistently in the browser's `localStorage`.
- **Classes & Subjects Config:** Dynamically configure academic classes and course subjects.
- **Interactive Timetable Matrix:** Dynamic weekly period assignment with teacher and subject mapping.
- **Direct Browser Print:** Native `@media print` CSS layout for clean physical printouts.
- **Download as Image:** Export any class timetable into a high-resolution PNG image directly via client-side Canvas rendering.

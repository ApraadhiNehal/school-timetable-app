/* Smart School Timetable - main app logic with master weekly generator, daily dynamic proxy arrangements, and localStorage persistence */

const STORAGE_KEY = 'eduAdminDB_v1';
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const PERIODS = ['P1','P2','P3','P4','P5','P6','P7','P8'];

const DEFAULT_STORE = {
  teachers: [], // {id,name,subject,tier}
  classes: [],
  subjects: { junior: [], senior: [] },
  timetables: {},
  attendance: {},
  dynamic: {}
};

let store = loadStore();

function loadStore(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) return JSON.parse(raw); }
  catch(e){ console.error('load error',e); }
  const s = JSON.parse(JSON.stringify(DEFAULT_STORE));
  s.classes = ['Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
  s.subjects.junior = ['Math','Science','English','Social Science','Hindi','Computer'];
  s.subjects.senior = ['Physics','Chemistry','Mathematics','Biology','English','Computer Science'];
  return s;
}
function saveStore(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }

function el(id){ return document.getElementById(id); }
function isoDate(){ return new Date().toISOString().split('T')[0]; }
function weekdayFromDateString(dateStr){ const d=new Date(dateStr+'T00:00:00'); const idx=d.getDay(); return {1:'Monday',2:'Tuesday',3:'Wednesday',4:'Thursday',5:'Friday'}[idx]||null; }

function uid(prefix='T'){ return prefix + Math.floor(1000+Math.random()*8999); }

/* Seed default teachers per spec */
function seedDefaultTeachers(){ store.teachers = [];
  // Junior
  store.teachers.push({id:'J-MATH',name:'Junior Math Teacher',subject:'Math',tier:'junior'});
  store.teachers.push({id:'J-SCI',name:'Junior Science Teacher',subject:'Science',tier:'junior'});
  store.teachers.push({id:'J-ENG',name:'Junior English Teacher',subject:'English',tier:'junior'});
  store.teachers.push({id:'J-SOC',name:'Junior Social Science Teacher',subject:'Social Science',tier:'junior'});
  store.teachers.push({id:'J-HIN',name:'Junior Hindi Teacher',subject:'Hindi',tier:'junior'});
  store.teachers.push({id:'J-CS', name:'Junior Computer Teacher',subject:'Computer',tier:'junior'});
  // Senior
  store.teachers.push({id:'S-PHY',name:'Senior Physics Teacher',subject:'Physics',tier:'senior'});
  store.teachers.push({id:'S-CHE',name:'Senior Chemistry Teacher',subject:'Chemistry',tier:'senior'});
  store.teachers.push({id:'S-MAT',name:'Senior Mathematics Teacher',subject:'Mathematics',tier:'senior'});
  store.teachers.push({id:'S-BIO',name:'Senior Biology Teacher',subject:'Biology',tier:'senior'});
  store.teachers.push({id:'S-ENG',name:'Senior English Teacher',subject:'English',tier:'senior'});
  store.teachers.push({id:'S-CS', name:'Senior Computer Science Teacher',subject:'Computer Science',tier:'senior'});
  saveStore(); renderTeachersList(); alert('Default teachers seeded.');
}

/* Generate master weekly timetable */
function generateMasterWeeklyTimetable(){ if(!store.teachers.length) return alert('No teachers. Seed teachers first.');
  store.timetables = {};
  // map teachers by (tier,subject)
  const pools = {};
  store.teachers.forEach(t=>{ const key=`${t.tier}::${t.subject}`; pools[key]=pools[key]||[]; pools[key].push(t.id); });
  const poolIdx = {};

  store.classes.forEach((cls,clsIdx)=>{
    store.timetables[cls] = {};
    const clsNum = parseInt(cls.split(' ')[1],10);
    const tier = (clsNum>=10)?'senior':'junior';
    const subjList = store.subjects[tier];
    DAYS.forEach(day=>{
      store.timetables[cls][day] = {};
      PERIODS.forEach((period,pIdx)=>{
        const subj = subjList[(clsIdx + pIdx) % subjList.length];
        const key = `${tier}::${subj}`;
        const pool = pools[key] || [];
        if(pool.length===0){ store.timetables[cls][day][period] = {subject:subj, teacherId:null}; }
        else{ poolIdx[key] = poolIdx[key]||0; const tid = pool[ poolIdx[key] % pool.length ]; poolIdx[key]++; store.timetables[cls][day][period] = {subject:subj, teacherId:tid}; }
      });
    });
  });

  // resolve conflicts: ensure no teacher assigned to >1 class same day/period
  DAYS.forEach(day=>{ PERIODS.forEach(period=>{
    const assigned = {};
    store.classes.forEach(cls=>{
      const slot = store.timetables[cls][day][period];
      if(!slot || !slot.teacherId) return;
      if(!assigned[slot.teacherId]) assigned[slot.teacherId]=cls; else {
        // conflict - try to find alternative teacher in pool
        const subj=slot.subject; const clsNum = parseInt(cls.split(' ')[1],10); const tier=(clsNum>=10)?'senior':'junior';
        const alts = store.teachers.filter(t=>t.tier===tier && t.subject===subj && !Object.keys(assigned).includes(t.id)).map(t=>t.id);
        if(alts.length>0){ slot.teacherId = alts[0]; assigned[slot.teacherId]=cls; } else { slot.teacherId = null; }
      }
    });
  })});

  saveStore(); renderMasterPreview(); alert('Master timetable generated.');
}

/* Attendance */
function getAttendance(date){ store.attendance = store.attendance||{}; return store.attendance[date] || {}; }
function saveAttendance(date,records){ store.attendance = store.attendance||{}; store.attendance[date]=records; saveStore(); }

/* Dynamic / proxy recalculation for date */
function recalcDynamic(date){ const day = weekdayFromDateString(date); if(!day) return alert('Select a weekday (Mon-Fri)');
  store.dynamic = store.dynamic||{}; const dyn = {};
  // clone master for that day
  store.classes.forEach(cls=>{ dyn[cls]={}; const master = store.timetables?.[cls]?.[day]||{}; PERIODS.forEach(p=>{ const m=master[p]; dyn[cls][p]={subject:m?.subject||'(No)', teacherId:m?.teacherId||null, arrangement:false, arrTeacherId:null}; }); });

  const attendance = getAttendance(date);
  const present = new Set(store.teachers.filter(t=> (attendance[t.id]||'Present')==='Present').map(t=>t.id));
  // masterOccupied map
  const masterOccupied = {};
  store.classes.forEach(cls=>{ const master = store.timetables?.[cls]?.[day]||{}; PERIODS.forEach(p=>{ const m=master[p]; if(m && m.teacherId){ masterOccupied[m.teacherId]=masterOccupied[m.teacherId]||{}; masterOccupied[m.teacherId][p]=true; } }); });

  const dynamicBooked = {};
  store.classes.forEach(cls=>{ PERIODS.forEach(p=>{ const slot = dyn[cls][p]; const orig = slot.teacherId; if(!orig) return; const st = attendance[orig]||'Present'; if(st==='Present') return; // absentee
    // try find proxy: prefer same tier as original
    const origT = store.teachers.find(t=>t.id===orig); const prefTier = origT?.tier||null;
    // candidates: present, not booked in dynamic for this period, and free in master at that period
    const candidates = store.teachers.filter(t=>{
      if(!present.has(t.id)) return false; if(t.id===orig) return false; if(dynamicBooked[p] && dynamicBooked[p].has(t.id)) return false; const isFree = !(masterOccupied[t.id] && masterOccupied[t.id][p]); return isFree;
    });
    let chosen = null; if(prefTier) chosen = candidates.find(c=>c.tier===prefTier); if(!chosen && candidates.length) chosen = candidates[0];
    if(chosen){ slot.arrangement=true; slot.arrTeacherId=chosen.id; slot.teacherId=chosen.id; dynamicBooked[p]=dynamicBooked[p]||new Set(); dynamicBooked[p].add(chosen.id);} else { slot.teacherId=null; }
  })});

  store.dynamic[date]=dyn; saveStore(); renderTimetableForDate(date); alert('Dynamic timetable generated for ' + date);
}

/* Rendering */
function renderTeachersList(){ const container = el('teachersList'); if(!container) return; container.innerHTML=''; if(store.teachers.length===0){ container.innerHTML='<p class="muted">No teachers. Seed defaults.</p>'; return; }
  const date = el('attendanceDate').value || isoDate(); const att = getAttendance(date);
  store.teachers.forEach(t=>{ const status = att[t.id]||'Present'; const div = document.createElement('div'); div.className='teacher-card'; div.innerHTML=`<div class="teacher-info"><div><strong>${t.name}</strong> <small class="muted">[${t.tier}]</small></div><div class="muted">${t.subject} • ${t.id}</div></div><div class="att-buttons"><button data-tid="${t.id}" data-val="Present" class="btn">Present</button><button data-tid="${t.id}" data-val="Absent" class="btn btn-danger">Absent</button><button data-tid="${t.id}" data-val="On Leave" class="btn">On Leave</button></div><div style="min-width:90px;text-align:center"><div style="font-size:.9rem">${status}</div></div>`; container.appendChild(div); }); }

function renderMasterPreview(){ const head=el('masterHead'), body=el('masterBody'); if(!head||!body) return; head.innerHTML=''; body.innerHTML=''; const tr=document.createElement('tr'); tr.innerHTML='<th>Class / Day</th>'+PERIODS.map(p=>`<th>${p}</th>`).join(''); head.appendChild(tr);
  store.classes.forEach(cls=>{ DAYS.forEach(day=>{ const tr = document.createElement('tr'); tr.innerHTML = `<td class="class-name">${cls} • ${day}</td>` + PERIODS.map(p=>{ const m = store.timetables?.[cls]?.[day]?.[p]; if(!m || !m.teacherId) return `<td class="slot free"><span class="slot-sub">${m?.subject||'Free'}</span></td>`; const tn = store.teachers.find(t=>t.id===m.teacherId)?.name||m.teacherId; return `<td class="slot normal"><span class="slot-sub">${m.subject}</span><span class="slot-teacher">${tn}</span></td>`; }).join(''); body.appendChild(tr); }); }); }

function renderTimetableForDate(date){ const day = weekdayFromDateString(date); const title = el('timetableTitle'), th = el('ttHead'), tb = el('ttBody'); if(!th||!tb||!title) return; title.innerText = `Daily Timetable — ${date} ${day? '('+day+')': ''}`; th.innerHTML=''; const trh = document.createElement('tr'); trh.innerHTML = '<th>Class</th>' + PERIODS.map(p=>`<th>${p}</th>`).join(''); th.appendChild(trh);
  const dynamic = store.dynamic?.[date]||null; const clsFilter = el('classSelect').value||'all'; const classesToShow = (clsFilter==='all')?store.classes:[clsFilter]; tb.innerHTML=''; classesToShow.forEach(cls=>{ const tr=document.createElement('tr'); tr.innerHTML = `<td class="class-name">${cls}</td>` + PERIODS.map(p=>{ let slot=null; if(dynamic && dynamic[cls] && dynamic[cls][p]) slot = dynamic[cls][p]; else { const master = store.timetables?.[cls]?.[day]?.[p]; slot = { subject: master?.subject||'(No)', teacherId: master?.teacherId||null, arrangement:false, arrTeacherId:null }; } const teacher = slot.teacherId ? (store.teachers.find(t=>t.id===slot.teacherId)?.name || slot.teacherId) : null; if(!slot.teacherId) return `<td class="slot free"><span class="slot-sub">Free Period</span><span class="slot-teacher muted">Self Study</span></td>`; if(slot.arrangement){ const arrName = store.teachers.find(t=>t.id===slot.arrTeacherId)?.name||slot.arrTeacherId; return `<td class="slot arr"><span class="slot-sub">${slot.subject}</span><span class="slot-teacher">${arrName} <span class="badge badge-arr">Arrangement</span></span></td>`; } return `<td class="slot normal"><span class="slot-sub">${slot.subject}</span><span class="slot-teacher">${teacher}</span></td>`; }).join(''); tb.appendChild(tr); }); }

/* UI wiring */
function populateClassSelect(){ const cs=el('classSelect'); cs.innerHTML='<option value="all">All Classes (rows)</option>'; store.classes.forEach(c=>{ const o=document.createElement('option'); o.value=c; o.text=c; cs.appendChild(o); }); }
function populateDates(){ const v=el('viewDate'), a=el('attendanceDate'); const today=isoDate(); if(!v.value) v.value=today; if(!a.value) a.value=today; updateViewDay(); }
function updateViewDay(){ const v=el('viewDate'); const day = weekdayFromDateString(v.value); const sel = el('viewDay'); sel.innerHTML=''; if(day){ const o=document.createElement('option'); o.value=day; o.text=day; sel.appendChild(o); sel.disabled=false; } else { sel.disabled=true; sel.innerHTML='<option value="">(Select a weekday)</option>'; } }

function downloadPNG(){ const node = el('tableScroll') || el('timetableTable') || document.body; if(typeof html2canvas!=='function') return alert('html2canvas missing'); html2canvas(node,{scale:2,backgroundColor:'#ffffff'}).then(canvas=>{ const link=document.createElement('a'); link.download=`Timetable_${el('viewDate').value||isoDate()}.png`; link.href=canvas.toDataURL('image/png'); link.click(); }).catch(e=>alert('Capture failed')); }

function initUI(){ el('loginForm').addEventListener('submit',(e)=>{ e.preventDefault(); const u=el('username').value, p=el('password').value; if(u==='admin'&&p==='admin123'){ el('authPanel').classList.add('hidden'); el('app').classList.remove('hidden'); el('userBadge').innerText='Admin'; populateClassSelect(); populateDates(); renderTeachersList(); renderMasterPreview(); renderTimetableForDate(el('viewDate').value||isoDate()); } else alert('Invalid demo credentials'); });
  el('seedTeachers').addEventListener('click', seedDefaultTeachers);
  el('clearTeachers').addEventListener('click', ()=>{ if(!confirm('Clear all teachers and timetables?')) return; store.teachers=[]; store.timetables={}; store.dynamic={}; saveStore(); renderTeachersList(); renderMasterPreview(); renderTimetableForDate(el('viewDate').value||isoDate()); });
  el('viewDate').addEventListener('change', ()=>{ updateViewDay(); renderTimetableForDate(el('viewDate').value); }); el('attendanceDate').addEventListener('change', ()=> renderTeachersList()); el('classSelect').addEventListener('change', ()=> renderTimetableForDate(el('viewDate').value)); el('generateMaster').addEventListener('click', ()=>{ if(!store.teachers.length) return alert('Seed teachers first'); if(!confirm('Generate master weekly timetable?')) return; generateMasterWeeklyTimetable(); }); el('saveAttendance').addEventListener('click', ()=>{ const date=el('attendanceDate').value||isoDate(); const att = getAttendance(date); saveAttendance(date, att); recalcDynamic(date); renderTeachersList(); renderMasterPreview(); }); el('recalcBtn').addEventListener('click', ()=>{ const date = el('viewDate').value || isoDate(); recalcDynamic(date); }); el('downloadPng').addEventListener('click', downloadPNG); el('printBtn').addEventListener('click', ()=>window.print()); document.getElementById('teachersList').addEventListener('click',(e)=>{ const b=e.target.closest('button[data-tid]'); if(!b) return; const tid=b.dataset.tid, val=b.dataset.val; const date = el('attendanceDate').value||isoDate(); const att = getAttendance(date); att[tid]=val; saveAttendance(date,att); renderTeachersList(); });
}

document.addEventListener('DOMContentLoaded', ()=>{ if(!el('viewDate').value) el('viewDate').value = isoDate(); if(!el('attendanceDate').value) el('attendanceDate').value = isoDate(); initUI(); });

window._store = store; window.generateMasterWeeklyTimetable = generateMasterWeeklyTimetable; window.recalcDynamic = recalcDynamic; window.seedDefaultTeachers = seedDefaultTeachers;
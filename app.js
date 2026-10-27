const STORAGE_KEYS = {
  students: 'inst_students_v1',
  courses: 'inst_courses_v1',
  attendance: 'inst_attendance_v1'
};

const DEFAULT_COURSES = [
  { name: 'AI/ML', duration: '6 months', fee: 32000 },
  { name: 'Python', duration: '45 days', fee: 10000 },
  { name: 'Data Science', duration: '6 months', fee: 32000 },
  { name: 'Data Analyst', duration: '3 months', fee: 18000 },
  { name: 'Computer Basics', duration: '3 months', fee: 6000 },
  { name: 'Computer Typing', duration: '45 days', fee: 1000 },
  { name: 'Digital Marketing', duration: '3 months', fee: 18000 },
  { name: 'Full Stack Development', duration: '6 months', fee: 32000 }
];

const $ = (id) => document.getElementById(id);
const today = (() => {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
})();

let students = [];
let courses = [];
let attendance = {};
let editingCourse = -1;

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeString(value) {
  return String(value ?? '').trim();
}

function showToast(message, isError = false) {
  const container = $('toast');
  if (!container) return window.alert(message);

  container.textContent = message;
  container.classList.toggle('error', isError);
  container.classList.add('show');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => container.classList.remove('show'), 2600);
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeCourse(course) {
  return {
    name: safeString(course && course.name || '').replace(/\s+/g, ' '),
    duration: safeString(course && course.duration || ''),
    fee: Math.max(0, safeNumber(course && course.fee, 0))
  };
}

function normalizeStudent(student) {
  const normalized = {
    id: safeString(student && student.id || ''),
    name: safeString(student && student.name || ''),
    phone: safeString(student && student.phone || ''),
    email: safeString(student && student.email || ''),
    address: safeString(student && student.address || ''),
    degree: safeString(student && student.degree || ''),
    college: safeString(student && student.college || ''),
    course: safeString(student && student.course || ''),
    batch: safeString(student && student.batch || ''),
    admission: safeDate(student && student.admission || ''),
    start: safeDate(student && student.start || ''),
    end: safeDate(student && student.end || ''),
    status: safeString(student && student.status || 'Active') || 'Active',
    total: Math.max(0, safeNumber(student && student.total, 0)),
    discount: Math.max(0, safeNumber(student && student.discount, 0)),
    plan: safeString(student && student.plan || 'Full Payment') || 'Full Payment',
    emi: Math.max(0, safeNumber(student && student.emi, 0)),
    frequency: safeString(student && student.frequency || 'Monthly') || 'Monthly',
    due: safeDate(student && student.due || ''),
    method: safeString(student && student.method || 'UPI') || 'UPI',
    emergency: safeString(student && student.emergency || ''),
    notes: safeString(student && student.notes || ''),
    payments: Array.isArray(student && student.payments) ? student.payments.map((payment) => ({
      amount: Math.max(0, safeNumber(payment && payment.amount, 0)),
      date: safeDate(payment && payment.date || today),
      method: safeString(payment && payment.method || 'UPI') || 'UPI'
    })).filter((payment) => payment.amount > 0) : []
  };

  normalized.total = Math.max(normalized.total, normalized.payments.reduce((sum, item) => sum + item.amount, 0));
  return normalized;
}

function loadFromStorage() {
  try {
    const rawStudents = localStorage.getItem(STORAGE_KEYS.students);
    const rawCourses = localStorage.getItem(STORAGE_KEYS.courses);
    const rawAttendance = localStorage.getItem(STORAGE_KEYS.attendance);

    const storedStudents = JSON.parse(rawStudents || '[]');
    const storedCourses = JSON.parse(rawCourses || 'null');
    const storedAttendance = JSON.parse(rawAttendance || '{}');

    students = Array.isArray(storedStudents) ? storedStudents.map(normalizeStudent) : [];
    courses = Array.isArray(storedCourses) ? storedCourses.map(normalizeCourse) : [...DEFAULT_COURSES];
    attendance = isPlainObject(storedAttendance) ? storedAttendance : {};

    if (!courses.length) courses = [...DEFAULT_COURSES];
  } catch (error) {
    console.error('Storage load failed:', error);
    students = [];
    courses = [...DEFAULT_COURSES];
    attendance = {};
    showToast('Saved data could not be loaded. A fresh dataset has been created.', true);
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(students));
    localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(courses));
    localStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(attendance));
    return true;
  } catch (error) {
    console.error('Storage save failed:', error);
    showToast('Data could not be saved in storage. Please export a backup and free up browser space.', true);
    return false;
  }
}

function safeDate(value) {
  if (!value) return '';

  const v = safeString(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const d = new Date(v + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? '' : v;
  }

  const match = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const a = Number(match[1]);
    const b = Number(match[2]);
    const y = Number(match[3]);
    let day = a;
    let month = b;

    if (a <= 12 && b > 12) {
      day = b;
      month = a;
    }

    const d = new Date(Date.UTC(y, month - 1, day));
    if (d.getUTCFullYear() === y && d.getUTCMonth() === month - 1 && d.getUTCDate() === day) {
      return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return '';
}

function esc(s) {
  return safeString(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function money(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(safeNumber(n, 0));
}

function courseName(student) {
  return student.course || '—';
}

function paid(student) {
  return (student.payments || []).reduce((sum, payment) => sum + safeNumber(payment.amount, 0), 0);
}

function total(student) {
  return Math.max(0, safeNumber(student.total, 0) - safeNumber(student.discount, 0));
}

function balance(student) {
  return Math.max(0, total(student) - paid(student));
}

function table(headers, rows) {
  if (!rows.length) return '<div class="empty">No records found.</div>';
  return '<div class="tablewrap"><table><thead><tr>' + headers.map((header) => '<th>' + header + '</th>').join('') + '</tr></thead><tbody>' + rows.map((row) => '<tr>' + row.map((cell) => '<td>' + cell + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
}

function refreshSelectors() {
  const options = courses.map((course) => `<option value="${esc(course.name)}">${esc(course.name)}</option>`).join('');
  const studentCourse = $('sCourse');
  const courseFilter = $('courseFilter');
  const attendanceCourse = $('attCourse');

  if (studentCourse) {
    const current = studentCourse.value;
    studentCourse.innerHTML = '<option value="">Select course</option>' + options;
    studentCourse.value = courses.some((course) => course.name === current) ? current : '';
  }

  if (courseFilter) {
    const previous = courseFilter.value;
    courseFilter.innerHTML = '<option value="">All courses</option>' + options;
    courseFilter.value = courses.some((course) => course.name === previous) ? previous : '';
  }

  if (attendanceCourse) {
    const previous = attendanceCourse.value;
    attendanceCourse.innerHTML = '<option value="">All courses</option>' + options;
    attendanceCourse.value = courses.some((course) => course.name === previous) ? previous : '';
  }
}

function showPage(page) {
  document.querySelectorAll('.page').forEach((node) => node.classList.add('hidden'));
  const target = $('page-' + page);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav').forEach((node) => node.classList.toggle('active', node.dataset.page === page));
  const labels = {
    dashboard: 'Dashboard',
    students: 'Students',
    courses: 'Courses',
    attendance: 'Attendance',
    fees: 'Fees & EMI'
  };

  if ($('pageTitle')) $('pageTitle').textContent = labels[page] || 'Dashboard';
  if (page === 'dashboard') renderDashboard();
  if (page === 'students') renderStudents();
  if (page === 'courses') renderCourses();
  if (page === 'attendance') {
    renderAttendance();
    renderAttendanceSummary();
  }
  if (page === 'fees') renderFees();
}

function renderDashboard() {
  if (!$('mStudents')) return;

  $('mStudents').textContent = String(students.length);
  $('mActive').textContent = String(students.filter((student) => student.status === 'Active').length);
  $('mCollected').textContent = money(students.reduce((sum, student) => sum + paid(student), 0));
  $('mPending').textContent = money(students.reduce((sum, student) => sum + balance(student), 0));

  if (!students.length) {
    $('recentTable').innerHTML = '<div class="empty">No students added yet. Click “Add Student” to get started.</div>';
    return;
  }

  $('recentTable').innerHTML = table(
    ['Name', 'Course', 'Phone', 'Fees Paid', 'Balance', 'Status'],
    students.slice(-6).reverse().map((student) => [
      esc(student.name),
      esc(courseName(student)),
      esc(student.phone),
      money(paid(student)),
      money(balance(student)),
      `<span class="pill ${balance(student) > 0 ? 'pending' : ''}">${balance(student) > 0 ? 'Fees Pending' : esc(student.status)}</span>`
    ])
  );
}

function renderStudents() {
  const searchField = $('studentSearch');
  const query = safeString(searchField && searchField.value).toLowerCase();
  const courseFilter = $('courseFilter') ? $('courseFilter').value : '';

  const list = students.filter((student) => {
    const matchesCourse = !courseFilter || student.course === courseFilter;
    const haystack = [student.name, student.phone, student.email, student.course, student.degree].join(' ').toLowerCase();
    return matchesCourse && haystack.includes(query);
  });

  $('studentsTable').innerHTML = table(
    ['#', 'Student', 'Phone / Gmail', 'Course & Batch', 'Qualification', 'Fees', 'Status', 'Actions'],
    list.map((student, index) => [
      String(index + 1),
      `<b>${esc(student.name)}</b><br><small>${esc(student.address || 'Address not added')}</small>`,
      `${esc(student.phone)}<br><small>${esc(student.email || 'No email')}</small>`,
      `${esc(student.course)}<br><small>${esc(student.batch || '')}</small>`,
      `${esc(student.degree || '—')}<br><small>${esc(student.college || '')}</small>`,
      `${money(paid(student))} / ${money(total(student))}<br><small>Due: ${money(balance(student))}</small>`,
      `<span class="pill ${balance(student) > 0 ? 'pending' : ''}">${balance(student) > 0 ? 'Pending' : 'Paid'}</span>`,
      `<div class="actions"><button class="smallbtn" type="button" onclick="openStudent('${student.id}')">✎ Edit</button><button class="smallbtn del" type="button" onclick="deleteStudent('${student.id}')">🗑</button></div>`
    ])
  );
}

function openStudent(id = '') {
  const form = $('studentForm');
  if (form) form.reset();
  $('studentId').value = '';
  $('sAdmission').value = today;
  $('paymentArea').classList.add('hidden');
  $('modalTitle').textContent = id ? 'Edit Student' : 'Add Student';
  refreshSelectors();

  if (id) {
    const student = students.find((item) => item.id === id);
    if (!student) return;

    $('studentId').value = student.id;
    const map = {
      sName: 'name',
      sPhone: 'phone',
      sEmail: 'email',
      sAddress: 'address',
      sDegree: 'degree',
      sCollege: 'college',
      sCourse: 'course',
      sBatch: 'batch',
      sAdmission: 'admission',
      sStart: 'start',
      sEnd: 'end',
      sStatus: 'status',
      sTotal: 'total',
      sPlan: 'plan',
      sMethod: 'method',
      sEmergency: 'emergency'
    };

    Object.entries(map).forEach(([fieldId, fieldKey]) => {
      const value = student[fieldKey] ?? '';
      const element = $(fieldId);
      if (!element) return;
      element.value = ['sAdmission', 'sStart', 'sEnd'].includes(fieldId) ? safeDate(value) : value;
    });

    $('paymentArea').classList.remove('hidden');
    renderPaymentHistory();
  }

  $('studentModal').classList.remove('hidden');
}

function closeStudent() {
  $('studentModal').classList.add('hidden');
}

function validateStudentPayload(data) {
  if (!data.name || !data.phone || !data.course || !data.admission) {
    showToast('Name, phone, course and admission date are required.', true);
    return false;
  }

  if (!/^[+\d()\-\s]{7,}$/.test(data.phone)) {
    showToast('Please enter a valid phone number.', true);
    return false;
  }

  if (data.start && data.admission && data.start < data.admission) {
    showToast('Course start date cannot be before admission date.', true);
    return false;
  }

  if (data.end && data.start && data.end < data.start) {
    showToast('Course end date cannot be before the start date.', true);
    return false;
  }

  return true;
}

function saveStudent(event) {
  event.preventDefault();

  const studentId = $('studentId').value;
  const existingStudent = studentId ? students.find((student) => student.id === studentId) : null;

  const data = {
    name: safeString($('sName').value),
    phone: safeString($('sPhone').value),
    email: safeString($('sEmail').value),
    address: safeString($('sAddress').value),
    degree: safeString($('sDegree').value),
    college: safeString($('sCollege').value),
    course: safeString($('sCourse').value),
    batch: safeString($('sBatch').value),
    admission: safeDate($('sAdmission').value),
    start: safeDate($('sStart').value),
    end: safeDate($('sEnd').value),
    status: safeString($('sStatus').value) || 'Active',
    total: safeNumber($('sTotal').value, 0),
    discount: existingStudent ? existingStudent.discount : 0,
    plan: safeString($('sPlan').value) || 'Full Payment',
    emi: existingStudent ? existingStudent.emi : 0,
    frequency: existingStudent ? existingStudent.frequency : 'Monthly',
    due: existingStudent ? existingStudent.due : '',
    method: safeString($('sMethod').value) || 'UPI',
    emergency: safeString($('sEmergency').value),
    notes: existingStudent ? existingStudent.notes : '',
    payments: existingStudent ? existingStudent.payments : []
  };

  if (!validateStudentPayload(data)) return;

  if (existingStudent) {
    Object.assign(existingStudent, data);
  } else {
    const student = {
      ...data,
      id: window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      payments: []
    };

    students.push(student);
  }

  if (!persist()) return;
  closeStudent();
  renderAll();
  showToast(existingStudent ? 'Student updated successfully.' : 'Student added successfully.');
}

function deleteStudent(id) {
  const student = students.find((item) => item.id === id);
  if (!student) return;

  if (!window.confirm(`Delete student ${student.name}? This cannot be undone without a backup export.`)) return;

  students = students.filter((item) => item.id !== id);
  if (persist()) {
    renderAll();
    showToast('Student deleted.');
  }
}

function addPayment() {
  const student = students.find((item) => item.id === $('studentId').value);
  const amount = safeNumber($('pAmount').value, 0);

  if (!student || amount <= 0) {
    showToast('Enter a valid payment amount.', true);
    return;
  }

  if (amount > balance(student) && !window.confirm('This payment exceeds the remaining balance. Record it anyway?')) {
    return;
  }

  student.payments = student.payments || [];
  student.payments.push({
    amount,
    date: safeDate($('pDate').value) || today,
    method: safeString($('pMethod').value) || 'UPI'
  });

  if (persist()) {
    $('pAmount').value = '';
    renderPaymentHistory();
    renderAll();
    showToast('Payment recorded successfully.');
  }
}

function renderPaymentHistory() {
  const student = students.find((item) => item.id === $('studentId').value);
  if (!student) return;

  const payments = (student.payments || []).slice().reverse();
  $('paymentHistory').innerHTML = table(['Date', 'Amount', 'Method'], payments.map((payment) => [
    esc(payment.date),
    money(payment.amount),
    esc(payment.method)
  ]));
}

function saveCourse() {
  const name = safeString($('courseName').value);
  if (!name) {
    showToast('Enter a course name.', true);
    return;
  }

  const course = {
    name,
    duration: safeString($('courseDuration').value),
    fee: Math.max(0, safeNumber($('courseFee').value, 0))
  };

  const existingIndex = courses.findIndex((item) => item.name.toLowerCase() === name.toLowerCase());
  if (editingCourse >= 0) {
    const previousName = courses[editingCourse].name;
    courses[editingCourse] = course;
    students.forEach((student) => {
      if (student.course === previousName) student.course = name;
    });
    editingCourse = -1;
  } else if (existingIndex >= 0) {
    if (!window.confirm('A course with this name already exists. Update its details?')) return;
    courses[existingIndex] = course;
  } else {
    courses.push(course);
  }

  if (!persist()) return;
  clearCourseForm();
  renderAll();
  showToast('Course saved successfully.');
}

function clearCourseForm() {
  editingCourse = -1;
  $('courseName').value = '';
  $('courseDuration').value = '';
  $('courseFee').value = '';
}

function renderCourses() {
  $('coursesTable').innerHTML = table(
    ['Course', 'Duration', 'Standard Fees', 'Actions'],
    courses.map((course, index) => [
      esc(course.name),
      esc(course.duration),
      money(course.fee),
      `<div class="actions"><button class="smallbtn" type="button" onclick="editCourse(${index})">✎ Edit</button><button class="smallbtn del" type="button" onclick="deleteCourse(${index})">🗑</button></div>`
    ])
  );
}

function editCourse(index) {
  editingCourse = index;
  const course = courses[index];
  $('courseName').value = course.name;
  $('courseDuration').value = course.duration;
  $('courseFee').value = course.fee;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteCourse(index) {
  const course = courses[index];
  if (!course) return;

  if (students.some((student) => student.course === course.name)) {
    showToast('Students are enrolled in this course. Change their course before deleting it.', true);
    return;
  }

  if (!window.confirm(`Delete course ${course.name}?`)) return;

  courses.splice(index, 1);
  if (persist()) {
    renderAll();
    showToast('Course deleted.');
  }
}

function renderAttendance() {
  const date = safeDate($('attDate').value) || today;
  const course = $('attCourse') ? $('attCourse').value : '';
  const list = students.filter((student) => student.status === 'Active' && (!course || student.course === course));
  const records = attendance[date] || {};

  $('attendanceTable').innerHTML = table(
    ['Student', 'Course', 'Phone', 'Attendance'],
    list.map((student) => {
      const status = records[student.id] || '';
      return [
        esc(student.name),
        esc(student.course),
        esc(student.phone),
        `<select data-att-id="${student.id}"><option value="">Not marked</option><option ${status === 'Present' ? 'selected' : ''}>Present</option><option ${status === 'Absent' ? 'selected' : ''}>Absent</option><option ${status === 'Leave' ? 'selected' : ''}>Leave</option></select>`
      ];
    })
  );

  renderAttendanceSummary();
}

function saveAttendance() {
  const date = safeDate($('attDate').value) || today;
  attendance[date] = attendance[date] || {};

  document.querySelectorAll('[data-att-id]').forEach((element) => {
    const id = element.dataset.attId;
    if (element.value) attendance[date][id] = element.value;
    else delete attendance[date][id];
  });

  if (persist()) {
    renderAttendanceSummary();
    showToast('Attendance saved for ' + date + '.');
  }
}

function renderAttendanceSummary() {
  const dates = Object.keys(attendance).sort().reverse();
  if (!dates.length) {
    $('attendanceSummary').innerHTML = '<div class="empty">No attendance records yet.</div>';
    return;
  }

  $('attendanceSummary').innerHTML = table(
    ['Date', 'Present', 'Absent', 'Leave', 'Marked'],
    dates.slice(0, 30).map((date) => {
      const values = Object.values(attendance[date]);
      return [
        esc(date),
        values.filter((value) => value === 'Present').length,
        values.filter((value) => value === 'Absent').length,
        values.filter((value) => value === 'Leave').length,
        values.length
      ];
    })
  );
}

function renderFees() {
  const searchField = $('feeSearch');
  const query = safeString(searchField && searchField.value).toLowerCase();
  const status = $('feeStatus') ? $('feeStatus').value : '';

  const list = students.filter((student) => {
    const matchesSearch = [student.name, student.course, student.phone].join(' ').toLowerCase().includes(query);
    const matchesStatus = !status || (status === 'Paid' ? balance(student) === 0 : balance(student) > 0);
    return matchesSearch && matchesStatus;
  });

  $('feesTable').innerHTML = table(
    ['Student', 'Course', 'Plan', 'Total Fees', 'Paid', 'Balance', 'Next Due', 'EMI', 'Status', 'Action'],
    list.map((student) => [
      esc(student.name),
      esc(student.course),
      esc(student.plan || 'Full Payment'),
      money(total(student)),
      money(paid(student)),
      money(balance(student)),
      esc(student.due || '—'),
      student.emi ? money(student.emi) + ' / ' + esc(student.frequency || 'Monthly') : '—',
      `<span class="pill ${balance(student) > 0 ? 'pending' : ''}">${balance(student) > 0 ? 'Pending' : 'Paid'}</span>`,
      `<button class="smallbtn" type="button" onclick="openStudent('${student.id}')">Edit / Pay</button>`
    ])
  );
}

function downloadExcelTemplate() {
  if (typeof XLSX === 'undefined') {
    showToast('Excel library is not available. Reload the page with internet access and try again.', true);
    return;
  }

  const sample = [{
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul@gmail.com',
    address: 'Sector 32, Chandigarh',
    degree: 'BCA',
    college: 'Example University',
    course: 'Python',
    batch: 'Morning 10 AM',
    admission: today,
    start: today,
    end: '',
    status: 'Active',
    total: 10000,
    discount: 0,
    plan: 'EMI',
    emi: 3000,
    frequency: 'Monthly',
    due: '',
    initialPaid: 2000,
    method: 'UPI',
    emergency: '',
    notes: 'Replace this sample row with actual details'
  }];

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(sample);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Students');
  XLSX.writeFile(workbook, 'student_import_template.xlsx');
}

function importExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    showToast('Excel import requires internet access to load the SheetJS library.', true);
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const workbook = XLSX.read(reader.result, { type: 'array', cellDates: true });
      const sheet = workbook.Sheets['Students'] || workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

      if (!rows.length) {
        showToast('The Excel sheet is empty.', true);
        return;
      }

      const normalizeHeader = (value) => String(value || '').trim().toLowerCase().replace(/[\s/_-]+/g, '');
      const getValue = (row, ...keys) => {
        for (const key of keys) {
          const normalizedKey = normalizeHeader(key);
          const match = Object.keys(row).find((header) => normalizeHeader(header) === normalizedKey);
          if (match !== undefined) return row[match];
        }
        return '';
      };

      const imported = [];
      const errors = [];

      rows.forEach((row, index) => {
        const name = String(getValue(row, 'name', 'full name', 'student name')).trim();
        const phone = String(getValue(row, 'phone', 'phone number', 'mobile')).trim();
        const course = String(getValue(row, 'course', 'course name')).trim();

        if (!name || !phone || !course) {
          errors.push(`Row ${index + 2}: Name, phone and course are required.`);
          return;
        }

        const student = {
          id: window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + index),
          name,
          phone,
          email: String(getValue(row, 'email', 'gmail') || '').trim(),
          address: String(getValue(row, 'address') || '').trim(),
          degree: String(getValue(row, 'degree', 'qualification', 'highest qualification') || '').trim(),
          college: String(getValue(row, 'college', 'university') || '').trim(),
          course,
          batch: String(getValue(row, 'batch', 'batch timing') || '').trim(),
          admission: safeDate(getValue(row, 'admission', 'admission date')) || today,
          start: safeDate(getValue(row, 'start', 'course start date')) || '',
          end: safeDate(getValue(row, 'end', 'course end date')) || '',
          status: String(getValue(row, 'status') || 'Active'),
          total: Math.max(0, Number(getValue(row, 'total', 'total fees', 'fees') || 0)),
          discount: Math.max(0, Number(getValue(row, 'discount') || 0)),
          plan: String(getValue(row, 'plan', 'payment plan') || 'Full Payment'),
          emi: Number(getValue(row, 'emi', 'emi amount') || 0),
          frequency: String(getValue(row, 'frequency', 'emi frequency') || 'Monthly'),
          due: safeDate(getValue(row, 'due', 'next due date')) || '',
          method: String(getValue(row, 'method', 'payment method') || 'UPI'),
          emergency: String(getValue(row, 'emergency', 'emergency contact') || ''),
          notes: String(getValue(row, 'notes') || ''),
          payments: []
        };

        const initialPaid = Number(getValue(row, 'initialPaid', 'initial paid', 'amount paid') || 0);
        if (initialPaid > 0) student.payments.push({ amount: initialPaid, date: today, method: student.method });

        imported.push(student);
      });

      if (!imported.length) {
        showToast('No valid rows were found. Name, phone and course are required.\n' + errors.slice(0, 8).join('\n'), true);
        return;
      }

      if (!window.confirm(`Valid students: ${imported.length}\nSkipped rows: ${errors.length}\n\nImporting will not delete existing records. Continue?`)) return;

      students.push(...imported);
      if (persist()) {
        renderAll();
        showToast(`Import complete: ${imported.length} students added.` + (errors.length ? `\nSkipped ${errors.length} row(s).` : ''));
      }
    } catch (error) {
      console.error('Excel import failed:', error);
      showToast('The Excel file could not be read. Please try a valid .xlsx, .xls or .csv file.', true);
    } finally {
      event.target.value = '';
    }
  };

  reader.readAsArrayBuffer(file);
}

function exportBackup() {
  const payload = { students, courses, attendance };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'institute-dashboard-backup.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      if (!Array.isArray(payload.students) || !Array.isArray(payload.courses)) throw new Error('Invalid backup structure');
      if (!window.confirm('Importing will replace all current students, courses and attendance. Continue?')) return;

      students = payload.students.map(normalizeStudent);
      courses = payload.courses.map(normalizeCourse);
      attendance = isPlainObject(payload.attendance) ? payload.attendance : {};

      if (!persist()) return;
      renderAll();
      showToast('Backup imported successfully.');
    } catch (error) {
      console.error('Backup import failed:', error);
      showToast('Invalid backup JSON file.', true);
    } finally {
      event.target.value = '';
    }
  };

  reader.readAsText(file);
}

function renderAll() {
  refreshSelectors();
  renderDashboard();
  renderStudents();
  renderCourses();
  renderAttendance();
  renderAttendanceSummary();
  renderFees();
}

function bindTopLevelActions() {
  document.querySelectorAll('.nav').forEach((button) => {
    button.addEventListener('click', () => showPage(button.dataset.page));
  });
}

function init() {
  const dateInputs = [$('attDate'), $('pDate')].filter(Boolean);
  dateInputs.forEach((input) => {
    input.value = today;
  });

  loadFromStorage();
  bindTopLevelActions();
  renderAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

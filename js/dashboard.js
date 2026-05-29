/**
 * dashboard.js — Student & Admin dashboard logic
 */

// ── Auth guard ──
const userRaw = sessionStorage.getItem('user');
if (!userRaw) window.location.href = 'index.html';

const currentUser = JSON.parse(userRaw);
let statusChart   = null;
let activeComplaintId = null;

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  // Populate navbar
  document.getElementById('navUser').textContent = `👤 ${currentUser.name}`;
  document.getElementById('navRole').textContent = currentUser.role;

  if (currentUser.role === 'student') {
    document.getElementById('studentView').classList.remove('hidden');
    loadMyComplaints();
  } else if (currentUser.role === 'admin') {
    document.getElementById('adminView').classList.remove('hidden');
    loadAllComplaints();
  }
});

// ── Logout ──
function logout() {
  sessionStorage.removeItem('user');
  window.location.href = 'index.html';
}

/* ============================================================
   STUDENT — Submit Complaint
   ============================================================ */
async function submitComplaint(e) {
  e.preventDefault();
  const title   = document.getElementById('compTitle').value.trim();
  const desc    = document.getElementById('compDesc').value.trim();
  const errEl   = document.getElementById('complaintError');
  const sucEl   = document.getElementById('complaintSuccess');
  const btn     = e.target.querySelector('button[type="submit"]');

  errEl.classList.add('hidden');
  sucEl.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  try {
    await API.submitComplaint(title, desc, currentUser.id);
    sucEl.textContent = '✅ Complaint submitted successfully!';
    sucEl.classList.remove('hidden');
    document.getElementById('complaintForm').reset();
    loadMyComplaints(); // refresh table
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit Complaint';
  }
}

/* ============================================================
   STUDENT — Load My Complaints
   ============================================================ */
async function loadMyComplaints() {
  const loader  = document.getElementById('myComplaintsLoader');
  const empty   = document.getElementById('myComplaintsEmpty');
  const table   = document.getElementById('myComplaintsTable');
  const tbody   = document.getElementById('myComplaintsBody');

  loader.classList.remove('hidden');
  table.classList.add('hidden');
  empty.classList.add('hidden');

  try {
    const complaints = await API.getMyComplaints(currentUser.id);
    tbody.innerHTML = '';

    if (!complaints || complaints.length === 0) {
      empty.classList.remove('hidden');
    } else {
      complaints.forEach((c, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td><strong>${escHtml(c.title)}</strong></td>
          <td class="desc-cell">${escHtml(c.description)}</td>
          <td>${statusBadge(c.status)}</td>
        `;
        tbody.appendChild(tr);
      });
      table.classList.remove('hidden');
    }
  } catch (err) {
    empty.innerHTML = `<span>⚠️</span><p>${err.message}</p>`;
    empty.classList.remove('hidden');
  } finally {
    loader.classList.add('hidden');
  }
}

/* ============================================================
   ADMIN — Load All Complaints
   ============================================================ */
async function loadAllComplaints() {
  const loader = document.getElementById('allComplaintsLoader');
  const empty  = document.getElementById('allComplaintsEmpty');
  const table  = document.getElementById('allComplaintsTable');
  const tbody  = document.getElementById('allComplaintsBody');

  loader.classList.remove('hidden');
  table.classList.add('hidden');
  empty.classList.add('hidden');

  try {
    const complaints = await API.getAllComplaints();
    tbody.innerHTML = '';

    // Update stats
    renderStats(complaints);
    renderChart(complaints);

    if (!complaints || complaints.length === 0) {
      empty.classList.remove('hidden');
    } else {
      complaints.forEach((c, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td><strong>${escHtml(c.title)}</strong></td>
          <td class="desc-cell">${escHtml(c.description)}</td>
          <td>${c.userId ?? c.user_id ?? '—'}</td>
          <td>${statusBadge(c.status)}</td>
          <td>
            <button class="btn-status" onclick="openModal(${c.id}, '${escHtml(c.title)}', '${c.status}')">
              ✏️ Update
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
      table.classList.remove('hidden');
    }
  } catch (err) {
    empty.innerHTML = `<span>⚠️</span><p>${err.message}</p>`;
    empty.classList.remove('hidden');
  } finally {
    loader.classList.add('hidden');
  }
}

/* ============================================================
   ADMIN — Stats Cards
   ============================================================ */
function renderStats(complaints) {
  const total    = complaints.length;
  const pending  = complaints.filter(c => c.status === 'PENDING').length;
  const progress = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolved = complaints.filter(c => c.status === 'RESOLVED').length;

  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card total">
      <span class="stat-label">Total</span>
      <span class="stat-value">${total}</span>
    </div>
    <div class="stat-card pending">
      <span class="stat-label">Pending</span>
      <span class="stat-value">${pending}</span>
    </div>
    <div class="stat-card progress">
      <span class="stat-label">In Progress</span>
      <span class="stat-value">${progress}</span>
    </div>
    <div class="stat-card resolved">
      <span class="stat-label">Resolved</span>
      <span class="stat-value">${resolved}</span>
    </div>
  `;
}

/* ============================================================
   ADMIN — Pie Chart (Chart.js)
   ============================================================ */
function renderChart(complaints) {
  const pending  = complaints.filter(c => c.status === 'PENDING').length;
  const progress = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolved = complaints.filter(c => c.status === 'RESOLVED').length;

  const ctx = document.getElementById('statusChart').getContext('2d');

  if (statusChart) statusChart.destroy(); // destroy old chart before re-render

  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'In Progress', 'Resolved'],
      datasets: [{
        data: [pending, progress, resolved],
        backgroundColor: ['#fef3c7', '#cffafe', '#dcfce7'],
        borderColor:     ['#d97706', '#0891b2', '#16a34a'],
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            font: { size: 13 }
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed} complaint${ctx.parsed !== 1 ? 's' : ''}`
          }
        }
      },
      cutout: '60%'
    }
  });
}

/* ============================================================
   ADMIN — Status Update Modal
   ============================================================ */
function openModal(id, title, currentStatus) {
  activeComplaintId = id;
  document.getElementById('modalComplaintTitle').textContent = `"${title}"`;
  document.getElementById('statusSelect').value = currentStatus || 'PENDING';
  document.getElementById('statusModal').classList.remove('hidden');
}

function closeModal() {
  activeComplaintId = null;
  document.getElementById('statusModal').classList.add('hidden');
}

async function confirmStatusUpdate() {
  if (!activeComplaintId) return;
  const newStatus = document.getElementById('statusSelect').value;

  try {
    await API.updateStatus(activeComplaintId, newStatus);
    closeModal();
    loadAllComplaints(); // refresh
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// Close modal on overlay click
document.getElementById('statusModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

/* ============================================================
   Helpers
   ============================================================ */
function statusBadge(status) {
  const map = {
    'PENDING':     ['badge-pending',  'Pending'],
    'IN_PROGRESS': ['badge-progress', 'In Progress'],
    'RESOLVED':    ['badge-resolved', 'Resolved']
  };
  const [cls, label] = map[status] || ['badge-pending', status || 'Pending'];
  return `<span class="badge ${cls}">${label}</span>`;
}

function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

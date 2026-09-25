const API_BASE = 'http://localhost:8080/api';

const CATEGORIES = [
  'FOOD',
  'TRANSPORT',
  'SHOPPING',
  'BILLS',
  'EDUCATION',
  'ENTERTAINMENT',
  'HEALTH',
  'OTHER'
];

const PAYMENT_METHODS = [
  'Cash',
  'Card',
  'UPI',
  'Net Banking',
  'Other'
];

const state = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  route: route(),
  error: ''
};


/* =========================
   ROUTING & UTILITIES
========================= */

function route() {
  const h = location.hash.replace(/^#/, '') || '/';
  return h.split('?')[0] || '/';
}

function navigate(p) {
  location.hash = '#' + p;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function titleCase(s) {
  return s ? s.charAt(0) + s.slice(1).toLowerCase() : '';
}

function esc(v) {
  return String(v ?? '').replace(
    /[&<>'"]/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[c])
  );
}

function currency(v) {
  return '₹' + (Number(v) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function dateFmt(v) {
  if (!v) return '';

  return new Date(v).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}


/* =========================
   API
========================= */

async function api(path, opts = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {})
  };

  const token = localStorage.getItem('token');

  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  const r = await fetch(API_BASE + path, {
    ...opts,
    headers
  });

  if (r.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    state.user = null;

    location.hash = '#/login';

    throw new Error('Unauthorized');
  }

  let data = null;

  try {
    data = await r.json();
  } catch {}

  if (!r.ok) {
    const e = new Error(
      data?.error ||
      data?.message ||
      'Request failed'
    );

    e.data = data;

    throw e;
  }

  return data;
}


/* =========================
   AUTHENTICATION
========================= */

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  state.user = null;

  navigate('/login');
}

function authPage(mode) {
  const login = mode === 'login';

  return `
    <div class="auth-page">
      <div class="card auth-card">

        <h1>
          ${login ? 'Welcome back' : 'Create your account'}
        </h1>

        <p class="subtitle">
          ${
            login
              ? 'Log in to manage your expenses'
              : 'Start tracking your income and expenses'
          }
        </p>

        <div id="auth-error"></div>

        <form id="auth-form">

          ${
            !login
              ? `
                <div class="form-group">
                  <label>Full Name</label>
                  <input name="name" required>
                </div>
              `
              : ''
          }

          <div class="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              required
            >
          </div>

          <div class="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              required
              ${!login ? 'minlength="6"' : ''}
            >
          </div>

          <button
            class="btn btn-primary"
            style="width:100%"
            id="auth-submit"
          >
            ${login ? 'Log In' : 'Register'}
          </button>

        </form>

        <div class="switch-link">
          ${
            login
              ? "Don't have an account? "
              : 'Already have an account? '
          }

          <a href="#/${login ? 'register' : 'login'}">
            ${login ? 'Register' : 'Log In'}
          </a>
        </div>

      </div>
    </div>
  `;
}

async function renderAuth(login) {
  document.getElementById('app').innerHTML =
    authPage(login ? 'login' : 'register');

  document.getElementById('auth-form').onsubmit =
    async e => {
      e.preventDefault();

      const f = new FormData(e.target);
      const data = Object.fromEntries(f.entries());

      const er = document.getElementById('auth-error');
      const btn = document.getElementById('auth-submit');

      if (!login && data.password.length < 6) {
        er.innerHTML = alertBox(
          'Password must be at least 6 characters'
        );

        return;
      }

      btn.disabled = true;
      btn.textContent =
        login
          ? 'Logging in...'
          : 'Creating account...';

      try {
        const r = await api(
          login
            ? '/auth/login'
            : '/auth/register',
          {
            method: 'POST',
            body: JSON.stringify(data)
          }
        );

        localStorage.setItem('token', r.token);

        const u = {
          userId: r.userId,
          name: r.name,
          email: r.email
        };

        localStorage.setItem(
          'user',
          JSON.stringify(u)
        );

        state.user = u;

        navigate('/');

      } catch (e) {
        er.innerHTML = alertBox(
          e.message || 'Request failed'
        );

      } finally {
        btn.disabled = false;

        btn.textContent =
          login
            ? 'Log In'
            : 'Register';
      }
    };
}


/* =========================
   COMMON UI
========================= */

function layout(content, active) {
  return `
    <div class="app-layout">

      <aside class="sidebar">

        <div class="sidebar-brand">
          Expense<span>Track</span>
        </div>

        <a
          class="sidebar-link ${active === '/' ? 'active' : ''}"
          href="#/"
        >
          Dashboard
        </a>

        <a
          class="sidebar-link ${
            active === '/expenses' ? 'active' : ''
          }"
          href="#/expenses"
        >
          Expenses
        </a>

        <a
          class="sidebar-link ${
            active === '/income' ? 'active' : ''
          }"
          href="#/income"
        >
          Income
        </a>

        <button
          class="sidebar-logout"
          id="logout"
          title="${esc(state.user?.email)}"
        >
          Log out
          ${state.user?.name
            ? '(' + esc(state.user.name) + ')'
            : ''}
        </button>

      </aside>

      <main class="main-content">
        ${content}
      </main>

    </div>
  `;
}

function alertBox(msg) {
  return msg
    ? `<div class="alert alert-error">${esc(msg)}</div>`
    : '';
}

function loading() {
  return '<div class="loading-spinner">Loading...</div>';
}

function empty(msg) {
  return `
    <div class="empty-state">
      ${esc(msg)}
    </div>
  `;
}


/* =========================
   MODAL
========================= */

function modal(title, body) {
  return `
    <div class="modal-overlay" id="modal">

      <div
        class="modal-box"
        onclick="event.stopPropagation()"
      >

        <h2>${title}</h2>

        ${body}

      </div>

    </div>
  `;
}

function showModal(title, body) {
  document.body.insertAdjacentHTML(
    'beforeend',
    modal(title, body)
  );

  const m = document.getElementById('modal');

  m.onclick = () => m.remove();

  document.getElementById(
    'modal-cancel'
  ).onclick = () => m.remove();
}


/* =========================
   EXPENSE FORM
========================= */

function expenseForm(initial) {
  const x = initial || {
    title: '',
    amount: '',
    category: 'FOOD',
    description: '',
    date: today(),
    paymentMethod: 'Cash'
  };

  return `
    <form id="expense-form">

      <div class="form-group">
        <label>Title</label>

        <input
          name="title"
          value="${esc(x.title)}"
          placeholder="e.g. Groceries"
        >

        <div
          class="form-error"
          id="err-title"
        ></div>
      </div>


      <div class="form-group">
        <label>Amount (₹)</label>

        <input
          name="amount"
          type="number"
          step="0.01"
          value="${esc(x.amount)}"
          placeholder="0.00"
        >

        <div
          class="form-error"
          id="err-amount"
        ></div>
      </div>


      <div class="form-group">
        <label>Category</label>

        <select name="category">
          ${CATEGORIES.map(c => `
            <option
              value="${c}"
              ${x.category === c ? 'selected' : ''}
            >
              ${titleCase(c)}
            </option>
          `).join('')}
        </select>
      </div>


      <div class="form-group">
        <label>Date</label>

        <input
          name="date"
          type="date"
          value="${esc(x.date)}"
        >

        <div
          class="form-error"
          id="err-date"
        ></div>
      </div>


      <div class="form-group">
        <label>Payment Method</label>

        <select name="paymentMethod">
          ${PAYMENT_METHODS.map(p => `
            <option
              ${x.paymentMethod === p ? 'selected' : ''}
            >
              ${p}
            </option>
          `).join('')}
        </select>
      </div>


      <div class="form-group">
        <label>Description (optional)</label>

        <textarea
          name="description"
          rows="2"
        >${esc(x.description)}</textarea>
      </div>


      <div class="modal-actions">

        <button
          type="button"
          class="btn btn-secondary"
          id="modal-cancel"
        >
          Cancel
        </button>

        <button
          class="btn btn-primary"
          id="save-btn"
        >
          Save Expense
        </button>

      </div>

    </form>
  `;
}


/* =========================
   INCOME FORM
========================= */

function incomeForm(initial) {
  const x = initial || {
    source: '',
    amount: '',
    description: '',
    date: today()
  };

  return `
    <form id="income-form">

      <div class="form-group">
        <label>Source</label>

        <input
          name="source"
          value="${esc(x.source)}"
          placeholder="e.g. Salary, Freelance"
        >

        <div
          class="form-error"
          id="err-source"
        ></div>
      </div>


      <div class="form-group">
        <label>Amount (₹)</label>

        <input
          name="amount"
          type="number"
          step="0.01"
          value="${esc(x.amount)}"
          placeholder="0.00"
        >

        <div
          class="form-error"
          id="err-amount"
        ></div>
      </div>


      <div class="form-group">
        <label>Date</label>

        <input
          name="date"
          type="date"
          value="${esc(x.date)}"
        >

        <div
          class="form-error"
          id="err-date"
        ></div>
      </div>


      <div class="form-group">
        <label>Description (optional)</label>

        <textarea
          name="description"
          rows="2"
        >${esc(x.description)}</textarea>
      </div>


      <div class="modal-actions">

        <button
          type="button"
          class="btn btn-secondary"
          id="modal-cancel"
        >
          Cancel
        </button>

        <button
          class="btn btn-primary"
          id="save-btn"
        >
          Save Income
        </button>

      </div>

    </form>
  `;
}


/* =========================
   DASHBOARD
========================= */

async function dashboard() {
  const el = document.getElementById('app');

  el.innerHTML = layout(
    `
      <div class="page-header">
        <h1>Dashboard</h1>
      </div>

      <div id="dash">
        ${loading()}
      </div>
    `,
    '/'
  );

  try {
    const d = await api('/dashboard');

    document.getElementById('dash').innerHTML = `

      <div class="summary-grid">

        <div class="card summary-card balance">
          <div class="label">Total Balance</div>
          <div class="value">
            ${currency(d.totalBalance)}
          </div>
        </div>

        <div class="card summary-card income">
          <div class="label">Total Income</div>
          <div class="value">
            ${currency(d.totalIncome)}
          </div>
        </div>

        <div class="card summary-card expense">
          <div class="label">Total Expenses</div>
          <div class="value">
            ${currency(d.totalExpense)}
          </div>
        </div>

        <div class="card summary-card expense">
          <div class="label">
            This Month's Expenses
          </div>
          <div class="value">
            ${currency(d.currentMonthExpense)}
          </div>
        </div>

      </div>


      <div class="charts-grid">

        <div class="card">

          <h3 style="margin-top:0">
            Income vs Expense (last 6 months)
          </h3>

          <canvas
            class="chart-canvas"
            id="trend"
          ></canvas>

          <div class="chart-legend">

            <span>
              <i
                class="legend-dot"
                style="background:#16a34a"
              ></i>
              Income
            </span>

            <span>
              <i
                class="legend-dot"
                style="background:#dc2626"
              ></i>
              Expense
            </span>

          </div>

        </div>


        <div class="card">

          <h3 style="margin-top:0">
            Spending by Category
          </h3>

          <div class="pie-wrap">

            <canvas
              class="pie-canvas"
              id="pie"
            ></canvas>

            <div
              id="pie-legend"
              class="chart-legend"
            ></div>

          </div>

        </div>

      </div>


      <div class="card">

        <h3 style="margin-top:0">
          Recent Transactions
        </h3>

        ${
          d.recentExpenses?.length
            ? `
              <div class="table-wrapper">

                <table>

                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>

                  <tbody>

                    ${d.recentExpenses.map(e => `
                      <tr>
                        <td>${esc(e.title)}</td>

                        <td>
                          <span class="badge">
                            ${titleCase(e.category)}
                          </span>
                        </td>

                        <td>
                          ${dateFmt(e.date)}
                        </td>

                        <td>
                          ${currency(e.amount)}
                        </td>
                      </tr>
                    `).join('')}

                  </tbody>

                </table>

              </div>
            `
            : empty(
                'No expenses recorded yet. Add your first one from the Expenses page.'
              )
        }

      </div>
    `;

    drawBar(d.monthlyTrend || []);
    drawPie(d.categoryBreakdown || {});

  } catch (e) {
    document.getElementById('dash').innerHTML =
      alertBox(
        'Could not load dashboard data.'
      );
  }
}


/* =========================
   CHARTS
========================= */

function resizeCanvas(c) {
  const r = c.getBoundingClientRect();
  const d = devicePixelRatio || 1;

  c.width = r.width * d;
  c.height = r.height * d;

  const x = c.getContext('2d');

  x.scale(d, d);

  return [x, r.width, r.height];
}

function drawBar(data) {
  const c = document.getElementById('trend');

  if (!c) return;

  if (!data.length) {
    c.parentElement.innerHTML +=
      empty('No trend data yet.');

    return;
  }

  const [x, w, h] = resizeCanvas(c);

  const max = Math.max(
    1,
    ...data.map(d =>
      Math.max(
        Number(d.income) || 0,
        Number(d.expense) || 0
      )
    )
  );

  const left = 38;
  const bottom = 28;
  const top = 10;

  const plotH = h - top - bottom;

  const slot =
    (w - left - 10) / data.length;

  const barW =
    Math.min(16, slot / 3);

  x.font = '12px Segoe UI';

  x.strokeStyle = '#e5e9f0';
  x.fillStyle = '#6b7280';
  x.textAlign = 'center';

  for (let i = 0; i <= 4; i++) {
    const y = top + plotH * i / 4;

    x.beginPath();
    x.moveTo(left, y);
    x.lineTo(w, y);
    x.stroke();
  }

  data.forEach((d, i) => {
    const cx =
      left + slot * i + slot / 2;

    const iv = Number(d.income) || 0;
    const ev = Number(d.expense) || 0;

    const ih =
      iv / max * plotH;

    const eh =
      ev / max * plotH;

    x.fillStyle = '#16a34a';

    x.fillRect(
      cx - barW - 2,
      top + plotH - ih,
      barW,
      ih
    );

    x.fillStyle = '#dc2626';

    x.fillRect(
      cx + 2,
      top + plotH - eh,
      barW,
      eh
    );

    x.fillStyle = '#6b7280';

    x.fillText(
      d.month,
      cx,
      h - 8
    );
  });
}

function drawPie(data) {
  const c = document.getElementById('pie');
  const leg = document.getElementById('pie-legend');

  if (!c) return;

  const arr = Object.entries(data)
    .filter(([, v]) => Number(v) > 0)
    .map(([k, v]) => [
      titleCase(k),
      Number(v)
    ]);

  if (!arr.length) {
    c.parentElement.innerHTML =
      empty('No expenses yet to chart.');

    return;
  }

  const colors = [
    '#4f46e5',
    '#16a34a',
    '#d97706',
    '#dc2626',
    '#0891b2',
    '#9333ea',
    '#db2777',
    '#64748b'
  ];

  const [x, w, h] = resizeCanvas(c);

  const cx = w / 2;
  const cy = h / 2;

  const r = Math.min(w, h) * 0.34;

  const total =
    arr.reduce(
      (s, a) => s + a[1],
      0
    );

  let a = -Math.PI / 2;

  arr.forEach((v, i) => {
    const end =
      a +
      v[1] / total *
      Math.PI * 2;

    x.beginPath();

    x.moveTo(cx, cy);

    x.arc(
      cx,
      cy,
      r,
      a,
      end
    );

    x.closePath();

    x.fillStyle =
      colors[i % colors.length];

    x.fill();

    a = end;
  });

  leg.innerHTML =
    arr.map((v, i) => `
      <span>
        <i
          class="legend-dot"
          style="background:${
            colors[i % colors.length]
          }"
        ></i>

        ${esc(v[0])}
      </span>
    `).join('');
}


/* =========================
   EXPENSES
========================= */

async function expenses() {
  const el = document.getElementById('app');

  el.innerHTML = layout(
    `
      <div class="page-header">

        <h1>Expenses</h1>

        <button
          class="btn btn-primary"
          id="add"
        >
          + Add Expense
        </button>

      </div>

      <div id="error"></div>

      <div class="toolbar">

        <input
          id="search"
          placeholder="Search by title..."
        >

        <select id="category">
          <option value="">
            All Categories
          </option>

          ${CATEGORIES.map(c => `
            <option value="${c}">
              ${titleCase(c)}
            </option>
          `).join('')}
        </select>

        <select id="sort">
          <option value="date">
            Sort by Date
          </option>

          <option value="amount">
            Sort by Amount
          </option>
        </select>

        <select id="direction">
          <option value="desc">
            Descending
          </option>

          <option value="asc">
            Ascending
          </option>
        </select>

      </div>

      <div
        class="card"
        id="expense-table"
      >
        ${loading()}
      </div>
    `,
    '/expenses'
  );

  let rows = [];

  const load = asyn

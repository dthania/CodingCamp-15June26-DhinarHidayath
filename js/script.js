/* ==========================================================
   Life Dashboard — script.js
   Milestones:
     M3  : Greeting (clock, date, greeting)
     M4  : Light / Dark mode
     M5  : To-Do List (add, render, delete, complete, edit,
            duplicate guard, LocalStorage)
     M6  : Quick Links (add, render, delete, LocalStorage)
     M7  : Focus Timer (countdown, start/pause/reset,
            custom duration, LocalStorage)
========================================================== */

'use strict';

/* ----------------------------------------------------------
   UTILITY — safely query DOM elements
   Throws a clear error if an expected element is missing,
   so bugs surface immediately during development.
---------------------------------------------------------- */
/**
 * Select a single DOM element; throws if not found.
 * @param {string} selector - CSS selector
 * @returns {HTMLElement}
 */
function $(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Element not found: "${selector}"`);
  return el;
}


/* ==========================================================
   M3 — GREETING
   Responsibilities:
     • Update the clock every second (HH:MM:SS, 12-hour format)
     • Update the date once on load (full weekday + date string)
     • Set greeting text based on current hour
========================================================== */

/* --- DOM references --- */
const clockEl    = $('#clock');
const dateEl     = $('#date-display');
const greetingEl = $('#greeting-text');

/**
 * Return "Good Morning", "Good Afternoon", or "Good Evening"
 * based on the current hour (24-hour).
 * @returns {string}
 */
function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12)  return '🌅 Good Morning';
  if (hour >= 12 && hour < 17) return '☀️ Good Afternoon';
  if (hour >= 17 && hour < 21) return '🌆 Good Evening';
  return '🌙 Good Night';
}

/**
 * Format the current time as HH:MM:SS (12-hour with AM/PM).
 * Uses padStart so single digits always show as two characters.
 * @returns {string}  e.g. "09:04:37 AM"
 */
function formatTime() {
  const now     = new Date();
  let   hours   = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const period  = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12 || 12; // convert 0 → 12 for 12 AM
  return `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${period}`;
}

/**
 * Format today's date as a long readable string.
 * e.g. "Tuesday, 16 June 2026"
 * @returns {string}
 */
function formatDate() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  });
}

/**
 * Update the clock display and greeting every second.
 * Called once immediately, then on a 1-second interval.
 */
function updateClock() {
  const now  = new Date();
  const hour = now.getHours();

  /* Update clock */
  clockEl.textContent = formatTime();

  /* Update greeting only when the hour changes — avoids
     unnecessary DOM writes every second */
  const currentGreeting = greetingEl.textContent;
  const newGreeting     = getGreeting();
  if (currentGreeting !== newGreeting) {
    greetingEl.textContent = newGreeting;
  }

  /* Update emoji on greeting card based on time
     (drives the gradient mood — dark/light is separate) */
  const greetingCard = document.getElementById('greeting');
  greetingCard.setAttribute('data-time-of-day',
    hour >= 5  && hour < 12 ? 'morning'   :
    hour >= 12 && hour < 17 ? 'afternoon' :
    hour >= 17 && hour < 21 ? 'evening'   : 'night'
  );
}

/**
 * Set the date element once on page load.
 * The date never changes during a session, so no interval needed.
 */
function initDate() {
  dateEl.textContent = formatDate();
}

/**
 * Boot the greeting module.
 * Sets date immediately, then starts the clock interval.
 */
function initGreeting() {
  initDate();
  updateClock();                          // run once immediately (no delay)
  setInterval(updateClock, 1000);         // then every second
}


/* ==========================================================
   M4 — LIGHT / DARK MODE
   Responsibilities:
     • Toggle 'dark' class on <body>
     • Swap the button icon (🌙 ↔ ☀️)
     • Persist the user's preference in LocalStorage
     • Restore the saved preference on every page load
     • Respect the OS-level preference as the default
       when no saved preference exists yet
========================================================== */

/* --- LocalStorage key --- */
const THEME_KEY = 'ld_theme'; // "ld" prefix = Life Dashboard (avoids key collisions)

/* --- DOM reference --- */
const themeToggleBtn = $('#theme-toggle');

/**
 * Apply a theme to <body> and update the toggle button icon.
 * Also removes the dark-preload class from <html> once JS
 * takes full control (prevents double-application).
 * @param {'light' | 'dark'} theme
 */
function applyTheme(theme) {
  /* Clean up the pre-paint helper class — JS owns the theme now */
  document.documentElement.classList.remove('dark-preload');

  if (theme === 'dark') {
    document.body.classList.add('dark');
    themeToggleBtn.textContent  = '☀️';
    themeToggleBtn.title        = 'Switch to light mode';
    themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
  } else {
    document.body.classList.remove('dark');
    themeToggleBtn.textContent  = '🌙';
    themeToggleBtn.title        = 'Switch to dark mode';
    themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
  }
}

/**
 * Save the current theme preference to LocalStorage.
 * @param {'light' | 'dark'} theme
 */
function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

/**
 * Read the saved theme from LocalStorage.
 * Falls back to the OS colour-scheme preference if nothing is saved yet.
 * Falls back to 'light' if the OS preference is also unavailable.
 * @returns {'light' | 'dark'}
 */
function getSavedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;

  /* No saved preference — check OS preference */
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

/**
 * Toggle between light and dark, then persist the new value.
 * Called when the user clicks the theme button.
 */
function toggleTheme() {
  const isDark   = document.body.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  saveTheme(newTheme);
}

/**
 * Boot the theme module.
 * Reads the saved (or OS-default) preference and applies it
 * before anything is painted — preventing a flash of wrong theme.
 */
function initTheme() {
  applyTheme(getSavedTheme());
  themeToggleBtn.addEventListener('click', toggleTheme);
}


/* ==========================================================
   M5 — TO-DO LIST
   Responsibilities:
     • Add tasks with duplicate prevention
     • Priority: high / medium / low (colour-coded left border + badge)
     • Due date: optional, highlights overdue and due-today tasks
     • Sort: overdue → high → medium → low, done tasks last
     • Render the filtered task list to the DOM
     • Mark tasks complete / incomplete (toggle)
     • Inline edit a task (click Edit → input appears → Save)
     • Delete a task
     • Filter tasks: All | Active | Completed
     • Update task counter
     • Persist all tasks to LocalStorage
     • Load tasks from LocalStorage on page load

   Data shape (array stored as JSON):
     tasks = [{
       id:       string,
       text:     string,
       done:     boolean,
       priority: 'high' | 'medium' | 'low',
       dueDate:  string | ''   (ISO date yyyy-mm-dd or empty)
     }, ...]
========================================================== */

/* --- LocalStorage key --- */
const TODO_KEY = 'ld_tasks';

/* --- State --- */
let tasks        = [];   // single source of truth
let activeFilter = 'all'; // 'all' | 'active' | 'completed'

/* --- DOM references --- */
const todoForm      = $('#todo-form');
const taskInput     = $('#task-input');
const taskPriority  = $('#task-priority');
const taskDue       = $('#task-due');
const taskList      = $('#task-list');
const taskCountEl   = $('#task-count');
const emptyState    = $('#empty-state');
const filterBtns    = document.querySelectorAll('.btn-filter');

/* --- Priority config --- */
const PRIORITY_CONFIG = {
  high:   { emoji: '🔴', label: 'High',   order: 1 },
  medium: { emoji: '🟡', label: 'Medium', order: 2 },
  low:    { emoji: '🟢', label: 'Low',    order: 3 },
};

/* ----------------------------------------------------------
   LocalStorage helpers
---------------------------------------------------------- */
function saveTasksToStorage() {
  localStorage.setItem(TODO_KEY, JSON.stringify(tasks));
}

function loadTasksFromStorage() {
  try {
    const raw = localStorage.getItem(TODO_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((t) => ({
      id:       t.id       || generateId(),
      text:     t.text     || '',
      done:     t.done     ?? false,
      priority: t.priority || 'medium',
      dueDate:  t.dueDate  || '',
    }));
  } catch {
    return [];
  }
}

/* ----------------------------------------------------------
   ID generator
---------------------------------------------------------- */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ----------------------------------------------------------
   Duplicate detection
---------------------------------------------------------- */
function isDuplicate(text, excludeId = null) {
  const normalised = text.trim().toLowerCase();
  return tasks.some(
    (t) => t.text.toLowerCase() === normalised && t.id !== excludeId
  );
}

/* ----------------------------------------------------------
   Due-date helpers
---------------------------------------------------------- */

/**
 * Return today's date as an ISO string yyyy-mm-dd in local time.
 * Using toLocaleDateString avoids UTC offset surprises.
 * @returns {string}
 */
function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Classify a due date string relative to today.
 * @param {string} dueDate  ISO yyyy-mm-dd or ''
 * @returns {'overdue'|'today'|'upcoming'|'none'}
 */
function dueDateStatus(dueDate) {
  if (!dueDate) return 'none';
  const today = todayISO();
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  return 'upcoming';
}

/**
 * Format a due date for display.
 * @param {string} dueDate
 * @returns {string}
 */
function formatDueDate(dueDate) {
  if (!dueDate) return '';
  const [y, m, d] = dueDate.split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ----------------------------------------------------------
   Sorting
   Order: overdue undone → high undone → medium undone →
          low undone → done tasks (in original add order)
---------------------------------------------------------- */
function sortTasks(list) {
  return [...list].sort((a, b) => {
    /* Done tasks always sink to the bottom */
    if (a.done !== b.done) return a.done ? 1 : -1;

    /* Among undone: overdue first */
    const aOver = !a.done && dueDateStatus(a.dueDate) === 'overdue';
    const bOver = !b.done && dueDateStatus(b.dueDate) === 'overdue';
    if (aOver !== bOver) return aOver ? -1 : 1;

    /* Then by priority */
    const aPri = PRIORITY_CONFIG[a.priority]?.order ?? 2;
    const bPri = PRIORITY_CONFIG[b.priority]?.order ?? 2;
    return aPri - bPri;
  });
}

/* ----------------------------------------------------------
   Core CRUD
---------------------------------------------------------- */
function addTask(text, priority, dueDate) {
  const trimmed = text.trim();
  if (!trimmed) {
    showInputError(taskInput, 'Task cannot be empty.');
    return false;
  }
  if (isDuplicate(trimmed)) {
    showInputError(taskInput, '⚠️ This task already exists.');
    return false;
  }
  tasks.push({ id: generateId(), text: trimmed, done: false, priority, dueDate });
  saveTasksToStorage();
  renderTasks();
  return true;
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasksToStorage();
  renderTasks();
}

function toggleComplete(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.done = !task.done;
    saveTasksToStorage();
    renderTasks();
  }
}

function saveEdit(id, newText, editInput) {
  const trimmed = newText.trim();
  if (!trimmed) {
    showInputError(editInput, 'Task cannot be empty.');
    return false;
  }
  if (isDuplicate(trimmed, id)) {
    showInputError(editInput, '⚠️ A task with this name already exists.');
    return false;
  }
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.text = trimmed;
    saveTasksToStorage();
    renderTasks();
  }
  return true;
}

/* ----------------------------------------------------------
   Inline error helpers  (shared by Todo + Links)
---------------------------------------------------------- */
function showInputError(inputEl, message) {
  clearInputError(inputEl);
  inputEl.classList.add('input-error');
  const errEl = document.createElement('p');
  errEl.className   = 'error-msg';
  errEl.textContent = message;
  errEl.id          = `${inputEl.id}-error`;
  inputEl.setAttribute('aria-describedby', errEl.id);
  inputEl.insertAdjacentElement('afterend', errEl);
  const clearFn = () => clearInputError(inputEl);
  inputEl.addEventListener('input', clearFn, { once: true });
  setTimeout(clearFn, 3000);
}

function clearInputError(inputEl) {
  inputEl.classList.remove('input-error');
  inputEl.removeAttribute('aria-describedby');
  const existing = document.getElementById(`${inputEl.id}-error`);
  if (existing) existing.remove();
}

/* ----------------------------------------------------------
   Rendering
---------------------------------------------------------- */
function createTaskElement(task) {
  const status = dueDateStatus(task.dueDate);
  const isOverdue = status === 'overdue' && !task.done;
  const isToday   = status === 'today'   && !task.done;
  const pri       = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const li = document.createElement('li');
  li.className = [
    'task-item',
    task.done   ? 'completed' : '',
    isOverdue   ? 'overdue'   : '',
  ].filter(Boolean).join(' ');
  li.dataset.id       = task.id;
  li.dataset.priority = task.priority;

  /* Checkbox */
  const checkbox = document.createElement('input');
  checkbox.type      = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked   = task.done;
  checkbox.setAttribute('aria-label',
    `Mark "${task.text}" as ${task.done ? 'incomplete' : 'complete'}`);
  checkbox.addEventListener('change', () => toggleComplete(task.id));

  /* Body: text + meta row */
  const body = document.createElement('div');
  body.className = 'task-body';

  const textSpan       = document.createElement('span');
  textSpan.className   = 'task-text';
  textSpan.textContent = task.text;

  /* Meta row: priority badge + due date */
  const metaRow = document.createElement('div');
  metaRow.className = 'task-meta-row';

  const badge         = document.createElement('span');
  badge.className     = `task-priority-badge priority-${task.priority}`;
  badge.textContent   = `${pri.emoji} ${pri.label}`;
  badge.setAttribute('aria-label', `Priority: ${pri.label}`);
  metaRow.appendChild(badge);

  if (task.dueDate) {
    const due         = document.createElement('span');
    due.className     = [
      'task-due-date',
      isOverdue ? 'due-overdue' : '',
      isToday   ? 'due-today'   : '',
    ].filter(Boolean).join(' ');
    due.textContent   = `📅 ${isOverdue ? '⚠️ Overdue · ' : isToday ? 'Due today · ' : ''}${formatDueDate(task.dueDate)}`;
    metaRow.appendChild(due);
  }

  body.append(textSpan, metaRow);

  /* Action buttons */
  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const editBtn       = document.createElement('button');
  editBtn.type        = 'button';
  editBtn.className   = 'btn-task btn-task-edit';
  editBtn.textContent = '✏️ Edit';
  editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
  editBtn.addEventListener('click', () => activateEditMode(li, task, body));

  const deleteBtn       = document.createElement('button');
  deleteBtn.type        = 'button';
  deleteBtn.className   = 'btn-task btn-task-delete';
  deleteBtn.textContent = '🗑 Delete';
  deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  actions.append(editBtn, deleteBtn);
  li.append(checkbox, body, actions);
  return li;
}

function activateEditMode(li, task, body) {
  const textSpan  = body.querySelector('.task-text');
  const editInput = document.createElement('input');
  editInput.type      = 'text';
  editInput.className = 'task-edit-input';
  editInput.value     = task.text;
  editInput.maxLength = 200;
  editInput.setAttribute('aria-label', 'Edit task text');
  body.replaceChild(editInput, textSpan);
  editInput.focus();
  editInput.select();

  const editBtn  = li.querySelector('.btn-task-edit');
  const saveBtn  = document.createElement('button');
  saveBtn.type       = 'button';
  saveBtn.className  = 'btn-task btn-task-save';
  saveBtn.textContent = '💾 Save';
  saveBtn.setAttribute('aria-label', 'Save task');
  editBtn.replaceWith(saveBtn);

  saveBtn.addEventListener('click', () => saveEdit(task.id, editInput.value, editInput));
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  saveEdit(task.id, editInput.value, editInput);
    if (e.key === 'Escape') renderTasks();
  });
}

function getFilteredTasks() {
  let list = tasks;
  if (activeFilter === 'active')    list = tasks.filter((t) => !t.done);
  if (activeFilter === 'completed') list = tasks.filter((t) =>  t.done);
  return sortTasks(list);
}

function updateTaskCount() {
  const remaining = tasks.filter((t) => !t.done).length;
  taskCountEl.textContent =
    remaining === 1 ? '1 task remaining' : `${remaining} tasks remaining`;
}

function renderTasks() {
  const filtered = getFilteredTasks();
  taskList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
    filtered.forEach((task) => taskList.appendChild(createTaskElement(task)));
  }
  updateTaskCount();
}

/* ----------------------------------------------------------
   Filter buttons
---------------------------------------------------------- */
function setFilter(filter) {
  activeFilter = filter;
  filterBtns.forEach((btn) => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle('btn-filter-active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
  renderTasks();
}

/* ----------------------------------------------------------
   Event listeners
---------------------------------------------------------- */
todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const added = addTask(
    taskInput.value,
    taskPriority.value,
    taskDue.value
  );
  if (added) {
    taskInput.value    = '';
    taskPriority.value = 'medium';
    taskDue.value      = '';
    taskInput.focus();
  }
});

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

/* ----------------------------------------------------------
   Init
---------------------------------------------------------- */
function initTodo() {
  tasks = loadTasksFromStorage();
  renderTasks();
}


/* ==========================================================
   M6 — QUICK LINKS
   Responsibilities:
     • Add a link (label + URL) with validation
     • Render links as clickable items that open in a new tab
     • Delete a link
     • Persist links to LocalStorage
     • Load links from LocalStorage on page load

   Data shape (array stored as JSON):
     links = [{ id: string, label: string, url: string }, ...]
========================================================== */

/* --- LocalStorage key --- */
const LINKS_KEY = 'ld_links';

/* --- State --- */
let links = [];

/* --- DOM references --- */
const linkForm    = $('#link-form');
const linkLabelEl = $('#link-label');
const linkUrlEl   = $('#link-url');
const linksList   = $('#links-list');

/* ----------------------------------------------------------
   LocalStorage helpers
---------------------------------------------------------- */

/**
 * Save the links array to LocalStorage as a JSON string.
 */
function saveLinksToStorage() {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));
}

/**
 * Read and parse links from LocalStorage.
 * Returns an empty array if nothing is saved or data is corrupt.
 * @returns {Array<{id: string, label: string, url: string}>}
 */
function loadLinksFromStorage() {
  try {
    const raw = localStorage.getItem(LINKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/* ----------------------------------------------------------
   URL validation helper
   Accepts http:// and https:// URLs only.
   Uses the browser's built-in URL constructor — no regex needed.
---------------------------------------------------------- */

/**
 * Check whether a string is a valid http/https URL.
 * @param {string} str
 * @returns {boolean}
 */
function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/* ----------------------------------------------------------
   Normalise URL
   Prepend https:// if the user forgot the scheme entirely,
   e.g. "github.com" → "https://github.com"
---------------------------------------------------------- */

/**
 * Add https:// if no protocol is present.
 * @param {string} url
 * @returns {string}
 */
function normaliseUrl(url) {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/* ----------------------------------------------------------
   Core operations
---------------------------------------------------------- */

/**
 * Add a new link after validating label and URL.
 * @param {string} label
 * @param {string} rawUrl
 * @returns {boolean} true if added
 */
function addLink(label, rawUrl) {
  const trimmedLabel = label.trim();
  const normalisedUrl = normaliseUrl(rawUrl);

  /* Validate label */
  if (!trimmedLabel) {
    showInputError(linkLabelEl, 'Please enter a label.');
    return false;
  }

  /* Validate URL */
  if (!rawUrl.trim()) {
    showInputError(linkUrlEl, 'Please enter a URL.');
    return false;
  }

  if (!isValidUrl(normalisedUrl)) {
    showInputError(linkUrlEl, 'Please enter a valid URL (e.g. https://example.com).');
    return false;
  }

  links.push({ id: generateId(), label: trimmedLabel, url: normalisedUrl });
  saveLinksToStorage();
  renderLinks();
  return true;
}

/**
 * Delete a link by id.
 * @param {string} id
 */
function deleteLink(id) {
  links = links.filter((l) => l.id !== id);
  saveLinksToStorage();
  renderLinks();
}

/* ----------------------------------------------------------
   Rendering
---------------------------------------------------------- */

/**
 * Build a single <li> element for one link.
 * @param {{ id: string, label: string, url: string }} link
 * @returns {HTMLLIElement}
 */
function createLinkElement(link) {
  const li = document.createElement('li');
  li.className  = 'link-item';
  li.dataset.id = link.id;

  /* Clickable label — opens in new tab with security attributes */
  const anchor        = document.createElement('a');
  anchor.href         = link.url;
  anchor.textContent  = link.label;
  anchor.target       = '_blank';
  anchor.rel          = 'noopener noreferrer'; // security: prevents tab-napping
  anchor.title        = link.url;              // show URL on hover

  /* Delete button */
  const deleteBtn       = document.createElement('button');
  deleteBtn.type        = 'button';
  deleteBtn.className   = 'link-item-delete';
  deleteBtn.textContent = '🗑';
  deleteBtn.setAttribute('aria-label', `Delete link: ${link.label}`);
  deleteBtn.addEventListener('click', () => deleteLink(link.id));

  li.append(anchor, deleteBtn);
  return li;
}

/**
 * Re-render the entire links list from the `links` array.
 * Called after every state change.
 */
function renderLinks() {
  linksList.innerHTML = '';

  if (links.length === 0) {
    const empty = document.createElement('li');
    empty.className   = 'links-empty';
    empty.textContent = 'No links yet. Add one above!';
    linksList.appendChild(empty);
    return;
  }

  links.forEach((link) => {
    linksList.appendChild(createLinkElement(link));
  });
}

/* ----------------------------------------------------------
   Event listeners
---------------------------------------------------------- */

linkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const added = addLink(linkLabelEl.value, linkUrlEl.value);
  if (added) {
    linkLabelEl.value = '';
    linkUrlEl.value   = '';
    linkLabelEl.focus(); // return focus to first field for quick re-entry
  }
});

/* ----------------------------------------------------------
   Init
---------------------------------------------------------- */

/**
 * Boot the Quick Links module.
 * Loads saved links from LocalStorage, then renders.
 */
function initLinks() {
  links = loadLinksFromStorage();
  renderLinks();
}


/* ==========================================================
   M7 — FOCUS TIMER (POMODORO)
   Responsibilities:
     • Count down from a configurable duration (default 25 min)
     • Start / Pause / Resume / Reset controls
     • Update the browser tab title while running
     • Visual states: idle | running | paused | finished
     • Play a subtle audio cue when the session ends
     • Persist the user's chosen duration to LocalStorage
     • Load the saved duration on page load

   State machine:
     idle  ──[Start]──►  running  ──[Pause]──►  paused
                  ▲                                 │
                  └─────────[Resume]────────────────┘
     running / paused  ──[Reset]──►  idle
     running ──[reaches 0]──►  finished  ──[Reset]──►  idle

   Data shape in LocalStorage:
     'ld_pomodoro_mins' → number (e.g. 25)
========================================================== */

/* --- LocalStorage key --- */
const POMODORO_KEY = 'ld_pomodoro_mins';

/* --- Constants --- */
const DEFAULT_MINS  = 25;
const MIN_MINS      = 1;
const MAX_MINS      = 60;

/* --- Timer state --- */
let timerInterval   = null;          // setInterval handle
let timerStatus     = 'idle';        // 'idle' | 'running' | 'paused' | 'finished'
let totalSeconds    = DEFAULT_MINS * 60;  // configured duration in seconds
let remainingSeconds = totalSeconds;      // countdown value

/* --- DOM references --- */
const timerDisplay  = $('#timer-display');
const btnStart      = $('#btn-start');
const btnPause      = $('#btn-pause');
const btnReset      = $('#btn-reset');
const customTimeEl  = $('#custom-time');
const btnSetTime    = $('#btn-set-time');

/* --- Original page title (restored when timer stops) --- */
const originalTitle = document.title;

/* ----------------------------------------------------------
   LocalStorage helpers
---------------------------------------------------------- */

/**
 * Save the chosen Pomodoro duration (in minutes) to LocalStorage.
 * @param {number} mins
 */
function savePomodoroMins(mins) {
  localStorage.setItem(POMODORO_KEY, String(mins));
}

/**
 * Load the saved Pomodoro duration from LocalStorage.
 * Falls back to DEFAULT_MINS if nothing is saved or value is invalid.
 * @returns {number} minutes
 */
function loadPomodoroMins() {
  const raw  = localStorage.getItem(POMODORO_KEY);
  const mins = parseInt(raw, 10);
  if (!isNaN(mins) && mins >= MIN_MINS && mins <= MAX_MINS) return mins;
  return DEFAULT_MINS;
}

/* ----------------------------------------------------------
   Display helpers
---------------------------------------------------------- */

/**
 * Format a total number of seconds as MM:SS.
 * @param {number} seconds
 * @returns {string}  e.g. "24:59"
 */
function formatTimer(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Push the current time to the timer display element and page title.
 */
function updateTimerDisplay() {
  const formatted = formatTimer(remainingSeconds);
  timerDisplay.textContent = formatted;

  /* Update browser tab so the user can see the countdown
     even when the dashboard is in a background tab */
  if (timerStatus === 'running') {
    document.title = `⏱ ${formatted} — Life Dashboard`;
  }
}

/**
 * Apply visual state classes to the timer card and buttons.
 * @param {'idle'|'running'|'paused'|'finished'} status
 */
function applyTimerState(status) {
  const card = document.getElementById('timer');

  /* Remove all state classes then add the current one */
  card.classList.remove('timer-running', 'timer-paused', 'timer-finished');
  if (status !== 'idle') card.classList.add(`timer-${status}`);

  /* Button enable/disable logic */
  switch (status) {
    case 'idle':
      btnStart.disabled = false;
      btnPause.disabled = true;
      btnStart.textContent = '▶ Start';
      btnPause.textContent = '⏸ Pause';
      document.title = originalTitle;
      break;

    case 'running':
      btnStart.disabled = true;
      btnPause.disabled = false;
      btnPause.textContent = '⏸ Pause';
      break;

    case 'paused':
      btnStart.disabled = false;
      btnPause.disabled = true;
      btnStart.textContent = '▶ Resume';
      document.title = `⏸ ${formatTimer(remainingSeconds)} — Life Dashboard`;
      break;

    case 'finished':
      btnStart.disabled = true;
      btnPause.disabled = true;
      document.title = '✅ Session done! — Life Dashboard';
      break;
  }
}

/* ----------------------------------------------------------
   Audio cue
   Uses the Web Audio API to generate a simple two-tone chime
   without needing any external sound files.
---------------------------------------------------------- */

/**
 * Play a short completion chime using the Web Audio API.
 * Silently no-ops if the browser doesn't support it.
 */
function playFinishChime() {
  try {
    const ctx        = new (window.AudioContext || window.webkitAudioContext)();
    const notes      = [523.25, 659.25, 783.99]; // C5, E5, G5
    let   startTime  = ctx.currentTime;

    notes.forEach((freq) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type      = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.start(startTime);
      osc.stop(startTime + 0.4);

      startTime += 0.18; // slight overlap for a smooth chord
    });

    /* Close context after notes finish to free resources */
    setTimeout(() => ctx.close(), 2000);
  } catch {
    /* Web Audio not available — skip silently */
  }
}

/* ----------------------------------------------------------
   Core timer controls
---------------------------------------------------------- */

/**
 * Tick: called every second by setInterval.
 * Decrements remainingSeconds and checks for completion.
 */
function tick() {
  remainingSeconds -= 1;
  updateTimerDisplay();

  if (remainingSeconds <= 0) {
    remainingSeconds = 0;
    clearInterval(timerInterval);
    timerInterval = null;
    timerStatus   = 'finished';
    applyTimerState('finished');
    playFinishChime();

    /* Flash the display to celebrate */
    timerDisplay.classList.add('timer-flash');
    setTimeout(() => timerDisplay.classList.remove('timer-flash'), 2000);
  }
}

/**
 * Start or resume the countdown.
 */
function startTimer() {
  if (timerStatus === 'finished') return; // must reset first

  timerStatus   = 'running';
  timerInterval = setInterval(tick, 1000);
  applyTimerState('running');
}

/**
 * Pause the countdown.
 * Clears the interval but keeps remainingSeconds intact.
 */
function pauseTimer() {
  if (timerStatus !== 'running') return;

  clearInterval(timerInterval);
  timerInterval = null;
  timerStatus   = 'paused';
  applyTimerState('paused');
}

/**
 * Reset the timer back to the configured duration.
 * Works from any state.
 */
function resetTimer() {
  clearInterval(timerInterval);
  timerInterval    = null;
  timerStatus      = 'idle';
  remainingSeconds = totalSeconds;
  updateTimerDisplay();
  applyTimerState('idle');
}

/**
 * Apply a new custom duration chosen by the user.
 * Validates the input, updates state, saves to LocalStorage.
 */
function setCustomTime() {
  const raw  = parseInt(customTimeEl.value, 10);

  if (isNaN(raw) || raw < MIN_MINS || raw > MAX_MINS) {
    showInputError(customTimeEl, `Please enter a number between ${MIN_MINS} and ${MAX_MINS}.`);
    return;
  }

  totalSeconds     = raw * 60;
  savePomodoroMins(raw);

  /* Always reset when duration changes so the new value takes effect */
  resetTimer();
}

/* ----------------------------------------------------------
   Event listeners
---------------------------------------------------------- */

btnStart.addEventListener('click', startTimer);
btnPause.addEventListener('click', pauseTimer);
btnReset.addEventListener('click', resetTimer);

btnSetTime.addEventListener('click', setCustomTime);

/* Also apply on Enter inside the number input */
customTimeEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') setCustomTime();
});

/* ----------------------------------------------------------
   Init
---------------------------------------------------------- */

/**
 * Boot the timer module.
 * Loads saved duration, sets up the initial idle state.
 */
function initTimer() {
  const savedMins      = loadPomodoroMins();
  totalSeconds         = savedMins * 60;
  remainingSeconds     = totalSeconds;
  customTimeEl.value   = savedMins;

  updateTimerDisplay();
  applyTimerState('idle');
}


/* ==========================================================
   OPTION C — NOTIFICATIONS + SESSION HISTORY

   Responsibilities:
     • Request Notification permission once (on first Start click)
     • Fire a desktop notification when the session ends
       (visible even when the tab is in the background)
     • Track completed Pomodoro sessions for today
     • Show dot indicators (4 dots = one full cycle)
     • Suggest a short break after 4 sessions, long break after 8
     • Persist session data to LocalStorage
     • Reset the count automatically at midnight

   LocalStorage key:
     'ld_sessions' → { date: 'yyyy-mm-dd', count: number }
========================================================== */

const SESSIONS_KEY    = 'ld_sessions';
const SHORT_BREAK_TIP = '☕ Nice work! Take a 5-minute short break.';
const LONG_BREAK_TIP  = '🎉 4 sessions done! Time for a 15-minute long break.';
const KEEP_GOING_TIP  = '💪 Keep it up! Start your next session when ready.';

/* --- DOM references --- */
const sessionDotsEl  = $('#session-dots');
const sessionCountEl = $('#session-count-label');
const sessionTipEl   = $('#session-tip');

/* ----------------------------------------------------------
   LocalStorage helpers
---------------------------------------------------------- */

/**
 * Load today's session data from LocalStorage.
 * If the saved date is not today, resets the count to 0.
 * @returns {{ date: string, count: number }}
 */
function loadSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return { date: todayISO(), count: 0 };
    const data = JSON.parse(raw);
    /* Reset if the saved date is not today (midnight rollover) */
    if (data.date !== todayISO()) return { date: todayISO(), count: 0 };
    return data;
  } catch {
    return { date: todayISO(), count: 0 };
  }
}

/**
 * Persist the current session data.
 * @param {{ date: string, count: number }} data
 */
function saveSessionsToStorage(data) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(data));
}

/* ----------------------------------------------------------
   Notification helpers
---------------------------------------------------------- */

/**
 * Request Notification permission from the browser.
 * Called once the first time the user starts the timer.
 * Silently no-ops if the API is unavailable.
 */
function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/**
 * Fire a desktop notification.
 * Silently no-ops if permission is not granted or API is absent.
 * @param {string} title
 * @param {string} body
 */
function sendNotification(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const n = new Notification(title, {
      body,
      icon:   'https://em-content.zobj.net/source/apple/354/tomato_1f345.png',
      badge:  'https://em-content.zobj.net/source/apple/354/tomato_1f345.png',
      silent: false,
    });
    /* Auto-close after 8 seconds */
    setTimeout(() => n.close(), 8000);
  } catch {
    /* Some browsers block Notification constructor — skip silently */
  }
}

/* ----------------------------------------------------------
   Session rendering
---------------------------------------------------------- */

/**
 * Render the dot row and update the count label + tip message.
 * Shows dots in groups of 4. The most recent dot gets a pop-in
 * animation. Every 4th dot is a milestone (green + larger).
 * @param {number} count  total sessions completed today
 * @param {boolean} [animate=false]  pop-in the last dot
 */
function renderSessionHistory(count, animate = false) {
  const CYCLE      = 4;          // sessions per Pomodoro cycle
  const MAX_DOTS   = 8;          // display at most 8 dots (2 cycles)
  const display    = Math.min(count, MAX_DOTS);
  const total      = Math.max(display, CYCLE * Math.ceil((count || 1) / CYCLE));
  const dotsToShow = Math.max(total, CYCLE); // always show at least one full cycle

  sessionDotsEl.innerHTML = '';

  for (let i = 0; i < dotsToShow; i++) {
    const dot = document.createElement('span');
    dot.className = 'session-dot';
    dot.setAttribute('aria-label',
      i < count ? `Session ${i + 1} complete` : `Session ${i + 1} pending`);

    if (i < count) {
      const isMilestone = (i + 1) % CYCLE === 0;
      dot.classList.add(isMilestone ? 'dot-milestone' : 'dot-done');
      if (animate && i === count - 1) dot.classList.add('dot-pop');
    }
    sessionDotsEl.appendChild(dot);
  }

  /* Count label e.g. "3 / 4" */
  const cyclePosition = count % CYCLE || (count > 0 ? CYCLE : 0);
  sessionCountEl.textContent = `${cyclePosition} / ${CYCLE}`;

  /* Tip message */
  if (count === 0) {
    sessionTipEl.textContent = '';
  } else if (count % (CYCLE * 2) === 0) {
    sessionTipEl.textContent = LONG_BREAK_TIP;
  } else if (count % CYCLE === 0) {
    sessionTipEl.textContent = SHORT_BREAK_TIP;
  } else {
    sessionTipEl.textContent = KEEP_GOING_TIP;
  }
}

/* ----------------------------------------------------------
   Record a completed session
   Called from tick() when the timer reaches 00:00
---------------------------------------------------------- */

/**
 * Increment today's session count, persist, and re-render.
 * Also fires a desktop notification.
 */
function recordSession() {
  const data = loadSessions();
  data.count += 1;
  saveSessionsToStorage(data);
  renderSessionHistory(data.count, true);

  /* Choose notification message based on session count */
  const isLongBreak  = data.count % (4 * 2) === 0;
  const isShortBreak = data.count % 4 === 0;

  const notifTitle = isLongBreak
    ? '🎉 Long break time!'
    : isShortBreak
      ? '☕ Short break time!'
      : '✅ Pomodoro complete!';

  const notifBody = isLongBreak
    ? `Amazing — ${data.count} sessions today! Take a proper 15-minute break.`
    : isShortBreak
      ? `${data.count} sessions done today. Take 5 minutes away from the screen.`
      : `Session ${data.count} done. Ready for the next one? `;

  sendNotification(notifTitle, notifBody);
}

/* ----------------------------------------------------------
   Patch tick() to call recordSession on completion
   (extends the existing tick without rewriting it)
---------------------------------------------------------- */
const _originalTick = tick;

/**
 * Wrap tick to hook in session recording when the timer finishes.
 * We redefine tick so the existing setInterval still calls the
 * augmented version.
 */
/* eslint-disable no-global-assign */
tick = function tickWithSession() {
  const wasBefore = remainingSeconds;
  _originalTick();
  /* _originalTick decrements remainingSeconds; if it just hit 0 we record */
  if (wasBefore === 1 && remainingSeconds === 0) {
    recordSession();
  }
};
/* eslint-enable no-global-assign */

/* ----------------------------------------------------------
   Patch startTimer() to request notification permission
   the first time the user starts the timer
---------------------------------------------------------- */
const _originalStartTimer = startTimer;

startTimer = function startTimerWithNotif() {
  requestNotificationPermission();
  _originalStartTimer();
};

/* ----------------------------------------------------------
   Init
---------------------------------------------------------- */

/**
 * Boot the session history module.
 * Loads today's saved count, renders dots.
 * Auto-schedules a midnight reset check every minute.
 */
function initSessions() {
  const data = loadSessions();
  renderSessionHistory(data.count);

  /* Check every minute whether the date has rolled over.
     If it has, reset the count and re-render. */
  setInterval(() => {
    const current = loadSessions();
    renderSessionHistory(current.count);
  }, 60 * 1000);
}


/* ==========================================================
   INIT — runs when the DOM is fully loaded
========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();    // M4 — must run first to avoid theme flash
  initGreeting(); // M3
  initTodo();     // M5
  initLinks();    // M6
  initTimer();    // M7
  initSessions(); // Option C
});

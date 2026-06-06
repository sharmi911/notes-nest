// ======= STATE =======
let currentUser = null;
let pendingIdentifier = '';
let currentFilter = 'all';
let currentView = 'grid';
let selectedColor = '#FFE066';
let deleteTargetId = null;
let todoItems = [];

// ======= STORAGE =======
const S = {
  getUsers: () => JSON.parse(localStorage.getItem('nn_users') || '{}'),
  saveUsers: u => localStorage.setItem('nn_users', JSON.stringify(u)),
  getNotes: u => JSON.parse(localStorage.getItem(`nn_notes_${u}`) || '[]'),
  saveNotes: (u, n) => localStorage.setItem(`nn_notes_${u}`, JSON.stringify(n)),
  getNotifs: () => JSON.parse(localStorage.getItem('nn_notifs') || '[]'),
  saveNotifs: n => localStorage.setItem('nn_notifs', JSON.stringify(n)),
  getAdminEmail: () => localStorage.getItem('nn_admin_email') || '',
  saveAdminEmail: e => localStorage.setItem('nn_admin_email', e),
  getTheme: () => localStorage.getItem('nn_theme') || 'default',
  saveTheme: t => localStorage.setItem('nn_theme', t),
};

// ======= DOM HELPERS =======
const $ = id => document.getElementById(id);
function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }
function escHtml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }

// ======= AUTH: STEP 1 =======
function checkIdentifier() {
  const val = $('userIdentifier').value.trim();
  const errEl = $('idError');
  errEl.textContent = '';
  if (!val) { errEl.textContent = 'Please enter your username or email.'; return; }
  const users = S.getUsers();
  const match = Object.keys(users).find(u =>
    u === val || (users[u].email && users[u].email.toLowerCase() === val.toLowerCase())
  );
  if (match) {
    pendingIdentifier = match;
    showStepPassword(match);
  } else {
    errEl.textContent = 'No account found. Create one below!';
  }
}

function showStepPassword(username) {
  const u = username || pendingIdentifier;
  hide('stepId'); hide('stepRegister'); hide('stepForgot');
  show('stepPassword');
  $('greetName').textContent = `Hey, ${u}! 👋`;
  $('greetAvatar').textContent = u[0].toUpperCase();
  $('loginPassword').value = '';
  $('pwError').textContent = '';
  setTimeout(() => $('loginPassword').focus(), 100);
}

function goBackToId() {
  hide('stepPassword'); hide('stepRegister'); hide('stepForgot');
  show('stepId');
  $('idError').textContent = '';
}

function showRegister() {
  hide('stepId'); hide('stepPassword'); hide('stepForgot');
  show('stepRegister');
  $('regError').textContent = '';
}

function showForgot() {
  hide('stepPassword');
  show('stepForgot');
  $('forgotError').textContent = '';
  $('forgotSuccess').textContent = '';
  $('forgotEmail').value = '';
  hide('newPasswordSection');
  show('forgotSubmitBtn');
}

// ======= LOGIN =======
function doLogin() {
  const password = $('loginPassword').value;
  const errEl = $('pwError');
  errEl.textContent = '';
  if (!password) { errEl.textContent = 'Please enter your password.'; return; }
  const users = S.getUsers();
  if (!users[pendingIdentifier]) { errEl.textContent = 'Account not found.'; return; }
  if (users[pendingIdentifier].password !== btoa(password)) {
    errEl.textContent = 'Wrong password. Try again!'; return;
  }
  currentUser = pendingIdentifier;
  localStorage.setItem('nn_session', currentUser);
  addNotification(`🔑 ${currentUser} logged in`, 'login');
  triggerAdminNotif('login', currentUser, users[currentUser].email);
  enterApp();
}

// ======= REGISTER =======
function doRegister() {
  const username = $('regUsername').value.trim();
  const email = $('regEmail').value.trim();
  const password = $('regPassword').value;
  const confirm = $('regConfirm').value;
  const errEl = $('regError');
  errEl.textContent = '';
  if (!username || !email || !password || !confirm) { errEl.textContent = 'All fields are required.'; return; }
  if (username.length < 3) { errEl.textContent = 'Username must be 3+ characters.'; return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { errEl.textContent = 'Enter a valid email address.'; return; }
  if (password.length < 4) { errEl.textContent = 'Password must be 4+ characters.'; return; }
  if (password !== confirm) { errEl.textContent = 'Passwords do not match.'; return; }
  const users = S.getUsers();
  if (users[username]) { errEl.textContent = 'Username already taken.'; return; }
  const emailTaken = Object.values(users).find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  if (emailTaken) { errEl.textContent = 'Email already registered.'; return; }
  users[username] = { password: btoa(password), email, created: Date.now() };
  S.saveUsers(users);
  currentUser = username;
  localStorage.setItem('nn_session', currentUser);
  addNotification(`🎉 New user signed up: ${username}`, 'signup');
  triggerAdminNotif('signup', username, email);
  enterApp();
  showToast('Welcome to Notes Nest! 🪺🎉');
}

// ======= FORGOT PASSWORD =======
function checkForgotEmail() {
  const email = $('forgotEmail').value.trim();
  const errEl = $('forgotError');
  const successEl = $('forgotSuccess');
  errEl.textContent = ''; successEl.textContent = '';
  if (!email) { errEl.textContent = 'Please enter your email.'; return; }
  const users = S.getUsers();
  const match = Object.keys(users).find(u =>
    users[u].email && users[u].email.toLowerCase() === email.toLowerCase()
  );
  if (!match) { errEl.textContent = 'No account found with that email.'; return; }
  pendingIdentifier = match;
  successEl.textContent = `✅ Account found for "${match}". Set your new password below.`;
  hide('forgotSubmitBtn');
  show('newPasswordSection');
}

function doResetPassword() {
  const newPw = $('newPassword').value;
  const newConf = $('newConfirm').value;
  const errEl = $('resetError');
  errEl.textContent = '';
  if (!newPw || !newConf) { errEl.textContent = 'Fill in both fields.'; return; }
  if (newPw.length < 4) { errEl.textContent = 'Password must be 4+ characters.'; return; }
  if (newPw !== newConf) { errEl.textContent = 'Passwords do not match.'; return; }
  const users = S.getUsers();
  users[pendingIdentifier].password = btoa(newPw);
  S.saveUsers(users);
  showToast('Password updated! Please sign in. ✅');
  goBackToId();
}

// ======= LOGOUT — always ask password on next visit =======
function doLogout() {
  currentUser = null;
  localStorage.removeItem('nn_session'); // clear session so password is required next time
  document.getElementById('appPage').classList.remove('active');
  document.getElementById('loginPage').classList.add('active');
  $('userIdentifier').value = '';
  goBackToId();
  hide('notifBell');
  hide('notifPanel');
}

// ======= ENTER APP =======
function enterApp() {
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('appPage').classList.add('active');
  const users = S.getUsers();
  const u = users[currentUser];
  $('sbAvatar').textContent = currentUser[0].toUpperCase();
  $('sbUname').textContent = currentUser;
  $('sbEmail').textContent = u?.email || '';
  currentFilter = 'all';
  document.querySelectorAll('.sb-btn[data-filter]').forEach(b => b.classList.remove('active'));
  const allBtn = document.querySelector('.sb-btn[data-filter="all"]');
  if (allBtn) allBtn.classList.add('active');
  $('notesHeading').textContent = 'All Notes';
  $('searchInput').value = '';
  renderNotes();
  renderNotifBell();
  applyTheme(S.getTheme(), false);
  handleResize();
}

// ======= ADMIN NOTIFICATION =======
function triggerAdminNotif(type, username, email) {
  const adminEmail = S.getAdminEmail();
  if (!adminEmail) return;
  const subject = type === 'signup'
    ? `[Notes Nest] New signup: ${username}`
    : `[Notes Nest] Login: ${username}`;
  const body = type === 'signup'
    ? `New user signed up on Notes Nest.\n\nUsername: ${username}\nEmail: ${email}\nTime: ${new Date().toLocaleString()}`
    : `User logged into Notes Nest.\n\nUsername: ${username}\nEmail: ${email}\nTime: ${new Date().toLocaleString()}`;
  const a = document.createElement('a');
  a.href = `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ======= IN-APP NOTIFICATIONS =======
function addNotification(msg, type) {
  const notifs = S.getNotifs();
  notifs.unshift({ msg, type, time: Date.now() });
  if (notifs.length > 50) notifs.length = 50;
  S.saveNotifs(notifs);
}

function renderNotifBell() {
  const notifs = S.getNotifs();
  if (notifs.length > 0) {
    show('notifBell');
    $('notifCount').textContent = notifs.length > 9 ? '9+' : notifs.length;
  } else {
    hide('notifBell');
  }
}

function openNotifPanel() {
  const panel = $('notifPanel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) renderNotifList();
}

function closeNotifPanel() { hide('notifPanel'); }

function renderNotifList() {
  const notifs = S.getNotifs();
  const list = $('notifList');
  if (!notifs.length) {
    list.innerHTML = '<div class="no-notif">No notifications yet</div>';
    return;
  }
  list.innerHTML = notifs.map(n => {
    const d = new Date(n.time);
    const t = d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' ' +
      d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    return `<div class="notif-item">${escHtml(n.msg)}<div class="ni-time">${t}</div></div>`;
  }).join('');
}

function clearNotifs() {
  S.saveNotifs([]);
  $('notifList').innerHTML = '<div class="no-notif">Cleared!</div>';
  hide('notifBell');
}

// ======= NOTES CRUD =======
function openNoteModal(noteId = null) {
  selectedColor = '#FFE066';
  todoItems = [];
  $('noteTitle').value = '';
  $('noteContent').value = '';
  $('noteCategory').value = 'general';
  $('editingId').value = '';
  $('todoList').innerHTML = '';
  hide('todoArea');
  $('noteContent').style.display = '';
  document.querySelectorAll('.cdot').forEach(d => d.classList.remove('selected'));
  const defaultDot = document.querySelector('[data-c="#FFE066"]');
  if (defaultDot) defaultDot.classList.add('selected');

  if (noteId) {
    const notes = S.getNotes(currentUser);
    const note = notes.find(n => n.id === noteId);
    if (note) {
      $('noteTitle').value = note.title;
      $('noteContent').value = note.content || '';
      $('noteCategory').value = note.category || 'general';
      $('editingId').value = noteId;
      selectedColor = note.color || '#FFE066';
      document.querySelectorAll('.cdot').forEach(d => d.classList.remove('selected'));
      const dot = document.querySelector(`[data-c="${selectedColor}"]`);
      if (dot) dot.classList.add('selected');
      if (note.category === 'todo' && note.todos) {
        todoItems = JSON.parse(JSON.stringify(note.todos));
        show('todoArea');
        $('noteContent').style.display = 'none';
        renderTodoEditor();
      }
    }
  }

  $('noteCategory').onchange = function() {
    if (this.value === 'todo') { show('todoArea'); $('noteContent').style.display = 'none'; }
    else { hide('todoArea'); $('noteContent').style.display = ''; }
  };

  show('noteModal');
  setTimeout(() => $('noteTitle').focus(), 80);
}

function closeNoteModal() {
  hide('noteModal');
  $('noteCategory').onchange = null;
}

function pickColor(btn) {
  selectedColor = btn.dataset.c;
  document.querySelectorAll('.cdot').forEach(d => d.classList.remove('selected'));
  btn.classList.add('selected');
}

// --- TODO editor ---
function renderTodoEditor() {
  const list = $('todoList');
  list.innerHTML = '';
  todoItems.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = `todo-item${item.done ? ' done' : ''}`;
    div.innerHTML = `
      <input type="checkbox" id="ti${i}" ${item.done ? 'checked' : ''} onchange="toggleTodoItem(${i})"/>
      <label for="ti${i}">${escHtml(item.text)}</label>
      <button class="del-todo" onclick="removeTodoItem(${i})"><i class="fa fa-times"></i></button>`;
    list.appendChild(div);
  });
}

function addTodoItem() {
  const input = $('todoInput');
  const text = input.value.trim();
  if (!text) return;
  todoItems.push({ id: Date.now(), text, done: false });
  input.value = '';
  renderTodoEditor();
  input.focus();
}

function todoKeydown(e) { if (e.key === 'Enter') addTodoItem(); }
function toggleTodoItem(i) { todoItems[i].done = !todoItems[i].done; renderTodoEditor(); }
function removeTodoItem(i) { todoItems.splice(i, 1); renderTodoEditor(); }

function saveNote() {
  const title = $('noteTitle').value.trim();
  const content = $('noteContent').value.trim();
  const category = $('noteCategory').value;
  const editingId = $('editingId').value;
  const isTodo = category === 'todo';
  if (!title && !content && !(isTodo && todoItems.length)) { showToast('Add a title or content first!'); return; }
  const notes = S.getNotes(currentUser);
  if (editingId) {
    const idx = notes.findIndex(n => n.id === editingId);
    if (idx !== -1) {
      notes[idx] = { ...notes[idx], title: title || 'Untitled', content: isTodo ? '' : content,
        category, color: selectedColor, todos: isTodo ? [...todoItems] : [], updatedAt: Date.now() };
    }
    showToast('Note updated ✓');
  } else {
    notes.unshift({ id: 'n_'+Date.now(), title: title||'Untitled', content: isTodo?'':content,
      category, color: selectedColor, todos: isTodo?[...todoItems]:[], pinned: false,
      createdAt: Date.now(), updatedAt: Date.now() });
    showToast('Note saved 💾');
  }
  S.saveNotes(currentUser, notes);
  closeNoteModal();
  renderNotes();
}

function togglePin(id, e) {
  e.stopPropagation();
  const notes = S.getNotes(currentUser);
  const n = notes.find(x => x.id === id);
  if (n) { n.pinned = !n.pinned; S.saveNotes(currentUser, notes); renderNotes(); showToast(n.pinned ? 'Pinned 📌' : 'Unpinned'); }
}

function deleteNote(id, e) { e.stopPropagation(); deleteTargetId = id; show('deleteModal'); }

function confirmDelete() {
  if (!deleteTargetId) return;
  S.saveNotes(currentUser, S.getNotes(currentUser).filter(n => n.id !== deleteTargetId));
  deleteTargetId = null;
  hide('deleteModal');
  renderNotes();
  showToast('Note deleted 🗑️');
}

function tickTodo(noteId, todoIdx, checked, e) {
  e.stopPropagation();
  const notes = S.getNotes(currentUser);
  const n = notes.find(x => x.id === noteId);
  if (n && n.todos && n.todos[todoIdx] !== undefined) {
    n.todos[todoIdx].done = checked;
    S.saveNotes(currentUser, notes);
    renderNotes();
  }
}

// ======= RENDER =======
function renderNotes(custom = null) {
  const container = $('notesGrid');
  const emptyState = $('emptyState');
  let notes = custom !== null ? custom : S.getNotes(currentUser);
  if (currentFilter === 'pinned') notes = notes.filter(n => n.pinned);
  else if (currentFilter !== 'all') notes = notes.filter(n => n.category === currentFilter);
  notes = notes.sort((a,b) => (b.pinned - a.pinned) || (b.updatedAt - a.updatedAt));
  container.innerHTML = '';
  container.className = currentView === 'grid' ? 'notes-grid' : 'notes-list';
  if (!notes.length) { show('emptyState'); return; }
  hide('emptyState');
  const catEmoji = { general:'📝', work:'💼', personal:'❤️', ideas:'💡', todo:'✅' };
  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.style.background = note.color || '#FFE066';
    const date = new Date(note.updatedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    const isTodo = note.category === 'todo' && note.todos && note.todos.length > 0;
    let bodyHtml = '';
    if (isTodo) {
      const preview = note.todos.slice(0,5);
      bodyHtml = `<div class="nc-todo-list">${preview.map((t,i) =>
        `<div class="nc-todo-item${t.done?' done':''}">
          <input type="checkbox" ${t.done?'checked':''} onclick="tickTodo('${note.id}',${i},this.checked,event)"/>
          <span>${escHtml(t.text)}</span>
        </div>`).join('')}
        ${note.todos.length>5?`<div class="nc-todo-item" style="opacity:.6">+${note.todos.length-5} more…</div>`:''}</div>`;
    } else {
      bodyHtml = `<div class="nc-body">${escHtml(note.content||'')}</div>`;
    }
    card.innerHTML = `
      ${note.pinned ? '<div class="pin-flag">📌</div>' : ''}
      <div class="nc-title">${escHtml(note.title)}</div>
      ${bodyHtml}
      <div class="nc-foot">
        <span class="nc-date">${date}</span>
        <span class="nc-badge">${catEmoji[note.category]||'📝'} ${cap(note.category)}</span>
        <div class="nc-actions" onclick="event.stopPropagation()">
          <button class="nc-act" title="${note.pinned?'Unpin':'Pin'}" onclick="togglePin('${note.id}',event)"><i class="fa fa-thumbtack"></i></button>
          <button class="nc-act" title="Edit" onclick="event.stopPropagation();openNoteModal('${note.id}')"><i class="fa fa-pen"></i></button>
          <button class="nc-act" title="Delete" onclick="deleteNote('${note.id}',event)"><i class="fa fa-trash"></i></button>
        </div>
      </div>`;
    card.addEventListener('click', () => openNoteModal(note.id));
    container.appendChild(card);
  });
}

// ======= FILTER & SEARCH =======
function filterNotes(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.sb-btn[data-filter]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const heads = { all:'All Notes', pinned:'Pinned 📌', work:'Work 💼', personal:'Personal ❤️', ideas:'Ideas 💡', todo:'To-Do ✅' };
  $('notesHeading').textContent = heads[filter] || 'Notes';
  $('searchInput').value = '';
  renderNotes();
  if (window.innerWidth <= 900) closeSidebar();
}

function searchNotes() {
  const q = $('searchInput').value.trim().toLowerCase();
  if (!q) { renderNotes(); return; }
  const notes = S.getNotes(currentUser).filter(n =>
    n.title.toLowerCase().includes(q) ||
    (n.content && n.content.toLowerCase().includes(q)) ||
    (n.todos && n.todos.some(t => t.text.toLowerCase().includes(q)))
  );
  renderNotes(notes);
}

function setView(v) {
  currentView = v;
  $('gridViewBtn').classList.toggle('active', v==='grid');
  $('listViewBtn').classList.toggle('active', v==='list');
  renderNotes();
}

// ======= SIDEBAR (NEVER closes on desktop) =======
function openSidebar() {
  $('sidebar').classList.add('open');
  $('sidebarOverlay').classList.add('show');
}
function closeSidebar() {
  if (window.innerWidth > 900) return; // never close on desktop
  $('sidebar').classList.remove('open');
  $('sidebarOverlay').classList.remove('show');
}

function handleResize() {
  if (window.innerWidth > 900) {
    $('sidebar').classList.remove('open');
    $('sidebarOverlay').classList.remove('show');
    $('mainArea').style.marginLeft = '260px';
  } else {
    $('mainArea').style.marginLeft = '0';
  }
}

// ======= SETTINGS (does NOT close sidebar) =======
function openSettings() {
  const users = S.getUsers();
  const u = users[currentUser];
  $('settingsUsername').textContent = currentUser;
  $('settingsEmail').textContent = u?.email || '—';
  $('settingsNoteCount').textContent = S.getNotes(currentUser).length;
  $('settingsJoined').textContent = u?.created
    ? new Date(u.created).toLocaleDateString('en-US',{month:'long',year:'numeric'}) : '—';
  $('adminEmailInput').value = S.getAdminEmail();
  $('oldPassword').value = '';
  $('newPasswordSetting').value = '';
  $('confirmNewPassword').value = '';
  $('pwChangeMsg').textContent = '';
  const theme = S.getTheme();
  document.querySelectorAll('.theme-chip').forEach(c => c.classList.toggle('active', c.dataset.theme === theme));
  show('settingsModal');
  // sidebar stays open — do NOT call closeSidebar() here
}

function saveAdminEmail() {
  const val = $('adminEmailInput').value.trim();
  if (val && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) { showToast('Please enter a valid email!'); return; }
  S.saveAdminEmail(val);
  showToast(val ? 'Admin email saved ✓' : 'Admin email cleared');
}

function changePassword() {
  const old = $('oldPassword').value;
  const newPw = $('newPasswordSetting').value;
  const conf = $('confirmNewPassword').value;
  const msgEl = $('pwChangeMsg');
  msgEl.style.color = '#ff4f7b'; msgEl.textContent = '';
  const users = S.getUsers();
  if (users[currentUser].password !== btoa(old)) { msgEl.textContent = 'Current password is incorrect.'; return; }
  if (newPw.length < 4) { msgEl.textContent = 'New password must be 4+ characters.'; return; }
  if (newPw !== conf) { msgEl.textContent = 'Passwords do not match.'; return; }
  users[currentUser].password = btoa(newPw);
  S.saveUsers(users);
  msgEl.style.color = '#2ecc71';
  msgEl.textContent = 'Password updated! ✅';
  $('oldPassword').value = ''; $('newPasswordSetting').value = ''; $('confirmNewPassword').value = '';
}

// ======= THEME =======
function setTheme(theme, btn) {
  applyTheme(theme, true);
  document.querySelectorAll('.theme-chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function applyTheme(theme, save) {
  document.body.setAttribute('data-theme', theme);
  if (save) { S.saveTheme(theme); showToast('Theme applied! 🎨'); }
}

// ======= MODAL HELPERS =======
function closeModal(id) { hide(id); }
function modalBgClick(e, id) { if (e.target.id === id) hide(id); }

// ======= TOAST =======
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ======= INIT =======
window.addEventListener('DOMContentLoaded', () => {
  applyTheme(S.getTheme(), false);

  // Always require password — no auto-login from session
  // (session is only used to remember the username for the identifier step)
  const session = localStorage.getItem('nn_session');
  const users = S.getUsers();
  if (session && users[session]) {
    // Pre-fill identifier and jump straight to password step
    pendingIdentifier = session;
    $('userIdentifier').value = session;
    showStepPassword(session);
  }

  document.getElementById('loginPage').classList.add('active');
  document.getElementById('appPage').classList.remove('active');

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { hide('noteModal'); hide('deleteModal'); hide('settingsModal'); hide('notifPanel'); }
    if ((e.ctrlKey||e.metaKey) && e.key==='Enter' && !$('noteModal').classList.contains('hidden')) saveNote();
  });

  $('userIdentifier').addEventListener('keydown', e => { if (e.key==='Enter') checkIdentifier(); });
  $('loginPassword').addEventListener('keydown', e => { if (e.key==='Enter') doLogin(); });
  $('regConfirm').addEventListener('keydown', e => { if (e.key==='Enter') doRegister(); });

  handleResize();
  window.addEventListener('resize', handleResize);
});

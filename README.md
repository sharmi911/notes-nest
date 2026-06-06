# 🪺 Notes Nest

A colorful, feature-rich personal notes app — built with pure HTML, CSS, and JavaScript. No frameworks, no server, no internet required. Just open and use.

![Notes Nest](https://img.shields.io/badge/Notes%20Nest-v3.0-ff6b9d?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHRleHQgeT0iMjAiIGZvbnQtc2l6ZT0iMjAiPvCfqroiPC90ZXh0Pjwvc3ZnPg==)
![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## ✨ Features

### 🔐 Authentication
- **2-step login** — enter username or email first, then password
- **Per-user accounts** — each user sees only their own notes
- **Password required every visit** — no auto-login for security
- **Register** with username + email + password
- **Forgot password** — reset via registered email lookup
- **Change password** from Settings

### 📝 Notes
- Create, edit, and delete notes
- **8 card colors** to organize visually
- **5 categories** — General, Work, Personal, Ideas, To-Do
- **Pin notes** to keep them at the top
- **Search** notes by title, content, or checklist text
- **Grid and List view** toggle

### ✅ To-Do Checklists
- Select the To-Do category to get a checklist editor
- Tick checkboxes directly on note cards without opening them
- Add and remove checklist items

### 🎨 Themes
6 built-in themes, switchable from Settings:
| Theme | Style |
|-------|-------|
| 🌈 Playful | Colorful gradient (default) |
| 🌊 Ocean | Cool blue tones |
| 🍬 Candy | Pink and purple |
| 🌿 Forest | Earthy greens |
| 🌅 Sunset | Warm orange tones |
| 🌙 Midnight | Dark mode |

### 🔔 Notifications
- In-app activity bell — logs every login and signup with timestamps
- **Admin email notifications** — configure your email in Settings and your mail app will open with a pre-filled email on every user login or signup

---

## 🚀 Getting Started

### Option 1 — Just open it
```bash
# Clone the repo
git clone https://github.com/yourusername/notes-nest.git

# Open in browser — no server needed!
open notes-nest/index.html
```

### Option 2 — Use Live Server (VS Code)
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **Open with Live Server**
3. App opens at `http://127.0.0.1:5500`

### Option 3 — Simple HTTP server
```bash
# Python 3
cd notes-nest
python3 -m http.server 3000
# Open http://localhost:3000
```

---

## 📁 Project Structure

```
notes-nest/
├── index.html          # Main app — all pages in one file
├── css/
│   └── style.css       # All styles + 6 theme variables
├── js/
│   └── app.js          # All logic — auth, notes, settings
└── README.md
```

---

## 🗄️ Data Storage

All data is stored in the browser's **localStorage** — no backend required.

| Key | What it stores |
|-----|---------------|
| `nn_users` | All registered user accounts (passwords stored as Base64) |
| `nn_notes_<username>` | Notes for each individual user |
| `nn_notifs` | In-app notification log |
| `nn_admin_email` | Admin email for notifications |
| `nn_theme` | Currently selected theme |
| `nn_session` | Remembered username (password still required) |

> ⚠️ **Note:** Data lives in your browser. Clearing browser data will erase all notes. For persistent storage across devices, a backend would be needed.

---

## ⚙️ Settings Panel

Access via the sidebar → **Settings**

| Section | What you can do |
|---------|----------------|
| 👤 Account Info | View username, email, note count, join date |
| 🎨 App Theme | Switch between 6 color themes |
| 🔐 Change Password | Update your password securely |
| 🔔 Admin Notifications | Set an email to receive login/signup alerts |
| ⚠️ Account Actions | Logout and clear session |

---

## 🖥️ Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome 90+ | ✅ |
| Firefox 88+ | ✅ |
| Safari 14+ | ✅ |
| Edge 90+ | ✅ |

---

## 📱 Responsive Design

- **Desktop (900px+)** — sidebar always visible
- **Mobile/Tablet (<900px)** — hamburger menu, full-screen sidebar drawer

---

## 🔒 Security Notes

- Passwords are stored as Base64 encoded strings in localStorage
- This is a **client-side only** app — suitable for personal/local use
- For production use, a proper backend with hashed passwords (bcrypt) and HTTPS is strongly recommended

---

## 🛠️ Customization

### Add a new theme
In `css/style.css`, add a new block:
```css
[data-theme="yourtheme"] {
  --bg: #your-bg-color;
  --sidebar: #ffffff;
  --border: #your-border;
  --text: #your-text;
  --text-muted: #your-muted;
  --accent1: #your-accent;
  --accent2: #your-accent2;
  --btn-main: linear-gradient(135deg, #color1, #color2);
}
```
Then add a button in the Settings modal in `index.html`:
```html
<button class="theme-chip" data-theme="yourtheme" onclick="setTheme('yourtheme',this)">
  🎯 Your Theme
</button>
```

### Add a new category
In `index.html`, add to both the modal select and the sidebar nav:
```html
<!-- Sidebar -->
<button class="sb-btn" data-filter="newcat" onclick="filterNotes('newcat',this)">
  <i class="fa fa-star"></i> New Category
</button>

<!-- Note modal -->
<option value="newcat">⭐ New Category</option>
```
Then add the emoji mapping in `js/app.js`:
```js
const catEmoji = { ..., newcat: '⭐' };
```

---

## 📸 Screenshots

| Login | Notes Grid | Settings |
|-------|-----------|---------|
| 2-step secure login with animated background | Colorful note cards with pin, edit, delete | Theme picker, password change, admin email |

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 🙌 Built With

- [Fredoka One](https://fonts.google.com/specimen/Fredoka+One) — headings font
- [Nunito](https://fonts.google.com/specimen/Nunito) — body font
- [Font Awesome 6](https://fontawesome.com/) — icons
- Vanilla JavaScript — no frameworks

---

> Made with 🪺 and lots of color

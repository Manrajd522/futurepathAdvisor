// server.js - Backend only, all HTML files are separate

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import fs from 'fs';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting server setup...');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-key-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Google Sheets configuration
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxAV25ask9JlFGBkY2YiqmQGLZHVFyPXwll-phC-1DFR5Waq9oy42WhoBY0AQjJqROG/exec";
const API_KEY = process.env.API_KEY || "MY_SECRET_KEY";

//navbar
const navbarHTML = `
<nav style="position:fixed; top:0; left:0; right:0; height:60px; background:#1a202c; color:white; padding:5px 20px; font-family:'Segoe UI',sans-serif; display:flex; justify-content:space-between; align-items:center; z-index:1000; box-shadow:0 2px 6px rgba(0,0,0,0.2);">
  <div style="display:flex; align-items:center; font-weight:bold; font-size:18px;">
    <img src="erasebg-transformed.png" alt="Institute Logo" style="width:45px; height:auto; margin-right:12px;">
    FUTURE PATH ADVISOR
  </div>

  <!-- Hamburger button (mobile only) -->
  <div class="menu-toggle" style="display:none; cursor:pointer; font-size:26px;">☰</div>

  <div id="nav-links" class="nav-links" style="display:flex; gap:20px; align-items:center; font-size:15px;">
    <!-- Links will be injected dynamically -->
  </div>
</nav>

<style>
  body {
    margin: 0;
    padding-top: 65px; /* space for navbar */
  }
  nav a {
    color: white;
    text-decoration: none;
  }
  nav a:hover {
    text-decoration: underline;
  }

  /* Mobile styles */
  @media (max-width: 768px) {
    .nav-links {
      display: none; /* hide menu by default */
      flex-direction: column;
      background: #2d3748;
      position: absolute;
      top: 60px;
      right: 0;
      width: 200px;
      padding: 10px;
      box-shadow: -2px 2px 6px rgba(0,0,0,0.3);
    }
    .nav-links.show {
      display: flex;
    }
    .menu-toggle {
      display: block;
    }
  }
</style>

<script>
  // Toggle menu on mobile
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (toggle && navLinks) {
      toggle.addEventListener("click", () => {
        navLinks.classList.toggle("show");
      });
    }
  });

  fetch('/me', { credentials: 'include' })
    .then(res => {
      if (!res.ok) throw new Error("Not logged in");
      return res.json();
    })
    .then(user => {
      const nav = document.getElementById('nav-links');
      if (!nav) return;
      nav.innerHTML = \`
        <a href="/good">🏠 Home</a>
        <a href="/verification">✅ Verify</a>
        \${user.role === 'admin' ? '<a href="/admin">⚙️ Admin</a>' : ''}
        <a href="#" onclick="logout()" style="color:#f56565;">🚪 Logout</a>
      \`;
    })
    .catch(() => {
      const nav = document.getElementById('nav-links');
      if (nav) {
        nav.innerHTML = '<a href="/login">🔑 Login</a>';
      }
    });

  function logout() {
    fetch('/logout', { method: 'POST', credentials: 'include' })
      .then(() => window.location.href = '/login');
  }
</script>
`;




// LOGOUT BUTTON HTML - This gets injected into authenticated pages
const logoutButtonHTML = `
<div id="universal-logout" style="position: fixed; top: 15px; right: 15px; z-index: 9999;">
  <div style="background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); border-radius: 10px; padding: 10px; display: flex; align-items: center; gap: 10px; color: white; font-family: 'Segoe UI', sans-serif;">
    <span id="user-info" style="font-size: 14px; opacity: 0.9;"></span>
    <button onclick="logout()" style="
      background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 5px;
    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      🚪 Logout
    </button>
  </div>
</div>

<script>
// Fetch current user info and display
fetch('/me', { credentials: 'include' })
  .then(response => response.json())
  .then(user => {
    const userInfo = document.getElementById('user-info');
    if (userInfo && user.username) {
      userInfo.textContent = \`👋 \${user.username} (\${user.role})\`;
    }
  })
  .catch(err => console.log('User info fetch failed:', err));

// Logout function
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    fetch('/logout', { 
      method: 'POST',
      credentials: 'include'
    })
    .then(() => {
      window.location.href = '/login';
    })
    .catch(err => {
      console.error('Logout error:', err);
      window.location.href = '/login';
    });
  }
}

// Auto-logout on session expiry
setInterval(() => {
  fetch('/me', { credentials: 'include' })
    .then(response => {
      if (!response.ok) {
        window.location.href = '/login';
      }
    })
    .catch(() => {
      window.location.href = '/login';
    });
}, 30000); // Check every 30 seconds
</script>
`;

// MIDDLEWARE: Inject logout button into authenticated HTML pages
// const injectLogoutButton = (req, res, next) => {
//   // Only inject for authenticated users
//   if (!req.session || !req.session.userId) {
//     return next();
//   }

//   // Store original res.sendFile
//   const originalSendFile = res.sendFile.bind(res);
  
//   // Override res.sendFile to inject logout button
//   res.sendFile = function(filePath, options, callback) {
//     // Check if it's an HTML file
//     if (filePath.endsWith('.html')) {
//       try {
//         // Read the HTML file
//         const htmlContent = fs.readFileSync(filePath, 'utf8');
        
//         // Inject logout button before closing body tag
//         const modifiedHTML = htmlContent.replace(
//           /<\/body>/i, 
//           logoutButtonHTML + '</body>'
//         );
        
//         // Send modified HTML
//         res.setHeader('Content-Type', 'text/html');
//         res.send(modifiedHTML);
        
//         if (callback) callback();
//       } catch (err) {
//         console.error('Error injecting logout button:', err);
//         // Fallback to original sendFile
//         originalSendFile(filePath, options, callback);
//       }
//     } else {
//       // Not HTML, use original sendFile
//       originalSendFile(filePath, options, callback);
//     }
//   };
  
//   next();
// };

// // Apply logout button injection middleware
// app.use(injectLogoutButton);

const injectNavbar = (req, res, next) => {
  const originalSendFile = res.sendFile.bind(res);

  res.sendFile = function(filePath, options, callback) {
    if (filePath.endsWith('.html')) {
      try {
        let htmlContent = fs.readFileSync(filePath, 'utf8');

        // Inject navbar right after opening <body>
        htmlContent = htmlContent.replace(
          /<body[^>]*>/i,
          match => match + "\n" + navbarHTML
        );

        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
        if (callback) callback();
      } catch (err) {
        console.error('Navbar injection failed:', err);
        originalSendFile(filePath, options, callback);
      }
    } else {
      originalSendFile(filePath, options, callback);
    }
  };

  next();
};


app.use(injectNavbar);

// Serve static files AFTER logout button middleware
app.use(express.static(path.join(__dirname, 'public')));

console.log('Middleware configured...');

// Authentication middleware
const requireAuth = (requiredRole = null) => {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.redirect('/login');
    }
    
    if (requiredRole && req.session.userRole !== requiredRole) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        requiredRole: requiredRole,
        userRole: req.session.userRole
      });
    }
    
    return next();
  };
};

// Login page route
app.get('/login', (req, res) => {
  // If already logged in, redirect to main page
  if (req.session && req.session.userId) {
    return res.redirect('/good');
  }

  // Serve the login HTML file?
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login handler
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    console.log('Attempting authentication for:', username);
    
    const formData = new URLSearchParams();
    formData.append('key', API_KEY);
    formData.append('action', 'authenticate');
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    const responseText = await response.text();
    console.log('Authentication response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse authentication response:', parseError);
      return res.redirect('/login?error=server');
    }

    if (result.success) {
      req.session.userId = result.user.username;
      req.session.userEmail = result.user.email;
      req.session.userRole = result.user.role;
      
      console.log('Login successful for:', username, 'Role:', result.user.role);
      res.redirect('/good');
    } else {
      console.log('Login failed for:', username);
      res.redirect('/login?error=invalid');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.redirect('/login?error=server');
  }
});

// Logout routes (both GET and POST)
app.post('/logout', (req, res) => {
  const username = req.session.userId;
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    console.log('User logged out:', username);
    res.redirect('/login');
  });
});

app.get('/logout', (req, res) => {
  const username = req.session.userId;
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    console.log('User logged out:', username);
    res.redirect('/login');
  });
});

// Root route
app.get("/", (req, res) => {
  
   res.sendFile(path.join(__dirname, 'public', 'verify.html')); // logged in → verification
  // not logged in → login page
});

// Get current user info
app.get('/me', requireAuth(), (req, res) => {
  res.json({
    username: req.session.userId,
    email: req.session.userEmail,
    role: req.session.userRole,
    sessionActive: true
  });
});

// PROTECTED Certificate pages (will automatically get logout button)
app.get('/good', requireAuth(), (req, res) => {
  console.log('Certificate page requested by:', req.session.userId);
  try {
    res.sendFile(path.join(__dirname, 'public', 'good.html'));
  } catch (err) {
    console.error('Error serving certificate page:', err);
    res.status(404).json({ error: 'Certificate page not found' });
  }
});

app.get('/verification', (req, res) => {
 
  try {
    res.sendFile(path.join(__dirname, 'public', 'verify.html'));
  } catch (err) {
    console.error('Error serving verify page:', err);
    res.status(404).json({ error: 'Verify page not found' });
  }
});

app.get('/degree', requireAuth(), (req, res) => {
  console.log('Degree certificate page requested by:', req.session.userId);
  try {
    res.sendFile(path.join(__dirname, 'public', 'certificatedegree.html'));
  } catch (err) {
    console.error('Error serving degree certificate page:', err);
    res.status(404).json({ error: 'Degree certificate page not found' });
  }
});


app.get('/authentication', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'public', 'authentication.html'));
  } catch (err) {
    console.error('Error serving authentication certificate page:', err);
    res.status(404).json({ error: 'authentication certificate page not found' });
  }
});

// Admin route
app.get('/admin', requireAuth('admin'), (req, res) => {
  console.log('Admin panel requested by:', req.session.userId);
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Admin API Routes

// Get all users (admin only)
app.get('/admin/users', requireAuth('admin'), async (req, res) => {
  try {
    console.log('Admin fetching all users');
    
    const url = `${SCRIPT_URL}?key=${API_KEY}&action=getUsers`;
    const response = await fetch(url);
    const responseText = await response.text();
    
    let users;
    try {
      users = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse users response:', responseText);
      users = [];
    }
    
    console.log('Fetched users:', users.length);
    res.json(users);
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
});

// Add new user (admin only)
app.post('/admin/users', requireAuth('admin'), async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Validation
    if (!username || !email || !password || !role) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        success: false,
        message: 'Username must be at least 3 characters long' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Role must be either "user" or "admin"' 
      });
    }

    console.log('Admin adding new user:', username);
    
    const formData = new URLSearchParams();
    formData.append('key', API_KEY);
    formData.append('action', 'addUser');
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    const result = await response.json();
    console.log('Add user result:', result);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message 
    });
  }
});

// Update user (admin only)
app.put('/admin/users/:username', requireAuth('admin'), async (req, res) => {
  try {
    const originalUsername = req.params.username;
    const { username, email, password, role } = req.body;
    
    // Validation
    if (!username || !email || !role) {
      return res.status(400).json({ 
        success: false,
        message: 'Username, email, and role are required' 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        success: false,
        message: 'Username must be at least 3 characters long' 
      });
    }

    if (password && password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Role must be either "user" or "admin"' 
      });
    }

    console.log('Admin updating user:', originalUsername, '->', username);
    
    const formData = new URLSearchParams();
    formData.append('key', API_KEY);
    formData.append('action', 'updateUser');
    formData.append('originalUsername', originalUsername);
    formData.append('username', username);
    formData.append('email', email);
    formData.append('role', role);
    
    // Only include password if provided
    if (password && password.trim()) {
      formData.append('password', password);
    }

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    const result = await response.json();
    console.log('Update user result:', result);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message 
    });
  }
});

// Delete user (admin only)
app.delete('/admin/users/:username', requireAuth('admin'), async (req, res) => {
  try {
    const username = req.params.username;
    
    // Prevent admin from deleting themselves
    if (username === req.session.userId) {
      return res.status(400).json({ 
        success: false,
        message: 'You cannot delete your own account' 
      });
    }
    
    console.log('Admin deleting user:', username);
    
    const formData = new URLSearchParams();
    formData.append('key', API_KEY);
    formData.append('action', 'deleteUser');
    formData.append('username', username);

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    const result = await response.json();
    console.log('Delete user result:', result);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message 
    });
  }
});

// API Routes (your existing functionality)
app.post('/add_TO_database', async (req, res) => {
  console.log('POST /add route accessed');
  
  try {
    const formData = new URLSearchParams();
    formData.append('key', API_KEY);
    
    Object.keys(req.body).forEach(key => {
      formData.append(key, req.body[key]);
    });

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { 
        success: response.ok, 
        message: response.ok ? 'Data added successfully' : 'Failed to add data'
      };
    }

    res.json(data);
  } catch (err) {
    console.error('Error in /add route:', err);
    res.status(500).json({ 
      error: 'Server error', 
      details: err.message
    });
  }
});

app.get('/load_data_from_database', async (req, res) => {
  try {
    const url = `${SCRIPT_URL}?key=${API_KEY}`;
    const response = await fetch(url);
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = [];
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error in /data route:', err);
    res.status(500).json({ 
      error: 'Server error', 
      details: err.message 
    });
  }
});

app.get('/verify', async (req, res) => {
  const certNo = req.query.certificateNo;
  
  if (!certNo) {
    return res.status(400).json({ error: "Certificate number required" });
  }

  try {
    const url = `${SCRIPT_URL}?action=verify&certificateNo=${encodeURIComponent(certNo)}&key=${API_KEY}`;
    const googleRes = await fetch(url);
    const responseText = await googleRes.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { message: responseText, valid: false };
    }
    
    res.json(data);
  } catch (err) {
    console.error("Error verifying certificate:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 404 handler
app.use((req, res, next) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({ 
    error: '404 Not Found',
    path: req.originalUrl,
    message: 'This route does not exist'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log('✨ HTML files should be in /public directory');
  console.log('🔐 Protected pages: /good, /verification, /degree, /admin');
  console.log('🧪 Test: admin/password123 or user1/userpass');
  console.log('📁 File structure: public/login.html, public/admin.html, etc.');
  console.log('Server setup complete!');
});










// // Add this to your server.js - ENHANCED VERSION with logout button injection

// import express from 'express';
// import cors from 'cors';
// import fetch from 'node-fetch';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import session from 'express-session';
// import fs from 'fs';

// const app = express();
// const PORT = 3000;

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// console.log('Starting server setup...');

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Session configuration
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'change-this-secret-key-in-production',
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     secure: false,
//     maxAge: 24 * 60 * 60 * 1000 // 24 hours
//   }
// }));

// // Google Sheets configuration
// const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxAV25ask9JlFGBkY2YiqmQGLZHVFyPXwll-phC-1DFR5Waq9oy42WhoBY0AQjJqROG/exec";
// const API_KEY = process.env.API_KEY || "MY_SECRET_KEY";

// // LOGOUT BUTTON HTML - This gets injected into authenticated pages
// const logoutButtonHTML = `
// <div id="universal-logout" style="position: fixed; top: 15px; right: 15px; z-index: 9999;">
//   <div style="background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); border-radius: 10px; padding: 10px; display: flex; align-items: center; gap: 10px; color: white; font-family: 'Segoe UI', sans-serif;">
//     <span id="user-info" style="font-size: 14px; opacity: 0.9;"></span>
//     <button onclick="logout()" style="
//       background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
//       color: white;
//       border: none;
//       padding: 8px 16px;
//       border-radius: 6px;
//       cursor: pointer;
//       font-weight: 600;
//       font-size: 14px;
//       transition: all 0.2s ease;
//       display: flex;
//       align-items: center;
//       gap: 5px;
//     " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
//       🚪 Logout
//     </button>
//   </div>
// </div>

// <script>
// // Fetch current user info and display
// fetch('/me', { credentials: 'include' })
//   .then(response => response.json())
//   .then(user => {
//     const userInfo = document.getElementById('user-info');
//     if (userInfo && user.username) {
//       userInfo.textContent = \`👋 \${user.username} (\${user.role})\`;
//     }
//   })
//   .catch(err => console.log('User info fetch failed:', err));

// // Logout function
// function logout() {
//   if (confirm('Are you sure you want to logout?')) {
//     fetch('/logout', { 
//       method: 'POST',
//       credentials: 'include'
//     })
//     .then(() => {
//       window.location.href = '/login';
//     })
//     .catch(err => {
//       console.error('Logout error:', err);
//       window.location.href = '/login';
//     });
//   }
// }

// // Auto-logout on session expiry
// setInterval(() => {
//   fetch('/me', { credentials: 'include' })
//     .then(response => {
//       if (!response.ok) {
//         window.location.href = '/login';
//       }
//     })
//     .catch(() => {
//       window.location.href = '/login';
//     });
// }, 30000); // Check every 30 seconds
// </script>
// `;

// // MIDDLEWARE: Inject logout button into authenticated HTML pages
// const injectLogoutButton = (req, res, next) => {
//   // Only inject for authenticated users
//   if (!req.session || !req.session.userId) {
//     return next();
//   }

//   // Store original res.sendFile
//   const originalSendFile = res.sendFile.bind(res);
  
//   // Override res.sendFile to inject logout button
//   res.sendFile = function(filePath, options, callback) {
//     // Check if it's an HTML file
//     if (filePath.endsWith('.html')) {
//       try {
//         // Read the HTML file
//         const htmlContent = fs.readFileSync(filePath, 'utf8');
        
//         // Inject logout button before closing body tag
//         const modifiedHTML = htmlContent.replace(
//           /<\/body>/i, 
//           logoutButtonHTML + '</body>'
//         );
        
//         // Send modified HTML
//         res.setHeader('Content-Type', 'text/html');
//         res.send(modifiedHTML);
        
//         if (callback) callback();
//       } catch (err) {
//         console.error('Error injecting logout button:', err);
//         // Fallback to original sendFile
//         originalSendFile(filePath, options, callback);
//       }
//     } else {
//       // Not HTML, use original sendFile
//       originalSendFile(filePath, options, callback);
//     }
//   };
  
//   next();
// };

// // Apply logout button injection middleware
// app.use(injectLogoutButton);

// // Serve static files AFTER logout button middleware
// app.use(express.static(path.join(__dirname, 'cert')));

// console.log('Middleware configured...');

// // Authentication middleware
// const requireAuth = (requiredRole = null) => {
//   return (req, res, next) => {
//     if (!req.session || !req.session.userId) {
//       return res.redirect('/login');
//     }
    
//     if (requiredRole && req.session.userRole !== requiredRole) {
//       return res.status(403).json({ 
//         error: 'Access denied. Insufficient permissions.',
//         requiredRole: requiredRole,
//         userRole: req.session.userRole
//       });
//     }
    
//     return next();
//   };
// };

// // Login page (no logout button here)
// app.get('/login', (req, res) => {
//   // If already logged in, redirect to main page
//   if (req.session && req.session.userId) {
//     return res.redirect('/good');
//   }

//   const errorMsg = req.query.error === 'invalid' ? 
//     '<p class="error">Invalid username or password</p>' : 
//     req.query.error === 'server' ? 
//     '<p class="error">Server error. Please try again.</p>' : '';
  
//   res.send(`
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <title>Login - Certificate Portal</title>
//       <style>
//         * { margin: 0; padding: 0; box-sizing: border-box; }
//         body { 
//           font-family: 'Segoe UI', sans-serif; 
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//           min-height: 100vh;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }
//         .login-container {
//           background: rgba(255, 255, 255, 0.95);
//           padding: 40px;
//           border-radius: 15px;
//           box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
//           width: 100%;
//           max-width: 400px;
//           backdrop-filter: blur(10px);
//         }
//         h2 { 
//           text-align: center; 
//           margin-bottom: 30px; 
//           color: #4a5568;
//           font-size: 2em;
//         }
//         .form-group { margin: 20px 0; }
//         label { 
//           display: block; 
//           margin-bottom: 8px; 
//           color: #2d3748;
//           font-weight: 500;
//         }
//         input { 
//           width: 100%; 
//           padding: 15px; 
//           border: 2px solid #e2e8f0;
//           border-radius: 8px; 
//           font-size: 16px;
//           transition: border-color 0.3s ease;
//         }
//         input:focus {
//           outline: none;
//           border-color: #667eea;
//           box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
//         }
//         button { 
//           width: 100%; 
//           padding: 15px; 
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//           color: white; 
//           border: none;
//           border-radius: 8px;
//           font-size: 16px;
//           font-weight: 600;
//           cursor: pointer;
//           transition: transform 0.2s ease;
//         }
//         button:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
//         }
//         .error { 
//           color: #e53e3e; 
//           text-align: center; 
//           margin-bottom: 20px;
//           padding: 10px;
//           background: #fed7d7;
//           border-radius: 6px;
//           border-left: 4px solid #e53e3e;
//         }
//         .footer {
//           text-align: center;
//           margin-top: 20px;
//           color: #718096;
//           font-size: 14px;
//         }
//         .test-credentials {
//           background: #f0fff4;
//           border: 1px solid #9ae6b4;
//           border-radius: 8px;
//           padding: 15px;
//           margin-top: 20px;
//         }
//         .test-credentials h4 {
//           color: #2f855a;
//           margin-bottom: 8px;
//         }
//         .test-credentials p {
//           margin: 4px 0;
//           font-size: 14px;
//           color: #2d3748;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="login-container">
//         <h2>🔐 Login</h2>
//         ${errorMsg}
//         <form method="post" action="/login">
//           <div class="form-group">
//             <label for="username">Username</label>
//             <input type="text" id="username" name="username" placeholder="Enter your username" required>
//           </div>
//           <div class="form-group">
//             <label for="password">Password</label>
//             <input type="password" id="password" name="password" placeholder="Enter your password" required>
//           </div>
//           <button type="submit">Login</button>
//         </form>
        
//         <div class="test-credentials">
//           <h4>Test Credentials:</h4>
//           <p><strong>Admin:</strong> admin / password123</p>
//           <p><strong>User:</strong> user1 / userpass</p>
//         </div>
        
//         <div class="footer">
//           <p>Secure Certificate Portal</p>
//         </div>
//       </div>
//     </body>
//     </html>
//   `);
// });

// // Login handler
// app.post('/login', async (req, res) => {
//   const { username, password } = req.body;
  
//   try {
//     console.log('Attempting authentication for:', username);
    
//     const formData = new URLSearchParams();
//     formData.append('key', API_KEY);
//     formData.append('action', 'authenticate');
//     formData.append('username', username);
//     formData.append('password', password);

//     const response = await fetch(SCRIPT_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//       body: formData
//     });

//     const responseText = await response.text();
//     console.log('Authentication response:', responseText);

//     let result;
//     try {
//       result = JSON.parse(responseText);
//     } catch (parseError) {
//       console.error('Failed to parse authentication response:', parseError);
//       return res.redirect('/login?error=server');
//     }

//     if (result.success) {
//       req.session.userId = result.user.username;
//       req.session.userEmail = result.user.email;
//       req.session.userRole = result.user.role;
      
//       console.log('Login successful for:', username, 'Role:', result.user.role);
//       res.redirect('/good');
//     } else {
//       console.log('Login failed for:', username);
//       res.redirect('/login?error=invalid');
//     }
//   } catch (err) {
//     console.error('Login error:', err);
//     res.redirect('/login?error=server');
//   }
// });

// // Logout routes (both GET and POST)
// app.post('/logout', (req, res) => {
//   const username = req.session.userId;
//   req.session.destroy(err => {
//     if (err) {
//       console.error('Logout error:', err);
//       return res.status(500).json({ error: 'Failed to logout' });
//     }
//     res.clearCookie('connect.sid');
//     console.log('User logged out:', username);
//     res.redirect('/login');
//   });
// });

// app.get('/logout', (req, res) => {
//   const username = req.session.userId;
//   req.session.destroy(err => {
//     if (err) {
//       console.error('Logout error:', err);
//       return res.status(500).json({ error: 'Failed to logout' });
//     }
//     res.clearCookie('connect.sid');
//     console.log('User logged out:', username);
//     res.redirect('/login');
//   });
// });

// // Root route
// app.get('/', (req, res) => {
//   const user = req.session.userId ? {
//     username: req.session.userId,
//     email: req.session.userEmail,
//     role: req.session.userRole
//   } : null;

//   res.json({ 
//     message: "Certificate Portal API", 
//     timestamp: new Date().toISOString(),
//     status: "OK",
//     authenticated: !!req.session.userId,
//     user: user
//   });
// });

// // Get current user info
// app.get('/me', requireAuth(), (req, res) => {
//   res.json({
//     username: req.session.userId,
//     email: req.session.userEmail,
//     role: req.session.userRole,
//     sessionActive: true
//   });
// });

// // PROTECTED Certificate pages (will automatically get logout button)
// app.get('/good', requireAuth(), (req, res) => {
//   console.log('Certificate page requested by:', req.session.userId);
//   try {
//     res.sendFile(path.join(__dirname, 'cert', 'good.html'));
//   } catch (err) {
//     console.error('Error serving certificate page:', err);
//     res.status(404).json({ error: 'Certificate page not found' });
//   }
// });

// app.get('/verification', requireAuth(), (req, res) => {
//   console.log('Verify page requested by:', req.session.userId);
//   try {
//     res.sendFile(path.join(__dirname, 'cert', 'verify.html'));
//   } catch (err) {
//     console.error('Error serving verify page:', err);
//     res.status(404).json({ error: 'Verify page not found' });
//   }
// });

// app.get('/degree', requireAuth(), (req, res) => {
//   console.log('Degree certificate page requested by:', req.session.userId);
//   try {
//     res.sendFile(path.join(__dirname, 'cert', 'certificatedegree.html'));
//   } catch (err) {
//     console.error('Error serving degree certificate page:', err);
//     res.status(404).json({ error: 'Degree certificate page not found' });
//   }
// });

// // Admin route
// // Add these routes to your server.js file

// // Serve Admin Panel HTML page
// app.get('/admin', requireAuth('admin'), (req, res) => {
//   // Send the admin panel HTML directly
  //   res.send(`<!DOCTYPE html>
  // <html lang="en">
  // <head>
  //     <meta charset="UTF-8">
  //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //     <title>Admin Panel - User Management</title>
  //     <style>
  //         * {
  //             margin: 0;
  //             padding: 0;
  //             box-sizing: border-box;
  //         }

  //         body {
  //             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  //             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  //             min-height: 100vh;
  //             color: #333;
  //         }

  //         .container {
  //             max-width: 1200px;
  //             margin: 0 auto;
  //             padding: 20px;
  //         }

  //         .header {
  //             background: rgba(255, 255, 255, 0.95);
  //             backdrop-filter: blur(10px);
  //             border-radius: 15px;
  //             padding: 20px;
  //             margin-bottom: 30px;
  //             box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  //             display: flex;
  //             justify-content: space-between;
  //             align-items: center;
  //         }

  //         .header h1 {
  //             color: #4a5568;
  //             font-size: 2.2em;
  //         }

  //         .admin-info {
  //             color: #718096;
  //         }

  //         .nav-tabs {
  //             display: flex;
  //             gap: 10px;
  //             margin-bottom: 30px;
  //         }

  //         .nav-tab {
  //             padding: 12px 24px;
  //             background: rgba(255, 255, 255, 0.2);
  //             color: white;
  //             border: none;
  //             border-radius: 10px;
  //             cursor: pointer;
  //             font-size: 16px;
  //             font-weight: 500;
  //             transition: all 0.3s ease;
  //         }

  //         .nav-tab.active {
  //             background: rgba(255, 255, 255, 0.9);
  //             color: #4a5568;
  //             box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  //         }

  //         .nav-tab:hover:not(.active) {
  //             background: rgba(255, 255, 255, 0.3);
  //         }

  //         .tab-content {
  //             display: none;
  //             background: rgba(255, 255, 255, 0.95);
  //             backdrop-filter: blur(10px);
  //             border-radius: 15px;
  //             padding: 30px;
  //             box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  //         }

  //         .tab-content.active {
  //             display: block;
  //             animation: fadeIn 0.3s ease-in;
  //         }

  //         @keyframes fadeIn {
  //             from { opacity: 0; transform: translateY(10px); }
  //             to { opacity: 1; transform: translateY(0); }
  //         }

  //         /* Form Styles */
  //         .form-grid {
  //             display: grid;
  //             grid-template-columns: 1fr 1fr;
  //             gap: 20px;
  //             margin-bottom: 20px;
  //         }

  //         .form-group {
  //             margin-bottom: 20px;
  //         }

  //         .form-group.full-width {
  //             grid-column: 1 / -1;
  //         }

  //         label {
  //             display: block;
  //             margin-bottom: 8px;
  //             font-weight: 600;
  //             color: #2d3748;
  //         }

  //         input, select {
  //             width: 100%;
  //             padding: 12px;
  //             border: 2px solid #e2e8f0;
  //             border-radius: 8px;
  //             font-size: 16px;
  //             transition: border-color 0.3s ease;
  //         }

  //         input:focus, select:focus {
  //             outline: none;
  //             border-color: #667eea;
  //             box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  //         }

  //         .btn {
  //             padding: 12px 24px;
  //             border: none;
  //             border-radius: 8px;
  //             font-size: 16px;
  //             font-weight: 600;
  //             cursor: pointer;
  //             transition: all 0.2s ease;
  //         }

  //         .btn-primary {
  //             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  //             color: white;
  //         }

  //         .btn-primary:hover {
  //             transform: translateY(-2px);
  //             box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  //         }

  //         .btn-danger {
  //             background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  //             color: white;
  //         }

  //         .btn-danger:hover {
  //             transform: translateY(-2px);
  //             box-shadow: 0 5px 15px rgba(229, 62, 62, 0.4);
  //         }

  //         .btn-success {
  //             background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  //             color: white;
  //         }

  //         .btn-success:hover {
  //             transform: translateY(-2px);
  //             box-shadow: 0 5px 15px rgba(72, 187, 120, 0.4);
  //         }

  //         .btn-warning {
  //             background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  //             color: white;
  //         }

  //         .btn-warning:hover {
  //             transform: translateY(-2px);
  //             box-shadow: 0 5px 15px rgba(237, 137, 54, 0.4);
  //         }

  //         /* Table Styles */
  //         .table-container {
  //             overflow-x: auto;
  //             border-radius: 10px;
  //             box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  //         }

  //         table {
  //             width: 100%;
  //             border-collapse: collapse;
  //             background: white;
  //         }

  //         th, td {
  //             padding: 15px;
  //             text-align: left;
  //             border-bottom: 1px solid #e2e8f0;
  //         }

  //         th {
  //             background: #4299e1;
  //             color: white;
  //             font-weight: 600;
  //         }

  //         tr:hover {
  //             background: #f7fafc;
  //         }

  //         .user-actions {
  //             display: flex;
  //             gap: 8px;
  //         }

  //         .user-actions .btn {
  //             padding: 6px 12px;
  //             font-size: 14px;
  //         }

  //         /* Statistics Cards */
  //         .stats-grid {
  //             display: grid;
  //             grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  //             gap: 20px;
  //             margin-bottom: 30px;
  //         }

  //         .stat-card {
  //             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  //             color: white;
  //             padding: 25px;
  //             border-radius: 12px;
  //             text-align: center;
  //             box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  //         }

  //         .stat-card h3 {
  //             font-size: 2.5em;
  //             margin-bottom: 10px;
  //         }

  //         .stat-card p {
  //             font-size: 1.1em;
  //             opacity: 0.9;
  //         }

  //         /* Modal Styles */
  //         .modal {
  //             display: none;
  //             position: fixed;
  //             z-index: 1000;
  //             left: 0;
  //             top: 0;
  //             width: 100%;
  //             height: 100%;
  //             background: rgba(0, 0, 0, 0.7);
  //             backdrop-filter: blur(5px);
  //         }

  //         .modal-content {
  //             position: absolute;
  //             top: 50%;
  //             left: 50%;
  //             transform: translate(-50%, -50%);
  //             background: white;
  //             padding: 30px;
  //             border-radius: 15px;
  //             width: 90%;
  //             max-width: 500px;
  //             box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  //         }

  //         .modal-header {
  //             display: flex;
  //             justify-content: space-between;
  //             align-items: center;
  //             margin-bottom: 20px;
  //             padding-bottom: 15px;
  //             border-bottom: 2px solid #e2e8f0;
  //         }

  //         .modal-header h2 {
  //             color: #4a5568;
  //         }

  //         .close-btn {
  //             background: none;
  //             border: none;
  //             font-size: 24px;
  //             cursor: pointer;
  //             color: #a0aec0;
  //         }

  //         .close-btn:hover {
  //             color: #2d3748;
  //         }

  //         /* Alert Messages */
  //         .alert {
  //             padding: 15px;
  //             margin-bottom: 20px;
  //             border-radius: 8px;
  //             font-weight: 500;
  //         }

  //         .alert-success {
  //             background: #c6f6d5;
  //             border: 1px solid #9ae6b4;
  //             color: #2f855a;
  //         }

  //         .alert-error {
  //             background: #fed7d7;
  //             border: 1px solid #feb2b2;
  //             color: #c53030;
  //         }

  //         .alert-info {
  //             background: #bee3f8;
  //             border: 1px solid #90cdf4;
  //             color: #2b6cb0;
  //         }

  //         /* Loading Spinner */
  //         .loading {
  //             display: inline-block;
  //             width: 20px;
  //             height: 20px;
  //             border: 3px solid rgba(255, 255, 255, 0.3);
  //             border-radius: 50%;
  //             border-top-color: white;
  //             animation: spin 1s linear infinite;
  //         }

  //         @keyframes spin {
  //             to {
  //                 transform: rotate(360deg);
  //             }
  //         }

  //         /* Responsive */
  //         @media (max-width: 768px) {
  //             .form-grid {
  //                 grid-template-columns: 1fr;
  //             }
              
  //             .stats-grid {
  //                 grid-template-columns: 1fr;
  //             }
              
  //             .user-actions {
  //                 flex-direction: column;
  //             }
              
  //             .header {
  //                 flex-direction: column;
  //                 text-align: center;
  //                 gap: 15px;
  //             }
  //         }
  //     </style>
  // </head>
  // <body>
  //     <div class="container">
  //         <div class="header">
  //             <h1>👨‍💼 Admin Panel</h1>
  //             <div class="admin-info">
  //                 <p>Welcome, <strong>${req.session.userId}</strong></p>
  //                 <p>User Management System</p>
  //             </div>
  //         </div>

  //         <div class="nav-tabs">
  //             <button class="nav-tab active" onclick="showTab('dashboard')">📊 Dashboard</button>
  //             <button class="nav-tab" onclick="showTab('users')">👥 Users</button>
  //             <button class="nav-tab" onclick="showTab('add-user')">➕ Add User</button>
  //         </div>

  //         <!-- Dashboard Tab -->
  //         <div id="dashboard" class="tab-content active">
  //             <div class="stats-grid">
  //                 <div class="stat-card">
  //                     <h3 id="total-users">0</h3>
  //                     <p>Total Users</p>
  //                 </div>
  //                 <div class="stat-card">
  //                     <h3 id="admin-users">0</h3>
  //                     <p>Admin Users</p>
  //                 </div>
  //                 <div class="stat-card">
  //                     <h3 id="regular-users">0</h3>
  //                     <p>Regular Users</p>
  //                 </div>
  //                 <div class="stat-card">
  //                     <h3 id="total-certificates">0</h3>
  //                     <p>Total Certificates</p>
  //                 </div>
  //             </div>

  //             <div class="alert alert-info">
  //                 <strong>ℹ️ System Status:</strong> All services are running normally. Last updated: <span id="last-updated"></span>
  //             </div>

  //             <h3 style="margin-bottom: 20px;">📈 Quick Actions</h3>
  //             <div style="display: flex; gap: 15px; flex-wrap: wrap;">
  //                 <button class="btn btn-primary" onclick="showTab('add-user')">➕ Add New User</button>
  //                 <button class="btn btn-success" onclick="showTab('users')">👥 Manage Users</button>
  //                 <button class="btn btn-warning" onclick="refreshDashboard()">🔄 Refresh Data</button>
  //             </div>
  //         </div>

  //         <!-- Users Tab -->
  //         <div id="users" class="tab-content">
  //             <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
  //                 <h2>👥 User Management</h2>
  //                 <button class="btn btn-primary" onclick="loadUsers()">🔄 Refresh</button>
  //             </div>

  //             <div id="users-alert"></div>

  //             <div class="table-container">
  //                 <table id="users-table">
  //                     <thead>
  //                         <tr>
  //                             <th>Username</th>
  //                             <th>Email</th>
  //                             <th>Role</th>
  //                             <th>Created Date</th>
  //                             <th>Actions</th>
  //                         </tr>
  //                     </thead>
  //                     <tbody id="users-tbody">
  //                         <tr>
  //                             <td colspan="5" style="text-align: center; padding: 40px;">
  //                                 <div class="loading"></div>
  //                                 Loading users...
  //                             </td>
  //                         </tr>
  //                     </tbody>
  //                 </table>
  //             </div>
  //         </div>

  //         <!-- Add User Tab -->
  //         <div id="add-user" class="tab-content">
  //             <h2 style="margin-bottom: 25px;">➕ Add New User</h2>

  //             <div id="add-user-alert"></div>

  //             <form id="add-user-form">
  //                 <div class="form-grid">
  //                     <div class="form-group">
  //                         <label for="new-username">Username *</label>
  //                         <input type="text" id="new-username" name="username" required 
  //                                placeholder="Enter username" minlength="3" maxlength="50">
  //                     </div>

  //                     <div class="form-group">
  //                         <label for="new-email">Email *</label>
  //                         <input type="email" id="new-email" name="email" required 
  //                                placeholder="user@example.com">
  //                     </div>

  //                     <div class="form-group">
  //                         <label for="new-password">Password *</label>
  //                         <input type="password" id="new-password" name="password" required 
  //                                placeholder="Enter password" minlength="6">
  //                     </div>

  //                     <div class="form-group">
  //                         <label for="new-role">Role *</label>
  //                         <select id="new-role" name="role" required>
  //                             <option value="">Select Role</option>
  //                             <option value="user">User</option>
  //                             <option value="admin">Admin</option>
  //                         </select>
  //                     </div>
  //                 </div>

  //                 <div style="display: flex; gap: 15px;">
  //                     <button type="submit" class="btn btn-primary">
  //                         <span id="add-btn-text">➕ Add User</span>
  //                         <div class="loading" id="add-loading" style="display: none;"></div>
  //                     </button>
  //                     <button type="reset" class="btn" style="background: #e2e8f0; color: #4a5568;">
  //                         🔄 Reset Form
  //                     </button>
  //                 </div>
  //             </form>
  //         </div>
  //     </div>

  //     <!-- Edit User Modal -->
  //     <div id="edit-modal" class="modal">
  //         <div class="modal-content">
  //             <div class="modal-header">
  //                 <h2>✏️ Edit User</h2>
  //                 <button class="close-btn" onclick="closeEditModal()">&times;</button>
  //             </div>

  //             <div id="edit-user-alert"></div>

  //             <form id="edit-user-form">
  //                 <input type="hidden" id="edit-original-username" name="originalUsername">
                  
  //                 <div class="form-group">
  //                     <label for="edit-username">Username *</label>
  //                     <input type="text" id="edit-username" name="username" required>
  //                 </div>

  //                 <div class="form-group">
  //                     <label for="edit-email">Email *</label>
  //                     <input type="email" id="edit-email" name="email" required>
  //                 </div>

  //                 <div class="form-group">
  //                     <label for="edit-password">New Password (leave blank to keep current)</label>
  //                     <input type="password" id="edit-password" name="password" 
  //                            placeholder="Enter new password">
  //                 </div>

  //                 <div class="form-group">
  //                     <label for="edit-role">Role *</label>
  //                     <select id="edit-role" name="role" required>
  //                         <option value="user">User</option>
  //                         <option value="admin">Admin</option>
  //                     </select>
  //                 </div>

  //                 <div style="display: flex; gap: 15px; justify-content: flex-end;">
  //                     <button type="button" class="btn" onclick="closeEditModal()" 
  //                             style="background: #e2e8f0; color: #4a5568;">Cancel</button>
  //                     <button type="submit" class="btn btn-success">
  //                         <span id="edit-btn-text">💾 Update User</span>
  //                         <div class="loading" id="edit-loading" style="display: none;"></div>
  //                     </button>
  //                 </div>
  //             </form>
  //         </div>
  //     </div>

  //     <script>
  //         // Global variables
  //         let currentUsers = [];
  //         let currentUser = { username: '${req.session.userId}', role: '${req.session.userRole}' };

  //         // Initialize dashboard
  //         document.addEventListener('DOMContentLoaded', function() {
  //             loadUsers();
  //             loadDashboardStats();
  //         });

  //         // Tab switching
  //         function showTab(tabName) {
  //             document.querySelectorAll('.tab-content').forEach(tab => {
  //                 tab.classList.remove('active');
  //             });
              
  //             document.querySelectorAll('.nav-tab').forEach(tab => {
  //                 tab.classList.remove('active');
  //             });
              
  //             document.getElementById(tabName).classList.add('active');
  //             event.target.classList.add('active');
              
  //             if (tabName === 'users') {
  //                 loadUsers();
  //             } else if (tabName === 'dashboard') {
  //                 loadDashboardStats();
  //             }
  //         }

  //         // Load dashboard statistics
  //         async function loadDashboardStats() {
  //             try {
  //                 const usersResponse = await fetch('/admin/users', { credentials: 'include' });
  //                 const users = await usersResponse.json();
                  
  //                 const certsResponse = await fetch('/data', { credentials: 'include' });
  //                 const certificates = await certsResponse.json();

  //                 document.getElementById('total-users').textContent = users.length || 0;
  //                 document.getElementById('admin-users').textContent = 
  //                     users.filter(u => u.role === 'admin').length || 0;
  //                 document.getElementById('regular-users').textContent = 
  //                     users.filter(u => u.role === 'user').length || 0;
  //                 document.getElementById('total-certificates').textContent = 
  //                     Array.isArray(certificates) ? certificates.length : 0;
                  
  //                 document.getElementById('last-updated').textContent = 
  //                     new Date().toLocaleString();
                      
  //             } catch (error) {
  //                 console.error('Error loading dashboard stats:', error);
  //             }
  //         }

  //         function refreshDashboard() {
  //             loadDashboardStats();
  //             showAlert('dashboard', 'success', 'Dashboard data refreshed successfully!');
  //         }

  //         // Load users list
  //         async function loadUsers() {
  //             try {
  //                 document.getElementById('users-tbody').innerHTML = \`
  //                     <tr>
  //                         <td colspan="5" style="text-align: center; padding: 40px;">
  //                             <div class="loading"></div>
  //                             Loading users...
  //                         </td>
  //                     </tr>
  //                 \`;

  //                 const response = await fetch('/admin/users', { credentials: 'include' });
  //                 const users = await response.json();
                  
  //                 currentUsers = users;
  //                 displayUsers(users);
                  
  //             } catch (error) {
  //                 console.error('Error loading users:', error);
  //                 document.getElementById('users-tbody').innerHTML = \`
  //                     <tr>
  //                         <td colspan="5" style="text-align: center; padding: 40px; color: #e53e3e;">
  //                             ❌ Failed to load users
  //                         </td>
  //                     </tr>
  //                 \`;
  //             }
  //         }

  //         // Display users in table
  //         function displayUsers(users) {
  //             const tbody = document.getElementById('users-tbody');
              
  //             if (!users || users.length === 0) {
  //                 tbody.innerHTML = \`
  //                     <tr>
  //                         <td colspan="5" style="text-align: center; padding: 40px;">
  //                             📝 No users found
  //                         </td>
  //                     </tr>
  //                 \`;
  //                 return;
  //             }

  //             tbody.innerHTML = users.map(user => \`
  //                 <tr>
  //                     <td><strong>\${escapeHtml(user.username)}</strong></td>
  //                     <td>\${escapeHtml(user.email || 'N/A')}</td>
  //                     <td>
  //                         <span style="
  //                             padding: 4px 12px; 
  //                             border-radius: 20px; 
  //                             font-size: 12px; 
  //                             font-weight: 600;
  //                             background: \${user.role === 'admin' ? '#fed7d7' : '#c6f6d5'};
  //                             color: \${user.role === 'admin' ? '#c53030' : '#2f855a'};
  //                         ">
  //                             \${user.role === 'admin' ? '👑 ADMIN' : '👤 USER'}
  //                         </span>
  //                     </td>
  //                     <td>\${user.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}</td>
  //                     <td>
  //                         <div class="user-actions">
  //                             <button class="btn btn-warning" onclick="editUser('\${escapeHtml(user.username)}')">
  //                                 ✏️ Edit
  //                             </button>
  //                             \${user.username !== currentUser?.username ? \`
  //                                 <button class="btn btn-danger" onclick="deleteUser('\${escapeHtml(user.username)}')">
  //                                     🗑️ Delete
  //                                 </button>
  //                             \` : \`
  //                                 <span style="font-size: 12px; color: #a0aec0; padding: 8px;">(Current User)</span>
  //                             \`}
  //                         </div>
  //                     </td>
  //                 </tr>
  //             \`).join('');
  //         }

  //         // Add user form submission
  //         document.getElementById('add-user-form').addEventListener('submit', async function(e) {
  //             e.preventDefault();
              
  //             const submitBtn = document.getElementById('add-btn-text');
  //             const loading = document.getElementById('add-loading');
              
  //             submitBtn.style.display = 'none';
  //             loading.style.display = 'inline-block';
              
  //             try {
  //                 const formData = new FormData(this);
  //                 const userData = Object.fromEntries(formData);
                  
  //                 const response = await fetch('/admin/users', {
  //                     method: 'POST',
  //                     headers: {
  //                         'Content-Type': 'application/json',
  //                     },
  //                     body: JSON.stringify(userData),
  //                     credentials: 'include'
  //                 });

  //                 const result = await response.json();
                  
  //                 if (result.success) {
  //                     showAlert('add-user', 'success', '✅ User added successfully!');
  //                     this.reset();
  //                     loadUsers();
  //                 } else {
  //                     showAlert('add-user', 'error', '❌ ' + (result.message || 'Failed to add user'));
  //                 }
                  
  //             } catch (error) {
  //                 console.error('Error adding user:', error);
  //                 showAlert('add-user', 'error', '❌ Network error. Please try again.');
  //             }
              
  //             submitBtn.style.display = 'inline';
  //             loading.style.display = 'none';
  //         });

  //         // Edit user
  //         function editUser(username) {
  //             const user = currentUsers.find(u => u.username === username);
  //             if (!user) return;

  //             document.getElementById('edit-original-username').value = user.username;
  //             document.getElementById('edit-username').value = user.username;
  //             document.getElementById('edit-email').value = user.email || '';
  //             document.getElementById('edit-password').value = '';
  //             document.getElementById('edit-role').value = user.role || 'user';
              
  //             document.getElementById('edit-modal').style.display = 'block';
  //         }

  //         function closeEditModal() {
  //             document.getElementById('edit-modal').style.display = 'none';
  //             document.getElementById('edit-user-alert').innerHTML = '';
  //         }

  //         // Edit user form submission
  //         document.getElementById('edit-user-form').addEventListener('submit', async function(e) {
  //             e.preventDefault();
              
  //             const submitBtn = document.getElementById('edit-btn-text');
  //             const loading = document.getElementById('edit-loading');
              
  //             submitBtn.style.display = 'none';
  //             loading.style.display = 'inline-block';
              
  //             try {
  //                 const formData = new FormData(this);
  //                 const userData = Object.fromEntries(formData);
                  
  //                 const response = await fetch('/admin/users/' + encodeURIComponent(userData.originalUsername), {
  //                     method: 'PUT',
  //                     headers: {
  //                         'Content-Type': 'application/json',
  //                     },
  //                     body: JSON.stringify(userData),
  //                     credentials: 'include'
  //                 });

  //                 const result = await response.json();
                  
  //                 if (result.success) {
  //                     showAlert('edit-user', 'success', '✅ User updated successfully!');
  //                     setTimeout(() => {
  //                         closeEditModal();
  //                         loadUsers();
  //                     }, 1500);
  //                 } else {
  //                     showAlert('edit-user', 'error', '❌ ' + (result.message || 'Failed to update user'));
  //                 }
                  
  //             } catch (error) {
  //                 console.error('Error updating user:', error);
  //                 showAlert('edit-user', 'error', '❌ Network error. Please try again.');
  //             }
              
  //             submitBtn.style.display = 'inline';
  //             loading.style.display = 'none';
  //         });

  //         // Delete user
  //         async function deleteUser(username) {
  //             if (username === currentUser?.username) {
  //                 showAlert('users', 'error', '❌ You cannot delete your own account');
  //                 return;
  //             }

  //             if (!confirm(\`Are you sure you want to delete user "\${username}"?\\n\\nThis action cannot be undone.\`)) {
  //                 return;
  //             }

  //             try {
  //                 const response = await fetch('/admin/users/' + encodeURIComponent(username), {
  //                     method: 'DELETE',
  //                     credentials: 'include'
  //                 });

  //                 const result = await response.json();
                  
  //                 if (result.success) {
  //                     showAlert('users', 'success', '✅ User deleted successfully!');
  //                     loadUsers();
  //                 } else {
  //                     showAlert('users', 'error', '❌ ' + (result.message || 'Failed to delete user'));
  //                 }
                  
  //             } catch (error) {
  //                 console.error('Error deleting user:', error);
  //                 showAlert('users', 'error', '❌ Network error. Please try again.');
  //             }
  //         }

  //         // Show alert messages
  //         function showAlert(section, type, message) {
  //             const alertContainer = document.getElementById(section + '-alert');
  //             const alertClass = type === 'success' ? 'alert-success' : 
  //                              type === 'error' ? 'alert-error' : 'alert-info';
              
  //             alertContainer.innerHTML = \`
  //                 <div class="alert \${alertClass}">
  //                     \${message}
  //                 </div>
  //             \`;
              
  //             if (type === 'success') {
  //                 setTimeout(() => {
  //                     alertContainer.innerHTML = '';
  //                 }, 5000);
  //             }
  //         }

  //         // Utility function to escape HTML
  //         function escapeHtml(text) {
  //             const div = document.createElement('div');
  //             div.textContent = text;
  //             return div.innerHTML;
  //         }

  //         // Close modal when clicking outside
  //         window.addEventListener('click', function(event) {
  //             const modal = document.getElementById('edit-modal');
  //             if (event.target === modal) {
  //                 closeEditModal();
  //             }
  //         });
  //     </script>
  // </body>
  // </html>`);
// });

// // Admin API Routes

// // Get all users (admin only)
// app.get('/admin/users', requireAuth('admin'), async (req, res) => {
//   try {
//     console.log('Admin fetching all users');
    
//     const url = `${SCRIPT_URL}?key=${API_KEY}&action=getUsers`;
//     const response = await fetch(url);
//     const responseText = await response.text();
    
//     let users;
//     try {
//       users = JSON.parse(responseText);
//     } catch (e) {
//       console.error('Failed to parse users response:', responseText);
//       users = [];
//     }
    
//     console.log('Fetched users:', users.length);
//     res.json(users);
    
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     res.status(500).json({ 
//       error: 'Failed to fetch users',
//       details: error.message 
//     });
//   }
// });

// // Add new user (admin only)
// app.post('/admin/users', requireAuth('admin'), async (req, res) => {
//   try {
//     const { username, email, password, role } = req.body;
    
//     // Validation
//     if (!username || !email || !password || !role) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'All fields are required' 
//       });
//     }

//     if (username.length < 3) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Username must be at least 3 characters long' 
//       });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Password must be at least 6 characters long' 
//       });
//     }

//     if (!['user', 'admin'].includes(role)) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Role must be either "user" or "admin"' 
//       });
//     }

//     console.log('Admin adding new user:', username);
    
//     const formData = new URLSearchParams();
//     formData.append('key', API_KEY);
//     formData.append('action', 'addUser');
//     formData.append('username', username);
//     formData.append('email', email);
//     formData.append('password', password);
//     formData.append('role', role);

//     const response = await fetch(SCRIPT_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//       body: formData
//     });

//     const result = await response.json();
//     console.log('Add user result:', result);
    
//     res.json(result);
    
//   } catch (error) {
//     console.error('Error adding user:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error: ' + error.message 
//     });
//   }
// });

// // Update user (admin only)
// app.put('/admin/users/:username', requireAuth('admin'), async (req, res) => {
//   try {
//     const originalUsername = req.params.username;
//     const { username, email, password, role } = req.body;
    
//     // Validation
//     if (!username || !email || !role) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Username, email, and role are required' 
//       });
//     }

//     if (username.length < 3) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Username must be at least 3 characters long' 
//       });
//     }

//     if (password && password.length < 6) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Password must be at least 6 characters long' 
//       });
//     }

//     if (!['user', 'admin'].includes(role)) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Role must be either "user" or "admin"' 
//       });
//     }

//     console.log('Admin updating user:', originalUsername, '->', username);
    
//     const formData = new URLSearchParams();
//     formData.append('key', API_KEY);
//     formData.append('action', 'updateUser');
//     formData.append('originalUsername', originalUsername);
//     formData.append('username', username);
//     formData.append('email', email);
//     formData.append('role', role);
    
//     // Only include password if provided
//     if (password && password.trim()) {
//       formData.append('password', password);
//     }

//     const response = await fetch(SCRIPT_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//       body: formData
//     });

//     const result = await response.json();
//     console.log('Update user result:', result);
    
//     res.json(result);
    
//   } catch (error) {
//     console.error('Error updating user:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error: ' + error.message 
//     });
//   }
// });

// // Delete user (admin only)
// app.delete('/admin/users/:username', requireAuth('admin'), async (req, res) => {
//   try {
//     const username = req.params.username;
    
//     // Prevent admin from deleting themselves
//     if (username === req.session.userId) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'You cannot delete your own account' 
//       });
//     }
    
//     console.log('Admin deleting user:', username);
    
//     const formData = new URLSearchParams();
//     formData.append('key', API_KEY);
//     formData.append('action', 'deleteUser');
//     formData.append('username', username);

//     const response = await fetch(SCRIPT_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//       body: formData
//     });

//     const result = await response.json();
//     console.log('Delete user result:', result);
    
//     res.json(result);
    
//   } catch (error) {
//     console.error('Error deleting user:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error: ' + error.message 
//     });
//   }
// });

// // API Routes (your existing functionality)
// app.post('/add', async (req, res) => {
//   console.log('POST /add route accessed');
  
//   try {
//     const formData = new URLSearchParams();
//     formData.append('key', API_KEY);
    
//     Object.keys(req.body).forEach(key => {
//       formData.append(key, req.body[key]);
//     });

//     const response = await fetch(SCRIPT_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//       body: formData
//     });

//     const responseText = await response.text();
//     let data;
//     try {
//       data = JSON.parse(responseText);
//     } catch (e) {
//       data = { 
//         success: response.ok, 
//         message: response.ok ? 'Data added successfully' : 'Failed to add data'
//       };
//     }

//     res.json(data);
//   } catch (err) {
//     console.error('Error in /add route:', err);
//     res.status(500).json({ 
//       error: 'Server error', 
//       details: err.message
//     });
//   }
// });

// app.get('/data', async (req, res) => {
//   try {
//     const url = `${SCRIPT_URL}?key=${API_KEY}`;
//     const response = await fetch(url);
//     const responseText = await response.text();
    
//     let data;
//     try {
//       data = JSON.parse(responseText);
//     } catch (e) {
//       data = [];
//     }
    
//     res.json(data);
//   } catch (err) {
//     console.error('Error in /data route:', err);
//     res.status(500).json({ 
//       error: 'Server error', 
//       details: err.message 
//     });
//   }
// });

// app.get('/verify', async (req, res) => {
//   const certNo = req.query.certificateNo;
  
//   if (!certNo) {
//     return res.status(400).json({ error: "Certificate number required" });
//   }

//   try {
//     const url = `${SCRIPT_URL}?action=verify&certificateNo=${encodeURIComponent(certNo)}&key=${API_KEY}`;
//     const googleRes = await fetch(url);
//     const responseText = await googleRes.text();
    
//     let data;
//     try {
//       data = JSON.parse(responseText);
//     } catch (e) {
//       data = { message: responseText, valid: false };
//     }
    
//     res.json(data);
//   } catch (err) {
//     console.error("Error verifying certificate:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // 404 handler
// app.use((req, res, next) => {
//   console.log('404 - Route not found:', req.originalUrl);
//   res.status(404).json({ 
//     error: '404 Not Found',
//     path: req.originalUrl,
//     message: 'This route does not exist'
//   });
// });

// // Error handler
// app.use((err, req, res, next) => {
//   console.error('Server error:', err);
//   res.status(500).json({ error: 'Internal server error' });
// });

// // Start server
// app.listen(PORT, (err) => {
//   if (err) {
//     console.error('Failed to start server:', err);
//     process.exit(1);
//   }
  
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
//   console.log('✨ Universal logout button will appear on ALL authenticated pages');
//   console.log('🔐 Protected pages: /good, /verification, /degree');
//   console.log('🧪 Test: admin/password123 or user1/userpass');
//   console.log('Server setup complete!');
// });
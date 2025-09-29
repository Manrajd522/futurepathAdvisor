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
//navbar
const navbarHTML = `
<nav style="position:fixed; top:0; left:0; right:0; height:60px; background:#1a202c; color:white; padding:0 20px; font-family:'Segoe UI',sans-serif; display:flex; justify-content:space-between; align-items:center; z-index:1000; box-shadow:0 2px 6px rgba(0,0,0,0.2);">
  <div style="display:flex; align-items:center; font-weight:bold; font-size:18px;">
    <img src="erasebg-transformed.png" alt="Institute Logo" style="width:45px; height:auto; margin-right:12px;">
    FUTURE PATH ADVISOR
  </div>

  <!-- Hamburger button -->
  <div class="menu-toggle" style="display:none; cursor:pointer; font-size:26px; padding:5px;">☰</div>

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
    color: white !important;
    text-decoration: none;
    padding: 8px 12px;
    border-radius: 6px;
    transition: background 0.2s ease;
  }

  nav a:hover {
    background: rgba(255, 255, 255, 0.1) !important;
  }

  .menu-toggle {
    display: none !important;
    cursor: pointer;
    font-size: 26px;
    padding: 5px;
    user-select: none;
  }

  .nav-links {
    display: flex;
    gap: 20px;
    align-items: center;
    font-size: 15px;
  }

  /* Mobile styles */
  @media (max-width: 768px) {
    .menu-toggle {
      display: block !important;
    }

    .nav-links {
      display: none !important;
      flex-direction: column;
      position: fixed;
      top: 60px;
      right: 0;
      width: 220px;
      background: #2d3748;
      padding: 15px;
      gap: 10px !important;
      border-left: 2px solid #667eea;
      height: calc(100vh - 60px);
      box-shadow: -2px 0 8px rgba(0,0,0,0.3);
      z-index: 999;
      transition: all 0.3s ease;
      transform: translateX(100%);
      opacity: 0;
    }

    .nav-links.show {
      display: flex !important;
      transform: translateX(0) !important;
      opacity: 1 !important;
    }

    .nav-links a {
      font-size: 16px !important;
      width: 100%;
      text-align: left;
      display: block;
      padding: 12px !important;
    }
  }

  /* Overlay to close menu when clicking outside */
  .menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 998;
    display: none;
  }

  .menu-overlay.show {
    display: block;
  }
</style>

<!-- Menu overlay for mobile -->
<div class="menu-overlay" id="menu-overlay"></div>

<script>
  document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded, initializing navbar...");
    
    const toggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    const overlay = document.getElementById("menu-overlay");

    console.log("Toggle button:", toggle);
    console.log("Nav links:", navLinks);

    if (toggle && navLinks) {
      // Toggle menu function
      function toggleMenu() {
        console.log("Toggle menu clicked");
        const isOpen = navLinks.classList.contains("show");
        
        if (isOpen) {
          navLinks.classList.remove("show");
          overlay.classList.remove("show");
        } else {
          navLinks.classList.add("show");
          overlay.classList.add("show");
        }
      }

      // Add click event to hamburger button
      toggle.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMenu();
      });

      // Close menu when clicking overlay
      if (overlay) {
        overlay.addEventListener("click", function() {
          navLinks.classList.remove("show");
          overlay.classList.remove("show");
        });
      }

      // Close menu when clicking on nav links (mobile)
      navLinks.addEventListener("click", function(e) {
        if (window.innerWidth <= 768 && e.target.tagName === 'A') {
          navLinks.classList.remove("show");
          overlay.classList.remove("show");
        }
      });

      // Close menu on window resize if opened
      window.addEventListener("resize", function() {
        if (window.innerWidth > 768) {
          navLinks.classList.remove("show");
          overlay.classList.remove("show");
        }
      });
    } else {
      console.error("Toggle button or nav links not found!");
    }

    // Load user links
    fetch('/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(user => {
        console.log("User data loaded:", user);
        const nav = document.getElementById('nav-links');
        if (!nav) return;
        
        nav.innerHTML = \`
          <a href="/good">🏠 Home</a>
          <a href="/verification">✅ Verify</a>
          \${user.role === 'admin' ? '<a href="/admin">⚙️ Admin</a>' : ''}
          <a href="#" onclick="logout()" style="color:#f56565;">🚪 Logout</a>
        \`;
      })
      .catch(err => {
        console.log("User not logged in, showing login link");
        const nav = document.getElementById('nav-links');
        if (nav) nav.innerHTML = '<a href="/login">🔑 Login</a>';
      });
  });

  function logout() {
    if (confirm('Are you sure you want to logout?')) {
      fetch('/logout', { method: 'POST', credentials: 'include' })
        .then(() => window.location.href = '/login')
        .catch(() => window.location.href = '/login');
    }
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

app.get("/verify", async (req, res) => {
  const { certificateNo } = req.query;

  if (!certificateNo) {
    return res.status(400).json({ error: "Certificate number is required" });
  }

  try {
    const response = await fetch(`${SCRIPT_URL}?action=verify&certificateNo=${encodeURIComponent(certificateNo)}&key=${SECRET_KEY}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({ error: "Server error while verifying certificate" });
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

//site_map
app.get('/sitepaths', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'public', 'sitemap.html'));
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
// Replace your existing 404 handler with this updated version

// 404 handler - Updated to serve HTML file
app.use((req, res, next) => {
  console.log('404 - Route not found:', req.originalUrl);
  
  // Try to serve the 404 HTML file
  try {
    res.status(404).sendFile(path.join(__dirname, 'public', 'notfound.html'));
  } catch (err) {
    console.error('Error serving 404 page:', err);
    // Fallback to JSON response if HTML file doesn't exist
    res.status(404).json({ 
      error: '404 Not Found',
      path: req.originalUrl,
      message: 'This route does not exist'
    });
  }
});

// Alternative 404 handler with better error handling
app.use((req, res, next) => {
  console.log('404 - Route not found:', req.originalUrl);
  
  const notFoundPath = path.join(__dirname, 'public', 'notfound.html');
  
  // Check if the 404 HTML file exists
  fs.access(notFoundPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('404 HTML file not found, using JSON fallback');
      // Fallback to JSON response
      return res.status(404).json({ 
        error: '404 Not Found',
        path: req.originalUrl,
        message: 'This route does not exist. Please check the URL and try again.'
      });
    }
    
    // Serve the HTML file
    res.status(404).sendFile(notFoundPath);
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








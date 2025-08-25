document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");
  const dashboardLink = document.getElementById("dashboardLink");

  // Redirect logged in users from login or register
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Show dashboard link on homepage
      if(dashboardLink) dashboardLink.style.display = "inline";
      
      // Redirect from login/register pages
      if (window.location.pathname.includes("login") || window.location.pathname.includes("register")) {
        window.location.href = "dashboard.html";
      }
    } else {
      // Hide dashboard link if logged out
      if(dashboardLink) dashboardLink.style.display = "none";
    }
  });

  // Register feature
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("registerEmail").value.trim();
      const password = document.getElementById("registerPassword").value;
      const abilityLevel = document.getElementById("abilityLevel").value;
      const userRole = document.getElementById("userRole").value;
      const msgEl = document.getElementById("registerMsg");

      // Basic validation
      if (!email || !password || !abilityLevel || !userRole) {
        msgEl.textContent = "Please fill all fields.";
        msgEl.style.color = "red";
        return;
      }

      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Save extra user info in Firestore
        await usersCollection.doc(user.uid).set({
          email,
          abilityLevel,
          role: userRole,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        logAction(`User registered: ${email} (Role: ${userRole})`);
        msgEl.textContent = "Registration successful! Redirecting...";
        msgEl.style.color = "green";
        setTimeout(() => { window.location.href = "dashboard.html"; }, 1500);
      } catch (error) {
        msgEl.textContent = error.message;
        msgEl.style.color = "red";
        logAction(`Registration failed: ${error.message}`, "ERROR");
      }
    });
  }

  // Login feature
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;
      const msgEl = document.getElementById("loginMsg");

      if (!email || !password) {
        msgEl.textContent = "Please fill all fields.";
        msgEl.style.color = "red";
        return;
      }

      try {
        await auth.signInWithEmailAndPassword(email, password);
        logAction(`User logged in: ${email}`);
        msgEl.textContent = "Login successful! Redirecting...";
        msgEl.style.color = "green";
        setTimeout(() => { window.location.href = "dashboard.html"; }, 1000);
      } catch (error) {
        msgEl.textContent = error.message;
        msgEl.style.color = "red";
        logAction(`Login failed: ${error.message}`, "ERROR");
      }
    });
  }

  // Logout feature
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        await auth.signOut();
        logAction(`User logged out: ${user.email}`);
        window.location.href = "index.html";
      } catch (error) {
        alert("Logout failed: " + error.message);
        logAction(`Logout failed: ${error.message}`, "ERROR");
      }
    });
  }
});
const provider = new firebase.auth.GoogleAuthProvider();

document.getElementById('googleSignInBtn').addEventListener('click', async () => {
  try {
    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    if (!user.emailVerified) {
      await user.sendEmailVerification();
      document.getElementById('verificationMsg').textContent = 'Verification email sent, please verify!';
    }
    // Store user data and profile picture from Google
    await usersCollection.doc(user.uid).set({
      email: user.email,
      profilePicURL: user.photoURL,
      role: 'user',
      abilityLevel: 'Beginner',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, {merge: true});
    logAction(`Google OAuth login: ${user.email}`);
    window.location.href = 'dashboard.html';
  } catch (e) {
    alert('Google sign-in failed: ' + e.message);
  }
});
const passwordInput = document.getElementById('registerPassword');
const strengthSpan = document.querySelector('#passwordStrength span');
passwordInput.addEventListener('input', () => {
  const val = passwordInput.value;
  let strength = 'Weak';
  let color = 'red';
  if(val.length > 8 && /[A-Z]/.test(val) && /\d/.test(val)) {
    strength = 'Strong';
    color = 'green';
  } else if(val.length > 5) {
    strength = 'Medium';
    color = 'orange';
  }
  strengthSpan.textContent = strength;
  strengthSpan.style.color = color;
});

// Terms checkbox validation in register submit
if(!document.getElementById('acceptTerms').checked){
  msgEl.textContent = "You must accept Terms & Privacy.";
  msgEl.style.color = "red";
  return;
}

// Realtime email check (debounced, simple example)
const checkEmailExists = debounce(async (email) => {
  const methods = await auth.fetchSignInMethodsForEmail(email);
  if(methods.length > 0){
    msgEl.textContent = "Email already in use.";
    msgEl.style.color = "red";
  } else {
    msgEl.textContent = "";
  }
}, 500);

document.getElementById('registerEmail').addEventListener('input', e => {
  checkEmailExists(e.target.value);
});

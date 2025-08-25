const profileBtn = document.getElementById("profileBtn");
const profileSection = document.getElementById("profileSection");
const profileForm = document.getElementById("profileForm");
const profileAbilityLevel = document.getElementById("profileAbilityLevel");

document.addEventListener("DOMContentLoaded", () => {
  if (!profileBtn || !profileSection || !profileForm) return;

  profileBtn.addEventListener("click", () => {
    profileSection.style.display = profileSection.style.display === "block" ? "none" : "block";
    if(profileSection.style.display === "block") {
      loadUserProfile();
    }
  });

  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const abilityLevel = profileAbilityLevel.value;
    if(!abilityLevel) {
      alert("Please select your ability level");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      await usersCollection.doc(user.uid).update({
        abilityLevel,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert("Profile updated");
      logAction(`User updated profile: ${user.email}`);
    } catch (error) {
      alert("Failed to update profile: " + error.message);
      logAction(`Error updating profile: ${error.message}`, "ERROR");
    }
  });
});

async function loadUserProfile() {
  try {
    const user = auth.currentUser;
    if (!user) return;
    const doc = await usersCollection.doc(user.uid).get();
    if (doc.exists) {
      const data = doc.data();
      profileAbilityLevel.value = data.abilityLevel || "";
    }
  } catch (error) {
    console.error(error);
  }
}
const notifBell = document.getElementById('notificationBell');
const notifCount = document.getElementById('notifCount');
const notifDropdown = document.getElementById('notifDropdown');

notifBell.addEventListener('click', () => {
  notifDropdown.style.display = notifDropdown.style.display === 'block' ? 'none' : 'block';
});

auth.onAuthStateChanged(user => {
  if(user){
    const notifRef = db.collection('notifications').where('uid', '==', user.uid).where('read', '==', false);
    notifRef.onSnapshot(snapshot => {
      notifCount.textContent = snapshot.size || '';
      notifDropdown.innerHTML = snapshot.docs.map(doc => `<div>${doc.data().message}</div>`).join('');
    });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById('darkModeToggle');
  const body = document.body;

  // Apply saved mode on page load
  if(localStorage.getItem('darkMode') === 'enabled') {
    body.classList.add('dark-mode');
  }

  toggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark-mode');

    // Save preference to localStorage
    if(body.classList.contains('dark-mode')) {
      localStorage.setItem('darkMode', 'enabled');
    } else {
      localStorage.setItem('darkMode', 'disabled');
    }
  });
});

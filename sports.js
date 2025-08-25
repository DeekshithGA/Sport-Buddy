let sportsCache = [];
let lastVisibleDoc = null;
const pageSize = 5;

const sportsList = document.getElementById("sportsList");
const sportsForm = document.getElementById("sportsForm");
const searchInput = document.getElementById("searchInput");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const showAddSportFormBtn = document.getElementById("showAddSportFormBtn");
const addSportSection = document.getElementById("addSportSection");
const cancelAddSportBtn = document.getElementById("cancelAddSportBtn");
const sportIdInput = document.getElementById("sportId");

// Initialize event listeners when DOM loaded
document.addEventListener("DOMContentLoaded", () => {
  if (sportsForm) {
    sportsForm.addEventListener("submit", handleAddOrUpdateSport);
  }
  if (searchInput) {
    searchInput.addEventListener("input", debounce(handleSearch, 300));
  }
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", loadMoreSports);
  }
  if (showAddSportFormBtn) {
    showAddSportFormBtn.addEventListener("click", () => {
      resetForm();
      addSportSection.style.display = "block";
    });
  }
  if (cancelAddSportBtn) {
    cancelAddSportBtn.addEventListener("click", () => {
      addSportSection.style.display = "none";
      resetForm();
    });
  }

  loadSports(); // Load initial sports page
});

// Debounce helper
function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

// Load sports with pagination and real-time update
async function loadSports(queryText = "") {
  sportsList.innerHTML = "";
  sportsCache = [];
  lastVisibleDoc = null;

  const baseQuery = sportsCollection.orderBy("createdAt", "desc").limit(pageSize);

  let query;

  if(queryText.trim() !== "") {
    // For simplicity, do client-side filter after loading a page (Firestore text search limited)
    query = baseQuery;
  } else {
    query = baseQuery;
  }

  try {
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      sportsList.innerHTML = "<li>No sports events found</li>";
      loadMoreBtn.style.display = "none";
      return;
    }

    lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if(queryText.trim() !== "") {
      const filtered = filterSportsLocally(data, queryText);
      displaySports(filtered);
      loadMoreBtn.style.display = "none";
    } else {
      sportsCache.push(...data);
      displaySports(sportsCache);
      loadMoreBtn.style.display = (snapshot.docs.length === pageSize) ? "inline" : "none";
    }
  } catch (err) {
    console.error(err);
    logAction("Error loading sports: " + err.message, "ERROR");
  }
}

// Load more sports for pagination
async function loadMoreSports() {
  if (!lastVisibleDoc) return;

  const query = sportsCollection.orderBy("createdAt", "desc").startAfter(lastVisibleDoc).limit(pageSize);

  try {
    const snapshot = await query.get();

    if (snapshot.empty) {
      loadMoreBtn.style.display = "none";
      return;
    }

    lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

    const newSports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    sportsCache.push(...newSports);
    displaySports(sportsCache);
    loadMoreBtn.style.display = (snapshot.docs.length === pageSize) ? "inline" : "none";

  } catch (error) {
    console.error(error);
    logAction("Error loading more sports: " + error.message, "ERROR");
  }
}

// Display list of sports with edit & delete buttons
function displaySports(sports) {
  sportsList.innerHTML = "";
  if (sports.length === 0) {
    sportsList.innerHTML = "<li>No sports to show</li>";
    return;
  }

  sports.forEach(sport => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${escapeHtml(sport.name)}</strong> (${escapeHtml(sport.category)}) - ${escapeHtml(sport.city)}, ${escapeHtml(sport.area)} <br />
      Date & Time: ${new Date(sport.dateTime).toLocaleString()} <br />
      <button class="editBtn" data-id="${sport.id}">Edit</button>
      <button class="deleteBtn" data-id="${sport.id}">Delete</button>
    `;

    sportsList.appendChild(li);

    li.querySelector(".editBtn").addEventListener("click", () => {
      openEditForm(sport);
    });

    li.querySelector(".deleteBtn").addEventListener("click", async () => {
      if(confirm("Confirm delete this sport event?")) {
        await deleteSport(sport.id);
      }
    });
  });
}

// Escape HTML helper
function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// Open form with sport data to edit
function openEditForm(sport) {
  if (!addSportSection.style) return;

  addSportSection.style.display = "block";
  sportIdInput.value = sport.id;
  document.getElementById("sportName").value = sport.name;
  document.getElementById("sportCategory").value = sport.category;
  document.getElementById("sportCity").value = sport.city;
  document.getElementById("sportArea").value = sport.area;
  document.getElementById("sportDateTime").value = new Date(sport.dateTime).toISOString().slice(0,16);
}

// Reset add sport form
function resetForm() {
  sportsForm.reset();
  sportIdInput.value = "";
}

// Add or update sport handler
async function handleAddOrUpdateSport(e) {
  e.preventDefault();

  const id = sportIdInput.value;
  const name = document.getElementById("sportName").value.trim();
  const category = document.getElementById("sportCategory").value.trim();
  const city = document.getElementById("sportCity").value.trim();
  const area = document.getElementById("sportArea").value.trim();
  const dateTime = document.getElementById("sportDateTime").value;

  // Basic form validation
  if (!name || !category || !city || !area || !dateTime) {
    alert("Please fill all fields");
    return;
  }

  try {
    if (id) {
      // Update
      await sportsCollection.doc(id).update({
        name,
        category,
        city,
        area,
        dateTime: new Date(dateTime),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      logAction(`Sport event updated: ${name} (ID: ${id})`);
    } else {
      // Add new
      await sportsCollection.add({
        name,
        category,
        city,
        area,
        dateTime: new Date(dateTime),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      logAction(`New sport event added: ${name}`);
    }
    resetForm();
    addSportSection.style.display = "none";
    await loadSports();
  } catch (error) {
    console.error(error);
    alert("Failed to save sport event: " + error.message);
    logAction(`Error saving sport event: ${error.message}`, "ERROR");
  }
}

// Delete sport event
async function deleteSport(id) {
  try {
    await sportsCollection.doc(id).delete();
    logAction(`Sport event deleted, ID: ${id}`);
    await loadSports();
  } catch (error) {
    alert("Failed to delete sport: " + error.message);
    logAction(`Error deleting sport event: ${error.message}`, "ERROR");
  }
}

// Handle search input locally for demo (ideal: firestore full text or Algolia integration)
function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  if (!query) {
    displaySports(sportsCache);
    loadMoreBtn.style.display = (sportsCache.length >= pageSize) ? "inline" : "none";
    return;
  }
  const filtered = filterSportsLocally(sportsCache, query);
  displaySports(filtered);
  loadMoreBtn.style.display = "none";
}

function filterSportsLocally(data, query) {
  return data.filter(sport => 
    sport.name.toLowerCase().includes(query) || 
    sport.category.toLowerCase().includes(query) ||
    sport.city.toLowerCase().includes(query)
  );
}
const chatMessagesDiv = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
let currentEventId = null; // set when user selects an event

chatForm.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = document.getElementById('chatInput').value.trim();
  if (!msg || !currentEventId) return;

  try {
    await sportsCollection.doc(currentEventId).collection('chat').add({
      uid: auth.currentUser.uid,
      message: msg,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('chatInput').value = '';
  } catch (e) {
    alert("Message send failed: " + e.message);
  }
});

function loadChatMessages(eventId) {
  currentEventId = eventId;
  sportsCollection.doc(eventId).collection('chat')
    .orderBy('timestamp')
    .onSnapshot(snapshot => {
      chatMessagesDiv.innerHTML = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        const div = document.createElement('div');
        div.textContent = `${data.message}`;
        chatMessagesDiv.appendChild(div);
      });
    });
}
async function searchNearbySports(lat, lng, radiusKm = 10) {
  // Firestore doesn't natively support geo queries, use geohashes or third party libraries (e.g. geofirestore).
  // Example: Integrate geofirestore and query based on proximity.
}
document.getElementById('exportCsvBtn').addEventListener('click', () => {
  let csv = 'name,category,city,area,dateTime\n';
  sportsCache.forEach(sport => {
    csv += `"${sport.name}","${sport.category}","${sport.city}","${sport.area}","${new Date(sport.dateTime).toISOString()}"\n`;
  });
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sports-events.csv';
  a.click();
  URL.revokeObjectURL(url);
});

async function logAction(message, level = "INFO") {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${level}] ${timestamp} - ${message}`);

    await loggingCollection.add({
      message,
      level,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Logging failed:", error);
  }
}
const errorFrequency = {};
const ERROR_THRESHOLD = 5;

async function logAction(message, level = "INFO") {
  let userId = "unknown";
  let userRole = "unknown";

  const user = auth.currentUser;
  if (user) {
    userId = user.uid;
    const userDoc = await usersCollection.doc(user.uid).get();
    if(userDoc.exists) userRole = userDoc.data().role || "unknown";
  }

  try {
    const timestamp = new Date().toISOString();
    console.log(`[${level}] ${timestamp} - User(${userId}, Role:${userRole}): ${message}`);

    // Store in Firestore
    await loggingCollection.add({
      message,
      level,
      userId,
      userRole,
      timestamp: new Date()
    });

    if(level === "ERROR") {
      errorFrequency[message] = (errorFrequency[message] || 0) + 1;
      if(errorFrequency[message] >= ERROR_THRESHOLD) {
        alert(`High frequency error: ${message}`);
        errorFrequency[message] = 0;
      }
    }
  } catch (error) {
    console.error("Logging failed:", error);
  }
}

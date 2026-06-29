const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require("./service-account.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function seedNotifications() {
  console.log("Seeding notifications...");
  const usersSnap = await db.collection("users").get();
  let count = 0;

  for (const doc of usersSnap.docs) {
    const user = doc.data();
    
    // Add welcome notification
    await db.collection("notifications").add({
      userId: doc.id,
      title: "Welcome to Mukti Portal",
      message: "Your profile has been created successfully. Explore the dashboard to get started.",
      read: false,
      timestamp: FieldValue.serverTimestamp(),
      type: "info"
    });
    count++;

    // Add specific notifications based on role
    if (user.role === "worker" || user.role === "both") {
      await db.collection("notifications").add({
        userId: doc.id,
        title: "Profile Verification Pending",
        message: "Please complete your identity verification to start accepting jobs and building your Mukti Score.",
        read: false,
        timestamp: FieldValue.serverTimestamp(),
        type: "warning"
      });
      count++;
      
      if (user.isVerifiedByAdmin) {
        await db.collection("notifications").add({
          userId: doc.id,
          title: "Account Verified!",
          message: "An admin has successfully verified your account. Your public trust report is now active.",
          read: false,
          timestamp: FieldValue.serverTimestamp(),
          type: "success"
        });
        count++;
      }
    }

    if (user.role === "customer" || user.role === "both") {
      await db.collection("notifications").add({
        userId: doc.id,
        title: "Ready to Hire",
        message: "You can now search for verified workers in your area. Look for the 'Verified' badge for trusted professionals.",
        read: false,
        timestamp: FieldValue.serverTimestamp(),
        type: "info"
      });
      count++;
    }
  }

  console.log(`Successfully seeded ${count} notifications!`);
  process.exit(0);
}

seedNotifications().catch(console.error);

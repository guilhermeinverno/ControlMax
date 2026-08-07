import { adminDb } from "../authMiddleware";

async function run() {
  console.log("Searching for user with email brasiloficina40@gmail.com...");
  const usersSnap = await adminDb.collection("users").where("email", "==", "brasiloficina40@gmail.com").get();
  
  if (usersSnap.empty) {
    console.log("No user found with email brasiloficina40@gmail.com in /users collection!");
    return;
  }
  
  usersSnap.forEach(doc => {
    console.log("User doc ID:", doc.id);
    console.log("User doc data:", JSON.stringify(doc.data(), null, 2));
  });
}

run().catch(console.error);

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  console.log("Fetching users...");
  try {
    const snap = await getDocs(collection(db, 'users'));
    snap.forEach(doc => {
      console.log("User:", doc.id, doc.data());
    });
  } catch(e) {
    console.error("Error fetching users", e);
  }
}
run();

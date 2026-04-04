import { initializeApp } from "firebase/app";
import { getFirestore, collection, setDoc, doc } from "firebase/firestore";
import fs from "fs";

function readJsonFile(path) {
  const raw = fs.readFileSync(path, "utf-8");
  const cleaned = raw.replace(/^\uFEFF/, "");
  return JSON.parse(cleaned);
}

const directory = readJsonFile("./data/directory.json");

const firebaseConfig = {
  apiKey: "AIzaSyCeU1YI9SlIFCPbHehcjNP5_HjELBsbflA",
  authDomain: "cinematic-batch-archive.firebaseapp.com",
  projectId: "cinematic-batch-archive",
  storageBucket: "cinematic-batch-archive.appspot.com",
  messagingSenderId: "922855483454",
  appId: "1:922855483454:web:ef9cfebcf729e544f3096f",
  measurementId: "G-45T5D5DY8C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  console.log(`Loaded ${directory.length} profiles from directory.json`);
  for (const profile of directory) {
    const docId = profile.roll.replace(/[^a-zA-Z0-9]/g, "_");
    try {
      await setDoc(doc(collection(db, "directory"), docId), profile);
      console.log(`Uploaded: ${profile.name}`);
    } catch (err) {
      console.error(`Failed to upload ${profile.name}:`, err);
    }
  }
  console.log("Migration complete!");
}

migrate().catch((err) => {
  console.error("Migration script failed:", err);
});
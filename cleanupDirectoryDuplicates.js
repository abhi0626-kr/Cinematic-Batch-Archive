import { initializeApp } from "firebase/app";
import { collection, deleteDoc, doc, getDocs, getFirestore, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCeU1YI9SlIFCPbHehcjNP5_HjELBsbflA",
  authDomain: "cinematic-batch-archive.firebaseapp.com",
  projectId: "cinematic-batch-archive",
  storageBucket: "cinematic-batch-archive.appspot.com",
  messagingSenderId: "922855483454",
  appId: "1:922855483454:web:ef9cfebcf729e544f3096f",
  measurementId: "G-45T5D5DY8C",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const dryRun = process.argv.includes('--dry-run');

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeDocId(value) {
  return normalizeText(value).replace(/[^a-zA-Z0-9]/g, '_');
}

function getDirectoryDocId(profile, fallbackDocId = '') {
  const rollKey = normalizeText(profile?.roll);
  if (rollKey) {
    return normalizeDocId(rollKey);
  }

  return normalizeDocId(profile?.id || fallbackDocId);
}

function stripUndefinedValues(value) {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedValues).filter((item) => item !== undefined);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((accumulator, [key, item]) => {
      if (item === undefined) {
        return accumulator;
      }

      const nextValue = stripUndefinedValues(item);
      if (nextValue !== undefined) {
        accumulator[key] = nextValue;
      }

      return accumulator;
    }, {});
  }

  return value;
}

function mergeProfiles(baseProfile, nextProfile) {
  if (!baseProfile) {
    return nextProfile;
  }

  if (!nextProfile) {
    return baseProfile;
  }

  return stripUndefinedValues({
    ...baseProfile,
    ...nextProfile,
    socials: {
      ...(baseProfile.socials || {}),
      ...(nextProfile.socials || {}),
    },
  });
}

function countFilledValues(profile) {
  return Object.values(profile || {}).reduce((count, value) => {
    if (value === undefined || value === null) {
      return count;
    }

    if (typeof value === 'string' && !value.trim()) {
      return count;
    }

    return count + 1;
  }, 0);
}

function pickBestProfile(profiles) {
  return profiles.reduce((best, current) => {
    if (!best) {
      return current;
    }

    const bestScore = countFilledValues(best);
    const currentScore = countFilledValues(current);

    if (currentScore > bestScore) {
      return current;
    }

    if (currentScore < bestScore) {
      return best;
    }

    const currentCreatedAt = Date.parse(current?.createdAt || '') || 0;
    const bestCreatedAt = Date.parse(best?.createdAt || '') || 0;

    return currentCreatedAt > bestCreatedAt ? current : best;
  }, null);
}

async function cleanupDuplicates() {
  const snapshot = await getDocs(collection(db, 'directory'));
  const groups = new Map();

  snapshot.docs.forEach((record) => {
    const profile = record.data();
    const canonicalId = getDirectoryDocId(profile, record.id);
    if (!groups.has(canonicalId)) {
      groups.set(canonicalId, []);
    }

    groups.get(canonicalId).push({ docId: record.id, profile });
  });

  let canonicalWrites = 0;
  let deletedDocs = 0;

  for (const [canonicalId, docs] of groups.entries()) {
    const orderedDocs = [...docs].sort((left, right) => left.docId.localeCompare(right.docId));
    const representative = pickBestProfile(orderedDocs.map((item) => item.profile));
    const mergedProfile = orderedDocs.reduce((accumulator, item) => mergeProfiles(accumulator, item.profile), representative || {});

    if (dryRun) {
      const duplicateIds = orderedDocs.map((item) => item.docId).filter((docId) => docId !== canonicalId);
      console.log(`[dry-run] canonical=${canonicalId} duplicates=${duplicateIds.join(', ') || 'none'}`);
      continue;
    }

    await setDoc(doc(collection(db, 'directory'), canonicalId), mergedProfile, { merge: true });
    canonicalWrites += 1;

    for (const { docId } of orderedDocs) {
      if (docId === canonicalId) {
        continue;
      }

      await deleteDoc(doc(db, 'directory', docId));
      deletedDocs += 1;
    }
  }

  if (dryRun) {
    console.log(`Dry run complete. Found ${groups.size} canonical groups.`);
    return;
  }

  console.log(`Cleanup complete. Updated ${canonicalWrites} canonical docs and deleted ${deletedDocs} duplicates.`);
}

cleanupDuplicates().catch((error) => {
  console.error('Directory cleanup failed:', error);
  process.exitCode = 1;
});
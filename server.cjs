const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const GUESTBOOK_FILE = path.join(DATA_DIR, 'guestbook.json');
const DIRECTORY_FILE = path.join(DATA_DIR, 'directory.json');

const seedGuestbookEntries = [
  {
    id: 'seed-1',
    message: 'I still remember the smell of the old library on rainy Tuesdays. We thought those nights would last forever.',
    author: "CLARA D., CLASS OF '22",
    createdAt: '2026-01-18T09:00:00.000Z',
  },
  {
    id: 'seed-2',
    message: 'To the group that always sat at the corner table in the cafe: thank you for being my soundtrack in sophomore year.',
    author: "MARCUS W., CLASS OF '23",
    createdAt: '2026-02-10T15:30:00.000Z',
  },
  {
    id: 'seed-3',
    message: 'We arrived as strangers and left with an entire language made of inside jokes and impossible deadlines.',
    author: "NIA O., CLASS OF '24",
    createdAt: '2026-03-02T18:10:00.000Z',
  },
];

app.use(cors());
app.use(express.json({ limit: '1mb' }));

async function ensureGuestbookFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(GUESTBOOK_FILE);
  } catch {
    await fs.writeFile(GUESTBOOK_FILE, JSON.stringify(seedGuestbookEntries, null, 2), 'utf8');
  }
}

async function ensureDirectoryFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DIRECTORY_FILE);
  } catch {
    await fs.writeFile(DIRECTORY_FILE, '[]', 'utf8');
  }
}

async function readGuestbookEntries() {
  await ensureGuestbookFile();
  const raw = await fs.readFile(GUESTBOOK_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeGuestbookEntries(entries) {
  await fs.writeFile(GUESTBOOK_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

async function readDirectoryEntries() {
  await ensureDirectoryFile();
  const raw = await fs.readFile(DIRECTORY_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeDirectoryEntries(entries) {
  await fs.writeFile(DIRECTORY_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

function sanitizeText(value) {
  return String(value || '').trim();
}


// Guestbook endpoints
app.get('/api/guestbook', async (req, res) => {
  try {
    const entries = await readGuestbookEntries();
    res.json({ entries });
  } catch {
    res.status(500).json({ error: 'Failed to load guestbook entries.' });
  }
});

app.post('/api/guestbook', async (req, res) => {
  const name = sanitizeText(req.body?.name);
  const batch = sanitizeText(req.body?.batch);
  const message = sanitizeText(req.body?.message);

  if (!name || !batch || !message) {
    return res.status(400).json({ error: 'Name, batch, and message are required.' });
  }

  try {
    const entries = await readGuestbookEntries();
    const entry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      author: `${name.toUpperCase()}, ${batch.toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [entry, ...entries];
    await writeGuestbookEntries(updated);

    return res.status(201).json({ entry });
  } catch {
    return res.status(500).json({ error: 'Failed to save guestbook entry.' });
  }
});


app.put('/api/guestbook/:id', async (req, res) => {
  const id = sanitizeText(req.params.id);
  const author = sanitizeText(req.body?.author);
  const message = sanitizeText(req.body?.message);

  if (!id || !author || !message) {
    return res.status(400).json({ error: 'Id, author, and message are required.' });
  }

  try {
    const entries = await readGuestbookEntries();
    const index = entries.findIndex((entry) => entry.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Entry not found.' });
    }

    const updatedEntry = {
      ...entries[index],
      author: author.toUpperCase(),
      message,
    };

    entries[index] = updatedEntry;
    await writeGuestbookEntries(entries);

    return res.json({ entry: updatedEntry });
  } catch {
    return res.status(500).json({ error: 'Failed to update guestbook entry.' });
  }
});


app.delete('/api/guestbook/:id', async (req, res) => {
  const id = sanitizeText(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'Id is required.' });
  }

  try {
    const entries = await readGuestbookEntries();
    const updated = entries.filter((entry) => entry.id !== id);

    if (updated.length === entries.length) {
      return res.status(404).json({ error: 'Entry not found.' });
    }

    await writeGuestbookEntries(updated);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: 'Failed to delete guestbook entry.' });
  }
});

// Directory endpoints
app.get('/api/directory', async (req, res) => {
  try {
    const entries = await readDirectoryEntries();
    res.json({ entries });
  } catch {
    res.status(500).json({ error: 'Failed to load directory entries.' });
  }
});

app.post('/api/directory', async (req, res) => {
  const profile = req.body || {};
  if (!profile.name || !profile.gender) {
    return res.status(400).json({ error: 'Name and gender are required.' });
  }
  try {
    const entries = await readDirectoryEntries();
    const entry = {
      ...profile,
      id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    entries.push(entry);
    await writeDirectoryEntries(entries);
    return res.status(201).json({ entry });
  } catch {
    return res.status(500).json({ error: 'Failed to save directory entry.' });
  }
});

app.put('/api/directory/:id', async (req, res) => {
  const id = sanitizeText(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Id is required.' });
  }
  try {
    const entries = await readDirectoryEntries();
    const index = entries.findIndex((entry) => entry.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    entries[index] = { ...entries[index], ...req.body };
    await writeDirectoryEntries(entries);
    return res.json({ entry: entries[index] });
  } catch {
    return res.status(500).json({ error: 'Failed to update directory entry.' });
  }
});

app.delete('/api/directory/:id', async (req, res) => {
  const id = sanitizeText(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Id is required.' });
  }
  try {
    const entries = await readDirectoryEntries();
    const updated = entries.filter((entry) => entry.id !== id);
    if (updated.length === entries.length) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    await writeDirectoryEntries(updated);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: 'Failed to delete directory entry.' });
  }
});

app.listen(PORT, async () => {
  await ensureGuestbookFile();
  await ensureDirectoryFile();
  console.log(`API listening on http://localhost:${PORT}`);
});

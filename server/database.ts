import { MongoClient, Db } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { Quotation, UserAccount } from '../src/types';
import { createSampleQuotation } from '../src/data/defaultData';
import { DEFAULT_USERS } from '../src/utils/userStorage';

export interface DbStatus {
  engine: 'mongodb' | 'file';
  connected: boolean;
  uri: string;
  databaseName: string;
  totalQuotations: number;
  message: string;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interglass';
const DB_NAME = 'interglass';

// Path for file-based fallback database
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'interglass-db.json');

interface FileSchema {
  quotations: Quotation[];
  users: UserAccount[];
  counters: Record<string, number>;
}

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let activeEngine: 'mongodb' | 'file' = 'file';
let lastStatusMessage = 'Initializing database...';

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readFileDb(): FileSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial: FileSchema = {
      quotations: [],
      users: DEFAULT_USERS,
      counters: {},
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const filteredQuotes = (Array.isArray(parsed.quotations) ? parsed.quotations : []).filter(
      (q: any) =>
        q.id !== 'sample-quote-001' &&
        q.from?.refNo !== 'IG/26-06/ 3685' &&
        !q.client?.name?.toLowerCase().includes('sample client')
    );
    return {
      quotations: filteredQuotes,
      users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : DEFAULT_USERS,
      counters: parsed.counters || {},
    };
  } catch (err) {
    console.error('[DB] Error reading JSON database file:', err);
    return { quotations: [], users: DEFAULT_USERS, counters: {} };
  }
}

function writeFileDb(data: FileSchema) {
  ensureDataDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error writing JSON database file:', err);
  }
}

/**
 * Initializes database connection.
 * Attempts MongoDB first (with 2.5s fast timeout).
 * If MongoDB is running (e.g. locally with MongoDB Compass on localhost:27017), connects and seeds.
 * If not, falls back smoothly to local file storage.
 */
export async function initDatabase(): Promise<DbStatus> {
  try {
    console.log(`[DB] Attempting connection to MongoDB at ${MONGODB_URI}...`);
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 3000,
    });

    await client.connect();
    // Verify connection by pinging
    await client.db('admin').command({ ping: 1 });

    mongoClient = client;
    mongoDb = client.db(DB_NAME);
    activeEngine = 'mongodb';
    lastStatusMessage = `Connected to MongoDB database "${DB_NAME}" (${MONGODB_URI}). Accessible via MongoDB Compass!`;
    console.log(`[DB] SUCCESS: ${lastStatusMessage}`);

    // Ensure collections and seed if empty
    await seedMongoIfEmpty();

    return getDbStatus();
  } catch (err: any) {
    activeEngine = 'file';
    lastStatusMessage = `MongoDB not detected at localhost:27017 (${err.message || 'connection failed'}). Using Local Intranet Server Storage (${DB_FILE}). Start MongoDB and reload to use Compass.`;
    console.warn(`[DB] ${lastStatusMessage}`);
    
    // Ensure file DB has initial data
    readFileDb();

    return getDbStatus();
  }
}

async function seedMongoIfEmpty() {
  if (!mongoDb) return;
  try {
    // Explicitly create collections so they show up immediately in Compass
    const existingCollections = await mongoDb.listCollections().toArray();
    const collectionNames = existingCollections.map(c => c.name);

    if (!collectionNames.includes('quotations')) {
      await mongoDb.createCollection('quotations');
    }
    if (!collectionNames.includes('counters')) {
      await mongoDb.createCollection('counters');
    }
    if (!collectionNames.includes('users')) {
      await mongoDb.createCollection('users');
    }

    // Purge any sample client LLC quote if present in MongoDB
    try {
      const deleteSampleResult = await mongoDb.collection('quotations').deleteMany({
        $or: [
          { id: 'sample-quote-001' },
          { 'from.refNo': 'IG/26-06/ 3685' },
          { 'client.name': { $regex: /sample client/i } },
        ],
      });
      if (deleteSampleResult.deletedCount > 0) {
        console.log(`[DB] Purged ${deleteSampleResult.deletedCount} Sample Client LLC quotation(s) from MongoDB`);
      }
    } catch (err) {
      console.warn('[DB] Could not purge sample quotation:', err);
    }

    const userCount = await mongoDb.collection('users').countDocuments();
    if (userCount === 0) {
      console.log('[DB] Seeding MongoDB with default user accounts...');
      await mongoDb.collection('users').insertMany(DEFAULT_USERS as any);
    }

    // Initialize atomic counter for current year/month if not present
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `IGC/${yy}/${mm}/`;
    await mongoDb.collection('counters').updateOne(
      { _id: prefix as any },
      { $setOnInsert: { seq: 1 } },
      { upsert: true }
    );

    // Clean up any duplicate records that may have been created earlier
    await cleanupMongoDuplicates();
  } catch (err) {
    console.error('[DB] Error seeding MongoDB:', err);
  }
}

/**
 * Scans MongoDB for any duplicate quotations sharing the exact same reference number.
 * Keeps the most complete quotation (with client name, items, or latest timestamp)
 * and safely removes ghost/blank duplicates.
 */
async function cleanupMongoDuplicates() {
  if (!mongoDb) return;
  try {
    const allQuotes = await mongoDb.collection('quotations').find({}).toArray();
    const byRef = new Map<string, any[]>();

    for (const doc of allQuotes) {
      const ref = (doc.from?.refNo || '').trim();
      if (!ref) continue;
      const rev = (doc.from?.rev || 'REV-00').trim().toUpperCase();
      const key = `${ref}:::${rev}`;
      if (!byRef.has(key)) byRef.set(key, []);
      byRef.get(key)!.push(doc);
    }

    for (const [key, docs] of byRef.entries()) {
      if (docs.length > 1) {
        const [ref, rev] = key.split(':::');
        console.log(`[DB] Detected ${docs.length} duplicate quotations for "${ref} (${rev})". Cleaning up...`);

        // Sort descending: prefer quotes with client name, more glass items, higher total, newer date
        docs.sort((a, b) => {
          const aHasClient = (a.client?.name || '').trim().length > 0 ? 1 : 0;
          const bHasClient = (b.client?.name || '').trim().length > 0 ? 1 : 0;
          if (aHasClient !== bHasClient) return bHasClient - aHasClient;

          const aItemCount = (a.glassSections || []).reduce((acc: number, s: any) => acc + (s.items?.length || 0), 0);
          const bItemCount = (b.glassSections || []).reduce((acc: number, s: any) => acc + (s.items?.length || 0), 0);
          if (aItemCount !== bItemCount) return bItemCount - aItemCount;

          const aTotal = a.confirmedTotalAmount || 0;
          const bTotal = b.confirmedTotalAmount || 0;
          if (aTotal !== bTotal) return bTotal - aTotal;

          const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return bTime - aTime;
        });

        // Keep docs[0], delete the ghost duplicates
        for (let i = 1; i < docs.length; i++) {
          console.log(`[DB] Removing duplicate quote _id: ${docs[i]._id} (ref: ${ref}, client: "${docs[i].client?.name || 'none'}")`);
          await mongoDb.collection('quotations').deleteOne({ _id: docs[i]._id });
        }
      }
    }
  } catch (err) {
    console.warn('[DB] Duplicate cleanup warning:', err);
  }
}

export async function getDbStatus(): Promise<DbStatus> {
  let count = 0;
  if (activeEngine === 'mongodb' && mongoDb) {
    try {
      count = await mongoDb.collection('quotations').countDocuments();
    } catch {
      count = 0;
    }
  } else {
    const fileDb = readFileDb();
    count = fileDb.quotations.length;
  }

  return {
    engine: activeEngine,
    connected: true,
    uri: activeEngine === 'mongodb' ? MONGODB_URI : DB_FILE,
    databaseName: DB_NAME,
    totalQuotations: count,
    message: lastStatusMessage,
  };
}

export async function getAllQuotations(): Promise<Quotation[]> {
  if (activeEngine === 'mongodb' && mongoDb) {
    try {
      const docs = await mongoDb.collection('quotations')
        .find({})
        .sort({ updatedAt: -1 })
        .toArray();
      // Remove mongo _id for clean API response
      return docs.map((doc: any) => {
        const { _id, ...rest } = doc;
        return rest as Quotation;
      });
    } catch (err) {
      console.error('[DB] Error fetching quotations from MongoDB:', err);
      return [];
    }
  }

  const fileDb = readFileDb();
  return fileDb.quotations;
}

export async function getQuotationById(id: string): Promise<Quotation | null> {
  if (activeEngine === 'mongodb' && mongoDb) {
    const doc: any = await mongoDb.collection('quotations').findOne({ id });
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return rest as Quotation;
  }

  const fileDb = readFileDb();
  return fileDb.quotations.find((q) => q.id === id) || null;
}

export async function saveOrUpdateQuotation(quotation: Quotation): Promise<Quotation> {
  const now = new Date().toISOString();
  const quoteToSave: Quotation = {
    ...quotation,
    updatedAt: now,
    createdAt: quotation.createdAt || now,
  };

  const refNo = (quoteToSave.from?.refNo || '').trim();
  const rev = (quoteToSave.from?.rev || 'REV-00').trim();

  if (activeEngine === 'mongodb' && mongoDb) {
    try {
      const cleanDoc: any = { ...quoteToSave };
      delete cleanDoc._id; // Never let MongoDB immutable _id conflict

      // Look for an existing quotation by id OR by (exact from.refNo AND from.rev)
      const queryOr: any[] = [{ id: cleanDoc.id }];
      if (refNo) {
        queryOr.push({ 'from.refNo': refNo, 'from.rev': rev });
      }

      const existingDoc: any = await mongoDb.collection('quotations').findOne({ $or: queryOr });

      if (existingDoc) {
        // Keep the original id consistent and update in-place by _id
        cleanDoc.id = existingDoc.id || cleanDoc.id;
        await mongoDb.collection('quotations').replaceOne(
          { _id: existingDoc._id },
          cleanDoc
        );
      } else {
        await mongoDb.collection('quotations').insertOne(cleanDoc);
      }
      return cleanDoc;
    } catch (err) {
      console.error('[DB] Error saving quotation to MongoDB:', err);
      throw err;
    }
  }

  const fileDb = readFileDb();
  const existingIdx = fileDb.quotations.findIndex(
    (q) =>
      q.id === quoteToSave.id ||
      (refNo &&
        q.from?.refNo?.trim() === refNo &&
        (q.from?.rev || 'REV-00').trim().toUpperCase() === rev.toUpperCase())
  );

  if (existingIdx >= 0) {
    quoteToSave.id = fileDb.quotations[existingIdx].id || quoteToSave.id;
    fileDb.quotations[existingIdx] = quoteToSave;
  } else {
    fileDb.quotations.unshift(quoteToSave);
  }

  writeFileDb(fileDb);
  return quoteToSave;
}

export async function deleteQuotationById(id: string): Promise<boolean> {
  if (activeEngine === 'mongodb' && mongoDb) {
    const res = await mongoDb.collection('quotations').deleteOne({ id });
    return (res.deletedCount || 0) > 0;
  }

  const fileDb = readFileDb();
  const initialLen = fileDb.quotations.length;
  fileDb.quotations = fileDb.quotations.filter((q) => q.id !== id);
  writeFileDb(fileDb);
  return fileDb.quotations.length < initialLen;
}

/**
 * Generates and increments the sequential quotation reference number atomically on the server.
 * Format: IGC/{YY}/{MM}/{SERIAL}
 */
export async function getNextSequentialRef(date: Date = new Date()): Promise<{ nextRefNo: string; dated: string }> {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `IGC/${yy}/${mm}/`;

  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  const dated = `${dd}-${mm}-${yyyy}`;

  let serial = 1;

  if (activeEngine === 'mongodb' && mongoDb) {
    try {
      // Find the highest existing serial in the database for this month
      const highestDoc: any = await mongoDb.collection('quotations')
        .find({ 'from.refNo': { $regex: `^${prefix}` } })
        .project({ 'from.refNo': 1 })
        .toArray();

      let maxFound = 0;
      for (const item of highestDoc) {
        const ref = (item.from?.refNo || '').trim();
        if (ref.startsWith(prefix)) {
          const num = parseInt(ref.slice(prefix.length), 10);
          if (!isNaN(num) && num > maxFound) maxFound = num;
        }
      }

      // Atomically increment counter in counters collection
      const counterRes: any = await mongoDb.collection('counters').findOneAndUpdate(
        { _id: prefix as any },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
      );

      const seqFromCounter = counterRes?.value?.seq || counterRes?.seq || 0;
      serial = Math.max(maxFound + 1, seqFromCounter);

      // Ensure counters collection never falls behind maxFound
      if (seqFromCounter < serial) {
        await mongoDb.collection('counters').updateOne(
          { _id: prefix as any },
          { $set: { seq: serial } }
        );
      }
    } catch (err) {
      console.error('[DB] Counter error in MongoDB, falling back to calculation:', err);
      serial = 1;
    }
  } else {
    const fileDb = readFileDb();
    let maxFound = 0;
    for (const q of fileDb.quotations) {
      const ref = q.from?.refNo || '';
      if (ref.startsWith(prefix)) {
        const num = parseInt(ref.slice(prefix.length), 10);
        if (!isNaN(num) && num > maxFound) maxFound = num;
      }
    }

    const currentCounter = fileDb.counters[prefix] || 0;
    serial = Math.max(maxFound, currentCounter) + 1;
    fileDb.counters[prefix] = serial;
    writeFileDb(fileDb);
  }

  const nextRefNo = `${prefix}${String(serial).padStart(3, '0')}`;
  return { nextRefNo, dated };
}

export async function getAllUsers(): Promise<UserAccount[]> {
  if (activeEngine === 'mongodb' && mongoDb) {
    try {
      const docs = await mongoDb.collection('users').find({}).toArray();
      return docs.map((d: any) => {
        const { _id, ...rest } = d;
        return rest as UserAccount;
      });
    } catch {
      return DEFAULT_USERS;
    }
  }

  const fileDb = readFileDb();
  return fileDb.users;
}

export async function saveAllUsers(users: UserAccount[]): Promise<UserAccount[]> {
  if (activeEngine === 'mongodb' && mongoDb) {
    try {
      await mongoDb.collection('users').deleteMany({});
      await mongoDb.collection('users').insertMany(users as any);
      return users;
    } catch (err) {
      console.error('[DB] Error saving users to MongoDB:', err);
    }
  }

  const fileDb = readFileDb();
  fileDb.users = users;
  writeFileDb(fileDb);
  return users;
}

/**
 * Bulk imports or merges quotations (e.g. migrating local browser cache to the centralized DB)
 */
export async function syncQuotations(incoming: Quotation[]): Promise<{ added: number; updated: number; total: number }> {
  let added = 0;
  let updated = 0;

  for (const q of incoming) {
    if (!q.id) continue;
    const existing = await getQuotationById(q.id);
    if (existing) {
      await saveOrUpdateQuotation(q);
      updated++;
    } else {
      await saveOrUpdateQuotation(q);
      added++;
    }
  }

  const all = await getAllQuotations();
  return { added, updated, total: all.length };
}

import { BIBLE_STRUCTURE } from '../lib/bibleData';

export interface BibleVerse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface RawBibleBook {
  abbrev: string;
  chapters: string[][];
}

const memoryCache = new Map<string, RawBibleBook[]>();
const inFlightLoads = new Map<string, Promise<RawBibleBook[]>>();

const DB_NAME = 'ecclesia_bible_cache';
const STORE_NAME = 'translations';

function openBibleDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readFromIDB(key: string): Promise<RawBibleBook[] | null> {
  const db = await openBibleDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve((req.result as RawBibleBook[]) || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function writeToIDB(key: string, data: RawBibleBook[]): Promise<void> {
  const db = await openBibleDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function resolveTranslationFile(translation: string): string {
  const t = normalizeText(translation);
  if (t === 'nvi') return 'nvi';
  if (t === 'aa') return 'aa';
  return 'acf'; // 'almeida' -> Almeida Corrigida Fiel
}

async function loadTranslation(translation: string): Promise<RawBibleBook[]> {
  const fileKey = resolveTranslationFile(translation);

  const mem = memoryCache.get(fileKey);
  if (mem) return mem;

  const existingPromise = inFlightLoads.get(fileKey);
  if (existingPromise) return existingPromise;

  const loadPromise = (async () => {
    const cached = await readFromIDB(fileKey);
    if (cached && Array.isArray(cached) && cached.length === 66) {
      memoryCache.set(fileKey, cached);
      return cached;
    }

    const urls = [
      `https://cdn.jsdelivr.net/gh/thiagobodruk/biblia@master/json/${fileKey}.json`,
      `https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/${fileKey}.json`,
    ];

    let lastError: unknown = null;
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rawText = await res.text();
        const parsed = JSON.parse(rawText.replace(/^\uFEFF/, '')) as RawBibleBook[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCache.set(fileKey, parsed);
          void writeToIDB(fileKey, parsed);
          return parsed;
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Não foi possível carregar os dados bíblicos.');
  })();

  inFlightLoads.set(fileKey, loadPromise);
  try {
    return await loadPromise;
  } finally {
    inFlightLoads.delete(fileKey);
  }
}

function findBookIndex(bookQuery: string, booksData: RawBibleBook[]): number {
  const target = normalizeText(bookQuery);

  // 1. Exact or prefix match on BIBLE_STRUCTURE Portuguese names
  const exactIdx = BIBLE_STRUCTURE.findIndex((b) => normalizeText(b.book) === target);
  if (exactIdx !== -1) return exactIdx;

  // 2. Match by abbreviation in RawBibleBook (e.g. "gn", "sl", "1co")
  const abbrevIdx = booksData.findIndex((b) => normalizeText(b.abbrev) === target);
  if (abbrevIdx !== -1) return abbrevIdx;

  // 3. Partial / startsWith match on BIBLE_STRUCTURE
  const prefixIdx = BIBLE_STRUCTURE.findIndex((b) => normalizeText(b.book).startsWith(target));
  if (prefixIdx !== -1) return prefixIdx;

  return -1;
}

export async function getChapterVerses(
  bookName: string,
  chapterNum: number,
  translation: string = 'almeida'
): Promise<BibleVerse[]> {
  const booksData = await loadTranslation(translation);
  const bookIdx = findBookIndex(bookName, booksData);
  if (bookIdx === -1 || !booksData[bookIdx]) {
    throw new Error(`Livro não encontrado: ${bookName}`);
  }

  const bookData = booksData[bookIdx];
  const canonicalName = BIBLE_STRUCTURE[bookIdx]?.book || bookName;
  const chapterVerses = bookData.chapters[chapterNum - 1];

  if (!chapterVerses || !Array.isArray(chapterVerses)) {
    throw new Error(`Capítulo ${chapterNum} não encontrado em ${canonicalName}`);
  }

  return chapterVerses.map((text, idx) => ({
    book_name: canonicalName,
    chapter: chapterNum,
    verse: idx + 1,
    text: String(text).trim(),
  }));
}

export async function searchVerseByReference(
  reference: string,
  translation: string = 'almeida'
): Promise<BibleVerse> {
  const trimmed = reference.trim();
  // Match e.g. "João 3:16", "1 Coríntios 13:4", "Salmos 23:1", "Sl 23", "Gn 1:1"
  const match = trimmed.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
  if (!match) {
    throw new Error('Formato inválido. Use por exemplo: João 3:16');
  }

  const [, rawBook, rawChapter, rawVerse] = match;
  const chapterNum = parseInt(rawChapter, 10);
  const verseNum = rawVerse ? parseInt(rawVerse, 10) : 1;

  const verses = await getChapterVerses(rawBook, chapterNum, translation);
  const found = verses.find((v) => v.verse === verseNum);
  if (!found) {
    throw new Error(`Versículo ${chapterNum}:${verseNum} não encontrado em ${rawBook}`);
  }

  return found;
}

import * as SQLite from 'expo-sqlite';
import { DiaryEntry, PriorityLevel } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('martin78diary.db');
    await initDatabase(db);
  }
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      date TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      photos TEXT NOT NULL DEFAULT '[]',
      links TEXT NOT NULL DEFAULT '[]',
      reminderDate TEXT,
      audioUri TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
}

export async function getAllEntries(): Promise<DiaryEntry[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>('SELECT * FROM entries ORDER BY date DESC, createdAt DESC');
  return rows.map(mapRowToEntry);
}

export async function getEntryById(id: string): Promise<DiaryEntry | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<any>('SELECT * FROM entries WHERE id = ?', [id]);
  return row ? mapRowToEntry(row) : null;
}

export async function insertEntry(entry: DiaryEntry): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO entries (id, title, content, date, priority, photos, links, reminderDate, audioUri, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.title,
      entry.content,
      entry.date,
      entry.priority,
      JSON.stringify(entry.photos),
      JSON.stringify(entry.links),
      entry.reminderDate,
      entry.audioUri,
      entry.createdAt,
      entry.updatedAt,
    ]
  );
}

export async function updateEntry(entry: DiaryEntry): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE entries
     SET title = ?, content = ?, date = ?, priority = ?, photos = ?, links = ?, reminderDate = ?, audioUri = ?, updatedAt = ?
     WHERE id = ?`,
    [
      entry.title,
      entry.content,
      entry.date,
      entry.priority,
      JSON.stringify(entry.photos),
      JSON.stringify(entry.links),
      entry.reminderDate,
      entry.audioUri,
      entry.updatedAt,
      entry.id,
    ]
  );
}

export async function deleteEntry(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM entries WHERE id = ?', [id]);
}

function mapRowToEntry(row: any): DiaryEntry {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    date: row.date,
    priority: row.priority as PriorityLevel,
    photos: JSON.parse(row.photos || '[]'),
    links: JSON.parse(row.links || '[]'),
    reminderDate: row.reminderDate,
    audioUri: row.audioUri || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

export interface DatabaseStatus {
  configured: boolean;
  connected: boolean;
  engine: 'PostgreSQL' | 'In-Memory (Demo Mode)';
  message: string;
}

let pool: pg.Pool | null = null;
let isConnected = false;
let connectionAttempted = false;

export async function initDatabase(): Promise<DatabaseStatus> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || databaseUrl.trim() === '') {
    connectionAttempted = true;
    isConnected = false;
    return {
      configured: false,
      connected: false,
      engine: 'In-Memory (Demo Mode)',
      message: 'DATABASE_URL is not configured. Running with in-memory persistence and session store.',
    };
  }

  if (connectionAttempted && pool) {
    return {
      configured: true,
      connected: isConnected,
      engine: isConnected ? 'PostgreSQL' : 'In-Memory (Demo Mode)',
      message: isConnected ? 'Connected to PostgreSQL database.' : 'Database connection unavailable; running in demo mode fallback.',
    };
  }

  connectionAttempted = true;

  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 3000,
    });

    const client = await pool.connect();
    isConnected = true;
    client.release();

    // Optionally auto-migrate schema if tables do not exist
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log('PostgreSQL schema auto-verified and initialized successfully.');
      }
    } catch (schemaErr) {
      console.warn('Notice while applying schema.sql:', schemaErr);
    }

    return {
      configured: true,
      connected: true,
      engine: 'PostgreSQL',
      message: 'Connected to PostgreSQL database.',
    };
  } catch (err: any) {
    isConnected = false;
    console.warn('PostgreSQL connection attempt failed. Falling back to Demo Mode:', err?.message || err);
    return {
      configured: true,
      connected: false,
      engine: 'In-Memory (Demo Mode)',
      message: `Failed to connect to DATABASE_URL: ${err?.message || 'Connection error'}. Falling back to Demo Mode.`,
    };
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  const configured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');
  return {
    configured,
    connected: isConnected,
    engine: isConnected ? 'PostgreSQL' : 'In-Memory (Demo Mode)',
    message: isConnected
      ? 'Connected to PostgreSQL database.'
      : configured
        ? 'DATABASE_URL provided but connection unverified. In-memory demo fallback active.'
        : 'Running in Demo Mode with in-memory persistence.',
  };
}

export async function queryDb<T = any>(text: string, params: any[] = []): Promise<T[]> {
  if (!pool || !isConnected) {
    return [];
  }
  try {
    const res = await pool.query(text, params);
    return res.rows as T[];
  } catch (err) {
    console.error('Database query execution error:', err);
    throw err;
  }
}

// Persistence seam. Phase 1 ships a local JSON-file store so the cockpit runs with zero Azure.
// On Azure (SWA Free) it uses Cosmos with key auth (no managed identity on Free) — see
// docs/DEPLOYMENT.md. The whole board is one document; fine for a single-user experiment.
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { CosmosClient, type Container } from '@azure/cosmos';
import { emptyDb } from './logic';
import type { Db } from './types';

export interface Store {
  read(): Promise<Db>;
  write(db: Db): Promise<void>;
}

const BOARD_ID = 'board';
const MAX_LOG = 500;

function trimLog(db: Db): Db {
  if (db.log.length > MAX_LOG) db.log = db.log.slice(-MAX_LOG);
  return db;
}

class FileStore implements Store {
  private readonly path: string;

  constructor(path: string) {
    this.path = path;
  }

  async read(): Promise<Db> {
    try {
      const raw = await fs.readFile(this.path, 'utf8');
      const parsed = JSON.parse(raw) as Partial<Db>;
      return {
        items: parsed.items ?? [],
        actions: parsed.actions ?? [],
        log: parsed.log ?? [],
      };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return emptyDb();
      throw err;
    }
  }

  async write(db: Db): Promise<void> {
    await fs.mkdir(dirname(this.path), { recursive: true });
    await fs.writeFile(this.path, JSON.stringify(trimLog(db), null, 2), 'utf8');
  }
}

interface BoardDoc extends Db {
  id: string;
}

class CosmosStore implements Store {
  private container: Container;

  constructor(endpoint: string, key: string, dbName: string, containerName: string) {
    const client = new CosmosClient({ endpoint, key });
    this.container = client.database(dbName).container(containerName);
  }

  async read(): Promise<Db> {
    try {
      const { resource } = await this.container.item(BOARD_ID, BOARD_ID).read<BoardDoc>();
      if (!resource) return emptyDb();
      return { items: resource.items ?? [], actions: resource.actions ?? [], log: resource.log ?? [] };
    } catch (err) {
      if ((err as { code?: number }).code === 404) return emptyDb();
      throw err;
    }
  }

  async write(db: Db): Promise<void> {
    const doc: BoardDoc = { id: BOARD_ID, ...trimLog(db) };
    await this.container.items.upsert(doc);
  }
}

let singleton: Store | undefined;

export function getStore(): Store {
  if (!singleton) {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    if (endpoint && key) {
      singleton = new CosmosStore(
        endpoint,
        key,
        process.env.COSMOS_DB ?? 'glassbox',
        process.env.COSMOS_CONTAINER ?? 'board',
      );
    } else {
      const dbPath = process.env.GLASSBOX_DB ?? join(process.cwd(), '.data', 'db.json');
      singleton = new FileStore(dbPath);
    }
  }
  return singleton;
}

/** Load → mutate → persist helper so every handler stays a one-liner. */
export async function withDb<T>(fn: (db: Db) => T): Promise<T> {
  const store = getStore();
  const db = await store.read();
  const result = fn(db);
  await store.write(db);
  return result;
}

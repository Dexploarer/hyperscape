// Dynamic imports for Node.js modules to avoid Vite resolution issues

class LocalStorage {
  get(key: string): unknown {
    const data = localStorage.getItem(key)
    if (data === null) return null
    return JSON.parse(data)
  }

  set(key: string, value: unknown): void {
    const data = JSON.stringify(value)
    localStorage.setItem(key, data)
  }

  remove(key: string): void {
    localStorage.removeItem(key)
  }
}

class NodeStorage {
  file: string = '';
  data: Record<string, unknown> = {};
  private fs: typeof import('node:fs/promises') | null = null;
  private path: {
    join: (...paths: string[]) => string;
    dirname: (path: string) => string;
  } | null = null;
  private initialized: boolean = false;

  constructor() {
    this.initialize()
  }

  private async initialize() {
    if (this.initialized) return;
    
    const { promises: fs } = await import('fs');
    const path = await import('path');
    this.fs = fs;
    this.path = path;
    
    // Use environment variable or current working directory
    const dataDir = process.env.HYPERSCAPE_DATA_DIR || process.cwd();
    this.file = this.path!.join(dataDir, '.hyperscape-storage.json');
    
    // Load existing data
    const exists = await this.fs!.access(this.file).then(() => true).catch(() => false);
    if (exists) {
      const content = await this.fs!.readFile(this.file, { encoding: 'utf8' });
      this.data = JSON.parse(content);
    } else {
      // Create empty file
      this.data = {};
      await this.save();
    }
    
    this.initialized = true;
  }

  async save(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    const dir = this.path!.dirname(this.file);
    await this.fs!.mkdir(dir, { recursive: true });
    await this.fs!.writeFile(this.file, JSON.stringify(this.data, null, 2));
  }

  async get(key: string): Promise<unknown> {
    if (!this.initialized) await this.initialize();
    const value = this.data[key];
    if (value === undefined) return null
    return value
  }

  async set(key: string, value: unknown): Promise<void> {
    if (!this.initialized) await this.initialize();
    this.data[key] = value;
    await this.save();
  }

  async remove(key: string): Promise<void> {
    if (!this.initialized) await this.initialize();
    delete this.data[key];
    await this.save();
  }
}

// Export based on environment
let storage: LocalStorage | NodeStorage;

if (typeof window !== 'undefined' && window.localStorage) {
  storage = new LocalStorage();
} else {
  storage = new NodeStorage();
}

export { storage };
export type Storage = LocalStorage | NodeStorage;

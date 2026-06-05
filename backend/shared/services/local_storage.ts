import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');

export class LocalStorage {
  static async read(filename: string): Promise<any[]> {
    try {
      const filePath = path.join(DATA_DIR, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  static async write(filename: string, data: any[]): Promise<void> {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  static async findOne(filename: string, query: (item: any) => boolean): Promise<any | null> {
    const items = await this.read(filename);
    return items.find(query) || null;
  }

  static async insert(filename: string, item: any): Promise<any> {
    const items = await this.read(filename);
    const newItem = { ...item, id: item.id || Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    items.push(newItem);
    await this.write(filename, items);
    return newItem;
  }

  static async update(filename: string, id: string, updates: any): Promise<any | null> {
    const items = await this.read(filename);
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    await this.write(filename, items);
    return items[index];
  }
}

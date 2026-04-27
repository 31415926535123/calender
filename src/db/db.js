// db.js - 通用IndexedDB操作模块
class IndexedDBManager {
  constructor(dbName, dbVersion, storeName) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    this.storeName = storeName;
    this.db = null;
  }

  // 打开数据库连接
  async open() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  // 关闭数据库连接
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
  async save(data) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const record = data;
      const request = store.put(record, 1);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }
  async load() {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(1);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result);
      };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => this.close();
    });
  }

  async delete() {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(1);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => this.close();
    });
  }

  // 获取所有数据（可选，用于调试）
  async getAll() {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => this.close();
    });
  }

  // 清空存储
  async clear() {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => this.close();
    });
  }
}

export default IndexedDBManager;

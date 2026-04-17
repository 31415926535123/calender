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
          // 使用自增主键或keyPath，这里用id作为keyPath
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });
          // 可以添加索引以便查询
          store.createIndex("timestamp", "timestamp", { unique: false });
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

  // 保存或更新数据
  async save(id, data, metadata = {}) {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const record = {
        id: id,
        data: data, // 可以是 Blob、File、字符串等任何结构化的数据
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          type: data instanceof Blob ? data.type : typeof data,
        },
      };

      const request = store.put(record);

      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => this.close();
    });
  }

  // 读取数据
  async load(id) {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => this.close();
    });
  }

  // 删除数据
  async delete(id) {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

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

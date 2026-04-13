import { computed, ref, watch } from "vue";
class StorageManager {
  constructor() {
    this.variables = new Map();
  }
  register(key, defaultValue) {
    if (this.variables.has(key)) {
      console.log(`变量 ${key} 已存在，直接返回`);
      return this.variables.get(key).data;
    }

    const storedValue = this.loadFromStorage(key);
    let initialValue = storedValue !== null ? storedValue : defaultValue;
    const data = ref(initialValue);

    watch(
      data,
      (newValue) => {
        this.saveToStorage(key, newValue);
      },
      { deep: true },
    );

    this.variables.set(key, {
      data,
    });
    return data;
  }
  saveToStorage(key, value) {
    try {
      localStorage.setItem(`storage_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(`保存 ${key} 失败:`, e);
    }
  }
  loadFromStorage(key) {
    try {
      const stored = localStorage.getItem(`storage_${key}`);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(`加载 ${key} 失败:`, e);
    }
    return null;
  }
  useStorage = (key, defaultValue) => {
    const store = this.register(key, defaultValue);
    const data = ref(store.value);
    watch(
      data,
      (val) => {
        store.value = val;
      },
      { deep: true },
    );

    return data;
  };
  createDynamicStorage(keyGetter, defaultValue) {
    // 返回一个 computed 对象
    return computed({
      // getter：读取时执行
      get: () => {
        // 1. 调用 keyGetter 获取当前的 key（如 "main_markers_2026_4"）
        const key = keyGetter();

        // 2. 根据 key 获取对应的存储（自动创建或从缓存取）
        const store = this.register(key, defaultValue);

        // 3. 返回存储的值
        return store.value;
      },

      // setter：写入时执行
      set: (val) => {
        // 1. 获取当前的 key
        const key = keyGetter();

        // 2. 获取对应的存储
        const store = this.register(key, defaultValue);

        // 3. 将值存入存储（自动保存到 localStorage）
        store.value = val;
      },
    });
  }
}

// 创建单例实例
export const storage = new StorageManager();

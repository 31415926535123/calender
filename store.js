/**
 * @file store.js
 * @module Storage
 * @description Vue 响应式 localStorage 存储管理模块
 *
 * 本模块提供与 Vue 响应式系统集成的本地存储功能，
 * 支持静态键和动态键两种使用方式。
 *
 *
 * @example
 * // 静态键存储
 * import { storage } from './store.js'
 * const settings = storage.register('app_settings', { theme: 'dark' })
 *
 * @example
 * // 动态键存储
 * const note = storage.createDynamicStorage(
 *   () => `note_${date.value}`,
 *   ''
 * )
 */
/**
 * 存储管理器
 * @class StorageManager
 * @classdesc 管理所有存储实例，提供注册和动态存储功能
 *
 * @property {Map<string, Object>} variables - 存储实例缓存
 *   - 键: 存储键名
 *   - 值: { data: Ref } 响应式对象
 *
 * @fires StorageManager#save - 保存数据时触发
 * @fires StorageManager#load - 加载数据时触发
 */
import { computed, ref, watch } from "vue";
class StorageManager {
  constructor() {
    this.variables = new Map();
  }
  register(key, defaultValue, noRepeat = false) {
    if (this.variables.has(key)) {
      if (noRepeat) {
        throw new Error(`键${key} 已存在`);
      } else {
        return this.variables.get(key);
      }
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

    this.variables.set(key, data);
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
  /**
   * 创建动态键存储，键变化时，值自动更新
   * @param {() => string} keyGetter - 动态生成存储键的函数
   * @param {T} defaultValue - 默认值
   * @returns {import('vue').ComputedRef<T>} 可读写的 computed 对象
   * @template T
   *
   * @warning 修改时必须整体替换：`storage.value = newValue`,由于键可能变化，所以异步操作要注意，可能导致存储错位
   *
   * @example
   * // 根据日期动态切换笔记
   * const note = storage.createDynamicStorage(
   *   () => `note_${selectedDate.value}`,
   *   ''
   * )
   *
   * // 正确用法
   * note.value = '新内容'
   *
   * // 错误用法（不会保存）
   * note.value += '追加内容'  // 字符串拼接仍是整体替换，这个其实可以
   * note.value.push('item')   // 数组/对象方法不行
   *
   * @see {@link https://vuejs.org/api/reactivity-core.html#computed|Vue Computed}
   */
  createDynamicStorage(keyGetter, defaultValue) {
    return computed({
      get: () => {
        const key = keyGetter();
        const store = this.register(key, defaultValue);
        return store.value;
      },
      set: (val) => {
        const key = keyGetter();
        const store = this.register(key, defaultValue);
        store.value = val;
      },
    });
  }
}
/**
 * 全局单例实例
 * @constant
 * @type {StorageManager}
 * @default
 */
export const storage = new StorageManager();

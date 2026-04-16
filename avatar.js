// ImageStorageManager.js
const ImageStorageManager = {
  // 配置项
  config: {
    dbName: "ImageDB",
    dbVersion: 1,
    storeName: "images",
    storageKey: "user_avatar",
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },

  // 打开数据库
  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const store = db.createObjectStore(this.config.storeName, {
            keyPath: "id",
          });
          store.createIndex("name", "name", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  },

  // 保存图片
  async saveImage(file, customId = null) {
    if (!this.config.allowedTypes.includes(file.type)) {
      throw new Error(
        "不支持的文件类型，请上传 JPG、PNG、GIF 或 WebP 格式的图片",
      );
    }

    if (file.size > this.config.maxSize) {
      throw new Error(
        `文件大小不能超过 ${this.config.maxSize / (1024 * 1024)}MB`,
      );
    }

    const db = await this.openDatabase();
    const id = customId || this.config.storageKey;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName], "readwrite");
      const store = transaction.objectStore(this.config.storeName);

      const imageData = {
        id: id,
        name: file.name,
        type: file.type,
        size: file.size,
        timestamp: new Date().toISOString(),
        data: file,
      };

      const request = store.put(imageData);

      request.onsuccess = () => resolve(imageData);
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
    });
  },

  // 读取图片
  async loadImage(id = null) {
    const db = await this.openDatabase();
    const imageId = id || this.config.storageKey;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName], "readonly");
      const store = transaction.objectStore(this.config.storeName);
      const request = store.get(imageId);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
    });
  },

  // 获取图片URL
  async getImageUrl(id = null) {
    const imageData = await this.loadImage(id);
    if (imageData && imageData.data) {
      return URL.createObjectURL(imageData.data);
    }
    return null;
  },

  // 删除图片
  async deleteImage(id = null) {
    const db = await this.openDatabase();
    const imageId = id || this.config.storageKey;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName], "readwrite");
      const store = transaction.objectStore(this.config.storeName);
      const request = store.delete(imageId);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
    });
  },

  // 获取所有图片列表
  async getAllImages() {
    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName], "readonly");
      const store = transaction.objectStore(this.config.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const images = request.result.map(({ data, ...metadata }) => metadata);
        resolve(images);
      };
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
    });
  },

  // 清空所有图片
  async clearAll() {
    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName], "readwrite");
      const store = transaction.objectStore(this.config.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
    });
  },

  // 更新配置
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  },
};

// Vue 组件定义
const ImageUploader = {
  name: "ImageUploader",

  props: {
    position: {
      type: String,
      default: "top-left",
      validator: (value) =>
        [
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
          "custom",
        ].includes(value),
    },
    customPosition: {
      type: Object,
      default: () => ({ top: "20px", left: "20px" }),
    },
    size: {
      type: Number,
      default: 80,
    },
    showUploadArea: {
      type: Boolean,
      default: true,
    },
    showInfoPanel: {
      type: Boolean,
      default: true,
    },
    showDeleteButton: {
      type: Boolean,
      default: true,
    },
    storageKey: {
      type: String,
      default: "user_avatar",
    },
    autoLoad: {
      type: Boolean,
      default: true,
    },
    // 新增：是否显示状态提示
    showStatus: {
      type: Boolean,
      default: true,
    },
  },

  data() {
    return {
      imageData: null,
      imageUrl: null,
      showInfo: false,
      statusMessage: "",
      statusType: "info",
      isLoading: false,
      statusTimeout: null,
    };
  },

  computed: {
    positionStyle() {
      if (this.position === "custom") {
        return this.customPosition;
      }

      const positions = {
        "top-left": { top: "20px", left: "20px" },
        "top-right": { top: "20px", right: "20px" },
        "bottom-left": { bottom: "20px", left: "20px" },
        "bottom-right": { bottom: "20px", right: "20px" },
      };

      return positions[this.position] || positions["top-left"];
    },

    formattedSize() {
      if (!this.imageData) return "";
      const size = this.imageData.size;
      if (size > 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
      }
      return `${(size / 1024).toFixed(2)} KB`;
    },

    statusClasses() {
      const baseClasses =
        "fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all duration-300";
      const typeClasses = {
        success: "bg-green-500 text-white",
        error: "bg-red-500 text-white",
        info: "bg-blue-500 text-white",
      };
      return `${baseClasses} ${typeClasses[this.statusType]}`;
    },
  },

  watch: {
    storageKey() {
      if (this.autoLoad) {
        this.loadImage();
      }
    },
  },

  mounted() {
    if (this.autoLoad) {
      this.loadImage();
    }
  },

  beforeDestroy() {
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
    }
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
    }
  },

  methods: {
    showStatusMessage(message, type = "info") {
      if (!this.showStatus) return;

      this.statusMessage = message;
      this.statusType = type;

      if (this.statusTimeout) {
        clearTimeout(this.statusTimeout);
      }

      this.statusTimeout = setTimeout(() => {
        this.statusMessage = "";
      }, 3000);
    },

    async loadImage() {
      try {
        this.isLoading = true;
        ImageStorageManager.config.storageKey = this.storageKey;
        const imageData = await ImageStorageManager.loadImage();

        if (imageData) {
          this.imageData = imageData;
          if (this.imageUrl) {
            URL.revokeObjectURL(this.imageUrl);
          }
          this.imageUrl = URL.createObjectURL(imageData.data);
          this.$emit("loaded", imageData);
        } else {
          this.$emit("no-image");
        }
      } catch (error) {
        console.error("加载图片失败:", error);
        this.showStatusMessage("加载图片失败", "error");
        this.$emit("error", error);
      } finally {
        this.isLoading = false;
      }
    },

    async uploadImage(file) {
      if (!file) return;

      try {
        this.isLoading = true;
        ImageStorageManager.config.storageKey = this.storageKey;
        const savedImage = await ImageStorageManager.saveImage(file);

        if (this.imageUrl) {
          URL.revokeObjectURL(this.imageUrl);
        }
        this.imageData = savedImage;
        this.imageUrl = URL.createObjectURL(savedImage.data);

        this.showStatusMessage(`✅ 图片 "${file.name}" 保存成功`, "success");
        this.$emit("uploaded", savedImage);

        return savedImage;
      } catch (error) {
        console.error("上传失败:", error);
        this.showStatusMessage(error.message || "上传失败", "error");
        this.$emit("error", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteImage() {
      if (!confirm("确定要删除保存的图片吗？")) {
        return;
      }

      try {
        this.isLoading = true;
        ImageStorageManager.config.storageKey = this.storageKey;
        await ImageStorageManager.deleteImage();

        if (this.imageUrl) {
          URL.revokeObjectURL(this.imageUrl);
        }
        this.imageData = null;
        this.imageUrl = null;
        this.showInfo = false;

        this.showStatusMessage("✅ 图片已删除", "success");
        this.$emit("deleted");
      } catch (error) {
        console.error("删除失败:", error);
        this.showStatusMessage("删除失败", "error");
        this.$emit("error", error);
      } finally {
        this.isLoading = false;
      }
    },

    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.uploadImage(file);
        event.target.value = "";
      }
    },

    handleDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },

    handleDrop(event) {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        this.uploadImage(file);
      } else {
        this.showStatusMessage("请拖拽图片文件", "error");
      }
    },

    toggleInfo() {
      this.showInfo = !this.showInfo;
    },

    refresh() {
      this.loadImage();
    },
  },

  template: `
        <div>
            <!-- 状态提示 -->
            <div v-if="statusMessage" :class="statusClasses">
                {{ statusMessage }}
            </div>

            <!-- 图片显示区域 -->
            <div class="fixed z-50" :style="positionStyle">
                <div class="relative cursor-pointer group" @click="triggerFileInput">
                    <div v-if="imageUrl" 
                         class="rounded-full border-4 border-white shadow-lg overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
                         :style="{ width: size + 'px', height: size + 'px' }">
                        <img :src="imageUrl" :alt="imageData ? imageData.name : 'Avatar'" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center rounded-full">
                            <span class="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">📷</span>
                        </div>
                    </div>
                    <div v-else 
                         class="rounded-full border-4 border-white shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl flex items-center justify-center"
                         :class="'bg-gradient-to-br from-purple-500 to-pink-500'"
                         :style="{ width: size + 'px', height: size + 'px' }">
                        <span class="text-white text-4xl">📷</span>
                    </div>
                </div>
            </div>
            
            <!-- 上传区域 -->
            <div v-if="showUploadArea" class="max-w-md mx-auto mt-24 p-5">
                <div class="border-2 border-dashed border-purple-400 rounded-lg p-10 text-center cursor-pointer transition-all duration-300 hover:border-purple-600 hover:bg-purple-50 mb-5"
                     @click="triggerFileInput"
                     @dragover="handleDragOver"
                     @drop="handleDrop">
                    <div class="text-5xl mb-2">📤</div>
                    <div class="text-purple-600 text-base mb-1">点击或拖拽上传图片</div>
                    <div class="text-gray-400 text-xs">支持 JPG, PNG, GIF, WebP 格式，最大 10MB</div>
                </div>
                
                <div class="flex gap-4 mb-5">
                    <button v-if="showInfoPanel" 
                            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium transition-all duration-300 hover:bg-blue-600 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            @click="toggleInfo" 
                            :disabled="isLoading">
                        {{ showInfo ? '隐藏信息' : '查看信息' }}
                    </button>
                    <button v-if="showDeleteButton" 
                            class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium transition-all duration-300 hover:bg-red-600 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            @click="deleteImage" 
                            :disabled="isLoading || !imageData">
                        删除图片
                    </button>
                </div>
                
                <!-- 信息面板 -->
                <div v-if="showInfo && showInfoPanel && imageData" class="bg-gray-100 rounded-lg p-5 mt-5">
                    <div class="font-bold text-gray-800 mb-2 text-base">📋 图片信息</div>
                    <div class="text-gray-600 text-sm space-y-2">
                        <div>📛 文件名: {{ imageData.name }}</div>
                        <div>📏 大小: {{ formattedSize }}</div>
                        <div>📝 类型: {{ imageData.type }}</div>
                        <div>🕐 保存时间: {{ new Date(imageData.timestamp).toLocaleString() }}</div>
                    </div>
                </div>
            </div>
            
            <!-- 隐藏的文件输入框 -->
            <input type="file" 
                   ref="fileInput" 
                   class="hidden" 
                   accept="image/jpeg,image/png,image/gif,image/webp"
                   @change="handleFileChange">
        </div>
    `,
};

// 导出组件
export default ImageUploader;
export { ImageStorageManager };

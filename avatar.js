// ImageStorageManager.js - 简化版存储管理器
const ImageStorageManager = {
  config: {
    dbName: "ImageDB",
    dbVersion: 1,
    storeName: "images",
    storageKey: "user_avatar",
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
  // 新增：压缩图片配置
  imageConfig: {
    maxWidth: 120, // 头像最大宽度
    maxHeight: 120, // 头像最大高度
    quality: 0.77, // JPEG/WebP 质量 (0-1)
    targetType: "image/webp", // 优先使用 WebP（更小）
  },

  async compressImage(file, maxWidth = 200, maxHeight = 200, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url); // 释放临时 URL

        // 计算压缩后的尺寸（保持宽高比）
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // 创建 Canvas 进行压缩
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为压缩后的文件
        const targetType = this.imageConfig.targetType;
        const outputQuality = quality;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("图片压缩失败"));
              return;
            }

            // 创建新的 File 对象
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, ".webp"),
              { type: targetType, lastModified: Date.now() },
            );

            resolve(compressedFile);
          },
          targetType,
          outputQuality,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("图片加载失败"));
      };

      img.src = url;
    });
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
          db.createObjectStore(this.config.storeName, { keyPath: "id" });
        }
      };
    });
  },

  // 保存图片
  async saveImage(file, customId = null) {
    // 验证文件类型
    if (!this.config.allowedTypes.includes(file.type)) {
      throw new Error("不支持的文件类型");
    }

    // 验证文件大小
    if (file.size > this.config.maxSize) {
      throw new Error(
        `文件大小不能超过 ${this.config.maxSize / (1024 * 1024)}MB`,
      );
    }
    let processedFile = file;
    processedFile = await this.compressImage(
      file,
      this.imageConfig.maxWidth,
      this.imageConfig.maxHeight,
      this.imageConfig.quality,
    );

    const db = await this.openDatabase();
    const id = customId || this.config.storageKey;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName], "readwrite");
      const store = transaction.objectStore(this.config.storeName);

      const imageData = {
        id: id,
        name: file.name,
        type: file.type,
        originalSize: file.size,
        size: processedFile.size,
        timestamp: new Date().toISOString(),
        data: processedFile, // 直接存储File对象
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

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
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
};

// 简化的Vue组件
const ImageUploader = {
  name: "ImageUploader",

  props: {
    // 头像大小
    size: {
      type: Number,
      default: 80,
    },
    // 存储键名（用于区分不同用户或不同用途的图片）
    storageKey: {
      type: String,
      default: "user_avatar",
    },
    // 头像位置
    position: {
      type: String,
      default: "top-left",
    },
  },

  data() {
    return {
      imageData: null, // 存储图片元数据
      imageUrl: null, // 用于显示的blob URL
      errorMessage: "", // 错误信息
      isLoading: false, // 加载状态
    };
  },

  computed: {
    // 计算头像位置样式
    positionStyle() {
      const positions = {
        "top-left": { top: "20px", left: "20px" },
        "top-right": { top: "20px", right: "20px" },
        "bottom-left": { bottom: "20px", left: "20px" },
        "bottom-right": { bottom: "20px", right: "20px" },
      };
      return positions[this.position] || positions["top-left"];
    },
  },

  mounted() {
    // 组件加载时自动读取图片
    this.loadImage();
  },

  beforeDestroy() {
    // 清理blob URL，避免内存泄漏
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
    }
  },

  methods: {
    // 从IndexedDB加载图片
    async loadImage() {
      try {
        this.isLoading = true;
        this.errorMessage = "";

        // 设置存储键名
        ImageStorageManager.config.storageKey = this.storageKey;

        // 从数据库读取
        const imageData = await ImageStorageManager.loadImage();

        if (imageData) {
          this.imageData = imageData;
          // 将File对象转换为blob URL用于显示
          this.imageUrl = URL.createObjectURL(imageData.data);
        }
      } catch (error) {
        console.error("加载图片失败:", error);
        this.errorMessage = "加载图片失败";
      } finally {
        this.isLoading = false;
      }
    },

    // 上传图片到IndexedDB
    async uploadImage(file) {
      // 基本验证
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        this.errorMessage = "请选择图片文件";
        return;
      }

      try {
        this.isLoading = true;
        this.errorMessage = "";

        // 设置存储键名
        ImageStorageManager.config.storageKey = this.storageKey;

        // 保存到数据库
        const savedImage = await ImageStorageManager.saveImage(file);

        // 更新显示
        if (this.imageUrl) {
          URL.revokeObjectURL(this.imageUrl);
        }
        this.imageData = savedImage;
        this.imageUrl = URL.createObjectURL(savedImage.data);

        console.log("图片保存成功:", savedImage.name);
      } catch (error) {
        console.error("上传失败:", error);
        this.errorMessage = error.message || "上传失败";
      } finally {
        this.isLoading = false;
      }
    },

    // 删除图片
    async deleteImage() {
      if (!confirm("确定删除图片吗？")) {
        return;
      }

      try {
        this.isLoading = true;

        // 从数据库删除
        await ImageStorageManager.deleteImage();

        // 清理显示
        if (this.imageUrl) {
          URL.revokeObjectURL(this.imageUrl);
        }
        this.imageData = null;
        this.imageUrl = null;

        console.log("图片删除成功");
      } catch (error) {
        console.error("删除失败:", error);
        this.errorMessage = "删除失败";
      } finally {
        this.isLoading = false;
      }
    },

    // 触发文件选择
    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    // 处理文件选择
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.uploadImage(file);
        // 清空input，允许重复上传同一文件
        event.target.value = "";
      }
    },
  },

  template: `
    <div>
      <!-- 头像显示区域（悬浮在固定位置） -->
      <div class="fixed cursor-pointer" :style="positionStyle" @click="triggerFileInput">
        
        <img  
             :src="imageUrl" 
             class="rounded-full border-2 border-white shadow-lg hover:opacity-80 transition-opacity object-cover"
             :style="{ width: size + 'px', height: size + 'px' }"
             >
        <div
             class="rounded-full  flex items-center justify-center text-2xl shadow-lg hover:opacity-80 transition-opacity"
             :style="{ width: size + 'px', height: size + 'px' }">
+
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

export default ImageUploader;
export { ImageStorageManager };

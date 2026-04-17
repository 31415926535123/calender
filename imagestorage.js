// imageStorage.js - 专门处理图片存储的模块
import IndexedDBManager from "./db.js";

class ImageStorageManager {
  constructor() {
    this.config = {
      dbName: "ImageDB",
      dbVersion: 1,
      storeName: "images",
      storageKey: "user_avatar",
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    };

    this.imageConfig = {
      maxWidth: 120,
      maxHeight: 120,
      quality: 0.77,
      targetType: "image/webp",
    };

    this.previewConfig = {
      maxWidth: 37,
      maxHeight: 37,
      quality: 0.6,
      targetType: "image/jpeg",
    };

    // 使用独立的数据库操作模块
    this.db = new IndexedDBManager(
      this.config.dbName,
      this.config.dbVersion,
      this.config.storeName,
    );
  }

  // 设置存储键名（用于区分不同用途）
  setStorageKey(key) {
    this.config.storageKey = key;
  }

  // 文件转Base64（保留用于预览）
  fileToBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  // 压缩图片（纯函数，不涉及存储）
  async compressImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

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

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("图片压缩失败"));
              return;
            }

            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, ".webp"),
              { type: this.imageConfig.targetType, lastModified: Date.now() },
            );

            resolve(compressedFile);
          },
          this.imageConfig.targetType,
          quality,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("图片加载失败"));
      };

      img.src = url;
    });
  }

  // 生成预览图
  async generatePreview(file) {
    return this.compressImage(
      file,
      this.previewConfig.maxWidth,
      this.previewConfig.maxHeight,
      this.previewConfig.quality,
    );
  }

  // 生成正常图
  async generateNormalImage(file) {
    return this.compressImage(
      file,
      this.imageConfig.maxWidth,
      this.imageConfig.maxHeight,
      this.imageConfig.quality,
    );
  }

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

    // 生成压缩版本
    const previewFile = await this.generatePreview(file);
    const normalFile = await this.generateNormalImage(file);

    // 转换为Base64用于存储（保持与原接口兼容）
    const previewBase64 = await this.fileToBase64(previewFile);
    const normalBase64 = await this.fileToBase64(normalFile);

    // 准备存储数据
    const id = customId || this.config.storageKey;
    const imageData = {
      name: file.name,
      type: file.type,
      size: file.size,
      previewBase64: previewBase64,
      normalBase64: normalBase64,
      timestamp: new Date().toISOString(),
    };

    // 使用独立数据库模块保存
    await this.db.save(id, imageData, {
      originalName: file.name,
      originalType: file.type,
      originalSize: file.size,
    });

    // 同时保存到localStorage作为快速预览（保持原功能）
    localStorage.setItem(`img_preview_${id}`, previewBase64);

    return imageData;
  }

  // 同步获取预览图（从localStorage）
  getPreviewSync(id = null) {
    const imageId = id || this.config.storageKey;
    return localStorage.getItem(`img_preview_${imageId}`);
  }

  // 异步加载完整图片
  async loadImage(id = null) {
    const imageId = id || this.config.storageKey;
    const result = await this.db.load(imageId);
    return result ? result.data : null;
  }

  // 删除图片
  async deleteImage(id = null) {
    const imageId = id || this.config.storageKey;
    await this.db.delete(imageId);
    localStorage.removeItem(`img_preview_${imageId}`);
    return true;
  }

  // 清理所有数据
  async clearAll() {
    await this.db.clear();
    // 清理所有预览缓存
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("img_preview_")) {
        localStorage.removeItem(key);
      }
    });
  }
}

// 导出单例
const imageStorage = new ImageStorageManager();
export default imageStorage;
export { ImageStorageManager };

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
              { type: this.imageConfig.targetType },
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
    file = await this.generateNormalImage(file);

    await this.db.save(file);

    return file;
  }
  // 异步加载完整图片
  async loadImage() {
    const result = await this.db.load();
    return result;
  }

  // 删除图片
  async deleteImage(id = null) {
    const imageId = id || this.config.storageKey;
    await this.db.delete();
    return true;
  }

  // 清理所有数据
  async clearAll() {
    await this.db.clear();
  }
}

// 导出单例
const imageStorage = new ImageStorageManager();
export default imageStorage;
export { ImageStorageManager };

// imageuploader.js
import imageStorage from "./imagestorage.js";

const ImageUploader = {
  name: "ImageUploader",

  props: {
    size: {
      type: Number,
      default: 80,
    },
    storageKey: {
      type: String,
      default: "user_avatar",
    },
    position: {
      type: String,
      default: "top-left",
    },
  },

  data() {
    return {
      previewUrl: null, // 快速预览（Base64）
      finalUrl: null, // 最终图片（Base64）
      isLoading: false,
      errorMessage: "",
    };
  },

  computed: {
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
    // 设置存储键名
    imageStorage.setStorageKey(this.storageKey);
    // 加载图片
    this.loadImageProgressive();
  },

  methods: {
    // 渐进式加载图片
    async loadImageProgressive() {
      // 第一步：立即显示预览图（从localStorage同步读取）
      const previewBase64 = imageStorage.getPreviewSync();
      if (previewBase64) {
        this.previewUrl = previewBase64;
      }

      // 第二步：加载最终图片
      await this.loadFinalImage();
    },

    // 加载最终图片
    async loadFinalImage() {
      try {
        const imageData = await imageStorage.loadImage();
        if (imageData && imageData.normalBase64) {
          this.finalUrl = imageData.normalBase64;
        }
      } catch (error) {
        console.error("加载最终图片失败:", error);
        this.errorMessage = "加载图片失败";
      }
    },

    // 上传图片
    async uploadImage(file) {
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        this.errorMessage = "请选择图片文件";
        return;
      }

      this.isLoading = true;
      this.errorMessage = "";

      try {
        imageStorage.setStorageKey(this.storageKey);
        const savedImage = await imageStorage.saveImage(file);

        // 更新显示
        this.previewUrl = savedImage.previewBase64;
        this.finalUrl = savedImage.normalBase64;

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

      this.isLoading = true;

      try {
        await imageStorage.deleteImage();
        this.previewUrl = null;
        this.finalUrl = null;
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
        event.target.value = ""; // 清空input
      }
    },
  },

  template: `
    <div>
      <div class="fixed cursor-pointer" :style="positionStyle" @click="triggerFileInput">
        <!-- 加载状态 -->
        <div v-if="isLoading" 
             class="rounded-full bg-gray-200 flex items-center justify-center"
             :style="{ width: size + 'px', height: size + 'px' }">
          <div class="loader"></div>
        </div>
        
        <!-- 最终图片（优先显示） -->
        <img v-else-if="finalUrl"
             :src="finalUrl"
             class="rounded-full border-2 border-white shadow-lg object-cover"
             :style="{ width: size + 'px', height: size + 'px' }">
        
        <!-- 预览图（过渡显示） -->
        <img v-else-if="previewUrl"
             :src="previewUrl"
             class="rounded-full border-2 border-white shadow-lg object-cover blur-sm"
             :style="{ width: size + 'px', height: size + 'px' }">
        
        <!-- 占位符 -->
        <div v-else
             class="rounded-full bg-gray-100 flex items-center justify-center shadow-lg hover:bg-gray-200 transition-colors"
             :style="{ width: size + 'px', height: size + 'px' }">
          <span class="text-gray-400 text-2xl">+</span>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" 
           class="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg text-sm">
        {{ errorMessage }}
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
export { imageStorage };

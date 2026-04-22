// imageuploader.js
import { ref, computed, onMounted } from "vue";
import imageStorage from "./imagestorage.js";
import globalText from "./locales/text.js";
import { storage } from "./store.js";
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

  setup(props) {
    // 响应式数据
    const previewUrl = ref(null);
    const finalUrl = ref(null);
    const exist = storage.register("imageuploader_imageexist", false);
    const errorMessage = ref("");
    const fileInputRef = ref(null);

    // 计算属性
    const positionStyle = computed(() => {
      const positions = {
        "top-left": { top: "20px", left: "20px" },
        "top-right": { top: "20px", right: "20px" },
        "bottom-left": { bottom: "20px", left: "20px" },
        "bottom-right": { bottom: "20px", right: "20px" },
      };
      return positions[props.position] || positions["top-left"];
    });

    // 加载最终图片
    const loadFinalImage = async () => {
      try {
        const imageData = await imageStorage.loadImage();
        if (imageData) {
          finalUrl.value = URL.createObjectURL(imageData);
        }
      } catch (error) {
        console.error("加载最终图片失败:", error);
        errorMessage.value = globalText.error.loadImageFailed;
      }
    };

    // 渐进式加载图片（保持原接口）
    const loadImageProgressive = async () => {
      await loadFinalImage();
    };

    // 上传图片
    const uploadImage = async (file) => {
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        errorMessage.value = globalText.error.selectImageFile;
        return;
      }
      errorMessage.value = "";

      try {
        imageStorage.setStorageKey(props.storageKey);
        const savedImage = await imageStorage.saveImage(file);
        exist.value = true;
        finalUrl.value = URL.createObjectURL(savedImage);
        console.log("图片保存成功:", savedImage.name);
      } catch (error) {
        console.error("上传失败:", error);
        errorMessage.value = error.message || globalText.error.uploadFailed;
      } finally {
      }
    };

    // 删除图片
    const deleteImage = async () => {
      if (!confirm(globalText.confirm.deleteImage)) {
        return;
      }

      isLoading.value = true;

      try {
        await imageStorage.deleteImage();
        previewUrl.value = null;
        finalUrl.value = null;
        console.log("图片删除成功");
      } catch (error) {
        console.error("删除失败:", error);
        errorMessage.value = globalText.error.deleteFailed;
      } finally {
        isLoading.value = false;
      }
    };

    // 触发文件选择
    const triggerFileInput = () => {
      fileInputRef.value.click();
    };

    // 处理文件选择
    const handleFileChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        uploadImage(file);
        event.target.value = ""; // 清空input
      }
    };

    // 挂载时加载图片
    onMounted(() => {
      imageStorage.setStorageKey(props.storageKey);
      loadImageProgressive();
    });

    // 暴露给父组件的方法（保持与原 Options API 相同的公开接口）
    const exposeMethods = {
      loadImageProgressive,
      uploadImage,
      deleteImage,
      triggerFileInput,
      handleFileChange,
    };

    return {
      // 数据
      previewUrl,
      finalUrl,
      errorMessage,
      globalText,
      exist,
      // 计算属性
      positionStyle,
      // ref
      fileInputRef,
      // 方法
      triggerFileInput,
      handleFileChange,
      uploadImage,
      deleteImage,
      loadImageProgressive,
    };
  },

  template: `
    <div>
      <div class="fixed cursor-pointer" :style="positionStyle" @click="triggerFileInput">
        <!-- 加载状态 -->
        <!-- 占位符 -->
        <div v-if="!exist"
             class="rounded-full bg-gray-100 flex items-center justify-center shadow-lg hover:bg-gray-200 transition-colors"
             :style="{ width: size + 'px', height: size + 'px' }">
          <span class="text-gray-400 text-2xl">{{ globalText.avatar.placeholder }}</span>
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
        

      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" 
           class="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg text-sm">
        {{ errorMessage }}
      </div>

      <!-- 隐藏的文件输入框 -->
      <input type="file" 
             ref="fileInputRef" 
             class="hidden" 
             accept="image/jpeg,image/png,image/gif,image/webp"
             @change="handleFileChange">
    </div>
  `,
};

export default ImageUploader;
export { imageStorage };

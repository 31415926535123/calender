// imageuploader.js
import { ref, computed, onMounted } from "vue";
import imageStorage from "./imagestorage.js";
import globalText from "./locales/text.js";
import { storage } from "./store.js";
import { auth } from "./auth.js";
import { currentTheme, toggleTheme, initTheme, themes } from "./theme.js"; // 新增导入

// Panel 子组件定义（修改后的完整版本）
const SettingsPanel = {
  name: "SettingsPanel",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    currentImageUrl: {
      type: String,
      default: null,
    },
    userName: {
      type: String,
      default: "",
    },
  },
  emits: ["close", "upload", "delete"],
  setup(props, { emit }) {
    const fileInputRef = ref(null);

    // 主题相关
    const theme = currentTheme;
    const isDarkMode = computed(() => theme.value === themes.dark);

    const triggerFileSelect = () => {
      fileInputRef.value.click();
    };

    const handleFileChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        emit("upload", file);
        event.target.value = "";
      }
    };

    const handleDelete = () => {
      if (confirm(globalText.confirm.deleteImage)) {
        emit("delete");
      }
    };

    const handleClose = () => {
      emit("close");
    };

    const handleThemeToggle = () => {
      toggleTheme();
    };

    // 点击遮罩关闭
    const handleOverlayClick = (e) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    };

    // ESC 键关闭
    const handleKeydown = (e) => {
      if (e.key === "Escape" && props.visible) {
        handleClose();
      }
    };

    onMounted(() => {
      document.addEventListener("keydown", handleKeydown);
      initTheme(); // 初始化主题
    });

    return {
      fileInputRef,
      triggerFileSelect,
      handleFileChange,
      handleDelete,
      handleClose,
      handleOverlayClick,
      handleThemeToggle,
      globalText,
      theme,
      isDarkMode,
      themes,
    };
  },
  template: `
    <div 
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-all"
      @click="handleOverlayClick"
    >
      <div 
        class="bg-white rounded-2xl shadow-xl w-3/4 max-w-3xl h-3/4 flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- 头部 -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-xl font-semibold text-gray-800">{{ globalText.panel.title || '头像设置' }}</h3>
          <button 
            @click="handleClose"
            class="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
            aria-label="关闭"
          >&times;</button>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto p-6">
          <div class="flex flex-col items-center space-y-8">
            <!-- 当前头像预览 -->
            <div class="text-center">
              <p class="text-sm text-gray-500 mb-3">{{ globalText.panel.currentAvatar || '当前头像' }}</p>
              <div class="w-32 h-32 rounded-full overflow-hidden bg-gray-100 shadow-md mx-auto">
                <img 
                  v-if="currentImageUrl"
                  :src="currentImageUrl"
                  class="w-full h-full object-cover"
                  alt="头像"
                  data-no-invert
                >
                <div 
                  v-else
                  class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-3xl"
                >
                  {{ userName?.charAt(0) || '?' }}
                </div>
              </div>
            </div>

            <!-- 操作按钮组 -->
            <div class="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <!-- 上传按钮 -->
              <button 
                @click="triggerFileSelect"
                class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-sm"
              >
                {{ globalText.panel.upload || '上传新图片' }}
              </button>
              
              <!-- 删除按钮 -->
              <button 
                @click="handleDelete"
                :disabled="!currentImageUrl"
                :class="[
                  'flex-1 font-medium py-2.5 px-4 rounded-xl transition-colors shadow-sm',
                  currentImageUrl 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                ]"
              >
                {{ globalText.panel.delete || '删除头像' }}
              </button>
            </div>

            <!-- 主题设置区域 -->
            <div class="w-full max-w-md pt-4 border-t border-gray-100">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-medium text-gray-700">{{ globalText.panel.theme || '主题设置' }}</h4>
                  <p class="text-xs text-gray-400 mt-1">{{ globalText.panel.themeHint || '切换界面颜色模式' }}</p>
                </div>
                <button
                  @click="handleThemeToggle"
                  class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none"
                  :class="isDarkMode ? 'bg-gray-700' : 'bg-blue-500'"
                >
                  <span
                    class="inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md flex items-center justify-center text-sm"
                    :class="isDarkMode ? 'translate-x-7' : 'translate-x-1'"
                  >
                    <span v-if="!isDarkMode">☀️</span>
                    <span v-else>🌙</span>
                  </span>
                </button>
              </div>
            </div>

            <!-- 提示文字 -->
            <p class="text-xs text-gray-400 text-center mt-2">
              {{ globalText.panel.hint || '支持 JPG、PNG、GIF、WebP 格式' }}
            </p>
          </div>
        </div>

        <!-- 隐藏的文件输入 -->
        <input 
          type="file"
          ref="fileInputRef"
          class="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
          @change="handleFileChange"
        >
      </div>
    </div>
  `,
};

// ImageUploader 主组件（保持不变）
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
    const panel = ref(false);
    const previewUrl = ref(null);
    const finalUrl = ref(null);
    const exist = storage.register("imageuploader_imageexist", false);
    const errorMessage = ref("");
    const fileInputRef = ref(null);
    const userName = auth.getUser();

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

    // 渐进式加载图片
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
        if (finalUrl.value) {
          URL.revokeObjectURL(finalUrl.value);
        }
        finalUrl.value = URL.createObjectURL(savedImage);
        console.log("图片保存成功:", savedImage.name);
      } catch (error) {
        console.error("上传失败:", error);
        errorMessage.value = error.message || globalText.error.uploadFailed;
      }
    };

    // 删除图片
    const deleteImage = async () => {
      try {
        await imageStorage.deleteImage();
        if (finalUrl.value) {
          URL.revokeObjectURL(finalUrl.value);
        }
        previewUrl.value = null;
        finalUrl.value = null;
        exist.value = false;
        console.log("图片删除成功");
      } catch (error) {
        console.error("删除失败:", error);
        errorMessage.value = globalText.error.deleteFailed;
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
        event.target.value = "";
      }
    };

    // Panel 事件处理
    const openPanel = () => {
      panel.value = true;
    };

    const closePanel = () => {
      panel.value = false;
    };

    const handlePanelUpload = async (file) => {
      await uploadImage(file);
    };

    const handlePanelDelete = async () => {
      await deleteImage();
    };

    // 挂载时加载图片并初始化主题
    onMounted(() => {
      imageStorage.setStorageKey(props.storageKey);
      loadImageProgressive();
      initTheme(); // 初始化主题
    });

    return {
      previewUrl,
      finalUrl,
      errorMessage,
      globalText,
      exist,
      userName,
      panel,
      positionStyle,
      fileInputRef,
      handleFileChange,
      uploadImage,
      deleteImage,
      loadImageProgressive,
      openPanel,
      closePanel,
      handlePanelUpload,
      handlePanelDelete,
    };
  },

  components: {
    Panel: SettingsPanel,
  },

  template: `
    <div>
      <div class="fixed cursor-pointer" :style="positionStyle" @click="openPanel" v-if="!panel">
        <div v-if="!exist"
             class="rounded-full bg-gray-100 flex items-center justify-center shadow-lg hover:bg-gray-200 transition-colors"
             :style="{ width: size + 'px', height: size + 'px' }">
          <span class="text-gray-400 text-2xl">{{ userName?.charAt(0) || '?' }}</span>
        </div>
        
        <img v-else-if="finalUrl"
             :src="finalUrl"
             class="rounded-full border-2 border-white shadow-lg object-cover"
             :style="{ width: size + 'px', height: size + 'px' }"
             data-no-invert>
        
        <img v-else-if="previewUrl"
             :src="previewUrl"
             class="rounded-full border-2 border-white shadow-lg object-cover blur-sm"
             :style="{ width: size + 'px', height: size + 'px' }"
             data-no-invert>
      </div>

      <div v-if="errorMessage" 
           class="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg text-sm z-50">
        {{ errorMessage }}
      </div>

      <input type="file" 
             ref="fileInputRef" 
             class="hidden" 
             accept="image/jpeg,image/png,image/gif,image/webp"
             @change="handleFileChange">

      <Panel 
        :visible="panel"
        :currentImageUrl="finalUrl"
        :userName="userName"
        @close="closePanel"
        @upload="handlePanelUpload"
        @delete="handlePanelDelete"
      />
    </div>
  `,
};

export default ImageUploader;
export { imageStorage };

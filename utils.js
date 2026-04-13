// LargeEditorModal 组件定义
export const LargeEditorModal = {
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue", "close"],
  setup(props, { emit }) {
    const closeModal = () => {
      emit("close");
    };

    const handleOverlayClick = (e) => {
      if (e.target === e.currentTarget) {
        closeModal();
      }
    };

    const handleInput = (e) => {
      emit("update:modelValue", e.target.value);
    };

    return {
      closeModal,
      handleOverlayClick,
      handleInput,
    };
  },
  template: `
    <div 
      v-if="visible" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-all"
      @click="handleOverlayClick"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-3/4 h-3/4 flex flex-col overflow-hidden">
        <!-- 头部 + 关闭按钮 -->
        <div class="flex justify-end p-4 border-b border-gray-200">
          <button 
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <!-- 大文本框区域 -->
        <div class="flex-1 p-6">
          <textarea 
            :value="modelValue"
            @input="handleInput"
            class="w-full h-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-base"
            placeholder=""
            style="min-height: 0"
          ></textarea>
        </div>
      </div>
    </div>
  `,
};
export const CalendarMarker = {
  props: {
    type: { type: String, default: "circle" },
    color: { type: String, default: "#000000" },
    size: { type: Number, default: 16 },
  },
  template: `
    <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- 圆形 -->
      <circle v-if="type === 'circle'" :cx="12" :cy="12" :r="10" :fill="color" />
      
      <!-- 正方形 -->
      <rect v-else-if="type === 'square'" x="4" y="4" width="16" height="16" :fill="color" rx="2" />
      
      <!-- 星形 -->
      <polygon v-else-if="type === 'star'" :fill="color" points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />
      
      <!-- 心形 -->
      <path v-else-if="type === 'heart'" :fill="color" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />

    </svg>
  `,
};

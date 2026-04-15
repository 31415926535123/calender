import { ref, watch, computed } from "vue";
const MARKER_SHAPES = [
  {
    type: "circle",
    content: '<circle cx="12" cy="12" r="10" fill="currentColor" />',
  },
  {
    type: "square",
    content:
      '<rect x="4" y="4" width="16" height="16" fill="currentColor" rx="2" />',
  },
  {
    type: "star",
    content:
      '<polygon fill="currentColor" points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />',
  },
  {
    type: "heart",
    content:
      '<path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />',
  },
];

const DEFAULT_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Yellow", value: "#fbbf24" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
  { name: "Gray", value: "#6b7280" },
];

export const BottomDrawer = {
  props: {
    visible: { type: Boolean, default: false },
    currentDay: { type: Number, default: null },
    markers: { type: Array, default: [] },
  },
  emits: ["close", "select", "update:markers"],
  setup(props, { emit }) {
    const selectedShape = ref(MARKER_SHAPES[0]?.type || "circle");
    const selectedColor = ref(DEFAULT_COLORS[0]?.value || "#ef4444");

    const selectShape = (type) => {
      selectedShape.value = type;
    };

    const selectColor = (color) => {
      selectedColor.value = color;
    };

    const confirm = () => {
      emit("select", {
        day: props.currentDay,
        type: selectedShape.value,
        color: selectedColor.value,
      });
      emit("close");
    };

    const close = () => {
      emit("close");
    };

    // 重置选择（每次打开时重置为默认值）
    const reset = () => {
      selectedShape.value = MARKER_SHAPES[0]?.type || "circle";
      selectedColor.value = DEFAULT_COLORS[0]?.value || "#ef4444";
    };

    watch(
      () => props.visible,
      (newVal) => {
        if (newVal) {
          reset();
        }
      },
    );

    // 获取当前选中形状的 SVG 内容
    const currentShapeContent = computed(() => {
      const shape = MARKER_SHAPES.find((s) => s.type === selectedShape.value);
      return shape ? shape.content : MARKER_SHAPES[0]?.content || "";
    });

    // 获取指定形状的 SVG 内容（用于按钮预览）
    const getShapeContent = (type) => {
      const shape = MARKER_SHAPES.find((s) => s.type === type);
      return shape ? shape.content : MARKER_SHAPES[0]?.content || "";
    };

    // 获取当前日期的所有标记
    const currentDayMarkers = computed(() => {
      if (!props.markers || !props.currentDay) return [];
      return props.markers[props.currentDay] || [];
    });

    // 检查当前日期是否有标记
    const hasMarkers = computed(() => {
      return currentDayMarkers.value.length > 0;
    });

    // 删除标记
    const deleteMarker = (index) => {
      // 深拷贝 markers 数组
      const newMarkers = JSON.parse(JSON.stringify(props.markers));

      // 获取当前日期的标记数组
      const dayMarkers = newMarkers[props.currentDay] || [];

      // 删除指定索引的标记
      dayMarkers.splice(index, 1);

      // 如果删除后数组为空，可以选择删除该日期键或保留空数组
      if (dayMarkers.length === 0) {
        delete newMarkers[props.currentDay];
      } else {
        newMarkers[props.currentDay] = dayMarkers;
      }

      // 触发更新事件
      emit("update:markers", newMarkers);
    };

    return {
      MARKER_SHAPES,
      DEFAULT_COLORS,
      selectedShape,
      selectedColor,
      selectShape,
      selectColor,
      confirm,
      close,
      currentShapeContent,
      getShapeContent,
      currentDayMarkers,
      hasMarkers,
      deleteMarker,
    };
  },
  template: `
    <div 
      v-if="visible" 
      class="fixed inset-0 z-50"
      @click.self="close"
    >
      <!-- 遮罩层 -->
      <div class="absolute inset-0 bg-black bg-opacity-50 transition-opacity" @click="close"></div>
      
      <!-- 抽屉内容 -->
      <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl transform transition-transform max-h-[90vh] overflow-y-auto">
        <!-- 拖动条 -->
        <div class="flex justify-center pt-3 pb-2 sticky top-0 bg-white z-10">
          <div class="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        <!-- 标题 -->
        <div class="px-5 pb-3 border-b">
          <h3 class="text-lg font-semibold text-center">
            为 {{ currentDay }} 号添加标记
          </h3>
          <p class="text-xs text-gray-400 text-center mt-1">点击单元格打开此面板</p>
        </div>
        
        <!-- 图形选择 -->
        <div class="px-5 py-4">
          <p class="text-sm text-gray-600 mb-3">选择图形</p>
          <div class="flex gap-4 justify-around">
            <button
              v-for="shape in MARKER_SHAPES"
              :key="shape.type"
              @click="selectShape(shape.type)"
              :class="[
                'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                selectedShape === shape.type ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-100'
              ]"
            >
              <!-- 图形预览 - 使用共享常量中的 SVG 内容 -->
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" 
                   :style="{ color: selectedShape === shape.type ? '#3b82f6' : '#9ca3af' }"
                   v-html="getShapeContent(shape.type)">
              </svg>
            </button>
          </div>
        </div>
        
        <!-- 颜色选择 -->
        <div class="px-5 py-3">
          <p class="text-sm text-gray-600 mb-3">选择颜色</p>
          <div class="flex flex-wrap gap-3 justify-center">
            <button
              v-for="color in DEFAULT_COLORS"
              :key="color.value"
              @click="selectColor(color.value)"
              :class="[
                'w-10 h-10 rounded-full transition-all',
                selectedColor === color.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
              ]"
              :style="{ backgroundColor: color.value }"
              :title="color.name"
            >
            </button>
          </div>
        </div>
        
        <!-- 预览区域 -->
        <div class="px-5 py-3 flex items-center justify-center gap-3 border-t border-b">
          <span class="text-sm text-gray-600">预览：</span>
          <div class="flex items-center gap-1">
            <span class="text-lg font-bold">{{ currentDay }}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" 
                 :style="{ color: selectedColor }"
                 v-html="currentShapeContent">
            </svg>
          </div>
        </div>
        
        <!-- 已有标记显示区域 -->
        <div v-if="hasMarkers" class="px-5 py-4 border-t">
          <div class="flex justify-between items-center mb-3">
            <p class="text-sm text-gray-600">当前日期的标记</p>
            <span class="text-xs text-gray-400">点击标记可删除</span>
          </div>
          <div class="flex flex-wrap gap-3 justify-center items-center">
            <div 
              v-for="(marker, index) in currentDayMarkers" 
              :key="index"
              @click="deleteMarker(index)"
              class="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-lg min-w-[60px] cursor-pointer hover:bg-red-50 transition-all group relative"
            >
              <!-- 删除提示层 -->
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg transition-all flex items-center justify-center">
                <svg v-if="true" class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" 
                   :style="{ color: marker.color }"
                   v-html="getShapeContent(marker.type)">
              </svg>
              <span class="text-xs text-gray-500">{{ marker.type }}</span>
            </div>
          </div>
          <p class="text-xs text-gray-400 text-center mt-2">共 {{ currentDayMarkers.length }} 个标记</p>
        </div>
        
        <!-- 按钮 -->
        <div class="p-5 flex gap-3 sticky bottom-0 bg-white border-t">
          <button 
            @click="close"
            class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium active:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button 
            @click="confirm"
            class="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium active:bg-blue-600 transition-colors"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  `,
};

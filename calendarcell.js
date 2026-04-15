import { createApp, ref, computed, watch } from "vue";
import { LargeEditorModal, CalendarMarker } from "./utils.js";
import { storage } from "./store.js";
export const CalendarCell = {
  props: ["year", "month", "day", "markers"],
  emits: ["openDrawer"],
  setup(props, { emit }) {
    const content = storage.createDynamicStorage(
      () => `CalendarCell_content_${props.year}_${props.month}_${props.day}`,
      "",
    );
    // 新增：大弹窗的额外内容
    const extraContent = storage.createDynamicStorage(
      () => `CalendarCell_extra_${props.year}_${props.month}_${props.day}`,
      "",
    );

    // 新增：控制弹窗显示
    const showModal = ref(false);
    const openDrawer = () => {
      emit("openDrawer", props.day);
    };
    const handleLongPress = () => {
      showModal.value = true;
    };
    return {
      content,
      extraContent,
      showModal,
      openDrawer,
      handleLongPress,
    };
  },
  components: { CalendarMarker, LargeEditorModal },
  template: `
        
        <div class=" border rounded-lg p-0 bg-white text-center flex flex-col items-center">

                      <div class="text-lg font-bold mb-2 w-full" @click="openDrawer">
    <div class="grid grid-cols-[1fr_auto_1fr] items-center w-full overflow:hidden" style="max-width: 100%">
      <!-- 左侧占位（不可见） -->
      <div class="invisible flex justify-end" >
      </div>
      
      <!-- 数字居中 -->
      <div class="text-center">
        {{ day }}
      </div>
      
      <!-- 右侧实际标记 -->
      <div class="flex justify-start" style="max-width: 40%">
        <calendar-marker v-if="markers" :markers="markers" />
      </div>
    </div>
                    </div>
                    <textarea class="w-full border rounded p-1" rows="3" v-model="content" style="resize:none"  v-longpress="handleLongPress"></textarea>
                    <!-- 新增的大弹窗 -->
      <large-editor-modal v-model="extraContent" :visible="showModal" @close="showModal = false" />
        </div>
            `,
};

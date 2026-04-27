import { createApp, ref, computed, watch } from "vue";
import { LargeEditorModal, CalendarMarker } from "../utils.js";
import { storage } from "../store/store.js";
import { Menu } from "./menu.js";
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
    const menuVisible = ref(false);
    const menuPosition = ref({ x: 0, y: 0 });
    const menuItems = [
      { label: "清空内容", icon: "🧹", action: "clear" },
      { type: "divider" },
      { label: "打开大弹窗", icon: "📝", action: "open_modal" },
      { label: "打开抽屉", icon: "📂", action: "open_drawer" },
      { type: "divider" },
    ];
    const handleMenuSelect = (item) => {
      switch (item.action) {
        case "clear":
          content.value = "";
          break;
        case "open_modal":
          showModal.value = true;
          break;
        case "open_drawer":
          emit("openDrawer", props.day);
          break;
      }
    };
    const openMenu = (event) => {
      menuPosition.value = { x: event.clientX, y: event.clientY };
      menuVisible.value = true;
    };

    // 关闭菜单
    const closeMenu = () => {
      menuVisible.value = false;
    };
    const handleModal = () => {
      showModal.value = true;
    };
    return {
      content,
      extraContent,
      showModal,
      handleModal,
      handleMenuSelect,
      closeMenu,
      openMenu,
      menuItems,
      menuVisible,
      menuPosition,
    };
  },
  components: { CalendarMarker, LargeEditorModal, Menu },
  template: `
        
        <div class=" border rounded-lg p-0 bg-white text-center flex flex-col items-center">

                      <div class="text-lg font-bold mb-2 w-full" @click="openMenu">
    <div class="grid grid-cols-[1fr_auto_1fr] items-center w-full overflow:hidden">
      <!-- 左侧 -->
      
      <div class="flex justify-center items-start">
      <template v-for="(marker,i) in markers" :key="i">
        <calendar-marker   v-if="i>1 && i<4" :marker="marker" />
        </template>
      </div>
      <!-- 数字居中 -->
      <div class="flex justify-center items-center">
        {{ day }}
      </div>
      
      <!-- 右侧实际标记 -->
      <div class="flex justify-center items-end">
        <calendar-marker v-if="markers&&markers[1]" :marker="markers[1]" />
<calendar-marker v-if="markers&&markers[0]" :marker="markers[0]" />
      </div>
    </div>
                    </div>
                    <textarea class="w-full border rounded p-1" rows="3" v-model="content" style="resize:none"></textarea>
                    <!-- 新增的大弹窗 -->
      <large-editor-modal v-model="extraContent" :visible="showModal" @close="showModal = false" />
<Menu 
        :items="menuItems"
        :visible="menuVisible"
        :x="menuPosition.x"
        :y="menuPosition.y"
        @select="handleMenuSelect"
        @close="closeMenu"
      />
        </div>
            `,
};

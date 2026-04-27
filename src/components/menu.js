// menu.js
import { ref, watch, onUnmounted, h } from "vue";

export const Menu = {
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    visible: {
      type: Boolean,
      default: false,
    },
    x: {
      type: Number,
      default: 0,
    },
    y: {
      type: Number,
      default: 0,
    },
  },
  emits: ["select", "close"],
  setup(props, { emit }) {
    const menuRef = ref(null);

    const selectItem = (item) => {
      if (item.disabled || item.type === "divider") return;
      emit("select", item);
      emit("close");
    };

    const handleClickOutside = (event) => {
      if (
        props.visible &&
        menuRef.value &&
        !menuRef.value.contains(event.target)
      ) {
        emit("close");
      }
    };

    // 监听 visible 变化
    watch(
      () => props.visible,
      (newVal) => {
        if (newVal) {
          // 延迟添加事件，避免点击触发菜单的同一个事件立即触发关闭
          setTimeout(() => {
            document.addEventListener("click", handleClickOutside);
          }, 0);
        } else {
          document.removeEventListener("click", handleClickOutside);
        }
      },
    );

    onUnmounted(() => {
      document.removeEventListener("click", handleClickOutside);
    });

    // 渲染菜单项
    const renderMenuItem = (item, index) => {
      if (item.type === "divider") {
        return h("div", { key: index, class: "h-px bg-gray-200 my-1" });
      }

      return h(
        "button",
        {
          key: index,
          class: [
            "w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors",
            item.disabled
              ? "opacity-50 cursor-not-allowed text-gray-400"
              : "hover:bg-gray-50 cursor-pointer",
            item.danger && !item.disabled ? "text-red-600" : "text-gray-700",
          ],
          onClick: (e) => {
            e.stopPropagation();
            selectItem(item);
          },
          disabled: item.disabled,
        },
        [
          item.icon && h("span", { class: "text-base" }, item.icon),
          h("span", item.label),
        ],
      );
    };

    // 返回渲染函数，根据 visible 动态决定渲染内容
    return () => {
      if (!props.visible) {
        return null;
      }

      return h(
        "div",
        {
          ref: menuRef,
          class:
            "fixed z-[100] min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-200 py-1",
          style: {
            left: props.x + "px",
            top: props.y + "px",
          },
          onClick: (e) => e.stopPropagation(),
        },
        props.items.map((item, index) => renderMenuItem(item, index)),
      );
    };
  },
};

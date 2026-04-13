// longpress.js
export default {
  mounted(el, binding) {
    let timer = null;
    let isLongPressed = false; // 标记是否触发了长按
    const duration = typeof binding.value === "number" ? binding.value : 800;
    const handler =
      typeof binding.value === "function"
        ? binding.value
        : binding.value?.handler;

    const start = (e) => {
      // 只响应鼠标左键或触摸
      if (e.button !== undefined && e.button !== 0) return;

      isLongPressed = false;

      timer = setTimeout(() => {
        isLongPressed = true;
        handler?.();
      }, duration);
    };

    const move = (e) => {
      if (!timer) return;
      // 检查是否移动超过10px（防误触）
      if (Math.hypot(e.movementX, e.movementY) > 10) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const cancel = (e) => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      // 如果是长按触发了，阻止后续的 click 事件
      if (isLongPressed && e.type === "pointerup") {
        e.stopPropagation?.();
      }
    };

    // 全局阻止 click 的辅助函数（通过事件捕获）
    const preventClickIfLongPress = (e) => {
      if (isLongPressed) {
        e.stopPropagation();
        // 重置标记，避免影响下次点击
        isLongPressed = false;
      }
    };

    el.addEventListener("pointerdown", start);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", cancel);
    el.addEventListener("pointercancel", cancel);
    // 在捕获阶段拦截 click 事件
    el.addEventListener("click", preventClickIfLongPress, true);

    el._longpressCleanup = () => {
      el.removeEventListener("pointerdown", start);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", cancel);
      el.removeEventListener("pointercancel", cancel);
      el.removeEventListener("click", preventClickIfLongPress, true);
    };
  },

  unmounted(el) {
    el._longpressCleanup?.();
  },
};

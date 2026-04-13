//longpress.js
export default {
  mounted(el, binding) {
    let timer = null;
    const duration = typeof binding.value === "number" ? binding.value : 800;
    const handler =
      typeof binding.value === "function"
        ? binding.value
        : binding.value?.handler;

    const start = (e) => {
      // 只响应鼠标左键或触摸
      if (e.button !== undefined && e.button !== 0) return;

      e.preventDefault(); // 阻止右键菜单/长按菜单

      timer = setTimeout(() => {
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

    const cancel = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    el.addEventListener("pointerdown", start);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", cancel);
    el.addEventListener("pointercancel", cancel);

    el._longpressCleanup = () => {
      el.removeEventListener("pointerdown", start);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", cancel);
      el.removeEventListener("pointercancel", cancel);
    };
  },

  unmounted(el) {
    el._longpressCleanup?.();
  },
};

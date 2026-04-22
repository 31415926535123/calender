import { createApp, ref, computed, onMounted, onUnmounted } from "vue";
import { Calendar } from "./src/components/calendar.js";
import { Login } from "./src/components/login.js";
import { auth } from "./src/services/auth.js";

const main = {
  setup() {
    const login = ref(auth.checkLogin()); // 初始化登录状态
    const currentUser = ref(auth.getUser());

    // 监听认证状态变化（可选，用于实时更新UI）
    let unsubscribe;
    onMounted(() => {
      unsubscribe = auth.addListener((state) => {
        login.value = state.isLoggedIn;
        currentUser.value = state.currentUser;
      });
    });

    onUnmounted(() => {
      if (unsubscribe) unsubscribe();
    });

    // 任何地方都可以获取用户信息
    const welcomeMessage = computed(() => {
      if (currentUser.value) {
        return `欢迎回来，${currentUser.value}`;
      }
      return "";
    });

    const handleLoginUpdate = (newValue) => {
      login.value = newValue;
    };

    const handleLogout = () => {
      auth.logout();
    };

    return {
      login,
      currentUser,
      welcomeMessage,
      handleLoginUpdate,
      handleLogout,
    };
  },
  template: `
    <div>
      <Calendar v-if="login" />
      <Login v-else @update:login="handleLoginUpdate" />
    </div>
  `,
  components: { Calendar, Login },
};

export default main;

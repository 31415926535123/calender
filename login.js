import { ref } from "vue";
import { auth } from "./auth.js";

export const Login = {
  setup(props, { emit }) {
    const username = ref("");
    const password = ref("");
    const errorMessage = ref("");
    const isLoading = ref(false);

    const handleSubmit = async () => {
      errorMessage.value = "";
      isLoading.value = true;

      try {
        const result = await auth.loginOrRegister(
          username.value,
          password.value,
        );
        // 登录/注册成功
        emit("update:login", true);
      } catch (error) {
        errorMessage.value = error.message;
      } finally {
        isLoading.value = false;
      }
    };

    return {
      username,
      password,
      errorMessage,
      isLoading,
      handleSubmit,
    };
  },
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-2">欢迎使用日历</h2>
          <p class="text-gray-500">登录或注册账号</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label class="block text-gray-700 text-sm font-semibold mb-2">用户名</label>
            <input 
              type="text" 
              v-model="username"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="请输入用户名"
              :disabled="isLoading"
            />
          </div>

          <div>
            <label class="block text-gray-700 text-sm font-semibold mb-2">密码</label>
            <input 
              type="password" 
              v-model="password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="请输入密码（至少3位）"
              :disabled="isLoading"
            />
          </div>

          <div v-if="errorMessage" class="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
            {{ errorMessage }}
          </div>

          <button 
            type="submit"
            :disabled="isLoading"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">登录 / 注册</span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              处理中...
            </span>
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-500">
          <p>首次使用将自动注册账号</p>
        </div>
      </div>
    </div>
  `,
};

// 认证底层单例
class AuthService {
  constructor() {
    this.currentUser = null;
    this.isLoggedIn = false;
    this.listeners = []; // 用于状态变化通知
    const temp = localStorage.getItem("users");
    if (temp) {
      const obj = JSON.parse(temp);
      console.log(obj);
      const users = Object.keys(obj).pop();
      console.log(users);
      this.isLoggedIn = true;
      this.currentUser = users;
    }
  }

  // 添加状态监听器（可选，用于响应式更新）
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  notifyListeners() {
    this.listeners.forEach((callback) => callback(this.getState()));
  }

  // 获取当前状态
  getState() {
    return {
      isLoggedIn: this.isLoggedIn,
      currentUser: this.currentUser,
    };
  }

  // 底层存储接口（方便后续迁移到真实后端）
  async storageAPI(username, password) {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    const users = JSON.parse(localStorage.getItem("users") || "{}");

    // 用户不存在 -> 注册
    if (!users[username]) {
      users[username] = password;
      localStorage.setItem("users", JSON.stringify(users));
      return {
        success: true,
        message: "注册成功",
        isNewUser: true,
        username,
      };
    }

    // 用户存在 -> 验证密码
    if (users[username] === password) {
      return {
        success: true,
        message: "登录成功",
        isNewUser: false,
        username,
      };
    }

    return {
      success: false,
      message: "密码错误",
      username,
    };
  }

  // 登录/注册统一接口
  async loginOrRegister(username, password) {
    // 前端验证
    if (!username || !username.trim()) {
      throw new Error("请输入用户名");
    }
    if (!password) {
      throw new Error("请输入密码");
    }
    if (password.length < 3) {
      throw new Error("密码长度至少3位");
    }

    try {
      const result = await this.storageAPI(username.trim(), password);

      if (result.success) {
        this.currentUser =  result.username;
        this.isLoggedIn = true;
        this.notifyListeners();
        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      // 重新抛出，让上层处理
      throw error;
    }
  }

  // 登出
  logout() {
    this.currentUser = null;
    this.isLoggedIn = false;
    this.notifyListeners();
    return { success: true, message: "已退出登录" };
  }

  // 获取当前用户信息
  getUser() {
    return this.currentUser;
  }

  // 检查是否登录
  checkLogin() {
    return this.isLoggedIn;
  }

  // 方便后续迁移真实后端时替换
  setStorageAPI(customAPI) {
    this.storageAPI = customAPI;
  }
}

// 导出单例
export const auth = new AuthService();

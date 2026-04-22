// theme.js
import { ref, watch } from "vue";

const THEME_KEY = "app_theme";
const themes = {
  light: "light",
  dark: "dark",
};

// 响应式主题状态
const currentTheme = ref(localStorage.getItem(THEME_KEY) || themes.light);
const html=document.documentElement;
const body=document.body;
// 应用主题到html根元素
const applyTheme = (theme) => {
  if (theme === themes.dark) {
    html.classList.add("dark-mode");
  } else {
    html.classList.remove("dark-mode"); }
  localStorage.setItem(THEME_KEY, theme);
};

// 切换主题
const toggleTheme = () => {
  const newTheme =
    currentTheme.value === themes.light ? themes.dark : themes.light;
  currentTheme.value = newTheme;
  applyTheme(newTheme);
};

// 设置主题
const setTheme = (theme) => {
  if (theme !== themes.light && theme !== themes.dark) return;
  currentTheme.value = theme;
  applyTheme(theme);
};

// 初始化主题
const initTheme = () => {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (
    savedTheme &&
    (savedTheme === themes.light || savedTheme === themes.dark)
  ) {
    currentTheme.value = savedTheme;
    applyTheme(savedTheme);
  } else {
    applyTheme(themes.light);
  }
};

// 监听主题变化（可选）
watch(currentTheme, (newTheme) => {
  applyTheme(newTheme);
});

export { currentTheme, toggleTheme, setTheme, initTheme, themes };

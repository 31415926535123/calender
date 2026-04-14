项目多语言计划**策略、原因、迁移方法**三个维度

## 一、采用策略

**核心做法：创建一个全局 `$text` 对象，集中管理所有用户可见的文字，变量用 `{name}` 占位符。**

### 具体实施

**1. 创建全局文本文件**

```javascript
// locales/text.js
export default {
  common: { confirm: "确认", cancel: "取消" },
  login: { title: "欢迎登录", submitBtn: "登录" },
  home: { welcome: "欢迎回来，{name}" },
};
```

**2. 在 main.js 全局注入**

```javascript
import globalText from "./locales/text.js";
app.config.globalProperties.$text = globalText;
```

**3. 组件中使用**

```vue
<template>
  <h1>{{ $text.login.title }}</h1>
  <button>{{ $text.login.submitBtn }}</button>
  <p>{{ $text.home.welcome.replace("{name}", userName) }}</p>
</template>
```

---

## 二、采用原因

### 1. 解耦文字与代码

- **现在**：文字是存储在 `$text` 对象里的数据
- **未来**：文字变成从语言文件读取的数据
- **本质**：只是换了一个数据来源，组件结构完全不变

### 2. 避免散落各处的硬编码

- ❌ 硬编码：文字散落在 50 个组件里，未来要逐个查找替换
- ✅ 集中管理：所有文字在 1 个文件里，未来只改这个文件

### 3. 批量替换可行

- 因为有统一的特征：`$text.xxx.yyy`
- 一行正则 `\$text\.([a-zA-Z0-9_.]+)` → `\$t('$1')` 即可完成 90% 的转换
- 不需要人工逐个判断哪些文字需要翻译

### 4. 占位符格式通用

- `{name}` 是 i18n 库通用的变量占位符格式
- 未来转成 `$t('welcome', { name: userName })` 时，语义完全对齐

### 5. 渐进式采用，无侵入

- 现在不需要安装任何依赖
- 不需要改变构建配置
- 新组件用新写法，老组件保持原样，可以混用

---

## 三、后续迁移方法

### 第一步：安装 i18n 库（1 分钟）

```bash
npm install vue-i18n
```

### 第二步：转换语言文件（5 分钟）

```bash
# 复制两份
cp locales/text.js locales/zh.js   # 中文版（内容不变）
cp locales/text.js locales/en.js   # 英文版（手动翻译值）
```

### 第三步：配置 i18n（5 分钟）

```javascript
// main.js - 改造后
import { createI18n } from "vue-i18n";
import zh from "./locales/zh.js";
import en from "./locales/en.js";

const i18n = createI18n({
  locale: "zh",
  messages: { zh, en },
});

app.use(i18n);
// 不再需要 app.config.globalProperties.$text
```

### 第四步：批量替换组件（10-30 分钟）

**VSCode 全局正则替换：**

- 查找：`\$text\.([a-zA-Z0-9_.]+)`
- 替换：`\$t('$1')`
- 开启正则模式，点击全部替换

**替换效果：**
| 原代码 | 替换后 |
|--------|--------|
| `$text.login.title` | `$t('login.title')` |
| `$text.common.confirm` | `$t('common.confirm')` |
| `$text.home.welcome` | `$t('home.welcome')` |

### 第五步：处理带变量的情况（手动，可选）

**原代码：**

```javascript
$text.home.welcome.replace("{name}", userName);
```

**替换后自动变成：**

```javascript
$t("home.welcome").replace("{name}", userName);
```

**可进一步优化成（不必须）：**

```javascript
$t("home.welcome", { name: userName });
```

### 第六步：添加语言切换（10 分钟）

```vue
<template>
  <select v-model="$i18n.locale">
    <option value="zh">中文</option>
    <option value="en">English</option>
  </select>
</template>
```

---

## 四、迁移时间汇总

| 步骤             | 耗时          | 自动化程度           |
| ---------------- | ------------- | -------------------- |
| 安装 i18n        | 1 分钟        | 手动                 |
| 转换语言文件     | 5 分钟        | 手动复制 + 机翻      |
| 配置 main.js     | 5 分钟        | 手动                 |
| 批量替换组件     | 10-30 分钟    | **正则自动**         |
| 处理变量（可选） | 10-20 分钟    | 手动（或第二个正则） |
| 添加语言切换     | 10 分钟       | 手动                 |
| **总计**         | **约 1 小时** | -                    |

---

## 五、核心优势对比

| 对比项   | 传统写法（写死中文）   | 本策略（全局 $text） |
| -------- | ---------------------- | -------------------- |
| 文字位置 | 散落在 50+ 组件        | 集中在 1 个文件      |
| 迁移方式 | 手动逐个查找替换       | 一行正则批量替换     |
| 迁移时间 | 1-2 天                 | 1 小时               |
| 误改风险 | 高（可能改到逻辑代码） | 低（特征明确）       |
| 变量处理 | 拼接字符串，难解析     | 占位符，直接映射     |

---

## 六、一句话总结

> **现在创建一个全局 `$text` 对象，所有文字都从这里取；未来用一行正则把 `$text.xxx` 替换成 `$t('xxx')`，再配上 i18n 库，1 小时完成多语言迁移。**

需要做的就两件事：

1. 创建 `locales/text.js` 文件
2. 在 main.js 里注入 `$text` 全局对象

// sw.js - 自动识别当前所在路径
const CACHE_NAME = "v0.0.2";

const BASE = "";

const PRECACHE_URLS = [
  BASE + "index.html",
  BASE + "manifest.json",
  BASE + "icons/icon-144.png",
  BASE + "icons/icon-192.png",
  BASE + "icons/icon-512.png",
  BASE + "store.js",
  BASE + "utils.js",
  BASE + "longpress.js",
];

// 安装事件
self.addEventListener("install", (event) => {});

// 请求拦截 - 关键：使用相对路径匹配
self.addEventListener("fetch", (event) => {});

// 激活事件
self.addEventListener("activate", (event) => {});

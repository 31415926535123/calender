// sw.js - 自动识别当前所在路径
const CACHE_NAME = "v0.0.1";

// 自动获取当前 sw.js 所在的路径前缀
const getBasePath = () => {
  const swPath = self.location.pathname;
  return swPath.substring(0, swPath.lastIndexOf("/") + 1);
};

const BASE = getBasePath();

const PRECACHE_URLS = [
  BASE, // 相当于 /repo-name/
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
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

// 请求拦截 - 关键：使用相对路径匹配
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 只处理同源请求
  if (url.origin !== self.location.origin) return;

  // 移除路径前缀进行匹配（可选，简化逻辑）
  const relativePath = url.pathname.replace(BASE, "");

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

// 激活事件
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  event.waitUntil(clients.claim());
});

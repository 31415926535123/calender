// sw.js - 极简版本，解决超时问题
const CACHE_NAME = "calendar-v1";

// 立即执行，避免任何耗时操作
self.addEventListener("install", (event) => {
  console.log("安装中");
  self.skipWaiting();
  // 不预缓存任何文件，避免超时
  event.waitUntil(Promise.resolve());
});

self.addEventListener("fetch", (event) => {
  // 最简单的 fetch 处理，不做任何缓存匹配
  event.respondWith(fetch(event.request));
});

self.addEventListener("activate", (event) => {
  console.log("激活");
  event.waitUntil(clients.claim());
});

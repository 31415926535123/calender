// sw.js - 完整功能版本
const CACHE_NAME = "v0.0.3";
const BASE = "/calender/";

const PRECACHE_URLS = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.json",
  BASE + "icons/icon-144.png",
  BASE + "icons/icon-192.png",
  BASE + "icons/icon-512.png",
  BASE + "store.js",
  BASE + "utils.js",
  BASE + "longpress.js",
];

// 安装事件 - 缓存文件
self.addEventListener("install", (event) => {
  console.log("Service Worker 安装中...");
  self.skipWaiting(); // 立即激活新的 SW
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(PRECACHE_URLS);
        console.log("所有文件缓存成功");
      } catch (error) {
        console.error("缓存失败:", error);
        // 即使部分文件失败也不阻塞安装
      }
    }),
  );
});

// 请求拦截 - 返回缓存或网络请求
self.addEventListener("fetch", (event) => {
  // 只处理同源请求
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          // 返回缓存
          return response;
        }
        // 缓存未命中，发起网络请求
        return fetch(event.request).then((networkResponse) => {
          // 可选：缓存新的请求
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      }),
    );
  }
});

// 激活事件 - 清理旧缓存
self.addEventListener("activate", (event) => {
  console.log("Service Worker 激活中...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("删除旧缓存:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  event.waitUntil(clients.claim()); // 立即控制所有客户端
});

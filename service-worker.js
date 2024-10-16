const s = /* @__PURE__ */ location.pathname.split("/").slice(0, -1).join("/"), o = [
  s + "/_app/immutable/entry/app.156905a0.js",
  s + "/_app/immutable/nodes/0.2b7c1886.js",
  s + "/_app/immutable/nodes/1.27d431c5.js",
  s + "/_app/immutable/assets/2.0909de93.css",
  s + "/_app/immutable/nodes/2.39e1c40b.js",
  s + "/_app/immutable/chunks/index.60b31203.js",
  s + "/_app/immutable/chunks/index.bbb93bd3.js",
  s + "/_app/immutable/chunks/scheduler.489ad21b.js",
  s + "/_app/immutable/chunks/singletons.bce678ba.js",
  s + "/_app/immutable/entry/start.63d7dca2.js"
], l = [
  s + "/.nojekyll",
  s + "/blips/0.mp3",
  s + "/blips/1.mp3",
  s + "/blips/2.mp3",
  s + "/blips/3.mp3",
  s + "/blips/4.mp3",
  s + "/blips/raw/1.mp3",
  s + "/blips/raw/2.mp3",
  s + "/blips/raw/3.mp3",
  s + "/blips/raw/4.mp3",
  s + "/blips/raw/5.mp3",
  s + "/blips/raw/6.mp3",
  s + "/blips/raw/7.mp3",
  s + "/blips/raw/8.mp3",
  s + "/blips/raw/9.mp3",
  s + "/CNAME",
  s + "/favicons/android-chrome-192x192.png",
  s + "/favicons/android-chrome-512x512.png",
  s + "/favicons/apple-touch-icon.png",
  s + "/favicons/browserconfig.xml",
  s + "/favicons/favicon-16x16.png",
  s + "/favicons/favicon-32x32.png",
  s + "/favicons/favicon.ico",
  s + "/favicons/mstile-144x144.png",
  s + "/favicons/mstile-150x150.png",
  s + "/favicons/mstile-310x150.png",
  s + "/favicons/mstile-310x310.png",
  s + "/favicons/mstile-70x70.png",
  s + "/favicons/safari-pinned-tab.svg",
  s + "/hash.svg",
  s + "/manifest.json"
], m = "1729108413989", t = `cache-${m}`, p = [
  ...o,
  // the app itself
  ...l
  // everything in `static`
];
self.addEventListener("install", (a) => {
  async function n() {
    await (await caches.open(t)).addAll(p);
  }
  a.waitUntil(n());
});
self.addEventListener("activate", (a) => {
  async function n() {
    for (const e of await caches.keys())
      e !== t && await caches.delete(e);
  }
  a.waitUntil(n());
});
self.addEventListener("fetch", (a) => {
  if (a.request.method !== "GET")
    return;
  async function n() {
    const e = new URL(a.request.url), i = await caches.open(t);
    if (p.includes(e.pathname))
      return i.match(e.pathname);
    try {
      const c = await fetch(a.request);
      return c.status === 200 && i.put(a.request, c.clone()), c;
    } catch {
      return i.match(a.request);
    }
  }
  a.respondWith(n());
});

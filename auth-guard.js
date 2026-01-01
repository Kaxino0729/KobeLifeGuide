// auth-guard.js（GitHub Pages 子路径稳定版 + 登录后自动跳转无需刷新）
// 适用于：https://username.github.io/REPO_NAME/

(function () {
  // ===== Firebase config（与你 login.html 完全一致）=====
  const firebaseConfig = {
    apiKey: "AIzaSyB8dt1NgMhBtKlUeFzCAzImuKKjzKCrOTM",
    authDomain: "kobe-life-guide.firebaseapp.com",
    projectId: "kobe-life-guide",
    storageBucket: "kobe-life-guide.firebasestorage.app",
    messagingSenderId: "440390213094",
    appId: "1:440390213094:web:508d4e03409ca338b54a27"
  };

  // ===== Firebase compat CDN（仅当页面没引入时加载）=====
  const CDN = {
    app: "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
    auth: "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"
  };

  function loadOnce(src) {
    return new Promise((resolve, reject) => {
      if ([...document.scripts].some(s => s.src === src)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load: " + src));
      document.head.appendChild(s);
    });
  }

  async function ensureAuth() {
    if (!window.firebase) {
      await loadOnce(CDN.app);
      await loadOnce(CDN.auth);
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    return firebase.auth();
  }

  // ===== GitHub Pages 项目根路径（关键）=====
  const BASE_PATH = location.pathname.replace(/\/[^/]*$/, "/"); // 例：/KobeLifeGuide/
  function pageUrl(nameWithQuery) {
    return BASE_PATH + nameWithQuery;
  }

  function isLoginPage() {
    return location.pathname.endsWith("/login.html");
  }

  function currentFull() {
    // 当前页面文件名 + query + hash
    const file = location.pathname.split("/").pop() || "index.html";
    return file + location.search + location.hash;
  }

  // 跳转去重：避免同一页面重复 replace 导致闪烁
  let navigated = false;
  function safeReplace(targetUrl) {
    if (navigated) return;
    const current = location.pathname + location.search + location.hash;
    // targetUrl 是绝对路径（带 BASE_PATH）
    if (targetUrl === current) return;

    // 额外：短时间内同一目标不重复跳（防极端抖动）
    const key = "__auth_guard_last_nav__";
    const last = sessionStorage.getItem(key);
    if (last === targetUrl) return;
    sessionStorage.setItem(key, targetUrl);

    navigated = true;
    location.replace(targetUrl);
  }

  (async function main() {
    const auth = await ensureAuth();

    // 重点：不要“只判定一次就锁死”
    // 让它在 login 页面能继续等到 user 出现后再跳转
    auth.onAuthStateChanged((user) => {
      const onLogin = isLoginPage();

      // === 未登录 ===
      if (!user) {
        // 非 login：拦到 login，并带 redirectTo（包含 query/hash，保证返回体验一致）
        if (!onLogin) {
          const target = encodeURIComponent(currentFull());
          safeReplace(pageUrl(`login.html?redirectTo=${target}`));
        }
        // login：允许停留（用户要输入）
        return;
      }

      // === 已登录 ===
      if (onLogin) {
        const params = new URLSearchParams(location.search);
        const redirectTo = params.get("redirectTo");
        // redirectTo 可能包含 query/hash，所以直接拼回 BASE_PATH
        const dest = redirectTo ? pageUrl(redirectTo) : pageUrl("index.html");
        safeReplace(dest);
      }
      // 其他页面：已登录放行
    });
  })().catch((err) => {
    console.error("[auth-guard] fatal:", err);
    // 兜底：出错时至少送去 login（用 BASE_PATH）
    if (!location.pathname.endsWith("/login.html")) {
      location.replace(pageUrl("login.html"));
    }
  });
})();

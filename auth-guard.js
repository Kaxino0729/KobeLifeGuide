
// 全站登录拦截 + redirectTo 优先

(function () {
  //现有 login.html 里的 firebaseConfig
  const firebaseConfig = {
    apiKey: "PASTE_YOURS",
    authDomain: "PASTE_YOURS",
    projectId: "PASTE_YOURS",
    appId: "PASTE_YOURS",
  };

  // Firebase compat CDN（10.12.2 compat）
  const CDN = {
    app: "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
    auth: "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
  };

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      // 已经加载过
      if ([...document.scripts].some(s => s.src === src)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load: " + src));
      document.head.appendChild(s);
    });
  }

  async function ensureFirebaseAuth() {
    // 若页面本身已经引入 firebase，直接用
    if (!window.firebase) {
      await loadScriptOnce(CDN.app);
      await loadScriptOnce(CDN.auth);
    }
    // 初始化
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
    }
    return firebase.auth();
  }

  function isLoginPage() {
    const p = location.pathname.toLowerCase();
    return p.endsWith("/login.html") || p.endsWith("login.html");
  }

  function currentPageWithQueryHash() {
    const file = location.pathname.split("/").pop() || "index.html";
    return file + location.search + location.hash;
  }

  function buildLoginUrl() {
    const target = encodeURIComponent(currentPageWithQueryHash());
    return "login.html?redirectTo=" + target;
  }

  function getRedirectToFromQuery() {
    const params = new URLSearchParams(location.search);
    const v = params.get("redirectTo");
    return v ? decodeURIComponent(v) : "";
  }

  function go(url) {
    // 防止一些浏览器缓存导致的回退循环
    location.replace(url);
  }

  (async function main() {
    const auth = await ensureFirebaseAuth();

    auth.onAuthStateChanged((user) => {
      if (isLoginPage()) {
        // login.html：已登录则不要再停留在登录页
        if (user) {
          const redirectTo = getRedirectToFromQuery();
          go(redirectTo || "index.html"); // 优先 redirectTo，没有就 index
        }
        return;
      }

      // 非 login.html：全站必须登录（1A）
      if (!user) {
        go(buildLoginUrl());
      }
    });
  })().catch((e) => {
    // 如果 guard 失败，为了检证稳定性：直接送去 login
    // （避免出现“白屏但能访问页面”的情况）
    console.error(e);
    if (!isLoginPage()) go("login.html");
  });
})();

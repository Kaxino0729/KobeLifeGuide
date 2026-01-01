(function () {
  // ===== Firebase config：和 login.html 完全一致 =====
  const firebaseConfig = {
    apiKey: "AIzaSyB8dt1NgMhBtKlUeFzCAzImuKKjzKCrOTM",
    authDomain: "kobe-life-guide.firebaseapp.com",
    projectId: "kobe-life-guide",
    storageBucket: "kobe-life-guide.firebasestorage.app",
    messagingSenderId: "440390213094",
    appId: "1:440390213094:web:508d4e03409ca338b54a27"
  };

  // ===== Firebase compat CDN（仅在页面没引入时加载）=====
  const CDN = {
    app: "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
    auth: "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"
  };

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if ([...document.scripts].some(s => s.src === src)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function ensureAuth() {
    if (!window.firebase) {
      await loadScriptOnce(CDN.app);
      await loadScriptOnce(CDN.auth);
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    return firebase.auth();
  }

  function isLoginPage() {
    return location.pathname.endsWith("/login.html")
        || location.pathname.endsWith("login.html");
  }

  function currentPage() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function redirectToLogin() {
    const target = encodeURIComponent(currentPage());
    location.replace(`login.html?redirectTo=${target}`);
  }

  function redirectToIndex() {
    location.replace("index.html");
  }

  // ===== 主逻辑 =====
  (async function () {
    const auth = await ensureAuth();

    let resolved = false; // 🔴 关键：防止多次触发

    auth.onAuthStateChanged(user => {
      if (resolved) return;       // 防抖
      resolved = true;

      const onLogin = isLoginPage();

      // === 情况 1：未登录 ===
      if (!user) {
        if (!onLogin) {
          redirectToLogin();
        }
        // 在 login.html，允许停留
        return;
      }

      // === 情况 2：已登录 ===
      if (onLogin) {
        // 有 redirectTo 就回原页面，否则去 index
        const params = new URLSearchParams(location.search);
        const to = params.get("redirectTo");
        location.replace(to || "index.html");
      }
      // 在其他页面：什么都不做（允许停留）
    });
  })().catch(err => {
    console.error("[auth-guard] fatal:", err);
    // 出错时兜底：送去 login
    if (!isLoginPage()) {
      location.replace("login.html");
    }
  });
})();
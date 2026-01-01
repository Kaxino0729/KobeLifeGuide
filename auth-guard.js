// auth-guard.js（GitHub Pages 子路径稳定版）
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

  // ===== Firebase compat CDN =====
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
      s.onerror = reject;
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

  // ===== GitHub Pages 项目根路径（最关键）=====
  const BASE_PATH = location.pathname.replace(/\/[^/]*$/, "/");
  // 例：/KobeLifeGuide/

  function page(name) {
    return BASE_PATH + name;
  }

  function isLoginPage() {
    return location.pathname.endsWith("/login.html");
  }

  function currentPageName() {
    const p = location.pathname.split("/");
    return p[p.length - 1] || "index.html";
  }

  (async function () {
    const auth = await ensureAuth();

    let decided = false;

    auth.onAuthStateChanged(user => {
      if (decided) return;
      decided = true;

      const onLogin = isLoginPage();

      // ===== 未登录 =====
      if (!user) {
        if (!onLogin) {
          const target = encodeURIComponent(currentPageName());
          location.replace(page(`login.html?redirectTo=${target}`));
        }
        return;
      }

      // ===== 已登录 =====
      if (onLogin) {
        const params = new URLSearchParams(location.search);
        const to = params.get("redirectTo");
        location.replace(page(to || "index.html"));
      }
      // 其他页面：允许停留
    });
  })().catch(err => {
    console.error("[auth-guard] fatal:", err);
    if (!location.pathname.endsWith("/login.html")) {
      location.replace(page("login.html"));
    }
  });
})();

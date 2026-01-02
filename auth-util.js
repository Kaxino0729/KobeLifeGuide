// auth-util.js
// 作用：统一初始化 Firebase（如需要）、读取 Firestore 里的 users/{uid}.role，并统一控制 .admin-only 显示

(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyB8dt1NgMhBtKlUeFzCAzImuKKjzKCrOTM",
    authDomain: "kobe-life-guide.firebaseapp.com",
    projectId: "kobe-life-guide",
    storageBucket: "kobe-life-guide.firebasestorage.app",
    messagingSenderId: "440390213094",
    appId: "1:440390213094:web:508d4e03409ca338b54a27"
  };

  const CDN = {
    app: "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
    auth: "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
    fs:  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"
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

  async function ensureFirebase() {
    if (!window.firebase) {
      await loadOnce(CDN.app);
      await loadOnce(CDN.auth);
      await loadOnce(CDN.fs);
    } else {
      // firebase 已经存在，但 firestore 可能没加载
      const hasFS = typeof firebase.firestore === "function";
      if (!hasFS) await loadOnce(CDN.fs);
    }

    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    return { auth: firebase.auth(), db: firebase.firestore() };
  }

  async function getRoleFromFirestore(uid, db) {
    const snap = await db.collection("users").doc(uid).get();
    const role = snap.exists ? (snap.data().role || "user") : "user";
    return role;
  }

  // 对外暴露：刷新角色并统一控制 admin-only
  window.AuthUtil = {
    async refreshRoleAndApplyAdminUI() {
      // 默认先隐藏，避免“闪一下”
      document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");

      const { auth, db } = await ensureFirebase();

      return new Promise((resolve) => {
        auth.onAuthStateChanged(async (user) => {
          if (!user) return resolve({ loggedIn: false, role: "guest" });

          try {
            const role = await getRoleFromFirestore(user.uid, db);

            // 同步缓存：给旧页面继续用（但不作为最终裁判）
            localStorage.setItem("auth_email", user.email || "");
            localStorage.setItem("auth_uid", user.uid);
            localStorage.setItem("auth_role", role);

            if (role === "admin") {
              document.querySelectorAll(".admin-only").forEach(el => el.style.display = "");
            }
            resolve({ loggedIn: true, role });
          } catch (e) {
            console.warn("AuthUtil role fetch failed:", e);
            resolve({ loggedIn: true, role: "user" });
          }
        });
      });
    }
  };
})();

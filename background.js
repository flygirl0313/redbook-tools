// background.js - 后台服务脚本

// 插件安装时的处理
chrome.runtime.onInstalled.addListener(() => {
  console.log("🎉 小红书发布助手已安装");

  // 设置默认存储
  chrome.storage.sync.set({
    installed: true,
    installTime: Date.now(),
  });
});

// 监听标签页更新，检测是否在小红书发布页面
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("creator.xiaohongshu.com/publish")
  ) {
    // 在发布页面时，显示徽章
    chrome.action.setBadgeText({
      text: "✓",
      tabId: tabId,
    });
    chrome.action.setBadgeBackgroundColor({
      color: "#52c41a",
      tabId: tabId,
    });
  } else if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("xiaohongshu.com")
  ) {
    chrome.action.setBadgeText({
      text: "",
      tabId: tabId,
    });
  }
});

// 处理来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Background 收到消息:", request);

  // 注入 content script
  if (request.action === "injectContentScript") {
    injectContentScript(request.tabId)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // 检查 content script 是否已加载
  if (request.action === "checkContentScript") {
    chrome.tabs.sendMessage(request.tabId, { action: "ping" }, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ loaded: false });
      } else {
        sendResponse({ loaded: true, response });
      }
    });
    return true;
  }

  // 获取配置数据
  if (request.action === "getData") {
    chrome.storage.sync.get(["mockData"], (result) => {
      sendResponse({ success: true, data: result.mockData });
    });
    return true;
  }

  // 保存配置数据
  if (request.action === "saveData") {
    chrome.storage.sync.set({ mockData: request.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  // 记录日志
  if (request.action === "log") {
    console.log("📝 日志:", request.message);
    sendResponse({ success: true });
  }
});

// 注入 content script
async function injectContentScript(tabId) {
  try {
    console.log("正在注入 content script 到标签页:", tabId);

    // 注入 CSS
    await chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: ["content.css"],
    });

    // 注入 JS
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["content.js"],
    });

    console.log("✅ Content script 注入成功");
    return true;
  } catch (error) {
    console.error("❌ Content script 注入失败:", error);
    throw error;
  }
}

// 监听插件图标点击（可选）
chrome.action.onClicked.addListener((tab) => {
  console.log("插件图标被点击，标签页:", tab.id);

  // 如果不在小红书页面，打开发布页面
  if (!tab.url.includes("xiaohongshu.com")) {
    chrome.tabs.create({
      url: "https://creator.xiaohongshu.com/publish/publish",
    });
  }
});

// ==================== 开发环境：自动刷新支持 ====================
// content script 会定时发消息来获取当前「版本号」，基于 dev/hot-reload-server.js
// 当检测到版本变化时，会再发一个消息让这里刷新扩展 + 当前标签页
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 开发专用：轮询本地热重载服务器
  if (request.action === "dev-poll-version") {
    (async () => {
      try {
        const res = await fetch(
          "http://localhost:35729/__redbook_tools_version",
          {
            cache: "no-store",
          }
        );
        const data = await res.json();
        sendResponse({ success: true, version: data.version });
      } catch (error) {
        // 没有启动 dev 服务器时静默失败即可
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // 异步 sendResponse
  }

  // 开发专用：收到指令后，刷新当前标签页 + 扩展本身
  if (request.action === "dev-reload-extension-and-tab") {
    if (sender.tab && sender.tab.id !== undefined) {
      chrome.tabs.reload(sender.tab.id);
    }
    // 延迟一点点再 reload，确保上面的 reload 已经发出去
    setTimeout(() => {
      chrome.runtime.reload();
    }, 200);

    sendResponse({ success: true });
    return true;
  }
});

console.log("🚀 Background Service Worker 已启动");

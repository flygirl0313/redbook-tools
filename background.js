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

console.log("🚀 Background Service Worker 已启动");

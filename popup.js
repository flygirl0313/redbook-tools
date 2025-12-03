// popup.js - 弹出页面交互逻辑

document.addEventListener('DOMContentLoaded', function() {
  const autoFillBtn = document.getElementById('autoFillBtn');
  const statusDiv = document.getElementById('status');

  // 检查当前标签页是否是小红书发布页面
  checkCurrentPage();

  // 一键自动填充按钮
  autoFillBtn.addEventListener('click', async () => {
    try {
      // 更新状态为加载中
      updateStatus('正在准备...', 'loading');
      autoFillBtn.disabled = true;

      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // 检查是否在小红书页面
      if (!tab.url || !tab.url.includes('xiaohongshu.com')) {
        updateStatus('请在小红书页面使用', 'error');
        autoFillBtn.disabled = false;
        return;
      }

      // 确保 content script 已加载
      const isReady = await ensureContentScriptLoaded(tab.id);
      if (!isReady) {
        updateStatus('❌ 脚本加载失败，请刷新页面重试', 'error');
        autoFillBtn.disabled = false;
        return;
      }

      updateStatus('正在自动填充...', 'loading');

      // 发送自动填充消息
      chrome.tabs.sendMessage(tab.id, { action: 'autoFill' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('消息发送失败:', chrome.runtime.lastError);
          updateStatus('❌ 执行失败，请重试', 'error');
          autoFillBtn.disabled = false;
          return;
        }

        if (response && response.success) {
          updateStatus('✅ 填充成功！请检查后发布', 'success');
          // 5秒后恢复按钮
          setTimeout(() => {
            autoFillBtn.disabled = false;
            updateStatus('等待操作...', '');
          }, 5000);
        } else {
          updateStatus(`❌ ${response?.error || '填充失败'}`, 'error');
          autoFillBtn.disabled = false;
        }
      });

    } catch (error) {
      console.error('操作失败:', error);
      updateStatus('❌ 操作失败: ' + error.message, 'error');
      autoFillBtn.disabled = false;
    }
  });

  // 确保 content script 已加载
  async function ensureContentScriptLoaded(tabId) {
    try {
      // 尝试 ping content script
      const pingResult = await sendMessageToBackground({
        action: 'checkContentScript',
        tabId: tabId
      });

      if (pingResult && pingResult.loaded) {
        console.log('✅ Content script 已就绪');
        return true;
      }

      console.log('⚠️ Content script 未响应，尝试注入...');

      // 通过 background 注入脚本
      const injectResult = await sendMessageToBackground({
        action: 'injectContentScript',
        tabId: tabId
      });

      if (!injectResult || !injectResult.success) {
        console.error('❌ 注入失败:', injectResult?.error);
        return false;
      }

      console.log('✅ Content script 已注入');

      // 等待脚本初始化
      await sleep(800);

      // 再次检查
      const recheckResult = await sendMessageToBackground({
        action: 'checkContentScript',
        tabId: tabId
      });

      if (recheckResult && recheckResult.loaded) {
        console.log('✅ Content script 初始化完成');
        return true;
      }

      console.warn('⚠️ Content script 仍未响应');
      return false;

    } catch (error) {
      console.error('❌ ensureContentScriptLoaded 失败:', error);
      return false;
    }
  }

  // 发送消息到 background
  function sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  // 发送消息到 tab
  function sendMessageToTab(tabId, message) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  // 延迟函数
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 更新状态显示
  function updateStatus(message, type) {
    statusDiv.className = 'status';
    if (type) {
      statusDiv.classList.add(type);
    }

    const statusIcon = statusDiv.querySelector('.status-icon');
    const statusText = statusDiv.querySelector('.status-text');

    // 根据类型设置图标
    if (type === 'loading') {
      statusIcon.textContent = '⟳';
    } else if (type === 'success') {
      statusIcon.textContent = '✓';
    } else if (type === 'error') {
      statusIcon.textContent = '✕';
    } else {
      statusIcon.textContent = '●';
    }

    statusText.textContent = message;
  }

  // 检查当前页面
  async function checkCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        updateStatus('⚠️ 无法获取页面信息', 'error');
        return;
      }

      if (tab.url.includes('creator.xiaohongshu.com/publish')) {
        updateStatus('⏳ 检测中...', 'loading');

        // 检查 content script 是否已加载
        try {
          const result = await sendMessageToBackground({
            action: 'checkContentScript',
            tabId: tab.id
          });

          if (result && result.loaded) {
            updateStatus('🎯 就绪，可以开始填充', 'success');
          } else {
            updateStatus('⚠️ 请刷新页面后使用', 'error');
          }
        } catch (error) {
          updateStatus('⚠️ 请刷新页面后使用', 'error');
        }
      } else if (tab.url.includes('xiaohongshu.com')) {
        updateStatus('⚠️ 请打开发布页面', 'error');
      } else {
        updateStatus('⚠️ 请在小红书页面使用', 'error');
      }
    } catch (error) {
      console.error('检查页面失败:', error);
      updateStatus('⚠️ 检查失败', 'error');
    }
  }

  // 监听标签页更新
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
      setTimeout(() => checkCurrentPage(), 500);
    }
  });

  // 监听标签页切换
  chrome.tabs.onActivated.addListener(() => {
    setTimeout(() => checkCurrentPage(), 100);
  });
});

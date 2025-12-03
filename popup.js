document.addEventListener('DOMContentLoaded', function() {
    // 获取所有开关元素
    const hideAdsCheckbox = document.getElementById('hideAds');
    const downloadImagesCheckbox = document.getElementById('downloadImages');
    const copyTextCheckbox = document.getElementById('copyText');
    const statusDiv = document.getElementById('status');

    // 从存储中加载设置
    chrome.storage.sync.get({
        hideAds: false,
        downloadImages: false,
        copyText: false
    }, function(items) {
        hideAdsCheckbox.checked = items.hideAds;
        downloadImagesCheckbox.checked = items.downloadImages;
        copyTextCheckbox.checked = items.copyText;
    });

    // 监听设置变化
    hideAdsCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hideAds: this.checked });
        updateStatus('设置已保存');
        notifyContentScript('hideAds', this.checked);
    });

    downloadImagesCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ downloadImages: this.checked });
        updateStatus('设置已保存');
        notifyContentScript('downloadImages', this.checked);
    });

    copyTextCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ copyText: this.checked });
        updateStatus('设置已保存');
        notifyContentScript('copyText', this.checked);
    });

    // 更新状态显示
    function updateStatus(message) {
        statusDiv.textContent = message;
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 2000);
    }

    // 通知内容脚本设置变化
    function notifyContentScript(setting, value) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && tabs[0].url.includes('xiaohongshu.com')) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'settingChanged',
                    setting: setting,
                    value: value
                });
            }
        });
    }
});
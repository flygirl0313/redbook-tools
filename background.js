// 后台服务脚本
chrome.runtime.onInstalled.addListener(() => {
    console.log('Redbook Tools 插件已安装');
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('xiaohongshu.com')) {
        // 页面加载完成，可以执行一些初始化操作
        chrome.action.setIcon({
            path: {
                16: 'icons/icon16.png',
                48: 'icons/icon48.png',
                128: 'icons/icon128.png'
            }
        });
    }
});

// 处理来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'downloadImage') {
        // 处理图片下载请求
        chrome.downloads.download({
            url: request.url,
            filename: request.filename,
            saveAs: false
        });
    }
});
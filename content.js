// 内容脚本 - 在小红书页面中运行
let settings = {};

// 初始化
chrome.storage.sync.get({
    hideAds: false,
    downloadImages: false,
    copyText: false
}, function(items) {
    settings = items;
    applySettings();
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'settingChanged') {
        settings[request.setting] = request.value;
        applySettings();
    }
});

// 应用设置
function applySettings() {
    if (settings.hideAds) {
        hideAds();
    } else {
        showAds();
    }

    if (settings.downloadImages) {
        addDownloadButtons();
    } else {
        removeDownloadButtons();
    }

    if (settings.copyText) {
        addCopyButtons();
    } else {
        removeCopyButtons();
    }
}

// 隐藏广告
function hideAds() {
    const ads = document.querySelectorAll('[data-testid="ad"], .ad-container, .advertisement');
    ads.forEach(ad => ad.style.display = 'none');
}

// 显示广告
function showAds() {
    const ads = document.querySelectorAll('[data-testid="ad"], .ad-container, .advertisement');
    ads.forEach(ad => ad.style.display = '');
}

// 添加下载按钮
function addDownloadButtons() {
    const images = document.querySelectorAll('img[src*="xiaohongshu"]');
    images.forEach(img => {
        if (!img.dataset.downloadAdded) {
            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = '下载';
            downloadBtn.className = 'redbook-tool-download';
            downloadBtn.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: rgba(0,0,0,0.7);
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                z-index: 1000;
            `;

            downloadBtn.onclick = () => downloadImage(img.src);

            // 为图片容器添加相对定位
            const container = img.parentElement;
            if (container.style.position !== 'relative') {
                container.style.position = 'relative';
            }

            container.appendChild(downloadBtn);
            img.dataset.downloadAdded = 'true';
        }
    });
}

// 移除下载按钮
function removeDownloadButtons() {
    const buttons = document.querySelectorAll('.redbook-tool-download');
    buttons.forEach(btn => btn.remove());
    document.querySelectorAll('img[data-download-added]').forEach(img => {
        delete img.dataset.downloadAdded;
    });
}

// 添加复制按钮
function addCopyButtons() {
    const posts = document.querySelectorAll('.note-content, .desc, .content');
    posts.forEach(post => {
        if (!post.dataset.copyAdded) {
            const copyBtn = document.createElement('button');
            copyBtn.textContent = '复制';
            copyBtn.className = 'redbook-tool-copy';
            copyBtn.style.cssText = `
                background: #ff2442;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                margin: 8px 0;
            `;

            copyBtn.onclick = () => copyText(post.textContent);
            post.appendChild(copyBtn);
            post.dataset.copyAdded = 'true';
        }
    });
}

// 移除复制按钮
function removeCopyButtons() {
    const buttons = document.querySelectorAll('.redbook-tool-copy');
    buttons.forEach(btn => btn.remove());
    document.querySelectorAll('[data-copy-added]').forEach(el => {
        delete el.dataset.copyAdded;
    });
}

// 下载图片
function downloadImage(url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = `redbook_${Date.now()}.jpg`;
    link.click();
}

// 复制文本
function copyText(text) {
    navigator.clipboard.writeText(text.trim()).then(() => {
        showToast('文案已复制到剪贴板');
    }).catch(() => {
        showToast('复制失败，请手动复制');
    });
}

// 显示提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        font-size: 14px;
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// 监听页面变化，动态添加功能
const observer = new MutationObserver(() => {
    applySettings();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
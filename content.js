// content.js - 小红书发布页面自动填充工具（模块化版本）

// ==================== 工具函数 ====================

const utils = {
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  async waitForElement(selector, timeout = 10000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element && element.offsetParent !== null) {
        return element;
      }
      await this.sleep(100);
    }
    throw new Error(`等待超时: ${selector}`);
  },

  setReactInputValue(element, value) {
    element.value = "";

    const nativeInputValueSetter =
      Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set ||
      Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value);
    } else {
      element.value = value;
    }

    const events = [
      new Event("focus", { bubbles: true }),
      new Event("input", { bubbles: true }),
      new Event("change", { bubbles: true }),
      new Event("blur", { bubbles: true }),
    ];

    events.forEach((event) => element.dispatchEvent(event));

    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: value,
      })
    );
  },

  showToast(message, duration = 2500) {
    console.log("📢", message);

    const oldToast = document.querySelector(".xhs-auto-filler-toast");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.className = "xhs-auto-filler-toast";
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; padding: 12px 24px; border-radius: 8px; z-index: 999999;
      font-size: 14px; font-weight: 500; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideDown 0.3s ease; min-width: 200px; text-align: center;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(-10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
};

// ==================== 标题填充模块 ====================

async function fillTitle(mockData) {
  console.log("开始填充标题...");

  const titleContainer = document.querySelector('[class*="title-container"]');
  if (!titleContainer) throw new Error("未找到标题容器");

  let titleInput =
    titleContainer.querySelector("input.d-text") ||
    titleContainer.querySelector('input[placeholder*="标题"]') ||
    titleContainer.querySelector('input[type="text"]');

  if (!titleInput) throw new Error("未找到标题输入框");

  titleInput.focus();
  await utils.sleep(200);
  utils.setReactInputValue(titleInput, mockData.title);

  console.log("✅ 标题填充完成:", mockData.title);
  utils.showToast("✅ 标题已填充");
}

// ==================== 正文填充模块 ====================

async function fillContent(mockData) {
  console.log("开始填充正文...");

  const editorContainer = document.querySelector('[class*="editor-container"]');
  if (!editorContainer) throw new Error("未找到编辑器容器");

  const tiptapEditor = editorContainer.querySelector(
    '.tiptap.ProseMirror[contenteditable="true"]'
  );
  if (!tiptapEditor) throw new Error("未找到 TipTap 编辑器");

  tiptapEditor.focus();
  await utils.sleep(300);

  tiptapEditor.innerHTML = "";
  const p = document.createElement("p");
  p.textContent = mockData.content;
  tiptapEditor.appendChild(p);

  tiptapEditor.dispatchEvent(new Event("input", { bubbles: true }));
  tiptapEditor.dispatchEvent(new Event("change", { bubbles: true }));

  console.log("✅ 正文填充完成");
  utils.showToast("✅ 正文已填充");
}

// ==================== 图片上传模块 ====================

async function uploadImages(mockData) {
  console.log("开始上传图片...");
  utils.showToast("📸 正在准备图片...");

  try {
    const imageUrls = mockData.images;

    // 1. 查找图片上传区域
    const imgUploadArea = document.querySelector('[class*="img-upload-area"]');
    if (!imgUploadArea) throw new Error("未找到图片上传区域");

    const imgPreviewArea = imgUploadArea.querySelector(
      '[class*="img-preview-area"]'
    );
    if (!imgPreviewArea) throw new Error("未找到图片预览区域");

    const flexList = imgPreviewArea.querySelector('[class*="flex-list"]');
    if (!flexList) throw new Error("未找到图片列表");

    const entry = flexList.querySelector('[class*="entry"]');
    if (!entry) throw new Error("未找到添加按钮");

    console.log("找到图片上传区域");

    // 2. 点击添加按钮
    entry.click();
    console.log("已点击添加按钮");
    await utils.sleep(800);

    // 3. 查找文件输入框
    const fileInput = document.querySelector(
      'input[type="file"][accept*="image"]'
    );
    if (!fileInput) throw new Error("未找到文件输入框");

    // 4. 下载图片
    const files = [];
    for (let i = 0; i < imageUrls.length; i++) {
      utils.showToast(`📥 下载图片 ${i + 1}/${imageUrls.length}...`);
      try {
        const file = await downloadImageAsFile(
          imageUrls[i],
          `image-${i + 1}.jpg`
        );
        files.push(file);
        console.log(`✅ 图片 ${i + 1} 下载完成`);
      } catch (error) {
        console.error(`❌ 图片 ${i + 1} 下载失败:`, error);
      }
    }

    if (files.length === 0) throw new Error("图片下载失败");

    utils.showToast(`📤 正在上传 ${files.length} 张图片...`);

    // 5. 设置文件并上传
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;

    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    fileInput.dispatchEvent(new Event("input", { bubbles: true }));

    console.log("✅ 图片上传中...");
    utils.showToast("✅ 图片上传中，请稍候...", 2000);
    await utils.sleep(2000);
  } catch (error) {
    console.error("图片上传出错:", error);
    utils.showToast("⚠️ 图片上传失败", 3000);
  }
}

async function downloadImageAsFile(url, filename) {
  const response = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const blob = await response.blob();
  let mimeType = blob.type;

  if (!mimeType || mimeType === "application/octet-stream") {
    if (url.includes(".png")) mimeType = "image/png";
    else if (url.includes(".gif")) mimeType = "image/gif";
    else if (url.includes(".webp")) mimeType = "image/webp";
    else mimeType = "image/jpeg";
  }

  return new File([blob], filename, {
    type: mimeType,
    lastModified: Date.now(),
  });
}

// ==================== 标签添加模块 ====================

async function addTags(mockData) {
  console.log("开始处理标签...");

  if (!mockData.tags || mockData.tags.length === 0) {
    console.log("没有标签需要添加");
    return;
  }

  try {
    for (let i = 0; i < mockData.tags.length; i++) {
      const tag = mockData.tags[i];
      console.log(`添加标签 ${i + 1}/${mockData.tags.length}: ${tag}`);

      const tagName = tag.replace(/^#/, "").replace(/#$/, "");

      // 1. 点击话题按钮
      const topicsButton = document.querySelector('[class*="topics"]');
      if (!topicsButton) {
        console.warn("⚠️ 未找到话题按钮");
        continue;
      }

      topicsButton.click();
      await utils.sleep(800);

      // 2. 等待话题容器
      let topicContainer =
        document.querySelector("#creator-editor-topic-container") ||
        document.querySelector('[class*="creator-editor-topic-container"]');

      if (!topicContainer) {
        console.warn("⚠️ 话题容器未出现");
        continue;
      }

      // 3. 如果有输入框，输入标签名
      const topicInput = topicContainer.querySelector("input");
      if (topicInput) {
        topicInput.focus();
        await utils.sleep(200);
        utils.setReactInputValue(topicInput, tagName);
        console.log("已输入标签名:", tagName);
        await utils.sleep(1000);
      }

      // 4. 查找并点击匹配的标签
      const topicItems = topicContainer.querySelectorAll(".item");
      console.log(`找到 ${topicItems.length} 个话题项`);

      let found = false;
      for (let item of topicItems) {
        const nameElement = item.querySelector(".name");
        if (!nameElement) continue;

        const nameText = nameElement.textContent.trim();
        if (
          nameText.includes(tagName) ||
          nameText.includes(`#${tagName}`) ||
          nameText.replace("#", "") === tagName
        ) {
          console.log("找到匹配的话题:", nameText);
          item.click();
          console.log("✅ 已点击话题项");
          found = true;
          await utils.sleep(500);
          break;
        }
      }

      if (!found && topicItems.length > 0) {
        console.log("未找到匹配项，点击第一个");
        topicItems[0].click();
        await utils.sleep(500);
      }

      await utils.sleep(300);
    }

    console.log("✅ 所有标签处理完成");
    utils.showToast(`✅ 已添加 ${mockData.tags.length} 个标签`);
  } catch (error) {
    console.error("标签添加出错:", error);
    utils.showToast("⚠️ 标签添加失败", 3000);
  }
}

// ==================== 商品选择模块 ====================

async function selectGoods(mockData) {
  console.log("开始选择商品...");
  utils.showToast("🛍️ 正在打开商品选择...");

  try {
    // 1. 查找并点击商品按钮
    const goodsButton = findGoodsButton();
    if (!goodsButton) {
      console.warn("⚠️ 未找到商品按钮");
      return;
    }

    goodsButton.click();
    console.log("已点击商品按钮");
    await utils.sleep(1500);

    // 2. 等待弹窗
    const modal = await findModal();
    if (!modal) {
      console.warn("⚠️ 未找到商品弹窗");
      return;
    }

    // 3. 搜索并选择商品
    const hasSelected = await searchAndSelectGoods(modal, mockData.commodityId);

    // 4. 点击保存或关闭
    await utils.sleep(800);
    await clickActionButton(modal, hasSelected);
  } catch (error) {
    console.error("商品选择出错:", error);
    utils.showToast("⚠️ 商品选择失败", 3000);
  }
}

function findGoodsButton() {
  const container = document.querySelector(
    '[class*="multi-good-select-empty-btn"]'
  );
  if (container) {
    const btn = container.querySelector("button.d-button");
    if (btn) return btn;
  }

  const allButtons = document.querySelectorAll("button");
  for (let btn of allButtons) {
    const text = btn.textContent.trim();
    if (text.includes("添加商品") || text.includes("选择商品")) {
      return btn;
    }
  }
  return null;
}

async function findModal() {
  console.log("🔍 开始查找商品弹窗...");

  // 优先查找商品选择弹窗
  const selectors = [
    ".multi-goods-selector-modal", // 精确匹配商品选择弹窗
    ".goods-selector-modal-red", // 备用
  ];

  for (let selector of selectors) {
    console.log(`  尝试选择器: ${selector}`);
    const elements = document.querySelectorAll(selector);
    console.log(`  找到 ${elements.length} 个元素`);

    for (let el of elements) {
      // 必须是可见的，并且包含 d-modal class
      const isVisible = el.offsetParent !== null && el.style.display !== "none";
      const isModal = el.classList.contains("d-modal");

      console.log(`  元素检查:`, {
        selector,
        visible: isVisible,
        isModal: isModal,
        classes: el.className,
      });

      if (isVisible && isModal) {
        console.log("✅ 找到正确的商品弹窗:", el);
        return el;
      }
    }
  }

  // 如果上面没找到，尝试更通用的方式
  console.warn("⚠️ 精确选择器未找到，尝试通用方式");
  const allModals = document.querySelectorAll(".d-modal");
  console.log(`找到 ${allModals.length} 个 d-modal 元素`);

  for (let modal of allModals) {
    const className = modal.className || "";
    const isVisible =
      modal.offsetParent !== null && modal.style.display !== "none";

    console.log(`  检查 modal:`, {
      className,
      visible: isVisible,
      hasGoodsSelector: className.includes("goods-selector"),
    });

    // 包含 goods-selector 且可见
    if (isVisible && className.includes("goods-selector")) {
      console.log("✅ 通过通用方式找到商品弹窗:", modal);
      return modal;
    }
  }

  console.error("❌ 未找到任何可见的商品弹窗");
  console.log("📊 所有 modal 元素:", document.querySelectorAll(".d-modal"));
  return null;
}

async function searchAndSelectGoods(modal, commodityIds) {
  console.log("🎯 searchAndSelectGoods 函数被调用");
  console.log("📦 Modal:", modal);
  console.log("📋 商品ID列表:", commodityIds);
  console.log("📊 商品数量:", commodityIds ? commodityIds.length : 0);

  let hasSelected = false;

  if (!commodityIds || commodityIds.length === 0) {
    console.warn("⚠️ 商品ID列表为空，跳过搜索");
    return false;
  }

  for (let commodityId of commodityIds) {
    console.log("🔍 搜索商品ID:", commodityId);

    // 更精确地查找搜索框（按优先级尝试）
    let searchInput = null;

    // 方法1: 通过 d-input-wrapper 精确查找
    const inputWrapper = modal.querySelector(".d-input-wrapper");
    if (inputWrapper) {
      searchInput = inputWrapper.querySelector("input.d-text");
      if (searchInput) {
        console.log("✅ 方法1成功：通过 .d-input-wrapper 找到搜索框");
      }
    }

    console.log("🔍 searchInput1:", searchInput);

    // 方法2: 通过 placeholder 查找
    if (!searchInput) {
      searchInput = modal.querySelector('input[placeholder*="搜索商品"]');
      if (searchInput) {
        console.log("✅ 方法2成功：通过 placeholder 找到搜索框");
      }
    }

    console.log("🔍 searchInput2:", searchInput);

    // 方法3: 通过 class 直接查找
    if (!searchInput) {
      searchInput = modal.querySelector('input.d-text[type="text"]');
      if (searchInput) {
        console.log("✅ 方法3成功：通过 class 找到搜索框");
      }
    }

    console.log("🔍 searchInput3:", searchInput);

    if (searchInput) {
      console.log("📝 搜索框元素:", searchInput);
      console.log("📝 Placeholder:", searchInput.placeholder);

      // 聚焦并清空
      searchInput.focus();
      await utils.sleep(1000);

      // 清空输入框
      searchInput.value = "";
      utils.setReactInputValue(searchInput, "");
      await utils.sleep(1000);

      // 输入商品ID
      utils.setReactInputValue(searchInput, commodityId);
      console.log("✅ 已输入商品ID:", commodityId);
      console.log("📝 输入框当前值:", searchInput.value);

      // 触发回车键事件
      searchInput.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          bubbles: true,
        })
      );
      searchInput.dispatchEvent(
        new KeyboardEvent("keypress", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          bubbles: true,
        })
      );
      searchInput.dispatchEvent(
        new KeyboardEvent("keyup", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          bubbles: true,
        })
      );

      console.log("⏳ 等待搜索结果加载（2.5秒）...");
      await utils.sleep(3000);
    } else {
      console.warn("❌ 所有方法都失败，未找到搜索框");
      console.log("📊 Modal 调试信息:");
      console.log("  - Modal 元素:", modal);
      console.log("  - Modal 中所有 input:", modal.querySelectorAll("input"));
      console.log("⚠️ 将直接在商品列表中查找");
    }

    if (await selectGoodsByIdInModal(modal, commodityId)) {
      hasSelected = true;
    }
  }

  return hasSelected;
}

async function selectGoodsByIdInModal(modal, commodityId) {
  console.log("🔍 在弹窗中查找商品:", commodityId);
  console.log("📊 当前 Modal:", modal);
  console.log("📊 Modal 的 className:", modal.className);

  // 等待一下确保DOM已更新
  await utils.sleep(800);

  // 详细调试：查找商品列表容器
  console.log("🔍 查找商品列表容器...");
  const goodsListContainer = modal.querySelector(".goods-list-container");
  console.log("  - goods-list-container:", goodsListContainer);

  if (goodsListContainer) {
    const goodsListNormal =
      goodsListContainer.querySelector(".goods-list-normal");
    console.log("  - goods-list-normal:", goodsListNormal);
  }

  // 尝试多种选择器查找商品卡片
  console.log("🔍 尝试查找商品卡片...");
  const selectors = [
    ".good-card-container", // 直接 class
    '[class*="good-card-container"]', // 包含
    ".goods-list-normal .good-card-container", // 完整路径
    '.goods-list-container [class*="good-card"]', // 在容器内查找
  ];

  let allCards = [];
  for (let selector of selectors) {
    const cards = modal.querySelectorAll(selector);
    console.log(`  尝试 ${selector}: ${cards.length} 个`);
    if (cards.length > 0) {
      allCards = cards;
      console.log(`  ✅ 使用此选择器: ${selector}`);
      break;
    }
  }

  console.log(`📦 最终找到 ${allCards.length} 个商品卡片`);

  // 方法1: 通过 id 属性精确查找
  let goodsElement = modal.querySelector(`[id="${commodityId}"]`);

  if (goodsElement) {
    console.log("✅ 方法1成功：通过 id 属性找到商品元素");
  } else {
    console.log("⚠️ 方法1失败，尝试方法2：遍历所有商品卡片");

    // 方法2: 遍历所有商品卡片查找
    for (let i = 0; i < allCards.length; i++) {
      const card = allCards[i];
      const text = card.textContent || "";

      // 检查这个卡片是否包含商品ID
      if (text.includes(commodityId)) {
        console.log(`✅ 方法2成功：在第 ${i + 1} 个卡片中找到匹配文本`);

        // 尝试在卡片内找到具有 id 属性的元素
        goodsElement = card.querySelector(`[id="${commodityId}"]`);

        if (!goodsElement) {
          // 如果没有找到，使用卡片本身
          goodsElement = card;
          console.log("使用商品卡片本身作为目标元素");
        }
        break;
      }
    }
  }

  if (!goodsElement) {
    console.error("❌ 所有方法都失败了，未找到商品:", commodityId);

    // 详细的调试信息
    console.log("📊 调试信息：");
    console.log("  - 弹窗元素:", modal);
    console.log("  - 商品卡片数量:", allCards.length);

    // 打印所有带 id 的元素
    const allIds = modal.querySelectorAll("[id]");
    const idList = Array.from(allIds)
      .map((el) => el.id)
      .filter((id) => id);
    console.log("  - 弹窗中所有ID:", idList);

    // 打印前3个卡片的部分文本用于调试
    if (allCards.length > 0) {
      console.log("  - 前3个卡片的文本片段:");
      for (let i = 0; i < Math.min(3, allCards.length); i++) {
        const cardText = allCards[i].textContent.substring(0, 100);
        console.log(`    [${i + 1}] ${cardText}...`);
      }
    }

    return false;
  }

  // 向上查找卡片容器
  let goodsCard = goodsElement.closest('[class*="good-card-container"]');

  if (!goodsCard) {
    console.log("向上查找卡片容器...");
    goodsCard = goodsElement;
    let depth = 0;
    while (goodsCard && depth < 10) {
      const className = goodsCard.className || "";
      if (
        className.includes("good-card-container") ||
        className.includes("good-card") ||
        className.includes("goods-card")
      ) {
        console.log("✅ 找到卡片容器");
        break;
      }
      goodsCard = goodsCard.parentElement;
      depth++;
    }
  }

  if (!goodsCard) {
    console.error("❌ 未找到商品卡片容器");
    return false;
  }

  // 查找复选框
  const checkbox = goodsCard.querySelector('input[type="checkbox"]');
  if (!checkbox) {
    console.error("❌ 未找到复选框");
    return false;
  }

  console.log("📋 复选框当前状态:", checkbox.checked ? "已选中" : "未选中");

  if (!checkbox.checked) {
    // 优先点击 d-checkbox-simulator（这是关键！）
    const checkboxSimulator = goodsCard.querySelector(".d-checkbox-simulator");

    if (checkboxSimulator) {
      console.log("🎯 找到 d-checkbox-simulator，点击它");
      checkboxSimulator.click();
      await utils.sleep(500);
      console.log("✅ 点击后状态:", checkbox.checked ? "已选中" : "未选中");

      if (checkbox.checked) {
        utils.showToast(`✅ 商品已选中: ${commodityId.slice(0, 8)}...`, 2000);
        return true;
      } else {
        console.warn("⚠️ 点击 simulator 后仍未选中，尝试其他方法");
      }
    }

    // 备用方法：点击 d-checkbox 容器
    const checkboxContainer = goodsCard.querySelector(".d-checkbox");
    if (checkboxContainer) {
      console.log("🔄 尝试点击 d-checkbox 容器");
      checkboxContainer.click();
      await utils.sleep(500);
      console.log("✅ 点击后状态:", checkbox.checked ? "已选中" : "未选中");

      if (checkbox.checked) {
        utils.showToast(`✅ 商品已选中: ${commodityId.slice(0, 8)}...`, 2000);
        return true;
      }
    }

    // 最后的备用方法
    console.log("🔄 尝试直接点击复选框");
    checkbox.click();
    await utils.sleep(500);
  }

  const finalState = checkbox.checked;
  console.log("✅ 最终状态:", finalState ? "已选中" : "未选中");

  if (finalState) {
    utils.showToast(`✅ 商品已选中`, 2000);
  }

  return finalState;
}

async function clickActionButton(modal, hasSelected) {
  let actionButton = null;

  if (hasSelected) {
    // 查找保存按钮
    const footer = modal.querySelector('[class*="goods-selected-footer"]');
    if (footer) {
      actionButton = footer.querySelector("button.d-button");
    }

    if (!actionButton) {
      const buttons = modal.querySelectorAll("button");
      for (let btn of buttons) {
        if (btn.textContent.includes("保存")) {
          actionButton = btn;
          break;
        }
      }
    }

    if (actionButton) {
      actionButton.click();
      console.log("✅ 已点击保存");
      utils.showToast("✅ 商品已保存");
    }
  } else {
    // 查找关闭按钮
    const header = modal.querySelector('[class*="d-modal-header"]');
    if (header) {
      actionButton = header.querySelector('[class*="d-modal-close"]');
    }

    if (!actionButton) {
      const buttons = modal.querySelectorAll("button");
      for (let btn of buttons) {
        const text = btn.textContent.trim();
        if (text === "取消" || text === "关闭") {
          actionButton = btn;
          break;
        }
      }
    }

    if (actionButton) {
      actionButton.click();
      console.log("⚠️ 已点击关闭");
      utils.showToast("⚠️ 未找到匹配的商品", 3000);
    }
  }
}

// ==================== 主控制器 ====================

class XHSAutoFiller {
  constructor() {
    this.mockData = null;
    this.isRunning = false;
  }

  async autoFill() {
    if (this.isRunning) {
      utils.showToast("⚠️ 正在执行中，请稍候...");
      return;
    }

    try {
      this.isRunning = true;
      utils.showToast("🚀 开始自动填充...");

      // 1. 检查页面
      if (!this.isPublishPage()) {
        throw new Error("请在小红书发布页面使用");
      }

      // 2. 加载数据
      await this.loadMockData();
      utils.showToast("✅ 数据加载完成");

      // 3. 等待页面就绪
      await this.waitForPageReady();

      // 4. 执行填充流程
      if (this.mockData.images && this.mockData.images.length > 0) {
        await uploadImages(this.mockData);
        await utils.sleep(1000);
      }

      await fillTitle(this.mockData);
      await utils.sleep(500);

      await fillContent(this.mockData);
      await utils.sleep(500);

      if (this.mockData.tags && this.mockData.tags.length > 0) {
        await addTags(this.mockData);
        await utils.sleep(500);
      }

      if (this.mockData.commodityId && this.mockData.commodityId.length > 0) {
        await selectGoods(this.mockData);
      }

      utils.showToast("✨ 自动填充完成！请检查后点击发布", 4000);
    } catch (error) {
      console.error("自动填充失败:", error);
      utils.showToast(`❌ 填充失败: ${error.message}`, 4000);
    } finally {
      this.isRunning = false;
    }
  }

  isPublishPage() {
    const url = window.location.href;
    return (
      url.includes("creator.xiaohongshu.com/publish") ||
      url.includes("creator.xiaohongshu.com/post")
    );
  }

  async loadMockData() {
    try {
      const response = await fetch(chrome.runtime.getURL("source/mock.json"));
      this.mockData = await response.json();
      console.log("✅ 加载的数据:", this.mockData);
    } catch (error) {
      throw new Error("无法加载配置数据");
    }
  }

  async waitForPageReady() {
    console.log("等待页面加载...");
    const selectors = [
      'input[placeholder*="标题"]',
      '[contenteditable="true"]',
    ];

    for (let selector of selectors) {
      try {
        await utils.waitForElement(selector, 5000);
      } catch (e) {
        console.warn(`元素未找到: ${selector}`);
      }
    }

    await utils.sleep(800);
    console.log("✅ 页面加载完成");
  }
}

// ==================== 初始化 ====================

const autoFiller = new XHSAutoFiller();

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 收到消息:", request);

  if (request.action === "autoFill") {
    autoFiller
      .autoFill()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "ping") {
    sendResponse({ success: true, message: "Content script is ready" });
    return true;
  }

  return false;
});

// 添加 CSS 动画
const style = document.createElement("style");
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;
document.head.appendChild(style);

console.log("🎉 小红书自动填充工具已就绪");

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

    // 找到上层的 img-list，后面所有 input 查询都限制在这个区域内，避免误选其它 input。
    // 现在页面一进来就已经渲染好了隐藏的 file input，所以不需要再点击「添加」按钮来触发。
    const imgList =
      imgUploadArea.closest(".img-list") ||
      imgUploadArea.closest('[class*="img-list"]') ||
      document;

    console.log("找到图片上传区域与 img-list，直接设置文件进行上传");

    // 2. 查找文件输入框（不再点击“添加”按钮）
    // 之前用的是 [accept*="image"]，但现在页面上是 ".jpg,.jpeg,.png,.webp"，不会匹配到，导致一直找不到 input
    // 这里改为：优先找当前图片区域里的 multiple 文件输入框
    let fileInput =
      imgList.querySelector('input[type="file"][multiple]') ||
      imgList.querySelector('input[type="file"]');

    if (!fileInput) {
      console.warn("⚠️ 在 img-list 中未找到文件输入框，退回到全局查找");
      fileInput =
        document.querySelector('input[type="file"][multiple]') ||
        document.querySelector('input[type="file"]');
    }

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

// ==================== 首屏上传页：选择 tab & 上传图片 ====================

// 判断当前是否为首屏的「上传图文」页面（有 tab 和首屏上传区域）
function isFirstStepUploadPage() {
  const headerTabs = document.querySelector(".header-tabs");
  const firstStepInput = document.querySelector(
    ".upload-wrapper input.upload-input[type='file']"
  );
  return !!(headerTabs && firstStepInput);
}

// 在首屏上传页中，自动选择「上传图文」tab 并用 mockData.images 上传图片
async function handleFirstStepUploadPage(mockData) {
  console.log("检测到首屏上传页，开始选择「上传图文」并上传图片...");

  const headerTabs = document.querySelector(".header-tabs");
  const uploadWrapper = document.querySelector(".upload-wrapper");
  const fileInput =
    uploadWrapper &&
    uploadWrapper.querySelector("input.upload-input[type='file']");

  if (!headerTabs || !uploadWrapper || !fileInput) {
    console.warn("⚠️ 首屏上传页关键元素缺失，跳过首屏处理");
    return false;
  }

  // 1. 选中「上传图文」tab（即便已经选中，再点击一次也不会有副作用）
  try {
    const tabTitles = headerTabs.querySelectorAll(".creator-tab .title");
    for (const titleEl of tabTitles) {
      const text = (titleEl.textContent || "").trim();
      if (text.includes("上传图文")) {
        const tab = titleEl.closest(".creator-tab");
        if (tab) {
          console.log("点击「上传图文」tab");
          tab.click();
          await utils.sleep(300);
        }
        break;
      }
    }
  } catch (e) {
    console.warn("选择「上传图文」tab 时出错:", e);
  }

  // 2. 使用 mockData.images 上传图片
  const imageUrls =
    mockData && Array.isArray(mockData.images) ? mockData.images : [];

  if (!imageUrls.length) {
    console.log("mockData.images 为空，首屏不需要上传图片");
    return false;
  }

  try {
    utils.showToast("📸 首屏开始下载图片...");

    const files = [];
    for (let i = 0; i < imageUrls.length; i++) {
      utils.showToast(`📥 首屏下载图片 ${i + 1}/${imageUrls.length}...`);
      try {
        const file = await downloadImageAsFile(
          imageUrls[i],
          `first-step-image-${i + 1}.jpg`
        );
        files.push(file);
        console.log(`✅ 首屏图片 ${i + 1} 下载完成`);
      } catch (error) {
        console.error(`❌ 首屏图片 ${i + 1} 下载失败:`, error);
      }
    }

    if (!files.length) {
      throw new Error("首屏图片全部下载失败");
    }

    console.log(`准备向首屏 file input 注入 ${files.length} 张图片`);
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;

    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    fileInput.dispatchEvent(new Event("input", { bubbles: true }));

    console.log("✅ 首屏图片上传中...");
    utils.showToast("✅ 首屏图片已开始上传，请稍候...", 3000);
    await utils.sleep(1500);

    return true;
  } catch (error) {
    console.error("首屏图片上传出错:", error);
    utils.showToast("⚠️ 首屏图片上传失败", 3000);
    return false;
  }
}

// 这里本来有一套「下一步」按钮点击逻辑，但实际页面在首屏上传完成后会自动进入编辑页，
// 无需也不存在「下一步」按钮，因此相关函数已移除。

// ==================== 标签添加模块（基于编辑器内输入 # 触发话题列表） ====================

// 将光标移动到内容编辑器末尾
function placeCaretAtEnd(element) {
  if (!element) return;

  element.focus();

  if (window.getSelection && document.createRange) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false); // 光标移到末尾

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

// 判断元素是否可见（用于话题列表容器）
function isElementVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.width > 0 &&
    rect.height > 0
  );
}

// 判断是否为话题面板容器，而不是已经插入到正文里的 a.tiptap-topic
function isTopicContainer(el) {
  if (!isElementVisible(el)) return false;

  const tag = el.tagName.toLowerCase();

  // 排除正文里的话题链接本身
  if (tag === "a" && el.classList.contains("tiptap-topic")) return false;
  if (el.closest(".tiptap-topic")) return false;

  // 优先确认真正的话题列表容器
  if (el.id === "creator-editor-topic-container") return true;
  if (el.classList.contains("items")) return true;
  if (el.classList.contains("recommend-topic-wrapper")) return true;

  // 一般情况下，包含 .item 的才是我们需要的容器
  if (el.querySelector && el.querySelector(".item")) return true;

  return false;
}

async function addTags(mockData) {
  console.log("开始处理标签（先输入 #，再通过话题面板搜索并选择）...");

  if (!mockData.tags || mockData.tags.length === 0) {
    console.log("没有标签需要添加");
    return;
  }

  // 找到编辑器（与 fillContent 保持一致）
  const editorContainer = document.querySelector('[class*="editor-container"]');
  if (!editorContainer) {
    console.warn("⚠️ 未找到编辑器容器，无法添加标签");
    return;
  }

  const tiptapEditor = editorContainer.querySelector(
    '.tiptap.ProseMirror[contenteditable="true"]'
  );
  if (!tiptapEditor) {
    console.warn("⚠️ 未找到 TipTap 编辑器，无法添加标签");
    return;
  }

  try {
    for (let i = 0; i < mockData.tags.length; i++) {
      const tag = mockData.tags[i];
      const tagName = tag.replace(/^#/, "").replace(/#$/, "").trim();
      console.log(`添加标签 ${i + 1}/${mockData.tags.length}: ${tagName}`);

      // 1. 聚焦编辑器，将光标移动到末尾
      placeCaretAtEnd(tiptapEditor);
      await utils.sleep(200);

      // 2. 在编辑器内只输入一个 "#"，触发话题面板
      console.log("在编辑器中插入文本: #");
      let insertedHash = false;
      try {
        insertedHash = document.execCommand("insertText", false, "#");
      } catch (e) {
        console.warn("document.execCommand 插入 # 失败，使用降级方案:", e);
        insertedHash = false;
      }

      if (!insertedHash) {
        // 降级方案：直接追加文本节点，并触发 input 事件
        tiptapEditor.appendChild(document.createTextNode("#"));
        tiptapEditor.dispatchEvent(new Event("input", { bubbles: true }));
      }

      // 模拟一次按键事件，尽量贴近真实输入
      const hashEventInit = {
        key: "#",
        code: "Digit3", // 常见键位映射
        keyCode: 51,
        which: 51,
        bubbles: true,
      };
      tiptapEditor.dispatchEvent(new KeyboardEvent("keydown", hashEventInit));
      tiptapEditor.dispatchEvent(new KeyboardEvent("keypress", hashEventInit));
      tiptapEditor.dispatchEvent(new KeyboardEvent("keyup", hashEventInit));

      // 3. 紧接着在同一个编辑器里输入标签文本（真实交互就是在 # 后继续打字）
      if (tagName) {
        let insertedText = false;
        try {
          insertedText = document.execCommand("insertText", false, tagName);
        } catch (e) {
          console.warn(
            "document.execCommand 插入标签文本失败，使用降级方案:",
            e
          );
          insertedText = false;
        }

        if (!insertedText) {
          tiptapEditor.appendChild(document.createTextNode(tagName));
          tiptapEditor.dispatchEvent(new Event("input", { bubbles: true }));
        }

        // 稍等一会儿，让内部逻辑根据 "#标签" 刷新话题列表
        await utils.sleep(400);
      }

      // 4. 等待话题列表容器出现（你说需要“等一会”，这里给到 4 秒）
      console.log("等待话题列表容器出现...");
      let topicContainer = null;
      const startTime = Date.now();
      const timeout = 4000;

      while (Date.now() - startTime < timeout && !topicContainer) {
        // 直接寻找真正的话题列表容器：id 为 creator-editor-topic-container 的元素
        const el = document.querySelector("#creator-editor-topic-container");
        if (el && isElementVisible(el)) {
          topicContainer = el;
          break;
        }

        await utils.sleep(100);
      }

      if (!topicContainer) {
        console.warn("⚠️ 在超时时间内未找到话题列表容器，跳过该标签");

        // 打印调试信息，方便在控制台确认真实容器名称
        const debugCandidates = Array.from(
          document.querySelectorAll('[id*="topic"], [class*="topic"]')
        ).map((el) => ({
          tag: el.tagName,
          id: el.id,
          className: el.className,
        }));
        console.log("📊 当前页面中包含 topic 的元素:", debugCandidates);
        continue;
      }

      console.log("✅ 找到话题列表容器:", topicContainer);

      // 5. 等待话题列表中的 item 渲染出来（有可能容器先出现，内容稍后才挂载）
      let topicItems = [];
      const itemsStart = Date.now();
      const itemsTimeout = 5000; // 给网络和渲染更多时间

      while (
        Date.now() - itemsStart < itemsTimeout &&
        topicItems.length === 0
      ) {
        topicItems = Array.from(topicContainer.querySelectorAll(".item"));
        if (topicItems.length === 0) {
          await utils.sleep(100);
        }
      }

      // 如果当前容器里还是没有 item，再全局兜底找一次真正的列表容器
      if (topicItems.length === 0) {
        const globalItemsContainer = document.querySelector(
          "#creator-editor-topic-container"
        );
        if (globalItemsContainer && isElementVisible(globalItemsContainer)) {
          const globalItems = Array.from(
            globalItemsContainer.querySelectorAll(".item")
          );
          if (globalItems.length > 0) {
            topicContainer = globalItemsContainer;
            topicItems = globalItems;
          }
        }
      }

      console.log(`找到 ${topicItems.length} 个话题项`);

      if (topicItems.length === 0) {
        console.warn("⚠️ 话题列表为空，跳过该标签");
        continue;
      }

      let targetItem = null;
      for (let item of topicItems) {
        const nameElement = item.querySelector(".name");
        if (!nameElement) continue;

        const nameText = nameElement.textContent.trim();
        if (
          nameText.includes(tagName) ||
          nameText.includes(`#${tagName}`) ||
          nameText.replace("#", "") === tagName
        ) {
          targetItem = item;
          console.log("找到匹配的话题:", nameText);
          break;
        }
      }

      // 如果没有找到完全匹配的，就退而求其次选择第一个
      if (!targetItem) {
        targetItem = topicItems[0];
        const fallbackName =
          targetItem.querySelector(".name")?.textContent.trim() || "";
        console.log("未找到精确匹配项，点击第一个:", fallbackName);
      }

      targetItem.click();
      console.log("✅ 已点击话题项");

      // 给 ProseMirror 一点时间处理插入
      await utils.sleep(500);
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
  // 方法1：老的容器按钮（button）
  const container = document.querySelector(
    '[class*="multi-good-select-empty-btn"]'
  );
  if (container) {
    const btn = container.querySelector("button.d-button");
    if (btn) return btn;
  }

  // 方法2：新的 a.operation-addButton 链接
  const addLink =
    document.querySelector("a.operation-addButton") ||
    document.querySelector("a.d-link.operation-addButton") ||
    document.querySelector("a.d-text.operation-addButton");
  if (addLink && addLink.textContent.includes("添加商品")) {
    return addLink;
  }

  // 方法3：遍历所有 button 和 a，通过文本匹配
  const clickableEls = document.querySelectorAll("button, a");
  for (let el of clickableEls) {
    const text = el.textContent.trim();
    if (text.includes("添加商品") || text.includes("选择商品")) {
      return el;
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
      // 判断是否可见（不能再用 offsetParent，position: fixed 会是 null）
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const isVisible =
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0;
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
    const style = window.getComputedStyle(modal);
    const rect = modal.getBoundingClientRect();
    const isVisible =
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      rect.width > 0 &&
      rect.height > 0;

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

    // 方法1: 通过 d-input-wrapper（包含 d-inline-block）精确查找
    const inputWrapper =
      modal.querySelector(".d-input-wrapper.d-inline-block") ||
      modal.querySelector(".d-input-wrapper");
    if (inputWrapper) {
      // 这里不要再强依赖 input 上的 class，直接拿第一个可见的 input 即可
      const wrapperInputs = inputWrapper.querySelectorAll("input");
      for (const input of wrapperInputs) {
        if (input.offsetParent !== null) {
          searchInput = input;
          break;
        }
      }
      if (searchInput) {
        console.log(
          "✅ 方法1成功：通过 .d-input-wrapper 找到搜索框 ->",
          searchInput
        );
      }
    }

    console.log("🔍 searchInput1:", searchInput);

    // 方法2: 通过 placeholder 查找（兼容各种文案，例如"商品名称/ID"等）
    if (!searchInput) {
      searchInput = modal.querySelector(
        'input[placeholder*="搜索商品"], input[placeholder*="商品"], input[placeholder*="ID"]'
      );
      if (searchInput) {
        console.log("✅ 方法2成功：通过 placeholder 找到搜索框");
      }
    }

    console.log("🔍 searchInput2:", searchInput);

    // 方法3: 通过通用的 text input 查找（不再强依赖 d-text）
    if (!searchInput) {
      // 优先找 type="text" 的输入框
      searchInput =
        modal.querySelector('input.d-text[type="text"]') ||
        modal.querySelector('input[type="text"]');
      if (searchInput) {
        console.log("✅ 方法3成功：通过通用 input[type=text] 找到搜索框");
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

// 自动点击发布按钮
async function clickPublishButton() {
  console.log("开始尝试点击发布按钮...");

  const timeout = 10000;
  const startTime = Date.now();
  let publishBtn = null;

  while (Date.now() - startTime < timeout && !publishBtn) {
    // 1. 优先按 class 精确查找
    publishBtn = document.querySelector("button.publishBtn");

    // 2. 兜底：通过文本内容匹配「发布」
    if (!publishBtn) {
      const buttons = document.querySelectorAll("button");
      for (const btn of buttons) {
        const text = (btn.textContent || "").trim();
        if (text === "发布" || text.includes("发布")) {
          publishBtn = btn;
          break;
        }
      }
    }

    if (publishBtn) break;
    await utils.sleep(300);
  }

  if (!publishBtn) {
    console.warn("⚠️ 未找到发布按钮，跳过自动发布");
    utils.showToast("⚠️ 未找到发布按钮，请手动点击发布", 4000);
    return false;
  }

  // 等按钮可点击（非 disabled）
  const canClick = () => {
    const disabled =
      publishBtn.disabled ||
      publishBtn.getAttribute("aria-disabled") === "true" ||
      publishBtn.classList.contains("is-disabled");
    return !disabled;
  };

  const enableTimeout = 10000;
  const enableStart = Date.now();
  while (Date.now() - enableStart < enableTimeout && !canClick()) {
    console.log("发布按钮已找到但不可点击，等待中...");
    await utils.sleep(300);
  }

  if (!canClick()) {
    console.warn("⚠️ 发布按钮始终不可点击，放弃自动发布");
    utils.showToast("⚠️ 发布按钮不可点击，请手动检查必填项后发布", 4000);
    return false;
  }

  publishBtn.click();
  console.log("✅ 已点击发布按钮");
  utils.showToast("✅ 已自动点击发布，请等待发布结果", 5000);
  return true;
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

      // 3. 如果当前是首屏上传页（有 tab 和首屏上传区域），则：
      //    - 选中「上传图文」tab
      //    - 使用 mockData.images 上传首屏图片
      // 首屏上传完成后，小红书页面会自动进入编辑页，这里不再额外点击「下一步」按钮，
      // 直接继续等待编辑页元素出现并执行后续填充流程。
      if (isFirstStepUploadPage()) {
        const uploaded = await handleFirstStepUploadPage(this.mockData);
        if (!uploaded) {
          utils.showToast(
            "ℹ️ 已尝试处理首屏，但部分图片可能未成功上传，请稍后检查",
            4000
          );
        }
      }

      // 4. 等待编辑页页面就绪
      await this.waitForPageReady();

      // 5. 执行填充流程（编辑页）
      // 图片已经在首屏上传页处理过，这里不再重复上传，避免多次触发上传逻辑
      /*
      if (this.mockData.images && this.mockData.images.length > 0) {
        await uploadImages(this.mockData);
        await utils.sleep(1000);
      }
      */

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

      // 6. 自动点击发布按钮（如果能找到且可点击）
      await clickPublishButton();

      utils.showToast(
        "✨ 自动填充完成！如页面仍未发布，请手动检查后点击发布",
        4000
      );
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

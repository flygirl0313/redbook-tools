# 🔍 商品弹窗诊断脚本

## 问题分析

**找到的 Modal 是错的！**

```javascript
❌ 错误: <div class="d-tabs d-tabs-top goods-selector-tabs">
✅ 正确: <div class="d-modal multi-goods-selector-modal ...">
```

---

## 🧪 在 Console 中执行这些命令诊断

### 1. 手动打开商品弹窗

首先手动点击页面上的"添加商品"按钮，让弹窗出现。

### 2. 查找所有 modal

```javascript
// 查找所有 d-modal 元素
const allModals = document.querySelectorAll('.d-modal');
console.log('所有 modal 数量:', allModals.length);
allModals.forEach((m, i) => {
  console.log(`Modal ${i}:`, {
    className: m.className,
    visible: m.offsetParent !== null,
    display: m.style.display
  });
});
```

### 3. 查找商品选择弹窗

```javascript
// 方法1: 精确查找
const modal1 = document.querySelector('.multi-goods-selector-modal');
console.log('方法1 - multi-goods-selector-modal:', modal1);

// 方法2: 备用
const modal2 = document.querySelector('.goods-selector-modal-red');
console.log('方法2 - goods-selector-modal-red:', modal2);

// 方法3: 包含 goods-selector
const modal3 = document.querySelector('[class*="goods-selector"]');
console.log('方法3 - 包含 goods-selector:', modal3);
```

### 4. 检查正确的 modal

```javascript
// 假设找到了正确的 modal
const correctModal = document.querySelector('.multi-goods-selector-modal');

if (correctModal) {
  console.log('✅ 找到正确的 modal');
  console.log('  - Class:', correctModal.className);
  console.log('  - 可见:', correctModal.offsetParent !== null);

  // 查找搜索框
  const wrapper = correctModal.querySelector('.d-input-wrapper');
  console.log('  - 输入框容器:', wrapper);

  if (wrapper) {
    const input = wrapper.querySelector('input.d-text');
    console.log('  - 搜索框:', input);
    console.log('  - Placeholder:', input ? input.placeholder : 'N/A');
  }

  // 查找所有 input
  const allInputs = correctModal.querySelectorAll('input');
  console.log('  - 所有 input 数量:', allInputs.length);
  allInputs.forEach((inp, i) => {
    console.log(`    Input ${i}:`, {
      class: inp.className,
      type: inp.type,
      placeholder: inp.placeholder
    });
  });
} else {
  console.error('❌ 没找到 modal');
}
```

### 5. 完整测试

```javascript
// 完整的查找流程
function testFindModal() {
  console.log('=== 开始测试 ===');

  // 1. 查找所有可能的 modal
  const selectors = [
    '.multi-goods-selector-modal',
    '.goods-selector-modal-red',
    '.d-modal'
  ];

  for (let selector of selectors) {
    const elements = document.querySelectorAll(selector);
    console.log(`\n${selector}: 找到 ${elements.length} 个`);

    elements.forEach((el, i) => {
      const isVisible = el.offsetParent !== null;
      const hasGoodsSelector = el.className.includes('goods-selector');

      console.log(`  [${i}]`, {
        visible: isVisible,
        hasGoodsSelector: hasGoodsSelector,
        className: el.className.substring(0, 80)
      });

      // 如果是可见的商品选择弹窗
      if (isVisible && hasGoodsSelector) {
        console.log('    ✅ 这个是目标 modal!');

        // 测试查找搜索框
        const input = el.querySelector('.d-input-wrapper input.d-text');
        console.log('    搜索框:', input);
        console.log('    Placeholder:', input ? input.placeholder : 'N/A');
      }
    });
  }

  console.log('\n=== 测试结束 ===');
}

testFindModal();
```

---

## 📋 预期结果

执行上面的脚本后，你应该看到类似：

```javascript
=== 开始测试 ===

.multi-goods-selector-modal: 找到 1 个
  [0] {
    visible: true,
    hasGoodsSelector: true,
    className: "d-modal d-modal-default multi-goods-selector-modal goods-selector-modal-red"
  }
    ✅ 这个是目标 modal!
    搜索框: <input class="d-text" type="text" placeholder="搜索商品ID 或 商品名称">
    Placeholder: 搜索商品ID 或 商品名称
```

---

## 🔧 修复说明

我已经修改了 `findModal()` 函数：

1. ✅ 添加了详细的日志
2. ✅ 检查 `isModal` 确保是 d-modal
3. ✅ 检查 `className.includes('goods-selector')`
4. ✅ 如果精确选择器失败，使用通用方式

---

## 🚀 下一步

1. **重新加载插件**: chrome://extensions/ → 刷新
2. **强制刷新页面**: Cmd+Shift+R
3. **点击填充**: 观察新的日志
4. **如果还不行**: 在 Console 执行上面的诊断脚本，把结果发给我

---

**重点：现在 findModal 会输出详细日志，告诉我们它找到了什么！** 🔍


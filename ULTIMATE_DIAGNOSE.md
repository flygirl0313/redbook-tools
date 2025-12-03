# 🚨 终极诊断：为什么找不到商品卡片

## 💡 在 Console 中执行这个完整诊断

```javascript
// ===== 完整诊断脚本 =====
function diagnoseGoodsSelector() {
  console.log('========== 开始诊断 ==========\n');

  // 1. 查找所有 d-modal
  console.log('【步骤 1】查找所有 d-modal:');
  const allModals = document.querySelectorAll('.d-modal');
  console.log(`  找到 ${allModals.length} 个 d-modal`);

  allModals.forEach((modal, i) => {
    const isVisible = modal.offsetParent !== null;
    const hasGoodsSelector = modal.className.includes('goods-selector');
    console.log(`  [${i}] ${modal.className.substring(0, 60)}...`);
    console.log(`      可见: ${isVisible}, 包含goods-selector: ${hasGoodsSelector}`);
  });

  // 2. 查找商品选择弹窗
  console.log('\n【步骤 2】查找商品选择弹窗:');
  const goodsModal = document.querySelector('.multi-goods-selector-modal');
  console.log('  multi-goods-selector-modal:', goodsModal);

  if (!goodsModal) {
    console.error('  ❌ 没找到商品弹窗！');
    console.log('  💡 请手动点击页面上的"添加商品"按钮');
    return;
  }

  console.log('  ✅ 找到商品弹窗');
  console.log('  Class:', goodsModal.className);

  // 3. 在弹窗中查找商品列表容器
  console.log('\n【步骤 3】查找商品列表容器:');
  const listContainer = goodsModal.querySelector('.goods-list-container');
  console.log('  goods-list-container:', listContainer);

  if (listContainer) {
    const listNormal = listContainer.querySelector('.goods-list-normal');
    console.log('  goods-list-normal:', listNormal);
  }

  // 4. 查找商品卡片
  console.log('\n【步骤 4】查找商品卡片:');
  const selectors = [
    '.good-card-container',
    '[class*="good-card-container"]',
    '.goods-list-normal .good-card-container',
    '.goods-list-container .good-card-container'
  ];

  selectors.forEach(selector => {
    const cards = goodsModal.querySelectorAll(selector);
    console.log(`  ${selector}: ${cards.length} 个`);
    if (cards.length > 0) {
      console.log(`    第一个卡片:`, cards[0]);
    }
  });

  // 5. 查找搜索框
  console.log('\n【步骤 5】查找搜索框:');
  const wrapper = goodsModal.querySelector('.d-input-wrapper');
  console.log('  d-input-wrapper:', wrapper);

  if (wrapper) {
    const input = wrapper.querySelector('input.d-text');
    console.log('  input.d-text:', input);
    if (input) {
      console.log('  Placeholder:', input.placeholder);
    }
  }

  // 6. 查找所有 input
  console.log('\n【步骤 6】查找所有 input:');
  const allInputs = goodsModal.querySelectorAll('input');
  console.log(`  找到 ${allInputs.length} 个 input`);
  allInputs.forEach((inp, i) => {
    console.log(`  [${i}] type: ${inp.type}, class: ${inp.className}, placeholder: ${inp.placeholder}`);
  });

  // 7. 尝试搜索商品
  console.log('\n【步骤 7】测试搜索功能:');
  const searchInput = goodsModal.querySelector('.d-input-wrapper input.d-text');
  if (searchInput) {
    console.log('  ✅ 找到搜索框，尝试输入...');
    searchInput.value = '692f974c14b5260001d74b8c';
    searchInput.dispatchEvent(new Event('input', {bubbles: true}));
    console.log('  已输入商品ID，等待 2 秒...');

    setTimeout(() => {
      console.log('\n【步骤 8】2秒后检查商品卡片:');
      const cardsAfterSearch = goodsModal.querySelectorAll('.good-card-container');
      console.log(`  现在有 ${cardsAfterSearch.length} 个商品卡片`);

      if (cardsAfterSearch.length > 0) {
        console.log('  ✅ 搜索成功！');
        console.log('  第一个卡片:', cardsAfterSearch[0]);

        // 查找商品ID
        const idElement = cardsAfterSearch[0].querySelector('[id="692f974c14b5260001d74b8c"]');
        console.log('  商品ID元素:', idElement);

        // 查找复选框
        const checkbox = cardsAfterSearch[0].querySelector('.d-checkbox');
        console.log('  复选框:', checkbox);

        const simulator = cardsAfterSearch[0].querySelector('.d-checkbox-simulator');
        console.log('  simulator:', simulator);
      }
    }, 2000);
  } else {
    console.error('  ❌ 没找到搜索框');
  }

  console.log('\n========== 诊断结束 ==========');
}

// 执行诊断
diagnoseGoodsSelector();
```

## 🎯 使用方法

1. **打开小红书发布页面**
2. **手动点击"添加商品"按钮** - 让弹窗出现
3. **F12 打开 Console**
4. **复制粘贴上面的完整脚本**
5. **按回车执行**
6. **等待 2 秒，查看完整输出**

## 📊 预期输出

你应该看到类似：

```
========== 开始诊断 ==========

【步骤 1】查找所有 d-modal:
  找到 2 个 d-modal
  [0] d-modal d-modal-default multi-goods-selector-modal goods...
      可见: true, 包含goods-selector: true
  [1] ...
      可见: false, 包含goods-selector: false

【步骤 2】查找商品选择弹窗:
  multi-goods-selector-modal: <div class="d-modal...">
  ✅ 找到商品弹窗

【步骤 3】查找商品列表容器:
  goods-list-container: <div class="goods-list-container">
  goods-list-normal: <div class="goods-list-normal">

【步骤 4】查找商品卡片:
  .good-card-container: 5 个
    第一个卡片: <div class="good-card-container">

【步骤 5】查找搜索框:
  d-input-wrapper: <div class="d-input-wrapper">
  input.d-text: <input class="d-text"...>
  Placeholder: 搜索商品ID 或 商品名称

【步骤 6】查找所有 input:
  找到 6 个 input
  [0] type: text, class: d-text, placeholder: 搜索商品ID 或 商品名称
  [1] type: checkbox, class: , placeholder:
  ...

【步骤 7】测试搜索功能:
  ✅ 找到搜索框，尝试输入...
  已输入商品ID，等待 2 秒...

【步骤 8】2秒后检查商品卡片:
  现在有 1 个商品卡片
  ✅ 搜索成功！
  第一个卡片: <div class="good-card-container">...
  商品ID元素: <div id="692f974c14b5260001d74b8c">...
  复选框: <div class="d-checkbox">...
  simulator: <span class="d-checkbox-simulator">...
```

---

## 🔧 然后告诉我

执行完诊断脚本后，告诉我：

1. **步骤2** 找到商品弹窗了吗？
2. **步骤4** 找到多少个商品卡片？
3. **步骤5** 找到搜索框了吗？
4. **步骤8** 搜索后有商品吗？

这样我就知道问题到底在哪了！💪


# 🧪 商品选择测试清单

## 准备工作

- [ ] 重新加载插件（chrome://extensions/ 点击刷新）
- [ ] 刷新小红书发布页面
- [ ] 打开 Console (F12)
- [ ] 确认 `source/mock.json` 中配置了商品ID

## 测试步骤

### 1. 点击"一键填充"按钮
- [ ] 观察 Console 日志

### 2. 等待商品选择阶段
应该看到如下日志：

```
✅ 正文已填充
✅ 已添加 N 个标签
开始选择商品...
🛍️ 正在打开商品选择...
找到商品按钮: ...
已点击商品按钮
找到商品弹窗: ...
🔍 搜索商品ID: 692f974c14b5260001d74b8c
找到搜索框，输入商品ID
已输入商品ID，等待搜索结果...
```

### 3. 查找商品阶段
应该看到：

```
🔍 在弹窗中查找商品: 692f974c14b5260001d74b8c
✅ 通过 id 属性找到商品元素
✅ 找到卡片容器
📋 复选框当前状态: 未选中
🎯 找到 d-checkbox-simulator，点击它
✅ 点击后状态: 已选中
✅ 最终状态: 已选中
✅ 商品已选中
```

### 4. 保存阶段
应该看到：

```
✅ 已点击保存
✅ 商品已保存
```

## ✅ 成功标志

### Console 日志检查
- [ ] 看到 "✅ 通过 id 属性找到商品元素"
- [ ] 看到 "🎯 找到 d-checkbox-simulator，点击它"
- [ ] 看到 "✅ 点击后状态: 已选中"
- [ ] 看到 "✅ 商品已保存"

### 页面检查
- [ ] 商品弹窗自动关闭
- [ ] 页面上显示已选择的商品
- [ ] 商品卡片显示正确的商品信息

### Toast 提示检查
- [ ] 看到 "🛍️ 正在打开商品选择..."
- [ ] 看到 "✅ 商品已选中: 692f974c..."
- [ ] 看到 "✅ 商品已保存"

## ❌ 失败排查

### 如果显示 "❌ 未找到商品"

检查日志中的 "弹窗中的所有 ID 元素"：
```javascript
// 应该包含你的商品ID
["692f974c14b5260001d74b8c", "other-id-1", "other-id-2"]
```

**可能原因：**
1. 商品ID不在你的商品库中
2. 搜索结果加载太慢（增加等待时间）
3. 网络问题导致搜索失败

**解决方案：**
```javascript
// 在 content.js 第 413 行增加等待时间
await utils.sleep(3000); // 从 2000 改为 3000
```

### 如果显示 "⚠️ 点击 simulator 后仍未选中"

**可能原因：**
1. 页面DOM结构变化
2. 需要其他交互触发

**解决方案：**
1. 检查备用方法是否成功
2. 手动点击测试是否可以选中
3. 在 Console 中手动执行：
```javascript
document.querySelector(".d-checkbox-simulator").click()
```

### 如果商品弹窗没有打开

**可能原因：**
1. 按钮选择器不对
2. 页面还未加载完成

**解决方案：**
1. 查看日志 "⚠️ 未找到商品按钮"
2. 手动点击"添加商品"按钮测试
3. 增加页面就绪等待时间

## 🔧 手动调试

### 1. 手动测试搜索
```javascript
// 在 Console 中执行
const modal = document.querySelector('[role="dialog"]');
const input = modal.querySelector('input[type="text"]');
input.value = "692f974c14b5260001d74b8c";
input.dispatchEvent(new Event("input", {bubbles: true}));
```

### 2. 手动测试点击
```javascript
// 查找商品元素
const goodsElement = document.querySelector('[id="692f974c14b5260001d74b8c"]');
console.log("商品元素:", goodsElement);

// 查找卡片
const card = goodsElement.closest('[class*="good-card-container"]');
console.log("商品卡片:", card);

// 查找 simulator
const simulator = card.querySelector(".d-checkbox-simulator");
console.log("Simulator:", simulator);

// 点击
simulator.click();
```

### 3. 检查复选框状态
```javascript
const checkbox = card.querySelector('input[type="checkbox"]');
console.log("复选框状态:", checkbox.checked);
```

## 📸 预期截图参考

### 成功选中后：
- 商品卡片上的复选框有✓标记
- 底部显示 "已选择 1 项"
- "保存"按钮可点击（非禁用状态）

### 保存后：
- 商品弹窗关闭
- 页面"商品"区域显示商品卡片
- 商品卡片包含：
  - 商品图片
  - 商品名称
  - 商品价格

## 🎯 完整测试流程总结

```
1. 准备
   ├─ 重新加载插件
   ├─ 刷新页面
   └─ 打开 Console

2. 执行填充
   ├─ 点击"一键填充"
   └─ 观察日志

3. 商品选择
   ├─ 弹窗打开 ✓
   ├─ 搜索商品 ✓
   ├─ 找到商品 ✓
   ├─ 点击 simulator ✓
   ├─ 复选框选中 ✓
   └─ 点击保存 ✓

4. 验证结果
   ├─ Console 无错误
   ├─ Toast 提示正确
   └─ 页面显示商品 ✓
```

---

**如果所有步骤都通过，商品选择功能就修复成功了！** 🎉


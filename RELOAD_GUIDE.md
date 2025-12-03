# 🔄 插件重新加载完整指南

## ❌ 常见问题：修改后没生效

当你修改 `content.js` 后，如果没有看到新的日志输出，可能是：

1. ✅ **Chrome 缓存了旧版本的代码**
2. ✅ **插件没有正确重新加载**
3. ✅ **页面没有刷新**

---

## 🔧 正确的重新加载步骤（3步）

### 第 1 步：重新加载插件

1. 打开 `chrome://extensions/`
2. 找到 "小红书发布助手"
3. **关键操作**：
   ```
   方式1（推荐）：点击刷新图标 🔄
   方式2：先关闭开关，再打开
   方式3：点击"移除"，然后重新"加载已解压的扩展程序"
   ```

### 第 2 步：完全刷新页面

在小红书发布页面：
```
方式1：按 Cmd+Shift+R (Mac) 或 Ctrl+Shift+F5 (Windows) 强制刷新
方式2：打开开发者工具 (F12)，右键刷新按钮，选择"清空缓存并硬性重新加载"
```

### 第 3 步：验证代码已更新

在 Console 中查看是否有最新的日志：
```javascript
// 应该看到这些新日志：
🎯 searchAndSelectGoods 函数被调用
📦 Modal: ...
📋 商品ID列表: ...
📊 商品数量: 1
```

---

## 🐛 如果还是没有日志

### 检查 1：content.js 是否被加载

在 Console 中执行：
```javascript
typeof autoFiller
// 应该返回 "object"

autoFiller
// 应该显示 XHSAutoFiller 对象
```

### 检查 2：手动触发

在 Console 中执行：
```javascript
autoFiller.autoFill()
// 手动触发填充，观察日志
```

### 检查 3：查看错误

在 Console 中查看是否有红色错误信息

---

## 💡 最彻底的方法（如果上面都不行）

### 方法 1：完全卸载并重装

1. `chrome://extensions/`
2. 点击"移除"删除插件
3. 关闭所有小红书标签页
4. 重新打开 `chrome://extensions/`
5. 点击"加载已解压的扩展程序"
6. 选择项目文件夹
7. 打开小红书页面

### 方法 2：使用隐身窗口测试

1. 打开 Chrome 隐身窗口 (Cmd+Shift+N 或 Ctrl+Shift+N)
2. 在 `chrome://extensions/` 中启用插件在隐身模式下运行
3. 在隐身窗口中测试

---

## 📝 验证清单

执行完上述步骤后，你应该看到：

```
Console 输出：
✓ 🎉 小红书自动填充工具已就绪
✓ 🚀 开始自动填充...
✓ ✅ 数据加载完成
✓ ... (其他日志)
✓ 🎯 searchAndSelectGoods 函数被调用  ← 新增的
✓ 📦 Modal: ...                       ← 新增的
✓ 📋 商品ID列表: ...                   ← 新增的
✓ 🔍 searchInput1: ...                ← 新增的
```

---

## 🎯 快速检查命令

在 Console 中执行这些命令验证：

```javascript
// 1. 检查 content.js 是否加载
console.log('Content script:', typeof autoFiller);

// 2. 检查版本（看日志时间戳）
console.log('Current time:', new Date().toISOString());

// 3. 手动执行
autoFiller.autoFill();
```

---

## ⚠️ 注意事项

1. **每次修改 content.js 后都要重新加载插件**
2. **每次重新加载插件后都要刷新页面**
3. **使用 Cmd+Shift+R 强制刷新，不要用普通刷新**
4. **确认 Console 中没有红色错误**

---

## 🆘 还是不行？

尝试这个终极方案：

```bash
# 1. 在项目目录执行
cd /Users/meng/Desktop/workspace/redbook-tools

# 2. 检查 content.js 确实被修改了
ls -lh content.js
# 应该显示最新的修改时间

# 3. 查看文件内容确认修改
grep "searchAndSelectGoods 函数被调用" content.js
# 应该能找到这行
```

如果能找到这行，说明文件确实修改了，那就是 Chrome 缓存问题，请使用"完全卸载并重装"的方法。

---

**重点：每次修改代码后，必须执行"重新加载插件" + "强制刷新页面"！** 🔄


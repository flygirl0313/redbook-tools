# 小红书发布助手 - 代码结构说明

## 📁 项目结构

```
redbook-tools/
├── manifest.json          # Chrome 插件配置
├── content.js             # 主入口文件（400行，已模块化）
├── content.css            # 样式文件
├── popup.html             # 弹窗页面
├── popup.css              # 弹窗样式
├── popup.js               # 弹窗逻辑
├── background.js          # 后台服务
├── source/
│   ├── mock.json         # 发布内容配置
│   └── api.txt           # API 参考
├── icons/                 # 插件图标
├── README.md             # 项目说明
├── GUIDE.md              # 使用指南
└── CHANGELOG.md          # 更新日志
```

## 🎯 代码组织

### content.js - 主入口（已模块化）

**结构：**

```javascript
// 1. 工具函数 utils
// 2. 标题填充 fillTitle()
// 3. 正文填充 fillContent()
// 4. 图片上传 uploadImages() + downloadImageAsFile()
// 5. 标签添加 addTags()
// 6. 商品选择 selectGoods() + 辅助函数
// 7. 主控制器 XHSAutoFiller
// 8. 消息监听和初始化
```

**主流程（autoFill 方法）：**

```
1. 检查页面 isPublishPage()
2. 加载数据 loadMockData()
3. 等待就绪 waitForPageReady()
4. 上传图片 uploadImages() (可选)
5. 填充标题 fillTitle()
6. 填充正文 fillContent()
7. 添加标签 addTags() (可选)
8. 选择商品 selectGoods() (可选)
9. 完成提示
```

### modules/ 文件夹（仅供参考）

这些文件是各个功能模块的独立版本，**仅用于查看和理解**，不会被实际加载。

实际运行时，所有功能都在 `content.js` 中。

## 🔧 核心功能模块

### 1. 标题填充（fillTitle）

- 查找：`[class*="title-container"]` → `input.d-text`
- 方法：React 输入值设置
- 耗时：< 1 秒

### 2. 正文填充（fillContent）

- 查找：`[class*="editor-container"]` → `.tiptap.ProseMirror`
- 方法：TipTap 编辑器操作
- 耗时：< 1 秒

### 3. 图片上传（uploadImages）

- 查找：`img-upload-area` → `flex-list` → `entry`
- 方法：下载图片 + 文件上传
- 耗时：2-5 秒（取决于图片数量）

### 4. 标签添加（addTags）

- 查找：点击 `topics` → `#creator-editor-topic-container` → `.item .name`
- 方法：模拟点击话题项
- 耗时：2-4 秒（每个标签约 1 秒）

### 5. 商品选择（selectGoods）

- 查找：`multi-good-select-empty-btn` → 搜索 → `good-card-container` → `checkbox`
- 保存：`goods-selected-footer` → `button`
- 关闭：`d-modal-header` → `d-modal-close`
- 方法：搜索并点击复选框
- 耗时：2-4 秒

## 📊 代码统计

| 文件          | 行数     | 说明                 |
| ------------- | -------- | -------------------- |
| content.js    | ~400     | 主入口，包含所有功能 |
| popup.js      | ~200     | 弹窗交互逻辑         |
| background.js | ~130     | 后台服务             |
| **总计**      | **~730** | 核心代码             |

## 🚀 使用方法

1. **配置数据**：编辑 `source/mock.json`
2. **加载插件**：chrome://extensions/ → 重新加载
3. **打开页面**：小红书发布页面
4. **执行填充**：点击插件 → 一键填充
5. **检查发布**：手动点击"发布"按钮

## 🔍 调试方法

### 查看日志

```javascript
// 在 Console (F12) 中查看详细日志
// 所有步骤都有对应的 emoji 标识
```

### 手动执行

```javascript
// 在 Console 中手动执行各个模块
autoFiller.autoFill();
```

## ✅ 完成状态

所有功能已完成并测试：

- ✅ 标题填充
- ✅ 正文填充
- ✅ 图片上传
- ✅ 标签添加
- ✅ 商品选择
- ✅ 错误处理
- ✅ 用户提示

**版本：** v1.0.0
**状态：** 生产就绪 🎉

# 小红书发布助手 🚀

自动填充小红书发布内容，快速完成发布流程的 Chrome 浏览器插件。

## ✨ 功能特性

- ✅ **自动填充标题** - 一键填充笔记标题
- ✅ **自动填充正文** - 自动填充正文内容
- ✅ **自动上传图片** - 批量上传多张图片
- ✅ **智能添加标签** - 自动匹配并添加话题标签
- ✅ **快速选择商品** - 通过商品 ID 快速选择关联商品
- ✅ **友好提示** - 实时显示操作进度和结果

## 📦 安装方法

### 1. 下载代码

```bash
git clone https://github.com/yourusername/redbook-tools.git
cd redbook-tools
```

### 2. 加载插件

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角 **"开发者模式"**
4. 点击 **"加载已解压的扩展程序"**
5. 选择项目文件夹

### 3. 配置数据

编辑 `source/mock.json` 文件，配置你的发布内容：

```json
{
  "title": "你的标题（最多20字）",
  "content": "你的正文内容，可以使用表情符号😊",
  "images": ["https://图片URL1.jpg", "https://图片URL2.jpg"],
  "tags": ["标签1", "标签2", "标签3"],
  "commodityId": ["商品ID1", "商品ID2"]
}
```

## 🎯 使用步骤

1. **打开小红书发布页面**

   - 访问：https://creator.xiaohongshu.com/publish/publish?target=image

2. **点击插件图标**

   - 在浏览器右上角找到插件图标
   - 点击打开弹窗

3. **一键自动填充**

   - 点击 **"一键自动填充"** 按钮
   - 等待 10-15 秒（会显示进度提示）

4. **检查内容**

   - 确认标题、正文、图片、标签、商品都已填充

5. **手动发布**
   - 点击页面上的 **"发布"** 按钮
   - 完成发布 🎉

## 📊 执行流程

```
点击"一键填充"
    ↓
检测页面 (1秒)
    ↓
加载配置数据 (1秒)
    ↓
上传图片 (2-5秒)
    ↓
填充标题 (1秒)
    ↓
填充正文 (1秒)
    ↓
添加标签 (2-4秒)
    ↓
选择商品 (2-4秒)
    ↓
完成！🎉
```

**总耗时：约 10-15 秒**

## 📁 项目结构

```
redbook-tools/
├── manifest.json          # 插件配置文件
├── content.js             # 主入口文件（所有功能）
├── content.css            # 样式文件
├── popup.html             # 弹窗页面
├── popup.js               # 弹窗逻辑
├── background.js          # 后台服务
├── source/
│   ├── mock.json         # 发布内容配置 ⭐
│   └── api.txt           # API 参考
├── icons/                 # 插件图标
└── README.md             # 项目说明
```

> **注意**：所有功能都集中在 `content.js` 一个文件中，代码已模块化组织，易于阅读和维护。

## 🔧 配置说明

### mock.json 配置项

| 字段          | 类型   | 必填 | 说明                          |
| ------------- | ------ | ---- | ----------------------------- |
| `title`       | String | 是   | 笔记标题（最多 20 字）        |
| `content`     | String | 是   | 正文内容                      |
| `images`      | Array  | 否   | 图片 URL 列表（最多 18 张）   |
| `tags`        | Array  | 否   | 话题标签列表（不需要加 # 号） |
| `commodityId` | Array  | 否   | 商品 ID 列表                  |

### 示例配置

```json
{
  "title": "像是打翻了上帝的调色盘，这也太梦幻了吧！",
  "content": "救命！这组油画感纹理真的美到失语😭\n每一张都像是流动的极光，又像是融化的冰淇淋🍦",
  "images": [
    "https://picsum.photos/800/1200?random=1",
    "https://picsum.photos/800/1200?random=2",
    "https://picsum.photos/800/1200?random=3"
  ],
  "tags": ["油画感纹理", "高级感", "粉紫与海盐蓝的碰撞"],
  "commodityId": ["692f974c14b5260001d74b8c"]
}
```

## 🐛 常见问题

### Q: 点击按钮后没有反应？

**A:**

1. 确认是否在小红书发布页面
2. 打开 Console (F12) 查看日志
3. 刷新页面后重试

### Q: 图片上传失败？

**A:**

1. 确认图片 URL 可以访问
2. 确认图片格式（支持 jpg/png/gif/webp）
3. 图片太大可能需要更长时间

### Q: 标签没有添加上？

**A:**

1. 标签名需要在小红书话题库中存在
2. 确认标签名拼写正确
3. 手动补充未匹配的标签

### Q: 商品选择失败？

**A:**

1. 确认商品 ID 正确
2. 确认商品在你的商品库中
3. 手动选择商品

### Q: 如何调试？

**A:**

```javascript
// 在 Console (F12) 中手动执行
autoFiller.autoFill();
```

## 📝 开发说明

### 核心技术

- Chrome Extension Manifest V3
- TipTap 富文本编辑器交互
- React 表单状态管理
- 文件上传和 DataTransfer API

### 代码结构

所有核心功能都在 `content.js` 中，按模块组织：

1. 工具函数（utils）
2. 标题填充（fillTitle）
3. 正文填充（fillContent）
4. 图片上传（uploadImages）
5. 标签添加（addTags）
6. 商品选择（selectGoods）
7. 主控制器（XHSAutoFiller）

详见 [CODE_STRUCTURE.md](./CODE_STRUCTURE.md)

## 📄 更多文档

- [CODE_STRUCTURE.md](./CODE_STRUCTURE.md) - 代码结构说明
- [GUIDE.md](./GUIDE.md) - 使用指南
- [CHANGELOG.md](./CHANGELOG.md) - 更新日志

## ⚠️ 注意事项

1. **不破解接口签名** - 本插件通过模拟用户操作实现自动填充，不直接调用小红书 API
2. **需要手动发布** - 填充完成后需要手动点击"发布"按钮
3. **仅供学习** - 请遵守小红书平台规则，不要滥用
4. **图片来源** - 确保你有权使用上传的图片

## 📜 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**版本：** v1.0.0
**状态：** ✅ 生产就绪
**最后更新：** 2024-12-03

// 简单的开发环境热重载服务器
// 运行方式：npm run dev
//
// 思路：
// - 监听整个项目目录下的文件变动（排除 node_modules/.git 等）
// - 一旦有变动，就更新一个 version 值
// - 提供一个 HTTP 接口：GET http://localhost:35729/__redbook_tools_version
// - background/content 轮询这个接口，发现 version 变化就触发扩展 + 页面刷新

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const PORT = 35729;

let version = Date.now();

// 简单过滤：不关心的目录 / 文件
function shouldIgnore(filePath) {
  const rel = path.relative(ROOT_DIR, filePath);
  if (!rel || rel.startsWith("node_modules")) return true;
  if (rel.startsWith(".git")) return true;
  if (rel.startsWith("dev")) return true;

  // 只关心常见前端文件类型
  const exts = [".js", ".json", ".html", ".css"];
  return !exts.includes(path.extname(rel));
}

// 递归监听目录
function watchDir(dir) {
  fs.readdir(dir, { withFileTypes: true }, (err, entries) => {
    if (err) return;
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (shouldIgnore(fullPath)) continue;

      if (entry.isDirectory()) {
        watchDir(fullPath);
      }
    }
  });

  fs.watch(
    dir,
    {
      persistent: true,
    },
    (eventType, filename) => {
      if (!filename) return;
      const fullPath = path.join(dir, filename.toString());
      if (shouldIgnore(fullPath)) return;

      version = Date.now();
      console.log(
        `[hot-reload] 文件变更: ${path.relative(ROOT_DIR, fullPath)} => version ${version}`
      );
    }
  );
}

watchDir(ROOT_DIR);

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith("/__redbook_tools_version")) {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(JSON.stringify({ version }));
    return;
  }

  res.statusCode = 404;
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`[hot-reload] 开发热重载服务器已启动: http://localhost:${PORT}`);
  console.log("[hot-reload] 修改 js/json/html/css 文件会自动触发扩展刷新");
});



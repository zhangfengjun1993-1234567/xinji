# 心记 · 每日日记

> 记录日常，发掘优势，获得人生教练分析。你的私人日记本。

一个纯前端的每日日记应用，支持引导写作、语音录入、每周优势分析和双周教练报告。

**每个用户的数据存储在各自设备的 localStorage 中，互不干扰。**

---

## 功能

- **自由写作**：随时记录想法和感受
- **引导写作**：不知道写什么时，通过 8 个递进式问题引导回顾一天
- **语音输入**：用语音代替打字（Chrome 效果最佳；微信内置浏览器暂不支持）
- **情绪 & 天气记录**：用表情标记每日心情
- **每周优势库**：自动分析日记内容，提炼优势特质和潜在优势
- **双周教练报告**：行为模式分析、卡点深挖、可落地的行动计划
- **数据备份**：导出/导入完整日记数据
- **离线可用**：Service Worker 缓存，无网络也能打开
- **分享到微信**：打开即用，分享链接给朋友即可

---

## 部署方式（选一种）

### 方式一：GitHub Pages（推荐，免费 HTTPS）

**前置条件**：需要一个 GitHub 账号

1. 在浏览器中打开 [github.com/new](https://github.com/new)，创建一个新仓库（比如叫 `xinji`，设为 Public）

2. 将本地代码推送到 GitHub：

```bash
cd /Users/zhangfengjun/Documents/Codex/2026-07-02/ban/diary-app

# 将 <你的用户名> 替换为你的 GitHub 用户名
git remote add origin https://github.com/<你的用户名>/xinji.git
git branch -M main
git push -u origin main
```

3. 启用 GitHub Pages：
   - 打开仓库页面 → Settings → Pages
   - "Source" 选 "Deploy from a branch"
   - "Branch" 选 `main`，目录选 `/ (root)`
   - 点 "Save"
   - 等 1-2 分钟后，你的应用就会出现在 `https://<你的用户名>.github.io/xinji/`

4. 复制这个链接，发送到微信就可以直接打开了。

### 方式二：Vercel（免费 HTTPS，自动部署）

1. 将代码推送到 GitHub（同上）
2. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录
3. 点击 "Add New → Project"，导入 `xinji` 仓库
4. Framework Preset 选 "Other"，点 "Deploy"
5. 几秒后就能拿到 `https://xinji.vercel.app` 的链接

### 方式三：本地预览

```bash
cd /Users/zhangfengjun/Documents/Codex/2026-07-02/ban/diary-app
python3 -m http.server 8080
```

浏览器打开 `http://localhost:8080`

---

## 在微信中使用

- 部署到 HTTPS 链接后，把链接发送到微信（文件传输助手或群聊）
- 点击链接即可在微信内置浏览器中打开
- 分享给朋友，对方打开后拥有自己的独立日记本（数据保存在自己手机上）
- 微信内置浏览器不支持语音输入，应用会自动降级提示

---

## 数据隐私

- 所有数据存储在浏览器的 `localStorage` 中
- 不上传任何服务器
- 建议定期使用「备份数据」功能导出 JSON 文件保存到电脑

---

## 技术栈

- HTML / CSS / JavaScript（原生，零依赖）
- Web Speech API（语音输入）
- localStorage（数据持久化）
- Service Worker（离线缓存）
- GitHub Pages / Vercel（托管部署）

---

## 文件结构

```
diary-app/
├── index.html        # 主页面
├── style.css         # 样式
├── app.js            # 全部逻辑（存储、语音、引导、分析、UI）
├── manifest.json     # PWA 配置
├── sw.js             # Service Worker
├── og-image.png      # 微信分享封面图
└── README.md         # 本文件
```

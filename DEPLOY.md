# 🚀 部署指南 - 个人日记 Web 应用

## 快速开始

### 第一步：本地测试
1. 打开 `diary-app` 文件夹
2. 双击 `index.html` 文件
3. 在浏览器中打开，就可以开始写日记了！
4. 数据保存在浏览器本地（LocalStorage）

### 第二步：配置云端同步（可选）
如果你想让日记在手机和电脑之间同步，需要配置 Supabase 云端存储：

#### 1. 创建 Supabase 项目（免费）
1. 访问 https://supabase.com
2. 点击 "Start your project" 注册账号
3. 创建一个新的项目（选 Free 计划即可）
4. 等待项目创建完成（约 1-2 分钟）

#### 2. 创建数据库表
在项目中找到 SQL Editor，粘贴以下代码并执行：

```sql
-- 创建日记表
CREATE TABLE diaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  content TEXT,
  mood TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 允许任何人读取自己的数据（需要认证时才用）
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;

-- 创建策略：任何人都可以插入、更新、删除自己的数据
CREATE POLICY "Anyone can insert" ON diaries
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update" ON diaries
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete" ON diaries
  FOR DELETE
  USING (true);

CREATE POLICY "Anyone can select" ON diaries
  FOR SELECT
  USING (true);
```

#### 3. 获取配置信息
1. 进入项目 Settings → API
2. 复制 **Project URL**
3. 复制 **anon public** 密钥

#### 4. 更新代码
打开 `app.js` 文件，找到这两行：

```javascript
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
```

替换为你刚才复制的信息：

```javascript
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";
```

#### 5. 重新测试
刷新浏览器，你会看到左上角显示 "☁️ 已启用云端存储"

---

## 部署到互联网（让别人也能访问）

### 方案一：GitHub Pages（推荐，完全免费）

#### 1. 创建 GitHub 仓库
1. 访问 https://github.com/new
2. 创建一个新的公开仓库（比如叫 `my-diary`）
3. 不要初始化 README 或其他文件

#### 2. 上传代码
```bash
# 在 diary-app 文件夹所在的目录执行
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/my-diary.git
git push -u origin main
```

#### 3. 启用 GitHub Pages
1. 进入仓库 Settings → Pages
2. Source 选择 "Deploy from a branch"
3. Branch 选择 main，文件夹选择 / (root)
4. 点击 Save

#### 4. 访问你的日记应用
几分钟后，你就可以通过以下地址访问了：
```
https://你的用户名.github.io/my-diary/
```

把这个网址发送到手机上，就能随时随地写日记了！

---

### 方案二：Vercel 部署（也免费，更快）

#### 1. 准备代码
先把代码上传到 GitHub（参考上面的步骤 1-2）

#### 2. 部署到 Vercel
1. 访问 https://vercel.com
2. 用 GitHub 账号登录
3. 点击 "New Project"
4. 导入你的 diary 仓库
5. 点击 "Deploy"

#### 3. 访问应用
部署完成后，Vercel 会给你一个网址，类似：
```
https://my-diary.vercel.app
```

---

## 在手机上使用

### 方法一：直接访问网页
1. 在手机上打开你的网址
2.  Safari（iOS）或 Chrome（Android）
3.  点击"分享"按钮
4.  选择"添加到主屏幕"
5.  这样就相当于一个 App 了！

### 方法二：PWA 安装（高级）
如果需要更完整的 PWA 功能，可以添加：
- `manifest.json` - 应用配置
- `service-worker.js` - 离线缓存
- 图标文件（192x192, 512x512）

---

## 常见问题

### Q: 数据安全吗？
A: 
- 本地存储：数据只在你的浏览器里
- 云端存储：数据存在 Supabase（大厂托管，安全可靠）
- 建议：重要日记可以定期导出备份

### Q: 可以导出数据吗？
A: 可以！在浏览器控制台运行：
```javascript
JSON.stringify(localStorage.getItem("diary_entries"), null, 2)
```
然后复制到文件中保存

### Q: 换浏览器数据会丢吗？
A: 
- 本地存储：会！每个浏览器独立
- 云端存储：不会！登录同一账号即可同步

### Q: 可以加密码保护吗？
A: 可以！Supabase 支持用户认证，可以加登录功能

---

## 下一步功能建议

- [ ] 用户登录/注册
- [ ] 图片附件支持
- [ ] 标签分类系统
- [ ] 数据统计面板
- [ ] 主题切换（深色模式）
- [ ] 语音输入日记
- [ ] 日记分享功能

---

## 技术支持

遇到问题？检查浏览器控制台（F12 → Console）的错误信息。

祝你写作愉快！📝

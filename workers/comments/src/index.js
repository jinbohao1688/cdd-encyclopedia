/**
 * CDD Encyclopedia 评论系统
 * Cloudflare Worker + D1 数据库
 * 功能：评论 CRUD、点赞、管理后台（审核/删除/统计）
 */

// --- 管理密码（简单防护，修改后重新部署即可）---
const ADMIN_PASSWORD = 'cdd-canon-2026';

// CORS 配置
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function html(content) {
  return new Response(content, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// --- 管理后台 HTML 页面 ---
const ADMIN_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CDD 评论管理</title>
<style>
  :root {
    --bg: #fbfaf6; --card: #fff; --border: #e0d8c0; --text: #1a1a1a;
    --text-2: #6b6b6b; --accent: #4a6d8c; --danger: #c5454b; --ok: #5a8a5a;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, "Noto Serif SC", Georgia, serif;
    background: var(--bg); color: var(--text); line-height: 1.7;
  }
  .header {
    border-bottom: 1px solid var(--border); padding: 24px 32px;
  }
  .header h1 { font-size: 1.25rem; font-weight: 600; letter-spacing: 0.03em; }
  .header .sub { font-size: 0.8rem; color: var(--text-2); margin-top: 4px; }
  .login {
    max-width: 360px; margin: 80px auto; padding: 32px;
    background: var(--card); border: 1px solid var(--border); border-radius: 4px;
  }
  .login input {
    width: 100%; padding: 10px 12px; margin-bottom: 16px;
    border: 1px solid var(--border); border-radius: 2px; font-size: 0.9rem;
    background: var(--bg);
  }
  .login button {
    width: 100%; padding: 10px; background: var(--text); color: var(--bg);
    border: none; border-radius: 2px; font-size: 0.9rem; cursor: pointer;
  }
  .login button:hover { opacity: 0.85; }
  .dashboard { display: none; }
  .stats {
    display: flex; gap: 24px; padding: 20px 32px; border-bottom: 1px solid var(--border);
  }
  .stat {
    background: var(--card); border: 1px solid var(--border); border-radius: 4px;
    padding: 16px 24px; min-width: 120px;
  }
  .stat .num { font-size: 1.75rem; font-weight: 600; }
  .stat .label { font-size: 0.75rem; color: var(--text-2); margin-top: 2px; }
  .controls {
    display: flex; gap: 12px; align-items: center; padding: 16px 32px;
    border-bottom: 1px solid var(--border); flex-wrap: wrap;
  }
  .controls select, .controls input {
    padding: 6px 10px; border: 1px solid var(--border); border-radius: 2px;
    font-size: 0.85rem; background: var(--bg);
  }
  .controls button {
    padding: 6px 16px; border: 1px solid var(--border); border-radius: 2px;
    font-size: 0.85rem; cursor: pointer; background: var(--card);
  }
  .controls button:hover { background: var(--border); }
  .controls .pw { flex: 1; max-width: 200px; font-size: 0.8rem; }
  .list { padding: 0 32px 40px; }
  .comment {
    border-left: 2px solid var(--border); padding: 12px 16px; margin: 8px 0;
    background: var(--card); border-radius: 0 4px 4px 0;
  }
  .comment .meta {
    display: flex; gap: 12px; align-items: baseline; margin-bottom: 6px;
    flex-wrap: wrap;
  }
  .comment .author { font-weight: 600; font-size: 0.9rem; }
  .comment .time { font-size: 0.75rem; color: var(--text-2); }
  .comment .path { font-size: 0.75rem; color: var(--accent); text-decoration: underline; }
  .comment .body { font-size: 0.85rem; color: #3a3a3a; white-space: pre-wrap; }
  .comment .actions { margin-top: 8px; display: flex; gap: 12px; }
  .comment .actions button {
    border: none; background: none; font-size: 0.75rem; cursor: pointer;
    color: var(--text-2);
  }
  .comment .actions .del { color: var(--danger); }
  .comment .actions .approve { color: var(--ok); }
  .badge {
    display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 0.7rem;
  }
  .badge.pending { background: #fff3cd; color: #856404; }
  .badge.approved { background: #d4edda; color: #155724; }
  .badge.deleted { background: #f8d7da; color: #721c24; }
  .empty { text-align: center; padding: 40px; color: var(--text-2); font-style: italic; }
</style>
</head>
<body>
<div class="header">
  <h1>CDD Encyclopedia · 评论管理后台</h1>
  <div class="sub">comments.ccdworld.site</div>
</div>

<!-- 登录 -->
<div class="login" id="loginBox">
  <input type="password" id="pwInput" placeholder="管理密码" autofocus>
  <button onclick="login()">登录</button>
</div>

<!-- 仪表盘 -->
<div class="dashboard" id="dashboard">
  <div class="stats" id="stats"></div>
  <div class="controls">
    <select id="filter" onchange="loadComments()">
      <option value="all">全部</option>
      <option value="approved">已通过</option>
      <option value="pending">待审核</option>
      <option value="deleted">已删除</option>
    </select>
    <input type="text" id="search" placeholder="搜索作者/内容/路径…" oninput="loadComments()">
    <button onclick="loadComments()">刷新</button>
    <input type="password" class="pw" id="pwCache" placeholder="密码（操作时需要）">
  </div>
  <div class="list" id="list"></div>
</div>

<script>
let password = '';

function login() {
  password = document.getElementById('pwInput').value;
  document.getElementById('pwCache').value = password;
  loadStats();
  loadComments();
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
}

async function loadStats() {
  const res = await fetch('/admin/api/stats', { headers: { 'X-Admin-Password': password } });
  if (res.status === 403) { location.reload(); return; }
  const data = await res.json();
  document.getElementById('stats').innerHTML = [
    { num: data.total, label: '全部评论' },
    { num: data.approved, label: '已通过' },
    { num: data.pending, label: '待审核' },
    { num: data.deleted, label: '已删除' },
    { num: data.pages, label: '有评论的页面' },
  ].map(s => '<div class="stat"><div class="num">'+s.num+'</div><div class="label">'+s.label+'</div></div>').join('');
}

async function loadComments() {
  const filter = document.getElementById('filter').value;
  const search = document.getElementById('search').value;
  let url = '/admin/api/comments?status=' + filter;
  if (search) url += '&q=' + encodeURIComponent(search);
  const res = await fetch(url, { headers: { 'X-Admin-Password': password } });
  if (res.status === 403) { location.reload(); return; }
  const data = await res.json();
  const list = data.comments || [];
  if (list.length === 0) {
    document.getElementById('list').innerHTML = '<div class="empty">暂无评论</div>';
    return;
  }
  document.getElementById('list').innerHTML = list.map(function(c) {
    return '<div class="comment">'
      + '<div class="meta">'
      + '<span class="author">' + esc(c.author) + '</span>'
      + '<span class="badge ' + c.status + '">' + c.status + '</span>'
      + '<span class="time">' + c.created_at + '</span>'
      + '<span class="path" onclick="copyPath(\\''+c.path+'\\')">' + c.path + '</span>'
      + '<span style="font-size:0.75rem;color:var(--text-2)">♡ ' + c.likes + '</span>'
      + '</div>'
      + '<div class="body">' + esc(c.content) + '</div>'
      + '<div class="actions">'
      + (c.status !== 'approved' ? '<button class="approve" onclick="act(\\'approve\\','+c.id+')">通过</button>' : '')
      + (c.status !== 'deleted' ? '<button class="del" onclick="act(\\'delete\\','+c.id+')">删除</button>' : '')
      + '</div></div>';
  }).join('');
}

async function act(action, id) {
  const pw = document.getElementById('pwCache').value;
  const res = await fetch('/admin/api/comments/' + id, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Password': pw },
    body: JSON.stringify({ action }),
  });
  if (res.ok) { loadStats(); loadComments(); }
  else { alert('操作失败: ' + await res.text()); }
}

function copyPath(path) { navigator.clipboard.writeText(path); }
function esc(s) {
  const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
}
</script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS 预检
    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // --- 管理后台页面 ---
    if (method === 'GET' && path === '/admin') {
      return html(ADMIN_HTML);
    }

    // --- 管理 API：统计 ---
    if (method === 'GET' && path === '/admin/api/stats') {
      if (!checkAdmin(request)) return json({ error: 'Forbidden' }, 403);
      const stats = await env.DB.prepare(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status='deleted' THEN 1 ELSE 0 END) as deleted,
          COUNT(DISTINCT path) as pages
         FROM comments`
      ).first();
      return json(stats);
    }

    // --- 管理 API：评论列表 ---
    if (method === 'GET' && path === '/admin/api/comments') {
      if (!checkAdmin(request)) return json({ error: 'Forbidden' }, 403);
      const status = url.searchParams.get('status') || 'all';
      const q = url.searchParams.get('q') || '';
      let sql = `SELECT id, path, author, email, content, parent_id, created_at, likes, status FROM comments`;
      const conditions = [];
      const binds = [];
      if (status !== 'all') { conditions.push('status = ?'); binds.push(status); }
      if (q) {
        conditions.push('(author LIKE ? OR content LIKE ? OR path LIKE ?)');
        binds.push('%' + q + '%', '%' + q + '%', '%' + q + '%');
      }
      if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
      sql += ' ORDER BY created_at DESC LIMIT 200';
      const results = await env.DB.prepare(sql).bind(...binds).all();
      return json({ comments: results.results });
    }

    // --- 管理 API：审核/删除/恢复 ---
    const adminActionMatch = path.match(/^\/admin\/api\/comments\/(\d+)$/);
    if (method === 'POST' && adminActionMatch) {
      if (!checkAdmin(request)) return json({ error: 'Forbidden' }, 403);
      const id = adminActionMatch[1];
      const body = await request.json();
      const action = body.action; // 'approve' | 'delete' | 'restore'
      const statusMap = { approve: 'approved', delete: 'deleted', restore: 'approved' };
      const newStatus = statusMap[action];
      if (!newStatus) return json({ error: 'Invalid action' }, 400);
      await env.DB.prepare(
        `UPDATE comments SET status = ? WHERE id = ?`
      ).bind(newStatus, id).run();
      return json({ success: true, status: newStatus });
    }

    // --- 公开 API：获取评论 ---
    if (method === 'GET' && path === '/api/comments') {
      const pagePath = url.searchParams.get('path');
      if (!pagePath) return json({ error: 'Missing path parameter' }, 400);
      const results = await env.DB.prepare(
        `SELECT id, path, author, email, content, parent_id, created_at, likes
         FROM comments
         WHERE path = ? AND status = 'approved'
         ORDER BY created_at ASC`
      ).bind(pagePath).all();
      return json({ comments: results.results });
    }

    // --- 公开 API：发表评论 ---
    if (method === 'POST' && path === '/api/comments') {
      const body = await request.json();
      const { path: pagePath, author, email, content, parent_id } = body;
      if (!pagePath || !author || !content) {
        return json({ error: 'path, author, content are required' }, 400);
      }
      if (author.length > 50 || content.length > 5000) {
        return json({ error: 'Content too long' }, 400);
      }
      const result = await env.DB.prepare(
        `INSERT INTO comments (path, author, email, content, parent_id)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        pagePath,
        author.trim(),
        (email || '').trim(),
        content.trim(),
        parent_id || null
      ).run();
      return json({ id: result.meta.last_row_id, success: true });
    }

    // --- 公开 API：点赞 ---
    const likeMatch = path.match(/^\/api\/comments\/(\d+)\/like$/);
    if (method === 'POST' && likeMatch) {
      const id = likeMatch[1];
      await env.DB.prepare(
        `UPDATE comments SET likes = likes + 1 WHERE id = ? AND status = 'approved'`
      ).bind(id).run();
      return json({ success: true });
    }

    // --- 健康检查 ---
    if (method === 'GET' && path === '/') {
      return json({ status: 'ok', service: 'cdd-comments', admin: '/admin' });
    }

    return json({ error: 'Not found' }, 404);
  },
};

// 简单密码验证
function checkAdmin(request) {
  const pw = request.headers.get('X-Admin-Password');
  return pw === ADMIN_PASSWORD;
}

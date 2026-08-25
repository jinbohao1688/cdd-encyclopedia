/**
 * CDD Encyclopedia 评论 API
 * Cloudflare Worker + D1 数据库
 * 支持：获取评论、发表评论、点赞、删除（管理）
 */

// CORS 配置：允许百科网站访问
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// JSON 响应工具
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// 路由匹配
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS 预检
    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // GET /api/comments?path=/wiki/char-001 → 获取某页面的评论
    if (method === 'GET' && path === '/api/comments') {
      const pagePath = url.searchParams.get('path');
      if (!pagePath) {
        return json({ error: 'Missing path parameter' }, 400);
      }
      const results = await env.DB.prepare(
        `SELECT id, path, author, email, content, parent_id, created_at, likes
         FROM comments
         WHERE path = ? AND status = 'approved'
         ORDER BY created_at ASC`
      ).bind(pagePath).all();
      return json({ comments: results.results });
    }

    // POST /api/comments → 发表新评论
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

    // POST /api/comments/:id/like → 点赞
    const likeMatch = path.match(/^\/api\/comments\/(\d+)\/like$/);
    if (method === 'POST' && likeMatch) {
      const id = likeMatch[1];
      await env.DB.prepare(
        `UPDATE comments SET likes = likes + 1 WHERE id = ?`
      ).bind(id).run();
      return json({ success: true });
    }

    // DELETE /api/comments/:id → 删除评论（简单管理）
    const deleteMatch = path.match(/^\/api\/comments\/(\d+)$/);
    if (method === 'DELETE' && deleteMatch) {
      const id = deleteMatch[1];
      await env.DB.prepare(
        `UPDATE comments SET status = 'deleted' WHERE id = ?`
      ).bind(id).run();
      return json({ success: true });
    }

    // 健康检查
    if (method === 'GET' && path === '/') {
      return json({ status: 'ok', service: 'cdd-comments' });
    }

    return json({ error: 'Not found' }, 404);
  },
};

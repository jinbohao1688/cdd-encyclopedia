// CDD Encyclopedia — 评论系统客户端组件
// 博物馆美学风格：象牙白背景、深灰文字、极简边框
// 功能：发表评论、嵌套回复、点赞

"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = "https://cdd-comments.15378707620.workers.dev";

interface Comment {
  id: number;
  path: string;
  author: string;
  email: string;
  content: string;
  parent_id: number | null;
  created_at: string;
  likes: number;
}

// 相对时间格式化
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const past = new Date(dateStr + "Z").getTime();
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`;
  return new Date(dateStr + "Z").toLocaleDateString("zh-CN");
}

// 单条评论卡片
function CommentCard({
  comment,
  onReply,
  onLike,
}: {
  comment: Comment;
  onReply: (id: number) => void;
  onLike: (id: number) => void;
}) {
  return (
    <div className="border-l-2 border-ivory-200 pl-4 py-3">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-medium text-ink-800 text-sm">{comment.author}</span>
        <span className="text-xs text-ink-400">{timeAgo(comment.created_at)}</span>
      </div>
      <div className="text-sm text-ink-700 whitespace-pre-wrap leading-relaxed">
        {comment.content}
      </div>
      <div className="flex items-center gap-4 mt-2">
        <button
          onClick={() => onLike(comment.id)}
          className="text-xs text-ink-500 hover:text-slateblue-600 transition-colors"
        >
          ♡ {comment.likes > 0 ? comment.likes : ""}
        </button>
        <button
          onClick={() => onReply(comment.id)}
          className="text-xs text-ink-500 hover:text-slateblue-600 transition-colors"
        >
          回复
        </button>
      </div>
    </div>
  );
}

// 评论表单
function CommentForm({
  onSubmit,
  replyTo,
  onCancelReply,
}: {
  onSubmit: (author: string, email: string, content: string) => Promise<void>;
  replyTo: number | null;
  onCancelReply: () => void;
}) {
  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(author, email, content);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {replyTo && (
        <div className="flex items-center justify-between bg-ivory-100 px-3 py-1.5 rounded text-xs text-ink-500">
          <span>正在回复评论 #{replyTo}</span>
          <button type="button" onClick={onCancelReply} className="text-ink-400 hover:text-ink-600">
            取消
          </button>
        </div>
      )}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="昵称 *"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={50}
          required
          className="w-32 px-3 py-2 text-sm bg-transparent border border-ivory-300 rounded text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-slateblue-400"
        />
        <input
          type="email"
          placeholder="邮箱（可选，不公开）"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-3 py-2 text-sm bg-transparent border border-ivory-300 rounded text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-slateblue-400"
        />
      </div>
      <textarea
        placeholder="写下你的想法…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={5000}
        required
        rows={3}
        className="w-full px-3 py-2 text-sm bg-transparent border border-ivory-300 rounded text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-slateblue-400 resize-none"
      />
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-1.5 text-sm bg-ink-900 text-ivory-50 rounded hover:bg-ink-700 transition-colors disabled:opacity-50"
      >
        {submitting ? "发送中…" : "发表评论"}
      </button>
    </form>
  );
}

// 主组件
export function CommentSection({ path }: { path: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<number | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/comments?path=${encodeURIComponent(path)}`
      );
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      // 静默失败，不显示错误
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (author: string, email: string, content: string) => {
    await fetch(`${API_BASE}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        author,
        email,
        content,
        parent_id: replyTo,
      }),
    });
    setReplyTo(null);
    await fetchComments();
  };

  const handleLike = async (id: number) => {
    await fetch(`${API_BASE}/api/comments/${id}/like`, { method: "POST" });
    await fetchComments();
  };

  // 构建评论树
  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = (parentId: number) =>
    comments.filter((c) => c.parent_id === parentId);

  const count = comments.length;

  return (
    <section className="mt-16 pt-8 border-t border-ivory-200">
      <h2 className="text-lg font-serif text-ink-900 mb-6">
        讨论 <span className="text-sm text-ink-400 font-sans">({count})</span>
      </h2>

      {/* 评论表单 */}
      <div className="mb-8">
        <CommentForm
          onSubmit={handleSubmit}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>

      {/* 评论列表 */}
      {loading ? (
        <p className="text-sm text-ink-400">加载中…</p>
      ) : count === 0 ? (
        <p className="text-sm text-ink-400 italic">
          暂无评论。成为第一个在此页面留下观点的人。
        </p>
      ) : (
        <div className="space-y-4">
          {topLevel.map((comment) => (
            <div key={comment.id}>
              <CommentCard
                comment={comment}
                onReply={setReplyTo}
                onLike={handleLike}
              />
              {/* 嵌套回复 */}
              {replies(comment.id).map((reply) => (
                <div key={reply.id} className="ml-6 mt-2">
                  <CommentCard
                    comment={reply}
                    onReply={setReplyTo}
                    onLike={handleLike}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

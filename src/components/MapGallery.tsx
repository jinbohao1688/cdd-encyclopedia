// CDD Encyclopedia — World maps gallery component
// 展示 3 张行星 P3 世界地图的轻量画廊组件
// 支持主页大画廊 / 条目页小画廊两种尺寸模式

"use client";

import { useState } from "react";
import { WORLD_MAPS, type WorldMap } from "@/lib/world-maps";

// 大图切换模式（用于主页 Hero / 世界分类页顶部）
export function MapHero() {
  const [active, setActive] = useState(0);
  const map = WORLD_MAPS[active];
  return (
    <div className="w-full border-b border-ink-200">
      {/* 地图主图区 */}
      <div className="relative w-full aspect-[16/9] max-h-[60vh] overflow-hidden bg-ivory-100">
        <img
          key={map.src}
          src={map.src}
          alt={map.title}
          className="absolute inset-0 w-full h-full object-contain"
          loading="eager"
        />
        {/* 右下标题遮罩 */}
        <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent p-5 sm:p-8 text-white">
          <div className="text-xs uppercase tracking-[0.2em] opacity-80 mb-1">
            Planet P3 · Atlas Maps
          </div>
          <div className="font-serif text-xl sm:text-3xl font-semibold">{map.title}</div>
          <div className="text-sm sm:text-base opacity-90 mt-1 max-w-2xl">
            {map.description}
          </div>
        </div>
      </div>

      {/* 缩略图切换条 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap gap-3 items-center">
        {WORLD_MAPS.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setActive(i)}
            className={
              "group flex items-center gap-3 p-2 border rounded transition-all text-left " +
              (active === i
                ? "border-ink-700 bg-ivory-100 shadow-sm"
                : "border-ivory-300 hover:border-ink-400 bg-white")
            }
          >
            <img
              src={m.src}
              alt=""
              className="w-16 h-12 object-cover rounded-sm"
              loading="lazy"
            />
            <div className="w-36 sm:w-48">
              <div
                className={
                  "text-xs font-semibold leading-tight " +
                  (active === i ? "text-ink-900" : "text-ink-700")
                }
              >
                {m.title}
              </div>
              <div className="text-[10px] text-ink-500 mt-0.5 line-clamp-2">
                {m.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// 小型地图画廊（3 张并排缩略图+点击放大预览，用于世界页/条目页内容区）
export function MapGallery() {
  const [preview, setPreview] = useState<number | null>(null);
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {WORLD_MAPS.map((m, i) => (
          <figure
            key={m.id}
            className="border border-ink-200 bg-ivory-50 rounded overflow-hidden cursor-zoom-in hover:shadow-sm transition-shadow"
            onClick={() => setPreview(i)}
          >
            <div className="aspect-[4/3] overflow-hidden bg-white">
              <img
                src={m.src}
                alt={m.title}
                className="w-full h-full object-cover hover:scale-[1.02] transition-transform"
                loading="lazy"
              />
            </div>
            <figcaption className="p-2.5">
              <div className="text-xs font-semibold text-ink-900">{m.title}</div>
              <div className="text-[11px] text-ink-500 mt-0.5 line-clamp-2">
                {m.description}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* 灯箱预览 */}
      {preview !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 p-4 sm:p-8 flex items-center justify-center cursor-zoom-out"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-w-[94vw] max-h-[92vh] bg-white rounded overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 text-white text-lg leading-none hover:bg-black/80"
              aria-label="关闭预览"
            >
              ×
            </button>
            <img
              src={WORLD_MAPS[preview].src}
              alt={WORLD_MAPS[preview].title}
              className="max-w-[92vw] max-h-[86vh] object-contain"
            />
            <div className="px-5 py-3 border-t border-ivory-200 bg-ivory-50">
              <div className="font-serif font-semibold text-sm text-ink-900">
                {WORLD_MAPS[preview].title}
              </div>
              <div className="text-xs text-ink-500 mt-0.5">
                {WORLD_MAPS[preview].description}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 为外部导出类型
export type { WorldMap };

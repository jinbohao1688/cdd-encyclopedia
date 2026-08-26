// CDD Encyclopedia — Planet P3 世界地图元数据
// 纯数据文件：既被 Server Component 用，也被 Client Component（MapGallery）用

export type WorldMap = {
  id: string;
  title: string;
  description: string;
  src: string;
};

export const WORLD_MAPS: WorldMap[] = [
  {
    id: "natural-geography",
    title: "P3 世界自然地理母图",
    description: "展示山脉、高原、平原、五大洋、岛链弧等基础地理结构",
    src: "/photos/p3-natural-geography-map.png",
  },
  {
    id: "tectonic-climate",
    title: "P3 地质构造与气候图",
    description: "板块边界、地热活跃区（凝度场异常高）与大气/洋流气候分区",
    src: "/photos/p3-tectonic-climate-map.png",
  },
  {
    id: "civilizations-regions",
    title: "文明分布与文化区（MAP-003）",
    description: "五大文明（双河/维罗/中央海/诺弧/黑潮）控制区域与文化圈划分",
    src: "/photos/p3-civilizations-regions-map.png",
  },
];

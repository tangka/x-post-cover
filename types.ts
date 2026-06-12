// post.json 契约:x-collect 产出,x-cover / x-video-subtitle / 主 Agent 消费。
// 所有相对路径都相对于推文件夹 素材库/<date>_<handle>_<id>/。

export interface MediaItem {
  type: "photo" | "video" | "animated_gif";
  file: string;          // 相对文件夹路径,如 media/1.jpg、media/video.mp4
  source_url?: string;   // 图片原始 URL(视频走 yt-dlp,无此字段)
}

export interface QuotedPost {
  author: string;        // @handle
  text_en: string[];
}

export interface PostData {
  tweet_id: string;      // URL 里的状态 id(文件夹后缀,跨 skill 复用的 key)
  url: string;
  created_at: string;
  author: { name: string; handle: string; avatar: string };
  text_en: string[];     // 原文段落(已去 t.co;长推取 note_tweet 全文;转推取原推全文)
  text_zh: string[];     // 译文,逐段与 text_en 对齐
  metrics: { views: number; reply: number; retweet: number; like: number };
  is_retweet: boolean;   // 是否原生转推(内容已解包成原推)
  quoted: QuotedPost | null;
  media: MediaItem[];
  target_lang: string;
}

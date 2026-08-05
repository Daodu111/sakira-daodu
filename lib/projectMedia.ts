/** Normalize project media for backward-compatible single `image` and multi `images`. */

export interface MediaProject {
  image: string;
  images?: string[];
  niche?: string;
}

export function getProjectImages(project: MediaProject): string[] {
  if (project.images && project.images.length > 0) {
    return project.images.filter(Boolean);
  }
  return project.image ? [project.image] : [];
}

export function getPrimaryMedia(project: MediaProject): string {
  return getProjectImages(project)[0] || "";
}

/** Build storage payload: keep `image` as cover (first) and optional `images` for carousels. */
export function buildMediaFields(urls: string[]): { image: string; images: string[] } {
  const cleaned = urls.map((u) => u.trim()).filter(Boolean);
  return {
    image: cleaned[0] || "",
    images: cleaned,
  };
}

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?|$)/i;

export function isLikelyVideoUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("data:video/")) return true;
  if (url.startsWith("data:image/")) return false;
  if (VIDEO_EXT.test(url)) return true;
  if (/firebasestorage\.googleapis\.com/i.test(url) && /video/i.test(url)) return true;
  return false;
}

export function isLikelyImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("data:image/")) return true;
  if (url.startsWith("data:video/")) return false;
  if (IMAGE_EXT.test(url)) return true;
  if (/picsum\.photos|unsplash\.com|imgur\.com\/.*\.(jpe?g|png|gif|webp)/i.test(url)) return true;
  return false;
}

/** YouTube watch / share / embed URLs → embeddable ID */
export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*\bv=([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function getVimeoId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export function isEmbeddableVideoUrl(url: string): boolean {
  return !!(getYouTubeId(url) || getVimeoId(url));
}

// Decide whether a media URL points at a video (rendered with <video>) or an
// image/gif (rendered with <img>). Used by spotlight ads.
export function mediaTypeFromUrl(url: string): "image" | "video" {
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url) ? "video" : "image";
}

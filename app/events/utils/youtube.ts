export function extractYouTubeId(raw?: string | null): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  // Try URL parsing first
  try {
    const u = new URL(s);
    const host = (u.hostname || "").replace(/^www\./i, "").toLowerCase();
    if (host === "youtu.be") {
      const p = u.pathname || "";
      return p.startsWith("/") ? p.slice(1) || null : p || null;
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const p = u.pathname || "";
      if (p.startsWith("/watch")) return u.searchParams.get("v") || null;
      if (p.startsWith("/embed/")) return p.split("/embed/")[1]?.split("/")[0] || null;
      if (p.startsWith("/shorts/")) return p.split("/shorts/")[1]?.split("/")[0] || null;
    }
  } catch (e) {
    // fallthrough to regex
  }

  // Fallback: extract 11-char video id anywhere in the string
  const m = s.match(/(?:v=|v\/|embed\/|youtu\.be\/|shorts\/)?([A-Za-z0-9_-]{11})/i);
  if (m && m[1]) return m[1];
  return null;
}

export function buildYouTubeEmbedUrl(videoId: string, origin = "https://www.youtube.com") {
  const base = `https://www.youtube-nocookie.com/embed/${videoId}`;
  const sep = base.includes("?") ? "&" : "?";
  const params = `rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(
    origin
  )}`;
  return `${base}${sep}${params}`;
}

export function buildYouTubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export default {
  extractYouTubeId,
  buildYouTubeEmbedUrl,
  buildYouTubeWatchUrl,
};

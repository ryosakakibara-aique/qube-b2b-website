/**
 * The video field, parsed.
 *
 * The CMS stores what an author pastes, which is a YouTube URL in whatever form the address bar gave
 * them. The embed needs the eleven-character id and nothing else, so this is the one place that
 * translation happens — used by validation (to reject a link that would render an empty frame) and by
 * the hero (to build the embed).
 */

/** YouTube ids are exactly eleven characters of this alphabet. */
const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/** The path segment that precedes the id, for the forms that put it there. */
const ID_IN_PATH = new Set(["embed", "shorts", "live", "v"]);

/**
 * Reads an id out of a URL or a bare id. Returns null for anything else, including a link to a
 * playlist or a channel, which has no single video to embed.
 */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  // A bare id is the shortest thing an author can paste, and the easiest to keep working.
  if (ID_PATTERN.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && ID_PATTERN.test(id) ? id : null;
  }

  return YOUTUBE_HOSTS.has(host) ? readFromUrl(url) : null;
}

function readFromUrl(url: URL): string | null {
  const direct = url.searchParams.get("v");
  if (direct && ID_PATTERN.test(direct)) return direct;
  return readFromPath(url);
}

function readFromPath(url: URL): string | null {
  const [kind, id] = url.pathname.split("/").filter(Boolean);
  if (kind && id && ID_IN_PATH.has(kind) && ID_PATTERN.test(id)) return id;
  return null;
}

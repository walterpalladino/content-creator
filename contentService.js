import fetch from "node-fetch";
import { marked } from "marked";

// Configure marked: GitHub-Flavored Markdown, no silent failures
marked.use({ gfm: true, silent: false });

const LIPSUM_URL =
  "https://brettterpstra.com/md-lipsum/api/4/6/short/all/?source=english";
const IMAGE_URL = "https://picsum.photos/600/400";

/**
 * Fetches markdown Lorem Ipsum content and returns title + body.
 * The API returns a markdown document; we split the first heading
 * off as the title and use the rest as content.
 */
async function fetchContent() {
  const res = await fetch(LIPSUM_URL);
  if (!res.ok) {
    throw new Error(
      `Content service responded with ${res.status}: ${res.statusText}`
    );
  }

  const markdown = await res.text();
  const lines = markdown.trim().split("\n");

  // First non-empty line that starts with # becomes the title
  const titleLineIndex = lines.findIndex((l) => l.startsWith("#"));
  let title = "Generated Post";
  let contentLines = lines;

  if (titleLineIndex !== -1) {
    title = lines[titleLineIndex].replace(/^#+\s*/, "").trim();
    contentLines = lines.slice(titleLineIndex + 1);
  }

  const content = contentLines.join("\n").trim();
  const contentHtml = marked.parse(content);

  return { title, content: contentHtml };
}

/**
 * Fetches a random 600×400 image from Picsum and returns it as a Buffer
 * together with the resolved URL (after redirects).
 */
async function fetchImage() {
  const res = await fetch(IMAGE_URL, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(
      `Image service responded with ${res.status}: ${res.statusText}`
    );
  }

  const buffer = await res.buffer();
  const contentType = res.headers.get("content-type") || "image/jpeg";

  return { buffer, contentType };
}

export const contentService = { fetchContent, fetchImage };

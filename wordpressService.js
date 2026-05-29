import fetch from "node-fetch";
import FormData from "form-data";

/**
 * Build the Authorization header value for WordPress Basic Auth.
 * WordPress recommends Application Passwords (WP 5.6+) over plain passwords.
 */
function basicAuth(username, password) {
  return "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
}

const CONTENT_TYPE_ENDPOINTS = {
  posts: "/wp-json/wp/v2/posts",
  pages: "/wp-json/wp/v2/pages",
};

const AUTO_CATEGORY = {
  slug:        "auto-posted-content",
  name:        "Auto Posted Content",
  description: "Auto Posted Content generated from external process",
};

/**
 * Ensure the auto-posting category exists in WordPress, creating it if needed.
 * Returns the category ID. Safe to call once per batch — never duplicates.
 *
 * @param {object} opts
 * @param {string}  opts.baseUrl
 * @param {string}  opts.username
 * @param {string}  opts.password
 * @returns {Promise<number>} The category ID
 */
async function ensureCategory({ baseUrl, username, password }) {
  const auth = basicAuth(username, password);

  // 1. Check whether the category already exists by slug
  const searchUrl = `${baseUrl}/wp-json/wp/v2/categories?slug=${AUTO_CATEGORY.slug}`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: auth },
  });

  if (!searchRes.ok) {
    throw new Error(
      `Category lookup failed [${searchRes.status}]: ${await searchRes.text()}`
    );
  }

  const matches = await searchRes.json();

  if (matches.length > 0) {
    const { id, name } = matches[0];
    console.log(`  ✔ Category exists — ID: ${id}  Name: "${name}"`);
    return id;
  }

  // 2. Not found — create it
  const createUrl = `${baseUrl}/wp-json/wp/v2/categories`;
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name:        AUTO_CATEGORY.name,
      slug:        AUTO_CATEGORY.slug,
      description: AUTO_CATEGORY.description,
    }),
  });

  const created = await createRes.json();

  if (!createRes.ok) {
    throw new Error(
      `Category creation failed [${createRes.status}]: ${JSON.stringify(created)}`
    );
  }

  console.log(`  ✔ Category created — ID: ${created.id}  Name: "${created.name}"`);
  return created.id;
}

/**
 * Upload an image buffer to the WordPress media library.
 *
 * @param {object} opts
 * @param {string}  opts.baseUrl   - WordPress site root, e.g. http://localhost/wordpress
 * @param {string}  opts.username
 * @param {string}  opts.password
 * @param {Buffer}  opts.imageBuffer
 * @param {string}  opts.contentType  - MIME type, e.g. "image/jpeg"
 * @param {string}  [opts.filename]   - file name sent to WP
 * @returns {Promise<number>} The media ID assigned by WordPress
 */
async function uploadMedia({
  baseUrl,
  username,
  password,
  imageBuffer,
  contentType,
  filename = "featured.jpg",
}) {
  const url = `${baseUrl}/wp-json/wp/v2/media`;

  const form = new FormData();
  form.append("file", imageBuffer, { filename, contentType });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: basicAuth(username, password),
      ...form.getHeaders(),
    },
    body: form,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Media upload failed [${res.status}]: ${JSON.stringify(data)}`
    );
  }

  console.log(`  ✔ Media uploaded — ID: ${data.id}  URL: ${data.source_url}`);
  return data.id;
}

/**
 * Create a new WordPress post or page.
 *
 * @param {object} opts
 * @param {string}   opts.baseUrl
 * @param {string}   opts.username
 * @param {string}   opts.password
 * @param {string}   opts.title
 * @param {string}   opts.content
 * @param {string}   [opts.status]       - default "draft"
 * @param {string}   [opts.type]         - "posts" | "pages", default "posts"
 * @param {string}   [opts.template]     - optional template filename
 * @param {number}   opts.featuredMediaId
 * @param {number[]} opts.categories     - array of category IDs
 * @returns {Promise<object>} The created content object from WordPress
 */
async function createPost({
  baseUrl,
  username,
  password,
  title,
  content,
  status = "draft",
  type = "posts",
  template,
  featuredMediaId,
  categories,
}) {
  const endpoint = CONTENT_TYPE_ENDPOINTS[type];
  const url = `${baseUrl}${endpoint}`;

  const payload = {
    title,
    content,
    status,
    featured_media: featuredMediaId,
    categories,
    ...(template !== undefined && { template }),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: basicAuth(username, password),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `${type} creation failed [${res.status}]: ${JSON.stringify(data)}`
    );
  }

  const label = type === "pages" ? "Page" : "Post";
  console.log(`  ✔ ${label} created — ID: ${data.id}  Link: ${data.link}`);
  return data;
}

export const wordpressService = { ensureCategory, uploadMedia, createPost };

import fetch from "node-fetch";
import FormData from "form-data";

/**
 * Build the Authorization header value for WordPress Basic Auth.
 * WordPress recommends Application Passwords (WP 5.6+) over plain passwords.
 */
function basicAuth(username, password) {
  return "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
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
  form.append("file", imageBuffer, {
    filename,
    contentType,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: basicAuth(username, password),
      // FormData sets Content-Type with boundary automatically via getHeaders()
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
 * Create a new WordPress post.
 *
 * @param {object} opts
 * @param {string}  opts.baseUrl
 * @param {string}  opts.username
 * @param {string}  opts.password
 * @param {string}  opts.title
 * @param {string}  opts.content
 * @param {string}  [opts.status]          - default "draft"
 * @param {number}  opts.featuredMediaId
 * @returns {Promise<object>} The created post object from WordPress
 */
async function createPost({
  baseUrl,
  username,
  password,
  title,
  content,
  status = "draft",
  template,
  featuredMediaId,
}) {
  const url = `${baseUrl}/wp-json/wp/v2/posts`;

  const payload = {
    title,
    content,
    status,
    featured_media: featuredMediaId,
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
      `Post creation failed [${res.status}]: ${JSON.stringify(data)}`
    );
  }

  console.log(`  ✔ Post created  — ID: ${data.id}  Link: ${data.link}`);
  return data;
}

export const wordpressService = { uploadMedia, createPost };

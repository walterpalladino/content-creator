import "dotenv/config";
import { contentService } from "./contentService.js";
import { wordpressService } from "./wordpressService.js";

// ── Configuration ────────────────────────────────────────────────────────────

const BASE_URL = process.env.WP_BASE_URL || "http://localhost/wordpress";
const USERNAME = process.env.WP_USERNAME;
const PASSWORD = process.env.WP_PASSWORD;

const VALID_STATUSES = ["draft", "publish", "pending", "private", "future"];

// ── CLI argument parsing ──────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { count: 1, status: "draft", type: "posts", template: undefined };
  const errors = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--count" || arg === "-c") {
      const raw = args[++i];
      const value = Number(raw);

      if (!raw || !Number.isInteger(value)) {
        errors.push(`--count requires an integer value (got: ${raw ?? "nothing"})`);
      } else if (value < 1 || value > 100) {
        errors.push(`--count must be between 1 and 100 (got: ${value})`);
      } else {
        result.count = value;
      }

    } else if (arg === "--status" || arg === "-s") {
      const raw = args[++i];

      if (!raw) {
        errors.push("--status requires a value");
      } else if (!VALID_STATUSES.includes(raw)) {
        errors.push(
          `--status must be one of: ${VALID_STATUSES.join(", ")} (got: "${raw}")`
        );
      } else {
        result.status = raw;
      }

    } else if (arg === "--type" || arg === "-y") {
      const raw = args[++i];

      if (!raw) {
        errors.push("--type requires a value");
      } else if (!["posts", "pages"].includes(raw)) {
        errors.push(`--type must be "posts" or "pages" (got: "${raw}")`);
      } else {
        result.type = raw;
      }

    } else if (arg === "--template" || arg === "-t") {
      const raw = args[++i];

      if (!raw) {
        errors.push("--template requires a value");
      } else {
        result.template = raw;
      }

    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);

    } else {
      errors.push(`Unknown argument: ${arg}`);
    }
  }

  if (errors.length) {
    errors.forEach((e) => console.error(`  ✖ ${e}`));
    console.error('\nRun with --help for usage information.');
    process.exit(1);
  }

  return result;
}

function printHelp() {
  console.log(`
WordPress Auto-Poster

Usage:
  node index.js [options]

Options:
  -c, --count <n>     Number of items to create (1–100, default: 1)
  -s, --status <s>    Post/page status (default: draft)
                      Allowed: ${VALID_STATUSES.join(", ")}
  -y, --type <t>      Content type: posts, pages (default: posts)
  -t, --template <t>  Page template to use (optional, e.g. "full-width.php")
  -h, --help          Show this help message

Examples:
  node index.js                                    # create 1 draft post
  node index.js --count 5                          # create 5 draft posts
  node index.js --count 3 --status publish
  node index.js --type pages                       # create 1 draft page
  node index.js -y pages -c 3 -s publish
  node index.js -c 10 -s pending
  node index.js --template full-width.php
  node index.js -c 3 -s draft -t full-width.php
`);
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateConfig() {
  const missing = [];
  if (!USERNAME) missing.push("WP_USERNAME");
  if (!PASSWORD) missing.push("WP_PASSWORD");

  if (missing.length) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}\n` +
        `Copy .env.example to .env and fill in the values.`
    );
  }
}

// ── Single post flow ──────────────────────────────────────────────────────────

async function createOnePost({ status, type, template, index, total }) {
  const label = total > 1 ? ` [${index}/${total}]` : "";

  console.log(`\n📝  Generating content and fetching image…${label}`);
  const [{ title, content }, { buffer: imageBuffer, contentType }] =
    await Promise.all([contentService.fetchContent(), contentService.fetchImage()]);

  console.log(`   Title   : ${title}`);
  console.log(`   Content : ${content.length} characters`);

  console.log(`🖼   Uploading featured image…`);
  const featuredMediaId = await wordpressService.uploadMedia({
    baseUrl: BASE_URL,
    username: USERNAME,
    password: PASSWORD,
    imageBuffer,
    contentType,
    filename: `featured-${Date.now()}.jpg`,
  });

  const typeLabel = type === "pages" ? "page" : "post";
  console.log(`📄  Creating ${typeLabel} (status: ${status}${template ? `, template: ${template}` : ""})…`);
  const post = await wordpressService.createPost({
    baseUrl: BASE_URL,
    username: USERNAME,
    password: PASSWORD,
    title,
    content,
    status,
    type,
    template,
    featuredMediaId,
  });

  return { post, title, featuredMediaId };
}

// ── Main flow ─────────────────────────────────────────────────────────────────

async function run() {
  const { count, status, type, template } = parseArgs(process.argv);

  validateConfig();

  console.log(`\n🚀  WordPress Auto-Poster`);
  console.log(`   Target   : ${BASE_URL}`);
  console.log(`   Type     : ${type}`);
  console.log(`   Count    : ${count}`);
  console.log(`   Status   : ${status}`);
  if (template) console.log(`   Template : ${template}`);

  const results = [];

  for (let i = 1; i <= count; i++) {
    const { post, title, featuredMediaId } = await createOnePost({
      status,
      type,
      template,
      index: i,
      total: count,
    });
    results.push({ post, title, featuredMediaId });
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const singular = type === "pages" ? "page" : "post";
  const plural = type === "pages" ? "pages" : "posts";
  console.log(`\n✅  Done — ${results.length} ${results.length !== 1 ? plural : singular} created\n`);

  results.forEach(({ post, title, featuredMediaId }, i) => {
    if (count > 1) console.log(`  ── ${type === "pages" ? "Page" : "Post"} ${i + 1} ──────────────────────`);
    console.log(`     ID      : ${post.id}`);
    console.log(`     Title   : ${post.title?.rendered || title}`);
    console.log(`     Status  : ${post.status}`);
    console.log(`     Link    : ${post.link}`);
    console.log(`     Media   : ${featuredMediaId}`);
  });

  console.log();
}

run().catch((err) => {
  console.error("\n❌  Error:", err.message);
  process.exit(1);
});

# WordPress Auto-Poster

A Node.js application that automatically generates content and creates posts or pages on a WordPress site via the REST API.

## How it works

1. **Fetches content** from the Brett Terpstra Markdown Lipsum API — splits the first heading into the title and uses the rest as the body
2. **Converts markdown to HTML** using the `marked` library (GFM enabled) before sending to WordPress
3. **Fetches a random image** (600×400) from Picsum Photos
4. **Uploads the image** to the WordPress Media Library → receives a media ID
5. **Creates the post or page** with the generated title, HTML content, featured image ID, and any optional parameters

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

| Variable      | Default                      | Description                             |
|---------------|------------------------------|-----------------------------------------|
| `WP_BASE_URL` | `http://localhost/wordpress` | Root URL of your WordPress installation |
| `WP_USERNAME` | _(required)_                 | WordPress username                      |
| `WP_PASSWORD` | _(required)_                 | WordPress Application Password          |

> **Tip — Application Passwords (recommended)**  
> Go to **Users → Profile → Application Passwords** in your WP admin and generate one. It's safer than your login password and can be revoked independently.

### 3. Run

```bash
npm start                                           # 1 draft post (default)
node index.js --count 5                             # 5 draft posts
node index.js --count 3 --status publish            # 3 published posts
node index.js --type pages                          # 1 draft page
node index.js -y pages -c 3 -s publish              # 3 published pages, short flags
node index.js --template full-width.php             # 1 draft post with page template
node index.js -y pages -c 2 -t full-width.php       # 2 draft pages with template
node index.js --help                                # show all options
```

### CLI options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--count <n>` | `-c` | `1` | Number of items to create (1–100) |
| `--status <s>` | `-s` | `draft` | Status: `draft`, `publish`, `pending`, `private`, `future` |
| `--type <t>` | `-y` | `posts` | Content type: `posts` or `pages` |
| `--template <t>` | `-t` | _(omitted)_ | Template filename (e.g. `full-width.php`). Omitted from the request entirely when not supplied |
| `--help` | `-h` | — | Show usage information |

## Project structure

```
wp-poster/
├── index.js            # Entry point — CLI parsing, orchestrates the full flow
├── contentService.js   # Fetches markdown content & random image, converts to HTML
├── wordpressService.js # WordPress REST API calls (media upload, post/page creation)
├── .env.example        # Environment variable template
└── package.json
```

## API endpoints used

| Action        | Method | Endpoint                      |
|---------------|--------|-------------------------------|
| Upload image  | POST   | `/wp-json/wp/v2/media`        |
| Create post   | POST   | `/wp-json/wp/v2/posts`        |
| Create page   | POST   | `/wp-json/wp/v2/pages`        |

The endpoint is selected automatically based on the `--type` flag.

## Post/page payload

All requests use HTTP Basic Auth (`Authorization: Basic <base64>`).

The `template` field is included only when `--template` is passed. The example below shows a page with all optional fields present:

```json
{
  "title": "Generated title",
  "content": "<p>HTML body converted from markdown…</p>",
  "status": "draft",
  "featured_media": 42,
  "template": "full-width.php"
}
```

## External services

| Service         | URL                                                                      |
|-----------------|--------------------------------------------------------------------------|
| Markdown Lipsum | `https://brettterpstra.com/md-lipsum/api/4/6/short/all/?source=english` |
| Random image    | `https://picsum.photos/600/400`                                          |

# WordPress Auto-Poster

A Node.js application that automatically generates content and creates posts on a WordPress site via the REST API.

## How it works

1. **Fetches content** from the Brett Terpstra Markdown Lipsum API — splits the first heading into the post title and uses the rest as the body
2. **Converts markdown to HTML** using the `marked` library (GFM enabled) before sending to WordPress
3. **Fetches a random image** (600×400) from Picsum Photos
4. **Uploads the image** to the WordPress Media Library → receives a media ID
5. **Creates the post** with the generated title, HTML content, featured image ID, and any optional parameters

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
npm start                                                 # 1 draft post, default settings
node index.js --count 5                                   # 5 draft posts
node index.js --count 3 --status publish                  # 3 published posts
node index.js --template full-width.php                   # 1 draft post with a page template
node index.js -c 3 -s publish -t full-width.php           # combined short flags
node index.js --help                                      # show all options
```

### CLI options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--count <n>` | `-c` | `1` | Number of posts to create (1–100) |
| `--status <s>` | `-s` | `draft` | Post status: `draft`, `publish`, `pending`, `private`, `future` |
| `--template <t>` | `-t` | _(omitted)_ | Page template filename (e.g. `full-width.php`). When not supplied, the `template` field is omitted from the request entirely |
| `--help` | `-h` | — | Show usage information |

## Project structure

```
wp-poster/
├── index.js            # Entry point — CLI parsing, orchestrates the full flow
├── contentService.js   # Fetches markdown content & random image, converts to HTML
├── wordpressService.js # WordPress REST API calls (media upload, post creation)
├── .env.example        # Environment variable template
└── package.json
```

## API endpoints used

| Action       | Method | Endpoint               |
|--------------|--------|------------------------|
| Upload image | POST   | `/wp-json/wp/v2/media` |
| Create post  | POST   | `/wp-json/wp/v2/posts` |

## Post payload

All requests use HTTP Basic Auth (`Authorization: Basic <base64>`).

The `template` field is included only when `--template` is passed on the command line:

```json
{
  "title": "Generated post title",
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

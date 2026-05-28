# WordPress Auto-Poster

A Node.js application that automatically generates content and creates draft posts on a WordPress site via the REST API.

## How it works

1. **Fetches content** from the Brett Terpstra Markdown Lipsum API (title + body)
2. **Fetches a random image** (600×400) from Picsum Photos
3. **Uploads the image** to the WordPress Media Library → receives a media ID
4. **Creates a draft post** with the generated title, content, and featured image ID

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

| Variable       | Default                       | Description                              |
|----------------|-------------------------------|------------------------------------------|
| `WP_BASE_URL`  | `http://localhost/wordpress`  | Root URL of your WordPress installation  |
| `WP_USERNAME`  | _(required)_                  | WordPress username                       |
| `WP_PASSWORD`  | _(required)_                  | WordPress Application Password           |

> **Tip — Application Passwords (recommended)**  
> Go to **Users → Profile → Application Passwords** in your WP admin and generate one. It's safer than your login password and can be revoked independently.

### 3. Run

```bash
npm start                                      # 1 draft post
node index.js --count 5                        # 5 draft posts
node index.js --count 3 --status publish       # 3 published posts
node index.js -c 10 -s pending                 # short flags
node index.js --help                           # show all options
```

#### CLI options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--count <n>` | `-c` | `1` | Number of posts to create (1–100) |
| `--status <s>` | `-s` | `draft` | Post status: `draft`, `publish`, `pending`, `private`, `future` |
| `--help` | `-h` | — | Show usage information |

## Project structure

```
wp-poster/
├── index.js            # Entry point — orchestrates the full flow
├── contentService.js   # Fetches markdown content & random image
├── wordpressService.js # WordPress REST API calls (media + posts)
├── .env.example        # Environment variable template
└── package.json
```

## API endpoints used

| Action          | Method | Endpoint                      |
|-----------------|--------|-------------------------------|
| Upload image    | POST   | `/wp-json/wp/v2/media`        |
| Create post     | POST   | `/wp-json/wp/v2/posts`        |

## Post payload

```json
{
  "title": "Generated title from lipsum API",
  "content": "Markdown body content…",
  "status": "draft",
  "featured_media": 42
}
```

## External services

| Service | URL |
|---------|-----|
| Markdown Lipsum | `https://brettterpstra.com/md-lipsum/api/4/6/short/all/?source=english` |
| Random image | `https://picsum.photos/600/400` |

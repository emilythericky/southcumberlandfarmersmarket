# South Cumberland Farmer's Market — Website

Static HTML/CSS/JS site for the South Cumberland Farmer's Market, hosted on GitHub Pages at [southcumberlandfarmersmarket.com](https://southcumberlandfarmersmarket.com).

---

## Repo Structure

```
scfm-website/
├── index.html            Home page
├── shop.html             Shop & Products
├── farmers.html          Our Farmers
├── faqs.html             Customer FAQs
├── grower-faqs.html      Grower FAQs + Vendor Application
├── shopping-tips.html    Shopping Tips
├── contact.html          Contact
├── css/
│   └── style.css         All styles
├── js/
│   └── main.js           Shared nav/footer injection + page logic
├── data/
│   ├── products.json     Product listings (populated by n8n)
│   ├── farmers.json      Farmer profiles (edit manually)
│   └── status.json       Order open/closed flag (edit manually)
├── images/
│   └── .gitkeep          Add photos here (see below)
├── CNAME                 Custom domain for GitHub Pages
└── README.md
```

---

## 1. Deploy to GitHub Pages

**One-time setup:**

1. Create a new repository on GitHub (e.g. `scfm-website`).
2. In your terminal, from this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-ORG/scfm-website.git
   git push -u origin main
   ```
3. On GitHub: go to **Settings → Pages → Source** → select branch `main`, folder `/ (root)`.
4. GitHub Pages will build and publish. The site will be live at `https://YOUR-ORG.github.io/scfm-website/` within a few minutes.

**Subsequent updates:**
```bash
git add .
git commit -m "Update farmers list"
git push
```
GitHub Pages redeploys automatically on every push to `main`.

---

## 2. Point Custom Domain to GitHub Pages

**Step A — Add the CNAME file** (already done):

The file `CNAME` in this repo contains `southcumberlandfarmersmarket.com`. GitHub reads this automatically.

**Step B — Configure DNS at your registrar:**

| Type  | Host / Name       | Value                       | TTL  |
|-------|-------------------|-----------------------------|------|
| A     | `@`               | `185.199.108.153`           | 3600 |
| A     | `@`               | `185.199.109.153`           | 3600 |
| A     | `@`               | `185.199.110.153`           | 3600 |
| A     | `@`               | `185.199.111.153`           | 3600 |
| CNAME | `www`             | `YOUR-ORG.github.io`        | 3600 |

*(These are GitHub Pages' current IP addresses — verify at [GitHub Docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) if they ever change.)*

**Step C — Enable HTTPS:**

After DNS propagates (up to 48 hours), go to **GitHub → Settings → Pages** and check **Enforce HTTPS**.

---

## 3. Update Farmer Profiles (`data/farmers.json`)

Edit `data/farmers.json` directly. Each entry follows this shape:

```json
{
  "name": "Farm Name Here",
  "county": "Grundy",
  "description": "A sentence or two about what they grow and their approach.",
  "certifications": ["No Chem", "Woman Owned"],
  "photo": "images/farmers/farmname.jpg"
}
```

**Certification options:** `"No Chem"`, `"Certified Naturally Grown"`, `"USDA Certified Organic"`, `"Conventional"`, `"Woman Owned"` — or any custom label.

**Adding a photo:**
1. Save the photo to `images/farmers/` (e.g. `images/farmers/ridge-farm.jpg`).
2. Set `"photo": "images/farmers/ridge-farm.jpg"` in the JSON.
3. If `"photo"` is empty (`""`), the card shows the farm's initials instead.

After editing, commit and push:
```bash
git add data/farmers.json images/farmers/
git commit -m "Add farmer profiles"
git push
```

---

## 4. Toggle Order Status (`data/status.json`)

```json
{"ordersOpen": true, "cycleNote": ""}
```

- **`ordersOpen: true`** — the Shop page shows a green "Orders are open" banner with a direct link to the OFN shopfront.
- **`ordersOpen: false`** — shows the dark "Orders are currently closed" banner.
- **`cycleNote`** — optional short message appended to the banner (e.g. `"Closing early this week — Monday 8am"`).

The top-of-page banner across all pages is driven by live Substack RSS (see §6), not this file. `status.json` controls only the Shop page's in-page banner.

Commit and push after editing:
```bash
git add data/status.json
git commit -m "Open orders"
git push
```

---

## 5. Set Up Formspree (Vendor Application Form)

The vendor application on `grower-faqs.html` uses [Formspree](https://formspree.io) to handle form submissions from a static site.

1. Sign up at [formspree.io](https://formspree.io) (free tier handles ~50 submissions/month).
2. Create a new form — name it "SCFM Vendor Application".
3. Copy the **form ID** (looks like `xpzkdoab`).
4. Open `grower-faqs.html` and find the form's `action` attribute:
   ```html
   action="https://formspree.io/f/REPLACE_WITH_YOUR_ID"
   ```
   Replace `REPLACE_WITH_YOUR_ID` with your actual ID:
   ```html
   action="https://formspree.io/f/xpzkdoab"
   ```
5. In the Formspree dashboard, set the notification email to `cumberlandfm@gmail.com`.

Submissions arrive in your email and are stored in the Formspree dashboard.

---

## 6. Substack RSS Banner

The colored order-status banner at the very top of every page is driven by a live fetch of the Substack RSS feed (`https://scfm.substack.com/feed`) via the allorigins CORS proxy.

**How it works** (`js/main.js → initBanner()`):

1. Fetches the RSS via `https://api.allorigins.win/get?url=<encoded-feed-url>`.
2. Parses the XML and reads the **title of the most recent post**.
3. Banner state:
   - Title contains **"open"** (case-insensitive) → green banner, links to OFN shop.
   - Title contains **"clos"** (case-insensitive) → dark banner, links to OFN shop.
   - Fetch fails or no keyword match → neutral parchment banner, links to Substack.

**To adjust keyword detection**, edit `initBanner()` in `js/main.js`:
```js
if (/open/i.test(title)) {   // ← change this regex
```

**Substack post title convention:** Start each week's post title with "Open —" when orders open (e.g. "Open — Strawberries are here!") and "Closed —" when they close. The banner will match automatically.

---

## 7. Product Listings (`data/products.json`)

`products.json` starts as an empty array `[]`. When empty, the Shop page shows a placeholder callout.

**Intended data flow (n8n automation):**

```
OFN API  →  n8n workflow  →  GitHub API (commit products.json)  →  GitHub Pages
```

The n8n workflow should:
1. Hit the OFN API to fetch current product listings.
2. Transform to this format:
   ```json
   [
     {
       "name": "Heirloom Tomatoes",
       "producer": "Ridge Farm",
       "price": "$4.00",
       "unit": "lb",
       "category": "Vegetables"
     }
   ]
   ```
3. Commit the updated `products.json` to this repo via the GitHub API using a personal access token with `contents: write` permission.

Until the automation is connected, the Shop page shows the "check back Friday" callout. You can also populate `products.json` manually.

---

## 8. Adding Photos

### Hero / background photos

Each page has a `TODO` comment in the HTML pointing to where to add the photo:

| Page              | Photo to add                         | CSS class to change     |
|-------------------|--------------------------------------|-------------------------|
| `index.html`      | `images/hero-market.jpg`             | `.hero` background      |
| `farmers.html`    | `images/hero-farm.jpg`               | `.hero` background      |
| `faqs.html`       | `images/hero-cattle.jpg`             | `.hero` background      |
| `grower-faqs.html`| `images/hero-garden-rows.jpg`        | `.hero` background      |
| `contact.html`    | `images/hero-chickens.jpg`           | `.hero` background      |
| `shop.html`       | `images/categories-bg.jpg`           | `.categories-section`   |

To add a hero photo, open the page's HTML and change:
```html
<section class="hero">
```
to:
```html
<section class="hero hero-photo" style="background-image:url('images/hero-market.jpg');">
```
The `.hero-photo` class adds a dark overlay so white/gold text stays readable. Adjust the overlay opacity in `css/style.css` (`.hero-photo::before { background: rgba(0,0,0,0.35); }`).

### Product placeholder grid photos

The 10 colored placeholder divs on `shop.html` are marked with `TODO` in the HTML. Replace each `<div class="product-placeholder" ...>Label</div>` with an `<img>` tag inside the same wrapper, saving photos to `images/products/`.

### Farmer profile photos

See §3 above.

### Favicon

Download the existing favicon from `southcumberlandfarmersmarket.com/favicon.ico` and save it to `images/favicon.ico`. Each HTML page already references `<link rel="icon" href="images/favicon.ico">`.

---

## Local Development Note

Opening HTML files directly via `file://` will work for visual inspection, but JavaScript `fetch()` calls to local JSON files (`data/*.json`) will be blocked by the browser's same-origin policy.

To test the full site locally, use a simple local server:

```bash
# Python 3 (built-in)
python3 -m http.server 8080

# Node.js (if installed)
npx serve .

# VS Code
# Install the "Live Server" extension, then right-click index.html → "Open with Live Server"
```

Then open `http://localhost:8080` in your browser.

The Substack RSS fetch also requires a network connection (it hits the allorigins.win proxy). If the proxy is down or rate-limited, the banner falls back to the neutral parchment state automatically.

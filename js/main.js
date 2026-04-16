/* =============================================
   South Cumberland Farmer's Market
   js/main.js — shared globals + page logic
   ============================================= */

'use strict';

// ── Constants ──────────────────────────────────────────────────────────────
const OFN_URL        = 'https://openfoodnetwork.net/south-cumberland-farmer-s-market/shop';
const SUBSTACK_URL   = 'https://scfm.substack.com';
const SUBSTACK_FEED  = 'https://scfm.substack.com/feed';
const CONTACT_EMAIL  = 'cumberlandfm@gmail.com';
const CORS_PROXY     = 'https://api.allorigins.win/get?url=';

// ── RSS cache (avoid double-fetching on home page) ─────────────────────────
let _rssCache = null;

async function fetchRSS() {
  if (_rssCache) return _rssCache;
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(SUBSTACK_FEED)}`;
  const res  = await fetch(proxyUrl);
  const data = await res.json();
  const parser = new DOMParser();
  _rssCache = parser.parseFromString(data.contents, 'text/xml');
  return _rssCache;
}

// ── Detect active page from body[data-page] ────────────────────────────────
function getActivePage() {
  return document.body.dataset.page || 'home';
}

// ── Navigation HTML ────────────────────────────────────────────────────────
function buildNav() {
  const active = getActivePage();

  const pages = [
    { href: 'index.html',         label: 'Home',           key: 'home'          },
    { href: 'shop.html',          label: 'Shop & Products', key: 'shop'         },
    { href: 'farmers.html',       label: 'Our Farmers',     key: 'farmers'      },
    { href: 'faqs.html',          label: 'FAQs',            key: 'faqs'         },
    { href: 'contact.html',       label: 'Contact',         key: 'contact'      },
  ];

  const desktopLinks = pages.map(p =>
    `<li><a href="${p.href}"${p.key === active ? ' class="active"' : ''}>${p.label}</a></li>`
  ).join('');

  const mobileLinks = pages.map(p =>
    `<a href="${p.href}"${p.key === active ? ' class="active"' : ''}>${p.label}</a>`
  ).join('');

  return `
    <nav class="nav-inner" aria-label="Main navigation">
      <a class="nav-brand" href="index.html">South Cumberland Farmer's Market</a>
      <ul class="nav-links" role="list">${desktopLinks}</ul>
      <button class="hamburger" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobile-nav">
        <span></span><span></span><span></span>
      </button>
    </nav>
    <div class="nav-mobile" id="mobile-nav" role="navigation" aria-label="Mobile navigation">
      ${mobileLinks}
    </div>
  `;
}

// ── Footer HTML ────────────────────────────────────────────────────────────
function buildFooter() {
  return `
    <div class="footer-inner">
      <p><strong>South Cumberland Farmer's Market · Rooted Here</strong></p>
      <p>Pickup: Sewanee Community Center · 3939 Ballpark Rd, Sewanee TN 37375</p>
      <p>Tuesdays 4:15–6:00pm</p>
      <p>Newsletter: <a href="${SUBSTACK_URL}" target="_blank" rel="noopener noreferrer">scfm.substack.com</a></p>
      <p>Online Market: <a href="${OFN_URL}" target="_blank" rel="noopener noreferrer">openfoodnetwork.net/south-cumberland-farmer-s-market/shop</a></p>
      <p>Contact: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
      <p class="footer-smallprint">A community-run market serving Grundy, Marion, Franklin, Coffee, and Sequatchie counties in the South Cumberland region of Tennessee.</p>
    </div>
  `;
}

// ── Inject nav and footer into every page ─────────────────────────────────
function injectGlobals() {
  const header = document.getElementById('site-header');
  if (header) header.innerHTML = buildNav();

  const footer = document.getElementById('site-footer');
  if (footer) footer.innerHTML = buildFooter();

  initHamburger();
}

// ── Hamburger toggle ───────────────────────────────────────────────────────
function initHamburger() {
  const btn     = document.querySelector('.hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (!btn || !mobileNav) return;

  btn.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
  });

  // Close mobile nav when a link is clicked
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

// ── Order Status Banner ────────────────────────────────────────────────────
// Fetches the Substack RSS feed, reads the latest post title,
// and sets the banner state (open / closed / neutral fallback).
async function initBanner() {
  const banner = document.getElementById('order-banner');
  if (!banner) return;

  try {
    const xml   = await fetchRSS();
    const items = xml.querySelectorAll('item');
    if (!items.length) throw new Error('empty feed');

    const title = items[0].querySelector('title')?.textContent?.trim() || '';

    if (/open/i.test(title)) {
      banner.className = 'banner-open';
      banner.innerHTML =
        `<a href="${OFN_URL}" target="_blank" rel="noopener noreferrer">` +
        `✓ Orders are open — ${title} · Order now →</a>`;
    } else if (/clos/i.test(title)) {
      banner.className = 'banner-closed';
      banner.innerHTML =
        `<a href="${OFN_URL}" target="_blank" rel="noopener noreferrer">` +
        `Orders are currently closed · Ordering opens Friday at 9pm</a>`;
    } else {
      // No keyword match — neutral fallback
      throw new Error('no keyword');
    }
  } catch (_) {
    banner.className = 'banner-neutral';
    banner.innerHTML =
      `<a href="${SUBSTACK_URL}" target="_blank" rel="noopener noreferrer">` +
      `Visit our Substack for current order information →</a>`;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function extractFirstImage(html) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Home page — Substack news strip ───────────────────────────────────────
async function initHomeNewsStrip() {
  const container = document.getElementById('news-strip-cards');
  if (!container) return;

  try {
    const xml   = await fetchRSS();
    const items = Array.from(xml.querySelectorAll('item')).slice(0, 6);
    if (!items.length) throw new Error('no items');

    container.innerHTML = items.map(item => {
      const title   = item.querySelector('title')?.textContent?.trim() || 'Untitled';
      const link    = item.querySelector('link')?.textContent?.trim()  || SUBSTACK_URL;
      const pubDate = item.querySelector('pubDate')?.textContent       || '';

      // Try both namespace approaches for content:encoded
      const contentEl =
        item.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')[0] ||
        item.getElementsByTagName('content:encoded')[0];
      const encoded = contentEl ? contentEl.textContent : '';
      const imgSrc  = extractFirstImage(encoded);

      const imgHtml = imgSrc
        ? `<img src="${imgSrc}" alt="" loading="lazy">`
        : `<div class="news-card-placeholder-img" aria-hidden="true"></div>`;

      return `
        <article class="news-card">
          ${imgHtml}
          <h3>${title}</h3>
          <div class="news-date">${formatDate(pubDate)}</div>
          <a class="read-link" href="${link}" target="_blank" rel="noopener noreferrer">Read →</a>
        </article>`;
    }).join('');

  } catch (_) {
    const scrollEl = container.closest('.news-cards-scroll');
    const wrap     = scrollEl || container;
    wrap.innerHTML =
      `<div class="news-fallback">
        <a href="${SUBSTACK_URL}" target="_blank" rel="noopener noreferrer">
          Read our weekly newsletter at scfm.substack.com →
        </a>
       </div>`;
  }
}

// ── Shop page — status banner + product listings ───────────────────────────
async function initShopPage() {
  const banner = document.getElementById('shop-mode-banner');
  if (!banner) return;

  let ordersOpen = false;
  let cycleNote  = '';

  try {
    const res    = await fetch('data/status.json');
    const status = await res.json();
    ordersOpen   = Boolean(status.ordersOpen);
    cycleNote    = status.cycleNote || '';
  } catch (_) { /* keep defaults */ }

  if (ordersOpen) {
    banner.className = 'shop-mode-banner mode-open';
    banner.innerHTML = `
      <h2>✓ Orders are open now!</h2>
      <p>Order window closes Monday at 10am${cycleNote ? ' · ' + cycleNote : ''}</p>
      <a href="${OFN_URL}" class="btn btn-large btn-green" target="_blank" rel="noopener noreferrer">
        Shop the Market Now →
      </a>`;
  } else {
    banner.className = 'shop-mode-banner mode-closed';
    banner.innerHTML = `
      <h2>Orders are currently closed</h2>
      <p>Ordering opens Friday at 9pm — browse what we carry below${cycleNote ? ' · ' + cycleNote : ''}</p>`;
  }

  initProductListings();
}

async function initProductListings() {
  const container = document.getElementById('product-listings');
  if (!container) return;

  const filterBar = document.getElementById('product-filter-bar');

  try {
    const res      = await fetch('data/products.json');
    const products = await res.json();

    if (!Array.isArray(products) || !products.length) {
      container.innerHTML = `
        <div class="callout">
          <p>Product listings will appear here once our data pipeline is connected.</p>
          <p>Check back Friday at 9pm when orders open!</p>
        </div>`;
      return;
    }

    // Build category filter buttons
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
    if (filterBar && cats.length) {
      filterBar.innerHTML =
        `<button class="filter-btn active" data-cat="all">All</button>` +
        cats.map(c => `<button class="filter-btn" data-cat="${c}">${c}</button>`).join('');

      filterBar.addEventListener('click', e => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.cat;
        container.querySelectorAll('.product-card').forEach(card => {
          card.hidden = !(cat === 'all' || card.dataset.cat === cat);
        });
      });
    }

    container.innerHTML = `
      <div class="product-cards-grid">
        ${products.map(p => `
          <div class="product-card" data-cat="${p.category || ''}">
            <div class="product-card-name">${p.name || ''}</div>
            <div class="product-card-producer">${p.producer || ''}</div>
            <div class="product-card-price">${p.price ? p.price + (p.unit ? ' / ' + p.unit : '') : ''}</div>
            <span class="product-card-tag">${p.category || ''}</span>
          </div>`).join('')}
      </div>`;

  } catch (_) {
    container.innerHTML = `
      <div class="callout">
        <p>Product listings will appear here once our data pipeline is connected.</p>
        <p>Check back Friday at 9pm when orders open!</p>
      </div>`;
  }
}

// ── Farmers page ───────────────────────────────────────────────────────────
async function initFarmersPage() {
  const container = document.getElementById('farmers-grid');
  if (!container) return;

  try {
    const res     = await fetch('data/farmers.json');
    const farmers = await res.json();

    if (!Array.isArray(farmers) || !farmers.length) {
      container.innerHTML = `<p>Farmer profiles coming soon.</p>`;
      return;
    }

    container.innerHTML = farmers.map(f => {
      const initials = (f.name || 'FM').split(' ')
        .map(w => w[0]).join('').substring(0, 2).toUpperCase();

      const photoHtml = f.photo
        ? `<img class="farmer-card-photo" src="${f.photo}" alt="${f.name}" loading="lazy">`
        : `<div class="farmer-card-placeholder" aria-hidden="true">${initials}</div>`;

      const certTags = (f.certifications || [])
        .map(c => `<span class="cert-tag">${c}</span>`).join('');

      return `
        <article class="farmer-card">
          ${photoHtml}
          <div class="farmer-card-body">
            <h3>${f.name}</h3>
            <div class="farmer-county">${f.county} County</div>
            <p>${f.description}</p>
            ${certTags ? `<div class="cert-tags">${certTags}</div>` : ''}
          </div>
        </article>`;
    }).join('');

  } catch (_) {
    container.innerHTML = `<p>Farmer information will appear here soon.</p>`;
  }
}

// ── FAQ accordions ─────────────────────────────────────────────────────────
function initAccordions() {
  const questions = document.querySelectorAll('.faq-question');

  questions.forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      const isOpen = btn.classList.contains('open');

      // Close all
      questions.forEach(other => {
        other.classList.remove('open');
        other.setAttribute('aria-expanded', 'false');
        const ans = other.nextElementSibling;
        if (ans) ans.classList.remove('open');
      });

      // Toggle clicked one
      if (!isOpen) {
        btn.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        if (answer) answer.classList.add('open');
      }
    });
  });
}

// ── Vendor application form (Formspree) ────────────────────────────────────
function initVendorForm() {
  const form     = document.getElementById('vendor-form');
  const thankyou = document.getElementById('form-thankyou');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = form.querySelector('[type="submit"]');

    try {
      submitBtn.disabled    = true;
      submitBtn.textContent = 'Sending…';

      const res = await fetch(form.action, {
        method:  'POST',
        body:    new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        form.style.display = 'none';
        if (thankyou) {
          thankyou.style.display = 'block';
          thankyou.innerHTML =
            `<strong>Thank you for your application!</strong><br>
             We'll review it and be in touch soon at the email you provided.`;
        }
      } else {
        throw new Error('server error');
      }
    } catch (_) {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Submit Application';
      alert(
        'There was a problem submitting the form.\n' +
        'Please email us directly at ' + CONTACT_EMAIL
      );
    }
  });
}

// ── Page dispatcher ────────────────────────────────────────────────────────
function dispatch() {
  injectGlobals();
  initBanner();

  switch (getActivePage()) {
    case 'home':
      initHomeNewsStrip();
      break;
    case 'shop':
      initShopPage();
      break;
    case 'farmers':
      initFarmersPage();
      break;
    case 'faqs':
      initAccordions();
      break;
    case 'grower-faqs':
      initAccordions();
      initVendorForm();
      break;
    // shopping-tips and contact need no extra JS
  }
}

// ── Boot ───────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', dispatch);
} else {
  dispatch();
}

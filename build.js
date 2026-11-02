// Builds the Ironbench documentation site into docs/ (served by GitHub Pages).
// Usage: node build.js            -> uses data/schemas.json
//        node build.js --sync     -> refreshes data/schemas.json from ../ironbench first
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'docs');
const SRC = path.join(ROOT, 'src');
const DATA = path.join(ROOT, 'data', 'schemas.json');
const THEME = path.join(ROOT, '..', 'ironbench');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));

if (process.argv.includes('--sync')) syncSchemas();
const schemas = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const themeInfo = schemas.settings.find((g) => g.name === 'theme_info');

const NAV = [
  { group: 'Start here', items: [['index', 'Overview'], ['getting-started', 'Getting started'], ['presets', 'Presets']] },
  { group: 'Customize', items: [['theme-settings', 'Theme settings'], ['sections', 'Sections and blocks'], ['navigation', 'Header and navigation']] },
  { group: 'Selling', items: [['product-pages', 'Product pages'], ['collections-search', 'Collections and search'], ['cart', 'Cart and checkout']] },
  { group: 'Help', items: [['faq', 'FAQ'], ['support', 'Contact support'], ['changelog', 'Release notes']] },
];

function syncSchemas() {
  const out = { sections: {}, blocks: {}, settings: JSON.parse(fs.readFileSync(path.join(THEME, 'config', 'settings_schema.json'), 'utf8')) };
  for (const dir of ['sections', 'blocks']) {
    for (const f of fs.readdirSync(path.join(THEME, dir)).filter((f) => f.endsWith('.liquid'))) {
      const m = fs.readFileSync(path.join(THEME, dir, f), 'utf8').match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
      if (m) out[dir][f.replace('.liquid', '')] = JSON.parse(m[1]);
    }
  }
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  fs.writeFileSync(DATA, JSON.stringify(out, null, 1));
  console.log('Synced schemas from', THEME);
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Schema labels that are translation keys come from Skeleton's base files.
const LABELS = { 't:general.custom_section': 'Custom section', 't:labels.background': 'Background image', 't:general.group': 'Group', 't:general.text': 'Text' };
const label = (s) => LABELS[s] || s;

const TYPE_NAMES = {
  checkbox: 'Checkbox', range: 'Slider', select: 'Menu', text: 'Text', textarea: 'Multi-line text', richtext: 'Rich text',
  inline_richtext: 'Rich text', image_picker: 'Image', url: 'Link', color_scheme: 'Color scheme', color: 'Color', font_picker: 'Font',
  collection: 'Collection', link_list: 'Menu picker', page: 'Page', liquid: 'Liquid', color_scheme_group: 'Color schemes',
};

function describeDefault(s) {
  if (s.default === undefined || s.default === '') return '';
  if (s.type === 'checkbox') return s.default ? 'On' : 'Off';
  if (s.type === 'select') {
    const o = (s.options || []).find((o) => o.value === s.default);
    return o ? o.label : String(s.default);
  }
  if (s.type === 'range') return `${s.default}${s.unit || ''}`;
  if (s.type === 'richtext' || s.type === 'inline_richtext') return '';
  if (s.type === 'font_picker' || s.type === 'link_list' || s.type === 'color_scheme') return '';
  return String(s.default);
}

function settingsTable(settings) {
  const rows = [];
  for (const s of settings || []) {
    if (s.type === 'header') {
      rows.push(`<tr class="table-group"><th colspan="3" scope="colgroup">${esc(label(s.content))}</th></tr>`);
      continue;
    }
    if (s.type === 'paragraph') {
      rows.push(`<tr class="table-note"><td colspan="3">${esc(s.content)}</td></tr>`);
      continue;
    }
    let detail = s.info ? esc(s.info) : '';
    if (s.type === 'select' && s.options) detail += `${detail ? '<br>' : ''}Options: ${s.options.map((o) => esc(o.label)).join(', ')}`;
    if (s.type === 'range') detail += `${detail ? '<br>' : ''}From ${s.min}${s.unit || ''} to ${s.max}${s.unit || ''}`;
    const def = describeDefault(s);
    if (def) detail += `${detail ? '<br>' : ''}Default: ${esc(def)}`;
    rows.push(`<tr><th scope="row">${esc(label(s.label || TYPE_NAMES[s.type]))}</th><td class="mono">${esc(TYPE_NAMES[s.type] || s.type)}</td><td>${detail}</td></tr>`);
  }
  if (!rows.length) return '<p class="muted">This has no settings of its own.</p>';
  return `<div class="table-wrap"><table><thead><tr><th scope="col">Setting</th><th scope="col">Type</th><th scope="col">Details</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

// Short merchant-facing notes shown above each section's settings table.
const SECTION_NOTES = {
  hero: 'The first section on the home page. Use <strong>Text on image</strong> for a full-width photo, or <strong>Text next to image</strong> for a split layout. Turn on <strong>Show search bar</strong> so customers can search by SKU right from the banner.',
  'service-highlights': 'A row of short promises such as delivery, pickup, or trade accounts. Each highlight can link to a page.',
  'collection-list': 'Department cards for your main collections. Add one <strong>Collection</strong> block per department.',
  'featured-collection': 'Shows products from one collection. Choose <strong>List</strong> layout to show specification metafields next to each product.',
  'project-grid': 'Groups products by job, for example "Bathroom refit" or "Fence repair". Each project can show up to 6 quick links from a menu.',
  'feature-columns': 'Columns of icons, headings, and text. Useful for explaining services or trade benefits.',
  'logo-list': 'Brand logos with optional links to their collections.',
  'image-with-text': 'An image beside a heading, text, and button.',
  'rich-text': 'Headings, text, and buttons on a plain background.',
  newsletter: 'An email signup form. Subscribers are added to your customer list with email marketing consent.',
  'custom-liquid': 'Adds your own Liquid, HTML, or app snippets. Code in this section isn\'t covered by theme support.',
  'custom-section': 'A flexible container for theme blocks and app blocks.',
  'utility-bar': 'The thin bar above the header. Add messages such as delivery cut-off times and a secondary menu.',
  header: 'Logo, search, account, and cart. Main menu items that have second-level links with their own links open as a mega menu.',
  footer: 'Brand information, menus, text, and an email signup, plus a bottom bar with country, language, payment icons, and policies.',
  'main-product': 'The product page. Blocks with a <strong>Placement on large screens</strong> setting can sit next to the media or below it.',
  'main-collection': 'The collection page product grid with filters, sorting, and the grid and list switch.',
  'main-search': 'The search results page. It uses the same filters and list layout as collections.',
  'product-recommendations': 'Related products below the product information.',
  'main-cart': 'The cart page.',
  'cart-drawer': 'The slide-out cart used when <strong>Cart type</strong> is set to Drawer.',
};

const SECTION_ORDER = [
  ['Home page', ['hero', 'service-highlights', 'collection-list', 'featured-collection', 'project-grid', 'feature-columns', 'image-with-text', 'logo-list', 'rich-text', 'newsletter', 'custom-liquid', 'custom-section']],
  ['Header and footer', ['utility-bar', 'header', 'footer']],
  ['Product', ['main-product', 'product-recommendations']],
  ['Collection and search', ['main-collection', 'collections', 'main-search']],
  ['Cart', ['main-cart', 'cart-drawer']],
  ['Other pages', ['page', 'contact-form', 'blog', 'article', '404', 'password']],
];

function sectionsPage() {
  let toc = '';
  let body = '';
  for (const [group, ids] of SECTION_ORDER) {
    toc += `<li><a href="#${slug(group)}">${esc(group)}</a><ul>`;
    body += `<h2 id="${slug(group)}">${esc(group)}</h2>`;
    for (const id of ids) {
      const s = schemas.sections[id];
      if (!s) continue;
      const name = label(s.name);
      toc += `<li><a href="#section-${id}">${esc(name)}</a></li>`;
      body += `<section class="ref" aria-labelledby="section-${id}"><h3 id="section-${id}">${esc(name)}</h3>`;
      if (SECTION_NOTES[id]) body += `<p>${SECTION_NOTES[id]}</p>`;
      body += settingsTable(s.settings);
      for (const b of s.blocks || []) {
        if (b.type === '@app') {
          body += '<h4>App blocks</h4><p>Apps that support theme app extensions can add blocks here.</p>';
          continue;
        }
        if (b.type === '@theme') {
          body += '<h4>Theme blocks</h4><p>Add Group and Text blocks, or blocks from apps.</p>';
          continue;
        }
        body += `<h4>${esc(label(b.name))} block</h4>${settingsTable(b.settings)}`;
      }
      body += '</section>';
    }
    toc += '</ul></li>';
  }
  return `<h1>Sections and blocks</h1>
<p class="lead">Every section and block in Ironbench, with the same names you see in the theme editor. To open the editor, go to <strong>Online Store &gt; Themes</strong> and click <strong>Customize</strong>.</p>
<nav class="toc" aria-label="Sections on this page"><ul>${toc}</ul></nav>${body}`;
}

function themeSettingsPage() {
  let toc = '';
  let body = '';
  for (const g of schemas.settings) {
    if (g.name === 'theme_info') continue;
    toc += `<li><a href="#${slug(g.name)}">${esc(g.name)}</a></li>`;
    body += `<section class="ref" aria-labelledby="${slug(g.name)}"><h2 id="${slug(g.name)}">${esc(g.name)}</h2>`;
    const scheme = (g.settings || []).find((s) => s.type === 'color_scheme_group');
    if (scheme) {
      body += `<p>Ironbench ships with five color schemes per preset. Each scheme sets the colors below, and every section has a <strong>Color scheme</strong> setting to pick one.</p>`;
      body += `<div class="table-wrap"><table><thead><tr><th scope="col">Scheme color</th><th scope="col">Used for</th></tr></thead><tbody>${scheme.definition
        .map((d) => `<tr><th scope="row">${esc(d.label)}</th><td>${esc(SCHEME_USE[d.id] || '')}</td></tr>`)
        .join('')}</tbody></table></div>`;
      body += settingsTable(g.settings.filter((s) => s.type !== 'color_scheme_group'));
    } else {
      body += settingsTable(g.settings);
    }
    body += '</section>';
  }
  return `<h1>Theme settings</h1>
<p class="lead">Theme settings apply to the whole store. In the theme editor, click the gear icon <span aria-hidden="true">⚙</span> to open them.</p>
<nav class="toc" aria-label="Settings groups"><ul>${toc}</ul></nav>${body}`;
}

const SCHEME_USE = {
  background: 'Section background',
  text: 'Headings and body text',
  text_secondary: 'Secondary text such as vendors, SKUs, and helper text',
  border: 'Input borders and functional lines',
  hairline: 'Decorative grid lines on cards and tables',
  button: 'Primary button background',
  button_label: 'Primary button label',
  secondary_button: 'Secondary button background',
  secondary_button_label: 'Secondary button label',
  accent: 'Highlights such as volume price badges and the hero panel rule',
  accent_label: 'Text shown on accent backgrounds',
};

function readSrc(name) {
  const raw = fs.readFileSync(path.join(SRC, `${name}.html`), 'utf8');
  const m = raw.match(/^<!--\s*({[\s\S]*?})\s*-->\s*/);
  const meta = m ? JSON.parse(m[1]) : {};
  return { meta, html: raw.slice(m ? m[0].length : 0) };
}

function replaceTokens(html) {
  return html
    .replace(/{{version}}/g, esc(themeInfo.theme_version))
    .replace(/{{author}}/g, esc(themeInfo.theme_author))
    .replace(/{{form_action}}/g, esc(config.form_action))
    .replace(/{{site_url}}/g, esc(config.site_url));
}

function layout({ page, title, description, content }) {
  const nav = NAV.map(
    (g) => `<li><span class="nav__group">${esc(g.group)}</span><ul>${g.items
      .map(([href, text]) => `<li><a href="${href === 'index' ? './' : `${href}.html`}"${href === page ? ' aria-current="page"' : ''}>${esc(text)}</a></li>`)
      .join('')}</ul></li>`
  ).join('');
  const fullTitle = page === 'index' ? `Ironbench theme documentation` : `${title} · Ironbench theme documentation`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description || 'Documentation for Ironbench, the Shopify theme for hardware, tools, and industrial supply stores.')}">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,600;1,400&display=swap">
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<a class="skip-link" href="#content">Skip to content</a>
<header class="topbar">
  <a class="brand" href="./"><span class="brand__mark" aria-hidden="true"></span><span class="brand__name">Ironbench</span><span class="brand__tag">Docs</span></a>
  <span class="topbar__version mono">v${esc(themeInfo.theme_version)}</span>
  <a class="topbar__cta" href="support.html">Contact support</a>
</header>
<div class="shell">
  <details class="sidebar" id="sidebar" open>
    <summary class="sidebar__toggle">Menu</summary>
    <nav aria-label="Documentation"><ul class="nav">${nav}</ul></nav>
  </details>
  <main id="content" class="content" tabindex="-1">
${content}
    <footer class="page-footer">
      <p>Ironbench is a Shopify theme by ${esc(themeInfo.theme_author)}. Need help? <a href="support.html">Contact support</a>.</p>
    </footer>
  </main>
</div>
<script src="assets/site.js" defer></script>
</body>
</html>
`;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
for (const f of fs.readdirSync(path.join(SRC, 'assets'))) fs.copyFileSync(path.join(SRC, 'assets', f), path.join(OUT, 'assets', f));

const generated = {
  sections: { title: 'Sections and blocks', description: 'Reference for every section and block in the Ironbench theme.', html: sectionsPage() },
  'theme-settings': { title: 'Theme settings', description: 'Reference for every theme setting in Ironbench.', html: themeSettingsPage() },
};

const pages = fs.readdirSync(SRC).filter((f) => f.endsWith('.html')).map((f) => f.replace('.html', ''));
for (const page of [...pages, ...Object.keys(generated)]) {
  const { meta, html } = generated[page] ? { meta: generated[page], html: generated[page].html } : readSrc(page);
  fs.writeFileSync(path.join(OUT, `${page}.html`), layout({ page, title: meta.title, description: meta.description, content: replaceTokens(html) }));
}
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log(`Built ${pages.length + Object.keys(generated).length} pages into docs/`);

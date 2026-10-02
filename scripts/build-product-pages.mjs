#!/usr/bin/env node
// 商品ページ生成スクリプト
// Supabaseの「公開中の商品」から、日本語・英語の商品ページ(静的HTML)を作る。
//   日本語: products/<商品番号>.html     英語: en/products/<商品番号>.html
// 検索エンジン(Google)が読める形で、商品名・説明・価格・在庫・写真を最初からHTMLに書き込む。
// お客様が開いた時は、価格と在庫だけ最新の値をSupabaseから読み直して表示する(古い情報が見えないように)。
//
// 使い方(GitHubの自動実行がこれを呼ぶ):
//   node scripts/build-product-pages.mjs                 全商品を生成(Supabaseから取得)
//   node scripts/build-product-pages.mjs --data x.json   取得済みの商品データで生成(テスト用)
//   node scripts/build-product-pages.mjs --only 1253     その商品番号だけ生成(見本用)
//   node scripts/build-product-pages.mjs --noindex       検索に出さない設定(robots noindex)を付ける(見本用)
//   node scripts/build-product-pages.mjs --sitemap       sitemap.xml も作り直す
//   node scripts/build-product-pages.mjs --out <dir>     出力先(省略時はリポジトリの直下)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://saitofoods.com';
const SUPABASE_URL = 'https://sdjgmgyghnlpqydrnllj.supabase.co';
// 公開用キー(サイトの各ページにも書いてあるもの。読み取り専用の権限しかない)
const SUPABASE_KEY = 'sb_publishable_GzbK9P2cp7FPFxrnyBjVug_IMCbjOpk';
const LOGO = 'https://sdjgmgyghnlpqydrnllj.supabase.co/storage/v1/object/public/product-images/logo4.png';
const STORE_PHOTO = 'https://sdjgmgyghnlpqydrnllj.supabase.co/storage/v1/object/public/product-images/store-front.jpg';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(opt('--out') || ROOT);
const ONLY = opt('--only');
const NOINDEX = flag('--noindex');

// ---------------------------------------------------------------- データ取得
async function rest(pathAndQuery) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Range: `${from}-${from + 999}` },
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

async function loadData() {
  const file = opt('--data');
  if (file) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const products = await rest('products?select=*&is_published=eq.true&order=sort_order.asc');
  const categories = await rest('categories?select=id,name_ja,name_en');
  const links = await rest('product_categories?select=product_id,category_id');
  return { products, categories, links };
}

// ---------------------------------------------------------------- 部品
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonLd = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const money = (n) => { const v = Number(n); return Number.isInteger(v) ? String(v) : v.toFixed(2); };
const money2 = (n) => Number(n).toFixed(2);

// 商品名(英語)は「Okonomiyaki Sticks 6pcs / โอโคโนมิยากิสติ๊ก 6 ชิ้น =O-07」のように、
// タイ語と商品コードが付いている。英語ページ用には英語の部分だけを使う。
function cleanEnName(p) {
  let n = p.name_en || '';
  const t = n.search(/[฀-๿]/);
  if (t >= 0) n = n.slice(0, t).replace(/[\s/]+$/, '');
  n = n.replace(/\s*=\s*[A-Za-z0-9\-_.]+\s*$/, '').trim();
  return n || p.name_ja;
}

const effectivePrice = (p) => {
  const promo = p.promotion_price;
  return (p.is_monthly_promotion && promo !== null && promo !== undefined && Number(promo) < Number(p.price)) ? Number(promo) : Number(p.price);
};
const isAvailable = (p) => !!(p.is_unlimited_stock || (p.stock_qty && p.stock_qty > 0));
const maxQty = (p) => (p.is_unlimited_stock ? 999 : Math.max(0, p.stock_qty || 0));
const images = (p) => [p.image_url, p.image_url_2, p.image_url_3, p.image_url_4, p.image_url_5, p.image_url_6, p.image_url_7, p.image_url_8].filter(Boolean);
const oneLine = (s) => String(s || '').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------- 文言
const T = {
  ja: {
    htmlLang: 'ja', home: 'トップ', products: '商品一覧', mypage: 'マイページ', langLabel: 'EN',
    crumbHome: 'トップ', crumbProducts: '商品一覧',
    inStock: '在庫あり', outOfStock: '在庫なし', outOfStockBtn: '在庫なし',
    add: 'カートに入れる', added: 'カートに入れました', viewCart: 'カートを見る', maxed: 'これ以上は入れられません(在庫の上限)',
    qty: '数量', perUnit: '1パックの目安', weightNote: '※ 量り売りの商品です。ご注文後に重さを量って、金額を確定します。',
    excludedNote: '※ お届け先のエリアや建物によっては、ご注文いただけない場合があります。',
    unavailable: 'この商品は現在お取り扱いしておりません。', descTitle: '商品説明', descJaOnly: '',
    delivery: 'バンコク・シラチャ・パタヤへお届けします。', toList: '商品一覧に戻る',
    companyTitle: '会社情報・直売店のご案内', addressNote: '※ 直売店も同住所で営業しております。店頭でも商品をお買い求めいただけます。',
    terms: '利用規約', titleSuffix: 'サイトウフーズ Saito Foods — バンコクの日本食通販',
    tag: 'サイトウフーズ(バンコク)の日本食通販・宅配',
  },
  en: {
    htmlLang: 'en', home: 'Home', products: 'Products', mypage: 'My Page', langLabel: '日本語',
    crumbHome: 'Home', crumbProducts: 'Products',
    inStock: 'In stock', outOfStock: 'Out of stock', outOfStockBtn: 'Out of stock',
    add: 'Add to cart', added: 'Added to cart', viewCart: 'View cart', maxed: 'You have reached the stock limit.',
    qty: 'Quantity', perUnit: 'Approx. per pack', weightNote: '* Sold by weight. The final amount is confirmed after your order is weighed.',
    excludedNote: '* This item may not be available for some delivery areas or buildings.',
    unavailable: 'This item is currently unavailable.', descTitle: 'Description', descJaOnly: '(Description in Japanese)',
    delivery: 'We deliver to Bangkok, Sriracha and Pattaya.', toList: 'Back to products',
    companyTitle: 'Company & Store', addressNote: '* Our store is at the same address. You can also buy in person.',
    terms: 'Terms of Service', titleSuffix: 'Saito Foods — Japanese food delivery in Bangkok',
    tag: 'Japanese food delivery in Bangkok by Saito Foods',
  },
};

// ---------------------------------------------------------------- ページ生成
function buildPage(p, lang, cats) {
  const t = T[lang];
  const id = p.legacy_product_id;
  const urlJa = `${SITE}/products/${id}.html`;
  const urlEn = `${SITE}/en/products/${id}.html`;
  const url = lang === 'ja' ? urlJa : urlEn;
  const name = lang === 'ja' ? p.name_ja : cleanEnName(p);
  const subName = lang === 'ja' ? cleanEnName(p) : p.name_ja;
  const hasEnDesc = !!(p.description_en && p.description_en.trim());
  const desc = lang === 'en' && hasEnDesc ? p.description_en : p.description_ja;
  const descNote = lang === 'en' && !hasEnDesc ? t.descJaOnly : '';
  const imgs = images(p);
  const main = imgs[0] || '';
  const eff = effectivePrice(p);
  const isWeight = p.sale_type === 'weight';
  const hasDiscount = !isWeight && eff < Number(p.price);
  const avail = isAvailable(p);
  const catName = cats.length ? (lang === 'ja' ? cats[0].name_ja : (cats[0].name_en || cats[0].name_ja)) : '';
  const metaDesc = oneLine(`${name}。${desc}`).slice(0, 120);
  const title = `${name} | ${t.titleSuffix}`;
  const showExcluded = (p.excluded_areas && p.excluded_areas.length) || (p.excluded_condos && p.excluded_condos.length);

  const priceHtml = isWeight
    ? `฿${money(p.unit_price)} <small>/ ${esc(p.unit_label || '')}</small>`
    : (hasDiscount ? `<s>฿${money(p.price)}</s> ฿${money(eff)}` : `฿${money(eff)}`);

  const product = {
    '@context': 'https://schema.org', '@type': 'Product',
    name, sku: String(id), url,
    image: imgs, description: oneLine(desc).slice(0, 5000),
    ...(catName ? { category: catName } : {}),
    offers: {
      '@type': 'Offer', url, priceCurrency: 'THB', price: money2(isWeight ? p.price : eff),
      availability: avail ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'SAITO FOODS CO.,LTD.' },
    },
  };
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t.crumbHome, item: lang === 'ja' ? `${SITE}/` : `${SITE}/`},
      { '@type': 'ListItem', position: 2, name: t.crumbProducts, item: `${SITE}/product_list.html` },
      { '@type': 'ListItem', position: 3, name, item: url },
    ],
  };

  const thumbs = imgs.length > 1
    ? `<div class="thumbs">${imgs.map((src, i) => `<button type="button" class="thumb${i === 0 ? ' on' : ''}" onclick="showImg(${i})" aria-label="${i + 1}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}</div>`
    : '';

  const clientCfg = {
    id: p.id, lang, max: maxQty(p), price: Number(p.price), unitPrice: p.unit_price === null ? null : Number(p.unit_price),
    unitLabel: p.unit_label || '', weight: isWeight, images: imgs,
    t: { inStock: t.inStock, outOfStock: t.outOfStock, add: t.add, added: t.added, maxed: t.maxed, unavailable: t.unavailable },
  };

  return `<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(metaDesc)}">
${NOINDEX ? '<meta name="robots" content="noindex, nofollow">\n' : ''}<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="ja" href="${urlJa}">
<link rel="alternate" hreflang="en" href="${urlEn}">
<link rel="alternate" hreflang="x-default" href="${urlJa}">
<link rel="icon" type="image/png" href="https://sdjgmgyghnlpqydrnllj.supabase.co/storage/v1/object/public/product-images/logo1.png">
<meta property="og:type" content="product">
<meta property="og:site_name" content="サイトウフーズ / Saito Foods">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:url" content="${url}">
${main ? `<meta property="og:image" content="${esc(main)}">\n` : ''}<meta property="og:locale" content="${lang === 'ja' ? 'ja_JP' : 'en_US'}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${jsonLd(product)}</script>
<script type="application/ld+json">${jsonLd(crumbs)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;800&family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  :root { --brand:#F5A93C; --brand-dark:#C97A1F; --accent:#FFD166; --cream:#FFF9EC; --ink:#3A2E1F; --line:#F0DFB8; --line-soft:#FBF1DC; --red:#C5533F; --shadow-sm:0 2px 8px rgba(58,46,31,.07); }
  * { box-sizing:border-box; margin:0; padding:0; }
  html, body { overflow-x:clip; width:100%; }
  img { max-width:100%; height:auto; }
  body { font-family:'Noto Sans JP','Sarabun',sans-serif; color:var(--ink); font-size:15px; background:var(--cream); }
  a { color:inherit; }
  .app-shell { max-width:1100px; margin:0 auto; background:var(--cream); min-height:100vh; box-shadow:0 0 40px rgba(0,0,0,.06); }
  .site-header { background:linear-gradient(135deg,#FFCB4D 0%,var(--brand) 100%); position:sticky; top:0; z-index:25; border-bottom:2px solid var(--brand-dark); }
  .site-header-inner { display:flex; align-items:center; gap:20px; padding:10px 20px; }
  .site-logo-mark { flex-shrink:0; display:flex; align-items:center; }
  .site-logo-mark img { height:56px; width:auto; display:block; }
  .site-nav { display:flex; gap:16px; font-size:12.5px; font-weight:600; flex:1; }
  .site-nav a { color:#fff; text-decoration:none; opacity:.85; }
  .site-nav a.active { opacity:1; text-decoration:underline; }
  .site-cart-btn { background:#fff; color:var(--brand-dark); font-weight:700; border-radius:24px; padding:8px 16px; font-size:13px; text-decoration:none; display:flex; align-items:center; gap:6px; flex-shrink:0; }
  .site-lang-btn { background:#fff; color:var(--brand-dark); font-weight:800; border:none; border-radius:20px; padding:7px 14px; font-size:12px; text-decoration:none; flex-shrink:0; }
  @media (max-width:760px) {
    .site-header-inner { flex-wrap:wrap; gap:10px; padding:10px 16px; }
    .site-lang-btn { order:2; } .site-cart-btn { order:2; margin-left:auto; }
    .site-nav { order:3; flex:1 1 100%; overflow-x:auto; white-space:nowrap; gap:14px; scrollbar-width:none; }
    .site-nav::-webkit-scrollbar { display:none; }
  }
  .crumbs { font-size:12px; color:#7a6a55; padding:12px 20px 0; }
  .crumbs a { color:var(--brand-dark); text-decoration:none; }
  .crumbs a:hover { text-decoration:underline; }
  .product { display:flex; gap:28px; padding:16px 20px 8px; align-items:flex-start; }
  .gallery { flex:0 0 46%; max-width:46%; }
  .main-img { width:100%; aspect-ratio:1/1; background:#fff; border:1px solid var(--line); border-radius:16px; overflow:hidden; display:flex; align-items:center; justify-content:center; font-size:64px; }
  .main-img img { width:100%; height:100%; object-fit:cover; display:block; }
  .thumbs { display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; }
  .thumb { width:62px; height:62px; border:2px solid var(--line); border-radius:10px; overflow:hidden; background:#fff; cursor:pointer; padding:0; }
  .thumb.on { border-color:var(--brand); }
  .thumb img { width:100%; height:100%; object-fit:cover; display:block; }
  .info { flex:1; min-width:0; }
  h1 { font-size:22px; line-height:1.5; font-weight:800; }
  .subname { font-size:13px; color:#8a7a65; margin-top:4px; word-break:break-word; }
  .price { font-size:28px; font-weight:800; color:var(--brand-dark); margin-top:14px; }
  .price small { font-size:14px; font-weight:700; color:#7a6a55; }
  .price s { font-size:16px; color:#999; font-weight:600; margin-right:6px; }
  .perunit { font-size:12.5px; color:#7a6a55; margin-top:2px; }
  .stock { display:inline-block; margin-top:10px; font-size:12.5px; font-weight:700; padding:3px 12px; border-radius:14px; background:#E7F4E4; color:#2E6B2A; }
  .stock.out { background:#F6E3E0; color:#9B2C2C; }
  .buy { display:flex; gap:12px; align-items:center; margin-top:18px; flex-wrap:wrap; }
  .stepper { display:flex; align-items:center; border:1.5px solid var(--line); border-radius:24px; background:#fff; overflow:hidden; }
  .stepper button { width:42px; height:42px; border:none; background:none; font-size:20px; font-weight:700; color:var(--brand-dark); cursor:pointer; }
  .stepper span { min-width:34px; text-align:center; font-weight:800; }
  .add-btn { flex:1; min-width:180px; height:46px; border:none; border-radius:24px; background:var(--brand); color:#fff; font-size:15px; font-weight:800; cursor:pointer; border-bottom:3px solid var(--brand-dark); font-family:inherit; }
  .add-btn:disabled { background:#cfc6b8; border-bottom-color:#b8ae9f; cursor:not-allowed; }
  .note { font-size:12px; color:#7a6a55; margin-top:10px; line-height:1.7; }
  .added { display:none; margin-top:12px; font-size:13.5px; font-weight:700; color:#2E6B2A; }
  .added.show { display:block; }
  .added a { color:var(--brand-dark); margin-left:8px; }
  .desc-card { background:#fff; border:1px solid var(--line-soft); border-radius:14px; padding:18px 20px; margin:12px 20px 0; }
  .desc-card h2 { font-size:14px; color:var(--brand-dark); font-weight:800; margin-bottom:8px; }
  .desc-card p { white-space:pre-line; line-height:1.9; font-size:14.5px; }
  .desc-card .jaonly { font-size:12px; color:#8a7a65; margin-bottom:6px; }
  .back { margin:18px 20px 0; }
  .back a { color:var(--brand-dark); font-weight:700; text-decoration:none; font-size:14px; }
  .site-footer { background:#fff; border-top:2px solid var(--line); padding:24px 20px 18px; margin-top:28px; font-size:12.5px; color:#666; }
  .footer-social { display:flex; gap:10px; margin-bottom:16px; }
  .footer-social a { width:36px; height:36px; border-radius:50%; background:var(--brand); color:#fff; display:flex; align-items:center; justify-content:center; text-decoration:none; font-weight:800; font-size:14px; }
  .site-footer h3 { font-size:12px; font-weight:800; color:var(--brand-dark); margin-bottom:6px; }
  .site-footer p { line-height:1.9; }
  .site-footer a { color:var(--brand-dark); }
  .footer-photo { width:150px; aspect-ratio:4/3; border-radius:10px; border:1px solid var(--line-soft); object-fit:cover; display:block; margin-bottom:10px; }
  .footer-copy { text-align:center; color:#999; font-size:11px; margin-top:14px; padding-top:14px; border-top:1px solid var(--line-soft); }
  @media (max-width:760px) {
    .product { flex-direction:column; gap:16px; padding:12px 16px 4px; }
    .gallery { flex:none; max-width:100%; width:100%; }
    h1 { font-size:19px; } .price { font-size:25px; }
    .crumbs { padding:10px 16px 0; } .desc-card { margin:12px 16px 0; } .back { margin:16px 16px 0; }
  }
</style>
</head>
<body>
<div class="app-shell">
<header class="site-header">
  <div class="site-header-inner">
    <a href="/index.html" class="site-logo-mark"><img src="${LOGO}" alt="サイトウフーズ SAITO FOODS CO.,LTD."></a>
    <nav class="site-nav">
      <a href="/index.html">${t.home}</a>
      <a href="/product_list.html" class="active">${t.products}</a>
      <a href="/mypage.html">${t.mypage}</a>
    </nav>
    <a class="site-lang-btn" href="${lang === 'ja' ? urlEn : urlJa}" hreflang="${lang === 'ja' ? 'en' : 'ja'}" onclick="try{localStorage.setItem('saitofoods_lang','${lang === 'ja' ? 'en' : 'ja'}')}catch(e){}">${t.langLabel}</a>
    <a class="site-cart-btn" href="/cart.html">🛒 <span id="header-cart-count">0</span></a>
  </div>
</header>

<nav class="crumbs" aria-label="breadcrumb"><a href="/index.html">${t.crumbHome}</a> › <a href="/product_list.html">${t.crumbProducts}</a> › ${esc(name)}</nav>

<main>
<section class="product">
  <div class="gallery">
    <div class="main-img" id="main-img">${main ? `<img src="${esc(main)}" alt="${esc(name)}" id="main-img-el">` : '🍱'}</div>
    ${thumbs}
  </div>
  <div class="info">
    <h1>${esc(name)}</h1>
    ${subName && subName !== name ? `<div class="subname">${esc(subName)}</div>` : ''}
    <div class="price" id="price">${priceHtml}</div>
    ${isWeight ? `<div class="perunit">${t.perUnit}: ฿${money(p.price)}</div>` : ''}
    <div class="stock${avail ? '' : ' out'}" id="stock">${avail ? t.inStock : t.outOfStock}</div>
    <div class="buy">
      <div class="stepper" id="stepper"${avail ? '' : ' style="display:none"'}>
        <button type="button" onclick="chg(-1)" aria-label="-">−</button><span id="qty">1</span><button type="button" onclick="chg(1)" aria-label="+">+</button>
      </div>
      <button type="button" class="add-btn" id="add-btn" onclick="addToCart()"${avail ? '' : ' disabled'}>${avail ? t.add : t.outOfStockBtn}</button>
    </div>
    <div class="added" id="added">${t.added}<a href="/cart.html">${t.viewCart} ›</a></div>
    ${isWeight ? `<div class="note">${t.weightNote}</div>` : ''}
    ${showExcluded ? `<div class="note">${t.excludedNote}</div>` : ''}
    <div class="note">${t.delivery}</div>
  </div>
</section>

<section class="desc-card">
  <h2>${t.descTitle}</h2>
  ${descNote ? `<div class="jaonly">${descNote}</div>` : ''}
  <p>${esc(desc)}</p>
</section>

<div class="back"><a href="/product_list.html">‹ ${t.toList}</a></div>
</main>

<footer class="site-footer">
  <div class="footer-social">
    <a href="https://x.com/SaitoFoods" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">𝕏</a>
    <a href="https://www.instagram.com/saito_foods/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">📷</a>
  </div>
  <h3>${t.companyTitle}</h3>
  <img class="footer-photo" src="${STORE_PHOTO}" alt="サイトウフーズ直売店" loading="lazy">
  <p>
    SAITO FOODS CO.,LTD.<br>
    23/7 Soi Naphasub Yeak 2, Sukhumvit Soi 36,<br>
    Klongtoey, Bangkok 10110<br>
    TEL: 02-258-9878 / 06-5618-9906<br>
    Email: <a href="mailto:orders@saitofoods.com">orders@saitofoods.com</a><br>
    ${t.addressNote}<br>
    <a href="/terms.html">${t.terms}</a>
  </p>
  <div class="footer-copy">© ${new Date().getFullYear()} SAITO FOODS CO.,LTD. All rights reserved.</div>
</footer>
</div>

<script>
(function () {
  var P = ${jsonLd(clientCfg)};
  var SB = ${JSON.stringify(SUPABASE_URL)}, KEY = ${JSON.stringify(SUPABASE_KEY)};
  var qty = 1;
  ${lang === 'en' ? "try { if (!localStorage.getItem('saitofoods_lang')) localStorage.setItem('saitofoods_lang', 'en'); } catch (e) {}" : ''}

  function readCart() { try { return JSON.parse(localStorage.getItem('saitofoods_cart') || '{}') || {}; } catch (e) { return {}; } }
  function cartCount() { var c = readCart(), n = 0; for (var k in c) n += Number(c[k]) || 0; return n; }
  function refreshCount() { document.getElementById('header-cart-count').textContent = cartCount(); }
  function money(n) { n = Number(n); return n % 1 === 0 ? String(n) : n.toFixed(2); }

  window.showImg = function (i) {
    var el = document.getElementById('main-img-el');
    if (el && P.images[i]) el.src = P.images[i];
    var ts = document.querySelectorAll('.thumb');
    for (var j = 0; j < ts.length; j++) ts[j].classList.toggle('on', j === i);
  };
  window.chg = function (d) {
    qty = Math.max(1, Math.min(P.max || 1, qty + d));
    document.getElementById('qty').textContent = qty;
  };
  window.addToCart = function () {
    if (P.max <= 0) return;
    var c = readCart();
    var cur = Number(c[P.id]) || 0;
    if (cur >= P.max) { alert(P.t.maxed); return; }
    c[P.id] = Math.min(P.max, cur + qty);
    try { localStorage.setItem('saitofoods_cart', JSON.stringify(c)); } catch (e) {}
    refreshCount();
    document.getElementById('added').classList.add('show');
  };

  // 価格と在庫だけ最新の値を読み直す(取得できなければ、ページに書いてある値のまま)
  function apply(r) {
    P.max = r.is_unlimited_stock ? 999 : Math.max(0, r.stock_qty || 0);
    var price = Number(r.price), promo = r.promotion_price;
    var eff = (r.is_monthly_promotion && promo !== null && promo !== undefined && Number(promo) < price) ? Number(promo) : price;
    var el = document.getElementById('price');
    if (P.weight) el.innerHTML = '฿' + money(r.unit_price) + ' <small>/ ' + P.unitLabel + '</small>';
    else el.innerHTML = (eff < price ? '<s>฿' + money(price) + '</s> ' : '') + '฿' + money(eff);
    var avail = r.is_published !== false && P.max > 0;
    var st = document.getElementById('stock'), btn = document.getElementById('add-btn');
    st.textContent = r.is_published === false ? P.t.unavailable : (avail ? P.t.inStock : P.t.outOfStock);
    st.className = 'stock' + (avail ? '' : ' out');
    btn.disabled = !avail;
    btn.textContent = avail ? P.t.add : P.t.outOfStock;
    document.getElementById('stepper').style.display = avail ? '' : 'none';
    if (qty > P.max) { qty = Math.max(1, P.max); document.getElementById('qty').textContent = qty; }
  }
  refreshCount();
  try {
    fetch(SB + '/rest/v1/products?id=eq.' + encodeURIComponent(P.id) + '&select=price,unit_price,promotion_price,is_monthly_promotion,stock_qty,is_unlimited_stock,is_published&limit=1',
      { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })
      .then(function (res) { return res.ok ? res.json() : []; })
      .then(function (rows) { if (rows && rows[0]) apply(rows[0]); })
      .catch(function () {});
  } catch (e) {}
})();
</script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- サイトマップ
const STATIC_PAGES = [
  { loc: `${SITE}/index.html`, changefreq: 'daily', priority: '1.0' },
  { loc: `${SITE}/product_list.html`, changefreq: 'daily', priority: '0.9' },
  { loc: `${SITE}/user_guide.html`, changefreq: 'monthly', priority: '0.6' },
];
function buildSitemap(ids) {
  const urls = [...STATIC_PAGES];
  ids.forEach((id) => {
    urls.push({ loc: `${SITE}/products/${id}.html`, changefreq: 'weekly', priority: '0.7', alt: `${SITE}/en/products/${id}.html` });
  });
  const body = urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n');
  const body2 = ids.map((id) => `  <url>\n    <loc>${SITE}/en/products/${id}.html</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}${body2 ? '\n' + body2 : ''}\n</urlset>\n`;
}

// ---------------------------------------------------------------- 実行
async function main() {
  const { products, categories, links } = await loadData();
  const catById = new Map(categories.map((c) => [c.id, c]));
  const catsOf = new Map();
  links.forEach((l) => { const c = catById.get(l.category_id); if (!c) return; if (!catsOf.has(l.product_id)) catsOf.set(l.product_id, []); catsOf.get(l.product_id).push(c); });

  // ページを作る商品: 公開中・商品番号あり・日本語の説明文あり(説明のない商品は作らない)
  const seen = new Set();
  const targets = [];
  let skippedNoDesc = 0;
  for (const p of products) {
    if (!p.is_published || !Number.isInteger(p.legacy_product_id)) continue;
    if (!p.description_ja || !p.description_ja.trim()) { skippedNoDesc++; continue; }
    if (seen.has(p.legacy_product_id)) { console.warn(`商品番号が重複: ${p.legacy_product_id} (2件目を除外)`); continue; }
    seen.add(p.legacy_product_id);
    if (ONLY && String(p.legacy_product_id) !== String(ONLY)) continue;
    targets.push(p);
  }

  const dirJa = path.join(OUT, 'products');
  const dirEn = path.join(OUT, 'en', 'products');
  // この2つのフォルダは自動生成専用。作り直す前に空にして、非公開になった商品のページを残さない。
  // (見本を1件だけ作る --only の時は、他のページを消さない)
  for (const d of [dirJa, dirEn]) {
    fs.mkdirSync(d, { recursive: true });
    if (!ONLY) for (const f of fs.readdirSync(d)) if (f.endsWith('.html')) fs.unlinkSync(path.join(d, f));
  }
  for (const p of targets) {
    const cats = catsOf.get(p.id) || [];
    fs.writeFileSync(path.join(dirJa, `${p.legacy_product_id}.html`), buildPage(p, 'ja', cats));
    fs.writeFileSync(path.join(dirEn, `${p.legacy_product_id}.html`), buildPage(p, 'en', cats));
  }
  if (flag('--sitemap')) fs.writeFileSync(path.join(OUT, 'sitemap.xml'), buildSitemap(targets.map((p) => p.legacy_product_id)));
  console.log(`商品ページを ${targets.length} 件(日本語・英語)作りました。説明文がなく除外: ${skippedNoDesc} 件`);
}

main().catch((e) => { console.error(e); process.exit(1); });

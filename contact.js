// お問い合わせフォーム(左メニューの一番下に「お問い合わせ」リンクを追加し、押すとフォームを開く)
// index.html と product_list.html から読み込む。
//  - ログインしている人: メールアドレスが最初から入る(supabase-js が保存したログイン情報から読む)
//  - ログインしていない人: メールアドレスの入力が必須
//  - 送信先 orders@saitofoods.com はGAS側で固定(ここでは指定しない)
(function () {
  'use strict';

  var GAS_URL = 'https://script.google.com/macros/s/AKfycbwhV5IKDbadgS7-nAEo8At2sc6KlFLhDUtckURVUNOUsuHZy76NZQF7LzKxRnOJ1gc/exec';
  var AUTH_KEY = 'sb-sdjgmgyghnlpqydrnllj-auth-token'; // supabase-js が保存するログイン情報のキー
  var COOLDOWN_MS = 30000; // 連続送信の防止(同じ端末から30秒は送れない)

  var TEXT = {
    ja: {
      link: 'お問い合わせ', title: 'お問い合わせ',
      lead: 'ご質問・ご要望などをお送りください。担当者がメールでご返信します。',
      name: 'お名前', subject: '件名', email: 'メールアドレス', emailNote: 'ご返信先です。',
      message: 'お問い合わせ内容', messagePh: 'こちらにご記入ください',
      send: '送信する', sending: '送信中…', close: '閉じる',
      done: '送信しました。ありがとうございます。担当者からのご返信をお待ちください。',
      errName: 'お名前を入力してください。',
      errSubject: '件名を入力してください。',
      errEmail: 'メールアドレスを正しく入力してください。',
      errMessage: 'お問い合わせ内容を入力してください。',
      errCooldown: '続けて送信できません。少し時間を空けてお試しください。',
      errSend: '送信できませんでした。時間をおいて、もう一度お試しください。',
      errNet: '通信に失敗しました。接続を確認して、もう一度お試しください。'
    },
    en: {
      link: 'Contact us', title: 'Contact us',
      lead: 'Send us your questions or requests. We will reply by email.',
      name: 'Name', subject: 'Subject', email: 'Email address', emailNote: 'We will reply to this address.',
      message: 'Message', messagePh: 'Please write your message here',
      send: 'Send', sending: 'Sending…', close: 'Close',
      done: 'Sent. Thank you. We will reply by email.',
      errName: 'Please enter your name.',
      errSubject: 'Please enter a subject.',
      errEmail: 'Please enter a valid email address.',
      errMessage: 'Please enter your message.',
      errCooldown: 'Please wait a moment before sending again.',
      errSend: 'We could not send your message. Please try again later.',
      errNet: 'Network error. Please check your connection and try again.'
    }
  };

  function lang() {
    try { return localStorage.getItem('saitofoods_lang') === 'en' ? 'en' : 'ja'; } catch (e) { return 'ja'; }
  }
  function t(key) { return TEXT[lang()][key]; }

  // ログインしている人のメールアドレス(ログインしていなければ空文字)
  function loggedInEmail() {
    try {
      var raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return '';
      var s = JSON.parse(raw);
      var user = s && (s.user || (s.currentSession && s.currentSession.user));
      return (user && typeof user.email === 'string') ? user.email : '';
    } catch (e) { return ''; }
  }

  // ログイン中のお客様の登録名(姓 名)を取得する。取得できなければ空文字(その場合は自分で入力してもらう)
  var SUPABASE_URL = 'https://sdjgmgyghnlpqydrnllj.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_GzbK9P2cp7FPFxrnyBjVug_IMCbjOpk'; // 公開用キー(各ページにも書いてあるもの)
  function loggedInSession() {
    try {
      var s = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
      return (s && s.user && s.access_token) ? s : null;
    } catch (e) { return null; }
  }
  function fetchLoggedInName() {
    var sess = loggedInSession();
    if (!sess) return Promise.resolve('');
    return fetch(SUPABASE_URL + '/rest/v1/customers?auth_user_id=eq.' + encodeURIComponent(sess.user.id) + '&select=family_name,first_name&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + sess.access_token }
    }).then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        var c = rows && rows[0];
        return c ? ((c.family_name || '') + ' ' + (c.first_name || '')).trim() : '';
      })
      .catch(function () { return ''; });
  }

  var css = [
    '.sidebar-contact { display:block; padding:10px 20px; font-size:13px; font-weight:800; color:var(--brand-dark,#C97A1F); text-decoration:none; border-top:1px solid var(--line,#F0DFB8); margin-top:6px; }',
    '.sidebar-contact:hover { background:#fff; }',
    '@media (max-width:760px) { .sidebar-contact { display:inline-block; margin:8px 16px 0; padding:8px 16px; border:1.5px solid var(--line,#F0DFB8); border-radius:20px; background:#fff; } }',
    '.ct-overlay { position:fixed; inset:0; background:rgba(58,46,31,.55); z-index:1000; display:flex; align-items:center; justify-content:center; padding:16px; }',
    '.ct-overlay[hidden] { display:none; }',
    '.ct-box { background:#fff; border-radius:16px; width:100%; max-width:480px; max-height:100%; overflow-y:auto; padding:22px 20px; box-shadow:0 12px 40px rgba(0,0,0,.25); color:#3A2E1F; font-family:inherit; }',
    '.ct-box h2 { font-size:18px; margin:0 0 6px; }',
    '.ct-lead { font-size:13px; margin:0 0 14px; color:#5a4a35; }',
    '.ct-box label { display:block; font-size:13px; font-weight:700; margin:12px 0 4px; }',
    '.ct-note { font-size:11px; font-weight:400; color:#8a7a65; margin-left:6px; }',
    '.ct-box input[type=text], .ct-box input[type=email], .ct-box textarea { width:100%; font:inherit; font-size:16px; padding:10px 12px; border:1.5px solid #F0DFB8; border-radius:10px; background:#FFFDF7; color:#3A2E1F; }',
    '.ct-box textarea { min-height:140px; resize:vertical; }',
    '.ct-box input:focus, .ct-box textarea:focus { outline:2px solid #F5A93C; outline-offset:1px; }',
    '.ct-hp { position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden; }',
    '.ct-msg { font-size:13px; font-weight:700; margin-top:12px; min-height:1.2em; }',
    '.ct-msg.err { color:#C5533F; } .ct-msg.ok { color:#2E7D32; }',
    '.ct-actions { display:flex; gap:10px; margin-top:14px; }',
    '.ct-actions button { font:inherit; font-weight:800; font-size:14px; border-radius:24px; padding:11px 22px; cursor:pointer; border:none; }',
    '.ct-send { background:#F5A93C; color:#fff; border-bottom:3px solid #C97A1F !important; flex:1; }',
    '.ct-send:disabled { opacity:.6; cursor:default; }',
    '.ct-close { background:#fff; color:#C97A1F; border:1.5px solid #F0DFB8 !important; }'
  ].join('\n');

  var overlay = null, linkEl = null, lastFocus = null;

  function buildModal() {
    overlay = document.createElement('div');
    overlay.className = 'ct-overlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="ct-box" role="dialog" aria-modal="true" aria-labelledby="ct-title">' +
        '<h2 id="ct-title"></h2><p class="ct-lead" id="ct-lead"></p>' +
        '<form id="ct-form" novalidate>' +
          '<label for="ct-name" id="ct-name-l"></label>' +
          '<input type="text" id="ct-name" maxlength="100" autocomplete="name" required>' +
          '<label for="ct-email"><span id="ct-email-l"></span><span class="ct-note" id="ct-email-n"></span></label>' +
          '<input type="email" id="ct-email" maxlength="254" autocomplete="email" required>' +
          '<label for="ct-subject" id="ct-subject-l"></label>' +
          '<input type="text" id="ct-subject" maxlength="100" required>' +
          '<label for="ct-message" id="ct-message-l"></label>' +
          '<textarea id="ct-message" maxlength="2000" required></textarea>' +
          '<div class="ct-hp" aria-hidden="true"><label>Website<input type="text" id="ct-hp" tabindex="-1" autocomplete="off"></label></div>' +
          '<div class="ct-msg" id="ct-msg" role="status" aria-live="polite"></div>' +
          '<div class="ct-actions"><button type="submit" class="ct-send" id="ct-send"></button>' +
          '<button type="button" class="ct-close" id="ct-close"></button></div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    document.getElementById('ct-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !overlay.hidden) closeModal(); });
    document.getElementById('ct-form').addEventListener('submit', onSubmit);
  }

  function applyTexts() {
    document.getElementById('ct-title').textContent = t('title');
    document.getElementById('ct-lead').textContent = t('lead');
    document.getElementById('ct-name-l').textContent = t('name');
    document.getElementById('ct-email-l').textContent = t('email');
    document.getElementById('ct-email-n').textContent = t('emailNote');
    document.getElementById('ct-subject-l').textContent = t('subject');
    document.getElementById('ct-message-l').textContent = t('message');
    document.getElementById('ct-message').placeholder = t('messagePh');
    document.getElementById('ct-send').textContent = t('send');
    document.getElementById('ct-close').textContent = t('close');
    if (linkEl) linkEl.textContent = t('link');
  }

  function setMsg(text, kind) {
    var el = document.getElementById('ct-msg');
    el.textContent = text || '';
    el.className = 'ct-msg' + (kind ? ' ' + kind : '');
  }

  function openModal(e) {
    if (e) e.preventDefault();
    if (!overlay) buildModal();
    applyTexts();
    lastFocus = document.activeElement;
    var emailInput = document.getElementById('ct-email');
    var known = loggedInEmail();
    if (known && !emailInput.value) emailInput.value = known; // ログイン中は最初から入れる
    var nameInput = document.getElementById('ct-name');
    if (known && !nameInput.value) {
      fetchLoggedInName().then(function (n) { if (n && !nameInput.value) nameInput.value = n; }); // 登録名も入れる
    }
    setMsg('');
    document.getElementById('ct-send').disabled = false;
    overlay.hidden = false;
    document.getElementById(emailInput.value ? 'ct-subject' : 'ct-name').focus();
  }

  function closeModal() {
    if (!overlay) return;
    overlay.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  var EMAIL_RE = /^[^\s@<>",;:]+@[^\s@<>",;:]+\.[^\s@<>",;:]{2,}$/;

  function onSubmit(e) {
    e.preventDefault();
    var name = document.getElementById('ct-name').value.trim();
    var email = document.getElementById('ct-email').value.trim();
    var subject = document.getElementById('ct-subject').value.trim();
    var message = document.getElementById('ct-message').value.trim();
    if (!name) { setMsg(t('errName'), 'err'); document.getElementById('ct-name').focus(); return; }
    if (!EMAIL_RE.test(email)) { setMsg(t('errEmail'), 'err'); document.getElementById('ct-email').focus(); return; }
    if (!subject) { setMsg(t('errSubject'), 'err'); document.getElementById('ct-subject').focus(); return; }
    if (!message) { setMsg(t('errMessage'), 'err'); document.getElementById('ct-message').focus(); return; }

    try {
      var last = Number(localStorage.getItem('saitofoods_contact_last') || 0);
      if (Date.now() - last < COOLDOWN_MS) { setMsg(t('errCooldown'), 'err'); return; }
    } catch (err) { /* 保存できない環境でも送信は続ける */ }

    var btn = document.getElementById('ct-send');
    btn.disabled = true;
    btn.textContent = t('sending');
    setMsg('');

    var payload = {
      action: 'sendContact',
      name: name,
      email: email,
      subject: subject,
      message: message,
      lang: lang(),
      page: location.pathname,
      hp: document.getElementById('ct-hp').value
    };

    // GASへはContent-Typeを付けずに送る(他のページと同じ方式。事前確認の通信が不要になる)
    fetch(GAS_URL, { method: 'POST', body: JSON.stringify(payload) })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        btn.textContent = t('send');
        if (json && json.status === 'ok') {
          try { localStorage.setItem('saitofoods_contact_last', String(Date.now())); } catch (err) {}
          document.getElementById('ct-subject').value = '';
          document.getElementById('ct-message').value = '';
          setMsg(t('done'), 'ok');
          btn.disabled = true; // 送信済み。続けて送れないように、閉じて開き直すまで押せなくする
          return;
        }
        btn.disabled = false;
        var code = json && json.code;
        if (code === 'bad_email') setMsg(t('errEmail'), 'err');
        else if (code === 'empty_message') setMsg(t('errMessage'), 'err');
        else if (code === 'too_fast' || code === 'limit') setMsg(t('errCooldown'), 'err');
        else setMsg(t('errSend'), 'err');
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = t('send');
        setMsg(t('errNet'), 'err');
      });
  }

  function init() {
    var aside = document.querySelector('.sidebar-categories');
    if (!aside) return;
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    linkEl = document.createElement('a');
    linkEl.href = '#contact';
    linkEl.className = 'sidebar-contact';
    linkEl.textContent = t('link');
    linkEl.addEventListener('click', openModal);
    aside.appendChild(linkEl); // カテゴリ一覧(JSが後から書き換える部分)の外に置く。左メニューの一番下
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

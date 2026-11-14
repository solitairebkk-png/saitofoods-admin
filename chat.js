/* サイトウフーズ スタッフ用グループチャット(orders.html と delivery.html で共用)
 *
 * 使い方: StaffChat.mount({ client, container, isVisible, onUnread })
 *   client      : Supabaseクライアント(ログイン済み)
 *   container   : チャットを描画する要素(高さは呼び出し側で決める)
 *   isVisible   : いま画面に見えているか(見えている間に届いた分は「既読」にする)
 *   onUnread    : ({unread, mentions}) 未読件数が変わるたびに呼ばれる
 * 権限は DB 側(RLS)で制御: 配送アプリを使える人(customers.role が driver/staff/admin)だけが読み書きできる。
 * 発言者はアカウントではなく「あなたは誰?」で選んだスタッフ名(アカウントは共有のため)。
 */
(function () {
  'use strict';

  var STAFF_KEY = 'delivery-staff-id';        // 配送アプリと共通(どちらで選んでも同じ人として扱う)
  var SEEN_KEY = 'staffchat-last-seen';
  var BUCKET = 'chat-files';
  var PAGE = 100;
  var IMG_EDGE = 1600;                        // 写真は長辺をこのpxまで縮小してから送る(速く送れる)
  var MAX_BYTES = 25 * 1024 * 1024;           // DB側(バケット)の上限と同じ。業務データと容量を共有するため大きくしすぎない
  var SIGN_SECS = 1800;                       // ファイルを開くための一時URLの有効期間(30分)
  var TZ = 'Asia/Bangkok';
  // その場で表示してよい種類(写真・動画・音声)。それ以外のファイルは「ダウンロード扱い」でしか開かせない
  // (HTML等がブラウザ上で実行されるのを防ぐ)。保存先のバケットも同じ種類しか受け付けない。
  function inlineKind(t) {
    t = String(t || '');
    if (/^image\/(jpeg|png|webp|gif)$/.test(t)) return 'img';
    if (/^video\/(mp4|quicktime|webm)$/.test(t)) return 'video';
    if (/^audio\/(mpeg|mp4|aac|wav|webm)$/.test(t)) return 'audio';
    return '';
  }
  var ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
    'video/mp4', 'video/quicktime', 'video/webm',
    'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/webm',
    'application/pdf', 'text/plain', 'text/csv', 'application/zip',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  var CSS = [
    '.sc-root{position:relative;display:flex;flex-direction:column;height:100%;min-height:0;background:#fff;color:#111;font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans Thai","Noto Sans JP",sans-serif}',
    '.sc-root *{box-sizing:border-box}',
    '.sc-list{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:8px 10px;background:#eef1f4}',
    '.sc-older{display:block;margin:0 auto 8px;border:1px solid #cbd5e1;background:#fff;color:#374151;border-radius:999px;padding:6px 14px;font-size:13px;cursor:pointer}',
    '.sc-empty{text-align:center;color:#6b7280;font-size:13px;margin:20px 0}',
    '.sc-day{text-align:center;margin:10px 0 6px}',
    '.sc-day span{background:rgba(0,0,0,.08);color:#4b5563;font-size:12px;border-radius:999px;padding:2px 10px}',
    '.sc-row{display:flex;margin:3px 0}',
    '.sc-row.me{justify-content:flex-end}',
    '.sc-bubble{max-width:82%;background:#fff;border-radius:12px;padding:6px 10px;box-shadow:0 1px 1px rgba(0,0,0,.08);word-break:break-word}',
    '.sc-row.me .sc-bubble{background:#d9f2e2}',
    '.sc-bubble.sc-ment{background:#fff3c4;box-shadow:0 0 0 2px #f5b301}',
    '.sc-head{display:flex;align-items:center;gap:8px;font-size:12px;margin-bottom:1px}',
    '.sc-name{font-weight:700}',
    '.sc-time{color:#6b7280}',
    '.sc-del{margin-left:auto;border:0;background:none;color:#9ca3af;font-size:13px;padding:0 2px;cursor:pointer}',
    '.sc-del.sure{color:#b71c1c;font-weight:700}',
    '.sc-body{white-space:pre-wrap}',
    '.sc-body a{color:#1d4ed8}',
    '.sc-at{background:#fde68a;border-radius:4px;padding:0 2px;font-weight:700}',
    '.sc-media img,.sc-media video{display:block;max-width:100%;max-height:260px;border-radius:8px;margin:4px 0}',
    '.sc-media audio{display:block;max-width:100%;margin:4px 0}',
    '.sc-filecard{display:inline-block;margin:4px 0;padding:8px 10px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;color:#111;text-decoration:none;font-size:14px;word-break:break-all}',
    '.sc-filecard small{display:block;color:#6b7280}',
    '.sc-new{position:absolute;left:50%;transform:translateX(-50%);bottom:64px;border:0;background:#1f6f43;color:#fff;font-size:13px;font-weight:700;border-radius:999px;padding:6px 14px;box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:pointer;z-index:4}',
    '.sc-status{font-size:12px;color:#6b7280;padding:2px 10px;background:#fff}',
    '.sc-status:empty{display:none}',
    '.sc-status.err{color:#b71c1c;font-weight:700}',
    '.sc-bar{position:relative;display:flex;align-items:flex-end;gap:6px;padding:8px;border-top:1px solid #e5e7eb;background:#fff}',
    '.sc-bar textarea{flex:1;min-width:0;font:inherit;font-size:16px;border:1px solid #cbd5e1;border-radius:18px;padding:8px 12px;resize:none;max-height:110px;line-height:1.35}',
    '.sc-ibtn{flex:0 0 auto;width:40px;height:40px;border-radius:50%;border:1px solid #cbd5e1;background:#fff;font-size:18px;cursor:pointer;padding:0}',
    '.sc-send{background:#1f6f43;color:#fff;border-color:#1f6f43}',
    '.sc-send:disabled{opacity:.5}',
    '.sc-pop{position:absolute;left:8px;right:8px;bottom:100%;background:#fff;border:1px solid #cbd5e1;border-radius:10px;box-shadow:0 -4px 14px rgba(0,0,0,.15);max-height:200px;overflow:auto;z-index:5}',
    '.sc-pop button{display:block;width:100%;text-align:left;border:0;background:none;padding:10px 12px;font-size:15px;border-bottom:1px solid #f1f5f9;cursor:pointer}',
    '.sc-pop button:hover{background:#f1f5f9}',
    '.sc-who{padding:14px;background:#fff;border-top:1px solid #e5e7eb}',
    '.sc-who b{display:block;margin-bottom:8px}',
    '.sc-who select{width:100%;font-size:16px;padding:10px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:8px}',
    '.sc-who button{width:100%;border:0;background:#1f6f43;color:#fff;font-weight:700;font-size:16px;padding:11px;border-radius:10px;cursor:pointer}',
    '.sc-hidden{display:none!important}'
  ].join('\n');

  function injectStyle() {
    if (document.getElementById('sc-style')) return;
    var st = document.createElement('style');
    st.id = 'sc-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function hue(id) {
    var h = 0, s = String(id || '');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  }
  function dayKey(iso) { return new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ }); }
  function timeLabel(iso) { return new Date(iso).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }); }
  function dayLabel(iso) {
    var k = dayKey(iso);
    if (k === dayKey(new Date().toISOString())) return 'วันนี้ / Today';
    if (k === dayKey(new Date(Date.now() - 86400000).toISOString())) return 'เมื่อวาน / Yesterday';
    return new Date(iso).toLocaleDateString('en-GB', { timeZone: TZ, weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }
  function sizeLabel(n) {
    if (!n && n !== 0) return '';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }
  function errText(e) {
    var m = String((e && e.message) || e || '');
    if (/load failed|failed to fetch|networkerror|network request failed|timed? ?out|offline/i.test(m)) {
      return 'สัญญาณอินเทอร์เน็ตไม่ดี ยังไม่ได้ส่ง / No signal – not sent';
    }
    return m;
  }

  // 写真を長辺 IMG_EDGE px のJPEGに縮小(すでに小さい写真はそのまま)
  function shrinkImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth, h = img.naturalHeight;
          var scale = Math.min(1, IMG_EDGE / Math.max(w, h));
          if (scale === 1 && file.size < 800 * 1024) { URL.revokeObjectURL(url); resolve(file); return; }
          var cv = document.createElement('canvas');
          cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          cv.toBlob(function (b) {
            URL.revokeObjectURL(url);
            if (b) resolve(b); else reject(new Error('toBlob'));
          }, 'image/jpeg', 0.85);
        } catch (e) { URL.revokeObjectURL(url); reject(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }

  function mount(opts) {
    injectStyle();
    var client = opts.client;
    var root = opts.container;
    var isVisible = opts.isVisible || function () { return true; };
    var onUnread = opts.onUnread || function () {};

    var staff = [];            // [{id,name}]
    var msgs = [];             // 古い順
    var byId = {};
    var lastId = 0;
    var urls = {};             // file_path -> 署名つきURL
    var urlsAt = 0;
    var picked = {};           // 下書き中のメンション: 名前 -> staff id
    var busy = false;
    var ready = false;
    var hasOlder = false;
    var delTimers = {};

    root.innerHTML =
      '<div class="sc-root">' +
        '<div class="sc-list"></div>' +
        '<button type="button" class="sc-new sc-hidden">⬇ ข้อความใหม่ / New</button>' +
        '<div class="sc-status"></div>' +
        '<div class="sc-who sc-hidden"><b>คุณคือใคร? / Who are you?</b><select></select><button type="button">ตกลง / OK</button></div>' +
        '<div class="sc-bar">' +
          '<div class="sc-pop sc-hidden"></div>' +
          '<button type="button" class="sc-ibtn sc-attach" aria-label="attach">📎</button>' +
          '<button type="button" class="sc-ibtn sc-at-btn" aria-label="mention">@</button>' +
          '<textarea rows="1" placeholder="พิมพ์ข้อความ… (@ = ระบุชื่อ) / Message… (@ to mention)"></textarea>' +
          '<button type="button" class="sc-ibtn sc-send" aria-label="send">➤</button>' +
          '<input type="file" multiple class="sc-hidden">' +
        '</div>' +
      '</div>';
    var $ = function (sel) { return root.querySelector(sel); };
    var list = $('.sc-list'), newBtn = $('.sc-new'), statusEl = $('.sc-status');
    var whoBox = $('.sc-who'), whoSel = $('.sc-who select'), bar = $('.sc-bar');
    var pop = $('.sc-pop'), ta = $('.sc-bar textarea'), sendBtn = $('.sc-send'), fileIn = $('.sc-bar input[type=file]');

    function setStatus(t, isErr) { statusEl.textContent = t || ''; statusEl.classList.toggle('err', !!isErr); }

    // ---- 自分(発言者)----
    function getMe() {
      var id = null;
      try { id = localStorage.getItem(STAFF_KEY); } catch (_) {}
      return staff.some(function (s) { return s.id === id; }) ? id : null;
    }
    function nameOf(id) { var s = staff.filter(function (x) { return x.id === id; })[0]; return s ? s.name : ''; }
    function showWho() {
      whoSel.innerHTML = '<option value="">-- เลือกชื่อ / Choose --</option>' +
        staff.map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.name) + '</option>'; }).join('');
      whoBox.classList.remove('sc-hidden'); bar.classList.add('sc-hidden');
    }
    $('.sc-who button').onclick = function () {
      var id = whoSel.value;
      if (!id) return;
      try { localStorage.setItem(STAFF_KEY, id); } catch (_) {}
      whoBox.classList.add('sc-hidden'); bar.classList.remove('sc-hidden');
      rerender(); notify();
    };

    // ---- 既読 ----
    function seenId() { try { return parseInt(localStorage.getItem(SEEN_KEY), 10) || 0; } catch (_) { return 0; } }
    function setSeen(n) { try { localStorage.setItem(SEEN_KEY, String(n)); } catch (_) {} }
    function notify() {
      var me = getMe(), s = seenId(), u = 0, mn = 0;
      msgs.forEach(function (m) {
        if (m.id > s && m.staff_id !== me) {
          u++;
          if (me && (m.mention_staff_ids || []).indexOf(me) >= 0) mn++;
        }
      });
      onUnread({ unread: u, mentions: mn });
    }
    function markSeen() {
      if (lastId > seenId()) setSeen(lastId);
      notify();
    }

    // ---- 署名つきURL(ファイル・写真) ----
    // 写真・動画・音声は「その場で表示する用」、それ以外は「ダウンロード扱い」のURLを作る
    async function signFiles(list2) {
      var inl = [], dl = [], seen = {};
      list2.forEach(function (m) {
        if (!m.file_path || urls[m.file_path] || seen[m.file_path]) return;
        seen[m.file_path] = 1;
        if (inlineKind(m.file_type)) inl.push(m.file_path); else dl.push(m);
      });
      if (!inl.length && !dl.length) return;
      try {
        if (inl.length) {
          var r = await client.storage.from(BUCKET).createSignedUrls(inl, SIGN_SECS);
          if (r.data) r.data.forEach(function (x) { if (x.signedUrl) urls[x.path] = x.signedUrl; });
        }
        await Promise.all(dl.map(async function (m) {
          var x = await client.storage.from(BUCKET).createSignedUrl(m.file_path, SIGN_SECS, { download: m.file_name || true });
          if (x.data && x.data.signedUrl) urls[m.file_path] = x.data.signedUrl;
        }));
        if (!urlsAt) urlsAt = Date.now();
      } catch (_) { /* 次回やり直す */ }
    }
    // 一時URLの期限が近づいたら、表示中のファイル分をまとめて作り直す(開きっぱなしでも写真が消えないように)
    async function refreshStale() {
      if (!urlsAt || Date.now() - urlsAt < (SIGN_SECS - 600) * 1000) return;
      var withFiles = msgs.filter(function (m) { return m.file_path; });
      if (!withFiles.length) { urlsAt = 0; return; }
      urls = {}; urlsAt = 0;
      await signFiles(withFiles);
      rerender();
    }

    // ---- 描画 ----
    function bodyHtml(m) {
      var t = esc(m.body || '');
      var ids = m.mention_staff_ids || [];
      if (ids.length) {
        var names = ids.map(nameOf).filter(Boolean).sort(function (a, b) { return b.length - a.length; });
        if (names.length) {
          var re = new RegExp('@(' + names.map(function (n) { return escRe(esc(n)); }).join('|') + ')(?![A-Za-z0-9])', 'g');
          t = t.replace(re, '<span class="sc-at">@$1</span>');
        }
      }
      return t.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    }
    function fileHtml(m) {
      if (!m.file_path) return '';
      var u = urls[m.file_path], kind = inlineKind(m.file_type);
      if (u && kind === 'img') return '<div class="sc-media"><a href="' + esc(u) + '" target="_blank" rel="noopener"><img src="' + esc(u) + '" loading="lazy" alt="' + esc(m.file_name) + '"></a></div>';
      if (u && kind === 'video') return '<div class="sc-media"><video controls preload="metadata" playsinline src="' + esc(u) + '"></video></div>';
      if (u && kind === 'audio') return '<div class="sc-media"><audio controls preload="none" src="' + esc(u) + '"></audio></div>';
      var inner = '📄 ' + esc(m.file_name || 'file') + '<small>' + esc(sizeLabel(m.file_size)) + '</small>';
      return u ? '<a class="sc-filecard" href="' + esc(u) + '" target="_blank" rel="noopener">' + inner + '</a>' : '<span class="sc-filecard">' + inner + '</span>';
    }
    function buildRow(m) {
      var me = getMe();
      var mine = m.staff_id === me;
      var ment = !mine && me && (m.mention_staff_ids || []).indexOf(me) >= 0;
      var row = document.createElement('div');
      row.className = 'sc-row' + (mine ? ' me' : '');
      row.dataset.id = m.id;
      row.innerHTML =
        '<div class="sc-bubble' + (ment ? ' sc-ment' : '') + '">' +
          '<div class="sc-head"><span class="sc-name" style="color:hsl(' + hue(m.staff_id || m.sender_name) + ',55%,32%)">' + (ment ? '🔔 ' : '') + esc(m.sender_name) + '</span>' +
          '<span class="sc-time">' + esc(timeLabel(m.created_at)) + '</span>' +
          (mine ? '<button type="button" class="sc-del" aria-label="delete">✕</button>' : '') + '</div>' +
          fileHtml(m) +
          (m.body ? '<div class="sc-body">' + bodyHtml(m) + '</div>' : '') +
        '</div>';
      var del = row.querySelector('.sc-del');
      if (del) del.onclick = function () { onDelete(m, del); };
      return row;
    }
    function dayRow(iso) {
      var d = document.createElement('div');
      d.className = 'sc-day'; d.innerHTML = '<span>' + esc(dayLabel(iso)) + '</span>';
      return d;
    }
    function nearBottom() { return list.scrollHeight - list.scrollTop - list.clientHeight < 90; }
    function toBottom() { list.scrollTop = list.scrollHeight; newBtn.classList.add('sc-hidden'); }

    function rerender() {
      var keep = list.scrollHeight - list.scrollTop;
      list.innerHTML = '';
      if (hasOlder) {
        var ob = document.createElement('button');
        ob.type = 'button'; ob.className = 'sc-older'; ob.textContent = 'ดูข้อความเก่า / Older messages';
        ob.onclick = loadOlder; list.appendChild(ob);
      }
      if (!msgs.length) {
        var e = document.createElement('div');
        e.className = 'sc-empty'; e.textContent = 'ยังไม่มีข้อความ / No messages yet'; list.appendChild(e);
      }
      var prevDay = '';
      msgs.forEach(function (m) {
        var k = dayKey(m.created_at);
        if (k !== prevDay) { list.appendChild(dayRow(m.created_at)); prevDay = k; }
        list.appendChild(buildRow(m));
      });
      list.scrollTop = Math.max(0, list.scrollHeight - keep);
    }

    // ---- 追加・削除 ----
    async function addMessages(rows) {
      var fresh = rows.filter(function (m) { return !byId[m.id]; });
      if (!fresh.length) return;
      fresh.sort(function (a, b) { return a.id - b.id; });
      await signFiles(fresh);
      var stick = nearBottom();
      var mineLast = false;
      var me = getMe();
      var emptyEl = list.querySelector('.sc-empty'); if (emptyEl) emptyEl.remove();
      fresh.forEach(function (m) {
        if (byId[m.id]) return;
        byId[m.id] = m; msgs.push(m);
        if (m.id > lastId) lastId = m.id;
        var prev = msgs.length > 1 ? msgs[msgs.length - 2] : null;
        if (!prev || dayKey(prev.created_at) !== dayKey(m.created_at)) list.appendChild(dayRow(m.created_at));
        list.appendChild(buildRow(m));
        if (m.staff_id === me) mineLast = true;
      });
      if (stick || mineLast) toBottom(); else newBtn.classList.remove('sc-hidden');
      if (isVisible() && !document.hidden) markSeen(); else notify();
    }
    function removeLocal(id) {
      if (!byId[id]) return;
      delete byId[id];
      msgs = msgs.filter(function (m) { return m.id !== id; });
      var el = list.querySelector('.sc-row[data-id="' + id + '"]'); if (el) el.remove();
      notify();
    }
    async function onDelete(m, btn) {
      if (!btn.classList.contains('sure')) {
        btn.classList.add('sure'); btn.textContent = 'ลบ? / Delete?';
        clearTimeout(delTimers[m.id]);
        delTimers[m.id] = setTimeout(function () { btn.classList.remove('sure'); btn.textContent = '✕'; }, 4000);
        return;
      }
      clearTimeout(delTimers[m.id]);
      var r = await client.from('chat_messages').delete().eq('id', m.id);
      if (r.error) { setStatus('ลบไม่สำเร็จ / Delete failed: ' + errText(r.error), true); return; }
      if (m.file_path) { try { await client.storage.from(BUCKET).remove([m.file_path]); } catch (_) {} }
      removeLocal(m.id);
    }

    // ---- 読み込み ----
    async function loadHistory() {
      var r = await client.from('chat_messages').select('*').order('id', { ascending: false }).limit(PAGE);
      if (r.error) { setStatus('โหลดแชทไม่สำเร็จ / Could not load chat: ' + errText(r.error), true); return; }
      var rows = (r.data || []).slice().reverse();
      hasOlder = (r.data || []).length >= PAGE;
      msgs = rows; byId = {};
      rows.forEach(function (m) { byId[m.id] = m; if (m.id > lastId) lastId = m.id; });
      await signFiles(rows);
      // 初めて使うときは、過去分を未読にしない
      var first = false;
      try { first = localStorage.getItem(SEEN_KEY) === null; } catch (_) {}
      if (first) setSeen(lastId);
      rerender(); toBottom();
      if (isVisible()) markSeen(); else notify();
    }
    async function loadOlder() {
      if (!msgs.length) return;
      var r = await client.from('chat_messages').select('*').lt('id', msgs[0].id).order('id', { ascending: false }).limit(PAGE);
      if (r.error) { setStatus(errText(r.error), true); return; }
      var rows = (r.data || []).slice().reverse();
      hasOlder = (r.data || []).length >= PAGE;
      await signFiles(rows);
      rows.forEach(function (m) { byId[m.id] = m; });
      msgs = rows.concat(msgs);
      rerender();
    }
    async function catchUp() {
      if (!ready) return;
      var r = await client.from('chat_messages').select('*').gt('id', lastId).order('id', { ascending: true }).limit(200);
      if (!r.error && r.data && r.data.length) await addMessages(r.data);
      await refreshStale();
    }

    // ---- リアルタイム ----
    var channel = null;
    function subscribe() {
      try {
        channel = client.channel('staff-chat-' + Math.random().toString(36).slice(2))
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, function (p) { if (p && p.new) addMessages([p.new]); })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, function (p) { if (p && p.old && p.old.id) removeLocal(p.old.id); })
          .subscribe(function (status) { if (status === 'SUBSCRIBED') catchUp(); });
      } catch (_) { /* 接続できなくても、下の定期確認で届く */ }
    }

    // ---- 送信 ----
    function autosize() { ta.style.height = 'auto'; ta.style.height = Math.min(110, ta.scrollHeight) + 'px'; }
    async function send(fileInfo) {
      var me = getMe();
      if (!me) { showWho(); return false; }
      var text = ta.value.trim();
      if (!text && !fileInfo) return false;
      var ids = Object.keys(picked).filter(function (n) { return text.indexOf('@' + n) >= 0; }).map(function (n) { return picked[n]; });
      var row = { staff_id: me, body: text || null, mention_staff_ids: ids };
      if (fileInfo) for (var k in fileInfo) row[k] = fileInfo[k];
      ta.value = ''; picked = {}; autosize(); hidePop();
      sendBtn.disabled = true;
      var r = await client.from('chat_messages').insert(row).select().single();
      sendBtn.disabled = false;
      if (r.error) {
        ta.value = text; autosize();
        setStatus('ส่งไม่สำเร็จ / Failed to send: ' + errText(r.error), true);
        return false;
      }
      setStatus('');
      await addMessages([r.data]);
      toBottom();
      return true;
    }
    async function sendFiles(files) {
      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        if (!f) continue;
        if (busy) return;
        if (f.size > MAX_BYTES) { setStatus('ไฟล์ใหญ่เกิน 25MB / File over 25MB: ' + f.name, true); continue; }
        if (ALLOWED_TYPES.indexOf(f.type || '') < 0) { setStatus('ไม่รองรับไฟล์ชนิดนี้ / File type not supported: ' + (f.name || ''), true); continue; }
        busy = true; setStatus('กำลังส่งไฟล์… / Uploading… ' + (f.name || ''));
        try {
          var blob = f, type = f.type || 'application/octet-stream', name = f.name || 'file';
          if (/^image\/(jpeg|png|webp)$/.test(type)) {
            try { blob = await shrinkImage(f); if (blob !== f) { type = 'image/jpeg'; name = name.replace(/\.[^.]+$/, '') + '.jpg'; } } catch (_) { blob = f; }
          }
          var ext = (name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin';
          var ym = dayKey(new Date().toISOString()).slice(0, 7);
          var path = ym + '/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;
          var up = await client.storage.from(BUCKET).upload(path, blob, { contentType: type, cacheControl: '3600', upsert: false });
          if (up.error) throw up.error;
          var ok = await send({ file_path: path, file_name: name, file_type: type, file_size: blob.size });
          if (!ok) { try { await client.storage.from(BUCKET).remove([path]); } catch (_) {} }
          else setStatus('');
        } catch (e) {
          setStatus('ส่งไฟล์ไม่สำเร็จ / Upload failed: ' + errText(e), true);
        } finally { busy = false; }
      }
    }

    // ---- メンション(@名前) ----
    function hidePop() { pop.classList.add('sc-hidden'); pop.innerHTML = ''; }
    function updatePop() {
      var me = getMe();
      var before = ta.value.slice(0, ta.selectionStart);
      var mt = /(^|\s)@([^\s@]*)$/.exec(before);
      if (!mt) { hidePop(); return; }
      var q = mt[2].toLowerCase();
      var cands = staff.filter(function (s) { return s.id !== me && s.name.toLowerCase().indexOf(q) === 0; });
      if (!cands.length) cands = staff.filter(function (s) { return s.id !== me && s.name.toLowerCase().indexOf(q) >= 0; });
      if (!cands.length) { hidePop(); return; }
      pop.innerHTML = cands.slice(0, 8).map(function (s) { return '<button type="button" data-id="' + esc(s.id) + '">@' + esc(s.name) + '</button>'; }).join('');
      pop.classList.remove('sc-hidden');
    }
    function insertMention(id) {
      var s = staff.filter(function (x) { return x.id === id; })[0];
      if (!s) return;
      var pos = ta.selectionStart;
      var before = ta.value.slice(0, pos), after = ta.value.slice(pos);
      var mt = /(^|\s)@([^\s@]*)$/.exec(before);
      var start = mt ? before.length - mt[2].length - 1 : before.length;
      ta.value = before.slice(0, start) + '@' + s.name + ' ' + after;
      var np = start + s.name.length + 2;
      ta.setSelectionRange(np, np);
      picked[s.name] = s.id;
      hidePop(); autosize(); ta.focus();
    }
    pop.addEventListener('pointerdown', function (e) {   // フォーカスを失う前に確定させる
      var b = e.target.closest('button[data-id]');
      if (b) { e.preventDefault(); insertMention(b.dataset.id); }
    });
    $('.sc-at-btn').onclick = function () {
      var pos = ta.selectionStart, v = ta.value;
      var pre = (pos > 0 && !/\s/.test(v.charAt(pos - 1))) ? ' @' : '@';
      ta.value = v.slice(0, pos) + pre + v.slice(pos);
      var np = pos + pre.length; ta.focus(); ta.setSelectionRange(np, np); updatePop();
    };

    // ---- 入力まわり ----
    ta.addEventListener('input', function () { autosize(); updatePop(); });
    ta.addEventListener('click', updatePop);
    ta.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;   // 日本語・タイ語の変換確定のEnterでは送信しない
      var desktop = window.matchMedia && window.matchMedia('(pointer:fine)').matches;
      if (desktop && !e.shiftKey) { e.preventDefault(); send(); }
    });
    ta.addEventListener('paste', function (e) {
      var fl = e.clipboardData && e.clipboardData.files;
      if (fl && fl.length) { e.preventDefault(); sendFiles(Array.prototype.slice.call(fl)); }
    });
    root.addEventListener('dragover', function (e) { e.preventDefault(); });
    root.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { e.preventDefault(); sendFiles(Array.prototype.slice.call(e.dataTransfer.files)); }
    });
    sendBtn.onclick = function () { send(); };
    $('.sc-attach').onclick = function () { fileIn.click(); };
    fileIn.onchange = function () { var fl = Array.prototype.slice.call(fileIn.files); fileIn.value = ''; sendFiles(fl); };
    newBtn.onclick = function () { toBottom(); if (isVisible()) markSeen(); };
    list.addEventListener('scroll', function () { if (nearBottom()) { newBtn.classList.add('sc-hidden'); if (isVisible() && !document.hidden) markSeen(); } });

    // ---- 起動 ----
    (async function boot() {
      var r = await client.rpc('delivery_app_staff_list');
      if (r.error) { setStatus('โหลดรายชื่อไม่สำเร็จ / Could not load staff: ' + errText(r.error), true); return; }
      staff = r.data || [];
      if (!getMe()) showWho();
      await loadHistory();
      ready = true;
      subscribe();
      setInterval(function () { if (!document.hidden) catchUp(); }, 20000);   // リアルタイムが切れても届くようにする保険
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) { catchUp(); if (isVisible()) markSeen(); }
      });
    })();

    return {
      // チャットが見える状態になったときに呼ぶ(末尾へ移動+既読)
      onShow: function () { toBottom(); markSeen(); },
      // 入力中か(アプリの自動再読み込みを止めるため)
      isBusy: function () { return busy || !!ta.value.trim(); },
      focus: function () { ta.focus(); }
    };
  }

  window.StaffChat = { mount: mount };
})();

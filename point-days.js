// ポイント有効期限の日数を settings.point_expiry_days から取得して、
// class="js-point-days" の要素に反映する(ご利用ガイド・規約・マイページ共通)。
// 取得できない場合は、HTMLに書いてある初期値(60)のまま表示する。
(function () {
  var URL_ = 'https://sdjgmgyghnlpqydrnllj.supabase.co/rest/v1/settings?key=eq.point_expiry_days&select=value';
  var KEY_ = 'sb_publishable_GzbK9P2cp7FPFxrnyBjVug_IMCbjOpk';
  var days = null;
  try { var c = parseInt(sessionStorage.getItem('pointExpiryDays'), 10); if (c > 0) days = c; } catch (e) {}

  function fill() {
    if (!days) return;
    document.querySelectorAll('.js-point-days').forEach(function (el) { el.textContent = days; });
  }
  window.fillPointDays = fill;
  window.getPointExpiryDays = function () { return days; };

  document.addEventListener('saitofoods-langchange', fill);
  document.addEventListener('DOMContentLoaded', fill);

  fetch(URL_, { headers: { apikey: KEY_, Authorization: 'Bearer ' + KEY_ } })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      var n = rows && rows[0] ? parseInt(rows[0].value, 10) : NaN;
      if (n > 0) {
        days = n;
        try { sessionStorage.setItem('pointExpiryDays', String(n)); } catch (e) {}
        fill();
      }
    })
    .catch(function () {});
})();

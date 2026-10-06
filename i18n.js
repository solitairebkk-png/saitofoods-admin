/* ==========================================================
   サイトウフーズ 共通 日本語/English 切り替えスクリプト
   全ページ(index.html / product_list.html / mypage.html / user_guide.html)
   で読み込む共通ファイル。localStorageに言語設定を保存するので、
   ページを移動しても選んだ言語のままになる。
   ========================================================== */
(function () {
  var LANG_KEY = 'saitofoods_lang';

  var DICT = {
    // ---- header / nav ----
    'nav.home': { ja: 'トップ / Home', en: 'Home' },
    'nav.products': { ja: '商品一覧 / Products', en: 'Products' },
    'nav.mypage': { ja: 'マイページ / My Page', en: 'My Page' },
    'nav.logout': { ja: 'ログアウト', en: 'Log out' },

    // ---- sidebar quicklinks ----
    'sidebar.guideTitle': { ja: 'ご利用ガイド', en: 'User Guide' },
    'sidebar.guideSub': { ja: 'USER GUIDE', en: 'USER GUIDE' },
    'sidebar.productsTitle': { ja: '商品一覧', en: 'Products' },
    'sidebar.productsSub': { ja: 'PRODUCTS', en: 'PRODUCTS' },
    'sidebar.categoriesTitle': { ja: '商品カテゴリ / Categories', en: 'Categories' },
    'sidebar.favoritesTitle': { ja: 'お気に入り', en: 'Favorites' },
    'sidebar.favoritesSub': { ja: 'FAVORITES', en: 'FAVORITES' },
    'sidebar.all': { ja: 'すべて / All', en: 'All' },

    // ---- anniversary badge ----
    'anniversary.since': { ja: 'since 1997', en: 'since 1997' },

    // ---- index.html hero ----
    'hero.h1': { ja: 'サイトウフーズの願い、それはおいしい生活@タイランド！', en: "Saito Foods' wish: a delicious life in Thailand!" },
    'hero.p': { ja: '「おいしいね」ってみんなが笑顔になれる幸せは万国共通。<br>おいしいものを囲んでホッとできるひとときを、少しでもお手伝いできたら。<br>今日も皆様の食卓に、美味しさと笑顔をお届けします。', en: 'That happy feeling when everyone says \'delicious!\' is universal. We hope to help create cozy moments around good food, even just a little. Today too, we deliver taste and smiles to your table.' },
    'hero.shipBubble': { ja: '<span class="bubble-main">600バーツ未満での配送を<br>開始しました！</span><span class="bubble-sub">〈※ 配送料金100バーツ〉</span>', en: '<span class="bubble-main">Delivery for orders under<br>฿600 has started!</span><span class="bubble-sub">(※ Delivery fee: ฿100)</span>' },
    'hero.shipNote': { ja: '<span class="note-main">ご注文600バーツ以上で<br>バンコク広域 無料配送！</span><span class="note-sub">(<a href="#delivery-area">配送エリア</a>以外の方もご相談ください)</span>', en: '<span class="note-main">Free delivery across Greater Bangkok<br>for orders of ฿600 or more!</span><span class="note-sub">(Outside the <a href="#delivery-area">delivery area</a>? Please contact us)</span>' },
    'hero.searchPlaceholder': { ja: '🔍 商品を検索 / Search product', en: '🔍 Search products' },
    'hero.searchBtn': { ja: '検索 / Search', en: 'Search' },
    'hero.cta': { ja: '商品一覧を見る / Shop Now →', en: 'View products / Shop Now →' },

    // ---- index.html business hours / calendar ----
    'hours.title': { ja: '営業時間案内 / Business Hours', en: 'Business Hours' },
    'hours.deliveryTitle': { ja: '配達時間', en: 'Delivery Hours' },
    'hours.deliveryLine1': { ja: '月～金　9:00-12:00　13:00-18:00', en: 'Mon–Fri  9:00-12:00  13:00-18:00' },
    'hours.deliveryLine2': { ja: '土曜日　9:00-12:00　月2回営業', en: 'Sat  9:00-12:00 (2x/month)' },
    'hours.calendarLink': { ja: 'カレンダーでご確認ください→', en: 'Please check the calendar →' },
    'hours.storeTitle': { ja: '直売店営業時間', en: 'Store Hours' },
    'hours.storeLine1': { ja: '月～金　8:20-17:00', en: 'Mon–Fri  8:20-17:00' },
    'hours.storeLine2': { ja: '土曜日　9:00-11:45　月2回営業', en: 'Sat  9:00-11:45 (2x/month)' },
    'hours.contactTitle': { ja: 'お問い合わせ', en: 'Contact' },
    'hours.contactLine1': { ja: '月～金　8:20-12:00　13:00-17:45', en: 'Mon–Fri  8:20-12:00  13:00-17:45' },
    'hours.contactLine2': { ja: '土曜日　9:00-12:00　月2回営業', en: 'Sat  9:00-12:00 (2x/month)' },
    'hours.contactPhoneNote': { ja: '（コン・イープンと呼び出してください。）', en: '(Please ask for "Khun Eepun")' },
    'calendar.title': { ja: '配送カレンダー / Delivery Calendar', en: 'Delivery Calendar' },
    'calendar.legendOpen': { ja: '営業日 / Open', en: 'Open' },
    'calendar.legendSat': { ja: '土曜午前のみ / Saturday morning only', en: 'Saturday morning only' },
    'calendar.legendClosed': { ja: '休業日 / Close', en: 'Close' },
    'calendar.legendSriracha': { ja: 'シラチャ配送日 / Sriracha delivery day', en: 'Sriracha delivery day' },
    'calendar.legendPattaya': { ja: 'パタヤ配送日 / Pattaya delivery day', en: 'Pattaya delivery day' },
    'calendar.legendNichada': { ja: 'ニチャダタニ配送日(13:00-15:00) / Nichada Thani delivery day (13:00-15:00)', en: 'Nichada Thani delivery day (13:00-15:00)' },

    // ---- section titles ----
    'section.announcements': { ja: 'お知らせ / Announcements', en: 'Announcements' },
    'section.promotion': { ja: '只今プロモーション中 / Currently on Promotion', en: 'Currently on Promotion' },
    'section.top3': { ja: 'TOP3 / 人気商品ランキング', en: 'TOP3 Best Sellers' },
    'section.bargain': { ja: 'お買い得商品 / On Sale', en: 'On Sale' },

    // ---- footer (common) ----
    'footer.companyTitle': { ja: '会社情報・直売店のご案内 / Company & Store', en: 'Company & Store Info' },
    'footer.companyTitleShort': { ja: '会社情報 / Company', en: 'Company Info' },
    'footer.addressNote': { ja: '※ 直売店も同住所で営業しております。店頭でも商品をお買い求めいただけます。', en: '※ Our retail store operates at the same address. You can also purchase items in person.' },
    'footer.mapLink': { ja: '📍 地図で見る / View on map', en: '📍 View on map' },
    'footer.deliveryAreaTitle': { ja: '配送エリアについて / Delivery Area', en: 'Delivery Area' },
    'footer.deliveryAreaText': { ja: 'バンコク・シラチャ・パタヤは自社配送でお届けします。それ以外の地域は、外部のクール便(冷蔵・冷凍配送サービス)を利用して全国どこへでもお届け可能です。詳しくはお問い合わせください。', en: 'We deliver to Bangkok, Sriracha, and Pattaya using our own delivery service. For other areas, we can ship nationwide using a cold-chain courier service. Please contact us for details.' },
    'footer.bangkokArea': { ja: 'バンコクエリア', en: 'Bangkok Area' },
    'footer.srirachaArea': { ja: 'シラチャエリア', en: 'Sriracha Area' },
    'footer.terms': { ja: '利用規約 / Terms of Service', en: 'Terms of Service' },

    // ---- product_list.html ----
    'plist.searchPlaceholder': { ja: '🔍 商品を検索 / Search product', en: '🔍 Search products' },
    'plist.cartView': { ja: 'カートを見る / View cart →', en: 'View cart →' },
    'plist.addToCart': { ja: 'カートに入れる / Add to cart', en: 'Add to cart' },
    'plist.outOfStock': { ja: '在庫切れ / Out of stock', en: 'Out of stock' },
    'plist.outOfStockShort': { ja: '在庫切れ', en: 'Out of stock' },
    'plist.addShort': { ja: '+ 追加', en: '+ Add' },
    'plist.addBtn': { ja: 'カートに追加', en: 'Add to cart' },
    'plist.localSpecial': { ja: '🏠 ローカル限定', en: '🏠 Local special' },
    'plist.localTagModal': { ja: '🏠 ローカル限定商品 / Local special item', en: '🏠 Local special item' },
    'plist.weightSale': { ja: '⚖️ 量り売り', en: '⚖️ Sold by weight' },
    'plist.categoryLinkSuffix': { ja: 'カテゴリへ→', en: '' },
    'plist.frequentlyBought': { ja: '一緒に購入されている商品 / Frequently bought together', en: 'Frequently bought together' },
    'plist.favLoginConfirm': { ja: 'お気に入り登録にはログインが必要です。マイページへ移動しますか？ / Please log in to save favorites. Go to My Page?', en: 'Please log in to save favorites. Go to My Page?' },
    'plist.addedToCart': { ja: 'カートに追加しました ✓', en: 'Added to cart ✓' },
    'plist.shareBtn': { ja: '🔗 この商品を共有 / Share', en: '🔗 Share this item' },
    'plist.shareCopied': { ja: 'リンクをコピーしました ✓', en: 'Link copied ✓' },
    'plist.shareIgCopied': { ja: 'リンクをコピーしました。Instagramのストーリーズ・DMに貼り付けてください', en: 'Link copied. Paste it into your Instagram Story or DM.' },
    'plist.shareCopyManual': { ja: 'このリンクをコピーしてください', en: 'Copy this link' },
    'plist.backBtn': { ja: '← 戻る / Back', en: '← Back' },
    'plist.favAddLabel': { ja: '← お気に入りに追加 / Add to favorite', en: '← Add to favorite' },

    // ---- user_guide.html ----
    'guide.h1': { ja: 'ユーザーガイド / User Guide', en: 'User Guide' },
    'guide.item1': { ja: 'トップページの配送エリアをご確認くださいませ。', en: 'Please check the delivery area on the top page.' },
    'guide.item2': { ja: '配送エリア内はご購入代金合計600baht以上で送料無料で配送サービスを承っております。', en: 'Within the delivery area, orders totaling 600 baht or more qualify for free delivery.' },
    'guide.item2sub': { ja: '※お買い物合計金額600baht以下の配送は別途配送料がかかります。', en: '※ A separate delivery fee applies for orders totaling less than 600 baht.' },
    'guide.item3': { ja: '会員登録を完了してからご注文をお願いいたします。お支払いは商品到着時にタイバーツ現金にてお支払いいただくか、QRコード、銀行振込みをご利用いただけます。', en: 'Please complete member registration before ordering. Payment can be made in Thai baht cash on delivery, or by QR code / bank transfer.' },
    'guide.item3sub': { ja: '※口座番号等々はご注文時にご案内しております。', en: '※ Bank account details are provided at the time of your order.' },
    'guide.item4': { ja: '配送エリア外への配送に関しましてはお問い合わせくださいませ。ご登録の際は必ずother Provincesを選択くださいませ。', en: 'Please contact us regarding delivery outside our regular delivery area. When registering, please be sure to select "Other Provinces."' },
    'guide.item5': { ja: '県外への配送も可能です。Nim Express様のクール便を利用配送料はNim Express様の実費を頂いております。海外へ持ち出される場合は別途発泡スチロール箱やドライアイスの手配も別料金にて可能です。', en: 'Delivery to other provinces is also possible using Nim Express cold-chain courier, charged at their actual cost. If you plan to take items abroad, styrofoam boxes and dry ice can be arranged for an additional fee.' },
    'guide.item6': { ja: '配送の混み具合により早期に当日の配送受付を締め切る場合が御座います。', en: 'Same-day delivery orders may close earlier than usual depending on how busy we are.' },
    'guide.item7': { ja: 'webサイトからご購入の場合はご購入金額の約1%のポイントが取得でき次回のお買い物の際に1ポイント＝1bahtとしてご利用いただけます。', en: 'Purchases made on the website earn approximately 1% in points, redeemable as 1 point = 1 baht on your next order.' },
    'guide.item7sub': { ja: 'ポイントの有効期限は、<b>最後にお買い物をされた日から<span class="js-point-days">60</span>日間</b>です。<span class="js-point-days">60</span>日間ご利用がない場合、保有しているポイントはすべて失効となります。期限内にお買い物をされると、その日からまた<span class="js-point-days">60</span>日間に延長されます。有効期限はマイページおよび伝票でご確認いただけます。また、ポイントの換金は致しかねます。', en: 'Points are valid for <b><span class="js-point-days">60</span> days from your last purchase</b>. If you do not shop for <span class="js-point-days">60</span> days, all of your points expire. Each purchase made before then extends the period by another <span class="js-point-days">60</span> days. You can check your expiry date on My Page and on your receipt. Points cannot be exchanged for cash.' },
    'guide.item8': { ja: 'タイの国民の祝日及び毎週日曜日、隔週土曜日を定休日とさせて頂いておりますが休日の並びにより変更になる場合がございますので、カレンダーにてご確認くださいませ。', en: 'We are closed on Thai national holidays, every Sunday, and every other Saturday, though this may shift depending on how holidays fall — please check the calendar for details.' },

    // ---- mypage.html ----
    'my.tabLogin': { ja: 'ログイン', en: 'Log in' },
    'my.tabSignup': { ja: '新規登録', en: 'Sign up' },
    'my.emailLabel': { ja: 'メールアドレス', en: 'Email address' },
    'my.passwordLabel': { ja: 'パスワード', en: 'Password' },
    'my.loginBtn': { ja: 'ログイン', en: 'Log in' },
    'my.forgotLink': { ja: 'パスワードをお忘れですか？', en: 'Forgot your password?' },
    'my.forgotHint': { ja: 'ご登録のメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。', en: 'Please enter your registered email address. We will send you a password reset link.' },
    'my.loginFirstTimeTitle': { ja: 'リニューアル後の新サイトを初めてご利用の方へ', en: 'First time on our renewed site?' },
    'my.loginFirstTimeNote': { ja: '以前のサイトのパスワードはお使いいただけません(ブラウザの自動入力も対象外です)。<b>ご注文履歴・ポイントを引き継ぐ場合も、必ず下の「新規登録」から</b>、今までお使いのメールアドレスで新しいパスワードを設定してください。設定後に届くメール内のリンクを押すと、ログインが完了します。<br>引継ぎに不具合がある場合は <a href=\"mailto:orders@saitofoods.com\">orders@saitofoods.com</a> までお問い合わせくださいませ。', en: 'Your old password won\'t work here — even if your browser autofills it. <b>Even if you\'re migrating your order history and points, please use "Sign up" below</b> with the email address you used before to set a new password. Click the link in the confirmation email to finish logging in.<br>If you run into trouble migrating your account, please contact us at <a href=\"mailto:orders@saitofoods.com\">orders@saitofoods.com</a>.' },
    'my.loginFirstTimeLink': { ja: '「新規登録」はこちら →', en: 'Sign up here →' },
    'my.forgotFirstTimeTitle': { ja: 'リニューアル後の新サイトにまだログインしたことが無い方へ', en: 'Never logged in to our renewed site?' },
    'my.forgotFirstTimeNote': { ja: 'こちらのページからはログインできません。<b>ご注文履歴・ポイントを引き継ぐ場合も、必ず「新規登録」から</b>、今までお使いのメールアドレスで新しいパスワードを設定してください。<br>引継ぎに不具合がある場合は <a href=\"mailto:orders@saitofoods.com\">orders@saitofoods.com</a> までお問い合わせくださいませ。', en: 'This page won\'t work for you yet. <b>Even if you\'re migrating your order history and points, please use "Sign up"</b> to set a new password with the email address you used before.<br>If you run into trouble migrating your account, please contact us at <a href=\"mailto:orders@saitofoods.com\">orders@saitofoods.com</a>.' },
    'my.forgotBtn': { ja: '再設定メールを送る', en: 'Send reset email' },
    'my.backToLogin': { ja: 'ログインに戻る', en: 'Back to login' },
    'my.resetHint': { ja: '新しいパスワードを設定してください。', en: 'Please set a new password.' },
    'my.newPasswordLabel': { ja: '新しいパスワード', en: 'New password' },
    'my.passwordConfirmLabel': { ja: 'パスワード(確認)', en: 'Confirm password' },
    'my.resetBtn': { ja: 'パスワードを更新する', en: 'Update password' },
    'my.signupHint': { ja: 'ご登録済みのメールアドレスで、初めてログインするためのパスワードを設定してください。これまでのご注文履歴・ポイント残高がそのまま引き継がれます。', en: 'Please set a password for your first login using your registered email address. Your order history and point balance will carry over as-is.' },
    'my.icloudNotice': { ja: '⚠️ iCloud(@icloud.com / @me.com)のメールアドレスは、確認メールが届かない場合があります。届かないときは、Gmailなど別のメールアドレスで登録するか、<b>orders@saitofoods.com</b> までご連絡ください。こちらで確認いたします。', en: '⚠️ Confirmation emails may not reach iCloud addresses (@icloud.com / @me.com). If yours does not arrive, please register with a different email address such as Gmail, or contact us at <b>orders@saitofoods.com</b> and we will confirm your account.' },
    'my.signupEmailLabel': { ja: 'ご登録のメールアドレス', en: 'Registered email address' },
    'my.signupFamilyNameLabel': { ja: 'お名前(姓) / Family Name', en: 'Family Name' },
    'my.signupFirstNameLabel': { ja: 'お名前(名) / First Name', en: 'First Name' },
    'my.signupBtn': { ja: 'パスワードを設定する', en: 'Set password' },
    'my.pointExpiry': { ja: '⏳ ポイントの有効期限: <b>{date}</b><br>最後のお買い物から<span class="js-point-days">60</span>日間ご利用がないと、ポイントはすべて失効します。期限内にお買い物をすると、その日からまた<span class="js-point-days">60</span>日に延長されます。', en: '⏳ Points valid until: <b>{date}</b><br>If you do not shop for <span class="js-point-days">60</span> days after your last purchase, all points expire. Each purchase before then extends the period by another <span class="js-point-days">60</span> days.' },
    'my.pointsLabel': { ja: '保有ポイント / Points Balance', en: 'Points Balance' },
    'my.orderHistoryTitle': { ja: 'ご注文履歴 / Order History', en: 'Order History' },
    'my.loading': { ja: '読み込み中...', en: 'Loading...' },
    'my.accountInfoTitle': { ja: 'アカウント情報 / Account Info', en: 'Account Info' },
    'my.changeBtn': { ja: '変更する', en: 'Change' },
    'my.newEmailLabel': { ja: '新しいメールアドレス', en: 'New email address' },
    'my.emailChangeBtn': { ja: 'メールアドレスを変更する', en: 'Change email address' },
    'my.emailChangeHintPre': { ja: '変更には確認メールが', en: 'A confirmation email will be sent to' },
    'my.emailChangeHintBold': { ja: '新しいメールアドレスと現在のメールアドレスの両方', en: 'both your new and current email addresses' },
    'my.emailChangeHintMid': { ja: 'に届きます。', en: '.' },
    'my.emailChangeHintBold2': { ja: '両方', en: 'Both' },
    'my.emailChangeHintPost': { ja: 'のメール内のリンクをクリックしていただく必要があります(片方だけでは変更が完了しません)。', en: ' emails contain a link that must be clicked to complete the change (clicking only one is not enough).' },
    'my.passwordLabelPlain': { ja: 'パスワード / Password', en: 'Password' },
    'my.newPasswordLabelEn': { ja: '新しいパスワード / New Password', en: 'New Password' },
    'my.passwordConfirmLabelEn': { ja: '新しいパスワード(確認) / Confirm', en: 'Confirm New Password' },
    'my.passwordChangeBtn': { ja: 'パスワードを変更する', en: 'Change password' },
    'my.profileFamilyNameLabel': { ja: 'お名前(姓) / Family Name', en: 'Family Name' },
    'my.profileFirstNameLabel': { ja: 'お名前(名) / First Name', en: 'First Name' },
    'my.telLabel': { ja: '電話番号', en: 'Phone number' },
    'my.address1Label': { ja: '住所1', en: 'Address line 1' },
    'my.address2Label': { ja: '住所2', en: 'Address line 2' },
    'my.areaLabel': { ja: 'エリア / Area', en: 'Area' },
    'my.condoLabel': { ja: 'お住まいのコンドミニアム / Your condominium', en: 'Your condominium' },
    'my.condoHint': { ja: '選んでおくと、ご注文時にコンドミニアムと配送日が自動で選ばれます。一覧にない場合は「選択しない」のままで、ご注文時に「その他」を選んで入力してください。', en: 'Once set, your condominium and delivery day are pre-selected when you order. If yours is not listed, leave this as "Not selected" and choose "Other" when ordering.' },
    'my.areaHint': { ja: '引っ越しされた場合は、こちらも変更してください。配送日・配送方法の判定に使われます。', en: 'If you have moved, please update this too. It is used to determine delivery days and methods.' },
    'my.otherProvinceWarning': { ja: '登録のエリアがOther Provincesのお客様は、他の配送業者の配送料金実費をご請求させて頂きます。予めご了承ください。', en: 'Customers registered under "Other Provinces" will be charged the actual delivery fee from our courier partner. Thank you for your understanding.' },
    'my.saveProfileBtn': { ja: 'お名前・住所・電話番号を保存する', en: 'Save name, address & phone number' },
    'my.favoritesTitle': { ja: 'お気に入り商品 / Favorite Products', en: 'Favorite Products' },
    'my.favShopBtn': { ja: '🛒 お気に入りをカートで見る / Shop your favorites', en: '🛒 Shop your favorites' },
    'my.favSearchPlaceholder': { ja: '商品名で検索して追加', en: 'Search by product name to add' },
    'my.orderAgainBtn': { ja: '🔁 もう一度注文する / Order again', en: '🔁 Order again' },
    'my.viewReceiptBtn': { ja: '🧾 伝票を見る / View receipt', en: '🧾 View receipt' },
    'my.statusCompleted': { ja: 'お届け完了', en: 'Delivered' },
    'my.statusCancelled': { ja: 'キャンセル済み', en: 'Cancelled' },
    'my.statusDeparted': { ja: '🚴 出発済み', en: '🚴 Out for delivery' },
    'my.statusPending': { ja: '準備中', en: 'Preparing' },
    'my.statusPastDate': { ja: 'ご対応中です', en: 'Processing' },
    'my.statusPaid': { ja: '💰 支払い済み', en: '💰 Paid' },
    'my.paidCancelNote': { ja: 'お支払いが確認できたため、この画面からのキャンセルはできません。キャンセルをご希望の場合はお電話でご連絡ください。 / Payment has been confirmed, so this order can no longer be cancelled here. Please call us if you need to cancel.', en: 'Payment has been confirmed, so this order can no longer be cancelled here. Please call us if you need to cancel.' },
    'my.paymentQr': { ja: 'QR振込み', en: 'QR transfer' },
    'my.paymentCash': { ja: '現金', en: 'Cash' },
    'my.loadMoreBtn': { ja: 'もっと見る / Load more', en: 'Load more' },
    'my.noProductInfo': { ja: '(商品情報なし)', en: '(No product info)' },
    'my.addMoreBtn': { ja: '🎉 まだ間に合います！追加注文する / Still time to add items', en: '🎉 Still time to add items' },
    'my.departedNote': { ja: '配送に出発したため、この画面からの変更はできません。お急ぎの場合はお電話でお問い合わせください。 / The delivery has already departed, so this order can no longer be changed here. Please call us if urgent.', en: 'The delivery has already departed, so this order can no longer be changed here. Please call us if urgent.' },
    'my.preparingNote': { ja: '準備が始まったためこの画面からの変更はできません。配送出発前であればお電話でも対応できる場合があります。 / Preparation has started — this order can no longer be changed here, but a phone call may still work if delivery hasn\'t left yet.', en: 'Preparation has started — this order can no longer be changed here, but a phone call may still work if delivery hasn\'t left yet.' },
    'my.cancelBtn': { ja: '❌ この注文をキャンセルする', en: '❌ Cancel this order' },
    'my.changeScheduleBtn': { ja: '📅 配送日時を変更する / Change date & time', en: '📅 Change date & time' },
    'my.scheduleModalTitle': { ja: '配送日時の変更 / Change delivery date & time', en: 'Change delivery date & time' },
    'my.scheduleModalCancel': { ja: 'キャンセル / Cancel', en: 'Cancel' },
    'my.scheduleModalConfirm': { ja: 'この日時に変更する / Confirm', en: 'Confirm' },
    'my.cancelConfirmMsg': { ja: 'この注文をキャンセルします。よろしいですか？\n使用したポイントがあれば残高に戻ります。', en: 'Cancel this order?\nAny points used will be refunded to your balance.' },
    'my.cancelSuccess': { ja: '注文をキャンセルしました。', en: 'Order cancelled.' },
    'my.cancelFailed': { ja: 'キャンセルに失敗しました', en: 'Cancellation failed' },
    'my.welcomeSuffix': { ja: '様、いつもありがとうございます。', en: ', thank you for your continued support.' },
    'my.staffLabel': { ja: '担当', en: 'Staff' },
    'my.staffFallback': { ja: '担当者', en: 'Staff member' },
    'my.departedAtLabel': { ja: '出発時刻', en: 'Departed at' },

    // ---- cart.html ----
    'cart.navCart': { ja: 'カート / Cart', en: 'Cart' },
    'cart.pageTitle': { ja: 'カート / Cart', en: 'Cart' },
    'cart.weightTag': { ja: '量り売り', en: 'By weight' },
    'cart.empty': { ja: 'カートに商品がありません / Your cart is empty', en: 'Your cart is empty' },
    'cart.loginTitle': { ja: '🔒 ログインしてください / Please log in', en: '🔒 Please log in' },
    'cart.loginHint': { ja: 'ご注文にはログインが必要です。カートの中身はこのまま保持されます。', en: 'You need to log in to place an order. Your cart contents will be kept as-is.' },
    'cart.emailPlaceholder': { ja: 'メールアドレス / Email', en: 'Email' },
    'cart.passwordPlaceholder': { ja: 'パスワード / Password', en: 'Password' },
    'cart.loginBtn': { ja: 'ログイン / Log in', en: 'Log in' },
    'cart.signupHintPre': { ja: 'アカウントをお持ちでない方は', en: 'If you don\'t have an account yet, you can register from' },
    'cart.signupHintLink': { ja: 'マイページ', en: 'My Page' },
    'cart.signupHintPost': { ja: 'から新規登録できます', en: '' },
    'cart.itemsTitle': { ja: '🛒 商品 / Items', en: '🛒 Items' },
    'cart.deliveryTitle': { ja: '🚚 配送日時 / Delivery date & schedule', en: '🚚 Delivery date & schedule' },
    'cart.deliveryDateLabel': { ja: '配送日 / Delivery date', en: 'Delivery date' },
    'cart.timeSlotLabel': { ja: '時間帯 / Time slot', en: 'Time slot' },
    'cart.closedNote': { ja: '※ 日曜定休 / Closed Sundays　・　土曜は午前のみ / Saturdays: morning only', en: '※ Closed Sundays　・　Saturdays: morning only' },
    'cart.srirachaDateLabel': { ja: '配送日 / Delivery date(火曜日または木曜日)', en: 'Delivery date (Tuesday or Thursday)' },
    'cart.condoLabel': { ja: 'コンドミニアム / Condominium', en: 'Condominium' },
    'cart.condoOtherPlaceholder': { ja: 'コンドミニアム名を入力してください', en: 'Please enter your condominium name' },
    'cart.srirachaNote': { ja: '※ シラチャエリアは時間指定不可・配送順に順次お届けします(注文確定後、車両位置情報のご案内をいたします)', en: '※ Sriracha area: no time selection — delivered in order (vehicle tracking info provided after order confirmation)' },
    'cart.pattayaNote': { ja: '※ パタヤは月1回設定された配送日のみご注文いただけます(注文確定後、車両位置情報のご案内をいたします)', en: '※ Pattaya: orders only accepted on the one scheduled delivery day per month (vehicle tracking info provided after order confirmation)' },
    'cart.shippingTitle': { ja: '💰 配送料について / Shipping fee', en: '💰 Shipping fee' },
    'cart.couponLabel': { ja: 'クーポンコード / Coupon code', en: 'Coupon code' },
    'cart.applyBtn': { ja: '適用 / Apply', en: 'Apply' },
    'cart.usePointsLabel': { ja: 'ポイントを使う / Use points', en: 'Use points' },
    'cart.usePointsCheckbox': { ja: '今回の注文でポイントを使う / Use points on this order', en: 'Use points on this order' },
    'cart.pointsAmountLabel': { ja: '使用ポイント数 / Amount to use', en: 'Amount to use' },
    'cart.pointsHint': { ja: 'チェックを入れると残高が自動で入力されます。数量を減らせば一部だけ使うことも可能です。', en: 'Checking the box fills in your full balance — lower the number if you\'d rather use only part of it. 1 pt = ฿1 discount.' },
    'cart.originalSubtotal': { ja: '元のご注文小計 / Original order subtotal', en: 'Original order subtotal' },
    'cart.subtotal': { ja: '小計 / Subtotal', en: 'Subtotal' },
    'cart.shippingRow': { ja: '配送料 / Shipping', en: 'Shipping' },
    'cart.discountRow': { ja: '割引 / Discount', en: 'Discount' },
    'cart.pointsUsedRow': { ja: 'ポイント利用 / Points used', en: 'Points used' },
    'cart.total': { ja: '合計 / Total', en: 'Total' },
    'cart.grandTotal': { ja: '総合計(元のご注文+今回追加分) / Grand total (original + additional)', en: 'Grand total (original + additional)' },
    'cart.weightNote': { ja: '※ 量り売り商品は単価×数量の目安金額で合計に含まれます。実際の金額は重量確定後に確定します(送料は注文時点で決まったものが適用され、後から追加請求されることはありません)', en: '※ Weight-based items are included at an estimated price (unit price × quantity). The final amount is confirmed once the actual weight is set (the shipping fee is fixed at order time and never billed again later).' },
    'cart.paymentTitle': { ja: '💳 支払い方法 / Payment method', en: '💳 Payment method' },
    'cart.payQrLabel': { ja: '📱 QRコード決済および銀行振込 / QR payment & Bank transfer', en: '📱 QR payment & Bank transfer' },
    'cart.payQrSub': { ja: 'ご注文確定後、QRコード(PromptPay)と送金用ページ(銀行口座も表示)をご案内します', en: 'After you confirm your order, you will see a PromptPay QR code and a payment page that also shows our bank account' },
    'cart.payTransferLabel': { ja: '🏦 銀行振込 / Bank transfer', en: '🏦 Bank transfer' },
    'cart.payTransferSub': { ja: 'SCB口座へお振込み', en: 'Transfer to our SCB account' },
    'cart.payCodLabel': { ja: '💵 代金引換 / Cash on delivery', en: '💵 Cash on delivery' },
    'cart.payCodSub': { ja: '配達員にお支払い', en: 'Pay the driver on delivery' },
    'cart.bankNote': { ja: '※ ご注文確定後、スリップアップロード用リンクが表示されます', en: '※ A slip upload link will be shown after you confirm your order' },
    'cart.codNote': { ja: '配達時に配達員へ直接お支払いください。おつりは必ず準備してお伺いします。', en: 'Please pay the driver directly at delivery. We will always bring correct change.' },
    'cart.deliveryOptsLabel': { ja: '配送に関するご希望 / Delivery preferences', en: 'Delivery preferences' },
    'cart.optLeaveAtTable': { ja: '置き配希望(デリバリー用テーブルに置いてください) / Leave at delivery table', en: 'Leave at delivery table' },
    'cart.optNoContact': { ja: '到着時のご連絡は不要です / No need to call on arrival', en: 'No need to call on arrival' },
    'cart.leaveTitle': { ja: '置き配(デリバリー用テーブルに置く)について / Leave at delivery table?', en: 'Leave at delivery table?' },
    'cart.leaveNone': { ja: '置き配しない(直接お渡し) / No — hand it to me', en: 'No — hand it to me' },
    'cart.leaveCallBadge': { ja: '📞 電話連絡が必要', en: '📞 Please CALL me' },
    'cart.leaveCallText': { ja: '置き配OK。到着したら必ず電話してください / Leave at the table and call me when you arrive', en: 'Leave at the table and call me when you arrive' },
    'cart.leaveNoCallBadge': { ja: '🔕 電話連絡は不要', en: '🔕 Do NOT call me' },
    'cart.leaveNoCallText': { ja: '置き配OK。電話はしないでください / Leave at the table, no call needed', en: 'Leave at the table, no call needed' },
    'cart.optLeaveAtFront': { ja: 'フロント(管理人室)に預けてください / Leave with front desk', en: 'Leave with front desk' },
    'cart.optPaymentAtFront': { ja: '代金はフロントに預けてあります / Payment left with front desk', en: 'Payment left with front desk' },
    'cart.optNoChange': { ja: 'お釣りは不要です / No change needed', en: 'No change needed' },
    'cart.commentLabel': { ja: '備考 / Comment', en: 'Comment' },
    'cart.commentPlaceholder': { ja: '例: 玄関前に置いてください', en: 'e.g. Please leave it by the front door' },
    'cart.translateHint': { ja: '日本語のままでも大丈夫です。配送スタッフに直接伝わりやすくしたい場合は、お好みで「タイ語に翻訳」をお試しください(翻訳は必須ではありません)。', en: 'Japanese is fine as-is. If you\'d like it to come across more clearly to our delivery staff, feel free to try "Translate to Thai" — it\'s completely optional.' },
    'cart.translateBtn': { ja: '🇹🇭 タイ語に翻訳', en: '🇹🇭 Translate to Thai' },
    'cart.translateUndoBtn': { ja: '元の日本語に戻す', en: 'Revert to Japanese' },
    'cart.placeOrderBtn': { ja: '注文を確定する / Place order', en: 'Place order' },
    'cart.successTitle': { ja: 'ご注文ありがとうございます！ / Order placed!', en: 'Order placed!' },
    'cart.qrCaption': { ja: 'PromptPay QR —', en: 'PromptPay QR —' },
    'cart.copyBtn': { ja: 'コピー / Copy', en: 'Copy' },
    'cart.gpsTitle': { ja: '🚚 配送車両の位置情報 / Vehicle tracking', en: '🚚 Vehicle tracking' },
    'cart.gpsNote1': { ja: '配送日の朝、下記リンクから配送車両の現在地をご確認いただけます。', en: 'On the morning of delivery, you can check the vehicle\'s current location via the link below.' },
    'cart.gpsUsernameLabel': { ja: 'ユーザー名 / Username', en: 'Username' },
    'cart.gpsPasswordLabel': { ja: 'パスワード / Password', en: 'Password' },
    'cart.gpsAppNote': { ja: '※ スマホアプリ「sinotrack pro」でも同じ情報でログインできます', en: '※ You can also log in with the same info in the "sinotrack pro" mobile app' },
    'cart.lineGroupTitle': { ja: '💬 LINEグループにご参加ください / Join our LINE group', en: '💬 Join our LINE group' },
    'cart.lineGroupPurpose': { ja: '配送状況のご連絡、配送予定のリマインダー、配送順序のご案内のほか、お客様からのご連絡にも使用します。', en: 'We use this group for delivery status updates, delivery reminders, the delivery order for the day, and messages from you.' },
    'cart.lineGroupNote': { ja: '下のQRコードを読み取るか、ボタンをタップして参加できます。', en: 'Scan the QR code below, or tap the button to join.' },
    'cart.lineGroupBtn': { ja: 'LINEグループに参加する / Join the LINE group', en: 'Join the LINE group' },
    'cart.viewReceiptBtn': { ja: '🧾 伝票を表示・印刷する / View & print receipt', en: '🧾 View & print receipt' },
    'cart.backToProductsBtn': { ja: '商品一覧に戻る / Back to products', en: 'Back to products' },
    'cart.addtoTitle': { ja: '➕ 追加注文 / Additional order', en: '➕ Additional order' },
    'cart.addtoBrowseBtn': { ja: '🛒 追加する商品を選ぶ / Browse products to add', en: '🛒 Browse products to add' },
    'cart.addtoExitLink': { ja: '追加注文モードをやめて通常のご注文に戻る / Exit add-on mode', en: 'Exit add-on mode' },
    'cart.addtoOriginalTitle': { ja: '📦 元のご注文内容(確定済み・変更不可) / Original order (already confirmed)', en: '📦 Original order (already confirmed)' },
    'plist.addtoModeText': { ja: '追加注文モード中です。選んだ商品はカートで元のご注文に追加されます。', en: 'You are in add-on mode. Items you select will be added to your original order in the cart.' },
    'plist.addtoModeCartLink': { ja: 'カートを見る → / View cart →', en: 'View cart →' },
  };

  function getLang() {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'ja';
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang === 'en' ? 'en' : 'ja');
  }

  function textFor(key) {
    var entry = DICT[key];
    if (!entry) return null;
    var lang = getLang();
    return entry[lang] || entry.ja || '';
  }

  function apply() {
    var lang = getLang();
    document.documentElement.lang = lang === 'en' ? 'en' : 'ja';

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = textFor(key);
      if (val !== null) el.textContent = val;
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      var val = textFor(key);
      if (val !== null) el.innerHTML = val;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      var val = textFor(key);
      if (val !== null) el.placeholder = val;
    });

    var btn = document.getElementById('lang-toggle-btn');
    if (btn) btn.textContent = lang === 'ja' ? 'EN' : '日本語';

    document.dispatchEvent(new CustomEvent('saitofoods-langchange', { detail: { lang: lang } }));
  }

  function toggle() {
    setLang(getLang() === 'ja' ? 'en' : 'ja');
    apply();
  }

  window.i18nApply = apply;
  window.i18nToggle = toggle;
  window.i18nGetLang = getLang;
  window.i18nText = textFor;

  document.addEventListener('DOMContentLoaded', apply);
})();

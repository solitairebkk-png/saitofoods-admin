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
    'sidebar.all': { ja: 'すべて / All', en: 'All' },

    // ---- anniversary badge ----
    'anniversary.since': { ja: 'since 1997', en: 'since 1997' },

    // ---- index.html hero ----
    'hero.h1': { ja: '私たちサイトウフーズの想い、、、それはおいしい生活@タイランド！', en: 'Our wish at Saito Foods... a delicious life in Thailand!' },
    'hero.p': { ja: 'おいしいね！ってみんなが笑顔になれる幸せは万国共通。おいしいものを囲んでほっとできるひとときへ、少しのお手伝いが出来たら、、、と願い、今日も皆様の食卓へ美味しさと笑顔をお届けします。美味宅配。', en: 'That happy "This is delicious!" feeling is universal. We hope to help create relaxing moments around good food. Today too, we deliver taste and smiles to your table.' },
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
    'hours.storeLine1': { ja: '月～金　8:20-17:30', en: 'Mon–Fri  8:20-17:30' },
    'hours.contactTitle': { ja: 'お問い合わせ', en: 'Contact' },
    'hours.contactLine1': { ja: '月～金　8:20-12:00　13:00-17:45', en: 'Mon–Fri  8:20-12:00  13:00-17:45' },
    'hours.contactLine2': { ja: '土曜日　9:00-12:00　月2回営業', en: 'Sat  9:00-12:00 (2x/month)' },
    'hours.contactPhoneNote': { ja: '（コン・イープンと呼び出してください。）', en: '(Please ask for "Khun Eepun")' },
    'calendar.title': { ja: '配送カレンダー / Delivery Calendar', en: 'Delivery Calendar' },
    'calendar.legendOpen': { ja: '営業日 / Open', en: 'Open' },
    'calendar.legendSat': { ja: '土曜午前のみ / Saturday morning only', en: 'Saturday morning only' },
    'calendar.legendSriracha': { ja: 'シラチャ配送日 / Sriracha delivery day', en: 'Sriracha delivery day' },
    'calendar.legendPattaya': { ja: 'パタヤ配送日 / Pattaya delivery day', en: 'Pattaya delivery day' },

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
    'plist.localSpecial': { ja: '🏠 ローカル限定', en: '🏠 Local special' },
    'plist.localTagModal': { ja: '🏠 ローカル限定商品 / Local special item', en: '🏠 Local special item' },
    'plist.weightSale': { ja: '⚖️ 量り売り', en: '⚖️ Sold by weight' },
    'plist.categoryLinkSuffix': { ja: 'カテゴリへ→', en: '' },
    'plist.frequentlyBought': { ja: '一緒に購入されている商品 / Frequently bought together', en: 'Frequently bought together' },
    'plist.favLoginConfirm': { ja: 'お気に入り登録にはログインが必要です。マイページへ移動しますか？ / Please log in to save favorites. Go to My Page?', en: 'Please log in to save favorites. Go to My Page?' },
    'plist.addedToCart': { ja: 'カートに追加しました ✓', en: 'Added to cart ✓' },
    'plist.backBtn': { ja: '← 戻る / Back', en: '← Back' },
    'plist.favAddLabel': { ja: '← お気に入りに追加 / Add to favorite', en: '← Add to favorite' },

    // ---- user_guide.html ----
    'guide.h1': { ja: 'ユーザーガイド / User Guide', en: 'User Guide' },
    'guide.item1': { ja: 'トップページの配送エリアをご確認くださいませ。', en: 'Please check the delivery area on the top page.' },
    'guide.item2': { ja: '配送エリア内はご購入代金合計600baht以上で送料無料で配送サービスを承っております。', en: 'Within the delivery area, orders totaling 600 baht or more qualify for free delivery.' },
    'guide.item2sub': { ja: '※お買い物合計金額600baht以下の配送は別途配送料がかかります。', en: '※ A separate delivery fee applies for orders totaling less than 600 baht.' },
    'guide.item3': { ja: '会員登録を完了してからご注文をお願いいたします。お支払いは商品到着時にタイバーツ現金にてお支払いいただくか、QRコード、銀行振込みをご利用いただけます。', en: 'Please complete member registration before ordering. Payment can be made in Thai baht cash on delivery, or by QR code / bank transfer.' },
    'guide.item3sub': { ja: '※口座番号等々はご注文時にご案内しております。', en: '※ Bank account details are provided at the time of your order.' },
    'guide.item4': { ja: '配送エリア外への配送に関しましてはお問い合わせくださいませ。', en: 'Please contact us regarding delivery outside our regular delivery area.' },
    'guide.item5': { ja: '県外への配送も可能です。Nim Express様のクール便を利用配送料はNim Express様の実費を頂いております。海外へ持ち出される場合は別途発泡スチロール箱やドライアイスの手配も別料金にて可能です。', en: 'Delivery to other provinces is also possible using Nim Express cold-chain courier, charged at their actual cost. If you plan to take items abroad, styrofoam boxes and dry ice can be arranged for an additional fee.' },
    'guide.item6': { ja: '配送の混み具合により早期に当日の配送受付を締め切る場合が御座います。', en: 'Same-day delivery orders may close earlier than usual depending on how busy we are.' },
    'guide.item7': { ja: 'webサイトからご購入の場合はご購入金額の約1%のポイントが取得でき次回のお買い物の際に1ポイント＝1bahtとしてご利用いただけます。', en: 'Purchases made on the website earn approximately 1% in points, redeemable as 1 point = 1 baht on your next order.' },
    'guide.item7sub': { ja: '最後にご利用いただいてからご利用がないまま90日が経過しますとポイントは失効となりますのでご注意くださいませ。また、ポイントの換金は致しかねます。', en: 'Points expire if unused for 90 days after your last order. Points cannot be exchanged for cash.' },
    'guide.item8': { ja: 'タイの国民の祝日及び毎週日曜日、第三土曜日を定休日とさせて頂いております。', en: 'We are closed on Thai national holidays, every Sunday, and the third Saturday of the month.' },

    // ---- mypage.html ----
    'my.tabLogin': { ja: 'ログイン', en: 'Log in' },
    'my.tabSignup': { ja: '初めての方', en: 'First time' },
    'my.emailLabel': { ja: 'メールアドレス', en: 'Email address' },
    'my.passwordLabel': { ja: 'パスワード', en: 'Password' },
    'my.loginBtn': { ja: 'ログイン', en: 'Log in' },
    'my.forgotLink': { ja: 'パスワードをお忘れですか？', en: 'Forgot your password?' },
    'my.forgotHint': { ja: 'ご登録のメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。', en: 'Please enter your registered email address. We will send you a password reset link.' },
    'my.forgotBtn': { ja: '再設定メールを送る', en: 'Send reset email' },
    'my.backToLogin': { ja: 'ログインに戻る', en: 'Back to login' },
    'my.resetHint': { ja: '新しいパスワードを設定してください。', en: 'Please set a new password.' },
    'my.newPasswordLabel': { ja: '新しいパスワード', en: 'New password' },
    'my.passwordConfirmLabel': { ja: 'パスワード(確認)', en: 'Confirm password' },
    'my.resetBtn': { ja: 'パスワードを更新する', en: 'Update password' },
    'my.signupHint': { ja: 'ご登録済みのメールアドレスで、初めてログインするためのパスワードを設定してください。これまでのご注文履歴・ポイント残高がそのまま引き継がれます。', en: 'Please set a password for your first login using your registered email address. Your order history and point balance will carry over as-is.' },
    'my.signupEmailLabel': { ja: 'ご登録のメールアドレス', en: 'Registered email address' },
    'my.signupBtn': { ja: 'パスワードを設定する', en: 'Set password' },
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
    'my.telLabel': { ja: '電話番号', en: 'Phone number' },
    'my.address1Label': { ja: '住所1', en: 'Address line 1' },
    'my.address2Label': { ja: '住所2', en: 'Address line 2' },
    'my.areaLabel': { ja: 'エリア / Area', en: 'Area' },
    'my.areaHint': { ja: '引っ越しされた場合は、こちらも変更してください。配送日・配送方法の判定に使われます。', en: 'If you have moved, please update this too. It is used to determine delivery days and methods.' },
    'my.saveProfileBtn': { ja: '住所・電話番号を保存する', en: 'Save address & phone number' },
    'my.favoritesTitle': { ja: 'お気に入り商品 / Favorite Products', en: 'Favorite Products' },
    'my.favSearchPlaceholder': { ja: '商品名で検索して追加', en: 'Search by product name to add' },
    'my.orderAgainBtn': { ja: '🔁 もう一度注文する / Order again', en: '🔁 Order again' },
    'my.viewReceiptBtn': { ja: '🧾 伝票を見る / View receipt', en: '🧾 View receipt' },
    'my.statusCompleted': { ja: 'お届け完了', en: 'Delivered' },
    'my.statusCancelled': { ja: 'キャンセル済み', en: 'Cancelled' },
    'my.statusDeparted': { ja: '🚴 出発済み', en: '🚴 Out for delivery' },
    'my.statusPending': { ja: '準備中', en: 'Preparing' },
    'my.paymentQr': { ja: 'QR振込み', en: 'QR transfer' },
    'my.paymentCash': { ja: '現金', en: 'Cash' },
    'my.loadMoreBtn': { ja: 'もっと見る / Load more', en: 'Load more' },
    'my.noProductInfo': { ja: '(商品情報なし)', en: '(No product info)' },
    'my.addMoreBtn': { ja: '🎉 まだ間に合います！追加注文する / Still time to add items', en: '🎉 Still time to add items' },
    'my.departedNote': { ja: '配送に出発したため、この画面からの追加はできません。お急ぎの場合はお電話でお問い合わせください。 / The delivery has already departed, so items can no longer be added here. Please call us if urgent.', en: 'The delivery has already departed, so items can no longer be added here. Please call us if urgent.' },
    'my.preparingNote': { ja: '準備が始まったためこの画面からの追加はできません。配送出発前であればお電話でも対応できる場合があります。 / Preparation has started — this screen can no longer be used, but a phone call may still work if delivery hasn\'t left yet.', en: 'Preparation has started — this screen can no longer be used, but a phone call may still work if delivery hasn\'t left yet.' },
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
    'cart.payQrLabel': { ja: '📱 PromptPay QR', en: '📱 PromptPay QR' },
    'cart.payQrSub': { ja: 'QRコードを読み取って送金', en: 'Scan the QR code to pay' },
    'cart.payTransferLabel': { ja: '🏦 銀行振込 / Bank transfer', en: '🏦 Bank transfer' },
    'cart.payTransferSub': { ja: 'SCB口座へお振込み', en: 'Transfer to our SCB account' },
    'cart.payCodLabel': { ja: '💵 代金引換 / Cash on delivery', en: '💵 Cash on delivery' },
    'cart.payCodSub': { ja: '配達員にお支払い', en: 'Pay the driver on delivery' },
    'cart.bankNote': { ja: '※ ご注文確定後、スリップアップロード用リンクが表示されます', en: '※ A slip upload link will be shown after you confirm your order' },
    'cart.codNote': { ja: '配達時に配達員へ直接お支払いください。おつりは必ず準備してお伺いします。', en: 'Please pay the driver directly at delivery. We will always bring correct change.' },
    'cart.commentLabel': { ja: '備考 / Comment', en: 'Comment' },
    'cart.commentPlaceholder': { ja: '例: 玄関前に置いてください', en: 'e.g. Please leave it by the front door' },
    'cart.placeOrderBtn': { ja: '注文を確定する / Place order', en: 'Place order' },
    'cart.successTitle': { ja: 'ご注文ありがとうございます！ / Order placed!', en: 'Order placed!' },
    'cart.qrCaption': { ja: 'PromptPay QR —', en: 'PromptPay QR —' },
    'cart.copyBtn': { ja: 'コピー / Copy', en: 'Copy' },
    'cart.gpsTitle': { ja: '🚚 配送車両の位置情報 / Vehicle tracking', en: '🚚 Vehicle tracking' },
    'cart.gpsNote1': { ja: '配送日の朝、下記リンクから配送車両の現在地をご確認いただけます。', en: 'On the morning of delivery, you can check the vehicle\'s current location via the link below.' },
    'cart.gpsUsernameLabel': { ja: 'ユーザー名 / Username', en: 'Username' },
    'cart.gpsPasswordLabel': { ja: 'パスワード / Password', en: 'Password' },
    'cart.gpsAppNote': { ja: '※ スマホアプリ「sinotrack pro」でも同じ情報でログインできます', en: '※ You can also log in with the same info in the "sinotrack pro" mobile app' },
    'cart.viewReceiptBtn': { ja: '🧾 伝票を表示・印刷する / View & print receipt', en: '🧾 View & print receipt' },
    'cart.backToProductsBtn': { ja: '商品一覧に戻る / Back to products', en: 'Back to products' },
    'cart.addtoTitle': { ja: '➕ 追加注文 / Additional order', en: '➕ Additional order' },
    'cart.addtoOriginalTitle': { ja: '📦 元のご注文内容(確定済み・変更不可) / Original order (already confirmed)', en: '📦 Original order (already confirmed)' },
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

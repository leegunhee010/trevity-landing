/* =====================================================================
   TREVITY 랜딩 — 광고 전환 추적
   ─────────────────────────────────────────────────────────────────────
   ★ 받으면 아래 ID "값"만 교체하세요. (XXXX 가 들어간 값은 자동 비활성)
   - 한 곳만 바꾸면 index / thanks 양쪽에 동시에 적용됩니다.
   - 권장: '직접 ID 방식'(아래 META/GADS) 또는 'GTM 방식' 중 하나만 사용.
     둘 다 같은 Lead 이벤트를 잡으면 전환이 중복 집계됩니다.
   ===================================================================== */
window.TRACKING = {
  GTM_ID:        'GTM-XXXXXXX',          // Google Tag Manager (선택)
  META_PIXEL_ID: '1581482603705434',     // Meta(페이스북) 픽셀 ID
  GADS_ID:       'AW-XXXXXXXXXX',        // Google Ads 전환 ID
  GADS_LABEL:    'XXXXXXXXXXXXXXXXXXXX', // Google Ads 전환 라벨
  GA4_ID:        'G-XXXXXXXXXX'          // GA4 측정 ID (선택)
};

/* 값이 아직 placeholder(XXX...) 면 false → 로드하지 않음 (콘솔 에러 방지) */
function _isSet(v){ return !!v && !/X{3,}/.test(v); }

/* 모든 페이지 <head>에서 호출 — 픽셀/태그 베이스 로드 + PageView */
function initTracking(){
  var T = window.TRACKING || {};

  /* ---- Google Tag Manager ---- */
  if (_isSet(T.GTM_ID)) {
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;
      j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',T.GTM_ID);
  }

  /* ---- Meta(Facebook) Pixel ---- */
  if (_isSet(T.META_PIXEL_ID)) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', T.META_PIXEL_ID);
    fbq('track', 'PageView');
  }

  /* ---- Google Ads / GA4 (gtag.js) ---- */
  if (_isSet(T.GADS_ID) || _isSet(T.GA4_ID)) {
    var firstId = _isSet(T.GA4_ID) ? T.GA4_ID : T.GADS_ID;
    var g = document.createElement('script'); g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + firstId;
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ dataLayer.push(arguments); };
    gtag('js', new Date());
    if (_isSet(T.GA4_ID))  gtag('config', T.GA4_ID);
    if (_isSet(T.GADS_ID)) gtag('config', T.GADS_ID);
  }
}

/* thank-you 페이지에서만 호출 — 리드 전환 1건 발사 */
function fireLead(){
  var T = window.TRACKING || {};

  /* Meta: Lead */
  if (_isSet(T.META_PIXEL_ID) && window.fbq) fbq('track', 'Lead');

  /* Google Ads: 전환 + GA4: generate_lead */
  if (window.gtag) {
    if (_isSet(T.GADS_ID) && _isSet(T.GADS_LABEL))
      gtag('event', 'conversion', { send_to: T.GADS_ID + '/' + T.GADS_LABEL });
    if (_isSet(T.GA4_ID))
      gtag('event', 'generate_lead', { currency: 'KRW', value: 0 });
  }

  /* GTM 방식 쓸 경우: dataLayer 이벤트로 트리거 */
  if (window.dataLayer) window.dataLayer.push({ event: 'generate_lead' });
}

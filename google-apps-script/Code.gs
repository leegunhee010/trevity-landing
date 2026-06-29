/* =====================================================================
   트래비티 KOC 비법서 신청 — 구글 시트 저장 + 사장님 알림 + 신청자에게 비법서 PDF 자동발송
   ─────────────────────────────────────────────────────────────────────
   [설치 / 업데이트 방법]  ── PDF는 이미 랜딩 폴더(trevity-koc-ebook.pdf)에 들어가 있음
   1) trevity-landing 을 git push  → PDF가 GitHub Pages에 라이브가 됨
        (확인: 브라우저에서 EBOOK_URL 열어서 PDF가 뜨면 OK)
   2) https://script.google.com → 이 코드 전체 붙여넣기 → 저장
   3) 함수 목록에서 setup 실행 → 권한 승인 (메일·외부요청 권한 새로 뜸 → 허용)
        (로그에 '비법서 URL 응답코드: 200 (정상)' 이 뜨면 준비 완료)
   4) testSendToSelf 실행 → 본인 메일로 비법서가 오는지 테스트
   5) [배포] → 기존 배포 있으면 [배포 관리] → 연필(편집) → 버전 '새 버전' → 배포
        (처음이면 [새 배포] → 웹 앱 / 실행:나 / 액세스:모든 사용자)
      → /exec URL 은 그대로 유지됨 (index.html 수정 불필요)
   ===================================================================== */

var SHEET_NAME    = '신청';
var NOTIFY_EMAIL  = 'meeneex2@gmail.com';                 // 사장님(알림 받을 곳, 답장 주소)
var SENDER_NAME   = '트래비티 (Trevity)';                 // 신청자에게 보일 발신자 이름
var LANDING_URL   = 'https://leegunhee010.github.io/trevity-landing/';

/* 비법서 PDF 출처 — 둘 중 하나만 있으면 됨 (URL 우선) */
var EBOOK_URL     = 'https://leegunhee010.github.io/trevity-landing/trevity-koc-ebook.pdf'; // ★기본: 랜딩 폴더에 PDF push 하면 끝
var EBOOK_FILE_ID = '';                                    // (대안) 드라이브에 올렸을 때만 파일 ID 붙여넣기
var EBOOK_FILENAME = '트래비티_베트남_KOC_마케팅_비법서.pdf';

var HEADERS = ['신청일시','이름','매장명','업종','전화번호','이메일','추가내용','비법서발송'];

/* 폼 제출 수신 → 시트 저장 + 신청자에게 PDF 발송 + 사장님 알림 */
function doPost(e){
  try{
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);

    var p   = (e && e.parameter) || {};
    var now = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HH:mm:ss');

    var sent = sendEbook_(p);                 // 신청자에게 비법서 자동발송
    var sentMark = (sent === true) ? 'O' : ('X(' + sent + ')');

    var sh = getSheet_();
    sh.appendRow([
      now,
      p['이름']     || '',
      p['매장명']   || '',
      p['업종']     || '',
      p['전화번호'] || '',
      p['이메일']   || '',
      p['추가내용'] || '',
      sentMark
    ]);
    lock.releaseLock();

    notify_(p, now, sentMark);
    return json_({ result:'success', sent:sentMark });
  }catch(err){
    return json_({ result:'error', message:String(err) });
  }
}

/* 브라우저로 URL 열었을 때 동작 확인용 */
function doGet(){
  return json_({ result:'ok', sheet: getSheet_().getParent().getUrl() });
}

/* 최초 1회 실행 — 시트 생성 + 권한 승인 + 주소 로그 */
function setup(){
  var url = getSheet_().getParent().getUrl();
  Logger.log('신청 DB 시트: ' + url);
  if(EBOOK_URL){
    var code = UrlFetchApp.fetch(EBOOK_URL, {muteHttpExceptions:true}).getResponseCode();
    Logger.log('비법서 URL 응답코드: ' + code + (code===200 ? ' (정상)' : ' (⚠️ PDF가 아직 안 올라갔거나 URL 확인 필요)'));
  }else if(EBOOK_FILE_ID){
    Logger.log('비법서 파일(드라이브): ' + DriveApp.getFileById(EBOOK_FILE_ID).getName());
  }else{
    Logger.log('⚠️ EBOOK_URL / EBOOK_FILE_ID 둘 다 비어있음 — PDF 자동발송이 안 됩니다.');
  }
  return url;
}

/* 설정 점검용 — 내 이메일로 비법서를 보내 테스트 */
function testSendToSelf(){
  var ok = sendEbook_({ '이름':'테스트', '이메일': NOTIFY_EMAIL });
  Logger.log('테스트 발송 결과: ' + ok);
}

/* ---- 신청자에게 비법서 PDF 발송 ---- */
function sendEbook_(p){
  try{
    var to = String(p['이메일'] || '').trim();
    if(!to || to.indexOf('@') < 0) return 'no-email';

    var blob;
    if(EBOOK_URL){
      blob = UrlFetchApp.fetch(EBOOK_URL).getBlob().setName(EBOOK_FILENAME);
    }else if(EBOOK_FILE_ID){
      blob = DriveApp.getFileById(EBOOK_FILE_ID).getBlob().setName(EBOOK_FILENAME);
    }else{
      return 'no-file-source';
    }
    var name = String(p['이름'] || '').trim() || '사장님';

    var html =
      '<div style="font-family:\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;max-width:560px;margin:0 auto;color:#241c2e;line-height:1.75">' +
        '<div style="background:linear-gradient(135deg,#a23ad1,#681d80);padding:26px 24px;border-radius:14px 14px 0 0;color:#fff">' +
          '<div style="font-size:12px;letter-spacing:3px;color:#ffe27a;font-weight:700">TREVITY · V-MARKETING</div>' +
          '<div style="font-size:21px;font-weight:800;margin-top:8px">베트남 KOC 마케팅 비법서</div>' +
        '</div>' +
        '<div style="border:1px solid #e7ddef;border-top:0;border-radius:0 0 14px 14px;padding:26px 24px">' +
          '<p>' + escapeHtml_(name) + ' 사장님, 안녕하세요. 트래비티입니다.</p>' +
          '<p>신청해 주셔서 감사합니다. 요청하신 <b>「사장님을 위한 베트남 KOC 마케팅 비법서」</b>를 ' +
            '이 메일에 <b>PDF로 첨부</b>해 보내드립니다. 📘</p>' +
          '<p style="background:#f5ecfb;border-left:4px solid #a23ad1;padding:12px 16px;border-radius:6px;margin:18px 0">' +
            '틱톡·KOC가 왜 베트남에서 강한지, 어떤 KOC를 어떻게 섭외하는지 ' +
            '— 현장에서 바로 쓰는 노하우를 한 권에 담았습니다.</p>' +
          '<p>읽어보시고 <b>“우리 매장엔 어떻게 적용하지?”</b> 궁금하시면, ' +
            '이 메일에 그대로 회신해 주세요. <b>무료로 KOC 전략을 진단</b>해 드립니다.</p>' +
          '<p style="margin-top:22px;color:#7b7385;font-size:13px">트래비티(TREVITY VIETNAM) · 호치민 · 대구 · 서울<br>' +
            '<a href="' + LANDING_URL + '" style="color:#a23ad1">' + LANDING_URL + '</a></p>' +
        '</div>' +
      '</div>';

    var plain =
      name + ' 사장님, 안녕하세요. 트래비티입니다.\n\n' +
      '신청해 주셔서 감사합니다. 요청하신 「베트남 KOC 마케팅 비법서」를 PDF로 첨부해 보내드립니다.\n\n' +
      '읽어보시고 우리 매장 적용이 궁금하시면 이 메일에 회신해 주세요 — 무료로 KOC 전략을 진단해 드립니다.\n\n' +
      '트래비티 · 호치민·대구·서울\n' + LANDING_URL;

    MailApp.sendEmail({
      to: to,
      subject: '[트래비티] 신청하신 베트남 KOC 마케팅 비법서입니다 📘',
      body: plain,
      htmlBody: html,
      name: SENDER_NAME,
      replyTo: NOTIFY_EMAIL,
      attachments: [blob]
    });
    return true;
  }catch(err){
    return String(err);
  }
}

/* ---- 내부 ---- */
function getSheet_(){
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  var ss;
  if(id){
    ss = SpreadsheetApp.openById(id);
  }else{
    ss = SpreadsheetApp.create('트래비티 KOC 비법서 신청 DB');
    props.setProperty('SHEET_ID', ss.getId());
  }
  var sh = ss.getSheetByName(SHEET_NAME);
  if(!sh){
    sh = ss.getSheets()[0];
    sh.setName(SHEET_NAME);
  }
  if(sh.getLastRow() === 0){
    sh.appendRow(HEADERS);
    sh.getRange(1,1,1,HEADERS.length).setFontWeight('bold').setBackground('#f7f0fc');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1,150); sh.setColumnWidth(7,300);
  }
  return sh;
}

function notify_(p, now, sentMark){
  try{
    var body =
      '새 비법서 신청이 접수됐습니다.\n\n' +
      '신청일시 : ' + now + '\n' +
      '이름     : ' + (p['이름']||'') + '\n' +
      '매장명   : ' + (p['매장명']||'') + '\n' +
      '업종     : ' + (p['업종']||'') + '\n' +
      '전화번호 : ' + (p['전화번호']||'') + '\n' +
      '이메일   : ' + (p['이메일']||'') + '\n' +
      '추가내용 : ' + (p['추가내용']||'') + '\n\n' +
      '비법서 자동발송 : ' + sentMark + '\n';
    MailApp.sendEmail(NOTIFY_EMAIL, '[트래비티] KOC 비법서 신청 — ' + (p['매장명']||''), body);
  }catch(err){ /* 메일 실패해도 시트 저장은 유지 */ }
}

function escapeHtml_(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function json_(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

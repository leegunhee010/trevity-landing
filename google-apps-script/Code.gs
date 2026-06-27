/* =====================================================================
   트래비티 KOC 비법서 신청 — 구글 시트 자동저장 + 이메일 알림
   ─────────────────────────────────────────────────────────────────────
   [설치 방법]
   1) https://script.google.com → 새 프로젝트
   2) 이 코드 전체 붙여넣기 → 저장
   3) 함수 목록에서 setup 선택 → 실행 → 권한 승인
      (실행 로그에 '신청 DB 시트' 주소가 찍힘 — 그게 누적되는 시트)
   4) 우측 상단 [배포] → [새 배포] → 유형: 웹 앱
        - 실행 계정: 나
        - 액세스 권한: 모든 사용자(Anyone)
      → 배포 → '웹 앱 URL'(.../exec) 복사
   5) index.html 의 SHEET_ENDPOINT 에 그 URL 붙여넣기 → git push
   ===================================================================== */

var SHEET_NAME   = '신청';
var NOTIFY_EMAIL = 'meeneex2@gmail.com';   // 알림 받을 이메일
var HEADERS = ['신청일시','이름','매장명','업종','전화번호','이메일','추가내용'];

/* 폼 제출 수신 → 시트에 한 줄 추가 + 알림 메일 */
function doPost(e){
  try{
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);

    var sh = getSheet_();
    var p  = (e && e.parameter) || {};
    var now = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HH:mm:ss');

    sh.appendRow([
      now,
      p['이름']     || '',
      p['매장명']   || '',
      p['업종']     || '',
      p['전화번호'] || '',
      p['이메일']   || '',
      p['추가내용'] || ''
    ]);
    lock.releaseLock();

    notify_(p, now);
    return json_({ result:'success' });
  }catch(err){
    return json_({ result:'error', message:String(err) });
  }
}

/* 브라우저로 URL 열었을 때 동작 확인용 */
function doGet(){
  return json_({ result:'ok', sheet: getSheet_().getParent().getUrl() });
}

/* 최초 1회 실행 — 시트 생성 + 주소 로그 */
function setup(){
  var url = getSheet_().getParent().getUrl();
  Logger.log('신청 DB 시트: ' + url);
  return url;
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

function notify_(p, now){
  try{
    var body =
      '새 비법서 신청이 접수됐습니다.\n\n' +
      '신청일시 : ' + now + '\n' +
      '이름     : ' + (p['이름']||'') + '\n' +
      '매장명   : ' + (p['매장명']||'') + '\n' +
      '업종     : ' + (p['업종']||'') + '\n' +
      '전화번호 : ' + (p['전화번호']||'') + '\n' +
      '이메일   : ' + (p['이메일']||'') + '\n' +
      '추가내용 : ' + (p['추가내용']||'') + '\n';
    MailApp.sendEmail(NOTIFY_EMAIL, '[트래비티] KOC 비법서 신청 — ' + (p['매장명']||''), body);
  }catch(err){ /* 메일 실패해도 시트 저장은 유지 */ }
}

function json_(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

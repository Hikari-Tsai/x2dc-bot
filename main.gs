/** 
 * 開發者: Hikari  https://x.com/hikari_tsai
 * 注意事項：
 *    1. 免費版API速率上限為每15min一次查詢，建議系統設定30min觸發一次
 *    2. 初次使用需要按下左邊的齒輪進行「屬性設定」，設定三個變數分別為
 *        - BEARER(X develop內提供的token)
 *        - X_USERNAME(推特帳號，@後那一段)
 *        - DISCORD_WEBHOOK(DC目標頻道推送的網址)
 *    3. 系統極限：
 *        - 30min內如果更新超過5則以上的貼文，則只會顯示最新的五則
 *        - 每月只能更新100則貼文，超過就不會同步，可在X Develop查看本月份額
 *    4. 其他事項：
 *        - LINE104 可以改成自己的頭貼，請先把圖片放到圖床上，再提供網址
 *        - 如需更換使用者，請更新「屬性設定」X_USERNAME參數，並刪除X_USER_ID，才能更換對象 (系統會緩存使用者ID，只有刪除X_USER_ID才會更新)
 * 
  **/
const props = PropertiesService.getScriptProperties();
//const { BEARER, X_USERNAME, DISCORD_WEBHOOK, X_USER_ID} = getEnv();
const BEARER          =  props.getProperty('BEARER')|| '0';
const X_USERNAME      = props.getProperty('X_USERNAME') || '0';
const DISCORD_WEBHOOK = props.getProperty('DISCORD_WEBHOOK')|| '0';
let X_USER_ID      =  props.getProperty('X_USER_ID') || '0';
if (X_USER_ID=='0'){
  X_USER_ID = fetchTwitterUserId(X_USERNAME);
  props.setProperty('X_USER_ID', X_USER_ID); //更新環境變數
}


//取得環境變數
function getEnv() {
  return {
    BEARER:           props.getProperty('BEARER')|| '0',
    X_USERNAME:       props.getProperty('X_USERNAME') || '0',
    DISCORD_WEBHOOK:  props.getProperty('DISCORD_WEBHOOK')|| '0',
    X_USER_ID :       props.getProperty('X_USER_ID') || '0'
  };
}

//取得ID，每15分鐘上限三次，這裡只有初次使用才會發動一次，後續如果要更換user的話必須要在環境變數內刪除X_USER_ID以及更新X_USERNAME
function fetchTwitterUserId(username) {
  //判斷環境變數是否正常設定
  if (BEARER=='0' || X_USERNAME=='0' || DISCORD_WEBHOOK=='0') {
    Logger.log(`環境變數錯誤，請檢查BEARER, X_USERNAME, DISCORD_WEBHOOK三個變數是否皆正常設置`);
    return null;
  }
  const url = `https://api.twitter.com/2/users/by/username/${username}`;
  const res = UrlFetchApp.fetch(url, {
    headers: { Authorization: `Bearer ${BEARER}` },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) {
    Logger.log(`取 ID 失败，HTTP ${res.getResponseCode()}：${res.getContentText()}`);
    return null;
  }
  const user = JSON.parse(res.getContentText()).data;
  Logger.log(`✔️ ${username} 的 user ID 是 ${user.id}`);
  return user.id;
}

//主程式
function pollTweets() {
  if (BEARER=='0' || X_USERNAME=='0' || DISCORD_WEBHOOK=='0') {
    Logger.log(`環境變數錯誤，請檢查BEARER, X_USERNAME, DISCORD_WEBHOOK三個變數是否皆正常設置`);
    return null;
  }
  //const props    = PropertiesService.getScriptProperties();
  const lastId   = props.getProperty('LAST_TWEET_ID') || '0';
  Logger.log(`🔄 上次已處理的推文 ID：${lastId}`);

  // 呼叫 Twitter API 拿最新 5 筆（可依需求調整 max_results）
  // 免費版本API每15分鐘只能呼叫一次
  const url = `https://api.twitter.com/2/users/${X_USER_ID}/tweets`
            + `?max_results=5&exclude=replies,retweets`;
  const res = UrlFetchApp.fetch(url, {
    headers: { Authorization: `Bearer ${BEARER}` },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) {
    Logger.log(`❌ API 呼叫失敗：HTTP ${res.getResponseCode()}`);
    Logger.log(res)
    return;
  }
  const data = JSON.parse(res.getContentText()).data || [];
  if (!data.length) {
    Logger.log('ℹ️ 這次沒有取得任何推文');
    return;
  }

  // 篩選出所有 ID 大於 lastId 的新推文
  const newTweets = data
    .filter(t => t.id > lastId)              // 注意：Snowflake ID 同長度字串可直接比較
    .sort((a, b) => a.id.localeCompare(b.id)); // 由舊到新排序

  if (!newTweets.length) {
    Logger.log('ℹ️ 沒有新的推文');
    return;
  }

  // 逐一發送到 Discord Webhook
  newTweets.forEach(tweet => {
    Logger.log(`✨ 準備推送：id=${tweet.id}, text="${tweet.text.replace(/\n/g,'\\n')}"`);
    const msg = {
      username: 'X推文機器人',   // 顯示在 Discord 的機器人名稱
      avatar_url: '', // 可自訂頭像，圖片上傳圖床後提供網址。格式為'https://google.com.jpg'
      content: `📣 @${X_USERNAME} 發表新推文：\nhttps://twitter.com/i/web/status/${tweet.id}`
    };
    const hookRes = UrlFetchApp.fetch(DISCORD_WEBHOOK, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(msg)
    });
    Logger.log(`   → Discord 回傳 HTTP ${hookRes.getResponseCode()}`);
  });

  // 更新 LAST_TWEET_ID 為最新一則
  const newestId = newTweets[newTweets.length - 1].id;
  props.setProperty('LAST_TWEET_ID', newestId);
  Logger.log(`✅ 更新 LAST_TWEET_ID 為 ${newestId}`);
}
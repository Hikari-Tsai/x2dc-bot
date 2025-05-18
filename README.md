# x2dc-bot
這是一個將X推文同步回DC伺服器的小工具，使用免費的API服務即可實作，使用Google App Script自動觸發Pooling去輪詢X是否有更新資料，若有則POST到DC的Webhook

## 教學影片
[https://www.youtube.com/watch?v=vmzRbvomzl4](https://www.youtube.com/watch?v=vmzRbvomzl4)

## 前置條件
1. 事先註冊X Develop Free版本帳號，並進入Projects & App 取得 Bearer Token[連結](https://developer.x.com/) 
2. 進入Discord取得目標頻道的Channel
3. 事先取得欲同步的X帳號名稱




## 設定步驟
1. 進入 Google App Script [連結](https://script.google.com/) ，並開啟新專案
2. 貼上main.gs文件的全部內容
3. 點選左邊專案設定(齒輪圖案)，往下捲到指令碼屬性，點選「編輯指令碼屬性」，新增三個參數，完成後按下「儲存指令碼屬性」
    - BEARER(並於右邊填寫對應的值)
    - X_USERNAME(並於右邊填寫對應的值)
    - DISCORD_WEBHOOK(並於右邊填寫對應的值)
4. 並點右上角完成部署(deploy)
5. 左邊觸發條件(鬧鐘圖案)選擇時間觸發，週期為30分鐘，觸發函數pollTweets

## 其他設定
- 圖示可以自行修改，請將程式碼LINE104修改為自己的圖片

## 注意事項：
     1. 免費版API速率上限為每15min一次查詢，建議系統設定30min觸發一次
     2. 初次使用需要按下左邊的齒輪進行「屬性設定」，設定三個變數分別為
         - BEARER(X develop內提供的token)
         - X_USERNAME(推特帳號，@後那一段)
         - DISCORD_WEBHOOK(DC目標頻道推送的網址)
     3. 系統極限：
         - 30min內如果更新超過5則以上的貼文，則只會顯示最新的五則
         - 每月只能更新100則貼文，超過就不會同步，可在X Develop查看本月份額
     4. 其他事項：
         - LINE104 可以改成自己的頭貼，請先把圖片放到圖床上，再提供網址
         - 如需更換使用者，請更新「屬性設定」X_USERNAME參數，並刪除X_USER_ID，才能更換對象 (系統會緩存使用者ID，只有刪除X_USER_ID才會更新)
  

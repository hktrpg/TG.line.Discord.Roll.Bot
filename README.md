
# RoboYabaso@HKTRPG

<p align="center">
    <p align="center"><a href="https://www.hktrpg.com" target="_blank" rel="noopener noreferrer"><img width="200" src="https://github.com/hktrpg/TG.line.Discord.Roll.Bot/raw/master/views/image.png" alt="HKTRPG logo"></a></p>
</p>

<p align="center">
    <a href="https://github.com/hktrpg/TG.line.Discord.Roll.Bot/fork"><img src="https://img.shields.io/github/forks/hktrpg/TG.line.Discord.Roll.Bot" alt="Forks"></a>
    <a href="https://github.com/hktrpg/TG.line.Discord.Roll.Bot/releases/latest"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/hktrpg/TG.line.Discord.Roll.Bot"></a>
    <a href="https://support.hktrpg.com" title="Join the discord server!"><img src="https://img.shields.io/discord/278202347165974529?logo=discord" alt="Discord invite button" /></a>
    <a href="https://patreon.com/HKTRPG" title="Donate to this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-red.svg" alt="Patreon donate button" /></a>
</p>

# 【HKTRPG擲骰BOT】

- 最後更新時間![最後更新時間](https://img.shields.io/github/last-commit/hktrpg/TG.line.Discord.Roll.Bot)

## HKTRPG擲骰子專用機械人 Roll Dice Robot

- HKTRPG是在Discord, Line, Telegram, Whatsapp, Plurk, API 和網頁上都可以使用的骰子機械人！
  - 功能：暗骰, 各類TRPG骰子擲骰, 自定義骰子, 身分組管理, 頻道經驗值, 占卜, 先攻表, TRPG角色卡, 搜圖, 翻譯, Discord 聊天紀錄匯出, 數學計算, 做筆記, 隨機抽選, wiki查詢, 資料庫快速查詢功能, 定時發訊息功能, 每日笑話, 每日動漫, 每日一言, 每日黃曆, 每日毒湯, 每日情話, 每日靈簽, 每日急口令, 每日大事, 每日(星座), 每日解答
- 使用方法請看 [HKTRPG 官方使用教學](https://bothelp.hktrpg.com/)
  - 歡迎加入[開發，求助及TRPG Discord 群組](https://support.hktrpg.com)
  - 邀請HKTRPG 加入
    - [Discord 邀請連結](https://discord.hktrpg.com)
    - [Telegram 邀請連結](http://t.me/hktrpg_bot)
    - [Line 邀請連結](http://bit.ly/HKTRPG_LINE)
    - [網頁版 邀請連結](https://rollbot.hktrpg.com/)
    - [Plurk 邀請連結](https://www.plurk.com/HKTRPG)
    - [TRPG API 連結](https://www.hktrpg.com:20721/api)
  - [HKTRPG 研究社 Facebook](https://www.facebook.com/groups/HKTRPG)
  - [TRPG 百科](https://www.HKTRPG.com/)
  - [名人堂](https://hktrpg.github.io/TG.line.Discord.Roll.Bot/CREDITS.html)
  - [贊助HKTRPG](https://www.patreon.com/HKTRPG)

# 鳴謝

- 最後感謝不同人的幫助，才可以完成這個BOT
  - LarryLo  Retsnimle - 寫出如何建BOT的教程和開源程式，開始這個BOT的成長
  - 布大獅              - 教導我如何寫好程式，還親手寫出不同改進方式
  - LOKI Lokinen，木易 陳，Luo Ray，Vivian  -   因為有他們捐助，才可以把HKTRPG搬到更好的機子上
  - 以及其他一直幫助和意見的朋友

## 以下為舊版說明,將會廢棄或修改

## 關於RoboYabaso

RoboYabaso最早由LarryLo  Retsnimle開發。  
是一個開放源碼骰子機器人計畫。  
來源自 <https://docs.google.com/document/d/1dYnJqF2_QTp90ld4YXj6X8kgxvjUoHrB4E2seqlDlAk/edit>

現在改成三合一Line x Discord x Telegram。  
雖然是三合一，但可以單獨使用，只是共用骰組，  
啓動條件是在HEROUKU 輸入BOT的 CHANNEL_SECRET

不然的話沒這麼多伺服器開這麼多ＢＯＴ。  
最期待Whatsapp快開放權限，香港都是比較多使用Whatsapp

這是建立在Heroku的免費伺服器上，所以大家都可以按照下面的教程，客制化做一個自己的BOT！  
現支援普通擲骰，純計算，趣味擲機擲骰，運勢，克蘇魯神話  
朱の孤塔，神我狩，迷宮王國，亞俠必死的冒險，忍神，DX2nd,3rd  
命運Fate，永遠的後日談，劍世界2.5，WOD黑暗世界，  
自定義骰子功能，儲存擲骰指令功能，擲骰開關功能及資料庫功能  

順便宣傳
<a href="http://www.goddessfantasy.net/bbs/index.php?board=1400.0">香港TRPG區</a>
<a href="https://www.hktrpg.com">TRPG百科</a>
招技術人員

### ToDo list

- [x] 暗骰同時把結果傳給指定對象
- [ ] 可以給非Admin GM權限
- [ ] 設定名字, 每次擲骰時顯示
- [ ] 定時功能. GM 可以發佈任務, 定時提示時限, 玩家查詢等等
- [ ] 投票功能
- [x] 存好指定擲骰方法, 輸入指定即可快速打出來
- [ ] 選擇圖書式遊戲(好像COC 單人TRPG 「向火獨行」一樣, 輸入頁碼, 就會顯示故事, 好像跑團一樣,以後不怕沒有同伴了,不過首先要有故事ORZ)
- [x] 增加 mee6式 LV 排名升級 功能(需修改觸發方法)
- [x] 增加 戰鬥輪回合功能 .round  next hide public init del
- [X] 增加 角色卡功能 .char set del
- [x] 增加 LOG功能 可以自動變成LOG

其他功能,歡迎留言建議

特色介紹
==

占卜運氣功能。  
支持大小階。  
增加HELP功能。詳情BOT內輸入bothelp 查看說明  
支持直接 1d100 5d20。  
cc<= 改成 cc cc1 cc2 ccn1 ccn2。  
增加永遠後日談的NC擲骰 來自Rainsting/TarotLineBot。  
增加wod 黑暗世界 DX3 SW2.0的擲骰。  
模組化設計。  

以下分別有Line Discord 和telegram 的說明  
用那個就看那個吧  
另外要申請一個mlab ACC, 教學遲些再寫  

如何建立自己的Line骰子機器人
==

準備動作
--

- 先申請好Line帳號（廢話）

- 先申請好Github帳號
- 先申請好Heroku帳號  
以下全部選擇用免費的服務就夠了，請不要手殘選到付費。

Step1：先把這個專案Fork回去
--

- 到右上角的 ![Fork](http://i.imgur.com/g5VmzkC.jpg) 按鈕嗎，按下去。  
把這個專案存到你的Github裡。

Step2：建立lineBot賬號
--

- 到[https://developers.line.me/en/ ](https://developers.line.me/en/ )登入一個Line帳號，  
點選「開始使用Messaging API」，按照指示註冊你的line Bot賬號。  
![開始使用Messaging API](http://i.imgur.com/Zb2Oboy.jpg)

---

- 點下方那個「免費帳號」

---

- 進入你剛註冊的line Bot賬號

---

- 照著這個畫面設定,把Use webhooks 定為開啓，Auto-reply messages  及Greeting messages 定為Disable  
![設定](http://i.imgur.com/PXf10Qs.jpg)

---

- 然後開著網頁不要關。  
![LINE Developers](http://i.imgur.com/aks55p4.jpg)

---

Step3：將LineBot部署到Heroku
--

- 按一下下面這個按鈕  
按它→[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/zeteticl/RoboYabaso)←按它

---

- 你會看到這個  
![Heroku](http://i.imgur.com/sbCVOcW.jpg)  
當然，先取一個App name，回到上個步驟的LINE Developers網頁

Step4：取得Channel Access Token和Channel Secret
--

- 先取得Channel Secret，按右邊的按鈕  
![Channel Secret](http://i.imgur.com/oNN9gUx.jpg)  
把取得的字串複製到Step3的LINE_CHANNEL_SECRET

---

- 再取得Channel Access Token，按右邊的按鈕  
![Channel Access Token](http://i.imgur.com/UJ4AQlJ.jpg)  
把取得的字串複製到Step3的LINE_CHANNEL_ACCESSTOKEN  
接著，按下Deploy app，等他跑完之後按下Manage App  
距離部署完機器人只差一步啦！

Step5：鏈接Line與Heroku
--

- 點選settings  
![setting](http://i.imgur.com/9fEMoVh.jpg)

---

- 找到Domains and certificates這個條目，旁邊會有個「Your app can be found at……」加一串網址，把網址複製起來。  
![Domain](http://i.imgur.com/dcgyeZa.jpg)

---

- 回到LINE Developers網頁，選取最底下的edit，找到Webhook URL，把那串網址去除https://複製上去  
![webhook](http://i.imgur.com/tn2EN6l.jpg)

---

- 按下Save。看到在 Webhook URL 旁邊有個 VERIFY 按鈕嗎，按下去。  
如果出現 Success. 就表示你成功完成啦！  
![Success](http://i.imgur.com/yjlpIh8.jpg)

如何修改並上傳程式碼咧
==

回到Heroku網頁，點選上面的Deploy，你會看到四種配置程式碼的方法。  
![Deploy](http://i.imgur.com/VVRpNLe.jpg)

我猜想如果你是會用第一種（Heroku Git）或是第四種（Container Registry）的人，應該是不會看這種教學文～所以我就不介紹了～  
絕、絕對不是我自己也不會的關係哦（眼神漂移）

以第二種（Github）來說的話，你可以綁定你的Github賬號——剛剛我們不是fork了一份程式碼回去嗎？把它連接上去，這樣你就可以在Github那邊修改你要的程式碼，再Deploy過來。  
或是你可以使用第三種（Dropbox），當你鏈接之後，它會自動幫你把你剛剛上線的程式碼下載到你的dropbox裡面。你修改完之後再上來Deploy就好咯。

準備動作
--

- 先申請好Discord帳號（廢話）

- 先申請好Github帳號
- 先申請好Heroku帳號  
以下全部選擇用免費的服務就夠了，請不要手殘選到付費。

Step1：先把這個專案Fork回去
--

- 到右上角的 ![Fork](http://i.imgur.com/g5VmzkC.jpg) 按鈕嗎，按下去。  
把這個專案存到你的Github裡。

Step2：建立DiscordBot賬號
--

- 到[http://discordapp.com/developers/applications/me](http://discordapp.com/developers/applications/me )登入一個Discord帳號，  
點選「New Application」，按照指示註冊你的Discord Bot。

---

- 記下那個「CLIENT ID」

- 進入左方Setting 的Bot

- 在BUILD-A-BOT中點選Add Bot->Yes Do It. 接著把「Token」複製(Copy)下來

Step3：將DiscordBot部署到Heroku
--

- 按一下下面這個按鈕  
按它→[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/zeteticl/DiscordRollBot_HKTRPG)←按它

---

- 你會看到這個  
![Heroku](http://i.imgur.com/sbCVOcW.jpg)  
當然，先取一個App name，然後把以前記下的「Token」貼上.  
如果想要啓動語,可以順便打上. 例如啓動語!trpg 便會變成!trpg 1d100  
接著，按下Deploy app，等他跑完之後按下Manage App  
距離部署完機器人只差一步啦！

Step4：把機器人邀請到你的頻道

--

- 剛剛複製了一個「CLIENT ID」把它取代到以下網址中間

[https://discordapp.com/oauth2/authorize?&client_id=CLIENTID&scope=bot&permissions=8](https://discordapp.com/oauth2/authorize?&client_id=CLIENTID&scope=bot&permissions=8)

- 點擊然後選擇你的頻道
- 然後就可以在頻道中使用你的Bot了.

---

測試功能  

```
npm install -g mocha
mocha .\test\analytics.test.js
```

Telegram......  
是最簡單的,和上面一樣,先註冊Telegram ACC  
然後到 <https://telegram.me/botfather>  
使用 /new bot 輸入BotName 和UserName  
會得到Token 和邀請碼，Token 就是輸入到Heroku 中  
邀請碼就是給Telegram 用家連到Bot的。

以上說明參考  
<https://github.com/zeteticl/TrpgLineBot-php>

下一部希望更新是

1. MONGODB (但好難啊....會有高手幫忙嗎....不想用GOOGLE SHEET.....
2. 骰組方法學習凍豆腐
3. Help的優化

更多更新資料放在Discord群上

【擲骰BOT】
--

暗骰功能 在指令前輸入dr 結果會私訊你  
例如輸入2d6+1　攻撃！  
會輸出）2d6+1：攻撃  9[6+3]+1 = 10  
如上面一樣,在骰子數字後方隔空白位打字,可以進行發言。  
以下還有其他例子  
5 3D6 ：分別骰出5次3d6  
D66 D66s ：骰出D66 s小者固定在前  
5B10：不加總的擲骰
5B10S：不加總的擲骰，並按大至小排序  
5B10 8：如上,另外計算其中有多少粒大過8  
5U10 8：進行5D10 每骰出一粒8會有一粒獎勵骰  
5U10 8 9：如上,另外計算其中有多少粒大過9  
Choice：啓動語choice/隨機/選項/選1  
(問題)(啓動語)(問題)  (選項1) (選項2)  
例子 隨機收到聖誕禮物數 1 2 3 >4  
  
隨機排序：啓動語　排序  
(問題)(啓動語)(問題)  (選項1) (選項2)(選項3)  
例子 交換禮物排序 A君 C君 F君 G君

- COC 六版判定 CCb （目標値）：做出成功或失敗的判定  
例）CCb 30　CCb 80
- COC 七版判定 CCx（目標値）  x：獎勵骰/懲罰骰 (2～n2)。沒有的話可以省略。  
例）CC 30　CC1 50　CCn2 75
- coc7 角色背景：啓動語 coc7角色背景
- coc7 成長或增長檢定：dp (技能) (名稱)  
例）DP 80 偵查
- coc7 成長或增長檢定：dp (技能) (名稱)  
例）DP 80 偵查

現支援系統:
【了解骰組詳情,請輸入 bothelp (編號) 或 all 或 在指令後輸入help 如 .sg help】  
0: 進階擲骰 .ca (計算) D66(sn) 5B10 Dx 5U10 x y  
1: 趣味擲骰 排序(至少3個選項) choice/隨機(至少2個選項) 每日塔羅 運勢 立flag .me  
2: 克蘇魯神話 cc cc(n)1~2 ccb ccrt ccsu .dp .cc7build .cc6build .cc7bg  
3: 朱の孤塔 .al (nALx*p)  
4: DX2nd,3rd .dx (xDX+y@c ET)  
5: 命運Fate .4df(m|-)(加值)  
6: 神我狩 .kk (ET RT NT KT MTx)  
7: 迷宮王國 .mk (nMK+m 及各種表)  
8: 永遠的後日談 .nc (NM xNC+m xNA+m)  
9: 亞俠必死的冒險 .ss (nR>=x[y,z,c] SRx+y FumbleT)  
10: 忍神 .sg (ST FT ET等各種表)  
11: 劍世界2.5 .sw (Kx Gr FT TT)  
12: 歌風 .UK (nUK nUK@c or nUKc)  
13: WOD黑暗世界 .xWDy  
14: 貓貓鬼差 .kc xDy z  
15: (公測中)Wiki查詢/圖片搜索/翻譯 .wiki .image .tran  
16: (公測中)暗骰GM功能 .drgm (addgm del show) dr ddr dddr  
17: (公測中)經驗值功能 .level (show config LevelUpWord RankWord)  
18: (公測中)自定義骰子功能 .ra(p)(次數) (add del show 自定關鍵字)  
19: (公測中)儲存擲骰指令功能 .cmd (add del show 自定關鍵字)  
20: (公測中)擲骰開關功能 .bk (add del show)  
21: (公測中)資料庫功能 .db(p) (add del show 自定關鍵字)

![image](https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png)


# RoboYabaso@HKTRPG 

<p align="center">
    <p align="center"><a href="https://www.hktrpg.com" target="_blank" rel="noopener noreferrer"><img width="200" src="https://github.com/hktrpg/TG.line.Discord.Roll.Bot/raw/master/views/image.png" alt="HKTRPG logo"></a></p>
</p>

<p align="center">
    <a href="https://github.com/hktrpg/TG.line.Discord.Roll.Bot/fork"><img src="https://img.shields.io/github/forks/hktrpg/TG.line.Discord.Roll.Bot" alt="Forks"></a>
    <a href="https://github.com/hktrpg/TG.line.Discord.Roll.Bot/releases/latest"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/hktrpg/TG.line.Discord.Roll.Bot"></a>
    <a href="https://discord.gg/vx4kcm7" title="Join the discord server!"><img src="https://img.shields.io/discord/278202347165974529?logo=discord" alt="Discord invite button" /></a>
    <a href="https://patreon.com/HKTRPG" title="Donate to this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-red.svg" alt="Patreon donate button" /></a>
</p>


# 【HKTRPG擲骰BOT】v1.28
最後更新時間11/03/2021, 14:01:11
2019/07/21 香港克警合作 黑ICON紀念 
想試用這機械人的話，請按以下連結，輸入`bothelp`顯示教學

------------------
HKTRPG擲骰子專用機械人 Roll Dice Robot
------------------

*   HKTRPG是在Discord, Line, Telegram, Whatsapp和網頁上都可以使用的骰子機械人！
    *   功能：暗骰, 擲骰, 頻道經驗值, 占卜, TRPG骰子, 先攻表, TRPG角色卡, 搜圖, 翻譯, Discord 聊天紀錄匯出, 數學計算, 做筆記, 隨機抽選, 自定抽選
    *   歡迎加入[開發，求助及TRPG Discord 群組](https://discord.gg/vx4kcm7)
    *   邀請HKTRPG 加入
        *   [Discord 邀請連結](http://bit.ly/HKTRPG_DISCORD_)
        *   [Telegram 邀請連結](http://t.me/hktrpg_bot)
        *   [Line 邀請連結](http://bit.ly/HKTRPG_LINE)
        *   [網頁版 邀請連結](https://rollbot.hktrpg.com/)
    *   [HKTRPG 研究社 Facebook](https://www.facebook.com/groups/HKTRPG)
    *   [TRPG 百科](https://www.HKTRPG.com/)
    *   [名人堂](https://hktrpg.github.io/TG.line.Discord.Roll.Bot/CREDITS.html)
    *   [贊助HKTRPG](https://www.patreon.com/HKTRPG)
    
    指令簡介
    ----
    *   部份指令以 `.` 開頭或無開頭
    *   輸入 `bothelp` 可以顯示幫助訊息
    *	輸入 `功能的前置詞 help` 也可以顯示幫助訊息,如 `cc help` `.level help`
    *   輸入 `xDy` 可以進行基本擲骰 例如1D6
    *   輸入 `dr xDy (或任何指令)` 可以進行暗骰，私訊你結果
    *   輸入 `.ca 算式` 可以進行數學計算
    *   輸入 `.image (內容)` 可以進行網上圖片搜索
    
    *   因為功能眾多，所以再分成幾個類型在下面介紹
        *   基本擲骰指令
        *   指定TRPG系統擲骰指令
        *   TRPG 輔助工具
        *   系統工具
        *   趣味功能
    
    基本擲骰指令
    ------
  
    ###   【基本擲骰】1d100(khN|klN|dhN|dlN)
    
    *   例如輸入 `(2d6+1)\*2` 攻撃！
    *   會輸出）(2d6+1)\*2：攻撃！ (10\[5+5\]+1)2 = 22
    *   如上面一樣,在骰子數字後方隔空白位打字,可以進行發言。
    *   `5 3D6` ： 分別骰出5次3d6 最多30次
    *   `((2d6+1)\*2)-5/2>=10` 支援括號加減乘除及大於小於(>,<,>=,<=)計算
    *   支援kh|kl|dh|dl，k keep保留，d drop 放棄，h highest最高，l lowest最低
    *   如`3d6kh` 保留最大的1粒骰，`3d6dl2` 放棄最小的2粒骰
    
    ### 暗骰功能 
    *   在指令前輸入dr 結果會私訊你    
    *   ddr dddr 可以私訊已設定的群組GM, 詳情可打.drgm查詢
    *   如`dr 3d6`
    
    進階擲骰指令
    ------
    
    ### 不同的TRPG需要特別的擲骰方法
    
    *   【進階擲骰】 `.ca (算式)`|`D66(sn)`|`5B10 Dx`|`5U10 x y`|`.int x y`
    *   【克蘇魯神話】 `cc` `cc(n)1~2` `ccb` `ccrt` `ccsu` `.dp` `.cc7build` `.cc6build` `.cc7bg`
    *   【朱の孤塔】 `.al (nALx\*p)`
    *   【神我狩】 `.kk (ET RT NT KT MTx)`
    *   【迷宮王國】 `.mk (nMK+m 及各種表)`
    *   【亞俠必死的冒險】 `.ss (nR>=x\[y,z,c\] SRx+y FumbleT)`
    *   【忍神】 `.sg (ST FT ET等各種表)`
    *   【歌風】 `.UK (nUK nUK@c or nUKc)`
    *   【魔女狩獵之夜】`.wn xDn+-y`
    *   【DX2nd,3rd】 `.dx (xDX+y@c ET)`
    *   【命運Fate】 `.4df(m|-)(加值)`
    *   【永遠的後日談】 `.nc (NM xNC+m xNA+m)`
    *   【劍世界2.5】`.sw (Kx Gr FT TT)`
    *   【WOD黑暗世界】`.xWDy`
    *   【貓貓鬼差】`.kc xDy z`
    
    TRPG輔助工具 指令
    -----------
    
    ### 不同的TRPG需要特別的擲骰方法
    
    *   【Discord 頻道聊天紀錄輸出工具】
    	*	`.discord html` 可以輸出有分析功能的聊天紀錄
    	*	`.discord txt` 可以輸出純文字的聊天紀錄
    	*	需要使用者及rollbot 都有閱讀頻道聊天紀錄的權限
    	*	然後會私訊你紀錄
    	*	注意 使用此功能，你需要有管理此頻道的權限或管理員權限。
    	*	另外網頁版內容經過AES加密，後者是純文字檔案
    	*	因為經過server處理，擔心個資外洩請勿使用。
    *   暗骰GM功能 .drgm (addgm del show) dr ddr dddr
    	*	這是讓你可以私骰GM的功能
    	*	想成為GM的人先輸入`.drgm addgm`
    	*	然後別人DDR 或DDDR (指令)即可以私訊給這位GM
    	*	例如輸入 `ddr cc 80 鬥毆` 
    	*	就會把結果私訊GM及自己
    	*	例如輸入 `dddr cc 80 鬥毆 `
    	*	就會把結果只私訊GM
    	*	P.S.如果沒立即生效 用.drgm show 刷新一下
    	*	輸入.drgm addgm (代名) 即可成為GM,如果想化名一下,
    	*	可以在addgm 後輸入一個名字, 暗骰時就會顯示
    	*	不輸入就會顯示原名
    	*	輸入`.drgm show` 顯示所有GM
    	*	輸入`.drgm del(編號)`或all 即可刪除
    	*	輸入`dr  (指令)` 私訊自己 
    	*	輸入`ddr (指令)` 私訊GM及自己
    	*	輸入`dddr(指令)` 私訊GM
    *   角色卡功能 .char (add edit show delete use nonuse) .ch (set show showall)
    	*	以個人為單位, 一張卡可以在不同的群組使用
    	*	目標是文字團可以快速擲骰，及更新角色狀態。
    		
    	*	簡單新增角色卡 `.char add name[Sad]~ state[HP:15/15;]~ roll[鬥毆: cc 50;]~ notes[筆記:這是測試,請試試在群組輸入 .char use Sad;]~` 
    	*	新增了角色卡後，可以輸入 `.admin account (username) (password)` 
    	*	然後在網頁: https://www.hktrpg.com:20721/card/ 中直接進行修改
    		
    	*	把結果傳送到已登記的Discord，TG，LINE上的聊天群組的登記方法: 
    	*	由該群組的Admin授權允許 輸入 `.admin allowrolling`
    	*	登記該群組到自己的名單中 輸入 `.admin registerChannel`
    	*	取消方法
    	*	由該群組的Admin取消授權 輸入 `.admin disallowrolling`
    	*	取消登記該群組到名單 輸入 `.admin unregisterChannel`
    		
    	*	最後網站會顯示群組名稱，點擊就可以使用了
    		
    		
    *   儲存擲骰指令功能 .cmd (add del show 自定關鍵字)
        *	這是根據關鍵字來再現擲骰指令,
    	*	例如輸入 `.cmd add  pc1鬥毆 cc 80 鬥毆 `
    	*	再輸入`.cmd pc1鬥毆`  就會執行後方的指令
    	*	add 後面第一個是關鍵字, 可以是符號或任何字
    	*	P.S.如果沒立即生效 用.cmd show 刷新一下
    	*	輸入`.cmd add (關鍵字) (指令)`即可增加關鍵字
    	*	輸入`.cmd show` 顯示所有關鍵字
    	*	輸入`.cmd del(編號)`或all 即可刪除
    	*	輸入`.cmd  (關鍵字)` 即可執行
    *   先攻表功能 .in (remove clear reroll help) .init
    	*	這是讓你快速自定義先攻表的功能
    	*	它可以儲存你的擲骰方法，然後直接重新投擲，而不需要再輸入。
    	*	`.in (擲骰或數字) (名字)`  - 樣式
    	*	`.in 1d20+3 (名字)`
    	*	`.in 1d3` (如沒有輸入, 會用你聊天軟件中的名字)
    	*	`.in 80`         - 直接取代先攻值
    	*	`.in -3+6*3/2.1`  - 加減
    		------------
    	*	`.in remove` (名字) - 移除該角色
    	*	`.in reroll` - 根據算式重擲先攻表
    	*	`.in clear`  - 清除整個先攻表
    	*	`.init`      - 顯示先攻表，由大到小
    	*	`.initn`     - 顯示先攻表，由小到大    
    系統工具 指令
    -------
    
    *   `.admin state` 可以顯示統計信息
    *   擲骰開關功能 `.bk (add del show)`
    	*	這是根據關鍵字來開關功能,只要符合內容,
    	*	例如運勢,那麼只要字句中包括,就不會讓Bot有反應
    	*	所以注意如果用了D, 那麼1D100, .1WD 都會全部沒反應.
    	*	另外不可擋b,k,bk, 只可以擋漢字,數字和英文
    	*	P.S.如果沒立即生效 用.bk show 刷新一下
    	*	輸入`.bk add xxxxx` 即可增加關鍵字 每次一個
    	*	輸入`.bk show` 顯示關鍵字
    	*	輸入`.bk del (編號)`或all 即可刪除
    
    趣味功能 指令
    -------
    
    ### 如塔羅牌, 運勢 是一些玩樂用的指令
    *   `排序 (選項1) (選項2) (選項N)` - 會進行隨機的排序
    *   `隨機 (選項1) (選項2)`  - 會隨機抽選一個出來
    *   `每日塔羅` 幫你抽塔羅牌占卜，還有 `大十字塔羅` `時間塔羅` 可以占卜
    *   `運勢` 幫你占卜
    *   `立flag` 會隨機出現一些立FLAG的場景
    *   `.me` 可以令rollbot 重覆你的說話
    
    *   經驗值功能 `.level (show config LevelUpWord RankWord)`
        *   想在頻道中說話可以得到經驗，請開啓這個功能!還可以和世界各地的人比較LV
    	*	按發言次數增加經驗，提升等級，實現服務器內排名等歡樂功能
    	*	當經驗達到要求，就會彈出通知，提示你已提升等級。
    	*	預設並不開啓，需要輸入.level config 11 啓動功能 
    	*	數字11代表等級升級時會進行通知，10代表不會通知，
    	*	00的話代表關閉功能，
    	*	預設回應是「 XXXX 《稱號》， 你的克蘇魯神話知識現在是 X點！
    	*	現在排名是XX人中的第XX名！XX%！
    	*	調查經驗是XX點。」
    
    *   Wiki查詢/圖片搜索/翻譯功能 .wiki .image .tran
        *   `.wiki (項目)` 可以在立即搜索WIKI上的資料
        *   `.image (項目)` 可以立即隨機搜尋相關照片
        *   `.tran (項目)` 立即翻譯係正體中文
    
    *   自定義回應功能 `.ra(p)(次數) (add del show 自定關鍵字)`
    	*	這是根據關鍵字來隨機抽選功能,只要符合內容,以後就會隨機抽選
    	*	例如輸入 `.ra add 九大陣營 守序善良 (...太長省略) 中立邪惡 混亂邪惡` 
    	*	再輸入`.ra 九大陣營`  就會輸出 九大陣營中其中一個
    	*	如果輸入`.ra3 九大陣營`  就會輸出 3次九大陣營
    	*	如果輸入`.ra3 九大陣營 天干 地支` 就會輸出 3次九大陣營 天干 地支
    	*	如果輸入`.rra3 九大陣營` 就會輸出3次有可能重覆的九大陣營
    	*	範例:        
        *	`.rap10 聖晶石召喚`	`.rap 九大陣營`
    *   資料庫功能 `.db(p) (add del show 自定關鍵字)`
        *	這是根據關鍵字來顯示數據的,
    	*	例如輸入 `.db add 九大陣營 守序善良 (...太長省略) 中立邪惡 混亂邪惡 `
    	*	再輸入`.db 九大陣營 `  就會輸出 九大陣營中的全部內容
    	*	add 後面第一個是關鍵字, 可以是漢字,數字,英文及emoji
    	*	範例:        
        *	`.dbp COC`	`.dbp 戀人`
    鳴謝
    -------
    
    ### 最後感謝不同人的幫助，才可以完成這個BOT
    *   LarryLo  Retsnimle - 寫出如何建BOT的教程，開始這個BOT的成長
    *   布大獅              - 教導我如何寫好程式，還親手寫出不同改進方式
    *   LOKI Lokinen，木易 陳，Luo Ray，Vivian  -   因為有他們捐助，才可以把HKTRPG搬到更好的機子上
    *   以及其他一直幫助和意見的朋友

關於RoboYabaso
==
RoboYabaso最早由LarryLo  Retsnimle開發。 
是一個開放源碼骰子機器人計畫。
來源自 https://docs.google.com/document/d/1dYnJqF2_QTp90ld4YXj6X8kgxvjUoHrB4E2seqlDlAk/edit</br>

現在改成三合一Line x Discord x Telegram。</br>
雖然是三合一，但可以單獨使用，只是共用骰組，</br>
啓動條件是在HEROUKU 輸入BOT的 CHANNEL_SECRET</br>

不然的話沒這麼多伺服器開這麼多ＢＯＴ。</br>
最期待Whatsapp快開放權限，香港都是比較多使用Whatsapp</br></br></br>


這是建立在Heroku的免費伺服器上，所以大家都可以按照下面的教程，客制化做一個自己的BOT！</br>
現支援普通擲骰，純計算，趣味擲機擲骰，運勢，克蘇魯神話</br>
朱の孤塔，神我狩，迷宮王國，亞俠必死的冒險，忍神，DX2nd,3rd</br>
命運Fate，永遠的後日談，劍世界2.5，WOD黑暗世界，</br>
自定義回應功能，儲存擲骰指令功能，擲骰開關功能及資料庫功能</br>
</br></br>



順便宣傳
<a href="http://www.goddessfantasy.net/bbs/index.php?board=1400.0">香港TRPG區</a>
<a href="https://www.hktrpg.com">TRPG百科</a>
招技術人員
</br></br></br>

### ToDo list


- [x] 暗骰同時把結果傳給指定對象
- [ ] 可以給非Admin GM權限
- [ ] 設定名字, 每次擲骰時顯示
- [ ] 定時功能. GM 可以發佈任務, 定時提示時限, 玩家查詢等等
- [ ] 投票功能
- [x] 存好指定擲骰方法, 輸入指定即可快速打出來
- [ ] 選擇圖書式遊戲(好像COC 單人TRPG 「向火獨行」一樣, 輸入頁碼, 就會顯示故事, 好像跑團一樣,以後不怕沒有同伴了,不過首先要有故事ORZ)
- [x] 增加 mee6式 LV 排名升級 功能(需修改觸發方法)
- [ ] 增加 戰鬥輪回合功能 .round  next hide public init del
- [X] 增加 角色卡功能 .char set del
- [ ] 增加 LOG功能 可以自動變成LOG


其他功能,歡迎留言建議


特色介紹</br>
==
占卜運氣功能。</br>
支持大小階。</br>
增加HELP功能。詳情BOT內輸入bothelp 查看說明</br>
支持直接 1d100 5d20。</br>
cc<= 改成 cc cc1 cc2 ccn1 ccn2。</br>
增加永遠後日談的NC擲骰 來自Rainsting/TarotLineBot。</br>
增加wod 黑暗世界 DX3 SW2.0的擲骰。</br>
模組化設計。</br></br>
</br></br></br>

以下分別有Line Discord 和telegram 的說明</br>
用那個就看那個吧</br>
另外要申請一個mlab ACC, 教學遲些再寫
</br></br>
如何建立自己的Line骰子機器人
==

準備動作：
--
* 先申請好Line帳號（廢話）</br>
* 先申請好Github帳號</br>
* 先申請好Heroku帳號</br>
以下全部選擇用免費的服務就夠了，請不要手殘選到付費。
</br></br></br>

Step1：先把這個專案Fork回去
--
* 到右上角的 ![Fork](http://i.imgur.com/g5VmzkC.jpg) 按鈕嗎，按下去。</br>
把這個專案存到你的Github裡。
</br></br></br></br>

Step2：建立lineBot賬號
--
* 到[https://developers.line.me/en/ ](https://developers.line.me/en/ )登入一個Line帳號，</br>
點選「開始使用Messaging API」，按照指示註冊你的line Bot賬號。</br>
![開始使用Messaging API](http://i.imgur.com/Zb2Oboy.jpg)</br></br></br>
---

* 點下方那個「免費帳號」</br>
</br></br></br>
---

* 進入你剛註冊的line Bot賬號</br>
---

* 照著這個畫面設定,把Use webhooks 定為開啓，Auto-reply messages  及Greeting messages 定為Disable</br>
![設定](http://i.imgur.com/PXf10Qs.jpg)</br></br></br>
---
* 然後開著網頁不要關。</br>
![LINE Developers](http://i.imgur.com/aks55p4.jpg)</br></br></br></br>
---


Step3：將LineBot部署到Heroku
--

* 按一下下面這個按鈕</br>
按它→[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/zeteticl/RoboYabaso)←按它</br></br></br>
---

* 你會看到這個</br>
![Heroku](http://i.imgur.com/sbCVOcW.jpg)</br></br></br>
當然，先取一個App name，回到上個步驟的LINE Developers網頁</br></br></br></br>




Step4：取得Channel Access Token和Channel Secret
--
* 先取得Channel Secret，按右邊的按鈕</br>
![Channel Secret](http://i.imgur.com/oNN9gUx.jpg)</br>
把取得的字串複製到Step3的LINE_CHANNEL_SECRET</br></br></br>
---
* 再取得Channel Access Token，按右邊的按鈕</br>
![Channel Access Token](http://i.imgur.com/UJ4AQlJ.jpg)</br>
把取得的字串複製到Step3的LINE_CHANNEL_ACCESSTOKEN</br></br>
接著，按下Deploy app，等他跑完之後按下Manage App</br>
距離部署完機器人只差一步啦！
</br></br></br></br>



Step5：鏈接Line與Heroku
--
* 點選settings</br>
![setting](http://i.imgur.com/9fEMoVh.jpg)</br></br></br>
---
* 找到Domains and certificates這個條目，旁邊會有個「Your app can be found at……」加一串網址，把網址複製起來。</br>
![Domain](http://i.imgur.com/dcgyeZa.jpg)</br></br></br>
---
* 回到LINE Developers網頁，選取最底下的edit，找到Webhook URL，把那串網址去除https://複製上去</br>
![webhook](http://i.imgur.com/tn2EN6l.jpg)</br></br></br>
---
* 按下Save。看到在 Webhook URL 旁邊有個 VERIFY 按鈕嗎，按下去。</br>
如果出現 Success. 就表示你成功完成啦！</br>
![Success](http://i.imgur.com/yjlpIh8.jpg)</br></br></br>

如何修改並上傳程式碼咧
==
回到Heroku網頁，點選上面的Deploy，你會看到四種配置程式碼的方法。</br>
![Deploy](http://i.imgur.com/VVRpNLe.jpg)</br>

我猜想如果你是會用第一種（Heroku Git）或是第四種（Container Registry）的人，應該是不會看這種教學文～所以我就不介紹了～</br>
絕、絕對不是我自己也不會的關係哦（眼神漂移）</br>

以第二種（Github）來說的話，你可以綁定你的Github賬號——剛剛我們不是fork了一份程式碼回去嗎？把它連接上去，這樣你就可以在Github那邊修改你要的程式碼，再Deploy過來。</br>
或是你可以使用第三種（Dropbox），當你鏈接之後，它會自動幫你把你剛剛上線的程式碼下載到你的dropbox裡面。你修改完之後再上來Deploy就好咯。</br></br></br>



準備動作：
--
* 先申請好Discord帳號（廢話）</br>
* 先申請好Github帳號</br>
* 先申請好Heroku帳號</br>
以下全部選擇用免費的服務就夠了，請不要手殘選到付費。
</br></br></br>

Step1：先把這個專案Fork回去
--
* 到右上角的 ![Fork](http://i.imgur.com/g5VmzkC.jpg) 按鈕嗎，按下去。</br>
把這個專案存到你的Github裡。
</br></br></br></br>

Step2：建立DiscordBot賬號
--
* 到[http://discordapp.com/developers/applications/me](http://discordapp.com/developers/applications/me )登入一個Discord帳號，</br>
點選「New Application」，按照指示註冊你的Discord Bot。</br>
---

* 記下那個「CLIENT ID」</br>


* 進入左方Setting 的Bot</br>


* 在BUILD-A-BOT中點選Add Bot->Yes Do It. 接著把「Token」複製(Copy)下來</br>
</br></br></br>
Step3：將DiscordBot部署到Heroku
--

* 按一下下面這個按鈕</br>
按它→[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/zeteticl/DiscordRollBot_HKTRPG)←按它</br></br></br>
---

* 你會看到這個</br>
![Heroku](http://i.imgur.com/sbCVOcW.jpg)</br></br></br>
當然，先取一個App name，然後把以前記下的「Token」貼上.</br></br>
如果想要啓動語,可以順便打上. 例如啓動語!trpg 便會變成!trpg 1d100 
接著，按下Deploy app，等他跑完之後按下Manage App</br>
距離部署完機器人只差一步啦！
</br></br></br></br>



Step4：把機器人邀請到你的頻道
--
* 剛剛複製了一個「CLIENT ID」把它取代到以下網址中間</br>

[https://discordapp.com/oauth2/authorize?&client_id=CLIENTID&scope=bot&permissions=8](https://discordapp.com/oauth2/authorize?&client_id=CLIENTID&scope=bot&permissions=8)</br></br>

* 點擊然後選擇你的頻道</br>
* 然後就可以在頻道中使用你的Bot了.
---
</br></br></br>


Telegram......</br>
是最簡單的,和上面一樣,先註冊Telegram ACC</br>
然後到 https://telegram.me/botfather</br>
使用 /new bot 輸入BotName 和UserName</br>
會得到Token 和邀請碼，Token 就是輸入到Heroku 中</br>
邀請碼就是給Telegram 用家連到Bot的。</br></br>



以上說明參考</br>
https://github.com/zeteticl/TrpgLineBot-php </br>

下一部希望更新是</br>
1. MONGODB (但好難啊....會有高手幫忙嗎....不想用GOOGLE SHEET.....</br>
2. 骰組方法學習凍豆腐</br>
3. Help的優化

更多更新資料放在Discord群上

2018/02/01</br>
更新模組化</br></br>

2018/02/17 </br>
發現說明有BUG,已修正</br></br>

2018/03/09</br>
更新DX3了</br></br>

2018/11/22</br>
更新SW2.0</br></br>

*2019/02/15</br>
新增成長或增長檢定：dp (數值) (名字)</br>

*2019/4/2
趕不及4月1日發佈,可惡! 三合一版完成</br>

*2020/4/2
聽說MersenneTwister19937 隨機方法比較好，試著改成這偽隨機方法。</br>




【擲骰BOT】
--
暗骰功能 在指令前輸入dr 結果會私訊你</br>
例如輸入2d6+1　攻撃！</br>
會輸出）2d6+1：攻撃  9[6+3]+1 = 10</br>
如上面一樣,在骰子數字後方隔空白位打字,可以進行發言。</br>
以下還有其他例子</br>
5 3D6 ：分別骰出5次3d6</br>
D66 D66s ：骰出D66 s小者固定在前</br>
5B10：不加總的擲骰 會進行小至大排序</br>
5B10 8：如上,另外計算其中有多少粒大過8</br>
5U10 8：進行5D10 每骰出一粒8會有一粒獎勵骰</br>
5U10 8 9：如上,另外計算其中有多少粒大過9</br>
Choice：啓動語choice/隨機/選項/選1</br>
(問題)(啓動語)(問題)  (選項1) (選項2)</br>
例子 隨機收到聖誕禮物數 1 2 3 >4  </br>
  </br>
隨機排序：啓動語　排序</br>
(問題)(啓動語)(問題)  (選項1) (選項2)(選項3)</br>
例子 交換禮物排序 A君 C君 F君 G君</br></br>
 
・COC六版判定　CCb （目標値）：做出成功或失敗的判定</br>
例）CCb 30　CCb 80</br>
・COC七版判定　CCx（目標値）</br>
　x：獎勵骰/懲罰骰 (2～n2)。沒有的話可以省略。</br>
例）CC 30　CC1 50　CCn2 75</br></br>
・coc7角色背景：啓動語 coc7角色背景</br>
・coc7 成長或增長檢定：dp (技能) (名稱)</br>
例）DP 80 偵查</br></br>
・coc7 成長或增長檢定：dp (技能) (名稱)</br>
例）DP 80 偵查</br></br>
</br>
現支援系統: </br>
【了解骰組詳情,請輸入 bothelp (編號) 或all 或 在指令後輸入help 如 .sg help】</br>
0: 進階擲骰 .ca (計算) D66(sn) 5B10 Dx 5U10 x y</br>
1: 趣味擲骰 排序(至少3個選項) choice/隨機(至少2個選項) 每日塔羅 運勢 立flag .me</br>
2: 克蘇魯神話 cc cc(n)1~2 ccb ccrt ccsu .dp .cc7build .cc6build .cc7bg</br>
3: 朱の孤塔 .al (nALx*p)</br>
4: DX2nd,3rd .dx (xDX+y@c ET)</br>
5: 命運Fate .4df(m|-)(加值)</br>
6: 神我狩 .kk (ET RT NT KT MTx)</br>
7: 迷宮王國 .mk (nMK+m 及各種表)</br>
8: 永遠的後日談 .nc (NM xNC+m xNA+m)</br>
9: 亞俠必死的冒險 .ss (nR>=x[y,z,c] SRx+y FumbleT) </br>
10: 忍神 .sg (ST FT ET等各種表) </br>
11: 劍世界2.5 .sw (Kx Gr FT TT)</br>
12: 歌風 .UK (nUK nUK@c or nUKc)</br>
13: WOD黑暗世界 .xWDy</br>
14: 貓貓鬼差 .kc xDy z</br>
15: (公測中)Wiki查詢/圖片搜索/翻譯 .wiki .image .tran</br>
16: (公測中)暗骰GM功能 .drgm (addgm del show) dr ddr dddr</br>
17: (公測中)經驗值功能 .level (show config LevelUpWord RankWord)</br>
18: (公測中)自定義回應功能 .ra(p)(次數) (add del show 自定關鍵字)</br>
19: (公測中)儲存擲骰指令功能 .cmd (add del show 自定關鍵字)</br>
20: (公測中)擲骰開關功能 .bk (add del show)</br>
21: (公測中)資料庫功能 .db(p) (add del show 自定關鍵字)</br></br>
![image](https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png)


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

# 【HKTRPG擲骰BOT】

- 最後更新時間![最後更新時間](https://img.shields.io/github/last-commit/hktrpg/TG.line.Discord.Roll.Bot)
- 2019/07/21 香港克警合作 黑ICON紀念
- 想試用這機械人的話，請按以下連結，輸入`bothelp`顯示教學

## HKTRPG擲骰子專用機械人 Roll Dice Robot

- HKTRPG是在Discord, Line, Telegram, Whatsapp, Plurk, API 和網頁上都可以使用的骰子機械人！
  - 功能：暗骰, 各類TRPG骰子擲骰, 自定義骰子, 身分組管理, 頻道經驗值, 占卜, 先攻表, TRPG角色卡, 搜圖, 翻譯, Discord 聊天紀錄匯出, 數學計算, 做筆記, 隨機抽選, wiki查詢, 資料庫快速查詢功能, 定時發訊息功能, 每日笑話, 每日動漫, 每日一言, 每日黃曆, 每日毒湯, 每日情話, 每日靈簽, 每日急口令, 每日大事, 每日(星座)
  - 歡迎加入[開發，求助及TRPG Discord 群組](https://discord.gg/vx4kcm7)
  - 邀請HKTRPG 加入
    - [Discord 邀請連結](http://bit.ly/HKTRPG_DISCORD_)
    - [Telegram 邀請連結](http://t.me/hktrpg_bot)
    - [Line 邀請連結](http://bit.ly/HKTRPG_LINE)
    - [網頁版 邀請連結](https://rollbot.hktrpg.com/)
    - [Plurk 邀請連結](https://www.plurk.com/HKTRPG)
    - [TRPG API 連結](https://www.hktrpg.com:20721/api)
  - [HKTRPG 研究社 Facebook](https://www.facebook.com/groups/HKTRPG)
  - [TRPG 百科](https://www.HKTRPG.com/)
  - [名人堂](https://hktrpg.github.io/TG.line.Discord.Roll.Bot/CREDITS.html)
  - [HKTRPG  官方使用教學](https://bothelp.hktrpg.com/)
  - [贊助HKTRPG](https://www.patreon.com/HKTRPG)

## 指令簡介

- 部份指令以 `.` 開頭或無開頭
- 以下為部份例子
- 輸入 `bothelp` 可以顯示幫助訊息 或到 
- 輸入 `功能的前置詞 help` 也可以顯示幫助訊息,如 `cc help` `.level help`
- 輸入 `xDy` 可以進行基本擲骰 例如1D6
- 輸入 `dr xDy (或任何指令)` 可以進行暗骰，私訊你結果
- 輸入 `.ca 算式` 可以進行數學計算
- 輸入 `.image (內容)` 可以進行網上圖片搜索
- 輸入 `.at 5mins 哈哈哈[[cc 80]]` 可以五分鐘發訊息
- 輸入 `.cron 13:50 哈哈哈[[立FLAG]]` 可以每天13點50分立一個FLAG

- 因為功能眾多，所以再分成幾個類型在下面介紹
  - 基本擲骰指令
  - 指定TRPG系統擲骰指令
  - TRPG 輔助工具
  - 系統工具
  - 趣味功能

# 基本擲骰指令
  
## 【基本擲骰】1d100(khN|klN|dhN|dlN)

- 例如輸入 `(2d6+1)\*2 攻撃！`
- 會輸出） `(2d6+1)\*2：攻撃！ (10[5+5]+1)2 = 22`
- 如上面一樣,在骰子數字後方隔空白位打字,可以進行發言。
- `.5 3D6` ： 分別骰出5次3d6 最多30次
- `((2d6+1)\*2)-5/2>=10` 支援括號加減乘除及大於小於(>,<,>=,<=)計算
- 支援 `kh` `kl` `dh``dl`，k keep保留，d drop 放棄，h highest最高，l lowest最低
- 如`3d6kh` 保留最大的1粒骰，`3d6dl2` 放棄最小的2粒骰

### 暗骰功能

- 在指令前輸入 `dr` 結果會私訊你
- `ddr` `dddr` 可以私訊已設定的群組GM, 詳情可打`.drgm`查詢
- 如`dr 3d6`

# 進階擲骰指令

- 【進階擲骰】 `.ca (算式)` `D66(sn)` `5B10 Dx` `5U10 x y` `.int x y`
  - `.ca` 只進行數學計算
            例如: `.ca 1.2 * (2 + 4.5)`  `12.7 米 to inch`
            `sin(45 deg) ^ 2`  `5磅轉斤` `10米轉呎` `10米=吋`
  - `D66` `D66s` `D66n`    骰出D66 s數字小在前 n大在前
  - `5B10`    不加總的擲骰
  - `5B10S`   不加總的擲骰，並按大至小排序
  - `5B10<>=x`    如上,另外計算其中有多少粒大於小於X
  - `5B10 (D)x`     如上,用空格取代, 即大於, 使用D即小於
            即 5B10 5 相當於 5B10>=5　 5B10 D5 相當於 5B10<=5
  - `5U10 8`    進行5D10 每骰出一粒8會有一粒獎勵骰
  - `5U10 8 9`    如上,另外計算其中有多少粒大於9
  - `.int 20 30` 即骰出20-30
- 【克蘇魯神話】 `cc` `cc(n)1~2` `ccb` `ccrt` `ccsu` `.dp` `.cc7build` `.cc6build` `.cc7bg`
  - coc6版擲骰： `ccb 80` 技能小於等於80
  - coc7版擲骰： `cc 80` 技能小於等於80
  - coc7版獎勵骰： cc(1~2) `cc1 80` 一粒獎勵骰
  - coc7版懲罰骰： ccn(1~2) `ccn2 80` 兩粒懲罰骰
  - coc7版 即時型瘋狂： 啓動語 `ccrt`
  - coc7版 總結型瘋狂： 啓動語 `ccsu`
  - coc6版創角： 啓動語 `.cc6build`
  - coc7版創角： 啓動語 `.cc7build (歲數)`
  - coc7 成長或增長檢定： .dp 或 成長檢定 或 幕間成長 (技能%) (名稱)
        `.DP 50 騎馬`  `成長檢定 45 頭槌`  `幕間成長 40 單車`
  - coc7版角色背景隨機生成： 啓動語 `.cc7bg`
  - ----2021/08/07新增----
  - 成長檢定紀錄功能
            開啓後將會紀錄你使用CC功能投擲成功和大成功大失敗的技能，
            然後可以呼叫出來進行自動成長。
  - `.dp start` ： 開啓紀錄功能
  - `.dp stop` ： 停止紀錄功能
  - `.dp show` ： 顯示擲骰紀錄
  - `.dp auto` ： 進行自動成長並清除擲骰紀錄
  - `.dp clear` ： 清除擲骰紀錄
  - `.dp clearall` ： 清除擲骰紀錄包括大成功大失敗

## 各種TRPG系統擲骰

- 以下指令詳情省略，輸入指令頭 + help 觀看詳情 eg: `.al help`
- 【朱の孤塔】 `.al (nALx\*p)`
- 【神我狩】 `.kk (ET RT NT KT MTx)`
- 【迷宮王國】 `.mk (nMK+m 及各種表)`
- 【亞俠必死的冒險】 `.ss (nR>=x\[y,z,c\] SRx+y FumbleT)`
- 【忍神】 `.sg (ST FT ET等各種表)`
- 【歌風】 `.UK (nUK nUK@c or nUKc)`
- 【魔女狩獵之夜】`.wn xDn+-y`
- 【DX2nd,3rd】 `.dx (xDX+y@c ET)`
- 【命運Fate】 `.4df(m|-)(加值)`
- 【永遠的後日談】 `.nc (NM xNC+m xNA+m)`
- 【劍世界2.5】`.sw (Kx Gr FT TT)`
- 【WOD黑暗世界】`.xWDy`
- 【貓貓鬼差】`.kc xDy z`

# TRPG輔助工具 指令

- 【身分組管理】Discord限定功能
  - 讓對指定訊息的Reaction Emoji(如😀😃😄)進行點擊的用家
  - 分配指定的身分組別
  - ![示範](https://i.imgur.com/kuZHA3m.gif)
  - 注意: 此功能需求HKTRPG擁有【編輯身分組】及【增加Reaction】的權限，請確定授權。
  - 另外，使用者需要【伺服器管理者】權限。
    - `roleReact show` 顯示現有的指定訊息的資料
    - `.roleReact delete 序號` 刪除後該信息將不會再派發移除身分組
    - `.roleReact add` 新增指定信息
      - 首先去User Setting=>Advanced=>開啓Developer Mode
      - 再去Server Setting=>Roles=>新增或設定希望分配的身分組
      - 然後對該身分組按右鍵並按COPY ID，把該ID記下來
  
      - 最後按以下格式來輸入指令

          .roleReact add

           身份組ID Emoji

           [[message]]

           需要發佈的訊息

      - **範例**
  
           .roleReact add

           232312882291231263 🎨

           123123478897792323 😁

           [[message]]

           按🎨可得身分組-畫家

           按😁可得身分組-大笑

- 【Discord 頻道聊天紀錄輸出工具】
  - `.discord html` 可以輸出有分析功能的聊天紀錄
  - `.discord txt` 可以輸出純文字的聊天紀錄
  - 需要使用者及rollbot 都有閱讀頻道聊天紀錄的權限
      然後會私訊你紀錄
  - 注意 使用此功能，你需要有管理此頻道的權限或管理員權限。
  - 另外網頁版內容經過AES加密，後者是純文字檔案
      因為經過server處理，擔心個資外洩請勿使用。
- 【暗骰GM功能】 `.drgm (addgm del show)` `dr` `ddr` `dddr`
  - 這是讓你可以私骰GM的功能
  - 想成為GM的人先輸入`.drgm addgm`
  - 然後別人DDR 或DDDR (指令)即可以私訊給這位GM
  - 例如輸入 `ddr cc 80 鬥毆`
  - 就會把結果私訊GM及自己
  - 例如輸入 `dddr cc 80 鬥毆`
  - 就會把結果只私訊GM
  - P.S.如果沒立即生效 用.drgm show 刷新一下
  - 輸入.drgm addgm (代名) 即可成為GM,如果想化名一下,
  - 可以在addgm 後輸入一個名字, 暗骰時就會顯示
  - 不輸入就會顯示原名
  - 輸入`.drgm show` 顯示所有GM
  - 輸入`.drgm del(編號)`或all 即可刪除
  - 輸入`dr  (指令)` 私訊自己
  - 輸入`ddr (指令)` 私訊GM及自己
  - 輸入`dddr(指令)` 私訊GM
- 【角色卡功能】 `.char (add edit show delete use nonuse)` `.ch (set show showall)`
  - 以個人為單位, 一張卡可以在不同的群組使用
  - 目標是文字團可以快速擲骰，及更新角色狀態。

  - 簡單新增角色卡 `.char add name[Sad]~ state[HP:15/15;]~ roll[鬥毆: cc 50;]~ notes[筆記:這是測試,請試試在群組輸入 .char use Sad;]~`
  - 新增了角色卡後，可以輸入 `.admin account (username) (password)`
  - 然後在網頁: <https://www.hktrpg.com:20721/card/> 中直接進行修改
  - 把結果傳送到已登記的Discord，TG，LINE上的聊天群組的登記方法:
  - 由該群組的Admin授權允許 輸入 `.admin allowrolling`
  - 登記該群組到自己的名單中 輸入 `.admin registerChannel`
  - 取消方法
  - 由該群組的Admin取消授權 輸入 `.admin disallowrolling`
  - 取消登記該群組到名單 輸入 `.admin unregisterChannel`

  - 最後網站會顯示群組名稱，點擊就可以使用了

- 【儲存擲骰指令功能】 `.cmd (add del show 自定關鍵字)`
  - 這是根據關鍵字來再現擲骰指令,
  - 例如輸入 `.cmd add  pc1鬥毆 cc 80 鬥毆`
  - 再輸入`.cmd pc1鬥毆`  就會執行後方的指令
  - add 後面第一個是關鍵字, 可以是符號或任何字
  - P.S.如果沒立即生效 用.cmd show 刷新一下
  - 輸入`.cmd add (關鍵字) (指令)`即可增加關鍵字
  - 輸入`.cmd show` 顯示所有關鍵字
  - 輸入`.cmd del(編號)`或all 即可刪除
  - 輸入`.cmd  (關鍵字)` 即可執行
- 【先攻表功能】 `.in (remove clear reroll help)` `.init`
  - 這是讓你快速自定義先攻表的功能
  - 它可以儲存你的擲骰方法，然後直接重新投擲，而不需要再輸入。
  - `.in (擲骰或數字) (名字)`  - 樣式
  - `.in 1d20+3 (名字)`
  - `.in 1d3` (如沒有輸入, 會用你聊天軟件中的名字)
  - `.in 80`         - 直接取代先攻值
  - `.in -3+6*3/2.1`  - 加減
  - `.in remove` (名字) - 移除該角色
  - `.in reroll` - 根據算式重擲先攻表
  - `.in clear`  - 清除整個先攻表
  - `.init`      - 顯示先攻表，由大到小
  - `.initn`     - 顯示先攻表，由小到大
- 【你的名字】 `.myname` `.me` `.me1` `.me(名字)` *Discord限定功能
  - TRPG扮演發言功能
  - 你可以設定一個角色的名字及頭像，
  - 然後你只要輸入指令和說話，就會幫你使用該角色發言。

  - ![示範](https://i.imgur.com/VSzO08U.png)
  - 注意: 此功能需求編輯Webhook及訊息功能，請確定授權。

  - 指令列表

  - 1.設定角色
  - .myname "名字" 角色圖片網址 名字縮寫(非必要)
  - 示範 .myname "泉心 造史" https://images.pexels.com/photos/10013067/pexels-photo-10013067.jpeg 造
  
  - *名字*是角色名字，會作為角色顯示的名字，但如果該名字有空格就需要用開引號"包著
  - 如"泉心 造史" 不然可以省去

  - 圖片則是角色圖示，如果圖片出錯會變成最簡單的Discord圖示，
  - 圖片可以直接上傳到DISCORD或IMGUR.COM上

  - 名字縮寫是 是用來方便你啓動它
  - 例如 .me造 「來玩吧」

  - 2.刪除角色
  - .myname delete  序號 / 名字縮寫 / "名字"
  - 刪除方式是delete 後面接上序號或名字縮寫或名字

  - 3.顯示角色
  - .myname show

  - 4.使用角色
  - .me(序號/名字縮寫) 訊息
  - 如
  - .me1 泉心慢慢的走到他們旁邊，伺機行動
  - .me造 「我接受你的挑戰」

## 系統工具 指令

- 【顯示統計信息】`.admin state`
- 【擲骰開關功能】 `.bk (add del show)`
  - 這是根據關鍵字來開關功能,只要符合內容,
  - 例如運勢,那麼只要字句中包括,就不會讓Bot有反應
  - 所以注意如果用了D, 那麼1D100, .1WD 都會全部沒反應.
  - 另外不可擋b,k,bk, 只可以擋漢字,數字和英文
  - P.S.如果沒立即生效 用.bk show 刷新一下
  - 輸入`.bk add xxxxx` 即可增加關鍵字 每次一個
  - 輸入`.bk show` 顯示關鍵字
  - 輸入`.bk del (編號)`或all 即可刪除

## 趣味功能 指令

- 【玩樂用】指令，如塔羅牌, 運勢, 隨機抽選
  - `排序 (選項1) (選項2) (選項N)` 會進行隨機的排序
  - `隨機 (選項1) (選項2)`  - 會隨機抽選一個出來
  - `每日塔羅` 幫你抽塔羅牌占卜，還有 `大十字塔羅` `時間塔羅` 可以占卜
  - `運勢` 幫你占卜
  - `立flag` 會隨機出現一些立FLAG的場景
  - `.me` 可以令HKTRPG機械人重覆你的說話
  - `每日笑話`    顯示一條笑話
  - `每日動漫`    顯示一條動漫金句
  - `每日一言`    顯示一條金句
  - `每日廢話`    顯示一條金句
  - `每日黃曆`    顯示今日黃曆
  - `每日毒湯`    顯示一條有毒的雞湯
  - `每日情話`    顯示一條情話
  - `每日靈簽`    抽取一條觀音簽
  - `每日急口令`    顯示一條急口令
  - `每日大事`    顯示今天歷史上的大事
  - `每日(星座)` 顯示每日星座運程 如 `每日白羊` `每日金牛` `每日巨蟹`
- 【經驗值功能】 `.level (show config LevelUpWord RankWord)`
  - 想在頻道中說話可以得到經驗，請開啓這個功能!還可以和世界各地的人比較LV
  - 按發言次數增加經驗，提升等級，實現服務器內排名等歡樂功能
  - 當經驗達到要求，就會彈出通知，提示你已提升等級。
  - 預設並不開啓，需要輸入.level config 11 啓動功能
  - 數字11代表等級升級時會進行通知，10代表不會通知，
  - 00的話代表關閉功能，
  - 預設回應是「 XXXX 《稱號》， 你的克蘇魯神話知識現在是 X點！
  - 現在排名是XX人中的第XX名！XX%！
  - 調查經驗是XX點。」

- 【Wiki查詢/圖片搜索/翻譯功能】 `.wiki` `.image` `.tran`
  - `.wiki (項目)` 可以在立即搜索WIKI上的資料
  - `.image (項目)` 可以立即隨機搜尋相關照片
  - `.tran (項目)` 立即翻譯係正體中文

- 【自定義骰子抽選功能】 `.ra(p)(次數) (add del show 自定關鍵字)`
  - 這是根據關鍵字來隨機抽選功能,只要符合內容,以後就會隨機抽選/骰子
  - 例如輸入 `.ra add 九大陣營 守序善良 (...太長省略) 中立邪惡 混亂邪惡`
  - 再輸入`.ra 九大陣營`  就會輸出 九大陣營中其中一個
  - 如果輸入`.ra3 九大陣營`  就會輸出 3次九大陣營
  - 如果輸入`.ra3 九大陣營 天干 地支` 就會輸出 3次九大陣營 天干 地支
  - 如果輸入`.rra3 九大陣營` 就會輸出3次有可能重覆的九大陣營
  - 範例:
  - `.rap10 聖晶石召喚` `.rap 九大陣營`
- 【資料庫功能】 `.db(p) (add del show 自定關鍵字)`
  - 這是根據關鍵字來顯示數據的,
  - 例如輸入 `.db add 九大陣營 守序善良 (...太長省略) 中立邪惡 混亂邪惡`
  - 再輸入`.db 九大陣營`  就會輸出 九大陣營中的全部內容
  - add 後面第一個是關鍵字, 可以是漢字,數字,英文及emoji
  - 範例:
  - `.dbp COC` `.dbp 戀人`
- 【事件功能】`.event (add delete show) .evt (random/事件名稱)`
  - 經由新增的事件，會得到一些狀態或增加減少經驗值，
  - 並可以賺取額外經驗值。
  - .event help 顯示詳情
- 【定時發訊功能】  `.at .cron mins hours delete show`
  - 兩種模式
  - 【at】 指定一個時間
  - 如 `.at 20220604 1900 (年月日 時間)`
  - `.at 5mins (五分鐘後)`
  - `.at 5hours (五小時後)`
  - 會發佈指定一個信息
  - 可以擲骰 使用`[[]]`包著指令就可
  - 如`.at 5hours [[CC 60]]`

  - 【cron】 每天指定一個時間可以發佈一個信息(24小時制)
  - 如 1230 2200
  - `.cron 0831 每天八時三十一分`
  - `嚎叫吧!`
  - `.cron 0721 每天七時二十一分擲`
  - `[[CC 80 幸運]]`
  - `.cron 1921-2`
  - `我將會每隔兩天的晚上7時21分發一次訊息`
  - `.cron 1921-wed`
  - `我將會每個星期三發一次訊息`

  - `.cron / .at show` 可以顯示已新增的定時訊息
  - `.cron / .at delete (序號)` 可以刪除指定的定時訊息
  - 如 `.at delete 1` 請使用`.at show` 查詢序號

# TRPG API @HKTRPG 服務

回覆格式為JSON，請求方式為GET
請求的位置:
<https://www.hktrpg.com:20721/api/>

示範:
<https://www.hktrpg.com:20721/api?msg=1d100>

[api](views/image/api.png)

# 鳴謝

- 最後感謝不同人的幫助，才可以完成這個BOT
  - LarryLo  Retsnimle - 寫出如何建BOT的教程和開源程式，開始這個BOT的成長
  - 布大獅              - 教導我如何寫好程式，還親手寫出不同改進方式
  - LOKI Lokinen，木易 陳，Luo Ray，Vivian  -   因為有他們捐助，才可以把HKTRPG搬到更好的機子上
  - 以及其他一直幫助和意見的朋友

關於RoboYabaso
==

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

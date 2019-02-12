# RoboYabaso@HKTRPG  V1.60：開放原始碼的LINE骰子機器人

關於RoboYabaso
==
RoboYabaso是一個開放源碼的line骰子機器人計畫。
最早由LarryLo  Retsnimle開發。  

這是建立在Heroku的免費伺服器上，所以大家都可以按照下面的教程，客制化做一個自己的LINEBOT！
</br></br></br>

試用
==
RoboYabaso@HKTRPG 的LineID是：@utr0641o  
你也可以使用QR扣：  
![QR](http://truth.bahamut.com.tw/s01/201612/c50dc2bd02de285983e7cf1c48926a61.JPG)  

或是點這裡：<a href="https://line.me/R/ti/p/svMLqy9Mik"><img height="36" border="0" alt="加入好友" src="https://scdn.line-apps.com/n/line_add_friends/btn/zh-Hant.png"></a>
</br></br>
骰組指令說明在最底下</br>


順便宣傳
<a href="http://www.goddessfantasy.net/bbs/index.php?board=1400.0">香港TRPG區</a>
<a href="https://www.hktrpg.com">TRPG百科</a>
招技術人員
</br></br></br>

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

==

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

* 照著這個畫面設定,把Use webhooks 定為開啓，Auto-reply messages  及Greeting messages 定為Disable</br>
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



以上說明參考</br>
https://github.com/zeteticl/TrpgLineBot-php </br>

下一部希望更新是</br>
1. MONGODB (但好難啊....會有高手幫忙嗎....不想用GOOGLE SHEET.....</br>
2. COC 成長,瘋狂骰表</br>

2018/02/01</br>
更新模組化</br></br>

2018/02/17 </br>
發現說明有BUG,已修正</br></br>

2018/03/09</br>
更新DX3了</br></br>

2018/11/22</br>
更新SW2.0</br></br>

【擲骰BOT】
--
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
  
・NC 永遠的後日談擲骰</br>
(骰數)NC/NA (問題)</br>
  例子 1NC 2Na+4 3na-2</br>
依戀  NM (問題)</br>
  例子 NM NM 我的依戀</br></br>
  
・WOD 黑暗世界擲骰</br>
(骰數)WOD/Wd(加骰)(+成功數) (問題)</br>
  例子 2wod 3wd8 15wd9+2</br></br>

SW2.0</br>
指令</br>
KKn+m-m@c n=骰數 c=暴擊值 m=其他修正</br>

更新DX3 骰組</br>
nDXc+m-m  n=骰數 c=暴擊值 m=其他修正</br></br>

・占卜運氣功能 字句中包括運氣即可</br>
・塔羅牌占卜 塔羅/大十字塔羅/每日塔羅牌</br>
  時間tarot 等關键字可啓動</br>
  死亡FLAG：啓動語 立Flag/死亡flag</br>
  coc7角色背景：啓動語 coc7角色背景</br>

# RoboYabaso@HKTRPG  V1.30：開放原始碼的LINE骰子機器人

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
</br>
順便宣傳
<a href="http://www.goddessfantasy.net/bbs/index.php?board=1400.0">香港TRPG區</a>
<a href="https://www.hktrpg.com">TRPG百科</a>
招技術人員
</br></br></br>

特色介紹</br></br></br>

==
占卜運氣功能。
支持大小階。
增加HELP功能。
支持直接 1d100 5d20。
cc<= 改成 cc cc1 cc2 ccn1 ccn2。
增加永遠後日談的NC擲骰 來自Rainsting/TarotLineBot。
增加wod 黑暗世界的擲骰。
模組化設計。</br></br></br>
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
* 到[https://business.line.me/zh-hant/companies/1253547/services/bot](https://business.line.me/zh-hant/companies/1253547/services/bot)申請一個帳號，</br>
點選「開始使用Messaging API」，按照指示建立你的line賬號。</br>
![開始使用Messaging API](http://i.imgur.com/Zb2Oboy.jpg)</br></br></br>
---

* 當你看到這個畫面的時候，點右邊那個「前往LINE@MANAGER」</br>
![前往LINE@MANAGER](http://i.imgur.com/C2mzamX.jpg)</br></br></br>
---

* 你會看到這個，總之還是點下去</br>
![警告](http://i.imgur.com/XfRa9UU.jpg)</br></br></br>
---
* 照著這個畫面設定</br>
![設定](http://i.imgur.com/PXf10Qs.jpg)</br></br></br>
---
* 接下來移到上面，看到「LINE Developers」了嗎？按下去，然後開著網頁不要關。</br>
![LINE Developers](http://i.imgur.com/aks55p4.jpg)</br></br></br></br>
---


Step3：將LineBot部署到Heroku
--

* 按一下下面這個按鈕</br>
按它→[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)←按它</br></br></br>
---

* 你會看到這個</br>
![Heroku](http://i.imgur.com/sbCVOcW.jpg)</br></br></br>
當然，先取一個App name，那底下兩個要在哪裡找呢，回到上個步驟的LINE Developers網頁</br></br></br></br>




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
* 回到LINE Developers網頁，選取最底下的edit，找到Webhook URL，把那串網址複製上去，尾巴加上 /LINE/</br>
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



以上說明參考
https://github.com/zeteticl/TrpgLineBot-php

下一部希望更新是
1. 幫助的顯示方式可以更漂亮
2. DX3 開發

2018/02/01
更新模組化
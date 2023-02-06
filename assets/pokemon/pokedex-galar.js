var Pokedex;
if(!Pokedex) Pokedex = [];

Array.prototype.push.apply(Pokedex, [
  {
    "id": "810",
    "region": "galar",
    "name": "敲音猴",
    "alias": "Grookey",
    "type": [ "Grass" ],
    "info": {
      "image": "images/pokedex/810.png",
      "height": "0.3",
      "weight": "5",
      "category": "小猴寶可夢",
      "text": "牠們年輕的時候都在尋找能發出特定聲音的木棒，且之後會用這根木棒來敲奏出能夠使花草生長的節奏。敲音猴是一種熱情、善良、且熱愛音樂的生物。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 0,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [
      "茂盛"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Grass", "name": "木枝突刺" },
      { "rank": 1, "type": "Dark", "name": "挑釁" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Dark", "name": "拍落" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 3, "type": "Normal", "name": "吵鬧" },
      { "rank": 3, "type": "Grass", "name": "木槌" },
      { "rank": 3, "type": "Normal", "name": "蠻幹" },
      { "rank": 4, "type": "Grass", "name": "草之誓約" },
      { "rank": 4, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 4, "type": "Grass", "name": "寄生種子" }
    ],
    "isNovice": true
  },
  {
    "id": "811",
    "region": "galar",
    "name": "啪咚猴",
    "alias": "Thwackey",
    "type": [
      "Grass"
    ],
    "info": {
      "image": "images/pokedex/811.png",
      "height": "0.7",
      "weight": "14",
      "category": "節拍寶可夢",
      "text": "啪咚猴相當熱衷於牠的節拍，牠們可能會過於沉浸在音樂中而甚至不會意識到戰鬥已經結束。牠們敲奏的速度越快，越是能獲得夥伴們的尊敬。"
    },
    "evolution": {
      "stage": "second",
      "time": "medium"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "茂盛"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "二連擊" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Grass", "name": "木枝突刺" },
      { "rank": 2, "type": "Dark", "name": "挑釁" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Dark", "name": "拍落" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 3, "type": "Normal", "name": "吵鬧" },
      { "rank": 3, "type": "Grass", "name": "木槌" },
      { "rank": 3, "type": "Normal", "name": "蠻幹" },
      { "rank": 4, "type": "Flying", "name": "雜耍" },
      { "rank": 4, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 4, "type": "Grass", "name": "寄生種子" }
    ]
  },
  {
    "id": "812",
    "region": "galar",
    "name": "轟擂金剛猩",
    "alias": "Rillaboom",
    "type": [
      "Grass"
    ],
    "info": {
      "image": "images/pokedex/812.png",
      "height": "2.1",
      "weight": "90",
      "category": "鼓手寶可夢",
      "text": "牠們的首領擁有族群中最大的鼓，並有著最高超的打鼓技巧，能操縱樹根去攻擊牠的敵人。但牠們其實是性情溫和，重視族群和諧相處的生物。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 6,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "茂盛"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "二連擊" },
      { "rank": 0, "type": "Grass", "name": "鼓擊" },
      { "rank": 1, "type": "Grass", "name": "青草場地" },
      { "rank": 1, "type": "Normal", "name": "戰吼" },
      { "rank": 2, "type": "Normal", "name": "抓" },
      { "rank": 2, "type": "Normal", "name": "叫聲" },
      { "rank": 2, "type": "Grass", "name": "木枝突刺" },
      { "rank": 2, "type": "Dark", "name": "挑釁" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 3, "type": "Dark", "name": "拍落" },
      { "rank": 3, "type": "Normal", "name": "摔打" },
      { "rank": 3, "type": "Normal", "name": "吵鬧" },
      { "rank": 3, "type": "Grass", "name": "木槌" },
      { "rank": 3, "type": "Normal", "name": "蠻幹" },
      { "rank": 3, "type": "Normal", "name": "爆音波" },
      { "rank": 4, "type": "Normal", "name": "生長" },
      { "rank": 4, "type": "Normal", "name": "自然之力" },
      { "rank": 4, "type": "Grass", "name": "瘋狂植物" }
    ]
  },
  {
    "id": "813",
    "region": "galar",
    "name": "炎兔兒",
    "alias": "Scorbunny",
    "type": [ "Fire" ],
    "info": {
      "image": "images/pokedex/813.png",
      "height": "0.3",
      "weight": "4.5",
      "category": "兔子寶可夢",
      "text": "炎兔兒體型小巧且充滿活力，牠們喜歡從寬廣場地的其中一邊跑到另一邊，持續好幾個小時並樂此不疲。牠腳底和鼻頭上的肉球會在牠戰鬥或奔跑的時後散發出極度的高溫。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 0,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [
      "猛火"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Fire", "name": "火花" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Fight", "name": "二連踢" },
      { "rank": 2, "type": "Fire", "name": "蓄能焰襲" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 3, "type": "Flying", "name": "彈跳" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 4, "type": "Fire", "name": "火之誓約" },
      { "rank": 4, "type": "Ground", "name": "潑沙" },
      { "rank": 4, "type": "Normal", "name": "憤怒門牙" }
    ],
    "isNovice": true
  },
  {
    "id": "814",
    "region": "galar",
    "name": "騰蹴小將",
    "alias": "Raboot",
    "type": [ "Fire" ],
    "info": {
      "image": "images/pokedex/814.png",
      "height": "0.6",
      "weight": "9",
      "category": "兔子寶可夢",
      "text": "這隻寶可夢熱愛踢東西，並會每天訓練來鍛鍊自己的腳法。牠的體毛變得相當蓬鬆，有些人認為這是為了幫助牠抵禦寒冷氣候，也有人說這是為了讓牠產生出溫度更高的火焰。"
    },
    "evolution": {
      "stage": "second",
      "time": "medium"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "猛火" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Fire", "name": "火花" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Fight", "name": "二連踢" },
      { "rank": 2, "type": "Fire", "name": "蓄能焰襲" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 3, "type": "Flying", "name": "彈跳" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 4, "type": "Normal", "name": "自我激勵" },
      { "rank": 4, "type": "Fight", "name": "飛膝踢" },
      { "rank": 4, "type": "Dark", "name": "突襲" }
    ]
  },
  {
    "id": "815",
    "region": "galar",
    "name": "閃焰王牌",
    "alias": "Cinderace",
    "type": [ "Fire" ],
    "info": {
      "image": "images/pokedex/815.png",
      "height": "1.4",
      "weight": "33",
      "category": "前鋒寶可夢",
      "text": "牠們對自己的能力相當自信且自負。牠們會將小石頭用腳挑起並點火，製造出纏繞著火焰的武器來踢向牠們的對手。如果聽到聲援，牠們就會變得很自大。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 3, "max": 7 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "猛火" ],
    "moves": [
      { "rank": 0, "type": "Fire", "name": "火焰球" },
      { "rank": 0, "type": "Normal", "name": "佯攻" },
      { "rank": 1, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 2, "type": "Fight", "name": "二連踢" },
      { "rank": 2, "type": "Fire", "name": "蓄能焰襲" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Fire", "name": "火花" },
      { "rank": 2, "type": "Normal", "name": "電光一閃" },
      { "rank": 3, "type": "Normal", "name": "頭鎚" },
      { "rank": 3, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 3, "type": "Flying", "name": "彈跳" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Normal", "name": "換場" },
      { "rank": 4, "type": "Fight", "name": "飛膝踢" },
      { "rank": 4, "type": "Normal", "name": "百萬噸重踢" },
      { "rank": 4, "type": "Fire", "name": "爆炸烈焰" }
    ]
  },
  {
    "id": "816",
    "region": "galar",
    "name": "淚眼蜥",
    "alias": "Sobble",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/816.png",
      "height": "0.3",
      "weight": "4",
      "category": "水蜥寶可夢",
      "text": "這隻害羞的寶可夢並不喜歡引來太多的注意。牠會躲在淺淺的水池中……當牠覺得受到威脅，牠會大哭且牠的淚水會釋放出能夠讓對手淚流不止的催淚成分。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "激流" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "拍擊" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Normal", "name": "綁緊" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 2, "type": "Normal", "name": "淚眼汪汪" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Bug", "name": "急速折返" },
      { "rank": 3, "type": "Water", "name": "水流裂破" },
      { "rank": 3, "type": "Water", "name": "浸水" },
      { "rank": 3, "type": "Water", "name": "求雨" },
      { "rank": 4, "type": "Normal", "name": "影子分身" },
      { "rank": 4, "type": "Ice", "name": "白霧" },
      { "rank": 4, "type": "Water", "name": "水之誓約" }
    ],
    "isNovice": true
  },
  {
    "id": "817",
    "region": "galar",
    "name": "變澀蜥",
    "alias": "Drizzile",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/817.png",
      "height": "0.7",
      "weight": "12",
      "category": "水蜥寶可夢",
      "text": "牠的態度發生了劇烈變化，從害羞變得冷漠且懶散。牠能夠從手掌分泌出的水分做成水彈。牠的頭腦相當聰明，並以會在野外設下陷阱來對付敵人而聞名。"
    },
    "evolution": {
      "stage": "second",
      "time": "medium"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "激流" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "拍擊" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Normal", "name": "綁緊" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 2, "type": "Normal", "name": "淚眼汪汪" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Bug", "name": "急速折返" },
      { "rank": 3, "type": "Water", "name": "水流裂破" },
      { "rank": 3, "type": "Water", "name": "浸水" },
      { "rank": 3, "type": "Water", "name": "求雨" },
      { "rank": 4, "type": "Normal", "name": "影子分身" },
      { "rank": 4, "type": "Ice", "name": "黑霧" },
      { "rank": 4, "type": "Water", "name": "水流噴射" }
    ]
  },
  {
    "id": "818",
    "region": "galar",
    "name": "千面避役",
    "alias": "Inteleon",
    "type": [
      "Water"
    ],
    "info": {
      "image": "images/pokedex/818.png",
      "height": "1.9",
      "weight": "45.2",
      "category": "特工寶可夢",
      "text": "牠的指尖能夠射出快得不可思議的水槍，這道水流甚至能夠射穿鐵板。牠通常會在高處狩獵，射擊，然後滑翔而下去享用牠的獵物。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 4,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 7 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 7 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "激流"
    ],
    "moves": [
      { "rank": 0, "type": "Water", "name": "狙擊" },
      { "rank": 0, "type": "Flying", "name": "雜耍" },
      { "rank": 1, "type": "Normal", "name": "拍擊" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 2, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "綁緊" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 2, "type": "Normal", "name": "淚眼汪汪" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 3, "type": "Bug", "name": "急速折返" },
      { "rank": 3, "type": "Water", "name": "水流裂破" },
      { "rank": 3, "type": "Water", "name": "浸水" },
      { "rank": 3, "type": "Water", "name": "求雨" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Ice", "name": "冰礫" },
      { "rank": 4, "type": "Bug", "name": "致命針刺" },
      { "rank": 4, "type": "Water", "name": "加農水炮" }
    ]
  },
  {
    "id": "819",
    "region": "galar",
    "name": "貪心栗鼠",
    "alias": "Skwovet",
    "type": [
      "Normal"
    ],
    "info": {
      "image": "images/pokedex/819.png",
      "height": "0.3",
      "weight": "2.5",
      "category": "貪吃寶可夢",
      "text": "牠們喜歡把樹果跟堅果塞滿牠們的頰囊，如果頰囊沒塞東西的話就會感到不安。如果你餵食了其中一隻，牠們就會跟著你並呼叫同伴好讓你也餵食牠們全部。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 0,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [
      "頰囊"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Normal", "name": "大快朵頤" },
      { "rank": 2, "type": "Normal", "name": "蓄力" },
      { "rank": 2, "type": "Normal", "name": "吞下" },
      { "rank": 2, "type": "Normal", "name": "噴出" },
      { "rank": 2, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 2, "type": "Psychic", "name": "睡覺" },
      { "rank": 2, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 2, "type": "Grass", "name": "種子機關槍" },
      { "rank": 3, "type": "Normal", "name": "憤怒門牙" },
      { "rank": 3, "type": "Poison", "name": "打嗝" },
      { "rank": 4, "type": "Normal", "name": "變圓" },
      { "rank": 4, "type": "Rock", "name": "滾動" },
      { "rank": 4, "type": "Dark", "name": "咬碎" }
    ],
    "isNovice": true
  },
  {
    "id": "820",
    "region": "galar",
    "name": "藏飽栗鼠",
    "alias": "Greedent",
    "type": [
      "Normal"
    ],
    "info": {
      "image": "images/pokedex/820.png",
      "height": "0.6",
      "weight": "6",
      "category": "貪慾寶可夢",
      "text": "牠們有點遲鈍，因為牠們腦中只想著吃。藏飽栗鼠會在尾巴裡囤積樹果，但許多樹果會從中掉落，並在隔年長成新的果樹。牠們的大牙相當強力。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "頰囊",
      "貪吃鬼"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "渴望" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Normal", "name": "大快朵頤" },
      { "rank": 2, "type": "Normal", "name": "蓄力" },
      { "rank": 2, "type": "Normal", "name": "吞下" },
      { "rank": 2, "type": "Normal", "name": "噴出" },
      { "rank": 2, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 3, "type": "Psychic", "name": "睡覺" },
      { "rank": 3, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 3, "type": "Grass", "name": "種子機關槍" },
      { "rank": 3, "type": "Normal", "name": "憤怒門牙" },
      { "rank": 3, "type": "Poison", "name": "打嗝" },
      { "rank": 4, "type": "Normal", "name": "珍藏" },
      { "rank": 4, "type": "Normal", "name": "腹鼓" },
      { "rank": 4, "type": "Dark", "name": "咬碎" }
    ]
  },
  {
    "id": "821",
    "region": "galar",
    "name": "稚山雀",
    "alias": "Rookidee",
    "type": [
      "Flying"
    ],
    "info": {
      "image": "images/pokedex/821.png",
      "height": "0.2",
      "weight": "1.8",
      "category": "小鳥寶可夢",
      "text": "勇敢好鬥的小東西，稚山雀以會勇於對體型比自己巨大的對手發起挑戰而知名，且就算牠們被打敗，牠們也不會放棄，並會在之後再試一次。牠們會利用自己的嬌小體型來取得優勢。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [
      "銳利目光",
      "緊張感"
    ],
    "moves": [
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Dark", "name": "囂張" },
      { "rank": 1, "type": "Dark", "name": "磨爪" },
      { "rank": 2, "type": "Normal", "name": "亂擊" },
      { "rank": 2, "type": "Flying", "name": "啄食" },
      { "rank": 2, "type": "Dark", "name": "挑釁" },
      { "rank": 2, "type": "Normal", "name": "鬼面" },
      { "rank": 3, "type": "Flying", "name": "啄鑽" },
      { "rank": 3, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 3, "type": "Flying", "name": "勇鳥猛攻" },
      { "rank": 4, "type": "Ghost", "name": "怨恨" },
      { "rank": 4, "type": "Flying", "name": "清除濃霧" },
      { "rank": 4, "type": "Ground", "name": "潑沙" }
    ],
    "isNovice": true
  },
  {
    "id": "822",
    "region": "galar",
    "name": "藍鴉",
    "alias": "Corvisquire",
    "type": [
      "Flying"
    ],
    "info": {
      "image": "images/pokedex/822.png",
      "height": "0.8",
      "weight": "16.0",
      "category": "烏鴉寶可夢",
      "text": "牠們頭腦聰明，懂得在戰鬥中使用工具。曾有人目擊這些寶可夢撿起石頭投向敵人、或用繩子將敵人捆住。牠們懂得謹慎地選擇戰鬥，且不會輕言撤退。"
    },
    "evolution": {
      "stage": "second",
      "time": "medium"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "銳利目光",
      "緊張感"
    ],
    "moves": [
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Dark", "name": "囂張" },
      { "rank": 1, "type": "Dark", "name": "磨爪" },
      { "rank": 2, "type": "Normal", "name": "亂擊" },
      { "rank": 2, "type": "Flying", "name": "啄食" },
      { "rank": 2, "type": "Dark", "name": "挑釁" },
      { "rank": 2, "type": "Normal", "name": "鬼面" },
      { "rank": 3, "type": "Flying", "name": "啄鑽" },
      { "rank": 3, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 3, "type": "Flying", "name": "勇鳥猛攻" },
      { "rank": 4, "type": "Flying", "name": "羽棲" },
      { "rank": 4, "type": "Flying", "name": "順風" },
      { "rank": 4, "type": "Fight", "name": "碎岩" }
    ]
  },
  {
    "id": "823",
    "region": "galar",
    "name": "鋼鎧鴉",
    "alias": "Corviknight",
    "type": [
      "Flying",
      "Steel"
    ],
    "info": {
      "image": "images/pokedex/823.png",
      "height": "2.2",
      "weight": "75.0",
      "category": "烏鴉寶可夢",
      "text": "靠著牠們優秀的飛行能力和極度聰明的頭腦，這些寶可夢在伽勒爾地區的空中所向無敵。當牠們飛行時，牠們會在地面投下巨大的影子，使敵友雙方都不禁畏懼三分。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 6,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "壓迫感",
      "鏡甲"
    ],
    "moves": [
      { "rank": 1, "type": "Flying", "name": "啄" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 2, "type": "Steel", "name": "鋼翼" },
      { "rank": 2, "type": "Steel", "name": "鐵壁" },
      { "rank": 2, "type": "Steel", "name": "金屬音" },
      { "rank": 2, "type": "Dark", "name": "囂張" },
      { "rank": 2, "type": "Dark", "name": "磨爪" },
      { "rank": 2, "type": "Normal", "name": "亂擊" },
      { "rank": 2, "type": "Flying", "name": "啄食" },
      { "rank": 3, "type": "Dark", "name": "挑釁" },
      { "rank": 3, "type": "Normal", "name": "鬼面" },
      { "rank": 3, "type": "Flying", "name": "啄鑽" },
      { "rank": 3, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 3, "type": "Flying", "name": "勇鳥猛攻" },
      { "rank": 4, "type": "Flying", "name": "羽棲" },
      { "rank": 4, "type": "Flying", "name": "神鳥猛擊" },
      { "rank": 4, "type": "Steel", "name": "鐵蹄光線" }
    ]
  },
  {
    "id": "824",
    "region": "galar",
    "name": "索偵蟲",
    "alias": "Blipbug",
    "type": [
      "Bug"
    ],
    "info": {
      "image": "images/pokedex/824.png",
      "height": "0.4",
      "weight": "8",
      "category": "幼蟲寶可夢",
      "text": "經常能在田地裡被發現，索偵蟲會透過長在身體上的毛來感應周圍發生的事。牠們頭腦相當地聰明且很好教，但力量方面就差了一些，也因此經常被其他寶可夢給欺負。"
    },
    "evolution": {
      "stage": "first",
      "time": "fast"
    },
    "baseHP": 3,
    "rank": 0,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "蟲之預感",
      "複眼"
    ],
    "moves": [
      { "rank": 0, "type": "Bug", "name": "蟲之抵抗" },
      { "rank": 4, "type": "Bug", "name": "黏黏網" },
      { "rank": 4, "type": "Normal", "name": "超音波" },
      { "rank": 4, "type": "Bug", "name": "死纏爛打" }
    ],
    "isNovice": true
  },
  {
    "id": "825",
    "region": "galar",
    "name": "天罩蟲",
    "alias": "Dottler",
    "type": [
      "Bug",
      "Psychic"
    ],
    "info": {
      "image": "images/pokedex/825.png",
      "height": "0.4",
      "weight": "19",
      "category": "天線罩寶可夢",
      "text": "牠在堅硬的殼裡成長著做好進化的準備。牠幾乎從來不動，且在這段期間完全不吃不喝，因此很多人會誤以為牠已經死亡，直到牠的超能力覺醒並開始與他人做精神感應溝通。"
    },
    "evolution": {
      "stage": "second",
      "time": "medium"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "蟲之預感",
      "複眼"
    ],
    "moves": [
      { "rank": 0, "type": "Bug", "name": "蟲之抵抗" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 2, "type": "Psychic", "name": "光牆" },
      { "rank": 2, "type": "Psychic", "name": "反射壁" },
      { "rank": 4, "type": "Bug", "name": "黏黏網" },
      { "rank": 4, "type": "Normal", "name": "超音波" },
      { "rank": 4, "type": "Bug", "name": "死纏爛打" }
    ]
  },
  {
    "id": "826",
    "region": "galar",
    "name": "以歐路普",
    "alias": "Orbeetle",
    "type": [
      "Bug",
      "Psychic"
    ],
    "info": {
      "image": "images/pokedex/826.png",
      "height": "0.4",
      "weight": "41",
      "category": "七星寶可夢",
      "text": "牠以頭腦聰慧以及大大的腦袋而聞名。牠有著出眾的精神力量。牠們會像漂浮的哨兵一樣在自己的領地上巡邏，用光線照射任何入侵者，即使他們在數英哩外的範圍也一樣。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 3, "max": 7 }
    },
    "ability": [
      "蟲之預感",
      "察覺"
    ],
    "moves": [
      { "rank": 0, "type": "Bug", "name": "蟲之抵抗" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 1, "type": "Psychic", "name": "光牆" },
      { "rank": 1, "type": "Psychic", "name": "反射壁" },
      { "rank": 2, "type": "Ghost", "name": "奇異之光" },
      { "rank": 2, "type": "Psychic", "name": "魔法反射" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 2, "type": "Psychic", "name": "催眠術" },
      { "rank": 2, "type": "Psychic", "name": "交換場地" },
      { "rank": 2, "type": "Bug", "name": "蟲鳴" },
      { "rank": 2, "type": "Psychic", "name": "鏡面反射" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Normal", "name": "您先請" },
      { "rank": 3, "type": "Psychic", "name": "冥想" },
      { "rank": 3, "type": "Psychic", "name": "精神場地" },
      { "rank": 4, "type": "Bug", "name": "死纏爛打" },
      { "rank": 4, "type": "Normal", "name": "自我再生" },
      { "rank": 4, "type": "Psychic", "name": "封印" }
    ]
  },
  {
    "id": "827",
    "region": "galar",
    "name": "偷兒狐",
    "alias": "Nickit",
    "type": [
      "Dark"
    ],
    "info": {
      "image": "images/pokedex/827.png",
      "height": "0.6",
      "weight": "9",
      "category": "狐狸寶可夢",
      "text": "性情謹慎且狡猾，偷兒狐靠偷盜食物為生。牠會用尾巴擦掉自己的足跡，這讓牠的行蹤非常難以追蹤。牠們活躍在城市中，並會在夜晚偷走商店的東西。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "逃跑",
      "輕裝"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "電光一閃" },
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Dark", "name": "圍攻" },
      { "rank": 1, "type": "Dark", "name": "磨爪" },
      { "rank": 2, "type": "Dark", "name": "大聲咆哮" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Dark", "name": "詭計" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Normal", "name": "掃尾拍打" },
      { "rank": 3, "type": "Dark", "name": "欺詐" },
      { "rank": 4, "type": "Fairy", "name": "嬉鬧" },
      { "rank": 4, "type": "Dark", "name": "拍落" },
      { "rank": 4, "type": "Dark", "name": "假哭" }
    ],
    "isNovice": true
  },
  {
    "id": "828",
    "region": "galar",
    "name": "狐大盜",
    "alias": "Thievul",
    "type": [
      "Dark"
    ],
    "info": {
      "image": "images/pokedex/828.png",
      "height": "1.2",
      "weight": "20",
      "category": "狐狸寶可夢",
      "text": "牠們因為長期以來對人類聚落帶來的麻煩而被逐電犬群給追獵。牠們是偷盜食物和寶可夢蛋的專家，永遠不會留下自己的蹤跡。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "逃跑",
      "輕裝"
    ],
    "moves": [
      { "rank": 1, "type": "Dark", "name": "小偷" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 1, "type": "Dark", "name": "磨爪" },
      { "rank": 2, "type": "Normal", "name": "搖尾巴" },
      { "rank": 2, "type": "Dark", "name": "圍攻" },
      { "rank": 2, "type": "Dark", "name": "大聲咆哮" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Dark", "name": "詭計" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Normal", "name": "掃尾拍打" },
      { "rank": 3, "type": "Dark", "name": "欺詐" },
      { "rank": 3, "type": "Dark", "name": "拋下狠話" },
      { "rank": 4, "type": "Fight", "name": "快速防守" },
      { "rank": 4, "type": "Dark", "name": "惡之波動" },
      { "rank": 4, "type": "Flying", "name": "雜耍" }
    ]
  },
  {
    "id": "829",
    "region": "galar",
    "name": "幼棉棉",
    "alias": "Gossifleur",
    "type": [
      "Grass"
    ],
    "info": {
      "image": "images/pokedex/829.png",
      "height": "0.4",
      "weight": "2.2",
      "category": "花飾寶可夢",
      "text": "你能在野外發現牠們沐浴在陽光下，隨著微風一邊轉圈圈一邊愉快地歌唱。牠們的花朵將在這之後成長綻放。這討人喜歡的表現讓牠在訓練家之中相當受歡迎。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 1, "max": 2 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "棉絮", "再生力"
    ],
    "moves": [
      { "rank": 0, "type": "Grass", "name": "樹葉" },
      { "rank": 0, "type": "Normal", "name": "唱歌" },
      { "rank": 1, "type": "Normal", "name": "高速旋轉" },
      { "rank": 1, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 2, "type": "Normal", "name": "輪唱" },
      { "rank": 2, "type": "Grass", "name": "青草攪拌器" },
      { "rank": 2, "type": "Grass", "name": "光合作用" },
      { "rank": 3, "type": "Normal", "name": "巨聲" },
      { "rank": 3, "type": "Grass", "name": "芳香治療" },
      { "rank": 3, "type": "Grass", "name": "飛葉風暴" },
      { "rank": 4, "type": "Normal", "name": "生長" },
      { "rank": 4, "type": "Grass", "name": "寄生種子" },
      { "rank": 4, "type": "Poison", "name": "毒粉" }
    ],
    "isNovice": true
  },
  {
    "id": "830",
    "region": "galar",
    "name": "白蓬蓬",
    "alias": "Eldegoss",
    "type": [
      "Grass"
    ],
    "info": {
      "image": "images/pokedex/830.png",
      "height": "0.5",
      "weight": "2.5",
      "category": "棉飾寶可夢",
      "text": "牠產生的棉絮有著相當動人的光澤，因此用其製成的服裝都貴的嚇人。在自然界中，牠們是溫和且無私的寶可夢，願意讓其他人從牠們頭上的棉絮種子中獲取營養。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 3, "max": 7 }
    },
    "ability": [
      "棉絮", "再生力"
    ],
    "moves": [
      { "rank": 0, "type": "Grass", "name": "樹葉" },
      { "rank": 1, "type": "Grass", "name": "棉孢子" },
      { "rank": 1, "type": "Normal", "name": "唱歌" },
      { "rank": 1, "type": "Normal", "name": "高速旋轉" },
      { "rank": 2, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 2, "type": "Normal", "name": "輪唱" },
      { "rank": 3, "type": "Grass", "name": "青草攪拌器" },
      { "rank": 3, "type": "Grass", "name": "光合作用" },
      { "rank": 3, "type": "Normal", "name": "巨聲" },
      { "rank": 3, "type": "Grass", "name": "芳香治療" },
      { "rank": 3, "type": "Grass", "name": "飛葉風暴" },
      { "rank": 3, "type": "Grass", "name": "棉花防守" },
      { "rank": 4, "type": "Grass", "name": "青草場地" },
      { "rank": 4, "type": "Fairy", "name": "撒嬌" },
      { "rank": 4, "type": "Grass", "name": "寄生種子" }
    ]
  },
  {
    "id": "831",
    "region": "galar",
    "name": "毛辮羊",
    "alias": "Wooloo",
    "type": [
      "Normal"
    ],
    "info": {
      "image": "images/pokedex/831.png",
      "height": "0.6",
      "weight": "6",
      "category": "綿羊寶可夢",
      "text": "毛辮羊的體毛彈性十足，就算從懸崖上掉下去也可以做為緩衝墊讓自己不會受傷。牠們必須定期剃毛，不然牠們會因為毛長太重而不能動彈。用這些羊毛織成的毛衣結實到能夠陪伴你一輩子。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "毛茸茸",
      "逃跑"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Normal", "name": "變圓" },
      { "rank": 1, "type": "Normal", "name": "仿效" },
      { "rank": 2, "type": "Psychic", "name": "防守平分" },
      { "rank": 2, "type": "Fight", "name": "二連踢" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 3, "type": "Psychic", "name": "防守互換" },
      { "rank": 3, "type": "Fight", "name": "起死回生" },
      { "rank": 3, "type": "Grass", "name": "棉花防守" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 4, "type": "Normal", "name": "替身" },
      { "rank": 4, "type": "Psychic", "name": "睡覺" },
      { "rank": 4, "type": "Normal", "name": "夢話" }
    ],
    "isNovice": true
  },
  {
    "id": "832",
    "region": "galar",
    "name": "毛毛角羊",
    "alias": "Dubwool",
    "type": [
      "Normal"
    ],
    "info": {
      "image": "images/pokedex/832.png",
      "height": "1.3",
      "weight": "45",
      "category": "綿羊寶可夢",
      "text": "謙遜而溫和，牠們的羊毛就像是彈簧墊一樣。在很久以前曾有國王下令用100隻毛毛角羊的體毛織成一張地毯，而當其完工，那些站上地毯的人都會在那瞬間被蹦彈出去。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "防彈",
      "不屈之心"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Normal", "name": "變圓" },
      { "rank": 2, "type": "Normal", "name": "仿效" },
      { "rank": 2, "type": "Psychic", "name": "防守平分" },
      { "rank": 2, "type": "Fight", "name": "二連踢" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 3, "type": "Psychic", "name": "防守互換" },
      { "rank": 3, "type": "Fight", "name": "起死回生" },
      { "rank": 3, "type": "Grass", "name": "棉花防守" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Normal", "name": "珍藏" },
      { "rank": 4, "type": "Flying", "name": "彈跳" },
      { "rank": 4, "type": "Psychic", "name": "高速移動" },
      { "rank": 4, "type": "Normal", "name": "守住" }
    ]
  },
  {
    "id": "833",
    "region": "galar",
    "name": "咬咬龜",
    "alias": "Chewtle",
    "type": [
      "Water"
    ],
    "info": {
      "image": "images/pokedex/833.png",
      "height": "0.3",
      "weight": "8.5",
      "category": "咬住寶可夢",
      "text": "牠用牠頭上的角做為主要武器，但什麼都咬的特性卻更為知名。很顯然這是因為牠的牙齦在長門牙的關係會癢的緣故，且只有咬東西能夠緩解。儘管牠個性有些古怪，但相對無害。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [
      "強壯之顎",
      "硬殼盔甲"
    ],
    "moves": [
      { "rank": 0, "type": "Water", "name": "水槍" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "守住" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Dark", "name": "緊咬不放" },
      { "rank": 2, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 3, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 3, "type": "Water", "name": "水流裂破" },
      { "rank": 4, "type": "Dragon", "name": "龍尾" },
      { "rank": 4, "type": "Poison", "name": "胃液" },
      { "rank": 4, "type": "Ice", "name": "冰凍牙" }
    ],
    "isNovice": true
  },
  {
    "id": "834",
    "region": "galar",
    "name": "暴噬龜",
    "alias": "Drednaw",
    "type": [
      "Water",
      "Rock"
    ],
    "info": {
      "image": "images/pokedex/834.png",
      "height": "1",
      "weight": "115",
      "category": "緊咬寶可夢",
      "text": "牠會待在河川或湖泊附近一動也不動，將自己偽裝成岩石，直到大口咬住毫無戒心的獵物。由於牠固執到不可思議的性情，一旦東西被牠銳利的牙齒給咬住，就再也拿不回來了。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "強壯之顎",
      "硬殼盔甲"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Water", "name": "貝殼刃" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "守住" },
      { "rank": 2, "type": "Rock", "name": "岩石打磨" },
      { "rank": 2, "type": "Rock", "name": "岩石封鎖" },
      { "rank": 2, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 3, "type": "Rock", "name": "雙刃頭錘" },
      { "rank": 3, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 3, "type": "Water", "name": "水流裂破" },
      { "rank": 3, "type": "Dark", "name": "緊咬不放" },
      { "rank": 4, "type": "Normal", "name": "火箭頭錘" },
      { "rank": 4, "type": "Dragon", "name": "龍尾" },
      { "rank": 4, "type": "Water", "name": "潛水" }
    ]
  },
  {
    "id": "835",
    "region": "galar",
    "name": "來電汪",
    "alias": "Yamper|ワンパチ",
    "type": [
      "Electric"
    ],
    "info": {
      "image": "images/pokedex/835.png",
      "height": "0.3",
      "weight": "13.5",
      "category": "小狗寶可夢",
      "text": "牠的活力和大大的笑容讓這隻寶可夢成為了相當受歡迎的牧羊犬。牠在奔跑的時候會從尾巴的根部製造出電能。牠熱愛接球，且如果你餵給牠一些零食的話牠就會愛你一輩子。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "撿球"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Electric", "name": "蹭蹭臉頰" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Normal", "name": "吼叫" },
      { "rank": 2, "type": "Electric", "name": "電光" },
      { "rank": 2, "type": "Fairy", "name": "撒嬌" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 2, "type": "Electric", "name": "充電" },
      { "rank": 3, "type": "Electric", "name": "瘋狂伏特" },
      { "rank": 3, "type": "Fairy", "name": "嬉鬧" },
      { "rank": 4, "type": "Ground", "name": "潑沙" },
      { "rank": 4, "type": "Fire", "name": "蓄能焰襲" },
      { "rank": 4, "type": "Normal", "name": "長嚎" }
    ],
    "isNovice": true
  },
  {
    "id": "836",
    "region": "galar",
    "name": "逐電犬",
    "alias": "Boltund",
    "type": [
      "Electric"
    ],
    "info": {
      "image": "images/pokedex/836.png",
      "height": "1",
      "weight": "34",
      "category": "狗寶可夢",
      "text": "牠會將電能傳送到腳上來提升自己的速度，時速能夠輕易超過９０公里。如果你每天不帶牠們出去奔跑，牠們就會累積壓力並變得有破壞性，除卻這一點，牠們是相當隨和好親近的寶可夢。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 7 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "強壯之顎", "好勝"
    ],
    "moves": [
      { "rank": 0, "type": "Electric", "name": "輸電" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Electric", "name": "蹭蹭臉頰" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Normal", "name": "吼叫" },
      { "rank": 2, "type": "Electric", "name": "電光" },
      { "rank": 2, "type": "Fairy", "name": "撒嬌" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 3, "type": "Electric", "name": "充電" },
      { "rank": 3, "type": "Electric", "name": "瘋狂伏特" },
      { "rank": 3, "type": "Fairy", "name": "嬉鬧" },
      { "rank": 4, "type": "Electric", "name": "電氣場地" },
      { "rank": 4, "type": "Psychic", "name": "精神之牙" },
      { "rank": 4, "type": "Ground", "name": "挖洞" },
      { "rank": 4, "type": "Electric", "name": "雷電牙" }
    ]
  },
  {
    "id": "837",
    "region": "galar",
    "name": "小炭仔",
    "alias": "Rolycoly",
    "type": [
      "Rock"
    ],
    "info": {
      "image": "images/pokedex/837.png",
      "height": "0.3",
      "weight": "12",
      "category": "煤炭寶可夢",
      "text": "這隻寶可夢在煤礦坑中被人們發現。牠看起來就像是一團煤炭，只不過牠會像獨輪車那樣移動。牠在憤怒的時候會發出熾熱的光芒，而當牠高興的時候則會發出柔和的噼啪聲，並維持穩定的溫暖。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "蒸汽機",
      "耐熱"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "煙幕" },
      { "rank": 1, "type": "Normal", "name": "高速旋轉" },
      { "rank": 1, "type": "Rock", "name": "擊落" },
      { "rank": 2, "type": "Rock", "name": "岩石打磨" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 2, "type": "Fire", "name": "燒盡" },
      { "rank": 3, "type": "Rock", "name": "隱形岩" },
      { "rank": 3, "type": "Fire", "name": "高溫重壓" },
      { "rank": 3, "type": "Rock", "name": "岩石爆擊" },
      { "rank": 4, "type": "Normal", "name": "挺住" },
      { "rank": 4, "type": "Ground", "name": "撒菱" },
      { "rank": 4, "type": "Normal", "name": "替身" }
    ],
    "isNovice": true
  },
  {
    "id": "838",
    "region": "galar",
    "name": "大炭車",
    "alias": "Carkol",
    "type": [
      "Rock",
      "Fire"
    ],
    "info": {
      "image": "images/pokedex/838.png",
      "height": "1.1",
      "weight": "78",
      "category": "煤炭寶可夢",
      "text": "牠能旋轉自己的腳，讓牠的重量製造出能讓牠在洞穴和隧道中高速移動的軌跡。在過去，人們會使用大炭車的煤炭當作燃料，因為這些煤炭的火焰可以維持很長的時間。"
    },
    "evolution": {
      "stage": "second",
      "time": "medium"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "蒸汽機",
      "火焰之軀"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "煙幕" },
      { "rank": 1, "type": "Fire", "name": "蓄能焰襲" },
      { "rank": 1, "type": "Normal", "name": "高速旋轉" },
      { "rank": 2, "type": "Rock", "name": "擊落" },
      { "rank": 2, "type": "Rock", "name": "岩石打磨" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 2, "type": "Fire", "name": "燒盡" },
      { "rank": 2, "type": "Rock", "name": "隱形岩" },
      { "rank": 3, "type": "Fire", "name": "高溫重壓" },
      { "rank": 3, "type": "Rock", "name": "岩石爆擊" },
      { "rank": 3, "type": "Fire", "name": "燃盡" },
      { "rank": 4, "type": "Ground", "name": "十萬馬力" },
      { "rank": 4, "type": "Water", "name": "熱水" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ]
  },
  {
    "id": "839",
    "region": "galar",
    "name": "巨炭山",
    "alias": "Coalossal",
    "type": [
      "Rock",
      "Fire"
    ],
    "info": {
      "image": "images/pokedex/839.png",
      "height": "2.8",
      "weight": "310",
      "category": "煤炭寶可夢",
      "text": "牠們平時性情溫和，如果牠們認為你是好人，那牠們就會跟你分享溫暖。但如果你激怒牠們，你就會面對被燒成灰燼的危險。牠們噴出的瀝青狀物質相當容易燃燒。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 6,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 7 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "蒸汽機",
      "引火"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "煙幕" },
      { "rank": 1, "type": "Fire", "name": "蓄能焰襲" },
      { "rank": 2, "type": "Rock", "name": "瀝青射擊" },
      { "rank": 2, "type": "Normal", "name": "高速旋轉" },
      { "rank": 2, "type": "Rock", "name": "擊落" },
      { "rank": 2, "type": "Rock", "name": "岩石打磨" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 3, "type": "Fire", "name": "燒盡" },
      { "rank": 3, "type": "Rock", "name": "隱形岩" },
      { "rank": 3, "type": "Fire", "name": "高溫重壓" },
      { "rank": 3, "type": "Rock", "name": "岩石爆擊" },
      { "rank": 3, "type": "Fire", "name": "燃盡" },
      { "rank": 4, "type": "Fire", "name": "過熱" },
      { "rank": 4, "type": "Ground", "name": "重踏" },
      { "rank": 4, "type": "Steel", "name": "重磅衝撞" }
    ]
  },
  {
    "id": "840",
    "region": "galar",
    "name": "啃果蟲",
    "alias": "Applin",
    "type": [
      "Grass",
      "Dragon"
    ],
    "info": {
      "image": "images/pokedex/840.png",
      "height": "0.2",
      "weight": "0.5",
      "category": "蘋果居寶可夢",
      "text": "這隻小小的蜥蜴寶可夢一出生的時候，牠就會鑽進蘋果來保護自己來躲避鳥類和其他天敵。這顆蘋果同時也是牠的食物來源，且蘋果的味道會決定牠的進化方向。"
    },
    "evolution": {
      "stage": "first",
      "with": "蘋果"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "熟成",
      "貪吃鬼"
    ],
    "moves": [
      { "rank": 0, "type": "Water", "name": "縮入殼中" },
      { "rank": 0, "type": "Ghost", "name": "驚嚇" },
      { "rank": 4, "type": "Normal", "name": "變圓" },
      { "rank": 4, "type": "Rock", "name": "滾動" },
      { "rank": 4, "type": "Normal", "name": "回收利用" }
    ],
    "isNovice": true
  },
  {
    "id": "841",
    "region": "galar",
    "name": "蘋裹龍",
    "alias": "Flapple",
    "type": [
      "Grass",
      "Dragon"
    ],
    "info": {
      "image": "images/pokedex/841.png",
      "height": "0.3",
      "weight": "1",
      "category": "蘋果翅寶可夢",
      "text": "牠在酸蘋果中成長，並因此能夠吐出足以造成灼傷的強酸性液體。牠能用切開的蘋果皮的翅膀飛翔、或用來偽裝成發臭的蘋果。他們生性孤僻，因為很少人會喜歡牠們的長相和味道。"
    },
    "evolution": {
      "stage": "final",
      "by": "酸酸蘋果"
    },
    "baseHP": 4,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "熟成",
      "活力"
    ],
    "moves": [
      { "rank": 0, "type": "Water", "name": "縮入殼中" },
      { "rank": 1, "type": "Ghost", "name": "驚嚇" },
      { "rank": 1, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 1, "type": "Normal", "name": "回收利用" },
      { "rank": 2, "type": "Normal", "name": "生長" },
      { "rank": 2, "type": "Dragon", "name": "龍捲風" },
      { "rank": 2, "type": "Poison", "name": "酸液炸彈" },
      { "rank": 2, "type": "Flying", "name": "雜耍" },
      { "rank": 2, "type": "Grass", "name": "寄生種子" },
      { "rank": 2, "type": "Normal", "name": "守住" },
      { "rank": 2, "type": "Dragon", "name": "龍息" },
      { "rank": 3, "type": "Dragon", "name": "龍之舞" },
      { "rank": 3, "type": "Dragon", "name": "龍之波動" },
      { "rank": 3, "type": "Grass", "name": "萬有引力" },
      { "rank": 3, "type": "Steel", "name": "鐵壁" },
      { "rank": 3, "type": "Flying", "name": "飛翔" },
      { "rank": 3, "type": "Dragon", "name": "龍之俯衝" },
      { "rank": 4, "type": "Dark", "name": "突襲" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Dragon", "name": "流星群" }
    ]
  },
  {
    "id": "842",
    "region": "galar",
    "name": "豐蜜龍",
    "alias": "Appletun",
    "type": [
      "Grass",
      "Dragon"
    ],
    "info": {
      "image": "images/pokedex/842.png",
      "height": "0.4",
      "weight": "13",
      "category": "蘋果汁寶可夢",
      "text": "吃了甜蘋果會使牠進化成這個樣子。牠會從體內發出甜甜的香味，引誘牠狩獵的蟲寶可夢上鉤，但這也會吸引其他想吃掉牠背部皮的寶可夢。"
    },
    "evolution": {
      "stage": "final",
      "by": "甜甜蘋果"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "熟成",
      "厚脂肪"
    ],
    "moves": [
      { "rank": 0, "type": "Water", "name": "縮入殼中" },
      { "rank": 1, "type": "Ghost", "name": "驚嚇" },
      { "rank": 1, "type": "Normal", "name": "頭鎚" },
      { "rank": 1, "type": "Normal", "name": "回收利用" },
      { "rank": 2, "type": "Normal", "name": "生長" },
      { "rank": 2, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 2, "type": "Ghost", "name": "詛咒" },
      { "rank": 2, "type": "Normal", "name": "踩踏" },
      { "rank": 2, "type": "Grass", "name": "寄生種子" },
      { "rank": 2, "type": "Normal", "name": "守住" },
      { "rank": 2, "type": "Grass", "name": "種子機關槍" },
      { "rank": 3, "type": "Normal", "name": "自我再生" },
      { "rank": 3, "type": "Grass", "name": "蘋果酸" },
      { "rank": 3, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 3, "type": "Steel", "name": "鐵壁" },
      { "rank": 3, "type": "Dragon", "name": "龍之波動" },
      { "rank": 3, "type": "Grass", "name": "能量球" },
      { "rank": 4, "type": "Grass", "name": "終極吸取" },
      { "rank": 4, "type": "Grass", "name": "日光束" },
      { "rank": 4, "type": "Dragon", "name": "流星群" }
    ]
  },
  {
    "id": "843",
    "region": "galar",
    "name": "沙包蛇",
    "alias": "Silicobra",
    "type": [
      "Ground"
    ],
    "info": {
      "image": "images/pokedex/843.png",
      "height": "2.2",
      "weight": "8",
      "category": "沙蛇寶可夢",
      "text": "沙包蛇看起來相當兇猛，但牠們其實只不過是想要不被打擾。牠們會從鼻孔噴射出沙子，趁敵人看不清的時候躲進地底下藏身。"
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "吐沙",
      "蛻皮"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "緊束" },
      { "rank": 1, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Normal", "name": "變小" },
      { "rank": 2, "type": "Dark", "name": "狂舞揮打" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 2, "type": "Normal", "name": "大蛇瞪眼" },
      { "rank": 2, "type": "Ground", "name": "挖洞" },
      { "rank": 2, "type": "Rock", "name": "沙暴" },
      { "rank": 3, "type": "Normal", "name": "頭鎚" },
      { "rank": 3, "type": "Poison", "name": "盤蜷" },
      { "rank": 3, "type": "Ground", "name": "流沙地獄" },
      { "rank": 4, "type": "Ground", "name": "擲泥" },
      { "rank": 4, "type": "Poison", "name": "毒尾" },
      { "rank": 4, "type": "Normal", "name": "珍藏" }
    ],
    "isNovice": true
  },
  {
    "id": "844",
    "region": "galar",
    "name": "沙螺蟒",
    "alias": "Sandaconda",
    "type": [
      "Ground"
    ],
    "info": {
      "image": "images/pokedex/844.png",
      "height": "3.8",
      "weight": "65",
      "category": "沙蛇寶可夢",
      "text": "牠有著能夠容納最多200磅沙土的沙囊，牠盤繞自己身體的方式能讓牠更有效率地把沙子噴向敵人。如果沒有了沙子，牠就會變得懦弱且抑鬱。牠們不算友善，但並不是很有攻擊性。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 6,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 7 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "吐沙",
      "沙隱"
    ],
    "moves": [
      { "rank": 1, "type": "Normal", "name": "緊束" },
      { "rank": 1, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Normal", "name": "火箭頭錘" },
      { "rank": 2, "type": "Normal", "name": "變小" },
      { "rank": 2, "type": "Dark", "name": "狂舞揮打" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 3, "type": "Normal", "name": "大蛇瞪眼" },
      { "rank": 3, "type": "Ground", "name": "挖洞" },
      { "rank": 3, "type": "Rock", "name": "沙暴" },
      { "rank": 3, "type": "Normal", "name": "摔打" },
      { "rank": 3, "type": "Poison", "name": "盤蜷" },
      { "rank": 3, "type": "Ground", "name": "流沙地獄" },
      { "rank": 4, "type": "Flying", "name": "暴風" },
      { "rank": 4, "type": "Dragon", "name": "龍之俯衝" },
      { "rank": 4, "type": "Normal", "name": "終極衝擊" }
    ]
  },
  {
    "id": "845",
    "region": "galar",
    "name": "古月鳥",
    "alias": "Cramorant",
    "type": [
      "Flying",
      "Water"
    ],
    "info": {
      "image": "images/pokedex/845.png",
      "height": "0.8",
      "weight": "18",
      "category": "一口吞寶可夢",
      "text": "古月鳥會從附近的海岸和湖泊捕魚寶可夢來吃。牠們經常會嘗試一口吞下太大的獵物，結果卻卡在了喉嚨裡。牠們記性很差，且經常會忘記自己在幹嘛。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [
      "一口飛彈"
    ],
    "moves": [
      { "rank": 0, "type": "Poison", "name": "打嗝" },
      { "rank": 1, "type": "Flying", "name": "啄" },
      { "rank": 1, "type": "Normal", "name": "蓄力" },
      { "rank": 1, "type": "Normal", "name": "吞下" },
      { "rank": 2, "type": "Normal", "name": "噴出" },
      { "rank": 2, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "亂擊" },
      { "rank": 2, "type": "Flying", "name": "啄食" },
      { "rank": 3, "type": "Water", "name": "潛水" },
      { "rank": 3, "type": "Flying", "name": "啄鑽" },
      { "rank": 3, "type": "Psychic", "name": "瞬間失憶" },
      { "rank": 3, "type": "Normal", "name": "大鬧一番" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Flying", "name": "羽棲" },
      { "rank": 4, "type": "Water", "name": "水流環" },
      { "rank": 4, "type": "Flying", "name": "羽毛舞" }
    ]
  },
  {
    "id": "846",
    "region": "galar",
    "name": "刺梭魚",
    "alias": "Arrokuda",
    "type": [
      "Water"
    ],
    "info": {
      "image": "images/pokedex/846.png",
      "height": "0.5",
      "weight": "1",
      "category": "突擊寶可夢",
      "text": "牠們會推進自己向前，以超高速度狩獵牠們的獵物。吃飽了之後動作會變得極度遲緩，且很容易讓自己被吃掉。牠們以自己尖銳的下巴為傲。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [
      "悠游自如",
      "螺旋尾鰭"
    ],
    "moves": [
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 0, "type": "Water", "name": "水流噴射" },
      { "rank": 1, "type": "Normal", "name": "亂擊" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Water", "name": "潛水" },
      { "rank": 2, "type": "Normal", "name": "磨礪" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 3, "type": "Water", "name": "水流裂破" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 4, "type": "Normal", "name": "劈開" },
      { "rank": 4, "type": "Ground", "name": "直衝鑽" },
      { "rank": 4, "type": "Ice", "name": "冰凍牙" }
    ],
    "isNovice": true
  },
  {
    "id": "847",
    "region": "galar",
    "name": "戽斗尖梭",
    "alias": "Barraskewda",
    "type": [
      "Water"
    ],
    "info": {
      "image": "images/pokedex/847.png",
      "height": "1.3",
      "weight": "30",
      "category": "穿刺寶可夢",
      "text": "這隻寶可夢有著像長矛一樣尖銳、像鋼鐵般堅硬的下巴。據說戽斗尖梭的肉好吃得驚人。當牠們狩獵時，牠們會以超過１００節的高速貫穿獵物。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 3, "max": 7 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "悠游自如",
      "螺旋尾鰭"
    ],
    "moves": [
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 1, "type": "Water", "name": "水流噴射" },
      { "rank": 2, "type": "Normal", "name": "亂擊" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Water", "name": "潛水" },
      { "rank": 2, "type": "Normal", "name": "磨礪" },
      { "rank": 2, "type": "Dark", "name": "地獄突刺" },
      { "rank": 3, "type": "Dark", "name": "咬碎" },
      { "rank": 3, "type": "Water", "name": "水流裂破" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 4, "type": "Dark", "name": "暗襲要害" },
      { "rank": 4, "type": "Poison", "name": "毒擊" },
      { "rank": 4, "type": "Normal", "name": "終極衝擊" }
    ]
  },
  {
    "id": "848",
    "region": "galar",
    "name": "毒電嬰",
    "alias": "Toxel",
    "type": [
      "Electric",
      "Poison"
    ],
    "info": {
      "image": "images/pokedex/848.png",
      "height": "0.4",
      "weight": "11",
      "category": "嬰兒寶可夢",
      "text": "毒電嬰會從皮膚分泌出毒素，牠越接近進化，牠皮膚的顏色就會變得更亮。牠們需要大量的照護，但因為牠們的壞脾氣和沒禮貌，所以沒有多少人會願意接下這個任務。"
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 2,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [
      "膽怯",
      "靜電"
    ],
    "moves": [
      { "rank": 0, "type": "Electric", "name": "蹭蹭臉頰" },
      { "rank": 0, "type": "Normal", "name": "淚眼汪汪" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Normal", "name": "抓狂" },
      { "rank": 1, "type": "Poison", "name": "溶解液" },
      { "rank": 2, "type": "Poison", "name": "打嗝" },
      { "rank": 4, "type": "Normal", "name": "再來一次" },
      { "rank": 4, "type": "Psychic", "name": "睡覺" },
      { "rank": 4, "type": "Normal", "name": "輪唱" }
    ],
    "isNovice": true
  },
  {
    "id": "849",
    "region": "galar",
    "name": "顫弦蠑螈 (高調)",
    "alias": "Toxtricity",
    "type": [
      "Electric",
      "Poison"
    ],
    "info": {
      "image": "images/pokedex/849.png",
      "height": "1.6",
      "weight": "40",
      "category": "龐克寶可夢",
      "text": "通常被稱作「高調型態」，牠的性格會決定牠的進化方向。如果毒電嬰是外向的性格，牠就會進化成脾氣暴躁的顫弦蠑螈。牠們會釋放出高音頻的聲音，並釋放出強大的電流來激怒他人。"
    },
    "evolution": {
      "stage": "final",
      "by": "外向的性格"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "龐克搖滾",
      "正電"
    ],
    "moves": [
      { "rank": 0, "type": "Electric", "name": "蹭蹭臉頰" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Electric", "name": "電光" },
      { "rank": 1, "type": "Electric", "name": "怪異電波" },
      { "rank": 2, "type": "Normal", "name": "抓狂" },
      { "rank": 2, "type": "Normal", "name": "淚眼汪汪" },
      { "rank": 2, "type": "Electric", "name": "電擊" },
      { "rank": 2, "type": "Poison", "name": "溶解液" },
      { "rank": 2, "type": "Normal", "name": "瞪眼" },
      { "rank": 2, "type": "Poison", "name": "酸液炸彈" },
      { "rank": 2, "type": "Electric", "name": "充電" },
      { "rank": 2, "type": "Normal", "name": "戰吼" },
      { "rank": 2, "type": "Normal", "name": "鬼面" },
      { "rank": 2, "type": "Electric", "name": "電擊波" },
      { "rank": 2, "type": "Poison", "name": "毒液衝擊" },
      { "rank": 2, "type": "Dark", "name": "挑釁" },
      { "rank": 3, "type": "Poison", "name": "打嗝" },
      { "rank": 3, "type": "Normal", "name": "刺耳聲" },
      { "rank": 3, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 3, "type": "Poison", "name": "劇毒" },
      { "rank": 3, "type": "Electric", "name": "放電" },
      { "rank": 3, "type": "Poison", "name": "毒擊" },
      { "rank": 3, "type": "Electric", "name": "破音" },
      { "rank": 3, "type": "Normal", "name": "爆音波" },
      { "rank": 3, "type": "Steel", "name": "換檔" },
      { "rank": 4, "type": "Fight", "name": "增強拳" },
      { "rank": 4, "type": "Steel", "name": "金屬音" },
      { "rank": 4, "type": "Normal", "name": "輪唱" }
    ]
  },
  {
    "id": "849-low",
    "region": "galar",
    "name": "顫弦蠑螈 (低調)",
    "alias": "Toxtricity",
    "type": [
      "Electric",
      "Poison"
    ],
    "info": {
      "image": "images/pokedex/849-low.png",
      "height": "1.6",
      "weight": "40",
      "category": "龐克寶可夢",
      "text": "通常被稱作「低調型態」，牠的性格會決定牠的進化方向。如果毒電嬰是內向的性格，牠就會進化成個性冷淡的顫弦蠑螈。牠們會釋放出低音頻的聲音，並會看不起那些嘗試激怒牠的人們。"
    },
    "evolution": {
      "stage": "final",
      "by": "內向的性格"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "龐克搖滾",
      "負電"
    ],
    "moves": [
      { "rank": 0, "type": "Electric", "name": "蹭蹭臉頰" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Electric", "name": "電光" },
      { "rank": 1, "type": "Electric", "name": "怪異電波" },
      { "rank": 2, "type": "Normal", "name": "抓狂" },
      { "rank": 2, "type": "Normal", "name": "淚眼汪汪" },
      { "rank": 2, "type": "Electric", "name": "電擊" },
      { "rank": 2, "type": "Poison", "name": "溶解液" },
      { "rank": 2, "type": "Normal", "name": "瞪眼" },
      { "rank": 2, "type": "Poison", "name": "酸液炸彈" },
      { "rank": 2, "type": "Electric", "name": "充電" },
      { "rank": 2, "type": "Normal", "name": "戰吼" },
      { "rank": 2, "type": "Normal", "name": "鬼面" },
      { "rank": 2, "type": "Electric", "name": "電擊波" },
      { "rank": 2, "type": "Poison", "name": "毒液衝擊" },
      { "rank": 2, "type": "Dark", "name": "挑釁" },
      { "rank": 3, "type": "Poison", "name": "打嗝" },
      { "rank": 3, "type": "Normal", "name": "刺耳聲" },
      { "rank": 3, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 3, "type": "Poison", "name": "劇毒" },
      { "rank": 3, "type": "Electric", "name": "放電" },
      { "rank": 3, "type": "Poison", "name": "毒擊" },
      { "rank": 3, "type": "Electric", "name": "破音" },
      { "rank": 3, "type": "Normal", "name": "爆音波" },
      { "rank": 3, "type": "Steel", "name": "換檔" },
      { "rank": 4, "type": "Fight", "name": "增強拳" },
      { "rank": 4, "type": "Steel", "name": "金屬音" },
      { "rank": 4, "type": "Normal", "name": "輪唱" }
    ]
  },
  {
    "id": "850",
    "region": "galar",
    "name": "燒火蚣",
    "alias": "Sizzlipede",
    "type": [
      "Fire",
      "Bug"
    ],
    "info": {
      "image": "images/pokedex/850.png",
      "height": "0.7",
      "weight": "1",
      "category": "發熱寶可夢",
      "text": "牠把可燃氣體儲存在體內來發熱。牠肚子上的黃色部分會變得非常熱。牠會用滾燙的身體勒緊獵物，然後一口口把獵物吃得一點也不剩。"
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "引火",
      "白色煙霧"
    ],
    "moves": [
      { "rank": 0, "type": "Fire", "name": "火花" },
      { "rank": 0, "type": "Normal", "name": "煙幕" },
      { "rank": 1, "type": "Normal", "name": "緊束" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Fire", "name": "火焰輪" },
      { "rank": 2, "type": "Bug", "name": "蟲咬" },
      { "rank": 2, "type": "Poison", "name": "盤蜷" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 2, "type": "Fire", "name": "火焰旋渦" },
      { "rank": 3, "type": "Dark", "name": "咬碎" },
      { "rank": 3, "type": "Fire", "name": "火焰鞭" },
      { "rank": 3, "type": "Bug", "name": "猛撲" },
      { "rank": 4, "type": "Fire", "name": "燃盡" },
      { "rank": 4, "type": "Dark", "name": "拍落" },
      { "rank": 4, "type": "Bug", "name": "蟲之抵抗" },
      { "rank": 4, "type": "Poison", "name": "毒液衝擊" }
    ],
    "isNovice": true
  },
  {
    "id": "851",
    "region": "galar",
    "name": "焚焰蚣",
    "alias": "Centiskorch",
    "type": [
      "Fire",
      "Bug"
    ],
    "info": {
      "image": "images/pokedex/851.png",
      "height": "0.7",
      "weight": "1",
      "category": "發熱寶可夢",
      "text": "牠會像鞭子那樣彎曲身體，然後把自己甩向敵人。儘管牠燒燙的身體已經相當危險，這極具攻擊性的寶可夢也具有銳利無比的大大獠牙。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "引火",
      "白色煙霧"
    ],
    "moves": [
      { "rank": 0, "type": "Fire", "name": "火花" },
      { "rank": 0, "type": "Normal", "name": "煙幕" },
      { "rank": 1, "type": "Normal", "name": "緊束" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Fire", "name": "火焰輪" },
      { "rank": 2, "type": "Bug", "name": "蟲咬" },
      { "rank": 2, "type": "Poison", "name": "盤蜷" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 2, "type": "Fire", "name": "火焰旋渦" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 3, "type": "Fire", "name": "火焰鞭" },
      { "rank": 3, "type": "Bug", "name": "猛撲" },
      { "rank": 3, "type": "Fire", "name": "燃盡" },
      { "rank": 4, "type": "Fire", "name": "火焰牙" },
      { "rank": 4, "type": "Water", "name": "熱水" },
      { "rank": 4, "type": "Electric", "name": "雷電牙" }
    ]
  },
  {
    "id": "852",
    "region": "galar",
    "name": "拳拳蛸",
    "alias": "Clobbopus",
    "type": [
      "Fight"
    ],
    "info": {
      "image": "images/pokedex/852.png",
      "height": "0.6",
      "weight": "4",
      "category": "纏人寶可夢",
      "text": "牠像兒童一樣，且擁有旺盛的好奇心，但牠調查東西的方式是試著用觸手打一打再說。儘管如此，這些觸手經常斷掉，但不用太擔心，因為它們在幾天內就會重新長回來。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "柔軟",
      "技術高手"
    ],
    "moves": [
      { "rank": 0, "type": "Fight", "name": "碎岩" },
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Normal", "name": "佯攻" },
      { "rank": 1, "type": "Normal", "name": "綁緊" },
      { "rank": 2, "type": "Fight", "name": "看穿" },
      { "rank": 2, "type": "Fight", "name": "劈瓦" },
      { "rank": 2, "type": "Fight", "name": "健美" },
      { "rank": 2, "type": "Fight", "name": "地獄翻滾" },
      { "rank": 2, "type": "Dark", "name": "挑釁" },
      { "rank": 3, "type": "Fight", "name": "起死回生" },
      { "rank": 3, "type": "Fight", "name": "蠻力" },
      { "rank": 4, "type": "Water", "name": "浸水" },
      { "rank": 4, "type": "Fight", "name": "巴投" },
      { "rank": 4, "type": "Fight", "name": "地球上投" }
    ],
    "isNovice": true
  },
  {
    "id": "853",
    "region": "galar",
    "name": "八爪武師",
    "alias": "Grapploct",
    "type": [
      "Fight"
    ],
    "info": {
      "image": "images/pokedex/853.png",
      "height": "1.6",
      "weight": "39",
      "category": "柔術寶可夢",
      "text": "全身都是肌肉的身體讓牠觸手的威力無與倫比。牠們會登上陸地尋找對手，一旦戰鬥結束後就會回到海裡。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "柔軟",
      "技術高手"
    ],
    "moves": [
      { "rank": 0, "type": "Fight", "name": "碎岩" },
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Normal", "name": "佯攻" },
      { "rank": 1, "type": "Normal", "name": "綁緊" },
      { "rank": 2, "type": "Fight", "name": "看穿" },
      { "rank": 2, "type": "Fight", "name": "劈瓦" },
      { "rank": 2, "type": "Fight", "name": "健美" },
      { "rank": 2, "type": "Fight", "name": "地獄翻滾" },
      { "rank": 2, "type": "Dark", "name": "挑釁" },
      { "rank": 2, "type": "Fight", "name": "蛸固" },
      { "rank": 2, "type": "Water", "name": "章魚桶炮" },
      { "rank": 3, "type": "Fight", "name": "起死回生" },
      { "rank": 3, "type": "Fight", "name": "蠻力" },
      { "rank": 3, "type": "Dark", "name": "顛倒" },
      { "rank": 4, "type": "Fight", "name": "近身戰" },
      { "rank": 4, "type": "Water", "name": "水流裂破" },
      { "rank": 4, "type": "Dark", "name": "狂舞揮打" }
    ]
  },
  {
    "id": "854",
    "region": "galar",
    "name": "來悲茶",
    "alias": "Sinistea",
    "type": [
      "Ghost"
    ],
    "info": {
      "image": "images/pokedex/854.png",
      "height": "0.1",
      "weight": "0.2",
      "category": "紅茶寶可夢",
      "text": "據說這隻寶可夢是因為孤單寂寞的靈魂住進了涼透的喝剩紅茶而誕生的。它會吸走飲用者的精氣，但大家都會因為牠太難喝而馬上把牠吐出來。"
    },
    "evolution": {
      "stage": "first",
      "with": "破裂的茶壺"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "碎裂鎧甲",
      "詛咒之軀"
    ],
    "moves": [
      { "rank": 0, "type": "Ghost", "name": "驚嚇" },
      { "rank": 0, "type": "Water", "name": "縮入殼中" },
      { "rank": 1, "type": "Fairy", "name": "芳香薄霧" },
      { "rank": 1, "type": "Grass", "name": "超級吸取" },
      { "rank": 2, "type": "Normal", "name": "守住" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 2, "type": "Grass", "name": "終極吸取" },
      { "rank": 2, "type": "Ghost", "name": "暗影球" },
      { "rank": 3, "type": "Dark", "name": "詭計" },
      { "rank": 3, "type": "Dark", "name": "臨別禮物" },
      { "rank": 3, "type": "Normal", "name": "破殼" },
      { "rank": 4, "type": "Normal", "name": "替身" },
      { "rank": 4, "type": "Dark", "name": "欺詐" },
      { "rank": 4, "type": "Psychic", "name": "戲法" }
    ],
    "isNovice": true
  },
  {
    "id": "855",
    "region": "galar",
    "name": "怖思壺",
    "alias": "Polteageist",
    "type": [
      "Ghost"
    ],
    "info": {
      "image": "images/pokedex/855.png",
      "height": "0.1",
      "weight": "0.2",
      "category": "紅茶寶可夢",
      "text": "這個物種住在古董茶壺裡。牠們很難找到真貨，因為現在大多數茶具都是贗品。永遠別把你的茶放著不管，否則怖思壺很有可能會來把自己倒進去。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 7 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [
      "碎裂鎧甲",
      "詛咒之軀"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "茶會" },
      { "rank": 0, "type": "Ghost", "name": "驚嚇" },
      { "rank": 0, "type": "Water", "name": "縮入殼中" },
      { "rank": 1, "type": "Fairy", "name": "芳香薄霧" },
      { "rank": 1, "type": "Grass", "name": "超級吸取" },
      { "rank": 2, "type": "Normal", "name": "守住" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 2, "type": "Grass", "name": "終極吸取" },
      { "rank": 2, "type": "Ghost", "name": "暗影球" },
      { "rank": 3, "type": "Dark", "name": "詭計" },
      { "rank": 3, "type": "Dark", "name": "臨別禮物" },
      { "rank": 3, "type": "Normal", "name": "破殼" },
      { "rank": 3, "type": "Grass", "name": "吸取力量" },
      { "rank": 4, "type": "Ghost", "name": "靈騷" },
      { "rank": 4, "type": "Psychic", "name": "輔助力量" },
      { "rank": 4, "type": "Normal", "name": "自爆" }
    ]
  },
  {
    "id": "856",
    "region": "galar",
    "name": "迷布莉姆",
    "alias": "Hatenna",
    "type": [
      "Psychic"
    ],
    "info": {
      "image": "images/pokedex/856.png",
      "height": "0.4",
      "weight": "3.4",
      "category": "寧靜寶可夢",
      "text": "透過頭部的突起物來感應生物的情感。如果你的性格不夠溫和，那牠就永遠不會對你敞開心扉。牠們在人多的地方會感到不知所措，更喜歡獨自躲起來。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "治癒之心",
      "危險預知"
    ],
    "moves": [
      { "rank": 0, "type": "Psychic", "name": "念力" },
      { "rank": 0, "type": "Normal", "name": "和睦相處" },
      { "rank": 1, "type": "Water", "name": "生命水滴" },
      { "rank": 1, "type": "Fairy", "name": "魅惑之聲" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 2, "type": "Psychic", "name": "治癒波動" },
      { "rank": 2, "type": "Fairy", "name": "魔法閃耀" },
      { "rank": 2, "type": "Psychic", "name": "冥想" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Psychic", "name": "治癒之願" },
      { "rank": 4, "type": "Electric", "name": "蹭蹭臉頰" },
      { "rank": 4, "type": "Normal", "name": "您先請" },
      { "rank": 4, "type": "Fairy", "name": "芳香薄霧" }
    ],
    "isNovice": true
  },
  {
    "id": "857",
    "region": "galar",
    "name": "提布莉姆",
    "alias": "Hattrem",
    "type": [
      "Psychic"
    ],
    "info": {
      "image": "images/pokedex/857.png",
      "height": "0.6",
      "weight": "4.8",
      "category": "肅靜寶可夢",
      "text": "牠也許看起來很友善，但他實際上相當孤僻。無論你是誰，只要你情緒激昂起來，牠就會使用頭上的辮子攻擊你，用粗暴的方式使你沉默。牠不喜歡人多的地方。"
    },
    "evolution": {
      "stage": "second",
      "time": "medium"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "治癒之心",
      "危險預知"
    ],
    "moves": [
      { "rank": 0, "type": "Psychic", "name": "念力" },
      { "rank": 0, "type": "Normal", "name": "和睦相處" },
      { "rank": 1, "type": "Water", "name": "生命水滴" },
      { "rank": 1, "type": "Fairy", "name": "魅惑之聲" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 2, "type": "Psychic", "name": "治癒波動" },
      { "rank": 2, "type": "Fairy", "name": "魔法閃耀" },
      { "rank": 2, "type": "Psychic", "name": "冥想" },
      { "rank": 2, "type": "Dark", "name": "狂舞揮打" },
      { "rank": 2, "type": "Psychic", "name": "治癒之願" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 4, "type": "Dark", "name": "延後" },
      { "rank": 4, "type": "Electric", "name": "蹭蹭臉頰" },
      { "rank": 4, "type": "Normal", "name": "挺住" }
    ]
  },
  {
    "id": "858",
    "region": "galar",
    "name": "布莉姆溫",
    "alias": "Hatterene",
    "type": [
      "Psychic",
      "Fairy"
    ],
    "info": {
      "image": "images/pokedex/858.png",
      "height": "2.1",
      "weight": "5.1",
      "category": "寂靜寶可夢",
      "text": "如果你在牠附近大吵大鬧，那麼你就是在冒著被牠用觸手上的爪子撕碎的風險。這隻寶可夢又被稱為森林魔女。牠對於他人的情緒相當敏感，如果牠感受到敵意、恐懼、或憤怒，那牠就會立即攻擊你。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 3, "max": 7 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [
      "治癒之心",
      "危險預知"
    ],
    "moves": [
      { "rank": 0, "type": "Psychic", "name": "念力" },
      { "rank": 0, "type": "Normal", "name": "和睦相處" },
      { "rank": 1, "type": "Water", "name": "生命水滴" },
      { "rank": 1, "type": "Fairy", "name": "魅惑之聲" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 2, "type": "Psychic", "name": "治癒波動" },
      { "rank": 2, "type": "Fairy", "name": "魔法閃耀" },
      { "rank": 2, "type": "Psychic", "name": "冥想" },
      { "rank": 3, "type": "Dark", "name": "狂舞揮打" },
      { "rank": 3, "type": "Psychic", "name": "精神利刃" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Psychic", "name": "治癒之願" },
      { "rank": 3, "type": "Psychic", "name": "魔法粉" },
      { "rank": 4, "type": "Dark", "name": "惡之波動" },
      { "rank": 4, "type": "Fire", "name": "魔法火焰" },
      { "rank": 4, "type": "Psychic", "name": "光牆" }
    ]
  },
  {
    "id": "110-G",
    "region": "galar",
    "name": "雙彈瓦斯 (伽勒爾的樣子)",
    "alias": "Weezing",
    "type": [
      "Poison",
      "Fairy"
    ],
    "info": {
      "image": "images/pokedex/110-G.png",
      "height": "3",
      "weight": "16",
      "category": "毒氣寶可夢",
      "text": "這隻寶可夢會吸收大氣中的污染成分，然後吐出新鮮的空氣。牠在伽勒爾的特殊型態最早是於過去工廠林立、空氣嚴重污染的時代被發現。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 3, "max": 7 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "飄浮",
      "化學變化氣體"
    ],
    "moves": [
      { "rank": 0, "type": "Poison", "name": "毒瓦斯" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Fairy", "name": "妖精之風" },
      { "rank": 1, "type": "Fairy", "name": "芳香薄霧" },
      { "rank": 1, "type": "Poison", "name": "清除之煙" },
      { "rank": 1, "type": "Poison", "name": "濁霧" },
      { "rank": 1, "type": "Normal", "name": "煙幕" },
      { "rank": 2, "type": "Ice", "name": "黑霧" },
      { "rank": 2, "type": "Flying", "name": "清除濃霧" },
      { "rank": 2, "type": "Normal", "name": "二連擊" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Poison", "name": "污泥攻擊" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 2, "type": "Normal", "name": "自爆" },
      { "rank": 2, "type": "Poison", "name": "污泥炸彈" },
      { "rank": 2, "type": "Poison", "name": "劇毒" },
      { "rank": 2, "type": "Poison", "name": "打嗝" },
      { "rank": 3, "type": "Normal", "name": "大爆炸" },
      { "rank": 3, "type": "Fairy", "name": "神奇蒸汽" },
      { "rank": 3, "type": "Ghost", "name": "同命" },
      { "rank": 3, "type": "Dark", "name": "臨別禮物" },
      { "rank": 3, "type": "Fairy", "name": "薄霧場地" },
      { "rank": 4, "type": "Fire", "name": "噴射火焰" },
      { "rank": 4, "type": "Normal", "name": "蓄力" },
      { "rank": 4, "type": "Normal", "name": "吞下" }
    ]
  },
  {
    "id": "859",
    "region": "galar",
    "name": "搗蛋小妖",
    "alias": "Impidimp",
    "type": [
      "Dark",
      "Fairy"
    ],
    "info": {
      "image": "images/pokedex/859.png",
      "height": "0.4",
      "weight": "5",
      "category": "捉弄寶可夢",
      "text": "牠們會透過鼻子吸收人類或寶可夢情緒糟糕時產生的負能量，並從中獲取活力。牠們喜歡拿走不屬於牠們的東西。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [
      "惡作劇之心",
      "察覺"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 0, "type": "Normal", "name": "密語" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Dark", "name": "吹捧" },
      { "rank": 2, "type": "Dark", "name": "假哭" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Dark", "name": "無理取鬧" },
      { "rank": 2, "type": "Dark", "name": "惡之波動" },
      { "rank": 3, "type": "Dark", "name": "詭計" },
      { "rank": 3, "type": "Fairy", "name": "嬉鬧" },
      { "rank": 3, "type": "Dark", "name": "欺詐" },
      { "rank": 4, "type": "Bug", "name": "吸血" },
      { "rank": 4, "type": "Dark", "name": "挑釁" },
      { "rank": 4, "type": "Psychic", "name": "戲法" }
    ],
    "isNovice": true
  },
  {
    "id": "860",
    "region": "galar",
    "name": "詐唬魔",
    "alias": "Morgrem",
    "type": [
      "Dark",
      "Fairy"
    ],
    "info": {
      "image": "images/pokedex/860.png",
      "height": "0.8",
      "weight": "12",
      "category": "壞心眼寶可夢",
      "text": "當牠下跪像是要乞求原諒的時候，牠其實是在誘騙對手好讓自己能用尖如長矛的頭髮刺向對手。牠會把人們引誘到深夜的森林中以搶劫他們並使他們迷路。"
    },
    "evolution": {
      "stage": "second",
      "time": "medium"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "惡作劇之心",
      "察覺"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 0, "type": "Normal", "name": "密語" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Dark", "name": "吹捧" },
      { "rank": 2, "type": "Dark", "name": "假哭" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Dark", "name": "無理取鬧" },
      { "rank": 2, "type": "Dark", "name": "假跪真撞" },
      { "rank": 2, "type": "Dark", "name": "惡之波動" },
      { "rank": 3, "type": "Dark", "name": "詭計" },
      { "rank": 3, "type": "Dark", "name": "欺詐" },
      { "rank": 3, "type": "Fairy", "name": "嬉鬧" },
      { "rank": 4, "type": "Bug", "name": "吸血" },
      { "rank": 4, "type": "Normal", "name": "揮指" },
      { "rank": 4, "type": "Psychic", "name": "戲法" }
    ]
  },
  {
    "id": "861",
    "region": "galar",
    "name": "長毛巨魔",
    "alias": "Grimmsnarl",
    "type": [
      "Dark",
      "Fairy"
    ],
    "info": {
      "image": "images/pokedex/861.png",
      "height": "1.5",
      "weight": "61",
      "category": "健美寶可夢",
      "text": "牠的毛髮能發揮肌肉纖維般的作用。當牠的毛髮伸展開來時會像觸手那樣把對手纏繞起來。牠們經常會把別人絆倒或倒吊好嘲笑他們。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "惡作劇之心",
      "察覺"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 0, "type": "Normal", "name": "密語" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Dark", "name": "吹捧" },
      { "rank": 2, "type": "Dark", "name": "假哭" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Dark", "name": "無理取鬧" },
      { "rank": 2, "type": "Dark", "name": "假跪真撞" },
      { "rank": 2, "type": "Dark", "name": "惡之波動" },
      { "rank": 2, "type": "Fairy", "name": "靈魂衝擊" },
      { "rank": 2, "type": "Fight", "name": "增強拳" },
      { "rank": 2, "type": "Fight", "name": "健美" },
      { "rank": 3, "type": "Dark", "name": "詭計" },
      { "rank": 3, "type": "Dark", "name": "欺詐" },
      { "rank": 3, "type": "Fairy", "name": "嬉鬧" },
      { "rank": 3, "type": "Fight", "name": "臂錘" },
      { "rank": 4, "type": "Fairy", "name": "吸取之吻" },
      { "rank": 4, "type": "Normal", "name": "守住" },
      { "rank": 4, "type": "Psychic", "name": "反射壁" }
    ]
  },
  {
    "id": "263-G",
    "region": "galar",
    "name": "蛇紋熊 (伽勒爾的樣子)",
    "alias": "Zigzagoon",
    "type": [
      "Dark",
      "Normal"
    ],
    "info": {
      "image": "images/pokedex/263-G.png",
      "height": "0.4",
      "weight": "17",
      "category": "豆狸寶可夢",
      "text": "在伽勒爾長大的蛇紋熊變得龐克起來。如果發現了其他的寶可夢，牠們就會故意撞上去挑起事端。唯一讓牠們冷靜下來的方式就是製造大量的噪音。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [
      "撿拾",
      "貪吃鬼"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Ghost", "name": "舌舔" },
      { "rank": 1, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Dark", "name": "大聲咆哮" },
      { "rank": 2, "type": "Fairy", "name": "圓瞳" },
      { "rank": 2, "type": "Bug", "name": "飛彈針" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 3, "type": "Normal", "name": "鬼面" },
      { "rank": 3, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 3, "type": "Dark", "name": "挑釁" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 4, "type": "Dark", "name": "拍落" },
      { "rank": 4, "type": "Dark", "name": "拋下狠話" },
      { "rank": 4, "type": "Fight", "name": "快速防守" }
    ],
    "isNovice": true
  },
  {
    "id": "264-G",
    "region": "galar",
    "name": "直衝熊 (伽勒爾的樣子)",
    "alias": "Linoone",
    "type": [
      "Dark",
      "Normal"
    ],
    "info": {
      "image": "images/pokedex/264-G.png",
      "height": "0.5",
      "weight": "32.5",
      "category": "猛衝寶可夢",
      "text": "牠會用長舌頭挑釁對手。一旦敵人被激怒，這隻寶可夢便會猛烈地衝撞上去。牠們很沒禮貌，喜歡四處胡鬧。"
    },
    "evolution": {
      "stage": "second",
      "time": "medium"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "撿拾",
      "貪吃鬼"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Ghost", "name": "舌舔" },
      { "rank": 1, "type": "Normal", "name": "猛撞" },
      { "rank": 1, "type": "Dark", "name": "挑釁" },
      { "rank": 2, "type": "Dark", "name": "大聲咆哮" },
      { "rank": 2, "type": "Fairy", "name": "圓瞳" },
      { "rank": 2, "type": "Bug", "name": "飛彈針" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Dark", "name": "掉包" },
      { "rank": 2, "type": "Normal", "name": "亂抓" },
      { "rank": 2, "type": "Dark", "name": "磨爪" },
      { "rank": 2, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Normal", "name": "鬼面" },
      { "rank": 3, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Psychic", "name": "睡覺" },
      { "rank": 4, "type": "Dark", "name": "以牙還牙" },
      { "rank": 4, "type": "Ground", "name": "跺腳" },
      { "rank": 4, "type": "Ghost", "name": "暗影爪" }
    ]
  },
  {
    "id": "862",
    "region": "galar",
    "name": "堵攔熊",
    "alias": "Obstagoon",
    "type": [
      "Dark",
      "Normal"
    ],
    "info": {
      "image": "images/pokedex/862.png",
      "height": "1.6",
      "weight": "46",
      "category": "停止寶可夢",
      "text": "牠的音量相當驚人，是隻吵鬧又粗魯的寶可夢。堵攔熊有著會對目標大叫，並擺出威嚇姿勢的傾向。牠們鮮少會認真看待事情。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "捨身",
      "毅力"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Ghost", "name": "舌舔" },
      { "rank": 1, "type": "Normal", "name": "猛撞" },
      { "rank": 1, "type": "Dark", "name": "挑釁" },
      { "rank": 2, "type": "Dark", "name": "大聲咆哮" },
      { "rank": 2, "type": "Fairy", "name": "圓瞳" },
      { "rank": 2, "type": "Bug", "name": "飛彈針" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Dark", "name": "掉包" },
      { "rank": 2, "type": "Normal", "name": "亂抓" },
      { "rank": 2, "type": "Dark", "name": "磨爪" },
      { "rank": 2, "type": "Dark", "name": "暗襲要害" },
      { "rank": 2, "type": "Fight", "name": "地獄翻滾" },
      { "rank": 2, "type": "Dark", "name": "攔堵" },
      { "rank": 3, "type": "Normal", "name": "鬼面" },
      { "rank": 3, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Psychic", "name": "睡覺" },
      { "rank": 3, "type": "Fight", "name": "十字劈" },
      { "rank": 4, "type": "Poison", "name": "垃圾射擊" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" },
      { "rank": 4, "type": "Normal", "name": "巨聲" }
    ]
  },
  {
    "id": "052-G",
    "region": "galar",
    "name": "喵喵 (伽勒爾的樣子)",
    "alias": "Meowth",
    "type": [
      "Steel"
    ],
    "info": {
      "image": "images/pokedex/052-G.png",
      "height": "0.4",
      "weight": "4",
      "category": "妖怪貓寶可夢",
      "text": "額頭上的硬幣已經生鏽。喵喵被帶上了維京船在海上長途旅行，在這嚴酷的環境下生活了這個長的時間使牠變得更加勇猛，以至於牠身體的各個地方都變成了黑鐵。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [
      "撿拾",
      "硬爪"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Dark", "name": "磨爪" },
      { "rank": 1, "type": "Normal", "name": "聚寶功" },
      { "rank": 2, "type": "Steel", "name": "金屬爪" },
      { "rank": 2, "type": "Dark", "name": "挑釁" },
      { "rank": 2, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 2, "type": "Normal", "name": "亂抓" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 3, "type": "Normal", "name": "劈開" },
      { "rank": 3, "type": "Steel", "name": "金屬音" },
      { "rank": 3, "type": "Normal", "name": "大鬧一番" },
      { "rank": 4, "type": "Dark", "name": "暗襲要害" },
      { "rank": 4, "type": "Steel", "name": "鐵蹄光線" },
      { "rank": 4, "type": "Ghost", "name": "詛咒" }
    ],
    "isNovice": true
  },
  {
    "id": "863",
    "region": "galar",
    "name": "喵頭目",
    "alias": "Perrserker",
    "type": [
      "Steel"
    ],
    "info": {
      "image": "images/pokedex/863.png",
      "height": "0.8",
      "weight": "28",
      "category": "維京寶可夢",
      "text": "頭上像鐵頭盔一樣的東西其實是牠硬化後的體毛。與喵喵的其他進化型不同，喵頭目並不想要財富和奢華，而喜愛著戰鬥、戶外活動、以及海上旅行。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "戰鬥盔甲",
      "硬爪"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Dark", "name": "磨爪" },
      { "rank": 2, "type": "Normal", "name": "聚寶功" },
      { "rank": 2, "type": "Steel", "name": "金屬爪" },
      { "rank": 2, "type": "Dark", "name": "挑釁" },
      { "rank": 2, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 2, "type": "Normal", "name": "亂抓" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Steel", "name": "鐵頭" },
      { "rank": 2, "type": "Steel", "name": "鐵壁" },
      { "rank": 3, "type": "Normal", "name": "劈開" },
      { "rank": 3, "type": "Steel", "name": "金屬音" },
      { "rank": 3, "type": "Normal", "name": "大鬧一番" },
      { "rank": 3, "type": "Steel", "name": "金屬爆炸" },
      { "rank": 4, "type": "Normal", "name": "劍舞" },
      { "rank": 4, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 4, "type": "Dark", "name": "地獄突刺" }
    ]
  },
  {
    "id": "222-G",
    "region": "galar",
    "name": "太陽珊瑚 (伽勒爾的樣子)",
    "alias": "Corsola",
    "type": [
      "Ghost"
    ],
    "info": {
      "image": "images/pokedex/222-G.png",
      "height": "0.6",
      "weight": "5",
      "category": "珊瑚寶可夢",
      "text": "當你行走在淺海海灘時，注意的你的腳步，因為這隻寶可夢看起來就跟石頭一樣，且如果你踢到牠的話就會遭到牠的詛咒。劇烈的溫度變化滅絕了這種遠古太陽珊瑚。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [
      "碎裂鎧甲",
      "詛咒之軀"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "變硬" },
      { "rank": 1, "type": "Ghost", "name": "驚嚇" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 2, "type": "Ghost", "name": "怨恨" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 2, "type": "Ghost", "name": "禍不單行" },
      { "rank": 2, "type": "Ghost", "name": "詛咒" },
      { "rank": 2, "type": "Grass", "name": "吸取力量" },
      { "rank": 3, "type": "Rock", "name": "力量寶石" },
      { "rank": 3, "type": "Ghost", "name": "黑夜魔影" },
      { "rank": 3, "type": "Ghost", "name": "怨念" },
      { "rank": 3, "type": "Psychic", "name": "鏡面反射" },
      { "rank": 4, "type": "Water", "name": "水之波動" },
      { "rank": 4, "type": "Rock", "name": "雙刃頭錘" },
      { "rank": 4, "type": "Ghost", "name": "同命" }
    ]
  },
  {
    "id": "864",
    "region": "galar",
    "name": "魔靈珊瑚",
    "alias": "Cursola",
    "type": [
      "Ghost"
    ],
    "info": {
      "image": "images/pokedex/864.png",
      "height": "1",
      "weight": "0.4",
      "category": "珊瑚寶可夢",
      "text": "靈體被用來保護著牠的靈魂，千萬不要觸摸到，否則你就會像石頭一樣動彈不得。這隻寶可夢思念著珊瑚礁充滿生機的昔日，並對摧毀這一切的對象心懷怨恨。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 4, "max": 8 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "碎裂鎧甲",
      "滅亡之軀"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "變硬" },
      { "rank": 1, "type": "Ghost", "name": "驚嚇" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 2, "type": "Ghost", "name": "怨恨" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 2, "type": "Ghost", "name": "禍不單行" },
      { "rank": 2, "type": "Ghost", "name": "詛咒" },
      { "rank": 2, "type": "Grass", "name": "吸取力量" },
      { "rank": 3, "type": "Rock", "name": "力量寶石" },
      { "rank": 3, "type": "Ghost", "name": "黑夜魔影" },
      { "rank": 3, "type": "Ghost", "name": "怨念" },
      { "rank": 3, "type": "Psychic", "name": "鏡面反射" },
      { "rank": 3, "type": "Normal", "name": "滅亡之歌" },
      { "rank": 4, "type": "Water", "name": "水流裂破" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" },
      { "rank": 4, "type": "Ghost", "name": "同命" }
    ]
  },
  {
    "id": "083-G",
    "region": "galar",
    "name": "大蔥鴨 (伽勒爾的樣子)",
    "alias": "Farfetch’d",
    "type": [
      "Fight"
    ],
    "info": {
      "image": "images/pokedex/083-G.png",
      "height": "0.8",
      "weight": "42",
      "category": "黃嘴鴨寶可夢",
      "text": "伽勒爾地區的大蔥更粗也更長，這讓大蔥鴨過得比他們關都地區的表親還要更好。這也讓牠們變得更堅強、更像是戰士。不過牠們仍然相當美味。"
    },
    "evolution": { "stage": "first", "time": "", "method": "other" },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "不屈之心",
      "膽量"
    ],
    "moves": [
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 0, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Bug", "name": "連斬" },
      { "rank": 1, "type": "Fight", "name": "碎岩" },
      { "rank": 2, "type": "Dark", "name": "狂舞揮打" },
      { "rank": 2, "type": "Fight", "name": "看穿" },
      { "rank": 2, "type": "Dark", "name": "拍落" },
      { "rank": 2, "type": "Flying", "name": "清除濃霧" },
      { "rank": 2, "type": "Fight", "name": "劈瓦" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 3, "type": "Normal", "name": "劍舞" },
      { "rank": 3, "type": "Grass", "name": "葉刃" },
      { "rank": 3, "type": "Fight", "name": "搏命" },
      { "rank": 3, "type": "Flying", "name": "勇鳥猛攻" },
      { "rank": 4, "type": "Grass", "name": "日光刃" },
      { "rank": 4, "type": "Steel", "name": "鋼翼" },
      { "rank": 4, "type": "Flying", "name": "羽毛舞" }
    ]
  },
  {
    "id": "865",
    "region": "galar",
    "name": "蔥遊兵",
    "alias": "Sirfetch’d",
    "type": [
      "Fight"
    ],
    "info": {
      "image": "images/pokedex/865.png",
      "height": "0.8",
      "weight": "117",
      "category": "黃嘴鴨寶可夢",
      "text": "只有歷經過無數戰鬥的大蔥鴨才能進化成這個樣子。牠們對自己的蔥槍和葉盾感到驕傲，當這隻寶可夢的大蔥枯萎了，牠就會退出戰場。"
    },
    "evolution": {
      "stage": "final",
      "method": "other"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "不屈之心",
      "膽量"
    ],
    "moves": [
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 0, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Bug", "name": "連斬" },
      { "rank": 2, "type": "Fight", "name": "碎岩" },
      { "rank": 2, "type": "Dark", "name": "狂舞揮打" },
      { "rank": 2, "type": "Fight", "name": "看穿" },
      { "rank": 2, "type": "Dark", "name": "拍落" },
      { "rank": 2, "type": "Flying", "name": "清除濃霧" },
      { "rank": 2, "type": "Fight", "name": "劈瓦" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 3, "type": "Normal", "name": "劍舞" },
      { "rank": 3, "type": "Grass", "name": "葉刃" },
      { "rank": 3, "type": "Fight", "name": "搏命" },
      { "rank": 3, "type": "Flying", "name": "勇鳥猛攻" },
      { "rank": 3, "type": "Bug", "name": "迎頭一擊" },
      { "rank": 3, "type": "Steel", "name": "鐵壁" },
      { "rank": 4, "type": "Fight", "name": "流星突擊" },
      { "rank": 4, "type": "Normal", "name": "單純光束" },
      { "rank": 4, "type": "Normal", "name": "挺住" },
      { "rank": 4, "type": "Normal", "name": "聚氣" }
    ]
  },
  {
    "id": "618-G",
    "region": "galar",
    "name": "泥巴魚 (伽勒爾的樣子)",
    "alias": "Stunfisk",
    "type": [
      "Ground",
      "Steel"
    ],
    "info": {
      "image": "images/pokedex/618-G.png",
      "height": "0.7",
      "weight": "20.5",
      "category": "陷阱寶可夢",
      "text": "泥巴魚棲息在富含鐵質的泥巴裡，這些營養素使牠的身體變成了鋼屬性。泥巴魚的嘴唇在泥巴中很難被辨識，但如果有人踩到了牠，牠就會用鋸齒般的鋼鰭將牠的獵物緊緊夾住。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "擬態"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Ground", "name": "擲泥" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Steel", "name": "金屬爪" },
      { "rank": 1, "type": "Normal", "name": "挺住" },
      { "rank": 2, "type": "Ground", "name": "泥巴射擊" },
      { "rank": 2, "type": "Fight", "name": "報復" },
      { "rank": 2, "type": "Steel", "name": "金屬音" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Steel", "name": "鐵壁" },
      { "rank": 2, "type": "Flying", "name": "彈跳" },
      { "rank": 2, "type": "Water", "name": "濁流" },
      { "rank": 3, "type": "Grass", "name": "捕獸夾" },
      { "rank": 3, "type": "Normal", "name": "抓狂" },
      { "rank": 3, "type": "Ground", "name": "地裂" },
      { "rank": 4, "type": "Rock", "name": "隱形岩" },
      { "rank": 4, "type": "Normal", "name": "綁緊" },
      { "rank": 4, "type": "Fight", "name": "雙倍奉還" }
    ]
  },
  {
    "id": "122-G",
    "region": "galar",
    "name": "魔牆人偶 (伽勒爾的樣子)",
    "alias": "Mr. Mime",
    "type": [
      "Ice",
      "Psychic"
    ],
    "info": {
      "image": "images/pokedex/122-G.png",
      "height": "1.4",
      "weight": "57",
      "category": "舞蹈寶可夢",
      "text": "熬過伽勒爾地區嚴寒氣候的魔尼尼將能夠創造出瞬間變成冰的隱形牆，而當牠們進化，牠們將能夠製造出冰之地板來讓牠們跳踢踏舞，而這也是牠們最為熱衷的活動。"
    },
    "evolution": {
      "stage": "second",
      "time": "medium"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "幹勁",
      "除障"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "拍擊" },
      { "rank": 0, "type": "Normal", "name": "高速旋轉" },
      { "rank": 1, "type": "Normal", "name": "接棒" },
      { "rank": 1, "type": "Ice", "name": "冰礫" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 1, "type": "Psychic", "name": "交換場地" },
      { "rank": 2, "type": "Ice", "name": "冰凍之風" },
      { "rank": 2, "type": "Fight", "name": "二連踢" },
      { "rank": 2, "type": "Normal", "name": "仿效" },
      { "rank": 2, "type": "Normal", "name": "再來一次" },
      { "rank": 2, "type": "Psychic", "name": "扮演" },
      { "rank": 2, "type": "Normal", "name": "守住" },
      { "rank": 2, "type": "Normal", "name": "回收利用" },
      { "rank": 2, "type": "Normal", "name": "模仿" },
      { "rank": 2, "type": "Psychic", "name": "光牆" },
      { "rank": 2, "type": "Psychic", "name": "反射壁" },
      { "rank": 2, "type": "Ice", "name": "冰凍光束" },
      { "rank": 2, "type": "Psychic", "name": "催眠術" },
      { "rank": 2, "type": "Psychic", "name": "鏡面反射" },
      { "rank": 3, "type": "Dark", "name": "突襲" },
      { "rank": 3, "type": "Ice", "name": "冷凍乾燥" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Normal", "name": "神秘守護" },
      { "rank": 3, "type": "Fairy", "name": "魔法閃耀" },
      { "rank": 3, "type": "Fairy", "name": "薄霧場地" },
      { "rank": 3, "type": "Normal", "name": "搖晃舞" },
      { "rank": 4, "type": "Water", "name": "求雨" },
      { "rank": 4, "type": "Ice", "name": "冰雹" }
    ]
  },
  {
    "id": "866",
    "region": "galar",
    "name": "踏冰人偶",
    "alias": "Mr. Rime",
    "type": [
      "Ice",
      "Psychic"
    ],
    "info": {
      "image": "images/pokedex/866.png",
      "height": "1.5",
      "weight": "58",
      "category": "喜劇演員寶可夢",
      "text": "牠是踢踏舞的達人。會適時揮動手中的冰杖，幽默的動作使牠獲得了眾人的喜愛，且牠也熱愛表演給小朋友看。牠的精神力量全都是從腹部的圖案釋放出來的。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [
      "蹣跚",
      "除障"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "偷懶" },
      { "rank": 0, "type": "Normal", "name": "您先請" },
      { "rank": 0, "type": "Normal", "name": "擋路" },
      { "rank": 0, "type": "Normal", "name": "高速旋轉" },
      { "rank": 1, "type": "Normal", "name": "接棒" },
      { "rank": 1, "type": "Ice", "name": "冰礫" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 1, "type": "Psychic", "name": "交換場地" },
      { "rank": 2, "type": "Ice", "name": "冰凍之風" },
      { "rank": 2, "type": "Fight", "name": "二連踢" },
      { "rank": 2, "type": "Normal", "name": "仿效" },
      { "rank": 2, "type": "Normal", "name": "再來一次" },
      { "rank": 2, "type": "Psychic", "name": "扮演" },
      { "rank": 2, "type": "Normal", "name": "守住" },
      { "rank": 2, "type": "Normal", "name": "回收利用" },
      { "rank": 2, "type": "Normal", "name": "模仿" },
      { "rank": 2, "type": "Psychic", "name": "光牆" },
      { "rank": 2, "type": "Psychic", "name": "反射壁" },
      { "rank": 2, "type": "Ice", "name": "冰凍光束" },
      { "rank": 2, "type": "Psychic", "name": "催眠術" },
      { "rank": 2, "type": "Psychic", "name": "鏡面反射" },
      { "rank": 3, "type": "Dark", "name": "假哭" },
      { "rank": 3, "type": "Ice", "name": "冷凍乾燥" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Normal", "name": "神秘守護" },
      { "rank": 3, "type": "Fairy", "name": "魔法閃耀" },
      { "rank": 3, "type": "Fairy", "name": "薄霧場地" },
      { "rank": 3, "type": "Normal", "name": "搖晃舞" }
    ]
  },
{
  "id": "554-G",
  "region": "galar",
  "name": "火紅不倒翁 (伽勒爾的樣子)",
  "alias": "Darumaka",
  "type": [
    "Ice"
  ],
  "info": {
    "image": "images/pokedex/554-G.png",
    "height": "0.7",
    "weight": "40",
    "category": "不倒翁寶可夢",
    "text": "因為居住在積雪深厚的地域，火囊也因此冷卻而改為製造冷氣。火紅不倒翁利用低溫當作能量，這讓牠在冬天時特別有活力。牠愛玩且喜歡丟雪球。"
  },
  "evolution": {
    "stage": "first",
    "with": "冰之石"
  },
  "baseHP": 3,
  "rank": 1,
  "attr": {
    "str": { "value": 2, "max": 5 },
    "dex": { "value": 2, "max": 4 },
    "vit": { "value": 2, "max": 4 },
    "spe": { "value": 1, "max": 3 },
    "ins": { "value": 2, "max": 4 }
  },
  "ability": [
    "活力",
    "精神力"
  ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "撞擊" },
    { "rank": 0, "type": "Dark", "name": "挑釁" },
    { "rank": 1, "type": "Dark", "name": "咬住" },
    { "rank": 1, "type": "Ice", "name": "細雪" },
    { "rank": 2, "type": "Ice", "name": "雪崩" },
    { "rank": 2, "type": "Normal", "name": "自我激勵" },
    { "rank": 2, "type": "Ice", "name": "冰凍牙" },
    { "rank": 2, "type": "Normal", "name": "頭鎚" },
    { "rank": 2, "type": "Ice", "name": "冰凍拳" },
    { "rank": 2, "type": "Normal", "name": "吵鬧" },
    { "rank": 3, "type": "Normal", "name": "腹鼓" },
    { "rank": 3, "type": "Ice", "name": "暴風雪" },
    { "rank": 3, "type": "Normal", "name": "大鬧一番" },
    { "rank": 3, "type": "Fight", "name": "蠻力" },
    { "rank": 4, "type": "Dark", "name": "投擲" },
    { "rank": 4, "type": "Normal", "name": "替身" },
    { "rank": 4, "type": "Fire", "name": "熱風" }
  ],
  "isNovice": true
},
{
  "id": "555-G",
  "region": "galar",
  "name": "達摩狒狒 (伽勒爾的樣子)",
  "alias": "Darmanitan",
  "type": [
    "Ice"
  ],
  "info": {
    "image": "images/pokedex/555-G.png",
    "height": "1.7",
    "weight": "120",
    "category": "不倒翁寶可夢",
    "text": "達摩狒狒在伽勒爾的樣子。牠們會在暴風雪的日子來到人類居住的村落偷走食物。儘管達摩狒狒看起來很兇，但牠們實際上溫和且害羞。"
  },
  "evolution": {
    "stage": "final"
  },
  "baseHP": 4,
  "rank": 2,
  "attr": {
    "str": { "value": 3, "max": 7 },
    "dex": { "value": 3, "max": 6 },
    "vit": { "value": 2, "max": 4 },
    "spe": { "value": 1, "max": 3 },
    "ins": { "value": 2, "max": 4 }
  },
  "ability": [
    "一猩一意",
    "達摩模式"
  ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "撞擊" },
    { "rank": 0, "type": "Dark", "name": "挑釁" },
    { "rank": 1, "type": "Dark", "name": "咬住" },
    { "rank": 1, "type": "Ice", "name": "細雪" },
    { "rank": 2, "type": "Ice", "name": "雪崩" },
    { "rank": 2, "type": "Normal", "name": "自我激勵" },
    { "rank": 2, "type": "Ice", "name": "冰凍牙" },
    { "rank": 2, "type": "Normal", "name": "頭鎚" },
    { "rank": 2, "type": "Ice", "name": "冰凍拳" },
    { "rank": 2, "type": "Normal", "name": "吵鬧" },
    { "rank": 3, "type": "Normal", "name": "腹鼓" },
    { "rank": 3, "type": "Ice", "name": "暴風雪" },
    { "rank": 3, "type": "Normal", "name": "大鬧一番" },
    { "rank": 3, "type": "Fight", "name": "蠻力" },
    { "rank": 3, "type": "Ice", "name": "冰柱墜擊" },
    { "rank": 4, "type": "Dark", "name": "小偷" },
    { "rank": 4, "type": "Ground", "name": "重踏" },
    { "rank": 4, "type": "Ice", "name": "冷凍乾燥" }
  ]
},
{
  "id": "555-ZenG",
  "region": "galar",
  "name": "達摩狒狒 (伽勒爾的樣子)(達摩模式)",
  "alias": "Darmanitan",
  "type": [
    "Ice",
    "Fire"
  ],
  "info": {
    "image": "images/pokedex/555-Zen-G.png",
    "height": "1.7",
    "weight": "120",
    "category": "不倒翁寶可夢",
    "text": "當達摩狒狒憤怒時，原本退化的火囊將重新點燃。這隻寶可夢將胡亂噴火並在所到之處大鬧一番。牠們的怒火必須被平息，否則牠們的高溫甚至會融化自己的身體。"
  },
  "evolution": {
    "stage": "final"
  },
  "baseHP": 4,
  "rank": 2,
  "attr": {
    "str": { "value": 3, "max": 7 },
    "dex": { "value": 3, "max": 6 },
    "vit": { "value": 2, "max": 4 },
    "spe": { "value": 1, "max": 3 },
    "ins": { "value": 2, "max": 4 }
  },
  "ability": [
    "一猩一意",
    "達摩模式"
  ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "撞擊" },
    { "rank": 0, "type": "Dark", "name": "挑釁" },
    { "rank": 1, "type": "Dark", "name": "咬住" },
    { "rank": 1, "type": "Ice", "name": "細雪" },
    { "rank": 2, "type": "Ice", "name": "雪崩" },
    { "rank": 2, "type": "Normal", "name": "自我激勵" },
    { "rank": 2, "type": "Ice", "name": "冰凍牙" },
    { "rank": 2, "type": "Normal", "name": "頭鎚" },
    { "rank": 2, "type": "Ice", "name": "冰凍拳" },
    { "rank": 2, "type": "Normal", "name": "吵鬧" },
    { "rank": 3, "type": "Normal", "name": "腹鼓" },
    { "rank": 3, "type": "Ice", "name": "暴風雪" },
    { "rank": 3, "type": "Normal", "name": "大鬧一番" },
    { "rank": 3, "type": "Fight", "name": "蠻力" },
    { "rank": 3, "type": "Ice", "name": "冰柱墜擊" },
    { "rank": 4, "type": "Fire", "name": "大晴天" },
    { "rank": 4, "type": "Fire", "name": "閃焰衝鋒" },
    { "rank": 4, "type": "Fire", "name": "火焰牙" }
  ]
},
{
  "id": "562-G",
  "region": "galar",
  "name": "哭哭面具 (伽勒爾的樣子)",
  "alias": "Yamask",
  "type": [
    "Ghost"
  ],
  "info": {
    "image": "images/pokedex/562-G.png",
    "height": "0.5",
    "weight": "1.5",
    "category": "魂寶可夢",
    "text": "據說牠是古代黏土板被帶有強烈怨念的靈魂吸引後誕生的寶可夢。黏土板似乎吸收了哭哭面具的力量，所以才會那麼蒼白。"
  },
  "evolution": {
    "stage": "first",
    "near": "符文繪畫"
  },
  "baseHP": 3,
  "rank": 2,
  "attr": {
    "str": { "value": 2, "max": 4 },
    "dex": { "value": 1, "max": 3 },
    "vit": { "value": 2, "max": 5 },
    "spe": { "value": 1, "max": 3 },
    "ins": { "value": 2, "max": 4 }
  },
  "ability": [
    "遊魂"
  ],
  "moves": [
    { "rank": 0, "type": "Ghost", "name": "驚嚇" },
    { "rank": 0, "type": "Normal", "name": "守住" },
    { "rank": 1, "type": "Ice", "name": "黑霧" },
    { "rank": 1, "type": "Ghost", "name": "黑夜魔影" },
    { "rank": 2, "type": "Normal", "name": "定身法" },
    { "rank": 2, "type": "Dark", "name": "狂舞揮打" },
    { "rank": 2, "type": "Fairy", "name": "戲法防守" },
    { "rank": 2, "type": "Ghost", "name": "禍不單行" },
    { "rank": 2, "type": "Normal", "name": "黑色目光" },
    { "rank": 2, "type": "Normal", "name": "摔打" },
    { "rank": 2, "type": "Ghost", "name": "詛咒" },
    { "rank": 2, "type": "Ghost", "name": "暗影球" },
    { "rank": 3, "type": "Ground", "name": "地震" },
    { "rank": 3, "type": "Psychic", "name": "力量平分" },
    { "rank": 3, "type": "Psychic", "name": "防守平分" },
    { "rank": 3, "type": "Ghost", "name": "同命" },
    { "rank": 4, "type": "Rock", "name": "沙暴" },
    { "rank": 4, "type": "Psychic", "name": "精神強念" },
    { "rank": 4, "type": "Dark", "name": "臨別禮物" }
  ],
  "isNovice": true
},
{
  "id": "867",
  "region": "galar",
  "name": "死神板",
  "alias": "Runerigus",
  "type": [
    "Ghost",
    "Ground"
  ],
  "info": {
    "image": "images/pokedex/867.png",
    "height": "1.6",
    "weight": "66",
    "category": "怨念寶可夢",
    "text": "強烈詛咒注入了古代繪畫，在詛咒吸收了哭哭面具的靈魂之後，牠就會進化成死靈板。千萬不要觸摸牠那影子般的身體，否則你將會看到印刻在牠畫中的恐怖記憶。"
  },
  "evolution": {
    "stage": "final",
    "method": "other"
  },
  "baseHP": 4,
  "rank": 3,
  "attr": {
    "str": { "value": 3, "max": 6 },
    "dex": { "value": 1, "max": 3 },
    "vit": { "value": 4, "max": 8 },
    "spe": { "value": 2, "max": 4 },
    "ins": { "value": 3, "max": 6 }
  },
  "ability": [
    "遊魂"
  ],
  "moves": [
    { "rank": 0, "type": "Ghost", "name": "驚嚇" },
    { "rank": 0, "type": "Normal", "name": "守住" },
    { "rank": 1, "type": "Ice", "name": "黑霧" },
    { "rank": 1, "type": "Ghost", "name": "黑夜魔影" },
    { "rank": 2, "type": "Normal", "name": "定身法" },
    { "rank": 2, "type": "Dark", "name": "狂舞揮打" },
    { "rank": 2, "type": "Fairy", "name": "戲法防守" },
    { "rank": 2, "type": "Ghost", "name": "禍不單行" },
    { "rank": 2, "type": "Normal", "name": "黑色目光" },
    { "rank": 2, "type": "Ghost", "name": "暗影爪" },
    { "rank": 2, "type": "Normal", "name": "鬼面" },
    { "rank": 2, "type": "Normal", "name": "摔打" },
    { "rank": 2, "type": "Ghost", "name": "詛咒" },
    { "rank": 2, "type": "Ghost", "name": "暗影球" },
    { "rank": 3, "type": "Psychic", "name": "力量平分" },
    { "rank": 3, "type": "Ground", "name": "地震" },
    { "rank": 3, "type": "Ghost", "name": "同命" },
    { "rank": 3, "type": "Psychic", "name": "防守平分" },
    { "rank": 4, "type": "Steel", "name": "鐵壁" },
    { "rank": 4, "type": "Dark", "name": "臨別禮物" },
    { "rank": 4, "type": "Rock", "name": "隱形岩" }
  ]
},
  {
    "id": "868",
    "region": "galar",
    "name": "小仙奶",
    "alias": "Milcery",
    "type": [
      "Fairy"
    ],
    "info": {
      "image": "images/pokedex/868.png",
      "height": "0.2",
      "weight": "0.3",
      "category": "鮮奶油寶可夢",
      "text": "這隻寶可夢是從空氣中甜甜香氣的粒子中誕生，牠的身體由鮮奶油構成。在你家廚房發現牠意味著好運。把樹果給牠們，並用攪拌器輕撫，這樣牠們就能夠進化。"
    },
    "evolution": {
      "stage": "first",
      "with": "樹果&糖飾"
    },
    "baseHP": 3,
    "rank": 0,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "甜幕", "芳香幕"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Fairy", "name": "芳香薄霧" },
      { "rank": 1, "type": "Fairy", "name": "天使之吻" },
      { "rank": 1, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 2, "type": "Fairy", "name": "吸取之吻" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 2, "type": "Normal", "name": "迷人" },
      { "rank": 2, "type": "Poison", "name": "溶化" },
      { "rank": 2, "type": "Fairy", "name": "魔法閃耀" },
      { "rank": 3, "type": "Normal", "name": "自我再生" },
      { "rank": 3, "type": "Fairy", "name": "薄霧場地" },
      { "rank": 3, "type": "Normal", "name": "找夥伴" },
      { "rank": 4, "type": "Fairy", "name": "撒嬌" },
      { "rank": 4, "type": "Normal", "name": "幫助" },
      { "rank": 4, "type": "Dark", "name": "投擲" }
    ],
    "isNovice": true
  },
  {
    "id": "869",
    "region": "galar",
    "name": "霜奶仙",
    "alias": "Alcremie",
    "type": [
      "Fairy"
    ],
    "info": {
      "image": "images/pokedex/869.png",
      "height": "0.3",
      "weight": "0.5",
      "category": "鮮奶油寶可夢",
      "text": "有相當多數量的食譜能讓小仙奶進化成霜奶仙，並影響牠們的顏色和口味。有些甜美、有些酸爽，但牠們全都相當美味。在牠們幫助下製作的蛋糕可以賣到相當高的價錢。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 3, "max": 7 }
    },
    "ability": [
      "甜幕", "芳香幕"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Fairy", "name": "芳香薄霧" },
      { "rank": 1, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 1, "type": "Fairy", "name": "裝飾" },
      { "rank": 2, "type": "Fairy", "name": "天使之吻" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 2, "type": "Fairy", "name": "吸取之吻" },
      { "rank": 2, "type": "Poison", "name": "溶化" },
      { "rank": 2, "type": "Normal", "name": "迷人" },
      { "rank": 3, "type": "Normal", "name": "自我再生" },
      { "rank": 3, "type": "Fairy", "name": "魔法閃耀" },
      { "rank": 3, "type": "Normal", "name": "找夥伴" },
      { "rank": 3, "type": "Fairy", "name": "薄霧場地" },
      { "rank": 4, "type": "Fire", "name": "魔法火焰" },
      { "rank": 4, "type": "Normal", "name": "替身" },
      { "rank": 4, "type": "Dark", "name": "假哭" }
    ]
  },
  {
    "id": "077-G",
    "region": "galar",
    "name": "小火馬 (伽勒爾的樣子)",
    "alias": "Ponyta",
    "type": [
      "Psychic"
    ],
    "info": {
      "image": "images/pokedex/077-G.png",
      "height": "0.8",
      "weight": "24",
      "category": "一角寶可夢",
      "text": "伽勒爾古老的魔法森林讓小火馬發展出了神秘的性質。牠們神奇的角能夠治癒大部分的傷口並感應你的心靈是否純潔。如果你抱持著邪惡的思想，那麼你永遠也不可能在野外遇到這種寶可夢。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "逃跑",
      "粉彩護幕"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 1, "type": "Fairy", "name": "妖精之風" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Psychic", "name": "治癒波動" },
      { "rank": 2, "type": "Normal", "name": "踩踏" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Fairy", "name": "魔法閃耀" },
      { "rank": 3, "type": "Psychic", "name": "治癒之願" },
      { "rank": 4, "type": "Psychic", "name": "交換場地" },
      { "rank": 4, "type": "Psychic", "name": "預知未來" },
      { "rank": 4, "type": "Normal", "name": "守住" }
    ]
  },
  {
    "id": "078-G",
    "region": "galar",
    "name": "烈焰馬 (伽勒爾的樣子)",
    "alias": "Rapidash",
    "type": [
      "Psychic",
      "Fairy"
    ],
    "info": {
      "image": "images/pokedex/078-G.png",
      "height": "1.7",
      "weight": "80",
      "category": "一角寶可夢",
      "text": "那些內心邪惡的人將會被這驕傲而美麗的寶可夢給蔑視。牠能運用精神力量在空中奔馳。傳說只有真正的公主能夠騎乘在伽勒爾地區的烈焰馬身上。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "逃跑",
      "粉彩護幕"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 2, "type": "Fairy", "name": "妖精之風" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Psychic", "name": "治癒波動" },
      { "rank": 2, "type": "Normal", "name": "踩踏" },
      { "rank": 2, "type": "Psychic", "name": "精神利刃" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Fairy", "name": "魔法閃耀" },
      { "rank": 3, "type": "Psychic", "name": "治癒之願" },
      { "rank": 3, "type": "Bug", "name": "超級角擊" },
      { "rank": 4, "type": "Ground", "name": "十萬馬力" },
      { "rank": 4, "type": "Psychic", "name": "魔法空間" },
      { "rank": 4, "type": "Flying", "name": "彈跳" }
    ]
  },
  {
    "id": "870",
    "region": "galar",
    "name": "列陣兵",
    "alias": "Falinks",
    "type": [
      "Fight"
    ],
    "info": {
      "image": "images/pokedex/870.png",
      "height": "3",
      "weight": "62",
      "category": "陣形寶可夢",
      "text": "六隻為一體的寶可夢，由一個頭頭和五個跟班組成。頭頭的命令不可違抗，牠們是完美的團隊，並能夠變換陣形來更好地適應戰鬥。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "戰鬥盔甲",
      "不服輸"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "守住" },
      { "rank": 1, "type": "Fight", "name": "碎岩" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Fight", "name": "健美" },
      { "rank": 2, "type": "Normal", "name": "挺住" },
      { "rank": 2, "type": "Fight", "name": "起死回生" },
      { "rank": 2, "type": "Bug", "name": "迎頭一擊" },
      { "rank": 2, "type": "Fight", "name": "背水一戰" },
      { "rank": 3, "type": "Steel", "name": "鐵壁" },
      { "rank": 3, "type": "Fight", "name": "近身戰" },
      { "rank": 3, "type": "Bug", "name": "超級角擊" },
      { "rank": 3, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 4, "type": "Normal", "name": "劍舞" },
      { "rank": 4, "type": "Steel", "name": "鐵頭" },
      { "rank": 4, "type": "Poison", "name": "毒擊" }
    ]
  },
  {
    "id": "871",
    "region": "galar",
    "name": "啪嚓海膽",
    "alias": "Pincurchin",
    "type": [
      "Electric"
    ],
    "info": {
      "image": "images/pokedex/871.png",
      "height": "0.3",
      "weight": "1",
      "category": "海膽寶可夢",
      "text": "這隻安靜的寶可夢以海藻為食，會用銳利的牙齒將海藻刮取下來。牠的每根刺裡都儲存著電力。即使是折斷的刺也能夠持續放電好幾個小時。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 1, "max": 2 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "避雷針",
      "電氣製造者"
    ],
    "moves": [
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 0, "type": "Electric", "name": "電擊" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Electric", "name": "充電" },
      { "rank": 2, "type": "Normal", "name": "亂擊" },
      { "rank": 2, "type": "Electric", "name": "電光" },
      { "rank": 2, "type": "Water", "name": "泡沫光線" },
      { "rank": 2, "type": "Normal", "name": "自我再生" },
      { "rank": 2, "type": "Ghost", "name": "詛咒" },
      { "rank": 2, "type": "Electric", "name": "電氣場地" },
      { "rank": 3, "type": "Poison", "name": "毒擊" },
      { "rank": 3, "type": "Electric", "name": "麻麻刺刺" },
      { "rank": 3, "type": "Normal", "name": "點穴" },
      { "rank": 3, "type": "Electric", "name": "放電" },
      { "rank": 4, "type": "Dark", "name": "突襲" },
      { "rank": 4, "type": "Poison", "name": "毒菱" },
      { "rank": 4, "type": "Ground", "name": "撒菱" }
    ]
  },
  {
    "id": "872",
    "region": "galar",
    "name": "雪吞蟲",
    "alias": "Snom",
    "type": [
      "Bug",
      "Ice"
    ],
    "info": {
      "image": "images/pokedex/872.png",
      "height": "0.3",
      "weight": "4",
      "category": "蟲寶寶寶可夢",
      "text": "能吐出帶著冷氣的絲，並用來把自己掛在樹枝上，一邊裝成冰柱一邊睡覺。牠只會吃地面上的積雪，如果積雪融化，牠會將其再次凍起來然後繼續進食。"
    },
    "evolution": {
      "stage": "first",
      "happiness": 5
    },
    "baseHP": 3,
    "rank": 0,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [
      "鱗粉",
      "冰鱗粉"
    ],
    "moves": [
      { "rank": 0, "type": "Ice", "name": "細雪" },
      { "rank": 1, "type": "Bug", "name": "蟲之抵抗" },
      { "rank": 4, "type": "Psychic", "name": "睡覺" },
      { "rank": 4, "type": "Normal", "name": "打鼾" },
      { "rank": 4, "type": "Bug", "name": "蟲咬" }
    ],
    "isNovice": true
  },
  {
    "id": "873",
    "region": "galar",
    "name": "雪絨蛾",
    "alias": "Frosmoth",
    "type": [
      "Bug",
      "Ice"
    ],
    "info": {
      "image": "images/pokedex/873.png",
      "height": "1.3",
      "weight": "42",
      "category": "冰蛾寶可夢",
      "text": "絕不放過破壞山野和雪原環境的人。牠會用冰冷的翅膀四處飛翔，製造出暴風雪來趕走他們。除此之外的情況，牠就是隻相當高貴且溫雅的寶可夢。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 7 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "鱗粉",
      "冰鱗粉"
    ],
    "moves": [
      { "rank": 0, "type": "Ice", "name": "細雪" },
      { "rank": 0, "type": "Bug", "name": "蟲之抵抗" },
      { "rank": 1, "type": "Ice", "name": "冰凍之風" },
      { "rank": 1, "type": "Normal", "name": "幫助" },
      { "rank": 2, "type": "Normal", "name": "迷人" },
      { "rank": 2, "type": "Grass", "name": "麻痺粉" },
      { "rank": 2, "type": "Bug", "name": "死纏爛打" },
      { "rank": 2, "type": "Ice", "name": "白霧" },
      { "rank": 2, "type": "Flying", "name": "清除濃霧" },
      { "rank": 2, "type": "Flying", "name": "羽毛舞" },
      { "rank": 2, "type": "Ice", "name": "極光束" },
      { "rank": 2, "type": "Ice", "name": "冰雹" },
      { "rank": 2, "type": "Bug", "name": "蟲鳴" },
      { "rank": 2, "type": "Ice", "name": "極光幕" },
      { "rank": 3, "type": "Ice", "name": "暴風雪" },
      { "rank": 3, "type": "Flying", "name": "順風" },
      { "rank": 3, "type": "Rock", "name": "廣域防守" },
      { "rank": 3, "type": "Bug", "name": "蝶舞" },
      { "rank": 4, "type": "Fairy", "name": "魔法閃耀" },
      { "rank": 4, "type": "Psychic", "name": "鏡面反射" },
      { "rank": 4, "type": "Flying", "name": "暴風" }
    ]
  },
  {
    "id": "874",
    "region": "galar",
    "name": "巨石丁",
    "alias": "Stonjourner",
    "type": [
      "Rock"
    ],
    "info": {
      "image": "images/pokedex/874.png",
      "height": "2.5",
      "weight": "520",
      "category": "巨石寶可夢",
      "text": "牠們幾乎終其一生都保持不動，看起來就像是顆不顯眼的石頭，但每年會有一次，牠們會聚集在一起排成一個圈，維持好幾天之後，然後在一夜之間消失不見。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 6,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 7 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [
      "能量點"
    ],
    "moves": [
      { "rank": 0, "type": "Rock", "name": "落石" },
      { "rank": 0, "type": "Normal", "name": "擋路" },
      { "rank": 1, "type": "Normal", "name": "踩踏" },
      { "rank": 1, "type": "Rock", "name": "岩石封鎖" },
      { "rank": 2, "type": "Psychic", "name": "重力" },
      { "rank": 2, "type": "Rock", "name": "岩石打磨" },
      { "rank": 2, "type": "Rock", "name": "隱形岩" },
      { "rank": 2, "type": "Rock", "name": "岩崩" },
      { "rank": 2, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 2, "type": "Rock", "name": "廣域防守" },
      { "rank": 3, "type": "Steel", "name": "重磅衝撞" },
      { "rank": 3, "type": "Rock", "name": "尖石攻擊" },
      { "rank": 3, "type": "Normal", "name": "百萬噸重踢" },
      { "rank": 4, "type": "Fire", "name": "高溫重壓" },
      { "rank": 4, "type": "Rock", "name": "原始之力" },
      { "rank": 4, "type": "Ground", "name": "跺腳" }
    ]
  },
  {
    "id": "875",
    "region": "galar",
    "name": "冰砌鵝",
    "alias": "Eiscue",
    "type": [
      "Ice"
    ],
    "info": {
      "image": "images/pokedex/875.png",
      "height": "1.4",
      "weight": "89",
      "category": "企鵝寶可夢",
      "text": "這隻寶可夢隨時都用冰塊冰鎮著自己的臉。牠會把頭頂上的毛垂到海裡釣食物吃。當牠們游累的時候，牠們會就這麼讓自己的冰塊腦袋帶牠們漂浮在海上。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "結凍頭"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Ice", "name": "白霧" },
      { "rank": 1, "type": "Ice", "name": "細雪" },
      { "rank": 1, "type": "Ice", "name": "冰凍之風" },
      { "rank": 2, "type": "Normal", "name": "氣象球" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Psychic", "name": "瞬間失憶" },
      { "rank": 2, "type": "Ice", "name": "冰雹" },
      { "rank": 2, "type": "Ice", "name": "冷凍乾燥" },
      { "rank": 3, "type": "Ice", "name": "極光幕" },
      { "rank": 3, "type": "Water", "name": "衝浪" },
      { "rank": 3, "type": "Ice", "name": "暴風雪" },
      { "rank": 4, "type": "Rock", "name": "雙刃頭錘" },
      { "rank": 4, "type": "Water", "name": "水流環" },
      { "rank": 4, "type": "Normal", "name": "腹鼓" }
    ]
  },
  {
    "id": "875-noice",
    "region": "galar",
    "name": "冰砌鵝 (解凍頭型態)",
    "alias": "Eiscue",
    "type": [
      "Ice"
    ],
    "info": {
      "image": "images/pokedex/875-noice.png",
      "height": "1.4",
      "weight": "89",
      "category": "企鵝寶可夢",
      "text": "冰砌鵝的「解凍」型態實際上才是牠原本的型態。沒有了冰塊的保護，你可以看見牠一臉惆悵的表情，而這也讓人為之著迷。牠現在能夠更怪地移動，但你可以看出到牠變得更焦躁。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 7 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "結凍頭"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Ice", "name": "白霧" },
      { "rank": 1, "type": "Ice", "name": "細雪" },
      { "rank": 1, "type": "Ice", "name": "冰凍之風" },
      { "rank": 2, "type": "Normal", "name": "氣象球" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Psychic", "name": "瞬間失憶" },
      { "rank": 2, "type": "Ice", "name": "冰雹" },
      { "rank": 2, "type": "Ice", "name": "冷凍乾燥" },
      { "rank": 3, "type": "Ice", "name": "極光幕" },
      { "rank": 3, "type": "Water", "name": "衝浪" },
      { "rank": 3, "type": "Ice", "name": "暴風雪" },
      { "rank": 4, "type": "Rock", "name": "雙刃頭錘" },
      { "rank": 4, "type": "Water", "name": "水流環" },
      { "rank": 4, "type": "Normal", "name": "腹鼓" }
    ]
  },
  {
    "id": "876",
    "region": "galar",
    "name": "愛管侍",
    "alias": "Indeedee",
    "type": [
      "Psychic",
      "Normal"
    ],
    "info": {
      "image": "images/pokedex/876.png",
      "height": "0.9",
      "weight": "28",
      "category": "感情寶可夢",
      "text": "這些高度智能的寶可夢能透過夥伴間角與角的互碰來彼此交換訊息。牠們喜歡協助並為人們服務，這是因為牠們能收集感謝之情來獲得能量。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 0,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [
      "精神力",
      "同步"
    ],
    "moves": [
      { "rank": 0, "type": "Psychic", "name": "輔助力量" },
      { "rank": 0, "type": "Normal", "name": "和睦相處" },
      { "rank": 1, "type": "Normal", "name": "再來一次" },
      { "rank": 1, "type": "Normal", "name": "接棒" },
      { "rank": 1, "type": "Fairy", "name": "魅惑之聲" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 2, "type": "Normal", "name": "幫助" },
      { "rank": 2, "type": "Normal", "name": "看我嘛" },
      { "rank": 2, "type": "Normal", "name": "您先請" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 3, "type": "Psychic", "name": "冥想" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Psychic", "name": "力量平分" },
      { "rank": 3, "type": "Psychic", "name": "防守平分" },
      { "rank": 3, "type": "Normal", "name": "珍藏" },
      { "rank": 3, "type": "Psychic", "name": "治癒之願" },
      { "rank": 3, "type": "Psychic", "name": "精神場地" },
      { "rank": 4, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 4, "type": "Ghost", "name": "暗影球" },
      { "rank": 4, "type": "Psychic", "name": "奇妙空間" }
    ]
  },
  {
    "id": "877",
    "region": "galar",
    "name": "莫魯貝可",
    "alias": "Morpeko",
    "type": [
      "Electric",
      "Dark"
    ],
    "info": {
      "image": "images/pokedex/877.png",
      "height": "0.3",
      "weight": "3",
      "category": "雙面寶可夢",
      "text": "牠的滿腹花紋模式相當友善且愛玩，喜歡收集食物和零嘴。但肚子餓扁時的飢餓感會使牠變得極端凶暴，且牠頰囊中的電能轉化成了惡屬性的能量。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "飽了又餓"
    ],
    "moves": [
      { "rank": 0, "type": "Electric", "name": "電擊" },
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Dark", "name": "囂張" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Dark", "name": "吹捧" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Electric", "name": "電光" },
      { "rank": 2, "type": "Dark", "name": "無理取鬧" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Grass", "name": "種子機關槍" },
      { "rank": 3, "type": "Dark", "name": "咬碎" },
      { "rank": 3, "type": "Electric", "name": "氣場輪" },
      { "rank": 3, "type": "Normal", "name": "大鬧一番" },
      { "rank": 4, "type": "Normal", "name": "憤怒門牙" },
      { "rank": 4, "type": "Electric", "name": "瘋狂伏特" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" }
    ]
  },
  {
    "id": "878",
    "region": "galar",
    "name": "銅象",
    "alias": "Cufant",
    "type": [
      "Steel"
    ],
    "info": {
      "image": "images/pokedex/878.png",
      "height": "1.2",
      "weight": "100",
      "category": "像銅寶可夢",
      "text": "如果有需要力量的工作時，這隻寶可夢能夠表現出色。牠銅質的身體會因雨水而生鏽，轉變成鮮豔的綠色。牠的鼻子特別善於挖地，在野外牠們會用來挖出樹根來吃。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "強行",
      "重金屬"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Rock", "name": "滾動" },
      { "rank": 1, "type": "Fight", "name": "碎岩" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 2, "type": "Normal", "name": "踩踏" },
      { "rank": 2, "type": "Ground", "name": "挖洞" },
      { "rank": 2, "type": "Steel", "name": "鐵壁" },
      { "rank": 2, "type": "Normal", "name": "怪力" },
      { "rank": 2, "type": "Steel", "name": "鐵頭" },
      { "rank": 2, "type": "Fairy", "name": "嬉鬧" },
      { "rank": 3, "type": "Ground", "name": "十萬馬力" },
      { "rank": 3, "type": "Fight", "name": "蠻力" },
      { "rank": 4, "type": "Rock", "name": "隱形岩" },
      { "rank": 4, "type": "Psychic", "name": "意念頭鎚" },
      { "rank": 4, "type": "Ground", "name": "地裂" }
    ],
    "isNovice": true
  },
  {
    "id": "879",
    "region": "galar",
    "name": "大王銅象",
    "alias": "Copperajah",
    "type": [
      "Steel"
    ],
    "info": {
      "image": "images/pokedex/879.png",
      "height": "3",
      "weight": "650",
      "category": "像銅寶可夢",
      "text": "牠們是在很久以前從其他地區過來的，與人類一起工作建造新的道路和城市。牠們通常很溫和且喜歡陪伴牠的家族。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 6,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "強行",
      "重金屬"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Rock", "name": "滾動" },
      { "rank": 1, "type": "Fight", "name": "碎岩" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 2, "type": "Normal", "name": "踩踏" },
      { "rank": 2, "type": "Ground", "name": "挖洞" },
      { "rank": 2, "type": "Steel", "name": "鐵壁" },
      { "rank": 2, "type": "Normal", "name": "怪力" },
      { "rank": 2, "type": "Steel", "name": "鐵頭" },
      { "rank": 2, "type": "Fairy", "name": "嬉鬧" },
      { "rank": 3, "type": "Ground", "name": "十萬馬力" },
      { "rank": 3, "type": "Fight", "name": "蠻力" },
      { "rank": 3, "type": "Steel", "name": "重磅衝撞" },
      { "rank": 4, "type": "Ground", "name": "地裂" },
      { "rank": 4, "type": "Grass", "name": "強力鞭打" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" }
    ]
  },
  {
    "id": "880",
    "region": "galar",
    "name": "雷鳥龍",
    "alias": "",
    "type": [
      "Dragon",
      "Electric"
    ],
    "info": {
      "image": "images/pokedex/880.png",
      "height": "1.8",
      "weight": "190",
      "category": "化石寶可夢",
      "text": "在復活過程中混合的DNA導致了這個生物的誕生。構成牠下半部身體的超強壯生物很有可能會捕食構成上半部身體的小型生物。有時候牠會嘗試逃離自己。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "蓄電",
      "活力"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Electric", "name": "電擊" },
      { "rank": 1, "type": "Electric", "name": "充電" },
      { "rank": 1, "type": "Flying", "name": "燕返" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 2, "type": "Flying", "name": "啄食" },
      { "rank": 2, "type": "Dragon", "name": "龍尾" },
      { "rank": 2, "type": "Normal", "name": "踩踏" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 2, "type": "Electric", "name": "放電" },
      { "rank": 3, "type": "Electric", "name": "電喙" },
      { "rank": 3, "type": "Dragon", "name": "龍之波動" },
      { "rank": 3, "type": "Dragon", "name": "龍之俯衝" },
      { "rank": 4, "type": "Dragon", "name": "廣域破壞" },
      { "rank": 4, "type": "Electric", "name": "瘋狂伏特" },
      { "rank": 4, "type": "Dragon", "name": "流星群" }
    ]
  },
  {
    "id": "881",
    "region": "galar",
    "name": "雷鳥海獸",
    "alias": "Arctozolt",
    "type": [
      "Electric",
      "Ice"
    ],
    "info": {
      "image": "images/pokedex/881.png",
      "height": "2.3",
      "weight": "150",
      "category": "化石寶可夢",
      "text": "這隻DNA混合獸非常不擅長走路。組成牠下半部的寶可夢來自極地區域而上半部則住在溫暖的叢林地帶。這可憐的生物總是在顫抖並不受控制地打噴嚏。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "蓄電",
      "靜電"
    ],
    "moves": [
      { "rank": 0, "type": "Ice", "name": "細雪" },
      { "rank": 0, "type": "Electric", "name": "電擊" },
      { "rank": 1, "type": "Electric", "name": "充電" },
      { "rank": 1, "type": "Normal", "name": "回聲" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 2, "type": "Flying", "name": "啄食" },
      { "rank": 2, "type": "Ice", "name": "雪崩" },
      { "rank": 2, "type": "Ice", "name": "冷凍乾燥" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 2, "type": "Electric", "name": "放電" },
      { "rank": 3, "type": "Electric", "name": "電喙" },
      { "rank": 3, "type": "Ice", "name": "冰柱墜擊" },
      { "rank": 3, "type": "Ice", "name": "暴風雪" },
      { "rank": 4, "type": "Ice", "name": "冰雹" },
      { "rank": 4, "type": "Electric", "name": "瘋狂伏特" },
      { "rank": 4, "type": "Ground", "name": "跺腳" }
    ]
  },
  {
    "id": "882",
    "region": "galar",
    "name": "鰓魚龍",
    "alias": "Dracovish",
    "type": [
      "Dragon",
      "Water"
    ],
    "info": {
      "image": "images/pokedex/882.png",
      "height": "2.3",
      "weight": "215",
      "category": "化石寶可夢",
      "text": "結合了兩種頂級掠食者的DNA，牠能以驚人的高速奔跑並用尖銳的下顎撕碎幾乎任何東西。然而難過的是，這隻寶可夢只能在水中呼吸，且游泳能力很爛。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "儲水",
      "強壯之顎"
    ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Normal", "name": "守住" },
      { "rank": 1, "type": "Dark", "name": "狂舞揮打" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Dragon", "name": "龍息" },
      { "rank": 2, "type": "Normal", "name": "踩踏" },
      { "rank": 3, "type": "Normal", "name": "憤怒門牙" },
      { "rank": 3, "type": "Dark", "name": "咬碎" },
      { "rank": 3, "type": "Water", "name": "鰓咬" },
      { "rank": 3, "type": "Dragon", "name": "龍之波動" },
      { "rank": 3, "type": "Dragon", "name": "龍之俯衝" },
      { "rank": 4, "type": "Dragon", "name": "流星群" },
      { "rank": 4, "type": "Psychic", "name": "精神之牙" },
      { "rank": 4, "type": "Water", "name": "潮旋" }
    ]
  },
  {
    "id": "883",
    "region": "galar",
    "name": "鰓魚海獸",
    "alias": "Arctovish",
    "type": [
      "Water",
      "Ice"
    ],
    "info": {
      "image": "images/pokedex/883.png",
      "height": "2",
      "weight": "175",
      "category": "化石寶可夢",
      "text": "DNA的混合讓這隻穩固的生物能夠在寒冷水域中移動、呼吸、並抵抗寒冷。唯一的問題是牠的頭上下顛倒了。那牠沒辦法自己狩獵，因此如果沒有被餵養的話，牠會在幾天內因為飢餓而死掉。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [
      "儲水",
      "冰凍之軀"
    ],
    "moves": [
      { "rank": 0, "type": "Ice", "name": "細雪" },
      { "rank": 0, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Normal", "name": "守住" },
      { "rank": 1, "type": "Ice", "name": "冰凍之風" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Ice", "name": "極光幕" },
      { "rank": 2, "type": "Ice", "name": "冷凍乾燥" },
      { "rank": 2, "type": "Normal", "name": "憤怒門牙" },
      { "rank": 3, "type": "Water", "name": "鰓咬" },
      { "rank": 3, "type": "Ice", "name": "冰柱墜擊" },
      { "rank": 3, "type": "Ice", "name": "暴風雪" },
      { "rank": 4, "type": "Water", "name": "水流裂破" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" },
      { "rank": 4, "type": "Psychic", "name": "精神之牙" }
    ]
  },
  {
    "id": "884",
    "region": "galar",
    "name": "鋁鋼龍",
    "alias": "Duraludon",
    "type": [
      "Dragon",
      "Steel"
    ],
    "info": {
      "image": "images/pokedex/884.png",
      "height": "1.8",
      "weight": "40",
      "category": "合金寶可夢",
      "text": "牠的身體猶如打磨過的閃亮金屬，雖然輕而堅硬，卻有著容易生鏽的弱點。牠居住在氣候乾燥的洞穴深處，因為下雨和濕氣會使牠變得暴躁。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 3, "max": 7 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "輕金屬",
      "重金屬"
    ],
    "moves": [
      { "rank": 0, "type": "Steel", "name": "金屬爪" },
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Fight", "name": "碎岩" },
      { "rank": 1, "type": "Dark", "name": "磨爪" },
      { "rank": 2, "type": "Steel", "name": "金屬音" },
      { "rank": 2, "type": "Dragon", "name": "廣域破壞" },
      { "rank": 2, "type": "Dragon", "name": "龍尾" },
      { "rank": 2, "type": "Steel", "name": "鐵壁" },
      { "rank": 2, "type": "Normal", "name": "磨礪" },
      { "rank": 2, "type": "Dragon", "name": "龍爪" },
      { "rank": 3, "type": "Steel", "name": "加農光炮" },
      { "rank": 3, "type": "Steel", "name": "金屬爆炸" },
      { "rank": 3, "type": "Normal", "name": "破壞光線" },
      { "rank": 4, "type": "Dragon", "name": "流星群" },
      { "rank": 4, "type": "Steel", "name": "鐵蹄光線" },
      { "rank": 4, "type": "Psychic", "name": "鏡面反射" }
    ]
  },
  {
    "id": "885",
    "region": "galar",
    "name": "多龍梅西亞",
    "alias": "Dreepy",
    "type": [
      "Dragon",
      "Ghost"
    ],
    "info": {
      "image": "images/pokedex/885.png",
      "height": "0.5",
      "weight": "2",
      "category": "哀怨寶可夢",
      "text": "在重生為幽靈寶可夢後，多龍梅西亞仍然會在生前於古代大海棲息的住處徘徊。儘管單獨一隻無法構成什麼威脅，但如果牠們聚集起來，那你就麻煩大了。"
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 0,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [
      "恆淨之軀",
      "穿透"
    ],
    "moves": [
      { "rank": 0, "type": "Ghost", "name": "驚嚇" },
      { "rank": 0, "type": "Bug", "name": "死纏爛打" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 4, "type": "Normal", "name": "替身" },
      { "rank": 4, "type": "Dragon", "name": "龍尾" },
      { "rank": 4, "type": "Normal", "name": "影子分身" }
    ],
    "isNovice": true
  },
  {
    "id": "886",
    "region": "galar",
    "name": "多龍奇",
    "alias": "Drakloak",
    "type": [
      "Dragon",
      "Ghost"
    ],
    "info": {
      "image": "images/pokedex/886.png",
      "height": "1.4",
      "weight": "11",
      "category": "保母寶可夢",
      "text": "牠會與多龍梅西亞一起戰鬥，且直到牠們進化為止都會細心照顧。如果沒讓自己在照顧的多龍梅西亞乘在自己頭上的話就靜不下心來，牠甚至會因此試圖把別的寶可夢放到頭上。"
    },
    "evolution": {
      "stage": "second",
      "time": "slow"
    },
    "baseHP": 4,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [
      "恆淨之軀",
      "穿透"
    ],
    "moves": [
      { "rank": 0, "type": "Ghost", "name": "驚嚇" },
      { "rank": 0, "type": "Bug", "name": "死纏爛打" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Normal", "name": "鎖定" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Ghost", "name": "禍不單行" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Normal", "name": "二連擊" },
      { "rank": 2, "type": "Bug", "name": "急速折返" },
      { "rank": 2, "type": "Dragon", "name": "龍之舞" },
      { "rank": 2, "type": "Dragon", "name": "龍之波動" },
      { "rank": 3, "type": "Ghost", "name": "潛靈奇襲" },
      { "rank": 3, "type": "Normal", "name": "猛撞" },
      { "rank": 3, "type": "Dragon", "name": "龍之俯衝" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Normal", "name": "珍藏" },
      { "rank": 4, "type": "Ghost", "name": "奇異之光" },
      { "rank": 4, "type": "Dark", "name": "突襲" },
      { "rank": 4, "type": "Dragon", "name": "流星群" }
    ]
  },
  {
    "id": "887",
    "region": "galar",
    "name": "多龍巴魯托",
    "alias": "Dragapult",
    "type": [ "Dragon", "Ghost" ],
    "info": {
      "image": "images/pokedex/887.png",
      "height": "3",
      "weight": "50",
      "category": "隱形寶可夢",
      "text": "沒有在戰鬥的時候，牠會讓多龍梅西亞住在自己角上的洞裡。一旦戰鬥開始，牠會把多龍梅西亞如同超音速飛彈一樣射出去。這些小寶可夢似乎滿心期待著能被射出去，且會自行回來裝填。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 6,
    "rank": 4,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 3, "max": 7 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "恆淨之軀", "穿透" ],
    "moves": [
      { "rank": 0, "type": "Ghost", "name": "驚嚇" },
      { "rank": 0, "type": "Bug", "name": "死纏爛打" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Normal", "name": "鎖定" },
      { "rank": 2, "type": "Normal", "name": "二連擊" },
      { "rank": 2, "type": "Bug", "name": "急速折返" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Dragon", "name": "龍息" },
      { "rank": 2, "type": "Dragon", "name": "龍之舞" },
      { "rank": 2, "type": "Dragon", "name": "龍箭" },
      { "rank": 2, "type": "Ghost", "name": "禍不單行" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Normal", "name": "猛撞" },
      { "rank": 3, "type": "Normal", "name": "珍藏" },
      { "rank": 3, "type": "Dark", "name": "突襲" },
      { "rank": 3, "type": "Dragon", "name": "龍之俯衝" },
      { "rank": 3, "type": "Ghost", "name": "潛靈奇襲" },
      { "rank": 4, "type": "Dragon", "name": "流星群" },
      { "rank": 4, "type": "Psychic", "name": "光牆" },
      { "rank": 4, "type": "Psychic", "name": "反射壁" },
    ]
  },
  {
    "id": "888",
    "region": "galar",
    "name": "蒼響",
    "alias": "Zacian",
    "type": [
      "Fairy"
    ],
    "info": {
      "image": "images/pokedex/888.png",
      "height": "2.8",
      "weight": "110",
      "category": "無資料",
      "text": "被稱為傳說中的英雄，祂透過純粹的力量揮舞著英雄之劍，擊敗了巨大的邪惡。"
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 5,
    "rank": 5,
    "attr": {
      "str": { "value": 7, "max": 7 },
      "dex": { "value": 7, "max": 7 },
      "vit": { "value": 6, "max": 6 },
      "spe": { "value": 5, "max": 5 },
      "ins": { "value": 6, "max": 6 }
    },
    "ability": [
      "不撓之劍"
    ],
    "moves": [
      { "rank": 5, "type": "Fight", "name": "聖劍" },
      { "rank": 5, "type": "Fight", "name": "快速防守" },
      { "rank": 5, "type": "Steel", "name": "金屬爪" },
      { "rank": 5, "type": "Normal", "name": "長嚎" },
      { "rank": 5, "type": "Normal", "name": "電光一閃" },
      { "rank": 5, "type": "Dark", "name": "咬住" },
      { "rank": 5, "type": "Normal", "name": "劈開" },
      { "rank": 5, "type": "Normal", "name": "劍舞" },
      { "rank": 5, "type": "Steel", "name": "鐵頭" },
      { "rank": 5, "type": "Normal", "name": "磨礪" },
      { "rank": 5, "type": "Dark", "name": "咬碎" },
      { "rank": 5, "type": "Fairy", "name": "月亮之力" },
      { "rank": 5, "type": "Fight", "name": "近身戰" },
      { "rank": 5, "type": "Normal", "name": "終極衝擊" },
      { "rank": 5, "type": "Flying", "name": "空氣斬" },
      { "rank": 5, "type": "Psychic", "name": "精神利刃" },
      { "rank": 5, "type": "Grass", "name": "日光刃" }
    ],
    "isLegend": true
  },
  {
    "id": "888-sword",
    "region": "galar",
    "name": "蒼響 (劍之王)",
    "alias": "Zacian",
    "type": [
      "Fairy",
      "Steel"
    ],
    "info": {
      "image": "images/pokedex/888-sword.png",
      "height": "2.8",
      "weight": "110",
      "category": "無資料",
      "text": "傳說中能斬斷世間萬物的聖劍，也被稱為妖精王之劍，讓敵友都對牠敬畏不已。"
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 5,
    "rank": 5,
    "attr": {
      "str": { "value": 9, "max": 9 },
      "dex": { "value": 8, "max": 8 },
      "vit": { "value": 6, "max": 6 },
      "spe": { "value": 5, "max": 5 },
      "ins": { "value": 6, "max": 6 }
    },
    "ability": [
      "不撓之劍"
    ],
    "moves": [
      { "rank": 5, "type": "Fight", "name": "聖劍" },
      { "rank": 5, "type": "Fight", "name": "快速防守" },
      { "rank": 5, "type": "Steel", "name": "金屬爪" },
      { "rank": 5, "type": "Normal", "name": "長嚎" },
      { "rank": 5, "type": "Normal", "name": "電光一閃" },
      { "rank": 5, "type": "Dark", "name": "咬住" },
      { "rank": 5, "type": "Normal", "name": "劈開" },
      { "rank": 5, "type": "Normal", "name": "劍舞" },
      { "rank": 5, "type": "Steel", "name": "鐵頭" },
      { "rank": 5, "type": "Normal", "name": "磨礪" },
      { "rank": 5, "type": "Dark", "name": "咬碎" },
      { "rank": 5, "type": "Fairy", "name": "月亮之力" },
      { "rank": 5, "type": "Fight", "name": "近身戰" },
      { "rank": 5, "type": "Normal", "name": "終極衝擊" },
      { "rank": 5, "type": "Flying", "name": "空氣斬" },
      { "rank": 5, "type": "Psychic", "name": "精神利刃" },
      { "rank": 5, "type": "Grass", "name": "日光刃" },
      { "rank": 5, "type": "Steel", "name": "鐵蹄光線" },
      { "rank": 5, "type": "Steel", "name": "巨獸斬" }
    ],
    "isLegend": true
  },
  {
    "id": "889",
    "region": "galar",
    "name": "藏瑪然特",
    "alias": "Zamazenta",
    "type": [
      "Fight"
    ],
    "info": {
      "image": "images/pokedex/889.png",
      "height": "2.9",
      "weight": "210",
      "category": "無資料",
      "text": "被稱為傳說中的英雄，祂透過純粹的力量高舉著英雄之盾，保護人們不受巨大的邪惡侵害。"
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 5,
    "rank": 5,
    "attr": {
      "str": { "value": 7, "max": 7 },
      "dex": { "value": 7, "max": 7 },
      "vit": { "value": 6, "max": 6 },
      "spe": { "value": 5, "max": 5 },
      "ins": { "value": 6, "max": 6 }
    },
    "ability": [
      "不屈之盾"
    ],
    "moves": [
      { "rank": 5, "type": "Steel", "name": "金屬爆炸" },
      { "rank": 5, "type": "Rock", "name": "廣域防守" },
      { "rank": 5, "type": "Steel", "name": "金屬爪" },
      { "rank": 5, "type": "Normal", "name": "長嚎" },
      { "rank": 5, "type": "Normal", "name": "電光一閃" },
      { "rank": 5, "type": "Dark", "name": "咬住" },
      { "rank": 5, "type": "Normal", "name": "劈開" },
      { "rank": 5, "type": "Normal", "name": "劍舞" },
      { "rank": 5, "type": "Steel", "name": "鐵頭" },
      { "rank": 5, "type": "Normal", "name": "磨礪" },
      { "rank": 5, "type": "Dark", "name": "咬碎" },
      { "rank": 5, "type": "Fairy", "name": "月亮之力" },
      { "rank": 5, "type": "Fight", "name": "近身戰" },
      { "rank": 5, "type": "Normal", "name": "終極衝擊" },
      { "rank": 5, "type": "Psychic", "name": "光牆" },
      { "rank": 5, "type": "Psychic", "name": "反射壁" },
      { "rank": 5, "type": "Normal", "name": "神秘守護" }
    ],
    "isLegend": true
  },
  {
    "id": "889-shield",
    "region": "galar",
    "name": "藏瑪然特 (盾之王)",
    "alias": "Zamazenta",
    "type": [
      "Fight",
      "Steel"
    ],
    "info": {
      "image": "images/pokedex/889-shield.png",
      "height": "2.9",
      "weight": "210",
      "category": "無資料",
      "text": "傳說中能反彈一切攻擊的聖盾，也被稱為格鬥王之盾，哪怕是最最龐大的巨獸也無法越雷池一步。"
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 5,
    "rank": 5,
    "attr": {
      "str": { "value": 7, "max": 7 },
      "dex": { "value": 7, "max": 7 },
      "vit": { "value": 8, "max": 8 },
      "spe": { "value": 5, "max": 5 },
      "ins": { "value": 8, "max": 8 }
    },
    "ability": [
      "不屈之盾"
    ],
    "moves": [
      { "rank": 5, "type": "Steel", "name": "金屬爆炸" },
      { "rank": 5, "type": "Rock", "name": "廣域防守" },
      { "rank": 5, "type": "Steel", "name": "金屬爪" },
      { "rank": 5, "type": "Normal", "name": "長嚎" },
      { "rank": 5, "type": "Normal", "name": "電光一閃" },
      { "rank": 5, "type": "Dark", "name": "咬住" },
      { "rank": 5, "type": "Normal", "name": "劈開" },
      { "rank": 5, "type": "Normal", "name": "劍舞" },
      { "rank": 5, "type": "Steel", "name": "鐵頭" },
      { "rank": 5, "type": "Normal", "name": "磨礪" },
      { "rank": 5, "type": "Dark", "name": "咬碎" },
      { "rank": 5, "type": "Fairy", "name": "月亮之力" },
      { "rank": 5, "type": "Fight", "name": "近身戰" },
      { "rank": 5, "type": "Normal", "name": "終極衝擊" },
      { "rank": 5, "type": "Psychic", "name": "光牆" },
      { "rank": 5, "type": "Psychic", "name": "反射壁" },
      { "rank": 5, "type": "Normal", "name": "神秘守護" },
      { "rank": 5, "type": "Steel", "name": "鐵蹄光線" },
      { "rank": 5, "type": "Steel", "name": "巨獸彈" }
    ],
    "isLegend": true
  },
  {
    "id": "890",
    "region": "galar",
    "name": "無極汰那",
    "alias": "Eternatus",
    "type": [
      "Dragon",
      "Poison"
    ],
    "info": {
      "image": "images/pokedex/890.png",
      "height": "20",
      "weight": "950",
      "category": "無資料",
      "text": "在二萬年前一顆巨大的隕石墜落到伽勒爾地區，從那時候起大地就時不時會湧現出能使寶可夢極巨化的能量，這個現象在近幾年變得越來越頻繁。"
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 10,
    "rank": 5,
    "attr": {
      "str": { "value": 5, "max": 5 },
      "dex": { "value": 7, "max": 7 },
      "vit": { "value": 6, "max": 6 },
      "spe": { "value": 8, "max": 8 },
      "ins": { "value": 6, "max": 6 }
    },
    "ability": [
      "壓迫感"
    ],
    "moves": [
      { "rank": 5, "type": "Poison", "name": "毒尾" },
      { "rank": 5, "type": "Ghost", "name": "奇異之光" },
      { "rank": 5, "type": "Dragon", "name": "龍尾" },
      { "rank": 5, "type": "Psychic", "name": "高速移動" },
      { "rank": 5, "type": "Poison", "name": "劇毒" },
      { "rank": 5, "type": "Poison", "name": "毒液衝擊" },
      { "rank": 5, "type": "Dragon", "name": "龍之舞" },
      { "rank": 5, "type": "Poison", "name": "十字毒刃" },
      { "rank": 5, "type": "Dragon", "name": "龍之波動" },
      { "rank": 5, "type": "Fire", "name": "噴射火焰" },
      { "rank": 5, "type": "Dragon", "name": "極巨炮" },
      { "rank": 5, "type": "Psychic", "name": "宇宙力量" },
      { "rank": 5, "type": "Normal", "name": "自我再生" },
      { "rank": 5, "type": "Normal", "name": "破壞光線" },
      { "rank": 5, "type": "Dragon", "name": "無極光束" },
      { "rank": 5, "type": "Psychic", "name": "光牆" },
      { "rank": 5, "type": "Psychic", "name": "反射壁" },
      { "rank": 5, "type": "Normal", "name": "守住" }
    ],
    "isLegend": true
  }
]);
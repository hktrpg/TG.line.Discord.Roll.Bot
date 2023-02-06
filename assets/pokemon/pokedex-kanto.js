var Pokedex;
if(!Pokedex) Pokedex = [];

Array.prototype.push.apply(Pokedex, [
  {
	"id": "001",
	"region": "kanto",
	"name": "妙蛙種子", "alias": "Bulbasaur",
	"type": ["Grass", "Poison"],
	"info": {
		"image": "images/pokedex/001.png",
		"height": "0.7",
		"weight": "7",
		"category": "種子寶可夢",
		"text": "牠出生的時候背上就有一個奇怪的種子。這種子跟隨牠發芽成長。牠以做為乖巧且忠誠的寶可夢聞名，但在野外相當罕見。"
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
	"ability": ["茂盛"],
	"moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Grass", "name": "藤鞭" },
      { "rank": 1, "type": "Grass", "name": "寄生種子" },
      { "rank": 2, "type": "Normal", "name": "生長" },
      { "rank": 2, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 2, "type": "Grass", "name": "催眠粉" },
      { "rank": 2, "type": "Poison", "name": "毒粉" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Grass", "name": "光合作用" },
      { "rank": 3, "type": "Grass", "name": "煩惱種子" },
      { "rank": 4, "type": "Grass", "name": "草之誓約" },
      { "rank": 4, "type": "Grass", "name": "青草場地" },
      { "rank": 4, "type": "Grass", "name": "日光束" },
      { "rank": 4, "type": "Psychic", "name": "瞬間失憶" }
	],
	"isNovice": true,
  },
  {
	"id": "002",
	"region": "kanto",
	"name": "妙蛙草", "alias": "Ivysaur",
	"type": ["Grass", "Poison"],
	"info": {
		"image": "images/pokedex/002.png",
		"height": "1.0",
		"weight": "25",
		"category": "種子寶可夢",
		"text": "這隻寶可夢的背上生長著花蕾，為了支撐它的重量，妙蛙草的下盤變得強韌。牠在進化後變得較為孤僻，且會遠離群體去做日光浴。"
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
		"vit": { "value": 2, "max": 4 },
		"spe": { "value": 2, "max": 5 },
		"ins": { "value": 2, "max": 5 }
	},
	"ability": ["茂盛"],
	"moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Grass", "name": "藤鞭" },
      { "rank": 1, "type": "Grass", "name": "寄生種子" },
      { "rank": 2, "type": "Normal", "name": "生長" },
      { "rank": 2, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 2, "type": "Grass", "name": "催眠粉" },
      { "rank": 2, "type": "Poison", "name": "毒粉" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Grass", "name": "日光束" },
      { "rank": 3, "type": "Grass", "name": "光合作用" },
      { "rank": 3, "type": "Grass", "name": "煩惱種子" },
      { "rank": 4, "type": "Grass", "name": "草之誓約" },
      { "rank": 4, "type": "Grass", "name": "青草場地" },
      { "rank": 4, "type": "Psychic", "name": "瞬間失憶" }
	]
  },
  {
    "id": "003",
    "region": "kanto",
    "name": "妙蛙花", "alias": "Venusaur",
    "type": ["Grass", "Poison"],
    "info": {
        "image": "images/pokedex/003.png",
        "height": "2.0",
        "weight": "200",
        "category": "種子寶可夢",
        "text": "據說妙蛙花的花朵會在充足的陽光下展現出鮮豔的顏色。花朵散發的香氣能夠療癒人心。如果你在野外遇到一隻妙蛙花，那牠一定是這個區域的守護者。"
    },
    "evolution": {
        "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
        "str": { "value": 2, "max": 5 },
        "dex": { "value": 2, "max": 5 },
        "vit": { "value": 2, "max": 5 },
        "spe": { "value": 3, "max": 6 },
        "ins": { "value": 3, "max": 6 }
    },
    "ability": ["茂盛"],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Grass", "name": "藤鞭" },
      { "rank": 1, "type": "Grass", "name": "寄生種子" },
      { "rank": 2, "type": "Normal", "name": "生長" },
      { "rank": 2, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 2, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Grass", "name": "花瓣舞" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 2, "type": "Grass", "name": "催眠粉" },
      { "rank": 2, "type": "Grass", "name": "煩惱種子" },
      { "rank": 2, "type": "Poison", "name": "毒粉" },
      { "rank": 3, "type": "Grass", "name": "日光束" },
      { "rank": 3, "type": "Grass", "name": "光合作用" },
      { "rank": 3, "type": "Grass", "name": "落英繽紛" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Ghost", "name": "詛咒" },
      { "rank": 4, "type": "Grass", "name": "瘋狂植物" }
    ]
  },
  {
    "id": "003-M",
    "region": "kanto",
    "name": "超級妙蛙花", "alias": "Mega-Venusaur",
    "type": ["Grass", "Poison"],
    "info": {
        "image": "images/pokedex/003-M.png",
        "height": "2.4",
        "weight": "300",
        "category": "種子寶可夢",
        "text": "藉著超級石的力量，這隻寶可夢變得更高更重。牠的厚皮現在不會受到元素所傷，牠的行為舉止也變得更加嚴肅和堅定。"
    },
    "evolution": {
        "stage": "mega"
    },
    "baseHP": 6,
    "rank": 4,
    "attr": {
        "str": { "value": 3, "max": 6 },
        "dex": { "value": 2, "max": 5 },
        "vit": { "value": 3, "max": 7 },
        "spe": { "value": 3, "max": 6 },
        "ins": { "value": 3, "max": 6 }
    },
    "ability": ["厚脂肪"],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Grass", "name": "藤鞭" },
      { "rank": 1, "type": "Grass", "name": "寄生種子" },
      { "rank": 2, "type": "Normal", "name": "生長" },
      { "rank": 2, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 2, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Grass", "name": "花瓣舞" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 2, "type": "Grass", "name": "催眠粉" },
      { "rank": 2, "type": "Grass", "name": "煩惱種子" },
      { "rank": 2, "type": "Poison", "name": "毒粉" },
      { "rank": 3, "type": "Grass", "name": "日光束" },
      { "rank": 3, "type": "Grass", "name": "光合作用" },
      { "rank": 3, "type": "Grass", "name": "落英繽紛" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Ghost", "name": "詛咒" },
      { "rank": 4, "type": "Grass", "name": "瘋狂植物" }
    ]
  },
  {
    "id": "004",
    "region": "kanto",
    "name": "小火龍",
    "alias": "Charmander",
    "type": [ "Fire" ],
    "info": {
      "image": "images/pokedex/004.png",
      "height": "0.6",
      "weight": "8",
      "category": "蜥蜴寶可夢",
      "text": "一種罕見的寶可夢。尾巴上的火焰是牠情緒及生命力的象徵。如果牠活力十足，火焰就會熊熊燃燒。牠需要適當的照顧和管教，否則之後可能會變得叛逆。"
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
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "猛火" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "煙幕" },
      { "rank": 1, "type": "Fire", "name": "火花" },
      { "rank": 2, "type": "Normal", "name": "鬼面" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Dragon", "name": "龍之怒" },
      { "rank": 2, "type": "Fire", "name": "烈焰濺射" },
      { "rank": 2, "type": "Fire", "name": "火焰旋渦" },
      { "rank": 2, "type": "Fire", "name": "火焰牙" },
      { "rank": 3, "type": "Fire", "name": "煉獄" },
      { "rank": 3, "type": "Fire", "name": "噴射火焰" },
      { "rank": 4, "type": "Dragon", "name": "龍之舞" },
      { "rank": 4, "type": "Fire", "name": "火之誓約" },
      { "rank": 4, "type": "Steel", "name": "金屬爪" }
    ],
    "isNovice": true
  },
  {
    "id": "005",
    "region": "kanto",
    "name": "火恐龍",
    "alias": "Charmeleon",
    "type": [ "Fire" ],
    "info": {
      "image": "images/pokedex/005.png",
      "height": "1.1",
      "weight": "20",
      "category": "火焰寶可夢",
      "text": "牠在進化後會變得具有攻擊性，牠火爆的性格致使牠一直在尋找戰鬥的對手。當情緒變得興奮起來時，牠尾巴末端的火焰會呈現藍白色。"
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
    "ability": [ "猛火" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "煙幕" },
      { "rank": 1, "type": "Fire", "name": "火花" },
      { "rank": 2, "type": "Normal", "name": "鬼面" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Dragon", "name": "龍之怒" },
      { "rank": 2, "type": "Fire", "name": "火焰旋渦" },
      { "rank": 2, "type": "Fire", "name": "烈焰濺射" },
      { "rank": 2, "type": "Fire", "name": "火焰牙" },
      { "rank": 3, "type": "Fire", "name": "煉獄" },
      { "rank": 3, "type": "Fire", "name": "噴射火焰" },
      { "rank": 4, "type": "Dragon", "name": "龍之舞" },
      { "rank": 4, "type": "Fire", "name": "火之誓約" },
      { "rank": 4, "type": "Steel", "name": "金屬爪" }
    ]
  },
  {
    "id": "006",
    "region": "kanto",
    "name": "噴火龍",
    "alias": "Charizard",
    "type": [ "Fire", "Flying" ],
    "info": {
      "image": "images/pokedex/006.png",
      "height": "1.7",
      "weight": "125",
      "category": "火焰寶可夢",
      "text": "噴火龍會為了尋找強大的對手而四處飛翔。牠會宛如能熔解一切的灼熱火焰。然而，牠絕對不會欺負弱小。很少有訓練家能夠應付牠的壞脾氣。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "猛火" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "煙幕" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Fire", "name": "火花" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Normal", "name": "鬼面" },
      { "rank": 2, "type": "Dragon", "name": "龍之怒" },
      { "rank": 2, "type": "Fire", "name": "火焰旋渦" },
      { "rank": 2, "type": "Fire", "name": "烈焰濺射" },
      { "rank": 2, "type": "Fire", "name": "火焰牙" },
      { "rank": 2, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 2, "type": "Flying", "name": "空氣斬" },
      { "rank": 3, "type": "Dragon", "name": "龍爪" },
      { "rank": 3, "type": "Fire", "name": "閃焰衝鋒" },
      { "rank": 3, "type": "Fire", "name": "噴射火焰" },
      { "rank": 3, "type": "Fire", "name": "熱風" },
      { "rank": 3, "type": "Ghost", "name": "暗影爪" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Electric", "name": "雷電拳" },
      { "rank": 4, "type": "Fire", "name": "煉獄" },
      { "rank": 4, "type": "Fire", "name": "爆炸烈焰" }
    ]
  },
  {
    "id": "006-MY",
    "region": "kanto",
    "name": "超級噴火龍Y",
    "alias": "Mega-Charizard Y",
    "type": [ "Fire", "Flying" ],
    "info": {
      "image": "images/pokedex/006-MY.png",
      "height": "1.7",
      "weight": "100",
      "category": "火焰寶可夢",
      "text": "藉著超級石的力量，牠變得更大膽而自信。飛行技巧也變得越來越好，並且擁有更快的速度和更強的機動性。當牠翱翔於天際時，你將無法再直視牠，因為牠身上的火焰燃燒得像太陽一樣明亮。"
    },
    "evolution": {
      "stage": "mega",
    },
    "baseHP": 6,
    "rank": 4,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 4, "max": 8 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "日照" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "煙幕" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Fire", "name": "火花" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Normal", "name": "鬼面" },
      { "rank": 2, "type": "Dragon", "name": "龍之怒" },
      { "rank": 2, "type": "Fire", "name": "火焰旋渦" },
      { "rank": 2, "type": "Fire", "name": "烈焰濺射" },
      { "rank": 2, "type": "Fire", "name": "火焰牙" },
      { "rank": 2, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 2, "type": "Flying", "name": "空氣斬" },
      { "rank": 3, "type": "Dragon", "name": "龍爪" },
      { "rank": 3, "type": "Fire", "name": "閃焰衝鋒" },
      { "rank": 3, "type": "Fire", "name": "噴射火焰" },
      { "rank": 3, "type": "Fire", "name": "熱風" },
      { "rank": 3, "type": "Ghost", "name": "暗影爪" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Electric", "name": "雷電拳" },
      { "rank": 4, "type": "Fire", "name": "煉獄" },
      { "rank": 4, "type": "Fire", "name": "爆炸烈焰" }
    ]
  },
  {
    "id": "006-MX",
    "region": "kanto",
    "name": "超級噴火龍X",
    "alias": "Mega-Charizard X",
    "type": [ "Fire", "Dragon" ],
    "info": {
      "image": "images/pokedex/006-MX.png",
      "height": "1.7",
      "weight": "100",
      "category": "火焰寶可夢",
      "text": "藉著超級石的力量，牠體內的火焰燃燒得如此灼熱，以至於牠的身體變得像煤一樣黑，且藍色的火焰不斷從口中逸出。牠的內心充滿了憤怒，行為舉止更是變得無法預測。"
    },
    "evolution": {
      "stage": "mega",
    },
    "baseHP": 6,
    "rank": 4,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 3, "max": 7 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "硬爪" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "煙幕" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Fire", "name": "火花" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Normal", "name": "鬼面" },
      { "rank": 2, "type": "Dragon", "name": "龍之怒" },
      { "rank": 2, "type": "Fire", "name": "火焰旋渦" },
      { "rank": 2, "type": "Fire", "name": "烈焰濺射" },
      { "rank": 2, "type": "Fire", "name": "火焰牙" },
      { "rank": 2, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 2, "type": "Flying", "name": "空氣斬" },
      { "rank": 3, "type": "Dragon", "name": "龍爪" },
      { "rank": 3, "type": "Fire", "name": "閃焰衝鋒" },
      { "rank": 3, "type": "Fire", "name": "噴射火焰" },
      { "rank": 3, "type": "Fire", "name": "熱風" },
      { "rank": 3, "type": "Ghost", "name": "暗影爪" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Electric", "name": "雷電拳" },
      { "rank": 4, "type": "Fire", "name": "煉獄" },
      { "rank": 4, "type": "Fire", "name": "爆炸烈焰" }
    ]
  },
  {
    "id": "007",
    "region": "kanto",
    "name": "傑尼龜",
    "alias": "Squirtle",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/007.png",
      "height": "0.5",
      "weight": "9",
      "category": "小龜寶可夢",
      "text": "牠在野外相當罕見。牠的甲殼不僅是用來保護自己──還能減少水的阻力，使傑尼龜能夠快速地游泳。牠通常會是一隻穩重且隨和的寶可夢。"
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
    "ability": [ "激流" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Water", "name": "縮入殼中" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "守住" },
      { "rank": 2, "type": "Normal", "name": "高速旋轉" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Water", "name": "水流尾" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 2, "type": "Water", "name": "泡沫" },
      { "rank": 3, "type": "Normal", "name": "火箭頭鎚" },
      { "rank": 3, "type": "Steel", "name": "鐵壁" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 3, "type": "Water", "name": "求雨" },
      { "rank": 4, "type": "Ice", "name": "冰凍之風" },
      { "rank": 4, "type": "Water", "name": "水之誓約" },
      { "rank": 4, "type": "Water", "name": "水流噴射" }
    ],
    "isNovice": true
  },
  {
    "id": "008",
    "region": "kanto",
    "name": "卡咪龜",
    "alias": "Wartortle",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/008.png",
      "height": "1.0",
      "weight": "22.5",
      "category": "龜寶可夢",
      "text": "牠大大地尾巴上長滿蓬鬆的毛髮，顏色會隨著年齡的增長而加深。甲殼上的傷痕是這隻寶可夢強悍的證明。牠同時也是一名優秀的水中獵手。"
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
    "ability": [ "激流" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Water", "name": "縮入殼中" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "守住" },
      { "rank": 2, "type": "Normal", "name": "高速旋轉" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Water", "name": "水流尾" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 2, "type": "Water", "name": "泡沫" },
      { "rank": 3, "type": "Normal", "name": "火箭頭鎚" },
      { "rank": 3, "type": "Steel", "name": "鐵壁" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 3, "type": "Water", "name": "求雨" },
      { "rank": 4, "type": "Ground", "name": "玩泥巴" },
      { "rank": 4, "type": "Ice", "name": "冰凍之風" },
      { "rank": 4, "type": "Water", "name": "水之誓約" }
    ]
  },
  {
    "id": "009",
    "region": "kanto",
    "name": "水箭龜",
    "alias": "Blastoise",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/009.png",
      "height": "1.6",
      "weight": "170",
      "category": "甲殼寶可夢",
      "text": "甲殼上的火箭炮裡發射出的水流有著能將厚重的鐵板貫穿的破壞力。牠對於自己強大的防禦能力和能夠克服一切阻礙的噴射水流充滿自信。"
    },
    "evolution": {
      "stage": "final",
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "激流" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Water", "name": "縮入殼中" },
      { "rank": 2, "type": "Normal", "name": "守住" },
      { "rank": 2, "type": "Normal", "name": "高速旋轉" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Steel", "name": "加農光炮" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 2, "type": "Water", "name": "泡沫" },
      { "rank": 2, "type": "Water", "name": "水流尾" },
      { "rank": 3, "type": "Normal", "name": "火箭頭鎚" },
      { "rank": 3, "type": "Steel", "name": "鐵壁" },
      { "rank": 3, "type": "Water", "name": "求雨" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Electric", "name": "電磁炮" },
      { "rank": 4, "type": "Water", "name": "加農水砲" }
    ]
  },
  {
    "id": "009-M",
    "region": "kanto",
    "name": "超級水箭龜",
    "alias": "Mega-Blastoise",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/009-M.png",
      "height": "1.6",
      "weight": "200",
      "category": "甲殼寶可夢",
      "text": "藉著超級石的力量，牠背上的大砲可以射出甚至能打穿混凝土的爆炸水砲。牠的身體非常強韌，且牠的下盤筋骨能夠承受大砲發射時的衝擊力。"
    },
    "evolution": {
      "stage": "mega",
    },
    "baseHP": 6,
    "rank": 4,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 7 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "超級發射器" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Water", "name": "縮入殼中" },
      { "rank": 2, "type": "Normal", "name": "守住" },
      { "rank": 2, "type": "Normal", "name": "高速旋轉" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Steel", "name": "加農光炮" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 2, "type": "Water", "name": "泡沫" },
      { "rank": 2, "type": "Water", "name": "水流尾" },
      { "rank": 3, "type": "Normal", "name": "火箭頭鎚" },
      { "rank": 3, "type": "Steel", "name": "鐵壁" },
      { "rank": 3, "type": "Water", "name": "求雨" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Electric", "name": "電磁炮" },
      { "rank": 4, "type": "Water", "name": "加農水砲" }
    ]
  },
  {
    "id": "010",
    "region": "kanto",
    "name": "綠毛蟲",
    "alias": "Caterpie",
    "type": [ "Bug" ],
    "info": {
      "image": "images/pokedex/010.png",
      "height": "0.3",
      "weight": "3",
      "category": "蟲寶寶寶可夢",
      "text": "這種寶可夢在森林中十分常見。牠的食慾很強，轉眼間就能吃掉比自己身體還要大的葉子。如果牠感受到威脅，就會從觸角釋放出強烈的臭氣。"
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
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "鱗粉" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Bug", "name": "吐絲" },
      { "rank": 1, "type": "Bug", "name": "蟲咬" },
      { "rank": 2, "type": "Electric", "name": "電網" }
    ],
    "isNovice": true
  },
  {
    "id": "011",
    "region": "kanto",
    "name": "鐵甲蛹",
    "alias": "Metapod",
    "type": [ "Bug" ],
    "info": {
      "image": "images/pokedex/011.png",
      "height": "0.7",
      "weight": "10",
      "category": "蛹寶可夢",
      "text": "包裹身體的外殼像鐵板一般堅硬。鐵甲蛹之所以不怎麼動，是因為殼裡面的柔軟身體正在為進化做準備。牠以身為世界上進化最快的寶可夢之一而聞名。"
    },
    "evolution": {
      "stage": "second",
      "time": "fast"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "蛻皮" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變硬" },
      { "rank": 2, "type": "Electric", "name": "電網" },
      { "rank": 2, "type": "Steel", "name": "鐵壁" }
    ],
    "isNovice": true
  },
  {
    "id": "012",
    "region": "kanto",
    "name": "巴大蝶",
    "alias": "Butterfree",
    "type": [ "Bug", "Flying" ],
    "info": {
      "image": "images/pokedex/012.png",
      "height": "1.1",
      "weight": "32",
      "category": "蝴蝶寶可夢",
      "text": "可以在森林和平原找到牠的蹤跡。牠最喜歡吃花蜜，即使只靠微量的花粉就能夠找出花圃所在的位置。翅膀上佈滿的鳞粉讓牠們即使在下雨時也能自在飛翔。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "複眼" ],
    "moves": [
      { "rank": 0, "type": "Flying", "name": "起風" },
      { "rank": 0, "type": "Psychic", "name": "念力" },
      { "rank": 1, "type": "Grass", "name": "催眠粉" },
      { "rank": 1, "type": "Grass", "name": "麻痺粉" },
      { "rank": 1, "type": "Poison", "name": "毒粉" },
      { "rank": 2, "type": "Normal", "name": "誘惑" },
      { "rank": 2, "type": "Normal", "name": "超音波" },
      { "rank": 2, "type": "Normal", "name": "吹飛" },
      { "rank": 2, "type": "Bug", "name": "憤怒粉" },
      { "rank": 2, "type": "Bug", "name": "銀色旋風" },
      { "rank": 2, "type": "Flying", "name": "順風" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 3, "type": "Normal", "name": "神秘守護" },
      { "rank": 3, "type": "Bug", "name": "蝶舞" },
      { "rank": 3, "type": "Electric", "name": "電網" },
      { "rank": 3, "type": "Flying", "name": "空氣斬" },
      { "rank": 4, "type": "Bug", "name": "信號光束" },
      { "rank": 4, "type": "Bug", "name": "蟲鳴" },
      { "rank": 4, "type": "Ghost", "name": "惡夢" }
    ]
  },
  {
    "id": "013",
    "region": "kanto",
    "name": "獨角蟲",
    "alias": "Weedle",
    "type": [ "Bug", "Poison" ],
    "info": {
      "image": "images/pokedex/013.png",
      "height": "0.3",
      "weight": "3",
      "category": "毛毛蟲寶可夢",
      "text": "常見於森林中吃著大片的葉子。牠的頭上有一根尖銳的毒針能用於保護自己。牠有著非常靈敏的嗅覺可以尋找食物，鮮豔的體色能用來警戒掠食者。"
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
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "鱗粉" ],
    "moves": [
      { "rank": 0, "type": "Bug", "name": "吐絲" },
      { "rank": 0, "type": "Poison", "name": "毒針" },
      { "rank": 1, "type": "Bug", "name": "蟲咬" },
      { "rank": 2, "type": "Electric", "name": "電網" }
    ],
    "isNovice": true
  },
  {
    "id": "014",
    "region": "kanto",
    "name": "鐵殼蛹",
    "alias": "Kakuna",
    "type": [ "Bug", "Poison" ],
    "info": {
      "image": "images/pokedex/014.png",
      "height": "0.6",
      "weight": "10",
      "category": "蛹寶可夢",
      "text": "牠掛在樹上的期間幾乎一動也不動。在蛹的內部，牠會藉著提高蛹殼的溫度來為進化做準備。小心那些會牠們附近徘迴的大針蜂。"
    },
    "evolution": {
      "stage": "second",
      "time": "fast"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "蛻皮" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變硬" },
      { "rank": 2, "type": "Electric", "name": "電網" },
      { "rank": 2, "type": "Steel", "name": "鐵壁" }
    ],
    "isNovice": true
  },
  {
    "id": "015",
    "region": "kanto",
    "name": "大針蜂",
    "alias": "Beedrill",
    "type": [ "Bug", "Poison" ],
    "info": {
      "image": "images/pokedex/015.png",
      "height": "1.0",
      "weight": "30",
      "category": "毒蜂寶可夢",
      "text": "大大針蜂非常重視自己的地盤，為了安全起見，最好不要接近牠的住處。一旦生氣就會成群結隊襲擊而來。牠有著三根毒針，尾巴上針刺所分泌的毒性最為強大。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "蟲之預感" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "亂擊" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Bug", "name": "雙針" },
      { "rank": 2, "type": "Normal", "name": "憤怒" },
      { "rank": 2, "type": "Bug", "name": "飛彈針" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Poison", "name": "毒液衝擊" },
      { "rank": 2, "type": "Poison", "name": "毒菱" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Bug", "name": "致命針刺" },
      { "rank": 3, "type": "Dark", "name": "惡意追擊" },
      { "rank": 3, "type": "Ghost", "name": "奇異之風" },
      { "rank": 3, "type": "Poison", "name": "毒擊" },
      { "rank": 4, "type": "Normal", "name": "蠻幹" },
      { "rank": 4, "type": "Flying", "name": "順風" },
      { "rank": 4, "type": "Ground", "name": "直衝鑽" }
    ]
  },
  {
    "id": "015-M",
    "region": "kanto",
    "name": "超級大針蜂",
    "alias": "Beedrill",
    "type": [ "Bug", "Poison" ],
    "info": {
      "image": "images/pokedex/015-M.png",
      "height": "1.4",
      "weight": "40",
      "category": "毒蜂寶可夢",
      "text": "藉著超級石的力量，牠的四肢都變成了威力強大的毒針。牠們會先用手腳的針猛刺一通，然後用臀部的毒針給予致命一擊。"
    },
    "evolution": {
      "stage": "mega"
    },
    "baseHP": 6,
    "rank": 3,
    "attr": {
      "str": { "value": 4, "max": 8 },
      "dex": { "value": 4, "max": 8 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 1, "max": 2 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "適應力" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "亂擊" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Bug", "name": "雙針" },
      { "rank": 2, "type": "Normal", "name": "憤怒" },
      { "rank": 2, "type": "Bug", "name": "飛彈針" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Poison", "name": "毒液衝擊" },
      { "rank": 2, "type": "Poison", "name": "毒菱" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Bug", "name": "致命針刺" },
      { "rank": 3, "type": "Dark", "name": "惡意追擊" },
      { "rank": 3, "type": "Ghost", "name": "奇異之風" },
      { "rank": 3, "type": "Poison", "name": "毒擊" },
      { "rank": 4, "type": "Normal", "name": "蠻幹" },
      { "rank": 4, "type": "Flying", "name": "順風" },
      { "rank": 4, "type": "Ground", "name": "直衝鑽" }
    ]
  },
  {
    "id": "016",
    "region": "kanto",
    "name": "波波",
    "alias": "Pidgey",
    "type": [ "Normal", "Flying" ],
    "info": {
      "image": "images/pokedex/016.png",
      "height": "0.3",
      "weight": "2",
      "category": "小鳥寶可夢",
      "text": "牠在世界各地都相當常見，牠喜歡棲息在森林中，但在城市和平原中也能夠發現牠的蹤跡。牠的個性溫順，往往會主動避開麻煩。牠會用力拍打翅膀激起沙塵，誘使獵物離開藏身處。"
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
    "ability": [ "銳利目光", "蹣跚" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Dragon", "name": "龍捲風" },
      { "rank": 1, "type": "Flying", "name": "起風" },
      { "rank": 2, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Normal", "name": "吹飛" },
      { "rank": 2, "type": "Flying", "name": "鸚鵡學舌" },
      { "rank": 2, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 2, "type": "Flying", "name": "羽毛舞" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Flying", "name": "暴風" },
      { "rank": 3, "type": "Flying", "name": "羽棲" },
      { "rank": 3, "type": "Flying", "name": "空氣斬" },
      { "rank": 3, "type": "Flying", "name": "順風" },
      { "rank": 4, "type": "Normal", "name": "吵鬧" },
      { "rank": 4, "type": "Dark", "name": "出奇一擊" },
      { "rank": 4, "type": "Steel", "name": "鋼翼" }
    ],
    "isNovice": true
  },
  {
    "id": "017",
    "region": "kanto",
    "name": "比比鳥",
    "alias": "Pidgeotto",
    "type": [ "Normal", "Flying" ],
    "info": {
      "image": "images/pokedex/017.png",
      "height": "1.1",
      "weight": "30",
      "category": "鳥寶可夢",
      "text": "每一隻比比鳥都會佔領一大片草原區域當作自己的領土。這種寶可夢會飛在空中巡視自己廣大的地盤，並用利爪狠狠教訓任何入侵者。牠會為了挑戰自己而試著每天飛得更高一些。"
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
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "銳利目光", "蹣跚" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Dragon", "name": "龍捲風" },
      { "rank": 1, "type": "Flying", "name": "起風" },
      { "rank": 2, "type": "Normal", "name": "吹飛" },
      { "rank": 2, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Flying", "name": "鸚鵡學舌" },
      { "rank": 2, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 2, "type": "Flying", "name": "羽毛舞" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Dark", "name": "出奇一擊" },
      { "rank": 3, "type": "Flying", "name": "空氣斬" },
      { "rank": 3, "type": "Flying", "name": "羽棲" },
      { "rank": 3, "type": "Flying", "name": "順風" },
      { "rank": 4, "type": "Normal", "name": "吵鬧" },
      { "rank": 4, "type": "Flying", "name": "暴風" },
      { "rank": 4, "type": "Steel", "name": "鋼翼" }
    ]
  },
  {
    "id": "018",
    "region": "kanto",
    "name": "大比鳥",
    "alias": "Pidgeot",
    "type": [ "Normal", "Flying" ],
    "info": {
      "image": "images/pokedex/018.png",
      "height": "1.5",
      "weight": "80",
      "category": "鳥寶可夢",
      "text": "這隻寶可夢的翅膀是由美麗光滑的羽毛組成的。大比鳥是出色的獵人，具有發達的翅膀肌肉，強壯到只需輕輕拍動幾下翅膀就能搧起巨大的風勢。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "銳利目光", "蹣跚" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Dragon", "name": "龍捲風" },
      { "rank": 1, "type": "Flying", "name": "起風" },
      { "rank": 2, "type": "Normal", "name": "吹飛" },
      { "rank": 2, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 2, "type": "Flying", "name": "羽毛舞" },
      { "rank": 2, "type": "Flying", "name": "鸚鵡學舌" },
      { "rank": 2, "type": "Ghost", "name": "奇異之風" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Flying", "name": "羽棲" },
      { "rank": 3, "type": "Flying", "name": "順風" },
      { "rank": 4, "type": "Fire", "name": "熱風" },
      { "rank": 4, "type": "Flying", "name": "暴風" },
      { "rank": 4, "type": "Psychic", "name": "反射壁" }
    ]
  },
  {
    "id": "018-M",
    "region": "kanto",
    "name": "超級大比鳥",
    "alias": "Pidgeot",
    "type": [ "Normal", "Flying" ],
    "info": {
      "image": "images/pokedex/018-M.png",
      "height": "2.2",
      "weight": "100",
      "category": "鳥寶可夢",
      "text": "藉著超級石的力量，大比鳥在飛行時將因為高速而化作天空中一道模糊的紅色軌跡。在這種狀態下，牠不會停止翱翔天際，且可以持續好幾天不眠不休而不會感到疲累。"
    },
    "evolution": {
      "stage": "mega"
    },
    "baseHP": 6,
    "rank": 4,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 7 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 7 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "無防守" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Dragon", "name": "龍捲風" },
      { "rank": 1, "type": "Flying", "name": "起風" },
      { "rank": 2, "type": "Normal", "name": "吹飛" },
      { "rank": 2, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 2, "type": "Flying", "name": "羽毛舞" },
      { "rank": 2, "type": "Flying", "name": "鸚鵡學舌" },
      { "rank": 2, "type": "Ghost", "name": "奇異之風" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Flying", "name": "羽棲" },
      { "rank": 3, "type": "Flying", "name": "順風" },
      { "rank": 4, "type": "Fire", "name": "熱風" },
      { "rank": 4, "type": "Flying", "name": "暴風" },
      { "rank": 4, "type": "Psychic", "name": "反射壁" }
    ]
  },
  {
    "id": "019",
    "region": "kanto",
    "name": "小拉達",
    "alias": "Rattata",
    "type": [ "Normal" ],
    "info": {
      "image": "images/pokedex/019.png",
      "height": "0.3",
      "weight": "3",
      "category": "鼠寶可夢",
      "text": "牠可以生活在任何能夠找到食物的地方，但特別常見於城市和田野中。牠們會在洞穴中組成大家庭。由於經常被捕食，因此小拉達總是保持警戒，逃跑迅速。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
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
    "ability": [ "逃跑", "毅力" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Normal", "name": "必殺門牙" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Normal", "name": "蠻幹" },
      { "rank": 3, "type": "Normal", "name": "憤怒門牙" },
      { "rank": 3, "type": "Dark", "name": "咬碎" },
      { "rank": 4, "type": "Normal", "name": "刺耳聲" },
      { "rank": 4, "type": "Fire", "name": "火焰輪" },
      { "rank": 4, "type": "Steel", "name": "鐵尾" }
    ],
    "isNovice": true
  },
  {
    "id": "020",
    "region": "kanto",
    "name": "拉達",
    "alias": "Raticate",
    "type": [ "Normal" ],
    "info": {
      "image": "images/pokedex/020.png",
      "height": "0.7",
      "weight": "18",
      "category": "鼠寶可夢",
      "text": "拉達堅硬的門牙長得很塊。為了磨平不斷生長的門牙，牠有著啃咬堅硬東西的習性。甚至連房屋的牆壁也會變成牠的啃咬對象。牠有著防水的皮毛和蹼足，且善於游泳。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "逃跑", "毅力" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Normal", "name": "鬼面" },
      { "rank": 2, "type": "Normal", "name": "必殺門牙" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Fire", "name": "火焰輪" },
      { "rank": 3, "type": "Normal", "name": "憤怒門牙" },
      { "rank": 3, "type": "Normal", "name": "蠻幹" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Dark", "name": "咬碎" },
      { "rank": 4, "type": "Normal", "name": "劍舞" },
      { "rank": 4, "type": "Normal", "name": "珍藏" },
      { "rank": 4, "type": "Fight", "name": "搏命" }
    ]
  },
  {
    "id": "019-A",
    "region": "alola",
    "name": "小拉達 (阿羅拉的樣子)",
    "alias": "Rattata",
    "type": [ "Dark", "Normal" ],
    "info": {
      "image": "images/pokedex/019-A.png",
      "height": "0.3",
      "weight": "3",
      "category": "鼠寶可夢",
      "text": "小拉達一開始是透過貨船來到阿羅拉的，牠們繁衍興盛，幾乎摧毀了該地區的生態系統。試圖滅絕這種寶可夢要比滅絕牠們原本的同族更加困難。"
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
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
    "ability": [ "貪吃鬼", "活力" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Normal", "name": "必殺門牙" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Normal", "name": "蠻幹" },
      { "rank": 3, "type": "Normal", "name": "憤怒門牙" },
      { "rank": 3, "type": "Dark", "name": "咬碎" },
      { "rank": 4, "type": "Dark", "name": "搶奪" },
      { "rank": 4, "type": "Dark", "name": "掉包" },
      { "rank": 4, "type": "Fight", "name": "起死回生" }
    ],
    "isNovice": true
  },
  {
    "id": "020-A",
    "region": "alola",
    "name": "拉達 (阿羅拉的樣子)",
    "alias": "Raticate",
    "type": [ "Dark", "Normal" ],
    "info": {
      "image": "images/pokedex/020-A.png",
      "height": "0.7",
      "weight": "25",
      "category": "鼠寶可夢",
      "text": "阿羅拉地區的拉達每天晚上都會命令牠們手下的小拉達幫自己帶來食物。五星級餐廳經常必須對抗這些棲息在餐廳附近的貪婪寶可夢。"
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
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "活力", "厚脂肪" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Normal", "name": "鬼面" },
      { "rank": 2, "type": "Normal", "name": "必殺門牙" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 3, "type": "Normal", "name": "憤怒門牙" },
      { "rank": 3, "type": "Normal", "name": "蠻幹" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Normal", "name": "劍舞" },
      { "rank": 3, "type": "Dark", "name": "咬碎" },
      { "rank": 4, "type": "Normal", "name": "蓄力" },
      { "rank": 4, "type": "Normal", "name": "吞下" },
      { "rank": 4, "type": "Normal", "name": "搶先一步" }
    ]
  },
  {
    "id": "021",
    "region": "kanto",
    "name": "烈雀",
    "alias": "Spearow",
    "type": [ "Normal", "Flying" ],
    "info": {
      "image": "images/pokedex/021.png",
      "height": "0.3",
      "weight": "2",
      "category": "小鳥寶可夢",
      "text": "Lives  in  flocks  on  grasslands.  Very protective of its territory. It flaps its short wings to dart around at high speed.  It  is  a  little  short-tempered - if disturbed, it will shriek, calling its flock for aid. "
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "銳利目光" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 1, "type": "Normal", "name": "亂擊" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 2, "type": "Normal", "name": "聚氣" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Flying", "name": "燕返" },
      { "rank": 2, "type": "Flying", "name": "鸚鵡學舌" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Flying", "name": "啄鑽" },
      { "rank": 3, "type": "Flying", "name": "羽棲" },
      { "rank": 4, "type": "Normal", "name": "鬼面" },
      { "rank": 4, "type": "Flying", "name": "羽毛舞" },
      { "rank": 4, "type": "Flying", "name": "順風" }
    ],
    "isNovice": true
  },
  {
    "id": "022",
    "region": "kanto",
    "name": "大嘴雀",
    "alias": "Fearow",
    "type": [ "Normal", "Flying" ],
    "info": {
      "image": "images/pokedex/022.png",
      "height": "1.2",
      "weight": "40",
      "category": "鳥嘴寶可夢",
      "text": "Fearrows  soar  around  wastelands and fields. It has the stamina to fly all  day.  It  is  easily  annoyed  and  ill tempered. It attacks using its sharp beak to peck and pierce the foes."
    },
    "evolution": {
      "stage": "final"
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
    "ability": [ "銳利目光" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 1, "type": "Normal", "name": "亂擊" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 2, "type": "Normal", "name": "聚氣" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Flying", "name": "啄食" },
      { "rank": 2, "type": "Flying", "name": "燕返" },
      { "rank": 2, "type": "Flying", "name": "鸚鵡學舌" },
      { "rank": 2, "type": "Ground", "name": "直衝鑽" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Flying", "name": "羽棲" },
      { "rank": 3, "type": "Flying", "name": "啄鑽" },
      { "rank": 4, "type": "Normal", "name": "鬼面" },
      { "rank": 4, "type": "Flying", "name": "神鳥猛擊" },
      { "rank": 4, "type": "Ghost", "name": "詛咒" }
    ]
  },
  {
    "id": "023",
    "region": "kanto",
    "name": "阿柏蛇",
    "alias": "Ekans",
    "type": [ "Poison" ],
    "info": {
      "image": "images/pokedex/023.png",
      "height": "2.0",
      "weight": "20",
      "category": "蛇寶可夢",
      "text": "Lives  on  grasslands.  Preys  on  Rattatas and Pokémon Eggs it finds. It’s jaw can detach itself to swallow any  prey  whole.  It  coils  and  sleeps after eating.  Ekans grow bigger with  age."
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
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "威嚇", "蛻皮" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Normal", "name": "緊束" },
      { "rank": 1, "type": "Normal", "name": "大蛇瞪眼" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Poison", "name": "毒針" },
      { "rank": 2, "type": "Normal", "name": "吞下" },
      { "rank": 2, "type": "Normal", "name": "蓄力" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Normal", "name": "噴出" },
      { "rank": 2, "type": "Ground", "name": "泥巴炸彈" },
      { "rank": 2, "type": "Poison", "name": "酸液炸彈" },
      { "rank": 2, "type": "Poison", "name": "溶解液" },
      { "rank": 3, "type": "Ice", "name": "黑霧" },
      { "rank": 3, "type": "Poison", "name": "盤蜷" },
      { "rank": 3, "type": "Poison", "name": "打嗝" },
      { "rank": 3, "type": "Poison", "name": "垃圾射擊" },
      { "rank": 3, "type": "Poison", "name": "胃液" },
      { "rank": 4, "type": "Normal", "name": "定身法" },
      { "rank": 4, "type": "Normal", "name": "鬼面" },
      { "rank": 4, "type": "Water", "name": "水流尾" }
    ],
    "isNovice": true
  },
  {
    "id": "024",
    "region": "kanto",
    "name": "阿柏怪",
    "alias": "Arbok",
    "type": [ "Poison" ],
    "info": {
      "image": "images/pokedex/024.png",
      "height": "3.5",
      "weight": "65",
      "category": "眼鏡蛇寶可夢",
      "text": "This  Pokémon  has  an  incredibly strong  constricting  power.  Once it  wraps  its  body  around  its  foe,  escaping  is  almost  impossible.  The pattern  on  its  body  glows  in  the dark like a terrifying face."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "威嚇", "蛻皮" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "緊束" },
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Normal", "name": "大蛇瞪眼" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Poison", "name": "毒針" },
      { "rank": 2, "type": "Normal", "name": "吞下" },
      { "rank": 2, "type": "Normal", "name": "蓄力" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Normal", "name": "噴出" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 2, "type": "Electric", "name": "雷電牙" },
      { "rank": 2, "type": "Fire", "name": "火焰牙" },
      { "rank": 2, "type": "Ground", "name": "泥巴炸彈" },
      { "rank": 2, "type": "Ice", "name": "冰凍牙" },
      { "rank": 2, "type": "Poison", "name": "酸液炸彈" },
      { "rank": 2, "type": "Poison", "name": "溶解液" },
      { "rank": 3, "type": "Ghost", "name": "怨恨" },
      { "rank": 3, "type": "Ice", "name": "黑霧" },
      { "rank": 3, "type": "Poison", "name": "盤蜷" },
      { "rank": 3, "type": "Poison", "name": "打嗝" },
      { "rank": 3, "type": "Poison", "name": "垃圾射擊" },
      { "rank": 3, "type": "Poison", "name": "胃液" },
      { "rank": 4, "type": "Steel", "name": "鐵尾" },
      { "rank": 4, "type": "Water", "name": "水流尾" }
    ]
  },
  {
    "id": "025",
    "region": "kanto",
    "name": "皮卡丘",
    "alias": "Pikachu",
    "type": [ "Electric" ],
    "info": {
      "image": "images/pokedex/025.png",
      "height": "0.4",
      "weight": "6",
      "category": "鼠寶可夢",
      "text": "Lives  in  small  groups  in  forests  but  they tend to stay hidden. It stores electricity in the electric sacs on its cheeks and uses its tail to ground the  excess  charge.  They  can  be stubborn and wary of strangers."
    },
    "evolution": {
      "stage": "second",
      "with": "雷之石"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "靜電", "避雷針" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Electric", "name": "電擊" },
      { "rank": 1, "type": "Normal", "name": "和睦相處" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Electric", "name": "電磁波" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 2, "type": "Normal", "name": "影子分身" },
      { "rank": 2, "type": "Normal", "name": "佯攻" },
      { "rank": 2, "type": "Electric", "name": "十萬伏特" },
      { "rank": 2, "type": "Electric", "name": "電光" },
      { "rank": 2, "type": "Electric", "name": "蹭蹭臉頰" },
      { "rank": 2, "type": "Electric", "name": "電球" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Electric", "name": "瘋狂伏特" },
      { "rank": 3, "type": "Electric", "name": "打雷" },
      { "rank": 3, "type": "Electric", "name": "放電" },
      { "rank": 3, "type": "Psychic", "name": "光牆" },
      { "rank": 4, "type": "Normal", "name": "神速" },
      { "rank": 4, "type": "Electric", "name": "伏特攻擊" },
      { "rank": 4, "type": "Water", "name": "衝浪" }
    ],
    "isNovice": true
  },
  {
    "id": "026",
    "region": "kanto",
    "name": "雷丘",
    "alias": "Raichu",
    "type": [ "Electric" ],
    "info": {
      "image": "images/pokedex/026.png",
      "height": "0.8",
      "weight": "30",
      "category": "鼠寶可夢",
      "text": "When electricity builds on its body, it  starts  to  emit  a  faint  glow  and  it becomes more aggressive than it normally  is.  They  live  in  forests  but are rare to find in the wild."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "靜電", "避雷針" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Electric", "name": "電擊" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Electric", "name": "十萬伏特" },
      { "rank": 3, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 4, "type": "Normal", "name": "祈願" },
      { "rank": 4, "type": "Electric", "name": "伏特攻擊" }
    ]
  },
  {
    "id": "026-A",
    "region": "alola",
    "name": "雷丘 (阿羅拉的樣子)",
    "alias": "Raichu",
    "type": [ "Electric", "Psychic" ],
    "info": {
      "image": "images/pokedex/026-A.png",
      "height": "0.7",
      "weight": "21",
      "category": "鼠寶可夢",
      "text": "Scientists were baffled to discover Raichu’s evolution in the Alola Region. There is no explanation as to how it  gained  Psychic  abilities,  but  diet seems  to  be  factor.  It  loves  sweet food and pancakes."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "衝浪之尾" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Electric", "name": "電擊" },
      { "rank": 2, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Electric", "name": "十萬伏特" },
      { "rank": 2, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 3, "type": "Electric", "name": "電氣場地" },
      { "rank": 4, "type": "Normal", "name": "祈願" },
      { "rank": 4, "type": "Electric", "name": "伏特攻擊" }
    ]
  },
  {
    "id": "027",
    "region": "kanto",
    "name": "穿山鼠",
    "alias": "Sandshrew",
    "type": [ "Ground" ],
    "info": {
      "image": "images/pokedex/027.png",
      "height": "0.6",
      "weight": "12",
      "category": "鼠寶可夢",
      "text": "They  usually  hide  burrowed  under caves  and  grasslands.  A  few  have been sighted living in the desert.They are shy by nature - they dig and  curl  in  a  ball  when  facing  a threat. "
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
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "沙隱", "撥沙" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變圓" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Poison", "name": "毒針" },
      { "rank": 1, "type": "Rock", "name": "滾動" },
      { "rank": 2, "type": "Normal", "name": "亂抓" },
      { "rank": 2, "type": "Normal", "name": "高速旋轉" },
      { "rank": 2, "type": "Normal", "name": "高速星星" },
      { "rank": 2, "type": "Bug", "name": "連斬" },
      { "rank": 2, "type": "Ground", "name": "挖洞" },
      { "rank": 2, "type": "Ground", "name": "流沙地獄" },
      { "rank": 2, "type": "Ground", "name": "震級" },
      { "rank": 3, "type": "Normal", "name": "劍舞" },
      { "rank": 3, "type": "Normal", "name": "劈開" },
      { "rank": 3, "type": "Ground", "name": "地震" },
      { "rank": 3, "type": "Rock", "name": "沙暴" },
      { "rank": 3, "type": "Steel", "name": "陀螺球" },
      { "rank": 4, "type": "Ground", "name": "重踏" },
      { "rank": 4, "type": "Rock", "name": "隱形岩" },
      { "rank": 4, "type": "Steel", "name": "金屬爪" }
    ],
    "isNovice": true
  },
  {
    "id": "028",
    "region": "kanto",
    "name": "穿山王",
    "alias": "Sandslash",
    "type": [ "Ground" ],
    "info": {
      "image": "images/pokedex/028.png",
      "height": "1.0",
      "weight": "45",
      "category": "鼠寶可夢",
      "text": "It’s  less  shy  than  its  first  stage.   It curls  up  in  a  ball  to  protect  itself from enemy attacks. Surprisingly, it is a good climber that uses its sharp claws  for  grip  and  drilling  tunnels underground.  "
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
    "ability": [ "沙隱", "撥沙" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變圓" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Poison", "name": "毒針" },
      { "rank": 1, "type": "Rock", "name": "滾動" },
      { "rank": 2, "type": "Normal", "name": "亂抓" },
      { "rank": 2, "type": "Normal", "name": "高速旋轉" },
      { "rank": 2, "type": "Normal", "name": "撕裂爪" },
      { "rank": 2, "type": "Normal", "name": "高速星星" },
      { "rank": 2, "type": "Bug", "name": "連斬" },
      { "rank": 2, "type": "Ground", "name": "流沙地獄" },
      { "rank": 2, "type": "Ground", "name": "挖洞" },
      { "rank": 2, "type": "Ground", "name": "震級" },
      { "rank": 3, "type": "Normal", "name": "劍舞" },
      { "rank": 3, "type": "Normal", "name": "劈開" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Ground", "name": "地震" },
      { "rank": 3, "type": "Rock", "name": "沙暴" },
      { "rank": 3, "type": "Steel", "name": "陀螺球" },
      { "rank": 4, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 4, "type": "Rock", "name": "隱形岩" }
    ]
  },
  {
    "id": "027-A",
    "region": "alola",
    "name": "穿山鼠 (阿羅拉的樣子)",
    "alias": "Sandshrew",
    "type": [ "Ice", "Steel" ],
    "info": {
      "image": "images/pokedex/027-A.png",
      "height": "0.7",
      "weight": "40",
      "category": "鼠寶可夢",
      "text": "Sandshrew who became trapped in the merciless cold weather of Alola had to change their types to survive. They  now  depend  on  snow  to  roll around, without it they are unable to curl up into a ball."
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
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 1, "max": 2 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "雪隱", "撥雪" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變圓" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "忍耐" },
      { "rank": 1, "type": "Ice", "name": "細雪" },
      { "rank": 2, "type": "Normal", "name": "亂抓" },
      { "rank": 2, "type": "Normal", "name": "高速旋轉" },
      { "rank": 2, "type": "Normal", "name": "高速星星" },
      { "rank": 2, "type": "Bug", "name": "連斬" },
      { "rank": 2, "type": "Ice", "name": "冰球" },
      { "rank": 2, "type": "Steel", "name": "鐵壁" },
      { "rank": 2, "type": "Steel", "name": "金屬爪" },
      { "rank": 3, "type": "Normal", "name": "劍舞" },
      { "rank": 3, "type": "Normal", "name": "劈開" },
      { "rank": 3, "type": "Ice", "name": "暴風雪" },
      { "rank": 3, "type": "Ice", "name": "冰雹" },
      { "rank": 3, "type": "Steel", "name": "陀螺球" },
      { "rank": 3, "type": "Steel", "name": "鐵頭" },
      { "rank": 4, "type": "Normal", "name": "逐步擊破" },
      { "rank": 4, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 4, "type": "Flying", "name": "燕返" }
    ],
    "isNovice": true
  },
  {
    "id": "028-A",
    "region": "alola",
    "name": "穿山王 (阿羅拉的樣子)",
    "alias": "Sandslash",
    "type": [ "Ice", "Steel" ],
    "info": {
      "image": "images/pokedex/028-A.png",
      "height": "1.2",
      "weight": "55",
      "category": "鼠寶可夢",
      "text": "These Pokémon make their burrows  on  Alola’s  ice  caverns,  hidden  in plain  sight.  Careful  with  its  spikes, any puncture into the skin and you can get severe frostbite. They can’t stand high temperatures."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 3, "max": 7 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "雪隱", "撥雪" ],
    "moves": [
      { "rank": 0, "type": "Ice", "name": "冰錐" },
      { "rank": 1, "type": "Steel", "name": "金屬爆炸" },
      { "rank": 2, "type": "Normal", "name": "變圓" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Ice", "name": "冰柱墜擊" },
      { "rank": 2, "type": "Ice", "name": "冰球" },
      { "rank": 3, "type": "Normal", "name": "逐步擊破" },
      { "rank": 3, "type": "Steel", "name": "金屬爪" },
      { "rank": 4, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 4, "type": "Ice", "name": "極光幕" },
    ]
  },
  {
    "id": "029",
    "region": "kanto",
    "name": "尼多蘭",
    "alias": "Nidoran-f",
    "type": [ "Poison" ],
    "info": {
      "image": "images/pokedex/029.png",
      "height": "0.4",
      "weight": "7",
      "category": "毒針寶可夢",
      "text": "A female only species. It lives close to  meadows  and  forests.  They are  mellow  Pokémon.  To  protect  herself,  she  secretes  a  powerful toxin through her body. Her horn is small but venomus to the touch."
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
    "ability": [ "毒刺", "鬥爭心" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Fight", "name": "二連踢" },
      { "rank": 1, "type": "Poison", "name": "毒針" },
      { "rank": 2, "type": "Normal", "name": "幫助" },
      { "rank": 2, "type": "Normal", "name": "亂抓" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Poison", "name": "劇毒牙" },
      { "rank": 2, "type": "Poison", "name": "毒菱" },
      { "rank": 3, "type": "Normal", "name": "誘惑" },
      { "rank": 3, "type": "Dark", "name": "咬碎" },
      { "rank": 3, "type": "Dark", "name": "吹捧" },
      { "rank": 4, "type": "Normal", "name": "惡魔之吻" },
      { "rank": 4, "type": "Fairy", "name": "撒嬌" },
      { "rank": 4, "type": "Fairy", "name": "月光" }
    ],
    "isNovice": true
  },
  {
    "id": "030",
    "region": "kanto",
    "name": "尼多娜",
    "alias": "Nidorina",
    "type": [ "Poison" ],
    "info": {
      "image": "images/pokedex/030.png",
      "height": "0.8",
      "weight": "20",
      "category": "毒針寶可夢",
      "text": "Nidorinas  are  jealous  creatures. They don’t like other females near their  mates.  Otherwise,  they  are very  social  creatures.  When  it’s around  friends  or  family,  its  barbs are tucked away to prevent injury."
    },
    "evolution": {
      "stage": "second",
      "with": "月之石"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "毒刺", "鬥爭心" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Fight", "name": "二連踢" },
      { "rank": 1, "type": "Poison", "name": "毒針" },
      { "rank": 2, "type": "Normal", "name": "幫助" },
      { "rank": 2, "type": "Normal", "name": "亂抓" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Poison", "name": "劇毒牙" },
      { "rank": 2, "type": "Poison", "name": "毒菱" },
      { "rank": 3, "type": "Normal", "name": "誘惑" },
      { "rank": 3, "type": "Dark", "name": "咬碎" },
      { "rank": 3, "type": "Dark", "name": "吹捧" },
      { "rank": 4, "type": "Normal", "name": "惡魔之吻" },
      { "rank": 4, "type": "Fairy", "name": "撒嬌" },
      { "rank": 4, "type": "Fairy", "name": "月光" }
    ]
  },
  {
    "id": "031",
    "region": "kanto",
    "name": "尼多后",
    "alias": "Nidoqueen",
    "type": [ "Poison", "Ground" ],
    "info": {
      "image": "images/pokedex/031.png",
      "height": "1.3",
      "weight": "60",
      "category": "鑽錐寶可夢",
      "text": "Motherly by nature, it uses its scaly rugged body to seal the entrance of  its  nest  and  protect  its  young from  predators.  There  are  records of  angry  Nidoqueens  sending  people flying with a single tackle.  "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "毒刺", "鬥爭心" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Fight", "name": "二連踢" },
      { "rank": 2, "type": "Normal", "name": "逐步擊破" },
      { "rank": 2, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 2, "type": "Poison", "name": "毒針" },
      { "rank": 3, "type": "Electric", "name": "電擊波" },
      { "rank": 3, "type": "Ground", "name": "大地之力" },
      { "rank": 3, "type": "Poison", "name": "毒尾" },
      { "rank": 4, "type": "Fight", "name": "蠻力" },
      { "rank": 4, "type": "Ice", "name": "冰凍之風" }
    ]
  },
  {
    "id": "032",
    "region": "kanto",
    "name": "尼多朗",
    "alias": "Nidoran-m",
    "type": [ "Poison" ],
    "info": {
      "image": "images/pokedex/032.png",
      "height": "0.5",
      "weight": "9",
      "category": "毒針寶可夢",
      "text": "The  male  Nidoran  has  developed a  great  alertness  to  sounds.  Its small body is covered in spikes that are drenched in venom when he’s threatened. He will defend his mate and home fiercely. "
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
    "ability": [ "毒刺", "鬥爭心" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Fight", "name": "二連踢" },
      { "rank": 1, "type": "Poison", "name": "毒針" },
      { "rank": 2, "type": "Normal", "name": "幫助" },
      { "rank": 2, "type": "Normal", "name": "亂擊" },
      { "rank": 2, "type": "Normal", "name": "角撞" },
      { "rank": 2, "type": "Poison", "name": "毒擊" },
      { "rank": 2, "type": "Poison", "name": "毒菱" },
      { "rank": 3, "type": "Normal", "name": "誘惑" },
      { "rank": 3, "type": "Normal", "name": "角鑽" },
      { "rank": 3, "type": "Dark", "name": "吹捧" },
      { "rank": 4, "type": "Normal", "name": "惡魔之吻" },
      { "rank": 4, "type": "Normal", "name": "晨光" },
      { "rank": 4, "type": "Psychic", "name": "念力" }
    ],
    "isNovice": true
  },
  {
    "id": "033",
    "region": "kanto",
    "name": "尼多力諾",
    "alias": "Nidorino",
    "type": [ "Poison" ],
    "info": {
      "image": "images/pokedex/033.png",
      "height": "0.9",
      "weight": "20",
      "category": "毒針寶可夢",
      "text": "An  independent  and  fierce  creature.  It  roams  alone  in  search for  a  mate  and  will  compete  with other  males  around.  It  will  violently charge  with  a  venom  drenched horn against intruders."
    },
    "evolution": {
      "stage": "second",
      "with": "月之石"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "毒刺", "鬥爭心" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Fight", "name": "二連踢" },
      { "rank": 1, "type": "Poison", "name": "毒針" },
      { "rank": 2, "type": "Normal", "name": "幫助" },
      { "rank": 2, "type": "Normal", "name": "亂擊" },
      { "rank": 2, "type": "Normal", "name": "角撞" },
      { "rank": 2, "type": "Poison", "name": "毒擊" },
      { "rank": 2, "type": "Poison", "name": "毒菱" },
      { "rank": 3, "type": "Normal", "name": "誘惑" },
      { "rank": 3, "type": "Normal", "name": "角鑽" },
      { "rank": 3, "type": "Dark", "name": "吹捧" },
      { "rank": 4, "type": "Normal", "name": "惡魔之吻" },
      { "rank": 4, "type": "Normal", "name": "晨光" },
      { "rank": 4, "type": "Steel", "name": "修長之角" }
    ]
  },
  {
    "id": "034",
    "region": "kanto",
    "name": "尼多王",
    "alias": "Nidoking",
    "type": [ "Poison", "Ground" ],
    "info": {
      "image": "images/pokedex/034.png",
      "height": "1.4",
      "weight": "62",
      "category": "鑽錐寶可夢",
      "text": "It is recognized by its rock-hard hide and  its  extended  horn.  Be  careful with the horn as it contains venom. There are records of one trampling and  destroying  a  radio  tower  that was being built on his territory. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "毒刺", "鬥爭心" ],
    "moves": [
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Fight", "name": "二連踢" },
      { "rank": 1, "type": "Poison", "name": "毒針" },
      { "rank": 2, "type": "Normal", "name": "逐步擊破" },
      { "rank": 2, "type": "Ground", "name": "大地之力" },
      { "rank": 3, "type": "Bug", "name": "超級角擊" },
      { "rank": 3, "type": "Ground", "name": "直衝鑽" },
      { "rank": 4, "type": "Normal", "name": "大鬧一番" },
      { "rank": 4, "type": "Poison", "name": "毒尾" },
      { "rank": 4, "type": "Rock", "name": "雙刃頭鎚" }
    ]
  },
  {
    "id": "035",
    "region": "kanto",
    "name": "皮皮",
    "alias": "Clefairy",
    "type": [ "Fairy" ],
    "info": {
      "image": "images/pokedex/035.png",
      "height": "0.6",
      "weight": "7",
      "category": "妖精寶可夢",
      "text": "Very rare to find. Clefairies are said to come from the moon. They are drawn  to  the  light  of  this  celestial  body  and  come  out  of  hiding  at night  to  dance  and  play  in  the moonlight. "
    },
    "evolution": {
      "stage": "second",
      "with": "月之石"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "迷人之軀", "魔法防守" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "拍擊" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Normal", "name": "再來一次" },
      { "rank": 1, "type": "Normal", "name": "變圓" },
      { "rank": 1, "type": "Normal", "name": "連環巴掌" },
      { "rank": 1, "type": "Normal", "name": "唱歌" },
      { "rank": 1, "type": "Fairy", "name": "魅惑之聲" },
      { "rank": 2, "type": "Normal", "name": "看我嘛" },
      { "rank": 2, "type": "Normal", "name": "揮指" },
      { "rank": 2, "type": "Normal", "name": "幸運咒語" },
      { "rank": 2, "type": "Normal", "name": "聚光燈" },
      { "rank": 2, "type": "Normal", "name": "您先請" },
      { "rank": 2, "type": "Normal", "name": "變小" },
      { "rank": 2, "type": "Normal", "name": "傳遞禮物" },
      { "rank": 2, "type": "Fight", "name": "喚醒巴掌" },
      { "rank": 2, "type": "Psychic", "name": "宇宙力量" },
      { "rank": 2, "type": "Psychic", "name": "輔助力量" },
      { "rank": 3, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 3, "type": "Fairy", "name": "月亮之力" },
      { "rank": 3, "type": "Fairy", "name": "月光" },
      { "rank": 3, "type": "Psychic", "name": "治愈之願" },
      { "rank": 3, "type": "Psychic", "name": "重力" },
      { "rank": 3, "type": "Steel", "name": "彗星拳" },
      { "rank": 4, "type": "Normal", "name": "高速星星" },
      { "rank": 4, "type": "Normal", "name": "治愈鈴聲" },
      { "rank": 4, "type": "Psychic", "name": "治愈波動" }
    ],
    "isNovice": true
  },
  {
    "id": "036",
    "region": "kanto",
    "name": "皮可西",
    "alias": "Clefable",
    "type": [ "Fairy" ],
    "info": {
      "image": "images/pokedex/036.png",
      "height": "1.3",
      "weight": "40",
      "category": "妖精寶可夢",
      "text": "There are not many records about it in the wild. They are timid but playful.   Clefable uses its wings to skip lightly as if it was flying. Its bouncy step lets it walk on water. On quiet, moonlit nights, it strolls near lakes."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "迷人之軀", "魔法防守" ],
    "moves": [
      { "rank": 1, "type": "Normal", "name": "唱歌" },
      { "rank": 1, "type": "Normal", "name": "聚光燈" },
      { "rank": 2, "type": "Normal", "name": "變小" },
      { "rank": 2, "type": "Normal", "name": "連環巴掌" },
      { "rank": 2, "type": "Fairy", "name": "月亮之力" },
      { "rank": 3, "type": "Normal", "name": "揮指" },
      { "rank": 3, "type": "Fight", "name": "吸取拳" },
      { "rank": 4, "type": "Normal", "name": "祈願" },
      { "rank": 4, "type": "Psychic", "name": "治愈波動" }
    ]
  },
  {
    "id": "037",
    "region": "kanto",
    "name": "六尾",
    "alias": "Vulpix",
    "type": [ "Fire" ],
    "info": {
      "image": "images/pokedex/037.png",
      "height": "0.6",
      "weight": "10",
      "category": "狐狸寶可夢",
      "text": "It  is  born  with  just  one  tail.  As  it grows, its single white tail gains color and  splits  into  six.  It  is  quite  warm and cuddly - very popular with the ladies . It is, however, uncommon to see one in the wild."
    },
    "evolution": {
      "stage": "first",
      "with": "火之石"
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
    "ability": [ "引火", "日照" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Fire", "name": "火花" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 1, "type": "Normal", "name": "吼叫" },
      { "rank": 1, "type": "Fairy", "name": "圓瞳" },
      { "rank": 2, "type": "Dark", "name": "以牙還牙" },
      { "rank": 2, "type": "Dark", "name": "出奇一擊" },
      { "rank": 2, "type": "Fire", "name": "烈焰濺射" },
      { "rank": 2, "type": "Fire", "name": "火焰旋渦" },
      { "rank": 2, "type": "Fire", "name": "鬼火" },
      { "rank": 2, "type": "Ghost", "name": "禍不單行" },
      { "rank": 2, "type": "Ghost", "name": "奇異之光" },
      { "rank": 2, "type": "Psychic", "name": "神通力" },
      { "rank": 2, "type": "Psychic", "name": "封印" },
      { "rank": 3, "type": "Normal", "name": "誘惑" },
      { "rank": 3, "type": "Normal", "name": "神秘守護" },
      { "rank": 3, "type": "Fire", "name": "煉獄" },
      { "rank": 3, "type": "Fire", "name": "噴射火焰" },
      { "rank": 3, "type": "Fire", "name": "大字爆炎" },
      { "rank": 3, "type": "Ghost", "name": "怨念" },
      { "rank": 4, "type": "Normal", "name": "分擔痛楚" },
      { "rank": 4, "type": "Fire", "name": "熱風" },
      { "rank": 4, "type": "Ghost", "name": "怨恨" }
    ],
    "isNovice": true
  },
  {
    "id": "038",
    "region": "kanto",
    "name": "九尾",
    "alias": "Ninetales",
    "type": [ "Fire" ],
    "info": {
      "image": "images/pokedex/038.png",
      "height": "1.1",
      "weight": "20",
      "category": "狐狸寶可夢",
      "text": "It  is  known  to  understand  human  speech.  It  is  very  valued  for  its  exhuberant  golden  fur  and  the mystical power of its nine tails. It is, however,  known  to  hold  a  grudge against  those who mistreat it."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "引火", "日照" ],
    "moves": [
      { "rank": 2, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Dark", "name": "詭計" },
      { "rank": 2, "type": "Fire", "name": "噴射火焰" },
      { "rank": 2, "type": "Ghost", "name": "奇異之光" },
      { "rank": 2, "type": "Psychic", "name": "封印" },
      { "rank": 3, "type": "Normal", "name": "神秘守護" },
      { "rank": 3, "type": "Psychic", "name": "催眠術" },
      { "rank": 4, "type": "Normal", "name": "分擔痛楚" },
      { "rank": 4, "type": "Fire", "name": "熱風" }
    ]
  },
  {
    "id": "037-A",
    "region": "alola",
    "name": "六尾 (阿羅拉的樣子)",
    "alias": "Vulpix",
    "type": [ "Ice" ],
    "info": {
      "image": "images/pokedex/037-A.png",
      "height": "0.6",
      "weight": "10",
      "category": "狐狸寶可夢",
      "text": "The Vulpix who became stranded in Alola had to change type in order to survive. Alola’s local name for this Pokémon is Keokeo.They use their tails as a fan to cool themselves in hot climates."
    },
    "evolution": {
      "stage": "first",
      "with": "冰之石"
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
    "ability": [ "雪隱", "降雪" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Ice", "name": "細雪" },
      { "rank": 1, "type": "Normal", "name": "吼叫" },
      { "rank": 1, "type": "Fairy", "name": "圓瞳" },
      { "rank": 1, "type": "Ice", "name": "冰礫" },
      { "rank": 2, "type": "Dark", "name": "以牙還牙" },
      { "rank": 2, "type": "Dark", "name": "出奇一擊" },
      { "rank": 2, "type": "Ghost", "name": "禍不單行" },
      { "rank": 2, "type": "Ghost", "name": "奇異之光" },
      { "rank": 2, "type": "Ice", "name": "極光束" },
      { "rank": 2, "type": "Ice", "name": "冰凍之風" },
      { "rank": 2, "type": "Ice", "name": "白霧" },
      { "rank": 2, "type": "Psychic", "name": "神通力" },
      { "rank": 2, "type": "Psychic", "name": "封印" },
      { "rank": 3, "type": "Normal", "name": "誘惑" },
      { "rank": 3, "type": "Normal", "name": "神秘守護" },
      { "rank": 3, "type": "Ghost", "name": "怨念" },
      { "rank": 3, "type": "Ice", "name": "冰凍光束" },
      { "rank": 3, "type": "Ice", "name": "絕對零度" },
      { "rank": 3, "type": "Ice", "name": "暴風雪" },
      { "rank": 4, "type": "Fairy", "name": "月亮之力" },
      { "rank": 4, "type": "Ghost", "name": "怨恨" },
      { "rank": 4, "type": "Ice", "name": "冷凍乾燥" }
    ],
    "isNovice": true
  },
  {
    "id": "038-A",
    "region": "alola",
    "name": "九尾 (阿羅拉的樣子)",
    "alias": "Ninetales",
    "type": [ "Ice" ],
    "info": {
      "image": "images/pokedex/038-A.png",
      "height": "1.1",
      "weight": "20",
      "category": "狐狸寶可夢",
      "text": "In old times, Alolan natives revered this Pokémon as a god incarnate.It is usually calm and benevolent, but it  can  be  ruthless  when  disturbed, leaving  its  foes  as  a  cold  block of ice in the snow."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "雪隱", "降雪" ],
    "moves": [
      { "rank": 2, "type": "Dark", "name": "詭計" },
      { "rank": 2, "type": "Fairy", "name": "魔法閃耀" },
      { "rank": 2, "type": "Ghost", "name": "奇異之光" },
      { "rank": 2, "type": "Ice", "name": "冰凍光束" },
      { "rank": 2, "type": "Ice", "name": "冰礫" },
      { "rank": 2, "type": "Psychic", "name": "封印" },
      { "rank": 3, "type": "Normal", "name": "神秘守護" },
      { "rank": 3, "type": "Psychic", "name": "高速移動" },
      { "rank": 4, "type": "Fairy", "name": "月亮之力" },
      { "rank": 4, "type": "Ice", "name": "極光幕" }
    ]
  },
  {
    "id": "039",
    "region": "kanto",
    "name": "胖丁",
    "alias": "Jigglypuff",
    "type": [ "Normal", "Fairy" ],
    "info": {
      "image": "images/pokedex/039.png",
      "height": "0.5",
      "weight": "5",
      "category": "氣球寶可夢",
      "text": "They  live  in  grassy  fields  near  the mountains.  To  climb  they  inflate their  bodies  and  bounce  up.  It captivates foes with its huge, round eyes,  then  lulls  them  to  sleep  by singing a sweet soothing melody."
    },
    "evolution": {
      "stage": "second",
      "with": "月之石"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "迷人之軀", "好勝" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "拍擊" },
      { "rank": 0, "type": "Normal", "name": "唱歌" },
      { "rank": 1, "type": "Normal", "name": "和睦相處" },
      { "rank": 1, "type": "Normal", "name": "輪唱" },
      { "rank": 1, "type": "Normal", "name": "變圓" },
      { "rank": 2, "type": "Normal", "name": "噴出" },
      { "rank": 2, "type": "Normal", "name": "連環巴掌" },
      { "rank": 2, "type": "Normal", "name": "定身法" },
      { "rank": 2, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 2, "type": "Normal", "name": "吞下" },
      { "rank": 2, "type": "Normal", "name": "蓄力" },
      { "rank": 2, "type": "Fairy", "name": "魅惑之聲" },
      { "rank": 2, "type": "Rock", "name": "滾動" },
      { "rank": 3, "type": "Normal", "name": "模仿" },
      { "rank": 3, "type": "Normal", "name": "巨聲" },
      { "rank": 3, "type": "Fight", "name": "喚醒巴掌" },
      { "rank": 3, "type": "Psychic", "name": "睡覺" },
      { "rank": 3, "type": "Steel", "name": "陀螺球" },
      { "rank": 4, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 4, "type": "Dark", "name": "假哭" },
      { "rank": 4, "type": "Psychic", "name": "治愈波動" }
    ],
    "isNovice": true
  },
  {
    "id": "040",
    "region": "kanto",
    "name": "胖可丁",
    "alias": "Wigglytuff",
    "type": [ "Normal", "Fairy" ],
    "info": {
      "image": "images/pokedex/040.png",
      "height": "1.0",
      "weight": "12",
      "category": "氣球寶可夢",
      "text": "Its fur is extremely fine and conveys an image of luxury.  Its body is soft and  rubbery.  When  angered,  it  will suck the air and inflate itself to an enormous  size.  It  is  a  favorite  pet and a nurse Pokémon."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 7,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "迷人之軀", "好勝" ],
    "moves": [
      { "rank": 2, "type": "Normal", "name": "定身法" },
      { "rank": 2, "type": "Normal", "name": "變圓" },
      { "rank": 2, "type": "Normal", "name": "唱歌" },
      { "rank": 2, "type": "Normal", "name": "連環巴掌" },
      { "rank": 2, "type": "Fairy", "name": "嬉鬧" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Dark", "name": "假哭" },
      { "rank": 4, "type": "Normal", "name": "鬼面" },
      { "rank": 4, "type": "Psychic", "name": "治愈波動" }
    ]
  },
  {
    "id": "041",
    "region": "kanto",
    "name": "超音蝠",
    "alias": "Zubat",
    "type": [ "Poison", "Flying" ],
    "info": {
      "image": "images/pokedex/041.png",
      "height": "0.8",
      "weight": "7",
      "category": "蝙蝠寶可夢",
      "text": "It lives in dark caves all around the world.  Prolonged  exposure  to  the sun will make it unhealthy. It is blind but  uses  echolocation  to  find  its way. At night, they leave their cave to feed on fruit and bug Pokémon. "
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
    "ability": [ "精神力" ],
    "moves": [
      { "rank": 0, "type": "Grass", "name": "吸取" },
      { "rank": 1, "type": "Normal", "name": "超音波" },
      { "rank": 1, "type": "Ghost", "name": "驚嚇" },
      { "rank": 2, "type": "Normal", "name": "黑色目光" },
      { "rank": 2, "type": "Normal", "name": "高速星星" },
      { "rank": 2, "type": "Bug", "name": "吸血" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Flying", "name": "空氣利刃" },
      { "rank": 2, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 2, "type": "Ghost", "name": "奇異之光" },
      { "rank": 2, "type": "Poison", "name": "劇毒牙" },
      { "rank": 3, "type": "Fight", "name": "快速防守" },
      { "rank": 3, "type": "Flying", "name": "雜技" },
      { "rank": 3, "type": "Flying", "name": "空氣斬" },
      { "rank": 3, "type": "Ice", "name": "黑霧" },
      { "rank": 3, "type": "Poison", "name": "毒液衝擊" },
      { "rank": 4, "type": "Normal", "name": "憤怒門牙" },
      { "rank": 4, "type": "Dark", "name": "詭計" },
      { "rank": 4, "type": "Poison", "name": "毒液陷阱" }
    ],
    "isNovice": true
  },
  {
    "id": "042",
    "region": "kanto",
    "name": "大嘴蝠",
    "alias": "Golbat",
    "type": [ "Poison", "Flying" ],
    "info": {
      "image": "images/pokedex/042.png",
      "height": "1.6",
      "weight": "55",
      "category": "蝙蝠寶可夢",
      "text": "A stealthy Pokémon who loves the dark.  Its fangs can puncture even a thick  hide.  It  loves  to  feast  on  the blood of people and Pokémon alike. If it drinks too much, it gets heavy and can hardly fly. "
    },
    "evolution": {
      "stage": "second",
      "happiness": "4"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "精神力" ],
    "moves": [
      { "rank": 0, "type": "Grass", "name": "吸取" },
      { "rank": 1, "type": "Normal", "name": "超音波" },
      { "rank": 1, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 1, "type": "Ghost", "name": "驚嚇" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Normal", "name": "黑色目光" },
      { "rank": 2, "type": "Normal", "name": "高速星星" },
      { "rank": 2, "type": "Bug", "name": "吸血" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Flying", "name": "空氣利刃" },
      { "rank": 2, "type": "Ghost", "name": "奇異之光" },
      { "rank": 2, "type": "Poison", "name": "劇毒牙" },
      { "rank": 3, "type": "Fight", "name": "快速防守" },
      { "rank": 3, "type": "Flying", "name": "空氣斬" },
      { "rank": 3, "type": "Flying", "name": "雜技" },
      { "rank": 3, "type": "Ice", "name": "黑霧" },
      { "rank": 3, "type": "Poison", "name": "毒液衝擊" },
      { "rank": 4, "type": "Normal", "name": "憤怒門牙" },
      { "rank": 4, "type": "Dark", "name": "詭計" },
      { "rank": 4, "type": "Poison", "name": "毒液陷阱" }
    ]
  },
  {
    "id": "043",
    "region": "kanto",
    "name": "走路草",
    "alias": "Oddish",
    "type": [ "Grass", "Poison" ],
    "info": {
      "image": "images/pokedex/043.png",
      "height": "0.5",
      "weight": "5",
      "category": "雜草寶可夢",
      "text": " This  Pokémon  grows  by  absorbing  moonlight. During daytime, it buries itself in the ground, leaving only its leaves exposed to avoid detection by its predators. You can locate it by the smell its leaves release."
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
      "spe": { "value": 2, "max": 3 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "葉綠素" ],
    "moves": [
      { "rank": 0, "type": "Grass", "name": "超級吸取" },
      { "rank": 0, "type": "Grass", "name": "吸取" },
      { "rank": 1, "type": "Fairy", "name": "月亮之力" },
      { "rank": 1, "type": "Poison", "name": "溶解液" },
      { "rank": 2, "type": "Normal", "name": "自然之恩" },
      { "rank": 2, "type": "Normal", "name": "挺住" },
      { "rank": 2, "type": "Fairy", "name": "月光" },
      { "rank": 2, "type": "Fairy", "name": "撒嬌" },
      { "rank": 2, "type": "Grass", "name": "花瓣舞" },
      { "rank": 2, "type": "Grass", "name": "終極吸取" },
      { "rank": 2, "type": "Poison", "name": "胃液" },
      { "rank": 3, "type": "Normal", "name": "生長" },
      { "rank": 3, "type": "Grass", "name": "催眠粉" },
      { "rank": 3, "type": "Grass", "name": "青草場地" },
      { "rank": 3, "type": "Poison", "name": "毒粉" },
      { "rank": 4, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 4, "type": "Normal", "name": "幸運咒語" },
      { "rank": 4, "type": "Grass", "name": "麻痺粉" }
    ],
    "isNovice": true
  },
  {
    "id": "044",
    "region": "kanto",
    "name": "臭臭花",
    "alias": "Gloom",
    "type": [ "Grass", "Poison" ],
    "info": {
      "image": "images/pokedex/044.png",
      "height": "0.8",
      "weight": "9",
      "category": "雜草寶可夢",
      "text": "A horribly noxious honey drools from its mouth. One whiff of the honey can result in sickness. Some fans are said to enjoy its overwhelming stink, though.  You  can  control  this  foul smell with lots of love and care."
    },
    "evolution": {
      "stage": "second",
      "with": "葉之石/日之石"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 3 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "葉綠素" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "生長" },
      { "rank": 0, "type": "Grass", "name": "吸取" },
      { "rank": 1, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 1, "type": "Poison", "name": "溶解液" },
      { "rank": 1, "type": "Poison", "name": "毒粉" },
      { "rank": 2, "type": "Normal", "name": "自然之恩" },
      { "rank": 2, "type": "Normal", "name": "幸運咒語" },
      { "rank": 2, "type": "Fairy", "name": "月光" },
      { "rank": 2, "type": "Grass", "name": "超級吸取" },
      { "rank": 2, "type": "Grass", "name": "麻痺粉" },
      { "rank": 2, "type": "Grass", "name": "催眠粉" },
      { "rank": 2, "type": "Poison", "name": "劇毒" },
      { "rank": 3, "type": "Grass", "name": "青草場地" },
      { "rank": 3, "type": "Grass", "name": "落英繽紛" },
      { "rank": 3, "type": "Grass", "name": "花瓣舞" },
      { "rank": 3, "type": "Grass", "name": "終極吸取" },
      { "rank": 4, "type": "Normal", "name": "挺住" },
      { "rank": 4, "type": "Fairy", "name": "撒嬌" },
      { "rank": 4, "type": "Poison", "name": "胃液" }
    ]
  },
  {
    "id": "045",
    "region": "kanto",
    "name": "霸王花",
    "alias": "Vileplume",
    "type": [ "Grass", "Poison" ],
    "info": {
      "image": "images/pokedex/045.png",
      "height": "1.2",
      "weight": "19",
      "category": "花寶可夢",
      "text": "It  lives  in  marshlands  and  jungles where  it’s  often  mistaken  for  local flora.  The  air  around  a  Vileplume turns  yellow  with  the  powder  it  releases  as  it  walks.  The  pollen  is highly toxic and causes paralysis."
    },
    "evolution": {
      "stage": "final",
      "by": "葉之石"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "葉綠素" ],
    "moves": [
      { "rank": 0, "type": "Grass", "name": "超級吸取" },
      { "rank": 1, "type": "Grass", "name": "芳香治療" },
      { "rank": 1, "type": "Poison", "name": "毒粉" },
      { "rank": 2, "type": "Grass", "name": "麻痺粉" },
      { "rank": 2, "type": "Grass", "name": "花瓣舞" },
      { "rank": 3, "type": "Grass", "name": "落英繽紛" },
      { "rank": 3, "type": "Grass", "name": "日光束" },
      { "rank": 4, "type": "Normal", "name": "劍舞" },
      { "rank": 4, "type": "Fight", "name": "吸取拳" },
      { "rank": 4, "type": "Grass", "name": "種子炸彈" }
    ]
  },
  {
    "id": "046",
    "region": "kanto",
    "name": "派拉斯",
    "alias": "Paras",
    "type": [ "Bug", "Grass" ],
    "info": {
      "image": "images/pokedex/046.png",
      "height": "0.3",
      "weight": "5",
      "category": "蘑菇寶可夢",
      "text": "Paras has two parasitic mushrooms growing  on  its  back.  They  grow large by drawing nutrients from this Bug  Pokémon.  They  are  valued  as a medicine for prolonging life.  Paras can be found in humid areas."
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
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "孢子", "乾燥皮膚" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 0, "type": "Grass", "name": "麻痺粉" },
      { "rank": 1, "type": "Grass", "name": "吸取" },
      { "rank": 1, "type": "Poison", "name": "毒粉" },
      { "rank": 2, "type": "Normal", "name": "生長" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Bug", "name": "連斬" },
      { "rank": 2, "type": "Grass", "name": "蘑菇孢子" },
      { "rank": 2, "type": "Grass", "name": "終極吸取" },
      { "rank": 3, "type": "Bug", "name": "十字剪" },
      { "rank": 3, "type": "Bug", "name": "憤怒粉" },
      { "rank": 3, "type": "Grass", "name": "芳香治療" },
      { "rank": 4, "type": "Grass", "name": "寄生種子" },
      { "rank": 4, "type": "Ground", "name": "耕地" },
      { "rank": 4, "type": "Rock", "name": "廣域防守" }
    ],
    "isNovice": true
  },
  {
    "id": "047",
    "region": "kanto",
    "name": "派拉斯特",
    "alias": "Parasect",
    "type": [ "Bug", "Grass" ],
    "info": {
      "image": "images/pokedex/047.png",
      "height": "1.0",
      "weight": "30",
      "category": "蘑菇寶可夢",
      "text": " Their  personality  changes  after evolution  since  the  mushroom takes over its mind. Its body is now a husk devoid of nutrients. To survive they cling to a tree and absorb the nutrients until the tree dies.  "
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
    "ability": [ "孢子", "乾燥皮膚" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 0, "type": "Grass", "name": "麻痺粉" },
      { "rank": 1, "type": "Grass", "name": "吸取" },
      { "rank": 1, "type": "Poison", "name": "毒粉" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Normal", "name": "生長" },
      { "rank": 2, "type": "Bug", "name": "連斬" },
      { "rank": 2, "type": "Grass", "name": "終極吸取" },
      { "rank": 2, "type": "Grass", "name": "蘑菇孢子" },
      { "rank": 2, "type": "Poison", "name": "十字毒刃" },
      { "rank": 3, "type": "Bug", "name": "憤怒粉" },
      { "rank": 3, "type": "Bug", "name": "十字剪" },
      { "rank": 3, "type": "Grass", "name": "芳香治療" },
      { "rank": 4, "type": "Grass", "name": "種子炸彈" },
      { "rank": 4, "type": "Grass", "name": "光合作用" },
      { "rank": 4, "type": "Psychic", "name": "幻象光線" }
    ]
  },
  {
    "id": "048",
    "region": "kanto",
    "name": "毛球",
    "alias": "Venonat",
    "type": [ "Bug", "Poison" ],
    "info": {
      "image": "images/pokedex/048.png",
      "height": "1.0",
      "weight": "30",
      "category": "昆蟲寶可夢",
      "text": "It lives in the holes of trees in dense forests  and  jungles.  Its  large  eyes never  fail  to  spot  even  miniscule prey.  Sometimes  Venonat  uses  its powers  to  confuse  travelers  and make them lose their way."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
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
    "ability": [ "複眼", "有色眼鏡" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "識破" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "超音波" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 2, "type": "Bug", "name": "吸血" },
      { "rank": 2, "type": "Grass", "name": "麻痺粉" },
      { "rank": 2, "type": "Poison", "name": "劇毒牙" },
      { "rank": 2, "type": "Poison", "name": "毒粉" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 2, "type": "Psychic", "name": "念力" },
      { "rank": 3, "type": "Bug", "name": "信號光束" },
      { "rank": 3, "type": "Grass", "name": "催眠粉" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Psychic", "name": "意念頭鎚" },
      { "rank": 4, "type": "Normal", "name": "接棒" },
      { "rank": 4, "type": "Grass", "name": "終極吸取" },
      { "rank": 4, "type": "Psychic", "name": "高速移動" }
    ],
    "isNovice": true
  },
  {
    "id": "049",
    "region": "kanto",
    "name": "摩魯蛾",
    "alias": "Venomoth",
    "type": [ "Bug", "Poison" ],
    "info": {
      "image": "images/pokedex/049.png",
      "height": "1.5",
      "weight": "13",
      "category": "毒蛾寶可夢",
      "text": "They are plentiful in forests but only come  out  at  night.  They    possess  an  incredible  eyesight  and  are  attracted  to  light  sources.  Their wings scatter a toxic powder which they use to immobilize their prey"
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
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "複眼", "有色眼鏡" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "識破" },
      { "rank": 1, "type": "Normal", "name": "超音波" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 2, "type": "Bug", "name": "蝶舞" },
      { "rank": 2, "type": "Bug", "name": "吸血" },
      { "rank": 2, "type": "Bug", "name": "銀色旋風" },
      { "rank": 2, "type": "Grass", "name": "麻痺粉" },
      { "rank": 2, "type": "Poison", "name": "毒粉" },
      { "rank": 2, "type": "Poison", "name": "劇毒牙" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 3, "type": "Bug", "name": "蟲鳴" },
      { "rank": 3, "type": "Bug", "name": "信號光束" },
      { "rank": 3, "type": "Grass", "name": "催眠粉" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Psychic", "name": "意念頭鎚" },
      { "rank": 4, "type": "Normal", "name": "晨光" },
      { "rank": 4, "type": "Flying", "name": "清除濃霧" },
      { "rank": 4, "type": "Grass", "name": "終極吸取" }
    ]
  },
  {
    "id": "050",
    "region": "kanto",
    "name": "地鼠",
    "alias": "Diglett",
    "type": [ "Ground" ],
    "info": {
      "image": "images/pokedex/050.png",
      "height": "0.2",
      "weight": "0.8",
      "category": "鼴鼠寶可夢",
      "text": "It  prefers  dark  places  and  spends most  of  its  time  underground.  It  has  a  very  thin  skin.  It’s  frail  and has  problems  regulating  its  own temperature. Keep it burrowed or it will get sick."
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "沙隱", "沙穴" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 0, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Ghost", "name": "驚嚇" },
      { "rank": 1, "type": "Ground", "name": "擲泥" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Ground", "name": "大地之力" },
      { "rank": 2, "type": "Ground", "name": "震級" },
      { "rank": 2, "type": "Ground", "name": "挖洞" },
      { "rank": 2, "type": "Ground", "name": "泥巴炸彈" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 3, "type": "Normal", "name": "劈開" },
      { "rank": 3, "type": "Ground", "name": "地裂" },
      { "rank": 3, "type": "Ground", "name": "地震" },
      { "rank": 4, "type": "Normal", "name": "刺耳聲" },
      { "rank": 4, "type": "Dark", "name": "出奇一擊" },
      { "rank": 4, "type": "Rock", "name": "隱形岩" }
    ],
    "isNovice": true
  },
  {
    "id": "051",
    "region": "kanto",
    "name": "三地鼠",
    "alias": "Dugtrio",
    "type": [ "Ground" ],
    "info": {
      "image": "images/pokedex/051.png",
      "height": "0.7",
      "weight": "33",
      "category": "鼴鼠寶可夢",
      "text": "Because  the  triplets  originally  split from  one  body,  they  think  exactly  alike.  They  work  together  to  dig endlessly through the ground. They are known for destroying the  foundations of roads and buildings. "
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
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "沙隱", "沙穴" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 0, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Ghost", "name": "驚嚇" },
      { "rank": 1, "type": "Ground", "name": "擲泥" },
      { "rank": 2, "type": "Normal", "name": "三重攻擊" },
      { "rank": 2, "type": "Ground", "name": "耕地" },
      { "rank": 2, "type": "Ground", "name": "大地之力" },
      { "rank": 2, "type": "Ground", "name": "震級" },
      { "rank": 2, "type": "Ground", "name": "流沙地獄" },
      { "rank": 2, "type": "Ground", "name": "挖洞" },
      { "rank": 2, "type": "Ground", "name": "泥巴炸彈" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 3, "type": "Normal", "name": "劈開" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Dark", "name": "突襲" },
      { "rank": 3, "type": "Ground", "name": "地裂" },
      { "rank": 3, "type": "Ground", "name": "地震" },
      { "rank": 4, "type": "Rock", "name": "原始之力" },
      { "rank": 4, "type": "Rock", "name": "隱形岩" },
      { "rank": 4, "type": "Rock", "name": "岩崩" }
    ]
  },
  {
    "id": "050-A",
    "region": "alola",
    "name": "地鼠 (阿羅拉的樣子)",
    "alias": "Diglett",
    "type": [ "Ground", "Steel" ],
    "info": {
      "image": "images/pokedex/050-A.png",
      "height": "0.2",
      "weight": "1",
      "category": "鼴鼠寶可夢",
      "text": "This variant of Diglett is only found in  the  Alola  region.  The  small  hairs on  its  head  are  used  perceive  its surroundings  while  burrowed,  do not cut them or Diglett will become very sick."
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "沙隱", "捲髮" ],
    "moves": [
      { "rank": 0, "type": "Ground", "name": "潑沙" },
      { "rank": 0, "type": "Steel", "name": "金屬爪" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Ghost", "name": "驚嚇" },
      { "rank": 1, "type": "Ground", "name": "擲泥" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Ground", "name": "大地之力" },
      { "rank": 2, "type": "Ground", "name": "震級" },
      { "rank": 2, "type": "Ground", "name": "挖洞" },
      { "rank": 2, "type": "Ground", "name": "泥巴炸彈" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 3, "type": "Steel", "name": "鐵頭" },
      { "rank": 3, "type": "Ground", "name": "地裂" },
      { "rank": 3, "type": "Ground", "name": "地震" },
      { "rank": 4, "type": "Normal", "name": "大鬧一番" },
      { "rank": 4, "type": "Dark", "name": "出奇一擊" },
      { "rank": 4, "type": "Steel", "name": "金屬音" }
    ],
    "isNovice": true
  },
  {
    "id": "051-A",
    "region": "alola",
    "name": "三地鼠 (阿羅拉的樣子)",
    "alias": "Dugtrio",
    "type": [ "Ground", "Steel" ],
    "info": {
      "image": "images/pokedex/051-A.png",
      "height": "0.7",
      "weight": "66",
      "category": "鼴鼠寶可夢",
      "text": "Thanks  to  its  golden  mane,  this Pokémon  has  been  revered  as  a  femenine  diety.  The  triplets  groom each  other  to  help  keep  the  hair glossy and dirt-free, they don’t like to be petted."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "沙隱", "捲髮" ],
    "moves": [
      { "rank": 0, "type": "Ground", "name": "潑沙" },
      { "rank": 0, "type": "Steel", "name": "金屬爪" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Ghost", "name": "驚嚇" },
      { "rank": 1, "type": "Ground", "name": "擲泥" },

      { "rank": 2, "type": "Normal", "name": "三重攻擊" },
      { "rank": 2, "type": "Ground", "name": "耕地" },
      { "rank": 2, "type": "Ground", "name": "大地之力" },
      { "rank": 2, "type": "Ground", "name": "震級" },
      { "rank": 2, "type": "Ground", "name": "流沙地獄" },
      { "rank": 2, "type": "Ground", "name": "挖洞" },
      { "rank": 2, "type": "Ground", "name": "泥巴炸彈" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 3, "type": "Normal", "name": "劈開" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Dark", "name": "突襲" },
      { "rank": 3, "type": "Ground", "name": "地裂" },
      { "rank": 3, "type": "Ground", "name": "地震" },
      { "rank": 4, "type": "Normal", "name": "大鬧一番" },
      { "rank": 4, "type": "Rock", "name": "原始之力" },
      { "rank": 4, "type": "Rock", "name": "尖石攻擊" }
    ]
  },
  {
    "id": "052",
    "region": "kanto",
    "name": "喵喵",
    "alias": "Meowth",
    "type": [ "Normal" ],
    "info": {
      "image": "images/pokedex/052.png",
      "height": "0.4",
      "weight": "4",
      "category": "妖怪貓寶可夢",
      "text": "They used to live in grasslands but have adapted really well to life in the city. Shiny things facinate them and they  keep  a  little  treasure  hidden. The  coin  on  its  head  is  its  most prized possesion. "
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "撿拾", "技術高手" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 1, "type": "Normal", "name": "亂抓" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Normal", "name": "誘惑" },
      { "rank": 2, "type": "Normal", "name": "聚寶功" },
      { "rank": 2, "type": "Dark", "name": "出奇一擊" },
      { "rank": 2, "type": "Dark", "name": "挑釁" },
      { "rank": 3, "type": "Normal", "name": "佯攻" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Dark", "name": "惡意追擊" },
      { "rank": 3, "type": "Dark", "name": "詭計" },
      { "rank": 4, "type": "Normal", "name": "唱歌" },
      { "rank": 4, "type": "Dark", "name": "搶奪" },
      { "rank": 4, "type": "Fairy", "name": "撒嬌" }
    ],
    "isNovice": true
  },
  {
    "id": "053",
    "region": "kanto",
    "name": "貓老大",
    "alias": "Persian",
    "type": [ "Normal" ],
    "info": {
      "image": "images/pokedex/053.png",
      "height": "1.1",
      "weight": "32",
      "category": "暹羅貓寶可夢",
      "text": "They are proud and temperamental.  They scratch their trainers with little  to  no  provocation  whatsoever. Their  elegance  and  grace  is  very valued,  although  they  can  be  vicious hunters. "
    },
    "evolution": {
      "stage": "final"
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
    "ability": [ "柔軟", "技術高手" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 1, "type": "Normal", "name": "亂抓" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Normal", "name": "誘惑" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Normal", "name": "高速星星" },
      { "rank": 2, "type": "Dark", "name": "挑釁" },
      { "rank": 2, "type": "Dark", "name": "出奇一擊" },
      { "rank": 2, "type": "Fairy", "name": "嬉鬧" },
      { "rank": 2, "type": "Rock", "name": "力量寶石" },
      { "rank": 3, "type": "Normal", "name": "佯攻" },
      { "rank": 3, "type": "Dark", "name": "詭計" },
      { "rank": 3, "type": "Dark", "name": "掉包" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Dark", "name": "惡意追擊" },
      { "rank": 4, "type": "Normal", "name": "借助" },
      { "rank": 4, "type": "Psychic", "name": "瞬間失憶" },
      { "rank": 4, "type": "Psychic", "name": "催眠術" }
    ]
  },
  {
    "id": "052-A",
    "region": "alola",
    "name": "喵喵 (阿羅拉的樣子)",
    "alias": "Meowth",
    "type": [ "Dark" ],
    "info": {
      "image": "images/pokedex/052-A.png",
      "height": "0.4",
      "weight": "4",
      "category": "妖怪貓寶可夢",
      "text": "In old times, Meowth were taken to Alola  as  gifts  for  the  tribe’s  royals,  this  caused  them  to  become  incredibly greedy and pampered.Nowdays  they  are  feral,  but  their prideful nature remained."
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
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "撿拾", "技術高手" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 1, "type": "Normal", "name": "亂抓" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Normal", "name": "誘惑" },
      { "rank": 2, "type": "Normal", "name": "聚寶功" },
      { "rank": 2, "type": "Dark", "name": "惡之波動" },
      { "rank": 2, "type": "Dark", "name": "出奇一擊" },
      { "rank": 2, "type": "Dark", "name": "挑釁" },
      { "rank": 3, "type": "Normal", "name": "佯攻" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Dark", "name": "惡意追擊" },
      { "rank": 3, "type": "Dark", "name": "詭計" },
      { "rank": 4, "type": "Dark", "name": "吹捧" },
      { "rank": 4, "type": "Fairy", "name": "撒嬌" },
      { "rank": 4, "type": "Ghost", "name": "怨恨" }
    ],
    "isNovice": true
  },
  {
    "id": "053-A",
    "region": "alola",
    "name": "貓老大 (阿羅拉的樣子)",
    "alias": "Persian",
    "type": [ "Dark" ],
    "info": {
      "image": "images/pokedex/053-A.png",
      "height": "1.1",
      "weight": "33",
      "category": "暹羅貓寶可夢",
      "text": "They  were  bred  for  their  silky  fur and  round  faces,  not  for  their temperament.  This  is  an  extremely proud Pokémon who will look down to anyone but itself, despite this, it’s very popular among Alola’s elite."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "毛皮大衣", "技術高手" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 1, "type": "Normal", "name": "亂抓" },
      { "rank": 1, "type": "Normal", "name": "刺耳聲" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Normal", "name": "誘惑" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Normal", "name": "高速星星" },
      { "rank": 2, "type": "Dark", "name": "挑釁" },
      { "rank": 2, "type": "Dark", "name": "出奇一擊" },
      { "rank": 2, "type": "Dark", "name": "惡之波動" },
      { "rank": 2, "type": "Dark", "name": "掉包" },
      { "rank": 2, "type": "Fairy", "name": "嬉鬧" },
      { "rank": 2, "type": "Rock", "name": "力量寶石" },
      { "rank": 3, "type": "Normal", "name": "佯攻" },
      { "rank": 3, "type": "Dark", "name": "詭計" },
      { "rank": 3, "type": "Dark", "name": "延後" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Dark", "name": "惡意追擊" },
      { "rank": 4, "type": "Dark", "name": "拋下狠話" },
      { "rank": 4, "type": "Dark", "name": "大聲咆哮" },
      { "rank": 4, "type": "Dark", "name": "無理取鬧" }
    ]
  },
  {
    "id": "054",
    "region": "kanto",
    "name": "可達鴨",
    "alias": "Psyduck",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/054.png",
      "height": "0.8",
      "weight": "20",
      "category": "鴨寶可夢",
      "text": "It   lives  near  lakes  and  ponds  but it’s not very good at swimming. It is always  tormented  by  headaches that  worsen  when  it  uses  psychic powers. Psyducks seem unaware of their own power."
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
    "ability": [ "濕氣", "無關天氣" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 0, "type": "Water", "name": "玩水" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "亂抓" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Psychic", "name": "意念頭鎚" },
      { "rank": 2, "type": "Psychic", "name": "念力" },
      { "rank": 2, "type": "Psychic", "name": "瞬間失憶" },
      { "rank": 2, "type": "Water", "name": "浸水" },
      { "rank": 2, "type": "Water", "name": "水流尾" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 3, "type": "Normal", "name": "自我暗示" },
      { "rank": 3, "type": "Psychic", "name": "奇妙空間" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Ghost", "name": "奇異之光" },
      { "rank": 4, "type": "Poison", "name": "清除之煙" },
      { "rank": 4, "type": "Psychic", "name": "預知未來" }
    ],
    "isNovice": true
  },
  {
    "id": "055",
    "region": "kanto",
    "name": "哥達鴨",
    "alias": "Golduck",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/055.png",
      "height": "1.7",
      "weight": "76",
      "category": "鴨寶可夢",
      "text": "A Golduck is an adept swimmer and can  be  found  near  most  bodies  of water. Its forehead shimmers with light when using its psychic abilities.  There are records of wild Golducks that rescued people in the water."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "濕氣", "無關天氣" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 0, "type": "Water", "name": "玩水" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "亂抓" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Psychic", "name": "意念頭鎚" },
      { "rank": 2, "type": "Psychic", "name": "瞬間失憶" },
      { "rank": 2, "type": "Water", "name": "浸水" },
      { "rank": 2, "type": "Water", "name": "水流噴射" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 3, "type": "Normal", "name": "自我暗示" },
      { "rank": 3, "type": "Normal", "name": "搶先一步" },
      { "rank": 3, "type": "Psychic", "name": "奇妙空間" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Normal", "name": "三重攻擊" },
      { "rank": 4, "type": "Ghost", "name": "奇異之光" },
      { "rank": 4, "type": "Psychic", "name": "預知未來" }
    ]
  },
  {
    "id": "056",
    "region": "kanto",
    "name": "猴怪",
    "alias": "Mankey",
    "type": [ "Fight" ],
    "info": {
      "image": "images/pokedex/056.png",
      "height": "0.5",
      "weight": "28",
      "category": "豬猴寶可夢",
      "text": "It lives on the mountains or at the top of fruit trees. Light and agile on its feet and ferocious in temperament. When  it  gets  angry,  it  goes  into  a frenzy and cannot be controlled."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "幹勁", "憤怒穴位" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 0, "type": "Normal", "name": "渴望" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Fight", "name": "踢倒" },
      { "rank": 2, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Normal", "name": "亂抓" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Fight", "name": "空手劈" },
      { "rank": 2, "type": "Fight", "name": "地球上投" },
      { "rank": 3, "type": "Normal", "name": "大鬧一番" },
      { "rank": 3, "type": "Dark", "name": "懲罰" },
      { "rank": 3, "type": "Dragon", "name": "逆鱗" },
      { "rank": 3, "type": "Fight", "name": "近身戰" },
      { "rank": 3, "type": "Fight", "name": "搏命" },
      { "rank": 3, "type": "Fight", "name": "十字劈" },
      { "rank": 3, "type": "Ground", "name": "跺腳" },
      { "rank": 4, "type": "Dark", "name": "圍攻" },
      { "rank": 4, "type": "Dragon", "name": "二連劈" },
      { "rank": 4, "type": "Psychic", "name": "瑜伽姿勢" }
    ],
    "isNovice": true
  },
  {
    "id": "057",
    "region": "kanto",
    "name": "火暴猴",
    "alias": "Primeape",
    "type": [ "Fight" ],
    "info": {
      "image": "images/pokedex/057.png",
      "height": "1.0",
      "weight": "32",
      "category": "豬猴寶可夢",
      "text": "It  grows  angry  if  you  see  its  eyes and  gets  angrier  if  you  run.  If  you fight it will go mad with rage.  Not  many  trainers  are  capable  of handling  it,  the  angrier  it  gets  the less intelligent it becomes."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "幹勁", "憤怒穴位" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Dark", "name": "投擲" },
      { "rank": 2, "type": "Normal", "name": "憤怒" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Normal", "name": "亂抓" },
      { "rank": 2, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Fight", "name": "空手劈" },
      { "rank": 2, "type": "Fight", "name": "地球上投" },
      { "rank": 3, "type": "Normal", "name": "大鬧一番" },
      { "rank": 3, "type": "Dark", "name": "懲罰" },
      { "rank": 3, "type": "Dragon", "name": "逆鱗" },
      { "rank": 3, "type": "Fight", "name": "十字劈" },
      { "rank": 3, "type": "Fight", "name": "近身戰" },
      { "rank": 3, "type": "Fight", "name": "搏命" },
      { "rank": 3, "type": "Ground", "name": "跺腳" },
      { "rank": 4, "type": "Dark", "name": "暗襲要害" },
      { "rank": 4, "type": "Fire", "name": "過熱" },
      { "rank": 4, "type": "Psychic", "name": "瑜伽姿勢" }
    ]
  },
  {
    "id": "058",
    "region": "kanto",
    "name": "卡蒂狗",
    "alias": "Growlithe",
    "type": [ "Fire" ],
    "info": {
      "image": "images/pokedex/058.png",
      "height": "0.7",
      "weight": "19",
      "category": "小狗寶可夢",
      "text": "Friendly, loyal and fearless to defend  its trainer. These traits have gained them  a  place  working  as  police Pokémon.  They  are  uncommon  in the  wild  but  some  packs  can  be seen in hot environments."
    },
    "evolution": {
      "stage": "first",
      "with": "火之石"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "威嚇", "引火" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "吼叫" },
      { "rank": 0, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Normal", "name": "幫助" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Normal", "name": "氣味偵測" },
      { "rank": 1, "type": "Fire", "name": "火花" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Normal", "name": "報仇" },
      { "rank": 2, "type": "Fight", "name": "起死回生" },
      { "rank": 2, "type": "Fire", "name": "噴射火焰" },
      { "rank": 2, "type": "Fire", "name": "烈焰濺射" },
      { "rank": 2, "type": "Fire", "name": "火焰牙" },
      { "rank": 2, "type": "Fire", "name": "火焰輪" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Dark", "name": "咬碎" },
      { "rank": 3, "type": "Dragon", "name": "逆鱗" },
      { "rank": 3, "type": "Fire", "name": "閃焰衝鋒" },
      { "rank": 3, "type": "Fire", "name": "熱風" },
      { "rank": 4, "type": "Normal", "name": "長嚎" },
      { "rank": 4, "type": "Fairy", "name": "撒嬌" },
      { "rank": 4, "type": "Fight", "name": "近身戰" }
    ],
    "isNovice": true
  },
  {
    "id": "059",
    "region": "kanto",
    "name": "風速狗",
    "alias": "Arcanine",
    "type": [ "Fire" ],
    "info": {
      "image": "images/pokedex/059.png",
      "height": "1.9",
      "weight": "155",
      "category": "傳說寶可夢",
      "text": "Its  proud  and  regal  appearance has made it be revered by people of ancient societies.  Its magnificent bark  conveys  a  sense  of  majesty. Anyone  in  front  of  Arcanine  can’t help but stare in awe."
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
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "威嚇", "引火" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "吼叫" },
      { "rank": 0, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Normal", "name": "氣味偵測" },
      { "rank": 2, "type": "Electric", "name": "雷電牙" },
      { "rank": 2, "type": "Fire", "name": "火焰牙" },
      { "rank": 3, "type": "Normal", "name": "神速" },
      { "rank": 3, "type": "Fire", "name": "燃盡" },
      { "rank": 4, "type": "Normal", "name": "晨光" },
      { "rank": 4, "type": "Dragon", "name": "龍之波動" },
      { "rank": 4, "type": "Electric", "name": "瘋狂伏特" }
    ]
  },
  {
    "id": "060",
    "region": "kanto",
    "name": "蚊香蝌蚪",
    "alias": "Poliwag",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/060.png",
      "height": "0.6",
      "weight": "12",
      "category": "蝌蚪寶可夢",
      "text": "They are most common near ponds and  lakes  during  the  summer.  Its legs  take  some  weeks  to  develop after it hatches, making it inept at walking.  It  is,  however,  a  very  fast swimmer."
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "儲水", "濕氣" ],
    "moves": [
      { "rank": 0, "type": "Water", "name": "水槍" },
      { "rank": 0, "type": "Water", "name": "玩水" },
      { "rank": 1, "type": "Psychic", "name": "催眠術" },
      { "rank": 1, "type": "Water", "name": "泡沫" },
      { "rank": 2, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 2, "type": "Normal", "name": "連環巴掌" },
      { "rank": 2, "type": "Ground", "name": "泥巴射擊" },
      { "rank": 2, "type": "Water", "name": "泡沫光線" },
      { "rank": 2, "type": "Water", "name": "求雨" },
      { "rank": 3, "type": "Normal", "name": "腹鼓" },
      { "rank": 3, "type": "Fight", "name": "喚醒巴掌" },
      { "rank": 3, "type": "Ground", "name": "泥巴炸彈" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Normal", "name": "煥然一新" },
      { "rank": 4, "type": "Normal", "name": "心之眼" },
      { "rank": 4, "type": "Ice", "name": "冰凍之風" }
    ],
    "isNovice": true
  },
  {
    "id": "061",
    "region": "kanto",
    "name": "蚊香君",
    "alias": "Poliwhirl",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/061.png",
      "height": "1.0",
      "weight": "20",
      "category": "蝌蚪寶可夢",
      "text": "Though  it  is  skilled  at  walking,  it  prefers  to  live  underwater  where there’s  less  danger.    It  sweats  to keep its skin moist. Thanks to this,  it can easily slip out of the clutches of any enemy. "
    },
    "evolution": {
      "stage": "second",
      "with": "水之石/交換"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "儲水", "濕氣" ],
    "moves": [
      { "rank": 0, "type": "Water", "name": "水槍" },
      { "rank": 0, "type": "Water", "name": "玩水" },
      { "rank": 1, "type": "Psychic", "name": "催眠術" },
      { "rank": 1, "type": "Water", "name": "泡沫" },
      { "rank": 2, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 2, "type": "Normal", "name": "連環巴掌" },
      { "rank": 2, "type": "Ground", "name": "泥巴射擊" },
      { "rank": 2, "type": "Water", "name": "泡沫光線" },
      { "rank": 2, "type": "Water", "name": "求雨" },
      { "rank": 3, "type": "Normal", "name": "腹鼓" },
      { "rank": 3, "type": "Fight", "name": "喚醒巴掌" },
      { "rank": 3, "type": "Ground", "name": "泥巴炸彈" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Normal", "name": "煥然一新" },
      { "rank": 4, "type": "Normal", "name": "心之眼" },
      { "rank": 4, "type": "Ice", "name": "冰凍拳" }
    ]
  },
  {
    "id": "062",
    "region": "kanto",
    "name": "蚊香泳士",
    "alias": "Poliwrath",
    "type": [ "Water", "Fight" ],
    "info": {
      "image": "images/pokedex/062.png",
      "height": "1.3",
      "weight": "54",
      "category": "蝌蚪寶可夢",
      "text": "It’s not common to find it in the wild. Most sightings take place when it is on land. Once he is inside the water, it will swim far away. This Pokémon  is an outstanding swimmer, capable of beating any human. "
    },
    "evolution": {
      "stage": "final",
      "by": "水之石"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "儲水", "濕氣" ],
    "moves": [
      { "rank": 1, "type": "Fight", "name": "巴投" },
      { "rank": 1, "type": "Psychic", "name": "催眠術" },
      { "rank": 2, "type": "Normal", "name": "連環巴掌" },
      { "rank": 2, "type": "Fight", "name": "地獄翻滾" },
      { "rank": 2, "type": "Water", "name": "泡沫光線" },
      { "rank": 3, "type": "Normal", "name": "心之眼" },
      { "rank": 3, "type": "Fight", "name": "爆裂拳" },
      { "rank": 4, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 4, "type": "Fight", "name": "地球上投" },
      { "rank": 4, "type": "Ice", "name": "冰凍拳" }
    ]
  },
  {
    "id": "063",
    "region": "kanto",
    "name": "凱西",
    "alias": "Abra",
    "type": [ "Psychic" ],
    "info": {
      "image": "images/pokedex/063.png",
      "height": "0.9",
      "weight": "19",
      "category": "念力寶可夢",
      "text": "They  are  attracted  to  the  cities and tend to live close to humans. Its Psychic abilities are still developing, it can sleep up to 18 hours a day or else  it  won’t  be  able  to  use  them. When in danger, it teleports away"
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
      "vit": { "value": 1, "max": 2 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "同步", "精神力" ],
    "moves": [
      { "rank": 0, "type": "Psychic", "name": "瞬間移​​動" },
      { "rank": 3, "type": "Normal", "name": "揮指" },
      { "rank": 3, "type": "Normal", "name": "模仿" },
      { "rank": 3, "type": "Bug", "name": "信號光束" }
    ],
    "isNovice": true
  },
  {
    "id": "064",
    "region": "kanto",
    "name": "勇基拉",
    "alias": "Kadabra",
    "type": [ "Psychic" ],
    "info": {
      "image": "images/pokedex/064.png",
      "height": "1.3",
      "weight": "16",
      "category": "念力寶可夢",
      "text": "Kadabra  holds  a  silver  spoon  in  its hand. The spoon is used to amplify the alpha waves of its brain.When this Pokémon walks in, objects near to it go crazy, moving in ways they shouldn’t."
    },
    "evolution": {
      "stage": "second",
      "with": "交換"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 3, "max": 7 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "同步", "精神力" ],
    "moves": [
      { "rank": 0, "type": "Psychic", "name": "折彎湯匙" },
      { "rank": 0, "type": "Psychic", "name": "瞬間移​​動" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 1, "type": "Psychic", "name": "奇蹟之眼" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 2, "type": "Psychic", "name": "扮演" },
      { "rank": 2, "type": "Psychic", "name": "反射壁" },
      { "rank": 2, "type": "Psychic", "name": "交換場地" },
      { "rank": 2, "type": "Psychic", "name": "精神利刃" },
      { "rank": 2, "type": "Psychic", "name": "意念移物" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 3, "type": "Normal", "name": "自我再生" },
      { "rank": 3, "type": "Psychic", "name": "預知未來" },
      { "rank": 3, "type": "Psychic", "name": "戲法" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 4, "type": "Dark", "name": "搶奪" },
      { "rank": 4, "type": "Dark", "name": "欺詐" },
      { "rank": 4, "type": "Psychic", "name": "奇妙空間" }
    ]
  },
  {
    "id": "065",
    "region": "kanto",
    "name": "胡地",
    "alias": "Alakazam",
    "type": [ "Psychic" ],
    "info": {
      "image": "images/pokedex/065.png",
      "height": "1.5",
      "weight": "48",
      "category": "念力寶可夢",
      "text": " A  Pokémon  that  can  memorize anything  and  never  forgets  what it learns. Over time it becomes too  smart  to  allow  anyone  to    be  its master. Alakazam’s psychic powers can be terrifying."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 3, "max": 7 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 7 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "同步", "精神力" ],
    "moves": [
      { "rank": 0, "type": "Psychic", "name": "折彎湯匙" },
      { "rank": 0, "type": "Psychic", "name": "瞬間移​​動" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 1, "type": "Psychic", "name": "奇蹟之眼" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 2, "type": "Psychic", "name": "扮演" },
      { "rank": 2, "type": "Psychic", "name": "反射壁" },
      { "rank": 2, "type": "Psychic", "name": "交換場地" },
      { "rank": 2, "type": "Psychic", "name": "精神利刃" },
      { "rank": 2, "type": "Psychic", "name": "意念移物" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 3, "type": "Normal", "name": "自我再生" },
      { "rank": 3, "type": "Psychic", "name": "預知未來" },
      { "rank": 3, "type": "Psychic", "name": "戲法" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 4, "type": "Dark", "name": "搶奪" },
      { "rank": 4, "type": "Dark", "name": "欺詐" },
      { "rank": 4, "type": "Psychic", "name": "奇妙空間" }
    ]
  },
  {
    "id": "065-M",
    "region": "kanto",
    "name": "超級胡地",
    "alias": "Alakazam",
    "type": [ "Psychic" ],
    "info": {
      "image": "images/pokedex/065-M.png",
      "height": "1.2",
      "weight": "48",
      "category": "念力寶可夢",
      "text": "With the power of the Mega Stone it is constantly plagued with visons of the future which make it great at evading  attacks.  Its  body  is  feeble and it moves purely through psychic energy. "
    },
    "evolution": {
      "stage": "mega"
    },
    "baseHP": 6,
    "rank": 4,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 4, "max": 8 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 4, "max": 9 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "複製" ],
    "moves": [
      { "rank": 0, "type": "Psychic", "name": "折彎湯匙" },
      { "rank": 0, "type": "Psychic", "name": "瞬間移​​動" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 1, "type": "Psychic", "name": "奇蹟之眼" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 2, "type": "Psychic", "name": "扮演" },
      { "rank": 2, "type": "Psychic", "name": "反射壁" },
      { "rank": 2, "type": "Psychic", "name": "交換場地" },
      { "rank": 2, "type": "Psychic", "name": "精神利刃" },
      { "rank": 2, "type": "Psychic", "name": "意念移物" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 3, "type": "Normal", "name": "自我再生" },
      { "rank": 3, "type": "Psychic", "name": "預知未來" },
      { "rank": 3, "type": "Psychic", "name": "戲法" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 4, "type": "Dark", "name": "搶奪" },
      { "rank": 4, "type": "Dark", "name": "欺詐" },
      { "rank": 4, "type": "Psychic", "name": "奇妙空間" }
    ]
  },
  {
    "id": "066",
    "region": "kanto",
    "name": "腕力",
    "alias": "Machop",
    "type": [ "Fight" ],
    "info": {
      "image": "images/pokedex/066.png",
      "height": "0.8",
      "weight": "20",
      "category": "怪力寶可夢",
      "text": "It lives in mountains, training its fists against strong rocks , lifting boulders and hurling Rock Pokémon around to build stronger muscles. Even with its small size, it can compete against expert humans and win."
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
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "毅力", "無防守" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Fight", "name": "踢倒" },
      { "rank": 1, "type": "Normal", "name": "識破" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Fight", "name": "空手劈" },
      { "rank": 2, "type": "Dark", "name": "拍落" },
      { "rank": 2, "type": "Dragon", "name": "二連劈" },
      { "rank": 2, "type": "Fight", "name": "地獄翻滾" },
      { "rank": 2, "type": "Fight", "name": "借力摔" },
      { "rank": 2, "type": "Fight", "name": "地球上投" },
      { "rank": 2, "type": "Fight", "name": "下盤踢" },
      { "rank": 2, "type": "Fight", "name": "喚醒巴掌" },
      { "rank": 2, "type": "Fight", "name": "報復" },
      { "rank": 3, "type": "Normal", "name": "鬼面" },
      { "rank": 3, "type": "Fight", "name": "健美" },
      { "rank": 3, "type": "Fight", "name": "爆裂拳" },
      { "rank": 3, "type": "Fight", "name": "十字劈" },
      { "rank": 4, "type": "Ice", "name": "冰凍拳" },
      { "rank": 4, "type": "Psychic", "name": "瑜伽姿勢" },
      { "rank": 4, "type": "Steel", "name": "子彈拳" }
    ],
    "isNovice": true
  },
  {
    "id": "067",
    "region": "kanto",
    "name": "豪力",
    "alias": "Machoke",
    "type": [ "Fight" ],
    "info": {
      "image": "images/pokedex/067.png",
      "height": "1.5",
      "weight": "70",
      "category": "怪力寶可夢",
      "text": " Even  with  its  strong  frame  and power,  it  is  a  humble  and  helpful Pokémon.  Many  of  them  work  for human  companies.  On  their  days off  you  can  see  them  heading  to the wild to train together."
    },
    "evolution": {
      "stage": "second",
      "with": "交換"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "毅力", "無防守" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Fight", "name": "踢倒" },
      { "rank": 1, "type": "Normal", "name": "識破" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Fight", "name": "空手劈" },
      { "rank": 2, "type": "Dark", "name": "拍落" },
      { "rank": 2, "type": "Dragon", "name": "二連劈" },
      { "rank": 2, "type": "Fight", "name": "地獄翻滾" },
      { "rank": 2, "type": "Fight", "name": "借力摔" },
      { "rank": 2, "type": "Fight", "name": "地球上投" },
      { "rank": 2, "type": "Fight", "name": "下盤踢" },
      { "rank": 2, "type": "Fight", "name": "喚醒巴掌" },
      { "rank": 2, "type": "Fight", "name": "報復" },
      { "rank": 3, "type": "Normal", "name": "鬼面" },
      { "rank": 3, "type": "Fight", "name": "健美" },
      { "rank": 3, "type": "Fight", "name": "爆裂拳" },
      { "rank": 3, "type": "Fight", "name": "十字劈" },
      { "rank": 4, "type": "Fire", "name": "火焰拳" },
      { "rank": 4, "type": "Psychic", "name": "瑜伽姿勢" },
      { "rank": 4, "type": "Steel", "name": "子彈拳" }
    ]
  },
  {
    "id": "068",
    "region": "kanto",
    "name": "怪力",
    "alias": "Machamp",
    "type": [ "Fight" ],
    "info": {
      "image": "images/pokedex/068.png",
      "height": "1.6",
      "weight": "130",
      "category": "怪力寶可夢",
      "text": "There  are  a  few  roaming  in  the mountains. Machamp has the power  to hurl anything aside. However, trying to do any work that requires  care  and  dexterity  may cause its arms to get tangled. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "毅力", "無防守" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "怪力" },
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Fight", "name": "踢倒" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Normal", "name": "識破" },
      { "rank": 1, "type": "Fight", "name": "空手劈" },
      { "rank": 2, "type": "Dark", "name": "拍落" },
      { "rank": 2, "type": "Dragon", "name": "二連劈" },
      { "rank": 2, "type": "Fight", "name": "地獄翻滾" },
      { "rank": 2, "type": "Fight", "name": "借力摔" },
      { "rank": 2, "type": "Fight", "name": "地球上投" },
      { "rank": 2, "type": "Fight", "name": "喚醒巴掌" },
      { "rank": 2, "type": "Fight", "name": "報復" },
      { "rank": 2, "type": "Fight", "name": "下盤踢" },
      { "rank": 2, "type": "Rock", "name": "廣域防守" },
      { "rank": 3, "type": "Normal", "name": "鬼面" },
      { "rank": 3, "type": "Fight", "name": "健美" },
      { "rank": 3, "type": "Fight", "name": "爆裂拳" },
      { "rank": 3, "type": "Fight", "name": "十字劈" },
      { "rank": 4, "type": "Normal", "name": "搔癢" },
      { "rank": 4, "type": "Electric", "name": "雷電拳" },
      { "rank": 4, "type": "Fight", "name": "近身戰" }
    ]
  },
  {
    "id": "069",
    "region": "kanto",
    "name": "喇叭芽",
    "alias": "Bellsprout",
    "type": [ "Grass", "Poison" ],
    "info": {
      "image": "images/pokedex/069.png",
      "height": "0.7",
      "weight": "4",
      "category": "花寶可夢",
      "text": "They live in hot and humid places, blending around with the flora. It  is  carnivorous  and  will  try  to  eat anything smaller than itself. It  digests  its  prey  with  an  acid  substance on its mouth."
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 0,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "葉綠素" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "生長" },
      { "rank": 0, "type": "Grass", "name": "藤鞭" },
      { "rank": 1, "type": "Normal", "name": "緊束" },
      { "rank": 1, "type": "Grass", "name": "催眠粉" },
      { "rank": 1, "type": "Poison", "name": "毒粉" },
      { "rank": 2, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 2, "type": "Dark", "name": "拍落" },
      { "rank": 2, "type": "Grass", "name": "麻痺粉" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 2, "type": "Poison", "name": "胃液" },
      { "rank": 2, "type": "Poison", "name": "溶解液" },
      { "rank": 3, "type": "Normal", "name": "絞緊" },
      { "rank": 3, "type": "Normal", "name": "摔打" },
      { "rank": 3, "type": "Poison", "name": "毒擊" },
      { "rank": 4, "type": "Normal", "name": "搔癢" },
      { "rank": 4, "type": "Normal", "name": "氣象球" },
      { "rank": 4, "type": "Grass", "name": "紮根" }
    ],
    "isNovice": true
  },
  {
    "id": "070",
    "region": "kanto",
    "name": "口呆花",
    "alias": "Weepinbell",
    "type": [ "Grass", "Poison" ],
    "info": {
      "image": "images/pokedex/070.png",
      "height": "1.0",
      "weight": "6",
      "category": "捕蠅寶可夢",
      "text": " It sprays its stun powder to immobilize  a  prey  comming  close  to  it,  then eats it calmly.  If the prey is bigger  than itself, it uses its sharp leaves to slice it into smaller pieces. Beware of the toxic liquid in its mouth."
    },
    "evolution": {
      "stage": "second",
      "with": "葉之石"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "葉綠素" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "生長" },
      { "rank": 0, "type": "Grass", "name": "藤鞭" },
      { "rank": 1, "type": "Normal", "name": "緊束" },
      { "rank": 1, "type": "Grass", "name": "催眠粉" },
      { "rank": 1, "type": "Poison", "name": "毒粉" },
      { "rank": 2, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 2, "type": "Dark", "name": "拍落" },
      { "rank": 2, "type": "Grass", "name": "麻痺粉" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 2, "type": "Poison", "name": "胃液" },
      { "rank": 2, "type": "Poison", "name": "溶解液" },
      { "rank": 3, "type": "Normal", "name": "摔打" },
      { "rank": 3, "type": "Normal", "name": "絞緊" },
      { "rank": 3, "type": "Poison", "name": "毒擊" },
      { "rank": 4, "type": "Normal", "name": "氣象球" },
      { "rank": 4, "type": "Normal", "name": "搔癢" },
      { "rank": 4, "type": "Grass", "name": "紮根" }
    ]
  },
  {
    "id": "071",
    "region": "kanto",
    "name": "大食花",
    "alias": "Victreebel",
    "type": [ "Grass", "Poison" ],
    "info": {
      "image": "images/pokedex/071.png",
      "height": "1.7",
      "weight": "15",
      "category": "捕蠅寶可夢",
      "text": "They  live  together  in  small  groups at tropical areas.  Victreebel uses a sweet honey-like smell to lure and attract  prey.  They  also  use  their long vines to rustle bushes around. They are territorial and aggressive. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "葉綠素" ],
    "moves": [
      { "rank": 0, "type": "Grass", "name": "藤鞭" },
      { "rank": 1, "type": "Normal", "name": "蓄力" },
      { "rank": 1, "type": "Normal", "name": "吞下" },
      { "rank": 1, "type": "Normal", "name": "噴出" },
      { "rank": 2, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 2, "type": "Grass", "name": "青草攪拌器" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 2, "type": "Grass", "name": "催眠粉" },
      { "rank": 3, "type": "Grass", "name": "葉刃" },
      { "rank": 3, "type": "Grass", "name": "飛葉風暴" },
      { "rank": 4, "type": "Grass", "name": "強力鞭打" },
      { "rank": 4, "type": "Grass", "name": "光合作用" },
      { "rank": 4, "type": "Poison", "name": "打嗝" }
    ]
  },
  {
    "id": "072",
    "region": "kanto",
    "name": "瑪瑙水母",
    "alias": "Tentacool",
    "type": [ "Water", "Poison" ],
    "info": {
      "image": "images/pokedex/072.png",
      "height": "0.9",
      "weight": "45",
      "category": "水母寶可夢",
      "text": "It  lives  in  the  seas  all  around  the world.  They  release  a  toxic  ink  if  startled. It is a surprisingly intelligent Pokémon and can use its tentacles to briefly establish a link between its mind and another creature. "
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "恆淨之軀", "污泥漿" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "超音波" },
      { "rank": 0, "type": "Poison", "name": "毒針" },
      { "rank": 1, "type": "Normal", "name": "纏繞" },
      { "rank": 1, "type": "Poison", "name": "溶解液" },
      { "rank": 2, "type": "Normal", "name": "緊束" },
      { "rank": 2, "type": "Poison", "name": "毒擊" },
      { "rank": 2, "type": "Poison", "name": "酸液炸彈" },
      { "rank": 2, "type": "Poison", "name": "毒菱" },
      { "rank": 2, "type": "Psychic", "name": "屏障" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 2, "type": "Water", "name": "泡沫光線" },
      { "rank": 2, "type": "Water", "name": "鹽水" },
      { "rank": 3, "type": "Normal", "name": "絞緊" },
      { "rank": 3, "type": "Normal", "name": "刺耳聲" },
      { "rank": 3, "type": "Ghost", "name": "禍不單行" },
      { "rank": 3, "type": "Poison", "name": "污泥波" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Ghost", "name": "奇異之光" },
      { "rank": 4, "type": "Ice", "name": "極光束" },
      { "rank": 4, "type": "Psychic", "name": "魔法反射" }
    ],
    "isNovice": true
  },
  {
    "id": "073",
    "region": "kanto",
    "name": "毒刺水母",
    "alias": "Tentacruel",
    "type": [ "Water", "Poison" ],
    "info": {
      "image": "images/pokedex/073.png",
      "height": "1.6",
      "weight": "55",
      "category": "水母寶可夢",
      "text": "Lives  in  rock  formations  at  the bottom  of  the  ocean.  It  can  grow tentacles at will and uses them to immobilize  prey.  Records  exist  of  a giant Tentacruel that sunk a fleet of pirate ships filled with treasure. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 3, "max": 7 }
    },
    "ability": [ "恆淨之軀", "污泥漿" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "超音波" },
      { "rank": 0, "type": "Poison", "name": "毒針" },
      { "rank": 1, "type": "Normal", "name": "纏繞" },
      { "rank": 1, "type": "Poison", "name": "溶解液" },
      { "rank": 2, "type": "Normal", "name": "緊束" },
      { "rank": 2, "type": "Poison", "name": "酸液炸彈" },
      { "rank": 2, "type": "Poison", "name": "毒擊" },
      { "rank": 2, "type": "Poison", "name": "毒菱" },
      { "rank": 2, "type": "Psychic", "name": "屏障" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 2, "type": "Water", "name": "泡沫光線" },
      { "rank": 2, "type": "Water", "name": "鹽水" },
      { "rank": 3, "type": "Normal", "name": "絞緊" },
      { "rank": 3, "type": "Normal", "name": "刺耳聲" },
      { "rank": 3, "type": "Normal", "name": "鏡面屬性" },
      { "rank": 3, "type": "Ghost", "name": "禍不單行" },
      { "rank": 3, "type": "Poison", "name": "污泥波" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Grass", "name": "終極吸取" },
      { "rank": 4, "type": "Psychic", "name": "鏡面反射" },
      { "rank": 4, "type": "Water", "name": "水流環" }
    ]
  },
  {
    "id": "074",
    "region": "kanto",
    "name": "小拳石",
    "alias": "Geodude",
    "type": [ "Rock", "Ground" ],
    "info": {
      "image": "images/pokedex/074.png",
      "height": "0.4",
      "weight": "20",
      "category": "岩石寶可夢",
      "text": "Lives  in  mountains  and  caves.  It looks  indistinguisable  from  other rocks around. Because of this, many trainers  step  on  them  and  are  attacked.  It rolls to move around and  eats whatever it finds on the floor. "
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "堅硬腦袋", "結實" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變圓" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Ground", "name": "玩泥巴" },
      { "rank": 1, "type": "Rock", "name": "岩石打磨" },
      { "rank": 1, "type": "Rock", "name": "滾動" },
      { "rank": 2, "type": "Normal", "name": "自爆" },
      { "rank": 2, "type": "Ground", "name": "震級" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 2, "type": "Rock", "name": "隱形岩" },
      { "rank": 2, "type": "Rock", "name": "岩石爆擊" },
      { "rank": 2, "type": "Rock", "name": "擊落" },
      { "rank": 2, "type": "Rock", "name": "落石" },
      { "rank": 3, "type": "Normal", "name": "大爆炸" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Ground", "name": "地震" },
      { "rank": 3, "type": "Rock", "name": "尖石攻擊" },
      { "rank": 4, "type": "Normal", "name": "攀岩" },
      { "rank": 4, "type": "Dark", "name": "突襲" },
      { "rank": 4, "type": "Rock", "name": "廣域防守" }
    ],
    "isNovice": true
  },
  {
    "id": "075",
    "region": "kanto",
    "name": "隆隆石",
    "alias": "Graveler",
    "type": [ "Rock", "Ground" ],
    "info": {
      "image": "images/pokedex/075.png",
      "height": "1.0",
      "weight": "105",
      "category": "岩石寶可夢",
      "text": "It walks slowly, but it can get a nice speed by rolling downhill. It  is  good  at  climbing.  Groups  of them have been seen clinging from rock formations and cliffs to eat the tasty rocks covered in moss."
    },
    "evolution": {
      "stage": "second",
      "with": "交換"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "堅硬腦袋", "結實" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變圓" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Ground", "name": "玩泥巴" },
      { "rank": 1, "type": "Rock", "name": "岩石打磨" },
      { "rank": 1, "type": "Rock", "name": "滾動" },
      { "rank": 2, "type": "Normal", "name": "自爆" },
      { "rank": 2, "type": "Ground", "name": "震級" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 2, "type": "Rock", "name": "隱形岩" },
      { "rank": 2, "type": "Rock", "name": "岩石爆擊" },
      { "rank": 2, "type": "Rock", "name": "擊落" },
      { "rank": 2, "type": "Rock", "name": "落石" },
      { "rank": 3, "type": "Normal", "name": "大爆炸" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Ground", "name": "地震" },
      { "rank": 3, "type": "Rock", "name": "尖石攻擊" },
      { "rank": 4, "type": "Normal", "name": "攀岩" },
      { "rank": 4, "type": "Dark", "name": "突襲" },
      { "rank": 4, "type": "Rock", "name": "廣域防守" }
    ]
  },
  {
    "id": "076",
    "region": "kanto",
    "name": "隆隆岩",
    "alias": "Golem",
    "type": [ "Rock", "Ground" ],
    "info": {
      "image": "images/pokedex/076.png",
      "height": "1.4",
      "weight": "300",
      "category": "重量級寶可夢",
      "text": "It  is  rare  to  see  in  the  wild  since it  lives  high  on  the  mountains.  It  withdraws its head and legs as if it were a turtle to roll around. There have  been  cases  of  Golems  who resist dynamite blasts unscathed."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 8 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 3, "max": 7 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "堅硬腦袋", "結實" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變圓" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Bug", "name": "瘋狂滾壓" },
      { "rank": 1, "type": "Ground", "name": "玩泥巴" },
      { "rank": 1, "type": "Rock", "name": "岩石打磨" },
      { "rank": 2, "type": "Normal", "name": "自爆" },
      { "rank": 2, "type": "Ground", "name": "震級" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 2, "type": "Rock", "name": "隱形岩" },
      { "rank": 2, "type": "Rock", "name": "岩石爆擊" },
      { "rank": 2, "type": "Rock", "name": "擊落" },
      { "rank": 2, "type": "Rock", "name": "落石" },
      { "rank": 3, "type": "Normal", "name": "大爆炸" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Ground", "name": "地震" },
      { "rank": 3, "type": "Rock", "name": "尖石攻擊" },
      { "rank": 3, "type": "Steel", "name": "重磅衝撞" },
      { "rank": 4, "type": "Electric", "name": "雷電拳" },
      { "rank": 4, "type": "Fight", "name": "蠻力" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ]
  },
  {
    "id": "074-A",
    "region": "alola",
    "name": "小拳石 (阿羅拉的樣子)",
    "alias": "Geodude",
    "type": [ "Rock", "Electric" ],
    "info": {
      "image": "images/pokedex/074-A.png",
      "height": "0.4",
      "weight": "20",
      "category": "岩石寶可夢",
      "text": "阿羅拉地區火特力山上的磁場讓小拳石的身體演化出了充電器。牠們往往會把自己偽裝成普通的岩石，最好多加小心，因為要是不小心踩到牠們，你就會因為觸電而大吃苦頭。"
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
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "磁力", "結實" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "變圓" },
      { "rank": 1, "type": "Electric", "name": "充電" },
      { "rank": 1, "type": "Rock", "name": "岩石打磨" },
      { "rank": 1, "type": "Rock", "name": "滾動" },
      { "rank": 2, "type": "Electric", "name": "電光" },
      { "rank": 2, "type": "Rock", "name": "落石" },
      { "rank": 2, "type": "Rock", "name": "擊落" },
      { "rank": 2, "type": "Electric", "name": "雷電拳" },
      { "rank": 2, "type": "Normal", "name": "自爆" },
      { "rank": 2, "type": "Rock", "name": "隱形岩" },
      { "rank": 2, "type": "Rock", "name": "岩石爆擊" },
      { "rank": 3, "type": "Electric", "name": "放電" },
      { "rank": 3, "type": "Normal", "name": "大爆炸" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Rock", "name": "尖石攻擊" },
      { "rank": 4, "type": "Normal", "name": "攀岩" },
      { "rank": 4, "type": "Rock", "name": "廣域防守" },
      { "rank": 4, "type": "Normal", "name": "刺耳聲" }
    ],
    "isNovice": true
  },
  {
    "id": "075-A",
    "region": "alola",
    "name": "隆隆石 (阿羅拉的樣子)",
    "alias": "Graveler",
    "type": [ "Rock", "Electric" ],
    "info": {
      "image": "images/pokedex/075-A.png",
      "height": "1.0",
      "weight": "110",
      "category": "岩石寶可夢",
      "text": "這些寶可夢透過滾動來給自己充電。兩隻阿羅拉隆隆石互相爭鬥時是相當危險的，會發出能從很遠的地方看到和聽到巨大的聲音和閃光。牠們以金色的電氣石為食。"
    },
    "evolution": {
      "stage": "second",
      "with": "交換"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "磁力", "結實" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "變圓" },
      { "rank": 1, "type": "Electric", "name": "充電" },
      { "rank": 1, "type": "Rock", "name": "岩石打磨" },
      { "rank": 1, "type": "Rock", "name": "滾動" },
      { "rank": 2, "type": "Electric", "name": "電光" },
      { "rank": 2, "type": "Rock", "name": "落石" },
      { "rank": 2, "type": "Rock", "name": "擊落" },
      { "rank": 2, "type": "Electric", "name": "雷電拳" },
      { "rank": 2, "type": "Normal", "name": "自爆" },
      { "rank": 2, "type": "Rock", "name": "隱形岩" },
      { "rank": 2, "type": "Rock", "name": "岩石爆擊" },
      { "rank": 3, "type": "Electric", "name": "放電" },
      { "rank": 3, "type": "Normal", "name": "大爆炸" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Rock", "name": "尖石攻擊" },
      { "rank": 4, "type": "Normal", "name": "攀岩" },
      { "rank": 4, "type": "Rock", "name": "廣域防守" },
      { "rank": 4, "type": "Normal", "name": "刺耳聲" }
    ]
  },
  {
    "id": "076-A",
    "region": "alola",
    "name": "隆隆岩 (阿羅拉的樣子)",
    "alias": "Golem",
    "type": [ "Rock", "Electric" ],
    "info": {
      "image": "images/pokedex/076-A.png",
      "height": "1.4",
      "weight": "300",
      "category": "重量級寶可夢",
      "text": "阿羅拉亞種的隆隆岩並不像牠原本的品種那樣會到處滾動，取而代之的是，牠會把岩石裝進牠頭上的充電器然後四處發射出去；就算岩石沒有打中，光靠電擊波也能解決對手。"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 3, "max": 7 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "電氣皮膚", "結實" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "變圓" },
      { "rank": 1, "type": "Electric", "name": "充電" },
      { "rank": 1, "type": "Rock", "name": "岩石打磨" },
      { "rank": 1, "type": "Rock", "name": "滾動" },
      { "rank": 2, "type": "Electric", "name": "電光" },
      { "rank": 2, "type": "Rock", "name": "落石" },
      { "rank": 2, "type": "Rock", "name": "擊落" },
      { "rank": 2, "type": "Electric", "name": "雷電拳" },
      { "rank": 2, "type": "Normal", "name": "自爆" },
      { "rank": 2, "type": "Rock", "name": "隱形岩" },
      { "rank": 2, "type": "Rock", "name": "岩石爆擊" },
      { "rank": 3, "type": "Electric", "name": "放電" },
      { "rank": 3, "type": "Normal", "name": "大爆炸" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Rock", "name": "尖石攻擊" },
      { "rank": 3, "type": "Steel", "name": "重磅衝撞" },
      { "rank": 4, "type": "Electric", "name": "電磁漂浮" },
      { "rank": 4, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 4, "type": "Electric", "name": "瘋狂伏特" }
    ]
  },
  {
    "id": "077",
    "region": "kanto",
    "name": "小火馬",
    "alias": "Ponyta",
    "type": [ "Fire" ],
    "info": {
      "image": "images/pokedex/077.png",
      "height": "1.0",
      "weight": "60",
      "category": "火馬寶可夢",
      "text": "It’s not very common to see one stay still  for  more  than  a  few  seconds.  Soon after it’s born, its flames begin  to burn. It is weak at first but soon begins  to  develop  a  great  speed chasing after its parents."
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "逃跑", "引火" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "猛撞" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Fire", "name": "火花" },
      { "rank": 1, "type": "Fire", "name": "火焰輪" },
      { "rank": 2, "type": "Normal", "name": "踩踏" },
      { "rank": 2, "type": "Fire", "name": "煉獄" },
      { "rank": 2, "type": "Fire", "name": "火焰旋渦" },
      { "rank": 2, "type": "Fire", "name": "蓄能焰襲" },
      { "rank": 3, "type": "Fire", "name": "閃焰衝鋒" },
      { "rank": 3, "type": "Fire", "name": "大字爆炎" },
      { "rank": 3, "type": "Flying", "name": "彈跳" },
      { "rank": 3, "type": "Psychic", "name": "高速移動" },
      { "rank": 4, "type": "Normal", "name": "晨光" },
      { "rank": 4, "type": "Fight", "name": "二連踢" },
      { "rank": 4, "type": "Psychic", "name": "催眠術" }
    ],
    "isNovice": true
  },
  {
    "id": "078",
    "region": "kanto",
    "name": "烈焰馬",
    "alias": "Rapidash",
    "type": [ "Fire" ],
    "info": {
      "image": "images/pokedex/078.png",
      "height": "1.7",
      "weight": "190",
      "category": "火馬寶可夢",
      "text": "It lives happily on prairies. It loves speed competitions - a herd can often be seen running alongside  a train. It can regulate the heat of its mane as to let its trainer ride it, but only if it trusts him enough."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "逃跑", "引火" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Fire", "name": "火花" },
      { "rank": 1, "type": "Normal", "name": "猛撞" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 1, "type": "Fire", "name": "火焰輪" },
      { "rank": 2, "type": "Normal", "name": "踩踏" },
      { "rank": 2, "type": "Normal", "name": "亂擊" },
      { "rank": 2, "type": "Bug", "name": "超級角擊" },
      { "rank": 2, "type": "Fire", "name": "煉獄" },
      { "rank": 2, "type": "Fire", "name": "火焰旋渦" },
      { "rank": 2, "type": "Fire", "name": "蓄能焰襲" },
      { "rank": 2, "type": "Poison", "name": "毒擊" },
      { "rank": 3, "type": "Fire", "name": "閃焰衝鋒" },
      { "rank": 3, "type": "Fire", "name": "大字爆炎" },
      { "rank": 3, "type": "Flying", "name": "彈跳" },
      { "rank": 3, "type": "Psychic", "name": "高速移動" },
      { "rank": 4, "type": "Normal", "name": "角鑽" },
      { "rank": 4, "type": "Normal", "name": "晨光" },
      { "rank": 4, "type": "Ground", "name": "直衝鑽" }
    ]
  },
  {
    "id": "079",
    "region": "kanto",
    "name": "呆呆獸",
    "alias": "Slowpoke",
    "type": [ "Water", "Psychic" ],
    "info": {
      "image": "images/pokedex/079.png",
      "height": "1.2",
      "weight": "36",
      "category": "憨憨寶可夢",
      "text": "It lives close to water. This Pokémon  has a low intellect, and it’s slow to react to any stimuli. Its tail seeps a sweet substance it uses to lure prey to  eat.  When  the  tip  turns  white  shellders will be attracted to it."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 2 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "遲鈍", "我行我素" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "哈欠" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Ghost", "name": "詛咒" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Normal", "name": "偷懶" },
      { "rank": 2, "type": "Normal", "name": "定身法" },
      { "rank": 2, "type": "Psychic", "name": "瞬間失憶" },
      { "rank": 2, "type": "Psychic", "name": "意念頭鎚" },
      { "rank": 2, "type": "Psychic", "name": "念力" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 3, "type": "Normal", "name": "自我暗示" },
      { "rank": 3, "type": "Psychic", "name": "治愈波動" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Water", "name": "求雨" },
      { "rank": 4, "type": "Ground", "name": "玩泥巴" },
      { "rank": 4, "type": "Ice", "name": "冰凍之風" },
      { "rank": 4, "type": "Psychic", "name": "預知未來" }
    ],
    "isNovice": true
  },
  {
    "id": "080",
    "region": "kanto",
    "name": "呆殼獸",
    "alias": "Slowbro",
    "type": [ "Water", "Psychic" ],
    "info": {
      "image": "images/pokedex/080.png",
      "height": "1.6",
      "weight": "78",
      "category": "寄居蟹寶可夢",
      "text": "This Pokémon fused with a Shellder  that  bit  into  its  tail.  It’s  a  slow  swimmer and doesn’t react to pain but Shellder tends to keep it out of trouble."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "遲鈍", "我行我素" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "哈欠" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Ghost", "name": "詛咒" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Normal", "name": "偷懶" },
      { "rank": 2, "type": "Normal", "name": "定身法" },
      { "rank": 2, "type": "Psychic", "name": "意念頭鎚" },
      { "rank": 2, "type": "Psychic", "name": "念力" },
      { "rank": 2, "type": "Psychic", "name": "瞬間失憶" },
      { "rank": 2, "type": "Water", "name": "縮入殼中" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 3, "type": "Normal", "name": "自我暗示" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Psychic", "name": "治愈波動" },
      { "rank": 3, "type": "Water", "name": "求雨" },
      { "rank": 4, "type": "Normal", "name": "腹鼓" },
      { "rank": 4, "type": "Psychic", "name": "預知未來" },
      { "rank": 4, "type": "Water", "name": "水流尾" }
    ]
  },
  {
    "id": "080-M",
    "region": "kanto",
    "name": "超級呆殼獸",
    "alias": "Slowbro",
    "type": [ "Water", "Psychic" ],
    "info": {
      "image": "images/pokedex/080-M.png",
      "height": "2.0",
      "weight": "120",
      "category": "寄居蟹寶可夢",
      "text": "With the power of the Mega Stone the  Shellder  on  its  tail  becomes  a bulletproof  armor  that  swallows  its host’s whole body. Slowpoke doesn’t seem to mind and looks pretty comfy to nest inside."
    },
    "evolution": {
      "stage": "mega"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 1, "max": 2 },
      "vit": { "value": 4, "max": 9 },
      "spe": { "value": 3, "max": 7 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "硬殼盔甲" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "哈欠" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Ghost", "name": "詛咒" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Normal", "name": "偷懶" },
      { "rank": 2, "type": "Normal", "name": "定身法" },
      { "rank": 2, "type": "Psychic", "name": "意念頭鎚" },
      { "rank": 2, "type": "Psychic", "name": "念力" },
      { "rank": 2, "type": "Psychic", "name": "瞬間失憶" },
      { "rank": 2, "type": "Water", "name": "縮入殼中" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 3, "type": "Normal", "name": "自我暗示" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Psychic", "name": "治愈波動" },
      { "rank": 3, "type": "Water", "name": "求雨" },
      { "rank": 4, "type": "Normal", "name": "腹鼓" },
      { "rank": 4, "type": "Psychic", "name": "預知未來" },
      { "rank": 4, "type": "Water", "name": "水流尾" }
    ]
  },
  {
    "id": "081",
    "region": "kanto",
    "name": "小磁怪",
    "alias": "Magnemite",
    "type": [ "Electric", "Steel" ],
    "info": {
      "image": "images/pokedex/081.png",
      "height": "0.3",
      "weight": "6",
      "category": "磁鐵寶可夢",
      "text": " It  lurks  near  electric  facilities  and mountains as it is attracted by big magnetic fields. It is not aggressive and  usually  defends  itself  with  a screech or a weak electric impulse to deter other from attacking."
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "磁力", "結實" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "超音波" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "音爆" },
      { "rank": 1, "type": "Electric", "name": "電擊" },
      { "rank": 2, "type": "Normal", "name": "鎖定" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Electric", "name": "電磁飄浮" },
      { "rank": 2, "type": "Electric", "name": "電光" },
      { "rank": 2, "type": "Electric", "name": "電磁波" },
      { "rank": 2, "type": "Electric", "name": "電球" },
      { "rank": 2, "type": "Psychic", "name": "光牆" },
      { "rank": 2, "type": "Steel", "name": "加農光炮" },
      { "rank": 2, "type": "Steel", "name": "金屬音" },
      { "rank": 2, "type": "Steel", "name": "鏡光射擊" },
      { "rank": 2, "type": "Steel", "name": "磁鐵炸彈" },
      { "rank": 3, "type": "Electric", "name": "電磁炮" },
      { "rank": 3, "type": "Electric", "name": "放電" },
      { "rank": 3, "type": "Steel", "name": "陀螺球" },
      { "rank": 4, "type": "Bug", "name": "信號光束" },
      { "rank": 4, "type": "Psychic", "name": "重力" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ],
    "isNovice": true
  },
  {
    "id": "082",
    "region": "kanto",
    "name": "三合一磁怪",
    "alias": "Magneton",
    "type": [ "Electric", "Steel" ],
    "info": {
      "image": "images/pokedex/082.png",
      "height": "1.0",
      "weight": "60",
      "category": "磁鐵寶可夢",
      "text": "Sometimes three Magnemites fuse into  this  Pokémon;  other  times a  single  one  sprouts  two  others. This  species  is  greatly  affected  by  magnetic  fields.  Magnetons  are  eager to please their trainers. "
    },
    "evolution": {
      "stage": "second",
      "time": "slow"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 3, "max": 7 },
      "ins": { "value": 2, "max": 6 }
    },
    "ability": [ "磁力", "結實" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "超音波" },
      { "rank": 1, "type": "Normal", "name": "音爆" },
      { "rank": 1, "type": "Normal", "name": "三重攻擊" },
      { "rank": 1, "type": "Electric", "name": "電氣場地" },
      { "rank": 1, "type": "Electric", "name": "電擊" },
      { "rank": 2, "type": "Normal", "name": "鎖定" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Electric", "name": "電磁飄浮" },
      { "rank": 2, "type": "Electric", "name": "電光" },
      { "rank": 2, "type": "Electric", "name": "電磁波" },
      { "rank": 2, "type": "Electric", "name": "電球" },
      { "rank": 2, "type": "Psychic", "name": "光牆" },
      { "rank": 2, "type": "Steel", "name": "加農光炮" },
      { "rank": 2, "type": "Steel", "name": "金屬音" },
      { "rank": 2, "type": "Steel", "name": "鏡光射擊" },
      { "rank": 2, "type": "Steel", "name": "磁鐵炸彈" },
      { "rank": 3, "type": "Electric", "name": "電磁炮" },
      { "rank": 3, "type": "Electric", "name": "放電" },
      { "rank": 3, "type": "Steel", "name": "陀螺球" },
      { "rank": 4, "type": "Bug", "name": "信號光束" },
      { "rank": 4, "type": "Psychic", "name": "重力" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ]
  },
  {
    "id": "083",
    "region": "kanto",
    "name": "大蔥鴨",
    "alias": "Farfetchd",
    "type": [ "Normal", "Flying" ],
    "info": {
      "image": "images/pokedex/083.png",
      "height": "0.8",
      "weight": "15",
      "category": "黃嘴鴨寶可夢",
      "text": "There  used  to  be  whole  flocks  of  them  in  meadows  near  the  lakes.Now  they  are  almost  extinct  because their meat is delicious. They are fond of leeks and celery, they carry them around as sticks."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "銳利目光", "精神力" ],
    "moves": [
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 0, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Bug", "name": "連斬" },
      { "rank": 2, "type": "Normal", "name": "劍舞" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Normal", "name": "亂擊" },
      { "rank": 2, "type": "Dark", "name": "拍落" },
      { "rank": 2, "type": "Flying", "name": "空氣利刃" },
      { "rank": 2, "type": "Flying", "name": "雜技" },
      { "rank": 2, "type": "Poison", "name": "毒擊" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Normal", "name": "佯攻" },
      { "rank": 3, "type": "Normal", "name": "點到為止" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Flying", "name": "空氣斬" },
      { "rank": 3, "type": "Flying", "name": "勇鳥猛攻" },
      { "rank": 4, "type": "Flying", "name": "羽棲" },
      { "rank": 4, "type": "Flying", "name": "羽毛舞" },
      { "rank": 4, "type": "Grass", "name": "葉刃" }
    ]
  },
  {
    "id": "084",
    "region": "kanto",
    "name": "嘟嘟",
    "alias": "Doduo",
    "type": [ "Normal", "Flying" ],
    "info": {
      "image": "images/pokedex/084.png",
      "height": "1.4",
      "weight": "40",
      "category": "兩頭鳥寶可夢",
      "text": "It can fly, but it prefers to run in the prairies. The two heads usually get along. While one is eating or sleeping,  the other one is alert for predators. It is known that they share a brain and their ideas are connected."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "逃跑", "早起" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 1, "type": "Normal", "name": "憤怒" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Normal", "name": "二連擊" },
      { "rank": 2, "type": "Normal", "name": "吵鬧" },
      { "rank": 2, "type": "Normal", "name": "劍舞" },
      { "rank": 2, "type": "Normal", "name": "點穴" },
      { "rank": 2, "type": "Normal", "name": "亂擊" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Flying", "name": "啄食" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Normal", "name": "大鬧一番" },
      { "rank": 3, "type": "Normal", "name": "蠻幹" },
      { "rank": 3, "type": "Fight", "name": "飛踢" },
      { "rank": 3, "type": "Flying", "name": "啄鑽" },
      { "rank": 4, "type": "Dark", "name": "出奇一擊" },
      { "rank": 4, "type": "Flying", "name": "勇鳥猛攻" },
      { "rank": 4, "type": "Flying", "name": "鸚鵡學舌" }
    ],
    "isNovice": true
  },
  {
    "id": "085",
    "region": "kanto",
    "name": "嘟嘟利",
    "alias": "Dodrio",
    "type": [ "Normal", "Flying" ],
    "info": {
      "image": "images/pokedex/085.png",
      "height": "1.8",
      "weight": "85",
      "category": "三頭鳥寶可夢",
      "text": " A third head comes to change the dynamic  the  two  original  had.  It  is common  to  see  the  three  heads fighting.  Each  one  has  its  own  personality, but when they work as a team they can be very powerful."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "逃跑", "早起" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 1, "type": "Normal", "name": "電光一閃" },
      { "rank": 1, "type": "Normal", "name": "憤怒" },
      { "rank": 2, "type": "Normal", "name": "三重攻擊" },
      { "rank": 2, "type": "Normal", "name": "吵鬧" },
      { "rank": 2, "type": "Normal", "name": "亂擊" },
      { "rank": 2, "type": "Normal", "name": "劍舞" },
      { "rank": 2, "type": "Normal", "name": "點穴" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Flying", "name": "啄食" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Normal", "name": "大鬧一番" },
      { "rank": 3, "type": "Normal", "name": "蠻幹" },
      { "rank": 3, "type": "Fight", "name": "飛踢" },
      { "rank": 3, "type": "Flying", "name": "啄鑽" },
      { "rank": 4, "type": "Dark", "name": "出奇一擊" },
      { "rank": 4, "type": "Flying", "name": "勇鳥猛攻" },
      { "rank": 4, "type": "Flying", "name": "鸚鵡學舌" }
    ]
  },
  {
    "id": "086",
    "region": "kanto",
    "name": "小海獅",
    "alias": "Seel",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/086.png",
      "height": "1.1",
      "weight": "90",
      "category": "海獅寶可夢",
      "text": "A Pokémon that lives on icebergs. It swims in the sea using the point on its head to break up the ice.It  sleeps  a  lot  during  the  day,  being  most  active  at  dawn  when the temperature starts to cool."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "厚脂肪", "濕潤之軀" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Water", "name": "玩水" },
      { "rank": 1, "type": "Normal", "name": "猛撞" },
      { "rank": 1, "type": "Normal", "name": "再來一次" },
      { "rank": 1, "type": "Ice", "name": "冰凍之風" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Ice", "name": "冰礫" },
      { "rank": 2, "type": "Ice", "name": "極光束" },
      { "rank": 2, "type": "Psychic", "name": "睡覺" },
      { "rank": 2, "type": "Water", "name": "水流噴射" },
      { "rank": 2, "type": "Water", "name": "水流環" },
      { "rank": 2, "type": "Water", "name": "潛水" },
      { "rank": 2, "type": "Water", "name": "鹽水" },
      { "rank": 3, "type": "Normal", "name": "神秘守護" },
      { "rank": 3, "type": "Ice", "name": "冰雹" },
      { "rank": 3, "type": "Ice", "name": "冰凍光束" },
      { "rank": 3, "type": "Water", "name": "水流尾" },
      { "rank": 4, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 4, "type": "Bug", "name": "信號光束" },
      { "rank": 4, "type": "Ghost", "name": "舌舔" }
    ],
    "isNovice": true
  },
  {
    "id": "087",
    "region": "kanto",
    "name": "白海獅",
    "alias": "Dewgong",
    "type": [ "Water", "Ice" ],
    "info": {
      "image": "images/pokedex/087.png",
      "height": "1.7",
      "weight": "120",
      "category": "海獅寶可夢",
      "text": "Its body is covered with a pure white fur.  The  colder  the  weather,  the more active it becomes. It hunts at night and it’s excellent at catching  fish Pokémon. It is also very intelligent and playful. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "厚脂肪", "濕潤之軀" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Bug", "name": "信號光束" },
      { "rank": 1, "type": "Normal", "name": "猛撞" },
      { "rank": 1, "type": "Normal", "name": "再來一次" },
      { "rank": 1, "type": "Ice", "name": "冰凍之風" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Ice", "name": "絕對零度" },
      { "rank": 2, "type": "Ice", "name": "冰礫" },
      { "rank": 2, "type": "Ice", "name": "極光束" },
      { "rank": 2, "type": "Psychic", "name": "睡覺" },
      { "rank": 2, "type": "Water", "name": "潛水" },
      { "rank": 2, "type": "Water", "name": "水流噴射" },
      { "rank": 2, "type": "Water", "name": "水流環" },
      { "rank": 2, "type": "Water", "name": "鹽水" },
      { "rank": 3, "type": "Normal", "name": "神秘守護" },
      { "rank": 3, "type": "Ice", "name": "冰雹" },
      { "rank": 3, "type": "Ice", "name": "冰凍光束" },
      { "rank": 3, "type": "Water", "name": "水流尾" },
      { "rank": 4, "type": "Normal", "name": "滅亡之歌" },
      { "rank": 4, "type": "Normal", "name": "角鑽" },
      { "rank": 4, "type": "Ice", "name": "雪崩" }
    ]
  },
  {
    "id": "088",
    "region": "kanto",
    "name": "臭泥",
    "alias": "Grimer",
    "type": [ "Poison" ],
    "info": {
      "image": "images/pokedex/088.png",
      "height": "0.9",
      "weight": "30",
      "category": "污泥寶可夢",
      "text": "It  was  born  from  polluted  sludge in  the  sea.  Grimer’s  favorite  food is  anything  filthy  like  waste  water pumped  out  from  factories.  Grime and  sludge  stick  to  their  body  making them grow larger over time. "
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
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
    "ability": [ "惡臭", "黏著" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "拍擊" },
      { "rank": 0, "type": "Poison", "name": "毒瓦斯" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 1, "type": "Normal", "name": "變硬" },
      { "rank": 1, "type": "Ground", "name": "擲泥" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Normal", "name": "變小" },
      { "rank": 2, "type": "Dark", "name": "投擲" },
      { "rank": 2, "type": "Ground", "name": "泥巴炸彈" },
      { "rank": 2, "type": "Poison", "name": "污泥攻擊" },
      { "rank": 2, "type": "Poison", "name": "污泥炸彈" },
      { "rank": 3, "type": "Dark", "name": "臨別禮物" },
      { "rank": 3, "type": "Poison", "name": "垃圾射擊" },
      { "rank": 3, "type": "Poison", "name": "污泥波" },
      { "rank": 3, "type": "Poison", "name": "打嗝" },
      { "rank": 3, "type": "Poison", "name": "溶化" },
      { "rank": 4, "type": "Normal", "name": "鬼面" },
      { "rank": 4, "type": "Ghost", "name": "影子偷襲" },
      { "rank": 4, "type": "Grass", "name": "終極吸取" }
    ],
    "isNovice": true
  },
  {
    "id": "088-A",
    "region": "alola",
    "name": "臭泥 (阿羅拉的樣子)",
    "alias": "Grimer",
    "type": [ "Poison", "Dark" ],
    "info": {
      "image": "images/pokedex/088-A.png",
      "height": "0.7",
      "weight": "42",
      "category": "污泥寶可夢",
      "text": "Grimer were brought into Alola to eat garbage  on  the  region.  It  seemed  like a counterintuitive measure but ended up solving the problem. But now  Grimer  are  incredibly  noxious, much more toxic than usual."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
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
    "ability": [ "毒手", "化學之力" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "拍擊" },
      { "rank": 0, "type": "Poison", "name": "毒瓦斯" },
      { "rank": 1, "type": "Normal", "name": "變硬" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 2, "type": "Poison", "name": "酸液炸彈" },
      { "rank": 2, "type": "Poison", "name": "劇毒牙" },
      { "rank": 2, "type": "Normal", "name": "變小" },
      { "rank": 2, "type": "Dark", "name": "投擲" },
      { "rank": 2, "type": "Dark", "name": "拍落" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 3, "type": "Poison", "name": "垃圾射擊" },
      { "rank": 3, "type": "Poison", "name": "溶化" },
      { "rank": 3, "type": "Poison", "name": "打嗝" },
      { "rank": 3, "type": "Dark", "name": "臨別禮物" },
      { "rank": 4, "type": "Dark", "name": "惡意追擊" },
      { "rank": 4, "type": "Poison", "name": "清除之煙" },
      { "rank": 4, "type": "Ghost", "name": "影子偷襲" }
    ],
    "isNovice": true
  },
  {
    "id": "089",
    "region": "kanto",
    "name": "臭臭泥",
    "alias": "Muk",
    "type": [ "Poison" ],
    "info": {
      "image": "images/pokedex/089.png",
      "height": "1.2",
      "weight": "60",
      "category": "污泥寶可夢",
      "text": "It gathers on polluted areas to eat filth. Its body is made of a powerful poison that kills any plant. Touching it can cause a fever that will require bed  rest.  A  good  diet  may  reduce Muk’s toxicity."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "惡臭", "黏著" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "拍擊" },
      { "rank": 0, "type": "Normal", "name": "拍擊" },
      { "rank": 0, "type": "Poison", "name": "毒瓦斯" },
      { "rank": 0, "type": "Poison", "name": "毒瓦斯" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 1, "type": "Normal", "name": "變硬" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 1, "type": "Normal", "name": "變硬" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Ground", "name": "擲泥" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Normal", "name": "變小" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Normal", "name": "變小" },
      { "rank": 2, "type": "Dark", "name": "投擲" },
      { "rank": 2, "type": "Dark", "name": "拍落" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 2, "type": "Dark", "name": "投擲" },
      { "rank": 2, "type": "Ground", "name": "泥巴炸彈" },
      { "rank": 2, "type": "Poison", "name": "污泥炸彈" },
      { "rank": 2, "type": "Poison", "name": "污泥攻擊" },
      { "rank": 2, "type": "Poison", "name": "毒液陷阱" },
      { "rank": 2, "type": "Poison", "name": "酸液炸彈" },
      { "rank": 2, "type": "Poison", "name": "劇毒牙" },
      { "rank": 3, "type": "Dark", "name": "臨別禮物" },
      { "rank": 3, "type": "Dark", "name": "臨別禮物" },
      { "rank": 3, "type": "Poison", "name": "打嗝" },
      { "rank": 3, "type": "Poison", "name": "溶化" },
      { "rank": 3, "type": "Poison", "name": "垃圾射擊" },
      { "rank": 3, "type": "Poison", "name": "污泥波" },
      { "rank": 3, "type": "Poison", "name": "溶化" },
      { "rank": 3, "type": "Poison", "name": "打嗝" },
      { "rank": 3, "type": "Poison", "name": "垃圾射擊" },
      { "rank": 4, "type": "Normal", "name": "自爆" },
      { "rank": 4, "type": "Dark", "name": "惡意追擊" },
      { "rank": 4, "type": "Ghost", "name": "影子偷襲" },
      { "rank": 4, "type": "Ghost", "name": "影子偷襲" },
      { "rank": 4, "type": "Grass", "name": "終極吸取" },
      { "rank": 4, "type": "Poison", "name": "清除之煙" }
    ]
  },
  {
    "id": "089-A",
    "region": "alola",
    "name": "臭臭泥 (阿羅拉的樣子)",
    "alias": "Muk",
    "type": [ "Poison", "Dark" ],
    "info": {
      "image": "images/pokedex/089-A.png",
      "height": "1.0",
      "weight": "52",
      "category": "污泥寶可夢",
      "text": "It is as friendly as it is toxic, be careful for it tries to hug others regularly. A good diet does not help reduce its toxicity levels, it only makes it cranky and  prone  to  destroy  furniture.  It releases toxic fumes all the time."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "毒手", "化學之力" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "拍擊" },
      { "rank": 0, "type": "Poison", "name": "毒瓦斯" },
      { "rank": 1, "type": "Normal", "name": "變硬" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 2, "type": "Poison", "name": "酸液炸彈" },
      { "rank": 2, "type": "Poison", "name": "劇毒牙" },
      { "rank": 2, "type": "Normal", "name": "變小" },
      { "rank": 2, "type": "Dark", "name": "投擲" },
      { "rank": 2, "type": "Dark", "name": "拍落" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Poison", "name": "毒液陷阱" },
      { "rank": 3, "type": "Poison", "name": "垃圾射擊" },
      { "rank": 3, "type": "Poison", "name": "溶化" },
      { "rank": 3, "type": "Poison", "name": "打嗝" },
      { "rank": 3, "type": "Dark", "name": "臨別禮物" },
      { "rank": 4, "type": "Normal", "name": "蓄力" },
      { "rank": 4, "type": "Normal", "name": "吞下" },
      { "rank": 4, "type": "Ghost", "name": "影子偷襲" }
    ]
  },
  {
    "id": "090",
    "region": "kanto",
    "name": "大舌貝",
    "alias": "Shellder",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/090.png",
      "height": "0.3",
      "weight": "4",
      "category": "雙殼貝寶可夢",
      "text": "It  lives  at  the  bottom  of  the  sea and rivers. It feeds on algae but it’s  attracted  to  sweet  substances. When frightened it will shut its clam and lock it to be almost impossible to open."
    },
    "evolution": {
      "stage": "first",
      "with": "水之石"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "硬殼盔甲", "連續攻擊" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "超音波" },
      { "rank": 1, "type": "Normal", "name": "守住" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "瞪眼" },
      { "rank": 2, "type": "Ice", "name": "極光束" },
      { "rank": 2, "type": "Ice", "name": "冰礫" },
      { "rank": 2, "type": "Ice", "name": "冰錐" },
      { "rank": 2, "type": "Water", "name": "潮旋" },
      { "rank": 2, "type": "Water", "name": "貝殼刃" },
      { "rank": 2, "type": "Water", "name": "貝殼夾擊" },
      { "rank": 2, "type": "Water", "name": "縮入殼中" },
      { "rank": 2, "type": "Water", "name": "鹽水" },
      { "rank": 3, "type": "Normal", "name": "破殼" },
      { "rank": 3, "type": "Ice", "name": "冰凍光束" },
      { "rank": 3, "type": "Steel", "name": "鐵壁" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Normal", "name": "高速旋轉" },
      { "rank": 4, "type": "Rock", "name": "岩石爆擊" },
      { "rank": 4, "type": "Water", "name": "水流環" }
    ],
    "isNovice": true
  },
  {
    "id": "091",
    "region": "kanto",
    "name": "刺甲貝",
    "alias": "Cloyster",
    "type": [ "Water", "Ice" ],
    "info": {
      "image": "images/pokedex/091.png",
      "height": "1.5",
      "weight": "132",
      "category": "雙殼貝寶可夢",
      "text": "If  it lives in seas with harsh currents,  it  will  grow  larger  and  sharper spikes  on  its  shells  than  those who live on calm waters. Its shell is  extremely  hard  -  you  would  need  explosives to try to open it."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 4, "max": 9 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "硬殼盔甲", "連續攻擊" ],
    "moves": [
      { "rank": 0, "type": "Water", "name": "縮入殼中" },
      { "rank": 1, "type": "Normal", "name": "守住" },
      { "rank": 1, "type": "Normal", "name": "超音波" },
      { "rank": 2, "type": "Normal", "name": "尖刺加農炮" },
      { "rank": 2, "type": "Ice", "name": "極光束" },
      { "rank": 2, "type": "Poison", "name": "毒菱" },
      { "rank": 3, "type": "Normal", "name": "破殼" },
      { "rank": 3, "type": "Ground", "name": "撒菱" },
      { "rank": 3, "type": "Ice", "name": "冰柱墜擊" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Normal", "name": "自爆" },
      { "rank": 4, "type": "Rock", "name": "岩石爆擊" },
      { "rank": 4, "type": "Water", "name": "水流環" }
    ]
  },
  {
    "id": "092",
    "region": "kanto",
    "name": "鬼斯",
    "alias": "Gastly",
    "type": [ "Ghost", "Poison" ],
    "info": {
      "image": "images/pokedex/092.png",
      "height": "1.3",
      "weight": "0.1",
      "category": "氣體狀寶可夢",
      "text": "Its  body  is  made  of  a  toxic  gas  -  anyone  would  faint  if  engulfed  by it.  It  has  been  seen  in  abandoned places  scaring  people  and  other pokemon  for  fun.  It  is  elusive  and escapes through the walls."
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "飄浮" ],
    "moves": [
      { "rank": 0, "type": "Ghost", "name": "舌舔" },
      { "rank": 0, "type": "Ghost", "name": "怨恨" },
      { "rank": 1, "type": "Normal", "name": "黑色目光" },
      { "rank": 1, "type": "Ghost", "name": "詛咒" },
      { "rank": 1, "type": "Ghost", "name": "黑夜魔影" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Dark", "name": "惡之波動" },
      { "rank": 2, "type": "Dark", "name": "以牙還牙" },
      { "rank": 2, "type": "Ghost", "name": "暗影球" },
      { "rank": 2, "type": "Ghost", "name": "奇異之光" },
      { "rank": 2, "type": "Psychic", "name": "催眠術" },
      { "rank": 3, "type": "Ghost", "name": "禍不單行" },
      { "rank": 3, "type": "Ghost", "name": "惡夢" },
      { "rank": 3, "type": "Ghost", "name": "同命" },
      { "rank": 3, "type": "Psychic", "name": "食夢" },
      { "rank": 4, "type": "Ghost", "name": "怨念" },
      { "rank": 4, "type": "Ice", "name": "冰凍之風" },
      { "rank": 4, "type": "Poison", "name": "清除之煙" }
    ],
    "isNovice": true
  },
  {
    "id": "093",
    "region": "kanto",
    "name": "鬼斯通",
    "alias": "Haunter",
    "type": [ "Ghost", "Poison" ],
    "info": {
      "image": "images/pokedex/093.png",
      "height": "1.6",
      "weight": "0.1",
      "category": "氣體狀寶可夢",
      "text": "Haunter  is  a  dangerous  Pokémon. it will try to lick you with its tongue to  steal  your  life  away.    If  you  get the  feeling  of  being  watched  in darkness when nobody is around, it means a Haunter is there. "
    },
    "evolution": {
      "stage": "second",
      "with": "交換"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "飄浮" ],
    "moves": [
      { "rank": 0, "type": "Ghost", "name": "舌舔" },
      { "rank": 0, "type": "Ghost", "name": "怨恨" },
      { "rank": 1, "type": "Normal", "name": "黑色目光" },
      { "rank": 1, "type": "Ghost", "name": "黑夜魔影" },
      { "rank": 1, "type": "Ghost", "name": "詛咒" },
      { "rank": 2, "type": "Dark", "name": "惡之波動" },
      { "rank": 2, "type": "Dark", "name": "以牙還牙" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Ghost", "name": "暗影球" },
      { "rank": 2, "type": "Ghost", "name": "暗影拳" },
      { "rank": 2, "type": "Ghost", "name": "奇異之光" },
      { "rank": 2, "type": "Psychic", "name": "催眠術" },
      { "rank": 3, "type": "Ghost", "name": "惡夢" },
      { "rank": 3, "type": "Ghost", "name": "同命" },
      { "rank": 3, "type": "Ghost", "name": "禍不單行" },
      { "rank": 3, "type": "Psychic", "name": "食夢" },
      { "rank": 4, "type": "Ghost", "name": "怨念" },
      { "rank": 4, "type": "Ice", "name": "冰凍之風" },
      { "rank": 4, "type": "Psychic", "name": "戲法" }
    ]
  },
  {
    "id": "094",
    "region": "kanto",
    "name": "耿鬼",
    "alias": "Gengar",
    "type": [ "Ghost", "Poison" ],
    "info": {
      "image": "images/pokedex/094.png",
      "height": "1.5",
      "weight": "40",
      "category": "影子寶可夢",
      "text": "This  Pokémon  is  michievous  but  it can  be  downright  evil.  It  takes  joy  in  casting  curses  upon  innocents and  eating  the  life  of  people  and Pokémon.  It  lurks  in  the  shadows and disguises itself as one. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 7 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "飄浮" ],
    "moves": [
      { "rank": 0, "type": "Ghost", "name": "舌舔" },
      { "rank": 0, "type": "Ghost", "name": "怨恨" },
      { "rank": 1, "type": "Normal", "name": "黑色目光" },
      { "rank": 1, "type": "Ghost", "name": "黑夜魔影" },
      { "rank": 1, "type": "Ghost", "name": "詛咒" },
      { "rank": 2, "type": "Dark", "name": "惡之波動" },
      { "rank": 2, "type": "Dark", "name": "以牙還牙" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Ghost", "name": "暗影球" },
      { "rank": 2, "type": "Ghost", "name": "暗影拳" },
      { "rank": 2, "type": "Ghost", "name": "奇異之光" },
      { "rank": 2, "type": "Psychic", "name": "催眠術" },
      { "rank": 3, "type": "Ghost", "name": "惡夢" },
      { "rank": 3, "type": "Ghost", "name": "同命" },
      { "rank": 3, "type": "Ghost", "name": "禍不單行" },
      { "rank": 3, "type": "Psychic", "name": "食夢" },
      { "rank": 4, "type": "Normal", "name": "滅亡之歌" },
      { "rank": 4, "type": "Grass", "name": "終極吸取" },
      { "rank": 4, "type": "Ice", "name": "冰凍之風" }
    ]
  },
  {
    "id": "094-M",
    "region": "kanto",
    "name": "耿鬼_MEGA",
    "alias": "Gengar",
    "type": [ "Ghost", "Poison" ],
    "info": {
      "image": "images/pokedex/094-M.png",
      "height": "1.4",
      "weight": "40",
      "category": "影子寶可夢",
      "text": "With the power of the Mega Stone Gengar can now teleport through dimensions,  whatever  horrors  it  witnesses there make it try to curse anything or anyone it perceives as prey, even its beloved trainer!"
    },
    "evolution": {
      "stage": "mega"
    },
    "baseHP": 6,
    "rank": 4,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 3, "max": 7 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 9 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "踩影" ],
    "moves": [

    ]
  },
  {
    "id": "095",
    "region": "kanto",
    "name": "大岩蛇",
    "alias": "Onix",
    "type": [ "Rock", "Ground" ],
    "info": {
      "image": "images/pokedex/095.png",
      "height": "8.0",
      "weight": "420",
      "category": "岩蛇寶可夢",
      "text": "It is not full-size when it’s born. Years of  eating  boulders  make  it  a  real  giant. It lives on mountains and dark  tunnels.  Its  frightening  roars  travel as echo through the cave. It is very aggressive towards others."
    },
    "evolution": {
      "stage": "first",
      "with": "攜帶道具交換"
    },
    "baseHP": 8,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 4, "max": 8 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "堅硬腦袋", "結實" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變硬" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Ground", "name": "玩泥巴" },
      { "rank": 1, "type": "Normal", "name": "綁緊" },
      { "rank": 1, "type": "Ghost", "name": "詛咒" },
      { "rank": 1, "type": "Rock", "name": "落石" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Normal", "name": "憤怒" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 2, "type": "Dragon", "name": "龍息" },
      { "rank": 2, "type": "Ground", "name": "流沙地獄" },
      { "rank": 2, "type": "Ground", "name": "挖洞" },
      { "rank": 2, "type": "Rock", "name": "岩石打磨" },
      { "rank": 2, "type": "Rock", "name": "岩崩" },
      { "rank": 2, "type": "Rock", "name": "擊落" },
      { "rank": 2, "type": "Rock", "name": "隱形岩" },
      { "rank": 2, "type": "Rock", "name": "岩石封鎖" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Rock", "name": "沙暴" },
      { "rank": 3, "type": "Rock", "name": "尖石攻擊" },
      { "rank": 3, "type": "Steel", "name": "鐵尾" },
      { "rank": 4, "type": "Normal", "name": "挺住" },
      { "rank": 4, "type": "Normal", "name": "自爆" },
      { "rank": 4, "type": "Rock", "name": "原始之力" }
    ]
  },
  {
    "id": "096",
    "region": "kanto",
    "name": "催眠貘",
    "alias": "Drowzee",
    "type": [ "Psychic" ],
    "info": {
      "image": "images/pokedex/096.png",
      "height": "1.0",
      "weight": "32",
      "category": "催眠寶可夢",
      "text": "It  eats  the  dreams  of  a  sleeping  person  or  Pokémon  and  shows fondness  to  the  dreams  of  young children. Once the victim is deep in slumber  it  will  extract  and  eat  the dream through the nose."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "不眠", "預知夢" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "拍擊" },
      { "rank": 0, "type": "Psychic", "name": "催眠術" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 1, "type": "Poison", "name": "毒瓦斯" },
      { "rank": 1, "type": "Psychic", "name": "瑜伽姿勢" },
      { "rank": 2, "type": "Normal", "name": "自我暗示" },
      { "rank": 2, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Psychic", "name": "意念頭鎚" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 2, "type": "Psychic", "name": "同步干擾" },
      { "rank": 3, "type": "Dark", "name": "詭計" },
      { "rank": 3, "type": "Psychic", "name": "精神衝擊" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Psychic", "name": "預知未來" },
      { "rank": 4, "type": "Normal", "name": "替身" },
      { "rank": 4, "type": "Electric", "name": "電磁波" },
      { "rank": 4, "type": "Psychic", "name": "扮演" }
    ],
    "isNovice": true
  },
  {
    "id": "097",
    "region": "kanto",
    "name": "引夢貘人",
    "alias": "Hypno",
    "type": [ "Psychic" ],
    "info": {
      "image": "images/pokedex/097.png",
      "height": "1.6",
      "weight": "75",
      "category": "催眠寶可夢",
      "text": "Old children stories tell of an Hypno who takes away naughty kids and feasts  on  their  dreams  until  they are old men.  They have an urge to eat the dreams of others since they cannot sleep themselves. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "不眠", "預知夢" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "拍擊" },
      { "rank": 0, "type": "Psychic", "name": "催眠術" },
      { "rank": 1, "type": "Normal", "name": "定身法" },
      { "rank": 1, "type": "Poison", "name": "毒瓦斯" },
      { "rank": 1, "type": "Psychic", "name": "瑜伽姿勢" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Normal", "name": "自我暗示" },
      { "rank": 2, "type": "Dark", "name": "掉包" },
      { "rank": 2, "type": "Ghost", "name": "惡夢" },
      { "rank": 2, "type": "Psychic", "name": "同步干擾" },
      { "rank": 2, "type": "Psychic", "name": "意念頭鎚" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 3, "type": "Dark", "name": "詭計" },
      { "rank": 3, "type": "Psychic", "name": "精神衝擊" },
      { "rank": 3, "type": "Psychic", "name": "預知未來" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 4, "type": "Normal", "name": "揮指" },
      { "rank": 4, "type": "Normal", "name": "替身" },
      { "rank": 4, "type": "Electric", "name": "電磁波" }
    ]
  },
  {
    "id": "098",
    "region": "kanto",
    "name": "大鉗蟹",
    "alias": "Krabby",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/098.png",
      "height": "0.4",
      "weight": "6",
      "category": "清水蟹寶可夢",
      "text": "A  Krabby dig holes in the sand near the sea. They can be seen squabbling with each other over food and territory. They usually avoid humans but will fight if provoked."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "怪力鉗", "硬殼盔甲" ],
    "moves": [
      { "rank": 0, "type": "Ground", "name": "玩泥巴" },
      { "rank": 0, "type": "Water", "name": "泡沫" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Normal", "name": "變硬" },
      { "rank": 1, "type": "Normal", "name": "夾住" },
      { "rank": 2, "type": "Normal", "name": "守住" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 2, "type": "Normal", "name": "踩踏" },
      { "rank": 2, "type": "Ground", "name": "泥巴射擊" },
      { "rank": 2, "type": "Steel", "name": "金屬爪" },
      { "rank": 2, "type": "Water", "name": "泡沫光線" },
      { "rank": 3, "type": "Normal", "name": "斷頭鉗" },
      { "rank": 3, "type": "Normal", "name": "抓狂" },
      { "rank": 3, "type": "Water", "name": "蟹鉗錘" },
      { "rank": 3, "type": "Water", "name": "鹽水" },
      { "rank": 4, "type": "Normal", "name": "模仿" },
      { "rank": 4, "type": "Psychic", "name": "高速移動" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ],
    "isNovice": true
  },
  {
    "id": "099",
    "region": "kanto",
    "name": "巨鉗蟹",
    "alias": "Kingler",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/099.png",
      "height": "1.4",
      "weight": "60",
      "category": "鉗子寶可夢",
      "text": "Its pincers grow peculiarly large. If it lifts the pincers too fast, it may lose its balance and stagger. If one of its pincers is damaged, it will detach it from its body. It will regrow after a few days.."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "怪力鉗", "硬殼盔甲" ],
    "moves": [
      { "rank": 0, "type": "Ground", "name": "玩泥巴" },
      { "rank": 0, "type": "Water", "name": "泡沫" },
      { "rank": 1, "type": "Normal", "name": "夾住" },
      { "rank": 1, "type": "Normal", "name": "變硬" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 2, "type": "Normal", "name": "踩踏" },
      { "rank": 2, "type": "Normal", "name": "守住" },
      { "rank": 2, "type": "Ground", "name": "泥巴射擊" },
      { "rank": 2, "type": "Rock", "name": "廣域防守" },
      { "rank": 2, "type": "Steel", "name": "金屬爪" },
      { "rank": 2, "type": "Water", "name": "泡沫光線" },
      { "rank": 3, "type": "Normal", "name": "抓狂" },
      { "rank": 3, "type": "Normal", "name": "斷頭鉗" },
      { "rank": 3, "type": "Water", "name": "鹽水" },
      { "rank": 3, "type": "Water", "name": "蟹鉗錘" },
      { "rank": 4, "type": "Normal", "name": "模仿" },
      { "rank": 4, "type": "Psychic", "name": "高速移動" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ]
  },
  {
    "id": "100",
    "region": "kanto",
    "name": "霹靂電球",
    "alias": "Voltorb",
    "type": [ "Electric" ],
    "info": {
      "image": "images/pokedex/100.png",
      "height": "0.5",
      "weight": "10",
      "category": "球寶可夢",
      "text": "They live near factories and electric  generators.  It  bears  an  uncanny and  unexplained  resemblance  to a Pokéball. Since it explodes at the slightest provocation, even veteran trainers treat it with caution."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "隔音", "靜電" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Electric", "name": "充電" },
      { "rank": 1, "type": "Normal", "name": "音爆" },
      { "rank": 1, "type": "Electric", "name": "怪異電波" },
      { "rank": 1, "type": "Electric", "name": "電光" },
      { "rank": 2, "type": "Normal", "name": "高速星星" },
      { "rank": 2, "type": "Normal", "name": "自爆" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Electric", "name": "電球" },
      { "rank": 2, "type": "Electric", "name": "充電光束" },
      { "rank": 2, "type": "Electric", "name": "放電" },
      { "rank": 2, "type": "Psychic", "name": "光牆" },
      { "rank": 2, "type": "Rock", "name": "滾動" },
      { "rank": 3, "type": "Normal", "name": "大爆炸" },
      { "rank": 3, "type": "Electric", "name": "電磁飄浮" },
      { "rank": 3, "type": "Psychic", "name": "鏡面反射" },
      { "rank": 3, "type": "Steel", "name": "陀螺球" },
      { "rank": 4, "type": "Normal", "name": "挺住" },
      { "rank": 4, "type": "Dark", "name": "欺詐" },
      { "rank": 4, "type": "Dark", "name": "突襲" }
    ],
    "isNovice": true
  },
  {
    "id": "101",
    "region": "kanto",
    "name": "頑皮雷彈",
    "alias": "Electrode",
    "type": [ "Electric" ],
    "info": {
      "image": "images/pokedex/101.png",
      "height": "1.2",
      "weight": "66",
      "category": "球寶可夢",
      "text": "It is known for causing blackouts in the cities. After evolving it explodes as a form to release excess electricity  or simply to amuse itself. Trainers need to be careful around an Electrode."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 4, "max": 8 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "隔音", "靜電" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Electric", "name": "充電" },
      { "rank": 1, "type": "Normal", "name": "音爆" },
      { "rank": 1, "type": "Electric", "name": "電光" },
      { "rank": 1, "type": "Electric", "name": "怪異電波" },
      { "rank": 2, "type": "Normal", "name": "自爆" },
      { "rank": 2, "type": "Normal", "name": "刺耳聲" },
      { "rank": 2, "type": "Normal", "name": "高速星星" },
      { "rank": 2, "type": "Electric", "name": "放電" },
      { "rank": 2, "type": "Electric", "name": "磁場操控" },
      { "rank": 2, "type": "Electric", "name": "電球" },
      { "rank": 2, "type": "Electric", "name": "充電光束" },
      { "rank": 2, "type": "Psychic", "name": "光牆" },
      { "rank": 2, "type": "Rock", "name": "滾動" },
      { "rank": 3, "type": "Normal", "name": "大爆炸" },
      { "rank": 3, "type": "Electric", "name": "電磁飄浮" },
      { "rank": 3, "type": "Psychic", "name": "鏡面反射" },
      { "rank": 3, "type": "Steel", "name": "陀螺球" },
      { "rank": 4, "type": "Normal", "name": "挺住" },
      { "rank": 4, "type": "Dark", "name": "突襲" },
      { "rank": 4, "type": "Dark", "name": "欺詐" }
    ]
  },
  {
    "id": "102",
    "region": "kanto",
    "name": "蛋蛋",
    "alias": "Exeggcute",
    "type": [ "Grass", "Psychic" ],
    "info": {
      "image": "images/pokedex/102.png",
      "height": "0.4",
      "weight": "2",
      "category": "蛋寶可夢",
      "text": "Even though it appears to be eggs of some sort, it is related more to a seed. It gathers in packs of six that have a  mental link with eachother. Each  one  of  them  has  a  different personality."
    },
    "evolution": {
      "stage": "first",
      "with": "葉之石"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "葉綠素" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "吵鬧" },
      { "rank": 0, "type": "Normal", "name": "投球" },
      { "rank": 1, "type": "Psychic", "name": "反射壁" },
      { "rank": 1, "type": "Psychic", "name": "催眠術" },
      { "rank": 2, "type": "Grass", "name": "種子機關槍" },
      { "rank": 2, "type": "Grass", "name": "煩惱種子" },
      { "rank": 2, "type": "Grass", "name": "催眠粉" },
      { "rank": 2, "type": "Grass", "name": "麻痺粉" },
      { "rank": 2, "type": "Grass", "name": "寄生種子" },
      { "rank": 2, "type": "Poison", "name": "毒粉" },
      { "rank": 2, "type": "Psychic", "name": "念力" },
      { "rank": 3, "type": "Normal", "name": "自然之恩" },
      { "rank": 3, "type": "Normal", "name": "傳遞禮物" },
      { "rank": 3, "type": "Grass", "name": "日光束" },
      { "rank": 3, "type": "Psychic", "name": "神通力" },
      { "rank": 4, "type": "Ghost", "name": "詛咒" },
      { "rank": 4, "type": "Ghost", "name": "惡夢" },
      { "rank": 4, "type": "Grass", "name": "紮根" }
    ],
    "isNovice": true
  },
  {
    "id": "103",
    "region": "kanto",
    "name": "椰蛋樹",
    "alias": "Exeggutor",
    "type": [ "Grass", "Psychic" ],
    "info": {
      "image": "images/pokedex/103.png",
      "height": "2.0",
      "weight": "120",
      "category": "椰子寶可夢",
      "text": "Originally from tropical areas.  Exeggutor’s heads grow larger with  strong  sunlight.  Each  head  thinks independently.  They  are  friendly and  provide  their  shade  to  other Pokémon."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 7 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "葉綠素", "收穫" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "投球" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 1, "type": "Psychic", "name": "催眠術" },
      { "rank": 2, "type": "Normal", "name": "炸蛋" },
      { "rank": 2, "type": "Normal", "name": "踩踏" },
      { "rank": 2, "type": "Grass", "name": "種子炸彈" },
      { "rank": 2, "type": "Psychic", "name": "精神衝擊" },
      { "rank": 3, "type": "Grass", "name": "木槌" },
      { "rank": 3, "type": "Grass", "name": "飛葉風暴" },
      { "rank": 4, "type": "Ghost", "name": "詛咒" },
      { "rank": 4, "type": "Ghost", "name": "惡夢" },
      { "rank": 4, "type": "Grass", "name": "青草場地" }
    ]
  },
  {
    "id": "103-A",
    "region": "alola",
    "name": "椰蛋樹 (阿羅拉的樣子)",
    "alias": "Exeggutor",
    "type": [ "Grass", "Dragon" ],
    "info": {
      "image": "images/pokedex/103-A.png",
      "height": "11.0",
      "weight": "415",
      "category": "椰子寶可夢",
      "text": "Alola  is  the  native  region  for  this Pokémon, only in there it can evolve into  this  form.  With  this  size,  its  Psychic  abilities  are  rarely  needed and its trainer’s order’s rarely heard. They enjoy the sun in the beach.."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 7 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "察覺", "收穫" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "投球" },
      { "rank": 1, "type": "Psychic", "name": "催眠術" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 2, "type": "Grass", "name": "種子炸彈" },
      { "rank": 2, "type": "Normal", "name": "炸蛋" },
      { "rank": 2, "type": "Psychic", "name": "精神衝擊" },
      { "rank": 2, "type": "Dragon", "name": "龍錘" },
      { "rank": 3, "type": "Grass", "name": "木槌" },
      { "rank": 3, "type": "Grass", "name": "飛葉風暴" },
      { "rank": 4, "type": "Dragon", "name": "龍尾" },
      { "rank": 4, "type": "Grass", "name": "扎根" },
      { "rank": 4, "type": "Normal", "name": "終極衝擊" }
    ]
  },
  {
    "id": "104",
    "region": "kanto",
    "name": "卡拉卡拉",
    "alias": "Cubone",
    "type": [ "Ground" ],
    "info": {
      "image": "images/pokedex/104.png",
      "height": "0.4",
      "weight": "6",
      "category": "孤獨寶可夢",
      "text": "Cubone  wears  a  skull  helmet  it  never removes. It is said to be from its mother or someone dear to it. Lives in the mountains where it cries  at night due to the sadness it feels.It is distrustful of humans."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "堅硬腦袋", "避雷針" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Ground", "name": "骨棒" },
      { "rank": 2, "type": "Normal", "name": "蠻幹" },
      { "rank": 2, "type": "Normal", "name": "憤怒" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Normal", "name": "點到為止" },
      { "rank": 2, "type": "Dark", "name": "投擲" },
      { "rank": 2, "type": "Ground", "name": "骨頭迴力鏢" },
      { "rank": 3, "type": "Normal", "name": "報仇" },
      { "rank": 3, "type": "Normal", "name": "大鬧一番" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Ground", "name": "骨棒亂打" },
      { "rank": 3, "type": "Ground", "name": "跺腳" },
      { "rank": 4, "type": "Fight", "name": "二連踢" },
      { "rank": 4, "type": "Fight", "name": "看穿" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ],
    "isNovice": true
  },
  {
    "id": "105",
    "region": "kanto",
    "name": "嘎啦嘎啦",
    "alias": "Marowak",
    "type": [ "Ground" ],
    "info": {
      "image": "images/pokedex/105.png",
      "height": "1.0",
      "weight": "45",
      "category": "愛骨寶可夢",
      "text": "Its  rough  past  has  hardened  its heart.  Now  tenacious  and  violent, this Pokémon will use its Bone club as a weapon against foes. Marowak’s den is usually full of the bones it has  collected."
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
    "ability": [ "堅硬腦袋", "避雷針" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Ground", "name": "骨棒" },
      { "rank": 2, "type": "Normal", "name": "蠻幹" },
      { "rank": 2, "type": "Normal", "name": "憤怒" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Normal", "name": "點到為止" },
      { "rank": 2, "type": "Dark", "name": "投擲" },
      { "rank": 2, "type": "Ground", "name": "骨頭迴力鏢" },
      { "rank": 3, "type": "Normal", "name": "報仇" },
      { "rank": 3, "type": "Normal", "name": "大鬧一番" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Ground", "name": "骨棒亂打" },
      { "rank": 3, "type": "Ground", "name": "跺腳" },
      { "rank": 4, "type": "Normal", "name": "滅亡之歌" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Fight", "name": "看穿" }
    ]
  },
  {
    "id": "105-A",
    "region": "alola",
    "name": "嘎啦嘎啦 (阿羅拉的樣子)",
    "alias": "Marowak",
    "type": [ "Fire", "Ghost" ],
    "info": {
      "image": "images/pokedex/105-A.png",
      "height": "1.0",
      "weight": "34",
      "category": "愛骨寶可夢",
      "text": "阿羅拉地區棲息著許多會狩獵的卡拉卡拉孤兒的掠食者，因此牠母親的靈魂會迴盪在附近以保護她的孩子。這股異樣的影響讓嘎啦嘎啦變得更加兇暴，並完全改變的牠的屬性。"
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
    "ability": [ "詛咒之軀", "避雷針" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Ground", "name": "骨棒" },
      { "rank": 1, "type": "Ghost", "name": "禍不單行" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 2, "type": "Fire", "name": "火焰輪" },
      { "rank": 2, "type": "Ground", "name": "骨頭迴力鏢" },
      { "rank": 2, "type": "Fire", "name": "鬼火" },
      { "rank": 2, "type": "Ghost", "name": "暗影之骨" },
      { "rank": 2, "type": "Normal", "name": "蠻幹" },
      { "rank": 2, "type": "Dark", "name": "投擲" },
      { "rank": 3, "type": "Ground", "name": "跺腳" },
      { "rank": 3, "type": "Normal", "name": "大鬧一番" },
      { "rank": 3, "type": "Fire", "name": "閃焰衝鋒" },
      { "rank": 3, "type": "Normal", "name": "報仇" },
      { "rank": 3, "type": "Ground", "name": "骨棒亂打" },
      { "rank": 4, "type": "Normal", "name": "滅亡之歌" },
      { "rank": 4, "type": "Dark", "name": "狂舞揮打" },
      { "rank": 4, "type": "Fire", "name": "蓄能焰襲" }
    ]
  },
  {
    "id": "106",
    "region": "kanto",
    "name": "飛腿郎",
    "alias": "Hitmonlee",
    "type": [ "Fight" ],
    "info": {
      "image": "images/pokedex/106.png",
      "height": "1.5",
      "weight": "50",
      "category": "踢腿寶可夢",
      "text": "Its legs freely stretch and contract. It bowls over foes with devastating  kicks. It is very disciplined and trains every day.  It is very rare in the wild, and it is mostly found in urban areas."
    },
    "evolution": {
      "stage": "final",
      "by": "將力量最大化"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "柔軟", "捨身" ],
    "moves": [
      { "rank": 0, "type": "Fight", "name": "報復" },
      { "rank": 0, "type": "Fight", "name": "二連踢" },
      { "rank": 1, "type": "Fight", "name": "迴旋踢" },
      { "rank": 1, "type": "Fight", "name": "飛踢" },
      { "rank": 1, "type": "Psychic", "name": "瑜伽姿勢" },
      { "rank": 2, "type": "Normal", "name": "心之眼" },
      { "rank": 2, "type": "Normal", "name": "佯攻" },
      { "rank": 2, "type": "Normal", "name": "識破" },
      { "rank": 2, "type": "Normal", "name": "聚氣" },
      { "rank": 2, "type": "Fight", "name": "劈瓦" },
      { "rank": 2, "type": "Fight", "name": "飛膝踢" },
      { "rank": 2, "type": "Fire", "name": "火焰踢" },
      { "rank": 2, "type": "Rock", "name": "廣域防守" },
      { "rank": 3, "type": "Normal", "name": "挺住" },
      { "rank": 3, "type": "Normal", "name": "百萬噸重踢" },
      { "rank": 3, "type": "Fight", "name": "近身戰" },
      { "rank": 3, "type": "Fight", "name": "起死回生" },
      { "rank": 4, "type": "Normal", "name": "高速旋轉" },
      { "rank": 4, "type": "Fight", "name": "音速拳" },
      { "rank": 4, "type": "Flying", "name": "彈跳" }
    ]
  },
  {
    "id": "107",
    "region": "kanto",
    "name": "快拳郎",
    "alias": "Hitmonchan",
    "type": [ "Fight" ],
    "info": {
      "image": "images/pokedex/107.png",
      "height": "1.4",
      "weight": "50",
      "category": "拳擊寶可夢",
      "text": "It specializes in punching as fast as it  can.  Using  a  corkscrew  motion,  it  can  even  drill  through  concrete with it’s bare hands. This Pokémon takes  its  training  very  seriously.  It’s very rare to see one in the wild."
    },
    "evolution": {
      "stage": "final",
      "by": "將活力最大化"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "銳利目光", "鐵拳" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "連續拳" },
      { "rank": 0, "type": "Fight", "name": "報復" },
      { "rank": 1, "type": "Dark", "name": "追打" },
      { "rank": 1, "type": "Fight", "name": "音速拳" },
      { "rank": 1, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Normal", "name": "百萬噸重拳" },
      { "rank": 2, "type": "Normal", "name": "佯攻" },
      { "rank": 2, "type": "Electric", "name": "雷電拳" },
      { "rank": 2, "type": "Fight", "name": "真空波" },
      { "rank": 2, "type": "Fight", "name": "沖天拳" },
      { "rank": 2, "type": "Fight", "name": "快速防守" },
      { "rank": 2, "type": "Fire", "name": "火焰拳" },
      { "rank": 2, "type": "Ice", "name": "冰凍拳" },
      { "rank": 2, "type": "Steel", "name": "子彈拳" },
      { "rank": 3, "type": "Fight", "name": "近身戰" },
      { "rank": 3, "type": "Fight", "name": "真氣拳" },
      { "rank": 3, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 3, "type": "Fight", "name": "看穿" },
      { "rank": 4, "type": "Normal", "name": "高速旋轉" },
      { "rank": 4, "type": "Fight", "name": "吸取拳" },
      { "rank": 4, "type": "Fight", "name": "飛膝踢" }
    ]
  },
  {
    "id": "108",
    "region": "kanto",
    "name": "大舌頭",
    "alias": "Lickitung",
    "type": [ "Normal" ],
    "info": {
      "image": "images/pokedex/108.png",
      "height": "1.2",
      "weight": "65",
      "category": "舔舔寶可夢",
      "text": "Its  tongue  is  twice  as  long  as  its body and it is used for everything, from  capturing  prey  to  feeling  it’s surroundings and cleaning itself.  It really dislikes sour and bitter flavors. "
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "我行我素", "遲鈍" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "超音波" },
      { "rank": 0, "type": "Ghost", "name": "舌舔" },
      { "rank": 1, "type": "Normal", "name": "變圓" },
      { "rank": 1, "type": "Dark", "name": "拍落" },
      { "rank": 2, "type": "Normal", "name": "逐步擊破" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 2, "type": "Normal", "name": "踩踏" },
      { "rank": 2, "type": "Normal", "name": "搶先一步" },
      { "rank": 2, "type": "Normal", "name": "定身法" },
      { "rank": 2, "type": "Normal", "name": "緊束" },
      { "rank": 2, "type": "Rock", "name": "滾動" },
      { "rank": 3, "type": "Normal", "name": "煥然一新" },
      { "rank": 3, "type": "Normal", "name": "絞緊" },
      { "rank": 3, "type": "Normal", "name": "刺耳聲" },
      { "rank": 3, "type": "Grass", "name": "強力鞭打" },
      { "rank": 4, "type": "Normal", "name": "腹鼓" },
      { "rank": 4, "type": "Psychic", "name": "意念頭鎚" },
      { "rank": 4, "type": "Water", "name": "水流尾" }
    ],
    "isNovice": true
  },
  {
    "id": "109",
    "region": "kanto",
    "name": "瓦斯彈",
    "alias": "Koffing",
    "type": [ "Poison" ],
    "info": {
      "image": "images/pokedex/109.png",
      "height": "0.6",
      "weight": "1",
      "category": "毒氣寶可夢",
      "text": "It is drawn to the smog and fumes of the cities. It fills its body with toxic gases to float like a balloon. When it  gets  nervous  it  releases  a  sickly green  gas.  Breathing  this  gas  will give you a bad case of sniffles."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "飄浮" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Poison", "name": "毒瓦斯" },
      { "rank": 1, "type": "Normal", "name": "煙幕" },
      { "rank": 1, "type": "Poison", "name": "清除之煙" },
      { "rank": 1, "type": "Poison", "name": "濁霧" },
      { "rank": 2, "type": "Normal", "name": "自爆" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Ice", "name": "黑霧" },
      { "rank": 2, "type": "Poison", "name": "污泥炸彈" },
      { "rank": 2, "type": "Poison", "name": "污泥攻擊" },
      { "rank": 2, "type": "Steel", "name": "陀螺球" },
      { "rank": 3, "type": "Normal", "name": "大爆炸" },
      { "rank": 3, "type": "Dark", "name": "臨別禮物" },
      { "rank": 3, "type": "Ghost", "name": "同命" },
      { "rank": 3, "type": "Poison", "name": "打嗝" },
      { "rank": 4, "type": "Normal", "name": "分擔痛楚" },
      { "rank": 4, "type": "Poison", "name": "毒菱" },
      { "rank": 4, "type": "Rock", "name": "滾動" }
    ],
    "isNovice": true
  },
  {
    "id": "110",
    "region": "kanto",
    "name": "雙彈瓦斯",
    "alias": "Weezing",
    "type": [ "Poison" ],
    "info": {
      "image": "images/pokedex/110.png",
      "height": "1.2",
      "weight": "9",
      "category": "毒氣寶可夢",
      "text": " They  are  considered  a  pest  in  urban areas. They wait until night to roam and eat from the trash cans in the neighborhood. If it finds a filthy and  unkept  house  it  will  make  its nest in there."
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
    "ability": [ "飄浮" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Poison", "name": "毒瓦斯" },
      { "rank": 1, "type": "Normal", "name": "煙幕" },
      { "rank": 1, "type": "Poison", "name": "清除之煙" },
      { "rank": 1, "type": "Poison", "name": "濁霧" },
      { "rank": 2, "type": "Normal", "name": "二連擊" },
      { "rank": 2, "type": "Normal", "name": "自爆" },
      { "rank": 2, "type": "Dark", "name": "惡意追擊" },
      { "rank": 2, "type": "Ice", "name": "黑霧" },
      { "rank": 2, "type": "Poison", "name": "污泥炸彈" },
      { "rank": 2, "type": "Poison", "name": "污泥攻擊" },
      { "rank": 3, "type": "Normal", "name": "大爆炸" },
      { "rank": 3, "type": "Dark", "name": "臨別禮物" },
      { "rank": 3, "type": "Ghost", "name": "同命" },
      { "rank": 3, "type": "Poison", "name": "打嗝" },
      { "rank": 4, "type": "Normal", "name": "分擔痛楚" },
      { "rank": 4, "type": "Poison", "name": "毒菱" },
      { "rank": 4, "type": "Psychic", "name": "幻象光線" }
    ]
  },
  {
    "id": "111",
    "region": "kanto",
    "name": "獨角犀牛",
    "alias": "Rhyhorn",
    "type": [ "Ground", "Rock" ],
    "info": {
      "image": "images/pokedex/111.png",
      "height": "1.0",
      "weight": "115",
      "category": "尖尖寶可夢",
      "text": "It  lives  in  grasslands  and  rough  terrains.  It  is  covered  with  a  thick hide and it tramples any threats by running towards them. It is not very smart, though. It can keep trampling things for hours just because."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "堅硬腦袋", "避雷針" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Normal", "name": "角撞" },
      { "rank": 1, "type": "Normal", "name": "亂擊" },
      { "rank": 1, "type": "Normal", "name": "踩踏" },
      { "rank": 1, "type": "Rock", "name": "擊落" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Normal", "name": "鬼面" },
      { "rank": 2, "type": "Normal", "name": "逐步擊破" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 2, "type": "Ground", "name": "直衝鑽" },
      { "rank": 2, "type": "Rock", "name": "岩石爆擊" },
      { "rank": 3, "type": "Normal", "name": "角鑽" },
      { "rank": 3, "type": "Bug", "name": "超級角擊" },
      { "rank": 3, "type": "Ground", "name": "地震" },
      { "rank": 3, "type": "Rock", "name": "尖石攻擊" },
      { "rank": 4, "type": "Electric", "name": "雷電牙" },
      { "rank": 4, "type": "Fire", "name": "火焰牙" },
      { "rank": 4, "type": "Ice", "name": "冰凍牙" }
    ],
    "isNovice": true
  },
  {
    "id": "112",
    "region": "kanto",
    "name": "鑽角犀獸",
    "alias": "Rhydon",
    "type": [ "Ground", "Rock" ],
    "info": {
      "image": "images/pokedex/112.png",
      "height": "1.9",
      "weight": "240",
      "category": "鑽錐寶可夢",
      "text": "It  has  a  horn  that  serves  as  a  drill  for  destroying  rocks  and  boulders.  Rhydon occasionally goes for a swim in rivers and even magma pools. Its great  resistance  prevents  it  from taking any damage."
    },
    "evolution": {
      "stage": "second",
      "with": "攜帶道具交換"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 7 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "堅硬腦袋", "避雷針" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Normal", "name": "角撞" },
      { "rank": 1, "type": "Normal", "name": "亂擊" },
      { "rank": 1, "type": "Normal", "name": "踩踏" },
      { "rank": 1, "type": "Rock", "name": "擊落" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Normal", "name": "鬼面" },
      { "rank": 2, "type": "Normal", "name": "逐步擊破" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 2, "type": "Ground", "name": "直衝鑽" },
      { "rank": 2, "type": "Rock", "name": "岩石爆擊" },
      { "rank": 3, "type": "Normal", "name": "角鑽" },
      { "rank": 3, "type": "Bug", "name": "超級角擊" },
      { "rank": 3, "type": "Fight", "name": "臂錘" },
      { "rank": 3, "type": "Ground", "name": "地震" },
      { "rank": 3, "type": "Rock", "name": "尖石攻擊" },
      { "rank": 4, "type": "Normal", "name": "火箭頭鎚" },
      { "rank": 4, "type": "Dragon", "name": "龍之俯衝" },
      { "rank": 4, "type": "Steel", "name": "修長之角" }
    ]
  },
  {
    "id": "113",
    "region": "kanto",
    "name": "吉利蛋",
    "alias": "Chansey",
    "type": [ "Normal" ],
    "info": {
      "image": "images/pokedex/113.png",
      "height": "1.1",
      "weight": "34",
      "category": "蛋寶可夢",
      "text": "There are only females in this species.  Chansey lays a nutritive egg every  day. These eggs are fed to the sick to give them strength. It is a loving and smart Pokémon, but it’s pretty rare and elusive in the wild."
    },
    "evolution": {
      "stage": "second",
      "happiness": 5
    },
    "baseHP": 12,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 2 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 1, "max": 2 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "自然回復", "天恩" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變圓" },
      { "rank": 0, "type": "Normal", "name": "拍擊" },
      { "rank": 1, "type": "Normal", "name": "連環巴掌" },
      { "rank": 1, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Normal", "name": "生蛋" },
      { "rank": 1, "type": "Normal", "name": "煥然一新" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Normal", "name": "傳遞禮物" },
      { "rank": 2, "type": "Normal", "name": "唱歌" },
      { "rank": 2, "type": "Normal", "name": "變小" },
      { "rank": 2, "type": "Psychic", "name": "治愈波動" },
      { "rank": 3, "type": "Normal", "name": "炸蛋" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Dark", "name": "投擲" },
      { "rank": 3, "type": "Psychic", "name": "治愈之願" },
      { "rank": 3, "type": "Psychic", "name": "光牆" },
      { "rank": 4, "type": "Normal", "name": "禮物" },
      { "rank": 4, "type": "Normal", "name": "治愈鈴聲" },
      { "rank": 4, "type": "Fight", "name": "地球上投" }
    ],
    "isNovice": true
  },
  {
    "id": "114",
    "region": "kanto",
    "name": "蔓藤怪",
    "alias": "Tangela",
    "type": [ "Grass" ],
    "info": {
      "image": "images/pokedex/114.png",
      "height": "1.0",
      "weight": "35",
      "category": "藤蔓狀寶可夢",
      "text": "It blends with foliage on jungle and  forest areas. Its vines snap off easily and painlessly if they are grabbed, allowing it to make a quick getaway. The lost vines are replaced by new growth the very next day. "
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
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "葉綠素", "葉子防守" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "纏繞" },
      { "rank": 0, "type": "Grass", "name": "紮根" },
      { "rank": 1, "type": "Grass", "name": "藤鞭" },
      { "rank": 1, "type": "Grass", "name": "吸取" },
      { "rank": 1, "type": "Grass", "name": "催眠粉" },
      { "rank": 2, "type": "Normal", "name": "自然之恩" },
      { "rank": 2, "type": "Normal", "name": "生長" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 2, "type": "Normal", "name": "綁緊" },
      { "rank": 2, "type": "Dark", "name": "拍落" },
      { "rank": 2, "type": "Grass", "name": "麻痺粉" },
      { "rank": 2, "type": "Grass", "name": "超級吸取" },
      { "rank": 2, "type": "Poison", "name": "毒粉" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 3, "type": "Normal", "name": "搔癢" },
      { "rank": 3, "type": "Normal", "name": "絞緊" },
      { "rank": 3, "type": "Grass", "name": "青草場地" },
      { "rank": 3, "type": "Grass", "name": "強力鞭打" },
      { "rank": 3, "type": "Grass", "name": "終極吸取" },
      { "rank": 4, "type": "Normal", "name": "替身" },
      { "rank": 4, "type": "Psychic", "name": "瞬間失憶" },
      { "rank": 4, "type": "Psychic", "name": "念力" }
    ],
    "isNovice": true
  },
  {
    "id": "115",
    "region": "kanto",
    "name": "袋獸",
    "alias": "Kangaskhan",
    "type": [ "Normal" ],
    "info": {
      "image": "images/pokedex/115.png",
      "height": "2.2",
      "weight": "160",
      "category": "親子寶可夢",
      "text": "A  female  only  species.  It  raises  its offspring  in  its  belly  pouch.  The young leaves once it learns to find its  own  food.  In  the  wild,  mothers  and  daugthers  fiercly  defend eachother."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "早起", "膽量" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Normal", "name": "連續拳" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Normal", "name": "迷昏拳" },
      { "rank": 2, "type": "Normal", "name": "百萬噸重拳" },
      { "rank": 2, "type": "Normal", "name": "二連擊" },
      { "rank": 2, "type": "Normal", "name": "逐步擊破" },
      { "rank": 2, "type": "Normal", "name": "憤怒" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 3, "type": "Normal", "name": "挺住" },
      { "rank": 3, "type": "Dark", "name": "突襲" },
      { "rank": 3, "type": "Dragon", "name": "逆鱗" },
      { "rank": 3, "type": "Fight", "name": "起死回生" },
      { "rank": 4, "type": "Normal", "name": "誘惑" },
      { "rank": 4, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 4, "type": "Water", "name": "水流尾" }
    ]
  },
  {
    "id": "115-M",
    "region": "kanto",
    "name": "袋獸_MEGA",
    "alias": "Kangaskhan",
    "type": [ "Normal" ],
    "info": {
      "image": "images/pokedex/115-M.png",
      "height": "2.2",
      "weight": "160",
      "category": "親子寶可夢",
      "text": "The mother gives all the power of the Mega  Stone  to  her  child.  The  child grows violent and both team up as formidable  fighters.  But  the  mother worries about her child’s future as she raised it better than that."
    },
    "evolution": {
      "stage": "mega"
    },
    "baseHP": 6,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "親子愛" ],
    "moves": [

    ]
  },
  {
    "id": "116",
    "region": "kanto",
    "name": "墨海馬",
    "alias": "Horsea",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/116.png",
      "height": "0.4",
      "weight": "8",
      "category": "龍寶可夢",
      "text": "It  makes  its  nest  in  the  shade  of corals in shallow parts of the sea. If it senses danger, it spits a murky ink  and  flees.   It  has  been  seen shooting  down  flying  bugs  to  eat them."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "悠游自如", "狙擊手" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "煙幕" },
      { "rank": 0, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Water", "name": "泡沫" },
      { "rank": 2, "type": "Dragon", "name": "龍捲風" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Water", "name": "泡沫光線" },
      { "rank": 2, "type": "Water", "name": "鹽水" },
      { "rank": 3, "type": "Dragon", "name": "龍之波動" },
      { "rank": 3, "type": "Dragon", "name": "龍之舞" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Bug", "name": "信號光束" },
      { "rank": 4, "type": "Ice", "name": "極光束" },
      { "rank": 4, "type": "Water", "name": "章魚桶炮" }
    ],
    "isNovice": true
  },
  {
    "id": "117",
    "region": "kanto",
    "name": "海刺龍",
    "alias": "Seadra",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/117.png",
      "height": "1.2",
      "weight": "25",
      "category": "龍寶可夢",
      "text": "The poisonous barbs all over its body  are highly valued as ingredients for making traditional medicine. It  will  show  no  mercy  if  anything  approaches its nest. Its back fin has a numbing substance "
    },
    "evolution": {
      "stage": "second",
      "with": "攜帶道具交換"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "悠游自如", "狙擊手" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "煙幕" },
      { "rank": 0, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Water", "name": "泡沫" },
      { "rank": 2, "type": "Dragon", "name": "龍捲風" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Water", "name": "泡沫光線" },
      { "rank": 2, "type": "Water", "name": "鹽水" },
      { "rank": 3, "type": "Dragon", "name": "龍之波動" },
      { "rank": 3, "type": "Dragon", "name": "龍之舞" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Bug", "name": "信號光束" },
      { "rank": 4, "type": "Ice", "name": "極光束" },
      { "rank": 4, "type": "Water", "name": "章魚桶炮" }
    ]
  },
  {
    "id": "118",
    "region": "kanto",
    "name": "角金魚",
    "alias": "Goldeen",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/118.png",
      "height": "0.6",
      "weight": "15",
      "category": "金魚寶可夢",
      "text": " Goldeen  loves  swimming  wild  and free  in  rivers  and  ponds.  If  one  of these  Pokémon  is  placed  in  an aquarium,  it  will  shatter  the  glass with its horn and make its escape. "
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "悠游自如", "水幕" ],
    "moves": [
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 0, "type": "Water", "name": "玩水" },
      { "rank": 1, "type": "Normal", "name": "角撞" },
      { "rank": 1, "type": "Normal", "name": "超音波" },
      { "rank": 1, "type": "Water", "name": "水之波動" },
      { "rank": 2, "type": "Normal", "name": "亂擊" },
      { "rank": 2, "type": "Normal", "name": "抓狂" },
      { "rank": 2, "type": "Water", "name": "攀瀑" },
      { "rank": 2, "type": "Water", "name": "水流環" },
      { "rank": 3, "type": "Normal", "name": "角鑽" },
      { "rank": 3, "type": "Bug", "name": "超級角擊" },
      { "rank": 3, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Water", "name": "浸水" },
      { "rank": 4, "type": "Flying", "name": "彈跳" },
      { "rank": 4, "type": "Ground", "name": "直衝鑽" },
      { "rank": 4, "type": "Ground", "name": "玩泥巴" }
    ],
    "isNovice": true
  },
  {
    "id": "119",
    "region": "kanto",
    "name": "金魚王",
    "alias": "Seaking",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/119.png",
      "height": "1.4",
      "weight": "60",
      "category": "金魚寶可夢",
      "text": " In  the  autumn,  Seaking  males  can be seen doing courtship dances to females. After getting a mate both will be seen swimming powerfully up rivers and creeks to make their nest."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "悠游自如", "水幕" ],
    "moves": [
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 0, "type": "Water", "name": "玩水" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Normal", "name": "超音波" },
      { "rank": 1, "type": "Normal", "name": "角撞" },
      { "rank": 2, "type": "Normal", "name": "亂擊" },
      { "rank": 2, "type": "Normal", "name": "抓狂" },
      { "rank": 2, "type": "Poison", "name": "毒擊" },
      { "rank": 2, "type": "Water", "name": "攀瀑" },
      { "rank": 2, "type": "Water", "name": "水流環" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 3, "type": "Normal", "name": "角鑽" },
      { "rank": 3, "type": "Bug", "name": "超級角擊" },
      { "rank": 3, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Water", "name": "浸水" },
      { "rank": 4, "type": "Flying", "name": "彈跳" },
      { "rank": 4, "type": "Ground", "name": "直衝鑽" },
      { "rank": 4, "type": "Ground", "name": "玩泥巴" }
    ]
  },
  {
    "id": "120",
    "region": "kanto",
    "name": "海星星",
    "alias": "Staryu",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/120.png",
      "height": "0.8",
      "weight": "34",
      "category": "星形寶可夢",
      "text": "They  come  out  to  the  shore  in great numbers when the sky is full with  stars.  The  core  at  its  center glows to comunicate with others.If a part of its body is injured it can regrow it in a few days."
    },
    "evolution": {
      "stage": "first",
      "with": "水之石"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "發光", "自然回復" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變硬" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "高速旋轉" },
      { "rank": 1, "type": "Normal", "name": "自我再生" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "變小" },
      { "rank": 2, "type": "Normal", "name": "鏡面屬性" },
      { "rank": 2, "type": "Normal", "name": "保護色" },
      { "rank": 2, "type": "Normal", "name": "高速星星" },
      { "rank": 2, "type": "Psychic", "name": "精神波" },
      { "rank": 2, "type": "Rock", "name": "力量寶石" },
      { "rank": 2, "type": "Steel", "name": "陀螺球" },
      { "rank": 2, "type": "Water", "name": "泡沫光線" },
      { "rank": 2, "type": "Water", "name": "鹽水" },
      { "rank": 3, "type": "Ghost", "name": "奇異之光" },
      { "rank": 3, "type": "Psychic", "name": "宇宙力量" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Psychic", "name": "光牆" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Bug", "name": "信號光束" },
      { "rank": 4, "type": "Dragon", "name": "龍捲風" },
      { "rank": 4, "type": "Electric", "name": "電磁波" }
    ],
    "isNovice": true
  },
  {
    "id": "121",
    "region": "kanto",
    "name": "寶石海星",
    "alias": "Starmie",
    "type": [ "Water", "Psychic" ],
    "info": {
      "image": "images/pokedex/121.png",
      "height": "1.1",
      "weight": "80",
      "category": "謎寶可夢",
      "text": "This  Pokémon  has  been  given  the nickname  “the  gem  of  the  sea.”  It swims  through  water  by  spinning its star-shaped body as if it were a propeller on a ship. The core at the center glows with different colors"
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "發光", "自然回復" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "聚光燈" },
      { "rank": 1, "type": "Normal", "name": "自我再生" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "高速星星" },
      { "rank": 2, "type": "Normal", "name": "高速旋轉" },
      { "rank": 3, "type": "Ghost", "name": "奇異之光" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Bug", "name": "信號光束" },
      { "rank": 4, "type": "Dragon", "name": "龍捲風" },
      { "rank": 4, "type": "Electric", "name": "電磁波" }
    ]
  },
  {
    "id": "122",
    "region": "kanto",
    "name": "魔牆人偶",
    "alias": "Mr-mime",
    "type": [ "Psychic", "Fairy" ],
    "info": {
      "image": "images/pokedex/122.png",
      "height": "1.3",
      "weight": "54",
      "category": "屏障寶可夢",
      "text": "You don’t find this Pokémon, it finds you.  It  is  really  smart  and  amuses  itself  by  showing  people  its  power to create barriers with pantomime. It creates an invisible box and  flees when you try to figure out the exit."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 3, "max": 7 }
    },
    "ability": [ "隔音", "過濾" ],
    "moves": [
      { "rank": 0, "type": "Psychic", "name": "念力" },
      { "rank": 0, "type": "Psychic", "name": "屏障" },
      { "rank": 1, "type": "Fight", "name": "快速防守" },
      { "rank": 1, "type": "Grass", "name": "魔法葉" },
      { "rank": 1, "type": "Psychic", "name": "戲法" },
      { "rank": 1, "type": "Rock", "name": "廣域防守" },
      { "rank": 2, "type": "Normal", "name": "替身" },
      { "rank": 2, "type": "Normal", "name": "再來一次" },
      { "rank": 2, "type": "Normal", "name": "模仿" },
      { "rank": 2, "type": "Normal", "name": "連環巴掌" },
      { "rank": 2, "type": "Normal", "name": "仿效" },
      { "rank": 2, "type": "Psychic", "name": "反射壁" },
      { "rank": 2, "type": "Psychic", "name": "瑜伽姿勢" },
      { "rank": 2, "type": "Psychic", "name": "防守互換" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 2, "type": "Psychic", "name": "光牆" },
      { "rank": 2, "type": "Psychic", "name": "精神波" },
      { "rank": 2, "type": "Psychic", "name": "力量互換" },
      { "rank": 3, "type": "Normal", "name": "神秘守護" },
      { "rank": 3, "type": "Normal", "name": "接棒" },
      { "rank": 3, "type": "Normal", "name": "回收利用" },
      { "rank": 3, "type": "Fairy", "name": "薄霧場地" },
      { "rank": 3, "type": "Psychic", "name": "扮演" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 4, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 4, "type": "Dark", "name": "詭計" },
      { "rank": 4, "type": "Ghost", "name": "奇異之光" }
    ]
  },
  {
    "id": "123",
    "region": "kanto",
    "name": "飛天螳螂",
    "alias": "Scyther",
    "type": [ "Bug", "Flying" ],
    "info": {
      "image": "images/pokedex/123.png",
      "height": "1.5",
      "weight": "56",
      "category": "螳螂寶可夢",
      "text": "It’s  pretty  rare  but  a  few  swarms have been seen in the grasslands.It  tears  and  shreds  prey  with  its wickedly  sharp  scythes  and  very rarely  spreads  its  wings  to  fly.  This pokemon is stealthy and aggressive."
    },
    "evolution": {
      "stage": "first",
      "with": "攜帶道具交換"
    },
    "baseHP": 3,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "蟲之預感", "技術高手" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Normal", "name": "電光一閃" },
      { "rank": 1, "type": "Normal", "name": "聚氣" },
      { "rank": 1, "type": "Normal", "name": "點到為止" },
      { "rank": 1, "type": "Fight", "name": "真空波" },
      { "rank": 2, "type": "Normal", "name": "影子分身" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Normal", "name": "二連擊" },
      { "rank": 2, "type": "Normal", "name": "旋風刀" },
      { "rank": 2, "type": "Bug", "name": "連斬" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Normal", "name": "佯攻" },
      { "rank": 3, "type": "Normal", "name": "劍舞" },
      { "rank": 3, "type": "Bug", "name": "十字剪" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Flying", "name": "空氣斬" },
      { "rank": 4, "type": "Fight", "name": "快速防守" },
      { "rank": 4, "type": "Flying", "name": "順風" },
      { "rank": 4, "type": "Steel", "name": "鋼翼" }
    ],
    "isNovice": true
  },
  {
    "id": "124",
    "region": "kanto",
    "name": "迷唇姐",
    "alias": "Jynx",
    "type": [ "Ice", "Psychic" ],
    "info": {
      "image": "images/pokedex/124.png",
      "height": "1.4",
      "weight": "41",
      "category": "人形寶可夢",
      "text": "It is not common outside cold areas. This Pokémon is female only. Its cries sound like human speech. However, it is impossible to tell what it is trying to say. The way it moves and talks induce others to dance."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "遲鈍", "預知夢" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "拍擊" },
      { "rank": 0, "type": "Ghost", "name": "舌舔" },
      { "rank": 1, "type": "Normal", "name": "惡魔之吻" },
      { "rank": 1, "type": "Fairy", "name": "吸取之吻" },
      { "rank": 1, "type": "Ice", "name": "細雪" },
      { "rank": 2, "type": "Normal", "name": "黑色目光" },
      { "rank": 2, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 2, "type": "Normal", "name": "連環巴掌" },
      { "rank": 2, "type": "Dark", "name": "假哭" },
      { "rank": 2, "type": "Fight", "name": "喚醒巴掌" },
      { "rank": 2, "type": "Ice", "name": "冰凍拳" },
      { "rank": 2, "type": "Psychic", "name": "愛心印章" },
      { "rank": 3, "type": "Normal", "name": "滅亡之歌" },
      { "rank": 3, "type": "Normal", "name": "絞緊" },
      { "rank": 3, "type": "Ice", "name": "暴風雪" },
      { "rank": 3, "type": "Ice", "name": "雪崩" },
      { "rank": 4, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 4, "type": "Dark", "name": "詭計" },
      { "rank": 4, "type": "Ice", "name": "極光幕" }
    ]
  },
  {
    "id": "125",
    "region": "kanto",
    "name": "電擊獸",
    "alias": "Electabuzz",
    "type": [ "Electric" ],
    "info": {
      "image": "images/pokedex/125.png",
      "height": "1.1",
      "weight": "30",
      "category": "電擊寶可夢",
      "text": " A  violent  Pokémon.  It  searches  for spots where it can feed on electricity  and has been seen absorbing  light-ning from the sky. It’s competitive and aggressive with others."
    },
    "evolution": {
      "stage": "second",
      "with": "攜帶道具交換"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "靜電" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Normal", "name": "電光一閃" },
      { "rank": 1, "type": "Electric", "name": "電擊" },
      { "rank": 1, "type": "Fight", "name": "踢倒" },
      { "rank": 2, "type": "Normal", "name": "高速星星" },
      { "rank": 2, "type": "Electric", "name": "雷電拳" },
      { "rank": 2, "type": "Electric", "name": "電球" },
      { "rank": 2, "type": "Electric", "name": "電擊波" },
      { "rank": 2, "type": "Electric", "name": "電磁波" },
      { "rank": 2, "type": "Psychic", "name": "光牆" },
      { "rank": 3, "type": "Normal", "name": "刺耳聲" },
      { "rank": 3, "type": "Electric", "name": "打雷" },
      { "rank": 3, "type": "Electric", "name": "十萬伏特" },
      { "rank": 3, "type": "Electric", "name": "放電" },
      { "rank": 4, "type": "Dragon", "name": "二連劈" },
      { "rank": 4, "type": "Ice", "name": "冰凍拳" },
      { "rank": 4, "type": "Psychic", "name": "瑜伽姿勢" }
    ]
  },
  {
    "id": "126",
    "region": "kanto",
    "name": "鴨嘴火獸",
    "alias": "Magmar",
    "type": [ "Fire" ],
    "info": {
      "image": "images/pokedex/126.png",
      "height": "1.3",
      "weight": "44",
      "category": "吐火寶可夢",
      "text": "It  can  be  found  living  in  volcanic  areas. In battle, Magmar blows out intense  flames  all  over  its  body to  intimidate  the  opponent.  This  creates  heat  waves  that  ignite grass and trees in the surroundings."
    },
    "evolution": {
      "stage": "second",
      "with": "攜帶道具交換"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "火焰之軀" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Fire", "name": "火花" },
      { "rank": 0, "type": "Poison", "name": "濁霧" },
      { "rank": 1, "type": "Normal", "name": "煙幕" },
      { "rank": 1, "type": "Dark", "name": "出奇一擊" },
      { "rank": 1, "type": "Fire", "name": "火焰旋渦" },
      { "rank": 2, "type": "Fire", "name": "火焰拳" },
      { "rank": 2, "type": "Fire", "name": "烈焰濺射" },
      { "rank": 2, "type": "Fire", "name": "大晴天" },
      { "rank": 2, "type": "Ghost", "name": "奇異之光" },
      { "rank": 2, "type": "Poison", "name": "清除之煙" },
      { "rank": 3, "type": "Fire", "name": "大字爆炎" },
      { "rank": 3, "type": "Fire", "name": "噴煙" },
      { "rank": 3, "type": "Fire", "name": "噴射火焰" },
      { "rank": 4, "type": "Dragon", "name": "二連劈" },
      { "rank": 4, "type": "Fight", "name": "空手劈" },
      { "rank": 4, "type": "Fire", "name": "熱風" }
    ]
  },
  {
    "id": "127",
    "region": "kanto",
    "name": "凱羅斯",
    "alias": "Pinsir",
    "type": [ "Bug" ],
    "info": {
      "image": "images/pokedex/127.png",
      "height": "1.5",
      "weight": "55",
      "category": "鍬形蟲寶可夢",
      "text": " Their  pincers  are  strong  enough to shatter thick logs. Because they dislike cold, Pinsirs burrow and sleep under  the  ground  on  chilly  nights. They  like  to  eat  sap  and  honey, but they are aggressive by nature. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "怪力鉗", "破格" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "聚氣" },
      { "rank": 0, "type": "Normal", "name": "夾住" },
      { "rank": 1, "type": "Normal", "name": "變硬" },
      { "rank": 1, "type": "Normal", "name": "綁緊" },
      { "rank": 1, "type": "Fight", "name": "地球上投" },
      { "rank": 2, "type": "Normal", "name": "二連擊" },
      { "rank": 2, "type": "Bug", "name": "十字剪" },
      { "rank": 2, "type": "Fight", "name": "山嵐摔" },
      { "rank": 2, "type": "Fight", "name": "地獄翻滾" },
      { "rank": 2, "type": "Fight", "name": "借力摔" },
      { "rank": 2, "type": "Fight", "name": "報復" },
      { "rank": 2, "type": "Fight", "name": "劈瓦" },
      { "rank": 3, "type": "Normal", "name": "斷頭鉗" },
      { "rank": 3, "type": "Normal", "name": "劍舞" },
      { "rank": 3, "type": "Normal", "name": "大鬧一番" },
      { "rank": 3, "type": "Fight", "name": "蠻力" },
      { "rank": 4, "type": "Dark", "name": "出奇一擊" },
      { "rank": 4, "type": "Rock", "name": "隱形岩" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ]
  },
  {
    "id": "127-M",
    "region": "kanto",
    "name": "凱羅斯_MEGA",
    "alias": "Pinsir",
    "type": [ "Bug", "Flying" ],
    "info": {
      "image": "images/pokedex/127-M.png",
      "height": "1.7",
      "weight": "59",
      "category": "鍬形蟲寶可夢",
      "text": "With the power of the Mega Stone it  develops  wings  and  inhuman strength. It can lift foes heavier than itself and still fly with ease. Its mind is in a constant state of excitement and it cannot stay still."
    },
    "evolution": {
      "stage": "mega"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 4, "max": 8 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 3, "max": 7 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "飛行皮膚" ],
    "moves": [

    ]
  },
  {
    "id": "128",
    "region": "kanto",
    "name": "肯泰羅",
    "alias": "Tauros",
    "type": [ "Normal" ],
    "info": {
      "image": "images/pokedex/128.png",
      "height": "1.4",
      "weight": "176",
      "category": "暴牛寶可夢",
      "text": "This is a Male species. They travel in herds  around  the  plains  and  fight each  other  by  locking  horns.  The herd’s  protector  takes  pride  in  its battle-scarred horns. Miltank is the female of this species."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "威嚇", "憤怒穴位" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "角撞" },
      { "rank": 1, "type": "Normal", "name": "憤怒" },
      { "rank": 1, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Normal", "name": "鬼面" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Normal", "name": "自我激勵" },
      { "rank": 2, "type": "Dark", "name": "以牙還牙" },
      { "rank": 2, "type": "Psychic", "name": "意念頭鎚" },
      { "rank": 2, "type": "Psychic", "name": "睡覺" },
      { "rank": 3, "type": "Normal", "name": "終極衝擊" },
      { "rank": 3, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 3, "type": "Normal", "name": "大鬧一番" },
      { "rank": 4, "type": "Normal", "name": "夢話" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Steel", "name": "修長之角" }
    ]
  },
  {
    "id": "129",
    "region": "kanto",
    "name": "鯉魚王",
    "alias": "Magikarp",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/129.png",
      "height": "0.9",
      "weight": "10",
      "category": "魚寶可夢",
      "text": "Magikarp is a pathetic excuse of a Pokémon that is not even good to eat. It’s only capable of flopping and splashing. However, it can survive in any body of water no matter how polluted it is."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 0,
    "attr": {
      "str": { "value": 1, "max": 2 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 2 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "悠游自如" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "躍起" },
      { "rank": 2, "type": "Normal", "name": "撞擊" },
      { "rank": 3, "type": "Normal", "name": "抓狂" },
      { "rank": 4, "type": "Flying", "name": "彈跳" }
    ],
    "isNovice": true
  },
  {
    "id": "130",
    "region": "kanto",
    "name": "暴鯉龍",
    "alias": "Gyarados",
    "type": [ "Water", "Flying" ],
    "info": {
      "image": "images/pokedex/130.png",
      "height": "6.5",
      "weight": "235",
      "category": "凶惡寶可夢",
      "text": "It’s rarely seen in the wild. This huge and  vicious  Pokémon  is  known for  the  destruction  it  leaves  in  its wake. In ancient literature, there is a  record of a Gyarados that razed a village when violence flared."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 7,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "威嚇" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Dragon", "name": "龍之怒" },
      { "rank": 1, "type": "Normal", "name": "鬼面" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Dragon", "name": "龍捲風" },
      { "rank": 1, "type": "Flying", "name": "暴風" },
      { "rank": 1, "type": "Ice", "name": "冰凍牙" },
      { "rank": 2, "type": "Normal", "name": "大鬧一番" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 2, "type": "Dragon", "name": "龍之舞" },
      { "rank": 2, "type": "Water", "name": "水流尾" },
      { "rank": 2, "type": "Water", "name": "求雨" },
      { "rank": 3, "type": "Normal", "name": "破壞光線" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Electric", "name": "電磁波" },
      { "rank": 4, "type": "Flying", "name": "彈跳" }
    ]
  },
  {
    "id": "130-M",
    "region": "kanto",
    "name": "暴鯉龍_MEGA",
    "alias": "Gyarados",
    "type": [ "Water", "Dark" ],
    "info": {
      "image": "images/pokedex/130-M.png",
      "height": "6.5",
      "weight": "100",
      "category": "凶惡寶可夢",
      "text": "With the power of the Mega Stone its  body  suffers  a  lot  of  strain,  making  it  faster  and  stronger  but also angrier and uncontrollable. It must have a strong bond or it will  fall into a destructive rampage."
    },
    "evolution": {
      "stage": "mega"
    },
    "baseHP": 8,
    "rank": 4,
    "attr": {
      "str": { "value": 4, "max": 8 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 3, "max": 7 }
    },
    "ability": [ "破格" ],
    "moves": [

    ]
  },
  {
    "id": "131",
    "region": "kanto",
    "name": "拉普拉斯",
    "alias": "Lapras",
    "type": [ "Water", "Ice" ],
    "info": {
      "image": "images/pokedex/131.png",
      "height": "2.5",
      "weight": "132",
      "category": "乘載寶可夢",
      "text": "People have driven Lapras near the point of extinction. In the evenings, this  Pokémon  is  said  to  sing  as  it seeks  what  few  others  of  its  kind still remain. Their gentle nature has made them easy to lure and catch."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 6,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "硬殼盔甲", "儲水" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "唱歌" },
      { "rank": 1, "type": "Ice", "name": "白霧" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 2, "type": "Ghost", "name": "奇異之光" },
      { "rank": 2, "type": "Ice", "name": "冰礫" },
      { "rank": 2, "type": "Ice", "name": "冰凍光束" },
      { "rank": 2, "type": "Water", "name": "鹽水" },
      { "rank": 2, "type": "Water", "name": "求雨" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 3, "type": "Normal", "name": "滅亡之歌" },
      { "rank": 3, "type": "Normal", "name": "神秘守護" },
      { "rank": 3, "type": "Ice", "name": "絕對零度" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Dragon", "name": "龍之舞" },
      { "rank": 4, "type": "Ice", "name": "冷凍乾燥" }
    ]
  },
  {
    "id": "132",
    "region": "kanto",
    "name": "百變怪",
    "alias": "Ditto",
    "type": [ "Normal" ],
    "info": {
      "image": "images/pokedex/132.png",
      "height": "0.3",
      "weight": "4",
      "category": "變身寶可夢",
      "text": "This Pokémon is quite common but it’s  pretty  difficult  to  spot.  It  can transform into any other Pokémon and imitate their behavior. When it sleeps,  it  changes  into  a  stone  to avoid being attacked."
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
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "柔軟" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變身" }
    ]
  },
  {
    "id": "133",
    "region": "kanto",
    "name": "伊布",
    "alias": "Eevee",
    "type": [ "Normal" ],
    "info": {
      "image": "images/pokedex/133.png",
      "height": "0.3",
      "weight": "6",
      "category": "進化寶可夢",
      "text": " This  Pokémon  is  extremely  rare  to find. Eevee has an unstable genetic makeup  that  suddenly  mutates  to fit  its  environment.  Radiation  from various stones causes this Pokémon to evolve. "
    },
    "evolution": {
      "stage": "first",
      "with": "許多不同方式"
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
    "ability": [ "逃跑", "適應力" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Normal", "name": "幫助" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Fairy", "name": "圓瞳" },
      { "rank": 1, "type": "Ground", "name": "潑沙" },
      { "rank": 2, "type": "Normal", "name": "接棒" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Normal", "name": "煥然一新" },
      { "rank": 2, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Normal", "name": "渴望" },
      { "rank": 2, "type": "Normal", "name": "高速星星" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Fairy", "name": "撒嬌" },
      { "rank": 3, "type": "Normal", "name": "珍藏" },
      { "rank": 3, "type": "Normal", "name": "王牌" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 4, "type": "Normal", "name": "祈願" },
      { "rank": 4, "type": "Normal", "name": "搔癢" },
      { "rank": 4, "type": "Dark", "name": "假哭" }
    ],
    "isNovice": true
  },
  {
    "id": "134",
    "region": "kanto",
    "name": "水伊布",
    "alias": "Vaporeon",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/134.png",
      "height": "1.0",
      "weight": "29",
      "category": "吐泡寶可夢",
      "text": " Vaporeon  underwent  through  a strange  mutation,  it  grew  fins  and gills that allow it to live underwater. This  Pokémon  has  the  ability  to become  translucid  when  it  dives underwater. "
    },
    "evolution": {
      "stage": "final",
      "by": "水之石"
    },
    "baseHP": 6,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "儲水" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "幫助" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Ice", "name": "極光束" },
      { "rank": 2, "type": "Ice", "name": "黑霧" },
      { "rank": 2, "type": "Poison", "name": "溶化" },
      { "rank": 2, "type": "Water", "name": "水流環" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 3, "type": "Normal", "name": "珍藏" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 3, "type": "Water", "name": "濁流" },
      { "rank": 4, "type": "Normal", "name": "哈欠" },
      { "rank": 4, "type": "Normal", "name": "祈願" },
      { "rank": 4, "type": "Ice", "name": "冰凍之風" }
    ]
  },
  {
    "id": "135",
    "region": "kanto",
    "name": "雷伊布",
    "alias": "Jolteon",
    "type": [ "Electric" ],
    "info": {
      "image": "images/pokedex/135.png",
      "height": "0.8",
      "weight": "24",
      "category": "雷寶可夢",
      "text": " This  Pokémon  evolved  after  being affected by electric radiation. Every hair on its body starts to stand sharply if it becomes charged with electricity. It shoots lightning from all around its body."
    },
    "evolution": {
      "stage": "final",
      "by": "雷之石"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 3, "max": 7 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "蓄電" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "幫助" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Electric", "name": "電擊" },
      { "rank": 1, "type": "Ground", "name": "潑沙" },
      { "rank": 2, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Bug", "name": "飛彈針" },
      { "rank": 2, "type": "Electric", "name": "雷電牙" },
      { "rank": 2, "type": "Electric", "name": "電磁波" },
      { "rank": 2, "type": "Fight", "name": "二連踢" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Normal", "name": "珍藏" },
      { "rank": 3, "type": "Electric", "name": "打雷" },
      { "rank": 3, "type": "Electric", "name": "放電" },
      { "rank": 4, "type": "Normal", "name": "挺住" },
      { "rank": 4, "type": "Normal", "name": "祈願" },
      { "rank": 4, "type": "Electric", "name": "電磁飄浮" }
    ]
  },
  {
    "id": "136",
    "region": "kanto",
    "name": "火伊布",
    "alias": "Flareon",
    "type": [ "Fire" ],
    "info": {
      "image": "images/pokedex/136.png",
      "height": "0.9",
      "weight": "25",
      "category": "火寶可夢",
      "text": "A few have been seen in volcanic areas  but  just  like  its  counterparts is more common to see it being the pet  of  wealthy  people.  Its  flaming fur is most appreciated for its warm glow and silky touch."
    },
    "evolution": {
      "stage": "final",
      "by": "火之石"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "引火" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "幫助" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Fire", "name": "火花" },
      { "rank": 1, "type": "Ground", "name": "潑沙" },
      { "rank": 2, "type": "Normal", "name": "鬼面" },
      { "rank": 2, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Fire", "name": "火焰牙" },
      { "rank": 2, "type": "Fire", "name": "火焰旋渦" },
      { "rank": 2, "type": "Poison", "name": "濁霧" },
      { "rank": 3, "type": "Normal", "name": "珍藏" },
      { "rank": 3, "type": "Fire", "name": "閃焰衝鋒" },
      { "rank": 3, "type": "Fire", "name": "噴煙" },
      { "rank": 4, "type": "Normal", "name": "祈願" },
      { "rank": 4, "type": "Fight", "name": "看穿" },
      { "rank": 4, "type": "Fire", "name": "熱風" }
    ]
  },
  {
    "id": "137",
    "region": "kanto",
    "name": "多邊獸",
    "alias": "Porygon",
    "type": [ "Normal" ],
    "info": {
      "image": "images/pokedex/137.png",
      "height": "0.8",
      "weight": "36",
      "category": "虛擬寶可夢",
      "text": " The  first  case  of  a  man-made Pokémon  created  as  computer data. It is capable of reverting itself into a program in order to enter the  cyberspace. Its software has a fire-wall so it cannot be copied."
    },
    "evolution": {
      "stage": "first",
      "with": "攜帶道具交換"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "複製", "下載" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "紋理" },
      { "rank": 1, "type": "Normal", "name": "棱角化" },
      { "rank": 1, "type": "Normal", "name": "紋理２" },
      { "rank": 2, "type": "Normal", "name": "回收利用" },
      { "rank": 2, "type": "Normal", "name": "自我再生" },
      { "rank": 2, "type": "Bug", "name": "信號光束" },
      { "rank": 2, "type": "Electric", "name": "電磁飄浮" },
      { "rank": 2, "type": "Electric", "name": "放電" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 3, "type": "Normal", "name": "鎖定" },
      { "rank": 3, "type": "Normal", "name": "三重攻擊" },
      { "rank": 3, "type": "Electric", "name": "電磁炮" },
      { "rank": 3, "type": "Psychic", "name": "魔法反射" },
      { "rank": 4, "type": "Normal", "name": "分擔痛楚" },
      { "rank": 4, "type": "Dark", "name": "欺詐" },
      { "rank": 4, "type": "Electric", "name": "電網" }
    ],
    "isNovice": true
  },
  {
    "id": "138",
    "region": "kanto",
    "name": "菊石獸",
    "alias": "Omanyte",
    "type": [ "Rock", "Water" ],
    "info": {
      "image": "images/pokedex/138.png",
      "height": "0.4",
      "weight": "7",
      "category": "漩渦寶可夢",
      "text": "One  of  the  ancient  and  extinct  Pokémon  that  have  been  revived from fossils by science. If attacked, it withdraws into its hard shell. It is not found in the wild anymore, but  fossils can be found in the sea."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "悠游自如", "硬殼盔甲" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "纏繞" },
      { "rank": 0, "type": "Water", "name": "縮入殼中" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Rock", "name": "滾動" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "瞪眼" },
      { "rank": 2, "type": "Normal", "name": "搔癢" },
      { "rank": 2, "type": "Normal", "name": "守住" },
      { "rank": 2, "type": "Ground", "name": "泥巴射擊" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 2, "type": "Water", "name": "鹽水" },
      { "rank": 3, "type": "Normal", "name": "破殼" },
      { "rank": 3, "type": "Rock", "name": "岩石爆擊" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Ground", "name": "撒菱" },
      { "rank": 4, "type": "Poison", "name": "毒菱" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ]
  },
  {
    "id": "139",
    "region": "kanto",
    "name": "多刺菊石獸",
    "alias": "Omastar",
    "type": [ "Rock", "Water" ],
    "info": {
      "image": "images/pokedex/139.png",
      "height": "1.0",
      "weight": "35",
      "category": "漩渦寶可夢",
      "text": "An  Omastar  used  its  tentacles  to ensnare  and  capture  its  prey.  It  is believed  to  have  become  extinct because  the  shell  grew  too  large, making it slow and ponderous. It is not found in the wild anymore."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 3, "max": 7 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "悠游自如", "硬殼盔甲" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "纏繞" },
      { "rank": 0, "type": "Water", "name": "縮入殼中" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Rock", "name": "滾動" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 2, "type": "Normal", "name": "搔癢" },
      { "rank": 2, "type": "Normal", "name": "瞪眼" },
      { "rank": 2, "type": "Normal", "name": "尖刺加農炮" },
      { "rank": 2, "type": "Normal", "name": "守住" },
      { "rank": 2, "type": "Ground", "name": "泥巴射擊" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 2, "type": "Water", "name": "鹽水" },
      { "rank": 3, "type": "Normal", "name": "破殼" },
      { "rank": 3, "type": "Rock", "name": "岩石爆擊" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 4, "type": "Ground", "name": "撒菱" },
      { "rank": 4, "type": "Poison", "name": "毒菱" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ]
  },
  {
    "id": "140",
    "region": "kanto",
    "name": "化石盔",
    "alias": "Kabuto",
    "type": [ "Rock", "Water" ],
    "info": {
      "image": "images/pokedex/140.png",
      "height": "0.5",
      "weight": "11",
      "category": "甲殼寶可夢",
      "text": "Kabuto  is  a  Pokémon  that  has been  regenerated  from  a  fossil.  However,  in  extremely  rare  cases, living  specimens  have  been  found. The Pokémon has not changed at all for 300 million years."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "悠游自如", "戰鬥盔甲" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變硬" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Grass", "name": "吸取" },
      { "rank": 1, "type": "Ground", "name": "潑沙" },
      { "rank": 2, "type": "Normal", "name": "挺住" },
      { "rank": 2, "type": "Grass", "name": "超級吸取" },
      { "rank": 2, "type": "Ground", "name": "泥巴射擊" },
      { "rank": 2, "type": "Steel", "name": "金屬音" },
      { "rank": 2, "type": "Water", "name": "水流噴射" },
      { "rank": 3, "type": "Normal", "name": "絞緊" },
      { "rank": 3, "type": "Rock", "name": "原始之力" },
      { "rank": 4, "type": "Ghost", "name": "奇異之光" },
      { "rank": 4, "type": "Rock", "name": "隱形岩" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ]
  },
  {
    "id": "141",
    "region": "kanto",
    "name": "鐮刀盔",
    "alias": "Kabutops",
    "type": [ "Rock", "Water" ],
    "info": {
      "image": "images/pokedex/141.png",
      "height": "1.3",
      "weight": "40",
      "category": "甲殼寶可夢",
      "text": "Kabutops  swarmed  underwater to hunt for prey. It was apparently evolving from being a water dweller to  living  on  land.  It’s  evident  from  the changes in its gills and legs. Its fossils suggests it was aggressive. "
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
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "悠游自如", "戰鬥盔甲" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變硬" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Grass", "name": "吸取" },
      { "rank": 1, "type": "Ground", "name": "潑沙" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Normal", "name": "佯攻" },
      { "rank": 2, "type": "Normal", "name": "挺住" },
      { "rank": 2, "type": "Grass", "name": "超級吸取" },
      { "rank": 2, "type": "Ground", "name": "泥巴射擊" },
      { "rank": 2, "type": "Steel", "name": "金屬音" },
      { "rank": 2, "type": "Water", "name": "水流噴射" },
      { "rank": 3, "type": "Normal", "name": "絞緊" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Rock", "name": "原始之力" },
      { "rank": 4, "type": "Ghost", "name": "奇異之光" },
      { "rank": 4, "type": "Rock", "name": "隱形岩" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ]
  },
  {
    "id": "142",
    "region": "kanto",
    "name": "化石翼龍",
    "alias": "Aerodactyl",
    "type": [ "Rock", "Flying" ],
    "info": {
      "image": "images/pokedex/142.png",
      "height": "1.8",
      "weight": "120",
      "category": "化石寶可夢",
      "text": " A vicious Pokémon from the distant  past.  It  appears  to  have  flown  by spreading its wings and gliding. One has been revived from a fossil. It’s  very  dangerous;  it  attacks  with the intent to tear apart its victims. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 3, "max": 7 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "堅硬腦袋", "壓迫感" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "超音波" },
      { "rank": 0, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 1, "type": "Normal", "name": "鬼面" },
      { "rank": 1, "type": "Normal", "name": "猛撞" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Normal", "name": "吼叫" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 2, "type": "Electric", "name": "雷電牙" },
      { "rank": 2, "type": "Fire", "name": "火焰牙" },
      { "rank": 2, "type": "Flying", "name": "自由落體" },
      { "rank": 2, "type": "Ice", "name": "冰凍牙" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Steel", "name": "鐵頭" },
      { "rank": 3, "type": "Normal", "name": "終極衝擊" },
      { "rank": 3, "type": "Normal", "name": "破壞光線" },
      { "rank": 3, "type": "Rock", "name": "岩崩" },
      { "rank": 4, "type": "Dragon", "name": "龍息" },
      { "rank": 4, "type": "Flying", "name": "羽棲" },
      { "rank": 4, "type": "Water", "name": "水流尾" }
    ]
  },
  {
    "id": "142-M",
    "region": "kanto",
    "name": "化石翼龍_MEGA",
    "alias": "Aerodactyl",
    "type": [ "Rock", "Flying" ],
    "info": {
      "image": "images/pokedex/142-M.png",
      "height": "2.1",
      "weight": "180",
      "category": "化石寶可夢",
      "text": "With the power of the Mega Stone it restores the original appearance it  had  millions  of  years  ago  with its  body  covered  in  sharp  rocks.  It is  very  aggressive  and  will  attack  anything that moves."
    },
    "evolution": {
      "stage": "mega"
    },
    "baseHP": 5,
    "rank": 4,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 3, "max": 7 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "硬爪" ],
    "moves": [

    ]
  },
  {
    "id": "143",
    "region": "kanto",
    "name": "卡比獸",
    "alias": "Snorlax",
    "type": [ "Normal" ],
    "info": {
      "image": "images/pokedex/143.png",
      "height": "2.1",
      "weight": "460",
      "category": "瞌睡寶可夢",
      "text": "Snorlax’s  typical  day  consists  of  eating  and  sleeping.  It  is  such  a docile  Pokémon  that  children  use its big belly as a place to play. It only attacks  when  it’s  awoken  harshly. Fortunately it is a heavy sleeper."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 8,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "免疫", "厚脂肪" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變圓" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "哈欠" },
      { "rank": 1, "type": "Ghost", "name": "舌舔" },
      { "rank": 1, "type": "Psychic", "name": "瞬間失憶" },
      { "rank": 2, "type": "Normal", "name": "擋路" },
      { "rank": 2, "type": "Normal", "name": "夢話" },
      { "rank": 2, "type": "Normal", "name": "逐步擊破" },
      { "rank": 2, "type": "Normal", "name": "打鼾" },
      { "rank": 2, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 2, "type": "Psychic", "name": "睡覺" },
      { "rank": 2, "type": "Rock", "name": "滾動" },
      { "rank": 3, "type": "Normal", "name": "終極衝擊" },
      { "rank": 3, "type": "Normal", "name": "腹鼓" },
      { "rank": 3, "type": "Ground", "name": "十萬馬力" },
      { "rank": 3, "type": "Steel", "name": "重磅衝撞" },
      { "rank": 4, "type": "Normal", "name": "自爆" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Poison", "name": "垃圾射擊" }
    ]
  },
  {
    "id": "144",
    "region": "kanto",
    "name": "急凍鳥",
    "alias": "Articuno",
    "type": [ "Ice", "Flying" ],
    "info": {
      "image": "images/pokedex/144.png",
      "height": "1.7",
      "weight": "55",
      "category": "無資料",
      "text": "Pokédex has no data.Rumor  has  it  that  one  appeared during a blizzard in front of two lost hikers  who  followed  its  glistening trail until they found the main road.Others  say  its  silhouette  can  be seen during raging snow storms."
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 4,
    "rank": 5,
    "attr": {
      "str": { "value": 5, "max": 5 },
      "dex": { "value": 5, "max": 5 },
      "vit": { "value": 6, "max": 6 },
      "spe": { "value": 6, "max": 6 },
      "ins": { "value": 7, "max": 7 }
    },
    "ability": [ "壓迫感", "雪隱" ],
    "moves": [
      { "rank": 5, "type": "Normal", "name": "吹飛" },
      { "rank": 5, "type": "Normal", "name": "心之眼" },
      { "rank": 5, "type": "Flying", "name": "飛翔" },
      { "rank": 5, "type": "Flying", "name": "羽棲" },
      { "rank": 5, "type": "Flying", "name": "神鳥猛擊" },
      { "rank": 5, "type": "Flying", "name": "暴風" },
      { "rank": 5, "type": "Flying", "name": "順風" },
      { "rank": 5, "type": "Flying", "name": "起風" },
      { "rank": 5, "type": "Ghost", "name": "奇異之風" },
      { "rank": 5, "type": "Ice", "name": "絕對零度" },
      { "rank": 5, "type": "Ice", "name": "冰凍光束" },
      { "rank": 5, "type": "Ice", "name": "冰雹" },
      { "rank": 5, "type": "Ice", "name": "冷凍乾燥" },
      { "rank": 5, "type": "Ice", "name": "冰礫" },
      { "rank": 5, "type": "Ice", "name": "細雪" },
      { "rank": 5, "type": "Ice", "name": "冰凍之風" },
      { "rank": 5, "type": "Ice", "name": "暴風雪" },
      { "rank": 5, "type": "Ice", "name": "白霧" },
      { "rank": 5, "type": "Psychic", "name": "反射壁" },
      { "rank": 5, "type": "Psychic", "name": "高速移動" },
      { "rank": 5, "type": "Rock", "name": "原始之力" },
      { "rank": 5, "type": "Water", "name": "水之波動" }
    ]
  },
  {
    "id": "145",
    "region": "kanto",
    "name": "閃電鳥",
    "alias": "Zapdos",
    "type": [ "Electric", "Flying" ],
    "info": {
      "image": "images/pokedex/145.png",
      "height": "1.6",
      "weight": "52",
      "category": "無資料",
      "text": "Pokédex has no data.The  myth  tells  of  a  bird  who  lived inside  the  thunderstorms  of  the region.  It  covered  itself  in  lightning while flying in the dark clouds. A news  report  said  it  was  involved  in  the closure of an energy plant."
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 4,
    "rank": 5,
    "attr": {
      "str": { "value": 5, "max": 5 },
      "dex": { "value": 6, "max": 6 },
      "vit": { "value": 5, "max": 5 },
      "spe": { "value": 7, "max": 7 },
      "ins": { "value": 5, "max": 5 }
    },
    "ability": [ "壓迫感", "靜電" ],
    "moves": [
      { "rank": 5, "type": "Normal", "name": "吹飛" },
      { "rank": 5, "type": "Normal", "name": "磨礪" },
      { "rank": 5, "type": "Dragon", "name": "龍捲風" },
      { "rank": 5, "type": "Electric", "name": "電磁炮" },
      { "rank": 5, "type": "Electric", "name": "電擊" },
      { "rank": 5, "type": "Electric", "name": "磁場操控" },
      { "rank": 5, "type": "Electric", "name": "打雷" },
      { "rank": 5, "type": "Electric", "name": "放電" },
      { "rank": 5, "type": "Electric", "name": "充電" },
      { "rank": 5, "type": "Electric", "name": "電磁波" },
      { "rank": 5, "type": "Fight", "name": "看穿" },
      { "rank": 5, "type": "Fire", "name": "熱風" },
      { "rank": 5, "type": "Flying", "name": "飛翔" },
      { "rank": 5, "type": "Flying", "name": "羽棲" },
      { "rank": 5, "type": "Flying", "name": "啄鑽" },
      { "rank": 5, "type": "Flying", "name": "神鳥猛擊" },
      { "rank": 5, "type": "Flying", "name": "啄食" },
      { "rank": 5, "type": "Flying", "name": "啄" },
      { "rank": 5, "type": "Psychic", "name": "高速移動" },
      { "rank": 5, "type": "Psychic", "name": "光牆" },
      { "rank": 5, "type": "Rock", "name": "原始之力" },
      { "rank": 5, "type": "Water", "name": "求雨" }
    ]
  },
  {
    "id": "146",
    "region": "kanto",
    "name": "火焰鳥",
    "alias": "Moltres",
    "type": [ "Fire", "Flying" ],
    "info": {
      "image": "images/pokedex/146.png",
      "height": "2.0",
      "weight": "60",
      "category": "無資料",
      "text": "Pokédex has no data.The  legend  speaks  of  a  bird  who came flying from the south. Its fiery body melted the snow and brought the  spring  along.  A  children‘s  book depicts  a  similar  Pokémon  living  inside of a volcano."
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 4,
    "rank": 5,
    "attr": {
      "str": { "value": 6, "max": 6 },
      "dex": { "value": 5, "max": 5 },
      "vit": { "value": 5, "max": 5 },
      "spe": { "value": 7, "max": 7 },
      "ins": { "value": 5, "max": 5 }
    },
    "ability": [ "壓迫感", "火焰之軀" ],
    "moves": [
      { "rank": 5, "type": "Normal", "name": "神秘守護" },
      { "rank": 5, "type": "Normal", "name": "高速星星" },
      { "rank": 5, "type": "Normal", "name": "挺住" },
      { "rank": 5, "type": "Fire", "name": "大字爆炎" },
      { "rank": 5, "type": "Fire", "name": "蓄能焰襲" },
      { "rank": 5, "type": "Fire", "name": "燃盡" },
      { "rank": 5, "type": "Fire", "name": "大晴天" },
      { "rank": 5, "type": "Fire", "name": "火花" },
      { "rank": 5, "type": "Fire", "name": "鬼火" },
      { "rank": 5, "type": "Fire", "name": "熱風" },
      { "rank": 5, "type": "Fire", "name": "噴射火焰" },
      { "rank": 5, "type": "Fire", "name": "火焰旋渦" },
      { "rank": 5, "type": "Flying", "name": "飛翔" },
      { "rank": 5, "type": "Flying", "name": "羽棲" },
      { "rank": 5, "type": "Flying", "name": "暴風" },
      { "rank": 5, "type": "Flying", "name": "神鳥猛擊" },
      { "rank": 5, "type": "Flying", "name": "空氣斬" },
      { "rank": 5, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 5, "type": "Ghost", "name": "詛咒" },
      { "rank": 5, "type": "Grass", "name": "日光束" },
      { "rank": 5, "type": "Psychic", "name": "高速移動" },
      { "rank": 5, "type": "Rock", "name": "原始之力" }
    ]
  },
  {
    "id": "147",
    "region": "kanto",
    "name": "迷你龍",
    "alias": "Dratini",
    "type": [ "Dragon" ],
    "info": {
      "image": "images/pokedex/147.png",
      "height": "1.7",
      "weight": "3",
      "category": "龍寶可夢",
      "text": " Up  until  recently  its  existence  was debated  as  being  a  mere  legend, then  a  small  colony  was  found  underwater. It is still extremely rare to find. It sheds skin and grows larger  every day. "
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
    "ability": [ "蛻皮" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Normal", "name": "緊束" },
      { "rank": 1, "type": "Dragon", "name": "龍捲風" },
      { "rank": 1, "type": "Electric", "name": "電磁波" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 2, "type": "Normal", "name": "神秘守護" },
      { "rank": 2, "type": "Dragon", "name": "龍之俯衝" },
      { "rank": 2, "type": "Dragon", "name": "龍尾" },
      { "rank": 2, "type": "Dragon", "name": "龍之怒" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Water", "name": "水流尾" },
      { "rank": 3, "type": "Normal", "name": "破壞光線" },
      { "rank": 3, "type": "Dragon", "name": "龍之舞" },
      { "rank": 3, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Normal", "name": "神速" },
      { "rank": 4, "type": "Ice", "name": "白霧" },
      { "rank": 4, "type": "Water", "name": "水流噴射" }
    ],
    "isNovice": true
  },
  {
    "id": "148",
    "region": "kanto",
    "name": "哈克龍",
    "alias": "Dragonair",
    "type": [ "Dragon" ],
    "info": {
      "image": "images/pokedex/148.png",
      "height": "4.0",
      "weight": "16",
      "category": "龍寶可夢",
      "text": "It  is  said  to  live  in  seas  and  lakes. Even though it has no wings, it has been  depicted  flying.  There  were legends of this Pokémon controlling the weather and ending the storms to leave a rainbow behind. "
    },
    "evolution": {
      "stage": "second",
      "time": "slow"
    },
    "baseHP": 6,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "蛻皮" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Normal", "name": "緊束" },
      { "rank": 1, "type": "Dragon", "name": "龍捲風" },
      { "rank": 1, "type": "Electric", "name": "電磁波" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 2, "type": "Normal", "name": "神秘守護" },
      { "rank": 2, "type": "Dragon", "name": "龍之俯衝" },
      { "rank": 2, "type": "Dragon", "name": "龍尾" },
      { "rank": 2, "type": "Dragon", "name": "龍之怒" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Water", "name": "水流尾" },
      { "rank": 3, "type": "Normal", "name": "破壞光線" },
      { "rank": 3, "type": "Dragon", "name": "龍之舞" },
      { "rank": 3, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Normal", "name": "神速" },
      { "rank": 4, "type": "Ice", "name": "白霧" },
      { "rank": 4, "type": "Water", "name": "水流噴射" }
    ]
  },
  {
    "id": "149",
    "region": "kanto",
    "name": "快龍",
    "alias": "Dragonite",
    "type": [ "Dragon", "Flying" ],
    "info": {
      "image": "images/pokedex/149.png",
      "height": "2.2",
      "weight": "210",
      "category": "龍寶可夢",
      "text": "Very few people have ever seen this Pokémon.  Its  intelligence  matches that of humans. There are records of a Pokémon with a similar description  that  helped  rescue  a  ship  full  of people during a hurricane."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 6,
    "rank": 4,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "精神力" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "緊束" },
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 1, "type": "Dragon", "name": "龍捲風" },
      { "rank": 1, "type": "Electric", "name": "電磁波" },
      { "rank": 2, "type": "Normal", "name": "神秘守護" },
      { "rank": 2, "type": "Normal", "name": "摔打" },
      { "rank": 2, "type": "Dragon", "name": "龍之怒" },
      { "rank": 2, "type": "Dragon", "name": "龍之俯衝" },
      { "rank": 2, "type": "Dragon", "name": "龍尾" },
      { "rank": 2, "type": "Electric", "name": "雷電拳" },
      { "rank": 2, "type": "Fire", "name": "火焰拳" },
      { "rank": 2, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 2, "type": "Flying", "name": "羽棲" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 2, "type": "Water", "name": "水流尾" },
      { "rank": 3, "type": "Normal", "name": "破壞光線" },
      { "rank": 3, "type": "Dragon", "name": "龍之舞" },
      { "rank": 3, "type": "Dragon", "name": "逆鱗" },
      { "rank": 3, "type": "Flying", "name": "暴風" },
      { "rank": 4, "type": "Normal", "name": "神速" },
      { "rank": 4, "type": "Dragon", "name": "流星群" },
      { "rank": 4, "type": "Flying", "name": "順風" }
    ]
  },
  {
    "id": "150",
    "region": "kanto",
    "name": "超夢",
    "alias": "Mewtwo",
    "type": [ "Psychic" ],
    "info": {
      "image": "images/pokedex/150.png",
      "height": "2.0",
      "weight": "122",
      "category": "無資料",
      "text": "Pokédex has no data.An  article  in  a  science  magazine talked  about  how  much  cloning  research was progressing, but... could it be?"
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 5,
    "rank": 5,
    "attr": {
      "str": { "value": 6, "max": 6 },
      "dex": { "value": 7, "max": 7 },
      "vit": { "value": 5, "max": 5 },
      "spe": { "value": 8, "max": 8 },
      "ins": { "value": 5, "max": 5 }
    },
    "ability": [ "壓迫感" ],
    "moves": [
      { "rank": 5, "type": "Normal", "name": "自我暗示" },
      { "rank": 5, "type": "Normal", "name": "高速星星" },
      { "rank": 5, "type": "Normal", "name": "定身法" },
      { "rank": 5, "type": "Normal", "name": "自爆" },
      { "rank": 5, "type": "Normal", "name": "搶先一步" },
      { "rank": 5, "type": "Normal", "name": "自我再生" },
      { "rank": 5, "type": "Normal", "name": "神秘守護" },
      { "rank": 5, "type": "Normal", "name": "磨礪" },
      { "rank": 5, "type": "Dark", "name": "搶奪" },
      { "rank": 5, "type": "Fight", "name": "吸取拳" },
      { "rank": 5, "type": "Fight", "name": "波導彈" },
      { "rank": 5, "type": "Ice", "name": "白霧" },
      { "rank": 5, "type": "Ice", "name": "暴風雪" },
      { "rank": 5, "type": "Psychic", "name": "意念移物" },
      { "rank": 5, "type": "Psychic", "name": "精神擊破" },
      { "rank": 5, "type": "Psychic", "name": "精神強念" },
      { "rank": 5, "type": "Psychic", "name": "防守互換" },
      { "rank": 5, "type": "Psychic", "name": "精神利刃" },
      { "rank": 5, "type": "Psychic", "name": "精神波" },
      { "rank": 5, "type": "Psychic", "name": "瞬間失憶" },
      { "rank": 5, "type": "Psychic", "name": "屏障" },
      { "rank": 5, "type": "Psychic", "name": "力量互換" },
      { "rank": 5, "type": "Psychic", "name": "奇蹟之眼" },
      { "rank": 5, "type": "Psychic", "name": "預知未來" },
      { "rank": 5, "type": "Psychic", "name": "念力" }
    ],
    "isLegend": true
  },
  {
    "id": "150-MY",
    "region": "kanto",
    "name": "超夢_MEGA_Y",
    "alias": "Mewtwo",
    "type": [ "Psychic" ],
    "info": {
      "image": "images/pokedex/150-MY.png",
      "height": "1.5",
      "weight": "33",
      "category": "無資料",
      "text": "Pokédex has no data.With the power of the Mega Stone its  body  got  smaller  but  its  power grew immensely. It can blow up even a skycrapper with just its thoughts."
    },
    "evolution": {
      "stage": "mega"
    },
    "baseHP": 6,
    "rank": 5,
    "attr": {
      "str": { "value": 8, "max": 8 },
      "dex": { "value": 7, "max": 7 },
      "vit": { "value": 5, "max": 5 },
      "spe": { "value": 10, "max": 10 },
      "ins": { "value": 7, "max": 7 }
    },
    "ability": [ "不眠" ],
    "moves": [

    ],
    "isLegend": true
  },
  {
    "id": "150-MX",
    "region": "kanto",
    "name": "超夢_MEGA_X",
    "alias": "Mewtwo",
    "type": [ "Psychic", "Fight" ],
    "info": {
      "image": "images/pokedex/150-MX.png",
      "height": "2.3",
      "weight": "127",
      "category": "無資料",
      "text": "Pokédex has no data.The  power  of  the  Mega  Stone was  absorbed  into  its  muscles  if  it  grapples you and its psychic force does not crack you its strong arms will."
    },
    "evolution": {
      "stage": "mega"
    },
    "baseHP": 6,
    "rank": 5,
    "attr": {
      "str": { "value": 9, "max": 9 },
      "dex": { "value": 7, "max": 7 },
      "vit": { "value": 6, "max": 6 },
      "spe": { "value": 7, "max": 7 },
      "ins": { "value": 6, "max": 6 }
    },
    "ability": [ "不屈之心" ],
    "moves": [

    ],
    "isLegend": true
  },
  {
    "id": "151",
    "region": "kanto",
    "name": "夢幻",
    "alias": "Mew",
    "type": [ "Psychic" ],
    "info": {
      "image": "images/pokedex/151.png",
      "height": "0.4",
      "weight": "4",
      "category": "無資料",
      "text": "Pokédex has no data.Recent  investigations  declare  that this Pokémon could be the common ancestor of all actual Pokémon, but it  has  been  extinct  for  centuries.Some  people  claim  to  have  seen one to get their 15 minutes of fame."
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 5,
    "rank": 5,
    "attr": {
      "str": { "value": 6, "max": 6 },
      "dex": { "value": 6, "max": 6 },
      "vit": { "value": 6, "max": 6 },
      "spe": { "value": 6, "max": 6 },
      "ins": { "value": 6, "max": 6 }
    },
    "ability": [ "同步" ],
    "moves": [
      { "rank": 5, "type": "Normal", "name": "搶先一步" },
      { "rank": 5, "type": "Normal", "name": "百萬噸重拳" },
      { "rank": 5, "type": "Normal", "name": "鏡面屬性" },
      { "rank": 5, "type": "Normal", "name": "接棒" },
      { "rank": 5, "type": "Normal", "name": "揮指" },
      { "rank": 5, "type": "Normal", "name": "變身" },
      { "rank": 5, "type": "Normal", "name": "拍擊" },
      { "rank": 5, "type": "Dark", "name": "詭計" },
      { "rank": 5, "type": "Fight", "name": "波導彈" },
      { "rank": 5, "type": "Psychic", "name": "精神強念" },
      { "rank": 5, "type": "Psychic", "name": "瞬間失憶" },
      { "rank": 5, "type": "Psychic", "name": "屏障" },
      { "rank": 5, "type": "Rock", "name": "原始之力" },
      { "rank": 5, "type": "???", "name": "任何招式" }
    ],
    "isLegend": true
  }
]);
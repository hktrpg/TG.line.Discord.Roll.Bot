var MoveList;
if(!MoveList) MoveList = [];

Array.prototype.push.apply(MoveList, [
	{
		"name": "骨棒", "alias": "ホネこんぼう|Bone Club",
		"power": "2",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "frame|flinch||number|d2"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "骰 2 顆機率骰以使敵人陷入「畏縮」狀態。",
		"desc": "使用者用骨頭狠狠擊打目標，可能會在目標頭上留下一個腫包。"
	},
	{
		"name": "骨棒亂打", "alias": "ボーンラッシュ|Bone Rush",
		"power": "1",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|sact_5"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1",
		"effect": "連續行動。",
		"desc": "使用者使用骨棒迅速地擊打敵人，一下接著一下，接連不斷。"
	},
	{
		"name": "骨頭迴力鏢", "alias": "ホネブーメラン|Bonemerang",
		"power": "2",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|sact_2"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "遠程攻擊。雙重行動。",
		"desc": "寶可夢扔出一根骨頭擊打敵人。骨頭像會像回力鏢一樣，攻擊兩次。"
	},
	{
		"name": "重踏", "alias": "じならし|Bulldoze",
		"power": "2",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|area", "frame|target|靈巧|down|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "範圍攻擊。降低目標的靈巧。",
		"desc": "使用者用力踩踏地面，踏碎石頭、樹木和附近的一切。"
	},
	{
		"name": "挖洞", "alias": "あなをほる|Dig",
		"power": "3",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|foe", "effect|l|charge"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "蓄力招式。當這個招式在蓄力時，使用者將脫離招式的影響範圍。但是〈地震〉、〈震級〉和其他類似招式仍然可以命中使用者。",
		"desc": "使用者在地上挖出一條通向地下的通道，並從地底冒出攻擊。"
	},
	{
		"name": "直衝鑽", "alias": "ドリルライナー|Drill Run",
		"power": "3",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|foe", "effect|l|crit"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "容易擊中要害。",
		"desc": "使用者旋轉身體，如同鑽頭一樣撞向敵人。這種攻擊可以輕鬆而精確地穿透牆壁和地板。"
	},
	{
		"name": "大地之力", "alias": "だいちのちから|Earth Power",
		"power": "3",
		"category": "special",
		"type": "Ground",
		"tags": ["target|l|foe", "dice|l|1", "frame|target|特防|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "骰 1 顆機率骰以降低敵人的特防。",
		"desc": "使用者送出一股從地底傳導的震動波，並在地面上的目標腳下迸發出來。仿佛地面就是按照寶可夢的意願而塑造的一樣。"
	},
	{
		"name": "地震", "alias": "じしん|Earthquake",
		"power": "4",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|area"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 4",
		"effect": "範圍攻擊。遠程攻擊。",
		"desc": "寶可夢集中力量震動地面，周圍的所有人都會像布娃娃一樣搖搖晃晃。"
	},
	{
		"name": "地裂", "alias": "じわれ|Fissure",
		"power": "-",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|foe", "frame|accuracy||down|5"],
		"accuracy": "力量 + 鬥毆",
		"damage": "-",
		"effect": "直接造成等同於目標剩餘HP的傷害，外加 1 點致命傷害。",
		"desc": "使用者用恐怖的力量震裂地面，如果敵人掉進裂縫中，可能需要派出一整個救援隊才能把牠救出來。"
	},
	{
		"name": "十萬馬力", "alias": "１０まんばりき|High Horsepower",
		"power": "3",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"desc": "寶可夢衝向牠的目標，毫不留情地踐踏對方。"
	},
	{
		"name": "大地神力", "alias": "グランドフォース|Land's Wrath",
		"power": "3",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|allfoe", "effect|l|lethal"],
		"accuracy": "力量 + 導引",
		"damage": "力量 + 3",
		"effect": "致命傷害。遠程攻擊。以所有範圍內的敵人為目標。",
		"desc": "視野內沒有攻擊者，大地卻自己震動起來。地層崩塌，地表塌陷吞噬它的受害者。廢墟之中，茂盛的大樹會在短時間之後長成。"
	},
	{
		"name": "震級", "alias": "マグニチュード|Magnitude",
		"power": "*",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|area"],
		"accuracy": "靈巧 + 導引",
		"damage": "力量 + 不定",
		"effect": "遠程攻擊。骰 1 顆骰子來決定這個招式的威力。",
		"desc": "使用者震動那裡的地面板塊。有些板塊會比其他板塊更容易鬆動。"
	},
	{
		"name": "泥巴炸彈", "alias": "どろばくだん|Mud Bomb",
		"power": "2",
		"category": "special",
		"type": "Ground",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "dice|l|3", "frame|target|命中|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "骰 3 顆機率骰以降低敵人的命中。",
		"desc": "寶可夢射出一顆由泥漿製成的球來攻擊目標，這些泥漿可能會濺到牠的眼睛上。"
	},
	{
		"name": "泥巴射擊", "alias": "マッドショット|Mud Shot",
		"power": "2",
		"category": "special",
		"type": "Ground",
		"tags": ["target|l|foe", "frame|target|靈巧|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "降低敵人的靈巧。",
		"desc": "寶可夢射出一道泥漿覆蓋目標的身體，妨礙牠的行動。"
	},
	{
		"name": "擲泥", "alias": "どろかけ|Mud-Slap",
		"power": "1",
		"category": "special",
		"type": "Ground",
		"tags": ["target|l|foe", "frame|target|命中|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 1",
		"effect": "降低敵人的命中。",
		"desc": "使用者往敵人的臉上投擲泥巴，使牠無法清楚看見。"
	},
	{
		"name": "玩泥巴", "alias": "どろあそび|Mud Sport",
		"power": "-",
		"category": "support",
		"type": "Ground",
		"tags": ["target|l|field"],
		"accuracy": "特殊 + 自然",
		"damage": "-",
		"effect": "在接下來 4 個戰鬥輪期間，電屬性攻擊的傷害骰池將無法獲得其招式威力的加值。",
		"desc": "使用者用泥巴覆蓋所有東西，降低場上電屬性攻擊的效果。"
	},
	{
		"name": "斷崖之劍", "alias": "だんがいのつるぎ|Precipice Blades",
		"power": "5",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|allfoe", "frame|accuracy||down|2", "effect|l|lethal"],
		"accuracy": "力量 + 導引",
		"damage": "力量 + 5",
		"effect": "致命傷害。遠程攻擊。",
		"desc": "使用者每走一步，就會有巨大的石刃從地面迸出。如果你不小心被命中，那幾乎不可能存活下來。"
	},
	{
		"name": "耕地", "alias": "たがやす|Rototiller",
		"power": "-",
		"category": "support",
		"type": "Ground",
		"tags": ["target|l|field", "frame|self|力量|up|1", "frame|self|特殊|up|1", "frame|target|力量|up|1", "frame|target|特殊|up|1"],
		"accuracy": "特殊 + 自然",
		"damage": "-",
		"effect": "提升戰場上所有草屬性寶可夢的力量和特殊。",
		"desc": "寶可夢四處挖掘，翻耕土壤，使其成為植物生長的理想場所。"
	},
	{
		"name": "潑沙", "alias": "すなかけ|Sand Attack",
		"power": "-",
		"category": "support",
		"type": "Ground",
		"tags": ["target|l|foe", "frame|target|命中|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "-",
		"effect": "敵人的所有命中判定將被扣除 1 顆成功骰。",
		"desc": "使用者撥起沙子射向敵人的眼睛。"
	},
	{
		"name": "流沙地獄", "alias": "すなじごく|Sand Tomb",
		"power": "2",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "effect|l|block"],
		"accuracy": "靈巧 + 導引",
		"damage": "力量 + 2",
		"effect": "遠程攻擊。阻擋。每個戰鬥輪結束時，骰 2 顆傷害骰以對敵人造成傷害。持續 4 輪。",
		"desc": "寶可夢在敵人周圍製造一個流沙坑，使牠無法逃脫。"
	},
	{
		"name": "集沙", "alias": "すなあつめ|Shore Up",
		"power": "-",
		"category": "support",
		"type": "Ground",
		"tags": ["target|l|self", "effect|l|heal"],
		"accuracy": "洞察 + 自然",
		"damage": "-",
		"effect": "基礎治癒。如果當前天氣狀態為沙暴，則這個招式變為 強效治癒。",
		"desc": "寶可夢在自己的身邊聚集沙子來重塑身體。"
	},
	{
		"name": "撒菱", "alias": "まきびし|Spikes",
		"power": "-",
		"category": "support",
		"type": "Ground",
		"tags": ["target|l|field"],
		"accuracy": "特殊 + 自然",
		"damage": "-",
		"effect": "入場危害。敵方寶可夢在換上場時會失去 1 點HP，這個效果不會疊加。飛行屬性或飄浮特性的寶可夢免疫這個效果。",
		"desc": "寶可夢往敵人周圍的場地射出尖銳的石子或荊棘，對任何出場的敵人造成損害。"
	},
	{
		"name": "跺腳", "alias": "じだんだ|Stomping Tantrum",
		"power": "3*",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3*",
		"effect": "如果使用者上次施展的招式的命中判定失敗，則這個招式的傷害骰池將額外增加 2 顆骰子。",
		"desc": "寶可夢四處撒氣，如果之前有什麼事情讓牠沮喪，牠的脾氣就會變得更糟。"
	},
	{
		"name": "千箭齊發", "alias": "サウザンアロー|Thousand Arrows",
		"power": "3",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|allfoe", "effect|l|lethal"],
		"accuracy": "力量 + 導引",
		"damage": "力量 + 3",
		"effect": "致命傷害。遠程攻擊。若成功，在這個場景期間，飛行屬性或飄浮特性的寶可夢將能夠被地面屬性的招式命中。",
		"desc": "不知從何處射出的密密麻麻的尖銳碎片，從空中朝著敵人們如雨般落下，就算是在空中的生物們在被擊中後也會摔落到地面上。找個掩護吧，這還挺疼的。"
	},
	{
		"name": "千波激盪", "alias": "サウザンウェーブ|Thousand Waves",
		"power": "3",
		"category": "physical",
		"type": "Ground",
		"tags": ["target|l|allfoe", "effect|l|block"],
		"accuracy": "特殊 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "阻擋。遠程攻擊。以所有範圍內的敵人為目標。",
		"desc": "固體地表化成了流沙，裂開的土壤逐步接近並拉住你的腿，就彷彿這片大地本身想要困住你一樣。視線內完全看不見攻擊者或任何的逃跑路線。"
	}
]);
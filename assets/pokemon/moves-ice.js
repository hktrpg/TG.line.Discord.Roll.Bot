var MoveList;
if(!MoveList) MoveList = [];

Array.prototype.push.apply(MoveList, [
	{
		"name": "極光束", "alias": "オーロラビーム|Aurora Beam",
		"power": "2",
		"category": "special",
		"type": "Ice",
		"tags": ["target|l|foe", "dice|l|1", "frame|target|力量|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "骰 1 顆機率骰以降低敵人的力量。",
		"desc": "寶可夢射出美麗的虹彩光束，可能會讓敵人為其大吃一驚。"
	},
	{
		"name": "極光幕", "alias": "オーロラベール|Aurora Veil",
		"power": "-",
		"category": "support",
		"type": "Ice",
		"tags": ["target|l|allally", "frame|self|受傷|number|-1"],
		"accuracy": "特殊 + 導引",
		"damage": "-",
		"effect": "如果當前天氣狀態不為冰雹，則這個招式將自動失敗。物理和特殊招式對使用者和所有隊友造成的傷害將減少 1 點，持續 4 輪，即使冰雹天氣提前結束也一樣。",
		"desc": "極光和冰雹以寶可夢和牠的隊友們為中心迴旋，將攻擊偏折開來。"
	},
	{
		"name": "雪崩", "alias": "ゆきなだれ|Avalanche",
		"power": "2*",
		"category": "physical",
		"type": "Ice",
		"tags": ["target|l|foe", "frame|priority||down|4"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2*",
		"effect": "後制招式。如果目標在這個戰鬥輪中已經對使用者造成過的傷害，則這個招式的傷害骰池額外增加 2 顆骰子。",
		"desc": "使用者的周圍會堆積著冰雪，如果有任何東西擾動到積雪，積雪就會像雪崩一樣落在攻擊者身上。"
	},
	{
		"name": "暴風雪", "alias": "ふぶき|Blizzard",
		"power": "5",
		"category": "special",
		"type": "Ice",
		"tags": ["target|l|allfoe", "frame|accuracy||down|2", "frame|frozen||number|d1"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 5",
		"effect": "以所有範圍內的敵人為目標。骰 1 顆機率骰以使目標陷入「冰凍」狀態。如果當前天氣狀態為大晴天，則這個招式的命中率降低效果將改為 -3；如果當前天氣狀態為冰雹，則無視這個招式的命中率降低效果，且這個招式將無法被閃避。",
		"desc": "使用者呼喚猛烈的暴風雪盤旋再敵人周遭，儘管這陣暴雪不會持續很長時間，但它異常兇猛。"
	},
	{
		"name": "冷凍乾燥", "alias": "フリーズドライ|Freeze-Dry",
		"power": "3",
		"category": "special",
		"type": "Ice",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "對水屬性寶可夢使用時將造成 2 點額外的傷害。",
		"desc": "使用者凍結環境中的所有水分，水屬性的寶可夢將會成受極大的痛苦。"
	},
	{
		"name": "冰凍伏特", "alias": "フリーズボルト|Freeze Shock",
		"power": "6",
		"category": "physical",
		"type": "Ice",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|charge", "effect|l|lethal", "frame|paralysis||number|d3"],
		"accuracy": "特殊 + 導引",
		"damage": "力量 + 6",
		"effect": "致命傷害。蓄力招式。遠程攻擊。骰 3 顆機率骰以使敵人陷入「麻痺」狀態。",
		"desc": "使用者彷彿變成了一大塊冰塊，接著牠伴隨著毀滅性的電流爆發將自己從冰塊中釋放出來。爆發四散的冰塊碎片和強烈閃電遍佈了整個戰場。"
	},
	{
		"name": "冰冰霜凍", "alias": "こちこちフロスト|Freezy Frost",
		"power": "3",
		"category": "special",
		"type": "Ice",
		"tags": ["target|l|foe", "frame|accuracy||down|1"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 3",
		"effect": "若成功，解除敵人身上所有特質和能力的增益或減益。如果這個招式的使用者處於最終進化階段，則這個招式自動失敗。",
		"desc": "使用者在跟敵人玩紅綠燈遊戲時觸碰對方，令人驚訝的是，當使用者喊出「停(Freeze!)」的時候，敵人就會被凍成冰塊。當牠們意識到這只是在玩耍時，冰塊就會溶解成霧。"
	},
	{
		"name": "冰息", "alias": "こおりのいぶき|Frost Breath",
		"power": "2",
		"category": "special",
		"type": "Ice",
		"tags": ["target|l|foe", "frame|accuracy||down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "這個招式永遠會擊中要害，並獲得相應的獎勵傷害骰。",
		"desc": "使用者向目標吹出令人脊椎發冷的氣息，突然變化的溫度能夠讓任何人屈服。"
	},
	{
		"name": "冰封世界", "alias": "こごえるせかい|Glaciate",
		"power": "2",
		"category": "special",
		"type": "Ice",
		"tags": ["target|l|allfoe", "effect|l|lethal", "frame|target|靈巧|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "致命傷害。以所有範圍內的敵人為目標。降低目標的靈巧。",
		"desc": "空氣冰冷到就連稍微動彈、看清周圍、以及呼吸都會受傷。你的當務之急應該是趕快逃跑，因為待在這裡的每分每秒都會讓你的生命慢慢枯竭。"
	},
	{
		"name": "冰雹", "alias": "あられ|Hail",
		"power": "-",
		"category": "support",
		"type": "Ice",
		"tags": ["target|l|field", "weather|l|hail"],
		"accuracy": "特殊 + 自然",
		"damage": "-",
		"effect": "讓天氣狀態在接下來 4 輪期間變為冰雹。",
		"desc": "使用者召喚出會在戰場上持續一陣子的冰雹。"
	},
	{
		"name": "黑霧", "alias": "くろいきり|Haze",
		"power": "-",
		"category": "support",
		"type": "Ice",
		"tags": ["target|l|field"],
		"accuracy": "特殊 + 自然",
		"damage": "-",
		"effect": "解除戰場上所有人的所有特質或能力的增益和減益。",
		"desc": "使用者釋放出黑霧擾亂所有參與戰鬥的寶可夢，這也能夠遮蔽所有裡頭的生物。"
	},
	{
		"name": "冰球", "alias": "アイスボール|Ice Ball",
		"power": "1*",
		"category": "physical",
		"type": "Ice",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|sact_5"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1*",
		"effect": "連續行動。若使用者前一次施展的〈冰球〉攻擊命中，則這一次攻擊的傷害骰池將額外增加 1 顆骰子。如果使用者在該戰鬥輪已經使用過了〈變圓〉，則每一擊的傷害骰池都再額外增加 1 顆骰子。",
		"desc": "使用者蜷縮成一個雪球，滾動撞向敵人。雪球會隨著滾動變得越來越大。"
	},
	{
		"name": "冰凍光束", "alias": "れいとうビーム|Ice Beam",
		"power": "3",
		"category": "special",
		"type": "Ice",
		"tags": ["target|l|foe", "frame|frozen||number|d1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "骰 1 顆機率骰以使敵人陷入「冰凍」狀態。",
		"desc": "使用者射出冰凍射線，大幅降低任何擊中事物的溫度。"
	},
	{
		"name": "極寒冷焰", "alias": "コールドフレア|Ice Burn",
		"power": "6",
		"category": "special",
		"type": "Ice",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|charge", "effect|l|lethal", "frame|burn1||number|d3"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 6",
		"effect": "致命傷害。蓄力招式。遠程攻擊。骰 3 顆機率骰以使敵人陷入「灼傷 1 級」狀態。",
		"desc": "使用者彷彿變成了一大塊冰塊，接著牠伴隨著毀滅性的爆炸將自己從冰塊中釋放出來。爆發四散的冰塊碎片和烈火遍佈了整個戰場。"
	},
	{
		"name": "冰凍牙", "alias": "こおりのキバ|Ice Fang",
		"power": "2",
		"category": "physical",
		"type": "Ice",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "frame|flinch||number|d2", "frame|frozen||number|d2"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "骰 2 顆機率骰以使敵人陷入「畏縮」狀態。骰 2 顆機率骰以使敵人陷入「冰凍」狀態。",
		"desc": "使用者咬住敵人並從口中釋放出霜凍冰冷的氣息。"
	},
	{
		"name": "冰錘", "alias": "アイスハンマー|Ice Hammer",
		"power": "4",
		"category": "physical",
		"type": "Ice",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "frame|self|靈巧|down|1"],
		"accuracy": "力量 + 鬥毆",
		"damage": "力量 + 4",
		"effect": "降低使用者的靈巧。",
		"desc": "寶可夢揮舞牠強狀冰冷的手臂給予敵人狠狠的一擊。"
	},
	{
		"name": "冰凍拳", "alias": "れいとうパンチ|Ice Punch",
		"power": "3",
		"category": "physical",
		"type": "Ice",
		"tags": ["target|l|foe", "effect|l|fist", "frame|frozen||number|d1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "拳頭類招式。骰 1 顆機率骰以使敵人陷入「冰凍」狀態。",
		"desc": "寶可夢揮出帶有寒氣的拳擊。使用者的手可以凍結任何它所接觸到的東西。"
	},
	{
		"name": "冰礫", "alias": "こおりのつぶて|Ice Shard",
		"power": "2",
		"category": "physical",
		"type": "Ice",
		"tags": ["target|l|foe", "frame|priority||up|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "先制招式。遠程攻擊。",
		"desc": "使用者瞬間凝結出冰塊並將向目標投擲而出。"
	},
	{
		"name": "冰柱墜擊", "alias": "つららおとし|Icicle Crash",
		"power": "3",
		"category": "physical",
		"type": "Ice",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "frame|flinch||number|d3"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "骰 3 顆機率骰以使敵人陷入「畏縮」狀態。",
		"desc": "使用者將巨大冰柱砸向對手，這股衝擊有時會使對手暈眩。"
	},
	{
		"name": "冰錐", "alias": "つららばり|Icicle Spear",
		"power": "1",
		"category": "physical",
		"type": "Ice",
		"tags": ["target|l|foe", "effect|l|sact_5"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1",
		"effect": "遠程攻擊。連續行動。",
		"desc": "使用者朝著目標發射一波小巧而尖銳的冰錐。"
	},
	{
		"name": "冰凍之風", "alias": "こごえるかぜ|Icy Wind",
		"power": "2",
		"category": "special",
		"type": "Ice",
		"tags": ["target|l|allfoe", "frame|target|靈巧|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "以所有範圍內的敵人為目標。降低目標的靈巧。",
		"desc": "這陣寒風是如此冰冷，把目標凍到骨子裡使其難以行動。"
	},
	{
		"name": "白霧", "alias": "しろいきり|Mist",
		"power": "-",
		"category": "support",
		"type": "Ice",
		"tags": ["target|l|allally"],
		"accuracy": "特殊 + 自然",
		"damage": "-",
		"effect": "在接下來 4 個戰鬥輪期間，使用者和隊友的特質和能力都不會被降低。",
		"desc": "使用者將自己及其盟友籠罩在具有神秘性質的寒冷白霧中，它能夠遮蔽所有附近的生物。"
	},
	{
		"name": "細雪", "alias": "こなゆき|Powder Snow",
		"power": "2",
		"category": "special",
		"type": "Ice",
		"tags": ["target|l|allfoe", "frame|frozen||number|d1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "以所有範圍內的敵人為目標。骰 1 顆機率骰以使敵人陷入「冰凍」狀態。",
		"desc": "使用者颳起滿是雪花的微風，將接觸到的一切都凍結。這些雪塵能夠輕易讓房間結冰。"
	},
	{
		"name": "絕對零度", "alias": "ぜったいれいど|Sheer Cold",
		"power": "-",
		"category": "special",
		"type": "Ice",
		"tags": ["target|l|foe", "frame|accuracy||down|5"],
		"accuracy": "特殊 + 導引",
		"damage": "-",
		"effect": "直接造成等同於目標剩餘HP的傷害，外加 1 點致命傷害。",
		"desc": "使用者從內而外凍結敵人，這個攻擊的受害者將會需要接受緊急的醫療救護。"
	}
]);
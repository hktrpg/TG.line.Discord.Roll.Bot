var MoveList;
if(!MoveList) MoveList = [];

Array.prototype.push.apply(MoveList, [
	{
		"name": "衝岩", "alias": "アクセルロック|Accelerock",
		"power": "2",
		"category": "physical",
		"type": "Rock",
		"tags": ["target|l|foe", "frame|priority||up|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "先制招式。",
		"desc": "寶可夢以高速衝刺，在撞擊時運用自己身上的岩石打擊敵人。"
	},
	{
		"name": "原始之力", "alias": "げんしのちから|Ancient Power",
		"power": "2",
		"category": "special",
		"type": "Rock",
		"tags": ["target|l|foe", "frame|self|力量|up|1", "frame|self|特殊|up|1", "frame|self|靈巧|up|1", "frame|self|防禦|up|1", "frame|self|特防|up|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "骰 1 顆機率骰以提升使用者的力量、特殊、靈巧、防禦、和特防。",
		"desc": "寶可夢呼喚來自遠古時代的能量來攻擊敵人，且可能會讓使用者的身體因此充盈著原初之力。"
	},
	{
		"name": "鑽石風暴", "alias": "ダイヤストーム|Diamond Storm",
		"power": "4",
		"category": "physical",
		"type": "Rock",
		"tags": ["target|l|allfoe", "dice|l|5", "frame|self|防禦|up|2"],
		"accuracy": "靈巧 + 導引",
		"damage": "力量 + 4",
		"effect": "遠程攻擊。骰 5 顆機率骰以提升使用者的防禦。",
		"desc": "寶可夢召喚出席捲整個戰場的鑽石風暴，這些鑽石同時能做為屏障為使用者提供掩護。"
	},
	{
		"name": "雙刃頭錘", "alias": "もろはのずつき|Head Smash",
		"power": "6",
		"category": "physical",
		"type": "Rock",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "effect|l|recoil"],
		"accuracy": "力量 + 鬥毆",
		"damage": "力量 + 6",
		"effect": "反作用力傷害。",
		"desc": "使用者將力量集中在頭上衝鋒以攻擊敵人，這個攻擊對雙方都會造成傷害。"
	},
	{
		"name": "力量寶石", "alias": "パワージェム|Power Gem",
		"power": "3",
		"category": "special",
		"type": "Rock",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"desc": "使用者從體內的寶石射出一道光束進行攻擊。"
	},
	{
		"name": "岩石爆擊", "alias": "ロックブラスト|Rock Blast",
		"power": "1",
		"category": "physical",
		"type": "Rock",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|sact_5"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1",
		"effect": "遠程攻擊。連續行動。",
		"desc": "寶可夢噴射出小巧石塊，會在接觸到敵人時爆破成碎片。"
	},
	{
		"name": "岩石打磨", "alias": "ロックカット|Rock Polish",
		"power": "-",
		"category": "support",
		"type": "Rock",
		"tags": ["target|l|self", "frame|self|靈巧|up|2"],
		"accuracy": "靈巧 + 導引",
		"damage": "-",
		"effect": "提升使用者的靈巧。",
		"desc": "使用者打磨自己岩石身軀上的粗糙表面，使其能更輕鬆快速地移動。"
	},
	{
		"name": "岩崩", "alias": "いわなだれ|Rock Slide",
		"power": "3",
		"category": "physical",
		"type": "Rock",
		"tags": ["target|l|allfoe", "frame|accuracy||down|1", "frame|flinch||number|d3"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "以所有範圍內的敵人為目標。骰 3 顆機率骰以使敵人陷入「畏縮」狀態。",
		"desc": "寶可夢製造出一波落石攻擊敵人，使牠們被壓在岩石堆下。"
	},
	{
		"name": "落石", "alias": "いわおとし|Rock Throw",
		"power": "2",
		"category": "physical",
		"type": "Rock",
		"tags": ["target|l|foe", "frame|accuracy||down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "力量 + 2",
		"effect": "遠程攻擊。",
		"desc": "使用者撿起岩石或石頭並丟向敵人。"
	},
	{
		"name": "岩石封鎖", "alias": "がんせきふうじ|Rock Tomb",
		"power": "2",
		"category": "physical",
		"type": "Rock",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "frame|target|靈巧|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "力量 + 2",
		"effect": "遠程攻擊。降低敵人的靈巧。",
		"desc": "寶可夢將使敵人埋進石頭和岩石中，使牠無法任意行動。"
	},
	{
		"name": "岩石炮", "alias": "がんせきほう|Rock Wrecker",
		"power": "6",
		"category": "physical",
		"type": "Rock",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|lethal", "effect|l|recharge"],
		"accuracy": "力量 + 導引",
		"damage": "力量 + 6",
		"effect": "遠程攻擊。必須重新充能。致命傷害。",
		"desc": "使用者射出如同砲彈一般，甚至能夠擊穿厚實牆壁的巨大石塊。然而，這個招式將會消耗使用者大量的能量。"
	},
	{
		"name": "滾動", "alias": "ころがる|Rollout",
		"power": "1*",
		"category": "physical",
		"type": "Rock",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|sact_5"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1*",
		"effect": "連續行動。若使用者前一次施展的〈滾動〉攻擊命中，則這一次攻擊的傷害骰池將額外增加 1 顆骰子。如果使用者在該戰鬥輪已經使用過了〈變圓〉，則每一擊的傷害骰池都再額外增加 1 顆骰子。",
		"desc": "使用者蜷縮成一個球，滾動撞向敵人，輾過路上所有東西。"
	},
	{
		"name": "沙暴", "alias": "すなあらし|Sandstorm",
		"power": "-",
		"category": "support",
		"type": "Rock",
		"tags": ["target|l|field", "weather|l|sand"],
		"accuracy": "特殊 + 自然",
		"damage": "-",
		"effect": "讓天氣狀態在接下來 4 輪期間變為沙暴。",
		"desc": "寶可夢颳起帶有無數粗糙沙粒的狂風。"
	},
	{
		"name": "擊落", "alias": "うちおとす|Smack Down",
		"power": "2",
		"category": "physical",
		"type": "Rock",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 導引",
		"damage": "力量 + 2",
		"effect": "遠程攻擊。使敵人不再免疫於地面屬性的攻擊。",
		"desc": "使用者扔出物體，通常是沉重的巨岩，來把敵人擊落在地上，讓牠在這之後無法再離開地表。"
	},
	{
		"name": "隱形岩", "alias": "ステルスロック|Stealth Rock",
		"power": "-",
		"category": "support",
		"type": "Rock",
		"tags": ["target|l|field"],
		"accuracy": "靈巧 + 隱匿",
		"damage": "-",
		"effect": "入場危害。敵方寶可夢在換上場時會失去 1 點HP，這個效果不會疊加。",
		"desc": "寶可夢把尖銳鋒利的岩石藏在敵方戰場上的各個角落。"
	},
	{
		"name": "尖石攻擊", "alias": "ストーンエッジ|Stone Edge",
		"power": "4",
		"category": "physical",
		"type": "Rock",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "effect|l|lethal", "effect|l|crit"],
		"accuracy": "力量 + 導引",
		"damage": "力量 + 4",
		"effect": "遠程攻擊。致命傷害。容易擊中要害。",
		"desc": "使用者將尖銳的岩石砸向敵人。岩石的速度和重量將會造成嚴重的傷害。"
	},
	{
		"name": "瀝青射擊", "alias": "タールショット|Tar Shot",
		"power": "-",
		"category": "support",
		"type": "Rock",
		"tags": ["target|l|foe", "frame|target|靈巧|down|1"],
		"accuracy": "特殊 + 導引",
		"damage": "-",
		"effect": "降低敵人的靈巧。直到該場景結束前，火屬性招式將對敵人造成效果絕佳的傷害。",
		"desc": "寶可夢向敵人射出大量黏稠的漆黑瀝青。那個不幸的敵人將因此難以行動且需要遠離火源，因為瀝青極度易燃。"
	},
	{
		"name": "廣域防守", "alias": "ワイドガード|Wide Guard",
		"power": "-",
		"category": "support",
		"type": "Rock",
		"tags": ["target|l|allally", "frame|priority||up|3", "effect|l|shield"],
		"accuracy": "活力 + 鬥毆",
		"damage": "-",
		"effect": "先制招式。護盾。傷害類招式對使用者和隊友造成的傷害減少 3 點。對使用者和隊友會造成固定傷害的招式的傷害將被降低為 0 點。",
		"desc": "寶可夢用牠的整個身軀當作掩護來保護牠的隊友抵禦來襲的攻擊。"
	}
]);
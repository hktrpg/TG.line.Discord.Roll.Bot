var MoveList;
if(!MoveList) MoveList = [];

Array.prototype.push.apply(MoveList, [
	{
		"name": "溶解液", "alias": "ようかいえき|Acid",
		"power": "2",
		"category": "special",
		"type": "Poison",
		"tags": ["target|l|allfoe", "dice|l|1", "frame|target|特防|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "以所有範圍內的敵人為目標。骰 1 顆機率骰以降低目標的特防。",
		"desc": "寶可夢將腐蝕性酸液潑向敵人，灼燒感可能會為其他攻擊製造出破綻。"
	},
	{
		"name": "溶化", "alias": "とける|Acid Armor",
		"power": "-",
		"category": "support",
		"type": "Poison",
		"tags": ["target|l|self", "frame|self|防禦|up|2"],
		"accuracy": "特殊 + 自然",
		"damage": "-",
		"effect": "提升使用者的防禦。",
		"desc": "酸液流過寶可夢的身體，將其轉變成液體一般的型態，這些酸液將能夠防止敵人對寶可夢進行全力攻擊。"
	},
	{
		"name": "酸液炸彈", "alias": "アシッドボム|Acid Spray",
		"power": "2",
		"category": "special",
		"type": "Poison",
		"tags": ["target|l|foe", "frame|target|特殊|down|2"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "降低敵人的特殊。",
		"desc": "使用者吐出腐蝕性物質，灼燒感使對方無法專注在攻擊上。"
	},
	{
		"name": "碉堡", "alias": "トーチカ|Baneful Bunker",
		"power": "-",
		"category": "support",
		"type": "Poison",
		"tags": ["target|l|self", "frame|priority||up|4", "effect|l|shield", "frame|poison||always"],
		"accuracy": "活力 + 自然",
		"damage": "-",
		"effect": "先制招式。護盾。若敵人對使用者使用了非遠程的物理招式攻擊，則敵人將因此陷入「中毒」狀態。敵人的傷害骰池將減少 3 顆骰子。",
		"desc": "使用者將自己封入堅硬、帶有毒刺的殼中。若毒刺螫中敵人的皮膚，傷口會受到感染。"
	},
	{
		"name": "打嗝", "alias": "ゲップ|Belch",
		"power": "5",
		"category": "special",
		"type": "Poison",
		"tags": ["target|l|foe", "frame|accuracy||down|1"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 5",
		"effect": "使用者必須在使用這個招式之前先吃點東西。",
		"desc": "使用者對目標打一個可怕的大嗝，空氣中瀰漫著的毒氣將造成嚴重的傷害。"
	},
	{
		"name": "清除之煙", "alias": "クリアスモッグ|Clear Smog",
		"power": "2",
		"category": "special",
		"type": "Poison",
		"tags": ["target|l|foe", "effect|l|neverfail"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "必中。重置敵人身上的所有特質增益或減益。",
		"desc": "使用者吸入所有氣體以清除一切的雜質，目標將受到傷害並感到些微頭暈。"
	},
	{
		"name": "盤蜷", "alias": "とぐろをまく|Coil",
		"power": "-",
		"category": "support",
		"type": "Poison",
		"tags": ["target|l|self", "frame|self|力量|up|1", "frame|self|防禦|up|1", "frame|self|命中|up|1"],
		"accuracy": "強壯 + 威嚇",
		"damage": "-",
		"effect": "提升使用者的力量、防禦、和命中。",
		"desc": "寶可夢蜷縮自己的身體，做出冷靜但凶狠的姿態準備好發動攻擊。"
	},
	{
		"name": "十字毒刃", "alias": "クロスポイズン|Cross Poison",
		"power": "3",
		"category": "physical",
		"type": "Poison",
		"tags": ["target|l|foe", "effect|l|crit", "frame|poison||number|d1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "容易擊中要害。骰 1 顆機率骰以使敵人陷入「中毒」狀態。",
		"desc": "寶可夢將毒素浸染自己的螯爪並凶暴地劈向敵人。"
	},
	{
		"name": "胃液", "alias": "いえき|Gastro Acid",
		"power": "-",
		"category": "support",
		"type": "Poison",
		"tags": ["target|l|foe"],
		"accuracy": "特殊 + 導引",
		"damage": "-",
		"effect": "無效任何敵人的特性會產生的效果。這個效果將持續直到該場景結束。",
		"desc": "使用者吐出自己一部分的胃液，這種酸液將阻止對手使用自己的特殊能力。"
	},
	{
		"name": "垃圾射擊", "alias": "ダストシュート|Gunk Shot",
		"power": "5",
		"category": "physical",
		"type": "Poison",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "frame|poison||number|d3"],
		"accuracy": "力量 + 鬥毆",
		"damage": "力量 + 5",
		"effect": "遠程攻擊。骰 3 顆機率骰以使敵人陷入「中毒」狀態。",
		"desc": "寶可夢自己製造出最具毒性的物質來射出一連串帶有腐蝕性的垃圾。光是聞到臭味就會讓人感到十分不舒服。"
	},
	{
		"name": "劇毒牙", "alias": "どくどくのキバ|Poison Fang",
		"power": "2",
		"category": "physical",
		"type": "Poison",
		"tags": ["target|l|foe", "frame|poison2||number|d5"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "骰 5 顆機率骰以使敵人陷入「劇毒」狀態。",
		"desc": "寶可夢咬向敵人並透過自己的毒牙直接注入毒液。在這之後，牠只需要等待毒液慢慢收拾敵人就好。"
	},
	{
		"name": "毒瓦斯", "alias": "どくガス|Poison Gas",
		"power": "-",
		"category": "support",
		"type": "Poison",
		"tags": ["target|l|allfoe", "frame|accuracy||down|1", "frame|poison||always"],
		"accuracy": "特殊 + 導引",
		"damage": "-",
		"effect": "以所有範圍內的敵人為目標。使目標陷入「中毒」狀態。",
		"desc": "寶可夢釋放出龐大的毒氣雲霧，任何吸入的人都會開始劇烈咳嗽並且需要立即尋求醫療協助。"
	},
	{
		"name": "毒擊", "alias": "どくづき|Poison Jab",
		"power": "3",
		"category": "physical",
		"type": "Poison",
		"tags": ["target|l|foe", "frame|poison||number|d3"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "骰 3 顆機率骰以使敵人陷入「中毒」狀態。",
		"desc": "寶可夢用螫刺或觸手插入對手並注入毒液。"
	},
	{
		"name": "毒粉", "alias": "どくのこな|Poison Powder",
		"power": "-",
		"category": "support",
		"type": "Poison",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "frame|poison||always"],
		"accuracy": "特殊 + 導引",
		"damage": "-",
		"effect": "使敵人陷入「中毒」狀態。",
		"desc": "使用者灑出一小片毒粉塵構成的雲霧，立即導致咳嗽和發燒。"
	},
	{
		"name": "毒針", "alias": "どくばり|Poison Sting",
		"power": "1",
		"category": "physical",
		"type": "Poison",
		"tags": ["target|l|foe", "frame|poison||number|d3"],
		"accuracy": "靈巧 + 導引",
		"damage": "力量 + 1",
		"effect": "遠程攻擊。骰 3 顆機率骰以使敵人陷入「中毒」狀態。",
		"desc": "使用者射出細小的針來向對手注入毒素。"
	},
	{
		"name": "毒尾", "alias": "ポイズンテール|Poison Tail",
		"power": "2",
		"category": "physical",
		"type": "Poison",
		"tags": ["target|l|foe", "effect|l|crit", "frame|poison||number|d1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "容易擊中要害。骰 1 顆機率骰以使敵人陷入「中毒」狀態。",
		"desc": "寶可夢的尾巴鋒利有如刀刃，牠劈砍進行攻擊，並能夠透過尾巴釋放毒素。"
	},
	{
		"name": "淨化", "alias": "じょうか|Purify",
		"power": "-",
		"category": "support",
		"type": "Poison",
		"tags": ["target|l|foe", "frame|heal|治療狀態|always", "frame|heal||heal|1"],
		"accuracy": "特殊 + 自然",
		"damage": "-",
		"effect": "治療目標的異常狀態，若你這麼做，使用者將可以回復 1 HP。",
		"desc": "寶可夢的身體披覆著能用來治療異常狀態的黏液，寶可夢也能將黏液當作某種營養來源。"
	},
	{
		"name": "污泥攻擊", "alias": "ヘドロこうげき|Sludge",
		"power": "2",
		"category": "special",
		"type": "Poison",
		"tags": ["target|l|foe", "frame|poison||number|d3"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "骰 3 顆機率骰以使敵人陷入「中毒」狀態。",
		"desc": "敵人身上覆蓋著噁心的污泥，散發出的惡臭和毒素會讓任何人感到噁心。"
	},
	{
		"name": "污泥炸彈", "alias": "ヘドロばくだん|Sludge Bomb",
		"power": "3",
		"category": "special",
		"type": "Poison",
		"tags": ["target|l|foe", "frame|poison||number|d3"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "骰 3 顆機率骰以使敵人陷入「中毒」狀態。",
		"desc": "使用者擲出一團有毒的污泥，在命中時爆炸並覆蓋在目標身上。"
	},
	{
		"name": "污泥波", "alias": "ヘドロウェーブ|Sludge Wave",
		"power": "3",
		"category": "special",
		"type": "Poison",
		"tags": ["target|l|area", "frame|poison||number|d1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "範圍攻擊。骰 1 顆機率骰以使目標陷入「中毒」狀態。",
		"desc": "寶可夢創造出一道巨大的泥漿浪潮吞沒浸泡周圍的一切，這味道可相當不好聞。"
	},
	{
		"name": "濁霧", "alias": "スモッグ|Smog",
		"power": "1",
		"category": "special",
		"type": "Poison",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "frame|poison||number|d4"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 1",
		"effect": "骰 4 顆機率骰以使敵人陷入「中毒」狀態。",
		"desc": "目標被一團噴出的骯髒氣體給攻擊。"
	},
	{
		"name": "劇毒", "alias": "どくどく|Toxic",
		"power": "-",
		"category": "support",
		"type": "Poison",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "frame|poison2||always"],
		"accuracy": "特殊 + 導引",
		"damage": "-",
		"effect": "使敵人陷入「劇毒」狀態。",
		"desc": "透過噁心的飲食與鍛鍊，使用者學會如何將自己的體液轉變成劇毒。"
	},
	{
		"name": "毒菱", "alias": "どくびし|Toxic Spikes",
		"power": "-",
		"category": "support",
		"type": "Poison",
		"tags": ["target|l|field", "frame|poison||always", "frame|poison2||number|d1"],
		"accuracy": "靈巧 + 隱匿",
		"damage": "-",
		"effect": "入場危害。敵方寶可夢在換上場時會陷入「中毒」狀態，骰 1 顆機率骰以改使敵人陷入「劇毒」狀態。",
		"desc": ""
	},
	{
		"name": "毒絲", "alias": "どくのいと|Toxic Thread",
		"power": "-",
		"category": "support",
		"type": "Poison",
		"tags": ["target|l|foe", "frame|target|靈巧|down|1", "frame|poison||always"],
		"accuracy": "靈巧 + 導引",
		"damage": "-",
		"effect": "降低敵人的靈巧。使敵人陷入「中毒」狀態。",
		"desc": "使用者射出黏稠的絲線纏繞敵人，絲線上含有的毒素會讓碰到的敵人中毒。"
	},
	{
		"name": "毒液陷阱", "alias": "ベノムトラップ|Venom Drench",
		"power": "-",
		"category": "support",
		"type": "Poison",
		"tags": ["target|l|allfoe", "frame|target|力量|down|1", "frame|target|特殊|down|1", "frame|target|靈巧|down|1"],
		"accuracy": "特殊 + 導引",
		"damage": "-",
		"effect": "以所有範圍內的敵人為目標。如果目標已經處於「中毒」或「劇毒」狀態，則降低目標的力量、特殊、和靈巧。",
		"desc": "敵人被詭異的毒液給浸染，這種毒液會以牠們已經虛弱無力的免疫系統為目標。"
	},
	{
		"name": "毒液衝擊", "alias": "ベノムショック|Venoshock",
		"power": "2*",
		"category": "special",
		"type": "Poison",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2*",
		"effect": "如果敵人已經處於「中毒」或「劇毒」狀態，則這個招式的傷害骰池額外增加 2 顆骰子。",
		"desc": "寶可夢射出一種特殊的毒液，如果敵人已經因為毒素而虛弱，則這種毒液將會產生更加劇烈的反應。"
	}
]);
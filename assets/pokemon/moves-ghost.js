var MoveList;
if(!MoveList) MoveList = [];

Array.prototype.push.apply(MoveList, [
	{
		"name": "驚嚇", "alias": "おどろかす|Astonish",
		"power": "1",
		"category": "physical",
		"type": "Ghost",
		"tags": ["target|l|foe", "frame|flinch||number|d3"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1",
		"effect": "骰 3 顆機率骰以使敵人陷入「畏縮」狀態。",
		"desc": "使用者偷偷靠近並嚇唬敵人。"
	},
	{
		"name": "奇異之光", "alias": "あやしいひかり|Confuse Ray",
		"power": "-",
		"category": "support",
		"type": "Ghost",
		"tags": ["target|l|foe", "frame|confuse||always"],
		"accuracy": "洞察 + 自然",
		"damage": "-",
		"effect": "使敵人陷入「混亂」狀態。",
		"desc": "使用者發出一道詭異的閃光，使目標失調並感到混亂。"
	},
	{
		"name": "詛咒", "alias": "のろい|Curse",
		"power": "-",
		"category": "support",
		"type": "Ghost",
		"tags": ["target|l|foe"],
		"accuracy": "意志 + 導引",
		"damage": "-",
		"effect": "骰等同於使用者HP一半的傷害骰以對自己造成傷害，無視防禦。直到這個詛咒解除，目標的所有擲骰中都將被扣除 1 顆成功骰。",
		"desc": "使用者念誦邪惡的咒語，這個詛咒只能透過靈媒或神性存在的干預來解除。"
	},
	{
		"name": "詛咒（非幽靈系的使用者）", "alias": "のろい|Curse",
		"power": "-",
		"category": "support",
		"type": "Ghost",
		"tags": ["target|l|self", "frame|self|力量|up|1", "frame|self|防禦|up|1", "frame|self|靈巧|down|1"],
		"accuracy": "意志 + 導引",
		"damage": "-",
		"effect": "提升使用者的力量和防禦，降低使用者的靈巧。這個效果只會作用於非幽靈屬性的寶可夢身上。",
		"desc": "寶可夢準備透過念誦一些不適合孩子知道的咒語來施加或承受更多傷害。"
	},
	{
		"name": "同命", "alias": "みちづれ|Destiny Bond",
		"power": "-",
		"category": "support",
		"type": "Ghost",
		"tags": ["target|l|self"],
		"accuracy": "意志 + 導引",
		"damage": "-",
		"effect": "如果使用者在這個戰鬥輪期間因為戰鬥傷害而陷入瀕死狀態，則對牠造成傷害的寶可夢也將在同時陷入瀕死狀態。",
		"desc": "寶可夢與任何對自己造成傷害的對象建立起神秘的紐帶連結。無論使用者出了什麼事，對方也都將受到同樣的遭遇。"
	},
	{
		"name": "怨念", "alias": "おんねん|Grudge",
		"power": "-",
		"category": "support",
		"type": "Ghost",
		"tags": ["target|l|foe"],
		"accuracy": "意志 + 導引",
		"damage": "-",
		"effect": "使用者陷入瀕死狀態。敵人將失去所有的意志點，並失去任何因為消耗意志點而獲得的效果。敵人若想要繼續戰鬥，則必須在每輪結束時使用牠們的忠誠度來擲骰判定。每一輪所需的成功骰數將再增加 1 顆。",
		"desc": "使用者對敵人留下了深深的怨恨，這將讓目標變得不願意戰鬥。只有在更重要的事物遭受風險時，牠們才可能會願意繼續戰鬥。"
	},
	{
		"name": "禍不單行", "alias": "たたりめ|Hex",
		"power": "2*",
		"category": "special",
		"type": "Ghost",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2*",
		"effect": "如果目標正處於任何異常狀態中，則這個招式的傷害骰池將額外增加 2 顆骰子。",
		"desc": "使用者對目標施加糟糕透頂的厄運詛咒，在目標虛弱時將發揮更強的威力。"
	},
	{
		"name": "舌舔", "alias": "したでなめる|Lick",
		"power": "1",
		"category": "physical",
		"type": "Ghost",
		"tags": ["target|l|foe", "frame|paralysis||number|d3"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1",
		"effect": "骰 3 顆機率骰以使敵人陷入「麻痺」狀態。",
		"desc": "使用者舔了舔敵人。牠的唾液能使大多數生物的身體麻木。"
	},
	{
		"name": "暗影之光", "alias": "シャドーレイ|Moongeist Beam",
		"power": "4",
		"category": "special",
		"type": "Ghost",
		"tags": ["target|l|foe", "effect|l|lethal"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 4",
		"effect": "致命傷害。如果敵方有任何能夠避免這個招式造成傷害的效果（例如寶可夢屬性、特性、護盾招式、天氣狀態、或屏障等），無視該效果。這個招式不能被對抗。",
		"desc": "月亮映照的寒光灑在目標身上，雖然這不會造成物理上的傷害，但那些直視光線的人將會直接崩潰。"
	},
	{
		"name": "黑夜魔影", "alias": "ナイトヘッド|Night Shade",
		"power": "*",
		"category": "special",
		"type": "Ghost",
		"tags": ["target|l|foe"],
		"accuracy": "洞察 + 導引",
		"damage": "不定",
		"effect": "根據使用者的階級決定這個招式的傷害骰池：新手 1 顆、初學者 2 顆、業餘者 3 顆、菁英 4 顆、專家為 5 顆。這個招式無視敵人的防禦。",
		"desc": "使用者將影子變化成恐怖的幻影來折磨目標。"
	},
	{
		"name": "惡夢", "alias": "あくむ|Nightmare",
		"power": "-",
		"category": "support",
		"type": "Ghost",
		"tags": ["target|l|foe", "frame|target|傷害|number|1"],
		"accuracy": "意志 + 導引",
		"damage": "-",
		"effect": "只有當目標處於「睡眠」狀態時才能夠發揮效果。對敵人直接造成 1 點傷害。如果目標仍然處於「睡眠」狀態，則接下來每個戰鬥輪開始時都會再次對目標直接造成 1 點傷害。",
		"desc": "使用者進入目標的夢境中並折磨對方。"
	},
	{
		"name": "奇異之風", "alias": "あやしいかぜ|Ominous Wind",
		"power": "2",
		"category": "special",
		"type": "Ghost",
		"tags": ["target|l|foe", "frame|self|力量|up|1", "frame|self|特殊|up|1", "frame|self|靈巧|up|1", "frame|self|防禦|up|1", "frame|self|特防|up|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "骰 1 顆機率骰以提升使用者的力量、特殊、靈巧、防禦、和特防。",
		"desc": "寶可夢颳起一陣令人起雞皮疙瘩，令人生厭的陰風，可能會讓使用者湧起一股邪惡的意念。"
	},
	{
		"name": "潛靈奇襲", "alias": "ゴーストダイブ|Phantom Force",
		"power": "3",
		"category": "physical",
		"type": "Ghost",
		"tags": ["target|l|foe", "effect|l|charge"],
		"accuracy": "力量 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "蓄力招式。當這個招式在蓄力時，使用者將不會受到任何其他招式的影響。如果目標使用了護盾招式，則該護盾將被摧毀且不會發揮任何效果。",
		"desc": "寶可夢消失並潛入一個黑暗的異次元，以穿透哪怕是最堅不可摧的防禦。牠可能會在牠的下個行動中再次現身。"
	},
	{
		"name": "暗影球", "alias": "シャドーボール|Shadow Ball",
		"power": "3",
		"category": "special",
		"type": "Ghost",
		"tags": ["target|l|foe", "dice|l|1", "frame|target|特防|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "骰 1 顆機率骰以降低敵人的特防。",
		"desc": "寶可夢投射出一個由陰影和暗物質組成的球體來攻擊敵人。"
	},
	{
		"name": "暗影之骨", "alias": "シャドーボーン|Shadow Bone",
		"power": "3",
		"category": "physical",
		"type": "Ghost",
		"tags": ["target|l|foe", "dice|l|2", "frame|target|防禦|down|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "骰 2 顆機率骰以降低敵人的防禦。",
		"desc": "這隻寶可夢當作武器的骨頭上寄宿著一個靈魂，這個靈魂可能會附在受害者身上，為其主人創造攻擊的機會。"
	},
	{
		"name": "暗影爪", "alias": "シャドークロー|Shadow Claw",
		"power": "3",
		"category": "physical",
		"type": "Ghost",
		"tags": ["target|l|foe", "effect|l|crit"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "容易擊中要害。",
		"desc": "爪子變為半虛體化，並能夠短暫地穿透盔甲、獸皮、皮膚和物體，讓這一擊可以攻擊目標身上的任何弱點。"
	},
	{
		"name": "暗影潛襲", "alias": "シャドーダイブ|Shadow Force",
		"power": "5",
		"category": "physical",
		"type": "Ghost",
		"tags": ["target|l|foe", "effect|l|lethal", "effect|l|charge"],
		"accuracy": "力量 + 鬥毆",
		"damage": "力量 + 5",
		"effect": "致命傷害。蓄力招式。當這個招式在蓄力時，使用者將不會受到任何其他招式的影響。如果目標使用了護盾招式，則該護盾將被摧毀且不會發揮任何效果。這個招式造成的傷害在 24 小時內都無法被治癒。",
		"desc": "寶可夢消失並潛入一個黑暗的異次元並尋找機會攻擊牠的敵人。這一擊傷害的不是目標的身體，而是靈魂。"
	},
	{
		"name": "暗影拳", "alias": "シャドーパンチ|Shadow Punch",
		"power": "2",
		"category": "physical",
		"type": "Ghost",
		"tags": ["target|l|foe", "effect|l|fist", "effect|l|neverfail"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "拳頭類招式。必中。",
		"desc": "寶可夢透過自己的影子揮出一拳。拳擊會從敵人的影子中冒出來，就像傳送門一樣。"
	},
	{
		"name": "影子偷襲", "alias": "かげうち|Shadow Sneak",
		"power": "2",
		"category": "physical",
		"type": "Ghost",
		"tags": ["target|l|foe", "frame|priority||up|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "先制招式。",
		"desc": "使用者潛入黑暗之中並從目標的影子躍出襲擊。寶可夢可以在影子中自由移動，仿佛牠是沒有實體的一樣。"
	},
	{
		"name": "暗影偷盜", "alias": "シャドースチール|Spectral Thief",
		"power": "3",
		"category": "physical",
		"type": "Ghost",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "若成功，則在使用者造成傷害<b>之前</b>，偷取目標身上所有的特質增益。目標身上的特質減益會維持原樣。",
		"desc": "透過影子，使用者潛行到目標身邊，竊取其生命力並消耗它，只把悲傷與失落留給牠的受害者。"
	},
	{
		"name": "縫影", "alias": "かげぬい|Spirit Shackle",
		"power": "3",
		"category": "physical",
		"type": "Ghost",
		"tags": ["target|l|foe", "effect|l|block"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "阻擋。",
		"desc": "在攻擊時，使用者悄悄將敵人的影子給綁在地上，限制其移動，使其無法逃脫。"
	},
	{
		"name": "怨恨", "alias": "うらみ|Spite",
		"power": "-",
		"category": "support",
		"type": "Ghost",
		"tags": ["target|l|foe"],
		"accuracy": "意志 + 威嚇",
		"damage": "-",
		"effect": "將敵人的意志減少到剩下 1 點。消除任何目標因消耗意志點而獲得的效果。",
		"desc": "目標將因為感受到的強烈恐懼感而被壓倒。"
	},
	{
		"name": "萬聖夜", "alias": "ハロウィン|Trick-or-Treat",
		"power": "-",
		"category": "support",
		"type": "Ghost",
		"tags": ["target|l|foe"],
		"accuracy": "意志 + 誘惑",
		"damage": "-",
		"effect": "使目標的屬性追加幽靈屬性（例如：喵喵的屬性將變為「一般/幽靈」；噴火龍的屬性將變為「火/飛行/幽靈」）。如果該寶可夢已經擁有第三個屬性，則將該屬性取代為幽靈屬性。",
		"desc": "寶可夢邀請目標加入萬聖夜。目標將穿上一件沒有靈媒的協助就無法脫下的幽靈裝。"
	},
	{
		"name": "靈騷", "alias": "ポルターガイスト|Poltergeist",
		"power": "?",
		"category": "physical",
		"type": "Ghost",
		"tags": ["target|l|foe"],
		"accuracy": "? + ?",
		"damage": "?",
		"effect": "此招式尚未被列入規則中。",
		"desc": ""
	}
]);
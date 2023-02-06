var MoveList;
if(!MoveList) MoveList = [];

Array.prototype.push.apply(MoveList, [
	{
		"name": "攻擊指令", "alias": "こうげきしれい|Attack Order",
		"power": "3",
		"category": "physical",
		"type": "Bug",
		"tags": ["target|l|foe", "effect|l|crit"],
		"accuracy": "強壯 + 自然",
		"damage": "力量 + 3",
		"effect": "容易擊中要害。遠程攻擊。",
		"desc": "使用者召集她的蜂群並下令來對付你。不管你跑哪兒，牠們都會包圍你。希望你不會對蜜蜂過敏。"
	},
	{
		"name": "蟲咬", "alias": "Bug Bite|むしくい",
		"power": "2",
		"category": "physical",
		"type": "Bug",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "如果目標寶可夢持有樹果，使用者會吃掉它並得到樹果的效果。",
		"desc": "寶可夢囓咬牠的敵人，一旦發現了什麼好吃的就會立刻吃掉。它可能會嘗試吃掉任何東西。"
	},
	{
		"name": "蟲鳴", "alias": "むしのさざめき|Bug Buzz",
		"power": "3",
		"category": "special",
		"type": "Bug",
		"tags": ["target|l|foe", "effect|l|sound", "dice|l|1", "frame|target|特防|down|1"],
		"accuracy": "特殊 + 表演",
		"damage": "特殊 + 2",
		"effect": "聲音類招式。骰 1 顆機率骰以降低敵人的特防。",
		"desc": "寶可夢使用牠的翅膀或其他身體部分來製造出能傷害並影響目標的聲波。"
	},
	{
		"name": "防禦指令", "alias": "ぼうぎょしれい|Defend Order",
		"power": "-",
		"category": "support",
		"type": "Bug",
		"tags": ["target|l|self", "frame|self|防禦|up|1", "frame|self|特防|up|1"],
		"accuracy": "強壯 + 自然",
		"damage": "-",
		"effect": "使用者提升自己的防禦和特防。",
		"desc": "一大群飛蟲環繞在使用者身邊，為這隻寶可夢創造出一個屏障以抵禦傷害。"
	},
	{
		"name": "致命針刺", "alias": "とどめばり|Fell Stinger",
		"power": "1",
		"category": "physical",
		"type": "Bug",
		"tags": ["target|l|foe", "frame|self|力量|up|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1",
		"effect": "如果敵人因為這次攻擊的傷害而陷入瀕死狀態，則提高使用者的力量。",
		"desc": "寶可夢刺擊目標，如果敵人虛弱到無法移動，牠將吸取敵人一部分的力量。"
	},
	{
		"name": "迎頭一擊", "alias": "であいがしら|First Impression",
		"power": "3",
		"category": "physical",
		"type": "Bug",
		"tags": ["target|l|foe", "frame|priority|優先度|up|2"],
		"accuracy": "力量 + 威嚇",
		"damage": "力量 + 3",
		"effect": "先制招式。這個招式只在該寶可夢進入戰鬥後的第一輪有效。從第二輪開始，這個招式自動失敗。",
		"desc": "寶可夢戲劇性地進入戰鬥場地，使牠的敵人驚訝於牠真正的對手究竟是誰。"
	},
	{
		"name": "連斬", "alias": "れんぞくぎり|Fury Cutter",
		"power": "1",
		"category": "physical",
		"type": "Bug",
		"tags": ["target|l|foe", "effect|l|sact_5"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1",
		"effect": "連續行動。",
		"desc": "寶可夢使用牠的爪子或鐮肢盡可能地做出多次斬擊。"
	},
	{
		"name": "回復指令", "alias": "かいふくしれい|Heal Order",
		"power": "-",
		"category": "support",
		"type": "Bug",
		"tags": ["target|l|self", "effect|l|heal"],
		"accuracy": "強壯 + 自然",
		"damage": "-",
		"effect": "基礎治癒。",
		"desc": "寶可夢命令牠的蜂群為牠帶來一些治癒蜂蜜。"
	},
	{
		"name": "死纏爛打", "alias": "まとわりつく|Infestation",
		"power": "1",
		"category": "special",
		"type": "Bug",
		"tags": ["target|l|foe", "effect|l|block"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 1",
		"effect": "阻擋。每個戰鬥輪結束時，骰 2 顆傷害骰以對敵人造成傷害。持續 4 輪。",
		"desc": "寶可夢召喚大群蟲子來阻止敵人逃跑。有時蟲群能夠傷害到敵人。這個呼喚能擴及百碼之遠。"
	},
	{
		"name": "吸血", "alias": "きゅうけつ|Leech Life",
		"power": "3",
		"category": "physical",
		"type": "Bug",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "使用者回復等同於造成傷害一半的HP（尾數捨去）。",
		"desc": "使用者攻擊敵人的弱點並吸取牠的生命力。"
	},
	{
		"name": "猛撲", "alias": "とびかかる|Lunge",
		"power": "3",
		"category": "physical",
		"type": "Bug",
		"tags": ["target|l|foe", "frame|target|力量|down|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "降低敵人的力量。",
		"desc": "使用者全力向敵人衝鋒，不僅將對方撞倒，還能用牠的許多肢體束縛敵人"
	},
	{
		"name": "超級角擊", "alias": "メガホーン|Megahorn",
		"power": "5",
		"category": "physical",
		"type": "Bug",
		"tags": ["target|l|foe", "frame|accuracy|命中|down|2", "effect|l|lethal"],
		"accuracy": "力量 + 鬥毆",
		"damage": "力量 + 5",
		"effect": "致命傷害。",
		"desc": "寶可夢用牠強壯的角來穿刺敵人並且造成巨量傷害。"
	},
	{
		"name": "飛彈針", "alias": "ミサイルばり|Pin Missile",
		"power": "1",
		"category": "physical",
		"type": "Bug",
		"tags": ["target|l|foe", "effect|l|sact_5"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1",
		"effect": "遠程攻擊，連續行動。",
		"desc": "寶可夢用下雨般密集的螫針或棘刺像針一般貫穿敵人。"
	},
	{
		"name": "花粉團", "alias": "かふんだんご|Pollen Puff",
		"power": "3*",
		"category": "special",
		"type": "Bug",
		"tags": ["target|l|foe", "target|l|ally", "frame|heal|治療|heal|1"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 3",
		"effect": "*若對隊友使用這個招式，則改為回復 1 點HP，而非造成傷害。",
		"desc": "寶可夢製造出一團花粉並丟到敵人臉上炸開，使對方陷入可怕的過敏反應。當吃下這團花粉時會發現它又甜又有營養。"
	},
	{
		"name": "粉塵", "alias": "ふんじん|Powder",
		"power": "-",
		"category": "support",
		"type": "Bug",
		"tags": ["target|l|foe"],
		"accuracy": "洞察 + 自然",
		"damage": "-",
		"effect": "下一個命中該目標的火屬性招式，其傷害將會增加 3 顆傷害骰。",
		"desc": "敵人被易燃的粉塵覆蓋全身，一小搓火源就會將其點燃並引發爆炸。"
	},
	{
		"name": "蝶舞", "alias": "ちょうのまい|Quiver Dance",
		"power": "-",
		"category": "support",
		"type": "Bug",
		"tags": ["target|l|self", "frame|self|靈巧|up|1", "frame|self|特殊|up|1", "frame|self|特防|up|1"],
		"accuracy": "美麗 + 表演",
		"damage": "-",
		"effect": "提升使用者的靈巧、特殊、和特防。",
		"desc": "神秘而優美的舞蹈提升了寶可夢的敏捷和專注。"
	},
	{
		"name": "憤怒粉", "alias": "いかりのこな|Rage Powder",
		"power": "-",
		"category": "support",
		"type": "Bug",
		"tags": ["target|l|self", "frame|priority|優先度|up|2"],
		"accuracy": "洞察 + 威嚇",
		"damage": "-",
		"effect": "在這個戰鬥輪期間，所有敵人使用的傷害招式都必須以使用者為目標。",
		"desc": "寶可夢釋放一種刺激性粉塵來惹惱並激怒敵人進行攻擊。"
	},
	{
		"name": "信號光束", "alias": "シグナルビーム|Signal Beam",
		"power": "3",
		"category": "special",
		"type": "Bug",
		"tags": ["target|l|foe", "frame|confuse|混亂|number|d1"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 3",
		"effect": "骰 1 顆機率骰以使敵人陷入「混亂」狀態。",
		"desc": "使用者發出一道強光來傷害敵人，並可能使敵人像飛蛾一樣目眩。"
	},
	{
		"name": "銀色旋風", "alias": "ぎんいろのかぜ|Silver Wind",
		"power": "2",
		"category": "special",
		"type": "Bug",
		"tags": ["target|l|foe", "frame|self|力量|up|1", "frame|self|靈巧|up|1", "frame|self|特殊|up|1", "frame|self|防禦|up|1", "frame|self|特防|up|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "骰 1 顆機率骰以提升使用者的力量、靈巧、特殊、防禦、和特防。",
		"desc": "寶可夢吹出一陣美麗的銀色旋風來傷害敵人，這場表演也許會大大激發使用者的自信。"
	},
	{
		"name": "蛛網", "alias": "クモのす|Spider Web",
		"power": "-",
		"category": "support",
		"type": "Bug",
		"tags": ["target|l|field", "effect|l|block"],
		"accuracy": "洞察 + 隱匿",
		"damage": "-",
		"effect": "阻擋。",
		"desc": "使用者悄悄地在場地上釋放了一面蛛網。所有的敵人都將被困住。"
	},
	{
		"name": "瘋狂滾壓", "alias": "ハードローラー|Steamroller",
		"power": "2",
		"category": "physical",
		"type": "Bug",
		"tags": ["target|l|foe", "frame|flinch|畏縮|number|d3"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "骰 3 顆機率骰以使敵人陷入「畏縮」狀態。",
		"desc": "使用者蜷起身體並以全速滾壓敵人。這可能使目標被碾在地上。"
	},
	{
		"name": "黏黏網", "alias": "ねばねばネット|Sticky Web",
		"power": "-",
		"category": "support",
		"type": "Bug",
		"tags": ["target|l|field", "frame|target|靈巧|down|1"],
		"accuracy": "洞察 + 自然",
		"damage": "-",
		"effect": "入場危害。敵方寶可夢在進入戰場時會降低靈巧。具有漂浮特性或飛行屬性的寶可夢免疫這個效果。",
		"desc": "寶可夢快速地用黏性蛛網覆蓋整個場地，新進場的敵人將會難以輕易動彈。"
	},
	{
		"name": "吐絲", "alias": "いとをはく|String Shot",
		"power": "-",
		"category": "support",
		"type": "Bug",
		"tags": ["target|l|foe", "frame|target|靈巧|down|1"],
		"accuracy": "洞察 + 自然",
		"damage": "-",
		"effect": "降低目標的靈巧。",
		"desc": "使用者吐出絲線纏繞並限制敵人的移動。"
	},
	{
		"name": "蟲之抵抗", "alias": "むしのていこう|Struggle Bug",
		"power": "1",
		"category": "physical",
		"type": "Bug",
		"tags": ["target|l|foe", "frame|target|特殊|down|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1",
		"effect": "降低敵人的特殊。",
		"desc": "這隻寶可夢躺臥著與敵人掙扎搏鬥，分散敵人的注意力。"
	},
	{
		"name": "螢火", "alias": "ほたるび|Tail Glow",
		"power": "-",
		"category": "support",
		"type": "Bug",
		"tags": ["target|l|self", "frame|self|特殊|up|3"],
		"accuracy": "洞察 + 自然",
		"damage": "-",
		"effect": "提升使用者的特殊。",
		"desc": "使用者發出一道強光。這隻寶可夢會盯著牠的光亮並進入出神狀態。"
	},
	{
		"name": "雙針", "alias": "ダブルニードル|Twineedle",
		"power": "1",
		"category": "physical",
		"type": "Bug",
		"tags": ["target|l|foe", "effect|l|sact_2", "frame|poison|中毒|number|d2"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1",
		"effect": "雙重行動。遠程攻擊。每次命中時骰 2 顆機率骰以使敵人陷入「中毒」狀態。",
		"desc": "寶可夢用牠藏毒的棘刺、利爪、或螫針刺向敵人。"
	},
	{
		"name": "急速折返", "alias": "とんぼがえり|U-turn",
		"power": "3",
		"category": "physical",
		"type": "Bug",
		"tags": ["target|l|foe", "effect|l|switcher"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "替換招式。使用者在造成傷害之後被換下場，替換的寶可夢將在有所準備的狀況下上場，擲骰決定牠的先攻。",
		"desc": "使用者擊打敵人，然後快速撤退至安全區域，讓隊伍中的另一隻寶可夢頂替牠的位置。"
	},
	{
		"name": "十字剪", "alias": "シザークロス|X-Scissor",
		"power": "3",
		"category": "physical",
		"type": "Bug",
		"tags": ["target|l|foe"],
		"accuracy": "力量 + 鬥毆",
		"damage": "力量 + 3",
		"desc": "寶可夢用牠那像剪刀一般的鐮肢或利爪來剪斷敵人。"
	}
]);
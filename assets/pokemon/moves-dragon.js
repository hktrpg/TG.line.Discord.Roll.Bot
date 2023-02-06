var MoveList;
if(!MoveList) MoveList = [];

Array.prototype.push.apply(MoveList, [
	{
		"name": "廣域破壞", "alias": "ワイドブレイカー|Breaking Swipe",
		"power": "2",
		"category": "physical",
		"type": "Dragon",
		"tags": ["target|l|allfoe", "frame|target|力量|down|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "以所有範圍內的敵人為目標。降低目標的力量。",
		"desc": "寶可夢用牠的尾巴對敵人進行高強度的猛掃。隨著碎裂聲響起，敵人在這之後將只能艱難跛行。"
	},
	{
		"name": "鱗片噪音", "alias": "スケイルノイズ|Clanging Scales",
		"power": "4",
		"category": "special",
		"type": "Dragon",
		"tags": ["target|l|allfoe", "frame|self|防禦|down|1", "effect|l|sound"],
		"accuracy": "靈巧 + 表演",
		"damage": "特殊 + 4",
		"effect": "聲音類招式。以所有範圍內的敵人為目標。降低使用者的防禦。",
		"desc": "寶可夢震動牠盔甲般的鱗片並在區域內製造出刺耳的噪音。不過牠的一些鱗片也因此脫落，使一部份的身軀暴露了出來。"
	},
	{
		"name": "魂舞烈音爆", "alias": "ソウルビート|Clangorous Soul",
		"power": "-",
		"category": "support",
		"type": "Dragon",
		"tags": ["target|l|self", "frame|self|力量|up|1", "frame|self|特殊|up|1", "frame|self|靈巧|up|1", "frame|self|防禦|up|1", "frame|self|特防|up|1"],
		"accuracy": "強壯 + 表演",
		"damage": "-",
		"effect": "使用者對自己造成等同於他自己總HP一半的傷害（尾數捨去）。提升使用者的力量、特殊、靈巧、防禦、和特防。",
		"desc": "寶可夢擺動牠的鱗片，使之變得鋒利、脫落、並重新排列。這個過程雖然很疼，但寶可夢卻能因此更專注於戰鬥。"
	},
	{
		"name": "核心懲罰者", "alias": "コアパニッシャー|Core Enforcer",
		"power": "4",
		"category": "special",
		"type": "Dragon",
		"tags": ["target|l|foe"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 4",
		"effect": "若這個招式使用成功，且目標在這個戰鬥輪期間已經造成過傷害，則在這個場景期間消除敵人的特性（以下這些特性為例外：牽絆變身、絕對睡眠、畫皮、多屬性、群聚變形、AR系統、魚群、戰鬥切換、界限盾殼）",
		"desc": "基格爾德從牠的核心中射出一道足以裂解目標的光束，使其無法維持最基本的特性。"
	},
	{
		"name": "流星群", "alias": "龍星群|りゅうせいぐん|Draco Meteor",
		"power": "6",
		"category": "special",
		"type": "Dragon",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|lethal", "frame|self|特殊|down|2"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 6",
		"effect": "致命傷害。降低使用者的特殊。",
		"desc": "寶可夢從空中呼喚流星墜落以造成巨大的傷害。這個壯舉會大大浩劫使用者的體力。"
	},
	{
		"name": "龍息", "alias": "りゅうのいぶき|Dragon Breath",
		"power": "2",
		"category": "special",
		"type": "Dragon",
		"tags": ["target|l|foe", "frame|paralysis||number|d3"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "骰 3 顆機率骰以使敵人陷入「麻痺」狀態。",
		"desc": "使用者呼出一陣神秘的綠色吐息，任何接觸到龍息的傢伙的移動都將被阻礙。"
	},
	{
		"name": "龍爪", "alias": "ドラゴンクロー|Dragon Claw",
		"power": "3",
		"category": "physical",
		"type": "Dragon",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"desc": "寶可夢使用牠強狀的利爪猛烈撕扯對方。"
	},
	{
		"name": "龍之舞", "alias": "りゅうのまい|Dragon Dance",
		"power": "-",
		"category": "support",
		"type": "Dragon",
		"tags": ["target|l|self", "frame|self|力量|up|1", "frame|self|靈巧|up|1"],
		"accuracy": "強壯 + 表演",
		"damage": "-",
		"effect": "提升使用者的力量和靈巧。",
		"desc": "使用者跳起一種神秘且充滿活力的舞蹈，激發牠的戰鬥之魂與本能反應。"
	},
	{
		"name": "龍箭", "alias": "ドラゴンアロー|Dragon Darts",
		"power": "2",
		"category": "physical",
		"type": "Dragon",
		"tags": ["target|l|foe", "effect|l|sact_2"],
		"accuracy": "靈巧 + 導引",
		"damage": "力量 + 2",
		"effect": "遠程攻擊。雙重行動。",
		"desc": "這隻寶可夢的頭部同時也是養育牠族群初生寶可夢的巢穴，這些小傢伙有時會被當作導彈發射出去。"
	},
	{
		"name": "龍錘", "alias": "ドラゴンハンマー|Dragon Hammer",
		"power": "3",
		"category": "physical",
		"type": "Dragon",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"desc": "寶可夢像個錘子一樣擺動自己的身體並把敵人釘在龜裂的地面上。"
	},
	{
		"name": "龍之波動", "alias": "りゅうのはどう|Dragon Pulse",
		"power": "3",
		"category": "special",
		"type": "Dragon",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"desc": "使用者張開嘴並釋放一陣強大的能量波。"
	},
	{
		"name": "龍之怒", "alias": "りゅうのいかり|Dragon Rage",
		"power": "-",
		"category": "special",
		"type": "Dragon",
		"tags": ["target|l|foe", "frame|target|傷害|number|2"],
		"accuracy": "靈巧 + 導引",
		"damage": "-",
		"effect": "直接造成 2 點固定傷害。",
		"desc": "這陣雙色火焰總是在其接觸到的每件東西上留下相同的燃燒痕跡。"
	},
	{
		"name": "龍之俯衝", "alias": "ドラゴンダイブ|Dragon Rush",
		"power": "4",
		"category": "physical",
		"type": "Dragon",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "frame|flinch||number|d2"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 4",
		"effect": "骰 2 顆機率骰以使敵人陷入「畏縮」狀態。",
		"desc": "使用者疾馳向敵人衝鋒。這記打擊可能會讓目標喘不過氣。"
	},
	{
		"name": "龍尾", "alias": "ドラゴンテール|Dragon Tail",
		"power": "2",
		"category": "physical",
		"type": "Dragon",
		"tags": ["target|l|foe", "frame|priority||down|1", "frame|accuracy||down|1", "effect|l|switcher"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "後制招式。替換招式。目標被擊中後將被暈眩並打回牠訓練家的位置，強迫訓練家派出另一隻寶可夢來替換。若在野外使用，目標將因此被趕走。",
		"desc": "這記強力的尾擊足以將任何人打飛到 100 英尺遠！"
	},
	{
		"name": "二連劈", "alias": "ダブルチョップ|Dual Chop",
		"power": "2",
		"category": "physical",
		"type": "Dragon",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|sact_2"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "雙重行動。",
		"desc": "寶可夢施展兩記野蠻的劈斬來猛擊敵人。"
	},
	{
		"name": "極巨炮", "alias": "ダイマックスほう|Dynamax Cannon",
		"power": "4*",
		"category": "special",
		"type": "Dragon",
		"tags": ["target|l|foe", "effect|l|lethal"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 4*",
		"effect": "若敵人正處於極巨化狀態，則這個招式變為致命傷害，且傷害骰池額外增加 4 顆骰子。",
		"desc": "寶可夢射出一道強力的光束，如果對手正處於極巨化狀態，牠身上的所有能量就會凝聚並在目標身上爆炸。"
	},
	{
		"name": "無極光束", "alias": "ムゲンダイビーム|Eternabeam",
		"power": "7",
		"category": "special",
		"type": "Dragon",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|lethal", "effect|l|recharge"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 7",
		"effect": "必須重新充能。致命傷害。",
		"desc": "寶可夢向天空射出一道威力無比的光束，這道被釋放出的能量也許在數千年後仍能繼續穿梭於浩瀚宇宙中。"
	},
	{
		"name": "逆鱗", "alias": "げきりん|Outrage",
		"power": "5",
		"category": "physical",
		"type": "Dragon",
		"tags": ["target|l|rfoe", "effect|l|rampage"],
		"accuracy": "力量 + 鬥毆",
		"damage": "力量 + 5",
		"effect": "狂暴。以隨機敵人為目標。",
		"desc": "使用者喚醒牠身為龍的原始本能，並釋放出無法控制的憤怒，摧毀牠前方的一切。在那之後，寶可夢將會迷惑並陷入混亂。"
	},
	{
		"name": "時光咆哮", "alias": "ときのほうこう|Roar of Time",
		"power": "6",
		"category": "special",
		"type": "Dragon",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|lethal"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 6",
		"effect": "致命傷害﹒若成功，則目標直到下個行動輪前都無法採取任何行動。",
		"desc": "在令人畏懼的咆哮中，帝牙盧卡將時間的力量限制在一個區域內，可憐的目標將會被困在一個扭曲的時間中，並在幾秒鐘內變老。"
	},
	{
		"name": "亞空裂斬", "alias": "あくうせつだん|Spacial Rend",
		"power": "4",
		"category": "special",
		"type": "Dragon",
		"tags": ["target|l|foe", "effect|l|lethal", "effect|l|crit"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 4",
		"effect": "致命傷害。容易擊中要害。",
		"desc": "伴隨著龍爪綻放的閃光，帕路奇亞碎裂了敵人周圍的空間。那些倖存下來的也很少有能保持原來形狀的。"
	},
	{
		"name": "龍捲風", "alias": "たつまき|Twister",
		"power": "2",
		"category": "special",
		"type": "Dragon",
		"tags": ["target|l|allfoe", "frame|flinch||number|d2"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "骰 2 顆機率骰以使敵人陷入「畏縮」狀態。",
		"desc": "寶可夢颳出一陣環繞敵人的旋風。牠們直到從這可怕的龍捲風中脫身之前都無法行動。"
	}
]);
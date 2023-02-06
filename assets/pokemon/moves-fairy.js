var MoveList;
if(!MoveList) MoveList = [];

Array.prototype.push.apply(MoveList, [
	{
		"name": "芳香薄霧", "alias": "アロマミスト|Aromatic Mist",
		"power": "-",
		"category": "support",
		"type": "Fairy",
		"tags": ["target|l|ally", "frame|self|防禦|up|1", "frame|self|特防|up|1"],
		"accuracy": "洞察 + 自然",
		"damage": "-",
		"effect": "提升一名隊友的防禦和特防。",
		"desc": "寶可夢使一位同伴沐浴在能振奮精神的香氣中。"
	},
	{
		"name": "圓瞳", "alias": "つぶらなひとみ|Baby-Doll Eyes",
		"power": "-",
		"category": "support",
		"type": "Fairy",
		"tags": ["target|l|foe", "frame|priority|優先度|up|1", "frame|target|力量|down|1"],
		"accuracy": "可愛 + 誘惑",
		"damage": "-",
		"effect": "先制招式。降低敵人的力量。",
		"desc": "在戰鬥中的任何人採取行動前，使用者用牠最可愛的眼神注視著敵人。"
	},
	{
		"name": "撒嬌", "alias": "あまえる|Charm",
		"power": "-",
		"category": "support",
		"type": "Fairy",
		"tags": ["target|l|foe"],
		"accuracy": "可愛 + 誘惑",
		"damage": "-",
		"effect": "降低敵人的力量。",
		"desc": "寶可夢利用可愛與無害的態度使敵人降低了警惕與攻擊性。"
	},
	{
		"name": "戲法防守", "alias": "トリックガード|Crafty Shield",
		"power": "-",
		"category": "support",
		"type": "Fairy",
		"tags": ["target|l|allally", "frame|priority|優先度|up|3", "effect|l|shield"],
		"accuracy": "洞察 + 自然",
		"damage": "-",
		"effect": "先制招式。護盾。使用者和牠的同伴們都不會受到變化招式的影響。",
		"desc": "寶可夢創造出一面魔法盾來保護所有人免受敵人的陰謀詭計。在這面盾牌後，所有人都能看穿謊言和邪惡的意圖。"
	},
	{
		"name": "魔法閃耀", "alias": "マジカルシャイン|Dazzling Gleam",
		"power": "3",
		"category": "special",
		"type": "Fairy",
		"tags": ["target|l|allfoe"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "以所有範圍內的敵人為目標。",
		"desc": "使用者如同強光一樣閃耀，使所有看著牠的人們的眼睛受傷。"
	},
	{
		"name": "裝飾", "alias": "デコレーション|Decorate",
		"power": "-",
		"category": "support",
		"type": "Fairy",
		"tags": ["target|l|ally", "frame|self|力量|up|2", "frame|self|特殊|up|2"],
		"accuracy": "美麗 + 自然",
		"damage": "-",
		"effect": "提升一個隊友的力量和特殊。",
		"desc": "寶可夢使用一些糖霜來裝飾牠的夥伴，使牠看起來更大、更強、且無比美味！"
	},
	{
		"name": "魅惑之聲", "alias": "チャームボイス|Disarming Voice",
		"power": "2",
		"category": "special",
		"type": "Fairy",
		"tags": ["target|l|allfoe", "effect|l|sound", "effect|l|neverfail"],
		"accuracy": "洞察 + 表演",
		"damage": "特殊 + 2",
		"effect": "聲音類招式。必中。以所有範圍內的敵人為目標。",
		"desc": "使用者透過魅惑而動人的哭聲，對牠的對手造成情感上的傷害。這個招式總能讓目標感到難受。"
	},
	{
		"name": "吸取之吻", "alias": "ドレインキッス|Draining Kiss",
		"power": "2",
		"category": "special",
		"type": "Fairy",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "使用者回復等同造成傷害數值一半的HP，向下取整。",
		"desc": "使用者送出一個挑逗般的吻，敵人接住了這個飛吻卻因此被吸取了能量。"
	},
	{
		"name": "妖精之鎖", "alias": "フェアリーロック|Fairy Lock",
		"power": "-",
		"category": "support",
		"type": "Fairy",
		"tags": ["target|l|field", "effect|l|block"],
		"accuracy": "洞察 + 自然",
		"damage": "-",
		"effect": "阻擋。持續一輪。",
		"desc": "使用者做出如同鎖門一樣的動作。過了一會兒大家才會意識到自己不是真的被困住了。"
	},
	{
		"name": "妖精之風", "alias": "ようせいのかぜ|Fairy Wind",
		"power": "2",
		"category": "special",
		"type": "Fairy",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"desc": "寶可夢利用一陣披戴仙塵的強風造成打擊。這會導致發癢。"
	},
	{
		"name": "花朵加農炮", "alias": "フルールカノン|Fleur Cannon",
		"power": "6",
		"category": "special",
		"type": "Fairy",
		"tags": ["target|l|foe", "frame|accuracy|命中|down|1", "effect|l|lethal", "frame|self|特殊|down|2"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 6",
		"effect": "致命傷害。降低使用者的特殊。",
		"desc": "一道光束穿透戰場，它將造成毀滅性的傷害，但會留下新開的花朵而非焦土。使用者在這之後將感到異常疲憊。"
	},
	{
		"name": "花療", "alias": "ラワーヒール Floral Healing",
		"power": "-",
		"category": "support",
		"type": "Fairy",
		"tags": ["target|l|ally", "effect|l|heal"],
		"accuracy": "洞察 + 自然",
		"damage": "-",
		"effect": "基礎治癒。若場地處於青草場地狀態，則這個招式變為 強效治癒。",
		"desc": "使用者做出一個能治癒佩戴者並使其感到放鬆的花環。在適當的條件下，這個招式還會創造出一個環繞著目標的花圃。"
	},
	{
		"name": "鮮花防守", "alias": "フラワーガード|Flower Shield",
		"power": "-",
		"category": "support",
		"type": "Fairy",
		"tags": ["target|l|field", "frame|target|防禦|up|1", "frame|self|防禦|up|1"],
		"accuracy": "洞察 + 自然",
		"damage": "-",
		"effect": "提升場地上所有草屬性寶可夢的防禦。",
		"desc": "寶可夢使用神秘的力量使每個草屬性寶可夢的身邊開滿鮮花。場地上的鮮花顯得更具活力且美麗。"
	},
	{
		"name": "大地掌控", "alias": "ジオコントロール|Geomancy",
		"power": "-",
		"category": "support",
		"type": "Fairy",
		"tags": ["target|l|self", "effect|l|charge", "frame|self|靈巧|up|2", "frame|self|特殊|up|2", "frame|self|特防|up|2"],
		"accuracy": "洞察 + 自然",
		"damage": "-",
		"effect": "蓄力招式。使用者在蓄力後，接著在牠的下個回合使自己的靈巧、特殊、和特防各提升 2 點。",
		"desc": "透過一道神秘的聯繫，寶可夢汲取大地的生命力量來增強自己的能力。"
	},
	{
		"name": "破滅之光", "alias": "はめつのひかり|Light of Ruin",
		"power": "6",
		"category": "special",
		"type": "Fairy",
		"tags": ["target|l|foe", "frame|accuracy|命中|down|1", "effect|l|lethal", "effect|l|recoil"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 6",
		"effect": "致命傷害。反作用力傷害。",
		"desc": "從永恆之花中汲取能量，寶可夢宣洩出牠所有的傷痛。一道美麗的光芒將會籠罩這片區域，但牠內心的痛苦依然存在。"
	},
	{
		"name": "薄霧場地", "alias": "ミストフィールド|Misty Terrain",
		"power": "-",
		"category": "support",
		"type": "Fairy",
		"tags": ["target|l|field"],
		"accuracy": "洞察 + 自然",
		"damage": "-",
		"effect": "站在戰場上的生物全都不會受到異常狀態的影響。龍屬性攻擊的傷害骰池無法獲得其招式威力的加值。持續 4 輪。",
		"desc": "使用者使戰場上環繞著一陣能讓人感到被保護的神秘迷霧。龍屬性寶可夢將會感到有些不自在。"
	},
	{
		"name": "月亮之力", "alias": "ムーンフォース|Moonblast",
		"power": "3",
		"category": "special",
		"type": "Fairy",
		"tags": ["target|l|foe", "dice|l|3", "frame|target|特殊|down|1"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 3",
		"effect": "骰 3 顆機率骰以降低敵人的特殊。",
		"desc": "直接從月亮召喚力量，寶可夢使用光束射向敵人。"
	},
	{
		"name": "月光", "alias": "つきのひかり|Moonlight",
		"power": "-",
		"category": "support",
		"type": "Fairy",
		"tags": ["target|l|self", "effect|l|heal"],
		"accuracy": "洞察 + 自然",
		"damage": "-",
		"effect": "基礎治癒。若成功，則消耗 1 點意志點以使其生效。如果在夜晚、或當前天氣狀態為大晴天，則這個招式變為 強效治癒。如果當前天氣狀態為下雨或沙暴，則這個招式只會回復 1 點HP。",
		"desc": "使用者匯聚來自月光的力量，被吸收的能量將能夠治癒大部分的傷勢。"
	},
	{
		"name": "自然之怒", "alias": "しぜんのいかり|Nature's Madness",
		"power": "*",
		"category": "special",
		"type": "Fairy",
		"tags": ["target|l|foe", "frame|accuracy|命中|down|1"],
		"accuracy": "洞察 + 自然",
		"damage": "不定",
		"effect": "這個招式的傷害骰池等同於敵人剩餘HP的一半（最多10，向下取整）。如果敵人的剩餘HP只剩下 1 點，則這個招式自動失敗。這個招式無視敵人的防禦和特防。",
		"desc": "大自然的力量發起攻勢，就仿佛它們有著自己的意志。水會嘗試淹沒你，植物會困住你，閃電會從不知何處劈向你，甚至連你自己的身體都會背叛你。"
	},
	{
		"name": "嬉鬧", "alias": "じゃれつく|Play Rough",
		"power": "3",
		"category": "physical",
		"type": "Fairy",
		"tags": ["target|l|foe", "frame|accuracy|命中|down|1", "dice|l|1", "frame|target|力量|down|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "骰 1 顆機率骰以降低敵人的力量。",
		"desc": "使用者和敵人開始玩鬧般的摔跤，但情況很快就變得不太妙。"
	},
	{
		"name": "亮亮風暴", "alias": "きらきらストーム|Sparkly Swirl",
		"power": "3",
		"category": "special",
		"type": "Fairy",
		"tags": ["target|l|foe", "frame|accuracy|命中|down|1", "target|l|allally", "frame|heal|治療狀態|always"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "若成功，治療使用者和所有隊友的所有異常狀態。如果這個招式的使用者處於最終進化階段，則這個招式自動失敗。",
		"desc": "寶可夢釋放出一陣閃亮亮，帶著好聞香味的能量風暴，能舒緩身體疲勞並具有治癒能力。"
	},
	{
		"name": "靈魂衝擊", "alias": "ソウルクラッシュ|Spirit Break",
		"power": "2",
		"category": "physical",
		"type": "Fairy",
		"tags": ["target|l|foe", "frame|target|特殊|down|1"],
		"accuracy": "洞察 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "若成功，降低敵人的力量。",
		"desc": "有時候言語比物理打擊更傷人，而這個招式兩者兼具。"
	},
	{
		"name": "神奇蒸汽", "alias": "ワンダースチーム|Strange Steam",
		"power": "3",
		"category": "special",
		"type": "Fairy",
		"tags": ["target|l|foe", "frame|confuse|混亂|number|d2"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 3",
		"effect": "骰 2 顆機率骰以使敵人陷入「混亂」狀態。",
		"desc": "使用者釋放出一種令人迷醉的芳香蒸汽，可不要上當，因為它不僅有毒，還有可怕的副作用。"
	},
	{
		"name": "天使之吻", "alias": "てんしのキッス|Sweet Kiss",
		"power": "-",
		"category": "support",
		"type": "Fairy",
		"tags": ["target|l|foe", "frame|accuracy|命中|down|2", "frame|confuse|混亂|always"],
		"accuracy": "可愛 + 誘惑",
		"damage": "-",
		"effect": "使敵人陷入「混亂」狀態。",
		"desc": "寶可夢走向敵人並在對方臉上留下一個甜美的吻，接著調皮地離開。敵人將困惑茫然於其中的含義。"
	}
]);
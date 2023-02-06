var MoveList;
if(!MoveList) MoveList = [];

Array.prototype.push.apply(MoveList, [
	{
		"name": "擲錨", "alias": "アンカーショット|Anchor Shot",
		"power": "3",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe", "effect|l|block"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "遠程攻擊。阻擋。",
		"desc": "寶可夢朝著牠的敵人投出船錨，並用海草纏住對手，這個船錨將拖住敵人使其無法逃脫。"
	},
	{
		"name": "身體輕量化", "alias": "ボディパージ|Autotomize",
		"power": "-",
		"category": "support",
		"type": "Steel",
		"tags": ["target|l|self", "frame|self|體重|down|½", "frame|self|靈巧|up|2"],
		"accuracy": "靈巧 + 導引",
		"damage": "-",
		"effect": "提升使用者的靈巧。在該場景期間，使用者的體重將被降低到原本的一半。",
		"desc": "寶可夢甩落多餘部件，並開始旋轉身體其他部位以進行更輕便的活動。"
	},
	{
		"name": "巨獸彈", "alias": "きょじゅうだん|Behemoth Bash",
		"power": "4*",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe"],
		"accuracy": "活力 + 鬥毆",
		"damage": "力量 + 4*",
		"effect": "若敵人正處於極巨化狀態，則這個招式變為致命傷害，且傷害骰池額外增加 4 顆骰子。",
		"desc": "寶可夢變成一面巨大的能量盾牌，踐踏在牠前方的一切。如果敵人正處於極巨化狀態下，則其所有的能量都將被橫掃殆盡。"
	},
	{
		"name": "巨獸斬", "alias": "きょじゅうざん|Behemoth Blade",
		"power": "4*",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe"],
		"accuracy": "力量 + 鬥毆",
		"damage": "力量 + 4*",
		"effect": "若敵人正處於極巨化狀態，則這個招式變為致命傷害，且傷害骰池額外增加 4 顆骰子。",
		"desc": "寶可夢變成一把有著鋒利刀刃的巨劍。如果敵人正處於極巨化狀態下，則其所有的能量都將被斬成碎片。"
	},
	{
		"name": "子彈拳", "alias": "バレットパンチ|Bullet Punch",
		"power": "2",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe", "frame|priority||up|1", "effect|l|fist"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "拳頭類招式。先制招式。",
		"desc": "使用者將自己朝著敵人發射出去，用牠的鐵拳狠狠擊打對手。"
	},
	{
		"name": "破滅之願", "alias": "はめつのねがい|Doom Desire",
		"power": "6",
		"category": "special",
		"type": "Steel",
		"tags": ["target|l|foe"],
		"accuracy": "洞察 + 誘惑",
		"damage": "特殊 + 6",
		"effect": "這個招式將在下下個戰鬥輪結束時造成傷害。它將無視任何護盾招式或掩護的效果。如果目標無法戰鬥或被換下場，則傷害目標將會變為下一個對手或牠的其中一個同伴。在說書人的裁斷下，這個招式可能會造成額外的效果。",
		"desc": "留心你許下的願望，這隻寶可夢會以最片段的方式解讀它，並讓它們以相當扭曲的方式實現。"
	},
	{
		"name": "鋼拳雙擊", "alias": "ダブルパンツァー|Double Iron Bash",
		"power": "2",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe", "frame|flinch||number|d3"],
		"accuracy": "特殊 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "骰 3 顆機率骰以使敵人陷入「畏縮」狀態。",
		"desc": "使用者硬化自己的雙臂，接著以高速旋轉它們以連續攻擊敵人二次。這陣打擊能夠讓其受害者被輾倒在地。"
	},
	{
		"name": "加農光炮", "alias": "ラスターカノン|Flash Cannon",
		"power": "3",
		"category": "special",
		"type": "Steel",
		"tags": ["target|l|foe", "dice|l|1", "frame|target|特防|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "骰 1 顆機率骰以降低敵人的特防。",
		"desc": "寶可夢吸收牠身軀表面的反射光，並釋放出一道強大的光束朝敵人射去。"
	},
	{
		"name": "齒輪飛盤", "alias": "ギアソーサー|Gear Grind",
		"power": "2",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|sact_2"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "雙重行動。",
		"desc": ""
	},
	{
		"name": "輔助齒輪", "alias": "アシストギア|Gear Up",
		"power": "-",
		"category": "support",
		"type": "Steel",
		"tags": ["target|l|ally", "frame|self|力量|up|1", "frame|self|特殊|up|1"],
		"accuracy": "活力 + 導引",
		"damage": "-",
		"effect": "提升一個鋼屬性或電屬性隊友的力量和特殊。",
		"desc": "使用者將牠的齒輪接上一名隊友，讓隊友的身體如同運轉順暢的機器一樣運作。"
	},
	{
		"name": "陀螺球", "alias": "ジャイロボール|Gyro Ball",
		"power": "1*",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1*",
		"effect": "使用者的靈巧每低於目標一點，這個招式的傷害骰池就可以額外增加 1 顆骰子。你最多可以透過這個方式增加 5 顆骰子。",
		"desc": "使用者蜷縮成球並高速旋轉以攻擊目標。"
	},
	{
		"name": "重磅衝撞", "alias": "ヘビーボンバー|Heavy Slam",
		"power": "1*",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1*",
		"effect": "使用者的體重每超過目標 50公斤，這個招式的傷害骰池就可以額外增加 1 顆骰子。你最多可以透過這個方式增加 4 顆骰子。",
		"desc": "使用者利用牠的全身重量猛撞敵人。越小的敵人越容易被影響。"
	},
	{
		"name": "鐵壁", "alias": "てっぺき|Iron Defense",
		"power": "-",
		"category": "support",
		"type": "Steel",
		"tags": ["target|l|self", "frame|self|防禦|up|2"],
		"accuracy": "活力 + 導引",
		"damage": "-",
		"effect": "提升使用者的防禦。",
		"desc": "寶可夢使牠的身體表面硬化，就彷彿它是以最堅固的鋼鐵所構成一般。"
	},
	{
		"name": "鐵頭", "alias": "アイアンヘッド|Iron Head",
		"power": "3",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe", "frame|flinch||number|d3"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "骰 3 顆機率骰以使敵人陷入「畏縮」狀態。",
		"desc": "寶可夢衝向敵人，朝著目標發起一記可能將其擊倒在地的殘暴頭錘。"
	},
	{
		"name": "鐵尾", "alias": "アイアンテール|Iron Tail",
		"power": "4",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe", "frame|accuracy||down|3", "dice|l|3", "frame|target|防禦|down|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 4",
		"effect": "骰 3 顆機率骰以降低敵人的防禦。",
		"desc": "使用者揮動牠硬化的尾巴攻擊敵人。目標將因為這一系列攻擊而變得脆弱。"
	},
	{
		"name": "王者盾牌", "alias": "キングシールド|King's Shield",
		"power": "-",
		"category": "support",
		"type": "Steel",
		"tags": ["target|l|self", "frame|priority||up|3", "effect|l|shield", "frame|target|力量|down|2"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "-",
		"effect": "先制招式。護盾。若敵人對使用者使用了非遠程的物理招式攻擊，則降低敵人的力量。使敵人的傷害骰池減少 3 顆骰子。",
		"desc": "寶可夢使用鬼魅般的盾牌來保護自己。如果敵人打算碰觸它，使用者將會吸收對方的一部份生命力。"
	},
	{
		"name": "磁鐵炸彈", "alias": "マグネットボム|Magnet Bomb",
		"power": "2",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe", "effect|l|neverfail"],
		"accuracy": "靈巧 + 導引",
		"damage": "力量 + 2",
		"effect": "遠程攻擊。必中。",
		"desc": "寶可夢投擲出能夠如同磁鐵一般將目標吸引過來的金屬炸彈。在炸彈接觸到目標的瞬間，它就會爆炸。"
	},
	{
		"name": "金屬爆炸", "alias": "メタルバースト|Metal Burst",
		"power": "*",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "不定",
		"effect": "這個招式只能在敵人剛剛進行了攻擊後才能夠發揮作用。這個招式的傷害骰池等同於你敵人上次攻擊的傷害骰池再額外增加 2 顆骰子。無視敵人的防禦。",
		"desc": "在承受傷害之後，因為敵人攻擊而脫落，使用者爆發出無數細小而尖銳的金屬碎片。牠承受的衝擊越大，射出的金屬碎片就越多。"
	},
	{
		"name": "金屬爪", "alias": "メタルクロー|Metal Claw",
		"power": "2",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "dice|l|1", "frame|self|力量|up|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "骰 1 顆機率骰以提升使用者的力量。",
		"desc": "寶可夢使用牠鋒利的利爪攻擊，摩擦撞擊的過程可能會使它變得更加鋒利。"
	},
	{
		"name": "金屬音", "alias": "きんぞくおん|Metal Sound",
		"power": "-",
		"category": "support",
		"type": "Steel",
		"tags": ["target|l|foe", "effect|l|sound", "frame|target|特防|down|2"],
		"accuracy": "強壯 + 表演",
		"damage": "-",
		"effect": "聲音類招式。降低敵人的特防。",
		"desc": "使用者製造出可怕的噪音，妨礙敵人在戰鬥中專注，並使其在面對攻擊時更加脆弱。"
	},
	{
		"name": "彗星拳", "alias": "コメットパンチ|Meteor Mash",
		"power": "3",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|fist", "dice|l|2", "frame|self|力量|up|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "拳頭類招式。骰 2 顆機率骰以提升使用者的力量。",
		"desc": "使用者舉起強勁的拳頭衝刺，彷彿彗星一般襲來。"
	},
	{
		"name": "鏡光射擊", "alias": "ミラーショット|Mirror Shot",
		"power": "2",
		"category": "special",
		"type": "Steel",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "frame|confuse||number|d3"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "骰 2 顆機率骰以使敵人陷入「混亂」狀態。",
		"desc": "使用者射出一道光束使敵人頭暈目眩。那些體驗過這一擊的受害者會把這個經歷形容為「被困在鏡子迷宮之中」。"
	},
	{
		"name": "換檔", "alias": "ギアチェンジ|Shift Gear",
		"power": "-",
		"category": "support",
		"type": "Steel",
		"tags": ["target|l|self", "frame|self|力量|up|1", "frame|self|靈巧|up|2"],
		"accuracy": "靈巧 + 導引",
		"damage": "-",
		"effect": "提升使用者的力量和靈巧。",
		"desc": "寶可夢讓牠的齒輪高速旋轉，如同高功率的機器一樣運轉。"
	},
	{
		"name": "修長之角", "alias": "スマートホーン|Smart Strike",
		"power": "3",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe", "effect|l|lethal", "effect|l|neverfail"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "致命傷害。必中。",
		"desc": "使用者運用其中一個牠銳利的尖角以驚人的準確度刺向敵人，這一擊留下的傷口相當深刻，且必須被立即治療。"
	},
	{
		"name": "鐵蹄光線", "alias": "てっていこうせん|Steel Beam",
		"power": "6",
		"category": "special",
		"type": "Steel",
		"tags": ["target|l|foe", "effect|l|recoil"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 6",
		"effect": "反作用力傷害。",
		"desc": "一道凝聚濃縮的光束，足以熔毀哪怕最厚實的鋼板。不幸的是，使用者在制御這股力量時同樣會受到傷害。"
	},
	{
		"name": "鋼翼", "alias": "はがねのつばさ|Steel Wing",
		"power": "3",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "dice|l|1", "frame|self|防禦|up|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "骰 1 顆機率骰以提升使用者的防禦。",
		"desc": "寶可夢使用牠鋒利的翅羽，就彷彿它們是剃刀一般。"
	},
	{
		"name": "流星閃衝", "alias": "メテオドライブ|Sunsteel Strike",
		"power": "4",
		"category": "physical",
		"type": "Steel",
		"tags": ["target|l|foe", "effect|l|lethal"],
		"accuracy": "力量 + 鬥毆",
		"damage": "力量 + 4",
		"effect": "如果敵方有任何事物將阻止這個招式造成傷害（例如寶可夢屬性、特性、護盾招式、天氣、或屏障），將其忽略。這個招式無法被對抗。",
		"desc": "你突然停下腳步，看見一道明亮刺眼的強光正以高速衝著你而來。你看不見是什麼擊中了你，接著便陷入了一片黑暗。"
	}
]);
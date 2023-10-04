// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'MoveList'.
let MoveList;
if(!MoveList) MoveList = []; 
// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports.MoveList = MoveList;

Array.prototype.push.apply(MoveList, [
	{
		"name": "水流噴射", "alias": "アクアジェット|Aqua Jet",
		"power": "2",
		"category": "physical",
		"type": "Water",
		"tags": ["target|l|foe", "frame|priority||up|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "先制招式。",
		"desc": "使用者利用強力的水流推動自己，以迅雷不及掩耳的高速襲擊對手。"
	},
	{
		"name": "水流環", "alias": "アクアリング|Aqua Ring",
		"power": "-",
		"category": "support",
		"type": "Water",
		"tags": ["target|l|self", "frame|heal||heal|1"],
		"accuracy": "特殊 + 自然",
		"damage": "-",
		"effect": "若成功，則消耗 1 點意志點以使其生效。使用者將在每個戰鬥輪結束時回復 1 點HP。持續 4 輪。",
		"desc": "使用者以一種特殊的流水環包裹自身，減輕疼痛。"
	},
	{
		"name": "水流尾", "alias": "アクアテール|Aqua Tail",
		"power": "3",
		"category": "physical",
		"type": "Water",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "frame|flinch||number|d3"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "骰 3 顆機率骰以使敵人陷入「畏縮」狀態。",
		"desc": "使用者揮動牠的尾八，就彷彿那是狂猛暴風雨颳起的驚濤駭浪一般。"
	},
	{
		"name": "活活氣泡", "alias": "いきいきバブル|Bouncy Bubble",
		"power": "3",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "使用者回復等同於造成傷害一半的HP（尾數捨去）。如果這個招式的使用者處於最終進化階段，則這個招式自動失敗。",
		"desc": "使用者向牠的目標射出泡泡，這些充滿清水的泡泡會反彈到使用者面前。你應該喝下泡泡裡的水嗎？誰在乎？好玩就好！"
	},
	{
		"name": "鹽水", "alias": "しおみず|Brine",
		"power": "2*",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "如果敵人的HP只剩下一半或以下，則這個招式的傷害骰池額外增加 3 顆骰子。",
		"desc": "使用者以高密度的鹽水噴射重擊敵人，如果目標感到疲倦，那麼牠們可能會更容易被水壓給輕易擊倒。"
	},
	{
		"name": "泡沫", "alias": "あわ|Bubble",
		"power": "2",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|allfoe", "dice|l|1", "frame|target|靈巧|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "以所有範圍內的敵人為目標。骰 1 顆機率骰以降低目標的靈巧。",
		"desc": "一堆泡泡飛行圍繞在敵人周圍，其中一些泡泡會沾黏牠們的身體以阻礙其行動。"
	},
	{
		"name": "泡沫光線", "alias": "バブルこうせん|Bubble Beam",
		"power": "3",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|foe", "dice|l|1", "frame|target|靈巧|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "骰 1 顆機率骰以降低敵人的靈巧。",
		"desc": "一長串泡泡擊中敵人，這些泡沫有可能會阻礙目標自由行動。"
	},
	{
		"name": "貝殼夾擊", "alias": "からではさむ|Clamp",
		"power": "2",
		"category": "physical",
		"type": "Water",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|block"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "阻擋。每個戰鬥輪結束時，骰 2 顆傷害骰以對敵人造成傷害。持續 4 輪。",
		"desc": "使用者使用他堅硬厚重的甲殼夾困並擠壓對手進行攻擊。"
	},
	{
		"name": "蟹鉗錘", "alias": "クラブハンマー|Crabhammer",
		"power": "3",
		"category": "physical",
		"type": "Water",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|crit"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "容易擊中要害。",
		"desc": "龐大的鉗爪以鐵鎚般的力道敲打敵人，這一擊的破壞力道相當驚人。"
	},
	{
		"name": "潛水", "alias": "ダイビング|Dive",
		"power": "2",
		"category": "physical",
		"type": "Water",
		"tags": ["target|l|foe", "effect|l|charge"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "蓄力招式。當這個招式在蓄力時，使用者將脫離所有招式的影響範圍。這個招式能讓這隻寶可夢潛到深海之中。",
		"desc": "使用者潛入水中，並以驚人速度持續俯衝下潛。"
	},
	{
		"name": "鰓咬", "alias": "エラがみ|Fishious Rend",
		"power": "3*",
		"category": "physical",
		"type": "Water",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3*",
		"effect": "若目標在這個戰鬥輪中還沒有進行過牠的回合，則這個招式的傷害骰池額外增加 2 顆骰子。",
		"desc": "寶可夢使用牠的腮顎朝著牠的目標咬下，即使牠們沒有牙齒，這一擊仍然具有能粉碎敵人的強度。"
	},
	{
		"name": "加農水炮", "alias": "ハイドロカノン|Hydro Cannon",
		"power": "6",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|recharge"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 6",
		"effect": "必須重新充能。",
		"desc": "寶可夢朝著對手噴出足以讓房屋倒坍的強大水壓。使用者在這之後將會需要好好休息。"
	},
	{
		"name": "水砲", "alias": "高壓幫浦|ハイドロポンプ|Hydro Pump",
		"power": "5",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|foe", "frame|accuracy||down|1"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 5",
		"desc": "使用者在體內積蓄水壓，然後向目標釋放巨量並強力的水壓進行攻擊。"
	},
	{
		"name": "生命水滴", "alias": "いのちのしずく|Life Dew",
		"power": "-",
		"category": "support",
		"type": "Water",
		"tags": ["target|l|allally", "frame|heal||c_heal|1"],
		"accuracy": "特殊 + 自然",
		"damage": "-",
		"effect": "若成功，則消耗 1 點意志點以使其生效。使用者以及範圍內的友方將在每個戰鬥輪結束時回復 1 點HP。持續 4 輪。",
		"desc": "使用者創造出能讓自己和同伴充滿能量的清新露水。"
	},
	{
		"name": "水流裂破", "alias": "アクアブレイク|Liquidation",
		"power": "3",
		"category": "physical",
		"type": "Water",
		"tags": ["target|l|foe", "effect|l|lethal", "dice|l|2", "frame|target|防禦|down|1"],
		"accuracy": "力量 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "致命傷害。骰 2 顆機率骰以降低敵人的防禦。",
		"desc": "寶可夢接近牠的敵人，然後以全力迸發出高壓水爆以重擊對手，這股水流有可能切穿或打凹敵人的護甲。"
	},
	{
		"name": "濁流", "alias": "だくりゅう|Muddy Water",
		"power": "3",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|allfoe", "frame|accuracy||down|2", "dice|l|3", "frame|target|命中|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "以所有範圍內的敵人為目標。骰 3 顆機率骰以降低目標的命中。",
		"desc": "使用者將泥土塞滿嘴巴，並朝著敵人噴吐出一道泥濘激流。 這些泥漿可能噴濺到敵人的雙眼之中。"
	},
	{
		"name": "章魚桶炮", "alias": "オクタンほう|Octazooka",
		"power": "2",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "dice|l|5", "frame|target|命中|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "骰 5 顆機率骰以降低敵人的命中。",
		"desc": "使用者將墨水噴到目標臉上以遮蔽牠們的視線。"
	},
	{
		"name": "根源波動", "alias": "こんげんのはどう|Origin Pulse",
		"power": "4",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "effect|l|lethal"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 4",
		"effect": "致命傷害。",
		"desc": "寶可夢從水下釋放一道創造出一連串連鎖效應的巨大脈衝，讓浩瀚水量以奔騰水流之姿四竄。傳說海洋中的所有水流都源自於此。"
	},
	{
		"name": "求雨", "alias": "あまごい|Rain Dance",
		"power": "-",
		"category": "support",
		"type": "Water",
		"tags": ["target|l|field", "weather|l|rain"],
		"accuracy": "特殊 + 自然",
		"damage": "-",
		"effect": "讓天氣狀態在接下來 4 輪期間變為下雨。",
		"desc": "使用者表演一種古怪神秘的舞蹈以呼喚大雨。"
	},
	{
		"name": "貝殼刃", "alias": "シェルブレード|Razor Shell",
		"power": "3",
		"category": "physical",
		"type": "Water",
		"tags": ["target|l|foe", "dice|l|1", "frame|target|防禦|down|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "骰 1 顆機率骰以降低敵人的防禦。",
		"desc": "寶可夢用牠鋒利的貝殼斬切對手的皮毛、盔甲、或任何保護牠們身體不受傷害的事物。"
	},
	{
		"name": "熱水", "alias": "ねっとう|Scald",
		"power": "3",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|foe", "frame|burn1||number|d3"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "骰 3 顆機率骰以使敵人陷入「灼傷 1 級」狀態。",
		"desc": "使用者噴射出滾燙的沸水進行攻擊，這可能會使對手在被浸濕的同時灼傷。"
	},
	{
		"name": "狙擊", "alias": "ねらいうち|Snipe Shot",
		"power": "3",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|foe", "effect|l|crit"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "容易擊中要害。",
		"desc": "使用者以驚人的精準度射出疾馳的水槍。"
	},
	{
		"name": "浸水", "alias": "みずびたし|Soak",
		"power": "-",
		"category": "support",
		"type": "Water",
		"tags": ["target|l|foe"],
		"accuracy": "特殊 + 導引",
		"damage": "-",
		"effect": "將目標的屬性變更為水屬性。",
		"desc": "使用者噴射出大量的水流和濕氣，如同外衣一般包裹著敵人的身體。"
	},
	{
		"name": "泡影的詠歎調", "alias": "うたかたのアリア|Sparkling Aria",
		"power": "3",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|area", "effect|l|sound"],
		"accuracy": "特殊 + 表演",
		"damage": "特殊 + 3",
		"effect": "範圍攻擊。如果目標寶可夢身上有任何「灼傷」狀態，則牠不會受到傷害，而是改為治療「灼傷」狀態。",
		"desc": "寶可夢唱出優美的旋律，歌聲幻成一座閃閃發光的噴泉，並在撞擊的瞬間爆開，熄滅任何路徑上的火焰。"
	},
	{
		"name": "滔滔衝浪", "alias": "ざぶざぶサーフ|Splishy Splash",
		"power": "3",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|foe", "frame|paralysis||number|d3"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "骰 3 顆機率骰以使敵人陷入「麻痺」狀態。如果這個招式的使用者處於最終進化階段，則這個招式自動失敗。",
		"desc": "寶可夢彷彿衝浪一般騎在電流巨浪上。這看起來相當刺激，但也相當危險，畢竟電流可沒有跟水一樣能讓你安全衝浪的性質。"
	},
	{
		"name": "蒸汽爆炸", "alias": "スチームバースト|Steam Eruption",
		"power": "4",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|lethal", "frame|burn2||number|d3"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 4",
		"effect": "致命傷害。骰 3 顆機率骰以使敵人陷入「灼傷 2 級」狀態。",
		"desc": "在一瞬間，暴走引擎上沸騰的蒸氣爆鳴貫穿敵人的耳膜，緊接著超高溫的蒸汽劃破天氣噴向了對手。"
	},
	{
		"name": "衝浪", "alias": "なみのり|Surf",
		"power": "3",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|area"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "範圍攻擊。",
		"desc": "一道大浪橫掃整個區域，而使用者在同時於巨浪之上悠閒游泳。"
	},
	{
		"name": "水槍", "alias": "みずでっぽう|Water Gun",
		"power": "2",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"desc": "使用者學會已足夠的力道向敵人噴射水流來傷害對方。"
	},
	{
		"name": "水之誓約", "alias": "みずのちかい|Water Pledge",
		"power": "2",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|area", "target|l|field", "pdice|l|2"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "範圍攻擊。創造出一道彩紅，能使所有機率骰判定都增加 2 顆骰子。這個效果將持續 4 個戰鬥輪。",
		"desc": "寶可夢吟唱召喚水之力量的咒語。空氣中水氣將使光線折射，創造出鼓舞人心的彩虹，戰場上的所有人都會為之一振。"
	},
	{
		"name": "水之波動", "alias": "みずのはどう|Water Pulse",
		"power": "2",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|foe", "frame|confuse||number|d3"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "骰 3 顆機率骰以使敵人陷入「混亂」狀態。",
		"desc": "寶可夢使用水的震動波來攻擊敵人，這一擊可能會使敵人感到頭暈目眩。"
	},
	{
		"name": "飛水手裡劍", "alias": "みずしゅりけん|Water Shuriken",
		"power": "1",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|foe", "frame|priority||up|1", "effect|l|sact_5"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 1",
		"effect": "遠程攻擊。先制招式。連續行動。",
		"desc": "寶可夢快速地投擲出手裡劍形狀的鋒利水流。"
	},
	{
		"name": "玩水", "alias": "みずあそび|Water Sport",
		"power": "-",
		"category": "support",
		"type": "Water",
		"tags": ["target|l|field"],
		"accuracy": "特殊 + 導引",
		"damage": "-",
		"effect": "在接下來 4 個戰鬥輪期間，火屬性攻擊的傷害骰池將無法獲得其招式威力的加值。",
		"desc": "使用者讓施氣浸透整個戰場，使火屬性攻擊更難以點燃。"
	},
	{
		"name": "噴水", "alias": "しおふき|Water Spout",
		"power": "6*",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|allfoe"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 6*",
		"effect": "以所有範圍內的敵人為目標。使用者每失去 1 點HP，這個招式的傷害骰池就會減少 1 顆骰子。這個方式最多會減少 5 顆骰子。",
		"desc": "寶可夢製造出驚人的水壓並釋放出巨大的圓柱狀渦流，其高度甚至可以觸及雲層。"
	},
	{
		"name": "攀瀑", "alias": "たきのぼり|Waterfall",
		"power": "3",
		"category": "physical",
		"type": "Water",
		"tags": ["target|l|foe", "frame|flinch||number|d3"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "骰 3 顆機率骰以使敵人陷入「畏縮」狀態。",
		"desc": "寶可夢以如此強大的力量游泳，甚至能夠逆著瀑布向上攀泳。"
	},
	{
		"name": "潮旋", "alias": "うずしお|Whirlpool",
		"power": "2",
		"category": "special",
		"type": "Water",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "effect|l|block"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "阻擋。每個戰鬥輪結束時，骰 2 顆傷害骰以對敵人造成傷害。持續 4 輪。",
		"desc": "將敵人困在劇烈旋轉的漩渦中，使敵人無法從戰鬥中逃脫。"
	},
	{
		"name": "縮入殼中", "alias": "からにこもる|Withdraw",
		"power": "-",
		"category": "support",
		"type": "Water",
		"tags": ["target|l|self", "frame|self|防禦|up|1"],
		"accuracy": "活力 + 鬥毆",
		"damage": "-",
		"effect": "提升使用者的防禦。",
		"desc": "使用者躲進牠厚重的殼中以從來襲的攻擊中保護自己。"
	}
]);
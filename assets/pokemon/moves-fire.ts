// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'MoveList'.
let MoveList;
if(!MoveList) MoveList = []; 
// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports.MoveList = MoveList;

Array.prototype.push.apply(MoveList, [
	{
		"name": "爆炸烈焰", "alias": "ブラストバーン|Blast Burn",
		"power": "6",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|lethal", "effect|l|recharge"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 6",
		"effect": "必須重新充能。致命傷害。",
		"desc": "寶可夢耗盡牠的全身全力向敵人釋放出地獄般的爆炸燃焰。但使用者在這之後將會筋疲力竭。"
	},
	{
		"name": "火焰踢", "alias": "ブレイズキック|Blaze Kick",
		"power": "3",
		"category": "physical",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|crit", "frame|burn2||number|d2"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "容易擊中要害。骰 2 顆機率骰以使敵人陷入「灼傷 2 級」狀態。",
		"desc": "使用者使出一記纏繞著火焰的強力踢擊，可能會讓對方留下難看的灼傷痕跡。"
	},
	{
		"name": "青焰", "alias": "あおいほのお|Blue Flare",
		"power": "6",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "frame|burn3||number|d2"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 6",
		"effect": "骰 2 顆機率骰以使敵人陷入「灼傷 3 級」狀態。",
		"desc": "伴隨著驚天動地的爆炸，萊希拉姆釋放出巨大的藍色火焰纏繞自身，直接被這個攻擊命中將可能使完全被火焰給吞沒。"
	},
	{
		"name": "燃盡", "alias": "もえつきる|Burn Up",
		"power": "7",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|foe", "effect|l|lethal"],
		"accuracy": "意志 + 導引",
		"damage": "特殊 + 7",
		"effect": "致命傷害。在造成傷害之後，使用者在當日期間將不再被視為火屬性（如果牠原本就只有火屬性，那牠將被視為無屬性）。在當日期間，該寶可夢所使用的火屬性招式將無法把招式的威力加到傷害骰池中。",
		"desc": "使用者透過燃盡自身的火焰以釋放出牠所有的力量。儘管這個傷害是毀滅性的，但牠在至少一天之內都將無法再生成任何火焰。"
	},
	{
		"name": "火花", "alias": "ひのこ|Ember",
		"power": "2",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|burn1||number|d1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "骰 1 顆機率骰以使敵人陷入「灼傷 1 級」狀態。",
		"desc": "使用者向目標發射小型火焰，這可能會導致一級灼傷。"
	},
	{
		"name": "噴火", "alias": "ふんか|Eruption",
		"power": "6*",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|allfoe", "effect|l|lethal"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 6*",
		"effect": "致命傷害。以所有範圍內的敵人為目標。使用者每失去 1 點HP，這個招式的傷害骰池就會減少 1 顆骰子。這個方式最多會減少 5 顆骰子。",
		"desc": "使用者猛烈噴發出熔岩來燒盡任何它所接觸的東西。"
	},
	{
		"name": "火之舞", "alias": "ほのおのまい|Fiery Dance",
		"power": "3",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|foe", "dice|l|5", "frame|self|特殊|up|1"],
		"accuracy": "靈巧 + 表演",
		"damage": "特殊 + 3",
		"effect": "骰 5 顆機率骰以提升使用者的特殊。",
		"desc": "使用者將自己包裹於火焰之中，在優雅起舞的同時放射出火焰。"
	},
	{
		"name": "大字爆炎", "alias": "だいもんじ|Fire Blast",
		"power": "5",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "effect|l|lethal", "frame|burn3||number|d3"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 5",
		"effect": "致命傷害。骰 3 顆機率骰以使目標陷入「灼傷 3 級」狀態。",
		"desc": "寶可夢噴出一個巨大的火球並在接觸到敵人時爆炸，爆炸的火焰將呈現大字形狀。"
	},
	{
		"name": "火焰牙", "alias": "ほのおのキバ|Fire Fang",
		"power": "2",
		"category": "physical",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "frame|flinch||number|d2", "frame|burn1||number|d2"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "骰 2 顆機率骰以使敵人陷入「畏縮」狀態。骰 2 顆機率骰以使敵人陷入「灼傷 1 級」狀態。",
		"desc": "使用者在咬住目標的同時從口中噴出火焰吐息。"
	},
	{
		"name": "火焰鞭", "alias": "ほのおのムチ|Fire Lash",
		"power": "3",
		"category": "physical",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|target|防禦|down|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "降低敵人的防禦。",
		"desc": "利用燃燒的鞭子，寶可夢纏住牠的敵人，使牠們毫無防備，只能任其擺佈。"
	},
	{
		"name": "火之誓約", "alias": "ほのおのちかい|Fire Pledge",
		"power": "2",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|area", "target|l|field"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "範圍攻擊。所有戰場上的可燃植物和物體都將化為熊熊火海。每個戰鬥輪結束時，骰 1 顆傷害骰以對戰場上的所有人造成傷害。",
		"desc": "寶可夢吟唱召喚火之力量的咒語。牠的誓言得到回應，火焰吞噬了周圍的一切。"
	},
	{
		"name": "火焰拳", "alias": "ほのおのパンチ|Fire Punch",
		"power": "3",
		"category": "physical",
		"type": "Fire",
		"tags": ["target|l|foe", "effect|l|fist", "frame|burn2||number|d1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "拳頭類招式。骰 1 顆機率骰以使目標陷入「灼傷 2 級」狀態。",
		"desc": "使用者可以短暫點燃自己的拳頭，而不用擔心承受灼傷的危險。但敵人或許就沒那麼幸運了。"
	},
	{
		"name": "火焰旋渦", "alias": "ほのおのうず|Fire Spin",
		"power": "2",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "effect|l|block"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "阻擋。每個戰鬥輪結束時，骰 2 顆傷害骰以對敵人造成傷害。持續 4 輪。",
		"desc": "使用者在場上創造出漩渦狀的旋轉火焰，將敵人困在裡面。"
	},
	{
		"name": "烈焰濺射", "alias": "はじけるほのお|Flame Burst",
		"power": "3",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "在造成傷害之後，使用者可以再骰 1 顆傷害骰以對另外二個目標造成傷害。",
		"desc": "一種聚合濃縮的火球，會在接觸到敵人時爆開，讓小型烈焰紛飛四散。"
	},
	{
		"name": "蓄能焰襲", "alias": "ニトロチャージ|Flame Charge",
		"power": "2",
		"category": "physical",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|self|靈巧|up|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "提升使用者的靈巧。",
		"desc": "寶可夢利用自己的火焰作為推進力以衝撞對手。"
	},
	{
		"name": "火焰輪", "alias": "かえんぐるま|Flame Wheel",
		"power": "2",
		"category": "physical",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|burn1||number|d1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "骰 1 顆機率骰以使目標陷入「灼傷 1 級」狀態。",
		"desc": "使用者將自己包裹在火焰中，然後捲起身體翻滾著撞擊目標。"
	},
	{
		"name": "噴射火焰", "alias": "かえんほうしゃ|Flamethrower",
		"power": "3",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|burn2||number|d1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "骰 1 顆機率骰以使目標陷入「灼傷 2 級」狀態。",
		"desc": "使用者噴出一道強大的火焰，留下焦灼的痕跡。"
	},
	{
		"name": "閃焰衝鋒", "alias": "フレアドライブ|Flare Blitz",
		"power": "5",
		"category": "physical",
		"type": "Fire",
		"tags": ["target|l|foe", "effect|l|recoil", "frame|burn3||number|d3"],
		"accuracy": "力量 + 鬥毆",
		"damage": "力量 + 5",
		"effect": "反作用力傷害。骰 3 顆機率骰以使目標陷入「灼傷 3 級」狀態。",
		"desc": "使用者點燃自己，然後不顧一切地向目標發起猛烈攻擊。"
	},
	{
		"name": "交錯火焰", "alias": "クロスフレイム|Fusion Flare",
		"power": "4*",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|foe", "effect|l|lethal"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 4*",
		"effect": "致命傷害。如果這個戰鬥輪中已經有任何人使用了〈交錯閃電〉招式，則這個招式的傷害骰池將額外增加 4 顆骰子。",
		"desc": "寶可夢將目標困在一道旋轉的火焰柱中，傳說如果附近存在一種特殊的電流的話，火焰柱就會旋轉得更快更高。"
	},
	{
		"name": "高溫重壓", "alias": "ヒートスタンプ|Heat Crash",
		"power": "2*",
		"category": "physical",
		"type": "Fire",
		"tags": ["target|l|foe"],
		"accuracy": "力量 + 鬥毆",
		"damage": "力量 + 2*",
		"effect": "使用者的體重每超過目標 50 公斤，這個招式的傷害骰池就可以額外增加 1 顆骰子。你最多可以透過這個方式增加 4 顆骰子。",
		"desc": "使用者用牠被火包裹的身體重壓目標。"
	},
	{
		"name": "熱風", "alias": "ねっぷう|Heat Wave",
		"power": "3",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|allfoe", "frame|accuracy||down|1", "frame|burn1||number|d1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "以所有範圍內的敵人為目標。骰 1 顆機率骰以使目標陷入「灼傷 1 級」狀態。",
		"desc": "使用者噴出一股巨大的熾熱氣浪，能點燃任何它所接觸到的東西。"
	},
	{
		"name": "燒盡", "alias": "やきつくす|Incinerate",
		"power": "2",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|allfoe"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "以所有範圍內的敵人為目標。摧毀目標持有的任何樹果。",
		"desc": "寶可夢釋放出一股火焰，能在瞬間燒掉任何小型的可燃物品。"
	},
	{
		"name": "煉獄", "alias": "れんごく|Inferno",
		"power": "4",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|accuracy||down|3", "effect|l|lethal", "frame|burn3||always"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 4",
		"effect": "致命傷害。使敵人陷入「灼傷 3 級」狀態。",
		"desc": "寶可夢將敵人點燃。這些竄起的火焰高可達 6 英尺。是一種相當危險的招式。"
	},
	{
		"name": "噴煙", "alias": "ふんえん|Lava Plume",
		"power": "3",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|area", "frame|burn1||number|d3"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "範圍攻擊。骰 3 顆機率骰以使目標陷入「灼傷 1 級」狀態。",
		"desc": "使用者噴出熾熱的火山黑煙，使其散落充斥在戰場周遭。"
	},
	{
		"name": "熔岩風暴", "alias": "マグマストーム|Magma Storm",
		"power": "4",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "effect|l|block"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 4",
		"effect": "阻擋。每個戰鬥輪結束時，骰 3 顆傷害骰以對敵人造成傷害。持續 4 輪。",
		"desc": "寶可夢朝牠的敵人放射出熾熱的熔岩之力。由於無法逃脫且被難以忍受的高溫環繞，敵人可得冒很大的風險才能倖存。"
	},
	{
		"name": "驚爆大頭", "alias": "ビックリヘッド|Mind Blown",
		"power": "6",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|area", "effect|l|recoil"],
		"accuracy": "洞察 + 導引",
		"damage": "特殊 + 6",
		"effect": "範圍攻擊。反作用力傷害。",
		"desc": "寶可夢度過了糟糕透頂的一天且頭痛得厲害，儘量不要打擾牠，因為牠的頭感覺隨時會爆炸。"
	},
	{
		"name": "魔法火焰", "alias": "マジカルフレイム|Mystical Fire",
		"power": "2",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|target|特殊|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 2",
		"effect": "降低敵人的特殊。",
		"desc": "這種魔法火焰不只會灼燒對手，還會吸收牠的力量。"
	},
	{
		"name": "過熱", "alias": "オーバーヒート|Overheat",
		"power": "6",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "effect|l|lethal", "frame|self|特殊|down|2"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 6",
		"effect": "致命傷害。降低使用者的特殊。",
		"desc": "一股猛烈而焦灼烈焰熱浪將會所有接觸到的事物都燒成灰燼，這將讓使用者筋疲力盡。"
	},
	{
		"name": "火焰球", "alias": "かえんボール|Pyro Ball",
		"power": "5",
		"category": "physical",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|accuracy||down|1", "frame|burn2||number|d1"],
		"accuracy": "力量 + 導引",
		"damage": "力量 + 5",
		"effect": "骰 1 顆機率骰以使目標陷入「灼傷 2 級」狀態。",
		"desc": "寶可夢點燃一塊沉重的石頭並在它熊熊燃燒時踢出。這一擊原本就已經夠疼的了，以至於上頭的火焰只不過是錦上添花。"
	},
	{
		"name": "神聖之火", "alias": "せいなるほのお|Sacred Fire",
		"power": "4",
		"category": "physical",
		"type": "Fire",
		"tags": ["target|l|foe", "effect|l|lethal", "frame|burn3||number|d5"],
		"accuracy": "靈巧 + 導引",
		"damage": "力量 + 4",
		"effect": "致命傷害。骰 5 顆機率骰以使目標陷入「灼傷 3 級」狀態。",
		"desc": "一道彩虹色澤的柱狀烈焰席捲敵人，它能燃燒並淨化敵人內心的邪惡。心地純潔的人不應該為此害怕，因為他們不會因此受到傷害。"
	},
	{
		"name": "火焰彈", "alias": "かえんだん|Searing Shot",
		"power": "5",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|allfoe", "effect|l|lethal", "frame|burn2||number|d3"],
		"accuracy": "特殊 + 導引",
		"damage": "特殊 + 5",
		"effect": "致命傷害。以所有範圍內的敵人為目標。骰 3 顆機率骰以使目標陷入「灼傷 2 級」狀態。",
		"desc": "使用者的身邊突然迸發出猩紅色的烈焰並將周圍的一切點燃。所有東西都會在幾秒鐘內化為烏有。"
	},
	{
		"name": "陷阱甲殼", "alias": "トラップシェル|Shell Trap",
		"power": "6",
		"category": "special",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|priority||down|3", "effect|l|lethal"],
		"accuracy": "靈巧 + 隱匿",
		"damage": "特殊 + 6",
		"effect": "後制招式。致命傷害。這個招式會在下一次使用者被非遠程攻擊的物理攻擊命中時發動。",
		"desc": "表面上寶可夢只是把自己埋在地下，但牠其實悄悄的準備好引爆牠的外殼：任何不幸踩到牠的可憐蟲都會被炸成碎片。"
	},
	{
		"name": "熊熊火爆", "alias": "めらめらバーン|Sizzly Slide",
		"power": "3",
		"category": "physical",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|burn1||always"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "使敵人陷入「灼傷 1 級」狀態。如果這個招式的使用者處於最終進化階段，則這個招式自動失敗。",
		"desc": "使用者在地面上如同滑冰一樣四處滑行，只不過牠溜的不是冰，而是熊熊燃燒的大火。"
	},
	{
		"name": "大晴天", "alias": "にほんばれ|Sunny Day",
		"power": "-",
		"category": "support",
		"type": "Fire",
		"tags": ["target|l|field", "weather|l|sun"],
		"accuracy": "特殊 + 自然",
		"damage": "-",
		"effect": "讓天氣狀態在接下來 4 輪期間變為大晴天。",
		"desc": "寶可夢會伴隨著太陽提高環境的溫度，但這在夜晚、室內、地下或水中都無法生效。"
	},
	{
		"name": "Ｖ熱焰", "alias": "Ｖジェネレート|V-create",
		"power": "7",
		"category": "physical",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|self|靈巧|down|1", "frame|self|防禦|down|1", "frame|self|特防|down|1"],
		"accuracy": "力量 + 鬥毆",
		"damage": "力量 + 7",
		"effect": "降低使用者的靈巧、防禦、和特防。",
		"desc": "使用者從前額釋放V形火焰猛擊敵人，並在受到衝擊時引發恐怖的爆炸，並讓使用者在這之後變得脆弱不堪。"
	},
	{
		"name": "鬼火", "alias": "おにび|Will-O-Wisp",
		"power": "-",
		"category": "support",
		"type": "Fire",
		"tags": ["target|l|foe", "frame|accuracy||down|2", "frame|burn1||always"],
		"accuracy": "靈巧 + 導引",
		"damage": "-",
		"effect": "使敵人陷入「灼傷 1 級」狀態。",
		"desc": "使用者召喚出飄浮的火花來干擾敵人。"
	}
]);
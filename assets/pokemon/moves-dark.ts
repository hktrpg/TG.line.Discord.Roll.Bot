// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'MoveList'.
let MoveList;
if(!MoveList) MoveList = []; 
// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports.MoveList = MoveList;

Array.prototype.push.apply(MoveList, [
	{
		"name": "惡意追擊", "alias": "ダメおし|Assurance",
		"power": "2*",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2*",
		"effect": "若使用者在這個戰鬥輪中已經受到過目標造成的傷害，則傷害骰池額外增加 2 顆骰子。(與遊戲效果不同, 等待作者校對)",
		"desc": "使用者對敵人進行報復，腎上腺素的激增使牠的攻擊更加猛烈。"
	},
	{
		"name": "壞壞領域", "alias": "わるわるゾーン|Baddy Bad",
		"power": "3",
		"category": "special",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "若成功，則在接下來 4 個戰鬥輪期間，使用者和所有隊友受到的物理攻擊傷害將會減少 1 點。這個效果不會疊加。如果這個招式的使用者處於最終進化階段，則這個招式自動失敗。",
		"desc": "寶可夢表現得像個惡棍似的，釋放自己的暗黑領域來保護自己和牠的夥伴。"
	},
	{
		"name": "圍攻", "alias": "ふくろだたき|Beat Up",
		"power": "2*",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2*",
		"effect": "若這個攻擊使用成功，則每個協助使用者施展這個招式的寶可夢隊友可以消耗一次行動，以使這個攻擊的傷害骰池額外增加 2 顆骰子。最多 3 個隊友可以參與協助。",
		"desc": "使用者呼喚其他寶可夢來幫助戰鬥，一起圍攻敵人。"
	},
	{
		"name": "咬住", "alias": "かみつく|Bite",
		"power": "2",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe", "frame|flinch||number|d3"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "骰 3 顆機率骰以使敵人陷入「畏縮」狀態。",
		"desc": "使用者狠狠地咬了一口，這可能會留下醜陋的瘀傷。"
	},
	{
		"name": "狂舞揮打", "alias": "ぶんまわす|Brutal Swing",
		"power": "2",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|allfoe", "effect|l|lethal"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "致命傷害。以所有範圍內的敵人為目標。",
		"desc": "寶可夢開始用牠的利爪全力攻擊，任何在牠攻擊路徑上的倒楣蛋都將遭受嚴重的傷害。"
	},
	{
		"name": "咬碎", "alias": "かみくだく|Crunch",
		"power": "3",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe", "effect|l|lethal", "dice|l|1", "frame|target|防禦|down|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "致命傷害。骰 1 顆機率骰以降低敵人的防禦。",
		"desc": "寶可夢用牠的獠牙狠狠撕扯牠咬住的任何東西。"
	},
	{
		"name": "惡之波動", "alias": "あくのはどう|Dark Pulse",
		"power": "3",
		"category": "special",
		"type": "Dark",
		"tags": ["target|l|rfoe", "frame|flinch||number|d2"],
		"accuracy": "洞察 + 導引",
		"damage": "特殊 + 3",
		"effect": "以隨機敵人為目標。骰 2 顆機率骰以使目標陷入「畏縮」狀態。",
		"desc": "寶可夢發出一陣惡意波動來影響那些最為脆弱的對象，傷害牠們，使牠們無法行動。"
	},
	{
		"name": "暗黑洞", "alias": "ダークホール|Dark Void",
		"power": "-",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|allfoe", "frame|accuracy||down|3", "frame|sleep||always"],
		"accuracy": "洞察 + 導引",
		"damage": "-",
		"effect": "以所有範圍內的敵人為目標。使目標陷入「睡眠」狀態。",
		"desc": "一道傳送門被打開，並把所有敵人拖入一個黑暗的世界。牠們在裡面什麼也看不見、也感覺不到任何東西，就彷彿被困在了永恆的沉睡之中。"
	},
	{
		"name": "DD金勾臂", "alias": "DDラリアット|Darkest Lariat",
		"power": "3",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "無視敵人身上任何會降低這個招式傷害的特質增益。",
		"desc": "使用者揮舞雙臂來攻擊目標，沒有任何護甲厚到足以抵禦這記重擊。"
	},
	{
		"name": "查封", "alias": "さしおさえ|Embargo",
		"power": "-",
		"category": "support",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "強壯 + 威嚇",
		"damage": "-",
		"effect": "目標將無法使用牠的攜帶物品，牠的訓練家也無法對牠使用道具。",
		"desc": "使用者快速奪走了對方寶可夢持有的物品，同時清空了訓練家的背包並強迫所有人遠離他們的財產。惡霸們特別熟練於這個招式。"
	},
	{
		"name": "假哭", "alias": "うそなき|Fake Tears",
		"power": "-",
		"category": "support",
		"type": "Dark",
		"tags": ["target|l|foe", "frame|target|特防|down|2"],
		"accuracy": "可愛 + 誘惑",
		"damage": "-",
		"effect": "降低敵人的特防。",
		"desc": "使用者停止戰鬥並假裝哭泣，干擾敵人的戰鬥情緒並降低警惕。"
	},
	{
		"name": "假跪真撞", "alias": "どげざつき|False Surrender",
		"power": "3",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe", "effect|l|neverfail"],
		"accuracy": "洞察 + 誘惑",
		"damage": "力量 + 3",
		"effect": "必中。",
		"desc": "寶可夢裝作彎腰認輸、請求原諒的樣子，然後再背刺牠那容易上當的敵人。"
	},
	{
		"name": "出奇一擊", "alias": "だましうち|Feint Attack",
		"power": "2",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe", "effect|l|neverfail"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "必中。",
		"desc": "寶可夢不帶敵意地靠近對手，然後趁其不備發動襲擊。"
	},
	{
		"name": "吹捧", "alias": "おだてる|Flatter",
		"power": "-",
		"category": "support",
		"type": "Dark",
		"tags": ["target|l|foe", "frame|confuse||always", "frame|target|特殊|down|1"],
		"accuracy": "帥氣 + 誘惑",
		"damage": "-",
		"effect": "降低敵人的特殊。使敵人陷入「混亂」狀態。",
		"desc": "使用者開始吹捧並讚美牠的對手，降低對方的注意力並讓牠不確定下一步該做什麼。"
	},
	{
		"name": "投擲", "alias": "なげつける|Fling",
		"power": "1*",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1*",
		"effect": "遠程攻擊。取決於被丟出的攜帶物品，將傷害骰池額外增加最多 4 顆骰子。參見招式規則。",
		"desc": "使用者將牠攜帶的道具扔向對手。或許你能在戰鬥之後把它撿回來。"
	},
	{
		"name": "欺詐", "alias": "イカサマ|Foul Play",
		"power": "3",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "敵人的力量 + 3",
		"effect": "這個招式的傷害會適用使用者的屬性一致加成，但使用敵人的力量來計算。",
		"desc": "使用者發起佯攻，並愚弄敵人使其最終傷到自己。"
	},
	{
		"name": "磨爪", "alias": "つめとぎ|Hone Claws",
		"power": "-",
		"category": "support",
		"type": "Dark",
		"tags": ["target|l|self", "frame|self|力量|up|1", "frame|self|命中|up|1"],
		"accuracy": "洞察 + 自然",
		"damage": "-",
		"effect": "提升使用者的力量和命中。",
		"desc": "寶可夢磨利牠的爪子來施展更精確的攻擊。"
	},
	{
		"name": "異次元猛攻", "alias": "いじげんラッシュ|Hyperspace Fury",
		"power": "4",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe", "frame|self|防禦|down|1", "effect|l|neverfail"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 4",
		"effect": "必中。無視任何敵人使用的護盾招式的效果。降低使用者的防禦。",
		"desc": "寶可夢打開數個異次元洞並用牠的每一隻手臂進行攻擊，繞過所有防禦使對方失去逃脫的可能。然而，使用者將因此忽視自己的防禦。"
	},
	{
		"name": "緊咬不放", "alias": "くらいつく|Jaw Lock",
		"power": "3",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe", "effect|l|block"],
		"accuracy": "力量 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "使用者和目標都被阻擋。",
		"desc": "使用者用牠的下顎緊緊咬住敵人，無論你怎麼嘗試也無法將牠們分開，只有在牠的受害者陷入瀕死狀態時牠才會鬆口。"
	},
	{
		"name": "拍落", "alias": "はたきおとす|Knock Off",
		"power": "2",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "目標寶可夢失去牠持有的攜帶物品。",
		"desc": "寶可夢快速地拍打擊落敵人持有的任何東西。"
	},
	{
		"name": "臨別禮物", "alias": "おきみやげ|Memento",
		"power": "-",
		"category": "support",
		"type": "Dark",
		"tags": ["target|l|foe", "frame|target|力量|down|2", "frame|target|特殊|down|2", "frame|target|靈巧|down|2", "frame|target|防禦|down|2", "frame|target|特防|down|2"],
		"accuracy": "意志 + 導引",
		"damage": "-",
		"effect": "使用者陷入瀕死狀態。降低敵人的力量、特殊、靈巧、防禦、和特防，持續一整個場景。",
		"desc": "使用者釋放出牠剩下的所有力量，使敵人的思想與靈魂被絕望的想法給籠罩。目標將因此陷入憂鬱。"
	},
	{
		"name": "詭計", "alias": "わるだくみ|Nasty Plot",
		"power": "-",
		"category": "support",
		"type": "Dark",
		"tags": ["target|l|self", "frame|self|特殊|up|2"],
		"accuracy": "聰明 + 警覺",
		"damage": "-",
		"effect": "提升使用者的特殊。",
		"desc": "寶可夢開始謀劃如何擊敗敵人。牠邪惡的笑聲暴露了牠的惡意。"
	},
	{
		"name": "暗黑爆破", "alias": "ナイトバースト|Night Daze",
		"power": "3",
		"category": "special",
		"type": "Dark",
		"tags": ["target|l|foe", "dice|l|4", "frame|target|命中|down|1"],
		"accuracy": "靈巧 + 導引",
		"damage": "特殊 + 3",
		"effect": "骰 4 顆機率骰以降低敵人的命中。",
		"desc": "使用者形塑出一股能夠傷害敵人的黑色巨浪。這股黑暗可能會留下並阻礙目標的視線。"
	},
	{
		"name": "暗襲要害", "alias": "つじぎり|Night Slash",
		"power": "3",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe", "effect|l|lethal", "effect|l|crit"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "致命傷害。容易擊中要害。",
		"desc": "一但有可乘之機，使用者便會朝敵人發起猛攻。這種直取目標性命的意圖實在令人恐懼。"
	},
	{
		"name": "攔堵", "alias": "ブロッキング|Obstruct",
		"power": "-",
		"category": "support",
		"type": "Dark",
		"tags": ["target|l|self", "frame|priority||up|4", "effect|l|shield", "frame|target|防禦|down|2"],
		"accuracy": "靈巧 + 威嚇",
		"damage": "-",
		"effect": "先制招式。護盾。若敵人對使用者使用了非遠程的物理招式攻擊，則降低敵人的防禦。",
		"desc": "使用者魯莽行事，衝向敵人以攔阻對方的行動並擋下牠的攻勢。如此近的距離足以讓使用者觸及敵人的要害。"
	},
	{
		"name": "拋下狠話", "alias": "すてゼリフ|Parting Shot",
		"power": "-",
		"category": "support",
		"type": "Dark",
		"tags": ["target|l|foe", "frame|target|力量|down|1", "frame|target|特殊|down|1", "effect|l|switcher"],
		"accuracy": "強壯 + 威嚇",
		"damage": "-",
		"effect": "替換招式。降低敵人的力量和特殊，使用者被換下場。替換的寶可夢將在有所準備的狀況下上場，擲骰決定牠的先攻。",
		"desc": "使用者威脅敵人，讓其過於恐懼以至於不能追擊使用者或攻擊使用者剛剛上場的同伴。"
	},
	{
		"name": "以牙還牙", "alias": "しっぺがえし|Payback",
		"power": "2*",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2*",
		"effect": "如果目標在這個戰鬥輪中已經對你造成過的傷害，則傷害骰池額外增加 2 顆骰子。",
		"desc": "寶可夢挾帶著怨恨和復仇的心理來對付目標。"
	},
	{
		"name": "囂張", "alias": "つけあがる|Power Trip",
		"power": "1*",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1*",
		"effect": "使用者身上的每一點特質增益都將使這個招式的傷害骰池額外增加 1 顆骰子。你最多可以透過這個方式增加 7 顆骰子。（例如：使用者的防禦特質增加了 2 點，那麼這個攻擊的傷害骰池將因此 +2 骰子）",
		"desc": "在激烈的戰鬥中，寶可夢忘乎所以，沉浸在自己的力量之中。"
	},
	{
		"name": "懲罰", "alias": "おしおき|Punishment",
		"power": "1*",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 1*",
		"effect": "敵人身上的每一點特質增益都將使這個招式的傷害骰池額外增加 1 顆骰子。你最多可以透過這個方式增加 7 顆骰子。（例如：敵人的靈巧和力量特質各增加了 1 點，那麼這個攻擊的傷害骰池將因此 +2 骰子）",
		"desc": "使用者充分利用了敵人的力量來對付牠們自己。"
	},
	{
		"name": "追打", "alias": "おいうち|Pursuit",
		"power": "2*",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe", "frame|priority||up|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2*",
		"effect": "如果敵人被換下場或逃跑，則傷害骰池額外增加 2 顆骰子，且這個招式變為先制招式。",
		"desc": "寶可夢追打敵人並在牠逃離前給予最後一擊。"
	},
	{
		"name": "延後", "alias": "さきおくり|Quash",
		"power": "-",
		"category": "support",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "強壯 + 威嚇",
		"damage": "-",
		"effect": "在這個場景期間，目標在先攻順序中的位置將變為最後一個。",
		"desc": "使用者透過恐嚇來給敵人施壓，使牠不得不在行動前思慮再三。"
	},
	{
		"name": "大聲咆哮", "alias": "バークアウト|Snarl",
		"power": "2",
		"category": "special",
		"type": "Dark",
		"tags": ["target|l|foe", "frame|target|特殊|down|1", "effect|l|sound"],
		"accuracy": "洞察 + 表演",
		"damage": "特殊 + 2",
		"effect": "聲音類招式。降低敵人的特殊。",
		"desc": "寶可夢惡狠狠地咆哮著並露出牠的利齒。這兇惡的表情將使敵人因恐懼而退縮。"
	},
	{
		"name": "搶奪", "alias": "よこどり|Snatch",
		"power": "-",
		"category": "support",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "聰明 + 隱匿",
		"damage": "-",
		"effect": "消除敵人身上的所有增益和減益效果，並將之轉移到使用者身上。",
		"desc": "使用者分析了敵人的優勢，並把其轉為自己的。"
	},
	{
		"name": "突襲", "alias": "ふいうち|Sucker Punch",
		"power": "3",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe", "frame|priority||up|1"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "這個招式只能在目標使用傷害類招式時使用。（若目標使用了傷害類招式，則這個招式變為先制招式。）",
		"desc": "當敵人正在準備攻擊時，使用者搶佔先機並提前出擊。"
	},
	{
		"name": "掉包", "alias": "すりかえ|Switcheroo",
		"power": "-",
		"category": "support",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "洞察 + 隱匿",
		"damage": "-",
		"effect": "使用者和敵人交換牠們持有的攜帶物品。如果只有其中一方持有物品，則牠直接把該物品給出去。",
		"desc": "使用者在敵人反應過來之前迅速地交換了雙方的攜帶物品。"
	},
	{
		"name": "挑釁", "alias": "ちょうはつ|Taunt",
		"power": "-",
		"category": "support",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "強壯 + 威嚇",
		"damage": "-",
		"effect": "目標在接下來 4 個戰鬥輪期間，將只能夠使用傷害類招式和閃避。",
		"desc": "使用者嘲諷並挑釁對方，使其狂怒採取攻勢。"
	},
	{
		"name": "小偷", "alias": "どろぼう|Thief",
		"power": "2",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 2",
		"effect": "使用者偷走目標持有的攜帶物品。",
		"desc": "寶可夢攻擊牠的敵人，並抓準時機偷走目標攜帶的任何東西。"
	},
	{
		"name": "地獄突刺", "alias": "じごくづき|Throat Chop",
		"power": "3",
		"category": "physical",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "靈巧 + 鬥毆",
		"damage": "力量 + 3",
		"effect": "在這個場景期間，目標將無法在使用任何「聲音類招式」。",
		"desc": "一記朝敵方寶可夢的喉嚨發動的地獄打擊，使敵人在接下來數小時內都發不出聲音。"
	},
	{
		"name": "顛倒", "alias": "ひっくりかえす|Topsy-Turvy",
		"power": "-",
		"category": "support",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "強壯 + 威嚇",
		"damage": "-",
		"effect": "任何敵人身上的特質減益都將變為增益，特質增益也都將變為減益。",
		"desc": "使用者改變了目標的性質，使壞事變為好事、好事變為壞事。"
	},
	{
		"name": "無理取鬧", "alias": "いちゃもん|Torment",
		"power": "-",
		"category": "support",
		"type": "Dark",
		"tags": ["target|l|foe"],
		"accuracy": "強壯 + 威嚇",
		"damage": "-",
		"effect": "目標將無法使用牠在上一個戰鬥輪中使用過的相同招式。持續 4 輪。",
		"desc": "使用者無理取鬧並激怒敵人，使對手無法繼續執行牠的戰術。"
	}
]);
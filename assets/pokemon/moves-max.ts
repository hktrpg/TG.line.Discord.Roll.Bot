// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'MoveList'.
let MoveList;
if(!MoveList) MoveList = []; 
// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports.MoveList = MoveList;

Array.prototype.push.apply(MoveList, [
	{
		"name": "極巨蟲蠱", "alias": "ダイワーム|Max Flutterby",
		"power": "+2",
		"category": "hybrid",
		"type": "Bug",
		"tags": ["target|l|foe", "frame|target|特殊|down|1"],
		"gmax-tags": ["target|l|allfoe", "frame|sleep||number|d3", "frame|paralysis||number|d3", "frame|poison||number|d3", "pdice|l|2", "text|l|蟲系招式|Bug"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "降低目標的特殊。",
		"desc": "They say that the flutter of a butterfly can cause a hurricane in another part of the world. With this Max Move it can cause it right where it stands."
	},
	{
		"name": "極巨惡霸", "alias": "ダイアーク|Max Darkness",
		"power": "+2",
		"category": "hybrid",
		"type": "Dark",
		"tags": ["target|l|foe", "frame|target|特防|down|1"],
		"gmax-tags": ["target|l|allfoe", "frame|sleep||number|d3", "frame|flinch||number|d3", "pdice|l|2", "effect|l|lethal", "text|l|惡系招式|Dark"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "降低目標的特防。",
		"desc": "With its giganic size, the Pokémon blocks all sunlight around as if night suddenly fell upon the arena. Even after light returns you feel part of you was left in the abyss."
	},
	{
		"name": "極巨龍騎", "alias": "ダイドラグーン|Max Wyrmwind",
		"power": "+2",
		"category": "hybrid",
		"type": "Dragon",
		"tags": ["target|l|foe", "frame|target|力量|down|1"],
		"gmax-tags": ["target|l|allfoe", "effect|l|lethal", "frame|flinch||number|d3", "frame|self|特質|up|1", "frame|target|意志點|down|1", "text|l|龍系招式|Dragon"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "降低目標的力量。",
		"desc": "With a deafening roar and an explosive blast of pure rage this giant pokémon is hungry for destruction. No rest, no mercy, no matter what."
	},
	{
		"name": "極巨閃電", "alias": "ダイサンダー|Max Lightning",
		"power": "+2",
		"category": "hybrid",
		"type": "Electric",
		"tags": ["target|l|foe", "text|l|電氣場地|Electric"],
		"gmax-tags": ["target|l|allfoe", "frame|paralysis||always", "frame||異常狀態|always", "effect|l|block", "frame|self|傷害|plus|d1", "text|l|電系招式|Electric"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "發動電氣場地的效果。持續 4 個戰鬥輪。",
		"desc": "An extremely dangerous lightning storm flashes through the arena, a single use of this Max Move could energize a city for weeks if not months at a time."
	},
	{
		"name": "極巨妖精", "alias": "ダイフェアリー|Max Starfall",
		"power": "+2",
		"category": "hybrid",
		"type": "Fairy",
		"tags": ["target|l|foe", "text|l|薄霧場地|Fairy"],
		"gmax-tags": ["target|l|allfoe", "target|l|allally", "frame|heal||heal|2", "frame|confuse||always", "frame|love||always", "text|l|妖精招式|Fairy"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "發動薄霧場地的效果。持續 4 個戰鬥輪。",
		"desc": "A shooting star in the night sky will make a wish come true. A thousand shooting stars in the battlefield must be a lot more efficient, right?"
	},
	{
		"name": "極巨拳鬥", "alias": "ダイナックル|Max Knuckle",
		"power": "+2",
		"category": "hybrid",
		"type": "Fight",
		"tags": ["target|l|foe", "target|l|allally", "frame|self|力量|up|1"],
		"gmax-tags": ["target|l|allfoe", "effect|l|crit", "frame|self|傷害|plus|d2", "frame|self|特質|down|never", "frame|flinch||number|d3", "text|l|格鬥招式|Fight"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "提升使用者和範圍內所有隊友的力量。",
		"desc": "Either through sheer muscle power or through focusing its inner chi, this giant Pokémon can pack a punch that will leave its poor victim splat into the ground."
	},
	{
		"name": "極巨火爆", "alias": "ダイバーン|Max Flare",
		"power": "+2",
		"category": "hybrid",
		"type": "Fire",
		"tags": ["target|l|foe", "weather|l|sun"],
		"gmax-tags": ["target|l|allfoe", "weather|l|sun2", "text|l|無視特性", "frame|burn3||number|d3", "effect|l|block", "text|l|火系招式|Fire"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "發動大晴天天氣狀態的效果。持續 4 個戰鬥輪。",
		"desc": "Even at night, the fiery flames comming out of this Pokémon light up the sky. This Max Move is an onslaught of heat that is definitely not good for the environment."
	},
	{
		"name": "極巨飛衝", "alias": "ダイジェット|Max Airstream",
		"power": "+2",
		"category": "hybrid",
		"type": "Flying",
		"tags": ["target|l|foe",  "target|l|allally", "frame|self|靈巧|up|1"],
		"gmax-tags": ["target|l|allfoe", "weather|l|wind", "effect|l|crit", "frame|self|特質|down|never", "frame|heal|治療狀態|always", "text|l|飛行招式|Flying"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "提升使用者和範圍內所有隊友的靈巧。",
		"desc": "Wind has two extremes, you are either with it or against it. It will be benevolent with its allies and ruthless with its enemies, blowing away any resistance."
	},
	{
		"name": "極巨幽魂", "alias": "ダイホロウ|Max Phantasm",
		"power": "+2",
		"category": "hybrid",
		"type": "Ghost",
		"tags": ["target|l|foe", "frame|target|防禦|down|1"],
		"gmax-tags": ["target|l|allfoe", "effect|l|lethal", "frame|flinch||number|d3", "effect|l|block", "frame|target|意志點|down|1", "text|l|幽靈招式|Ghost"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "降低目標的防禦。",
		"desc": "The energy that creates nightmares floods the arena like a shadow, by the time this Max Move is casted is already too late, be prepared to suffer night terrors for weeks... if you survive."
	},
	{
		"name": "極巨草原", "alias": "ダイソウゲン|Max Overgrowth",
		"power": "+2",
		"category": "hybrid",
		"type": "Grass",
		"tags": ["target|l|foe", "text|l|青草場地|Grass"],
		"gmax-tags": ["target|l|allfoe", "frame|target|靈巧|down|1", "text|l|無視特性", "frame|heal|治療狀態|always", "frame|target|閃避|down|1", "text|l|草系招式|Grass"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "發動青草場地的效果。持續 4 個戰鬥輪。",
		"desc": "Nature becomes an entity of its own under this enormous Pokémon command, there is no stopping this burst of life coming violently from the ground."
	},
	{
		"name": "極巨大地", "alias": "ダイアース|Max Quake",
		"power": "+2",
		"category": "hybrid",
		"type": "Ground",
		"tags": ["target|l|foe", "target|l|allally", "frame|self|特防|up|1"],
		"gmax-tags": ["target|l|allfoe", "frame|self|傷害|plus|d2", "effect|l|block", "effect|l|crit", "text|l|無視特性", "text|l|地面招式|Ground"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "提升使用者和範圍內所有隊友的特防。",
		"desc": "A trerrible quake shakes the earth to its very core, there are reports of nearby cities reporting aftershocks after this Max Move is used in the arena."
	},
	{
		"name": "極巨寒冰", "alias": "ダイアイス|Max Hailstorm",
		"power": "+2",
		"category": "hybrid",
		"type": "Ice",
		"tags": ["target|l|foe", "weather|l|hail"],
		"gmax-tags": ["target|l|allfoe", "effect|l|lethal", "frame|frozen||number|d3", "pdice|l|2", "effect|l|block", "text|l|冰系招式|Ice"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "發動冰雹天氣狀態的效果。持續 4 個戰鬥輪。",
		"desc": "A harsh blizzard is unleashed and the temperature drops below zero in the whole city. Revenge is a dish best served with this Max Move."
	},
	{
		"name": "極巨攻擊", "alias": "ダイアタック|Max Strike",
		"power": "+2",
		"category": "hybrid",
		"type": "Normal",
		"tags": ["target|l|foe", "frame|target|靈巧|down|1"],
		"gmax-tags": ["target|l|allfoe", "effect|l|lethal", "frame|paralysis||number|d3", "frame|self|特質|up|1", "frame|self|傷害|plus|d2", "text|l|一般招式|Normal"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "降低目標的靈巧。",
		"desc": "Normal types are often disregarded as weak, unimpressive, plain, and over all second-rate. Normal types have had enough of everyone’s Tauros’ waste."
	},
	{
		"name": "極巨酸毒", "alias": "ダイアシッド|Max Ooze",
		"power": "+2",
		"category": "hybrid",
		"type": "Poison",
		"tags": ["target|l|foe", "target|l|allally", "frame|self|特殊|up|1"],
		"gmax-tags": ["target|l|allfoe", "frame|poison2||number|d3", "frame|burn1||number|d3", "frame|target|特質|down|1", "effect|l|lethal", "text|l|毒系招式|Poison"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "提升使用者和範圍內所有隊友的特殊。",
		"desc": "A virulent and corrosive ooze floods the arena, the stench is so pungent it makes everyone sick. Whole towns have had to be evacuated for cleaning tasks after this Max Move was used."
	},
	{
		"name": "極巨超能", "alias": "イサイコ|Max Mindstorm",
		"power": "+2",
		"category": "hybrid",
		"type": "Psychic",
		"tags": ["target|l|foe", "text|l|精神場地|Psychic"],
		"gmax-tags": ["target|l|allfoe", "text|l|無視特性", "frame|sleep||number|d3", "frame|confuse||always", "effect|l|neverfail", "text|l|超能招式|Psychic"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "發動精神場地的效果。持續 4 個戰鬥輪。",
		"desc": "This Max Move targets the only place the foe cannot escape, through a psychic assault it can melt the mind of its enemies, leaving them in a catatonic state for weeks."
	},
	{
		"name": "極巨岩石", "alias": "ダイロック|Max Rockfall",
		"power": "+2",
		"category": "hybrid",
		"type": "Rock",
		"tags": ["target|l|foe", "weather|l|sand"],
		"gmax-tags": ["target|l|allfoe", "effect|l|lethal", "frame|flinch||number|d3", "frame|self|傷害|plus|d2", "frame|target|特質|down|1", "text|l|岩石招式|Rock"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "發動沙暴天氣狀態的效果。持續 4 個戰鬥輪。",
		"desc": "A tsunami of rubble falls towards the target. With no escape in sight, it is trapped between a rock and a hard place and more rocks. Oh! so many more rocks."
	},
	{
		"name": "極巨鋼鐵", "alias": "ダイスチル|Max Steelspike",
		"power": "+2",
		"category": "hybrid",
		"type": "Steel",
		"tags": ["target|l|foe", "target|l|allally", "frame|self|防禦|up|1"],
		"gmax-tags": ["target|l|allfoe", "frame|self|特質|down|never", "frame|flinch||number|d3", "frame|self|受到傷害|minus|2", "frame|self|傷害|plus|d2", "text|l|鋼系招式|Steel"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "提升使用者和範圍內所有隊友的防禦。",
		"desc": "The Pokémon calls upon large sharp pikes of steel that pierce everything on their way. Although incredibly destructive, the steel plates left in the field provide a sturdy cover. "
	},
	{
		"name": "極巨水流", "alias": "ダイストリーム|Max Geyser",
		"power": "+2",
		"category": "hybrid",
		"type": "Water",
		"tags": ["target|l|foe", "weather|l|rain"],
		"gmax-tags": ["target|l|allfoe", "weather|l|rain2", "text|l|無視特性", "frame|target|特質|down|1", "frame|burn1||number|d3", "text|l|水系招式|Water"],
		"accuracy": "原招式命中 + 2",
		"damage": "力量/特殊 + 原招式傷害 + 2",
		"effect": "發動下雨天氣狀態的效果。持續 4 個戰鬥輪。",
		"desc": "Boiling water spouts from a geyser right below the target, the water is shot so high up it comes down as rain for the next few days."
	}
]);
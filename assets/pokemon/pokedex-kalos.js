var Pokedex;
if(!Pokedex) Pokedex = [];

Array.prototype.push.apply(Pokedex, [
{
  "id": "650",
  "region": "kalos",
  "name": "哈力栗",
  "alias": "Chespin",
  "type": [ "Grass" ],
  "info": {
    "image": "images/pokedex/650.png",
    "height": "0.4",
    "weight": "9",
    "category": "刺栗寶可夢",
    "text": "嬌小且好奇心旺盛的寶可夢。牠們很少見，但牠們的巢曾在栗樹上被發現。牠們的頭被尖刺給包覆，如果遇到威脅，牠們就會滾成球來保護自己。"
  },
  "evolution": {
    "stage": "first",
    "time": "medium"
  },
  "baseHP": 3,
  "rank": 0,
  "attr": {
    "str": { "value": 2, "max": 4 },
    "dex": { "value": 1, "max": 3 },
    "vit": { "value": 2, "max": 4 },
    "spe": { "value": 2, "max": 4 },
    "ins": { "value": 2, "max": 4 }
  },
  "ability": [ "茂盛" ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "叫聲" },
    { "rank": 0, "type": "Normal", "name": "撞擊" },
    { "rank": 1, "type": "Dark", "name": "咬住" },
    { "rank": 1, "type": "Grass", "name": "藤鞭" },
    { "rank": 1, "type": "Rock", "name": "滾動" },
    { "rank": 2, "type": "Normal", "name": "猛撞" },
    { "rank": 2, "type": "Bug", "name": "飛彈針" },
    { "rank": 2, "type": "Fight", "name": "健美" },
    { "rank": 2, "type": "Grass", "name": "寄生種子" },
    { "rank": 2, "type": "Grass", "name": "種子炸彈" },
    { "rank": 2, "type": "Ground", "name": "泥巴射擊" },
    { "rank": 3, "type": "Normal", "name": "泰山壓頂" },
    { "rank": 3, "type": "Normal", "name": "分擔痛楚" },
    { "rank": 3, "type": "Grass", "name": "木槌" },
    { "rank": 4, "type": "Normal", "name": "憤怒門牙" },
    { "rank": 4, "type": "Fight", "name": "吸取拳" },
    { "rank": 4, "type": "Grass", "name": "草之誓約" }
  ],
  "isNovice": true
},
{
  "id": "651",
  "region": "kalos",
  "name": "胖胖哈力",
  "alias": "Quilladin",
  "type": [ "Grass" ],
  "info": {
    "image": "images/pokedex/651.png",
    "height": "0.7",
    "weight": "29",
    "category": "刺鎧寶可夢",
    "text": "牠透過碰撞堅固的東西來鍛鍊下盤。牠是個性溫和的寶可夢，靠著覆蓋身體的結實外殼和尖銳的刺來反彈敵人的攻擊。牠們絕不會主動挑起戰鬥。"
  },
  "evolution": {
    "stage": "second",
    "time": "medium"
  },
  "baseHP": 4,
  "rank": 2,
  "attr": {
    "str": { "value": 2, "max": 5 },
    "dex": { "value": 2, "max": 4 },
    "vit": { "value": 3, "max": 6 },
    "spe": { "value": 2, "max": 4 },
    "ins": { "value": 2, "max": 4 }
  },
  "ability": [ "茂盛" ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "叫聲" },
    { "rank": 0, "type": "Normal", "name": "撞擊" },
    { "rank": 1, "type": "Dark", "name": "咬住" },
    { "rank": 1, "type": "Grass", "name": "藤鞭" },
    { "rank": 1, "type": "Rock", "name": "滾動" },
    { "rank": 2, "type": "Normal", "name": "猛撞" },
    { "rank": 2, "type": "Bug", "name": "飛彈針" },
    { "rank": 2, "type": "Fight", "name": "健美" },
    { "rank": 2, "type": "Grass", "name": "種子炸彈" },
    { "rank": 2, "type": "Grass", "name": "尖刺臂" },
    { "rank": 2, "type": "Grass", "name": "寄生種子" },
    { "rank": 2, "type": "Ground", "name": "泥巴射擊" },
    { "rank": 3, "type": "Normal", "name": "分擔痛楚" },
    { "rank": 3, "type": "Normal", "name": "泰山壓頂" },
    { "rank": 3, "type": "Grass", "name": "木槌" },
    { "rank": 4, "type": "Fight", "name": "吸取拳" },
    { "rank": 4, "type": "Grass", "name": "草之誓約" },
    { "rank": 4, "type": "Steel", "name": "鐵壁" }
  ]
},
{
  "id": "652",
  "region": "kalos",
  "name": "布里卡隆",
  "alias": "Chesnaught",
  "type": [ "Grass", "Fight" ],
  "info": {
    "image": "images/pokedex/652.png",
    "height": "1.6",
    "weight": "90",
    "category": "刺鎧寶可夢",
    "text": "這種寶可夢以偏好防禦姿態而非衝進戰鬥而聞名。許多故事講述著在古代戰爭期間，布里卡隆是如何把自身當成護盾保護夥伴。"
  },
  "evolution": {
    "stage": "final"
  },
  "baseHP": 5,
  "rank": 3,
  "attr": {
    "str": { "value": 3, "max": 6 },
    "dex": { "value": 2, "max": 4 },
    "vit": { "value": 3, "max": 7 },
    "spe": { "value": 2, "max": 5 },
    "ins": { "value": 2, "max": 5 }
  },
  "ability": [ "茂盛" ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "撞擊" },
    { "rank": 0, "type": "Fight", "name": "健美" },
    { "rank": 1, "type": "Normal", "name": "叫聲" },
    { "rank": 1, "type": "Dark", "name": "咬住" },
    { "rank": 1, "type": "Grass", "name": "藤鞭" },
    { "rank": 2, "type": "Normal", "name": "佯攻" },
    { "rank": 2, "type": "Normal", "name": "泰山壓頂" },
    { "rank": 2, "type": "Normal", "name": "猛撞" },
    { "rank": 2, "type": "Bug", "name": "飛彈針" },
    { "rank": 2, "type": "Grass", "name": "尖刺防守" },
    { "rank": 2, "type": "Grass", "name": "種子炸彈" },
    { "rank": 2, "type": "Grass", "name": "尖刺臂" },
    { "rank": 2, "type": "Grass", "name": "寄生種子" },
    { "rank": 2, "type": "Ground", "name": "泥巴射擊" },
    { "rank": 2, "type": "Rock", "name": "滾動" },
    { "rank": 3, "type": "Normal", "name": "腹鼓" },
    { "rank": 3, "type": "Normal", "name": "分擔痛楚" },
    { "rank": 3, "type": "Normal", "name": "終極衝擊" },
    { "rank": 3, "type": "Fight", "name": "臂錘" },
    { "rank": 3, "type": "Grass", "name": "木槌" },
    { "rank": 4, "type": "Dragon", "name": "二連劈" },
    { "rank": 4, "type": "Grass", "name": "光合作用" },
    { "rank": 4, "type": "Grass", "name": "瘋狂植物" }
  ]
},
{
  "id": "653",
  "region": "kalos",
  "name": "火狐狸",
  "alias": "Fennekin",
  "type": [ "Fire" ],
  "info": {
    "image": "images/pokedex/653.png",
    "height": "0.4",
    "weight": "9",
    "category": "狐狸寶可夢",
    "text": "This small and elusive Pokémon intimidates opponents by puffing hot air out of its ears. It likes to keep twigs and sticks nearby to munch them instead of snacks. They make good pets but they are pretty rare."
  },
  "evolution": {
    "stage": "first",
    "time": "medium"
  },
  "baseHP": 3,
  "rank": 0,
  "attr": {
    "str": { "value": 2, "max": 4 },
    "dex": { "value": 2, "max": 4 },
    "vit": { "value": 1, "max": 3 },
    "spe": { "value": 2, "max": 4 },
    "ins": { "value": 2, "max": 4 }
  },
  "ability": [ "猛火" ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "搖尾巴" },
    { "rank": 0, "type": "Normal", "name": "抓" },
    { "rank": 1, "type": "Normal", "name": "長嚎" },
    { "rank": 1, "type": "Fire", "name": "火花" },
    { "rank": 2, "type": "Normal", "name": "幸運咒語" },
    { "rank": 2, "type": "Fire", "name": "鬼火" },
    { "rank": 2, "type": "Fire", "name": "噴射火焰" },
    { "rank": 2, "type": "Fire", "name": "火焰旋渦" },
    { "rank": 2, "type": "Fire", "name": "蓄能焰襲" },
    { "rank": 2, "type": "Psychic", "name": "精神衝擊" },
    { "rank": 2, "type": "Psychic", "name": "幻象光線" },
    { "rank": 2, "type": "Psychic", "name": "光牆" },
    { "rank": 3, "type": "Fire", "name": "大字爆炎" },
    { "rank": 3, "type": "Fire", "name": "大晴天" },
    { "rank": 3, "type": "Psychic", "name": "魔法空間" },
    { "rank": 3, "type": "Psychic", "name": "精神強念" },
    { "rank": 4, "type": "Normal", "name": "祈願" },
    { "rank": 4, "type": "Fire", "name": "火之誓約" },
    { "rank": 4, "type": "Psychic", "name": "催眠術" }
  ],
  "isNovice": true
},
{
  "id": "654",
  "region": "kalos",
  "name": "長尾火狐",
  "alias": "Braixen",
  "type": [ "Fire" ],
  "info": {
    "image": "images/pokedex/654.png",
    "height": "1.0",
    "weight": "14",
    "category": "狐狸寶可夢",
    "text": "Using friction from its tail fur, it sets the twig it carries on fire and launches into battle. The flame on the twig is used to send signals and to create patters out of the embers.  It is said the twig is a magic wand."
  },
  "evolution": {
    "stage": "second",
    "time": "medium"
  },
  "baseHP": 4,
  "rank": 2,
  "attr": {
    "str": { "value": 2, "max": 4 },
    "dex": { "value": 2, "max": 5 },
    "vit": { "value": 2, "max": 4 },
    "spe": { "value": 2, "max": 5 },
    "ins": { "value": 2, "max": 5 }
  },
  "ability": [ "猛火" ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "搖尾巴" },
    { "rank": 0, "type": "Normal", "name": "抓" },
    { "rank": 1, "type": "Normal", "name": "長嚎" },
    { "rank": 1, "type": "Fire", "name": "火花" },
    { "rank": 2, "type": "Normal", "name": "幸運咒語" },
    { "rank": 2, "type": "Fire", "name": "鬼火" },
    { "rank": 2, "type": "Fire", "name": "噴射火焰" },
    { "rank": 2, "type": "Fire", "name": "火焰旋渦" },
    { "rank": 2, "type": "Fire", "name": "蓄能焰襲" },
    { "rank": 2, "type": "Psychic", "name": "精神衝擊" },
    { "rank": 2, "type": "Psychic", "name": "幻象光線" },
    { "rank": 2, "type": "Psychic", "name": "光牆" },
    { "rank": 3, "type": "Fire", "name": "大字爆炎" },
    { "rank": 3, "type": "Fire", "name": "大晴天" },
    { "rank": 3, "type": "Psychic", "name": "魔法空間" },
    { "rank": 3, "type": "Psychic", "name": "精神強念" },
    { "rank": 4, "type": "Normal", "name": "祈願" },
    { "rank": 4, "type": "Fire", "name": "火之誓約" },
    { "rank": 4, "type": "Psychic", "name": "奇妙空間" }
  ]
},
{
  "id": "655",
  "region": "kalos",
  "name": "妖火紅狐",
  "alias": "Delphox",
  "type": [ "Fire", "Psychic" ],
  "info": {
    "image": "images/pokedex/655.png",
    "height": "1.5",
    "weight": "58",
    "category": "狐狸寶可夢",
    "text": "It swirls its twig to create amazing flamethrowers. It gazes into the flame at the tip of its stick to achieve a focused state and rumor says that it can see the future within the glowing ember."
  },
  "evolution": {
    "stage": "final"
  },
  "baseHP": 5,
  "rank": 3,
  "attr": {
    "str": { "value": 2, "max": 5 },
    "dex": { "value": 3, "max": 6 },
    "vit": { "value": 2, "max": 5 },
    "spe": { "value": 3, "max": 6 },
    "ins": { "value": 3, "max": 6 }
  },
  "ability": [ "猛火" ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "搖尾巴" },
    { "rank": 0, "type": "Normal", "name": "抓" },
    { "rank": 1, "type": "Normal", "name": "長嚎" },
    { "rank": 1, "type": "Fire", "name": "火花" },
    { "rank": 2, "type": "Normal", "name": "幸運咒語" },
    { "rank": 2, "type": "Fire", "name": "鬼火" },
    { "rank": 2, "type": "Fire", "name": "魔法火焰" },
    { "rank": 2, "type": "Fire", "name": "噴射火焰" },
    { "rank": 2, "type": "Fire", "name": "火焰旋渦" },
    { "rank": 2, "type": "Fire", "name": "蓄能焰襲" },
    { "rank": 2, "type": "Ghost", "name": "暗影球" },
    { "rank": 2, "type": "Psychic", "name": "精神衝擊" },
    { "rank": 2, "type": "Psychic", "name": "幻象光線" },
    { "rank": 2, "type": "Psychic", "name": "光牆" },
    { "rank": 2, "type": "Psychic", "name": "預知未來" },
    { "rank": 2, "type": "Psychic", "name": "魔法空間" },
    { "rank": 3, "type": "Dark", "name": "掉包" },
    { "rank": 3, "type": "Fire", "name": "大字爆炎" },
    { "rank": 3, "type": "Fire", "name": "大晴天" },
    { "rank": 3, "type": "Psychic", "name": "扮演" },
    { "rank": 3, "type": "Psychic", "name": "精神強念" },
    { "rank": 4, "type": "Electric", "name": "電擊波" },
    { "rank": 4, "type": "Fairy", "name": "魔法閃耀" },
    { "rank": 4, "type": "Fire", "name": "爆炸烈焰" }
  ]
},
{
  "id": "656",
  "region": "kalos",
  "name": "呱呱泡蛙",
  "alias": "Froakie",
  "type": [ "Water" ],
  "info": {
    "image": "images/pokedex/656.png",
    "height": "0.3",
    "weight": "7",
    "category": "泡蛙寶可夢",
    "text": "It protects its skin by covering its body in bubble foeam. Beneath its happy-go-lucky air, it keeps a watchful eye on its surroundings. It needs good discipline or it will be bad mannered with others."
  },
  "evolution": {
    "stage": "first",
    "time": "medium"
  },
  "baseHP": 3,
  "rank": 1,
  "attr": {
    "str": { "value": 2, "max": 4 },
    "dex": { "value": 2, "max": 5 },
    "vit": { "value": 1, "max": 3 },
    "spe": { "value": 2, "max": 4 },
    "ins": { "value": 1, "max": 3 }
  },
  "ability": [ "激流" ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "叫聲" },
    { "rank": 0, "type": "Normal", "name": "拍擊" },
    { "rank": 1, "type": "Normal", "name": "電光一閃" },
    { "rank": 1, "type": "Ghost", "name": "舌舔" },
    { "rank": 1, "type": "Water", "name": "泡沫" },
    { "rank": 2, "type": "Normal", "name": "輪唱" },
    { "rank": 2, "type": "Normal", "name": "替身" },
    { "rank": 2, "type": "Normal", "name": "煙幕" },
    { "rank": 2, "type": "Dark", "name": "投擲" },
    { "rank": 2, "type": "Rock", "name": "擊落" },
    { "rank": 2, "type": "Water", "name": "水之波動" },
    { "rank": 3, "type": "Normal", "name": "影子分身" },
    { "rank": 3, "type": "Flying", "name": "彈跳" },
    { "rank": 3, "type": "Water", "name": "水砲" },
    { "rank": 4, "type": "Ground", "name": "玩泥巴" },
    { "rank": 4, "type": "Poison", "name": "毒菱" },
    { "rank": 4, "type": "Water", "name": "水之誓約" }
  ],
  "isNovice": true
},
{
  "id": "657",
  "region": "kalos",
  "name": "呱頭蛙",
  "alias": "Frogadier",
  "type": [ "Water" ],
  "info": {
    "image": "images/pokedex/657.png",
    "height": "0.6",
    "weight": "10",
    "category": "泡蛙寶可夢",
    "text": "It is incredibly hard to catch. It starts practicing its skills by throwing foam covered pebbles at foes. Many trainers find this rebelious stage very challenging to handle and end up being its targets of practice. "
  },
  "evolution": {
    "stage": "second",
    "time": "medium"
  },
  "baseHP": 4,
  "rank": 2,
  "attr": {
    "str": { "value": 2, "max": 4 },
    "dex": { "value": 3, "max": 6 },
    "vit": { "value": 2, "max": 4 },
    "spe": { "value": 2, "max": 5 },
    "ins": { "value": 2, "max": 4 }
  },
  "ability": [ "激流" ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "叫聲" },
    { "rank": 0, "type": "Normal", "name": "拍擊" },
    { "rank": 1, "type": "Normal", "name": "電光一閃" },
    { "rank": 1, "type": "Ghost", "name": "舌舔" },
    { "rank": 1, "type": "Water", "name": "泡沫" },
    { "rank": 2, "type": "Normal", "name": "輪唱" },
    { "rank": 2, "type": "Normal", "name": "煙幕" },
    { "rank": 2, "type": "Dark", "name": "投擲" },
    { "rank": 2, "type": "Rock", "name": "擊落" },
    { "rank": 2, "type": "Water", "name": "水之波動" },
    { "rank": 3, "type": "Normal", "name": "影子分身" },
    { "rank": 3, "type": "Normal", "name": "替身" },
    { "rank": 3, "type": "Flying", "name": "彈跳" },
    { "rank": 3, "type": "Water", "name": "水砲" },
    { "rank": 4, "type": "Ground", "name": "玩泥巴" },
    { "rank": 4, "type": "Poison", "name": "毒菱" },
    { "rank": 4, "type": "Water", "name": "水之誓約" }
  ]
},
{
  "id": "658",
  "region": "kalos",
  "name": "甲賀忍蛙",
  "alias": "Greninja",
  "type": [ "Water", "Dark" ],
  "info": {
    "image": "images/pokedex/658.png",
    "height": "1.5",
    "weight": "40",
    "category": "忍者寶可夢",
    "text": "It appears and vanishes with a ninja’s grace. It toys with its enemies using swift movements, then slices them with throwing sharp water stars. If it was not properly disciplined, it will never listen any master."
  },
  "evolution": {
    "stage": "final"
  },
  "baseHP": 5,
  "rank": 3,
  "attr": {
    "str": { "value": 3, "max": 6 },
    "dex": { "value": 3, "max": 7 },
    "vit": { "value": 2, "max": 4 },
    "spe": { "value": 3, "max": 6 },
    "ins": { "value": 2, "max": 5 }
  },
  "ability": [ "激流", "牽絆變身" ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "拍擊" },
    { "rank": 0, "type": "Normal", "name": "叫聲" },
    { "rank": 1, "type": "Normal", "name": "電光一閃" },
    { "rank": 1, "type": "Ghost", "name": "舌舔" },
    { "rank": 1, "type": "Water", "name": "泡沫" },
    { "rank": 2, "type": "Normal", "name": "煙幕" },
    { "rank": 2, "type": "Dark", "name": "出奇一擊" },
    { "rank": 2, "type": "Ghost", "name": "影子偷襲" },
    { "rank": 2, "type": "Ground", "name": "撒菱" },
    { "rank": 2, "type": "Ice", "name": "黑霧" },
    { "rank": 2, "type": "Psychic", "name": "扮演" },
    { "rank": 2, "type": "Psychic", "name": "神通力" },
    { "rank": 2, "type": "Water", "name": "飛水手裡劍" },
    { "rank": 2, "type": "Water", "name": "水之波動" },
    { "rank": 3, "type": "Normal", "name": "影子分身" },
    { "rank": 3, "type": "Normal", "name": "替身" },
    { "rank": 3, "type": "Dark", "name": "暗襲要害" },
    { "rank": 3, "type": "Fight", "name": "掀榻榻米" },
    { "rank": 3, "type": "Water", "name": "水砲" },
    { "rank": 4, "type": "Ice", "name": "冰凍拳" },
    { "rank": 4, "type": "Poison", "name": "垃圾射擊" },
    { "rank": 4, "type": "Water", "name": "加農水砲" }
  ]
},
{
  "id": "658-Ash",
  "region": "kalos",
  "name": "甲賀忍蛙 (牽絆變身)",
  "alias": "Greninja",
  "type": [ "Water", "Dark" ],
  "info": {
    "image": "images/pokedex/658-Ash.png",
    "height": "1.5",
    "weight": "40",
    "category": "忍者寶可夢",
    "text": "The mysteries of the Pokémon world are vast. There is something called “The Bond Phenomenon” were a Pokémon and its trainer share a conection so strong that the Pokémon changes due to it."
  },
  "evolution": {
    "stage": "battle-bond"
  },
  "baseHP": 5,
  "rank": 4,
  "attr": {
    "str": { "value": 4, "max": 8 },
    "dex": { "value": 3, "max": 7 },
    "vit": { "value": 2, "max": 4 },
    "spe": { "value": 4, "max": 8 },
    "ins": { "value": 2, "max": 5 }
  },
  "ability": [ "牽絆變身" ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "拍擊" },
    { "rank": 0, "type": "Normal", "name": "叫聲" },
    { "rank": 1, "type": "Normal", "name": "電光一閃" },
    { "rank": 1, "type": "Ghost", "name": "舌舔" },
    { "rank": 1, "type": "Water", "name": "泡沫" },
    { "rank": 2, "type": "Normal", "name": "煙幕" },
    { "rank": 2, "type": "Dark", "name": "出奇一擊" },
    { "rank": 2, "type": "Ghost", "name": "影子偷襲" },
    { "rank": 2, "type": "Ground", "name": "撒菱" },
    { "rank": 2, "type": "Ice", "name": "黑霧" },
    { "rank": 2, "type": "Psychic", "name": "扮演" },
    { "rank": 2, "type": "Psychic", "name": "神通力" },
    { "rank": 2, "type": "Water", "name": "飛水手裡劍" },
    { "rank": 2, "type": "Water", "name": "水之波動" },
    { "rank": 3, "type": "Normal", "name": "影子分身" },
    { "rank": 3, "type": "Normal", "name": "替身" },
    { "rank": 3, "type": "Dark", "name": "暗襲要害" },
    { "rank": 3, "type": "Fight", "name": "掀榻榻米" },
    { "rank": 3, "type": "Water", "name": "水砲" },
    { "rank": 4, "type": "Ice", "name": "冰凍拳" },
    { "rank": 4, "type": "Poison", "name": "垃圾射擊" },
    { "rank": 4, "type": "Water", "name": "加農水砲" }
  ]
},
{
  "id": "659",
  "region": "kalos",
  "name": "掘掘兔",
  "alias": "Bunnelby",
  "type": [ "Normal" ],
  "info": {
    "image": "images/pokedex/659.png",
    "height": "0.4",
    "weight": "5",
    "category": "挖洞寶可夢",
    "text": "It uses its ears as shovels, digging holes strengthens them so much that they can sever thick roots easily.  They reproduce quickly and a handful of them can ravage a field of vegetables in just a few hours."
  },
  "evolution": {
    "stage": "first",
    "time": "medium"
  },
  "baseHP": 3,
  "rank": 1,
  "attr": {
    "str": { "value": 1, "max": 3 },
    "dex": { "value": 2, "max": 4 },
    "vit": { "value": 1, "max": 3 },
    "spe": { "value": 1, "max": 3 },
    "ins": { "value": 1, "max": 3 }
  },
  "ability": [ "撿拾", "頰囊" ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "瞪眼" },
    { "rank": 0, "type": "Normal", "name": "撞擊" },
    { "rank": 1, "type": "Normal", "name": "電光一閃" },
    { "rank": 1, "type": "Normal", "name": "連環巴掌" },
    { "rank": 1, "type": "Psychic", "name": "高速移動" },
    { "rank": 2, "type": "Normal", "name": "氣味偵測" },
    { "rank": 2, "type": "Normal", "name": "抓狂" },
    { "rank": 2, "type": "Normal", "name": "猛撞" },
    { "rank": 2, "type": "Fight", "name": "二連踢" },
    { "rank": 2, "type": "Ground", "name": "挖洞" },
    { "rank": 2, "type": "Ground", "name": "泥巴射擊" },
    { "rank": 2, "type": "Ground", "name": "擲泥" },
    { "rank": 3, "type": "Normal", "name": "憤怒門牙" },
    { "rank": 3, "type": "Normal", "name": "硬撐" },
    { "rank": 3, "type": "Flying", "name": "彈跳" },
    { "rank": 3, "type": "Ground", "name": "地震" },
    { "rank": 4, "type": "Normal", "name": "珍藏" },
    { "rank": 4, "type": "Normal", "name": "變圓" },
    { "rank": 4, "type": "Rock", "name": "滾動" }
  ],
  "isNovice": true
},
{
  "id": "660",
  "region": "kalos",
  "name": "掘地兔",
  "alias": "Diggersby",
  "type": [ "Normal", "Ground" ],
  "info": {
    "image": "images/pokedex/660.png",
    "height": "1.0",
    "weight": "42",
    "category": "挖洞寶可夢",
    "text": "A powerful excavator, its ears can reduce dense bedrock to rubble. After it has finished digging, it just lounges lazily. Some of them have been trained to work at construction  sites with good results."
  },
  "evolution": {
    "stage": "final"
  },
  "baseHP": 4,
  "rank": 2,
  "attr": {
    "str": { "value": 2, "max": 4 },
    "dex": { "value": 2, "max": 5 },
    "vit": { "value": 2, "max": 5 },
    "spe": { "value": 2, "max": 4 },
    "ins": { "value": 2, "max": 5 }
  },
  "ability": [ "撿拾", "頰囊" ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "瞪眼" },
    { "rank": 0, "type": "Normal", "name": "撞擊" },
    { "rank": 1, "type": "Normal", "name": "連環巴掌" },
    { "rank": 1, "type": "Normal", "name": "電光一閃" },
    { "rank": 1, "type": "Psychic", "name": "高速移動" },
    { "rank": 2, "type": "Normal", "name": "抓狂" },
    { "rank": 2, "type": "Normal", "name": "猛撞" },
    { "rank": 2, "type": "Normal", "name": "劍舞" },
    { "rank": 2, "type": "Normal", "name": "氣味偵測" },
    { "rank": 2, "type": "Fight", "name": "二連踢" },
    { "rank": 2, "type": "Ground", "name": "耕地" },
    { "rank": 2, "type": "Ground", "name": "挖洞" },
    { "rank": 2, "type": "Ground", "name": "泥巴射擊" },
    { "rank": 2, "type": "Ground", "name": "擲泥" },
    { "rank": 2, "type": "Ground", "name": "重踏" },
    { "rank": 3, "type": "Normal", "name": "硬撐" },
    { "rank": 3, "type": "Normal", "name": "憤怒門牙" },
    { "rank": 3, "type": "Fight", "name": "臂錘" },
    { "rank": 3, "type": "Flying", "name": "彈跳" },
    { "rank": 3, "type": "Ground", "name": "地震" },
    { "rank": 4, "type": "Normal", "name": "珍藏" },
    { "rank": 4, "type": "Electric", "name": "雷電拳" },
    { "rank": 4, "type": "Fire", "name": "火焰拳" }
  ]
},
{
  "id": "661",
  "region": "kalos",
  "name": "小箭雀",
  "alias": "Fletchling",
  "type": [
    "Normal",
    "Flying"
  ],
  "info": {
    "image": "images/pokedex/661.png",
    "height": "0.3",
    "weight": "1",
    "category": "知更鳥寶可夢",
    "text": "這些可愛的寶可夢會用婉轉美麗的叫聲和揮動尾羽的動作向夥伴發送信號。儘管叫聲美麗，但牠對於入侵領地的對手會毫不留情地粗暴對待。"
  },
  "evolution": {
    "stage": "first",
    "time": "medium"
  },
  "baseHP": 3,
  "rank": 0,
  "attr": {
    "str": { "value": 2, "max": 4 },
    "dex": { "value": 2, "max": 4 },
    "vit": { "value": 1, "max": 3 },
    "spe": { "value": 1, "max": 3 },
    "ins": { "value": 1, "max": 3 }
  },
  "ability": [
    "健壯胸肌"
  ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "撞擊"},
    { "rank": 0, "type": "Normal", "name": "叫聲"},
    { "rank": 1, "type": "Normal", "name": "電光一閃"},
    { "rank": 1, "type": "Flying", "name": "啄"},
    { "rank": 2, "type": "Psychic", "name": "高速移動"},
    { "rank": 2, "type": "Normal", "name": "抓狂"},
    { "rank": 2, "type": "Flying", "name": "羽棲"},
    { "rank": 2, "type": "Normal", "name": "旋風刀"},
    { "rank": 2, "type": "Normal", "name": "自然之恩" },
    { "rank": 2, "type": "Fire", "name": "蓄能焰襲" },
    { "rank": 3, "type": "Flying", "name": "雜耍"},
    { "rank": 3, "type": "Normal", "name": "搶先一步"},
    { "rank": 3, "type": "Flying", "name": "順風"},
    { "rank": 3, "type": "Steel", "name": "鋼翼"},
    { "rank": 4, "type": "Dark", "name": "搶奪"},
    { "rank": 4, "type": "Fight", "name": "快速防守"},
    { "rank": 4, "type": "Flying", "name": "空氣利刃"}
  ],
  "isNovice": true
},
{
  "id": "662",
  "region": "kalos",
  "name": "火箭雀",
  "alias": "Fletchinder",
  "type": [
    "Fire",
    "Flying"
  ],
  "info": {
    "image": "images/pokedex/662.png",
    "height": "0.7",
    "weight": "16",
    "category": "火花寶可夢",
    "text": "牠會從鳥嘴裡噴出火花來燒焦草叢，接著撲向因為受到驚嚇而逃出來的獵物。牠的身體會在開始戰鬥的時候被火焰纏繞，是隻性情好戰的寶可夢。"
  },
  "evolution": {
    "stage": "second",
    "time": "medium"
  },
  "baseHP": 4,
  "rank": 1,
  "attr": {
    "str": { "value": 2, "max": 5 },
    "dex": { "value": 2, "max": 5 },
    "vit": { "value": 2, "max": 4 },
    "spe": { "value": 2, "max": 4 },
    "ins": { "value": 2, "max": 4 }
  },
  "ability": [
    "火焰之軀"
  ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "撞擊" },
    { "rank": 0, "type": "Normal", "name": "叫聲" },
    { "rank": 1, "type": "Normal", "name": "電光一閃" },
    { "rank": 1, "type": "Flying", "name": "啄" },
    { "rank": 2, "type": "Psychic", "name": "高速移動" },
    { "rank": 2, "type": "Normal", "name": "抓狂" },
    { "rank": 2, "type": "Fire", "name": "火花" },
    { "rank": 2, "type": "Flying", "name": "羽棲" },
    { "rank": 2, "type": "Normal", "name": "旋風刀" },
    { "rank": 2, "type": "Normal", "name": "自然之恩" },
    { "rank": 2, "type": "Fire", "name": "蓄能焰襲" },
    { "rank": 3, "type": "Flying", "name": "雜耍" },
    { "rank": 3, "type": "Normal", "name": "搶先一步" },
    { "rank": 3, "type": "Flying", "name": "順風" },
    { "rank": 3, "type": "Steel", "name": "鋼翼" },
    { "rank": 4, "type": "Dark", "name": "搶奪" },
    { "rank": 4, "type": "Fight", "name": "快速防守" },
    { "rank": 4, "type": "Fire", "name": "熱風" },
    
  ]
},
{
  "id": "663",
  "region": "kalos",
  "name": "烈箭鷹",
  "alias": "Talonflame",
  "type": [
    "Fire",
    "Flying"
  ],
  "info": {
    "image": "images/pokedex/663.png",
    "height": "1.2",
    "weight": "24",
    "category": "烈火寶可夢",
    "text": "牠們翱翔於沙漠峽谷上空。如果發現了獵物，牠們會急速俯衝並給予致命一擊。牠們是傑出的獵手，每一次振翅都會在身後留下火焰的軌跡。"
  },
  "evolution": {
    "stage": "final"
  },
  "baseHP": 5,
  "rank": 2,
  "attr": {
    "str": { "value": 2, "max": 5 },
    "dex": { "value": 3, "max": 7 },
    "vit": { "value": 2, "max": 5 },
    "spe": { "value": 2, "max": 5 },
    "ins": { "value": 2, "max": 4 }
  },
  "ability": [
    "火焰之軀"
  ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "撞擊" },
    { "rank": 0, "type": "Normal", "name": "叫聲" },
    { "rank": 1, "type": "Normal", "name": "電光一閃" },
    { "rank": 1, "type": "Flying", "name": "啄" },
    { "rank": 2, "type": "Psychic", "name": "高速移動" },
    { "rank": 2, "type": "Normal", "name": "抓狂" },
    { "rank": 2, "type": "Flying", "name": "羽棲" },
    { "rank": 2, "type": "Normal", "name": "旋風刀" },
    { "rank": 2, "type": "Normal", "name": "自然之恩" },
    { "rank": 2, "type": "Fire", "name": "蓄能焰襲" },
    { "rank": 2, "type": "Fire", "name": "火花" },
    { "rank": 3, "type": "Fire", "name": "閃焰衝鋒" },
    { "rank": 3, "type": "Flying", "name": "雜耍" },
    { "rank": 3, "type": "Normal", "name": "搶先一步" },
    { "rank": 3, "type": "Flying", "name": "順風" },
    { "rank": 3, "type": "Steel", "name": "鋼翼" },
    { "rank": 3, "type": "Flying", "name": "勇鳥猛攻" },
    { "rank": 4, "type": "Dark", "name": "搶奪" },
    { "rank": 4, "type": "Fight", "name": "快速防守" },
    { "rank": 4, "type": "Fire", "name": "熱風" }
  ]
},
{
  "id": "664",
  "region": "kalos",
  "name": "粉蝶蟲",
  "alias": "Scatterbug",
  "type": [
    "Bug"
  ],
  "info": {
    "image": "images/pokedex/664.png",
    "height": "0.3",
    "weight": "2",
    "category": "噴粉寶可夢",
    "text": "覆蓋身體的粉末能夠調節體溫，讓牠無論在任何氣候或地區下都能生活。每當受到襲擊時，牠會撒出一旦接觸就會麻痺的黑色粉末。"
  },
  "evolution": {
    "stage": "first",
    "time": "fast"
  },
  "baseHP": 3,
  "rank": 0,
  "attr": {
    "str": { "value": 1, "max": 3 },
    "dex": { "value": 1, "max": 3 },
    "vit": { "value": 1, "max": 3 },
    "spe": { "value": 1, "max": 3 },
    "ins": { "value": 1, "max": 3 }
  },
  "ability": [
    "鱗粉",
    "複眼"
  ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "撞擊" },
    { "rank": 0, "type": "Bug", "name": "吐絲" },
    { "rank": 1, "type": "Grass", "name": "麻痺粉" },
    { "rank": 2, "type": "Bug", "name": "蟲咬" },
    { "rank": 3, "type": "Bug", "name": "憤怒粉" }
  ],
  "isNovice": true
},
{
  "id": "665",
  "region": "kalos",
  "name": "粉蝶蛹",
  "alias": "Spewpa",
  "type": [
    "Bug"
  ],
  "info": {
    "image": "images/pokedex/665.png",
    "height": "0.3",
    "weight": "8",
    "category": "噴粉寶可夢",
    "text": "牠躲藏在老舊原木裏頭。當被獵食者襲擊時，牠就會將體毛尖尖豎起威嚇敵人。牠為了防守而釋放的粉塵，讓鳥寶可夢很難吃掉牠們。"
  },
  "evolution": {
    "stage": "second",
    "time": "fast"
  },
  "baseHP": 4,
  "rank": 1,
  "attr": {
    "str": { "value": 1, "max": 3 },
    "dex": { "value": 1, "max": 3 },
    "vit": { "value": 2, "max": 4 },
    "spe": { "value": 1, "max": 3 },
    "ins": { "value": 1, "max": 3 }
  },
  "ability": [
    "蛻皮"
  ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "變硬" },
    { "rank": 1, "type": "Normal", "name": "守住" },
    { "rank": 3, "type": "Steel", "name": "鐵壁" },
    { "rank": 3, "type": "Electric", "name": "電網" }
  ],
  "isNovice": true
},
{
  "id": "666",
  "region": "kalos",
  "name": "彩粉蝶",
  "alias": "Vivillon",
  "type": [
    "Bug",
    "Flying"
  ],
  "info": {
    "image": "images/pokedex/666.png",
    "height": "1.2",
    "weight": "17",
    "category": "鱗粉寶可夢",
    "text": "這隻寶可夢的花紋似乎是受到棲息地的氣候和花朵的影響。曾有位有名的寶可夢飼育家培育出了精靈球造型花紋的品種，並以一百萬元的高價出售。"
  },
  "evolution": {
    "stage": "final"
  },
  "baseHP": 5,
  "rank": 2,
  "attr": {
    "str": { "value": 2, "max": 4 },
    "dex": { "value": 2, "max": 5 },
    "vit": { "value": 2, "max": 4 },
    "spe": { "value": 2, "max": 5 },
    "ins": { "value": 2, "max": 4 }
  },
  "ability": [
    "鱗粉",
    "複眼"
  ],
  "moves": [
    { "rank": 0, "type": "Bug", "name": "粉塵" },
    { "rank": 0, "type": "Flying", "name": "起風" },
    { "rank": 1, "type": "Poison", "name": "毒粉" },
    { "rank": 1, "type": "Grass", "name": "麻痺粉" },
    { "rank": 1, "type": "Grass", "name": "催眠粉" },
    { "rank": 2, "type": "Psychic", "name": "光牆" },
    { "rank": 2, "type": "Bug", "name": "蟲之抵抗" },
    { "rank": 2, "type": "Psychic", "name": "幻象光線" },
    { "rank": 2, "type": "Normal", "name": "超音波" },
    { "rank": 2, "type": "Fairy", "name": "吸取之吻" },
    { "rank": 2, "type": "Grass", "name": "芳香治療" },
    { "rank": 3, "type": "Bug", "name": "蟲鳴" },
    { "rank": 3, "type": "Normal", "name": "神秘守護" },
    { "rank": 3, "type": "Bug", "name": "蝶舞" },
    { "rank": 3, "type": "Flying", "name": "暴風" },
    { "rank": 4, "type": "Grass", "name": "終極吸取" },
    { "rank": 4, "type": "Electric", "name": "電網" },
    { "rank": 4, "type": "Flying", "name": "順風" }
  ]
},
  {
    "id": "667",
    "region": "kalos",
    "name": "小獅獅",
    "alias": "Litleo",
    "type": [ "Fire", "Normal" ],
    "info": {
      "image": "images/pokedex/667.png",
      "height": "0.6",
      "weight": "13",
      "category": "幼獅寶可夢",
      "text": "Quick on temper and to take on a fight, they use their mane to scorch their enemies. Some of them set off from their pride to live alone. Only those who develop a full mane get to lead their own pride.  "
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "鬥爭心", "緊張感" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "猛撞" },
      { "rank": 1, "type": "Normal", "name": "自我激勵" },
      { "rank": 1, "type": "Fire", "name": "火花" },
      { "rank": 2, "type": "Normal", "name": "迴聲" },
      { "rank": 2, "type": "Normal", "name": "蠻幹" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Normal", "name": "戰吼" },
      { "rank": 2, "type": "Fire", "name": "噴射火焰" },
      { "rank": 2, "type": "Fire", "name": "火焰牙" },
      { "rank": 3, "type": "Normal", "name": "巨聲" },
      { "rank": 3, "type": "Dark", "name": "咬碎" },
      { "rank": 3, "type": "Fire", "name": "過熱" },
      { "rank": 3, "type": "Fire", "name": "燒盡" },
      { "rank": 4, "type": "Normal", "name": "挺住" },
      { "rank": 4, "type": "Normal", "name": "幫助" },
      { "rank": 4, "type": "Fire", "name": "熱風" }
    ],
    "isNovice": true
  },
  {
    "id": "668",
    "region": "kalos",
    "name": "火炎獅",
    "alias": "Pyroar",
    "type": [ "Fire", "Normal" ],
    "info": {
      "image": "images/pokedex/668.png",
      "height": "1.5",
      "weight": "162",
      "category": "王者寶可夢",
      "text": "The male with the largest fire mane is the leader of the pride. The females have a long mane strip. Whenever they roar they also let out a fiery breath. Not many Pokémon dare to mess with them. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "鬥爭心", "緊張感" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "猛撞" },
      { "rank": 1, "type": "Normal", "name": "自我激勵" },
      { "rank": 1, "type": "Fire", "name": "火花" },
      { "rank": 2, "type": "Normal", "name": "破壞光線" },
      { "rank": 2, "type": "Normal", "name": "迴聲" },
      { "rank": 2, "type": "Normal", "name": "蠻幹" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Normal", "name": "戰吼" },
      { "rank": 2, "type": "Fire", "name": "噴射火焰" },
      { "rank": 2, "type": "Fire", "name": "火焰牙" },
      { "rank": 3, "type": "Normal", "name": "巨聲" },
      { "rank": 3, "type": "Dark", "name": "咬碎" },
      { "rank": 3, "type": "Fire", "name": "過熱" },
      { "rank": 3, "type": "Fire", "name": "燒盡" },
      { "rank": 4, "type": "Normal", "name": "挺住" },
      { "rank": 4, "type": "Normal", "name": "幫助" },
      { "rank": 4, "type": "Fire", "name": "熱風" }
    ]
  },
  {
    "id": "669",
    "region": "kalos",
    "name": "花蓓蓓",
    "alias": "Flabebe",
    "type": [ "Fairy" ],
    "info": {
      "image": "images/pokedex/669.png",
      "height": "0.1",
      "weight": "0.1",
      "category": "單朵寶可夢",
      "text": "This species is female only. They are so tiny it is difficult to spot them in the wild. They pick a flower as soon as they are born and it becomes a part of their body. These small Pokémon are shy but adorable."
    },
    "evolution": {
      "stage": "first",
      "time": "fast"
    },
    "baseHP": 3,
    "rank": 0,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "花幕" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Grass", "name": "藤鞭" },
      { "rank": 1, "type": "Normal", "name": "幸運咒語" },
      { "rank": 1, "type": "Fairy", "name": "妖精之風" },
      { "rank": 2, "type": "Normal", "name": "祈願" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 2, "type": "Grass", "name": "落英繽紛" },
      { "rank": 2, "type": "Grass", "name": "青草場地" },
      { "rank": 2, "type": "Grass", "name": "魔法葉" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 3, "type": "Fairy", "name": "月亮之力" },
      { "rank": 3, "type": "Fairy", "name": "薄霧場地" },
      { "rank": 3, "type": "Grass", "name": "日光束" },
      { "rank": 3, "type": "Grass", "name": "花瓣舞" },
      { "rank": 4, "type": "Normal", "name": "保護色" },
      { "rank": 4, "type": "Normal", "name": "治癒鈴聲" },
      { "rank": 4, "type": "Psychic", "name": "魔法反射" }
    ],
    "isNovice": true
  },
  {
    "id": "670",
    "region": "kalos",
    "name": "花葉蒂",
    "alias": "Floette",
    "type": [ "Fairy" ],
    "info": {
      "image": "images/pokedex/670.png",
      "height": "0.2",
      "weight": "1",
      "category": "單朵寶可夢",
      "text": "It flutters around flower meadows and takes care of buds that are starting to wilt. People who fill their gardens with their preferred flower recieve its visit every spring. They are loyal and caring Pokémon."
    },
    "evolution": {
      "stage": "second",
      "with": "光之石"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "花幕" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Grass", "name": "藤鞭" },
      { "rank": 1, "type": "Normal", "name": "幸運咒語" },
      { "rank": 1, "type": "Fairy", "name": "妖精之風" },
      { "rank": 2, "type": "Normal", "name": "祈願" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 2, "type": "Grass", "name": "落英繽紛" },
      { "rank": 2, "type": "Grass", "name": "青草場地" },
      { "rank": 2, "type": "Grass", "name": "魔法葉" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 3, "type": "Fairy", "name": "月亮之力" },
      { "rank": 3, "type": "Fairy", "name": "薄霧場地" },
      { "rank": 3, "type": "Grass", "name": "日光束" },
      { "rank": 3, "type": "Grass", "name": "花瓣舞" },
      { "rank": 4, "type": "Normal", "name": "保護色" },
      { "rank": 4, "type": "Normal", "name": "治癒鈴聲" },
      { "rank": 4, "type": "Psychic", "name": "魔法反射" }
    ]
  },
  {
    "id": "671",
    "region": "kalos",
    "name": "花潔夫人",
    "alias": "Florges",
    "type": [ "Fairy" ],
    "info": {
      "image": "images/pokedex/671.png",
      "height": "1.1",
      "weight": "10",
      "category": "花園寶可夢",
      "text": "In times long past, castle rulers would invite Florges to create flower gardens to embellish their domains. Florges claim beautiful meadows as their territories but they are kind and merciful with visitors. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 3, "max": 7 }
    },
    "ability": [ "花幕" ],
    "moves": [
      { "rank": 0, "type": "Fairy", "name": "鮮花防守" },
      { "rank": 0, "type": "Fairy", "name": "魅惑之聲" },
      { "rank": 1, "type": "Normal", "name": "幸運咒語" },
      { "rank": 2, "type": "Normal", "name": "祈願" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 2, "type": "Grass", "name": "落英繽紛" },
      { "rank": 2, "type": "Grass", "name": "青草場地" },
      { "rank": 2, "type": "Grass", "name": "魔法葉" },
      { "rank": 3, "type": "Fairy", "name": "月亮之力" },
      { "rank": 3, "type": "Fairy", "name": "薄霧場地" },
      { "rank": 3, "type": "Grass", "name": "打草結" },
      { "rank": 3, "type": "Grass", "name": "花瓣舞" },
      { "rank": 4, "type": "Normal", "name": "治癒鈴聲" },
      { "rank": 4, "type": "Grass", "name": "光合作用" },
      { "rank": 4, "type": "Psychic", "name": "魔法反射" }
    ]
  },
  {
    "id": "672",
    "region": "kalos",
    "name": "坐騎小羊",
    "alias": "Skiddo",
    "type": [ "Grass" ],
    "info": {
      "image": "images/pokedex/672.png",
      "height": "0.9",
      "weight": "31",
      "category": "坐騎寶可夢",
      "text": "It’s thought to be one of the first Pokémon to live in harmony with humans. If it has sunshine and water it doesn’t need to eat - the leaves on its back will produce the energy for it."
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "食草" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "生長" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Grass", "name": "煩惱種子" },
      { "rank": 1, "type": "Grass", "name": "藤鞭" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Fight", "name": "健美" },
      { "rank": 2, "type": "Grass", "name": "種子炸彈" },
      { "rank": 2, "type": "Grass", "name": "光合作用" },
      { "rank": 2, "type": "Grass", "name": "寄生種子" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 3, "type": "Normal", "name": "喝牛奶" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Grass", "name": "葉刃" },
      { "rank": 3, "type": "Grass", "name": "木角" },
      { "rank": 4, "type": "Normal", "name": "變圓" },
      { "rank": 4, "type": "Normal", "name": "挺住" },
      { "rank": 4, "type": "Psychic", "name": "意念頭鎚" }
    ],
    "isNovice": true
  },
  {
    "id": "673",
    "region": "kalos",
    "name": "坐騎山羊",
    "alias": "Gogoat",
    "type": [ "Grass" ],
    "info": {
      "image": "images/pokedex/673.png",
      "height": "1.7",
      "weight": "182",
      "category": "坐騎寶可夢",
      "text": "In the wild, they inhabit mountain regions with the leader of the herd decided by a battle of clashing horns. People rely on Gogoat to get them through harsh terrains as it always knows where you want to go. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 6,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "食草" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "生長" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Grass", "name": "煩惱種子" },
      { "rank": 1, "type": "Grass", "name": "藤鞭" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Fight", "name": "健美" },
      { "rank": 2, "type": "Grass", "name": "種子炸彈" },
      { "rank": 2, "type": "Grass", "name": "光合作用" },
      { "rank": 2, "type": "Grass", "name": "寄生種子" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 3, "type": "Normal", "name": "喝牛奶" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Flying", "name": "燕返" },
      { "rank": 3, "type": "Grass", "name": "葉刃" },
      { "rank": 3, "type": "Grass", "name": "木角" },
      { "rank": 3, "type": "Ground", "name": "地震" },
      { "rank": 4, "type": "Fight", "name": "蠻力" },
      { "rank": 4, "type": "Flying", "name": "彈跳" },
      { "rank": 4, "type": "Psychic", "name": "意念頭鎚" }
    ]
  },
  {
    "id": "674",
    "region": "kalos",
    "name": "頑皮熊貓",
    "alias": "Pancham",
    "type": [ "Fight" ],
    "info": {
      "image": "images/pokedex/674.png",
      "height": "0.6",
      "weight": "8",
      "category": "頑皮寶可夢",
      "text": "It lives in bamboo forests. It is very energetic and playful, but wants to be taken seriously. It has a hard time due to its cute appearance, for this reason it may start hanging out with the wrong crowd. "
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "鐵拳", "破格" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "自我激勵" },
      { "rank": 1, "type": "Fight", "name": "猛推" },
      { "rank": 2, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Normal", "name": "連續拳" },
      { "rank": 2, "type": "Fight", "name": "借力摔" },
      { "rank": 2, "type": "Fight", "name": "巴投" },
      { "rank": 2, "type": "Fight", "name": "空手劈" },
      { "rank": 3, "type": "Normal", "name": "找夥伴" },
      { "rank": 3, "type": "Dark", "name": "拋下狠話" },
      { "rank": 3, "type": "Dark", "name": "咬碎" },
      { "rank": 3, "type": "Fight", "name": "沖天拳" },
      { "rank": 4, "type": "Electric", "name": "雷電拳" },
      { "rank": 4, "type": "Fire", "name": "火焰拳" },
      { "rank": 4, "type": "Ice", "name": "冰凍拳" }
    ],
    "isNovice": true
  },
  {
    "id": "675",
    "region": "kalos",
    "name": "流氓熊貓",
    "alias": "Pangoro",
    "type": [ "Fight", "Dark" ],
    "info": {
      "image": "images/pokedex/675.png",
      "height": "2.1",
      "weight": "204",
      "category": "惡顏寶可夢",
      "text": "Although this pokemon has a violent  temperament, it won’t put up with bullying. It charges ahead and slams its opponents like a berserker, totally  disregarding its own safety.Its migthy arms can send you flying."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "鐵拳", "破格" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "自我激勵" },
      { "rank": 1, "type": "Fight", "name": "猛推" },
      { "rank": 2, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Normal", "name": "連續拳" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 2, "type": "Fight", "name": "借力摔" },
      { "rank": 2, "type": "Fight", "name": "巴投" },
      { "rank": 2, "type": "Fight", "name": "空手劈" },
      { "rank": 2, "type": "Steel", "name": "子彈拳" },
      { "rank": 3, "type": "Normal", "name": "找夥伴" },
      { "rank": 3, "type": "Dark", "name": "挑釁" },
      { "rank": 3, "type": "Dark", "name": "拋下狠話" },
      { "rank": 3, "type": "Fight", "name": "下盤踢" },
      { "rank": 3, "type": "Fight", "name": "臂錘" },
      { "rank": 3, "type": "Fight", "name": "沖天拳" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Fight", "name": "吸取拳" },
      { "rank": 4, "type": "Fight", "name": "真氣拳" }
    ]
  },
  {
    "id": "676",
    "region": "kalos",
    "name": "多麗米亞",
    "alias": "Furfrou",
    "type": [ "Normal" ],
    "info": {
      "image": "images/pokedex/676.png",
      "height": "1.2",
      "weight": "28",
      "category": "貴賓犬寶可夢",
      "text": "Historically, these Pokémon were the designated guardians of the kings. They are popular pets now and people love to trim their fur into exotic hairstyles. But their protective  nature has never been lost."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "毛皮大衣" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 1, "type": "Normal", "name": "猛撞" },
      { "rank": 1, "type": "Fairy", "name": "圓瞳" },
      { "rank": 1, "type": "Ground", "name": "潑沙" },
      { "rank": 2, "type": "Normal", "name": "頭鎚" },
      { "rank": 2, "type": "Normal", "name": "報仇" },
      { "rank": 2, "type": "Normal", "name": "氣味偵測" },
      { "rank": 2, "type": "Normal", "name": "搖尾巴" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Fairy", "name": "撒嬌" },
      { "rank": 3, "type": "Dark", "name": "突襲" },
      { "rank": 3, "type": "Grass", "name": "棉花防守" },
      { "rank": 4, "type": "Normal", "name": "自我激勵" },
      { "rank": 4, "type": "Normal", "name": "珍藏" },
      { "rank": 4, "type": "Normal", "name": "巨聲" }
    ]
  },
  {
    "id": "677",
    "region": "kalos",
    "name": "妙喵",
    "alias": "Espurr",
    "type": [ "Psychic" ],
    "info": {
      "image": "images/pokedex/677.png",
      "height": "0.3",
      "weight": "3",
      "category": "自製寶可夢",
      "text": "The organs that emit its intense psychic power are tucked under its ears to keep energy from escaping. It still does not control its power and could destroy something without realizing it.  "
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "銳利目光", "穿透" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 1, "type": "Normal", "name": "渴望" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 2, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 2, "type": "Psychic", "name": "光牆" },
      { "rank": 3, "type": "Fairy", "name": "魅惑之聲" },
      { "rank": 3, "type": "Psychic", "name": "精神衝擊" },
      { "rank": 4, "type": "Normal", "name": "哈欠" },
      { "rank": 4, "type": "Bug", "name": "信號光束" },
      { "rank": 4, "type": "Psychic", "name": "屏障" }
    ],
    "isNovice": true
  },
  {
    "id": "678",
    "region": "kalos",
    "name": "超能妙喵",
    "alias": "Meowstic",
    "type": [ "Psychic" ],
    "info": {
      "image": "images/pokedex/678.png",
      "height": "0.6",
      "weight": "8",
      "category": "抑制寶可夢",
      "text": "The eye patterns on the interior of  its ears emit psychic energy. It keeps them tightly covered because the power can be overwhelming.  Females are white in color and more aggressive than the males."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "銳利目光", "穿透" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "瞪眼" },
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 0, "type": "Normal", "name": "黑色目光" },
      { "rank": 0, "type": "Grass", "name": "魔法葉" },
      { "rank": 1, "type": "Normal", "name": "擊掌奇襲" },
      { "rank": 1, "type": "Fairy", "name": "魅惑之聲" },
      { "rank": 1, "type": "Psychic", "name": "念力" },
      { "rank": 2, "type": "Normal", "name": "渴望" },
      { "rank": 2, "type": "Normal", "name": "幫助" },
      { "rank": 2, "type": "Dark", "name": "突襲" },
      { "rank": 2, "type": "Electric", "name": "充電光束" },
      { "rank": 2, "type": "Fairy", "name": "撒嬌" },
      { "rank": 2, "type": "Psychic", "name": "神通力" },
      { "rank": 2, "type": "Psychic", "name": "精神衝擊" },
      { "rank": 2, "type": "Psychic", "name": "反射壁" },
      { "rank": 2, "type": "Psychic", "name": "光牆" },
      { "rank": 2, "type": "Psychic", "name": "扮演" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 2, "type": "Psychic", "name": "輔助力量" },
      { "rank": 3, "type": "Fairy", "name": "薄霧場地" },
      { "rank": 3, "type": "Fight", "name": "快速防守" },
      { "rank": 3, "type": "Ghost", "name": "暗影球" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Psychic", "name": "封印" },
      { "rank": 4, "type": "Normal", "name": "哈欠" },
      { "rank": 4, "type": "Normal", "name": "搔癢" },
      { "rank": 4, "type": "Electric", "name": "電擊波" }
    ]
  },
  {
    "id": "679",
    "region": "kalos",
    "name": "獨劍鞘",
    "alias": "Honedge",
    "type": [ "Steel", "Ghost" ],
    "info": {
      "image": "images/pokedex/679.png",
      "height": "0.8",
      "weight": "2",
      "category": "刀劍寶可夢",
      "text": "During ancient war times this ruthless  Pokémon was born from the spirits of warriors who died in battle. It is a cursed sword that seeks revenge and bloodshed. It will drain the life energy of anyone that wields it."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "無防守" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "劍舞" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Bug", "name": "連斬" },
      { "rank": 1, "type": "Steel", "name": "金屬音" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Normal", "name": "報仇" },
      { "rank": 2, "type": "Dark", "name": "暗襲要害" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Flying", "name": "燕返" },
      { "rank": 2, "type": "Ghost", "name": "影子偷襲" },
      { "rank": 2, "type": "Steel", "name": "身體輕量化" },
      { "rank": 3, "type": "Fight", "name": "聖劍" },
      { "rank": 3, "type": "Psychic", "name": "力量戲法" },
      { "rank": 3, "type": "Steel", "name": "鐵頭" },
      { "rank": 3, "type": "Steel", "name": "鐵壁" },
      { "rank": 4, "type": "Ghost", "name": "怨恨" },
      { "rank": 4, "type": "Ghost", "name": "同命" },
      { "rank": 4, "type": "Rock", "name": "廣域防守" }
    ],
    "isNovice": true
  },
  {
    "id": "680",
    "region": "kalos",
    "name": "雙劍鞘",
    "alias": "Doublade",
    "type": [ "Steel", "Ghost" ],
    "info": {
      "image": "images/pokedex/680.png",
      "height": "0.8",
      "weight": "5",
      "category": "刀劍寶可夢",
      "text": "Both swords  share a telepathic link to coordinate attacks and slash their enemies to shreds. They feed on the rage of their wielder and promise to make him unbetable at the cost of his flesh and soul."
    },
    "evolution": {
      "stage": "second",
      "with": "暗之石"
    },
    "baseHP": 4,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 4, "max": 8 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "無防守" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "劍舞" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Bug", "name": "連斬" },
      { "rank": 1, "type": "Steel", "name": "金屬音" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Normal", "name": "報仇" },
      { "rank": 2, "type": "Dark", "name": "暗襲要害" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Flying", "name": "燕返" },
      { "rank": 2, "type": "Ghost", "name": "影子偷襲" },
      { "rank": 2, "type": "Steel", "name": "身體輕量化" },
      { "rank": 3, "type": "Fight", "name": "聖劍" },
      { "rank": 3, "type": "Psychic", "name": "力量戲法" },
      { "rank": 3, "type": "Steel", "name": "鐵頭" },
      { "rank": 3, "type": "Steel", "name": "鐵壁" },
      { "rank": 4, "type": "Ghost", "name": "怨恨" },
      { "rank": 4, "type": "Ghost", "name": "同命" },
      { "rank": 4, "type": "Rock", "name": "廣域防守" }
    ]
  },
  {
    "id": "681-Shield",
    "region": "kalos",
    "name": "堅盾劍怪 (盾牌形態)",
    "alias": "Aegislash",
    "type": [ "Steel", "Ghost" ],
    "info": {
      "image": "images/pokedex/681-Shield.png",
      "height": "1.7",
      "weight": "53",
      "category": "王劍寶可夢",
      "text": "The legend tells of how this Pokémon  lead the first King of Kalos to victory.A crushing grip can be felt on the arm of the wielder.While in this form it can only use Support moves."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 4,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 4, "max": 8 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 4, "max": 8 }
    },
    "ability": [ "戰鬥切換" ],
    "moves": [
      { "rank": 2, "type": "Bug", "name": "連斬" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Steel", "name": "身體輕量化" },
      { "rank": 2, "type": "Ghost", "name": "影子偷襲" },
      { "rank": 2, "type": "Flying", "name": "燕返" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Steel", "name": "鐵壁" },
      { "rank": 3, "type": "Psychic", "name": "力量戲法" },
      { "rank": 3, "type": "Steel", "name": "鐵頭" },
      { "rank": 3, "type": "Steel", "name": "王者盾牌" },
      { "rank": 3, "type": "Rock", "name": "雙刃頭錘" },
      { "rank": 3, "type": "Fight", "name": "聖劍" },
      { "rank": 4, "type": "Ghost", "name": "怨恨" },
      { "rank": 4, "type": "Electric", "name": "電磁漂浮" },
      { "rank": 4, "type": "Ghost", "name": "同命" }
    ]
  },
  {
    "id": "681-Blade",
    "region": "kalos",
    "name": "堅盾劍怪 (刀劍形態)",
    "alias": "Aegislash-blade",
    "type": [ "Steel", "Ghost" ],
    "info": {
      "image": "images/pokedex/681-Blade.png",
      "height": "1.7",
      "weight": "53",
      "category": "王劍寶可夢",
      "text": "Those who weild this sword hear whispers of bloodlust and power.This cursed sword has the souls of those who fell by its blade.While in this form it can only use Attack moves."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 4,
    "attr": {
      "str": { "value": 4, "max": 8 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 4, "max": 8 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "戰鬥切換" ],
    "moves": [
      { "rank": 2, "type": "Bug", "name": "連斬" },
      { "rank": 2, "type": "Dark", "name": "追打" },
      { "rank": 2, "type": "Steel", "name": "身體輕量化" },
      { "rank": 2, "type": "Ghost", "name": "影子偷襲" },
      { "rank": 2, "type": "Flying", "name": "燕返" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Steel", "name": "鐵壁" },
      { "rank": 3, "type": "Psychic", "name": "力量戲法" },
      { "rank": 3, "type": "Steel", "name": "鐵頭" },
      { "rank": 3, "type": "Steel", "name": "王者盾牌" },
      { "rank": 3, "type": "Rock", "name": "雙刃頭錘" },
      { "rank": 3, "type": "Fight", "name": "聖劍" },
      { "rank": 4, "type": "Ghost", "name": "怨恨" },
      { "rank": 4, "type": "Electric", "name": "電磁漂浮" },
      { "rank": 4, "type": "Ghost", "name": "同命" }
    ]
  },
  {
    "id": "682",
    "region": "kalos",
    "name": "粉香香",
    "alias": "Spritzee",
    "type": [ "Fairy" ],
    "info": {
      "image": "images/pokedex/682.png",
      "height": "0.2",
      "weight": "0.5",
      "category": "香水寶可夢",
      "text": "In the past, rather than using a perfume, royal ladies had a Spritzee  that would waft a fragrance they liked. They are popular today for this same reason. They are said to attact the opposite gender to you. "
    },
    "evolution": {
      "stage": "first",
      "with": "攜帶道具交換"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "治癒之心" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 0, "type": "Fairy", "name": "妖精之風" },
      { "rank": 1, "type": "Normal", "name": "氣味偵測" },
      { "rank": 1, "type": "Fairy", "name": "天使之吻" },
      { "rank": 2, "type": "Normal", "name": "迷人" },
      { "rank": 2, "type": "Normal", "name": "迴聲" },
      { "rank": 2, "type": "Fairy", "name": "撒嬌" },
      { "rank": 2, "type": "Fairy", "name": "月亮之力" },
      { "rank": 2, "type": "Fairy", "name": "吸取之吻" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 2, "type": "Psychic", "name": "冥想" },
      { "rank": 3, "type": "Normal", "name": "抓狂" },
      { "rank": 3, "type": "Fairy", "name": "魅惑之聲" },
      { "rank": 3, "type": "Fairy", "name": "薄霧場地" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Psychic", "name": "特性互換" },
      { "rank": 4, "type": "Normal", "name": "渴望" },
      { "rank": 4, "type": "Normal", "name": "定身法" },
      { "rank": 4, "type": "Normal", "name": "誘惑" }
    ],
    "isNovice": true
  },
  {
    "id": "683",
    "region": "kalos",
    "name": "芳香精",
    "alias": "Aromatisse",
    "type": [ "Fairy" ],
    "info": {
      "image": "images/pokedex/683.png",
      "height": "0.8",
      "weight": "15",
      "category": "芳香寶可夢",
      "text": "Its scent is so overpowering that makes it difficult to simply be in close proximity to it. It emits scents that its foes dislike in order to gain an edge in battle. They can also produce pleasant and healing aromas."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "治愈之心" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 0, "type": "Fairy", "name": "妖精之風" },
      { "rank": 1, "type": "Normal", "name": "氣味偵測" },
      { "rank": 1, "type": "Fairy", "name": "天使之吻" },
      { "rank": 2, "type": "Normal", "name": "迷人" },
      { "rank": 2, "type": "Normal", "name": "迴聲" },
      { "rank": 2, "type": "Fairy", "name": "撒嬌" },
      { "rank": 2, "type": "Fairy", "name": "月亮之力" },
      { "rank": 2, "type": "Fairy", "name": "吸取之吻" },
      { "rank": 2, "type": "Fairy", "name": "芳香薄霧" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 2, "type": "Psychic", "name": "冥想" },
      { "rank": 2, "type": "Psychic", "name": "治癒波動" },
      { "rank": 3, "type": "Normal", "name": "自我暗示" },
      { "rank": 3, "type": "Normal", "name": "抓狂" },
      { "rank": 3, "type": "Fairy", "name": "魅惑之聲" },
      { "rank": 3, "type": "Fairy", "name": "薄霧場地" },
      { "rank": 3, "type": "Psychic", "name": "反射壁" },
      { "rank": 3, "type": "Psychic", "name": "精神強念" },
      { "rank": 3, "type": "Psychic", "name": "特性互換" },
      { "rank": 4, "type": "Normal", "name": "定身法" },
      { "rank": 4, "type": "Normal", "name": "誘惑" },
      { "rank": 4, "type": "Fight", "name": "吸取拳" }
    ]
  },
  {
    "id": "684",
    "region": "kalos",
    "name": "綿綿泡芙",
    "alias": "Swirlix",
    "type": [ "Fairy" ],
    "info": {
      "image": "images/pokedex/684.png",
      "height": "0.4",
      "weight": "3",
      "category": "棉花糖寶可夢",
      "text": "Because it eats nothing but sweet fruit, honey and sugars, its fur is as sticky and sweet as cotton candy. To entangle its opponents in battle, it extrudes white and sticky threads but the foes end up eating them."
    },
    "evolution": {
      "stage": "first",
      "with": "攜帶道具交換"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "甜幕" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "和睦相處" },
      { "rank": 1, "type": "Dark", "name": "假哭" },
      { "rank": 1, "type": "Fairy", "name": "妖精之風" },
      { "rank": 2, "type": "Normal", "name": "蠻幹" },
      { "rank": 2, "type": "Normal", "name": "輪唱" },
      { "rank": 2, "type": "Fairy", "name": "吸取之吻" },
      { "rank": 2, "type": "Grass", "name": "棉花防守" },
      { "rank": 2, "type": "Grass", "name": "能量球" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 2, "type": "Grass", "name": "棉孢子" },
      { "rank": 3, "type": "Normal", "name": "神秘守護" },
      { "rank": 3, "type": "Normal", "name": "祈願" },
      { "rank": 3, "type": "Fairy", "name": "嬉鬧" },
      { "rank": 3, "type": "Psychic", "name": "光牆" },
      { "rank": 4, "type": "Normal", "name": "仿效" },
      { "rank": 4, "type": "Normal", "name": "幫助" },
      { "rank": 4, "type": "Poison", "name": "胃液" }
    ],
    "isNovice": true
  },
  {
    "id": "685",
    "region": "kalos",
    "name": "胖甜妮",
    "alias": "Slurpuff",
    "type": [ "Fairy" ],
    "info": {
      "image": "images/pokedex/685.png",
      "height": "0.8",
      "weight": "5",
      "category": "泡沫奶油寶可夢",
      "text": "This Pokémon lives in human cities and towns. It has an extremeley keen sense of smell. It puts its sensitive nose to use by helping bakers and chefs to find the most delicious ingredients."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "甜幕" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "甜甜香氣" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "和睦相處" },
      { "rank": 1, "type": "Dark", "name": "假哭" },
      { "rank": 1, "type": "Fairy", "name": "妖精之風" },
      { "rank": 2, "type": "Normal", "name": "蠻幹" },
      { "rank": 2, "type": "Normal", "name": "輪唱" },
      { "rank": 2, "type": "Fairy", "name": "吸取之吻" },
      { "rank": 2, "type": "Grass", "name": "棉花防守" },
      { "rank": 2, "type": "Grass", "name": "能量球" },
      { "rank": 2, "type": "Grass", "name": "芳香治療" },
      { "rank": 2, "type": "Grass", "name": "棉孢子" },
      { "rank": 3, "type": "Normal", "name": "神秘守護" },
      { "rank": 3, "type": "Normal", "name": "祈願" },
      { "rank": 3, "type": "Fairy", "name": "嬉鬧" },
      { "rank": 3, "type": "Psychic", "name": "光牆" },
      { "rank": 4, "type": "Normal", "name": "仿效" },
      { "rank": 4, "type": "Normal", "name": "腹鼓" },
      { "rank": 4, "type": "Fight", "name": "吸取拳" }
    ]
  },
  {
    "id": "686",
    "region": "kalos",
    "name": "好啦魷",
    "alias": "Inkay",
    "type": [ "Dark", "Psychic" ],
    "info": {
      "image": "images/pokedex/686.png",
      "height": "0.4",
      "weight": "3",
      "category": "迴轉寶可夢",
      "text": "It lives at the darkest parts of the sea. The spots on its body flash to  confuse predators and give it the opportunity to scuttle away. From time to time it likes to float upside down, it means it’s close to evolving."
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "唱反調", "吸盤" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "纏繞" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 1, "type": "Dark", "name": "欺詐" },
      { "rank": 1, "type": "Psychic", "name": "反射壁" },
      { "rank": 2, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 2, "type": "Dark", "name": "以牙還牙" },
      { "rank": 2, "type": "Dark", "name": "掉包" },
      { "rank": 2, "type": "Dark", "name": "顛倒" },
      { "rank": 2, "type": "Flying", "name": "啄食" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 2, "type": "Psychic", "name": "催眠術" },
      { "rank": 2, "type": "Psychic", "name": "精神波" },
      { "rank": 3, "type": "Normal", "name": "劈開" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Fight", "name": "蠻力" },
      { "rank": 3, "type": "Psychic", "name": "精神利刃" },
      { "rank": 3, "type": "Psychic", "name": "光牆" },
      { "rank": 4, "type": "Normal", "name": "單純光束" },
      { "rank": 4, "type": "Dark", "name": "拍落" },
      { "rank": 4, "type": "Psychic", "name": "力量平分" }
    ],
    "isNovice": true
  },
  {
    "id": "687",
    "region": "kalos",
    "name": "烏賊王",
    "alias": "Malamar",
    "type": [ "Dark", "Psychic" ],
    "info": {
      "image": "images/pokedex/687.png",
      "height": "1.5",
      "weight": "47",
      "category": "倒轉寶可夢",
      "text": "It lures prey close with hypnotic motions, then wraps its tentacles around it before finishing it off to eat it. This Pokémon are difficult to handle as they use their psychic abilities to do evil. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "唱反調", "吸盤" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "纏繞" },
      { "rank": 0, "type": "Flying", "name": "啄" },
      { "rank": 1, "type": "Dark", "name": "欺詐" },
      { "rank": 1, "type": "Psychic", "name": "反射壁" },
      { "rank": 2, "type": "Normal", "name": "虛張聲勢" },
      { "rank": 2, "type": "Dark", "name": "以牙還牙" },
      { "rank": 2, "type": "Dark", "name": "掉包" },
      { "rank": 2, "type": "Dark", "name": "顛倒" },
      { "rank": 2, "type": "Fight", "name": "起死回生" },
      { "rank": 2, "type": "Flying", "name": "啄食" },
      { "rank": 2, "type": "Psychic", "name": "幻象光線" },
      { "rank": 2, "type": "Psychic", "name": "催眠術" },
      { "rank": 2, "type": "Psychic", "name": "精神波" },
      { "rank": 3, "type": "Normal", "name": "劈開" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Fight", "name": "蠻力" },
      { "rank": 3, "type": "Psychic", "name": "精神利刃" },
      { "rank": 3, "type": "Psychic", "name": "光牆" },
      { "rank": 4, "type": "Normal", "name": "單純光束" },
      { "rank": 4, "type": "Dark", "name": "拍落" },
      { "rank": 4, "type": "Psychic", "name": "力量平分" }
    ]
  },
  {
    "id": "688",
    "region": "kalos",
    "name": "龜腳腳",
    "alias": "Binacle",
    "type": [ "Rock", "Water" ],
    "info": {
      "image": "images/pokedex/688.png",
      "height": "0.5",
      "weight": "31",
      "category": "雙手寶可夢",
      "text": "In the shallow sea, two Binacle live  inside a hollow rock. If they don’t get along, one of them will move to a different rock. They eat the sea weed that washes up on the shore and help eachother to survive. "
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "硬爪", "狙擊手" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 0, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Normal", "name": "亂抓" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Water", "name": "縮入殼中" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Bug", "name": "連斬" },
      { "rank": 2, "type": "Dark", "name": "磨爪" },
      { "rank": 2, "type": "Ground", "name": "擲泥" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 2, "type": "Rock", "name": "岩石打磨" },
      { "rank": 2, "type": "Water", "name": "貝殼夾擊" },
      { "rank": 3, "type": "Normal", "name": "破殼" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Fight", "name": "十字劈" },
      { "rank": 3, "type": "Water", "name": "貝殼刃" },
      { "rank": 4, "type": "Normal", "name": "搔癢" },
      { "rank": 4, "type": "Normal", "name": "幫助" },
      { "rank": 4, "type": "Rock", "name": "隱形岩" }
    ],
    "isNovice": true
  },
  {
    "id": "689",
    "region": "kalos",
    "name": "龜足巨鎧",
    "alias": "Barbaracle",
    "type": [ "Rock", "Water" ],
    "info": {
      "image": "images/pokedex/689.png",
      "height": "1.3",
      "weight": "96",
      "category": "集合寶可夢",
      "text": "When they evolve, the two Binacle multiply into seven. They all defend the rock they live in but each one  has a mind of their own and will move independently - They tend to follow the head’s orders, though."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 3, "max": 6 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "硬爪", "狙擊手" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "抓" },
      { "rank": 0, "type": "Ground", "name": "潑沙" },
      { "rank": 1, "type": "Normal", "name": "亂抓" },
      { "rank": 1, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Water", "name": "縮入殼中" },
      { "rank": 2, "type": "Normal", "name": "劈開" },
      { "rank": 2, "type": "Bug", "name": "連斬" },
      { "rank": 2, "type": "Dark", "name": "磨爪" },
      { "rank": 2, "type": "Ground", "name": "擲泥" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 2, "type": "Rock", "name": "岩石打磨" },
      { "rank": 2, "type": "Water", "name": "貝殼夾擊" },
      { "rank": 3, "type": "Normal", "name": "火箭頭鎚" },
      { "rank": 3, "type": "Normal", "name": "破殼" },
      { "rank": 3, "type": "Dark", "name": "暗襲要害" },
      { "rank": 3, "type": "Fight", "name": "十字劈" },
      { "rank": 3, "type": "Rock", "name": "尖石攻擊" },
      { "rank": 3, "type": "Water", "name": "貝殼刃" },
      { "rank": 4, "type": "Normal", "name": "幫助" },
      { "rank": 4, "type": "Dragon", "name": "二連劈" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ]
  },
  {
    "id": "690",
    "region": "kalos",
    "name": "垃垃藻",
    "alias": "Skrelp",
    "type": [ "Poison", "Water" ],
    "info": {
      "image": "images/pokedex/690.png",
      "height": "0.5",
      "weight": "7",
      "category": "似草寶可夢",
      "text": "Camouflaged as rotten kelp they spray liquid poison on a prey that approaches unaware. It needs to store a lot of energy to be able to evolve so it takes them a long time. Touching one will give you a fever."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "毒刺", "毒手" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "煙幕" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Dark", "name": "出奇一擊" },
      { "rank": 1, "type": "Water", "name": "泡沫" },
      { "rank": 2, "type": "Normal", "name": "影子分身" },
      { "rank": 2, "type": "Normal", "name": "保護色" },
      { "rank": 2, "type": "Poison", "name": "劇毒" },
      { "rank": 2, "type": "Poison", "name": "毒尾" },
      { "rank": 2, "type": "Poison", "name": "溶解液" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 3, "type": "Dragon", "name": "龍之波動" },
      { "rank": 3, "type": "Poison", "name": "污泥炸彈" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 3, "type": "Water", "name": "水流尾" },
      { "rank": 4, "type": "Poison", "name": "毒液陷阱" },
      { "rank": 4, "type": "Poison", "name": "毒菱" },
      { "rank": 4, "type": "Poison", "name": "溶化" }
    ],
    "isNovice": true
  },
  {
    "id": "691",
    "region": "kalos",
    "name": "毒藻龍",
    "alias": "Dragalge",
    "type": [ "Poison", "Dragon" ],
    "info": {
      "image": "images/pokedex/691.png",
      "height": "1.8",
      "weight": "81",
      "category": "似草寶可夢",
      "text": "Their poison is strong enough to eat through the hull of a tanker, and they spit it indiscriminately at anything that enters their territory. Touching them can be fatal if you are not treated within a few hours. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 4,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 3, "max": 7 }
    },
    "ability": [ "毒刺", "毒手" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "煙幕" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Normal", "name": "搖尾巴" },
      { "rank": 1, "type": "Dark", "name": "出奇一擊" },
      { "rank": 1, "type": "Water", "name": "泡沫" },
      { "rank": 2, "type": "Normal", "name": "影子分身" },
      { "rank": 2, "type": "Normal", "name": "保護色" },
      { "rank": 2, "type": "Dragon", "name": "龍尾" },
      { "rank": 2, "type": "Dragon", "name": "龍捲風" },
      { "rank": 2, "type": "Poison", "name": "劇毒" },
      { "rank": 2, "type": "Poison", "name": "毒尾" },
      { "rank": 2, "type": "Poison", "name": "溶解液" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 3, "type": "Dragon", "name": "龍之波動" },
      { "rank": 3, "type": "Poison", "name": "污泥炸彈" },
      { "rank": 3, "type": "Water", "name": "水砲" },
      { "rank": 3, "type": "Water", "name": "水流尾" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Poison", "name": "垃圾射擊" },
      { "rank": 4, "type": "Poison", "name": "溶化" }
    ]
  },
  {
    "id": "692",
    "region": "kalos",
    "name": "鐵臂槍蝦",
    "alias": "Clauncher",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/692.png",
      "height": "0.5",
      "weight": "8",
      "category": "水槍寶可夢",
      "text": "They live in beaches and shallow waters. They can knock down a flying prey by shooting water from their massive claws. Their shell is very though but their meat is delicious."
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "超級發射器" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "躍起" },
      { "rank": 0, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Normal", "name": "夾住" },
      { "rank": 1, "type": "Water", "name": "泡沫" },
      { "rank": 1, "type": "Water", "name": "玩水" },
      { "rank": 2, "type": "Normal", "name": "劍舞" },
      { "rank": 2, "type": "Normal", "name": "抓狂" },
      { "rank": 2, "type": "Rock", "name": "擊落" },
      { "rank": 2, "type": "Water", "name": "泡沫光線" },
      { "rank": 2, "type": "Water", "name": "蟹鉗錘" },
      { "rank": 3, "type": "Water", "name": "濁流" },
      { "rank": 3, "type": "Water", "name": "水流噴射" },
      { "rank": 3, "type": "Water", "name": "水之波動" },
      { "rank": 4, "type": "Normal", "name": "挺住" },
      { "rank": 4, "type": "Normal", "name": "幫助" },
      { "rank": 4, "type": "Ice", "name": "冰凍之風" }
    ],
    "isNovice": true
  },
  {
    "id": "693",
    "region": "kalos",
    "name": "鋼砲臂蝦",
    "alias": "Clawitzer",
    "type": [ "Water" ],
    "info": {
      "image": "images/pokedex/693.png",
      "height": "1.3",
      "weight": "35",
      "category": "發射器寶可夢",
      "text": "They can be seen swimming backwards using their launcher as a propulsor, but they usually stay at the bottom of the sea. Their meat  is tough and bitter so people don’t use them as food anymore. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 7 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "超級發射器" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "躍起" },
      { "rank": 0, "type": "Water", "name": "水槍" },
      { "rank": 1, "type": "Normal", "name": "夾住" },
      { "rank": 1, "type": "Water", "name": "泡沫" },
      { "rank": 1, "type": "Water", "name": "玩水" },
      { "rank": 2, "type": "Normal", "name": "劍舞" },
      { "rank": 2, "type": "Normal", "name": "抓狂" },
      { "rank": 2, "type": "Fight", "name": "波導彈" },
      { "rank": 2, "type": "Rock", "name": "擊落" },
      { "rank": 2, "type": "Water", "name": "水之波動" },
      { "rank": 2, "type": "Water", "name": "蟹鉗錘" },
      { "rank": 2, "type": "Water", "name": "泡沫光線" },
      { "rank": 3, "type": "Dark", "name": "惡之波動" },
      { "rank": 3, "type": "Dragon", "name": "龍之波動" },
      { "rank": 3, "type": "Psychic", "name": "治癒波動" },
      { "rank": 3, "type": "Water", "name": "濁流" },
      { "rank": 3, "type": "Water", "name": "水流噴射" },
      { "rank": 4, "type": "Normal", "name": "挺住" },
      { "rank": 4, "type": "Normal", "name": "幫助" },
      { "rank": 4, "type": "Ice", "name": "冰凍之風" }
    ]
  },
  {
    "id": "694",
    "region": "kalos",
    "name": "傘電蜥",
    "alias": "Helioptile",
    "type": [ "Normal", "Electric" ],
    "info": {
      "image": "images/pokedex/694.png",
      "height": "0.5",
      "weight": "6",
      "category": "發電寶可夢",
      "text": "They make their home in deserts. Using the sun, they can generate their energy by basking their frills since food is scarce where they live.They run pretty fast as to not burn themselves with the hot sand. "
    },
    "evolution": {
      "stage": "first",
      "with": "日之石"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "乾燥皮膚", "沙隱" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Normal", "name": "拍擊" },
      { "rank": 1, "type": "Electric", "name": "充電" },
      { "rank": 1, "type": "Electric", "name": "電擊" },
      { "rank": 2, "type": "Normal", "name": "旋風刀" },
      { "rank": 2, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Electric", "name": "電磁波" },
      { "rank": 2, "type": "Electric", "name": "拋物面充電" },
      { "rank": 2, "type": "Ground", "name": "重踏" },
      { "rank": 2, "type": "Ground", "name": "擲泥" },
      { "rank": 3, "type": "Electric", "name": "十萬伏特" },
      { "rank": 3, "type": "Electric", "name": "輸電" },
      { "rank": 3, "type": "Electric", "name": "伏特替換" },
      { "rank": 4, "type": "Electric", "name": "電磁飄浮" },
      { "rank": 4, "type": "Electric", "name": "電網" },
      { "rank": 4, "type": "Psychic", "name": "高速移動" }
    ],
    "isNovice": true
  },
  {
    "id": "695",
    "region": "kalos",
    "name": "光電傘蜥",
    "alias": "Heliolisk",
    "type": [ "Normal", "Electric" ],
    "info": {
      "image": "images/pokedex/695.png",
      "height": "1.0",
      "weight": "21",
      "category": "發電寶可夢",
      "text": "They flare their frills and generate energy. A single Heliolisk is able to generate enough power to light a skyscraper. Due to this, electricity companies are investing on breeding  and research for this species."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "乾燥皮膚", "沙隱" ],
    "moves": [
      { "rank": 1, "type": "Electric", "name": "充電" },
      { "rank": 2, "type": "Normal", "name": "旋風刀" },
      { "rank": 2, "type": "Normal", "name": "電光一閃" },
      { "rank": 2, "type": "Electric", "name": "拋物面充電" },
      { "rank": 2, "type": "Electric", "name": "怪異電波" },
      { "rank": 3, "type": "Electric", "name": "打雷" },
      { "rank": 3, "type": "Electric", "name": "輸電" },
      { "rank": 4, "type": "Normal", "name": "巨聲" },
      { "rank": 4, "type": "Fire", "name": "火焰拳" },
      { "rank": 4, "type": "Psychic", "name": "高速移動" }
    ]
  },
  {
    "id": "696",
    "region": "kalos",
    "name": "寶寶暴龍",
    "alias": "Tyrunt",
    "type": [ "Rock", "Dragon" ],
    "info": {
      "image": "images/pokedex/696.png",
      "height": "0.8",
      "weight": "26",
      "category": "幼君寶可夢",
      "text": "This Pokémon was restored from a fossil. If something happens that it doesn’t like, it throws a tantrum and runs wild. Many of the researchers that brought it back were attacked by its powerful jaws."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "強壯之顎" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "吼叫" },
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "忍耐" },
      { "rank": 1, "type": "Normal", "name": "踩踏" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Dragon", "name": "龍爪" },
      { "rank": 2, "type": "Dragon", "name": "龍尾" },
      { "rank": 2, "type": "Fairy", "name": "撒嬌" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 2, "type": "Rock", "name": "隱形岩" },
      { "rank": 3, "type": "Normal", "name": "角鑽" },
      { "rank": 3, "type": "Normal", "name": "大鬧一番" },
      { "rank": 3, "type": "Ground", "name": "地震" },
      { "rank": 4, "type": "Electric", "name": "雷電牙" },
      { "rank": 4, "type": "Fire", "name": "火焰牙" },
      { "rank": 4, "type": "Ice", "name": "冰凍牙" }
    ]
  },
  {
    "id": "697",
    "region": "kalos",
    "name": "怪顎龍",
    "alias": "Tyrantrum",
    "type": [ "Rock", "Dragon" ],
    "info": {
      "image": "images/pokedex/697.png",
      "height": "2.5",
      "weight": "405",
      "category": "暴君寶可夢",
      "text": "Nothing could stop this Pokémon 100 million years ago, it was a prehistoric king. Thanks to its giant jaws, which could shred thick metal plates as if they were paper, this Pokémon takes orders from no one. "
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 5,
    "attr": {
      "str": { "value": 3, "max": 7 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 7 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "強壯之顎" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "吼叫" },
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "忍耐" },
      { "rank": 1, "type": "Normal", "name": "踩踏" },
      { "rank": 2, "type": "Normal", "name": "大鬧一番" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Dragon", "name": "龍爪" },
      { "rank": 2, "type": "Dragon", "name": "龍尾" },
      { "rank": 2, "type": "Fairy", "name": "撒嬌" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 2, "type": "Rock", "name": "隱形岩" },
      { "rank": 3, "type": "Normal", "name": "終極衝擊" },
      { "rank": 3, "type": "Normal", "name": "角鑽" },
      { "rank": 3, "type": "Ground", "name": "地震" },
      { "rank": 3, "type": "Rock", "name": "岩崩" },
      { "rank": 3, "type": "Rock", "name": "雙刃頭鎚" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Dragon", "name": "龍之舞" },
      { "rank": 4, "type": "Poison", "name": "劇毒牙" }
    ]
  },
{
  "id": "698",
  "region": "kalos",
  "name": "冰雪龍",
  "alias": "Amaura",
  "type": [
    "Rock",
    "Ice"
  ],
  "info": {
    "image": "images/pokedex/698.png",
    "height": "1.3",
    "weight": "50",
    "category": "凍原寶可夢",
    "text": "從１億年前陷入冰封狀態的身體的一部分復活而來的古代寶可夢。這種性格溫和的寶可夢居住在沒有怪顎龍等凶暴敵人棲息的寒冷土地上。"
  },
  "evolution": {
    "stage": "first",
    "time": "medium"
  },
  "baseHP": 3,
  "rank": 1,
  "attr": {
    "str": { "value": 2, "max": 4 },
    "dex": { "value": 2, "max": 4 },
    "vit": { "value": 2, "max": 4 },
    "spe": { "value": 2, "max": 4 },
    "ins": { "value": 2, "max": 4 }
  },
  "ability": [
    "冰凍皮膚"
  ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "叫聲" },
    { "rank": 0, "type": "Ice", "name": "細雪" },
    { "rank": 1, "type": "Electric", "name": "電磁波" },
    { "rank": 1, "type": "Rock", "name": "落石" },
    { "rank": 1, "type": "Ice", "name": "冰凍之風" },
    { "rank": 2, "type": "Normal", "name": "猛撞" },
    { "rank": 2, "type": "Ice", "name": "白霧" },
    { "rank": 2, "type": "Ice", "name": "極光束" },
    { "rank": 2, "type": "Rock", "name": "原始之力" },
    { "rank": 2, "type": "Normal", "name": "輪唱" },
    { "rank": 2, "type": "Ice", "name": "雪崩" },
    { "rank": 2, "type": "Ice", "name": "冰雹" },
    { "rank": 2, "type": "Normal", "name": "自然之力" },
    { "rank": 3, "type": "Normal", "name": "再來一次" },
    { "rank": 3, "type": "Psychic", "name": "光牆" },
    { "rank": 3, "type": "Ice", "name": "冰凍光束" },
    { "rank": 3, "type": "Normal", "name": "破壞光線" },
    { "rank": 3, "type": "Ice", "name": "暴風雪" },
    { "rank": 4, "type": "Ground", "name": "大地之力" },
    { "rank": 4, "type": "Rock", "name": "隱形岩" },
    { "rank": 4, "type": "Water", "name": "水之波動" }
  ]
},
  {
    "id": "699",
    "region": "kalos",
    "name": "冰雪巨龍",
    "alias": "Aurorus",
    "type": [ "Rock", "Ice" ],
    "info": {
      "image": "images/pokedex/699.png",
      "height": "2.7",
      "weight": "900",
      "category": "凍原寶可夢",
      "text": "It produced a freezing cold mist from  the crystals on its sides and relied on size to deter predators. It also created tall walls of ice to block them. The one restored from the fossil is calm and has adapted well."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 6,
    "rank": 3,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "冰凍皮膚" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "叫聲" },
      { "rank": 0, "type": "Ice", "name": "細雪" },
      { "rank": 1, "type": "Electric", "name": "電磁波" },
      { "rank": 1, "type": "Ice", "name": "冰凍之風" },
      { "rank": 1, "type": "Rock", "name": "落石" },
      { "rank": 2, "type": "Normal", "name": "自然之力" },
      { "rank": 2, "type": "Normal", "name": "輪唱" },
      { "rank": 2, "type": "Normal", "name": "猛撞" },
      { "rank": 2, "type": "Ice", "name": "冰雹" },
      { "rank": 2, "type": "Ice", "name": "雪崩" },
      { "rank": 2, "type": "Ice", "name": "極光束" },
      { "rank": 2, "type": "Ice", "name": "白霧" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 3, "type": "Normal", "name": "破壞光線" },
      { "rank": 3, "type": "Normal", "name": "再來一次" },
      { "rank": 3, "type": "Ice", "name": "冷凍乾燥" },
      { "rank": 3, "type": "Ice", "name": "暴風雪" },
      { "rank": 3, "type": "Ice", "name": "冰凍光束" },
      { "rank": 3, "type": "Psychic", "name": "光牆" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" },
      { "rank": 4, "type": "Electric", "name": "放電" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ]
  },
{
  "id": "700",
  "region": "kalos",
  "name": "仙子伊布",
  "alias": "Sylveon",
  "type": [
    "Fairy"
  ],
  "info": {
    "image": "images/pokedex/700.png",
    "height": "1",
    "weight": "23.5",
    "category": "連結寶可夢",
    "text": "這隻罕見且討人喜歡的寶可夢會釋放出消除敵意的波動，藉此平息紛爭。據說只有和伊布締結了牢不可破羈絆的訓練家能見到這種寶可夢。"
  },
  "evolution": {
    "stage": "final",
    "by": "忠誠度5時"
  },
  "baseHP": "4",
  "rank": 2,
  "attr": {
    "str": { "value": 2, "max": 4 },
    "dex": { "value": 2, "max": 4 },
    "vit": { "value": 2, "max": 4 },
    "spe": { "value": 3, "max": 6 },
    "ins": { "value": 3, "max": 7 }
  },
  "ability": [
    "迷人之軀"
  ],
  "moves": [
    { "rank": 0, "type": "Normal", "name": "撞擊" },
    { "rank": 0, "type": "Normal", "name": "搖尾巴" },
    { "rank": 1, "type": "Ground", "name": "潑沙" },
    { "rank": 1, "type": "Normal", "name": "幫助" },
    { "rank": 1, "type": "Fairy", "name": "妖精之風" },
    { "rank": 2, "type": "Fairy", "name": "魅惑之聲" },
    { "rank": 2, "type": "Normal", "name": "電光一閃" },
    { "rank": 2, "type": "Normal", "name": "高速星星" },
    { "rank": 2, "type": "Fairy", "name": "吸取之吻" },
    { "rank": 2, "type": "Psychic", "name": "特性互換" },
    { "rank": 2, "type": "Fairy", "name": "薄霧場地" },
    { "rank": 2, "type": "Psychic", "name": "光牆" },
    { "rank": 3, "type": "Fairy", "name": "月亮之力" },
    { "rank": 3, "type": "Normal", "name": "珍藏" },
    { "rank": 3, "type": "Normal", "name": "自我暗示" },
    { "rank": 4, "type": "Normal", "name": "祈願" },
    { "rank": 4, "type": "Normal", "name": "巨聲" },
    { "rank": 4, "type": "Normal", "name": "誘惑" }
  ]
},
{
  "id": "701",
  "region": "kalos",
  "name": "摔角鷹人",
  "alias": "Hawlucha",
  "type": [
    "Fight",
    "Flying"
  ],
  "info": {
    "image": "images/pokedex/701.png",
    "height": "0.8",
    "weight": "21",
    "category": "摔角寶可夢",
    "text": "牠的體型雖小，但卻是個能與怪力或鐵掌力士等大型寶可夢打得不相上下的技術高手。利用翅膀從高處攻擊讓牠能在戰鬥中大大取得優勢。"
  },
  "evolution": {
    "stage": "final"
  },
  "baseHP": "4",
  "rank": 2,
  "attr": {
    "str": { "value": 2, "max": 5 },
    "dex": { "value": 3, "max": 6 },
    "vit": { "value": 2, "max": 5 },
    "spe": { "value": 2, "max": 5 },
    "ins": { "value": 2, "max": 4 }
  },
  "ability": [
    "柔軟",
    "輕裝"
  ],
  "moves": [
    { "rank": 0, "type": "Fight", "name": "看穿" },
    { "rank": 0, "type": "Normal", "name": "撞擊" },
    { "rank": 0, "type": "Dark", "name": "磨爪" },
    { "rank": 1, "type": "Fight", "name": "空手劈" },
    { "rank": 1, "type": "Flying", "name": "翅膀攻擊" },
    { "rank": 2, "type": "Flying", "name": "羽棲" },
    { "rank": 2, "type": "Flying", "name": "燕返" },
    { "rank": 2, "type": "Normal", "name": "再來一次" },
    { "rank": 2, "type": "Dark", "name": "投擲" },
    { "rank": 2, "type": "Fight", "name": "飛身重壓" },
    { "rank": 2, "type": "Flying", "name": "彈跳" },
    { "rank": 2, "type": "Normal", "name": "蠻幹" },
    { "rank": 2, "type": "Flying", "name": "羽毛舞" },
    { "rank": 3, "type": "Fight", "name": "飛膝踢" },
    { "rank": 3, "type": "Flying", "name": "神鳥猛擊" },
    { "rank": 3, "type": "Flying", "name": "自由落體" },
    { "rank": 3, "type": "Normal", "name": "劍舞" },
    { "rank": 4, "type": "Electric", "name": "雷電拳" },
    { "rank": 4, "type": "Dragon", "name": "二連劈" },
    { "rank": 4, "type": "Flying", "name": "順風" }
  ]
},
  {
    "id": "702",
    "region": "kalos",
    "name": "咚咚鼠",
    "alias": "Dedenne",
    "type": [ "Electric", "Fairy" ],
    "info": {
      "image": "images/pokedex/702.png",
      "height": "0.2",
      "weight": "2",
      "category": "天線寶可夢",
      "text": "The tail is used to absorb electricity  from power outlets. They communicate with each other by feeling the static on their whiskers. Its cute and cuddly appearance make it a favourite pet."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 0,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 3, "max": 6 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "頰囊", "撿拾" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "搖尾巴" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Electric", "name": "充電" },
      { "rank": 1, "type": "Electric", "name": "電擊" },
      { "rank": 2, "type": "Normal", "name": "打鼾" },
      { "rank": 2, "type": "Electric", "name": "充電光束" },
      { "rank": 2, "type": "Electric", "name": "伏特替換" },
      { "rank": 2, "type": "Electric", "name": "電磁波" },
      { "rank": 2, "type": "Electric", "name": "蹭蹭臉頰" },
      { "rank": 2, "type": "Electric", "name": "拋物面充電" },
      { "rank": 2, "type": "Fairy", "name": "撒嬌" },
      { "rank": 2, "type": "Psychic", "name": "睡覺" },
      { "rank": 3, "type": "Normal", "name": "找夥伴" },
      { "rank": 3, "type": "Electric", "name": "放電" },
      { "rank": 3, "type": "Electric", "name": "打雷" },
      { "rank": 3, "type": "Fairy", "name": "嬉鬧" },
      { "rank": 4, "type": "Normal", "name": "憤怒門牙" },
      { "rank": 4, "type": "Electric", "name": "怪異電波" },
      { "rank": 4, "type": "Steel", "name": "鐵尾" }
    ]
  },
  {
    "id": "703",
    "region": "kalos",
    "name": "小碎鑽",
    "alias": "Carbink",
    "type": [ "Rock", "Fairy" ],
    "info": {
      "image": "images/pokedex/703.png",
      "height": "0.3",
      "weight": "5",
      "category": "寶石寶可夢",
      "text": "It’s occasionally found at drilling zones and excavations in caves. Born from temperature and pressure  deep underground, it shoots beams from the stone in its head. They can live for hundreds of years."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 0,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 3, "max": 7 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 3, "max": 7 }
    },
    "ability": [ "恆淨之軀" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變硬" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 1, "type": "Normal", "name": "棱角化" },
      { "rank": 1, "type": "Rock", "name": "落石" },
      { "rank": 2, "type": "Normal", "name": "抓狂" },
      { "rank": 2, "type": "Psychic", "name": "特性互換" },
      { "rank": 2, "type": "Psychic", "name": "防守平分" },
      { "rank": 2, "type": "Psychic", "name": "反射壁" },
      { "rank": 2, "type": "Rock", "name": "力量寶石" },
      { "rank": 2, "type": "Rock", "name": "原始之力" },
      { "rank": 2, "type": "Rock", "name": "隱形岩" },
      { "rank": 2, "type": "Rock", "name": "擊落" },
      { "rank": 3, "type": "Normal", "name": "神秘守護" },
      { "rank": 3, "type": "Fairy", "name": "月亮之力" },
      { "rank": 3, "type": "Psychic", "name": "光牆" },
      { "rank": 3, "type": "Rock", "name": "尖石攻擊" },
      { "rank": 4, "type": "Psychic", "name": "魔法反射" },
      { "rank": 4, "type": "Psychic", "name": "重力" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ]
  },
  {
    "id": "704",
    "region": "kalos",
    "name": "黏黏寶",
    "alias": "Goomy",
    "type": [ "Dragon" ],
    "info": {
      "image": "images/pokedex/704.png",
      "height": "0.3",
      "weight": "3",
      "category": "軟體生物寶可夢",
      "text": "The weakest but best tempered Dragon Pokémon known. It lives in damp and shady places, so its body doesn’t dry out. It’s covered in a slimy membrane that makes things slide off of it."
    },
    "evolution": {
      "stage": "first",
      "time": "medium"
    },
    "baseHP": 3,
    "rank": 0,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "食草", "濕潤之軀" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Water", "name": "泡沫" },
      { "rank": 1, "type": "Normal", "name": "守住" },
      { "rank": 1, "type": "Grass", "name": "吸取" },
      { "rank": 2, "type": "Normal", "name": "忍耐" },
      { "rank": 2, "type": "Dragon", "name": "龍息" },
      { "rank": 2, "type": "Water", "name": "求雨" },
      { "rank": 3, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 3, "type": "Normal", "name": "抓狂" },
      { "rank": 3, "type": "Dragon", "name": "龍之波動" },
      { "rank": 3, "type": "Water", "name": "濁流" },
      { "rank": 4, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 4, "type": "Poison", "name": "溶化" },
      { "rank": 4, "type": "Water", "name": "水之波動" }
    ],
    "isNovice": true
  },
  {
    "id": "705",
    "region": "kalos",
    "name": "黏美兒",
    "alias": "Sliggoo",
    "type": [ "Dragon" ],
    "info": {
      "image": "images/pokedex/705.png",
      "height": "0.8",
      "weight": "17",
      "category": "軟體生物寶可夢",
      "text": "It drives away foes by releasing a sticky and corrosive liquid. Its eyes devolved and it became blind, now it uses its four horns to sense sounds and smells, rather than using its ears or nose."
    },
    "evolution": {
      "stage": "second",
      "time": "medium"
    },
    "baseHP": 4,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 3, "max": 6 }
    },
    "ability": [ "食草", "濕潤之軀" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Water", "name": "泡沫" },
      { "rank": 1, "type": "Normal", "name": "守住" },
      { "rank": 1, "type": "Grass", "name": "吸取" },
      { "rank": 2, "type": "Normal", "name": "忍耐" },
      { "rank": 2, "type": "Dragon", "name": "龍息" },
      { "rank": 2, "type": "Water", "name": "求雨" },
      { "rank": 3, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 3, "type": "Normal", "name": "抓狂" },
      { "rank": 3, "type": "Dragon", "name": "龍之波動" },
      { "rank": 3, "type": "Water", "name": "濁流" },
      { "rank": 4, "type": "Fight", "name": "雙倍奉還" },
      { "rank": 4, "type": "Poison", "name": "溶化" },
      { "rank": 4, "type": "Water", "name": "水之波動" }
    ]
  },
  {
    "id": "706",
    "region": "kalos",
    "name": "黏美龍",
    "alias": "Goodra",
    "type": [ "Dragon" ],
    "info": {
      "image": "images/pokedex/706.png",
      "height": "2.0",
      "weight": "150",
      "category": "龍寶可夢",
      "text": "Definitely the friendliest of all Dragons. This Pokémon will hug its beloved Trainer, leaving them covered in sticky slime. In areas with heavy rainfall during the year, one or two may make an appearance."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 5,
    "rank": 2,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 3, "max": 7 }
    },
    "ability": [ "食草", "濕潤之軀" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Water", "name": "泡沫" },
      { "rank": 1, "type": "Normal", "name": "守住" },
      { "rank": 1, "type": "Grass", "name": "吸取" },
      { "rank": 2, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 2, "type": "Normal", "name": "抓狂" },
      { "rank": 2, "type": "Normal", "name": "忍耐" },
      { "rank": 2, "type": "Normal", "name": "佯攻" },
      { "rank": 2, "type": "Dragon", "name": "龍之波動" },
      { "rank": 2, "type": "Dragon", "name": "龍息" },
      { "rank": 2, "type": "Water", "name": "水流尾" },
      { "rank": 2, "type": "Water", "name": "濁流" },
      { "rank": 2, "type": "Water", "name": "求雨" },
      { "rank": 3, "type": "Dragon", "name": "逆鱗" },
      { "rank": 3, "type": "Grass", "name": "強力鞭打" },
      { "rank": 4, "type": "Dragon", "name": "流星群" },
      { "rank": 4, "type": "Electric", "name": "電擊波" },
      { "rank": 4, "type": "Fight", "name": "蠻力" }
    ]
  },
  {
    "id": "707",
    "region": "kalos",
    "name": "鑰圈兒",
    "alias": "Klefki",
    "type": [ "Steel", "Fairy" ],
    "info": {
      "image": "images/pokedex/707.png",
      "height": "0.2",
      "weight": "3",
      "category": "鑰匙串寶可夢",
      "text": "It adapted well to live with humans. Klefki jingle the objects they collect when they are distressed. People trust them with their keys to vaults and safes because they are very careful with their collection."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 5 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "惡作劇之心" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Fairy", "name": "妖精之鎖" },
      { "rank": 1, "type": "Fairy", "name": "妖精之風" },
      { "rank": 1, "type": "Ghost", "name": "驚嚇" },
      { "rank": 2, "type": "Dark", "name": "無理取鬧" },
      { "rank": 2, "type": "Dark", "name": "欺詐" },
      { "rank": 2, "type": "Fairy", "name": "戲法防守" },
      { "rank": 2, "type": "Fairy", "name": "吸取之吻" },
      { "rank": 2, "type": "Ground", "name": "撒菱" },
      { "rank": 2, "type": "Psychic", "name": "封印" },
      { "rank": 2, "type": "Steel", "name": "鏡光射擊" },
      { "rank": 2, "type": "Steel", "name": "金屬音" },
      { "rank": 3, "type": "Normal", "name": "回收利用" },
      { "rank": 3, "type": "Fairy", "name": "嬉鬧" },
      { "rank": 3, "type": "Psychic", "name": "回复封鎖" },
      { "rank": 3, "type": "Psychic", "name": "魔法空間" },
      { "rank": 4, "type": "Dark", "name": "掉包" },
      { "rank": 4, "type": "Electric", "name": "電磁飄浮" },
      { "rank": 4, "type": "Steel", "name": "鐵壁" }
    ]
  },
  {
    "id": "708",
    "region": "kalos",
    "name": "小木靈",
    "alias": "Phantump",
    "type": [ "Ghost", "Grass" ],
    "info": {
      "image": "images/pokedex/708.png",
      "height": "0.4",
      "weight": "7",
      "category": "樹樁寶可夢",
      "text": "According to the old tales, these Pokémon are stumps possessed by the spirits of children who were lost in the forest. They prefer to live in abandoned woods and lure people  to the darkness to play with them."
    },
    "evolution": {
      "stage": "first",
      "with": "交換"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 4 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "自然回復", "察覺" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Ghost", "name": "奇異之光" },
      { "rank": 1, "type": "Normal", "name": "生長" },
      { "rank": 1, "type": "Ghost", "name": "驚嚇" },
      { "rank": 2, "type": "Dark", "name": "出奇一擊" },
      { "rank": 2, "type": "Fire", "name": "鬼火" },
      { "rank": 2, "type": "Ghost", "name": "詛咒" },
      { "rank": 2, "type": "Grass", "name": "森林詛咒" },
      { "rank": 2, "type": "Grass", "name": "寄生種子" },
      { "rank": 2, "type": "Grass", "name": "紮根" },
      { "rank": 3, "type": "Ghost", "name": "潛靈奇襲" },
      { "rank": 3, "type": "Ghost", "name": "同命" },
      { "rank": 3, "type": "Grass", "name": "木角" },
      { "rank": 3, "type": "Grass", "name": "木槌" },
      { "rank": 4, "type": "Grass", "name": "煩惱種子" },
      { "rank": 4, "type": "Grass", "name": "種子炸彈" },
      { "rank": 4, "type": "Poison", "name": "毒液陷阱" }
    ],
    "isNovice": true
  },
  {
    "id": "709",
    "region": "kalos",
    "name": "朽木妖",
    "alias": "Trevenant",
    "type": [ "Ghost", "Grass" ],
    "info": {
      "image": "images/pokedex/709.png",
      "height": "1.5",
      "weight": "71",
      "category": "老樹寶可夢",
      "text": "Using its roots as a nervous system it controls the trees in the forest. It’s kind to the Pokémon that reside inside its body but it is ruthless to anyone that harms its forest, turning  them into haunted trees forever."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 4,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "自然回復", "察覺" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Ghost", "name": "奇異之光" },
      { "rank": 1, "type": "Normal", "name": "生長" },
      { "rank": 1, "type": "Ghost", "name": "驚嚇" },
      { "rank": 2, "type": "Dark", "name": "出奇一擊" },
      { "rank": 2, "type": "Fire", "name": "鬼火" },
      { "rank": 2, "type": "Ghost", "name": "詛咒" },
      { "rank": 2, "type": "Grass", "name": "森林詛咒" },
      { "rank": 2, "type": "Grass", "name": "寄生種子" },
      { "rank": 2, "type": "Grass", "name": "紮根" },
      { "rank": 2, "type": "Grass", "name": "木角" },
      { "rank": 3, "type": "Ghost", "name": "暗影爪" },
      { "rank": 3, "type": "Ghost", "name": "潛靈奇襲" },
      { "rank": 3, "type": "Ghost", "name": "同命" },
      { "rank": 3, "type": "Grass", "name": "木槌" },
      { "rank": 4, "type": "Fight", "name": "吸取拳" },
      { "rank": 4, "type": "Ghost", "name": "怨念" },
      { "rank": 4, "type": "Psychic", "name": "封印" }
    ]
  },
  {
    "id": "710",
    "region": "kalos",
    "name": "南瓜精",
    "alias": "Pumpkaboo",
    "type": [ "Ghost", "Grass" ],
    "info": {
      "image": "images/pokedex/710.png",
      "height": "0.8",
      "weight": "15",
      "category": "南瓜寶可夢",
      "text": "You can see them dwelling on farms during the autumn season. The pumpkin body is inhabited by a spirit trapped in this world. As the sun sets, it becomes restless and active. Don’t ever follow their light at night."
    },
    "evolution": {
      "stage": "first",
      "with": "交換"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 4 }
    },
    "ability": [ "撿拾", "察覺" ],
    "moves": [
      { "rank": 0, "type": "Ghost", "name": "奇異之光" },
      { "rank": 0, "type": "Ghost", "name": "驚嚇" },
      { "rank": 0, "type": "Psychic", "name": "戲法" },
      { "rank": 1, "type": "Normal", "name": "鬼面" },
      { "rank": 1, "type": "Ghost", "name": "萬聖夜" },
      { "rank": 1, "type": "Grass", "name": "煩惱種子" },
      { "rank": 2, "type": "Ghost", "name": "影子偷襲" },
      { "rank": 2, "type": "Grass", "name": "種子機關槍" },
      { "rank": 2, "type": "Grass", "name": "寄生種子" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 3, "type": "Normal", "name": "分擔痛楚" },
      { "rank": 3, "type": "Ghost", "name": "暗影球" },
      { "rank": 3, "type": "Grass", "name": "種子炸彈" },
      { "rank": 4, "type": "Dark", "name": "欺詐" },
      { "rank": 4, "type": "Dark", "name": "惡之波動" },
      { "rank": 4, "type": "Grass", "name": "光合作用" }
    ],
    "isNovice": true
  },
  {
    "id": "711",
    "region": "kalos",
    "name": "南瓜怪人",
    "alias": "Gourgeist",
    "type": [ "Ghost", "Grass" ],
    "info": {
      "image": "images/pokedex/711.png",
      "height": "1.7",
      "weight": "39",
      "category": "南瓜寶可夢",
      "text": "They wander in the town streets every new moon. It wraps its prey on its arms and sings joyfully as it observes the suffering of the victim. Hearing it sing will give you horrible nightmares."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 2,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 2, "max": 5 },
      "vit": { "value": 3, "max": 7 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "撿拾", "察覺" ],
    "moves": [
      { "rank": 0, "type": "Ghost", "name": "奇異之光" },
      { "rank": 0, "type": "Ghost", "name": "驚嚇" },
      { "rank": 0, "type": "Psychic", "name": "戲法" },
      { "rank": 1, "type": "Normal", "name": "鬼面" },
      { "rank": 1, "type": "Ghost", "name": "萬聖夜" },
      { "rank": 1, "type": "Grass", "name": "煩惱種子" },
      { "rank": 2, "type": "Ghost", "name": "影子偷襲" },
      { "rank": 2, "type": "Grass", "name": "種子機關槍" },
      { "rank": 2, "type": "Grass", "name": "寄生種子" },
      { "rank": 2, "type": "Grass", "name": "飛葉快刀" },
      { "rank": 3, "type": "Normal", "name": "大爆炸" },
      { "rank": 3, "type": "Normal", "name": "分擔痛楚" },
      { "rank": 3, "type": "Ghost", "name": "潛靈奇襲" },
      { "rank": 3, "type": "Ghost", "name": "暗影球" },
      { "rank": 3, "type": "Grass", "name": "種子炸彈" },
      { "rank": 4, "type": "Dark", "name": "欺詐" },
      { "rank": 4, "type": "Dark", "name": "惡之波動" },
      { "rank": 4, "type": "Grass", "name": "光合作用" }
    ]
  },
  {
    "id": "712",
    "region": "kalos",
    "name": "冰寶",
    "alias": "Bergmite",
    "type": [ "Ice" ],
    "info": {
      "image": "images/pokedex/712.png",
      "height": "1.0",
      "weight": "100",
      "category": "冰塊寶可夢",
      "text": "They live in small herds close to the mountains. It blocks attacks with the ice that shields its body and uses cold air to repair any cracks with new ice. They are wary of humans  as they rarely get to see one."
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 1,
    "attr": {
      "str": { "value": 2, "max": 4 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "我行我素", "冰凍之軀" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變硬" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Ice", "name": "細雪" },
      { "rank": 1, "type": "Normal", "name": "猛撞" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Ice", "name": "冰凍之風" },
      { "rank": 2, "type": "Normal", "name": "高速旋轉" },
      { "rank": 2, "type": "Normal", "name": "棱角化" },
      { "rank": 2, "type": "Ghost", "name": "詛咒" },
      { "rank": 2, "type": "Ice", "name": "雪崩" },
      { "rank": 2, "type": "Ice", "name": "冰球" },
      { "rank": 2, "type": "Ice", "name": "冰凍牙" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Normal", "name": "自我再生" },
      { "rank": 3, "type": "Ice", "name": "暴風雪" },
      { "rank": 4, "type": "Normal", "name": "挺住" },
      { "rank": 4, "type": "Psychic", "name": "鏡面反射" },
      { "rank": 4, "type": "Water", "name": "水之波動" }
    ],
    "isNovice": true
  },
  {
    "id": "713",
    "region": "kalos",
    "name": "冰岩怪",
    "alias": "Avalugg",
    "type": [ "Ice" ],
    "info": {
      "image": "images/pokedex/713.png",
      "height": "2.0",
      "weight": "505",
      "category": "冰山寶可夢",
      "text": "They carry their Bergmite offspring on their backs. Its Ice body is hard as steel and its cumbersome frame crushes anything that stands in its way. They are capable of swimming but they move very slowly."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 3,
    "attr": {
      "str": { "value": 3, "max": 6 },
      "dex": { "value": 1, "max": 3 },
      "vit": { "value": 4, "max": 9 },
      "spe": { "value": 1, "max": 3 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "我行我素", "冰凍之軀" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "變硬" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Ice", "name": "細雪" },
      { "rank": 1, "type": "Normal", "name": "猛撞" },
      { "rank": 1, "type": "Dark", "name": "咬住" },
      { "rank": 1, "type": "Ice", "name": "冰凍之風" },
      { "rank": 2, "type": "Normal", "name": "高速旋轉" },
      { "rank": 2, "type": "Normal", "name": "棱角化" },
      { "rank": 2, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 2, "type": "Dark", "name": "咬碎" },
      { "rank": 2, "type": "Ghost", "name": "詛咒" },
      { "rank": 2, "type": "Ice", "name": "雪崩" },
      { "rank": 2, "type": "Ice", "name": "冰球" },
      { "rank": 2, "type": "Ice", "name": "冰凍牙" },
      { "rank": 2, "type": "Steel", "name": "鐵壁" },
      { "rank": 3, "type": "Normal", "name": "火箭頭鎚" },
      { "rank": 3, "type": "Normal", "name": "捨身衝撞" },
      { "rank": 3, "type": "Normal", "name": "自我再生" },
      { "rank": 3, "type": "Ice", "name": "暴風雪" },
      { "rank": 4, "type": "Normal", "name": "擋路" },
      { "rank": 4, "type": "Fight", "name": "蠻力" },
      { "rank": 4, "type": "Steel", "name": "鐵頭" }
    ]
  },
  {
    "id": "714",
    "region": "kalos",
    "name": "嗡蝠",
    "alias": "Noibat",
    "type": [ "Flying", "Dragon" ],
    "info": {
      "image": "images/pokedex/714.png",
      "height": "0.5",
      "weight": "8",
      "category": "音波寶可夢",
      "text": "They live in dark caves and use echolocation to move around. Their enormous ears can emit ultrasonic  waves that cause dizziness. Groups of them can even take on prey several times their size. "
    },
    "evolution": {
      "stage": "first",
      "time": "slow"
    },
    "baseHP": 3,
    "rank": 2,
    "attr": {
      "str": { "value": 1, "max": 3 },
      "dex": { "value": 2, "max": 4 },
      "vit": { "value": 1, "max": 3 },
      "spe": { "value": 2, "max": 4 },
      "ins": { "value": 1, "max": 3 }
    },
    "ability": [ "察覺", "穿透" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "超音波" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "刺耳聲" },
      { "rank": 1, "type": "Flying", "name": "起風" },
      { "rank": 1, "type": "Grass", "name": "吸取" },
      { "rank": 2, "type": "Normal", "name": "旋風刀" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Flying", "name": "順風" },
      { "rank": 2, "type": "Flying", "name": "羽棲" },
      { "rank": 2, "type": "Flying", "name": "空氣利刃" },
      { "rank": 2, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Normal", "name": "憤怒門牙" },
      { "rank": 3, "type": "Normal", "name": "吹飛" },
      { "rank": 3, "type": "Flying", "name": "暴風" },
      { "rank": 3, "type": "Flying", "name": "空氣斬" },
      { "rank": 4, "type": "Normal", "name": "憤怒門牙" },
      { "rank": 4, "type": "Dark", "name": "惡之波動" },
      { "rank": 4, "type": "Dragon", "name": "逆鱗" }
    ],
    "isNovice": true
  },
  {
    "id": "715",
    "region": "kalos",
    "name": "音波龍",
    "alias": "Noivern",
    "type": [ "Flying", "Dragon" ],
    "info": {
      "image": "images/pokedex/715.png",
      "height": "1.5",
      "weight": "85",
      "category": "音波寶可夢",
      "text": "They fly during the new moon and attack careless prey. Nothing can beat them in a battle in the dark. To keep them calm you should feed them fruit or else they’ll release shocking ultrasonic waves."
    },
    "evolution": {
      "stage": "final"
    },
    "baseHP": 4,
    "rank": 4,
    "attr": {
      "str": { "value": 2, "max": 5 },
      "dex": { "value": 3, "max": 7 },
      "vit": { "value": 2, "max": 5 },
      "spe": { "value": 3, "max": 6 },
      "ins": { "value": 2, "max": 5 }
    },
    "ability": [ "察覺", "穿透" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "超音波" },
      { "rank": 0, "type": "Normal", "name": "撞擊" },
      { "rank": 0, "type": "Normal", "name": "刺耳聲" },
      { "rank": 1, "type": "Flying", "name": "起風" },
      { "rank": 1, "type": "Grass", "name": "吸取" },
      { "rank": 2, "type": "Normal", "name": "旋風刀" },
      { "rank": 2, "type": "Dark", "name": "咬住" },
      { "rank": 2, "type": "Dragon", "name": "龍之波動" },
      { "rank": 2, "type": "Fairy", "name": "月光" },
      { "rank": 2, "type": "Flying", "name": "順風" },
      { "rank": 2, "type": "Flying", "name": "羽棲" },
      { "rank": 2, "type": "Flying", "name": "空氣利刃" },
      { "rank": 2, "type": "Flying", "name": "翅膀攻擊" },
      { "rank": 2, "type": "Psychic", "name": "高速移動" },
      { "rank": 3, "type": "Normal", "name": "爆音波" },
      { "rank": 3, "type": "Normal", "name": "憤怒門牙" },
      { "rank": 3, "type": "Normal", "name": "吹飛" },
      { "rank": 3, "type": "Flying", "name": "暴風" },
      { "rank": 3, "type": "Flying", "name": "空氣斬" },
      { "rank": 4, "type": "Dragon", "name": "流星群" },
      { "rank": 4, "type": "Fire", "name": "熱風" },
      { "rank": 4, "type": "Flying", "name": "神鳥猛擊" }
    ]
  },
  {
    "id": "716",
    "region": "kalos",
    "name": "哲爾尼亞斯",
    "alias": "Xerneas",
    "type": [ "Fairy" ],
    "info": {
      "image": "images/pokedex/716.png",
      "height": "3.0",
      "weight": "215",
      "category": "無資料",
      "text": "A Kalos legend tells about the eternal  struggle between life and death. In the story an ancient King tried to obtain eternal life and the power to make its loved ones live again."
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 6,
    "rank": 5,
    "attr": {
      "str": { "value": 7, "max": 7 },
      "dex": { "value": 6, "max": 6 },
      "vit": { "value": 6, "max": 6 },
      "spe": { "value": 7, "max": 7 },
      "ins": { "value": 6, "max": 6 }
    },
    "ability": [ "妖精氣場" ],
    "moves": [
      { "rank": 5, "type": "Normal", "name": "蠻幹" },
      { "rank": 5, "type": "Normal", "name": "終極衝擊" },
      { "rank": 5, "type": "Normal", "name": "自然之力" },
      { "rank": 5, "type": "Normal", "name": "自我暗示" },
      { "rank": 5, "type": "Normal", "name": "猛撞" },
      { "rank": 5, "type": "Bug", "name": "超級角擊" },
      { "rank": 5, "type": "Dark", "name": "暗襲要害" },
      { "rank": 5, "type": "Dragon", "name": "逆鱗" },
      { "rank": 5, "type": "Electric", "name": "打雷" },
      { "rank": 5, "type": "Fairy", "name": "薄霧場地" },
      { "rank": 5, "type": "Fairy", "name": "月亮之力" },
      { "rank": 5, "type": "Fairy", "name": "大地掌控" },
      { "rank": 5, "type": "Fight", "name": "近身戰" },
      { "rank": 5, "type": "Grass", "name": "木角" },
      { "rank": 5, "type": "Grass", "name": "紮根" },
      { "rank": 5, "type": "Grass", "name": "芳香治療" },
      { "rank": 5, "type": "Ice", "name": "極光束" },
      { "rank": 5, "type": "Psychic", "name": "反射壁" },
      { "rank": 5, "type": "Psychic", "name": "精神衝擊" },
      { "rank": 5, "type": "Psychic", "name": "重力" },
      { "rank": 5, "type": "Psychic", "name": "光牆" },
      { "rank": 5, "type": "Psychic", "name": "治癒波動" }
    ],
    "isLegend": true
  },
  {
    "id": "717",
    "region": "kalos",
    "name": "伊裴爾塔爾",
    "alias": "Yveltal",
    "type": [ "Dark", "Flying" ],
    "info": {
      "image": "images/pokedex/717.png",
      "height": "5.8",
      "weight": "203",
      "category": "無資料",
      "text": "A Kalos legend tells about the eternal  struggle between life and death. The main tale is about a King full of grief and hate who built a doomsday  machine to kill everyone in the world. "
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 8,
    "rank": 5,
    "attr": {
      "str": { "value": 7, "max": 7 },
      "dex": { "value": 6, "max": 6 },
      "vit": { "value": 6, "max": 6 },
      "spe": { "value": 7, "max": 7 },
      "ins": { "value": 6, "max": 6 }
    },
    "ability": [ "暗黑氣場" ],
    "moves": [
      { "rank": 5, "type": "Normal", "name": "破壞光線" },
      { "rank": 5, "type": "Normal", "name": "定身法" },
      { "rank": 5, "type": "Normal", "name": "影子分身" },
      { "rank": 5, "type": "Normal", "name": "旋風刀" },
      { "rank": 5, "type": "Dark", "name": "突襲" },
      { "rank": 5, "type": "Dark", "name": "欺詐" },
      { "rank": 5, "type": "Dark", "name": "惡之波動" },
      { "rank": 5, "type": "Dark", "name": "大聲咆哮" },
      { "rank": 5, "type": "Dark", "name": "挑釁" },
      { "rank": 5, "type": "Dragon", "name": "龍之俯衝" },
      { "rank": 5, "type": "Fight", "name": "真氣彈" },
      { "rank": 5, "type": "Fire", "name": "熱風" },
      { "rank": 5, "type": "Flying", "name": "清除濃霧" },
      { "rank": 5, "type": "Flying", "name": "順風" },
      { "rank": 5, "type": "Flying", "name": "神鳥猛擊" },
      { "rank": 5, "type": "Flying", "name": "死亡之翼" },
      { "rank": 5, "type": "Flying", "name": "空氣斬" },
      { "rank": 5, "type": "Flying", "name": "羽棲" },
      { "rank": 5, "type": "Flying", "name": "暴風" },
      { "rank": 5, "type": "Ghost", "name": "潛靈奇襲" },
      { "rank": 5, "type": "Psychic", "name": "精神強念" },
      { "rank": 5, "type": "Water", "name": "求雨" }
    ],
    "isLegend": true
  },
  {
    "id": "718-1",
    "region": "kalos",
    "name": "基格爾德 (細胞)",
    "alias": "Zygarde-cell",
    "type": [ "Dragon", "Ground" ],
    "info": {
      "image": "images/pokedex/718-1.png",
      "height": "0.2",
      "weight": "0.1",
      "category": "無資料",
      "text": "Only the the cores react to stimuli, the cells remain mostly inanimate. They gather in great numbers to create and strengthen Zygarde."
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 1,
    "rank": 0,
    "attr": {
      "str": { "value": 1, "max": 1 },
      "dex": { "value": 1, "max": 1 },
      "vit": { "value": 1, "max": 1 },
      "spe": { "value": 1, "max": 1 },
      "ins": { "value": 1, "max": 1 }
    },
    "ability": [ "氣場破壞" ],
    "moves": [
      { "rank": 0, "type": "Normal", "name": "挺住" }
    ],
    "isLegend": true
  },
  {
    "id": "718-10",
    "region": "kalos",
    "name": "基格爾德 (10%)",
    "alias": "Zygarde-10",
    "type": [ "Dragon", "Ground" ],
    "info": {
      "image": "images/pokedex/718-10.png",
      "height": "1.2",
      "weight": "33",
      "category": "無資料",
      "text": "When 10% of the Zygarde Cells gather, they form this Pokémon, the more cells it gathers the more its strength will increase. "
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 4,
    "rank": 4,
    "attr": {
      "str": { "value": 6, "max": 6 },
      "dex": { "value": 6, "max": 6 },
      "vit": { "value": 5, "max": 5 },
      "spe": { "value": 4, "max": 4 },
      "ins": { "value": 5, "max": 5 }
    },
    "ability": [ "氣場破壞", "群聚變形" ],
    "moves": [
      { "rank": 5, "type": "Normal", "name": "大蛇瞪眼" },
      { "rank": 5, "type": "Ground", "name": "重踏" },
      { "rank": 5, "type": "Dragon", "name": "龍息" },
      { "rank": 5, "type": "Dark", "name": "咬住" },
      { "rank": 5, "type": "Normal", "name": "神秘守護" },
      { "rank": 5, "type": "Ground", "name": "挖洞" },
      { "rank": 5, "type": "Normal", "name": "綁緊" },
      { "rank": 5, "type": "Ground", "name": "大地神力" },
      { "rank": 5, "type": "Rock", "name": "沙暴" },
      { "rank": 5, "type": "Ice", "name": "黑霧" },
      { "rank": 5, "type": "Dark", "name": "咬碎" },
      { "rank": 5, "type": "Ground", "name": "地震" },
      { "rank": 5, "type": "Normal", "name": "保護色" },
      { "rank": 5, "type": "Dragon", "name": "龍之波動" },
      { "rank": 5, "type": "Poison", "name": "盤蜷" },
      { "rank": 5, "type": "Dragon", "name": "逆鱗" },
      { "rank": 5, "type": "Normal", "name": "神速" },
      { "rank": 5, "type": "Dragon", "name": "龍之舞" },
      { "rank": 5, "type": "Ground", "name": "千波激盪" },
      { "rank": 5, "type": "Ground", "name": "千箭齊發" }
    ],
    "isLegend": true
  },
  {
    "id": "718-50",
    "region": "kalos",
    "name": "基格爾德 (50%)",
    "alias": "Zygarde",
    "type": [ "Dragon", "Ground" ],
    "info": {
      "image": "images/pokedex/718-50.png",
      "height": "5.0",
      "weight": "305",
      "category": "無資料",
      "text": "Underground tunnels have been found all over the Kalos Region. There are rumors of a creature who lives in them that attacks people damaging the ecosystem."
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 5,
    "rank": 5,
    "attr": {
      "str": { "value": 6, "max": 6 },
      "dex": { "value": 6, "max": 6 },
      "vit": { "value": 7, "max": 7 },
      "spe": { "value": 5, "max": 5 },
      "ins": { "value": 6, "max": 6 }
    },
    "ability": [ "氣場破壞", "群聚變形" ],
    "moves": [
      { "rank": 5, "type": "Normal", "name": "大蛇瞪眼" },
      { "rank": 5, "type": "Ground", "name": "重踏" },
      { "rank": 5, "type": "Dragon", "name": "龍息" },
      { "rank": 5, "type": "Dark", "name": "咬住" },
      { "rank": 5, "type": "Normal", "name": "神秘守護" },
      { "rank": 5, "type": "Ground", "name": "挖洞" },
      { "rank": 5, "type": "Normal", "name": "綁緊" },
      { "rank": 5, "type": "Ground", "name": "大地神力" },
      { "rank": 5, "type": "Rock", "name": "沙暴" },
      { "rank": 5, "type": "Ice", "name": "黑霧" },
      { "rank": 5, "type": "Dark", "name": "咬碎" },
      { "rank": 5, "type": "Ground", "name": "地震" },
      { "rank": 5, "type": "Normal", "name": "保護色" },
      { "rank": 5, "type": "Dragon", "name": "龍之波動" },
      { "rank": 5, "type": "Poison", "name": "盤蜷" },
      { "rank": 5, "type": "Dragon", "name": "逆鱗" },
      { "rank": 5, "type": "Normal", "name": "神速" },
      { "rank": 5, "type": "Dragon", "name": "龍之舞" },
      { "rank": 5, "type": "Ground", "name": "千波激盪" },
      { "rank": 5, "type": "Ground", "name": "千箭齊發" },
      { "rank": 5, "type": "Dragon", "name": "核心懲罰者" },
      { "rank": 5, "type": "Ground", "name": "跺腳" }
    ],
    "isLegend": true
  },
  {
    "id": "718-100",
    "region": "kalos",
    "name": "基格爾德 (100%)",
    "alias": "Zygarde-complete",
    "type": [ "Dragon", "Ground" ],
    "info": {
      "image": "images/pokedex/718-100.png",
      "height": "4.5",
      "weight": "610",
      "category": "無資料",
      "text": "The complete form of Zygarde."
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 11,
    "rank": 5,
    "attr": {
      "str": { "value": 6, "max": 6 },
      "dex": { "value": 5, "max": 5 },
      "vit": { "value": 7, "max": 7 },
      "spe": { "value": 5, "max": 5 },
      "ins": { "value": 6, "max": 6 }
    },
    "ability": [ "氣場破壞" ],
    "moves": [
      { "rank": 5, "type": "Normal", "name": "大蛇瞪眼" },
      { "rank": 5, "type": "Ground", "name": "重踏" },
      { "rank": 5, "type": "Dragon", "name": "龍息" },
      { "rank": 5, "type": "Dark", "name": "咬住" },
      { "rank": 5, "type": "Normal", "name": "神秘守護" },
      { "rank": 5, "type": "Ground", "name": "挖洞" },
      { "rank": 5, "type": "Normal", "name": "綁緊" },
      { "rank": 5, "type": "Ground", "name": "大地神力" },
      { "rank": 5, "type": "Rock", "name": "沙暴" },
      { "rank": 5, "type": "Ice", "name": "黑霧" },
      { "rank": 5, "type": "Dark", "name": "咬碎" },
      { "rank": 5, "type": "Ground", "name": "地震" },
      { "rank": 5, "type": "Normal", "name": "保護色" },
      { "rank": 5, "type": "Dragon", "name": "龍之波動" },
      { "rank": 5, "type": "Poison", "name": "盤蜷" },
      { "rank": 5, "type": "Dragon", "name": "逆鱗" },
      { "rank": 5, "type": "Normal", "name": "神速" },
      { "rank": 5, "type": "Dragon", "name": "龍之舞" },
      { "rank": 5, "type": "Ground", "name": "千波激盪" },
      { "rank": 5, "type": "Ground", "name": "千箭齊發" },
      { "rank": 5, "type": "Dragon", "name": "核心懲罰者" },
      { "rank": 5, "type": "Ground", "name": "跺腳" },
      { "rank": 5, "type": "Dragon", "name": "流星群" },
      { "rank": 5, "type": "Normal", "name": "覺醒力量" }
    ],
    "isLegend": true
  },
  {
    "id": "719",
    "region": "kalos",
    "name": "蒂安希",
    "alias": "Diancie",
    "type": [ "Rock", "Fairy" ],
    "info": {
      "image": "images/pokedex/719.png",
      "height": "0.7",
      "weight": "8",
      "category": "無資料",
      "text": "Pokédex registers it as #703 Carbink. The popular saying goes like this:  “If you put a Carbon under pressure you will get a Diamond” But it surely was not refering to a Pokémon... or was it?"
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 4,
    "rank": 4,
    "attr": {
      "str": { "value": 6, "max": 6 },
      "dex": { "value": 4, "max": 4 },
      "vit": { "value": 8, "max": 8 },
      "spe": { "value": 6, "max": 6 },
      "ins": { "value": 8, "max": 8 }
    },
    "ability": [ "恆淨之軀" ],
    "moves": [
      { "rank": 5, "type": "Normal", "name": "神秘守護" },
      { "rank": 5, "type": "Normal", "name": "抓狂" },
      { "rank": 5, "type": "Normal", "name": "棱角化" },
      { "rank": 5, "type": "Normal", "name": "變硬" },
      { "rank": 5, "type": "Normal", "name": "撞擊" },
      { "rank": 5, "type": "Electric", "name": "電磁飄浮" },
      { "rank": 5, "type": "Fairy", "name": "魔法閃耀" },
      { "rank": 5, "type": "Fairy", "name": "月亮之力" },
      { "rank": 5, "type": "Psychic", "name": "光牆" },
      { "rank": 5, "type": "Psychic", "name": "戲法空間" },
      { "rank": 5, "type": "Psychic", "name": "特性互換" },
      { "rank": 5, "type": "Psychic", "name": "防守平分" },
      { "rank": 5, "type": "Psychic", "name": "反射壁" },
      { "rank": 5, "type": "Rock", "name": "鑽石風暴" },
      { "rank": 5, "type": "Rock", "name": "尖石攻擊" },
      { "rank": 5, "type": "Rock", "name": "力量寶石" },
      { "rank": 5, "type": "Rock", "name": "原始之力" },
      { "rank": 5, "type": "Rock", "name": "隱形岩" },
      { "rank": 5, "type": "Rock", "name": "擊落" },
      { "rank": 5, "type": "Rock", "name": "落石" },
      { "rank": 5, "type": "Steel", "name": "鐵壁" }
    ],
    "isLegend": true
  },
  {
    "id": "719-M",
    "region": "kalos",
    "name": "超級蒂安希",
    "alias": "Diancie",
    "type": [ "Rock", "Fairy" ],
    "info": {
      "image": "images/pokedex/719-M.png",
      "height": "1.1",
      "weight": "27",
      "category": "無資料",
      "text": "Pokédex registers it as #703 Carbink. The popular saying goes like this:  “If you put a Carbon under pressure you will get a Diamond” But it surely was not refering to a Pokémon... or was it?"
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 5,
    "rank": 4,
    "attr": {
      "str": { "value": 8, "max": 8 },
      "dex": { "value": 6, "max": 6 },
      "vit": { "value": 6, "max": 6 },
      "spe": { "value": 8, "max": 8 },
      "ins": { "value": 6, "max": 6 }
    },
    "ability": [ "魔法鏡" ],
    "moves": [
      { "rank": 5, "type": "Normal", "name": "神秘守護" },
      { "rank": 5, "type": "Normal", "name": "抓狂" },
      { "rank": 5, "type": "Normal", "name": "棱角化" },
      { "rank": 5, "type": "Normal", "name": "變硬" },
      { "rank": 5, "type": "Normal", "name": "撞擊" },
      { "rank": 5, "type": "Electric", "name": "電磁飄浮" },
      { "rank": 5, "type": "Fairy", "name": "魔法閃耀" },
      { "rank": 5, "type": "Fairy", "name": "月亮之力" },
      { "rank": 5, "type": "Psychic", "name": "光牆" },
      { "rank": 5, "type": "Psychic", "name": "戲法空間" },
      { "rank": 5, "type": "Psychic", "name": "特性互換" },
      { "rank": 5, "type": "Psychic", "name": "防守平分" },
      { "rank": 5, "type": "Psychic", "name": "反射壁" },
      { "rank": 5, "type": "Rock", "name": "鑽石風暴" },
      { "rank": 5, "type": "Rock", "name": "尖石攻擊" },
      { "rank": 5, "type": "Rock", "name": "力量寶石" },
      { "rank": 5, "type": "Rock", "name": "原始之力" },
      { "rank": 5, "type": "Rock", "name": "隱形岩" },
      { "rank": 5, "type": "Rock", "name": "擊落" },
      { "rank": 5, "type": "Rock", "name": "落石" },
      { "rank": 5, "type": "Steel", "name": "鐵壁" }
    ],
    "isLegend": true
  },
  {
    "id": "720",
    "region": "kalos",
    "name": "懲戒胡帕",
    "alias": "Hoopa",
    "type": [ "Psychic", "Ghost" ],
    "info": {
      "image": "images/pokedex/720.png",
      "height": "0.8",
      "weight": "9",
      "category": "無資料",
      "text": "There is a story of an old demon whose power had to be contained by a spell. The spell was a partial success as the demon could still roam free, but its power and evil was greatly diminished."
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 4,
    "rank": 4,
    "attr": {
      "str": { "value": 6, "max": 6 },
      "dex": { "value": 5, "max": 5 },
      "vit": { "value": 4, "max": 4 },
      "spe": { "value": 8, "max": 8 },
      "ins": { "value": 7, "max": 7 }
    },
    "ability": [ "魔術師" ],
    "moves": [
      { "rank": 5, "type": "Psychic", "name": "戲法" },
      { "rank": 5, "type": "Ghost", "name": "同命" },
      { "rank": 5, "type": "Psychic", "name": "交換場地" },
      { "rank": 5, "type": "Psychic", "name": "念力" },
      { "rank": 5, "type": "Ghost", "name": "驚嚇" },
      { "rank": 5, "type": "Psychic", "name": "魔法反射" },
      { "rank": 5, "type": "Psychic", "name": "光牆" },
      { "rank": 5, "type": "Psychic", "name": "幻象光線" },
      { "rank": 5, "type": "Psychic", "name": "特性互換" },
      { "rank": 5, "type": "Psychic", "name": "力量平分" },
      { "rank": 5, "type": "Psychic", "name": "防守平分" },
      { "rank": 5, "type": "Ghost", "name": "潛靈奇襲" },
      { "rank": 5, "type": "Psychic", "name": "意念頭鎚" },
      { "rank": 5, "type": "Psychic", "name": "奇妙空間" },
      { "rank": 5, "type": "Psychic", "name": "戲法空間" },
      { "rank": 5, "type": "Ghost", "name": "暗影球" },
      { "rank": 5, "type": "Dark", "name": "詭計" },
      { "rank": 5, "type": "Psychic", "name": "精神強念" },
      { "rank": 5, "type": "Psychic", "name": "意念移物" },
      { "rank": 5, "type": "Psychic", "name": "魔法空間" },
      { "rank": 5, "type": "Psychic", "name": "異次元洞" },
      { "rank": 5, "type": "Normal", "name": "密語" }
    ],
    "isLegend": true
  },
  {
    "id": "720-Unbound",
    "region": "kalos",
    "name": "解放胡帕",
    "alias": "Hoopa-unbound",
    "type": [ "Psychic", "Dark" ],
    "info": {
      "image": "images/pokedex/720-Unbound.png",
      "height": "6.5",
      "weight": "490",
      "category": "無資料",
      "text": "There is a story of an old demon whose power unleashed horrors from other dimensions into earth, ripping the fabrics of existance, it opened portals to bring evil upon.Hoopa Unbound Psychic Dark"
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 7,
    "rank": 5,
    "attr": {
      "str": { "value": 8, "max": 8 },
      "dex": { "value": 5, "max": 5 },
      "vit": { "value": 4, "max": 4 },
      "spe": { "value": 9, "max": 9 },
      "ins": { "value": 6, "max": 6 }
    },
    "ability": [ "魔術師" ],
    "moves": [
      { "rank": 5, "type": "Psychic", "name": "戲法" },
      { "rank": 5, "type": "Ghost", "name": "同命" },
      { "rank": 5, "type": "Psychic", "name": "交換場地" },
      { "rank": 5, "type": "Psychic", "name": "念力" },
      { "rank": 5, "type": "Ghost", "name": "驚嚇" },
      { "rank": 5, "type": "Psychic", "name": "魔法反射" },
      { "rank": 5, "type": "Psychic", "name": "光牆" },
      { "rank": 5, "type": "Psychic", "name": "幻象光線" },
      { "rank": 5, "type": "Psychic", "name": "特性互換" },
      { "rank": 5, "type": "Psychic", "name": "力量平分" },
      { "rank": 5, "type": "Psychic", "name": "防守平分" },
      { "rank": 5, "type": "Dark", "name": "拍落" },
      { "rank": 5, "type": "Psychic", "name": "意念頭鎚" },
      { "rank": 5, "type": "Psychic", "name": "奇妙空間" },
      { "rank": 5, "type": "Psychic", "name": "戲法空間" },
      { "rank": 5, "type": "Dark", "name": "惡之波動" },
      { "rank": 5, "type": "Dark", "name": "詭計" },
      { "rank": 5, "type": "Psychic", "name": "精神強念" },
      { "rank": 5, "type": "Psychic", "name": "意念移物" },
      { "rank": 5, "type": "Psychic", "name": "魔法空間" },
      { "rank": 5, "type": "Dark", "name": "異次元猛攻" },
      { "rank": 5, "type": "Normal", "name": "破壞光線" },
      { "rank": 5, "type": "Dark", "name": "搶奪" },
      { "rank": 5, "type": "Dark", "name": "地獄突刺" }
    ],
    "isLegend": true
  },
  {
    "id": "721",
    "region": "kalos",
    "name": "波爾凱尼恩",
    "alias": "Volcanion",
    "type": [ "Fire", "Water" ],
    "info": {
      "image": "images/pokedex/721.png",
      "height": "1.7",
      "weight": "195",
      "category": "無資料",
      "text": "In the early days of world exploring,  there are records of an entire mountain blowing up in a cloud of steam. The explorers claimed that a  creature in the fog was responsible."
    },
    "evolution": {
      "stage": "unknown"
    },
    "baseHP": 4,
    "rank": 4,
    "attr": {
      "str": { "value": 6, "max": 6 },
      "dex": { "value": 5, "max": 5 },
      "vit": { "value": 7, "max": 7 },
      "spe": { "value": 7, "max": 7 },
      "ins": { "value": 5, "max": 5 }
    },
    "ability": [ "儲水" ],
    "moves": [
      { "rank": 5, "type": "Normal", "name": "大爆炸" },
      { "rank": 5, "type": "Normal", "name": "泰山壓頂" },
      { "rank": 5, "type": "Normal", "name": "氣象球" },
      { "rank": 5, "type": "Normal", "name": "踩踏" },
      { "rank": 5, "type": "Normal", "name": "猛撞" },
      { "rank": 5, "type": "Fight", "name": "蠻力" },
      { "rank": 5, "type": "Fire", "name": "過熱" },
      { "rank": 5, "type": "Fire", "name": "蓄能焰襲" },
      { "rank": 5, "type": "Fire", "name": "閃焰衝鋒" },
      { "rank": 5, "type": "Grass", "name": "日光束" },
      { "rank": 5, "type": "Ground", "name": "大地之力" },
      { "rank": 5, "type": "Ice", "name": "黑霧" },
      { "rank": 5, "type": "Ice", "name": "白霧" },
      { "rank": 5, "type": "Water", "name": "蒸汽爆炸" },
      { "rank": 5, "type": "Water", "name": "水砲" },
      { "rank": 5, "type": "Water", "name": "熱水" },
      { "rank": 5, "type": "Water", "name": "水之波動" }
    ],
    "isLegend": true
  }
]);

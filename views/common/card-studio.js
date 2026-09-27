"use strict";

(function mountCardStudio() {
    const samples = {
        coc: {
            name: "吾是示範",
            role: "保險調查員",
            trait: "野外活動愛好者",
            image: "/common/card-designs/investigator.svg",
            stats: [
                { section: "未分類", name: "HP", itemA: "11", itemB: "11" },
                { section: "未分類", name: "MP", itemA: "16", itemB: "16" },
                { section: "未分類", name: "SAN", itemA: "80", itemB: "80" },
                { section: "未分類", name: "體格", itemA: "1" },
                { section: "未分類", name: "DB", itemA: "+1d4" },
                { section: "未分類", name: "MOV", itemA: "8" },
                { section: "未分類", name: "護甲", itemA: "0" },
                { section: "未分類", name: "幸運", itemA: "60" },
                { section: "未分類", name: "鬥毆", itemA: "49" },
            ],
            rolls: [
                { section: "未分類", name: "HP擲骰", itemA: "1d{HP}" },
                { section: "未分類", name: "1d100+HP", itemA: "1d100+{hp}" },
                { section: "未分類", name: "幸運檢定", itemA: "CC {幸運}" },
                { section: "未分類", name: "鬥毆", itemA: "CC 49" },
                { section: "未分類", name: "鬥毆（變數）", itemA: "CC {鬥毆}" },
                { section: "未分類", name: "棍+db", itemA: "1d6{db}" },
                { section: "未分類", name: "心理學", itemA: "10" },
                { section: "未分類", name: "信譽", itemA: "CC 5" },
                { section: "未分類", name: "偵查", itemA: "CC 25" },
                { section: "未分類", name: "sc", itemA: ".sc {SAN}" },
                { section: "未分類", name: "魔法", itemA: "1" },
                { section: "未分類", name: "小刀", itemA: "1d4+1{db}" },
            ],
            notes: [
                { section: "未分類", name: "調查筆記", itemA: "這是測試筆記內容" },
                { section: "未分類", name: "戰鬥記錄", itemA: "戰鬥日誌記錄" },
            ],
        },
        ddb: {
            name: "Sad Unlucky",
            role: "Druid 5 · Circle of the Moon",
            trait: "Wood Elf / Outlander · Spell Slots L1:4 L2:3 L3:1/2",
            image: "/common/card-designs/portrait.svg",
            stats: [
                { section: "生命", name: "HP", itemA: "38", itemB: "38" },
                { section: "生命", name: "Speed", itemA: "35 ft." },
                { section: "生命", name: "Initiative", itemA: "+2" },
                { section: "生命", name: "Darkvision", itemA: "60 ft." },
                { section: "生命", name: "AC", itemA: "15" },
                { section: "屬性", name: "STR", itemA: "8", itemB: "-1" },
                { section: "屬性", name: "DEX", itemA: "15", itemB: "2" },
                { section: "屬性", name: "CON", itemA: "15", itemB: "2" },
                { section: "屬性", name: "INT", itemA: "10", itemB: "0" },
                { section: "屬性", name: "WIS", itemA: "18", itemB: "4" },
                { section: "屬性", name: "CHA", itemA: "10", itemB: "0" },
                { section: "屬性", name: "PB", itemA: "3" },
                { section: "被動", name: "Passive Perception", itemA: "17" },
                { section: "被動", name: "Passive Investigation", itemA: "10" },
                { section: "被動", name: "Passive Insight", itemA: "14" },
                { section: "施法", name: "Spell DC", itemA: "15" },
            ],
            rolls: [
                { section: "生命", name: "Initiative", itemA: "1d20+2" },
                { section: "豁免", name: "Save STR", itemA: "1d20-1" },
                { section: "豁免", name: "Save DEX", itemA: "1d20+2" },
                { section: "豁免", name: "Save CON", itemA: "1d20+2" },
                { section: "豁免", name: "Save INT", itemA: "1d20+3" },
                { section: "豁免", name: "Save WIS", itemA: "1d20+7" },
                { section: "豁免", name: "Save CHA", itemA: "1d20+0" },
                { section: "技能", name: "Acrobatics", itemA: "1d20+2" },
                { section: "技能", name: "Animal Handling", itemA: "1d20+7" },
                { section: "技能", name: "Arcana", itemA: "1d20+0" },
                { section: "技能", name: "Athletics", itemA: "1d20+2" },
                { section: "技能", name: "Deception", itemA: "1d20+0" },
                { section: "技能", name: "History", itemA: "1d20+0" },
                { section: "技能", name: "Insight", itemA: "1d20+4" },
                { section: "技能", name: "Intimidation", itemA: "1d20+0" },
                { section: "技能", name: "Investigation", itemA: "1d20+0" },
                { section: "技能", name: "Medicine", itemA: "1d20+4" },
                { section: "技能", name: "Nature", itemA: "1d20+3" },
                { section: "技能", name: "Perception", itemA: "1d20+7" },
                { section: "技能", name: "Performance", itemA: "1d20+0" },
                { section: "技能", name: "Persuasion", itemA: "1d20+0" },
                { section: "技能", name: "Religion", itemA: "1d20+0" },
                { section: "技能", name: "Sleight of Hand", itemA: "1d20+2" },
                { section: "技能", name: "Stealth", itemA: "1d20+2" },
                { section: "技能", name: "Survival", itemA: "1d20+7" },
                { section: "戰鬥", name: "Scimitar", itemA: "hit:1d20+5; dmg:1d6+2" },
                { section: "戰鬥", name: "Thorn Whip", itemA: "hit:1d20+7; dmg:2d6" },
                { section: "戰鬥", name: "Unarmed Strike", itemA: "hit:1d20-1; dmg:0" },
                { section: "戰鬥", name: "Healing Word", itemA: "1d4+4" },
                { section: "未分類", name: "Ping", itemA: "1d20" },
            ],
            notes: [
                { section: "身分", name: "Proficiencies", itemA: "Armor: Light Armor, Medium Armor, Shields | Languages: Common, Elvish, Druidic, Draconic" },
                { section: "法術", name: "Guidance", itemA: "Cantrip · Divination · Conc." },
                { section: "法術", name: "Druidcraft", itemA: "Cantrip · Transmutation" },
                { section: "法術", name: "Detect Magic", itemA: "1st · Divination · Conc. · Ritual" },
                { section: "法術", name: "Faerie Fire", itemA: "1st · Evocation · DEX DC 15 · Conc." },
                { section: "法術", name: "Healing Word", itemA: "1st · Evocation" },
                { section: "法術", name: "Speak with Animals", itemA: "1st · Divination · Ritual" },
                { section: "法術", name: "Absorb Elements", itemA: "1st · Abjuration" },
                { section: "法術", name: "Goodberry", itemA: "1st · Transmutation" },
                { section: "法術", name: "Heat Metal", itemA: "2nd · Transmutation · Conc." },
                { section: "法術", name: "Lesser Restoration", itemA: "2nd · Abjuration" },
                { section: "法術", name: "Water Breathing", itemA: "3rd · Transmutation · Ritual" },
                { section: "裝備", name: "Equipment", itemA: "Equipped: Shield, Leather, Scimitar, Backpack | Carried: Quarterstaff, Clothes,…" },
                { section: "特性", name: "Mask of the Wild", itemA: "You can attempt to hide even when you are only lightly obscured." },
                { section: "特性", name: "Wild Shape", itemA: "As an action, you can magically assume the shape of a beast that you have seen before." },
                { section: "特性", name: "Combat Wild Shape", itemA: "You can use Wild Shape as a bonus action and you can use a bonus action to expend one spell slot to regain 1d8 HP per level of the spell slot expended." },
                { section: "特性", name: "Wild Companion", itemA: "As an action, you can expend a use of your Wild Shape feature to cast the find familiar spell." },
                { section: "未分類", name: "Note", itemA: "before import" },
            ],
        },
    };

    const links = [
        ["/card", "現有"],
        ["/card6", "戲單"],
        ["/card7", "筆記"],
        ["/card8", "轉播"],
        ["/card9", "檔案"],
        ["/card10", "星圖"],
        ["/card11", "現代條"],
        ["/card12", "古帳"],
        ["/card13", "方格"],
        ["/card14", "倉單"],
        ["/card15", "夜表"],
        ["/card16", "八圍"],
        ["/card17", "密表"],
        ["/card18", "舊卡"],
        ["/card19", "格線"],
        ["/card20", "三欄"],
        ["/card21", "人物誌"],
        ["/card22", "戰術"],
        ["/card23", "手帳"],
        ["/card24", "索引"],
        ["/card25", "靈魂"],
    ];

    const sampleChoices = [["coc", "調查員"], ["ddb", "德魯伊"]];
    const querySample = new URLSearchParams(globalThis.location.search).get("sample");
    const sampleKey = Object.hasOwn(samples, querySample) ? querySample : "coc";
    const sample = samples[sampleKey];

    function shownValue(item) {
        const current = item.itemA || "";
        const max = item.itemB || "";
        return max ? current + " / " + max : current;
    }

    function fillList(list) {
        const kind = list.dataset.studioList;
        const template = list.querySelector("template");
        if (!template) {
            return;
        }
        let lastSection = "";
        for (const item of sample[kind] || []) {
            if (item.section && item.section !== lastSection) {
                const heading = document.createElement("div");
                heading.className = "studio-section";
                heading.textContent = item.section;
                list.append(heading);
                lastSection = item.section;
            }
            const fragment = template.content.cloneNode(true);
            for (const node of fragment.querySelectorAll("[data-field]")) {
                const field = node.dataset.field;
                if (field === "bar") {
                    const current = Number(item.itemA);
                    const max = Number(item.itemB);
                    const pct = Number.isFinite(current) && Number.isFinite(max) && max > 0
                        ? Math.max(0, Math.min(100, (current / max) * 100))
                        : 0;
                    node.style.width = pct + "%";
                    continue;
                }
                if (field === "a") {
                    node.textContent = item.itemA || "";
                    continue;
                }
                if (field === "b") {
                    node.textContent = item.itemB || "";
                    continue;
                }
                node.textContent = field === "value" ? shownValue(item) : (item[field] || "");
            }
            list.append(fragment);
        }
    }

    function fill(root) {
        for (const node of root.querySelectorAll("[data-studio]")) {
            const key = node.dataset.studio;
            if (key === "image") {
                node.src = sample.image;
                node.alt = sample.name;
                continue;
            }
            node.textContent = sample[key] || "";
        }
        for (const list of root.querySelectorAll("[data-studio-list]")) {
            fillList(list);
        }
    }

    function mountNav() {
        const bar = document.querySelector("[data-studio-nav]");
        if (!bar) {
            return;
        }
        const here = (globalThis.location.pathname || "/").replace(/\/$/, "") || "/";
        for (const [href, label] of links) {
            const link = document.createElement("a");
            link.href = href + "?sample=" + sampleKey;
            link.textContent = label;
            if (here === href) {
                link.setAttribute("aria-current", "page");
            }
            bar.append(link);
        }
        for (const [id, label] of sampleChoices) {
            const link = document.createElement("a");
            link.href = here + "?sample=" + id;
            link.textContent = label;
            if (id === sampleKey) {
                link.setAttribute("aria-current", "page");
            }
            bar.append(link);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        mountNav();
        fill(document);
    });
})();

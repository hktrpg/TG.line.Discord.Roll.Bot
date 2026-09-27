"use strict";

(function mountCards() {
    const root = document.getElementById("cards-root");
    const design = document.body.dataset.design || "6";
    const title = document.body.dataset.title || ("cards" + design);
    const ideas = {
        6: "戲單：肖像如海報，技能如場次表。",
        7: "筆記：橫線紙，資料像手寫條目。",
        8: "轉播：深色下三分之一，數值像直播字幕。",
        9: "檔案：牛皮紙夾，分欄如卷宗。",
        10: "星圖：暗底散點，能力像星座標籤。",
        11: "現代條：白底細進度條。",
        12: "古帳：雙線表格。",
        13: "方格：每一項都是同樣大小的格子。",
        14: "倉單：米色資源條。",
        15: "夜表：深色，肖像在右。",
        16: "八圍：圓形肖像配方塊。",
        17: "密表：白底多欄，字距緊。",
        18: "舊卡：打字機檔案卡。",
        19: "格線：類、名稱、現在、上限。",
        20: "三欄：報紙直欄。",
        21: "人物誌：雜誌留白與襯線。",
        22: "戰術：深色金線，同一視線。",
        23: "手帳：左右對開。",
        24: "索引：藍字編號。",
        25: "靈魂：立繪主導，底欄生命。"
    };
    const params = new URLSearchParams(location.search);
    const state = {
        system: params.get("system") === "dnd" ? "dnd" : "coc",
        density: params.get("density") === "open" ? "open" : "compact",
        editing: false,
        card: null,
        channel: ""
    };

    function esc(value) {
        return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[ch]));
    }

    function groups(list) {
        const order = [];
        const map = new Map();
        for (const item of list || []) {
            const key = item.section || "未分類";
            if (!map.has(key)) {
                map.set(key, []);
                order.push(key);
            }
            map.get(key).push(item);
        }
        return order.map((key) => ({ key, items: map.get(key) }));
    }

    function field(item, key, kind, index) {
        const value = item[key] || "";
        if (!state.editing) {
            return esc(value);
        }
        return `<input data-edit="${kind}.${index}.${key}" value="${esc(value)}">`;
    }

    function sheetHtml(card) {
        const shown = (list, limit) => state.density === "open" ? list : list.slice(0, limit);
        const statBlocks = groups(shown(card.state, 8)).map((group) => `
            <section class="block">
                <h2>${esc(group.key)}</h2>
                <div class="grid stats">${group.items.map((item) => {
                    const index = card.state.indexOf(item);
                    const current = Number(item.itemA);
                    const max = Number(item.itemB);
                    const pct = Number.isFinite(current) && Number.isFinite(max) && max > 0
                        ? Math.max(0, Math.min(100, (current / max) * 100))
                        : 0;
                    return `<div class="cell stat">
                        <b>${field(item, "name", "state", index)}</b>
                        <span>${field(item, "itemA", "state", index)}</span>
                        <small>${field(item, "itemB", "state", index)}</small>
                        <i style="width:${pct}%"></i>
                    </div>`;
                }).join("")}</div>
            </section>`).join("");
        const rollBlocks = groups(shown(card.roll, 6)).map((group) => `
            <section class="block">
                <h2>${esc(group.key)}</h2>
                <div class="grid rolls">${group.items.map((item) => {
                    const index = card.roll.indexOf(item);
                    return `<button type="button" class="cell roll" data-roll="${esc(item.name)}">
                        <b>${field(item, "name", "roll", index)}</b>
                        <span>${field(item, "itemA", "roll", index)}</span>
                    </button>`;
                }).join("")}</div>
            </section>`).join("");
        const noteBlocks = groups(shown(card.notes, 2)).map((group) => `
            <section class="block">
                <h2>${esc(group.key)}</h2>
                <div class="grid notes">${group.items.map((item) => {
                    const index = card.notes.indexOf(item);
                    return `<article class="cell note">
                        <b>${field(item, "name", "notes", index)}</b>
                        <p>${state.editing ? `<textarea data-edit="notes.${index}.itemA">${esc(item.itemA)}</textarea>` : esc(item.itemA)}</p>
                    </article>`;
                }).join("")}</div>
            </section>`).join("");
        return `<header class="who">
            <img src="${esc(card.image)}" alt="">
            <div>
                <h1>${field(card, "name", "card", 0)}</h1>
                <p>${field(card, "role", "card", 0)}</p>
                <p>${field(card, "trait", "card", 0)}${card.slots ? ` · ${esc(card.slots)}` : ""}</p>
            </div>
        </header>
        <div class="stats-col">${statBlocks}</div>
        <div class="rolls-col">${rollBlocks}</div>
        <div class="notes-col">${noteBlocks}</div>`;
    }

    function chrome() {
        const here = location.pathname.replace(/\/$/, "");
        const links = [];
        for (let n = 6; n <= 25; n += 1) {
            const current = here === "/cards" + n ? ' aria-current="page"' : "";
            links.push(`<a href="/cards${n}?system=${state.system}&density=${state.density}"${current}>${n}</a>`);
        }
        return `<nav class="cards-nav">${links.join("")}</nav>
        <div class="cards-tools">
            <span class="tool-label">${esc(title)}</span>
            <button type="button" data-act="flip">切換</button>
            <button type="button" data-act="density" data-value="compact" ${state.density === "compact" ? 'aria-pressed="true"' : ""}>總結版</button>
            <button type="button" data-act="density" data-value="open" ${state.density === "open" ? 'aria-pressed="true"' : ""}>開放版</button>
            <button type="button" data-act="system" data-value="coc" ${state.system === "coc" ? 'aria-pressed="true"' : ""}>COC 版</button>
            <button type="button" data-act="system" data-value="dnd" ${state.system === "dnd" ? 'aria-pressed="true"' : ""}>DND 版</button>
            <button type="button" data-act="edit" aria-pressed="${state.editing}">${state.editing ? "關閉編輯" : "編輯模式"}</button>
            <button type="button" data-act="pick">選擇角色卡</button>
            <button type="button" data-act="help">詳細說明</button>
            <button type="button" data-act="privacy">現在狀態：私人</button>
            <a class="tool-link" href="/card">登入</a>
        </div>
        <section class="channel">
            <h2>擲骰頻道</h2>
            <button type="button" data-act="settings">設定</button>
            <label><input type="radio" name="channel" value="" ${state.channel === "" ? "checked" : ""}>編號 0: 不進行群組擲骰</label>
        </section>`;
    }

    function paint() {
        document.body.classList.toggle("density-open", state.density === "open");
        document.body.classList.toggle("density-compact", state.density === "compact");
        document.body.classList.toggle("is-editing", state.editing);
        root.innerHTML = `${chrome()}
            <article class="sheet">${state.card ? sheetHtml(state.card) : "<p>正在讀取角色…</p>"}</article>
            <aside class="roll-result" id="roll-result" hidden></aside>
            <dialog id="cards-dialog"></dialog>`;
    }

    function showResult(text) {
        const box = document.getElementById("roll-result");
        if (!box) return;
        box.hidden = false;
        box.textContent = text;
    }

    function applyEdit(target) {
        const spec = target.dataset.edit;
        if (!spec || !state.card) return;
        const [kind, index, key] = spec.split(".");
        if (kind === "card") {
            state.card[key] = target.value;
            return;
        }
        const row = state.card[kind]?.[Number(index)];
        if (row) row[key] = target.value;
    }

    async function loadCard() {
        const response = await fetch("/common/cards/" + state.system + ".json");
        state.card = await response.json();
        paint();
    }

    function connectRoll() {
        if (typeof io !== "function") {
            return;
        }
        const socket = io();
        socket.on("rolling", (text) => showResult(String(text || "")));
        socket.on("publicRolling", (text) => showResult(String(text || "")));
        document.addEventListener("click", (event) => {
            const button = event.target.closest("[data-roll]");
            if (!button || state.editing || !state.card) return;
            const item = button.dataset.roll;
            showResult(item + "…");
            socket.emit("rolling", {
                item,
                cardName: state.card.name,
                selectedGroupId: state.channel,
                userName: localStorage.getItem("userName") || "",
                token: localStorage.getItem("jwtToken") || "",
                doc: {
                    name: state.card.name,
                    state: state.card.state,
                    roll: state.card.roll,
                    notes: state.card.notes
                }
            });
        });
    }

    document.addEventListener("click", (event) => {
        const button = event.target.closest("[data-act]");
        if (!button) return;
        const act = button.dataset.act;
        if (act === "flip") {
            state.density = state.density === "compact" ? "open" : "compact";
            const next = new URLSearchParams(location.search);
            next.set("system", state.system);
            next.set("density", state.density);
            history.replaceState(null, "", location.pathname + "?" + next.toString());
            paint();
            return;
        }
        if (act === "density" || act === "system") {
            state[act === "density" ? "density" : "system"] = button.dataset.value;
            const next = new URLSearchParams(location.search);
            next.set("system", state.system);
            next.set("density", state.density);
            history.replaceState(null, "", location.pathname + "?" + next.toString());
            if (act === "system") loadCard();
            else paint();
            return;
        }
        if (act === "edit") {
            state.editing = !state.editing;
            paint();
            return;
        }
        const dialog = document.getElementById("cards-dialog");
        if (!dialog) return;
        if (act === "pick") {
            dialog.innerHTML = `<p>測試角色</p><button type="button" data-act="system" data-value="coc">COC 吾是示範</button><button type="button" data-act="system" data-value="dnd">DND Sad Unlucky</button><button type="button" data-act="close">關閉</button>`;
        } else if (act === "help") {
            dialog.innerHTML = `<p>${esc(ideas[design] || title)}</p><p>總結版收緊間距。開放版放大同一風格，技能仍以多欄顯示。擲骰會送到角色卡 API。</p><button type="button" data-act="close">關閉</button>`;
        } else if (act === "privacy") {
            dialog.innerHTML = `<p>這是版面試看，狀態保持私人，不會公開到正式角色卡。</p><button type="button" data-act="close">關閉</button>`;
        } else if (act === "settings") {
            dialog.innerHTML = `<p>群組頻道綁定在正式角色卡的設定。此頁編號 0 只在本頁顯示擲骰結果。</p><button type="button" data-act="close">關閉</button>`;
        } else if (act === "close") {
            dialog.close();
            return;
        }
        if (act !== "system" && typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    });

    document.addEventListener("change", (event) => {
        if (event.target.name === "channel") state.channel = event.target.value;
        if (event.target.dataset.edit) applyEdit(event.target);
    });
    document.addEventListener("input", (event) => {
        if (event.target.dataset.edit) applyEdit(event.target);
    });

    connectRoll();
    loadCard().catch(() => {
        root.textContent = "讀取角色資料失敗";
    });
}());

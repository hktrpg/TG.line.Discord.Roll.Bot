"use strict";

(function mountCardsStudio() {
    const designs = {
        6: "戲單", 7: "筆記", 8: "轉播", 9: "檔案", 10: "星圖",
        11: "現代條", 12: "古帳", 13: "方格", 14: "倉單", 15: "夜表",
        16: "八圍", 17: "密表", 18: "舊卡", 19: "格線", 20: "三欄",
        21: "人物誌", 22: "戰術", 23: "手帳", 24: "索引", 25: "靈魂"
    };
    const root = document.getElementById("cards-root");
    const designId = Number((document.body.dataset.design || "").replace(/\D/g, "")) || 6;
    const params = new URLSearchParams(location.search);
    let system = params.get("system") === "dnd" ? "dnd" : "coc";
    let density = params.get("density") === "open" ? "open" : "summary";
    let editing = false;
    let loggedIn = false;
    let isPublic = false;
    let channelId = "0";
    let cards = {};
    let card = null;

    function esc(value) {
        return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[ch]));
    }

    function shown(item) {
        return item.itemB ? item.itemA + " / " + item.itemB : (item.itemA || "");
    }

    function barWidth(item) {
        const current = Number(item.itemA);
        const max = Number(item.itemB);
        if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0 || current > max) return "";
        return Math.max(0, Math.min(100, (current / max) * 100)) + "%";
    }

    function groups(list) {
        const chunks = [];
        for (const item of list || []) {
            const title = item.section || "未分類";
            let chunk = chunks.at(-1);
            if (!chunk || chunk.title !== title) {
                chunk = { title, items: [] };
                chunks.push(chunk);
            }
            chunk.items.push(item);
        }
        return chunks;
    }

    function field(item, key, kind, index) {
        const value = item[key] || "";
        if (!editing) return esc(value);
        return `<input data-edit="${kind}.${index}.${key}" value="${esc(value)}" aria-label="${esc(item.name || key)}">`;
    }

    function renderGrid(list, cell) {
        return groups(list).map((group) => {
            const cells = group.items.map((item) => cell(item, list.indexOf(item))).join("");
            return `<div class="group">${esc(group.title)}</div>${cells}`;
        }).join("");
    }

    function sheet() {
        const stats = renderGrid(card.stats, (item, index) => {
            const width = barWidth(item);
            return `<div class="cell"><b>${field(item, "name", "stats", index)}</b><span>${editing ? field(item, "itemA", "stats", index) : esc(shown(item))}</span>${width ? `<div class="track"><i style="width:${width}"></i></div>` : ""}</div>`;
        });
        const rolls = renderGrid(card.rolls, (item, index) => {
            if (editing) {
                return `<div class="roll"><b>${field(item, "name", "rolls", index)}</b><span>${field(item, "itemA", "rolls", index)}</span></div>`;
            }
            return `<button type="button" class="roll" data-roll="${index}"><b>${esc(item.name)}</b><span>${esc(item.itemA)}</span></button>`;
        });
        const notes = renderGrid(card.notes, (item, index) => {
            return `<div class="note"><b>${field(item, "name", "notes", index)}</b><span>${field(item, "itemA", "notes", index)}</span></div>`;
        });
        const name = editing ? `<input data-edit="name" value="${esc(card.name)}">` : esc(card.name);
        const role = editing ? `<input data-edit="role" value="${esc(card.role)}">` : esc(card.role);
        const trait = editing ? `<input data-edit="trait" value="${esc(card.trait)}">` : esc(card.trait);
        return `<article class="sheet ${editing ? "is-editing" : ""}">
            <header class="who"><img src="${esc(card.image)}" alt=""><div><h1>${name}</h1><p>${role}</p><p>${trait}</p></div></header>
            <div class="body">
                <section class="block"><h2>基本屬性</h2><div class="grid">${stats}</div></section>
                <section class="block"><h2>擲骰</h2><div class="grid">${rolls}</div></section>
                <section class="block"><h2>筆記</h2><div class="grid">${notes}</div></section>
            </div>
        </article>`;
    }

    function chrome() {
        const designLinks = Object.entries(designs).map(([id, label]) => {
            const current = Number(id) === designId ? ' aria-current="page"' : "";
            return `<a href="/cards${id}?system=${system}&density=${density}"${current}>${label}</a>`;
        }).join("");
        const channels = (card.channels || []).map((item) => {
            const checked = item.id === channelId ? "checked" : "";
            return `<label><input type="radio" name="channel" value="${esc(item.id)}" ${checked}>編號 ${esc(item.id)}: ${esc(item.label)}</label>`;
        }).join("");
        return `<div class="chrome">
            <button type="button" data-density="summary" aria-pressed="${density === "summary"}">總結版</button>
            <button type="button" data-density="open" aria-pressed="${density === "open"}">開放版</button>
            <button type="button" data-system="dnd" aria-pressed="${system === "dnd"}">DND版</button>
            <button type="button" data-system="coc" aria-pressed="${system === "coc"}">COC版</button>
            <button type="button" data-action="edit" aria-pressed="${editing}">編輯模式</button>
            <button type="button" data-action="pick">選擇角色卡</button>
            <button type="button" data-action="help">詳細說明</button>
            <button type="button" data-action="privacy">現在狀態：${isPublic ? "公開" : "私人"}</button>
            <button type="button" data-action="login">${loggedIn ? "登出" : "登入"}</button>
            <span>擲骰頻道</span>
            <button type="button" data-action="settings">設定</button>
        </div>
        <div class="channels">${channels}</div>
        <nav class="design-nav">${designLinks}</nav>`;
    }

    function render() {
        document.body.dataset.density = density;
        document.body.classList.toggle("is-editing", editing);
        document.title = `${designs[designId] || "cards"} · ${card.name}`;
        root.innerHTML = chrome() + sheet() + `<p class="result" id="roll-result" role="status">擲骰結果會顯示在這裡。</p>`;
        const query = `?system=${system}&density=${density}`;
        history.replaceState(null, "", location.pathname + query);
    }

    function lookupStat(name) {
        const key = name.toLowerCase();
        const found = (card.stats || []).find((item) => item.name.toLowerCase() === key);
        return found ? found.itemA : "0";
    }

    function resolveFormula(formula) {
        return String(formula || "").replace(/\{([^}]+)\}/g, (_, name) => lookupStat(name));
    }

    function commandsOf(formula) {
        const resolved = resolveFormula(formula);
        if (!resolved.includes(";")) return [resolved.trim()];
        return resolved.split(";").map((part) => part.replace(/^\s*(hit|dmg)\s*:\s*/i, "").trim()).filter(Boolean);
    }

    async function roll(index) {
        const item = card.rolls[index];
        const box = document.getElementById("roll-result");
        const commands = commandsOf(item.itemA);
        box.textContent = `${item.name} 擲骰中…`;
        const lines = [];
        for (const command of commands) {
            const res = await fetch(`/api/local?msg=${encodeURIComponent(command)}&lang=zh-tw`);
            const data = await res.json().catch(() => ({ message: "" }));
            lines.push(data.message ? `${command}\n${data.message}` : `${command}\n（API 沒有回覆）`);
        }
        const channel = (card.channels || []).find((entry) => entry.id === channelId);
        box.textContent = `${item.name}\n頻道 ${channelId}: ${channel ? channel.label : ""}\n${lines.join("\n")}`;
    }

    function applyEdit(target) {
        const key = target.dataset.edit;
        if (key === "name" || key === "role" || key === "trait") {
            card[key] = target.value;
            return;
        }
        const [kind, index, fieldName] = key.split(".");
        if (card[kind] && card[kind][index]) card[kind][index][fieldName] = target.value;
    }

    function openDialog(title, body) {
        const dialog = document.createElement("dialog");
        dialog.className = "dialog";
        dialog.innerHTML = `<h3>${esc(title)}</h3>${body}<button type="button" data-close>關閉</button>`;
        document.body.append(dialog);
        dialog.showModal();
        dialog.addEventListener("click", (event) => {
            if (event.target.dataset.close || event.target === dialog) dialog.close();
        });
        dialog.addEventListener("close", () => dialog.remove());
        return dialog;
    }

    root.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;
        if (button.dataset.density) {
            density = button.dataset.density;
            render();
            return;
        }
        if (button.dataset.system) {
            system = button.dataset.system;
            card = cards[system];
            channelId = "0";
            render();
            return;
        }
        if (button.dataset.roll !== undefined && !editing) {
            roll(Number(button.dataset.roll)).catch(() => {
                document.getElementById("roll-result").textContent = "擲骰失敗";
            });
            return;
        }
        if (button.dataset.action === "edit") {
            editing = !editing;
            render();
            return;
        }
        if (button.dataset.action === "privacy") {
            isPublic = !isPublic;
            render();
            return;
        }
        if (button.dataset.action === "login") {
            loggedIn = !loggedIn;
            render();
            return;
        }
        if (button.dataset.action === "help") {
            openDialog("詳細說明", "<p>這是版面試看。總結版較緊，開放版同一風格但更大。技能以多欄顯示。擲骰會呼叫 /api/local，結果留在頁底。</p>");
            return;
        }
        if (button.dataset.action === "settings") {
            openDialog("設定", "<p>擲骰頻道只影響本頁結果列。不會送到 Discord。</p>");
            return;
        }
        if (button.dataset.action === "pick") {
            const choices = ["coc", "dnd"].map((id) => `<button type="button" data-pick="${id}">${esc(cards[id].name)} · ${esc(cards[id].role)}</button>`).join(" ");
            const dialog = openDialog("選擇角色卡", `<p>${choices}</p>`);
            dialog.addEventListener("click", (pickEvent) => {
                const pick = pickEvent.target.closest("[data-pick]");
                if (!pick) return;
                system = pick.dataset.pick;
                card = cards[system];
                channelId = "0";
                dialog.close();
                render();
            });
        }
    });

    root.addEventListener("change", (event) => {
        if (event.target.name === "channel") channelId = event.target.value;
    });
    root.addEventListener("input", (event) => {
        if (event.target.dataset.edit) applyEdit(event.target);
    });

    Promise.all([
        fetch("/common/cards-studio/coc.json").then((res) => res.json()),
        fetch("/common/cards-studio/dnd.json").then((res) => res.json())
    ]).then(([coc, dnd]) => {
        cards = { coc, dnd };
        card = cards[system];
        render();
    }).catch(() => {
        root.textContent = "讀取角色資料失敗";
    });
})();

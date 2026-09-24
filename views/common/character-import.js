"use strict";

/**
 * Demo: https://www.dndbeyond.com/characters/95607806 (Sad Unlucky, public)
 * To add a source: register in CHARACTER_IMPORT_SOURCES below; dropdown uses Vue computed characterImportSources.
 *
 * @type {{ id: string, menuKey: string, enabled: boolean }[]}
 */
const CHARACTER_IMPORT_SOURCES = [
    {
        id: "ddb",
        menuKey: "import_menu_ddb",
        enabled: true,
    },
    {
        id: "udonarium",
        menuKey: "import_menu_udonarium",
        enabled: true,
    },
];

function getEnabledCharacterImportSources() {
    return CHARACTER_IMPORT_SOURCES.filter(source => source.enabled);
}

function showCharacterImportPanel(sourceId) {
    const panels = document.querySelectorAll("[data-import-panel]");
    for (const panel of panels) {
        const match = panel.getAttribute("data-import-panel") === sourceId;
        panel.style.display = match ? "" : "none";
    }
}

function resolveImportErrorMessage(result) {
    const t = typeof wwwT === "function" ? wwwT : key => key;
    if (!result || result.ok) {
        return "";
    }
    const code = result.code || "failed";
    const key = `import_error_${code}`;
    const translated = t(key, {
        retrySec: result.retryMs ? Math.ceil(result.retryMs / 1000) : undefined,
    });
    if (translated !== key) {
        return translated;
    }
    if (result.message) {
        return result.message;
    }
    return t("import_failed");
}

function openCharacterImportFromMenu(sourceId = "ddb") {
    const card = typeof cardManager !== "undefined" ? cardManager.getCard() : null;
    if (card && typeof card.openImportModal === "function") {
        card.openImportModal(sourceId);
        return;
    }
    if (typeof uiManager !== "undefined") {
        uiManager.showInfo(typeof wwwT === "function" ? wwwT("import_select_card_first") : "Select a character card first.");
    }
}

globalThis.CHARACTER_IMPORT_SOURCES = CHARACTER_IMPORT_SOURCES;
globalThis.getEnabledCharacterImportSources = getEnabledCharacterImportSources;
globalThis.showCharacterImportPanel = showCharacterImportPanel;
globalThis.openCharacterImportFromMenu = openCharacterImportFromMenu;
globalThis.resolveImportErrorMessage = resolveImportErrorMessage;

"use strict";

const path = require("path");
const fs = require("fs");

describe("Export HTML template integration", () => {
    const exportJsPath = path.join(__dirname, "..", "roll", "export.js");

    test("uses discordlog-new.html as HTML export template", () => {
        const source = fs.readFileSync(exportJsPath, "utf8");
        expect(source).toContain("views/discordlog-new.html");
    });

    test("injects encrypted payload via window.aesData", () => {
        const source = fs.readFileSync(exportJsPath, "utf8");
        expect(source).toContain("window.aesData");
        expect(source).toContain("escapedEncryptedData");
    });
});


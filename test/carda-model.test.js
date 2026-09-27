"use strict";

const model = require("../views/common/carda/model.js");
const coc = require("../views/common/carda/coc.json");

describe("Carda action skill values", () => {
    test("restored skill edits drive every linked attack, including zero", () => {
        for (const value of [20, 0]) {
            const data = model.applyPatch(coc, {
                skills: [{ name: "格鬥（鬥毆）", value }],
            });
            const attacks = data.actions.filter(action => action.skill === "格鬥（鬥毆）");
            expect(attacks).toHaveLength(5);
            for (const action of attacks) {
                expect(model.actionHitValue(data, action)).toBe(value);
                expect(model.notation(data, model.actionHitValue(data, action))).toBe(`cc:${value}`);
            }
        }
    });

    test("an edit immediately changes the linked attack without rewriting source data", () => {
        const data = model.clone(coc);
        data.skills.find(skill => skill.name === "格鬥（鬥毆）").value = 42;
        expect(model.actionHitValue(data, data.actions[0])).toBe(42);
        expect(coc.actions[0].hit).toBe(85);
    });

    test("unlinked CoC attacks and D&D attacks retain their explicit hit value", () => {
        expect(model.actionHitValue(coc, { skill: "not present", hit: 30 })).toBe(30);
        expect(model.actionHitValue(coc, { hit: "—" })).toBe("—");
        expect(model.actionHitValue({ system: "dnd", skills: [] }, { skill: "Athletics", hit: 7 })).toBe(7);
    });
});

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup() {
    const card = {
        _id: 'card-one', name: 'Original', image: '', state: [{ name: 'HP', itemA: '8' }], roll: [], notes: [],
        characterDetails: [], public: false, schemaVersion: 2, editMode: true, hasUnsavedChanges: true,
        checkForChanges() {
            return JSON.stringify({ name: this.name, image: this.image, state: this.state, roll: this.roll, notes: this.notes,
                characterDetails: this.characterDetails, public: this.public, schemaVersion: this.schemaVersion }) !== JSON.stringify(this.originalData);
        }
    };
    const context = {
        window: {}, cardManager: { getCard: () => card },
        uiManager: { showPopup: jest.fn(), showInfo: jest.fn(), showError: jest.fn() },
        debugLog: jest.fn(), clearTimeout, setTimeout, Date, JSON
    };
    vm.createContext(context);
    const code = fs.readFileSync(path.join(__dirname, '../views/common/socketManager.js'), 'utf8')
        .replace('window.socketManager = new SocketManager();', 'window.SocketManager = SocketManager;');
    vm.runInContext(code, context);
    const manager = Object.create(context.window.SocketManager.prototype);
    manager.pendingUpdateCard = null;
    manager.pendingUpdateCardTimer = null;
    manager.updateCardSequence = 0;
    manager.socket = { emit: jest.fn() };
    manager.shouldThrottleRequest = () => false;
    manager.removeLoadingState = jest.fn();
    return { card, manager, context };
}

test('save acknowledgement records the submitted snapshot and leaves later edits unsaved', () => {
    const { card, manager } = setup();
    const submitted = { _id: card._id, name: card.name, image: card.image, state: card.state, roll: card.roll,
        notes: card.notes, characterDetails: card.characterDetails, public: card.public, schemaVersion: 2 };
    manager.emitUpdateCard({ card: submitted });
    const requestId = manager.pendingUpdateCard.requestId;
    card.state = [{ name: 'HP', itemA: '9' }];
    manager.handleUpdateCard({ ok: true, requestId });
    expect(card.originalData.state[0].itemA).toBe('8');
    expect(card.state[0].itemA).toBe('9');
    expect(card.hasUnsavedChanges).toBe(true);
    expect(card.editMode).toBe(true);
});

test('failed or stale acknowledgement never marks another character as saved', () => {
    const { card, manager } = setup();
    manager.emitUpdateCard({ card: { _id: 'card-one', name: 'Original', state: [], roll: [], notes: [] } });
    const requestId = manager.pendingUpdateCard.requestId;
    manager.handleUpdateCard({ ok: true, requestId: 'old-request' });
    expect(manager.pendingUpdateCard.requestId).toBe(requestId);
    card._id = 'card-two';
    manager.handleUpdateCard({ ok: true, requestId });
    expect(card.originalData).toBeUndefined();
    expect(card.hasUnsavedChanges).toBe(true);
    manager.emitUpdateCard({ card: { _id: 'card-two', name: 'Original', state: [], roll: [], notes: [] } });
    manager.handleUpdateCard({ ok: false, requestId: manager.pendingUpdateCard.requestId });
    expect(card.originalData).toBeUndefined();
});

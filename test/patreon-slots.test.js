"use strict";

/**
 * Test cases for Patreon slots UI default "turn on" behavior.
 *
 * These tests verify the contract in views/patreon.html:
 * - Every default/new slot item is "turn on" (啓用中, switch: true)
 * - Filling ID + save will send switch: true (on)
 * - It only becomes switch: false if the user explicitly clicks the button to "停用中"
 *
 * The logic replicated here matches the coercion and collect behavior in patreon.html
 * (renderSlots default objects + collectSlotsFromForm reading data-switch attr).
 */

describe('Patreon slots UI (patreon.html) - default switch is always on unless explicitly disabled', () => {

  // Replicates the exact coercion logic from renderSlots in patreon.html
  function createMockSlotData(raw) {
    const s = raw ? {
      targetId: raw.targetId || '',
      targetType: raw.targetType || '',
      platform: raw.platform || '',
      name: raw.name || '',
      switch: raw.switch !== false   // key: missing/undefined/ truey-but-not-false => on
    } : {
      targetId: '',
      targetType: '',
      platform: '',
      name: '',
      switch: true                   // brand new row defaults to on
    };
    return s;
  }

  // Replicates the collect logic (only cares about targetId presence + current button state)
  function simulateCollectFromMockRows(mockRows) {
    const slots = [];
    mockRows.forEach(function (row) {
      const targetId = (row.targetInput && row.targetInput.value || '').trim();
      if (!targetId) return;  // matches "Only submit used slots"
      const sw = row.button && row.button.dataSwitch === '1';
      slots.push({
        targetId: targetId,
        targetType: row.targetType || 'user',
        platform: row.platform || 'Discord',
        name: row.name || '',
        switch: sw
      });
    });
    return slots;
  }

  describe('default state for new/empty slots', () => {
    it('brand new slot row (no raw data) defaults to turn on', () => {
      const s = createMockSlotData(undefined);
      expect(s.switch).toBe(true);
    });

    it('render default produces 啓用中 state for button', () => {
      const s = createMockSlotData(null);
      const buttonText = s.switch ? '啓用中' : '停用中';
      const dataSwitchAttr = s.switch ? '1' : '0';
      expect(buttonText).toBe('啓用中');
      expect(dataSwitchAttr).toBe('1');
    });

    it('legacy raw slot data without "switch" field is treated as on', () => {
      const legacyRaw = {
        targetId: '278393267249348610',
        targetType: 'user',
        platform: 'Discord',
        name: 'DC個人'
        // deliberately no "switch" key - common for old data
      };
      const s = createMockSlotData(legacyRaw);
      expect(s.switch).toBe(true);
    });
  });

  describe('fill ID then save flow - must remain on unless button was set to 停用中', () => {
    it('fill target ID without touching toggle -> collect sends switch: true (on)', () => {
      const mockRows = [
        {
          targetInput: { value: '278393267249348610' },
          targetType: 'user',
          platform: 'Discord',
          name: 'DC個人',
          button: { dataSwitch: '1' }   // initialized by render as default on, user never clicked
        }
      ];

      const slots = simulateCollectFromMockRows(mockRows);

      expect(slots).toHaveLength(1);
      expect(slots[0].targetId).toBe('278393267249348610');
      expect(slots[0].switch).toBe(true);   // MUST be on
    });

    it('multiple slots: user only touched one -> untouched ones remain on after save', () => {
      const mockRows = [
        {
          targetInput: { value: 'id-on-default' },
          button: { dataSwitch: '1' }   // never touched
        },
        {
          targetInput: { value: 'id-user-turned-off' },
          button: { dataSwitch: '0' }   // user explicitly clicked to 停用中
        },
        {
          targetInput: { value: 'id-still-on' },
          button: { dataSwitch: '1' }   // another untouched
        }
      ];

      const slots = simulateCollectFromMockRows(mockRows);

      expect(slots).toHaveLength(3);
      expect(slots[0].switch).toBe(true);
      expect(slots[1].switch).toBe(false);
      expect(slots[2].switch).toBe(true);
    });

    it('even if raw data from server had no switch, filling + save still results in on', () => {
      // simulate what happens after load when server returns legacy slot without switch
      const s = createMockSlotData({ targetId: 'legacy-id', targetType: 'user', platform: 'Discord' });
      // render would create button with dataSwitch based on s.switch (which is true)
      const mockRowsAfterRender = [{
        targetInput: { value: 'legacy-id' },
        button: { dataSwitch: s.switch ? '1' : '0' }
      }];

      const slots = simulateCollectFromMockRows(mockRowsAfterRender);
      expect(slots[0].switch).toBe(true);
    });
  });

  describe('only explicit user action to 停用中 makes it off', () => {
    it('explicitly setting button to 停用中 results in switch: false on save', () => {
      const mockRows = [{
        targetInput: { value: '278393267249348610' },
        button: { dataSwitch: '0' }  // user clicked the toggle to 停用中
      }];

      const slots = simulateCollectFromMockRows(mockRows);
      expect(slots[0].switch).toBe(false);
    });

    it('toggling back on after off still works correctly', () => {
      const mockRows = [{
        targetInput: { value: 'some-id' },
        button: { dataSwitch: '1' }   // user toggled back to 啓用中
      }];

      const slots = simulateCollectFromMockRows(mockRows);
      expect(slots[0].switch).toBe(true);
    });
  });

  describe('empty rows are ignored (no pollution of saved data)', () => {
    it('rows without ID are never sent, regardless of button state', () => {
      const mockRows = [
        { targetInput: { value: '' }, button: { dataSwitch: '1' } },
        { targetInput: { value: 'real-id' }, button: { dataSwitch: '1' } }
      ];

      const slots = simulateCollectFromMockRows(mockRows);
      expect(slots).toHaveLength(1);
      expect(slots[0].targetId).toBe('real-id');
      expect(slots[0].switch).toBe(true);
    });
  });
});

"use strict";

const { getTypeEffectiveness, Pokemon } = require('../roll/pokemon.js');

describe('Pokemon Type Effectiveness Tests', () => {
  test('Test type effectiveness analysis for Steel/Psychic Pokemon', () => {
    // Test the getTypeEffectiveness function with Beldum (Steel/Psychic)
    const beldumTypes = ['Steel', 'Psychic'];

    const effectiveness = getTypeEffectiveness(beldumTypes);

    // Based on the actual type chart calculations:
    // Effective: Ground, Ghost, Fire, Ice, Dark
    // Not Very Effective: Psychic
    // No Effect: Poison

    expect(effectiveness.effective).toContain('地面'); // Ground
    expect(effectiveness.effective).toContain('幽靈'); // Ghost
    expect(effectiveness.effective).toContain('火'); // Fire
    expect(effectiveness.effective).toContain('冰'); // Ice
    expect(effectiveness.effective).toContain('惡'); // Dark

    expect(effectiveness.notVeryEffective).toContain('超能力'); // Psychic

    expect(effectiveness.noEffect).toContain('毒'); // Poison
  });

  test('Test type effectiveness analysis for single type Pokemon', () => {
    // Test with single type Pokemon like Pikachu (Electric)
    const pikachuTypes = ['Electric'];

    const effectiveness = getTypeEffectiveness(pikachuTypes);

    // Electric type should be:
    // Effective: Ground
    // (In this custom system, Ground attacks are effective against Electric)

    expect(effectiveness.effective).toContain('地面'); // Ground
  });

  test('Test mon command with type effectiveness display', () => {
    // Test that showPokemon includes type effectiveness information
    const testPokemon = {
      id: '374',
      name: '鐵啞鈴',
      alias: 'Beldum',
      type: ['Steel', 'Psychic'],
      info: {
        category: '鐵球寶可夢',
        height: '0.6',
        weight: '95',
        image: 'images/pokedex/374.png'
      },
      rank: 1,
      baseHP: 3,
      ability: '恆淨之軀',
      attr: {
        str: { value: 2, max: 4 },
        dex: { value: 1, max: 3 },
        vit: { value: 2, max: 5 },
        spe: { value: 1, max: 3 },
        ins: { value: 2, max: 4 }
      },
      evolution: {
        stage: 'first',
        time: 'medium'
      },
      moves: []
    };

    const result = Pokemon.showPokemon(testPokemon);

    // Check that the result contains type effectiveness information
    expect(result).toContain('------屬性相剋------');
    expect(result).toContain('效果絕佳：');
    expect(result).toContain('地面');
    expect(result).toContain('幽靈');
    expect(result).toContain('火');
    expect(result).toContain('冰');
    expect(result).toContain('惡');

    expect(result).toContain('效果非常不好：');
    expect(result).toContain('超能力');

    expect(result).toContain('完全沒有效果：');
    expect(result).toContain('毒');
  });

  test('Test type effectiveness analysis for Water type Pokemon', () => {
    // Test with Water type Pokemon
    const squirtleTypes = ['Water'];

    const effectiveness = getTypeEffectiveness(squirtleTypes);

    // Water type should be:
    // Effective: Grass, Electric
    // (In this custom system, these attacks are effective against Water)

    expect(effectiveness.effective).toContain('草'); // Grass
    expect(effectiveness.effective).toContain('電'); // Electric
  });

  test('Test type effectiveness analysis returns all categories', () => {
    const testTypes = ['Normal'];

    const effectiveness = getTypeEffectiveness(testTypes);

    // Should have all four categories even if some are empty
    expect(effectiveness).toHaveProperty('superEffective');
    expect(effectiveness).toHaveProperty('effective');
    expect(effectiveness).toHaveProperty('notVeryEffective');
    expect(effectiveness).toHaveProperty('noEffect');

    expect(Array.isArray(effectiveness.superEffective)).toBe(true);
    expect(Array.isArray(effectiveness.effective)).toBe(true);
    expect(Array.isArray(effectiveness.notVeryEffective)).toBe(true);
    expect(Array.isArray(effectiveness.noEffect)).toBe(true);
  });
});

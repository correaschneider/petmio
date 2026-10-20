import { creatorReducer, initialCreatorState } from './creatorStore';

describe('creatorReducer', () => {
  it('setTrait incrementa o bump só quando algo muda', () => {
    const s1 = creatorReducer(initialCreatorState, { type: 'setTrait', key: 'fur', value: 'nero' });
    expect(s1.traits.fur).toBe('nero');
    expect(s1.bump).toBe(1);
    const s2 = creatorReducer(s1, { type: 'setTrait', key: 'breed', value: 'siamese' });
    expect(s2).toBe(s1);
  });

  it('não confirma nome vazio', () => {
    const s = creatorReducer({ ...initialCreatorState, name: '   ' }, { type: 'confirmName' });
    expect(s.confirmed).toBe(false);
  });

  it('confirma e volta para edição', () => {
    const named = creatorReducer(initialCreatorState, { type: 'setName', name: 'Luna' });
    const confirmed = creatorReducer(named, { type: 'confirmName' });
    expect(confirmed.confirmed).toBe(true);
    expect(creatorReducer(confirmed, { type: 'editName' }).confirmed).toBe(false);
  });
});

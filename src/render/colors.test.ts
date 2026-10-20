import { mix } from './colors';

describe('mix', () => {
  it('interpola canal a canal', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#d9a95a', '#d9a95a', 0.3)).toBe('#d9a95a');
  });
});

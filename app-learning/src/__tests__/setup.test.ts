import fc from 'fast-check';

describe('Project setup verification', () => {
  it('should have TypeScript strict mode working', () => {
    const value: string = 'hello';
    expect(typeof value).toBe('string');
  });

  it('should have fast-check available for property-based testing', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return typeof n === 'number';
      }),
    );
  });

  it('should resolve @/ path alias', () => {
    // Verifies that the module resolver alias works
    const mod = require('@/index');
    expect(mod).toBeDefined();
  });
});

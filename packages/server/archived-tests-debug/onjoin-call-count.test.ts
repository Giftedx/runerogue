import 'reflect-metadata';
import '../../utils/symbol-metadata-polyfill';

describe('OnJoin Investigation', () => {
  let mockOnJoin: jest.SpyInstance;
  let joinCallCount = 0;

  beforeEach(() => {
    joinCallCount = 0;
  });

  it('should track how many times onJoin is called', async () => {
    // Create a simple counter
    let callCount = 0;

    const mockFunction = jest.fn(() => {
      callCount++;
      console.log(`onJoin called ${callCount} times`);
    });

    // Call it once
    mockFunction();

    expect(callCount).toBe(1);
    expect(mockFunction).toHaveBeenCalledTimes(1);

    console.log(`Final call count: ${callCount}`);
  });
});

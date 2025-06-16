/**
 * Simple test to verify that exports work properly
 */

export class TestClass {
  public name: string = 'test';
}

export const testFunction = () => {
  return 'working';
};

export default {
  TestClass,
  testFunction,
};

console.log('Test script running...');
console.log('1 + 1 =', 1 + 1);

// Test async/await
(async () => {
  const result = await Promise.resolve('Async test passed');
  console.log(result);
})();

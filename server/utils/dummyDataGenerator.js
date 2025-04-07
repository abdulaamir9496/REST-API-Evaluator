// utils/dummyDataGenerator.js

function generateDummyData(endpointPath) {
  const dummyData = {};

  // Simulate fields based on endpoint (basic)
  if (endpointPath.includes('user')) {
    dummyData.name = "Test User";
    dummyData.email = "test@example.com";
    dummyData.password = "password123";
  } else if (endpointPath.includes('product')) {
    dummyData.name = "Sample Product";
    dummyData.price = 99.99;
    dummyData.stock = 10;
  } else {
    dummyData.message = `Dummy data for ${endpointPath}`;
  }

  return dummyData;
}

module.exports = { generateDummyData };

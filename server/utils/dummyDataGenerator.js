exports.generateDummyData = (config) => {
    const params = {};
    if (config.parameters) {
      config.parameters.forEach(param => {
        if (param.in === 'query' || param.in === 'body') {
          params[param.name] = "test"; // Or use faker.js for better dummy data
        }
      });
    }
    return params;
  };
  
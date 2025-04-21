const fs = require('fs');
const path = require('path');
const SwaggerParser = require('@apidevtools/swagger-parser');
const { generateDummyData } = require('../utils/dummyDataGenerator');

async function testDummyDataFromSpec(specFilePath, specificEndpoint = null, specificMethod = null) {
    try {
        const fullPath = path.resolve(__dirname, '../', specFilePath);
        const api = await SwaggerParser.dereference(fullPath);
        const results = [];

        for (const [pathKey, pathItem] of Object.entries(api.paths)) {
            for (const method of Object.keys(pathItem)) {
                if (specificEndpoint && specificMethod) {
                    if (pathKey !== specificEndpoint || method.toLowerCase() !== specificMethod.toLowerCase()) {
                        continue;
                    }
                }

                const operation = pathItem[method];
                const requestBody = operation.requestBody || null;
                const dummyData = generateDummyData(pathKey, requestBody);

                results.push({
                    path: pathKey,
                    method: method.toUpperCase(),
                    dummyRequestBody: dummyData,
                });
            }
        }

        return results;
    } catch (err) {
        console.error('❌ Error parsing or processing the spec:', err);
        throw new Error('Failed to load or process OpenAPI/Swagger spec.');
    }
}

module.exports = { testDummyDataFromSpec };

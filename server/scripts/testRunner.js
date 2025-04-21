const fs = require('fs');
const path = require('path');
const SwaggerParser = require('@apidevtools/swagger-parser');
const yaml = require('js-yaml');
const { generateDummyData } = require('../utils/dummyDataGenerator');
const { parseSpec } = require('./openapiParser'); // ✅ Corrected import

async function testDummyDataFromSpec(rawSpec, specContent, endpoint, method) {
    const parsed = await parseSpec(rawSpec); // ✅ Corrected usage
    try {
        let spec;
        if (typeof specContent === 'string') {
            spec = specContent.trim().startsWith('{')
                ? JSON.parse(specContent)
                : yaml.load(specContent);
        } else {
            spec = specContent;
        }

        const parsedSpec = await SwaggerParser.dereference(spec);

        const pathObj = parsedSpec.paths?.[endpoint];
        const methodObj = pathObj?.[method.toLowerCase()];

        if (!methodObj) {
            return { error: `Method ${method} not found for ${endpoint}` };
        }

        const requestBody = methodObj.requestBody;
        const schema = requestBody?.content?.['application/json']?.schema || null;

        return {
            endpoint,
            method,
            hasRequestBody: !!schema,
            schema,
        };
    } catch (err) {
        console.error('Error parsing or testing spec:', err);
        throw err;
    }
}

module.exports = { testDummyDataFromSpec };

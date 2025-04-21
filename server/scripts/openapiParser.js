const SwaggerParser = require("@apidevtools/swagger-parser");
const axios = require("axios");

const parseSpec = async (specPathOrObject) => {
    try {
        let parsed;

        if (typeof specPathOrObject === 'string') {
            if (specPathOrObject.startsWith('http://') || specPathOrObject.startsWith('https://')) {
                // Download remote URL content
                const response = await axios.get(specPathOrObject);
                parsed = await SwaggerParser.dereference(response.data);
            } else {
                // Local file
                parsed = await SwaggerParser.dereference(specPathOrObject);
            }
        } else {
            // Already a parsed object
            parsed = await SwaggerParser.dereference(specPathOrObject);
        }

        return parsed;
    } catch (err) {
        throw new Error("Failed to parse OpenAPI spec: " + err.message);
    }
};

module.exports = { parseSpec };

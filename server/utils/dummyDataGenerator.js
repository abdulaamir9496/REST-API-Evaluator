/**
 * Generates dummy data based on OpenAPI schema definitions
 * @param {string} endpointPath - The API endpoint path
 * @param {object} requestBody - The request body schema from the OpenAPI spec
 * @param {object} openApiSpec - The full OpenAPI spec (for resolving $ref)
 * @returns {object} - Generated dummy data
 */
function generateDummyData(endpointPath, requestBody, openApiSpec) {
  console.log("Generating dummy data for:", endpointPath);
  console.log("Request Body Schema:", JSON.stringify(requestBody, null, 2));

  if (requestBody && requestBody.content) {
    const contentType = Object.keys(requestBody.content)[0];
    const schema = requestBody.content[contentType]?.schema;
    if (schema) {
      console.log("Schema found:", JSON.stringify(schema, null, 2));
      return generateFromSchema(schema, openApiSpec);
    }
  }

  if (requestBody?.schema) {
    console.log("Schema found in requestBody:", JSON.stringify(requestBody.schema, null, 2));
    return generateFromSchema(requestBody.schema, openApiSpec);
  }

  return generateBasicDummyData(endpointPath);
}

/**
 * Resolves a $ref string to the actual schema object
 * @param {string} ref - The $ref string
 * @param {object} spec - The full OpenAPI spec
 * @returns {object|null} - Resolved schema
 */
function resolveRef(ref, spec) {
  if (!ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/');
  return parts.reduce((acc, part) => acc?.[part], spec);
}

/**
 * Generates dummy data based on a schema object
 * @param {object} schema - The OpenAPI schema object
 * @param {object} openApiSpec - The full OpenAPI spec
 * @returns {any} - Generated data matching the schema
 */
function generateFromSchema(schema, openApiSpec) {
  if (!schema) return {};

  try {
    if (schema.$ref) {
      const resolved = resolveRef(schema.$ref, openApiSpec);
      return resolved ? generateFromSchema(resolved, openApiSpec) : {};
    }

    switch (schema.type) {
      case 'object':
        return generateObjectData(schema, openApiSpec);
      case 'array':
        return generateArrayData(schema, openApiSpec);
      case 'string':
        return generateStringData(schema);
      case 'integer':
      case 'number':
        return generateNumberData(schema);
      case 'boolean':
        return Math.random() > 0.5;
      default:
        console.warn("Unknown schema type:", schema.type);
        return {};
    }
  } catch (error) {
    console.error("Error generating data from schema:", error);
    throw new Error("Failed to generate data from schema");
  }
}

function generateObjectData(schema, openApiSpec) {
  const result = {};
  if (!schema.properties) return result;

  for (const [key, propSchema] of Object.entries(schema.properties)) {
    const required = schema.required?.includes(key);
    if (required || Math.random() < 0.7) {
      result[key] = generateFromSchema(propSchema, openApiSpec);
    }
  }

  return result;
}

function generateArrayData(schema, openApiSpec) {
  const count = Math.floor(Math.random() * 3) + 1;
  const result = [];

  if (schema.items) {
    for (let i = 0; i < count; i++) {
      result.push(generateFromSchema(schema.items, openApiSpec));
    }
  }

  return result;
}

function generateStringData(schema) {
  if (schema.enum?.length) {
    return schema.enum[Math.floor(Math.random() * schema.enum.length)];
  }

  switch (schema.format) {
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'date-time':
      return new Date().toISOString();
    case 'email':
      return `test-${Math.floor(Math.random() * 1000)}@example.com`;
    case 'uuid':
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    case 'uri':
    case 'url':
      return `https://example.com/resource/${Math.floor(Math.random() * 1000)}`;
    case 'password':
      return 'securePassword123!';
    case 'binary':
      return 'dGVzdCBiaW5hcnkgZGF0YQ==';
    default:
      const minLength = schema.minLength || 5;
      const maxLength = schema.maxLength || 10;
      const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
      return `sample-${Math.random().toString(36).substring(2, 2 + length)}`;
  }
}

function generateNumberData(schema) {
  const isInteger = schema.type === 'integer';
  let min = schema.minimum ?? 0;
  let max = schema.maximum ?? 100;
  if (min >= max) max = min + 10;

  const value = Math.random() * (max - min) + min;
  return isInteger ? Math.floor(value) : Number(value.toFixed(2));
}

function generateBasicDummyData(endpointPath) {
  const dummyData = {};
  const path = endpointPath.toLowerCase();

  if (path.includes('user') || path.includes('account') || path.includes('profile')) {
    dummyData.id = Math.floor(Math.random() * 1000);
    dummyData.username = `user${dummyData.id}`;
    dummyData.email = `user${dummyData.id}@example.com`;
  }

  return dummyData;
}

module.exports = { generateDummyData };

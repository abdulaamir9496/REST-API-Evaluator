/**
 * Generates dummy data based on OpenAPI schema definitions
 * @param {string} endpointPath - The API endpoint path
 * @param {object} requestBody - The request body schema from the OpenAPI spec
 * @param {object} openApiSpec - The full OpenAPI spec (for resolving $ref)
 * @returns {object} - Generated dummy data
 */
function generateDummyData(endpointPath, requestBody, openApiSpec) {
  if (requestBody && requestBody.content) {
    const contentType = Object.keys(requestBody.content)[0];
    const schema = requestBody.content[contentType]?.schema;
    if (schema) {
      return generateFromSchema(schema, openApiSpec);
    }
  }

  if (requestBody?.schema) {
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
      return {};
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
    dummyData.username = `testuser${Math.floor(Math.random() * 100)}`;
    dummyData.firstName = "Test";
    dummyData.lastName = "User";
    dummyData.email = `test${Math.floor(Math.random() * 100)}@example.com`;
    dummyData.password = "Password123!";
    dummyData.phone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    dummyData.status = "active";
  } else if (path.includes('pet') || path.includes('animal')) {
    dummyData.id = Math.floor(Math.random() * 1000);
    dummyData.name = `Pet${Math.floor(Math.random() * 100)}`;
    dummyData.status = ['available', 'pending', 'sold'][Math.floor(Math.random() * 3)];
    dummyData.category = {
      id: Math.floor(Math.random() * 10),
      name: ['dog', 'cat', 'bird', 'fish'][Math.floor(Math.random() * 4)]
    };
    dummyData.tags = [{ id: 1, name: 'tag1' }, { id: 2, name: 'tag2' }];
    dummyData.photoUrls = ['https://example.com/pet.jpg'];
  } else if (path.includes('order') || path.includes('store')) {
    dummyData.id = Math.floor(Math.random() * 1000);
    dummyData.petId = Math.floor(Math.random() * 100);
    dummyData.quantity = Math.floor(Math.random() * 10) + 1;
    dummyData.shipDate = new Date().toISOString();
    dummyData.status = ['placed', 'approved', 'delivered'][Math.floor(Math.random() * 3)];
    dummyData.complete = Math.random() > 0.5;
  } else if (path.includes('product') || path.includes('item')) {
    dummyData.id = Math.floor(Math.random() * 1000);
    dummyData.name = `Product${Math.floor(Math.random() * 100)}`;
    dummyData.price = Number((Math.random() * 100).toFixed(2));
    dummyData.category = ['electronics', 'clothing', 'food'][Math.floor(Math.random() * 3)];
    dummyData.stock = Math.floor(Math.random() * 100);
    dummyData.description = "This is a sample product description";
    dummyData.imageUrl = "https://example.com/product.jpg";
  } else {
    dummyData.id = Math.floor(Math.random() * 1000);
    dummyData.name = `Sample${Math.floor(Math.random() * 100)}`;
    dummyData.description = `Sample data for ${endpointPath}`;
    dummyData.createdAt = new Date().toISOString();
  }

  return dummyData;
}

module.exports = { generateDummyData };

// utils/dummyDataGenerator.js

/**
 * Generates dummy data based on OpenAPI schema definitions
 * @param {string} endpointPath - The API endpoint path
 * @param {object} requestBody - The request body schema from the OpenAPI spec
 * @returns {object} - Generated dummy data
 */
function generateDummyData(endpointPath, requestBody) {
  // If we have schema info, use it for more accurate data generation
  if (requestBody && requestBody.content) {
    const contentType = Object.keys(requestBody.content)[0];
    if (contentType && requestBody.content[contentType].schema) {
      return generateFromSchema(requestBody.content[contentType].schema);
    }
  }
  
  // Handle OpenAPI 2.0 request bodies
  if (requestBody && requestBody.schema) {
    return generateFromSchema(requestBody.schema);
  }

  // Fallback to basic patterns based on endpoint path
  return generateBasicDummyData(endpointPath);
}

/**
 * Generates dummy data based on a schema object
 * @param {object} schema - The OpenAPI schema object
 * @returns {any} - Generated data matching the schema
 */
function generateFromSchema(schema) {
  if (!schema) return {};

  // Handle reference schemas
  if (schema.$ref) {
    // For now, return empty object for refs
    // In a complete implementation, you would resolve the reference
    return {};
  }

  // Handle different types
  switch (schema.type) {
    case 'object':
      return generateObjectData(schema);
    case 'array':
      return generateArrayData(schema);
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

/**
 * Generates a dummy object based on schema properties
 * @param {object} schema - The schema with properties
 * @returns {object} - Generated dummy object
 */
function generateObjectData(schema) {
  const result = {};
  
  // If no properties defined, return empty object
  if (!schema.properties) return result;
  
  // Generate a value for each property
  for (const [key, propSchema] of Object.entries(schema.properties)) {
    // Check if property is required
    const required = schema.required && schema.required.includes(key);
    
    // Generate value if required or randomly (70% chance)
    if (required || Math.random() < 0.7) {
      result[key] = generateFromSchema(propSchema);
    }
  }
  
  return result;
}

/**
 * Generates a dummy array based on schema
 * @param {object} schema - The array schema
 * @returns {Array} - Generated dummy array
 */
function generateArrayData(schema) {
  // Create an array with 1-3 items
  const count = Math.floor(Math.random() * 3) + 1;
  const result = [];
  
  if (schema.items) {
    for (let i = 0; i < count; i++) {
      result.push(generateFromSchema(schema.items));
    }
  }
  
  return result;
}

/**
 * Generates a dummy string based on format
 * @param {object} schema - The string schema with format
 * @returns {string} - Generated string
 */
function generateStringData(schema) {
  if (schema.enum && schema.enum.length > 0) {
    // Choose a random enum value
    const randomIndex = Math.floor(Math.random() * schema.enum.length);
    return schema.enum[randomIndex];
  }
  
  // Handle common string formats
  switch (schema.format) {
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'date-time':
      return new Date().toISOString();
    case 'email':
      return `test-${Math.floor(Math.random() * 1000)}@example.com`;
    case 'uuid':
      return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, c => {
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
      return 'dGVzdCBiaW5hcnkgZGF0YQ=='; // Base64 "test binary data"
    default:
      // Generate a basic string with specified length or default
      const minLength = schema.minLength || 5;
      const maxLength = schema.maxLength || 10;
      const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
      return `sample-${Math.random().toString(36).substring(2, 2 + length)}`;
  }
}

/**
 * Generates a dummy number based on schema
 * @param {object} schema - The number schema
 * @returns {number} - Generated number
 */
function generateNumberData(schema) {
  const isInteger = schema.type === 'integer';
  let min = schema.minimum !== undefined ? schema.minimum : 0;
  let max = schema.maximum !== undefined ? schema.maximum : 100;
  
  // Ensure min < max
  if (min >= max) max = min + 10;
  
  // Generate number
  const value = Math.random() * (max - min) + min;
  return isInteger ? Math.floor(value) : Number(value.toFixed(2));
}

/**
 * Fallback function to generate basic dummy data based on endpoint path
 * @param {string} endpointPath - The API endpoint path
 * @returns {object} - Generated dummy data
 */
function generateBasicDummyData(endpointPath) {
  const dummyData = {};
  const path = endpointPath.toLowerCase();

  // User-related endpoints
  if (path.includes('user') || path.includes('account') || path.includes('profile')) {
    dummyData.id = Math.floor(Math.random() * 1000);
    dummyData.username = `testuser${Math.floor(Math.random() * 100)}`;
    dummyData.firstName = "Test";
    dummyData.lastName = "User";
    dummyData.email = `test${Math.floor(Math.random() * 100)}@example.com`;
    dummyData.password = "Password123!";
    dummyData.phone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    dummyData.status = "active";
  } 
  // Pet or animal related endpoints
  else if (path.includes('pet') || path.includes('animal')) {
    dummyData.id = Math.floor(Math.random() * 1000);
    dummyData.name = `Pet${Math.floor(Math.random() * 100)}`;
    dummyData.status = ['available', 'pending', 'sold'][Math.floor(Math.random() * 3)];
    dummyData.category = {
      id: Math.floor(Math.random() * 10),
      name: ['dog', 'cat', 'bird', 'fish'][Math.floor(Math.random() * 4)]
    };
    dummyData.tags = [
      { id: 1, name: 'tag1' },
      { id: 2, name: 'tag2' }
    ];
    dummyData.photoUrls = ['https://example.com/pet.jpg'];
  }
  // Order or store related endpoints
  else if (path.includes('order') || path.includes('store')) {
    dummyData.id = Math.floor(Math.random() * 1000);
    dummyData.petId = Math.floor(Math.random() * 100);
    dummyData.quantity = Math.floor(Math.random() * 10) + 1;
    dummyData.shipDate = new Date().toISOString();
    dummyData.status = ['placed', 'approved', 'delivered'][Math.floor(Math.random() * 3)];
    dummyData.complete = Math.random() > 0.5;
  }
  // Product related endpoints
  else if (path.includes('product') || path.includes('item')) {
    dummyData.id = Math.floor(Math.random() * 1000);
    dummyData.name = `Product${Math.floor(Math.random() * 100)}`;
    dummyData.price = Number((Math.random() * 100).toFixed(2));
    dummyData.category = ['electronics', 'clothing', 'food'][Math.floor(Math.random() * 3)];
    dummyData.stock = Math.floor(Math.random() * 100);
    dummyData.description = "This is a sample product description";
    dummyData.imageUrl = "https://example.com/product.jpg";
  }
  // Default for other endpoints
  else {
    dummyData.id = Math.floor(Math.random() * 1000);
    dummyData.name = `Sample${Math.floor(Math.random() * 100)}`;
    dummyData.description = `Sample data for ${endpointPath}`;
    dummyData.createdAt = new Date().toISOString();
  }

  return dummyData;
}

module.exports = { generateDummyData };
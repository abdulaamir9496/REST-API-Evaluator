const axios = require('axios');
const Log = require('../models/logModel');
const { generateDummyData } = require('../utils/dummyDataGenerator');
const { configureAuth } = require('../utils/authHelper');

// In-memory storage for auth configurations
// In a production app, you might store this in a database
const authConfigurations = {};

async function testOAS(req, res) {
  try {
    // Allow for more configuration options in the request
    const { oasUrl, authConfig, authName } = req.body;
    if (!oasUrl) {
      return res.status(400).json({ message: 'oasUrl is required' });
    }

    // Determine which auth config to use
    let effectiveAuthConfig = authConfig;
    
    // If authName is provided, use the stored config
    if (authName && authConfigurations[authName]) {
      effectiveAuthConfig = authConfigurations[authName];
    }

    const oasResponse = await fetchOAS(oasUrl);
    const oas = oasResponse.data;
    
    // Extract endpoints with more metadata for testing
    const endpoints = getEndpoints(oas);
    const results = await testEndpoints(oas, endpoints, effectiveAuthConfig);

    const summary = getSummary(results);
    console.log('Test summary:', summary);
    res.status(200).json({ summary, results });
  } catch (error) {
    console.error('Error processing OAS:', error.message);
    console.error('Error stack:', error.stack);
    res.status(400).json({ 
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

async function fetchOAS(oasUrl) {
  try {
    console.log('Fetching OAS from:', oasUrl);
    const response = await axios.get(oasUrl);
    console.log('OAS response status:', response.status);
    return response;
  } catch (error) {
    console.error('Error fetching OAS:', error.message);
    throw error;
  }
}

function getEndpoints(oas) {
  const endpoints = [];
  for (const path in oas.paths) {
    const pathData = oas.paths[path];
    for (const method in pathData) {
      if (method.toLowerCase() !== 'parameters') { // Skip parameters section
        const endpointInfo = pathData[method];
        
        // Extract more information about the endpoint
        endpoints.push({
          method: method.toUpperCase(),
          path,
          // Store schema information for request body if available
          requestBody: endpointInfo.requestBody || null,
          parameters: endpointInfo.parameters || [],
          responses: endpointInfo.responses || {},
          // Store security requirements if specified
          security: endpointInfo.security || oas.security || null,
          // Track path parameters needed for URL construction
          pathParams: extractPathParameters(path)
        });
      }
    }
  }
  console.log(`Found ${endpoints.length} endpoints`);
  return endpoints;
}

function extractPathParameters(path) {
  // Extract parameters from paths like /pets/{petId}
  const pathParams = [];
  const paramRegex = /{([^}]+)}/g;
  let match;
  
  while ((match = paramRegex.exec(path)) !== null) {
    pathParams.push(match[1]);
  }
  
  return pathParams;
}

async function testEndpoints(oas, endpoints, authConfig) {
  const results = [];
  // Get the correct base URL, or allow for override
  const baseUrl = getBaseUrl(oas);
  
  for (const ep of endpoints) {
    // Replace path parameters with dummy values
    const processedPath = replacePathParameters(ep.path, ep.pathParams);
    const fullUrl = `${baseUrl}${processedPath}`;
    
    console.log(`Testing endpoint: ${ep.method} ${fullUrl}`);
    
    // Generate appropriate request data based on schema
    const reqData = ep.method === 'POST' || ep.method === 'PUT' ? 
                    generateDummyData(ep.path, ep.requestBody) : undefined;
    
                    const config = {
                      method: ep.method,
                      url: fullUrl,
                      data: reqData,
                      headers: {}
                    };
                    
    try {
      // Configure request with authentication if needed
      // const config = {
      //   method: ep.method,
      //   url: fullUrl,
      //   data: reqData,
      //   headers: {}
      // };
      
      // Use the auth helper to configure authentication
      configureAuth(config, ep.security, authConfig);

      const response = await axios(config);

      results.push({
        endpoint: ep.path,
        method: ep.method,
        request: {
          url: fullUrl,
          method: ep.method,
          data: reqData || null,
          headers: config.headers
        },
        response: response.data,
        statusCode: response.status,
        timestamp: new Date(),
        success: true
      });
    } catch (err) {
      console.error(`Error testing endpoint: ${fullUrl}`, err.message);
      results.push({
        endpoint: ep.path,
        method: ep.method,
        error: err.message,
        success: false,
        request: {
          url: fullUrl,
          method: ep.method,
          data: reqData || null,
          headers: config.headers
        },
        response: err.response?.data,
        statusCode: err.response?.status
      });
    }
  }
  return results;
}

function getBaseUrl(oas) {
  // Extract the base URL from the OAS or use a default
  if (oas.servers && oas.servers.length > 0) {
    // Use the first server URL by default
    return oas.servers[0].url;
  }
  
  // For OpenAPI 2.0 (Swagger)
  if (oas.host && oas.basePath) {
    // Support for Swagger 2.0 format
    const scheme = (oas.schemes && oas.schemes[0]) || 'https';
    return `${scheme}://${oas.host}${oas.basePath}`;
  }
  
  // Fallback
  return '';
}

function replacePathParameters(path, pathParams) {
  let processedPath = path;
  pathParams.forEach(param => {
    processedPath = processedPath.replace(`{${param}}`, `sample-${param}`);
  });
  return processedPath;
}

async function retryEndpoint(req, res) {
  try {
    const { url, method, data, headers, authConfig } = req.body;

    const config = {
      method,
      url,
      data: ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) ? data : undefined,
      headers: headers || {}
    };
    
    // Apply auth configuration if provided
    if (authConfig) {
      configureAuth(config, null, authConfig);
    }

    const response = await axios(config);

    res.json({
      success: true,
      status: response.status,
      response: response.data,
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      status: error.response?.status,
      response: error.response?.data,
    });
  }
}

async function updateAuthConfig(req, res) {
  try {
    const { name, config } = req.body;
    
    if (!name || !config) {
      return res.status(400).json({ 
        message: 'Auth configuration name and config object are required' 
      });
    }
    
    // Validate config based on type
    if (!config.type) {
      return res.status(400).json({ 
        message: 'Auth configuration must include a type' 
      });
    }
    
    // Additional validation based on auth type
    switch (config.type) {
      case 'bearer':
        if (!config.token) {
          return res.status(400).json({ 
            message: 'Bearer token is required for bearer auth' 
          });
        }
        break;
      
      case 'apiKey':
        if (!config.header || !config.value) {
          return res.status(400).json({ 
            message: 'Header name and value are required for API key auth' 
          });
        }
        break;
      
      case 'basic':
        if (!config.username || !config.password) {
          return res.status(400).json({ 
            message: 'Username and password are required for basic auth' 
          });
        }
        break;
      
      case 'custom':
        if (!config.headers || typeof config.headers !== 'object') {
          return res.status(400).json({ 
            message: 'Headers object is required for custom auth' 
          });
        }
        break;
    }
    
    // Store the configuration
    authConfigurations[name] = config;
    
    res.status(200).json({ 
      message: `Auth configuration '${name}' saved successfully` 
    });
  } catch (error) {
    console.error('Error updating auth config:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
}

// List available auth configurations
async function listAuthConfigs(req, res) {
  try {
    const configList = Object.keys(authConfigurations).map(name => ({
      name,
      type: authConfigurations[name].type
    }));
    
    res.status(200).json({ configurations: configList });
  } catch (error) {
    console.error('Error listing auth configs:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get a specific auth configuration
async function getAuthConfig(req, res) {
  try {
    const { name } = req.params;
    
    if (!authConfigurations[name]) {
      return res.status(404).json({ 
        message: `Auth configuration '${name}' not found` 
      });
    }
    
    // Return a sanitized version (e.g., without showing full tokens)
    const config = { ...authConfigurations[name] };
    
    // Mask sensitive information
    if (config.token) {
      config.token = `${config.token.substring(0, 4)}...`;
    }
    if (config.password) {
      config.password = '********';
    }
    
    res.status(200).json({ name, config });
  } catch (error) {
    console.error('Error getting auth config:', error);
    res.status(500).json({ error: error.message });
  }
}

// Delete an auth configuration
async function deleteAuthConfig(req, res) {
  try {
    const { name } = req.params;
    
    if (!authConfigurations[name]) {
      return res.status(404).json({ 
        message: `Auth configuration '${name}' not found` 
      });
    }
    
    delete authConfigurations[name];
    
    res.status(200).json({ 
      message: `Auth configuration '${name}' deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting auth config:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  testOAS,
  retryEndpoint,
  updateAuthConfig,
  listAuthConfigs,
  getAuthConfig,
  deleteAuthConfig
};

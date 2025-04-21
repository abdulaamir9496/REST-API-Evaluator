const axios = require('axios');
const Log = require('../models/logModel');
const { generateDummyData } = require('../utils/dummyDataGenerator');
const { configureAuth } = require('../utils/authHelper');

// In-memory storage for auth configurations
const authConfigurations = {};

async function testOAS(req, res) {
  const { oasUrl } = req.body;
  let summary = {};
  let overallSuccessCount = 0;
  let overallRequestCount = 0;

  try {
    const spec = await loadSpecFile(oasUrl); // Load the OAS file
    const endpoints = Object.keys(spec.paths).map(path => {
      const methods = Object.keys(spec.paths[path]);
      return { path, methods };
    });

    for (const endpoint of endpoints) {
      for (const method of endpoint.methods) {
        const url = `https://petstore.swagger.io/v2/swagger.json${endpoint.path}`;
        overallRequestCount++;

        try {
          const response = await axios({ method, url });
          const success = response.status >= 200 && response.status < 300;

          // Track success for this endpoint
          if (!summary[endpoint.path]) {
            summary[endpoint.path] = { successCount: 0, requestCount: 0 };
          }
          summary[endpoint.path].requestCount++;
          if (success) {
            summary[endpoint.path].successCount++;
            overallSuccessCount++;
          }
        } catch (error) {
          // Handle error (e.g., log it)
          console.error(`Error calling ${method} ${url}:`, error.message);
        }
      }
    }

    // Calculate success frequency for each endpoint
    for (const path in summary) {
      const { successCount, requestCount } = summary[path];
      summary[path].successFrequency = (successCount / requestCount) * 100;
    }

    // Calculate overall success frequency
    const overallSuccessFrequency = (overallSuccessCount / overallRequestCount) * 100;

    // Return results and summary
    res.json({
      results: summary,
      overallSuccessFrequency,
    });
  } catch (error) {
    console.error('Error processing OAS:', error);
    res.status(500).json({ error: 'Failed to process OAS' });
  }
}

async function fetchOAS(oasUrl) {
  try {
    console.log('Fetching OAS from:', oasUrl);
    const response = await axios.get(oasUrl); // Fetching from the URL directly
    console.log('OAS response status:', response.status);
    return response;
  } catch (error) {
    console.error('Error fetching OAS:', error.message);
    throw error; // Rethrow the error to be caught in testOAS
  }
}

function getEndpoints(oas) {
  const endpoints = [];
  for (const path in oas.paths) {
    const pathData = oas.paths[path];
    for (const method in pathData) {
      if (method.toLowerCase() !== 'parameters') {
        const endpointInfo = pathData[method];
        endpoints.push({
          method: method.toUpperCase(),
          path,
          requestBody: endpointInfo.requestBody || null,
          parameters: endpointInfo.parameters || [],
          responses: endpointInfo.responses || {},
          security: endpointInfo.security || oas.security || null,
          pathParams: extractPathParameters(path)
        });
      }
    }
  }
  console.log(`Found ${endpoints.length} endpoints`);
  return endpoints;
}

function extractPathParameters(path) {
  const pathParams = [];
  const paramRegex = /{([^}]+)}/g;
  let match;
  while ((match = paramRegex.exec(path)) !== null) {
    pathParams.push(match[1]);
  }
  return pathParams;
}

function getSummary(results) {
  if (!results || !Array.isArray(results)) {
    return {
      total: 0,
      success: 0,
      failed: 0,
      successRate: 0,
      statusCodes: {},
      commonErrors: []
    };
  }

  const success = results.filter(r => r.success).length;
  const failed = results.length - success;
  const successRate = results.length > 0 ? 
    Math.round((success / results.length) * 100) : 0;

  const statusCodes = {};
  results.forEach(result => {
    const statusCode = result.statusCode || 'unknown';
    statusCodes[statusCode] = (statusCodes[statusCode] || 0) + 1;
  });

  const errorCounts = {};
  results.filter(r => !r.success).forEach(result => {
    const errorMsg = result.error || 'Unknown error';
    errorCounts[errorMsg] = (errorCounts[errorMsg] || 0) + 1;
  });

  const commonErrors = Object.entries(errorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([error, count]) => ({ error, count }));

  return {
    total: results.length,
    success,
    failed,
    successRate,
    statusCodes,
    commonErrors
  };
}

async function testEndpoints(oas, endpoints, authConfig) {
  const results = [];
  const baseUrl = getBaseUrl(oas);

  for (const ep of endpoints) {
    const processedPath = replacePathParameters(ep.path, ep.pathParams);
    const fullUrl = `${baseUrl}${processedPath}`;
    console.log(`Testing endpoint: ${ep.method} ${fullUrl}`);

    const reqData = ep.method === 'POST' || ep.method === 'PUT'
      ? generateDummyData(ep.path, ep.requestBody)
      : undefined;

    const config = {
      method: ep.method,
      url: fullUrl,
      data: reqData,
      headers: {}
    };

    try {
      configureAuth(config, ep.security, authConfig);
      const response = await axios(config);

      // Log the request and response
      await Log.create({
        endpoint: ep.path,
        method: ep.method,
        request: {
          url: fullUrl,
          method: ep.method,
          data: reqData || null,
          headers: config.headers
        },
        response: response.data,
        timestamp: new Date()
      });

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
  if (oas.servers && oas.servers.length > 0) {
    return oas.servers[0].url;
  }

  if (oas.host && oas.basePath) {
    const scheme = (oas.schemes && oas.schemes[0]) || 'https';
    return `${scheme}://${oas.host}${oas.basePath}`;
  }

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
    if (!name || !config || !config.type) {
      return res.status(400).json({ message: 'Invalid auth configuration' });
    }

    switch (config.type) {
      case 'bearer':
        if (!config.token) return res.status(400).json({ message: 'Bearer token is required' });
        break;
      case 'apiKey':
        if (!config.header || !config.value) return res.status(400).json({ message: 'API key requires header and value' });
        break;
      case 'basic':
        if (!config.username || !config.password) return res.status(400).json({ message: 'Basic auth requires username and password' });
        break;
      case 'custom':
        if (!config.headers || typeof config.headers !== 'object') return res.status(400).json({ message: 'Custom auth requires headers object' });
        break;
    }

    authConfigurations[name] = config;
    res.status(200).json({ message: `Auth configuration '${name}' saved successfully` });
  } catch (error) {
    console.error('Error updating auth config:', error);
    res.status(500).json({ error: error.message });
  }
}

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

async function getAuthConfig(req, res) {
  try {
    const { name } = req.params;
    if (!authConfigurations[name]) {
      return res.status(404).json({ message: `Auth configuration '${name}' not found` });
    }

    const config = { ...authConfigurations[name] };
    if (config.token) config.token = `${config.token.substring(0, 4)}...`;
    if (config.password) config.password = '********';

    res.status(200).json({ name, config });
  } catch (error) {
    console.error('Error getting auth config:', error);
    res.status(500).json({ error: error.message });
  }
}

async function deleteAuthConfig(req, res) {
  try {
    const { name } = req.params;
    if (!authConfigurations[name]) {
      return res.status(404).json({ message: `Auth configuration '${name}' not found` });
    }

    delete authConfigurations[name];
    res.status(200).json({ message: `Auth configuration '${name}' deleted successfully` });
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
  deleteAuthConfig,
  getSummary
};

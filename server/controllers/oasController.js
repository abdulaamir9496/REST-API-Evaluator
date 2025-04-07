const axios = require('axios');
const Log = require('../models/logModel');
const { generateDummyData } = require('../utils/dummyDataGenerator');

/**
 * Tests an OpenAPI Specification (OAS) and returns a summary of the results.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function testOAS(req, res) {
  try {
    const { oasUrl } = req.body;
    if (!oasUrl) {
      return res.status(400).json({ message: 'oasUrl is required' });
    }

    const oasResponse = await fetchOAS(oasUrl);
    const oas = oasResponse.data;
    const endpoints = getEndpoints(oas);
    const results = await testEndpoints(oas, endpoints);

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

/**
 * Fetches an OpenAPI Specification (OAS) from a given URL.
 * 
 * @param {String} oasUrl - The URL of the OAS.
 * @returns {Object} The response from the OAS URL.
 */
async function fetchOAS(oasUrl) {
  try {
    console.log('Fetching OAS from:', oasUrl);
    const response = await axios.get(oasUrl);
    console.log('OAS response status:', response.status);
    console.log('OAS response headers:', response.headers);
    return response;
  } catch (error) {
    console.error('Error fetching OAS:', error.message);
    console.error('Error response:', error.response?.data);
    console.error('Error status:',  error.response?.status);
    console.error('Error headers:', error.response?.headers);
    throw error;
  }
}

/**
 * Gets the endpoints from an OpenAPI Specification (OAS).
 * 
 * @param {Object} oas - The OAS object.
 * @returns {Array} An array of endpoint objects.
 */
function getEndpoints(oas) {
  console.log('OAS servers:', oas.servers);
  const endpoints = [];
  for (const path in oas.paths) {
    const methods = oas.paths[path];
    for (const method in methods) {
      endpoints.push({ method: method.toUpperCase(), path });
    }
  }
  console.log('Found endpoints:', endpoints.length);
  return endpoints;
}

/**
 * Tests an array of endpoints and returns the results.
 * 
 * @param {Object} oas - The OAS object.
 * @param {Array} endpoints - An array of endpoint objects.
 * @returns {Array} An array of result objects.
 */
async function testEndpoints(oas, endpoints) {
  const results = [];
  const baseUrl = oas.servers?.[0]?.url || 'https://petstore.swagger.io/v2';
  
  for (const ep of endpoints) {
    const fullUrl = `${baseUrl}${ep.path}`;
    console.log('Testing endpoint:', fullUrl, ep.method);
    const reqData = ep.method === 'POST' ? generateDummyData(ep.path) : undefined;

    try {
      const response = await axios({
        method: ep.method,
        url: fullUrl,
        data: reqData,
      });

      // Create log object without saving to database
      const log = {
        endpoint: ep.path,
        method: ep.method,
        request: {
          url: fullUrl,
          method: ep.method,
          data: reqData || null,
        },
        response: response.data,
        statusCode: response.status,
        timestamp: new Date(),
      };

      results.push({ ...log, success: true });
    } catch (err) {
      console.error('Error testing endpoint:', fullUrl, err.message);
      results.push({
        endpoint: ep.path,
        method: ep.method,
        error: err.message,
        success: false,
        request: {
          url: fullUrl,
          method: ep.method,
          data: reqData || null,
        },
      });
    }
  }
  return results;
}

/**
 * Gets a summary of the test results.
 * 
 * @param {Array} results - An array of result objects.
 * @returns {Object} A summary object.
 */
function getSummary(results) {
  return {
    total: results.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
  };
}

/**
 * Retries an endpoint with the given URL, method, and data.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function retryEndpoint(req, res) {
  try {
    const { url, method, data } = req.body;

    const response = await axios({
      method,
      url,
      data: method === 'POST' ? data : undefined,
    });

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

// Export both functions
module.exports = {
  testOAS,
  retryEndpoint,
};

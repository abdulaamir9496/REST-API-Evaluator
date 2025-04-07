const axios = require('axios');
const Log = require('../models/logModel');
const { generateDummyData } = require('../utils/dummyDataGenerator');

async function testOAS(req, res) {
  try {
    const { oasUrl } = req.body;
    if (!oasUrl) {
      return res.status(400).json({ message: 'oasUrl is required' });
    }

    console.log('Fetching OAS from:', oasUrl);
    let oasResponse;
    try {
      oasResponse = await axios.get(oasUrl);
      console.log('OAS response status:', oasResponse.status);
      console.log('OAS response headers:', oasResponse.headers);
    } catch (error) {
      console.error('Error fetching OAS:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      throw error;
    }

    const oas = oasResponse.data;
    console.log('OAS servers:', oas.servers);
    
    const endpoints = [];
    for (const path in oas.paths) {
      const methods = oas.paths[path];
      for (const method in methods) {
        endpoints.push({ method: method.toUpperCase(), path });
      }
    }
    console.log('Found endpoints:', endpoints.length);

    const results = [];
    for (const ep of endpoints) {
      const fullUrl = `${oas.servers?.[0]?.url}${ep.path}`;
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

    const summary = {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    };

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

// New Retry Endpoint
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

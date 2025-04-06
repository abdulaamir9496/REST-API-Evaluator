const axios = require("axios");

const testOAS = async (req, res) => {
  const { oasUrl } = req.body;

  try {
    const response = await axios.get(oasUrl);
    const oas = response.data;

    const endpoints = [];

    for (const [path, methods] of Object.entries(oas.paths)) {
      for (const [method, details] of Object.entries(methods)) {
        if (["get", "post"].includes(method.toLowerCase())) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
          });
        }
      }
    }

    const results = await Promise.all(endpoints.map(async (ep) => {
      try {
        const url = `${oas.host}${oas.basePath}${ep.path}`;
        const fullUrl = `https://${url}`;
        const res = await axios({
          url: fullUrl,
          method: ep.method.toLowerCase(),
          data: ep.method === "POST" ? { dummy: "test" } : undefined,
        });

        return {
          endpoint: ep.path,
          method: ep.method,
          status: res.status,
          success: true,
        };
      } catch (error) {
        return {
          endpoint: ep.path,
          method: ep.method,
          status: error.response?.status || 500,
          success: false,
        };
      }
    }));

    const summary = {
      total: results.length,
      success: results.filter(r => r.success).length,
    };

    res.json({ summary, results });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch or parse OAS." });
  }
};

module.exports = { testOAS };

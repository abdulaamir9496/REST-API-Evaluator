/**
 * Configures authentication headers based on security requirements
 * @param {Object} config - The axios request config object
 * @param {Array|Object} securityReqs - Security requirements from OpenAPI spec
 * @param {Object} authConfig - Custom auth configuration from request
 */
function configureAuth(config, securityReqs, authConfig) {
  // Ensure config object exists
  config = config || {};
  
  // Priority 1: Use auth config provided in the request
  if (authConfig) {
    applyAuthConfig(config, authConfig);
    return;
  }

  // Priority 2: Use security requirements from OpenAPI spec with env defaults
  if (securityReqs) {
    applySecurityRequirements(config, securityReqs);
    return;
  }

  // Priority 3: No auth required or no auth info available
  console.log('No authentication configured for this request');
}

/**
 * Applies custom auth configuration to request
 * @param {Object} config - The axios request config object
 * @param {Object} authConfig - Custom auth configuration
 */
function applyAuthConfig(config, authConfig) {
  // Ensure authConfig exists
  if (!authConfig) {
    console.warn('Auth config is missing or invalid');
    return;
  }

  if (!config.headers) {
    config.headers = {};
  }

  // Safely access authConfig.type with fallback
  const authType = (authConfig.type || 'bearer').toLowerCase();
  
  switch (authType) {
    case 'bearer':
      if (!authConfig.token) {
        console.warn('Bearer token is missing, using default or environment variable');
        config.headers[authConfig.header || 'Authorization'] = `Bearer ${process.env.DEFAULT_BEARER_TOKEN || 'TOKEN_MISSING'}`;
      } else {
        config.headers[authConfig.header || 'Authorization'] = `Bearer ${authConfig.token}`;
      }
      break;
      
    case 'apikey':
      if (!authConfig.value) {
        console.warn('API key value is missing, using default or environment variable');
        config.headers[authConfig.header || 'X-API-Key'] = process.env.API_KEY || 'API_KEY_MISSING';
      } else {
        config.headers[authConfig.header || 'X-API-Key'] = authConfig.value;
      }
      break;
      
    case 'basic':
      if (!authConfig.username || !authConfig.password) {
        console.warn('Basic auth credentials are incomplete, using environment variables');
        const username = authConfig.username || process.env.BASIC_AUTH_USER || 'missing_username';
        const password = authConfig.password || process.env.BASIC_AUTH_PASS || 'missing_password';
        const base64Auth = Buffer.from(`${username}:${password}`).toString('base64');
        config.headers['Authorization'] = `Basic ${base64Auth}`;
      } else {
        const base64Auth = Buffer.from(`${authConfig.username}:${authConfig.password}`).toString('base64');
        config.headers['Authorization'] = `Basic ${base64Auth}`;
      }
      break;
      
    case 'oauth2':
      if (!authConfig.token) {
        console.warn('OAuth2 token is missing, using default or environment variable');
        config.headers['Authorization'] = `Bearer ${process.env.OAUTH_TOKEN || process.env.DEFAULT_AUTH_VALUE || 'OAUTH_TOKEN_MISSING'}`;
      } else {
        config.headers['Authorization'] = `Bearer ${authConfig.token}`;
      }
      break;
      
    case 'custom':
      // Apply custom headers directly
      if (!authConfig.headers || Object.keys(authConfig.headers).length === 0) {
        console.warn('Custom headers are missing');
      } else {
        Object.assign(config.headers, authConfig.headers);
      }
      break;
      
    default:
      console.warn(`Unknown auth type: ${authType}, using default authorization if available`);
      // Apply default auth if available
      if (process.env.DEFAULT_AUTH_KEY && process.env.DEFAULT_AUTH_VALUE) {
        config.headers[process.env.DEFAULT_AUTH_KEY] = process.env.DEFAULT_AUTH_VALUE;
      }
  }
}

/**
 * Applies security requirements from OpenAPI spec using environment defaults
 * @param {Object} config - The axios request config object
 * @param {Array|Object} securityReqs - Security requirements from OpenAPI spec
 */
function applySecurityRequirements(config, securityReqs) {
  if (!config.headers) {
    config.headers = {};
  }

  // Handle security requirements being null or undefined
  if (!securityReqs) {
    console.warn('Security requirements are missing or invalid');
    return;
  }

  // Handle array of security requirements (OR relationship)
  if (Array.isArray(securityReqs)) {
    // Use the first security requirement that we can satisfy
    let authApplied = false;
    
    for (const secReq of securityReqs) {
      // Skip empty security requirements
      if (!secReq || typeof secReq !== 'object' || Object.keys(secReq).length === 0) {
        continue;
      }
      
      const secType = Object.keys(secReq)[0];
      
      if (secType === 'bearerAuth' || secType === 'BearerAuth') {
        config.headers['Authorization'] = `Bearer ${process.env.BEARER_TOKEN || process.env.DEFAULT_AUTH_VALUE || 'YOUR_TOKEN_HERE'}`;
        authApplied = true;
        break;
      }
      
      if (secType === 'apiKey' || secType.includes('ApiKey')) {
        const headerName = process.env.API_KEY_HEADER || process.env.DEFAULT_AUTH_KEY || 'X-API-Key';
        config.headers[headerName] = process.env.API_KEY || 'YOUR_API_KEY';
        authApplied = true;
        break;
      }
      
      if (secType === 'basic' || secType === 'BasicAuth') {
        // Use environment variables for basic auth if available
        const username = process.env.BASIC_AUTH_USER || 'missing_username';
        const password = process.env.BASIC_AUTH_PASS || 'missing_password';
        const base64Auth = Buffer.from(`${username}:${password}`).toString('base64');
        config.headers['Authorization'] = `Basic ${base64Auth}`;
        authApplied = true;
        break;
      }
      
      if (secType === 'oauth2' || secType.includes('OAuth')) {
        // Fallback to default bearer token for OAuth
        config.headers['Authorization'] = `Bearer ${process.env.OAUTH_TOKEN || process.env.DEFAULT_AUTH_VALUE || 'YOUR_TOKEN_HERE'}`;
        authApplied = true;
        break;
      }
    }
    
    // If no auth was applied, log a warning
    if (!authApplied) {
      console.warn('Could not satisfy any security requirements');
    }
  } 
  // Handle single security requirement (could be from global security)
  else if (securityReqs && typeof securityReqs === 'object') {
    try {
      const headerName = process.env.DEFAULT_AUTH_KEY || 'Authorization';
      const headerValue = process.env.DEFAULT_AUTH_VALUE || 'Bearer YOUR_TOKEN_HERE';
      config.headers[headerName] = headerValue;
    } catch (error) {
      console.error('Error applying security requirements:', error);
    }
  }
}

module.exports = {
  configureAuth
};
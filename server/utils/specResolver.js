async function resolveRefsInSpec(spec) {
    // Naive resolver — expands internal $refs only
    const refs = {};
  
    function resolve(obj, root = spec) {
      if (Array.isArray(obj)) return obj.map((item) => resolve(item, root));
      if (typeof obj !== "object" || obj === null) return obj;
  
      if (obj.$ref && typeof obj.$ref === "string" && obj.$ref.startsWith("#/")) {
        const pathParts = obj.$ref.substring(2).split("/");
        let resolved = root;
        for (const part of pathParts) resolved = resolved[part];
        return resolve(resolved, root);
      }
  
      const resolvedObj = {};
      for (const [key, value] of Object.entries(obj)) {
        resolvedObj[key] = resolve(value, root);
      }
  
      return resolvedObj;
    }
  
    return resolve(spec);
  }
  
  module.exports = { resolveRefsInSpec };
  
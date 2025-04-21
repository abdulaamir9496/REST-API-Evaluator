const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { resolveRefsInSpec } = require("../utils/specResolver");
const { generateDummyData } = require("../utils/dummyDataGenerator");

const specsDir = path.join(__dirname, "../specs");

async function runTests() {
  const files = fs.readdirSync(specsDir);

  for (const file of files) {
    const filePath = path.join(specsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const spec =
      file.endsWith(".yaml") || file.endsWith(".yml")
        ? yaml.load(content)
        : JSON.parse(content);

    console.log(`\n🌐 Running tests for: ${file}`);
    const resolvedSpec = await resolveRefsInSpec(spec);

    for (const [pathKey, pathItem] of Object.entries(resolvedSpec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        const endpoint = `${method.toUpperCase()} ${pathKey}`;
        const reqBody =
          operation.requestBody ||
          operation.parameters?.find((p) => p.in === "body");

        const dummy = generateDummyData(pathKey, reqBody);
        console.log(`\n🔹 ${endpoint}`);
        console.log("Dummy Data:", JSON.stringify(dummy, null, 2));
      }
    }
  }
}

runTests().catch(console.error);

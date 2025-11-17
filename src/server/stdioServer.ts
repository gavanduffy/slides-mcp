#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./serverCore.js";

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Server is now running and will handle requests via stdio
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

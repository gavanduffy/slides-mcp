#!/usr/bin/env node
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer } from "./serverCore.js";

async function main() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));

  const port = parseInt(process.env.PORT || "3000", 10);

  app.get("/sse", async (req, res) => {
    console.log("New SSE connection");
    
    const transport = new SSEServerTransport("/message", res);
    const server = createServer();
    
    await server.connect(transport);
    
    res.on("close", () => {
      console.log("SSE connection closed");
    });
  });

  app.post("/message", async (req, res) => {
    console.log("Received message");
    // The SSE transport will handle this
    res.status(202).end();
  });

  app.listen(port, () => {
    console.log(`MCP server listening on http://0.0.0.0:${port}`);
    console.log(`Connect to SSE endpoint: http://0.0.0.0:${port}/sse`);
  });
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

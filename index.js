// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
var mockData = {
  portfolios: [
    {
      id: "680e091a1fc038a384b30016",
      name: "Tech-Portfolio",
      description: "This portfolio exhibits a mixed outlook. While NFLX demonstrates strong positive momentum driven by subscriber growth and advertising revenue, AAPL faces headwinds from macroeconomic concerns and valuation risks, despite positive analyst sentiment. Overall portfolio performance is thus sensitive to global economic conditions, with NFLX acting as a growth engine and AAPL's stability potentially challenged. Managing risk related to broader economic slowdowns will be crucial.",
      instrumentCount: 2,
      createdAt: "2025-04-27T10:38:18.278Z",
      updatedAt: "2025-04-27T10:38:18.278Z"
    }
  ],
  portfolioInstruments: {
    "Tech-Portfolio": [
      {
        id: "680e08ea1fc038a384b30006",
        name: "Apple Inc.",
        symbol: "AAPL",
        sentiment: "POSITIVE",
        sentimentScore: 0.3,
        summary: "The content highlights both positive and negative aspects related to AAPL. A Huatai analyst initiated coverage with a buy rating and a price target significantly above the current price, expecting growth in hardware and benefits from buybacks and dividends. However, the content also acknowledges that AAPL is not immune to tariffs and broader macroeconomic headwinds, and a global recession could negatively impact sales."
      },
      {
        id: "680e08f41fc038a384b3000f",
        name: "Netflix Inc.",
        symbol: "NFLX",
        sentiment: "POSITIVE",
        sentimentScore: 0.8,
        summary: "The content emphasizes NFLX's strong first-quarter performance, exceeding Wall Street expectations, a 13% year-over-year revenue increase, and an all-time high EPS. It also highlights the company's successful scaling of its advertising-supported tier and optimistic financial forecasts for 2025."
      }
    ]
  },
  portfolioDistribution: {
    "Tech-Portfolio": {
      portfolioId: "680e08b41fc038a384b2fff0",
      distribution: {
        positive: 2,
        negative: 0,
        neutral: 0
      }
    }
  }
};
async function registerRoutes(app2) {
  app2.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  app2.get("/portfolio/list", (req, res) => {
    res.json(mockData.portfolios);
  });
  app2.get("/portfolio/portfolio-instruments", (req, res) => {
    res.json(mockData.portfolioInstruments);
  });
  app2.get("/portfolio/portfolio-distribution", (req, res) => {
    res.json(mockData.portfolioDistribution);
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();

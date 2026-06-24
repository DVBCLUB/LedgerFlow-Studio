import express from "express";
import softwareFactoryRoutes from "./services/softwareFactoryRoutes";
import { getSoftwareFactoryStats, seedSoftwareFactoryRuns } from "./services/softwareFactoryService";

const app = express();
const PORT = parseInt(process.env.SOFTWARE_FACTORY_PORT ?? "3011", 10);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((_req, res, next) => {
  const origin = _req.headers.origin ?? "";
  if (!origin || origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "Software Factory Daemon",
    version: "0.1.0",
    stats: getSoftwareFactoryStats(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/software-factory", softwareFactoryRoutes);

if (process.env.SOFTWARE_FACTORY_SEED === "1") {
  seedSoftwareFactoryRuns();
}

app.listen(PORT, () => {
  console.log(`[software-factory] daemon listening on http://localhost:${PORT}`);
});

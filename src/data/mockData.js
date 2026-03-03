export const orgSummary = {
  orgName: "Project X",
  owner: "Nammagiri",
  totalScans: 100,
  scheduled: 1000,
  rescans: 100,
  failedScans: 100,
  lastUpdated: "10 mins ago",
};

export const severityStats = [
  { id: "critical", label: "Critical Severity", count: 86, change: "+2%",   trend: "increase" },
  { id: "high",     label: "High Severity",     count: 16, change: "+0.9%", trend: "increase" },
  { id: "medium",   label: "Medium Severity",   count: 26, change: "+0.9%", trend: "decrease" },
  { id: "low",      label: "Low Severity",       count: 16, change: "+0.9%", trend: "increase" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const completed = (id, name, type, vulnerabilities, lastScan) => ({
  id, name, type, status: "Completed", progress: 100, vulnerabilities, lastScan,
});

const scheduled = (id, name, type, vulnerabilities, lastScan) => ({
  id, name, type, status: "Scheduled", progress: 100, vulnerabilities, lastScan,
});

const failed = (id, name, type, progress, vulnerabilities, lastScan) => ({
  id, name, type, status: "Failed", progress, vulnerabilities, lastScan,
});

// ─── Reusable Vuln Sets ──────────────────────────────────────────────────────
const fullVuln  = { critical: 5,  high: 12, medium: 23, low: 18 };
const sched2    = { critical: 5,  high: 12, medium: 0,  low: 0  };
const failVuln  = { critical: 2,  high: 4,  medium: 8,  low: 1  };
const apiVuln   = { critical: 3,  high: 9,  medium: 14, low: 7  };
const dbVuln    = { critical: 7,  high: 15, medium: 20, low: 10 };

// ─── Base 15 (exact as required) ────────────────────────────────────────────
const baseScans = [
  completed(1,  "Web App Servers",  "Greybox",  fullVuln, "4d ago"),
  completed(2,  "Web App Servers",  "Greybox",  fullVuln, "4d ago"),
  completed(3,  "Web App Servers",  "Greybox",  fullVuln, "4d ago"),
  completed(4,  "Web App Servers",  "Greybox",  fullVuln, "4d ago"),
  completed(5,  "Web App Servers",  "Greybox",  fullVuln, "4d ago"),
  completed(6,  "Web App Servers",  "Greybox",  fullVuln, "4d ago"),
  completed(7,  "Web App Servers",  "Greybox",  fullVuln, "4d ago"),
  scheduled(8,  "Web App Servers",  "Greybox",  sched2,   "4d ago"),
  scheduled(9,  "Web App Servers",  "Greybox",  sched2,   "4d ago"),
  failed(10,    "IoT Devices",      "Blackbox", 10, failVuln, "3d ago"),
  failed(11,    "Temp Data",        "Blackbox", 10, failVuln, "3d ago"),
  completed(12, "API Gateway",      "Greybox",  apiVuln,  "2d ago"),
  completed(13, "Database Cluster", "Whitebox", dbVuln,   "1d ago"),
  scheduled(14, "Mobile Backend",   "Greybox",  sched2,   "5d ago"),
  failed(15,    "Internal Network", "Blackbox", 35, failVuln, "6d ago"),
];

// ─── Generate remaining 85 ───────────────────────────────────────────────────
const extraNames = [
  "Cloud Assets", "Customer Portal", "Edge Network", "Payment Gateway",
  "Analytics Engine", "Container Cluster", "Auth Service", "Reporting Engine",
  "Load Balancer", "Microservice API",
];

const extraTypes = ["Greybox", "Blackbox", "Whitebox"];

const randomVuln = () => ({
  critical: Math.floor(Math.random() * 6),
  high:     Math.floor(Math.random() * 15),
  medium:   Math.floor(Math.random() * 25),
  low:      Math.floor(Math.random() * 20),
});

const randomStatus = () => {
  const r = Math.random();
  if (r < 0.65) return "Completed";
  if (r < 0.85) return "Scheduled";
  return "Failed";
};

const generateScan = (id) => {
  const status = randomStatus();
  const name   = extraNames[Math.floor(Math.random() * extraNames.length)];
  const type   = extraTypes[Math.floor(Math.random() * extraTypes.length)];
  const vuln   = randomVuln();
  const days   = `${Math.floor(Math.random() * 10) + 1}d ago`;

  if (status === "Completed") return completed(id, name, type, vuln, days);
  if (status === "Scheduled") return scheduled(id, name, type, { ...vuln, medium: 0, low: 0 }, days);
  return failed(id, name, type, Math.floor(Math.random() * 60), vuln, days);
};

const generatedScans = Array.from({ length: 85 }, (_, i) => generateScan(i + 16));

// ─── Final Export — 100 Total ────────────────────────────────────────────────
export const scans = [...baseScans, ...generatedScans];
export const totalScans = scans.length; // 100
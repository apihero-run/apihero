import { setupWorker } from "@apihero/js";

const worker = setupWorker({
  projectKey: "hero_abc123",
  url: document.title,
  allow: ["httpbin.org/*"],
});

worker.start();

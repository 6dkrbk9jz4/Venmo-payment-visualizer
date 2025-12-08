import { build as viteBuild, createServer } from "vite";
import { rm } from "fs/promises";

async function buildClient() {
  await rm("dist", { recursive: true, force: true });
  console.log("building client...");
  await viteBuild();
  console.log("client build complete!");
}

async function devClient() {
  console.log("starting vite dev server...");
  const server = await createServer({
    server: {
      port: 5173,
    },
  });
  await server.listen();
  server.printUrls();
}

const isDev = process.argv.includes("--dev");

if (isDev) {
  devClient().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  buildClient().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

import "reflect-metadata";

import { AppDataSource } from "./db/dataSource";
import polkadotActions from "./dripper/polkadot/PolkadotActions";
import { startServer } from "./server";

(async () => {
  await AppDataSource.initialize();
  // Waiting for bot to start first.
  // Thus, listening to port on the server side can be treated as "ready" signal.
  await polkadotActions.isReady;
  startServer();
})().catch((e) => {
  console.error("Start failed:", e);
  process.exit(1);
});

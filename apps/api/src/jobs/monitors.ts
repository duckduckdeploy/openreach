import { processMonitorRun } from "../services/monitors";
import { defineJob } from "./queue";

defineJob("monitor.run", 3, async ({ runId }) => {
  await processMonitorRun(runId);
});

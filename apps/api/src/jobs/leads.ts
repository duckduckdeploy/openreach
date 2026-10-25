import { processLeadSearch } from "../services/lead-search";
import { defineJob } from "./queue";

defineJob("leads.run", 2, async ({ searchId }) => {
  await processLeadSearch(searchId);
});

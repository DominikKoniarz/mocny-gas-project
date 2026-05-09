import { db } from "../lib/db";
import { releaseFiles, releases, updateLogs } from "../lib/db/schema";

db.transaction(() => {
    db.delete(updateLogs).run();
    db.delete(releaseFiles).run();
    db.delete(releases).run();
});

console.log("Cleared update server database.");

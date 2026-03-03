import { Command } from "commander";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";

import { initCommand } from "./commands/init";
import { logCommand } from "./commands/log";
import { verifyCommand } from "./commands/verify";
import { inspectCommand } from "./commands/inspect";
import { exportCommand } from "./commands/export";

// Read version from package.json
const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf8"),
);

const program = new Command();

program
  .name("openlogs")
  .description("OpenLogs CLI - Provable execution evidence")
  .version(pkg.version);

program.addCommand(initCommand);
program.addCommand(logCommand);
program.addCommand(verifyCommand);
program.addCommand(inspectCommand);
program.addCommand(exportCommand);

// Global error handler for user-friendly output
program.exitOverride();

(async () => {
  try {
    await program.parseAsync(process.argv);

    if (!process.argv.slice(2).length) {
      program.outputHelp();
    }
  } catch (err: unknown) {
    // Commander throws for --help and --version; those are not real errors
    if (err instanceof Error && "code" in err) {
      const code = (err as any).code;
      if (code === "commander.helpDisplayed" || code === "commander.version") {
        return;
      }
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\n❌ Error: ${message}`));
    process.exitCode = 1;
  }
})();

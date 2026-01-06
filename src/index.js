#!/usr/bin/env node

// The notes in the code are for YOU, if you see any bug, report it via email or issue on GitHub...
// If you understood something thanks to this code that you couldn't understand before, give this repo a star :]
// Online version here: https://scrapoptimizer.gdlev.dev

import { Command } from "commander";
import addSuffix from "./util/AddSuffix.js";
import { initDB } from "./util/ReadDB.js";
import readGameVersion from "./reader/GameVersion.js";
import Logger from "./util/Logger.js";
import readSmallObjects from "./reader/SmallObjects.js";
import { readChildShapes } from "./reader/ChildShapes.js";
import * as fs from "node:fs";

const program = new Command();

const PRESETS = {
    safe: ["delTrees", "delStones"],
    balanced: ["delTrees", "delStones", "remUnrefWood", "remUnrefWood2", "remUnrefMetal", "remUnrefMetal2"],
    max: ["delTrees", "delStones", "remUnrefWood", "remUnrefWood2", "remUnrefMetal", "remUnrefMetal2", "remSmallObjects"],
};

const OUTPUT_TYPES = ["PLAIN", "JSON", "INT"];

program
    .name("optimize")
    .description("Optimize Scrap Mechanic save file")
    .version("1.0.0")
    .requiredOption("-f, --file <path>", "Save file location")
    .option("-o, --output <path>", "Optimized save file location")
    .option("-1, --delTrees", "Delete fallen trees")
    .option("-2, --delStones", "Delete broken stones")
    .option("-3, --remUnrefWood", "Remove all unrefined wood")
    .option("-4, --remUnrefWood2", "Remove all unrefined hardened wood")
    .option("-5, --remUnrefMetal", "Remove all unrefined metal")
    .option("-6, --remUnrefMetal2", "Remove all unrefined scrap metal")
    .option("-7, --remUnrefStone", "Remove all unrefined stone")
    .option("-8, --remSmallObjects", "Remove all small scattered objects")
    .option("-p, --preset <preset>", "(safe | balanced | max)")
    .option("-t, --type <type>", "Debug output type (PLAIN | JSON | INT)", "PLAIN")
    .option("--force", "ignore game version")
    .addHelpText(
        "after",
        `
Examples:
  optimize -f SAVE.db --delTrees --delStones
  optimize --file SAVE.db -p safe --output JSON
`
    );

program.parse(process.argv);

const opts = program.opts();

// Default options
const options = {
    input: opts.file,
    output: opts.output ?? addSuffix(opts.file, "_optimized"),
    toOptimize: [],
    outputType: OUTPUT_TYPES.includes(opts.type) ? opts.type : "PLAIN",
    force: OUTPUT_TYPES.includes(opts.force) ?? false,
};

// Create logger
const logger = new Logger(options);

// Info
logger.log(`SM World Optimizer CLI launched\n
Version: v1.0.0
Authors: GDLev
Web: https://scrapoptimizer.gdlev.dev\n`)

// Handle presets
if (opts.preset && PRESETS[opts.preset]) {
    options.toOptimize.push(...PRESETS[opts.preset]);
}

// Add single flags
Object.keys(opts).forEach((key) => {
    if (
        key.startsWith("del") ||
        key.startsWith("remUnrefWood") ||
        key.startsWith("remUnrefMetal") ||
        key.startsWith("remSmallObjects")
    ) {
        if (opts[key]) options.toOptimize.push(key);
    }
});

// Remove duplicates
options.toOptimize = [...new Set(options.toOptimize)];

// Init db
if (!fs.existsSync(options.input)) logger.exit("Wrong db file", 404);
fs.copyFileSync(options.input, options.output);
let dbJ = initDB(options.output)
if (dbJ.status === "ERROR") {
    logger.exit("Wrong db file", 404, dbJ.error);
    fs.unlinkSync(options.output);
}

// Check Game version
let gameVer = readGameVersion(dbJ.db);
logger.log(`detected game version ${gameVer}`);
if (gameVer !== 27 && !options.force) {
    logger.exit("The game save is too old", 419);
    fs.unlinkSync(options.output);
}

// Optimize save :)
let index = 0;
(async () => {
    if (options.toOptimize.includes("remSmallObjects")) index += readSmallObjects(dbJ.db); // THIS FUNC ALSO DELETES GAME OBJECTS
    index += await readChildShapes(dbJ.db, options.toOptimize.filter(x => x !== "remSmallObjects")) // THIS FUNC ALSO DELETES GAME OBJECTS
    dbJ.db.close()
    logger.exit(`${index} objects removed`, 200, { count: index, options })
})()
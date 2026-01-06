#!/usr/bin/env node
import { Command } from "commander";
import fs from "fs"
import path from "path"
import addSuffix from "./util/add_suffix";


const program = new Command();

const OUTPUT_TYPES = ["PLAIN", "JSON", "INT"] as const;

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

    .option("-7, --remSmallObjects", "Remove all small scattered objects")

    .option("-p, --preset <preset>", "(safe | balanced | max)")

    // DEV
    .option(
        "-t, --type <type>",
        "Debug output type (PLAIN | JSON | INT)",
        "PLAIN"
    )

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

let options = { 
    input: opts.file, output: opts.output, toOptimize: [] 
};
if (opts.preset) {
    if (opts.preset == "safe") options.toOptimize.push(...['delTrees', 'delStones'])
    else if (opts.preset == "balanced") options.toOptimize.push(...['delTrees', 'delStones', 'remUnrefWood', 'remUnrefWood2', 'remUnrefMetal', 'remUnrefMetal2'])
    else if (opts.preset == "max") options.toOptimize.push(...['delTrees', 'delStones', 'remUnrefWood', 'remUnrefWood2', 'remUnrefMetal', 'remUnrefMetal2', 'remSmallObjects'])
}
if (opts.type) {
    if (opts.preset == "safe") options.toOptimize.push(...['delTrees', 'delStones'])
}
Object.keys(opts).forEach((key) => {
    if (key.startsWith("del") || key.startsWith("remUnrefWood")) options.toOptimize.push(key)
    if (!["PLAIN", "JSON", "INT"].includes(opts.type)) opts.type = "PLAIN";
})

options.toOptimize = [...new Set(options.toOptimize)]; // Remove duplicates
options.output = opts.output ?? addSuffix(opts.file, "_optimized")
console.log(options);
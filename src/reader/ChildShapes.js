import { readUUID } from "../util/ReadUUID.js";
import mappings from "../mappings.json" with { type: "json" }; // remapped from sm survival_items.lua

const cliMapper = {
    remUnrefWood: "obj_harvest_wood",
    remUnrefWood2: "obj_harvest_wood2",
    remUnrefMetal: "obj_harvest_metal2",
    remUnrefMetal2: "obj_harvest_metal",
    remUnrefStone: "obj_harvest_stone",
};

export async function readChildShapes(db, options) {
    let index = 0;

    const definedMapping = options
        .filter(x => x in cliMapper)
        .map(x => cliMapper[x]);

    const rows = db
        .prepare(`SELECT data, id FROM ChildShape`)
        .all();

    rows.forEach(x => {
        const uuid = readUUID(x.data, 26); // reverse engineering | UUID index
        if (uuid) {
            const mapping = mappings[uuid];
            if (
                (mapping && definedMapping.includes(mapping)) || // Look for harvestable objects (wood, stone, etc)
                (mapping && options.includes("delTrees") && (mapping.includes("obj_harvest_log") || mapping.includes('obj_harvests_trees'))) || // Look for fallen trees
                (mapping && options.includes("delStones") && (mapping.includes("obj_harvest_stonechunk") || mapping.includes('obj_harvests_stones'))) // Look for broken rocks
            ) {
                db.prepare(`DELETE FROM ChildShape WHERE id = ?`).run(x.id);
                index++;
            }
        }
    });

    return index;
}
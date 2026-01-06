import { readUUID } from "../util/ReadUUID.js";
import mappings from "../mappings.json" with { type: "json" }; // remapped from sm survival_items.lua

export default function readSmallObjects(db) {
    let index = 0;
    const notJointed = db.prepare(`
      WITH SingleChildBodies AS (
          SELECT bodyId
          FROM ChildShape
          GROUP BY bodyId
          HAVING COUNT(*) = 1
      ),
      SingleChildShapes AS (
          SELECT cs.id AS childShapeId, cs.data
          FROM ChildShape cs
          JOIN SingleChildBodies scb ON cs.bodyId = scb.bodyId
      )
      SELECT scs.childShapeId, scs.data
      FROM SingleChildShapes scs
      LEFT JOIN ShapeGroup sg ON scs.childShapeId = sg.csId
      LEFT JOIN RigidBodyBounds_rowid rb ON sg.id = rb.nodeno
      LEFT JOIN RigidBody r ON rb.nodeno = r.id
      WHERE rb.nodeno IS NULL AND r.id IS NULL;
    `).all(); // this thing selects objects that have no connections and are of the same type

    notJointed.forEach(x => {
        const uuid = readUUID(x.data, 26); // reverse engineering | UUID index
        let pos = { x: x.data[46], y: x.data[44], z: x.data[42] }; // reverse engineering | position indexes :I

        let total = pos.x * pos.y * pos.z; // size of the object

        if (uuid) {
            let name = mappings[uuid];
            if (name && name.startsWith("blk_") && total <= 3) { // each block has a prefix _blk in mappings
                db.prepare(`DELETE FROM ChildShape WHERE id = ?`).run(x.childShapeId);
                index++;
            }
        }
    });

    return index;
}
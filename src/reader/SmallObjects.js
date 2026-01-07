import { readUUID } from "../util/ReadUUID.js";
import mappings from "../mappings.json" with { type: "json" }; // remapped from sm survival_items.lua

export default function readSmallObjects(db) {
    let index = 0;
    // Get all the objects from the save
    const rigidBodies = db.prepare(`SELECT id FROM RigidBody`).all();

    rigidBodies.forEach(body => {
        // Get all the shapes from the body AND GET INFO ABOUT JOINT
        const shapes = db.prepare(`
            SELECT cs.id, cs.data, j.id AS jointId
            FROM ChildShape cs
            LEFT JOIN Joint j ON j.childShapeIdA = cs.id OR j.childShapeIdB = cs.id
            WHERE cs.bodyId = ?;
        `).all(body.id);

        const rigidBody = { elements: {}, id: body.id, stop: false }; // elements: name -> { count, shapes }
        shapes.forEach(shape => {
            if (shape.jointId) return rigidBody.stop = true;
            const uuid = readUUID(shape.data, 26); // get UUID
            let pos = { x: shape.data[46], y: shape.data[44], z: shape.data[42] }; // get pos values
            let total = pos.x * pos.y * pos.z; // size of the object

            if (uuid) {
                let name = mappings[uuid];
                if (name && name.startsWith("blk_")) { // ! each block has a prefix _blk in mappings
                    if (!rigidBody.elements[name]) rigidBody.elements[name] = { count: 0, shapes: [] } // def default value
                    rigidBody.elements[name].shapes.push(shape.id) // insert a shape into the mapped object
                    rigidBody.elements[name].count += total; // update object size
                } else rigidBody.stop = true; // leave object if it contains non-blocks
            }
        })

        if (rigidBody.stop) return; // skip object
        const sum = Object.values(rigidBody.elements).reduce((sum, el) => sum + el.count, 0);
        if (sum <= 3 && sum !== 0) {
            // delete shape group if exists
            Object.values(rigidBody.elements).forEach(shapeGroup => {
                shapeGroup.shapes.forEach(shapeId => {
                    db.prepare(`DELETE FROM ShapeGroup WHERE csId = ?`).run(shapeId);
                });
            });
            db.prepare(`DELETE FROM ChildShape WHERE bodyId = ?`).run(rigidBody.id); // delete shape
            db.prepare(`DELETE FROM RigidBody WHERE id = ?`).run(rigidBody.id); // delete object

            index++;
        }
    });
    return index;
}
import Database from 'better-sqlite3';

export var db;

export function initDB(path) {
    try {
        db = new Database(path);
        // db.prepare("SELECT COUNT(*) FROM Game").exec()
        return { db, status: "OK" };
    } catch (err) {
        return { error: Object.values(err)[0], status: "ERROR" };
    }
}
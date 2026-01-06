export default function readGameVersion(db) {
    return db
        .prepare(`SELECT savegameversion FROM Game`)
        .get()
    ['savegameversion']
}
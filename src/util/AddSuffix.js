import path from "node:path";

export default function addSuffix(filePath, suffix) {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);

    return path.join(dir, `${name}${suffix}${ext}`);
}
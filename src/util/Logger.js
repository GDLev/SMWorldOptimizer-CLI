export default class Logger {
    constructor(options) {
        this.options = options || {};
    }

    log(message, raw) {
        if (this.options.outputType === "PLAIN") console.log(message);
    }

    exit(message, code, raw) {
        if (this.options.outputType === "PLAIN") console.log(message);
        else if (this.options.outputType === "JSON") console.log(JSON.stringify({ message, code, info: raw }));
        else if (this.options.outputType === "INT") console.log(raw?.count ?? -1);

        process.exit(1)
    }
}
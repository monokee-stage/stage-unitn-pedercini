"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noopLogger = void 0;
function noop() { }
exports.noopLogger = {
    fatal: noop,
    error: noop,
    warn: noop,
    debug: noop,
    info: noop,
    trace: noop,
};
//# sourceMappingURL=noopLogger.js.map
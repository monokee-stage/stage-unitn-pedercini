"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogRotatingFilesystem = void 0;
const winston = __importStar(require("winston"));
require("winston-daily-rotate-file");
function createLogRotatingFilesystem(options) {
    const logger = winston.createLogger({
        format: winston.format.combine(winston.format.errors({ stack: true }), winston.format.metadata(), winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston.format.json()),
        transports: [
            new winston.transports.DailyRotateFile(Object.assign({ dirname: "logs", filename: "log-%DATE%.log", datePattern: "YYYY-MM-DD-HH", zippedArchive: true, maxSize: "20m" }, options)),
        ],
    });
    return {
        fatal: logger.error.bind(logger),
        error: logger.error.bind(logger),
        warn: logger.warn.bind(logger),
        debug: logger.debug.bind(logger),
        info: logger.info.bind(logger),
        trace: logger.debug.bind(logger),
    };
}
exports.createLogRotatingFilesystem = createLogRotatingFilesystem;
//# sourceMappingURL=logRotatingFilesystem.js.map
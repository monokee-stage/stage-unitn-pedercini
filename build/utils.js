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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ajv = exports.readJSON = exports.fileExists = exports.isUndefined = exports.isString = exports.isValidURL = exports.generateJWKS = exports.inferAlgForJWK = exports.getPrivateJWKforProvider = exports.generateRandomString = exports.makeJti = exports.makeExp = exports.makeIat = exports.verifyJWS = exports.createJWS = void 0;
const crypto_1 = __importDefault(require("crypto"));
const fs = __importStar(require("fs"));
const jose = __importStar(require("jose"));
const uuid = __importStar(require("uuid"));
const ajv_1 = __importDefault(require("ajv"));
function createJWS(payload, jwk, typ) {
    return __awaiter(this, void 0, void 0, function* () {
        const privateKey = yield jose.importJWK(jwk, inferAlgForJWK(jwk));
        const jws = yield new jose.CompactSign(new TextEncoder().encode(JSON.stringify(payload)))
            .setProtectedHeader({ alg: "RS256", kid: jwk.kid, typ: typ })
            .sign(privateKey);
        return jws;
    });
}
exports.createJWS = createJWS;
function verifyJWS(jws, public_jwks) {
    return __awaiter(this, void 0, void 0, function* () {
        const { payload } = yield jose.compactVerify(jws, (header) => __awaiter(this, void 0, void 0, function* () {
            if (!header.kid)
                throw new Error("missing kid in header");
            const jwk = public_jwks.keys.find((key) => key.kid === header.kid);
            if (!jwk)
                throw new Error("no matching key with kid found");
            return yield jose.importJWK(jwk, inferAlgForJWK(jwk));
        }));
        return JSON.parse(new TextDecoder().decode(payload));
    });
}
exports.verifyJWS = verifyJWS;
// now timestamp in seconds
function makeIat() {
    return Math.floor(Date.now() / 1000);
}
exports.makeIat = makeIat;
// now + delta timestamp in seconds
function makeExp(deltaSeconds = 33 * 60) {
    return Math.floor(makeIat() + deltaSeconds);
}
exports.makeExp = makeExp;
function makeJti() {
    return uuid.v4();
}
exports.makeJti = makeJti;
function generateRandomString(length) {
    return crypto_1.default.randomBytes(length).toString("hex");
}
exports.generateRandomString = generateRandomString;
// SHOULDDO implement
// Return the RP private key (Core) to use to sign protocol requests
function getPrivateJWKforProvider(configuration) {
    return configuration.private_jwks.keys[0];
}
exports.getPrivateJWKforProvider = getPrivateJWKforProvider;
function inferAlgForJWK(jwk) {
    if (jwk.kty === "RSA")
        return "RS256";
    if (jwk.kty === "EC")
        return "ES256";
    // SHOULDDO support more types
    throw new Error("unsupported key type");
}
exports.inferAlgForJWK = inferAlgForJWK;
function generateJWKS() {
    return __awaiter(this, void 0, void 0, function* () {
        const { publicKey, privateKey } = yield jose.generateKeyPair("RS256");
        const publicJWK = yield jose.exportJWK(publicKey);
        const kid = yield jose.calculateJwkThumbprint(publicJWK);
        publicJWK.kid = kid;
        const privateJWK = yield jose.exportJWK(privateKey);
        privateJWK.kid = kid;
        return {
            public_jwks: { keys: [publicJWK] },
            private_jwks: { keys: [privateJWK] },
        };
    });
}
exports.generateJWKS = generateJWKS;
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    }
    catch (error) {
        return false;
    }
}
exports.isValidURL = isValidURL;
function isString(value) {
    return typeof value === "string";
}
exports.isString = isString;
function isUndefined(value) {
    return value === undefined;
}
exports.isUndefined = isUndefined;
function fileExists(path) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs.promises.stat(path);
            return true;
        }
        catch (error) {
            return false;
        }
    });
}
exports.fileExists = fileExists;
function readJSON(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return JSON.parse(yield fs.promises.readFile(path, "utf8"));
    });
}
exports.readJSON = readJSON;
/*
export const undiciHttpClient: HttpClient = async ({ url, ...params }) => {
  const response = await undici.request(url, params);
  return {
    status: response.statusCode,
    headers: response.headers as Record<string, string>,
    body: await response.body.text(),
  };
};
*/
exports.ajv = new ajv_1.default();
//# sourceMappingURL=utils.js.map
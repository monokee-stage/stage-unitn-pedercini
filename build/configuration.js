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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfiguration = exports.createConfigurationFromConfigurationFacade = exports.AcrValue = void 0;
const jose = __importStar(require("jose"));
const utils_1 = require("./utils");
const lodash_1 = require("lodash");
const consoleLogger_1 = require("./default-implementations/consoleLogger");
/** level of authentication */
exports.AcrValue = {
    l1: "https://www.spid.gov.it/SpidL1",
    l2: "https://www.spid.gov.it/SpidL2",
    l3: "https://www.spid.gov.it/SpidL3",
};
function defaultAuditLogger(message) {
    console.error("Missing audit logger.", message);
}
/**
 * This is a configuration facade to minimize setup effort.
 * @see {@link Configuration} fields for further customization
 */
function createConfigurationFromConfigurationFacade(_a) {
    var { client_id, client_name, trust_anchors, identity_providers, public_jwks, public_jwks_path, private_jwks, private_jwks_path, trust_marks, trust_marks_path, logger = consoleLogger_1.consoleLogger, auditLogger = defaultAuditLogger, federation_public_jwks, federation_public_jwks_path, federation_private_jwks, federation_private_jwks_path, homepage_uri, policy_uri, logo_uri, federation_resolve_endpoint } = _a, rest = __rest(_a, ["client_id", "client_name", "trust_anchors", "identity_providers", "public_jwks", "public_jwks_path", "private_jwks", "private_jwks_path", "trust_marks", "trust_marks_path", "logger", "auditLogger", "federation_public_jwks", "federation_public_jwks_path", "federation_private_jwks", "federation_private_jwks_path", "homepage_uri", "policy_uri", "logo_uri", "federation_resolve_endpoint"]);
    return __awaiter(this, void 0, void 0, function* () {
        if (public_jwks != null && public_jwks_path != null) {
            throw new Error(`Cannot use both 'public_jwks' and 'public_jwks_path' in the configuration`);
        }
        else if (public_jwks_path != null) {
            public_jwks = yield (0, utils_1.readJSON)(public_jwks_path);
        }
        if (public_jwks == null) {
            throw new Error(`You need to pass a 'public_jwk' or 'public_jwks_path' configuration`);
        }
        if (private_jwks != null && private_jwks_path != null) {
            throw new Error(`Cannot use both 'private_jwks' and 'private_jwks_path' in the configuration`);
        }
        else if (private_jwks_path != null) {
            private_jwks = yield (0, utils_1.readJSON)(private_jwks_path);
        }
        if (private_jwks == null) {
            throw new Error(`You need to pass a 'private_jwk' or 'private_jwks_path' configuration`);
        }
        if ((public_jwks != null) !== (private_jwks != null)) {
            throw new Error(`You need to pass 'public_jwks' and 'private_jwks' together.`);
        }
        if (federation_public_jwks != null && federation_public_jwks_path != null) {
            throw new Error(`Cannot use both 'federation_public_jwks' and 'federation_public_jwks_path' in the configuration`);
        }
        else if (federation_public_jwks_path != null) {
            federation_public_jwks = yield (0, utils_1.readJSON)(federation_public_jwks_path);
        }
        if (federation_public_jwks == null) {
            throw new Error(`You need to pass a 'federation_public_jwk' or 'federation_public_jwks_path' configuration`);
        }
        if (federation_private_jwks != null && federation_private_jwks_path != null) {
            throw new Error(`Cannot use both 'federation_private_jwks' and 'federation_public_jwks_path' in the configuration`);
        }
        else if (federation_private_jwks_path != null) {
            federation_private_jwks = yield (0, utils_1.readJSON)(federation_private_jwks_path);
        }
        if (federation_private_jwks == null) {
            throw new Error(`You need to pass a 'federation_private_jwk' or 'federation_private_jwks_path' configuration`);
        }
        if (trust_marks != null && trust_marks_path != null) {
            throw new Error(`Cannot use both 'trust_marks' and 'trust_marks_path' in the configuration`);
        }
        else if (trust_marks_path != null) {
            try {
                trust_marks = yield (0, utils_1.readJSON)(trust_marks_path);
            }
            catch (error) {
                if (error.code === "ENOENT") {
                    trust_marks = [];
                }
                else {
                    throw new Error(`Could not load trust_marks from ${trust_marks_path}: ${error}`);
                }
            }
        }
        else if (trust_marks == null) {
            trust_marks = [];
        }
        return Object.assign({ client_id,
            client_name,
            trust_anchors,
            identity_providers, application_type: "web", response_types: ["code"], scope: ["openid", "offline_access"], providers: {
                spid: {
                    acr_values: exports.AcrValue.l2,
                    requestedClaims: {
                        id_token: {},
                        userinfo: {
                            "https://attributes.spid.gov.it/name": null,
                            "https://attributes.spid.gov.it/familyName": null,
                            "https://attributes.spid.gov.it/email": null,
                            "https://attributes.spid.gov.it/fiscalNumber": null,
                        },
                    },
                },
                cie: {
                    acr_values: exports.AcrValue.l2,
                    requestedClaims: {
                        id_token: {
                            family_name: { essential: true },
                            email: { essential: true },
                        },
                        userinfo: {
                            given_name: null,
                            family_name: null,
                            email: null,
                        },
                    },
                },
            }, federation_default_exp: 48 * 60 * 60, public_jwks,
            private_jwks,
            trust_marks, redirect_uris: [client_id + "callback"], logger,
            auditLogger,
            federation_public_jwks,
            federation_private_jwks,
            homepage_uri,
            policy_uri,
            logo_uri,
            federation_resolve_endpoint }, rest);
    });
}
exports.createConfigurationFromConfigurationFacade = createConfigurationFromConfigurationFacade;
function validateConfiguration(configuration) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(0, utils_1.isValidURL)(configuration.client_id)) {
            throw new Error(`configuration: client_id must be a valid url ${configuration.client_id}`);
        }
        if (configuration.application_type !== "web") {
            throw new Error(`configuration: application_type must be "web"`);
        }
        if (!(0, lodash_1.isEqual)(configuration.response_types, ["code"])) {
            throw new Error(`configuration: response_types must be ["code"]`);
        }
        const supportedScope = ["openid", "offline_access"];
        const scopeDiff = (0, lodash_1.difference)(configuration.scope, supportedScope);
        if (scopeDiff.length > 0) {
            throw new Error(`configuration: scope must be subset of ${JSON.stringify(supportedScope)}`);
        }
        if ((0, lodash_1.uniq)(configuration.scope).length !== configuration.scope.length) {
            throw new Error(`configuration: scope must not contain duplicates ${JSON.stringify(configuration.scope)}`);
        }
        if (configuration.federation_default_exp <= 0) {
            throw new Error(`configuration: federation_default_exp must be > 0`);
        }
        const invalidTrustAnchors = configuration.trust_anchors.filter((url) => !(0, utils_1.isValidURL)(url));
        if (invalidTrustAnchors.length > 0) {
            throw new Error(`configuration: trust_anchors must be a list of valid urls ${JSON.stringify(invalidTrustAnchors)}`);
        }
        for (const providerType of ["cie", "spid"]) {
            const invalidProviders = configuration.identity_providers[providerType].filter((url) => !(0, utils_1.isValidURL)(url) && url.endsWith("/"));
            if (invalidProviders.length > 0) {
                throw new Error(`configuration: identity_providers must be a list of valid urls ${JSON.stringify(invalidProviders)}`);
            }
        }
        if (configuration.redirect_uris.length < 1) {
            throw new Error(`configuration: redirect_uris must be at least one`);
        }
        const invalidRedirectUris = configuration.redirect_uris.filter((url) => !(0, utils_1.isValidURL)(url));
        if (invalidRedirectUris.length > 0) {
            throw new Error(`configuration: redirect_uris must be a list of valid urls ${JSON.stringify(invalidRedirectUris)}`);
        }
        if (configuration.public_jwks.keys.length < 1) {
            throw new Error(`configuration: public_jwks must be at least one`);
        }
        if (configuration.private_jwks.keys.length !== configuration.public_jwks.keys.length) {
            throw new Error(`configuration: public_jwks and private_jwks must have the same length`);
        }
        if (configuration.federation_private_jwks.keys.length !== configuration.federation_public_jwks.keys.length) {
            throw new Error(`configuration: public_jwks and private_jwks must have the same length`);
        }
        for (const public_jwk of configuration.public_jwks.keys) {
            try {
                yield jose.importJWK(public_jwk, (0, utils_1.inferAlgForJWK)(public_jwk));
            }
            catch (error) {
                throw new Error(`configuration: public_jwks must be a list of valid jwks ${JSON.stringify(public_jwk)}`);
            }
        }
        for (const private_jwk of configuration.private_jwks.keys) {
            try {
                yield jose.importJWK(private_jwk, (0, utils_1.inferAlgForJWK)(private_jwk));
            }
            catch (error) {
                throw new Error(`configuration: private_jwks must be a list of valid jwks ${JSON.stringify(private_jwk)}`);
            }
        }
        for (const federation_public_jwk of configuration.federation_public_jwks.keys) {
            try {
                yield jose.importJWK(federation_public_jwk, (0, utils_1.inferAlgForJWK)(federation_public_jwk));
            }
            catch (error) {
                throw new Error(`configuration: federation_public_jwks must be a list of valid jwks ${JSON.stringify(federation_public_jwk)}`);
            }
        }
        for (const federation_private_jwk of configuration.federation_private_jwks.keys) {
            try {
                yield jose.importJWK(federation_private_jwk, (0, utils_1.inferAlgForJWK)(federation_private_jwk));
            }
            catch (error) {
                throw new Error(`configuration: federation_private_jwks must be a list of valid jwks ${JSON.stringify(federation_private_jwk)}`);
            }
        }
        for (const public_jwk of configuration.public_jwks.keys) {
            if (!public_jwk.kid) {
                throw new Error(`configuration: public_jwks must have a kid ${JSON.stringify(public_jwk)}`);
            }
            if (!configuration.private_jwks.keys.some((private_jwk) => private_jwk.kid === public_jwk.kid)) {
                throw new Error(`configuration: public_jwks and private_jwks must have mtching kid ${JSON.stringify(public_jwk)}`);
            }
        }
        for (const federation_public_jwk of configuration.federation_public_jwks.keys) {
            if (!federation_public_jwk.kid) {
                throw new Error(`configuration: federation_public_jwks must have a kid ${JSON.stringify(federation_public_jwk)}`);
            }
            if (!configuration.federation_private_jwks.keys.some((federation_private_jwk) => federation_private_jwk.kid === federation_public_jwk.kid)) {
                throw new Error(`configuration: federation_public_jwks and federation_private_jwks must have mtching kid ${JSON.stringify(federation_public_jwk)}`);
            }
        }
        if (typeof configuration.logger !== "object") {
            throw new Error(`configuration: logger must be an object conforming to the Abstract Logging interface`);
        }
        if (typeof configuration.auditLogger !== "function") {
            throw new Error(`configuration: auditLogger must be a function`);
        }
    });
}
exports.validateConfiguration = validateConfiguration;
//# sourceMappingURL=configuration.js.map
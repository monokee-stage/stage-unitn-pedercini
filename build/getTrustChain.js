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
exports.getTrustChain = exports.verifyEntityConfiguration = exports.applyMetadataPolicy = exports.getEntityConfiguration = exports.getEntityStatement = void 0;
const jose = __importStar(require("jose"));
const utils_1 = require("./utils");
const lodash_1 = require("lodash");
const axios_1 = __importDefault(require("axios"));
// SHOULDDO implement arbitray length tst chain validation
// SHOULDDO check authority hints
// Mancano questi controlli (https://openid.net/specs/openid-connect-federation-1_0.html#name-validating-a-trust-chain)
function getAndVerifyTrustChain(configuration, // EC del RP
relying_party, // client_id del RP
identity_provider, // ID del OP
trust_anchor // ID del TA
) {
    return __awaiter(this, void 0, void 0, function* () {
        //  get the Entity Configuration of the RP and validate it
        const relying_party_entity_configuration = yield getEntityConfiguration(configuration, relying_party, validateRelyingPartyEntityConfiguration);
        //  get the Entity Configuration of the Identity Provider and validate
        const identity_provider_entity_configuration = yield getEntityConfiguration(configuration, identity_provider, validateIdentityProviderEntityConfiguration);
        //  get the Entity Configuration of the Trust Anchor and validate
        const trust_anchor_entity_configuration = yield getEntityConfiguration(configuration, trust_anchor, validateTrustAnchorEntityConfiguration);
        //  get the Entity Statement of the TA about the RP
        const relying_party_entity_statement = yield getEntityStatement(configuration, relying_party_entity_configuration, trust_anchor_entity_configuration);
        // get the Entity Statement of the TA about the OP
        const identity_provider_entity_statement = yield getEntityStatement(configuration, identity_provider_entity_configuration, trust_anchor_entity_configuration);
        //  Calculate the minimum expiration time of the statement objects
        const exp = Math.min(relying_party_entity_statement.exp, identity_provider_entity_statement.exp);
        const metadata = applyMetadataPolicy(identity_provider_entity_configuration.metadata, identity_provider_entity_statement.metadata_policy);
        const entity_configuration = Object.assign(Object.assign({}, identity_provider_entity_configuration), { metadata });
        configuration.logger.info({
            message: "Trust chain verified",
            relying_party,
            identity_provider,
            trust_anchor,
            relying_party_entity_configuration,
            identity_provider_entity_configuration,
            relying_party_entity_statement,
            identity_provider_entity_statement,
            exp,
            metadata,
        });
        return { exp, entity_configuration };
    });
}
function getEntityStatement(configuration, descendant, superior) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let url = superior.metadata.federation_entity.federation_fetch_endpoint;
            //const response = await axios.get(url);
            /*
            if (descendant.sub.slice(-1) == "/"){     ------    SLICING if last character is /
              var sub = descendant.sub.slice(0, -1);
            } else {
              var sub = descendant.sub;
            }*/
            const response = yield axios_1.default.get(url, { params: { sub: descendant.sub } });
            if (response.status !== 200) {
                throw new Error(`Expected status 200 but got ${response.status}`);
            }
            if (!((_a = response.headers["content-type"]) === null || _a === void 0 ? void 0 : _a.startsWith("application/entity-statement+jwt"))) {
                throw new Error(`Expected content-type application/entity-statement+jwt but got ${response.headers["content-type"]}`);
            }
            const jws = yield response.data;
            return yield (0, utils_1.verifyJWS)(jws, superior.jwks);
        }
        catch (error) {
            throw new Error(`Failed to get entity statement for ${descendant.sub} from ${superior.metadata.federation_entity.federation_fetch_endpoint} because of ${error}`);
        }
    });
}
exports.getEntityStatement = getEntityStatement;
function getEntityConfiguration(configuration, url, validateFunction) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // SHOULDDO when doing post request ensure timeout and ssl is respected
            const response = yield axios_1.default.get(url + ".well-known/openid-federation");
            const jws = yield response.data;
            if (response.status !== 200) {
                throw new Error(`Expected status 200 but got ${response.status}`);
            }
            if (!((_a = response.headers["content-type"]) === null || _a === void 0 ? void 0 : _a.startsWith("application/entity-statement+jwt"))) {
                throw new Error(`Expected content-type application/entity-statement+jwt but got ${response.headers["content-type"]}`);
            }
            const entity_configuration = yield verifyEntityConfiguration(jws);
            const valid = validateFunction(entity_configuration);
            if (!valid) {
                console.log(validateFunction.errors);
            }
            if (!validateFunction(entity_configuration)) {
                throw new Error(`Malformed entity configuration`);
            }
            return entity_configuration;
        }
        catch (error) {
            throw new Error(`Failed to get entity configuration for ${url} because of ${error}`);
        }
    });
}
exports.getEntityConfiguration = getEntityConfiguration;
function applyMetadataPolicy(metadata, policy) {
    var _a;
    metadata = (0, lodash_1.cloneDeep)(metadata);
    for (const [parentField, parentPolicy] of Object.entries(policy)) {
        if (!(parentField in metadata))
            continue;
        for (const [childField, childPolicy] of Object.entries(parentPolicy)) {
            if (childPolicy.add) {
                metadata[parentField][childField] = [...((_a = metadata[parentField][childField]) !== null && _a !== void 0 ? _a : []), childPolicy.add];
            }
            if (childPolicy.value) {
                metadata[parentField][childField] = childPolicy.value;
            }
            if (childPolicy.default) {
                if (!(childField in metadata[parentField])) {
                    metadata[parentField][childField] = childPolicy.default;
                }
            }
            if (childPolicy.subset_of) {
                if ((0, lodash_1.difference)(metadata[parentField][childField], childPolicy.subset_of).length > 0) {
                    delete metadata[parentField][childField];
                }
            }
            if (childPolicy.superset_of) {
                if ((0, lodash_1.difference)(metadata[parentField][childField], childPolicy.superset_of).length === 0) {
                    delete metadata[parentField][childField];
                }
            }
            if (childPolicy.one_of) {
                if (!childPolicy.one_of.includes(metadata[parentField][childField])) {
                    delete metadata[parentField][childField];
                }
            }
        }
    }
    return metadata;
}
exports.applyMetadataPolicy = applyMetadataPolicy;
function verifyEntityConfiguration(jws) {
    return __awaiter(this, void 0, void 0, function* () {
        const decoded = jose.decodeJwt(jws);
        return yield (0, utils_1.verifyJWS)(jws, decoded.jwks);
    });
}
exports.verifyEntityConfiguration = verifyEntityConfiguration;
//    trustChainCache - local Map between a string (cacheKey and a trustChain)
const trustChainCache = new Map();
//    CachedTrustChain - return an already existing Trust Chain stored in trustChainCache from the RP to an OP with a specific TA
function CachedTrustChain(configuration, // RP configuration
relying_party, // client_id
identity_provider, // ID identity provider
trust_anchor // ID trust anchor
) {
    return __awaiter(this, void 0, void 0, function* () {
        const cacheKey = `${relying_party}-${identity_provider}-${trust_anchor}`;
        const cached = trustChainCache.get(cacheKey);
        const now = (0, utils_1.makeIat)();
        if (cached && cached.exp > now) { //  IF i found an existing TC and is valid
            return cached;
        }
        else { //  ELSE I build it and add to trustChainCache
            const trust_chain = yield getAndVerifyTrustChain(configuration, relying_party, identity_provider, trust_anchor);
            trustChainCache.set(cacheKey, trust_chain);
            return trust_chain;
        }
    });
}
//    Return the Trust Chains (if exist) from the RP configuration to a Provider
function getTrustChain(configuration, provider) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const identityProviderTrustChain = (_a = (yield Promise.all(configuration.trust_anchors.map((trust_anchor) => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield CachedTrustChain(configuration, configuration.client_id, provider, trust_anchor);
            }
            catch (error) {
                configuration.logger.warn(error);
                return null;
            }
        })))).find((trust_chain) => trust_chain !== null)) !== null && _a !== void 0 ? _a : null;
        return identityProviderTrustChain;
    });
}
exports.getTrustChain = getTrustChain;
const jwksSchema = {
    type: "object",
    properties: {
        keys: {
            type: "array",
            items: {
                type: "object",
            },
        },
    },
    required: ["keys"],
};
const trustMarksSchema = {
    type: "array",
    items: {
        type: "object",
        properties: {
            id: { type: "string" },
            trust_mark: { type: "string" },
        },
        required: ["id", "trust_mark"],
    },
};
const relyingPartyEntityConfigurationSchema = {
    type: "object",
    properties: {
        iss: { type: "string" },
        sub: { type: "string" },
        iat: { type: "number" },
        exp: { type: "number" },
        jwks: jwksSchema,
        trust_marks: { type: "array" },
        authority_hints: { type: "array", items: { type: "string" } },
        metadata: {
            type: "object",
            properties: {
                openid_relying_party: {
                    type: "object",
                    properties: {
                        client_name: { type: "string" },
                        client_id: { type: "string" },
                        application_type: { type: "string" },
                        contacts: { type: "array", items: { type: "string" }, nullable: true },
                        subject_type: { type: "string" },
                        jwks: jwksSchema,
                        grant_types: { type: "array", items: { type: "string" } },
                        response_types: { type: "array", items: { type: "string" } },
                        redirect_uris: { type: "array", items: { type: "string" } },
                        client_registration_types: { type: "array", items: { type: "string" } },
                    },
                    required: [
                        "client_name",
                        "client_id",
                        "application_type",
                        "subject_type",
                        "jwks",
                        "grant_types",
                        "response_types",
                        "redirect_uris",
                        "client_registration_types",
                    ],
                },
                federation_entity: {
                    type: "object",
                    properties: {
                        organization_name: { type: "string" },
                        homepage_uri: { type: "string" },
                        policy_uri: { type: "string" },
                        logo_uri: { type: "string" },
                        contacts: { type: "array", items: { type: "string" }, nullable: true },
                        federation_resolve_endpoint: { type: "string" },
                    },
                    required: [
                        "organization_name",
                        "homepage_uri",
                        "policy_uri",
                        "logo_uri",
                        //"contacts",
                        "federation_resolve_endpoint",
                    ],
                },
            },
            required: ["openid_relying_party", "federation_entity"],
        },
    },
    required: ["iss", "sub", "iat", "exp", "jwks", "authority_hints", "metadata"],
};
const validateRelyingPartyEntityConfiguration = utils_1.ajv.compile(relyingPartyEntityConfigurationSchema);
const IdentityProviderEntityConfigurationSchema = {
    type: "object",
    properties: {
        iss: { type: "string" },
        sub: { type: "string" },
        iat: { type: "number" },
        exp: { type: "number" },
        jwks: jwksSchema,
        trust_marks: { type: "array" },
        authority_hints: { type: "array", items: { type: "string" } },
        metadata: {
            type: "object",
            properties: {
                openid_provider: {
                    type: "object",
                },
            },
            required: ["openid_provider"],
        },
    },
    required: ["iss", "sub", "iat", "exp", "jwks", "authority_hints", "metadata"],
};
const validateIdentityProviderEntityConfiguration = utils_1.ajv.compile(IdentityProviderEntityConfigurationSchema);
const trustAnchorEntityConfigurationSchema = {
    type: "object",
    properties: {
        iss: { type: "string" },
        sub: { type: "string" },
        iat: { type: "number" },
        exp: { type: "number" },
        jwks: jwksSchema,
        metadata: {
            type: "object",
            properties: {
                federation_entity: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        homepage_uri: { type: "string" },
                        contacts: { type: "array", items: { type: "string" } },
                        federation_fetch_endpoint: { type: "string" },
                        federation_list_endpoint: { type: "string" },
                        federation_resolve_endpoint: { type: "string" },
                        federation_trust_mark_status_endpoint: { type: "string" },
                    },
                    required: [
                        "name",
                        "homepage_uri",
                        "federation_fetch_endpoint",
                        "federation_list_endpoint",
                        "federation_resolve_endpoint",
                        "federation_trust_mark_status_endpoint",
                    ],
                },
            },
            required: ["federation_entity"],
        },
        trust_marks_issuers: {
            type: "object",
            additionalProperties: {
                type: "array",
                items: { type: "string" },
            },
            required: [],
        },
        constraints: {
            type: "object",
            properties: {
                max_path_length: { type: "number" },
            },
            required: ["max_path_length"],
        },
    },
    required: ["constraints", "exp", "iat", "iss", "jwks", "metadata", "sub", "trust_marks_issuers"],
};
const validateTrustAnchorEntityConfiguration = utils_1.ajv.compile(trustAnchorEntityConfigurationSchema);
//# sourceMappingURL=getTrustChain.js.map
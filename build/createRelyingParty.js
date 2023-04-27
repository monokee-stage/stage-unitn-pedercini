"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRelyingParty = void 0;
const requestAccessToken_1 = require("./requestAccessToken");
const createAuthenticationRequest_1 = require("./createAuthenticationRequest");
const configuration_1 = require("./configuration");
const createEntityConfiguration_1 = require("./createEntityConfiguration");
const revokeAccessToken_1 = require("./revokeAccessToken");
const getTrustChain_1 = require("./getTrustChain");
const requestUserInfo_1 = require("./requestUserInfo");
const utils_1 = require("./utils");
function createRelyingParty(configurationFacade) {
    let _configuration = null;
    function setupConfiguration() {
        return __awaiter(this, void 0, void 0, function* () {
            if (_configuration == null) {
                _configuration = yield (0, configuration_1.createConfigurationFromConfigurationFacade)(configurationFacade);
                yield (0, configuration_1.validateConfiguration)(_configuration);
            }
            return _configuration;
        });
    }
    return {
        /**
         * Runs the validation of the configuration.
         */
        validateConfiguration() {
            return __awaiter(this, void 0, void 0, function* () {
                yield setupConfiguration();
            });
        },
        getConfiguration() {
            return __awaiter(this, void 0, void 0, function* () {
                return yield setupConfiguration();
            });
        },
        retrieveAvailableProviders() {
            return __awaiter(this, void 0, void 0, function* () {
                const configuration = yield setupConfiguration();
                try {
                    // getProviderInfo - Async function that returns a JSON Object of some EC information of the providers with which the RP has a valid Trust Chain
                    // It is then called in 'return Object.fromEntries to associate providers with their information
                    // Attualmente non restituisce niente perchè non ho le Trust Chain con i providers
                    const getProviderInfo = (provider) => __awaiter(this, void 0, void 0, function* () {
                        var _a, _b, _c, _d;
                        const trustChain = yield (0, getTrustChain_1.getTrustChain)(configuration, provider);
                        if (!trustChain)
                            return null;
                        return {
                            sub: trustChain.entity_configuration.sub,
                            organization_name: (_b = (_a = trustChain.entity_configuration.metadata) === null || _a === void 0 ? void 0 : _a.openid_provider) === null || _b === void 0 ? void 0 : _b.organization_name,
                            logo_uri: (_d = (_c = trustChain.entity_configuration.metadata) === null || _c === void 0 ? void 0 : _c.openid_provider) === null || _d === void 0 ? void 0 : _d.logo_uri,
                        };
                    });
                    return Object.fromEntries(yield Promise.all(Object.entries(configuration.identity_providers).map(([providerProfile, providers]) => __awaiter(this, void 0, void 0, function* () {
                        return [providerProfile, (yield Promise.all(providers.map(getProviderInfo))).filter(Boolean)];
                    }))));
                }
                catch (error) {
                    configuration.logger.error(error);
                    throw error;
                }
            });
        },
        createEntityConfigurationResponse() {
            return __awaiter(this, void 0, void 0, function* () {
                const configuration = yield setupConfiguration();
                try {
                    const jws = yield (0, createEntityConfiguration_1.createEntityConfiguration)(configuration);
                    const response = {
                        status: 200,
                        headers: { "Content-Type": "application/entity-statement+jwt" },
                        body: jws,
                    };
                    return response;
                }
                catch (error) {
                    configuration.logger.error(error);
                    throw error;
                }
            });
        },
        createAuthorizationRedirectURL(provider) {
            return __awaiter(this, void 0, void 0, function* () {
                const configuration = yield setupConfiguration(); // retrieve the RP (my) configuration
                try {
                    if (!(0, utils_1.isString)(provider)) {
                        throw new Error("provider is mandatory parameter");
                    }
                    return yield (0, createAuthenticationRequest_1.createAuthenticationRequest)(configuration, provider);
                }
                catch (error) {
                    configuration.logger.error(error);
                    throw error;
                }
            });
        },
        manageCallback(query) {
            return __awaiter(this, void 0, void 0, function* () {
                const configuration = yield setupConfiguration();
                configuration.logger.info({ message: "Callback function called", query });
                try {
                    if ("error" in query) {
                        if (!(0, utils_1.isString)(query.error)) {
                            throw new Error("error is mandatory string parameter");
                        }
                        if (!((0, utils_1.isString)(query.error_description) || (0, utils_1.isUndefined)(query.error_description))) {
                            throw new Error("error_description is optional string parameter");
                        }
                        configuration.logger.info({ message: "Callback function called with error", query });
                        return Object.assign({ type: "authentication-error" }, query);
                    }
                    else if ("code" in query) {
                        if (!(0, utils_1.isString)(query.code)) {
                            throw new Error("code is mandatory string parameter");
                        }
                        if (!(0, utils_1.isString)(query.state)) {
                            throw new Error("state is mandatory string parameter");
                        }
                        const authentication_request = yield configuration.storage.read(query.state);
                        if (!authentication_request) {
                            configuration.logger.warn({
                                message: "Callback function called with code but corresponding authentication with not found",
                                query,
                            });
                            throw new Error(`authentication request not found for state ${query.state}`);
                        }
                        const { id_token, access_token, refresh_token } = yield (0, requestAccessToken_1.requestAccessToken)(configuration, authentication_request, query.code);
                        const user_info = yield (0, requestUserInfo_1.requestUserInfo)(configuration, authentication_request, access_token);
                        const tokens = {
                            id_token,
                            access_token,
                            refresh_token,
                            revocation_endpoint: authentication_request.revocation_endpoint,
                        };
                        return { type: "authentication-success", user_info, tokens };
                    }
                    else {
                        throw new Error(`callback type not supported ${JSON.stringify(query)}`);
                    }
                }
                catch (error) {
                    configuration.logger.error(error);
                    throw error;
                }
            });
        },
        revokeTokens(tokens) {
            return __awaiter(this, void 0, void 0, function* () {
                const configuration = yield setupConfiguration();
                try {
                    return yield (0, revokeAccessToken_1.revokeAccessToken)(configuration, tokens);
                }
                catch (error) {
                    configuration.logger.error(error);
                    throw error;
                }
            });
        },
    };
}
exports.createRelyingParty = createRelyingParty;
//# sourceMappingURL=createRelyingParty.js.map
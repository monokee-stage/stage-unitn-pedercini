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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthenticationRequest = void 0;
const crypto_1 = __importDefault(require("crypto"));
const utils_1 = require("./utils");
const getTrustChain_1 = require("./getTrustChain");
function createAuthenticationRequest(configuration, provider) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!(0, utils_1.isValidURL)(provider)) {
            throw new Error(`Provider is not a valid url ${provider}`);
        }
        if (!Object.values(configuration.identity_providers).some((providers) => providers.includes(provider))) {
            throw new Error(`Provider is not supported ${provider}`);
        }
        const identityProviderTrustChain = yield (0, getTrustChain_1.getTrustChain)(configuration, provider);
        if (!identityProviderTrustChain) {
            throw new Error(`Unable to find trust chain for identity provider ${provider}`);
        }
        const { authorization_endpoint, token_endpoint, userinfo_endpoint, revocation_endpoint, jwks: provider_jwks, } = identityProviderTrustChain.entity_configuration.metadata.openid_provider;
        const profile = (_a = Object.entries(configuration.identity_providers).find(([, providers]) => providers.includes(provider))) === null || _a === void 0 ? void 0 : _a[0];
        const scope = "openid";
        const redirect_uri = configuration.redirect_uris[0];
        const acr_values = configuration.providers[profile].acr_values;
        const prompt = "consent login";
        const endpoint = authorization_endpoint;
        const nonce = (0, utils_1.generateRandomString)(32);
        const state = (0, utils_1.generateRandomString)(32);
        const { code_verifier, code_challenge, code_challenge_method } = getPKCE();
        const response_type = configuration.response_types[0];
        const client_id = configuration.client_id;
        const iat = (0, utils_1.makeIat)(); //     -----------   manca exp   --------------
        const aud = [provider, authorization_endpoint];
        const claims = configuration.providers[profile].requestedClaims;
        const iss = client_id;
        const sub = client_id; //    --------------   manca ui_locales   --------
        const jwk = (0, utils_1.getPrivateJWKforProvider)(configuration); //  get the RP private key (Core) to sign the Authentication Request
        const request = yield (0, utils_1.createJWS)({
            scope,
            redirect_uri,
            response_type,
            nonce,
            state,
            client_id,
            endpoint,
            acr_values,
            iat,
            aud,
            claims,
            prompt,
            code_challenge,
            code_challenge_method,
            iss,
            sub,
        }, jwk);
        const url = `${authorization_endpoint}?${new URLSearchParams({
            scope,
            redirect_uri,
            nonce,
            state,
            response_type,
            client_id,
            endpoint,
            acr_values,
            iat: iat.toString(),
            aud: JSON.stringify(aud),
            claims: JSON.stringify(claims),
            code_challenge,
            code_challenge_method,
            prompt,
            request,
        })}`;
        yield configuration.storage.write(state, {
            state,
            code_verifier,
            redirect_uri,
            token_endpoint,
            userinfo_endpoint,
            revocation_endpoint,
            provider_jwks,
        });
        configuration.logger.info({ message: "Authentication request created", url });
        return url;
    });
}
exports.createAuthenticationRequest = createAuthenticationRequest;
// SHOULDDO support more code challange methods
function getPKCE() {
    const length = 64; // SHOULDDO read from config
    const code_verifier = (0, utils_1.generateRandomString)(length);
    const code_challenge_method = "S256"; // SHOULDDO read from config
    const code_challenge = crypto_1.default.createHash("sha256").update(code_verifier).digest("base64url");
    return {
        code_verifier,
        code_challenge,
        code_challenge_method,
    };
}
//# sourceMappingURL=createAuthenticationRequest.js.map
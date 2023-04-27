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
exports.requestAccessToken = void 0;
const utils_1 = require("./utils");
const lodash_1 = require("lodash");
const axios_1 = __importDefault(require("axios"));
function requestAccessToken(///  Guardare specifiche per Refresh Token
configuration, authenticationRequest, code) {
    return __awaiter(this, void 0, void 0, function* () {
        const request = {
            url: authenticationRequest.token_endpoint,
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                redirect_uri: authenticationRequest.redirect_uri,
                client_id: configuration.client_id,
                state: authenticationRequest.state,
                code,
                code_verifier: authenticationRequest.code_verifier,
                client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                client_assertion: yield (0, utils_1.createJWS)({
                    iss: configuration.client_id,
                    sub: configuration.client_id,
                    aud: [authenticationRequest.token_endpoint],
                    iat: (0, utils_1.makeIat)(),
                    exp: (0, utils_1.makeExp)(),
                    jti: (0, utils_1.makeJti)(),
                }, (0, utils_1.getPrivateJWKforProvider)(configuration)),
            }).toString(),
        };
        // SHOULDDO when doing post request ensure timeout and ssl is respected
        configuration.logger.info({ message: "Access token request", request });
        //const response = await configuration.httpClient(request);
        const response = yield (0, axios_1.default)(request);
        if (response.status === 200) {
            configuration.logger.info({ message: "Access token request succeeded", request, response });
            const tokens = JSON.parse(response.data);
            if (!(0, utils_1.isString)(tokens.access_token) ||
                !(0, utils_1.isString)(tokens.id_token) ||
                !((0, lodash_1.isUndefined)(tokens.refresh_token) || (0, utils_1.isString)(tokens.refresh_token))) {
                throw new Error(`Invalid response from token endpoint: ${response.data}`);
            }
            configuration.auditLogger(tokens);
            return tokens;
        }
        else {
            configuration.logger.error({ message: "Access token request failed", request, response });
            throw new Error(`Access token request failed`);
        }
    });
}
exports.requestAccessToken = requestAccessToken;
//# sourceMappingURL=requestAccessToken.js.map
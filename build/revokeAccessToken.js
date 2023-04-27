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
exports.revokeAccessToken = void 0;
const utils_1 = require("./utils");
const axios_1 = __importDefault(require("axios"));
function revokeAccessToken(configuration, tokens) {
    return __awaiter(this, void 0, void 0, function* () {
        const request = {
            url: tokens.revocation_endpoint,
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                token: tokens.access_token,
                client_id: configuration.client_id,
                client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                client_assertion: yield (0, utils_1.createJWS)({
                    iss: configuration.client_id,
                    sub: configuration.client_id,
                    aud: [tokens.revocation_endpoint],
                    iat: (0, utils_1.makeIat)(),
                    exp: (0, utils_1.makeExp)(),
                    jti: (0, utils_1.makeJti)(),
                }, (0, utils_1.getPrivateJWKforProvider)(configuration)),
            }).toString(),
        };
        configuration.logger.info({ message: `Revocation request`, request });
        // SHOULDDO when doing post request ensure timeout and ssl is respected
        //const response = await configuration.httpClient(request);
        const response = yield (0, axios_1.default)(request);
        if (response.status === 200) {
            configuration.logger.info({ message: `Revocation request succeeded`, request, response });
        }
        else {
            configuration.logger.warn({ message: `Revocation request failed`, request, response });
            throw new Error("Revocation request failed");
        }
    });
}
exports.revokeAccessToken = revokeAccessToken;
//# sourceMappingURL=revokeAccessToken.js.map
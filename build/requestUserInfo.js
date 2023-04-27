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
exports.requestUserInfo = void 0;
const jose = __importStar(require("jose"));
const utils_1 = require("./utils");
const axios_1 = __importDefault(require("axios"));
function requestUserInfo(configuration, authenticationRequest, access_token) {
    return __awaiter(this, void 0, void 0, function* () {
        const request = {
            method: "GET",
            url: authenticationRequest.userinfo_endpoint,
            headers: { Authorization: `Bearer ${access_token}` },
        };
        configuration.logger.info({ message: "User info request", request });
        // SHOULDDO ensure timeout and ssl is respected
        //const response = await configuration.httpClient(request);
        const response = yield (0, axios_1.default)(request);
        if (response.status === 200 && response.headers["content-type"] === "application/jose") {
            const jwe = yield response.data;
            const jws = yield decrypt(configuration, jwe);
            const jwt = yield verify(authenticationRequest, jws);
            configuration.logger.info({ message: "User info request succeeded", request, response });
            if (!(validateUserInfoCie(jwt) && validateUserInfoSpid(jwt))) {
                throw new Error("Invalid user info response");
            }
            return jwt;
        }
        else {
            configuration.logger.error({ message: "User info request failed", request, response });
            throw new Error(`User info request failed`);
        }
    });
}
exports.requestUserInfo = requestUserInfo;
function decrypt(configuration, jwe) {
    return __awaiter(this, void 0, void 0, function* () {
        const { plaintext } = yield jose.compactDecrypt(jwe, (header) => __awaiter(this, void 0, void 0, function* () {
            if (!header.kid)
                throw new Error("missing kid in header");
            const jwk = configuration.private_jwks.keys.find((key) => key.kid === header.kid);
            if (!jwk)
                throw new Error("no matching key with kid found");
            return yield jose.importJWK(jwk, (0, utils_1.inferAlgForJWK)(jwk));
        }));
        return new TextDecoder().decode(plaintext);
    });
}
function verify(authenticationRequest, jws) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield (0, utils_1.verifyJWS)(jws, authenticationRequest.provider_jwks);
        }
        catch (error) {
            if (error.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
                // user info jwt verificatrion failed, this should not happen
                // SHOULDDO file issue upstream
                return jose.decodeJwt(jws);
            }
            else {
                throw error;
            }
        }
    });
}
const userInfoCieSchema = {
    type: "object",
    properties: {
        sub: { type: "string", nullable: true },
        given_name: { type: "string", nullable: true },
        family_name: { type: "string", nullable: true },
        email: { type: "string", nullable: true },
        email_verified: { type: "string", nullable: true },
        gender: { type: "string", nullable: true },
        birthdate: { type: "string", nullable: true },
        phone_number: { type: "string", nullable: true },
        phone_number_verified: { type: "string", nullable: true },
        address: { type: "string", nullable: true },
        place_of_birth: { type: "string", nullable: true },
        document_details: { type: "string", nullable: true },
        e_delivery_service: { type: "string", nullable: true },
        fiscal_number: { type: "string", nullable: true },
        physical_phone_number: { type: "string", nullable: true },
    },
};
const validateUserInfoCie = utils_1.ajv.compile(userInfoCieSchema);
const userInfoSpidSchema = {
    type: "object",
    properties: {
        "https://attributes.spid.gov.it/name": { type: "string", nullable: true },
        "https://attributes.spid.gov.it/familyName": { type: "string", nullable: true },
        "https://attributes.spid.gov.it/placeOfBirth": { type: "string", nullable: true },
        "https://attributes.spid.gov.it/countyOfBirth": { type: "string", nullable: true },
        "https://attributes.spid.gov.it/dateOfBirth": { type: "string", nullable: true },
        "https://attributes.spid.gov.it/gender": { type: "string", nullable: true },
        "https://attributes.spid.gov.it/companyName": { type: "string", nullable: true },
        "https://attributes.spid.gov.it/registeredOffice": { type: "string", nullable: true },
        "https://attributes.spid.gov.it/fiscalNumber": { type: "string", nullable: true },
        "https://attributes.spid.gov.it/ivaCode": { type: "string", nullable: true },
        "https://attributes.spid.gov.it/idCard": { type: "string", nullable: true },
        "https://attributes.spid.gov.it/mobilePhone": { type: "string", nullable: true },
        "https://attributes.spid.gov.it/email": { type: "string", nullable: true },
        "https://attributes.spid.gov.it/address": { type: "string", nullable: true },
        "https://attributes.spid.gov.it/expirationDate": { type: "string", nullable: true },
        "https://attributes.spid.gov.it/digitalAddress": { type: "string", nullable: true },
    },
};
const validateUserInfoSpid = utils_1.ajv.compile(userInfoSpidSchema);
//# sourceMappingURL=requestUserInfo.js.map
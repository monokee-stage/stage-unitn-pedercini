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
exports.createEntityConfiguration = void 0;
const utils_1 = require("./utils");
//  From configuration create the EntityConfiguration (adding iat, exp, hints ecc..) to send as a response
function createEntityConfiguration(configuration) {
    return __awaiter(this, void 0, void 0, function* () {
        const iat = (0, utils_1.makeIat)();
        const exp = (0, utils_1.makeExp)(configuration.federation_default_exp);
        const iss = configuration.client_id;
        const sub = configuration.client_id;
        const client_id = configuration.client_id;
        const authority_hints = configuration.trust_anchors;
        // SHOULDDO use separate keys for core and federation
        // use federation public jwks for federation related operations such as onboarding
        const jwks = configuration.public_jwks;
        const trust_marks = configuration.trust_marks;
        const client_name = configuration.client_name;
        const application_type = configuration.application_type;
        const contacts = configuration.contacts;
        const redirect_uris = configuration.redirect_uris;
        const response_types = configuration.response_types;
        const federation_jwks = jwks; //  Can be taken from somewhere else
        const organization_name = client_name;
        const homepage_uri = configuration.homepage_uri;
        const policy_uri = configuration.policy_uri;
        const logo_uri = configuration.logo_uri;
        const federation_resolve_endpoint = "local";
        const entity_configuration = {
            iat,
            exp,
            iss,
            sub,
            jwks: federation_jwks,
            metadata: {
                openid_relying_party: {
                    application_type,
                    client_id,
                    client_registration_types: ["automatic"],
                    jwks,
                    client_name,
                    contacts,
                    grant_types: ["refresh_token", "authorization_code"],
                    redirect_uris,
                    response_types,
                    subject_type: "pairwise",
                },
                federation_entity: {
                    organization_name,
                    homepage_uri,
                    policy_uri,
                    logo_uri,
                    contacts,
                    federation_resolve_endpoint
                }
            },
            trust_marks,
            authority_hints,
        };
        const jwk = configuration.private_jwks.keys[0]; // SHOULDDO make it configurable
        const jws = yield (0, utils_1.createJWS)(entity_configuration, jwk); // sign with the federation private key and return
        return jws;
    });
}
exports.createEntityConfiguration = createEntityConfiguration;
//# sourceMappingURL=createEntityConfiguration.js.map
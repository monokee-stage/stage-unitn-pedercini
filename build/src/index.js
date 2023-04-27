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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const createRelyingParty_1 = require("./createRelyingParty");
const logRotatingFilesystem_1 = require("./default-implementations/logRotatingFilesystem");
const auditLogRotatingFilesystem_1 = require("./default-implementations/auditLogRotatingFilesystem");
const inMemoryAsyncStorage_1 = require("./default-implementations/inMemoryAsyncStorage");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
/*
import{
  UserInfo,
  Tokens,
  createRelyingParty,
  createLogRotatingFilesystem,
  createAuditLogRotatingFilesystem,
  createInMemoryAsyncStorage,
} from "spid-cie-oidc";
*/
// All the process.env variables are for the Docker usage (set in Dockerfiles)
const port = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000;
const client_id = (_b = process.env.CLIENT_ID) !== null && _b !== void 0 ? _b : `http://stage-pedercini.intranet.athesys.it:${port}/oidc/rp/`;
const trust_anchors = process.env.TRUST_ANCHOR
    ? [process.env.TRUST_ANCHOR]
    : ["http://127.0.0.1:8000/"];
const identity_providers = process.env.IDENTITY_PROVIDER
    ? [process.env.IDENTITY_PROVIDER]
    : ["http://127.0.0.1:8000/oidc/op/"];
const relyingParty = (0, createRelyingParty_1.createRelyingParty)({
    client_id,
    client_name: "My Project",
    trust_anchors,
    identity_providers: {
        spid: identity_providers,
        cie: ["http://127.0.0.1:8002/oidc/op/"],
    },
    public_jwks_path: "./public.jwks.json",
    private_jwks_path: "./private.jwks.json",
    trust_marks_path: "./trust_marks.json",
    logger: (0, logRotatingFilesystem_1.createLogRotatingFilesystem)(),
    auditLogger: (0, auditLogRotatingFilesystem_1.createAuditLogRotatingFilesystem)(),
    storage: (0, inMemoryAsyncStorage_1.createInMemoryAsyncStorage)(),
});
relyingParty.validateConfiguration().catch((error) => {
    console.error(error);
    process.exit(1);
});
const app = (0, express_1.default)();
app.use((0, express_session_1.default)({ secret: "spid-cie-oidc-nodejs" }));
//    Restituisce array di providers conosciuti (con cui ho una Trust Chain) e le loro informazioni (sub, organization_name, logo_uri)
// FUNZIONA OK
app.get("/oidc/rp/providers", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.json(yield relyingParty.retrieveAvailableProviders());
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
//    Authorization Endpoint
//    Performs Authentication of the user, redirecting the User-Agent to the Authorization Server's Authorization Endpoint
//    using request parameters defined by OAuth 2.0 
app.get("/oidc/rp/authorization", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.redirect(yield relyingParty.createAuthorizationRedirectURL(req.query.provider // auth request must have the parameter 'provider' 
        ));
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
//    Redirect URI   -   Authorization callback endpoint per l'acquisizione dell'auth code da parte del OP
app.get("/oidc/rp/callback", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const outcome = yield relyingParty.manageCallback(req.query);
        switch (outcome.type) {
            case "authentication-success": {
                req.session.user_info = outcome.user_info;
                req.session.tokens = outcome.tokens;
                res.redirect(`/attributes`);
                break;
            }
            case "authentication-error": {
                res.redirect(`/error?${new URLSearchParams({
                    error: outcome.error,
                    error_description: (_c = outcome.error_description) !== null && _c !== void 0 ? _c : "",
                })}`);
                break;
            }
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
//    Single Logout of the user
app.get("/oidc/rp/revocation", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.session.tokens) {
            res.status(400).json({ error: "user is not logged in" });
        }
        else {
            yield relyingParty.revokeTokens(req.session.tokens);
            req.session.destroy(() => {
                res.json({ message: "user logged out" });
            });
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
//    Responds with the Entity Configuration base64encoded
//    Entity Configuration Response: HTTP 200, Content-Type = 'application/entity-statement+jwt,
//    response = EC serialized (base64encoded?) and signed
app.get("/oidc/rp/.well-known/openid-federation", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield relyingParty.createEntityConfigurationResponse();
        res.status(response.status);
        res.set("Content-Type", response.headers["Content-Type"]);
        res.send(response.body);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
// this endpoint is outside of the oidc lib
// so you can provide your own way of storing and retreiving user data
app.get("/oidc/rp/user_info", (req, res) => {
    if (req.session.user_info) {
        res.json(req.session.user_info);
    }
    else {
        res.status(401).send("User is not logged in");
    }
});
// serve frontend static files
//app.use(express.static("frontend/build"));
app.use(express_1.default.static("frontend/"));
// every route leads back to index beacuse it is a single page application
app.get("*", (req, res) => 
//res.sendFile(path.resolve("frontend/build/index.html"))
res.sendFile(path_1.default.resolve("frontend/index.html")));
app.listen(port, () => {
    console.log(`Open browser at http://127.0.0.1:${port}`);
});
/*
https.createServer(
  {
      key: fs.readFileSync("Certificato/privkey1.pem"),
      cert: fs.readFileSync("Certificato/cert1.pem")
  },
  app).listen(3000, () => {
  console.log("server running on port 3000")
});
*/
//# sourceMappingURL=index.js.map
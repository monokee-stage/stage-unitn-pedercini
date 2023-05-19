import express, { response } from "express";
import path from "path";
import session from "express-session";
import https from "https";
import fs from "fs";
import axios from "axios";

import {createRelyingParty} from "./createRelyingParty"
import {Tokens} from "./revokeAccessToken"
import { createLogRotatingFilesystem } from "./default-implementations/logRotatingFilesystem";
import { createAuditLogRotatingFilesystem } from "./default-implementations/auditLogRotatingFilesystem";
import { createInMemoryAsyncStorage } from "./default-implementations/inMemoryAsyncStorage";
import {UserInfo} from "./userInfo";
import { Certificate } from "crypto";
import { generateJWKS } from "./utils";

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

const port = process.env.PORT ?? 3000;
const client_id = process.env.CLIENT_ID ?? `http://stage-pedercini.intranet.athesys.it:${port}/oidc/rp/`;
const trust_anchors = process.env.TRUST_ANCHOR
  ? [process.env.TRUST_ANCHOR]
  : ["http://stage-pedercini.intranet.athesys.it:8000/", "http://127.0.0.1:8000/"];
const identity_providers = process.env.IDENTITY_PROVIDER
  ? [process.env.IDENTITY_PROVIDER]
  : ["http://stage-pedercini.intranet.athesys.it:8000/oidc/op/", "http://127.0.0.1:8000/oidc/op/"]; 

const relyingParty = createRelyingParty({
  client_id,
  client_name: "My Project",
  trust_anchors,
  identity_providers: {
    spid: identity_providers,
    cie: ["http://stage-pedercini.intranet.athesys.it:8002/oidc/op/", "http://127.0.0.1:8002/oidc/op/"],
  },
  public_jwks_path: "./public.jwks.json",
  private_jwks_path: "./private.jwks.json",
  trust_marks_path: "./trust_marks.json",
  logger: createLogRotatingFilesystem(),
  auditLogger: createAuditLogRotatingFilesystem(),
  federation_public_jwks_path: "./federation.public.jwks.json",
  federation_private_jwks_path: "./federation.private.jwks.json",
  homepage_uri: "http://homepage_uri.com",
  policy_uri: "http://policy_uri.com",
  logo_uri: "http://logo_uri.com",
  federation_resolve_endpoint: client_id+"resolve",
  storage: createInMemoryAsyncStorage(),
});

relyingParty.validateConfiguration().catch((error) => {
  console.error(error);
  process.exit(1);
});

const app = express();

app.use(session({ secret: "spid-cie-oidc-nodejs" }));
declare module "express-session" {
  interface SessionData {
    user_info?: UserInfo;
    tokens?: Tokens;
  }
}



//    Restituisce array di providers conosciuti (con cui ho una Trust Chain) e le loro informazioni (sub, organization_name, logo_uri)
// FUNZIONA OK

app.get("/oidc/rp/providers", async (req, res) => {
  try {
    res.json(await relyingParty.retrieveAvailableProviders());
  } catch (error) {
    if (error instanceof Error){
      const errMessage = {
        "error": "server_error",
        "error_decription": error.message
      };
      res.status(500).json(errMessage);
    } else {
      res.status(500).json(error);
    }
  }
});

//    Authorization Endpoint
//    Performs Authentication of the user, redirecting the User-Agent to the Authorization Server's Authorization Endpoint
//    using request parameters defined by OAuth 2.0 
//    The Authorization Server endpoint / identity provider authenticates the user and redirect the user to the Redirect URI (Callback endpoint)

app.get("/oidc/rp/authorization", async (req, res) => {
  try {
    res.redirect(
      await relyingParty.createAuthorizationRedirectURL(
        req.query.provider as string    // auth request must have the parameter 'provider' 
      )
    );
  } catch (error) {
    if (error instanceof Error){
      const errMessage = {
        "error": "server_error",
        "error_decription": error.message
      };
      res.status(500).json(errMessage);
    } else {
      res.status(500).json(error);
    }
  }
});

//    Redirect URI   -   Authorization callback endpoint per l'acquisizione dell'auth code da parte del OP
//    The user is redirected here by the OP after authentication (success or fail)

app.get("/oidc/rp/callback", async (req, res) => {
  try {
    const outcome = await relyingParty.manageCallback(req.query as any);
    switch (outcome.type) {
      case "authentication-success": {
        req.session.user_info = outcome.user_info;
        req.session.tokens = outcome.tokens;
        res.redirect(`/attributes`);        //    User redirected to the page requested / home page
        break;                              //    Cosa ci voglio fare con questi dati???
      }
      case "authentication-error": {
        res.redirect(
          `/error?${new URLSearchParams({
            error: outcome.error,
            error_description: outcome.error_description ?? "",
          })}`
        );
        break;
      }
    }
  } catch (error) {
    if (error instanceof Error){
      const errMessage = {
        "error": "server_error",
        "error_decription": error.message
      };
      res.status(500).json(errMessage);
    } else {
      res.status(500).json(error);
    }
  }
});


//    Single Logout of the user

app.get("/oidc/rp/revocation", async (req, res) => {
  try {
    if (!req.session.tokens) {
      res.status(400).json({ error: "user is not logged in" });
    } else {
      await relyingParty.revokeTokens(req.session.tokens);
      req.session.destroy(() => {
        res.json({ message: "user logged out" });
      });
    }
  } catch (error) {
    if (error instanceof Error){
      const errMessage = {
        "error": "server_error",
        "error_decription": error.message
      };
      res.status(500).json(errMessage);
    } else {
      res.status(500).json(error);
    }
  }
});

//    Resolve Entity Statement Endpoint 
//    Responds with the final metadata, Trust marks and trust Chain of another Entity  ( RP gets a request from someone about for ex a OP)
//    1. fetch subject's EC
//    2. collect a TC from the subject EC to the specified TA
//    3. Verify the Trust Chain
//    4. Apply the policies present in the trust Chain to the ES metadata
//    5. RETURN resolved metadata and verified Trust Marks (signed JWS ( Federation ), explicitly typed by setting typ header parameter to 'resolve-response+jwt')
app.get("/oidc/rp/resolve", async (req, res) => {
  try {
    const response = await relyingParty.resolveSubjectResponse(req.query.sub as string, req.query.anchor as string, req.query.type as string);
    res.status(response.status);
    res.set("Content-Type", response.headers["Content-Type"]);
    res.send(response.body);
  } catch (error){
    if (error instanceof Error){
      const errMessage = {
        "error": "server_error",
        "error_decription": error.message
      };
      res.status(500).json(errMessage);
    } else {
      res.status(500).json(error);
    }
  }
});

app.get("/try", async (req, res) => {
  const url = "http://stage-pedercini.intranet.athesys.it:8000/admin";
  const response = await axios.get(url);
  res.sendStatus(response.status);
})



//    Responds with the Entity Configuration base64encoded
//    Entity Configuration Response: HTTP 200, Content-Type = 'application/entity-statement+jwt,
//    response = EC serialized (base64encoded?) and signed

app.get("/oidc/rp/.well-known/openid-federation", async (req, res) => {
  try {
    const response = await relyingParty.createEntityConfigurationResponse();
    res.status(response.status);
    res.set("Content-Type", response.headers["Content-Type"]);
    res.send(response.body);
  } catch (error) {
    if (error instanceof Error){
      const errMessage = {
        "error": "server_error",
        "error_decription": error.message
      };
      res.status(500).json(errMessage);
    } else {
      res.status(500).json(error);
    }
  }
});

// this endpoint is outside of the oidc lib
// so you can provide your own way of storing and retreiving user data
app.get("/oidc/rp/user_info", (req, res) => {
  if (req.session.user_info) {
    res.json(req.session.user_info);
  } else {
    res.status(401).send("User is not logged in");
  }
});


//  PROVA GENERAZIONE JWKS su file
app.get("/oidc/rp/crea_chiave", async (req, res) => {
  try {
    const resp = await generateJWKS();
    fs.writeFileSync("provajwks.json", JSON.stringify(resp.public_jwks));
    fs.writeFileSync("provaprivatejwks.json", JSON.stringify(resp.private_jwks));
    res.send("ciao");
  } catch {
    res.send("error");
  }
});

// serve frontend static files
//app.use(express.static("../frontendOriginale/build"));
app.use(express.static("frontend/src"));
// every route leads back to index beacuse it is a single page application
app.get("*", (req, res) =>
  //res.sendFile(path.resolve("../frontendOriginale/build/index.html"))
  res.sendFile(path.resolve("frontend/src/index.html"))
);


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

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
  : ["http://127.0.0.1:8000/", "http://stage-pedercini.intranet.athesys.it:8000/"];
const identity_providers = process.env.IDENTITY_PROVIDER
  ? [process.env.IDENTITY_PROVIDER]
  : ["http://127.0.0.1:8000/oidc/op/", "http://stage-pedercini.intranet.athesys.it:8000/oidc/op/"];

const relyingParty = createRelyingParty({
  client_id,
  client_name: "My Project",
  trust_anchors,
  identity_providers: {
    spid: identity_providers,
    cie: ["http://127.0.0.1:8002/oidc/op/", "http://stage-pedercini.intranet.athesys.it:8002"],
  },
  public_jwks_path: "./public.jwks.json",
  private_jwks_path: "./private.jwks.json",
  trust_marks_path: "./trust_marks.json",
  logger: createLogRotatingFilesystem(),
  auditLogger: createAuditLogRotatingFilesystem(),
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
    res.status(500).json(error);
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
    res.status(500).json(error);
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
        break;
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
    res.status(500).json(error);
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
    res.status(500).json(error);
  }
});


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
    res.status(500).json(error);
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

// serve frontend static files
//app.use(express.static("frontend/build"));
app.use(express.static("frontend/"));
// every route leads back to index beacuse it is a single page application
app.get("*", (req, res) =>
  //res.sendFile(path.resolve("frontend/build/index.html"))
  res.sendFile(path.resolve("frontend/index.html"))
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
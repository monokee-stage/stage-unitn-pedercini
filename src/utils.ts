import crypto from "crypto";
import * as fs from "fs";
import * as jose from "jose";
import * as uuid from "uuid";
import * as undici from "undici";
import Ajv from "ajv";
import { Configuration, JWKs } from "./configuration";

export async function createJWS<Payload extends jose.JWTPayload>(payload: Payload, jwk: jose.JWK, typ?: string) {
  const privateKey = await jose.importJWK(jwk, inferAlgForJWK(jwk));
  const jws = await new jose.CompactSign(new TextEncoder().encode(JSON.stringify(payload)))
    .setProtectedHeader({ alg: "RS256", kid: jwk.kid, typ: typ})
    .sign(privateKey);
  return jws;
}

export async function verifyJWS(jws: string, public_jwks: JWKs) {
  const { payload } = await jose.compactVerify(jws, async (header) => {
    if (!header.kid) throw new Error("missing kid in header");
    const jwk = public_jwks.keys.find((key: any) => key.kid === header.kid);
    if (!jwk) throw new Error("no matching key with kid found");
    return await jose.importJWK(jwk, inferAlgForJWK(jwk));
  });
  return JSON.parse(new TextDecoder().decode(payload));
}

// now timestamp in seconds
export function makeIat() {
  return Math.floor(Date.now() / 1000);
}

// now + delta timestamp in seconds
export function makeExp(deltaSeconds = 33 * 60) {
  return Math.floor(makeIat() + deltaSeconds);
}

export function makeJti() {
  return uuid.v4();
}

export function generateRandomString(length: number) {
  return crypto.randomBytes(length).toString("hex");
}

// SHOULDDO implement
// Return the RP private key (Core) to use to sign protocol requests
export function getPrivateJWKforProvider(configuration: Configuration) {
  return configuration.private_jwks.keys[0];
}

export function inferAlgForJWK(jwk: jose.JWK) {
  if (jwk.kty === "RSA") return "RS256";
  if (jwk.kty === "EC") return "ES256";
  // SHOULDDO support more types
  throw new Error("unsupported key type");
}

export async function generateJWKS() {
  const { publicKey, privateKey } = await jose.generateKeyPair("RS256");
  const publicJWK = await jose.exportJWK(publicKey);
  const kid = await jose.calculateJwkThumbprint(publicJWK);
  publicJWK.kid = kid;
  const privateJWK = await jose.exportJWK(privateKey);
  privateJWK.kid = kid;
  return {
    public_jwks: { keys: [publicJWK] },
    private_jwks: { keys: [privateJWK] },
  };
}

export function isValidURL(url: string) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export async function fileExists(path: string) {
  try {
    await fs.promises.stat(path);
    return true;
  } catch (error) {
    return false;
  }
}

export async function readJSON<T = any>(path: string) {
  return JSON.parse(await fs.promises.readFile(path, "utf8")) as T;
}

/*
export const undiciHttpClient: HttpClient = async ({ url, ...params }) => {
  const response = await undici.request(url, params);
  return {
    status: response.statusCode,
    headers: response.headers as Record<string, string>,
    body: await response.body.text(),
  };
};
*/

export const ajv = new Ajv();

import * as jose from "jose";
import { ajv, makeIat, verifyJWS } from "./utils";
import {
  TrustAnchorEntityConfiguration,
  IdentityProviderEntityConfiguration,
  RelyingPartyEntityConfiguration,
} from "./createEntityConfiguration";
import { cloneDeep, difference } from "lodash";
import { Configuration, JWKs, TrustMark } from "./configuration";
import { JSONSchemaType, ValidateFunction } from "ajv";
import axios from "axios";
import { error } from "console";
import { stringify } from "querystring";

// SHOULDDO implement arbitray length tst chain validation
// SHOULDDO check authority hints
// Mancano questi controlli (https://openid.net/specs/openid-connect-federation-1_0.html#name-validating-a-trust-chain)
async function getAndVerifyTrustChain(
  configuration: Configuration,   // EC del RP
  relying_party: string,          // client_id del RP
  identity_provider: string,      // ID del OP
  trust_anchor: string            // ID del TA
) {
  //  get the Entity Configuration of the RP and validate it
  const relying_party_entity_configuration = await getEntityConfiguration(
    configuration,
    relying_party,
    validateRelyingPartyEntityConfiguration
  );

  //  get the Entity Configuration of the Identity Provider and validate
  const identity_provider_entity_configuration = await getEntityConfiguration(
    configuration,
    identity_provider,
    validateIdentityProviderEntityConfiguration
  );

  //  get the Entity Configuration of the Trust Anchor and validate
  const trust_anchor_entity_configuration = await getEntityConfiguration(
    configuration,
    trust_anchor,
    validateTrustAnchorEntityConfiguration
  );

  //  get the Entity Statement of the TA about the RP
  const relying_party_entity_statement = await getEntityStatement(
    configuration,
    relying_party_entity_configuration,
    trust_anchor_entity_configuration
  );

  // get the Entity Statement of the TA about the OP
  const identity_provider_entity_statement = await getEntityStatement(
    configuration,
    identity_provider_entity_configuration,
    trust_anchor_entity_configuration
  );

  //  Calculate the minimum expiration time of the statement objects
  const exp = Math.min(relying_party_entity_statement.exp, identity_provider_entity_statement.exp);
  const metadata = applyMetadataPolicy(
    identity_provider_entity_configuration.metadata,
    identity_provider_entity_statement.metadata_policy
  );
  const entity_configuration = {
    ...identity_provider_entity_configuration,
    metadata,
  };
  configuration.logger.info({
    message: "Trust chain verified",
    relying_party,
    identity_provider,
    trust_anchor,
    relying_party_entity_configuration,
    identity_provider_entity_configuration,
    relying_party_entity_statement,
    identity_provider_entity_statement,
    exp,
    metadata,
  });
  return { exp, entity_configuration };
}

export async function getEntityStatement(
  configuration: Configuration,
  descendant: RelyingPartyEntityConfiguration | IdentityProviderEntityConfiguration,
  superior: TrustAnchorEntityConfiguration
): Promise<EntityStatement> {
  try {
    let url = superior.metadata.federation_entity.federation_fetch_endpoint;
    //const response = await axios.get(url);

    /*
    if (descendant.sub.slice(-1) == "/"){     ------    SLICING if last character is /
      var sub = descendant.sub.slice(0, -1);
    } else {
      var sub = descendant.sub;
    }*/

    const response = await axios.get(url, {params: {sub: descendant.sub}});

    if (response.status !== 200) {
      throw new Error(`Expected status 200 but got ${response.status}`);
    }
    if (!response.headers["content-type"]?.startsWith("application/entity-statement+jwt")) {
      throw new Error(
        `Expected content-type application/entity-statement+jwt but got ${response.headers["content-type"]}`
      );
    }
    const jws = await response.data;
    return await verifyJWS(jws, superior.jwks);
  } catch (error) {
    throw new Error(
      `Failed to get entity statement for ${descendant.sub} from ${superior.metadata.federation_entity.federation_fetch_endpoint} because of ${error}`
    );
  }
}

export async function getEntityConfiguration<T>(
  configuration: Configuration,
  url: string,
  validateFunction: ValidateFunction<T>
): Promise<T> {
  try {
    // SHOULDDO when doing post request ensure timeout and ssl is respected
    const response = await axios.get(url+".well-known/openid-federation");

    const jws = await response.data;
    if (response.status !== 200) {
      throw new Error(`Expected status 200 but got ${response.status}`);
    }
    if (!response.headers["content-type"]?.startsWith("application/entity-statement+jwt")) {
      throw new Error(
        `Expected content-type application/entity-statement+jwt but got ${response.headers["content-type"]}`
      );
    }
    const entity_configuration = await verifyEntityConfiguration(jws);

    const valid = validateFunction(entity_configuration);
    if (!valid){
      console.log(validateFunction.errors);
    }

    if (!validateFunction(entity_configuration)) {
      throw new Error(`Malformed entity configuration`);
    }

    return entity_configuration;
  } catch (error) {
    throw new Error(`Failed to get entity configuration for ${url} because of ${error}`);
  }
}

type EntityStatement = {
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  jwks: { keys: Array<jose.JWK> };
  metadata_policy: MetadataPolicy;
  trust_marks: Array<{ id: string; trust_mark: string }>;
};

type MetadataPolicy = Record<
  string,
  Record<
    string,
    {
      value?: string;
      add?: string;
      default?: string;
      subset_of?: Array<string>;
      superset_of?: Array<string>;
      one_of?: Array<string>;
    }
  >
>;

export function applyMetadataPolicy(metadata: any, policy: MetadataPolicy) {
  metadata = cloneDeep(metadata);
  for (const [parentField, parentPolicy] of Object.entries(policy)) {
    if (!(parentField in metadata)) continue;
    for (const [childField, childPolicy] of Object.entries(parentPolicy)) {
      if (childPolicy.add) {
        metadata[parentField][childField] = [...(metadata[parentField][childField] ?? []), childPolicy.add];
      }
      if (childPolicy.value) {
        metadata[parentField][childField] = childPolicy.value;
      }
      if (childPolicy.default) {
        if (!(childField in metadata[parentField])) {
          metadata[parentField][childField] = childPolicy.default;
        }
      }
      if (childPolicy.subset_of) {
        if (difference(metadata[parentField][childField], childPolicy.subset_of).length > 0) {
          delete metadata[parentField][childField];
        }
      }
      if (childPolicy.superset_of) {
        if (difference(metadata[parentField][childField], childPolicy.superset_of).length === 0) {
          delete metadata[parentField][childField];
        }
      }
      if (childPolicy.one_of) {
        if (!childPolicy.one_of.includes(metadata[parentField][childField])) {
          delete metadata[parentField][childField];
        }
      }
    }
  }
  return metadata;
}

export async function verifyEntityConfiguration(jws: string): Promise<unknown> {
  const decoded: any = jose.decodeJwt(jws);
  return await verifyJWS(jws, decoded.jwks);
}

//    trustChainCache - local Map between a string (cacheKey and a trustChain)

const trustChainCache = new Map<string, Awaited<ReturnType<typeof getAndVerifyTrustChain>>>();

//    CachedTrustChain - return an already existing Trust Chain stored in trustChainCache from the RP to an OP with a specific TA

async function CachedTrustChain(
  configuration: Configuration,   // RP configuration
  relying_party: string,          // client_id
  identity_provider: string,      // ID identity provider
  trust_anchor: string            // ID trust anchor
) {
  const cacheKey = `${relying_party}-${identity_provider}-${trust_anchor}`;
  const cached = trustChainCache.get(cacheKey);
  const now = makeIat();
  if (cached && cached.exp > now) {   //  IF i found an existing TC and is valid
    return cached;
  } else {                            //  ELSE I build it and add to trustChainCache
    const trust_chain = await getAndVerifyTrustChain(configuration, relying_party, identity_provider, trust_anchor);
    trustChainCache.set(cacheKey, trust_chain);
    return trust_chain;
  }
}

//    Return the Trust Chains (if exist) from the RP configuration to a Provider

export async function getTrustChain(configuration: Configuration, provider: string) {
  const identityProviderTrustChain =
    (
      await Promise.all(
        configuration.trust_anchors.map(async (trust_anchor) => {
          try {
            return await CachedTrustChain(configuration, configuration.client_id, provider, trust_anchor);
          } catch (error) {
            configuration.logger.warn(error);
            return null;
          }
        })
      )
    ).find((trust_chain) => trust_chain !== null) ?? null;
  return identityProviderTrustChain;
}

const jwksSchema: JSONSchemaType<JWKs> = {
  type: "object",
  properties: {
    keys: {
      type: "array",
      items: {
        type: "object",
      },
    },
  },
  required: ["keys"],
};

const trustMarksSchema: JSONSchemaType<Array<TrustMark>> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "string" },
      trust_mark: { type: "string" },
    },
    required: ["id", "trust_mark"],
  },
};

const relyingPartyEntityConfigurationSchema: JSONSchemaType<RelyingPartyEntityConfiguration> = {
  type: "object",
  properties: {
    iss: { type: "string" },
    sub: { type: "string" },
    iat: { type: "number" },
    exp: { type: "number" },
    jwks: jwksSchema,
    trust_marks: { type: "array" } as any,
    authority_hints: { type: "array", items: { type: "string" } },
    metadata: {             //    !!!  ADD federation_entity    !!!
      type: "object",
      properties: {
        openid_relying_party: {
          type: "object",
          properties: {
            client_name: { type: "string" },
            client_id: { type: "string" },
            application_type: { type: "string" },
            contacts: { type: "array", items: { type: "string" }, nullable: true },
            subject_type: { type: "string" },
            jwks: jwksSchema,
            grant_types: { type: "array", items: { type: "string" } },
            response_types: { type: "array", items: { type: "string" } },
            redirect_uris: { type: "array", items: { type: "string" } },
            client_registration_types: { type: "array", items: { type: "string" } },
          },
          required: [
            "client_name",
            "client_id",
            "application_type",
            "subject_type",
            "jwks",
            "grant_types",
            "response_types",
            "redirect_uris",
            "client_registration_types",
          ],
        },
      },
      required: ["openid_relying_party"],
    },
  },
  required: ["iss", "sub", "iat", "exp", "jwks", "authority_hints", "metadata"],
};
const validateRelyingPartyEntityConfiguration = ajv.compile(relyingPartyEntityConfigurationSchema);

const IdentityProviderEntityConfigurationSchema: JSONSchemaType<IdentityProviderEntityConfiguration> = {
  type: "object",
  properties: {
    iss: { type: "string" },
    sub: { type: "string" },
    iat: { type: "number" },
    exp: { type: "number" },
    jwks: jwksSchema,
    trust_marks: { type: "array" } as any,
    authority_hints: { type: "array", items: { type: "string" } },
    metadata: {
      type: "object",
      properties: {
        openid_provider: {
          type: "object",
        } as any,
      },
      required: ["openid_provider"],
    },
  },
  required: ["iss", "sub", "iat", "exp", "jwks", "authority_hints", "metadata"],
};
const validateIdentityProviderEntityConfiguration = ajv.compile(IdentityProviderEntityConfigurationSchema);

const trustAnchorEntityConfigurationSchema: JSONSchemaType<TrustAnchorEntityConfiguration> = {
  type: "object",
  properties: {
    iss: { type: "string" },
    sub: { type: "string" },
    iat: { type: "number" },
    exp: { type: "number" },
    jwks: jwksSchema,
    metadata: {
      type: "object",
      properties: {
        federation_entity: {
          type: "object",
          properties: {
            name: { type: "string" },
            homepage_uri: { type: "string" },
            contacts: { type: "array", items: { type: "string" } },
            federation_fetch_endpoint: { type: "string" },
            federation_list_endpoint: { type: "string" },
            federation_resolve_endpoint: { type: "string" },
            federation_trust_mark_status_endpoint: { type: "string" },
          },
          required: [
            "name",
            "homepage_uri",
            "federation_fetch_endpoint",
            "federation_list_endpoint",
            "federation_resolve_endpoint",
            "federation_trust_mark_status_endpoint",
          ],
        },
      },
      required: ["federation_entity"],
    },
    trust_marks_issuers: {
      type: "object",
      additionalProperties: {
        type: "array",
        items: { type: "string" },
      },
      required: [],
    },
    constraints: {
      type: "object",
      properties: {
        max_path_length: { type: "number" },
      },
      required: ["max_path_length"],
    },
  },
  required: ["constraints", "exp", "iat", "iss", "jwks", "metadata", "sub", "trust_marks_issuers"],
};
const validateTrustAnchorEntityConfiguration = ajv.compile(trustAnchorEntityConfigurationSchema);

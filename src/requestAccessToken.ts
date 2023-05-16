import { Configuration } from "./configuration";
import { createJWS, getPrivateJWKforProvider, isString, makeExp, makeIat, makeJti } from "./utils";
import { isUndefined } from "lodash";
import { AuthenticationRequest } from "./createAuthenticationRequest";
import axios from "axios";

export async function requestAccessToken(     ///  Guardare specifiche per Refresh Token
  configuration: Configuration,
  authenticationRequest: AuthenticationRequest,
  code: string
) {
  const request = {
    url: authenticationRequest.token_endpoint,    //    OP Token endpoint got from provider configuration
    method: "POST" as const,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    data: new URLSearchParams({
      grant_type: "authorization_code",
      redirect_uri: authenticationRequest.redirect_uri,     //  RP redirect URI endpoint got from RP configuration
      client_id: configuration.client_id,
      state: authenticationRequest.state,
      code,
      code_verifier: authenticationRequest.code_verifier,   // include the PKCE code_verifier in the Access Token request
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",     ///   Inconsistenza specifiche OIDC Core e Specifiche SPID (jwtbearer)
      client_assertion: await createJWS(
        {
          iss: configuration.client_id,
          sub: configuration.client_id,
          aud: [authenticationRequest.token_endpoint],
          iat: makeIat(),
          exp: makeExp(),
          jti: makeJti(),
        },
        getPrivateJWKforProvider(configuration)   // get the RP private key (Core) to sign the Access Token request
      ),
    }).toString(),
  };
  // SHOULDDO when doing post request ensure timeout and ssl is respected
  configuration.logger.info({ message: "Access token request", request });
  //const response = await configuration.httpClient(request);

  const response = await axios(request);

  if (response.status === 200) {
    configuration.logger.info({ message: "Access token request succeeded", request, response });
    const tokens = JSON.parse(JSON.stringify(response.data));
    //const tokens = response.data;
    if (
      !isString(tokens.access_token) ||
      !isString(tokens.id_token) ||
      !(isUndefined(tokens.refresh_token) || isString(tokens.refresh_token))
    ) {
      throw new Error(`Invalid response from token endpoint: ${response.data}`);
    }
    configuration.auditLogger(tokens);
    return tokens as { id_token: string; access_token: string; refresh_token?: string };
  } else {
    configuration.logger.error({ message: "Access token request failed", request, response });
    throw new Error(`Access token request failed`);
  }
}

import { OAuth2Client } from "@day1co/oslo/oauth2";
import { TimeSpan, createDate } from "@day1co/oslo";

import type { OAuth2Provider } from "../index.js";

const authorizeEndpoint = "https://linear.app/oauth/authorize";
const tokenEndpoint = "https://api.linear.app/oauth/token";

export class Linear implements OAuth2Provider {
	private client: OAuth2Client;
	private clientSecret: string;

	constructor(clientId: string, clientSecret: string, redirectURI: string) {
		this.client = new OAuth2Client(clientId, authorizeEndpoint, tokenEndpoint, {
			redirectURI
		});
		this.clientSecret = clientSecret;
	}

	public async createAuthorizationURL(
		state: string,
		options?: {
			scopes?: string[];
		}
	): Promise<URL> {
		const scopes = options?.scopes ?? [];
		return await this.client.createAuthorizationURL({
			state,
			scopes: [...scopes, "read"]
		});
	}

	public async validateAuthorizationCode(code: string): Promise<LinearTokens> {
		const result = await this.client.validateAuthorizationCode<TokenResponseBody>(code, {
			authenticateWith: "request_body",
			credentials: this.clientSecret
		});
		const tokens: LinearTokens = {
			accessToken: result.access_token,
			accessTokenExpiresAt: createDate(new TimeSpan(result.expires_in, "s"))
		};
		return tokens;
	}
}

interface TokenResponseBody {
	access_token: string;
	expires_in: number;
}

export interface LinearTokens {
	accessToken: string;
	accessTokenExpiresAt: Date;
}

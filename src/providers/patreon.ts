import { OAuth2Client } from "@day1co/oslo/oauth2";
import { TimeSpan, createDate } from "@day1co/oslo";

import type { OAuth2Provider } from "../index.js";

const authorizeEndpoint = "https://www.patreon.com/oauth2/authorize";
const tokenEndpoint = "https://www.patreon.com/api/oauth2/token";

export class Patreon implements OAuth2Provider {
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
		return await this.client.createAuthorizationURL({
			state,
			scopes: options?.scopes ?? []
		});
	}

	public async validateAuthorizationCode(code: string): Promise<PatreonTokens> {
		const result = await this.client.validateAuthorizationCode<TokenResponseBody>(code, {
			authenticateWith: "request_body",
			credentials: this.clientSecret
		});
		const tokens: PatreonTokens = {
			accessToken: result.access_token,
			refreshToken: result.refresh_token,
			accessTokenExpiresAt: createDate(new TimeSpan(result.expires_in, "s"))
		};
		return tokens;
	}

	public async refreshAccessToken(refreshToken: string): Promise<PatreonTokens> {
		const result = await this.client.refreshAccessToken<TokenResponseBody>(refreshToken, {
			authenticateWith: "request_body",
			credentials: this.clientSecret
		});
		const tokens: PatreonTokens = {
			accessToken: result.access_token,
			refreshToken: result.refresh_token,
			accessTokenExpiresAt: createDate(new TimeSpan(result.expires_in, "s"))
		};
		return tokens;
	}
}

interface TokenResponseBody {
	access_token: string;
	expires_in: number;
	refresh_token: string;
}

export interface PatreonTokens {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresAt: Date;
}

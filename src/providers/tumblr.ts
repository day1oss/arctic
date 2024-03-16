import { OAuth2Client } from "@day1co/oslo/oauth2";

import type { OAuth2Provider } from "../index.js";
import { TimeSpan, createDate } from "@day1co/oslo";

const authorizeEndpoint = "https://www.tumblr.com/oauth2/authorize";
const tokenEndpoint = "https://api.tumblr.com/v2/oauth2/token";

export class Tumblr implements OAuth2Provider {
	private client: OAuth2Client;
	private clientSecret: string;

	constructor(
		clientId: string,
		clientSecret: string,
		options?: {
			redirectURI?: string;
		}
	) {
		this.client = new OAuth2Client(clientId, authorizeEndpoint, tokenEndpoint, {
			redirectURI: options?.redirectURI
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
			scopes: [...scopes, "basic"]
		});
	}

	public async validateAuthorizationCode(code: string): Promise<TumblrTokens> {
		const result = await this.client.validateAuthorizationCode<TokenResponseBody>(code, {
			credentials: this.clientSecret
		});

		const tokens: TumblrTokens = {
			accessToken: result.access_token,
			refreshToken: result.refresh_token,
			accessTokenExpiresAt: createDate(new TimeSpan(result.expires_in, "s"))
		};
		return tokens;
	}

	public async refreshAccessToken(refreshToken: string): Promise<TumblrTokens> {
		const result = await this.client.refreshAccessToken<TokenResponseBody>(refreshToken, {
			authenticateWith: "request_body",
			credentials: this.clientSecret
		});

		const tokens: TumblrTokens = {
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
export interface TumblrTokens {
	accessToken: string;
	accessTokenExpiresAt: Date;
	refreshToken: string;
}

import type { StrategyVerifyCallback } from 'remix-auth';
import {
   OAuth2Profile,
   OAuth2StrategyVerifyParams,
   OAuth2Strategy,
} from 'remix-auth-oauth2';

export type BungieStrategyOptions = {
   clientID: string;
   clientSecret: string;
   callbackURL: string;
   accessType?: 'online' | 'offline';
   includeGrantedScopes?: boolean;
   prompt?: 'none' | 'consent' | 'select_account';
};

export type BungieProfile = {
   provider: string;
   id: string;
   name: string;
} & OAuth2Profile;

export type BungieExtraParams = {
   expires_in: number;
   token_type: 'Bearer';
   refresh_expires_in: number;
   membership_id: string;
} & Record<string, string | number>;

export class BungieStrategy<User> extends OAuth2Strategy<
   User,
   BungieProfile,
   BungieExtraParams
> {
   public name = 'bungie';

   private readonly accessType: string;

   private readonly prompt?: 'none' | 'consent' | 'select_account';

   private readonly includeGrantedScopes: boolean;

   // private readonly userInfoURL =
   //    'https://www.bungie.net/platform/User/GetBungieAccount/14128891/254/';

   private createUserInfoURL(id: string) {
      return `https://www.bungie.net/platform/User/GetBungieAccount/${id}/254/`;
   }

   constructor(
      {
         clientID,
         clientSecret,
         callbackURL,
         accessType,
         includeGrantedScopes,
         prompt,
      }: BungieStrategyOptions,
      verify: StrategyVerifyCallback<
         User,
         OAuth2StrategyVerifyParams<BungieProfile, BungieExtraParams>
      >
   ) {
      super(
         {
            clientID,
            clientSecret,
            callbackURL,
            authorizationURL: 'https://www.bungie.net/en/OAuth/Authorize',
            tokenURL: 'https://www.bungie.net/platform/app/oauth/token/',
         },
         verify
      );
      this.accessType = accessType ?? 'online';
      this.includeGrantedScopes = includeGrantedScopes ?? false;
      this.prompt = prompt;
   }

   protected authorizationParams(): URLSearchParams {
      const params = new URLSearchParams({
         // Bungie requires no scope or it will throw error
      });
      if (this.prompt) {
         params.set('prompt', this.prompt);
      }
      return params;
   }

   protected async userProfile(
      accessToken: string,
      extraParams: BungieExtraParams
   ): Promise<BungieProfile> {
      const response = await fetch(
         this.createUserInfoURL(extraParams.membership_id),
         {
            headers: {
               Authorization: `Bearer ${accessToken}`,
            },
         }
      );
      console.log(response);
      const profile: BungieProfile = {
         provider: 'bungie',
         id: '14128891',
         name: 'roy',
      };
      return profile;
   }
}

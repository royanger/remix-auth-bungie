import type { StrategyVerifyCallback } from "remix-auth";
import {
  OAuth2Profile,
  OAuth2StrategyVerifyParams,
  OAuth2Strategy,
} from "remix-auth-oauth2";

export type BungieStrategyOptions = {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  apiKey: string;
  accessType?: "online" | "offline";
  includeGrantedScopes?: boolean;
  prompt?: "none" | "consent" | "select_account";
};

export type BungieProfile = {
  provider: string;
  destinyMemberships: {
    crossSaveOverride: number;
    applicableMembershipTypes: number[];
    isPublic: boolean;
    membershipType: number;
    membershipId: string;
    displayName: string;
    bungieGlobalDisplayName: string;
    bungieGlobalDisplayNameCode: number;
  };
  bungieNetUser: {
    membershipId: string;
    uniqueName: string;
    displayName: string;
    profilePicture: number;
    profileTheme: number;
    userTitle: number;
    successMessageFlags: number;
    isDeleted: boolean;
    about: string;
    firstAccess: string;
    lastUpdate: string;
    context: {
      isFollowing: boolean;
      ignoreStatus: {
        isIgnored: boolean;
        ignoreFlags: number;
      };
    };
    showActivity: boolean;
    locale: string;
    localeInheritDefault: boolean;
    showGroupMessaging: boolean;
    profilePicturePath: string;
    profileThemeName: string;
    userTitleDisplay: string;
    statusText: string;
    statusDate: string;
    blizzardDisplayName: string;
    steamDisplayName: string;
    twitchDisplayName: string;
    cachedBungieGlobalDisplayName: string;
    cachedBungieGlobalDisplayNameCode: number;
  };
} & OAuth2Profile;

export type BungieExtraParams = {
  expires_in: number;
  token_type: "Bearer";
  refresh_expires_in: number;
  membership_id: string;
} & Record<string, string | number>;

export class BungieStrategy<User> extends OAuth2Strategy<
  User,
  BungieProfile,
  BungieExtraParams
> {
  public name = "bungie";

  private readonly accessType: string;

  private apiKey: string;

  private readonly prompt?: "none" | "consent" | "select_account";

  private createUserInfoURL(id: string) {
    return `https://www.bungie.net/platform/User/GetBungieAccount/${id}/254/`;
  }

  constructor(
    {
      clientID,
      clientSecret,
      callbackURL,
      apiKey,
      accessType,
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
        authorizationURL: "https://www.bungie.net/en/OAuth/Authorize",
        tokenURL: "https://www.bungie.net/platform/app/oauth/token/",
      },
      verify
    );

    this.apiKey = apiKey;
    this.accessType = accessType ?? "online";
    this.prompt = prompt;
  }

  protected authorizationParams(): URLSearchParams {
    const params = new URLSearchParams({
      // Bungie requires no scope or it will throw error
    });
    if (this.prompt) {
      params.set("prompt", this.prompt);
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
          "X-API-Key": this.apiKey,
        },
      }
    );
    const data = await response.json();
    const profile: BungieProfile = {
      provider: "bungie",
      destinyMemberships: {
        crossSaveOverride:
          data.Response.destinyMemberships[0].crossSaveOverride,
        applicableMembershipTypes:
          data.Response.destinyMembershipsapplicableMembershipTypes,
        isPublic: data.Response.destinyMemberships[0].isPublic,
        membershipType: data.Response.destinyMemberships[0].membershipType,
        membershipId: data.Response.destinyMemberships[0].membershipId,
        displayName: data.Response.destinyMemberships[0].displayName,
        bungieGlobalDisplayName:
          data.Response.destinyMemberships[0].bungieGlobalDisplayName,
        bungieGlobalDisplayNameCode:
          data.Response.destinyMemberships[0].bungieGlobalDisplayNameCode,
      },
      bungieNetUser: {
        membershipId: data.Response.bungieNetUser.membershipId,
        uniqueName: data.Response.bungieNetUser.uniqueName,
        displayName: data.Response.bungieNetUser.displayName,
        profilePicture: data.Response.bungieNetUser.profilePicture,
        profileTheme: data.Response.bungieNetUser.profileTheme,
        userTitle: data.Response.bungieNetUser.userTitle,
        successMessageFlags: data.Response.bungieNetUser.successMessageFlags,
        isDeleted: data.Response.bungieNetUser.isDeleted,
        about: data.Response.bungieNetUser.about,
        firstAccess: data.Response.bungieNetUser.firstAccess,
        lastUpdate: data.Response.bungieNetUser.lastUpdate,
        context: {
          isFollowing: data.Response.bungieNetUser.context.isFollowing,
          ignoreStatus: {
            isIgnored:
              data.Response.bungieNetUser.context.ignoreStatus.isIgnored,
            ignoreFlags:
              data.Response.bungieNetUser.context.ignoreStatus.ignoreFlags,
          },
        },
        showActivity: data.Response.bungieNetUser.showActivity,
        locale: data.Response.bungieNetUser.locale,
        localeInheritDefault: data.Response.bungieNetUser.localeInheritDefault,
        showGroupMessaging: data.Response.bungieNetUser.showGroupMessaging,
        profilePicturePath: data.Response.bungieNetUser.profilePicturePath,
        profileThemeName: data.Response.bungieNetUser.profileThemeName,
        userTitleDisplay: data.Response.bungieNetUser.userTitleDisplay,
        statusText: data.Response.bungieNetUser.statusText,
        statusDate: data.Response.bungieNetUser.statusDate,
        blizzardDisplayName: data.Response.bungieNetUser.blizzardDisplayName,
        steamDisplayName: data.Response.bungieNetUser.steamDisplayName,
        twitchDisplayName: data.Response.bungieNetUser.twitchDisplayName,
        cachedBungieGlobalDisplayName:
          data.Response.bungieNetUser.cachedBungieGlobalDisplayName,
        cachedBungieGlobalDisplayNameCode:
          data.Response.bungieNetUser.cachedBungieGlobalDisplayNameCode,
      },
    };
    return profile;
  }
}

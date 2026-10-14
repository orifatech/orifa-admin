/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_github from "../actions/github.js";
import type * as actions_optimizeImage from "../actions/optimizeImage.js";
import type * as auth from "../auth.js";
import type * as blog from "../blog.js";
import type * as crons from "../crons.js";
import type * as domains from "../domains.js";
import type * as emailLicenses from "../emailLicenses.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as media from "../media.js";
import type * as organizations from "../organizations.js";
import type * as projects from "../projects.js";
import type * as seed from "../seed.js";
import type * as stagedChanges from "../stagedChanges.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";
import type * as vault from "../vault.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/github": typeof actions_github;
  "actions/optimizeImage": typeof actions_optimizeImage;
  auth: typeof auth;
  blog: typeof blog;
  crons: typeof crons;
  domains: typeof domains;
  emailLicenses: typeof emailLicenses;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  media: typeof media;
  organizations: typeof organizations;
  projects: typeof projects;
  seed: typeof seed;
  stagedChanges: typeof stagedChanges;
  subscriptions: typeof subscriptions;
  users: typeof users;
  vault: typeof vault;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

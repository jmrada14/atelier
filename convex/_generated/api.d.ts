/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as artworks from "../artworks.js";
import type * as auth from "../auth.js";
import type * as collectors from "../collectors.js";
import type * as files from "../files.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as materials from "../materials.js";
import type * as newsletters from "../newsletters.js";
import type * as openCalls from "../openCalls.js";
import type * as pieces from "../pieces.js";
import type * as reminders from "../reminders.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  artworks: typeof artworks;
  auth: typeof auth;
  collectors: typeof collectors;
  files: typeof files;
  "lib/crypto": typeof lib_crypto;
  materials: typeof materials;
  newsletters: typeof newsletters;
  openCalls: typeof openCalls;
  pieces: typeof pieces;
  reminders: typeof reminders;
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

import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params) {
        // OWASP Multi-Tenant Principle: Default to least-privileged non-admin role.
        // Self-registered accounts never receive super_admin permissions.
        return {
          email: params.email as string,
          name: (params.name as string) || "User",
          role: "client_editor",
          createdAt: Date.now(),
        };
      },
    }),
  ],
});

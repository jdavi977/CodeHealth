import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const syncUser = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        clerkId: v.string(),
        image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {

        // check if user already exists
        const existingUser = await ctx.db.query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId)) 
        .first();

        if(existingUser) return;

        // if does not already exist we insert the user
        return await ctx.db.insert("users", args)
    }
})
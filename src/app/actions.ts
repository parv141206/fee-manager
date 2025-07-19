"use server";

import { signOut as nextAuthSignOut, signIn as nextAuthSignIn } from "@/auth";

export async function handleSignOut() {
  await nextAuthSignOut({ redirectTo: "/" });
}

export async function handleSignIn(formData: FormData) {
  await nextAuthSignIn("credentials", formData);
}

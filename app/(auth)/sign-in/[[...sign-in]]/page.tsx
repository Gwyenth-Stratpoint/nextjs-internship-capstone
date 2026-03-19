"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your project management account</p>
        </div>

        <div className="bg-card p-8 rounded-lg border border-border">
          <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
        </div>
      </div>
    </div>
  );
}
/*
TODO: Task 2.3 Implementation Notes: DONE
- Import SignIn from @clerk/nextjs
- Configure sign-in redirects
- Style to match design system
- Add proper error handling
*/

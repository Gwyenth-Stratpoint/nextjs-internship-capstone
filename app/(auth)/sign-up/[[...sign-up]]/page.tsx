"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card p-8 rounded-lg border border-border">
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
      </div>
    </div>
  );
}

/*
TODO: Task 2.3 Implementation Notes: DONE 
- Import SignUp from @clerk/nextjs
- Configure sign-up redirects
- Style to match design system NOT DONE
- Add proper error handling
- Set up webhook for user data sync (Task 2.5)
*/

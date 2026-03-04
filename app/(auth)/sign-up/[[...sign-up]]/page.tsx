"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-platinum-900 dark:bg-outer_space-600 px-4">
      <div className="w-full max-w-md bg-white dark:bg-outer_space-500 p-8 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
        />
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

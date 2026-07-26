import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md p-2 rounded-xl bg-card border border-brand-medium shadow-sm">
        <SignUp />
      </div>
    </div>
  );
}

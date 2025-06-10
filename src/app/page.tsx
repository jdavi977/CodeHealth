import { SignedIn, SignedOut, SignIn, SignInButton, SignOutButton } from "@clerk/nextjs";

const HomePage = () => {
  return (
    <div>
      Home Page
      <SignedIn>
        <SignOutButton />
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>
    </div>
  );
};
export default HomePage;
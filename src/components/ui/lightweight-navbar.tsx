"use client";

import Link from "next/link";
import { DynamicLogo } from "@/components/ui/dynamic-logo";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

interface LightweightNavbarProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title?: string;
  };
  auth?: {
    login: {
      text: string;
      url: string;
    };
    signup: {
      text: string;
      url: string;
    };
  };
}

const defaultProps: LightweightNavbarProps = {
  logo: {
    url: "/",
    src: "/concoro.svg",
    alt: "Concoro",  
  },
  auth: {
    login: { text: "Accedi", url: "/signin" },
    signup: { text: "Registrati gratuitamente", url: "/signup" },
  },
};

const LightweightNavbar = (props: LightweightNavbarProps) => {
  const { logo, auth: authProps } = { ...defaultProps, ...props };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="hidden justify-between lg:flex lg:flex-1">
          <div className="flex items-center">
            <Link href={logo?.url || "/"} className="flex items-center">
              <DynamicLogo
                lightSrc="/concoro-logo-light.svg"
                darkSrc="/concoro-logo-dark.svg"
                alt="Concoro"
                width={147}
                height={33}
                priority
              />
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href={authProps?.login.url || "/signin"}>
                {authProps?.login.text || "Accedi"}
              </Link>
            </Button>
            <Button asChild>
              <Link href={authProps?.signup.url || "/signup"}>
                {authProps?.signup.text || "Registrati gratuitamente"}
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="flex flex-1 items-center justify-between lg:hidden">
          <Link href={logo?.url || "/"} className="flex items-center gap-2">
            <DynamicLogo
              lightSrc="/concoro-logo-light.svg"
              darkSrc="/concoro-logo-dark.svg"
              alt="Concoro"
              width={147}
              height={33}
              priority
            />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden xs:inline-flex">
              <Link href={authProps?.login.url || "/signin"}>
                {authProps?.login.text || "Accedi"}
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={authProps?.signup.url || "/signup"}>
                {authProps?.signup.text || "Registrati"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Wrapper component to handle Suspense boundary
const LightweightNavbarWithSuspense = (props: LightweightNavbarProps) => {
  return (
    <Suspense fallback={<div className="h-16 bg-background border-b" />}>
      <LightweightNavbar {...props} />
    </Suspense>
  );
};

export { LightweightNavbar, LightweightNavbarWithSuspense };
export default LightweightNavbarWithSuspense;


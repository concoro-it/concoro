"use client";

import Page from './page';

// This file intentionally re-exports the existing client UI to keep all current behaviors.
// We will import and render this from the new server entry to ensure JSON-LD is SSR'd separately.

export default Page;


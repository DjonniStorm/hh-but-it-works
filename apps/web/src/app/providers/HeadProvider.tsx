import type { PropsWithChildren } from "react";

import { titleTemplate } from "@/shared/seo/brand";
import { UnheadProvider, createHead } from "@unhead/react/client";

const head = createHead({ init: [{ titleTemplate }] });

export const HeadProvider = ({ children }: PropsWithChildren) => {
  return <UnheadProvider head={head}>{children}</UnheadProvider>;
};

import { useState } from "react";

import { ChibiLoader } from "@/shared/loader/ui/ChibiLoader";
import { DuckLoader } from "@/shared/loader/ui/DuckLoader";

const arts = [ChibiLoader, DuckLoader];

export const RequestLoader = () => {
  const [Art] = useState(() => {
    const index = Math.floor(Math.random() * arts.length);
    return arts[index] ?? ChibiLoader;
  });

  return <Art />;
};

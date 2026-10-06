import { useState } from "react";

import { CatKeyboardLoader } from "@/shared/loader/ui/CatKeyboardLoader";
import { ChibiLoader } from "@/shared/loader/ui/ChibiLoader";
import { CoffeeDeployLoader } from "@/shared/loader/ui/CoffeeDeployLoader";
import { DuckLoader } from "@/shared/loader/ui/DuckLoader";
import { NodeModulesLoader } from "@/shared/loader/ui/NodeModulesLoader";

const arts = [
  ChibiLoader,
  DuckLoader,
  CatKeyboardLoader,
  CoffeeDeployLoader,
  NodeModulesLoader,
];

export const RequestLoader = () => {
  const [Art] = useState(() => {
    const index = Math.floor(Math.random() * arts.length);
    return arts[index] ?? ChibiLoader;
  });

  return <Art />;
};

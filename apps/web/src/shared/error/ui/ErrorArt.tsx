import { useState } from "react";

import { BrokenBuildArt } from "@/shared/error/ui/BrokenBuildArt";
import { UnpluggedDuckArt } from "@/shared/error/ui/UnpluggedDuckArt";

const arts = [UnpluggedDuckArt, BrokenBuildArt];

// Как RequestLoader: картинка выбирается один раз на показ экрана.
export const ErrorArt = () => {
  const [Art] = useState(() => {
    const index = Math.floor(Math.random() * arts.length);
    return arts[index] ?? UnpluggedDuckArt;
  });

  return <Art />;
};

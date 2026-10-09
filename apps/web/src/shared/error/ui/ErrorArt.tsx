import { useState } from "react";

import { BrokenBuildArt } from "@/shared/error/ui/BrokenBuildArt";
import { NoSignalTvArt } from "@/shared/error/ui/NoSignalTvArt";
import { SleepyServerArt } from "@/shared/error/ui/SleepyServerArt";
import { TimeoutSnailArt } from "@/shared/error/ui/TimeoutSnailArt";
import { UnpluggedDuckArt } from "@/shared/error/ui/UnpluggedDuckArt";

// Пул экранов ошибок: по одной картинке на показ, сюда входят и старые, и новые.
const arts = [
  UnpluggedDuckArt,
  BrokenBuildArt,
  SleepyServerArt,
  TimeoutSnailArt,
  NoSignalTvArt,
];

// Как RequestLoader: картинка выбирается один раз на показ экрана.
export const ErrorArt = () => {
  const [Art] = useState(() => {
    const index = Math.floor(Math.random() * arts.length);
    return arts[index] ?? UnpluggedDuckArt;
  });

  return <Art />;
};

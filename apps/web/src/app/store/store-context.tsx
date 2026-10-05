import { type PropsWithChildren, createContext, useContext } from "react";

import { type StoreMap, rootStore } from "./root-store";
import { type StoreKey } from "./store-key";

const StoreContext = createContext(rootStore);

export function StoreProvider({ children }: PropsWithChildren) {
  return (
    <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
  );
}

export function useRootStore() {
  return useContext(StoreContext);
}

export function useStore<K extends StoreKey>(key: K): StoreMap[K] {
  return useRootStore().get(key);
}

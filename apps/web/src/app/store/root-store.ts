import { AuthStore } from "./auth-store";
import { ErrorStore } from "./error-store";
import { LoadingStore } from "./loading-store";
import { StoreKey } from "./store-key";

export interface StoreMap {
  [StoreKey.Loading]: LoadingStore;
  [StoreKey.Errors]: ErrorStore;
  [StoreKey.Auth]: AuthStore;
}

export class RootStore {
  readonly loading = new LoadingStore();
  readonly errors = new ErrorStore();
  readonly auth: AuthStore;
  private readonly stores = new Map<StoreKey, StoreMap[StoreKey]>();

  constructor() {
    this.register(this.loading);
    this.register(this.errors);
    this.auth = new AuthStore(this);
    this.register(this.auth);
  }

  register<K extends StoreKey>(store: StoreMap[K] & { readonly key: K }): void {
    this.stores.set(store.key, store);
  }

  get<K extends StoreKey>(key: K): StoreMap[K] {
    const store = this.stores.get(key);
    if (!store) {
      throw new Error(`Стор ${key} не зарегистрирован`);
    }
    return store as StoreMap[K];
  }
}

export const rootStore = new RootStore();

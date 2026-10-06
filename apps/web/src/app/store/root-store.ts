import { AuthStore } from "./auth-store";
import { EmployerStore } from "./employer-store";
import { ErrorStore } from "./error-store";
import { InvitationStore } from "./invitation-store";
import { LoadingStore } from "./loading-store";
import { ProfileStore } from "./profile-store";
import { StoreKey } from "./store-key";

export interface StoreMap {
  [StoreKey.Loading]: LoadingStore;
  [StoreKey.Errors]: ErrorStore;
  [StoreKey.Auth]: AuthStore;
  [StoreKey.Profile]: ProfileStore;
  [StoreKey.Employer]: EmployerStore;
  [StoreKey.Invitations]: InvitationStore;
}

export class RootStore {
  readonly loading = new LoadingStore();
  readonly errors = new ErrorStore();
  readonly auth: AuthStore;
  readonly profile: ProfileStore;
  readonly employer: EmployerStore;
  readonly invitations: InvitationStore;
  private readonly stores = new Map<StoreKey, StoreMap[StoreKey]>();

  constructor() {
    this.register(this.loading);
    this.register(this.errors);
    this.auth = new AuthStore(this);
    this.register(this.auth);
    this.profile = new ProfileStore(this);
    this.register(this.profile);
    this.employer = new EmployerStore(this);
    this.register(this.employer);
    this.invitations = new InvitationStore(this);
    this.register(this.invitations);
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

import { randomId } from "@/shared/lib/random-id";
import { makeAutoObservable, observable } from "mobx";

import { StoreKey } from "./store-key";

export class LoadingStore {
  readonly key = StoreKey.Loading;
  readonly ids = observable.set<string>();

  constructor() {
    makeAutoObservable(this, { key: false, ids: false }, { autoBind: true });
  }

  get visible(): boolean {
    return this.ids.size > 0;
  }

  start(): string {
    const id = randomId();
    this.ids.add(id);
    return id;
  }

  stop(id: string): void {
    this.ids.delete(id);
  }
}

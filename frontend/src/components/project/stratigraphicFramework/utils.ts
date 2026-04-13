import type { ItemType } from "./types";

export function findIndexByName(items: ItemType[], name: string) {
  return items.findIndex((item) => item.name === name);
}

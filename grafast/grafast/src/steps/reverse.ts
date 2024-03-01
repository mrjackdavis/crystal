import type {
  ExecutionDetails,
  GrafastResultsList,
  UnbatchedExecutionExtra,
} from "../interfaces.js";
import type { ExecutableStep } from "../step.js";
import { UnbatchedExecutableStep } from "../step.js";

/**
 * Returns a reversed copy of the list.
 */
export function reverseArray<TData = any>(list: readonly TData[]): TData[] {
  if (!Array.isArray(list)) {
    throw new Error(
      `Attempted to reverse an array, but what was passed wasn't an array`,
    );
  }
  const l = list.length;
  const newList = [];
  for (let i = 0; i < l; i++) {
    newList[i] = list[l - i - 1];
  }
  return newList;
}

/**
 * Reverses a list.
 */
export class ReverseStep<TData> extends UnbatchedExecutableStep<
  readonly TData[]
> {
  static $$export = {
    moduleName: "grafast",
    exportName: "ReverseStep",
  };
  isSyncAndSafe = true;
  allowMultipleOptimizations = true;

  constructor(plan: ExecutableStep<readonly TData[]>) {
    super();
    this.addDependency(plan);
  }

  executeV2({
    indexMap,
    values: [values0],
  }: ExecutionDetails<[TData[]]>): GrafastResultsList<TData[]> {
    return indexMap((i) => {
      const arr = values0.at(i);
      return arr == null ? arr : reverseArray(arr);
    });
  }

  unbatchedExecute(_extra: UnbatchedExecutionExtra, arr: TData[]): TData[] {
    return arr == null ? arr : reverseArray(arr);
  }

  deduplicate(peers: ReverseStep<TData>[]): ReverseStep<TData>[] {
    return peers;
  }
}

/**
 * Reverses a list.
 */
export function reverse<TData>(
  plan: ExecutableStep<readonly TData[]>,
): ReverseStep<TData> {
  return new ReverseStep<TData>(plan);
}

import type { CollectionName, EntityOf, BaseDoc, ID } from "./types";

/**
 * Generic repository interface — the single seam between StartupOS and its
 * persistence layer. The mock implementation lives in `./mock`; a Firestore
 * implementation would satisfy the exact same surface, org-scoped by
 * `organizationId` exactly as the security rules enforce.
 *
 * Every method is implicitly scoped to an organization, because the mock store
 * (and Firestore) partition all data by organizationId. Passing an orgId that
 * doesn't match a doc's organizationId returns nothing — tenant isolation by
 * construction.
 */
/** A single where-clause condition. */
export type WhereClause<T> = {
  field: keyof T;
  op: "==" | "!=" | "in" | "array-contains";
  value: unknown;
};

export interface QueryOptions<T> {
  where?: WhereClause<T>[];
  orderBy?: { field: keyof T; direction: "asc" | "desc" };
  limit?: number;
}

export interface Repository<C extends CollectionName> {
  collection: C;
  list(orgId: ID, options?: QueryOptions<EntityOf<C>>): Promise<EntityOf<C>[]>;
  get(orgId: ID, id: ID): Promise<EntityOf<C> | null>;
  create(
    orgId: ID,
    actorId: ID,
    data: Omit<EntityOf<C>, keyof BaseDoc> & Partial<BaseDoc>,
  ): Promise<EntityOf<C>>;
  update(
    orgId: ID,
    actorId: ID,
    id: ID,
    patch: Partial<Omit<EntityOf<C>, keyof BaseDoc | "id">>,
  ): Promise<EntityOf<C>>;
  remove(orgId: ID, id: ID): Promise<void>;
}

/** Evaluate a where-clause operator against a field value. */
export function matchWhere(value: unknown, op: WhereClause<never>["op"], target: unknown): boolean {
  switch (op) {
    case "==":
      return value === target;
    case "!=":
      return value !== target;
    case "in":
      return Array.isArray(target) && target.includes(value);
    case "array-contains":
      return Array.isArray(value) && value.includes(target);
    default:
      return false;
  }
}
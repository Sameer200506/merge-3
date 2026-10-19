/**
 * Mock repository — implements the generic Repository interface against the
 * in-memory store. This is the only place that touches store arrays directly.
 * A Firestore implementation would replace this file with live reads/writes
 * while keeping the same interface.
 */

import type { BaseDoc, CollectionName, EntityOf, ID } from "../types";
import { matchWhere, type QueryOptions, type Repository } from "../repository";
import { getState } from "./store-state";

function nowISO() {
  return new Date().toISOString();
}

function newId(collection: string): string {
  return `${collection}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createMockRepository<C extends CollectionName>(collection: C): Repository<C> {
  const repo: Repository<C> = {
    collection,

    async list(orgId, options) {
      const state = getState();
      const all = state[collection] as EntityOf<C>[];
      let rows = all.filter((row) => row.organizationId === orgId);

      if (options?.where) {
        for (const clause of options.where) {
          rows = rows.filter((row) => {
            const value = row[clause.field as keyof EntityOf<C>];
            return matchWhere(value, clause.op, clause.value);
          });
        }
      }

      if (options?.orderBy) {
        const { field, direction } = options.orderBy;
        rows = [...rows].sort((a, b) => {
          const av = a[field as keyof EntityOf<C>] as unknown as string | number;
          const bv = b[field as keyof EntityOf<C>] as unknown as string | number;
          if (av === bv) return 0;
          const cmp = av > bv ? 1 : -1;
          return direction === "asc" ? cmp : -cmp;
        });
      }

      if (options?.limit != null) {
        rows = rows.slice(0, options.limit);
      }
      return rows;
    },

    async get(orgId, id) {
      const state = getState();
      const row = (state[collection] as EntityOf<C>[]).find(
        (r) => r.id === id && r.organizationId === orgId,
      );
      return row ?? null;
    },

    async create(orgId, actorId, data) {
      const state = getState();
      const id = newId(collection);
      const ts = nowISO();
      const doc = {
        ...(data as object),
        id,
        organizationId: orgId,
        createdBy: actorId,
        updatedBy: actorId,
        createdAt: ts,
        updatedAt: ts,
      } as EntityOf<C>;
      (state[collection] as EntityOf<C>[]).push(doc);
      return doc;
    },

    async update(orgId, actorId, id, patch) {
      const state = getState();
      const arr = state[collection] as EntityOf<C>[];
      const idx = arr.findIndex((r) => r.id === id && r.organizationId === orgId);
      if (idx === -1) throw new Error(`${collection} ${id} not found in org ${orgId}`);
      const updated = {
        ...arr[idx],
        ...patch,
        id: arr[idx].id,
        organizationId: arr[idx].organizationId,
        createdBy: arr[idx].createdBy,
        createdAt: arr[idx].createdAt,
        updatedBy: actorId,
        updatedAt: nowISO(),
      } as EntityOf<C>;
      arr[idx] = updated;
      return updated;
    },

    async remove(orgId, id) {
      const state = getState();
      const arr = state[collection] as EntityOf<C>[];
      const idx = arr.findIndex((r) => r.id === id && r.organizationId === orgId);
      if (idx !== -1) arr.splice(idx, 1);
    },
  };

  return repo;
}

export type { QueryOptions, BaseDoc, ID };

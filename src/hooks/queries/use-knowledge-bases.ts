"use client";
import useSWR, { SWRConfiguration } from "swr";
import { fetcher } from "lib/utils";
import { KnowledgeBaseEntity } from "@/lib/db/pg/schema.pg";

export function useKnowledgeBases(options: SWRConfiguration = {}) {
  const {
    data: knowledgeBases = [],
    error,
    isLoading,
  } = useSWR<KnowledgeBaseEntity[]>("/api/knowledge", fetcher, {
    revalidateOnFocus: false,
    ...options,
  });

  return {
    knowledgeBases,
    isLoading,
    error,
  };
}

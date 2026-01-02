"use server";

import { pgAgentRepository } from "lib/db/pg/repositories/agent-repository.pg";

export async function incrementAgentUsageAction(id: string) {
  await pgAgentRepository.incrementUsage(id);
}

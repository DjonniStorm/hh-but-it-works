import { sportRankLabel } from "@/shared/lib/labels";

import type { FspParticipant } from "@hh/contracts";

// Имя, разряд и рейтинг одной строкой — шапка карточки участника.
export function participantDetails(participant: FspParticipant): string {
  const parts = [participant.name];
  if (participant.sportRank) {
    parts.push(sportRankLabel[participant.sportRank]);
  }
  if (participant.rating !== null) {
    parts.push(`рейтинг ${participant.rating}`);
  }
  return parts.join(" · ");
}

import type {
  FspAchievement,
  FspHistory,
  FspLinkPreview,
  FspParticipant,
} from "@hh/contracts";
import {
  FspAchievementKind,
  FspAchievementLevel,
  FspSportRank,
} from "@hh/types";

// Ответы ручек ФСП в доменные типы. Как в map-profile: enums @hh/types
// не принимают строковые литералы, поэтому значения проверяем на вхождение.

type ApiAchievement = {
  title: string;
  year: number;
  place: number | null;
  kind: string;
  level: string | null;
  organizer: string | null;
};

type ApiParticipant = {
  fspId: string;
  name: string;
  sportRank: string | null;
  rating: number | null;
  achievements: ApiAchievement[];
};

export function mapFspLinkPreview(preview: {
  status: "found" | "not-found" | "unavailable";
  participant: ApiParticipant | null;
}): FspLinkPreview {
  return {
    status: preview.status,
    participant:
      preview.participant === null ? null : mapParticipant(preview.participant),
  };
}

export function mapFspHistory(history: {
  participant: ApiParticipant | null;
}): FspHistory {
  return {
    participant:
      history.participant === null ? null : mapParticipant(history.participant),
  };
}

function mapParticipant(participant: ApiParticipant): FspParticipant {
  return {
    fspId: participant.fspId,
    name: participant.name,
    sportRank: mapSportRank(participant.sportRank),
    rating: participant.rating,
    achievements: participant.achievements.map(mapFspAchievement),
  };
}

export function mapFspAchievement(item: ApiAchievement): FspAchievement {
  return {
    title: item.title,
    year: item.year,
    place: item.place,
    kind: mapKind(item.kind),
    level: mapLevel(item.level),
    organizer: item.organizer,
  };
}

function mapSportRank(value: string | null): FspSportRank | null {
  if (value === null || !isKnown(value, Object.values(FspSportRank))) {
    return null;
  }
  return value as FspSportRank;
}

// Неизвестный тип читаем как обычные соревнования — карточка не должна роняться.
function mapKind(value: string): FspAchievementKind {
  if (!isKnown(value, Object.values(FspAchievementKind))) {
    return FspAchievementKind.Competition;
  }
  return value as FspAchievementKind;
}

function mapLevel(value: string | null): FspAchievementLevel | null {
  if (value === null || !isKnown(value, Object.values(FspAchievementLevel))) {
    return null;
  }
  return value as FspAchievementLevel;
}

function isKnown(value: string, allowed: string[]): boolean {
  return allowed.includes(value);
}

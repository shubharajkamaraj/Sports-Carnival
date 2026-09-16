import { FootballPenaltyResult } from "@prisma/client";
import { prisma } from "./prisma";

export async function calculateFootballScore(matchId: number) {
  const match = await prisma.match.findUnique({
    where: {
      id: matchId,
    },
    select: {
      team1Id: true,
      team2Id: true,
    },
  });

  if (!match) {
    throw new Error("Match not found.");
  }

  const events = await prisma.footballEvent.findMany({
    where: {
      matchId,
    },
    select: {
      eventType: true,
      teamId: true,
      penaltyResult: true,
    },
  });

  let team1Score = 0;
  let team2Score = 0;

  for (const event of events) {
    let scoringTeamId: number | null = null;

    // Normal goal
    if (event.eventType === "GOAL") {
      scoringTeamId = event.teamId;
    }

    // Own goal
    else if (event.eventType === "OWN_GOAL") {
      scoringTeamId =
        event.teamId === match.team1Id
          ? match.team2Id
          : match.team1Id;
    }

    // Penalty goal
    else if (
      event.eventType === "PENALTY" &&
      event.penaltyResult === FootballPenaltyResult.GOAL
    ) {
      scoringTeamId = event.teamId;
    }

    // Missed penalty = no score

    if (scoringTeamId === match.team1Id) {
      team1Score++;
    } else if (scoringTeamId === match.team2Id) {
      team2Score++;
    }
  }

  return {
    team1Score,
    team2Score,
  };
}

export async function syncFootballScore(matchId: number) {
  const match = await prisma.match.findUnique({
    where: {
      id: matchId,
    },
    select: {
      team1Id: true,
      team2Id: true,
    },
  });

  if (!match) {
    throw new Error("Match not found.");
  }

  const score = await calculateFootballScore(matchId);

  const footballScore = await prisma.footballMatchScore.upsert({
    where: {
      matchId,
    },

    create: {
      matchId,
      team1Id: match.team1Id,
      team2Id: match.team2Id,
      team1Score: score.team1Score,
      team2Score: score.team2Score,
    },

    update: {
      team1Score: score.team1Score,
      team2Score: score.team2Score,
    },
  });

  await prisma.match.update({
    where: {
      id: matchId,
    },

    data: {
      team1Score: score.team1Score,
      team2Score: score.team2Score,
    },
  });

  return footballScore;
}
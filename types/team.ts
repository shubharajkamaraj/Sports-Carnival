export interface TeamPlayer {
  id: number;
  name: string;
  jerseyNo: number;
}

export interface Team {
  id: number;
  name: string;
  captain: string | null;
  game: string;
  playerIds: number[];
  players: TeamPlayer[];
  createdAt?: string;
  updatedAt?: string;
}
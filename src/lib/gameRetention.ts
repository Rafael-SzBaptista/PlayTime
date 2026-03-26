export const AUTO_DELETE_AFTER_DAYS = 7;

type GameDateFields = {
  draw_date: string | null;
  exchange_date: string | null;
};

export function getGameBaseDate(game: GameDateFields): string | null {
  return game.exchange_date ?? game.draw_date;
}

export function getAutoDeleteDate(game: GameDateFields): Date | null {
  const baseDate = getGameBaseDate(game);
  if (!baseDate) return null;

  const eventDate = new Date(`${baseDate}T00:00:00`);
  const deleteDate = new Date(eventDate);
  deleteDate.setDate(deleteDate.getDate() + AUTO_DELETE_AFTER_DAYS);
  deleteDate.setHours(0, 0, 0, 0);
  return deleteDate;
}

export function shouldAutoDeleteGameByDate(game: GameDateFields): boolean {
  const deleteDate = getAutoDeleteDate(game);
  if (!deleteDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today >= deleteDate;
}

export function formatDatePtBr(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}


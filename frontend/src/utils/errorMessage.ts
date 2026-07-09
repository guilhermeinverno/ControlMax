/** Extrai mensagem legível de um valor de erro desconhecido. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

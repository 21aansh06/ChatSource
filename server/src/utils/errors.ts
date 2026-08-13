export class PlanLimitError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'PlanLimitError';
    this.statusCode = 429;
  }
}

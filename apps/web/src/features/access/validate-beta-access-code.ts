export function validateBetaAccessCode(input: string, expectedCode: string | undefined): boolean {
  return expectedCode !== undefined && input.trim() === expectedCode;
}

export const reportSchemaVersion = 'v1';

export { verificationReportSchema } from './report-schema.js';
export type { VerificationReport } from './report-schema.js';
export { acceptancePlanSchema, semanticStepSchema } from './acceptance-plan-schema.js';
export type { AcceptancePlan, AcceptanceCriterion, SemanticStep } from './acceptance-plan-schema.js';
export { testIntentSchema, testIntentTemplateSchema } from './test-intent-schema.js';
export type { TestIntent, TestIntentCheck } from './test-intent-schema.js';

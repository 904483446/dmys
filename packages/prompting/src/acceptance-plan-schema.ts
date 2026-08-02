import { z } from 'zod';

const text = z.string().trim().min(1).max(160);

export const semanticStepSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('assert_text_visible'), text }),
  z.object({ kind: z.literal('assert_text_hidden'), text }),
  z.object({ kind: z.literal('fill_input'), placeholder: text, value: text }),
  z.object({ kind: z.literal('click_button'), name: text }),
  z.object({ kind: z.literal('check_checkbox'), name: text }),
]);

export const acceptancePlanSchema = z.object({
  criteria: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]{1,64}$/),
    title: text,
    sourceRequirement: z.string().trim().min(1).max(500),
    steps: z.array(semanticStepSchema).min(1).max(8),
  })).max(12),
  manualReview: z.array(z.object({
    requirement: z.string().trim().min(1).max(500),
    reason: z.string().trim().min(1).max(300),
  })).max(12),
});

export type AcceptancePlan = z.infer<typeof acceptancePlanSchema>;
export type AcceptanceCriterion = AcceptancePlan['criteria'][number];
export type SemanticStep = AcceptanceCriterion['steps'][number];

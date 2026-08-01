import { z } from 'zod';

export const testIntentTemplateSchema = z.enum([
  'homepage',
  'task_list_add',
  'task_list_blank',
  'task_list_toggle',
  'task_list_filter',
]);

export const testIntentSchema = z.object({
  checks: z.array(z.object({
    template: testIntentTemplateSchema,
    title: z.string().trim().min(1).max(160),
    actionText: z.string().trim().min(1).max(160).optional(),
    expectedText: z.string().trim().min(1).max(160),
    absentText: z.string().trim().min(1).max(160).optional(),
  }).superRefine((check, context) => {
    if (check.template === 'task_list_blank' && check.absentText === undefined)
      context.addIssue({ code: 'custom', message: '该模板必须声明操作后不可见的文本' });
  })).min(1).max(8),
});

export type TestIntent = z.infer<typeof testIntentSchema>;
export type TestIntentCheck = TestIntent['checks'][number];

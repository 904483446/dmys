type CreatedZipJob = { id: string; status: string };

type CreatedZipJobRpcResult = {
  data: CreatedZipJob | null;
  error: { message: string } | null;
};

export function unwrapCreatedZipJobRpcResult({ data, error }: CreatedZipJobRpcResult): CreatedZipJob {
  if (error !== null) throw new Error(error.message);
  if (data === null) throw new Error('JOB_CREATE_FAILED');
  return data;
}

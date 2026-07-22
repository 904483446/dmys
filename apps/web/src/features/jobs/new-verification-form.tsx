'use client';

import { useRef, useState } from 'react';

import { createSupabaseBrowserClient } from '../../lib/supabase/browser-client';
import { resolveSubmissionRedirect } from './resolve-submission-redirect';
import { describeSelectedUpload } from './selected-upload';
import { submitVerification } from './submit-verification';

export function NewVerificationForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedZip, setSelectedZip] = useState<File | null>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  function clearSelectedZip() {
    setSelectedZip(null);
    if (zipInputRef.current !== null) zipInputRef.current.value = '';
  }

  return (
    <form className="task-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const zip = form.get('sourceZip');
        const prd = form.get('prd');
        const requestText = form.get('requestText');
        if (!(zip instanceof File) || typeof requestText !== 'string') return;
        const supabase = createSupabaseBrowserClient();
        if (supabase === null) return setMessage('认证服务尚未配置');
        setSubmitting(true);
        const result = await submitVerification({
          requestText,
          zip,
          ...(prd instanceof File && prd.size > 0 ? { prd } : {}),
          request: async (path, body) => {
            const response = await fetch(path, { method: 'POST', body: JSON.stringify(body) });
            return response.json();
          },
          upload: (path, token, file) =>
            supabase.storage.from('uploads').uploadToSignedUrl(path, token, file),
        });
        setSubmitting(false);
        const redirectTo = resolveSubmissionRedirect(result.ok);
        if (redirectTo !== null) window.location.assign(redirectTo);
        setMessage(result.ok ? '验收任务已创建' : result.message);
      }}
    >
      <p className="eyebrow">项目文件</p>
      <label>
        验收需求
        <textarea name="requestText" required />
      </label>
      <label className="upload-control">
        <span>项目 ZIP</span>
        <input
          ref={zipInputRef}
          className="upload-input"
          name="sourceZip"
          type="file"
          accept=".zip,application/zip"
          required
          onChange={(event) => setSelectedZip(event.currentTarget.files?.[0] ?? null)}
        />
        <span className="file-upload-button">{selectedZip === null ? '选择 ZIP 文件' : '更换 ZIP 文件'}</span>
        {selectedZip === null ? <span className="upload-help">仅支持 .zip，最大 50MB；提交后上传</span> : null}
      </label>
      {selectedZip === null ? null : <SelectedZipRow file={selectedZip} onRemove={clearSelectedZip} />}
      <label className="upload-control">
        <span>补充 PRD（可选）</span>
        <input className="upload-input" name="prd" type="file" accept=".pdf,.docx,.md,.markdown" />
        <span className="file-upload-button">选择 PRD 文件</span>
        <span className="upload-help">支持 PDF、DOCX、MD</span>
      </label>
      <p className="task-note">ZIP 用于本次验收；PRD 可帮助系统理解目标。提交后可在报告中查看状态。</p>
      <button className="primary" type="submit" disabled={submitting}>
        创建验收任务
      </button>
      {message === null ? null : <p role="status">{message}</p>}
    </form>
  );
}

export function SelectedZipRow({
  file,
  onRemove,
}: {
  file: { name: string; size: number };
  onRemove: () => void;
}) {
  return (
    <div className="selected-zip-row">
      <span className="upload-selected">{describeSelectedUpload(file)}</span>
      <button aria-label="移除已选 ZIP" className="selected-zip-remove" onClick={onRemove} type="button">
        移除 ×
      </button>
    </div>
  );
}

// Native execution stays behind an explicit opt-in; ordinary Chat never calls it.
export function createWorkClient(native, target = globalThis) {
  let sequence = 0;
  const pending = new Map();
  const previous = target.__kuanWorkReply;
  target.__kuanWorkReply = (id, event) => {
    const call = pending.get(id);
    if (!call) return previous?.(id, event);
    pending.delete(id); clearTimeout(call.timer);
    event.error ? call.reject(new Error(event.error)) : call.resolve(event.result);
  };
  const status = () => {
    try { return JSON.parse(native?.developerStatus?.() || '{}'); } catch { return {}; }
  };
  function request(operation, args) {
    if (!status().enabled || !native?.workRequest) return Promise.reject(new Error('Local developer mode is unavailable or disabled'));
    return new Promise((resolve, reject) => {
      const id = 'chatwork_' + Date.now().toString(36) + '_' + ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error('Local task acknowledgement timed out. Its original task ID is retained; it was not resubmitted.')); }, operation === 'approve' ? 600000 : 45000);
      pending.set(id, { resolve, reject, timer });
      try { native.workRequest(id, operation, JSON.stringify(args)); }
      catch (error) { pending.delete(id); clearTimeout(timer); reject(error); }
    });
  }
  async function importBlob(scope, file, blob, signal) {
    const check = () => { if (signal?.aborted) throw new DOMException('Local file preparation cancelled', 'AbortError'); };
    check();
    const upload = await request('import_begin', { ...scope, name: file.name, size: blob.size });
    try {
      for (let offset = 0; offset < blob.size; offset += 49152) {
        check();
        const bytes = new Uint8Array(await blob.slice(offset, offset + 49152).arrayBuffer());
        check();
        let binary = ''; for (const value of bytes) binary += String.fromCharCode(value);
        const result = await request('import_chunk', { ...scope, upload: upload.upload, offset, base64: btoa(binary) });
        if (result.written !== offset + bytes.length) throw new Error('Local file import acknowledgement mismatch');
      }
      check();
      return await request('import_finish', { ...scope, upload: upload.upload });
    } catch (error) {
      await request('import_abort', { ...scope, upload: upload.upload }).catch(() => {});
      throw error;
    }
  }
  return { status, request, importBlob,
    dispose() { for (const call of pending.values()) { clearTimeout(call.timer); call.reject(new Error('Local Work view closed; native tasks are retained')); } pending.clear(); }
  };
}

export function applyWorkEvents(state, events) {
  for (const event of events) {
    if (event.type === 'model_attempt') {
      state.attempt = { id: event.id, textOffset: (state.text || '').length, reasoningOffset: (state.reasoning || '').length };
      state.retry = null;
    }
    if (event.type === 'retrying') {
      if (event.discardAttempt && state.attempt?.id === event.discardAttempt) {
        state.text = (state.text || '').slice(0, state.attempt.textOffset);
        state.reasoning = (state.reasoning || '').slice(0, state.attempt.reasoningOffset);
        state.attempt = null;
      }
      state.retry = event; state.status = 'running'; state.checkpoint = !!event.checkpointSaved;
    }
    if (event.type === 'text') state.text = (state.text || '') + (event.text || '');
    if (event.type === 'reasoning_summary') state.reasoning = (state.reasoning || '') + (event.text || '');
    if (event.type === 'context_compaction') state.compaction = event;
    if (event.type === 'terminal_command') state.command = { command: event.command || '', cwd: event.cwd || 'project' };
    if (event.type === 'approval') { state.approvals = event.items || []; state.status = 'approval'; }
    if (event.type === 'approval_decision') state.approvals = (state.approvals || []).filter(row => row.callId !== event.callId);
    if (event.type === 'terminal') {
      const binary = atob(state.terminalCarry || '') + atob(event.base64 || '');
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      let end = bytes.length, start = end - 1;
      while (start >= Math.max(0, end - 4) && (bytes[start] & 0xc0) === 0x80) start--;
      if (start >= 0) {
        const lead = bytes[start], length = lead >= 0xf0 && lead <= 0xf4 ? 4 : lead >= 0xe0 && lead <= 0xef ? 3 : lead >= 0xc2 && lead <= 0xdf ? 2 : 1;
        if (end - start < length) end = start;
      }
      state.terminalCarry = btoa(String.fromCharCode(...bytes.subarray(end)));
      state.terminal = ((state.terminal || '') + new TextDecoder().decode(bytes.subarray(0, end))).slice(-16000);
    }
    if (event.type === 'tool_result') {
      state.lastTool = event.name;
      if (event.name === 'run_command' || event.name === 'ssh_command') state.command = { command: event.result?.command || '', cwd: event.result?.cwd || 'project', exit_code: event.result?.exit_code };
      if (event.name === 'update_plan') state.plan = event.result.steps || [];
      if (event.name === 'write_file' || event.name === 'patch_file' || event.name === 'android_build')
        state.artifacts = [...(state.artifacts || []), { name: event.name, ...event.result }].slice(-40);
    }
    if (['started', 'resumed'].includes(event.type)) { state.status = 'running'; state.retry = null; }
    if (['completed', 'failed', 'cancelled', 'interrupted'].includes(event.type)) {
      state.status = event.type; state.error = event.message || ''; state.approvals = []; state.retry = null;
      if (state.terminalCarry) { state.terminal = ((state.terminal || '') + new TextDecoder().decode(Uint8Array.from(atob(state.terminalCarry), c => c.charCodeAt(0)))).slice(-16000); state.terminalCarry = ''; }
      if (event.type === 'completed' && event.text) state.text = event.text;
      state.checkpoint = !!event.checkpointSaved;
    }
  }
  return state;
}

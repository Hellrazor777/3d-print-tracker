import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtTime(minutes) {
  if (!minutes || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtDuration(seconds) {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtAgo(ts) {
  if (!ts) return null;
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5)   return 'just now';
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function fmtEta(minutes) {
  if (!minutes || minutes <= 0) return null;
  const d = new Date(Date.now() + minutes * 60000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(ts) {
  if (!ts) return '—';
  // ts may be a Unix timestamp in seconds or milliseconds, or an ISO string
  const ms = typeof ts === 'string' ? Date.parse(ts) : ts > 1e12 ? ts : ts * 1000;
  const d = new Date(ms);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function stateLabel(s) {
  const map = { RUNNING: 'Printing', IDLE: 'Idle', PAUSE: 'Paused', FAILED: 'Failed', FINISH: 'Finished', OFFLINE: 'Offline', UNKNOWN: 'Unknown' };
  return map[s] || s || 'Unknown';
}

function stateColor(s) {
  if (s === 'RUNNING') return 'var(--green-text, #22c55e)';
  if (s === 'PAUSE')   return 'var(--amber-text, #f59e0b)';
  if (s === 'FAILED')  return 'var(--red-text, #ef4444)';
  if (s === 'FINISH')  return 'var(--accent, #5b8dee)';
  if (s === 'OFFLINE') return 'var(--text2)';
  return 'var(--text2)';
}

// Convert Bambu AMS hex color (RRGGBBAA) to a CSS hex color (#RRGGBB)
function amsHexColor(raw) {
  if (!raw) return '#888888';
  const s = raw.replace('#', '').padEnd(6, '0');
  return '#' + s.slice(0, 6);
}

// Determine whether a color is dark (for text contrast)
function isDark(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

// ─── TempGauge ────────────────────────────────────────────────────────────────

function TempGauge({ label, current, target }) {
  const pct = target > 0 ? Math.min(current / target, 1) : 0;
  return (
    <div style={{ textAlign: 'center', minWidth: 80 }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{Math.round(current)}°C</div>
      <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 1 }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text2)' }}>/ {Math.round(target)}°C</div>
      <div style={{ marginTop: 4, height: 3, background: 'var(--border2)', borderRadius: 2 }}>
        <div style={{ width: `${Math.round(pct * 100)}%`, height: '100%', background: 'var(--accent, #5b8dee)', borderRadius: 2, transition: 'width .6s' }} />
      </div>
    </div>
  );
}

// ─── AmsDisplay ──────────────────────────────────────────────────────────────

function AmsDisplay({ ams }) {
  if (!ams) return null;
  const units = ams.ams || [];
  if (!units.length) return null;
  const nowTray = parseInt(ams.tray_now ?? -1, 10);

  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '0.5px solid var(--border)' }}>
      <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        AMS
      </div>
      {units.map((unit, ui) => (
        <div key={ui} style={{ display: 'flex', gap: 4, marginBottom: ui < units.length - 1 ? 4 : 0 }}>
          {(unit.tray || []).map((tray, ti) => {
            const globalIdx = ui * 4 + ti;
            const isActive = globalIdx === nowTray;
            const color = amsHexColor(tray.tray_color);
            const hasFilament = !!(tray.tray_type);
            const textColor = hasFilament ? (isDark(color) ? '#fff' : '#000') : 'var(--text2)';
            const label = tray.tray_type ? tray.tray_type.slice(0, 4) : '';
            const tooltip = hasFilament
              ? `${tray.tray_sub_brands || tray.tray_type} — ${tray.tray_color || ''}${tray.remain >= 0 ? ` (${tray.remain}%)` : ''}`
              : 'Empty';
            return (
              <div
                key={ti}
                title={tooltip}
                style={{
                  width: 32, height: 32, borderRadius: 5,
                  background: hasFilament ? color : 'var(--bg3, var(--bg))',
                  border: isActive
                    ? '2px solid var(--accent, #5b8dee)'
                    : '0.5px solid var(--border2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 7, color: textColor, fontWeight: 700,
                  position: 'relative', flexShrink: 0, cursor: 'default',
                  boxShadow: isActive ? '0 0 0 1px var(--accent, #5b8dee)' : 'none',
                }}
              >
                {label}
                {isActive && (
                  <span style={{
                    position: 'absolute', top: -5, right: -5,
                    width: 9, height: 9, borderRadius: '50%',
                    background: 'var(--accent, #5b8dee)',
                    border: '1.5px solid var(--bg2)',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Camera modal ─────────────────────────────────────────────────────────────

function CameraModal({ device, onClose }) {
  const serial    = device.dev_id;
  const name      = device.name || device.dev_product_name || serial;
  const [frame,   setFrame]   = useState(null);
  const [error,   setError]   = useState('');
  const [running, setRunning] = useState(false);

  // ip/accessCode are auto-resolved by the backend from the cloud device list
  const start = useCallback(async () => {
    setError(''); setRunning(true); setFrame(null);
    const res = await window.electronAPI.printerBambuCameraStart(serial, '', '');
    if (res?.error) { setError(res.error); setRunning(false); }
  }, [serial]);

  const stop = useCallback(() => {
    window.electronAPI.printerBambuCameraStop(serial);
    setRunning(false);
  }, [serial]);

  // Subscribe to frames for this serial
  useEffect(() => {
    start();
    const unsub = window.electronAPI.onBambuCameraFrame((_, { serial: s, dataUrl, error: err }) => {
      if (s !== serial) return;
      if (err) { setError(err); setRunning(false); return; }
      if (dataUrl) setFrame(dataUrl);
    });
    return () => { stop(); unsub(); };
  }, [serial, start, stop]);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.75)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{ background: 'var(--bg2)', borderRadius: 14, overflow: 'hidden', maxWidth: 820, width: '95vw', boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>📷 {name}</span>
          <button className="btn" style={{ fontSize: 11, padding: '2px 10px' }}
            onClick={running ? stop : start}>
            {running ? '⏹ Stop' : '▶ Start'}
          </button>
          <button className="btn" style={{ fontSize: 13, padding: '2px 8px' }} onClick={onClose}>✕</button>
        </div>

        {/* Feed */}
        <div style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, position: 'relative' }}>
          {frame ? (
            <img
              src={frame}
              alt="Camera feed"
              style={{ width: '100%', display: 'block', maxHeight: '65vh', objectFit: 'contain' }}
            />
          ) : (
            <div style={{ padding: 40, color: '#aaa', fontSize: 13, textAlign: 'center' }}>
              {error
                ? <><div style={{ color: '#ef4444', marginBottom: 6 }}>⚠ {error}</div><div style={{ fontSize: 11 }}>Make sure the printer is online and on your local network</div></>
                : running
                  ? 'Connecting…'
                  : 'Press Start to connect'}
            </div>
          )}
          {/* Live indicator */}
          {frame && (
            <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.55)', color: '#22c55e', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
              ● LIVE
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--text2)', borderTop: '0.5px solid var(--border)' }}>
          {device.ip ? `${device.ip}:6000` : 'Auto-connect via cloud · local network'} · JPEG stream
        </div>
      </div>
    </div>
  );
}


// ─── Printer card ─────────────────────────────────────────────────────────────

function PrinterCard({ device, state, onRefresh, onCameraClick }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    // Tick every 10s so "last seen X ago" stays fresh
    const id = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(id);
  }, []);

  const name = device.name || device.dev_product_name || device.dev_id || 'Printer';
  const model = device.dev_product_name || device.type || '';
  const gstate = state?.gcode_state || (state?.status) || 'OFFLINE';
  const isPrinting = gstate === 'RUNNING';
  const isOffline = !state || gstate === 'OFFLINE';
  const progress = state?.progress ?? 0;
  const eta = fmtEta(state?.remaining_min);
  const lastSeen = state?.ts ? fmtAgo(state.ts) : null;

  return (
    <div style={{
      background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 12,
      padding: 0, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg3, var(--bg))', border: '0.5px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            🖨
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            {model && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>{model}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500,
              background: isOffline ? 'var(--bg3, var(--bg))' : isPrinting ? 'rgba(34,197,94,.15)' : 'var(--bg3, var(--bg))',
              color: stateColor(gstate), border: `0.5px solid ${stateColor(gstate)}44`,
            }}>{stateLabel(gstate)}</span>
            <button
              className="btn"
              style={{ padding: '2px 8px', fontSize: 11, color: 'var(--accent, #5b8dee)' }}
              title="View camera"
              onClick={onCameraClick}
            >📷</button>
            <button className="btn" style={{ padding: '2px 8px', fontSize: 11 }} title="Refresh status" onClick={onRefresh}>↻</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          {state?.wifi && (
            <div style={{ fontSize: 10, color: 'var(--text2)' }}>📶 {state.wifi}</div>
          )}
          {lastSeen && (
            <div style={{ fontSize: 10, color: 'var(--text2)' }}>Updated {lastSeen}</div>
          )}
        </div>
      </div>

      {/* Print progress */}
      <div style={{ padding: '12px 16px' }}>
        {isPrinting || gstate === 'PAUSE' ? (
          <>
            {state?.file && (
              <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📄 {state.file}
              </div>
            )}
            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ flex: 1, height: 8, background: 'var(--border2)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: gstate === 'PAUSE' ? 'var(--amber-text, #f59e0b)' : 'var(--accent, #5b8dee)', borderRadius: 4, transition: 'width .6s' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', minWidth: 36, textAlign: 'right' }}>{progress}%</span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>
              <span>⏱ {fmtTime(state.remaining_min)} remaining</span>
              {eta && <span>ETA {eta}</span>}
              {state.layer > 0 && <span>Layer {state.layer}{state.total_layers > 0 ? ` / ${state.total_layers}` : ''}</span>}
            </div>
          </>
        ) : gstate === 'FINISH' ? (
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
            ✅ {state?.file ? `Finished: ${state.file}` : 'Print complete'}
          </div>
        ) : isOffline ? (
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
            No data yet — waiting for response
            <div style={{ fontSize: 10, marginTop: 2 }}>Printer may be offline, sleeping, or in LAN-only mode</div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
            Idle
          </div>
        )}

        {/* Temperatures */}
        {state && !isOffline && (
          <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 8, borderTop: '0.5px solid var(--border)' }}>
            <TempGauge label="Nozzle" current={state.nozzle_temp ?? 0} target={state.nozzle_target ?? 0} />
            <div style={{ width: '0.5px', background: 'var(--border)' }} />
            <TempGauge label="Bed" current={state.bed_temp ?? 0} target={state.bed_target ?? 0} />
          </div>
        )}

        {/* AMS trays */}
        {state && state.ams && <AmsDisplay ams={state.ams} />}
      </div>
    </div>
  );
}

// ─── Bambu login form ─────────────────────────────────────────────────────────

async function finishBambuLogin(accessToken, refreshToken, onConnected, setError, setBusy, setStep) {
  try {
    const devRes = await window.electronAPI.printerBambuGetDevices(accessToken);
    const devices = Array.isArray(devRes) ? devRes : [];
    const uidRes  = await window.electronAPI.printerBambuGetUid(accessToken);
    const uid     = uidRes?.uid || null;
    const auth    = { accessToken, refreshToken: refreshToken || null, devices, uid };
    await window.electronAPI.printerBambuConnect(auth);
    onConnected(auth);
  } catch (e) {
    setError(e.message || 'Failed to connect');
    setBusy(false);
    setStep('credentials');
  }
}

function BambuLogin({ onConnected }) {
  // step: 'credentials' | 'verify-code' | 'tfa' | 'token' | 'connecting'
  const [step,        setStep]        = useState('credentials');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [code,        setCode]        = useState('');
  const [tfaKey,      setTfaKey]      = useState('');
  const [manualToken, setManualToken] = useState('');
  const [busy,        setBusy]        = useState(false);
  const [error,       setError]       = useState('');

  // ── Step 1: email + password ─────────────────────────────────────────────
  const doLogin = async () => {
    if (!email.trim() || !password) return;
    setBusy(true); setError('');
    const r = await window.electronAPI.printerBambuLogin(email.trim(), password);
    if (r?.error) { setError(r.error); setBusy(false); return; }
    if (r?.loginType === 'verifyCode') { setStep('verify-code'); setBusy(false); return; }
    if (r?.loginType === 'tfa')        { setTfaKey(r.tfaKey || ''); setStep('tfa'); setBusy(false); return; }
    if (r?.accessToken) {
      setStep('connecting');
      await finishBambuLogin(r.accessToken, r.refreshToken, onConnected, setError, setBusy, setStep);
      return;
    }
    setError('Unexpected response — please try again'); setBusy(false);
  };

  // ── Step 2a: email verification code ────────────────────────────────────
  const doVerifyCode = async () => {
    if (!code.trim()) return;
    setBusy(true); setError('');
    const r = await window.electronAPI.printerBambuVerifyCode(email.trim(), code.trim());
    if (r?.error) { setError(r.error); setBusy(false); return; }
    if (r?.accessToken) {
      setStep('connecting');
      await finishBambuLogin(r.accessToken, r.refreshToken, onConnected, setError, setBusy, setStep);
      return;
    }
    setError('Invalid code — please try again'); setBusy(false);
  };

  // ── Step 2b: TFA authenticator code ─────────────────────────────────────
  const doVerifyTfa = async () => {
    if (!code.trim()) return;
    setBusy(true); setError('');
    const r = await window.electronAPI.printerBambuVerify(email.trim(), tfaKey, code.trim());
    const token = r?.token || r?.accessToken;
    if (r?.error) { setError(r.error); setBusy(false); return; }
    if (token) {
      setStep('connecting');
      await finishBambuLogin(token, r?.refreshToken, onConnected, setError, setBusy, setStep);
      return;
    }
    setError('Invalid code — please try again'); setBusy(false);
  };

  // ── Manual token paste ───────────────────────────────────────────────────
  const doTokenConnect = async () => {
    if (!manualToken.trim()) return;
    setBusy(true); setError(''); setStep('connecting');
    await finishBambuLogin(manualToken.trim(), null, onConnected, setError, setBusy, setStep);
  };

  // ── Web browser login ────────────────────────────────────────────────────
  const doWebLogin = async () => {
    setBusy(true); setError('');
    try {
      const r = await window.electronAPI.printerBambuWebLogin();
      if (r?.error) { setError(r.error); setBusy(false); return; }
      const token = r?.accessToken || r?.token;
      if (token) {
        setStep('connecting');
        await finishBambuLogin(token, r?.refreshToken, onConnected, setError, setBusy, setStep);
        return;
      }
      setError('No token captured — please try again'); setBusy(false);
    } catch (e) { setError(e.message || 'Web login failed'); setBusy(false); }
  };

  const onKey = (fn) => (e) => { if (e.key === 'Enter') fn(); };

  const card = (children) => (
    <div style={{ maxWidth: 420, padding: 20, background: 'var(--bg2)', borderRadius: 12, border: '0.5px solid var(--border2)' }}>
      {children}
    </div>
  );

  const title = (t, sub) => (
    <>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: sub ? 4 : 16 }}>Connect Bambu Lab</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>{sub}</div>}
      {t && t !== 'Connect Bambu Lab' && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14, marginTop: -8 }}>{t}</div>}
    </>
  );

  const errMsg = error && (
    <div style={{ fontSize: 12, color: 'var(--red-text, #ef4444)', marginBottom: 10 }}>{error}</div>
  );

  // ── Connecting spinner ───────────────────────────────────────────────────
  if (step === 'connecting') { return card(
    <>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Connect Bambu Lab</div>
      <div style={{ fontSize: 12, color: 'var(--text2)' }}>Connecting to Bambu Cloud…</div>
    </>
  ); }

  // ── Manual token paste ───────────────────────────────────────────────────
  if (step === 'token') { return card(
    <>
      {title('Connect Bambu Lab', 'Paste an access token you already have.')}
      <div className="field" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12 }}>Access Token</label>
        <input
          value={manualToken} onChange={e => setManualToken(e.target.value)}
          onKeyDown={onKey(doTokenConnect)}
          placeholder="Paste your Bambu access token…"
          style={{ fontFamily: 'monospace', fontSize: 11 }}
          autoFocus
        />
      </div>
      {errMsg}
      <button className="btn btn-primary" style={{ width: '100%', marginBottom: 8 }}
        disabled={!manualToken.trim() || busy} onClick={doTokenConnect}>
        {busy ? 'Connecting…' : 'Connect'}
      </button>
      <button className="btn" style={{ width: '100%', fontSize: 12 }}
        onClick={() => { setStep('credentials'); setError(''); }}>
        ← Back
      </button>
    </>
  ); }

  // ── TFA authenticator code ───────────────────────────────────────────────
  if (step === 'tfa') { return card(
    <>
      {title('Connect Bambu Lab', 'Enter the 6-digit code from your authenticator app.')}
      <div className="field" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12 }}>Authenticator Code</label>
        <input value={code} onChange={e => setCode(e.target.value)}
          onKeyDown={onKey(doVerifyTfa)}
          placeholder="6-digit code" maxLength={6} autoFocus
          style={{ letterSpacing: 4, fontSize: 18, textAlign: 'center' }}
        />
      </div>
      {errMsg}
      <button className="btn btn-primary" style={{ width: '100%', marginBottom: 8 }}
        disabled={!code.trim() || busy} onClick={doVerifyTfa}>
        {busy ? 'Verifying…' : 'Verify'}
      </button>
      <button className="btn" style={{ width: '100%', fontSize: 12 }}
        onClick={() => { setStep('credentials'); setCode(''); setError(''); }}>
        ← Back
      </button>
    </>
  ); }

  // ── Email verification code ──────────────────────────────────────────────
  if (step === 'verify-code') { return card(
    <>
      {title('Connect Bambu Lab', `A verification code was sent to ${email}. Enter it below.`)}
      <div className="field" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12 }}>Verification Code</label>
        <input value={code} onChange={e => setCode(e.target.value)}
          onKeyDown={onKey(doVerifyCode)}
          placeholder="6-digit code" maxLength={8} autoFocus
          style={{ letterSpacing: 4, fontSize: 18, textAlign: 'center' }}
        />
      </div>
      {errMsg}
      <button className="btn btn-primary" style={{ width: '100%', marginBottom: 8 }}
        disabled={!code.trim() || busy} onClick={doVerifyCode}>
        {busy ? 'Verifying…' : 'Verify'}
      </button>
      <button className="btn" style={{ width: '100%', fontSize: 12 }}
        onClick={() => { setStep('credentials'); setCode(''); setError(''); }}>
        ← Back
      </button>
    </>
  ); }

  // ── Credentials (default) ────────────────────────────────────────────────
  return card(
    <>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Connect Bambu Lab</div>
      <div className="field" style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12 }}>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={onKey(doLogin)}
          placeholder="your@email.com" type="email" autoFocus
        />
      </div>
      <div className="field" style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12 }}>Password</label>
        <input value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={onKey(doLogin)}
          placeholder="Password" type="password"
        />
      </div>
      {errMsg}
      <button className="btn btn-primary" style={{ width: '100%', marginBottom: 8 }}
        disabled={!email.trim() || !password || busy} onClick={doLogin}>
        {busy ? 'Signing in…' : 'Sign In'}
      </button>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" style={{ flex: 1, fontSize: 12 }} disabled={busy} onClick={doWebLogin}>
          🌐 Browser Login
        </button>
        <button className="btn" style={{ flex: 1, fontSize: 12 }}
          onClick={() => { setStep('token'); setError(''); }}>
          Paste Token
        </button>
      </div>
    </>
  );
}

// ─── Print history + power cost ───────────────────────────────────────────────

function defaultWatts(deviceName) {
  const n = (deviceName || '').toLowerCase();
  if (n.includes('p1s')) return 350;
  if (n.includes('p1p')) return 300;
  if (n.includes('x1c') || n.includes('x1e')) return 400;
  if (n.includes('a1')) return 250;
  return 350; // sensible default
}

function PrintHistory({ accessToken, devices, powerSettings, onSavePowerSettings }) {
  const [tasks,     setTasks]     = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [expanded,  setExpanded]  = useState(false);
  const [showPower, setShowPower] = useState(false);

  // Editable power/filament settings (local state — committed on Save)
  const [rate,          setRate]          = useState(String(powerSettings?.ratePerKwh ?? '0.30'));
  const [filamentPrice, setFilamentPrice] = useState(String(powerSettings?.filamentPricePerKg ?? '25.00'));
  const [wattMap,       setWattMap]       = useState(powerSettings?.wattsBySerial ?? {});

  // Build device lookup: serial → name/model
  const devMap = {};
  (devices || []).forEach(d => { devMap[d.dev_id] = d.name || d.dev_product_name || d.dev_id; });

  const effectiveRate          = parseFloat(powerSettings?.ratePerKwh)         || 0.30;
  const effectiveFilamentPrice = parseFloat(powerSettings?.filamentPricePerKg) || 25.00;

  function getWatts(deviceId) {
    if (powerSettings?.wattsBySerial?.[deviceId]) return Number(powerSettings.wattsBySerial[deviceId]);
    return defaultWatts(devMap[deviceId] || deviceId);
  }

  function calcPower(deviceId, costTimeSec) {
    const hours = (costTimeSec || 0) / 3600;
    const watts = getWatts(deviceId);
    const kwh = (watts * hours) / 1000;
    return { kwh, cost: kwh * effectiveRate };
  }

  function calcFilament(weightG) {
    const g = parseFloat(weightG) || 0;
    return (g / 1000) * effectiveFilamentPrice;
  }

  const load = useCallback(async () => {
    if (!accessToken || !window.electronAPI?.printerBambuGetTasks) return;
    setLoading(true); setError('');
    try {
      const r = await window.electronAPI.printerBambuGetTasks(accessToken, 1, 30);
      if (r?.error) { setError(r.error); setLoading(false); return; }
      const list = r?.hits || r?.tasks || [];
      setTasks(list);
    } catch (e) { setError(e.message || 'Failed to load history'); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    if (expanded && tasks === null && !loading) { load(); }
  }, [expanded, tasks, loading, load]);

  function savePower() {
    const parsed = parseFloat(rate);
    const parsedFil = parseFloat(filamentPrice);
    if (isNaN(parsed) || parsed <= 0) return;
    const newSettings = {
      ratePerKwh: parsed,
      filamentPricePerKg: isNaN(parsedFil) ? 25 : parsedFil,
      wattsBySerial: wattMap,
    };
    onSavePowerSettings(newSettings);
    setShowPower(false);
  }

  // Aggregate totals
  const totals = { kwh: 0, powerCost: 0, filamentCost: 0, weightG: 0, prints: 0 };
  if (tasks) {
    tasks.forEach(t => {
      const deviceId = t.deviceId || t.dev_id || '';
      const { kwh, cost } = calcPower(deviceId, t.costTime || t.printTime || 0);
      const weightG = parseFloat(t.weight || t.filamentWeight || t.filament_weight || 0);
      const filCost = calcFilament(weightG);
      totals.kwh += kwh;
      totals.powerCost += cost;
      totals.filamentCost += filCost;
      totals.weightG += weightG;
      totals.prints++;
    });
  }

  return (
    <div style={{ marginTop: 24, background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Section header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, userSelect: 'none' }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>📋 Print History & Cost</span>
        {tasks && !loading && (
          <span style={{ fontSize: 11, color: 'var(--text2)' }}>
            {totals.prints} prints · {totals.kwh.toFixed(2)} kWh · {totals.weightG > 0 ? `${totals.weightG.toFixed(0)}g · ` : ''}${(totals.powerCost + totals.filamentCost).toFixed(2)} total
          </span>
        )}
        <span style={{ fontSize: 11, color: 'var(--text2)', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>▶</span>
      </div>

      {expanded && (
        <div style={{ borderTop: '0.5px solid var(--border)' }}>
          {/* Power settings bar */}
          <div style={{ padding: '10px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>
              ⚡ ${effectiveRate.toFixed(2)}/kWh · 🧵 ${effectiveFilamentPrice.toFixed(2)}/kg
            </span>
            <button className="btn" style={{ fontSize: 11, padding: '2px 10px' }} onClick={() => setShowPower(s => !s)}>
              {showPower ? 'Hide Settings' : 'Power Settings'}
            </button>
            <button className="btn" style={{ fontSize: 11, padding: '2px 10px' }} onClick={load} disabled={loading}>
              {loading ? 'Loading…' : '↻ Refresh'}
            </button>
          </div>

          {/* Inline power settings editor */}
          {showPower && (
            <div style={{ padding: '12px 16px', background: 'var(--bg3, var(--bg))', borderBottom: '0.5px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Cost Settings</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <label style={{ fontSize: 12, minWidth: 160, color: 'var(--text2)' }}>Electricity ($/kWh)</label>
                <input
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                  style={{ width: 80, fontSize: 12, padding: '3px 6px' }}
                  type="number" min="0" step="0.01"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <label style={{ fontSize: 12, minWidth: 160, color: 'var(--text2)' }}>Filament ($/kg)</label>
                <input
                  value={filamentPrice}
                  onChange={e => setFilamentPrice(e.target.value)}
                  style={{ width: 80, fontSize: 12, padding: '3px 6px' }}
                  type="number" min="0" step="0.50"
                />
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Wattage per printer</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {(devices || []).map(d => {
                  const serial = d.dev_id;
                  const name = d.name || d.dev_product_name || serial;
                  const fallback = defaultWatts(d.dev_product_name || '');
                  const val = wattMap[serial] ?? '';
                  return (
                    <div key={serial} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, flex: 1, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                      <input
                        value={val}
                        placeholder={String(fallback) + 'W'}
                        onChange={e => setWattMap(m => ({ ...m, [serial]: e.target.value }))}
                        style={{ width: 80, fontSize: 12, padding: '3px 6px' }}
                        type="number" min="1"
                      />
                      <span style={{ fontSize: 11, color: 'var(--text2)' }}>W</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={savePower}>Save</button>
                <button className="btn" style={{ fontSize: 12 }} onClick={() => setShowPower(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 16px', fontSize: 12, color: 'var(--red-text, #ef4444)' }}>{error}</div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ padding: '16px', fontSize: 12, color: 'var(--text2)' }}>Loading print history…</div>
          )}

          {/* Tasks table */}
          {tasks && !loading && tasks.length === 0 && (
            <div style={{ padding: '16px', fontSize: 12, color: 'var(--text2)' }}>No print history found.</div>
          )}

          {tasks && !loading && tasks.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                    {['Date', 'File', 'Printer', 'Duration', 'kWh', 'Power $', 'Weight (g)', 'Filament $', 'Total $', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t, i) => {
                    const deviceId  = t.deviceId || t.dev_id || '';
                    const devName   = devMap[deviceId] || deviceId || '—';
                    const costSec   = t.costTime || t.printTime || 0;
                    const weightG   = parseFloat(t.weight || t.filamentWeight || t.filament_weight || 0);
                    const { kwh, cost: powerCost } = calcPower(deviceId, costSec);
                    const filCost   = calcFilament(weightG);
                    const totalCost = powerCost + filCost;
                    const status    = t.status || '';
                    const statusColor = status === 'FINISH' || status === 'finish' ? 'var(--green-text, #22c55e)'
                      : status === 'FAILED' || status === 'failed' ? 'var(--red-text, #ef4444)'
                      : 'var(--text2)';
                    return (
                      <tr key={t.id || i} style={{ borderBottom: '0.5px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg3, rgba(0,0,0,.03))' }}>
                        <td style={{ padding: '7px 12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmtDate(t.createTime || t.startTime || t.start_time)}</td>
                        <td style={{ padding: '7px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}
                            title={t.name || t.title || t.fileName || ''}>{t.name || t.title || t.fileName || '—'}</td>
                        <td style={{ padding: '7px 12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{devName}</td>
                        <td style={{ padding: '7px 12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmtDuration(costSec)}</td>
                        <td style={{ padding: '7px 12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{kwh > 0 ? kwh.toFixed(3) : '—'}</td>
                        <td style={{ padding: '7px 12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{powerCost > 0 ? `$${powerCost.toFixed(3)}` : '—'}</td>
                        <td style={{ padding: '7px 12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{weightG > 0 ? weightG.toFixed(1) : '—'}</td>
                        <td style={{ padding: '7px 12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{filCost > 0 ? `$${filCost.toFixed(3)}` : '—'}</td>
                        <td style={{ padding: '7px 12px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' }}>{totalCost > 0 ? `$${totalCost.toFixed(3)}` : '—'}</td>
                        <td style={{ padding: '7px 12px', whiteSpace: 'nowrap', color: statusColor, fontWeight: 500, textTransform: 'capitalize' }}>{status.toLowerCase() || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '0.5px solid var(--border2)' }}>
                    <td colSpan={4} style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Total ({totals.prints} prints)</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{totals.kwh.toFixed(2)}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>${totals.powerCost.toFixed(2)}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{totals.weightG > 0 ? totals.weightG.toFixed(0) : '—'}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>${totals.filamentCost.toFixed(2)}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: 'var(--accent, #5b8dee)' }}>${(totals.powerCost + totals.filamentCost).toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function PrintersView() {
  const { appSettings, printerStatus, bambuConn, saveBambuAuth, saveSnapmakerPrinters, saveAppSettings, isElectron } = useApp();
  const [showAddSnap,   setShowAddSnap]   = useState(false);
  const [cameraSerial,  setCameraSerial]  = useState(null); // serial whose camera modal is open

  const bambuAuth    = appSettings.bambuAuth;
  const bambuDevices = bambuAuth?.devices || [];
  const snapPrinters = appSettings.printers?.filter(p => p.type === 'snapmaker') || [];
  const powerSettings  = appSettings.powerSettings  || null;

  const handleBambuConnected = useCallback(async (auth) => {
    await saveBambuAuth(auth);
  }, [saveBambuAuth]);

  const handleDisconnectBambu = useCallback(async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.printerBambuDisconnect();
    await saveBambuAuth(null);
  }, [saveBambuAuth]);

  const handleReconnectBambu = useCallback(() => {
    if (!window.electronAPI || !bambuAuth?.accessToken) return;
    window.electronAPI.printerBambuConnect(bambuAuth);
  }, [bambuAuth]);

  const handleRefreshBambu = useCallback((serial) => {
    if (!window.electronAPI) return;
    window.electronAPI.printerBambuRefreshStatus(serial || null);
  }, []);

  const handleRemoveSnap = useCallback(async (id) => {
    if (!window.electronAPI) return;
    window.electronAPI.printerSnapStop(id);
    const next = snapPrinters.filter(p => p.id !== id);
    await saveSnapmakerPrinters(next);
  }, [snapPrinters, saveSnapmakerPrinters]);

  const handleSnapSaved = useCallback(async (printers) => {
    await saveSnapmakerPrinters(printers);
    setShowAddSnap(false);
  }, [saveSnapmakerPrinters]);

  const handleSavePowerSettings = useCallback(async (ps) => {
    await saveAppSettings({ ...appSettings, powerSettings: ps });
  }, [appSettings, saveAppSettings]);

  const handleCameraClick = useCallback((serial) => {
    setCameraSerial(serial);
  }, []);

  const hasBambu = !!(bambuAuth?.accessToken);
  const totalPrinters = bambuDevices.length + snapPrinters.length;
  const printing = [...bambuDevices, ...snapPrinters].filter(d => {
    const key = d.dev_id || d.id;
    const s = printerStatus[key];
    return s?.gcode_state === 'RUNNING' || s?.status === 'RUNNING';
  }).length;

  if (!isElectron) {
    return <p style={{ color: 'var(--text2)', fontSize: 13, padding: '1rem 0' }}>Printer monitoring is only available in the desktop app.</p>;
  }

  return (
    <div>
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 16 }}>
          {hasBambu && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: bambuConn.connected ? 'var(--green-text, #22c55e)' : (bambuConn.connecting || bambuConn.reconnecting) ? 'var(--amber-text, #f59e0b)' : 'var(--text2)', display: 'inline-block' }} />
              Bambu Cloud {bambuConn.connected ? 'connected' : bambuConn.connecting ? 'connecting…' : bambuConn.reconnecting ? 'reconnecting…' : 'disconnected'}
              {bambuConn.error && <span style={{ color: 'var(--red-text, #ef4444)', fontSize: 11 }}> — {bambuConn.error}</span>}
            </span>
          )}
          {totalPrinters > 0 && (
            <span>
              {totalPrinters} printer{totalPrinters !== 1 ? 's' : ''} · {printing} printing
            </span>
          )}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {hasBambu && bambuConn.connected && (
            <button className="btn" style={{ fontSize: 12 }} onClick={() => handleRefreshBambu(null)}>↻ Refresh all</button>
          )}
          {hasBambu && !bambuConn.connected && !bambuConn.connecting && !bambuConn.reconnecting && (
            <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={handleReconnectBambu}>Reconnect Bambu</button>
          )}
          {hasBambu && (
            <button className="btn" style={{ fontSize: 12, color: 'var(--red-text, #ef4444)' }} onClick={handleDisconnectBambu}>Disconnect</button>
          )}
          <button className="btn" style={{ fontSize: 12 }} onClick={() => setShowAddSnap(true)}>+ Snapmaker</button>
        </div>
      </div>

      {/* Bambu login — shown when not connected */}
      {!hasBambu && (
        <BambuLogin onConnected={handleBambuConnected} />
      )}

      {/* Printer grid */}
      {totalPrinters > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {bambuDevices.map(device => {
            const serial = device.dev_id;
            const state = printerStatus[serial];
            return (
              <PrinterCard
                key={serial}
                device={{ ...device, name: device.name || device.dev_product_name || 'Bambu Printer' }}
                state={state}
                onRefresh={() => handleRefreshBambu(serial)}
                onCameraClick={() => handleCameraClick(serial)}
              />
            );
          })}

          {snapPrinters.map(printer => {
            const state = printerStatus[printer.id];
            return (
              <div key={printer.id} style={{ position: 'relative' }}>
                <PrinterCard
                  device={{ ...printer, dev_product_name: 'Snapmaker' }}
                  state={state}
                  onRefresh={() => {}}
                />
                <button
                  className="btn"
                  style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, color: 'var(--red-text, #ef4444)', padding: '2px 6px' }}
                  onClick={() => handleRemoveSnap(printer.id)}
                  title="Remove printer"
                >✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state when signed into Bambu but no devices found */}
      {hasBambu && bambuDevices.length === 0 && snapPrinters.length === 0 && (
        <div style={{ color: 'var(--text2)', fontSize: 13, paddingTop: 8 }}>
          No printers found on your Bambu account. Make sure your printers are registered in Bambu Studio / the Bambu app.
        </div>
      )}

      {/* Print history + power cost section */}
      {hasBambu && (
        <PrintHistory
          accessToken={bambuAuth?.accessToken}
          devices={bambuDevices}
          powerSettings={powerSettings}
          onSavePowerSettings={handleSavePowerSettings}
        />
      )}

      {/* Camera feed modal */}
      {cameraSerial && (() => {
        const dev = bambuDevices.find(d => d.dev_id === cameraSerial);
        return dev ? (
          <CameraModal
            device={dev}
            onClose={() => setCameraSerial(null)}
          />
        ) : null;
      })()}


      {showAddSnap && (
        <AddSnapmakerPanel
          existingPrinters={snapPrinters}
          onSave={handleSnapSaved}
          onClose={() => setShowAddSnap(false)}
        />
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BrandDots } from '@/components/BrandLoader';
import StateSelect from '@/components/StateSelect';
import {
  MAX_PICKUP_FILES,
  MAX_PICKUP_FILES_PER_AWB,
  MAX_PICKUP_FILE_BYTES,
  PICKUP_FILE_MIMES,
  fetchPickupLocations,
  pickupRateMessage,
  resendPickupOTP,
  submitPickupRequest,
  verifyPickupRequest,
  PickupError,
  type PickupLocationOption,
  type PickupPublicRequest,
} from '@/lib/pickup';

// The backend caps the form at 50 AWBs (pickup service); the input matches.
const MAX_AWBS = 50;

/** Overlays the live array onto the remembered one, so edits made since the
 *  last resize win and anything hidden below the current count is kept. */
function foldInto<T>(kept: T[], live: T[]): T[] {
  const out = kept.slice();
  live.forEach((v, i) => {
    out[i] = v;
  });
  return out;
}

/** The first n entries, padded with fresh blanks when the source is short. */
function sized<T>(src: T[], n: number, blank: () => T): T[] {
  const out = src.slice(0, n);
  while (out.length < n) out.push(blank());
  return out;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow';

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 8a6 6 0 0 1 10.47-4M14 8a6 6 0 0 1-10.47 4" />
      <path d="M12.5 1v3.5H9M3.5 15v-3.5H7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

interface ChosenFile {
  file: File;
  url: string | null; // image previews only; PDFs render as a tile
}

type Step = 'form' | 'verify' | 'done';

export default function PickupRequestForm() {
  const [step, setStep] = useState<Step>('form');
  const [created, setCreated] = useState<PickupPublicRequest | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [email, setEmail] = useState('');

  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // Location step, decided by the Customer ID lookup. `id` records which
  // customer id the result belongs to so editing it re-runs the check on blur.
  const [checking, setChecking] = useState(false);
  const [lookup, setLookup] = useState<{ id: string; matched: boolean; locations: PickupLocationOption[] } | null>(null);
  const [lookupNote, setLookupNote] = useState<string | null>(null);
  const [locationId, setLocationId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [pincode, setPincode] = useState('');

  const [countStr, setCountStr] = useState('1');
  const [awbs, setAwbs] = useState<string[]>(['']);

  // Photos per AWB, parallel to awbs: row i carries AWB i's images. An image
  // is proof for ONE box, so the picker lives on the AWB row, and a row may
  // legitimately stay empty — photos are optional per AWB.
  const [awbFiles, setAwbFiles] = useState<ChosenFile[][]>([[]]);
  // The full history behind awbs/awbFiles. Lowering the shipment count hides
  // rows instead of destroying them, so raising it again restores what was
  // typed and attached.
  const keptAwbs = useRef<string[]>(['']);
  const keptFiles = useRef<ChosenFile[][]>([[]]);
  const [fileNote, setFileNote] = useState<string | null>(null);

  const [readyDate, setReadyDate] = useState('');
  const [readyTime, setReadyTime] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Whether the request went through the code step — the no-mailer path skips
  // it, and its confirmation must not claim an email that was never sent.
  const [otpUsed, setOtpUsed] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendNote, setResendNote] = useState<string | null>(null);

  const fetchCaptcha = useCallback(async () => {
    try {
      const res = await fetch('/api/captcha');
      const data = await res.json();
      setCaptchaQuestion(data.question);
      setCaptchaToken(data.token);
      setCaptchaAnswer('');
    } catch {
      setCaptchaQuestion('Reload page');
    }
  }, []);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  // Saved locations when the id matched AND it has any; otherwise the typed
  // address fields carry the pickup point.
  const typedAddress = !!lookup && (!lookup.matched || lookup.locations.length === 0);

  // Resolves the Customer ID to its saved locations (cached per id). Returns
  // null after showing why — the blur handlers and submit share it, since a
  // user who never blurs the field still needs the lookup before submitting.
  // `chosen` is the location id submit should send: the select's value on a
  // cached lookup, the pre-selected first option on a fresh one (the select
  // could not have been touched yet).
  // No CAPTCHA here: the lookup is answered with labels + city only, so the
  // backend gates it with a tight per-IP limit instead of a challenge.
  const runLookup = useCallback(async (): Promise<{ matched: boolean; locations: PickupLocationOption[]; chosen: number | null } | null> => {
    const id = customerId.trim();
    if (!id) return null;
    if (lookup && lookup.id === id) {
      return { matched: lookup.matched, locations: lookup.locations, chosen: lookup.locations.length ? Number(locationId) : null };
    }
    setChecking(true);
    setLookupNote(null);
    try {
      const r = await fetchPickupLocations(id);
      setLookup({ id, matched: r.matched, locations: r.locations });
      setLocationId(r.locations.length ? String(r.locations[0].id) : '');
      return { matched: r.matched, locations: r.locations, chosen: r.locations.length ? r.locations[0].id : null };
    } catch (e) {
      setLookupNote(pickupRateMessage(e, 'Could not check your Customer ID.'));
      return null;
    } finally {
      setChecking(false);
    }
  }, [customerId, lookup, locationId]);

  function handleCount(v: string) {
    setCountStr(v);
    const parsed = parseInt(v, 10);
    // An empty or half-typed box is NOT a count of one.
    //
    // This used to be `parseInt(v, 10) || 1`, so clicking into the box and
    // pressing Backspace before retyping collapsed the count to 1 and trimmed
    // both arrays to a single row — silently destroying every AWB below it AND
    // the photos attached to them. Retyping the number brought back empty rows,
    // nothing said anything was lost, and the user submitted a request missing
    // the proof photos they had already attached.
    //
    // A transient value means "still typing", so leave the data alone.
    if (!Number.isInteger(parsed) || parsed < 1) return;
    const n = Math.min(MAX_AWBS, parsed);

    // Lowering the count hides rows rather than discarding them, so raising it
    // again brings the numbers and photos back — which is what the old comment
    // here promised and `slice` never delivered. `prev` is folded in first so
    // edits made since the last resize are never lost.
    setAwbs((prev) => {
      keptAwbs.current = foldInto(keptAwbs.current, prev);
      return sized(keptAwbs.current, n, () => '');
    });
    setAwbFiles((prev) => {
      keptFiles.current = foldInto(keptFiles.current, prev);
      return sized(keptFiles.current, n, () => []);
    });
  }

  // Adds photos to ONE AWB's row, enforcing every cap locally so the server
  // never has to refuse what the form could have caught: type and size per
  // file, the per-AWB cap, and the per-request cap across all rows. Every
  // rejection names the AWB it belongs to, because the controls are per box.
  function addFiles(awbIdx: number, list: FileList | null) {
    if (!list) return;
    const label = `AWB ${awbIdx + 1}${awbs[awbIdx] && awbs[awbIdx].trim() ? ` (${awbs[awbIdx].trim()})` : ''}`;
    const rejected: string[] = [];
    const accepted: File[] = [];
    for (const f of Array.from(list)) {
      if (!PICKUP_FILE_MIMES.includes(f.type)) {
        rejected.push(`${label}: ${f.name} is not a JPEG, PNG, WebP or PDF`);
      } else if (f.size > MAX_PICKUP_FILE_BYTES) {
        rejected.push(`${label}: ${f.name} is over 5 MB`);
      } else {
        accepted.push(f);
      }
    }
    const row = awbFiles[awbIdx] ?? [];
    let take = accepted.slice(0, Math.max(0, MAX_PICKUP_FILES_PER_AWB - row.length));
    if (take.length < accepted.length) {
      rejected.push(`${label}: at most ${MAX_PICKUP_FILES_PER_AWB} photos per AWB`);
    }
    const attached = awbFiles.reduce((n, r) => n + r.length, 0);
    const room = MAX_PICKUP_FILES - attached;
    if (take.length > room) {
      take = take.slice(0, Math.max(0, room));
      rejected.push(`at most ${MAX_PICKUP_FILES} photos per request`);
    }
    setFileNote(rejected.length ? rejected.join(' · ') : null);
    if (take.length) {
      setAwbFiles(awbFiles.map((r, i) => (
        i === awbIdx ? [...r, ...take.map((f) => ({ file: f, url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null }))] : r
      )));
    }
  }

  // Preview URLs are deliberately not revoked: they point at File data the
  // state holds anyway, and the registry entries die with the document.
  function removeFile(awbIdx: number, j: number) {
    setAwbFiles(awbFiles.map((r, i) => (i === awbIdx ? r.filter((_, idx) => idx !== j) : r)));
    setFileNote(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    // Covering the whole handler (not just the POST) so the await on the
    // lookup cannot open a double-submit window.
    setSubmitting(true);
    try {
      const loc = await runLookup();
      if (!loc) return; // runLookup has already shown why under the Customer ID
      const typed = !loc.matched || loc.locations.length === 0;
      const ready = new Date(`${readyDate}T${readyTime}`);
      if (Number.isNaN(ready.getTime())) {
        setError('Choose when the shipments will be ready.');
        return;
      }
      const req = await submitPickupRequest({
        captchaToken,
        captchaAnswer: captchaAnswer.trim(),
        customerId: customerId.trim(),
        email: email.trim(),
        locationId: typed ? null : loc.chosen,
        address: typed ? address.trim() : '',
        city: typed ? city.trim() : '',
        state: typed ? addrState : '',
        pincode: typed ? pincode.trim() : '',
        awbs: awbs.map((a) => a.trim()),
        readyAt: ready.toISOString(),
        files: awbFiles.map((row) => row.map((c) => c.file)),
      });
      setCreated(req);
      setCode('');
      setVerifyError(null);
      setResendNote(null);
      // A server with no mailer configured accepts the request already
      // verified — asking for a code that will never arrive would strand the
      // user, so skip straight to the confirmation.
      setOtpUsed(!req.verifiedAt);
      setStep(req.verifiedAt ? 'done' : 'verify');
      // The submit CAPTCHA is single-use and burned whether the request
      // succeeded or failed, so ALWAYS take a fresh challenge (the verify
      // step's resend needs one) and clear the typed answer.
      fetchCaptcha();
    } catch (e) {
      setError(pickupRateMessage(e, 'Could not submit your pickup request.'));
      fetchCaptcha();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!created || verifying || code.trim().length < 6) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      await verifyPickupRequest(created.ref, code.trim());
      setStep('done');
    } catch (e) {
      if (e instanceof PickupError && e.status === 401) {
        setVerifyError('That code is invalid or has expired. Please try again.');
      } else {
        setVerifyError(pickupRateMessage(e, 'Could not verify your code.'));
      }
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (!created || resending) return;
    if (!captchaAnswer.trim() || !captchaToken) {
      setVerifyError('Answer the CAPTCHA first — it keeps the code service safe from abuse.');
      return;
    }
    setResending(true);
    setVerifyError(null);
    setResendNote(null);
    try {
      await resendPickupOTP(created.ref, captchaToken, captchaAnswer.trim());
      setResendNote(`A new code has been sent to ${created.email}.`);
    } catch (e) {
      if (e instanceof PickupError && e.status === 403) {
        setVerifyError('That CAPTCHA answer is incorrect or has expired. Please try again.');
      } else {
        setVerifyError(pickupRateMessage(e, 'Could not resend the code.'));
      }
    } finally {
      // The resend CAPTCHA burns on a successful send; refresh either way so
      // the control never holds a dead token.
      fetchCaptcha();
      setResending(false);
    }
  }

  const heading =
    step === 'done' ? 'Pickup request received' : step === 'verify' ? 'Enter your code' : 'Request a pickup';
  const subheading =
    step === 'form'
      ? 'No account needed — tell us what to collect and where, then verify by email.'
      : step === 'verify'
        ? 'We emailed a 6-digit code to confirm your request.'
        : 'Our team will schedule your collection.';

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-5 sm:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-dark">{heading}</h1>
        <p className="text-gray-500 mt-2">{subheading}</p>
      </div>

      {step === 'form' && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="customerId" className="text-sm font-medium text-brand-dark">Customer ID</label>
            <input
              id="customerId"
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              onBlur={() => { runLookup(); }}
              placeholder="e.g. FCC0001"
              autoComplete="off"
              required
              className={inputCls}
            />
            {checking && <p className="text-xs text-gray-400">Checking for saved pickup locations…</p>}
            {lookupNote && <p className="text-xs text-amber-700">{lookupNote}</p>}
          </div>

          {/* CAPTCHA — solved once, at submit. The Customer ID lookup no
              longer needs it (labels + city only, per-IP limited on the
              server); the challenge is single-use, so it is refreshed after
              every submit attempt, success or failure. */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 sm:px-4 py-3">
            <span className="text-sm text-gray-500 whitespace-nowrap">Verify:</span>
            <span className="font-semibold text-brand-dark text-base whitespace-nowrap">
              {captchaQuestion} =
            </span>
            <input
              type="text"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              placeholder="?"
              className="w-16 sm:w-20 px-2 sm:px-3 py-1.5 border border-gray-300 rounded text-center text-base focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              inputMode="numeric"
              required
            />
            <button
              type="button"
              onClick={fetchCaptcha}
              className="text-gray-400 hover:text-brand-orange transition-colors p-1"
              title="New challenge"
              aria-label="New challenge"
            >
              <RefreshIcon />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-brand-dark">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={inputCls}
            />
            <p className="text-xs text-gray-400">The verification code is emailed here.</p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-brand-dark">Pickup location</span>
            {!lookup ? (
              <p className="text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                Enter your Customer ID — we&apos;ll load your saved pickup locations.
              </p>
            ) : !typedAddress ? (
              <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={inputCls} required>
                {lookup.locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.label} — {l.city}</option>
                ))}
              </select>
            ) : (
              <>
                {!lookup.matched ? (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    We could not find this Customer ID. You can still submit — it may delay your pickup.
                  </p>
                ) : (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    This Customer ID has no saved pickup locations — type the pickup address below.
                  </p>
                )}
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Pickup address"
                  rows={2}
                  required
                  className={inputCls}
                />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  required
                  className={inputCls}
                />
                <StateSelect value={addrState} onChange={setAddrState} className={inputCls} id="pickup-state" />
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Pincode"
                  inputMode="numeric"
                  required
                  className={inputCls}
                />
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="awbCount" className="text-sm font-medium text-brand-dark">Number of shipments</label>
            <input
              id="awbCount"
              type="number"
              min={1}
              max={MAX_AWBS}
              value={countStr}
              onChange={(e) => handleCount(e.target.value)}
              required
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-sm font-medium text-brand-dark">
              AWB numbers <span className="font-normal text-gray-400">— add each box&apos;s photos beside it (optional)</span>
            </span>
            {/* Both caps are stated up front so the server never has to refuse
                what the form could have caught. */}
            <p className="text-xs text-gray-400">
              Up to {MAX_PICKUP_FILES_PER_AWB} photos per AWB and {MAX_PICKUP_FILES} per request, 5 MB each — JPEG, PNG, WebP or PDF.
            </p>
            {awbs.map((a, i) => (
              <div key={i} className="flex flex-col gap-2 border border-gray-200 rounded-lg p-3">
                <input
                  type="text"
                  value={a}
                  onChange={(e) => setAwbs(awbs.map((x, idx) => (idx === i ? e.target.value : x)))}
                  placeholder={`AWB ${i + 1}`}
                  required
                  className={inputCls}
                />
                <div className="flex items-center justify-between gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs font-semibold text-brand-orange hover:bg-orange-50 transition-colors">
                    <FileIcon />
                    Add photos
                    <input
                      type="file"
                      multiple
                      accept={PICKUP_FILE_MIMES.join(',')}
                      className="hidden"
                      onChange={(e) => {
                        addFiles(i, e.target.files);
                        e.target.value = ''; // let the same file be re-picked after a remove
                      }}
                    />
                  </label>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    {awbFiles[i]?.length ?? 0}/{MAX_PICKUP_FILES_PER_AWB} photos
                  </span>
                </div>
                {(awbFiles[i]?.length ?? 0) > 0 && (
                  <ul className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {awbFiles[i].map(({ file, url }, j) => (
                      <li key={`${file.name}-${j}`} className="relative">
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- local blob preview of a just-chosen file; next/image has nothing to optimize here
                          <img src={url} alt={file.name} className="w-full aspect-square object-cover rounded-lg border border-gray-200" />
                        ) : (
                          <span className="w-full aspect-square rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1 text-gray-400">
                            <FileIcon />
                            <span className="text-[10px] font-semibold uppercase tracking-wide">PDF</span>
                          </span>
                        )}
                        <span className="block mt-1 text-[11px] text-gray-500 truncate" title={file.name}>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(i, j)}
                          className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-500 flex items-center justify-center text-xs"
                          aria-label={`Remove ${file.name} from AWB ${i + 1}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {fileNote && <p className="text-xs text-amber-700">{fileNote}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="readyDate" className="text-sm font-medium text-brand-dark">Shipment ready date</label>
              <input
                id="readyDate"
                type="date"
                value={readyDate}
                onChange={(e) => setReadyDate(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="readyTime" className="text-sm font-medium text-brand-dark">Ready time</label>
              <input
                id="readyTime"
                type="time"
                value={readyTime}
                onChange={(e) => setReadyTime(e.target.value)}
                required
                className={inputCls}
              />
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-8 py-3 bg-brand-orange text-white font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <BrandDots />
                Submitting...
              </>
            ) : (
              'Request pickup'
            )}
          </button>
        </form>
      )}

      {step === 'verify' && created && (
        <form onSubmit={handleVerify} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 flex flex-col gap-5">
          <p className="text-sm text-gray-500 text-center">
            Reference <span className="font-semibold text-brand-dark">{created.ref}</span> — we emailed a 6-digit code to{' '}
            <span className="font-medium text-brand-dark">{created.email}</span>.
          </p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className="text-sm font-medium text-brand-dark">Verification code</label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              autoFocus
              required
              className="px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-semibold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow"
            />
          </div>

          {resendNote && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">{resendNote}</div>}
          {verifyError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">{verifyError}</div>}

          <button
            type="submit"
            disabled={verifying || code.length < 6}
            className="w-full px-8 py-3 bg-brand-orange text-white font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <BrandDots />
                Verifying...
              </>
            ) : (
              'Verify pickup request'
            )}
          </button>

          {/* Resend sends mail exactly like submit, so it carries its own
              freshly solved CAPTCHA — single-use on the server, so it is
              refreshed after every resend attempt too. */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 sm:px-4 py-3">
            <span className="text-sm text-gray-500 whitespace-nowrap">Resend:</span>
            <span className="font-semibold text-brand-dark text-base whitespace-nowrap">
              {captchaQuestion} =
            </span>
            <input
              type="text"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              placeholder="?"
              className="w-16 sm:w-20 px-2 sm:px-3 py-1.5 border border-gray-300 rounded text-center text-base focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              inputMode="numeric"
            />
            <button
              type="button"
              onClick={fetchCaptcha}
              className="text-gray-400 hover:text-brand-orange transition-colors p-1"
              title="New challenge"
              aria-label="New challenge"
            >
              <RefreshIcon />
            </button>
          </div>

          <div className="flex justify-center text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !captchaAnswer.trim()}
              className="font-semibold text-brand-orange hover:text-brand-coral transition-colors disabled:opacity-50"
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          </div>
        </form>
      )}

      {step === 'done' && created && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 flex flex-col items-center gap-4 text-center">
          <span className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
            <CheckIcon />
          </span>
          <div>
            <p className="text-gray-500">Your pickup request reference is</p>
            <p className="mt-1 text-2xl font-bold text-brand-dark tracking-wide">{created.ref}</p>
          </div>
          <p className="text-sm text-gray-500">
            {otpUsed ? (
              <>A confirmation went to <span className="font-medium text-brand-dark">{created.email}</span>. </>
            ) : null}
            Our team will schedule the collection — keep the reference for any follow-up.
          </p>
        </div>
      )}
    </div>
  );
}

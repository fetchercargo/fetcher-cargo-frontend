'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ShipmentTracking } from '@/lib/types';
import TrackingResult from './TrackingResult';

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 8a6 6 0 0 1 10.47-4M14 8a6 6 0 0 1-10.47 4"/>
      <path d="M12.5 1v3.5H9M3.5 15v-3.5H7"/>
    </svg>
  );
}

export default function TrackingSearch() {
  const [awb, setAwb] = useState('');
  const [result, setResult] = useState<ShipmentTracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

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

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = awb.trim();
    if (!trimmed || !captchaAnswer.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({
        awb: trimmed,
        captcha_answer: captchaAnswer.trim(),
        captcha_token: captchaToken,
      });

      const res = await fetch(`/api/track?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        fetchCaptcha();
        return;
      }

      setResult(data);
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
      fetchCaptcha();
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-5 sm:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-dark">
          Track Your Shipment
        </h1>
        <p className="text-gray-500 mt-2">
          Enter your Air Waybill number to see the latest status
        </p>
      </div>

      <form onSubmit={handleTrack} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
            placeholder="Enter AWB No."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow"
          />
          <button
            type="submit"
            disabled={loading || !awb.trim() || !captchaAnswer.trim()}
            className="px-8 py-3 bg-brand-orange text-white font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Tracking...
              </>
            ) : (
              'Track'
            )}
          </button>
        </div>

        {/* CAPTCHA */}
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
          />
          <button
            type="button"
            onClick={fetchCaptcha}
            className="text-gray-400 hover:text-brand-orange transition-colors p-1"
            title="New challenge"
          >
            <RefreshIcon />
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      {result && <TrackingResult data={result} />}
    </div>
  );
}

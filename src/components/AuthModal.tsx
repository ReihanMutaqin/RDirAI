'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/types/chat';
import { X, Lock, Mail, User, LogIn, UserPlus, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal memproses autentikasi');
      }

      if (data.user) {
        onSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-[#121520] border border-[#222738] rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1c2030] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 shadow-lg shadow-blue-950/40">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Masuk ke Rdir Studio' : 'Buat Akun Rdir Studio'}
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Isolasi proyek & riwayat chat secara privat khusus untuk akun Anda.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-[#181c2a] p-1 rounded-xl border border-[#262c3e] mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'login'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Masuk (Login)
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'register'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Daftar (Register)
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1 font-mono">
                Nama Lengkap
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-gray-500 absolute left-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Reihan Studio"
                  className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-[#181c2a] border border-[#262c3e] text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/60"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1 font-mono">
              Alamat Email
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@domain.com"
                className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-[#181c2a] border border-[#262c3e] text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1 font-mono">
              Kata Sandi (Password)
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-[#181c2a] border border-[#262c3e] text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all mt-4 border border-blue-400/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi Akun...</span>
              </>
            ) : mode === 'login' ? (
              <span>Masuk Akun</span>
            ) : (
              <span>Buat Akun Sekarang</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

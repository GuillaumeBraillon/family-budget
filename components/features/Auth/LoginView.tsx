
import React from 'react';
import { WalletCards, ShieldCheck, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

interface LoginViewProps {
  onLogin: () => void;
  loading: boolean;
  error?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, loading, error }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-indigo-100 animate-in zoom-in duration-300">
        <CardHeader className="text-center bg-indigo-50/50 py-10 border-b border-indigo-100">
          <div className="bg-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
            <WalletCards className="text-white" size={40} />
          </div>
          <CardTitle className="text-3xl font-bold text-slate-900">Budget Familial</CardTitle>
          <p className="text-sm text-slate-500 mt-2 px-6">
            Gérez vos finances communes en toute simplicité.
          </p>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
            <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-600 mt-0.5">
                <ShieldCheck size={16} />
            </div>
            <div>
                <h4 className="text-sm font-bold text-emerald-800">Accès Sécurisé</h4>
                <p className="text-xs text-emerald-700/80 leading-relaxed mt-1">
                    Cette application est privée. Connectez-vous avec votre compte Google pour accéder aux données du foyer.
                </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
              {error}
            </div>
          )}

          <button 
            onClick={onLogin}
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
          >
            {loading ? (
                <span className="animate-pulse">Connexion en cours...</span>
            ) : (
                <>
                    {/* Fake Google Icon using SVG directly for simplicity */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Continuer avec Google
                    <ArrowRight size={18} className="opacity-50" />
                </>
            )}
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

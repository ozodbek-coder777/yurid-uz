import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  lang?: 'uz' | 'ru';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isUz = this.props.lang !== 'ru';

      return (
        <div className="min-h-screen bg-[#0D1017] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#11151E] border border-[#1F2937] rounded-3xl p-8 space-y-6 text-center shadow-2xl animate-fade-in">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-3xl flex items-center justify-center mx-auto">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                {isUz ? "Tizim kutilmagan xatolikka duch keldi" : "Произошла непредвиденная ошибка"}
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                {isUz
                  ? "Xavotir olmang! Shaxsiy ma'lumotlaringiz va arizalaringiz xavfsiz holatda saqlanmoqda. Tugmani bosib sahifani qayta yuklang."
                  : "Ваши данные и заявки находятся в полной безопасности. Перезагрузите страницу для продолжения работы."}
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#161B22] p-3 rounded-xl border border-[#1F2937] text-[10px] text-gray-400 font-mono text-left overflow-x-auto max-h-28">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  (this as any).setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isUz ? "Qayta yuklash" : "Перезагрузить"}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

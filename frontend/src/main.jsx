import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./bootstrap";
import { createRoot } from "react-dom/client";
import { Component } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import App from "./app";
import "./app.css";

class ErrorBoundary extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error("Uncaught error:", error, info);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="min-h-screen bg-[#ffffff] flex items-center justify-center px-6">
                    <div className="w-full max-w-md rounded-xl bg-[#424242] border border-[#444444] p-8 text-center">
                        <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-[#ffffff]/15 flex items-center justify-center">
                            <AlertTriangle size={26} strokeWidth={2} className="text-[#c9ae00]" />
                        </div>

                        <p className="text-xs font-mono text-[#ffee03] tracking-wider mb-2">
                            ERROR
                        </p>
                        <h1 className="font-display text-xl text-white mb-2">
                            Terjadi Kesalahan
                        </h1>
                        <p className="text-sm text-white/70 mb-6">
                            {this.state.error.message || "Aplikasi mengalami error yang tidak terduga."}
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#0379ff] text-white text-sm font-medium px-4 py-2.5 hover:bg-[#1500fc] transition-colors"
                        >
                            <RotateCcw size={16} strokeWidth={2} />
                            Muat Ulang Halaman
                        </button>

                        <p className="text-xs font-mono text-white/40 mt-5">
                            SISTEM MANAJEMEN PARKIR
                        </p>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const container = document.getElementById("app");
const root = createRoot(container);
root.render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./bootstrap";
import { createRoot } from "react-dom/client";
import { Component } from "react";
import App from "./app";
import "./app.css";

class ErrorBoundary extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        // supaya errornya tetap kelihatan di console browser saat debugging
        console.error("Uncaught error:", error, info);
    }

    render() {
        if (this.state.error) {
            return (
                <div
                    style={{
                        padding: 24,
                        minHeight: "100vh",
                        background: "#14181F",
                        color: "#FFFFFF",
                        fontFamily: "monospace",
                    }}
                >
                    <h2 style={{ marginBottom: 8 }}>Terjadi kesalahan</h2>
                    <p style={{ color: "#8A8A8A", marginBottom: 16 }}>
                        {this.state.error.message || "Aplikasi mengalami error yang tidak terduga."}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: "#F97316",
                            color: "#14181F",
                            border: "none",
                            borderRadius: 6,
                            padding: "8px 16px",
                            cursor: "pointer",
                        }}
                    >
                        Muat ulang halaman
                    </button>
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
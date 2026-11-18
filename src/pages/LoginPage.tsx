import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: string })?.from || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(t("login.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col justify-center items-center min-h-screen w-screen p-4">
      <div className="w-full max-w-md bg-[#111]/80 p-8 rounded-lg border border-[#a48621]/30 shadow-2xl">
        <h1 className="text-4xl text-center text-orange-100 mb-8 font-semibold">
          {t("login.title")}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-2">
            <label htmlFor="email" className="text-orange-100">
              {t("login.email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white text-black p-2 rounded"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <label htmlFor="password" className="text-orange-100">
              {t("login.password")}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white text-black p-2 rounded"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary mt-4 disabled:opacity-50"
          >
            {isSubmitting ? t("login.submitting") : t("login.submit")}
          </button>
        </form>
      </div>
    </section>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation } from "../hooks/useMutation";
import api from "../lib/api";
import { useTranslation } from "react-i18next";
import type { AttributeInDb } from "../types/attribute";

function dataUrlToBase64(dataUrl: string): string {
  const idx = dataUrl.indexOf(",");
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

export default function AddAttributePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconBase64, setIconBase64] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  const { mutate, loading } = useMutation<
    AttributeInDb,
    [{ name: string; description?: string; icon?: string | null }]
  >((payload) => api.post("/attributes", payload), {
    pendingMessage: t("attributesPage.add.creating"),
    successMessage: t("attributesPage.add.created"),
    onSuccess: () => {
      navigate("/");
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setIconBase64(null);
      setIconPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setIconPreview(dataUrl);
      setIconBase64(dataUrlToBase64(dataUrl));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await mutate({
      name,
      description: description.trim() || undefined,
      icon: iconBase64,
    });
    void res;
  }

  return (
    <section
      aria-labelledby="add-attribute-page"
      className="flex flex-col p-4 gap-y-8"
    >
      <Link
        to="/"
        className="flex items-center justify-center medium-font-size text-orange-200 hover:text-yellow-500 px-4 pt-4 sm:justify-start"
      >
        <span className="order-1">{t("attributesPage.add.back")}</span>
        <FontAwesomeIcon icon={faArrowLeft} />
      </Link>
      <h1 className="h1-font-size text-center">
        {t("attributesPage.add.title")}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-y-6 max-w-md w-full self-center"
      >
        <div className="flex flex-col gap-y-2">
          <label htmlFor="attr-name" className="input-label">
            {t("attributesPage.fields.name")} *
          </label>
          <input
            id="attr-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="quest-form-input"
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <label htmlFor="attr-description" className="input-label">
            {t("attributesPage.fields.description")}
          </label>
          <textarea
            id="attr-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="quest-form-input text-sm resize-vertical"
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <label htmlFor="attr-icon" className="input-label">
            {t("attributesPage.fields.icon")}
          </label>
          <input
            id="attr-icon"
            type="file"
            accept="image/png"
            onChange={handleFileChange}
            className="text-white"
          />
          <p className="text-sm text-gray-400">
            {t("attributesPage.fields.iconWarning")}
          </p>
          {iconPreview && (
            <img
              src={iconPreview}
              alt="Anteprima icona"
              className="size-20 rounded-lg border border-[#FFD6A7]"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading
            ? t("attributesPage.add.creating")
            : t("attributesPage.add.submit")}
        </button>
      </form>
    </section>
  );
}

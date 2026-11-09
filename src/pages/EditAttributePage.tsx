import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import api from "../lib/api";
import { useTranslation } from "react-i18next";
import type { AttributeInDb } from "../types/attribute";

function dataUrlToBase64(dataUrl: string): string {
  const idx = dataUrl.indexOf(",");
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

export default function EditAttributePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  // useApi to load the existing attribute. This depends on the id: if it changes,
  // the hook re-fetches (but in practice the route has a stable id).
  const {
    data: attribute,
    loading: loadingAttr,
    error: loadError,
  } = useApi<AttributeInDb>(() => api.get(`/attributes/${id}`), [id]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconBase64, setIconBase64] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  // Pre-populate the fields when the attribute is loaded. useEffect with
  // the [attribute] dependency prevents the fields from being overwritten on every render.
  useEffect(() => {
    if (!attribute) return;
    setName(attribute.name ?? "");
    setDescription(attribute.description ?? "");
    // The existing icon cannot easily be reconstructed from the URL
    // (it is a Buffer/Uint8Array and has no MIME type). We only display it if
    // the user uploads a new one. See notes at the bottom.
  }, [attribute]);

  const { mutate, loading } = useMutation<
    AttributeInDb,
    [{ name: string; description?: string; icon?: string | null }]
  >((payload) => api.put(`/attributes/${id}`, payload), {
    pendingMessage: t("attributesPage.edit.saving"),
    successMessage: t("attributesPage.edit.saved"),
    onSuccess: () => navigate("/"),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    // If the user has not changed the icon, we DO NOT send `icon` (the field
    // remains undefined and the backend ignores it — thanks to `updateRow`
    // which skips undefined fields).
    const payload: {
      name: string;
      description?: string;
      icon?: string | null;
    } = {
      name,
      description,
    };
    if (iconBase64 !== null) payload.icon = iconBase64;
    await mutate(payload);
  }

  if (loadingAttr) return <div className="p-8">{t("loading")}</div>;
  if (loadError) return <div className="p-8 text-red-500">{loadError}</div>;

  return (
    <section
      aria-labelledby="edit-attribute-page"
      className="flex flex-col p-4 gap-y-8"
    >
      <Link
        to="/"
        className="flex items-center justify-center medium-font-size text-orange-200 hover:text-yellow-500 px-4 pt-4 sm:justify-start"
      >
        <span className="order-1">{t("attributesPage.edit.back")}</span>
        <FontAwesomeIcon icon={faArrowLeft} />
      </Link>
      <h1 className="h1-font-size text-center">
        {t("attributesPage.edit.title")}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-y-6 max-w-md w-full self-center"
      >
        {/* stessi campi di Add, precompilati */}
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
            accept="image/*"
            onChange={handleFileChange}
            className="text-white"
          />
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
            ? t("attributesPage.edit.saving")
            : t("attributesPage.edit.submit")}
        </button>
      </form>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  faArrowLeft,
  faPencil,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import ConfirmModal from "../components/ConfirmModal";
import api from "../lib/api";
import type { AttributeInDb } from "../types/attribute";

// Local hook: converts the `icon` field (which may come from the backend
// as a Uint8Array or as {type: "Buffer", data: number[]} depending on the
// serialisation) into a URL blob that can be used in <img src=...>.
// I use useMemo so as not to recreate the blob on every render, and useEffect with
// cleanup to revoke the URL when the component unmounts.
function useIconUrl(icon: AttributeInDb["icon"]): string | null {
  const url = useMemo(() => {
    if (!icon) return null;
    const bytes =
      icon instanceof Uint8Array ? icon : new Uint8Array((icon as any).data);
    // Let’s assume PNG. See note at the bottom: without MIME types in the database, we cannot
    // do any better until we add the dedicated column.
    return URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
  }, [icon]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
}

export default function AttributeDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: attribute,
    loading,
    error,
    refetch,
  } = useApi<AttributeInDb>(() => api.get(`/attributes/${id}`), [id]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const iconUrl = useIconUrl(attribute?.icon ?? null);

  // Important note: PATCH is a soft delete. The backend sets the `deleted_at` field,
  // it does not perform a physical DELETE. This complies with requirement Q10.
  const { mutate: softDelete, loading: deleting } = useMutation<AttributeInDb>(
    () => api.patch(`/attributes/${id}`),
    {
      pendingMessage: t("attributesPage.details.deleting"),
      successMessage: t("attributesPage.details.deleted"),
      onSuccess: () => {
        setConfirmOpen(false);
        // After a soft delete, the attribute can no longer be retrieved via the API
        // (queries filter by `deleted_at`? see note). Let’s go back to the status.
        navigate("/");
      },
    },
  );

  if (loading) return <div className="p-8">{t("loading")}</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!attribute)
    return <div className="p-8">{t("attributesPage.details.notFound")}</div>;

  return (
    <section
      aria-labelledby="attribute-details-page"
      className="flex flex-col p-4 gap-y-8"
    >
      <Link
        to="/"
        className="flex items-center justify-center medium-font-size text-orange-200 hover:text-yellow-500 px-4 pt-4 sm:justify-start"
      >
        <span className="order-1">{t("attributesPage.details.back")}</span>
        <FontAwesomeIcon icon={faArrowLeft} />
      </Link>

      <header className="flex items-center gap-x-6">
        <h1 className="h1-font-size">{attribute.name}</h1>
        {iconUrl && (
          <img
            src={iconUrl}
            alt={attribute.name}
            className="size-20 rounded-lg border border-[#FFD6A7]"
          />
        )}
      </header>

      <dl className="flex flex-col gap-y-4">
        <div>
          <dt className="field-title">
            {t("attributesPage.fields.description")}
          </dt>
          <dd>{attribute.description || "—"}</dd>
        </div>
        <div>
          <dt className="field-title">{t("attributesPage.fields.level")}</dt>
          <dd>{attribute.level ?? 0}</dd>
        </div>
        <div>
          <dt className="field-title">{t("attributesPage.fields.xp")}</dt>
          <dd>
            {attribute.xp ?? 0} / {attribute.xp_to_next_level}
          </dd>
        </div>
        <div>
          <dt className="field-title">
            {t("attributesPage.fields.decayDate")}
          </dt>
          <dd>
            {attribute.decay_date
              ? new Date(attribute.decay_date).toLocaleDateString()
              : "—"}
          </dd>
        </div>
      </dl>

      <nav
        role="toolbar"
        aria-label="Attribute actions"
        className="flex gap-x-6 justify-center sm:justify-start"
      >
        <Link
          to={`/attributes/edit/${attribute.id}`}
          className="flex flex-col items-center gap-y-2 text-white hover:opacity-80"
        >
          <span className="small-font-size">
            {t("attributesPage.details.edit")}
          </span>
          <FontAwesomeIcon icon={faPencil} className="text-2xl" />
        </Link>
        <button
          type="button"
          className="flex flex-col items-center gap-y-2 text-white hover:opacity-80"
          onClick={() => setConfirmOpen(true)}
        >
          <span className="small-font-size">
            {t("attributesPage.details.delete")}
          </span>
          <FontAwesomeIcon icon={faTrash} className="text-2xl" />
        </button>
      </nav>

      <ConfirmModal
        open={confirmOpen}
        title={t("attributesPage.details.confirmDeleteTitle")}
        description={t("attributesPage.details.confirmDeleteDescription")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        loading={deleting}
        onConfirm={() => softDelete()}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}

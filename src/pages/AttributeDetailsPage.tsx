import { useState, useMemo } from "react";
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
import { getIconUrl } from "../lib/iconHelper";

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

  // FIX Q12 & Q13: Use helper to extract correct base64 string
  const iconUrl = useMemo(() => getIconUrl(attribute?.icon), [attribute?.icon]);

  const { mutate: softDelete, loading: deleting } = useMutation<AttributeInDb>(
    () => api.patch(`/attributes/${id}`),
    {
      pendingMessage: t("attributesPage.details.deleting"),
      successMessage: t("attributesPage.details.deleted"),
      onSuccess: () => {
        setConfirmOpen(false);
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

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import ActionButton from "../components/ActionButton";
import ActionLink from "../components/ActionLink";
import ActionToolbar from "../components/ActionToolbar";
import AttributeDecayText from "../components/AttributeDecayText";
import BackLink from "../components/BackLink";
import ConfirmModal from "../components/ConfirmModal";
import FieldTitle from "../components/FieldTitle";
import PageHeading from "../components/PageHeading";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import api from "../lib/api";
import { getAttributeXpCeiling } from "../lib/attributeDisplayHelpers";
import { dataUrlToBase64, getIconUrl } from "../lib/iconHelper";
import type { AttributeInDb } from "../types/attribute";
import "../styles/pages/AttributePage.css";

// ---------------------------------------------------------------------------
// VARIANTS
//   add  → form to create an attribute        (POST   /attributes)
//   edit → form to change an attribute        (PUT    /attributes/:id)
//   view → details page, with delete          (PATCH  /attributes/:id = soft delete)
//
// Per-variant differences are texts: they are grouped here. `textPrefix` is the
// i18n branch of the variant; `pendingKey`/`successKey` are the messages shown
// while the variant's request runs and after it succeeds.
// ---------------------------------------------------------------------------
export type AttributePageVariant = "add" | "edit" | "view";

const VARIANT_SETTINGS: Record<
  AttributePageVariant,
  { textPrefix: string; pendingKey: string; successKey: string }
> = {
  add: {
    textPrefix: "attributesPage.add",
    pendingKey: "creating",
    successKey: "created",
  },
  edit: {
    textPrefix: "attributesPage.edit",
    pendingKey: "saving",
    successKey: "saved",
  },
  view: {
    textPrefix: "attributesPage.details",
    pendingKey: "deleting",
    successKey: "deleted",
  },
};

const HEADING_ID = "attribute-page-heading";

type AttributePageProps = {
  variant: AttributePageVariant;
};

type AttributePayload = {
  name: string;
  description?: string;
  icon?: string | null;
};

export default function AttributePage(props: AttributePageProps) {
  const { variant } = props;
  const { textPrefix, pendingKey, successKey } = VARIANT_SETTINGS[variant];

  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const isAdd = variant === "add";
  const isEdit = variant === "edit";
  const isView = variant === "view";
  const isForm = isAdd || isEdit;

  // --- Data: "add" has nothing to load -----------------------------------
  const {
    data: attribute,
    loading: loadingAttr,
    error: loadError,
  } = useApi<AttributeInDb>(() => api.get(`/attributes/${id}`), [id], {
    enabled: !isAdd,
  });

  // --- Form state (only used by the form variants) ------------------------
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconBase64, setIconBase64] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  // View only: delete confirmation.
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Edit only: fill the form with the attribute being edited.
  useEffect(() => {
    if (!attribute || !isEdit) return;
    setName(attribute.name ?? "");
    setDescription(attribute.description ?? "");
  }, [attribute, isEdit]);

  // FIX Q12 & Q13: Use helper to extract correct base64 string
  const iconUrl = useMemo(() => getIconUrl(attribute?.icon), [attribute?.icon]);

  // ONE mutation for the three variants: which request it sends depends only
  // on the variant. All of them end the same way (back to the status page).
  const mutation = useMutation<AttributeInDb, [AttributePayload?]>(
    (payload) => sendRequest(payload),
    {
      pendingMessage: t(`${textPrefix}.${pendingKey}`),
      successMessage: t(`${textPrefix}.${successKey}`),
      onSuccess: () => {
        setConfirmOpen(false);
        navigate("/");
      },
    },
  );

  // A switch on the variant (not nested ternaries) so adding a variant makes
  // TypeScript point here, because the cases would no longer be exhaustive.
  function sendRequest(payload?: AttributePayload) {
    switch (variant) {
      case "add":
        return api.post("/attributes", payload);
      case "edit":
        return api.put(`/attributes/${id}`, payload);
      case "view":
        return api.patch(`/attributes/${id}`);
    }
  }

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
    const payload: AttributePayload = {
      name,
      description: description.trim() || undefined,
    };
    // "add" always sends the icon field (null when none was chosen); "edit"
    // sends it only when a new file was chosen, to keep the current icon.
    if (isAdd || iconBase64 !== null) payload.icon = iconBase64;
    await mutation.mutate(payload);
  }

  // --- Guards (state of the data, not variants) ---------------------------
  if (loadingAttr)
    return <div className="attribute-page__message">{t("loading")}</div>;
  if (loadError)
    return (
      <div className="attribute-page__message attribute-page__message--error">
        {loadError}
      </div>
    );
  if (!isAdd && !attribute)
    return (
      <div className="attribute-page__message">
        {t("attributesPage.details.notFound")}
      </div>
    );

  // The view is titled with the attribute name; the forms with a fixed title.
  let headingTitle: string;
  if (isView) {
    headingTitle = attribute?.name ?? "";
  } else {
    headingTitle = t(`${textPrefix}.title`);
  }

  return (
    <section
      aria-labelledby={HEADING_ID}
      className={`attribute-page attribute-page--${variant}`}
    >
      <BackLink to="/" label={t(`${textPrefix}.back`)} />

      <PageHeading
        id={HEADING_ID}
        title={headingTitle}
        icon={
          iconUrl && isView ? (
            // Decorative: the name is already in the heading next to it.
            <img src={iconUrl} alt="" className="attribute-page__icon" />
          ) : null
        }
      />

      {isForm && (
        <form onSubmit={handleSubmit} className="attribute-page__form">
          <div className="flex flex-col gap-y-2">
            <FieldTitle htmlFor="attr-name">
              {t("attributesPage.fields.name")} *
            </FieldTitle>
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
            <FieldTitle htmlFor="attr-description">
              {t("attributesPage.fields.description")}
            </FieldTitle>
            <textarea
              id="attr-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="quest-form-input text-sm resize-vertical"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <FieldTitle htmlFor="attr-icon">
              {t("attributesPage.fields.icon")}
            </FieldTitle>
            <input
              id="attr-icon"
              type="file"
              accept="image/png"
              aria-describedby="attr-icon-warning"
              onChange={handleFileChange}
              className="text-white"
            />
            <p id="attr-icon-warning" className="text-sm text-gray-400">
              {t("attributesPage.fields.iconWarning")}
            </p>
            {iconPreview && (
              <img
                src={iconPreview}
                alt={t("attributesPage.fields.iconPreviewAlt")}
                className="attribute-page__icon"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.loading}
            className="btn-primary disabled:opacity-50"
          >
            {mutation.loading
              ? t(`${textPrefix}.${pendingKey}`)
              : t(`${textPrefix}.submit`)}
          </button>
        </form>
      )}

      {isView && attribute && (
        <>
          <AttributeDetailsList attribute={attribute} />

          <ActionToolbar
            label={t("attributesPage.actionsLabel")}
            className="flex gap-x-6 justify-center sm:justify-start"
          >
            <ActionLink
              label={t("attributesPage.details.edit")}
              icon={faPencil}
              to={`/attributes/edit/${attribute.id}`}
            />
            <ActionButton
              label={t("attributesPage.details.delete")}
              icon={faTrash}
              onClick={() => setConfirmOpen(true)}
            />
          </ActionToolbar>

          <ConfirmModal
            open={confirmOpen}
            title={t("attributesPage.details.confirmDeleteTitle")}
            description={t("attributesPage.details.confirmDeleteDescription")}
            confirmLabel={t("common.delete")}
            cancelLabel={t("common.cancel")}
            loading={mutation.loading}
            onConfirm={() => mutation.mutate()}
            onCancel={() => setConfirmOpen(false)}
          />
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// The read-only data of the view variant. Defined as a list of
// { label, value } so a new field is one more entry, not another copy of the
// <div><dt><dd> markup. It only exists for AttributePage, so it lives here.
// ---------------------------------------------------------------------------
function AttributeDetailsList(props: { attribute: AttributeInDb }) {
  const { t } = useTranslation();
  const { attribute } = props;

  const fields = [
    {
      label: t("attributesPage.fields.description"),
      value: attribute.description || "—",
    },
    {
      label: t("attributesPage.fields.level"),
      value: attribute.level ?? 0,
    },
    {
      label: t("attributesPage.fields.xp"),
      // Same rule as the status page: the second number is the level
      // ceiling (xp + xp_to_next_level), not the XP still missing.
      value: `${attribute.xp ?? 0} / ${getAttributeXpCeiling(attribute)}`,
    },
    {
      label: t("attributesPage.fields.decayDate"),
      // Same decay rule as the card in the status page (see AttributeDecayText).
      value: <AttributeDecayText attribute={attribute} showLabel={false} />,
    },
  ];

  return (
    <dl className="flex flex-col gap-y-4">
      {fields.map((field) => (
        <div key={field.label}>
          <dt className="field-title">{field.label}</dt>
          <dd>{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

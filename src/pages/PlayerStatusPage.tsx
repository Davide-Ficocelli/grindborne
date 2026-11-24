import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import LoadingFallback from "../components/LoadingFallback";
import PageHeading from "../components/PageHeading";
import ConfirmModal from "../components/ConfirmModal";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { createLazyIcon } from "../lib/createLazyIcon";
import type { UserInDb } from "../types/user";
import type { AttributeInDb } from "../types/attribute";
import "../styles/pages/PlayerStatusPage.css";

// Lazy load all components
const AttributesChart = lazy(() => import("../components/AttributesChart"));
const Attribute = lazy(() => import("../components/Attribute"));

// Lazy load the image
const StatusIcon = createLazyIcon(
  () => import("../assets/icons/player-status.png"),
  { hasBorder: false },
);

interface PlayerStatusPageTranslations {
  statusHeading: string;
  mainInfoHeading: string;
  playerLabel: string;
  staminaLabel: string;
  levelLabel: string;
  attributesHeading: string;
  addAttributeBtnLabel: string;
  proficiencyHeading: string;
}

export default function PlayerStatusPage() {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const { t } = useTranslation();
  const { userId } = useAuth();

  const tPlayerStatusPage = t("playerStatusPage", {
    returnObjects: true,
  }) as PlayerStatusPageTranslations;

  const {
    statusHeading,
    mainInfoHeading,
    playerLabel,
    staminaLabel,
    levelLabel,
    attributesHeading,
    addAttributeBtnLabel,
    proficiencyHeading,
  } = tPlayerStatusPage;

  // We retrieve the player's real data
  const {
    data: user,
    loading: userLoading,
    error: userError,
    // Needed to re-read the overall level after an attribute is deleted.
    refetch: userRefetch,
  } = useApi<UserInDb>(
    () => api.get(`/users/${userId}`),
    [userId], // Defence: if the userId changes, perform the fetch again
  );

  // Let's retrieve the real attributes.
  // NOTE: with the latest backend fixes, a fresh user now receives { ok: true, data: [] }
  // instead of { ok: false, status: 404 }. So `attributes` becomes [] (not
  // null) and `attrError` stays null — the early-return on error below only
  // fires for REAL errors (network, server down, ...).
  const {
    data: attributes,
    loading: attrLoading,
    error: attrError,
    refetch: attrRefetch,
  } = useApi<AttributeInDb[]>(() => api.get("/attributes"), []);

  const { mutate: softDeleteAttr, loading: deletingAttr } = useMutation(
    () => api.patch(`/attributes/${confirmingId}`),
    {
      pendingMessage: t("attributesPage.details.deleting"),
      successMessage: t("attributesPage.details.deleted"),
      onSuccess: () => {
        setConfirmingId(null);
        // Refetch the attribute list AND the user. The backend recalculates the
        // overall user level whenever an attribute is soft-deleted
        // (see softDeleteAttributeService), so the level shown in the
        // "Main info" section would be stale if we only refetched attributes.
        // The two requests are independent, so they run in parallel.
        attrRefetch();
        userRefetch();
      },
    },
  );

  if (userLoading || attrLoading) return <LoadingFallback />;
  // This branch now fires only for genuine errors. An empty attribute list
  // is `data: []`, not `error`.
  if (userError || attrError)
    return (
      <div className="text-red-500 text-center py-8">
        {userError || attrError}
      </div>
    );

  // Convenience flag: "the user has no attributes yet".
  // Using `=== 0` (not `!attributes.length`) because attributes could be
  // null on very first mount before useApi has resolved — but we already
  // gated on loading, so at this point attributes is either [] or non-empty.
  const hasNoAttributes = !attributes || attributes.length === 0;

  return (
    <section aria-labelledby="status-heading" className="status-page">
      {/* Title and page icon (always rendered) */}
      <PageHeading
        id="status-heading"
        title={statusHeading}
        icon={<StatusIcon />}
        breakAll
        className="status-page__heading"
      />

      {/* Main info (always rendered) */}
      <section
        aria-labelledby="main-info-heading"
        className="flex flex-col gap-y-4 status-page__main-info"
      >
        <h2
          id="main-info-heading"
          className="status-page__section-heading h2-font-size bottom-linear-gradient-border"
        >
          {mainInfoHeading}
        </h2>
        {/* The three rows are plain list items: the old <dl>/<dt> had no <dd>,
            which is invalid HTML and confuses screen readers. */}
        <ul className="flex flex-col gap-y-4">
          <li className="status-page__row bottom-linear-gradient-border standard-font-size flex justify-between">
            <p className="px-4">{playerLabel}:</p>
            <p className="text-end px-4">
              {/* We use the real name of the user */}
              {user?.name || "N/A"}
            </p>
          </li>
          <li className="status-page__row bottom-linear-gradient-border standard-font-size flex flex-col gap-y-2">
            <p className="px-4">{staminaLabel}</p>
            <div className="w-full relative">
              <meter
                aria-label={staminaLabel}
                max="100"
                value={user?.stamina || 0}
                className="status-page__stamina-bar w-screen mb-4 md:w-full"
              ></meter>
              <span className="absolute top-[10px] left-4 text-start text-[0.6rem] leading-none">
                {/* Note: The backend does not yet have the logic for maximum stamina/hourly decay. Let's put a placeholder */}
                {user?.stamina || 0}/100
              </span>
            </div>
          </li>
          <li className="status-page__row bottom-linear-gradient-border standard-font-size flex justify-between">
            <p className="px-4">{levelLabel}</p>
            <p className="px-4">{user?.level || 1}</p>
          </li>
        </ul>
      </section>

      {/* Attributes section (always rendered: heading + list + text + button) */}
      <section
        aria-labelledby="attributes-heading"
        className="flex flex-col gap-y-4 status-page__attributes"
      >
        <h2
          id="attributes-heading"
          className="status-page__section-heading h2-font-size bottom-linear-gradient-border"
        >
          {attributesHeading}
        </h2>
        <ul className="flex flex-col gap-y-4">
          <Suspense fallback={<LoadingFallback />}>
            {/* BUG FIX: previously this list was rendered TWICE —
                once inside <dl> (without onDeleteRequest) and once
                outside (with onDeleteRequest). Now there is a single
                authoritative map, inside the list, with the callback
                wired up. */}
            {attributes?.map((attr) => (
              <Attribute
                key={attr.id}
                attrData={attr}
                onDeleteRequest={() => setConfirmingId(attr.id)}
              />
            ))}
          </Suspense>
        </ul>

        {/* Empty-state text ABOVE the button, only when the user
            has no attributes yet. Showing it when attributes exist
            would be factually wrong ("you have none" when you do). */}
        {hasNoAttributes && (
          <p className="small-font-size px-4 text-center">
            {t("playerStatusPage.noAttributesText")}
          </p>
        )}

        {/* The button is ALWAYS visible — no business rule
            forbids the user from adding more attributes. */}
        <Link
          to="/attributes/add"
          className="small-font-size max-w-60 gap-x-2 self-start flex items-center justify-center pl-4 md:pb-4 cursor-pointer focus:opacity-80 hover:opacity-80"
        >
          <FontAwesomeIcon
            icon={faPlus}
            className="border-2 rounded-xl p-1"
            aria-hidden="true"
          />
          <span className="w-full text-center">{addAttributeBtnLabel}</span>
        </Link>

        {/* Modal window for attribute deletion. Kept inside the
            section for locality; being a fixed overlay its DOM
            position does not affect the layout. */}
        <ConfirmModal
          open={confirmingId !== null}
          title={t("attributesPage.details.confirmDeleteTitle")}
          description={t("attributesPage.details.confirmDeleteDescription")}
          confirmLabel={t("common.delete")}
          cancelLabel={t("common.cancel")}
          loading={deletingAttr}
          onConfirm={() => softDeleteAttr()}
          onCancel={() => setConfirmingId(null)}
        />
      </section>

      {/* Chart section */}
      <section
        aria-labelledby="proficiency-heading"
        className="flex flex-col justify-center items-center gap-y-8 pb-4 status-page__proficiency"
      >
        <h2
          id="proficiency-heading"
          className="status-page__section-heading h2-font-size bottom-linear-gradient-border w-full self-start"
        >
          {proficiencyHeading}
        </h2>
        <Suspense fallback={<LoadingFallback />}>
          {/* AttributesChart decides internally whether to draw the
              chart or show the placeholder, based on the 3-attribute
              threshold. When the user adds/removes attributes, the
              prop changes and the chart updates automatically: no
              extra logic needed here. */}
          <AttributesChart data={attributes} />
        </Suspense>
      </section>
    </section>
  );
}

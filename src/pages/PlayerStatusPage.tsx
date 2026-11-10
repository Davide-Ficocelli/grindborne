import { lazy, Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import LoadingFallback from "../components/LoadingFallback";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import type { UserInDb } from "../types/user";
import type { AttributeInDb } from "../types/attribute";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "../hooks/useMutation";
import ConfirmModal from "../components/ConfirmModal";

// Lazy load all components
const AttributesChart = lazy(() => import("../components/AttributesChart"));
const Attribute = lazy(() => import("../components/Attribute"));

// Lazy load the image
const StatusIcon = lazy(() =>
  import("../assets/icons/player-status.png").then((module) => ({
    default: () => (
      <img
        src={module.default}
        alt="Player status icon"
        className="size-20 rounded-lg"
      />
    ),
  })),
);

// Type definitions remain the same
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

type ObjOfStrings = {
  [key: string]: string;
};

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

  const classStyles: ObjOfStrings = {
    sectionHeading:
      "h2-font-size px-4 text-orange-100 pb-4 bottom-linear-gradient-border after:from-orange-100 after:to-[#111]",
    verticalFlexContainer: "flex flex-col gap-y-4",
    playerAndLevelInfoFlexContainer:
      "flex justify-between pb-4 standard-font-size bottom-linear-gradient-border after:from-[#ffffff] after:to-[#111]",
    horizontalPadding: "px-4",
  };

  // We retrieve the player's real data
  const {
    data: user,
    loading: userLoading,
    error: userError,
  } = useApi<UserInDb>(
    () => api.get(`/users/${userId}`),
    [userId], // Difesa: se cambia userId, rifà la fetch
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
        // refetch the attribute list (and the user, because the level
        // The user depends on the attributes — even if the backend updates
        // level only upon quest completion; it doesn't change upon deletion. Refetch
        // attributes is necessary anyway).
        attrRefetch();
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
    <>
      <Suspense fallback={<LoadingFallback />}>
        <section
          aria-labelledby="status-page"
          className="flex flex-col gap-y-18 md:gap-y-0 status-grid-area-container"
        >
          {/* 1. Title and page icon (always rendered) */}
          <div
            aria-labelledby="status-heading"
            className={`flex flex-wrap gap-x-8 gap-y-8 items-center justify-center py-16 ${classStyles.horizontalPadding} status-heading-grid-area`}
          >
            <h1 className="h1-font-size break-all order-1">{statusHeading}</h1>
            <Suspense
              fallback={
                <div className="size-20 bg-gray-300 animate-pulse rounded" />
              }
            >
              <StatusIcon />
            </Suspense>
          </div>

          {/* 2. Main info (always rendered) */}
          <section
            aria-labelledby="main-info-section"
            className={`${classStyles.verticalFlexContainer} main-info-section`}
          >
            <h2 id="main-info-heading" className={classStyles.sectionHeading}>
              {mainInfoHeading}
            </h2>
            <dl className={classStyles.verticalFlexContainer}>
              <dt className={classStyles.playerAndLevelInfoFlexContainer}>
                <p className={classStyles.horizontalPadding}>{playerLabel}:</p>
                <p className={`text-end ${classStyles.horizontalPadding}`}>
                  {/* We use the real name of the user */}
                  {user?.name || "N/A"}
                </p>
              </dt>
              <dt className="flex flex-col standard-font-size gap-y-2 bottom-linear-gradient-border pb-4 after:from-[#ffffff] after:to-[#111]">
                <p className={classStyles.horizontalPadding}>{staminaLabel}</p>
                <div className="w-full relative">
                  <meter
                    id="stamina-bar"
                    max="100"
                    value={user?.stamina || 0}
                    className="w-screen mb-4 md:w-full"
                  ></meter>
                  <span className="absolute top-[10px] left-4 text-start text-[0.6rem] leading-none">
                    {/* Note: The backend does not yet have the logic for maximum stamina/hourly decay. Let's put a placeholder or calculate if you have the fields. */}
                    {user?.stamina || 0}/100
                  </span>
                </div>
              </dt>

              <dt className={classStyles.playerAndLevelInfoFlexContainer}>
                <p className={classStyles.horizontalPadding}>{levelLabel}</p>
                <p className={classStyles.horizontalPadding}>
                  {user?.level || 1}
                </p>
              </dt>
            </dl>
          </section>

          {/* 3. Attributes section (always rendered: heading + list + text + button) */}
          <section
            aria-labelledby="attributes-section"
            className={`${classStyles.verticalFlexContainer} attributes-section`}
          >
            <h2 id="attributes-heading" className={classStyles.sectionHeading}>
              {attributesHeading}
            </h2>
            <dl className={classStyles.verticalFlexContainer}>
              <Suspense fallback={<LoadingFallback />}>
                {/* BUG FIX (Q3): previously this list was rendered TWICE —
                    once inside <dl> (without onDeleteRequest) and once
                    outside (with onDeleteRequest). Now there is a single
                    authoritative map, inside the <dl>, with the callback
                    wired up. */}
                {attributes?.map((attr) => (
                  <Attribute
                    key={attr.id}
                    attrData={attr}
                    onDeleteRequest={() => setConfirmingId(attr.id)}
                  />
                ))}
              </Suspense>
            </dl>

            {/* Q5: empty-state text ABOVE the button, only when the user
                has no attributes yet. Showing it when attributes exist
                would be factually wrong ("you have none" when you do). */}
            {hasNoAttributes && (
              <p className="small-font-size px-4 text-center">
                {t("playerStatusPage.noAttributesText")}
              </p>
            )}

            {/* Q9: the button is ALWAYS visible — no business rule
                forbids the user from adding more attributes. */}
            <Link
              to="/attributes/add"
              className="small-font-size max-w-60 gap-x-2 self-start flex items-center justify-center pl-4 md:pb-4 cursor-pointer focus:opacity-80 hover:opacity-80"
            >
              <FontAwesomeIcon
                icon={faPlus}
                className="border-2 rounded-xl p-1"
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

          {/* 4. Chart section (Q4 option a: after the attributes section) */}
          <section
            aria-labelledby="proficiency-section"
            className="flex flex-col justify-center items-center gap-y-8 pb-4 proficiency-section"
          >
            <h2
              aria-labelledby="proficiency-heading"
              className={`${classStyles.sectionHeading} w-full self-start`}
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
      </Suspense>
    </>
  );
}

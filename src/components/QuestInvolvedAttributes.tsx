import { useTranslation } from "react-i18next";
import { useApi } from "../hooks/useApi";
import api from "../lib/api";
import type { AttributeInDb } from "../types/attribute";

type QuestInvolvedAttributesProps = {
  questId: string;
};

// Shows the attributes that are really involved in a quest, using the
// existing endpoint GET /quests-attributes/:questId.
//
// IMPORTANT: render this component ONLY for rewardable quests. A
// non-rewardable quest has no attributes and the endpoint answers 404 for it,
// which would show up here as an error. Keeping the request inside this child
// (instead of inside QuestDetails) lets the parent decide whether the request
// should happen at all, without breaking the rules of hooks.
export default function QuestInvolvedAttributes(
  props: QuestInvolvedAttributesProps,
) {
  const { t } = useTranslation();

  const {
    data: attributes,
    loading,
    error,
  } = useApi<AttributeInDb[]>(
    () => api.get(`/quests-attributes/${props.questId}`),
    [props.questId],
  );

  if (loading) return <p>{t("loading")}</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  // The backend never answers ok with an empty list for this endpoint, but
  // handling it keeps the component safe if that ever changes.
  if (!attributes || attributes.length === 0) return null;

  return (
    <ul className="flex flex-col gap-y-2">
      {attributes.map((attribute) => (
        <li key={attribute.id}>{attribute.name}</li>
      ))}
    </ul>
  );
}

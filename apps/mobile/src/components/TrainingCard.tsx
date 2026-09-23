import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import type { CatalogueTraining } from "../features/catalogue/useTrainings";
import { Badge } from "./Badge";
import { TrainingCoverArt } from "./TrainingCoverArt";
import { IconArrowRight, IconCalendar, IconShieldCheck } from "./Icon";
import { useAppTheme } from "../theme/ThemeProvider";

const CATEGORY_LABELS: Record<string, string> = {
  management: "Management",
  conformite: "Conformité",
  technologies: "Technologies",
};

const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

// Port RN de apps/web/src/app/formations/_components/TrainingCard.tsx —
// même structure que la maquette Stitch mobile (bannière image + badge
// catégorie en overlay, titre, méta, CTA pleine largeur), bouton
// "Découvrir" comme seule cible de tap plutôt que la carte entière, pour
// rester cohérent avec le web et la maquette.
export function TrainingCard({ training }: { training: CatalogueTraining }) {
  const { theme } = useAppTheme();

  return (
    <View className="overflow-hidden rounded-lg border border-border bg-surface">
      <View className="relative h-36 w-full bg-surface">
        {training.imageUrl ? (
          <Image source={{ uri: training.imageUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <TrainingCoverArt seed={training.id} />
        )}
        {training.isPopular && (
          <View className="absolute left-3 top-3">
            <Badge variant="warning">Populaire</Badge>
          </View>
        )}
      </View>

      <View className="gap-4 p-6">
        <View className="flex-row items-start justify-between gap-3">
          <Text className="flex-1 font-display text-lg font-semibold text-foreground">
            {training.title}
          </Text>
          {training.category && (
            <Badge variant="featured">{CATEGORY_LABELS[training.category] ?? training.category}</Badge>
          )}
        </View>

        <Text numberOfLines={2} className="font-body text-sm text-foreground-muted">
          {training.summary}
        </Text>

        {(training.level || training.is_certifying) && (
          <View className="flex-row flex-wrap gap-2">
            {training.level && (
              <Badge variant="neutral">{LEVEL_LABELS[training.level] ?? training.level}</Badge>
            )}
            {training.is_certifying && (
              <Badge variant="success" icon={<IconShieldCheck size={12} color={theme.colors.success.fg} />}>
                Certifiante
              </Badge>
            )}
          </View>
        )}

        <View className="gap-2">
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <Text className="font-body text-sm text-foreground-muted">{training.duration_hours}h</Text>
            <Text className="font-display text-base font-semibold text-foreground">
              {training.price_ht.toLocaleString("fr-FR")} € HT
            </Text>
          </View>
          {training.nextSessionStartsOn && (
            <View className="flex-row items-center gap-1.5">
              <IconCalendar size={14} color={theme.colors.accentText} />
              <Text className="font-body text-xs text-accent-text">
                Prochaine session :{" "}
                {new Date(training.nextSessionStartsOn).toLocaleDateString("fr-FR")}
              </Text>
            </View>
          )}
        </View>

        <Link href={`/(tabs)/formations/${training.slug}`} asChild>
          <Pressable className="h-10 w-full flex-row items-center justify-center gap-2 rounded border border-border">
            <Text className="font-body text-sm font-medium text-foreground">Découvrir</Text>
            <IconArrowRight size={16} color={theme.colors.foreground} />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

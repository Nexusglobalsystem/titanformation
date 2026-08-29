import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useTrainings } from "../../../src/features/catalogue/useTrainings";
import { filterAndSortTrainings, type CatalogueFilters } from "../../../src/features/catalogue/filterTrainings";
import { TrainingCard } from "../../../src/components/TrainingCard";
import { useAppTheme } from "../../../src/theme/ThemeProvider";

const CATEGORY_LABELS: Record<string, string> = {
  management: "Management",
  conformite: "Conformité",
  technologies: "Technologies",
};

const DEFAULT_FILTERS: CatalogueFilters = {
  q: "",
  categorie: "all",
  niveau: "all",
  duree: "all",
  certifiante: false,
  tri: "pertinence",
};

// Catalogue public — recherche + puces catégorie horizontales scrollables
// (façon maquette Stitch catalogue_de_formations_mobile_titan_kinetic,
// déjà repris pour le responsive web) + pile de cartes verticale. Niveau/
// durée/certifiante/tri restent aux valeurs par défaut pour ce lot (v1).
export default function FormationsScreen() {
  const { theme } = useAppTheme();
  const { data: trainings, isLoading } = useTrainings();
  const [q, setQ] = useState("");
  const [categorie, setCategorie] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set((trainings ?? []).map((t) => t.category).filter((c): c is string => Boolean(c)))),
    [trainings],
  );

  const filtered = useMemo(
    () => filterAndSortTrainings(trainings ?? [], { ...DEFAULT_FILTERS, q, categorie }),
    [trainings, q, categorie],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="gap-3 border-b border-border px-gutter py-4">
        <TextInput
          value={q}
          onChangeText={setQ}
          accessibilityLabel="Rechercher une formation"
          placeholder="Rechercher une formation..."
          placeholderTextColor={theme.colors.foregroundMuted}
          className="h-10 rounded border border-border bg-surface px-3 font-body text-sm text-foreground"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          <Pressable
            onPress={() => setCategorie("all")}
            accessibilityRole="button"
            accessibilityState={{ selected: categorie === "all" }}
            className={[
              "rounded-full px-4 py-1.5",
              categorie === "all" ? "bg-accent" : "border border-border",
            ].join(" ")}
          >
            <Text
              className={["font-mono-label text-xs font-semibold", categorie === "all" ? "text-on-accent" : "text-foreground-muted"].join(
                " ",
              )}
            >
              Toutes
            </Text>
          </Pressable>
          {categories.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategorie(c)}
              accessibilityRole="button"
              accessibilityState={{ selected: categorie === c }}
              className={["rounded-full px-4 py-1.5", categorie === c ? "bg-accent" : "border border-border"].join(" ")}
            >
              <Text
                className={["font-mono-label text-xs font-semibold", categorie === c ? "text-on-accent" : "text-foreground-muted"].join(
                  " ",
                )}
              >
                {CATEGORY_LABELS[c] ?? c}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-4 px-gutter py-4"
        renderItem={({ item }) => <TrainingCard training={item} />}
        ListEmptyComponent={
          <Text className="py-16 text-center font-body text-sm text-foreground-muted">
            Aucune formation ne correspond à ta recherche.
          </Text>
        }
      />
    </View>
  );
}

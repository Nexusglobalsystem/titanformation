import { useWindowDimensions } from "react-native";
import { Text, View } from "react-native";
import RenderHTML from "react-native-render-html";
import { useAppTheme } from "../theme/ThemeProvider";

const HTML_TAG_PATTERN = /<[a-z][\s\S]*>/i;

// Équivalent RN de RichOrLegacyText (apps/web/src/app/formations/[slug]/page.tsx)
// — mêmes deux modes (HTML riche du nouvel éditeur vs. texte brut \n des
// fiches jamais rééditées). Contenu déjà sanitisé côté serveur à
// l'écriture (allowlist p/br/strong/em/b/i/ul/ol/li, apps/web/.../trainings.ts)
// — pas de second passage sanitize-html ici : react-native-render-html
// construit un arbre RN (Text/View), il n'injecte jamais de HTML brut
// dans une WebView, donc pas le même risque que dangerouslySetInnerHTML.
export function RichOrLegacyText({
  text,
  muted,
}: {
  text: string | null;
  muted?: boolean;
}) {
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();
  const color = muted ? theme.colors.foregroundMuted : theme.colors.foreground;

  if (!text) return null;

  if (!HTML_TAG_PATTERN.test(text)) {
    const paragraphs = text
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
    return (
      <View className="gap-3">
        {paragraphs.map((p, i) => (
          <Text key={i} className="font-body text-sm" style={{ color }}>
            {p}
          </Text>
        ))}
      </View>
    );
  }

  return (
    <RenderHTML
      contentWidth={width}
      source={{ html: text }}
      baseStyle={{ color, fontFamily: theme.typography.body, fontSize: 14 }}
      tagsStyles={{
        strong: { fontWeight: "600" },
        li: { marginBottom: 4 },
      }}
    />
  );
}

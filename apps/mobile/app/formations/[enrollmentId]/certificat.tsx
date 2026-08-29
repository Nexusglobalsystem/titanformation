import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useCertificate } from "../../../src/features/certificate/useCertificate";
import { useAppTheme } from "../../../src/theme/ThemeProvider";
import { SubmitButton } from "../../../src/components/form/SubmitButton";

// Équivalent RN de apps/web/.../formations/[enrollmentId]/certificat/page.tsx
// — même contenu et mise en page reproduits en RN pour l'affichage à
// l'écran, et en HTML pour l'export PDF (expo-print + expo-sharing,
// équivalent mobile de window.print()/PrintButton).
export default function CertificatScreen() {
  const { enrollmentId } = useLocalSearchParams<{ enrollmentId: string }>();
  const { theme } = useAppTheme();
  const { data, isLoading } = useCertificate(enrollmentId ?? "");
  const [sharing, setSharing] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background px-gutter">
        <Text className="font-body text-foreground-muted">Certificat indisponible.</Text>
      </View>
    );
  }

  const { training, learner, certificate, reasons } = data;

  if (!certificate) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-gutter">
        <Text className="text-center font-body text-sm text-foreground-muted">
          Le certificat n&apos;est pas encore disponible.
        </Text>
        <View className="gap-1">
          {reasons.map((reason) => (
            <Text key={reason} className="text-center font-body text-sm text-foreground-muted">
              {reason}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  const learnerName = `${learner?.first_name ?? ""} ${learner?.last_name ?? ""}`.trim();
  const issuedDate = new Date(certificate.issued_at).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleShare() {
    setSharing(true);
    try {
      const { uri } = await Print.printToFileAsync({
        html: certificateHtml({
          learnerName,
          trainingTitle: training.title,
          durationHours: training.duration_hours,
          issuedDate,
          certificateNumber: certificate!.certificate_number,
          colors: theme.colors,
        }),
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-gutter py-8">
      <SubmitButton onPress={handleShare} loading={sharing}>
        Partager / Enregistrer en PDF
      </SubmitButton>

      <View className="border-2 p-2" style={{ borderColor: theme.colors.accent }}>
        <View className="items-center border border-border p-10">
          <View className="mb-6 h-12 w-12 items-center justify-center rounded-DEFAULT bg-primary">
            <Text className="font-display text-lg font-bold" style={{ color: theme.colors.accent }}>
              TK
            </Text>
          </View>
          <Text className="text-center font-mono-label text-xs uppercase tracking-[3px]" style={{ color: theme.colors.accentText }}>
            Titan Kinetic — Organisme de formation certifié Qualiopi
          </Text>
          <Text className="mt-6 text-center font-display text-3xl font-bold text-foreground">
            Certificat de réussite
          </Text>
          <Text className="mt-8 font-body text-sm text-foreground-muted">Décerné à</Text>
          <Text className="mt-2 text-center font-display text-2xl font-semibold text-foreground">{learnerName}</Text>
          <Text className="mt-8 text-center font-body text-sm text-foreground-muted">
            pour avoir suivi avec succès la formation
          </Text>
          <Text className="mt-2 text-center font-display text-xl font-semibold text-accent-text">
            {training.title}
          </Text>
          <Text className="mt-2 font-body text-sm text-foreground-muted">
            {training.duration_hours} heures de formation
          </Text>

          <View className="mt-10 w-full flex-row items-center justify-between border-t border-border pt-6">
            <View>
              <Text className="font-mono-label text-[10px] uppercase text-foreground-muted">Délivré le</Text>
              <Text className="font-body text-sm text-foreground">{issuedDate}</Text>
            </View>
            <View className="items-end">
              <Text className="font-mono-label text-[10px] uppercase text-foreground-muted">N° de certificat</Text>
              <Text className="font-mono-label text-sm text-foreground">{certificate.certificate_number}</Text>
            </View>
          </View>

          <Text className="mt-10 font-body text-xs italic text-foreground-muted">
            Le responsable pédagogique — Titan Kinetic
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function certificateHtml({
  learnerName,
  trainingTitle,
  durationHours,
  issuedDate,
  certificateNumber,
  colors,
}: {
  learnerName: string;
  trainingTitle: string;
  durationHours: number;
  issuedDate: string;
  certificateNumber: string;
  colors: { primary: string; accent: string; accentText: string; foreground: string; foregroundMuted: string; border: string };
}) {
  return `<!doctype html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, sans-serif; margin: 0; padding: 40px; background: #fff;">
  <div style="border: 2px solid ${colors.accent}; padding: 8px;">
    <div style="border: 1px solid ${colors.border}; padding: 60px 40px; text-align: center;">
      <div style="margin: 0 auto 24px; width: 48px; height: 48px; background: ${colors.primary}; color: ${colors.accent}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; border-radius: 4px;">TK</div>
      <p style="color: ${colors.accentText}; text-transform: uppercase; letter-spacing: 3px; font-size: 11px;">Titan Kinetic — Organisme de formation certifié Qualiopi</p>
      <h1 style="color: ${colors.foreground}; font-size: 30px; margin-top: 24px;">Certificat de réussite</h1>
      <p style="color: ${colors.foregroundMuted}; margin-top: 32px; font-size: 14px;">Décerné à</p>
      <p style="color: ${colors.foreground}; font-size: 22px; font-weight: 600; margin-top: 8px;">${learnerName}</p>
      <p style="color: ${colors.foregroundMuted}; margin-top: 32px; font-size: 14px;">pour avoir suivi avec succès la formation</p>
      <p style="color: ${colors.accentText}; font-size: 20px; font-weight: 600; margin-top: 8px;">${trainingTitle}</p>
      <p style="color: ${colors.foregroundMuted}; font-size: 14px; margin-top: 8px;">${durationHours} heures de formation</p>
      <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 24px; border-top: 1px solid ${colors.border}; text-align: left;">
        <div>
          <p style="font-size: 10px; text-transform: uppercase; color: ${colors.foregroundMuted};">Délivré le</p>
          <p style="font-size: 14px; color: ${colors.foreground};">${issuedDate}</p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 10px; text-transform: uppercase; color: ${colors.foregroundMuted};">N° de certificat</p>
          <p style="font-size: 14px; color: ${colors.foreground};">${certificateNumber}</p>
        </div>
      </div>
      <p style="color: ${colors.foregroundMuted}; font-style: italic; font-size: 12px; margin-top: 40px;">Le responsable pédagogique — Titan Kinetic</p>
    </div>
  </div>
</body>
</html>`;
}

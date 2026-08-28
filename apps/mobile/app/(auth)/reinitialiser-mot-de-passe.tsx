import { StyleSheet, Text, View } from "react-native";

export default function ReinitialiserMotDePasseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Réinitialiser le mot de passe</Text>
      <Text>Atterrissage depuis le deep link email — lot 1.4.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "600" },
});

import { StyleSheet, Text, View } from "react-native";

export default function InscriptionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>
      <Text>Formulaire de création de compte — lot 1.2.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "600" },
});

import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function AccueilScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accueil</Text>
      <Text>Tableau de bord apprenant — lot 3.1.</Text>
      <Link href="/(auth)/connexion">Se connecter</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "600" },
});

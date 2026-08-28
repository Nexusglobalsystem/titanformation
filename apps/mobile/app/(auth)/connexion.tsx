import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function ConnexionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <Text>Formulaire email/mot de passe — lot 1.2.</Text>
      <Link href="/(auth)/inscription">Créer un compte</Link>
      <Link href="/(auth)/mot-de-passe-oublie">Mot de passe oublié</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  title: { fontSize: 20, fontWeight: "600" },
});

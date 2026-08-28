import { StyleSheet, Text, View } from "react-native";

export default function MotDePasseOublieScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mot de passe oublié</Text>
      <Text>Envoi du lien de réinitialisation — lot 1.3.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "600" },
});

import { StyleSheet, Text, View } from "react-native";

export default function FormationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Formations</Text>
      <Text>Catalogue public — lot 2.1.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "600" },
});

import { StyleSheet, Text, View } from "react-native";

export default function AgendaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agenda</Text>
      <Text>Créneaux et réservations — lot 4.1.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "600" },
});

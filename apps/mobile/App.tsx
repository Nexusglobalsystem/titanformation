import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from './src/lib/supabase';

// Vérification jetable du lot 0.1 : confirme que l'env, le client
// Supabase natif et la résolution Metro/pnpm fonctionnent bout en bout.
// Sera remplacé par la coquille Expo Router au lot 0.2.
export default function App() {
  const [status, setStatus] = useState('Connexion à Supabase...');

  useEffect(() => {
    supabase
      .from('trainings')
      .select('id')
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          setStatus(`Erreur Supabase : ${error.message}`);
          return;
        }
        setStatus(`OK — ${data?.length ?? 0} formation(s) lue(s).`);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text>Titan Kinetic — lot 0.1</Text>
      <Text>{status}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

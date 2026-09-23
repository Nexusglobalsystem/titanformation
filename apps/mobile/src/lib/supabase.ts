import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNativeClient } from "@titan-kinetic/core/supabase/native";

export const supabase = createNativeClient(AsyncStorage);

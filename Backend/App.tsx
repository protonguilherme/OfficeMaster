import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Imports dos screens (mesma pasta)
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";
import ForgotPasswordScreen from "./ForgotPasswordScreen";
import HomeScreen from "./HomeScreen";
import ClientsScreen from "./ClientsScreen";
import AddClientScreen from "./AddClientScreen";
import EditClientScreen from "./EditClientScreen";
import ClientDetailsScreen from "./ClientDetailsScreen";
import ServiceOrdersScreen from "./ServiceOrdersScreen";
import AddServiceOrderScreen from "./AddServiceOrderScreen";
import ServiceOrderDetailsScreen from "./ServiceOrderDetailsScreen";
import InventoryScreen from "./InventoryScreen";

// Import do database (mesma pasta)
import { initDatabase } from "./database";

// Import do sistema de Toast
import { ToastProvider } from "./ToastSystem";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: { user: any };
  // Telas de Clientes
  ClientsList: { user: any; shouldRefresh?: boolean; newClientId?: number };
  AddClient: { user: any };
  EditClient: { client: any; user: any };
  ClientDetails: { client: any; user: any };
  // Telas de Ordens de Serviço
  ServiceOrdersList: { user: any; shouldRefresh?: boolean; newServiceOrderId?: number };
  AddServiceOrder: { user: any };
  EditServiceOrder: { serviceOrder: any; user: any };
  ServiceOrderDetails: { serviceOrder: any; user: any };
  // Telas de Estoque
  InventoryList: { user: any; shouldRefresh?: boolean; newItemId?: number };
  AddInventoryItem: { user: any };
  EditInventoryItem: { item: any; user: any };
  InventoryItemDetails: { item: any; user: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Componente de Loading
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>Inicializando Office Master...</Text>
  </View>
);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("Inicializando banco de dados...");
        await initDatabase();
        console.log("Banco de dados inicializado com sucesso!");
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao inicializar o banco:", error);
        setInitError("Falha ao inicializar o aplicativo");
        setIsLoading(false);
        
        Alert.alert(
          "Erro de Inicialização",
          "Houve um problema ao inicializar o aplicativo. Tente reiniciar.",
          [
            {
              text: "Tentar Novamente",
              onPress: () => {
                setIsLoading(true);
                setInitError(null);
                initializeApp();
              }
            }
          ]
        );
      }
    };

    initializeApp();
  }, []);

  // Mostra loading enquanto inicializa
  if (isLoading) {
    return (
      <ToastProvider>
        <LoadingScreen />
      </ToastProvider>
    );
  }

  // Mostra erro se houver problema na inicialização
  if (initError) {
    return (
      <ToastProvider>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {initError}</Text>
          <Text style={styles.errorSubtext}>
            Verifique sua conexão e tente novamente
          </Text>
        </View>
      </ToastProvider>
    );
  }

  // App principal
  return (
    <ToastProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right'
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ClientsList" component={ClientsScreen} />
          <Stack.Screen name="AddClient" component={AddClientScreen} />
          <Stack.Screen name="EditClient" component={EditClientScreen} />
          <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />
          <Stack.Screen name="ServiceOrdersList" component={ServiceOrdersScreen} />
          <Stack.Screen name="AddServiceOrder" component={AddServiceOrderScreen} />
          <Stack.Screen name="ServiceOrderDetails" component={ServiceOrderDetailsScreen} />
          <Stack.Screen name="InventoryList" component={InventoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
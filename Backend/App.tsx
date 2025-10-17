import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import LoginScreen from "./frontend/screens/LoginScreen";
import RegisterScreen from "./frontend/screens/RegisterScreen";
import ForgotPasswordScreen from "./frontend/screens/ForgotPasswordScreen";
import HomeScreen from "./frontend/screens/HomeScreen";
import ClientsScreen from "./frontend/screens/ClientsScreen";
import AddClientScreen from "./frontend/screens/AddClientScreen";
import EditClientScreen from "./frontend/screens/EditClientScreen";
import ClientDetailsScreen from "./frontend/screens/ClientDetailsScreen";
import ServiceOrdersScreen from "./frontend/screens/ServiceOrdersScreen";
import AddServiceOrderScreen from "./frontend/screens/AddServiceOrderScreen";
import ServiceOrderDetailsScreen from "./frontend/screens/ServiceOrderDetailsScreen";
import EditServiceOrderScreen from "./frontend/screens/EditServiceOrderScreen";
import InventoryScreen from "./frontend/screens/InventoryScreen";
import ScheduleScreen from "./frontend/screens/ScheduleScreen";
import AddScheduleScreen from "./frontend/screens/AddScheduleScreen";
import ScheduleDetailsScreen from "./frontend/screens/ScheduleDetailsScreen";

// Database
import { initDatabase } from "./backend/database";

// Toast System
import { ToastProvider } from "./ToastSystem";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: { user: any };
  ClientsList: { user: any; shouldRefresh?: boolean; newClientId?: string };
  AddClient: { user: any };
  EditClient: { client: any; user: any };
  ClientDetails: { client: any; user: any };
  ServiceOrdersList: { user: any; shouldRefresh?: boolean; newServiceOrderId?: string };
  AddServiceOrder: { user: any };
  EditServiceOrder: { serviceOrder: any; user: any };
  ServiceOrderDetails: { serviceOrder: any; user: any };
  InventoryList: { user: any; shouldRefresh?: boolean; newItemId?: string };
  ScheduleList: { user: any; shouldRefresh?: boolean; newScheduleId?: string };
  AddSchedule: { user: any };
  ScheduleDetails: { schedule: any; user: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007A
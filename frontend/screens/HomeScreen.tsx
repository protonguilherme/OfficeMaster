import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import {
  getClients,
  getServiceOrders,
  getSchedules,
  getInventoryItems,
} from '../../backend/database';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
  route: HomeScreenRouteProp;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function HomeScreen({ navigation, route }: Props) {
  const { user } = route.params;
  const [stats, setStats] = useState({
    clients: 0,
    serviceOrders: 0,
    schedules: 0,
    inventory: 0,
  });
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [clients, orders, schedules, inventory] = await Promise.all([
        getClients(user.id),
        getServiceOrders(user.id),
        getSchedules(user.id),
        getInventoryItems(user.id),
      ]);

      setStats({
        clients: clients.length,
        serviceOrders: orders.length,
        schedules: schedules.length,
        inventory: inventory.length,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const UserMenu = () => (
    <Modal
      visible={showUserMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowUserMenu(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowUserMenu(false)}
      >
        <View style={styles.userMenuContainer}>
          <View style={styles.userMenuHeader}>
            <View style={styles.userMenuAvatar}>
              <Text style={styles.userMenuAvatarText}>{getInitials(user.name)}</Text>
            </View>
            <Text style={styles.userMenuName}>{user.name}</Text>
            <Text style={styles.userMenuEmail}>{user.email}</Text>
          </View>

          <TouchableOpacity
            style={styles.userMenuItem}
            onPress={() => {
              setShowUserMenu(false);
              navigation.navigate('Profile', { user });
            }}
          >
            <Text style={styles.userMenuItemIcon}>👤</Text>
            <Text style={styles.userMenuItemText}>Meu Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.userMenuItem}
            onPress={() => {
              setShowUserMenu(false);
              navigation.replace('Login');
            }}
          >
            <Text style={styles.userMenuItemIcon}>🚪</Text>
            <Text style={styles.userMenuItemText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user.name.split(' ')[0]}!</Text>
          <Text style={styles.subGreeting}>Bem-vindo ao Office Master</Text>
        </View>
        <TouchableOpacity
          style={styles.userButton}
          onPress={() => setShowUserMenu(true)}
        >
          <Text style={styles.userInitials}>{getInitials(user.name)}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.clients}</Text>
            <Text style={styles.statLabel}>Clientes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.serviceOrders}</Text>
            <Text style={styles.statLabel}>Ordens</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.schedules}</Text>
            <Text style={styles.statLabel}>Agendamentos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.inventory}</Text>
            <Text style={styles.statLabel}>Itens</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#007AFF' }]}
            onPress={() => navigation.navigate('ClientsList', { user })}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionText}>Clientes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#34C759' }]}
            onPress={() => navigation.navigate('ServiceOrdersList', { user })}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>Ordens de Serviço</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#FF9500' }]}
            onPress={() => navigation.navigate('ScheduleList', { user })}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>Agendamentos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#FF3B30' }]}
            onPress={() => navigation.navigate('InventoryList', { user })}
          >
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionText}>Estoque</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Atividade Recente</Text>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>
            Suas atividades recentes aparecerão aqui
          </Text>
        </View>
      </ScrollView>

      <UserMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: isWeb ? 20 : 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: isWeb ? 150 : (width - 50) / 2,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 30,
  },
  actionCard: {
    flex: 1,
    minWidth: isWeb ? 150 : (width - 55) / 2,
    height: 120,
    borderRadius: 12,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  activityText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: isWeb ? 80 : 100,
    paddingRight: 20,
  },
  userMenuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center',
  },
  userMenuAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  userMenuAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userMenuName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  userMenuEmail: {
    fontSize: 14,
    color: '#666',
  },
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  userMenuItemIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  userMenuItemText: {
    fontSize: 16,
    color: '#000',
  },
});
import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  RefreshControl,
  Dimensions,
  SafeAreaView,
  Modal
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./App";
import { 
  getClientsByUserId, 
  getServiceOrdersByUserId, 
  getServiceOrdersByStatus 
} from "./database";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const { width } = Dimensions.get('window');

// Interface para estatísticas
interface HomeStats {
  totalClients: number;
  todayServices: number;
  monthlyRevenue: number;
  pendingServices: number;
  inProgressServices: number;
  completedThisMonth: number;
  mostActiveClient: string | null;
  averageServiceValue: number;
}

// Componente de Card para estatísticas
interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
  loading?: boolean;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle, 
  loading = false, 
  onPress 
}) => (
  <TouchableOpacity 
    style={[styles.statCard, { borderLeftColor: color }]} 
    onPress={onPress}
    activeOpacity={0.7}
    disabled={loading}
  >
    <View style={styles.statHeader}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, loading && styles.statLoading]}>
        {loading ? "..." : value}
      </Text>
    </View>
    <Text style={styles.statTitle}>{title}</Text>
    {subtitle && (
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    )}
  </TouchableOpacity>
);

// Componente de Item do Menu Principal
interface MenuItemProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  badge?: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ 
  title, 
  description, 
  icon, 
  color, 
  badge, 
  onPress 
}) => (
  <TouchableOpacity 
    style={styles.menuItem} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.menuIconContainer, { backgroundColor: color + '20' }]}>
      <Text style={[styles.menuIcon, { color }]}>{icon}</Text>
    </View>
    <View style={styles.menuContent}>
      <View style={styles.menuHeader}>
        <Text style={styles.menuTitle}>{title}</Text>
        {badge && (
          <View style={[styles.menuBadge, { backgroundColor: color }]}>
            <Text style={styles.menuBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.menuDescription}>{description}</Text>
    </View>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
);

// Modal do Menu do Usuário (mantido igual)
interface UserMenuModalProps {
  visible: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
  onProfile: () => void;
  onSettings: () => void;
}

const UserMenuModal: React.FC<UserMenuModalProps> = ({ 
  visible, 
  onClose, 
  user, 
  onLogout, 
  onProfile, 
  onSettings 
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableOpacity 
      style={styles.modalOverlay} 
      activeOpacity={1} 
      onPress={onClose}
    >
      <View style={styles.userMenu}>
        <View style={styles.userMenuHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userMenuName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.userMenuEmail}>{user?.email}</Text>
            <Text style={styles.userMenuWorkshop}>{user?.workshopName}</Text>
          </View>
        </View>

        <View style={styles.menuDivider} />

        <TouchableOpacity style={styles.userMenuItem} onPress={onProfile}>
          <Text style={styles.userMenuItemIcon}>👤</Text>
          <Text style={styles.userMenuItemText}>Meu Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.userMenuItem} onPress={onSettings}>
          <Text style={styles.userMenuItemIcon}>⚙️</Text>
          <Text style={styles.userMenuItemText}>Configurações</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.userMenuItem} onPress={() => {
          Alert.alert("Em breve", "Módulo de ajuda será implementado em breve!");
          onClose();
        }}>
          <Text style={styles.userMenuItemIcon}>❓</Text>
          <Text style={styles.userMenuItemText}>Ajuda</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.userMenuItem} onPress={() => {
          Alert.alert("Em breve", "Informações sobre o app serão implementadas em breve!");
          onClose();
        }}>
          <Text style={styles.userMenuItemIcon}>ℹ️</Text>
          <Text style={styles.userMenuItemText}>Sobre</Text>
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity 
          style={[styles.userMenuItem, styles.logoutMenuItem]} 
          onPress={() => {
            onClose();
            setTimeout(onLogout, 300);
          }}
        >
          <Text style={styles.userMenuItemIcon}>🚪</Text>
          <Text style={[styles.userMenuItemText, styles.logoutText]}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

export default function HomeScreen({ navigation, route }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [stats, setStats] = useState<HomeStats>({
    totalClients: 0,
    todayServices: 0,
    monthlyRevenue: 0,
    pendingServices: 0,
    inProgressServices: 0,
    completedThisMonth: 0,
    mostActiveClient: null,
    averageServiceValue: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  const user = route.params?.user;

  // Atualiza o horário a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Carrega estatísticas
  const loadStats = async () => {
    if (!user?.id) return;
    
    setStatsLoading(true);
    
    try {
      // Busca dados do database
      const [clients, allServices, pendingServices, inProgressServices] = await Promise.all([
        getClientsByUserId(user.id),
        getServiceOrdersByUserId(user.id),
        getServiceOrdersByStatus(user.id, 'pending'),
        getServiceOrdersByStatus(user.id, 'in_progress'),
      ]);

      // Calcula estatísticas
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Serviços de hoje
      const todayServices = allServices.filter(service => {
        const serviceDate = new Date(service.createdAt || '');
        return serviceDate.toDateString() === today.toDateString();
      });

      // Serviços concluídos neste mês
      const completedThisMonth = allServices.filter(service => {
        if (service.status !== 'completed') return false;
        const serviceDate = new Date(service.createdAt || '');
        return serviceDate >= startOfMonth && serviceDate <= endOfMonth;
      });

      // Receita mensal
      const monthlyRevenue = completedThisMonth.reduce((total, service) => {
        return total + (service.totalCost || 0);
      }, 0);

      // Cliente mais ativo (com mais serviços)
      const clientServiceCount: { [key: string]: { name: string; count: number } } = {};
      allServices.forEach(service => {
        const clientName = (service as any).clientName || 'Cliente não identificado';
        if (!clientServiceCount[clientName]) {
          clientServiceCount[clientName] = { name: clientName, count: 0 };
        }
        clientServiceCount[clientName].count++;
      });

      const mostActiveClient = Object.values(clientServiceCount)
        .sort((a, b) => b.count - a.count)[0]?.name || null;

      // Valor médio dos serviços
      const completedServices = allServices.filter(s => s.status === 'completed');
      const averageServiceValue = completedServices.length > 0
        ? completedServices.reduce((sum, s) => sum + (s.totalCost || 0), 0) / completedServices.length
        : 0;

      // Atualiza estado
      setStats({
        totalClients: clients.length,
        todayServices: todayServices.length,
        monthlyRevenue,
        pendingServices: pendingServices.length,
        inProgressServices: inProgressServices.length,
        completedThisMonth: completedThisMonth.length,
        mostActiveClient,
        averageServiceValue,
      });

    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      Alert.alert("Erro", "Não foi possível carregar as estatísticas");
    } finally {
      setStatsLoading(false);
    }
  };

  // Carrega stats na inicialização
  useEffect(() => {
    loadStats();
  }, [user?.id]);

  // Função de refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setCurrentTime(new Date());
    await loadStats();
    setRefreshing(false);
  }, []);

  // Função de logout
  const handleLogout = () => {
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive",
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        }
      ]
    );
  };

  // Funções de navegação
  const handleClientsPress = () => {
    navigation.navigate("ClientsList", { user });
  };

  const handleServiceOrdersPress = () => {
    navigation.navigate("ServiceOrdersList", { user });
  };

  const handleInventoryPress = () => {
    navigation.navigate("InventoryList", { user });
  };

  const handleSchedulePress = () => {
    Alert.alert("Em breve", "Módulo de agendamentos será implementado em breve!");
  };

  const handleReportsPress = () => {
    Alert.alert("Em breve", "Módulo de relatórios será implementado em breve!");
  };

  const handleProfilePress = () => {
    setUserMenuVisible(false);
    Alert.alert("Em breve", "Edição de perfil será implementada em breve!");
  };

  const handleSettingsPress = () => {
    setUserMenuVisible(false);
    Alert.alert("Em breve", "Configurações serão implementadas em breve!");
  };

  // Formatação
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Fixo */}
      <View style={styles.stickyHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.greetingText}>{getGreeting()}, {user?.firstName || 'Usuário'}!</Text>
          <Text style={styles.workshopName}>{user?.workshopName || 'Sua Oficina'}</Text>
          <Text style={styles.dateTime}>
            {formatDate(currentTime)} • {formatTime(currentTime)}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.userMenuButton} 
          onPress={() => setUserMenuVisible(true)}
        >
          <View style={styles.userAvatarSmall}>
            <Text style={styles.userAvatarSmallText}>
              {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Conteúdo com Scroll */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Estatísticas Principais */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Resumo do Negócio</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Clientes Ativos"
              value={stats.totalClients}
              icon="👥"
              color="#007AFF"
              loading={statsLoading}
              onPress={handleClientsPress}
            />
            <StatCard
              title="Serviços Hoje"
              value={stats.todayServices}
              icon="🔧"
              color="#34C759"
              loading={statsLoading}
              onPress={handleServiceOrdersPress}
            />
            <StatCard
              title="Receita Mensal"
              value={formatCurrency(stats.monthlyRevenue)}
              icon="💰"
              color="#FF9500"
              loading={statsLoading}
              onPress={handleReportsPress}
            />
            <StatCard
              title="Serviços Pendentes"
              value={stats.pendingServices}
              icon="⏳"
              color="#AF52DE"
              loading={statsLoading}
              onPress={handleServiceOrdersPress}
            />
          </View>
        </View>

        {/* Estatísticas Detalhadas */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Estatísticas do Mês</Text>
          <View style={styles.detailedStats}>
            <View style={styles.detailedStatItem}>
              <Text style={styles.detailedStatLabel}>Serviços em Andamento</Text>
              <Text style={styles.detailedStatValue}>
                {statsLoading ? "..." : stats.inProgressServices}
              </Text>
            </View>
            <View style={styles.detailedStatItem}>
              <Text style={styles.detailedStatLabel}>Concluídos este Mês</Text>
              <Text style={styles.detailedStatValue}>
                {statsLoading ? "..." : stats.completedThisMonth}
              </Text>
            </View>
            <View style={styles.detailedStatItem}>
              <Text style={styles.detailedStatLabel}>Valor Médio por Serviço</Text>
              <Text style={styles.detailedStatValue}>
                {statsLoading ? "..." : formatCurrency(stats.averageServiceValue)}
              </Text>
            </View>
            {stats.mostActiveClient && (
              <View style={styles.detailedStatItem}>
                <Text style={styles.detailedStatLabel}>Cliente Mais Ativo</Text>
                <Text style={styles.detailedStatValue}>
                  {statsLoading ? "..." : stats.mostActiveClient}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Menu Principal */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Gerenciar Oficina</Text>
          
          <MenuItem
            title="Clientes"
            description="Cadastrar e gerenciar clientes"
            icon="👥"
            color="#007AFF"
            badge={stats.totalClients > 0 ? stats.totalClients.toString() : undefined}
            onPress={handleClientsPress}
          />
          
          <MenuItem
            title="Ordens de Serviço"
            description="Criar e acompanhar serviços"
            icon="📋"
            color="#34C759"
            badge={stats.pendingServices > 0 ? stats.pendingServices.toString() : undefined}
            onPress={handleServiceOrdersPress}
          />
          
          <MenuItem
            title="Estoque"
            description="Controlar peças e materiais"
            icon="📦"
            color="#FF9500"
            onPress={handleInventoryPress}
          />
          
          <MenuItem
            title="Agendamentos"
            description="Calendário de serviços"
            icon="📅"
            color="#AF52DE"
            onPress={handleSchedulePress}
          />
          
          <MenuItem
            title="Relatórios"
            description="Análises e estatísticas"
            icon="📊"
            color="#FF3B30"
            onPress={handleReportsPress}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickAction} onPress={handleClientsPress}>
              <Text style={styles.quickActionIcon}>➕</Text>
              <Text style={styles.quickActionText}>Novo Cliente</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={handleServiceOrdersPress}>
              <Text style={styles.quickActionIcon}>🔧</Text>
              <Text style={styles.quickActionText}>Nova OS</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={handleInventoryPress}>
              <Text style={styles.quickActionIcon}>📥</Text>
              <Text style={styles.quickActionText}>Entrada Peças</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={handleSchedulePress}>
              <Text style={styles.quickActionIcon}>📅</Text>
              <Text style={styles.quickActionText}>Agendar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Office Master v1.0</Text>
          <Text style={styles.footerText}>Gerencie sua oficina com facilidade</Text>
        </View>
      </ScrollView>

      {/* Modal do Menu do Usuário */}
      <UserMenuModal
        visible={userMenuVisible}
        onClose={() => setUserMenuVisible(false)}
        user={user}
        onLogout={handleLogout}
        onProfile={handleProfilePress}
        onSettings={handleSettingsPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // HEADER FIXO
  stickyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  workshopName: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  
  // BOTÃO DO MENU DO USUÁRIO
  userMenuButton: {
    padding: 4,
  },
  userAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarSmallText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // SCROLL VIEW
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // SEÇÕES
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: (width - 50) / 2,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLoading: {
    color: '#999',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },

  // ESTATÍSTICAS DETALHADAS
  detailedStats: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailedStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailedStatLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  detailedStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  // MENU
  menuSection: {
    padding: 20,
    paddingTop: 0,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuContent: {
    flex: 1,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  menuBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
  },
  menuArrow: {
    fontSize: 20,
    color: '#ccc',
    fontWeight: 'bold',
  },
  quickActionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 60) / 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
    textAlign: 'center',
  },
  
  // MODAL DO MENU DO USUÁRIO (mantido igual)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 20,
  },
  userMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  userMenuHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userMenuName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  userMenuEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userMenuWorkshop: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e1e5e9',
    marginVertical: 8,
  },
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  userMenuItemIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 25,
    textAlign: 'center',
  },
  userMenuItemText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  logoutMenuItem: {
    marginTop: 8,
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: '600',
  },});
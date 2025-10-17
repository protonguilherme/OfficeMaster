import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  RefreshControl,
  Dimensions,
  SafeAreaView
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { getServiceOrdersByUserId, deleteServiceOrder, ServiceOrder } from "../database";
import { useToast, toast } from "../ToastSystem";

type Props = NativeStackScreenProps<RootStackParamList, "ServiceOrdersList">;

const { width } = Dimensions.get('window');

// Componente de Item da Ordem de Serviço
interface ServiceOrderItemProps {
  serviceOrder: ServiceOrder & { clientName?: string };
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ServiceOrderItem: React.FC<ServiceOrderItemProps> = ({ serviceOrder, onPress, onEdit, onDelete }) => {
  const getStatusColor = (status: ServiceOrder['status']) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'in_progress': return '#007AFF';
      case 'completed': return '#34C759';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: ServiceOrder['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getPriorityColor = (priority: ServiceOrder['priority']) => {
    switch (priority) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#007AFF';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getPriorityText = (priority: ServiceOrder['priority']) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <TouchableOpacity style={styles.serviceOrderItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.serviceOrderHeader}>
        <View style={styles.serviceOrderInfo}>
          <Text style={styles.serviceOrderTitle} numberOfLines={2}>{serviceOrder.title}</Text>
          <Text style={styles.clientName}>{serviceOrder.clientName || 'Cliente não identificado'}</Text>
          {serviceOrder.vehicleInfo && (
            <Text style={styles.vehicleInfo}>{serviceOrder.vehicleInfo}</Text>
          )}
        </View>
        
        <View style={styles.serviceOrderMeta}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(serviceOrder.status) }]}>
            <Text style={styles.statusText}>{getStatusText(serviceOrder.status)}</Text>
          </View>
          <View style={[styles.priorityBadge, { borderColor: getPriorityColor(serviceOrder.priority) }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(serviceOrder.priority) }]}>
              {getPriorityText(serviceOrder.priority)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.serviceOrderFooter}>
        <View style={styles.serviceOrderDetails}>
          <Text style={styles.totalCost}>{formatCurrency(serviceOrder.totalCost)}</Text>
          <Text style={styles.createdDate}>
            Criado em {formatDate(serviceOrder.createdAt)}
          </Text>
        </View>
        
        <View style={styles.serviceOrderActions}>
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Text style={styles.actionIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Componente de Estado Vazio
const EmptyState: React.FC<{ onAddServiceOrder: () => void }> = ({ onAddServiceOrder }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>🔧</Text>
    <Text style={styles.emptyTitle}>Nenhuma ordem de serviço</Text>
    <Text style={styles.emptyDescription}>
      Comece criando sua primeira ordem de serviço para gerenciar os trabalhos da oficina
    </Text>
    <TouchableOpacity style={styles.addButton} onPress={onAddServiceOrder}>
      <Text style={styles.addButtonText}>➕ Criar Primeira OS</Text>
    </TouchableOpacity>
  </View>
);

// Componente de Filtro por Status
interface StatusFilterProps {
  selectedStatus: ServiceOrder['status'] | 'all';
  onStatusChange: (status: ServiceOrder['status'] | 'all') => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ selectedStatus, onStatusChange }) => {
  const statuses: Array<{key: ServiceOrder['status'] | 'all', label: string, color: string}> = [
    { key: 'all', label: 'Todas', color: '#8E8E93' },
    { key: 'pending', label: 'Pendentes', color: '#FF9500' },
    { key: 'in_progress', label: 'Em Andamento', color: '#007AFF' },
    { key: 'completed', label: 'Concluídas', color: '#34C759' },
  ];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.statusFilterContainer}
    >
      {statuses.map(status => (
        <TouchableOpacity
          key={status.key}
          style={[
            styles.statusFilterButton,
            selectedStatus === status.key && [styles.statusFilterButtonActive, { borderColor: status.color }]
          ]}
          onPress={() => onStatusChange(status.key)}
        >
          <Text style={[
            styles.statusFilterText,
            selectedStatus === status.key && [styles.statusFilterTextActive, { color: status.color }]
          ]}>
            {status.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default function ServiceOrdersScreen({ navigation, route }: Props) {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [filteredServiceOrders, setFilteredServiceOrders] = useState<ServiceOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ServiceOrder['status'] | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const user = route.params?.user;
  const shouldRefresh = route.params?.shouldRefresh;
  const newServiceOrderId = route.params?.newServiceOrderId;
  
  const { showToast } = useToast();

  // Carrega ordens de serviço
  const loadServiceOrders = async () => {
    try {
      if (!user?.id) {
        showToast(toast.error("Erro", "Usuário não identificado"));
        return;
      }

      const serviceOrdersList = await getServiceOrdersByUserId(user.id);
      setServiceOrders(serviceOrdersList);
      applyFilters(serviceOrdersList, selectedStatus, searchQuery);

      // Se veio uma nova OS, mostra destaque
      if (newServiceOrderId && serviceOrdersList.length > 0) {
        const newServiceOrder = serviceOrdersList.find(so => so.id === newServiceOrderId);
        if (newServiceOrder) {
          showToast(toast.success(
            "OS adicionada!",
            `"${newServiceOrder.title}" agora está na sua lista`,
            2000
          ));
        }
      }
    } catch (error) {
      console.error("Erro ao carregar ordens de serviço:", error);
      showToast(toast.error("Erro", "Não foi possível carregar as ordens de serviço"));
    } finally {
      setLoading(false);
    }
  };

  // Aplica filtros
  const applyFilters = (
    orders: ServiceOrder[], 
    status: ServiceOrder['status'] | 'all', 
    query: string
  ) => {
    let filtered = orders;

    // Filtro por status
    if (status !== 'all') {
      filtered = filtered.filter(so => so.status === status);
    }

    // Filtro por busca
    if (query.trim() !== '') {
      const searchTerm = query.trim().toLowerCase();
      filtered = filtered.filter(so => 
        so.title.toLowerCase().includes(searchTerm) ||
        (so as any).clientName?.toLowerCase().includes(searchTerm) ||
        so.vehicleInfo?.toLowerCase().includes(searchTerm) ||
        so.description?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredServiceOrders(filtered);
  };

  // Efeito inicial
  useEffect(() => {
    loadServiceOrders();
  }, [user?.id]);

  // Efeito para auto-refresh quando volta de AddServiceOrder
  useEffect(() => {
    if (shouldRefresh) {
      loadServiceOrders();
      // Reset do parâmetro para evitar recarregamento desnecessário
      navigation.setParams({ shouldRefresh: false, newServiceOrderId: undefined });
    }
  }, [shouldRefresh, newServiceOrderId]);

  // Efeito para focar na tela (quando volta de outras telas)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Recarrega sempre que a tela ganha foco (volta de edição, detalhes, etc)
      loadServiceOrders();
    });

    return unsubscribe;
  }, [navigation]);

  // Efeito para aplicar filtros
  useEffect(() => {
    applyFilters(serviceOrders, selectedStatus, searchQuery);
  }, [serviceOrders, selectedStatus, searchQuery]);

  // Pull-to-refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadServiceOrders();
    setRefreshing(false);
  }, []);

  // Navegar para criar OS
  const handleAddServiceOrder = () => {
    navigation.navigate("AddServiceOrder", { user });
  };

  // Visualizar detalhes da OS
  const handleViewServiceOrder = (serviceOrder: ServiceOrder) => {
    navigation.navigate("ServiceOrderDetails", { serviceOrder, user });
  };

  // Editar OS
  const handleEditServiceOrder = (serviceOrder: ServiceOrder) => {
    navigation.navigate("EditServiceOrder", { serviceOrder, user });
  };

  // Deletar OS
  const handleDeleteServiceOrder = (serviceOrder: ServiceOrder) => {
    Alert.alert(
      "Excluir Ordem de Serviço",
      `Tem certeza que deseja excluir "${serviceOrder.title}"?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteServiceOrder(serviceOrder.id!);
              await loadServiceOrders();
              showToast(toast.success("OS excluída", `"${serviceOrder.title}" foi removida da lista`));
            } catch (error) {
              console.error("Erro ao excluir OS:", error);
              showToast(toast.error("Erro", "Não foi possível excluir a ordem de serviço"));
            }
          }
        }
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando ordens de serviço...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ordens de Serviço</Text>
          <Text style={styles.headerSubtitle}>
            {filteredServiceOrders.length} {filteredServiceOrders.length === 1 ? 'ordem' : 'ordens'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addHeaderButton} onPress={handleAddServiceOrder}>
          <Text style={styles.addHeaderButtonText}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros de Status */}
      <StatusFilter 
        selectedStatus={selectedStatus} 
        onStatusChange={setSelectedStatus} 
      />

      {/* Barra de Busca */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por título, cliente ou veículo..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={() => setSearchQuery("")}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de Ordens de Serviço */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredServiceOrders.length === 0 ? (
          searchQuery.trim() === "" && selectedStatus === 'all' ? (
            <EmptyState onAddServiceOrder={handleAddServiceOrder} />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsIcon}>🔍</Text>
              <Text style={styles.noResultsTitle}>Nenhum resultado</Text>
              <Text style={styles.noResultsDescription}>
                {searchQuery ? `Não encontramos ordens para "${searchQuery}"` : 
                 `Não há ordens com status "${selectedStatus}"`}
              </Text>
              <TouchableOpacity 
                style={styles.clearFiltersButton} 
                onPress={() => {
                  setSearchQuery("");
                  setSelectedStatus('all');
                }}
              >
                <Text style={styles.clearFiltersButtonText}>Limpar Filtros</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.serviceOrdersList}>
            {filteredServiceOrders.map((serviceOrder) => (
              <ServiceOrderItem
                key={serviceOrder.id}
                serviceOrder={serviceOrder}
                onPress={() => handleViewServiceOrder(serviceOrder)}
                onEdit={() => handleEditServiceOrder(serviceOrder)}
                onDelete={() => handleDeleteServiceOrder(serviceOrder)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Botão Flutuante para Adicionar */}
      {serviceOrders.length > 0 && (
        <TouchableOpacity style={styles.floatingButton} onPress={handleAddServiceOrder}>
          <Text style={styles.floatingButtonText}>➕</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // LOADING
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  
  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerLeft: {
    flex: 1,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  addHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  addHeaderButtonText: {
    fontSize: 20,
    color: '#fff',
  },

  // FILTROS DE STATUS
  statusFilterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  statusFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    backgroundColor: '#fff',
    marginRight: 10,
  },
  statusFilterButtonActive: {
    borderWidth: 2,
    backgroundColor: '#f8f9fa',
  },
  statusFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusFilterTextActive: {
    fontWeight: '600',
  },
  
  // BUSCA
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  searchInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#1a1a1a',
  },
  clearButton: {
    padding: 15,
    paddingLeft: 5,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999',
  },
  
  // SCROLL VIEW
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // LISTA DE ORDENS
  serviceOrdersList: {
    padding: 20,
    paddingTop: 10,
  },
  serviceOrderItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  serviceOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  serviceOrderInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceOrderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
  },
  serviceOrderMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  serviceOrderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  serviceOrderDetails: {
    flex: 1,
  },
  totalCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 2,
  },
  createdDate: {
    fontSize: 12,
    color: '#999',
  },
  serviceOrderActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#f8f9fa',
  },
  actionIcon: {
    fontSize: 14,
  },
  
  // ESTADO VAZIO
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // SEM RESULTADOS
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  noResultsIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  noResultsDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  clearFiltersButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  clearFiltersButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // BOTÃO FLUTUANTE
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
});
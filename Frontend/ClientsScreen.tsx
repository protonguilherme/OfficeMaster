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
import { RootStackParamList } from "./App";
import { getClientsByUserId, searchClients, deleteClient, Client } from "./database";
import { useToast, toast } from "./ToastSystem";

type Props = NativeStackScreenProps<RootStackParamList, "ClientsList">;

const { width } = Dimensions.get('window');

// Componente de Item do Cliente
interface ClientItemProps {
  client: Client;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ClientItem: React.FC<ClientItemProps> = ({ client, onPress, onEdit, onDelete }) => {
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <TouchableOpacity style={styles.clientItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.clientAvatar}>
        <Text style={styles.clientInitials}>{getInitials(client.name)}</Text>
      </View>
      
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{client.name}</Text>
        <Text style={styles.clientPhone}>{formatPhone(client.phone)}</Text>
        {client.email && <Text style={styles.clientEmail}>{client.email}</Text>}
      </View>
      
      <View style={styles.clientActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// Componente de Estado Vazio
const EmptyState: React.FC<{ onAddClient: () => void }> = ({ onAddClient }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>👥</Text>
    <Text style={styles.emptyTitle}>Nenhum cliente cadastrado</Text>
    <Text style={styles.emptyDescription}>
      Comece adicionando seus primeiros clientes para gerenciar seus serviços
    </Text>
    <TouchableOpacity style={styles.addButton} onPress={onAddClient}>
      <Text style={styles.addButtonText}>➕ Adicionar Primeiro Cliente</Text>
    </TouchableOpacity>
  </View>
);

export default function ClientsScreen({ navigation, route }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const user = route.params?.user;
  const shouldRefresh = route.params?.shouldRefresh;
  const newClientId = route.params?.newClientId;
  
  const { showToast } = useToast();

  // Carrega clientes
  const loadClients = async () => {
    try {
      if (!user?.id) {
        showToast(toast.error("Erro", "Usuário não identificado"));
        return;
      }

      const clientsList = await getClientsByUserId(user.id);
      setClients(clientsList);
      setFilteredClients(clientsList);

      // Se veio um novo cliente, mostra destaque
      if (newClientId && clientsList.length > 0) {
        const newClient = clientsList.find(c => c.id === newClientId);
        if (newClient) {
          showToast(toast.success(
            "Cliente adicionado!",
            `${newClient.name} agora está na sua lista`,
            2000
          ));
        }
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      showToast(toast.error("Erro", "Não foi possível carregar os clientes"));
    } finally {
      setLoading(false);
    }
  };

  // Efeito inicial
  useEffect(() => {
    loadClients();
  }, [user?.id]);

  // Efeito para auto-refresh quando volta de AddClient
  useEffect(() => {
    if (shouldRefresh) {
      loadClients();
      // Reset do parâmetro para evitar recarregamento desnecessário
      navigation.setParams({ shouldRefresh: false, newClientId: undefined });
    }
  }, [shouldRefresh, newClientId]);

  // Efeito para focar na tela (quando volta de outras telas)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Recarrega sempre que a tela ganha foco (volta de edição, detalhes, etc)
      loadClients();
    });

    return unsubscribe;
  }, [navigation]);

  // Busca em tempo real
  useEffect(() => {
    const performSearch = async () => {
      if (!user?.id) return;

      try {
        if (searchQuery.trim() === "") {
          setFilteredClients(clients);
        } else {
          const results = await searchClients(user.id, searchQuery);
          setFilteredClients(results);
        }
      } catch (error) {
        console.error("Erro na busca:", error);
      }
    };

    // Debounce da busca
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, clients, user?.id]);

  // Pull-to-refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  }, []);

  // Navegar para adicionar cliente
  const handleAddClient = () => {
    navigation.navigate("AddClient", { user });
  };

  // Visualizar detalhes do cliente
  const handleViewClient = (client: Client) => {
    navigation.navigate("ClientDetails", { client, user });
  };

  // Editar cliente
  const handleEditClient = (client: Client) => {
    navigation.navigate("EditClient", { client, user });
  };

  // Deletar cliente
  const handleDeleteClient = (client: Client) => {
    Alert.alert(
      "Excluir Cliente",
      `Tem certeza que deseja excluir ${client.name}?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteClient(client.id!);
              await loadClients(); // Recarrega a lista
              showToast(toast.success("Cliente excluído", `${client.name} foi removido da lista`));
            } catch (error) {
              console.error("Erro ao excluir cliente:", error);
              showToast(toast.error("Erro", "Não foi possível excluir o cliente"));
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
          <Text style={styles.loadingText}>Carregando clientes...</Text>
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
          <Text style={styles.headerTitle}>Clientes</Text>
          <Text style={styles.headerSubtitle}>
            {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addHeaderButton} onPress={handleAddClient}>
          <Text style={styles.addHeaderButtonText}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de Busca */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar clientes por nome, telefone ou email..."
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

      {/* Lista de Clientes */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredClients.length === 0 ? (
          searchQuery.trim() === "" ? (
            <EmptyState onAddClient={handleAddClient} />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsIcon}>🔍</Text>
              <Text style={styles.noResultsTitle}>Nenhum resultado encontrado</Text>
              <Text style={styles.noResultsDescription}>
                Não encontramos clientes para "{searchQuery}"
              </Text>
              <TouchableOpacity 
                style={styles.clearSearchButton} 
                onPress={() => setSearchQuery("")}
              >
                <Text style={styles.clearSearchButtonText}>Limpar Busca</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.clientsList}>
            {filteredClients.map((client) => (
              <ClientItem
                key={client.id}
                client={client}
                onPress={() => handleViewClient(client)}
                onEdit={() => handleEditClient(client)}
                onDelete={() => handleDeleteClient(client)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Botão Flutuante para Adicionar */}
      {clients.length > 0 && (
        <TouchableOpacity style={styles.floatingButton} onPress={handleAddClient}>
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
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
  
  // BUSCA
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    paddingBottom: 100, // Espaço para botão flutuante
  },
  
  // LISTA DE CLIENTES
  clientsList: {
    padding: 20,
    paddingTop: 10,
  },
  clientItem: {
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
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  clientInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 14,
    color: '#007AFF',
  },
  clientActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#f8f9fa',
  },
  actionIcon: {
    fontSize: 16,
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
  clearSearchButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  clearSearchButtonText: {
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
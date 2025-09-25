import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  SafeAreaView,
  Linking
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./App";
import { deleteClient, Client } from "./database";

type Props = NativeStackScreenProps<RootStackParamList, "ClientDetails">;

export default function ClientDetailsScreen({ navigation, route }: Props) {
  const [loading, setLoading] = useState(false);
  const { client, user } = route.params;

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleCallClient = () => {
    const phoneNumber = client.phone.replace(/\D/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmailClient = () => {
    if (client.email) {
      Linking.openURL(`mailto:${client.email}`);
    }
  };

  const handleEditClient = () => {
    navigation.navigate("EditClient", { client, user });
  };

  const handleDeleteClient = () => {
    Alert.alert(
      "Excluir Cliente",
      `Tem certeza que deseja excluir ${client.name}?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteClient(client.id!);
              Alert.alert("Sucesso", "Cliente excluído com sucesso!", [
                {
                  text: "OK",
                  onPress: () => navigation.goBack()
                }
              ]);
            } catch (error) {
              console.error("Erro ao excluir cliente:", error);
              Alert.alert("Erro", "Não foi possível excluir o cliente");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Cliente</Text>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={handleEditClient}
        >
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Avatar e Nome */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(client.name)}</Text>
          </View>
          <Text style={styles.clientName}>{client.name}</Text>
          <Text style={styles.clientId}>Cliente #{client.id}</Text>
        </View>

        {/* Informações de Contato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contato</Text>
          
          <TouchableOpacity style={styles.contactItem} onPress={handleCallClient}>
            <View style={styles.contactIcon}>
              <Text style={styles.contactEmoji}>📞</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Telefone</Text>
              <Text style={styles.contactValue}>{formatPhone(client.phone)}</Text>
            </View>
            <Text style={styles.contactAction}>›</Text>
          </TouchableOpacity>

          {client.email && (
            <TouchableOpacity style={styles.contactItem} onPress={handleEmailClient}>
              <View style={styles.contactIcon}>
                <Text style={styles.contactEmoji}>✉️</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{client.email}</Text>
              </View>
              <Text style={styles.contactAction}>›</Text>
            </TouchableOpacity>
          )}

          {client.address && (
            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Text style={styles.contactEmoji}>📍</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Endereço</Text>
                <Text style={styles.contactValue}>{client.address}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Observações */}
        {client.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{client.notes}</Text>
            </View>
          </View>
        )}

        {/* Informações do Sistema */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Cliente desde</Text>
            <Text style={styles.infoValue}>
              {client.createdAt ? formatDate(client.createdAt) : 'N/A'}
            </Text>
          </View>
          
          {client.updatedAt && client.createdAt !== client.updatedAt && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Última atualização</Text>
              <Text style={styles.infoValue}>{formatDate(client.updatedAt)}</Text>
            </View>
          )}
        </View>

        {/* Histórico de Serviços (placeholder para futuro) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Serviços</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={styles.emptyTitle}>Nenhum serviço realizado</Text>
            <Text style={styles.emptyDescription}>
              Quando você criar ordens de serviço para este cliente, elas aparecerão aqui.
            </Text>
          </View>
        </View>

        {/* Ações */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.editActionButton} onPress={handleEditClient}>
            <Text style={styles.editActionButtonText}>✏️ Editar Cliente</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDeleteClient}
            disabled={loading}
          >
            <Text style={styles.deleteButtonText}>
              {loading ? "Excluindo..." : "🗑️ Excluir Cliente"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  backButton: {
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  editButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  editButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  
  // SCROLL VIEW
  scrollView: {
    flex: 1,
  },
  
  // PROFILE SECTION
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  clientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
    textAlign: 'center',
  },
  clientId: {
    fontSize: 16,
    color: '#666',
  },
  
  // SECTIONS
  section: {
    backgroundColor: '#fff',
    marginBottom: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  
  // CONTACT ITEMS
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactEmoji: {
    fontSize: 20,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  contactAction: {
    fontSize: 20,
    color: '#ccc',
    fontWeight: 'bold',
  },
  
  // NOTES
  notesContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  notesText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
  },
  
  // INFO ITEMS
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  
  // EMPTY STATE
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // ACTIONS
  actionsSection: {
    padding: 20,
    paddingBottom: 40,
  },
  editActionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  editActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
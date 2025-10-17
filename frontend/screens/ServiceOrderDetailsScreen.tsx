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
import { RootStackParamList } from "../App";
import { deleteServiceOrder, updateServiceOrder, ServiceOrder } from "../database";

type Props = NativeStackScreenProps<RootStackParamList, "ServiceOrderDetails">;

export default function ServiceOrderDetailsScreen({ navigation, route }: Props) {
  const [loading, setLoading] = useState(false);
  const [serviceOrder, setServiceOrder] = useState(route.params.serviceOrder);
  const { user } = route.params;

  // Formatação
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Status e Prioridade
  const getStatusInfo = (status: ServiceOrder['status']) => {
    switch (status) {
      case 'pending':
        return { text: 'Pendente', color: '#FF9500', icon: '⏳' };
      case 'in_progress':
        return { text: 'Em Andamento', color: '#007AFF', icon: '🔄' };
      case 'completed':
        return { text: 'Concluído', color: '#34C759', icon: '✅' };
      case 'cancelled':
        return { text: 'Cancelado', color: '#FF3B30', icon: '❌' };
      default:
        return { text: status, color: '#8E8E93', icon: '❓' };
    }
  };

  const getPriorityInfo = (priority: ServiceOrder['priority']) => {
    switch (priority) {
      case 'urgent':
        return { text: 'Urgente', color: '#FF3B30', icon: '🚨' };
      case 'high':
        return { text: 'Alta', color: '#FF9500', icon: '⚡' };
      case 'medium':
        return { text: 'Média', color: '#007AFF', icon: '📋' };
      case 'low':
        return { text: 'Baixa', color: '#34C759', icon: '📝' };
      default:
        return { text: priority, color: '#8E8E93', icon: '❓' };
    }
  };

  // Ações do Status
  const handleStatusChange = (newStatus: ServiceOrder['status']) => {
    const statusInfo = getStatusInfo(newStatus);
    
    Alert.alert(
      "Alterar Status",
      `Confirma alteração para "${statusInfo.text}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => updateStatus(newStatus)
        }
      ]
    );
  };

  const updateStatus = async (newStatus: ServiceOrder['status']) => {
    setLoading(true);
    try {
      const updateData: Partial<ServiceOrder> = { status: newStatus };
      
      // Se concluindo, adiciona data de conclusão
      if (newStatus === 'completed') {
        updateData.actualCompletion = new Date().toISOString();
      }

      const updatedServiceOrder = await updateServiceOrder(serviceOrder.id!, updateData);
      setServiceOrder(updatedServiceOrder);
      
      const statusInfo = getStatusInfo(newStatus);
      Alert.alert("Status atualizado!", `A ordem foi marcada como "${statusInfo.text}".`);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      Alert.alert("Erro", "Não foi possível atualizar o status.");
    } finally {
      setLoading(false);
    }
  };

  // Outras ações
  const handleCallClient = () => {
    if (serviceOrder.clientPhone) {
      const phoneNumber = serviceOrder.clientPhone.replace(/\D/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleEditServiceOrder = () => {
    navigation.navigate("EditServiceOrder", { serviceOrder, user });
  };

  const handleDeleteServiceOrder = () => {
    Alert.alert(
      "Excluir Ordem de Serviço",
      `Tem certeza que deseja excluir "${serviceOrder.title}"?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteServiceOrder(serviceOrder.id!);
              Alert.alert("Sucesso", "Ordem de serviço excluída!", [
                {
                  text: "OK",
                  onPress: () => navigation.goBack()
                }
              ]);
            } catch (error) {
              console.error("Erro ao excluir OS:", error);
              Alert.alert("Erro", "Não foi possível excluir a ordem de serviço");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const statusInfo = getStatusInfo(serviceOrder.status);
  const priorityInfo = getPriorityInfo(serviceOrder.priority);

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
        <Text style={styles.headerTitle}>OS #{serviceOrder.id}</Text>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={handleEditServiceOrder}
          disabled={loading}
        >
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status e Prioridade */}
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
              <Text style={styles.statusText}>{statusInfo.text}</Text>
            </View>
            
            <View style={[styles.priorityBadge, { borderColor: priorityInfo.color }]}>
              <Text style={styles.priorityIcon}>{priorityInfo.icon}</Text>
              <Text style={[styles.priorityText, { color: priorityInfo.color }]}>
                {priorityInfo.text}
              </Text>
            </View>
          </View>
        </View>

        {/* Informações Principais */}
        <View style={styles.section}>
          <Text style={styles.serviceTitle}>{serviceOrder.title}</Text>
          <Text style={styles.serviceId}>OS #{serviceOrder.id}</Text>
        </View>

        {/* Informações do Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          
          <TouchableOpacity 
            style={styles.clientInfo} 
            onPress={handleCallClient}
            disabled={!serviceOrder.clientPhone}
          >
            <View style={styles.clientDetails}>
              <Text style={styles.clientName}>
                {(serviceOrder as any).clientName || 'Cliente não identificado'}
              </Text>
              {serviceOrder.clientPhone && (
                <Text style={styles.clientPhone}>
                  📞 {serviceOrder.clientPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                </Text>
              )}
            </View>
            {serviceOrder.clientPhone && (
              <Text style={styles.callIcon}>📞</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Informações do Veículo */}
        {serviceOrder.vehicleInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Veículo</Text>
            <View style={styles.infoCard}>
              <Text style={styles.vehicleInfo}>🚗 {serviceOrder.vehicleInfo}</Text>
            </View>
          </View>
        )}

        {/* Descrição */}
        {serviceOrder.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição do Problema</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{serviceOrder.description}</Text>
            </View>
          </View>
        )}

        {/* Valores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valores</Text>
          <View style={styles.valuesCard}>
            <View style={styles.valueRow}>
              <Text style={styles.valueLabel}>Mão de obra:</Text>
              <Text style={styles.valueAmount}>{formatCurrency(serviceOrder.laborCost)}</Text>
            </View>
            <View style={styles.valueRow}>
              <Text style={styles.valueLabel}>Peças:</Text>
              <Text style={styles.valueAmount}>{formatCurrency(serviceOrder.partsCost)}</Text>
            </View>
            <View style={styles.valueDivider} />
            <View style={styles.valueRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>{formatCurrency(serviceOrder.totalCost)}</Text>
            </View>
          </View>
        </View>

        {/* Datas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cronograma</Text>
          <View style={styles.datesCard}>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>📅 Criado em:</Text>
              <Text style={styles.dateValue}>{formatDate(serviceOrder.createdAt)}</Text>
            </View>
            
            {serviceOrder.estimatedCompletion && (
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>⏰ Previsão:</Text>
                <Text style={styles.dateValue}>{formatDate(serviceOrder.estimatedCompletion)}</Text>
              </View>
            )}
            
            {serviceOrder.actualCompletion && (
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>✅ Concluído:</Text>
                <Text style={[styles.dateValue, { color: '#34C759' }]}>
                  {formatDate(serviceOrder.actualCompletion)}
                </Text>
              </View>
            )}
            
            {serviceOrder.updatedAt && serviceOrder.createdAt !== serviceOrder.updatedAt && (
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>📝 Atualizado:</Text>
                <Text style={styles.dateValue}>{formatDate(serviceOrder.updatedAt)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Observações */}
        {serviceOrder.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações Técnicas</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{serviceOrder.notes}</Text>
            </View>
          </View>
        )}

        {/* Ações de Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alterar Status</Text>
          <View style={styles.statusActions}>
            {serviceOrder.status === 'pending' && (
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: '#007AFF' }]}
                onPress={() => handleStatusChange('in_progress')}
                disabled={loading}
              >
                <Text style={styles.statusButtonText}>🔄 Iniciar Trabalho</Text>
              </TouchableOpacity>
            )}
            
            {serviceOrder.status === 'in_progress' && (
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: '#34C759' }]}
                onPress={() => handleStatusChange('completed')}
                disabled={loading}
              >
                <Text style={styles.statusButtonText}>✅ Concluir Serviço</Text>
              </TouchableOpacity>
            )}
            
            {serviceOrder.status !== 'cancelled' && serviceOrder.status !== 'completed' && (
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: '#FF3B30' }]}
                onPress={() => handleStatusChange('cancelled')}
                disabled={loading}
              >
                <Text style={styles.statusButtonText}>❌ Cancelar</Text>
              </TouchableOpacity>
            )}
            
            {(serviceOrder.status === 'completed' || serviceOrder.status === 'cancelled') && (
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: '#FF9500' }]}
                onPress={() => handleStatusChange('pending')}
                disabled={loading}
              >
                <Text style={styles.statusButtonText}>↩️ Reabrir</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Ações Principais */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.editActionButton} 
            onPress={handleEditServiceOrder}
            disabled={loading}
          >
            <Text style={styles.editActionButtonText}>✏️ Editar Ordem de Serviço</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDeleteServiceOrder}
            disabled={loading}
          >
            <Text style={styles.deleteButtonText}>
              {loading ? "Processando..." : "🗑️ Excluir Ordem de Serviço"}
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
  
  // SEÇÕES
  section: {
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },

  // STATUS E PRIORIDADE
  statusSection: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginRight: 10,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  priorityIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // TÍTULO DO SERVIÇO
  serviceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  serviceId: {
    fontSize: 16,
    color: '#666',
  },

  // CLIENTE
  clientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
  },
  clientDetails: {
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
    color: '#007AFF',
  },
  callIcon: {
    fontSize: 20,
  },

  // CARDS
  infoCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
  },
  vehicleInfo: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  descriptionCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
  },
  notesCard: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    padding: 15,
    borderRadius: 12,
  },
  notesText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
  },

  // VALORES
  valuesCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  valueLabel: {
    fontSize: 16,
    color: '#666',
  },
  valueAmount: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  valueDivider: {
    height: 1,
    backgroundColor: '#e1e5e9',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
  },

  // DATAS
  datesCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  dateValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },

  // AÇÕES DE STATUS
  statusActions: {
    gap: 10,
  },
  statusButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // AÇÕES PRINCIPAIS
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
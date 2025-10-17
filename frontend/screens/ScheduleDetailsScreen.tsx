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
import { deleteSchedule, updateSchedule, Schedule } from "../database";
import { useToast, toast } from "../ToastSystem";

type Props = NativeStackScreenProps<RootStackParamList, "ScheduleDetails">;

export default function ScheduleDetailsScreen({ navigation, route }: Props) {
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState(route.params.schedule);
  const { user } = route.params;
  const { showToast } = useToast();

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getStatusInfo = (status: Schedule['status']) => {
    switch (status) {
      case 'scheduled':
        return { text: 'Agendado', color: '#FF9500', icon: '📅' };
      case 'confirmed':
        return { text: 'Confirmado', color: '#007AFF', icon: '✓' };
      case 'in_progress':
        return { text: 'Em Andamento', color: '#AF52DE', icon: '🔄' };
      case 'completed':
        return { text: 'Concluído', color: '#34C759', icon: '✅' };
      case 'cancelled':
        return { text: 'Cancelado', color: '#FF3B30', icon: '✕' };
      default:
        return { text: status, color: '#8E8E93', icon: '?' };
    }
  };

  const getTypeInfo = (type: Schedule['type']) => {
    switch (type) {
      case 'maintenance':
        return { text: 'Manutenção', color: '#007AFF' };
      case 'repair':
        return { text: 'Reparo', color: '#FF9500' };
      case 'inspection':
        return { text: 'Inspeção', color: '#34C759' };
      case 'consultation':
        return { text: 'Consulta', color: '#AF52DE' };
      case 'other':
        return { text: 'Outro', color: '#8E8E93' };
      default:
        return { text: type, color: '#8E8E93' };
    }
  };

  // ========== AÇÕES DE STATUS ==========

  const handleConfirmSchedule = async () => {
    Alert.alert(
      "Confirmar Agendamento",
      `Confirmar "${schedule.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: async () => {
            await updateStatus('confirmed');
          }
        }
      ]
    );
  };

  const handleStartService = async () => {
    Alert.alert(
      "Iniciar Atendimento",
      `Iniciar "${schedule.title}"?\n\nO status mudará para "Em Andamento".`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Iniciar", 
          onPress: async () => {
            await updateStatus('in_progress');
          }
        }
      ]
    );
  };

  const handleCompleteService = async () => {
    Alert.alert(
      "Concluir Atendimento",
      `Marcar "${schedule.title}" como concluído?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Concluir", 
          style: "default",
          onPress: async () => {
            await updateStatus('completed');
          }
        }
      ]
    );
  };

  const handleCancelSchedule = async () => {
    Alert.alert(
      "Cancelar Agendamento",
      `Tem certeza que deseja cancelar "${schedule.title}"?\n\nEsta ação pode ser revertida.`,
      [
        { text: "Não", style: "cancel" },
        { 
          text: "Sim, Cancelar", 
          style: "destructive",
          onPress: async () => {
            await updateStatus('cancelled');
          }
        }
      ]
    );
  };

  const updateStatus = async (newStatus: Schedule['status']) => {
    setLoading(true);
    try {
      const updatedSchedule = await updateSchedule(schedule.id!, { status: newStatus });
      setSchedule(updatedSchedule);
      
      const statusInfo = getStatusInfo(newStatus);
      showToast(toast.success(
        "Status atualizado!",
        `Agendamento marcado como "${statusInfo.text}"`
      ));
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      showToast(toast.error("Erro", "Não foi possível atualizar o status"));
    } finally {
      setLoading(false);
    }
  };

  // ========== OUTRAS AÇÕES ==========

  const handleCallClient = () => {
    if (schedule.clientPhone) {
      const phoneNumber = schedule.clientPhone.replace(/\D/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleDeleteSchedule = () => {
    Alert.alert(
      "Excluir Agendamento",
      `Tem certeza que deseja excluir "${schedule.title}"?\n\n⚠️ Esta ação NÃO pode ser desfeita!`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir Permanentemente", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteSchedule(schedule.id!);
              showToast(toast.success("Excluído", "Agendamento removido permanentemente"));
              
              setTimeout(() => {
                navigation.goBack();
              }, 1000);
            } catch (error) {
              console.error("Erro ao excluir:", error);
              showToast(toast.error("Erro", "Não foi possível excluir o agendamento"));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const statusInfo = getStatusInfo(schedule.status);
  const typeInfo = getTypeInfo(schedule.type);

  // Define quais botões mostrar baseado no status atual
  const canConfirm = schedule.status === 'scheduled';
  const canStart = schedule.status === 'scheduled' || schedule.status === 'confirmed';
  const canComplete = schedule.status === 'in_progress';
  const canCancel = schedule.status !== 'cancelled' && schedule.status !== 'completed';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status e Tipo */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>
          <View style={[styles.typeBadge, { borderColor: typeInfo.color }]}>
            <Text style={[styles.typeText, { color: typeInfo.color }]}>{typeInfo.text}</Text>
          </View>
        </View>

        {/* Título */}
        <View style={styles.section}>
          <Text style={styles.scheduleTitle}>{schedule.title}</Text>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <TouchableOpacity 
            style={styles.clientInfo} 
            onPress={handleCallClient}
            disabled={!schedule.clientPhone}>
            <View style={styles.clientDetails}>
              <Text style={styles.clientName}>{schedule.clientName || 'Cliente não identificado'}</Text>
              {schedule.clientPhone && (
                <Text style={styles.clientPhone}>
                  📞 {schedule.clientPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                </Text>
              )}
            </View>
            {schedule.clientPhone && <Text style={styles.callIcon}>📞</Text>}
          </TouchableOpacity>
        </View>

        {/* Data e Horário */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data e Horário</Text>
          <View style={styles.dateTimeCard}>
            <View style={styles.dateTimeRow}>
              <Text style={styles.dateTimeLabel}>📅 Data:</Text>
              <Text style={styles.dateTimeValue}>{formatDate(schedule.date)}</Text>
            </View>
            <View style={styles.dateTimeRow}>
              <Text style={styles.dateTimeLabel}>🕐 Horário:</Text>
              <Text style={styles.dateTimeValue}>{formatTime(schedule.time)}</Text>
            </View>
            <View style={styles.dateTimeRow}>
              <Text style={styles.dateTimeLabel}>⏱️ Duração:</Text>
              <Text style={styles.dateTimeValue}>{schedule.duration} minutos</Text>
            </View>
          </View>
        </View>

        {/* Veículo */}
        {schedule.vehicleInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Veículo</Text>
            <View style={styles.infoCard}>
              <Text style={styles.vehicleInfo}>🚗 {schedule.vehicleInfo}</Text>
            </View>
          </View>
        )}

        {/* Descrição */}
        {schedule.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{schedule.description}</Text>
            </View>
          </View>
        )}

        {/* Observações */}
        {schedule.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{schedule.notes}</Text>
            </View>
          </View>
        )}

        {/* Ações de Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações</Text>
          <View style={styles.statusActions}>
            {canConfirm && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
                onPress={handleConfirmSchedule}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>✓ Confirmar Agendamento</Text>
              </TouchableOpacity>
            )}
            
            {canStart && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#AF52DE' }]}
                onPress={handleStartService}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>🔄 Iniciar Atendimento</Text>
              </TouchableOpacity>
            )}
            
            {canComplete && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#34C759' }]}
                onPress={handleCompleteService}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>✅ Concluir Atendimento</Text>
              </TouchableOpacity>
            )}
            
            {canCancel && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#FF9500' }]}
                onPress={handleCancelSchedule}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>✕ Cancelar Agendamento</Text>
              </TouchableOpacity>
            )}

            {/* Sempre disponível */}
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
              onPress={handleDeleteSchedule}
              disabled={loading}
            >
              <Text style={styles.actionButtonText}>
                {loading ? "Processando..." : "🗑️ Excluir Permanentemente"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Informação sobre status */}
        {schedule.status === 'completed' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>
              ✅ Este agendamento foi concluído com sucesso
            </Text>
          </View>
        )}

        {schedule.status === 'cancelled' && (
          <View style={[styles.infoBox, { backgroundColor: '#FFE6E6' }]}>
            <Text style={[styles.infoBoxText, { color: '#FF3B30' }]}>
              ✕ Este agendamento foi cancelado
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: { flex: 1 },
  backButtonText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center' },
  headerRight: { flex: 1 },
  scrollView: { flex: 1 },
  section: { backgroundColor: '#fff', marginBottom: 12, paddingVertical: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 15 },
  statusSection: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  statusIcon: { fontSize: 16, marginRight: 8 },
  statusText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  typeText: { fontSize: 12, fontWeight: '600' },
  scheduleTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  clientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
  },
  clientDetails: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  clientPhone: { fontSize: 14, color: '#007AFF' },
  callIcon: { fontSize: 20 },
  dateTimeCard: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12 },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dateTimeLabel: { fontSize: 14, color: '#666', flex: 1 },
  dateTimeValue: { fontSize: 14, color: '#1a1a1a', fontWeight: '500', textAlign: 'right', flex: 1 },
  infoCard: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12 },
  vehicleInfo: { fontSize: 16, color: '#1a1a1a' },
  descriptionCard: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12 },
  descriptionText: { fontSize: 16, color: '#1a1a1a', lineHeight: 24 },
  notesCard: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    padding: 15,
    borderRadius: 12,
  },
  notesText: { fontSize: 16, color: '#1a1a1a', lineHeight: 24 },
  statusActions: { gap: 10 },
  actionButton: { 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  infoBox: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoBoxText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
    textAlign: 'center',
  },
});
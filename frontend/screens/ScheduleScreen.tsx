import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  RefreshControl,
  SafeAreaView,
  Dimensions
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { getSchedulesByUserId, deleteSchedule, Schedule } from "../database";
import { useToast, toast } from "../ToastSystem";

type Props = NativeStackScreenProps<RootStackParamList, "ScheduleList">;

const { width } = Dimensions.get('window');
const CALENDAR_WIDTH = width - 40;
const DAY_WIDTH = CALENDAR_WIDTH / 7;

interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  schedules: Schedule[];
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function ScheduleScreen({ navigation, route }: Props) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  
  const user = route.params?.user;
  const shouldRefresh = route.params?.shouldRefresh;
  const newScheduleId = route.params?.newScheduleId;
  
  const { showToast } = useToast();

  const loadSchedules = async () => {
    try {
      if (!user?.id) {
        showToast(toast.error("Erro", "Usuário não identificado"));
        return;
      }

      const schedulesList = await getSchedulesByUserId(user.id);
      setSchedules(schedulesList);

      if (newScheduleId && schedulesList.length > 0) {
        const newSchedule = schedulesList.find(s => s.id === newScheduleId);
        if (newSchedule) {
          showToast(toast.success(
            "Agendamento criado!",
            `${newSchedule.title} foi adicionado`,
            2000
          ));
        }
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      showToast(toast.error("Erro", "Não foi possível carregar os agendamentos"));
    } finally {
      setLoading(false);
    }
  };

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dateString = currentDate.toISOString().split('T')[0];
      const daySchedules = schedules.filter(s => s.date === dateString);
      
      days.push({
        date: dateString,
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === today.toDateString(),
        schedules: daySchedules
      });
    }
    
    setCalendarDays(days);
  };

  useEffect(() => {
    loadSchedules();
  }, [user?.id]);

  useEffect(() => {
    if (shouldRefresh) {
      loadSchedules();
      navigation.setParams({ shouldRefresh: false, newScheduleId: undefined });
    }
  }, [shouldRefresh, newScheduleId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSchedules();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (schedules.length > 0 || !loading) {
      generateCalendar();
    }
  }, [schedules, currentMonth]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadSchedules();
    setRefreshing(false);
  }, []);

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const handleDayPress = (day: CalendarDay) => {
    setSelectedDate(new Date(day.date));
  };

  const handleAddSchedule = () => {
    navigation.navigate("AddSchedule", { user });
  };

  const handleViewSchedule = (schedule: Schedule) => {
    navigation.navigate("ScheduleDetails", { schedule, user });
  };

  const handleDeleteSchedule = (schedule: Schedule) => {
    Alert.alert(
      "Excluir Agendamento",
      `Tem certeza que deseja excluir "${schedule.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSchedule(schedule.id!);
              await loadSchedules();
              showToast(toast.success("Agendamento excluído", `"${schedule.title}" foi removido`));
            } catch (error) {
              console.error("Erro ao excluir:", error);
              showToast(toast.error("Erro", "Não foi possível excluir o agendamento"));
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: Schedule['status']) => {
    switch (status) {
      case 'scheduled': return '#FF9500';
      case 'confirmed': return '#007AFF';
      case 'in_progress': return '#AF52DE';
      case 'completed': return '#34C759';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getSelectedDaySchedules = () => {
    const dateString = selectedDate.toISOString().split('T')[0];
    return schedules.filter(s => s.date === dateString)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando agendamentos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agendamentos</Text>
        </View>
        <TouchableOpacity style={styles.addHeaderButton} onPress={handleAddSchedule}>
          <Text style={styles.addHeaderButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.viewModeToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'calendar' && styles.toggleButtonActive]}
          onPress={() => setViewMode('calendar')}
        >
          <Text style={[styles.toggleText, viewMode === 'calendar' && styles.toggleTextActive]}>
            Calendário
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
            Lista
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'calendar' ? (
          <>
            <View style={styles.calendarContainer}>
              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={handlePreviousMonth} style={styles.monthButton}>
                  <Text style={styles.monthButtonText}>←</Text>
                </TouchableOpacity>
                
                <View style={styles.monthTitleContainer}>
                  <Text style={styles.monthTitle}>
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </Text>
                  <TouchableOpacity onPress={handleToday} style={styles.todayButton}>
                    <Text style={styles.todayButtonText}>Hoje</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
                  <Text style={styles.monthButtonText}>→</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.weekdaysRow}>
                {WEEKDAYS.map(day => (
                  <View key={day} style={styles.weekdayCell}>
                    <Text style={styles.weekdayText}>{day}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {calendarDays.map((day, index) => (
                  <TouchableOpacity
                    key={`${day.date}-${index}`}
                    style={[
                      styles.dayCell,
                      !day.isCurrentMonth && styles.dayCellOtherMonth,
                      day.isToday && styles.dayCellToday,
                      day.date === selectedDate.toISOString().split('T')[0] && styles.dayCellSelected
                    ]}
                    onPress={() => handleDayPress(day)}
                  >
                    <Text style={[
                      styles.dayText,
                      !day.isCurrentMonth && styles.dayTextOtherMonth,
                      day.isToday && styles.dayTextToday,
                      day.date === selectedDate.toISOString().split('T')[0] && styles.dayTextSelected
                    ]}>
                      {day.day}
                    </Text>
                    {day.schedules.length > 0 && (
                      <View style={styles.scheduleDots}>
                        {day.schedules.slice(0, 3).map((schedule, i) => (
                          <View
                            key={schedule.id}
                            style={[
                              styles.scheduleDot,
                              { backgroundColor: getStatusColor(schedule.status) }
                            ]}
                          />
                        ))}
                        {day.schedules.length > 3 && (
                          <Text style={styles.moreText}>+{day.schedules.length - 3}</Text>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.selectedDaySection}>
              <Text style={styles.selectedDayTitle}>
                {selectedDate.toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </Text>
              
              {getSelectedDaySchedules().length === 0 ? (
                <View style={styles.noSchedulesDay}>
                  <Text style={styles.noSchedulesText}>Nenhum agendamento neste dia</Text>
                  <TouchableOpacity style={styles.addDayButton} onPress={handleAddSchedule}>
                    <Text style={styles.addDayButtonText}>+ Adicionar agendamento</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.daySchedulesList}>
                  {getSelectedDaySchedules().map(schedule => (
                    <TouchableOpacity
                      key={schedule.id}
                      style={styles.scheduleCard}
                      onPress={() => handleViewSchedule(schedule)}
                    >
                      <View style={[
                        styles.scheduleColorBar,
                        { backgroundColor: getStatusColor(schedule.status) }
                      ]} />
                      <View style={styles.scheduleCardContent}>
                        <View style={styles.scheduleCardHeader}>
                          <Text style={styles.scheduleTime}>{schedule.time}</Text>
                          <Text style={styles.scheduleDuration}>{schedule.duration} min</Text>
                        </View>
                        <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                        <Text style={styles.scheduleClient}>{schedule.clientName}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteSchedule(schedule);
                        }}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.listView}>
            {schedules.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyTitle}>Nenhum agendamento</Text>
                <Text style={styles.emptyDescription}>
                  Comece criando seu primeiro agendamento
                </Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddSchedule}>
                  <Text style={styles.addButtonText}>+ Criar Agendamento</Text>
                </TouchableOpacity>
              </View>
            ) : (
              schedules.map(schedule => (
                <TouchableOpacity
                  key={schedule.id}
                  style={styles.listItem}
                  onPress={() => handleViewSchedule(schedule)}
                >
                  <View style={[
                    styles.listColorBar,
                    { backgroundColor: getStatusColor(schedule.status) }
                  ]} />
                  <View style={styles.listContent}>
                    <Text style={styles.listTitle}>{schedule.title}</Text>
                    <Text style={styles.listClient}>{schedule.clientName}</Text>
                    <Text style={styles.listDateTime}>
                      {new Date(schedule.date).toLocaleDateString('pt-BR')} às {schedule.time}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteSchedule(schedule);
                    }}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.floatingButton} onPress={handleAddSchedule}>
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666' },
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
  headerLeft: { flex: 1 },
  backButton: { marginBottom: 10 },
  backButtonText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  addHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHeaderButtonText: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  viewModeToggle: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 10,
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  toggleText: { fontSize: 14, color: '#666', fontWeight: '600' },
  toggleTextActive: { color: '#fff' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  calendarContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: { padding: 10 },
  monthButtonText: { fontSize: 24, color: '#007AFF' },
  monthTitleContainer: { alignItems: 'center' },
  monthTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 5 },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
  },
  todayButtonText: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
  weekdaysRow: { flexDirection: 'row', marginBottom: 10 },
  weekdayCell: {
    width: DAY_WIDTH,
    alignItems: 'center',
    paddingVertical: 5,
  },
  weekdayText: { fontSize: 12, fontWeight: '600', color: '#666' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: DAY_WIDTH,
    height: DAY_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 5,
  },
  dayCellOtherMonth: { opacity: 0.3 },
  dayCellToday: { backgroundColor: '#E3F2FD' },
  dayCellSelected: { backgroundColor: '#007AFF' },
  dayText: { fontSize: 14, color: '#1a1a1a', fontWeight: '500' },
  dayTextOtherMonth: { color: '#999' },
  dayTextToday: { color: '#007AFF', fontWeight: 'bold' },
  dayTextSelected: { color: '#fff', fontWeight: 'bold' },
  scheduleDots: {
    flexDirection: 'row',
    marginTop: 2,
    alignItems: 'center',
  },
  scheduleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  moreText: { fontSize: 8, color: '#666', marginLeft: 2 },
  selectedDaySection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
    textTransform: 'capitalize',
  },
  noSchedulesDay: { alignItems: 'center', paddingVertical: 20 },
  noSchedulesText: { fontSize: 14, color: '#666', marginBottom: 15 },
  addDayButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addDayButtonText: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  daySchedulesList: { gap: 10 },
  scheduleCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
  },
  scheduleColorBar: { width: 4, height: '100%' },
  scheduleCardContent: { flex: 1, padding: 12 },
  scheduleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scheduleTime: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  scheduleDuration: { fontSize: 12, color: '#666' },
  scheduleTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  scheduleClient: { fontSize: 12, color: '#007AFF' },
  deleteButton: { padding: 12 },
  deleteIcon: { fontSize: 16 },
  listView: { padding: 20 },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listColorBar: { width: 4 },
  listContent: { flex: 1, padding: 16 },
  listTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  listClient: { fontSize: 14, color: '#007AFF', marginBottom: 4 },
  listDateTime: { fontSize: 12, color: '#666' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
  emptyDescription: { fontSize: 16, color: '#666', marginBottom: 30, textAlign: 'center' },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
});
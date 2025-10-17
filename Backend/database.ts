// ==================== FIREBASE CONFIG ====================
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// IMPORTANTE: Substitua com suas credenciais do Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyC_vi0XM7Fir9IhImPBvoIsKDhz4_D9HWU",
  authDomain: "officemaster-7ef34.firebaseapp.com",
  projectId: "officemaster-7ef34",
  storageBucket: "officemaster-7ef34.firebasestorage.app",
  messagingSenderId: "99027379557",
  appId: "1:99027379557:web:6d23ac53e9480811db6d8c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// ==================== IMPORTS ====================
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';

// ==================== INTERFACES (TODAS CORRIGIDAS) ====================

export interface User {
  id?: string; // ✅ CORRIGIDO (era number implícito)
  firstName: string;
  lastName: string;
  workshopName: string;
  phone: string;
  email: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id?: string; // ✅ CORRIGIDO (era number)
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceOrder {
  id?: string; // ✅ CORRIGIDO (era number)
  clientId: string; // ✅ CORRIGIDO (era number)
  userId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  vehicleInfo?: string;
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  estimatedCompletion?: string;
  actualCompletion?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  clientName?: string;
  clientPhone?: string;
}

export interface Schedule {
  id?: string; // ✅ JÁ ESTAVA CORRETO
  clientId: string;
  userId: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  type: 'maintenance' | 'repair' | 'inspection' | 'consultation' | 'other';
  vehicleInfo?: string;
  notes?: string;
  reminderSent?: boolean;
  createdAt?: string;
  updatedAt?: string;
  clientName?: string;
  clientPhone?: string;
}

// ==================== FUNÇÕES AUXILIARES ====================

const createDocumentData = (data: any) => {
  return {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
};

const updateDocumentData = (data: any) => {
  return {
    ...data,
    updatedAt: serverTimestamp()
  };
};

const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return new Date(timestamp).toISOString();
};

// ==================== INICIALIZAÇÃO ====================

export const initDatabase = async (): Promise<void> => {
  try {
    console.log('Firebase inicializado com sucesso!');
    return Promise.resolve();
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
    throw error;
  }
};

// ==================== USUÁRIOS ====================

export const insertUser = async (user: User): Promise<User> => {
  try {
    if (!user.email || !user.password) {
      throw new Error('Email e senha são obrigatórios');
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      user.email.toLowerCase(),
      user.password
    );

    const userData = createDocumentData({
      uid: userCredential.user.uid,
      firstName: user.firstName,
      lastName: user.lastName,
      workshopName: user.workshopName,
      phone: user.phone,
      email: user.email.toLowerCase()
    });

    const docRef = await addDoc(collection(db, 'users'), userData);

    return {
      id: docRef.id, // ✅ CORRETO - string
      ...user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email já está cadastrado');
    }
    throw error;
  }
};

export const getUserByEmailAndPassword = async (email: string, password: string): Promise<User | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.toLowerCase(),
      password
    );

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', userCredential.user.uid));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      return {
        id: userDoc.id, // ✅ CORRETO - string
        firstName: userData.firstName,
        lastName: userData.lastName,
        workshopName: userData.workshopName,
        phone: userData.phone,
        email: userData.email,
        createdAt: formatTimestamp(userData.createdAt),
        updatedAt: formatTimestamp(userData.updatedAt)
      };
    }

    return null;
  } catch (error: any) {
    console.error('Erro ao fazer login:', error);
    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
};

// ==================== CLIENTES (TODAS AS FUNÇÕES CORRIGIDAS) ====================

export const insertClient = async (client: Client): Promise<Client> => {
  try {
    if (!client.name || !client.phone || !client.userId) {
      throw new Error('Nome, telefone e userId são obrigatórios');
    }

    const clientData = createDocumentData({
      name: client.name.trim(),
      phone: client.phone,
      email: client.email?.trim() || null,
      address: client.address?.trim() || null,
      notes: client.notes?.trim() || null,
      userId: client.userId
    });

    const docRef = await addDoc(collection(db, 'clients'), clientData);

    return {
      id: docRef.id, // ✅ CORRETO - string
      ...client,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao inserir cliente:', error);
    throw error;
  }
};

export const getClientsByUserId = async (userId: string): Promise<Client[]> => {
  try {
    const clientsRef = collection(db, 'clients');
    const q = query(clientsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const clients: Client[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      clients.push({
        id: doc.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        notes: data.notes,
        userId: data.userId,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt)
      });
    });

    return clients.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    throw error;
  }
};
export const searchClients = async (userId: string, searchTerm: string): Promise<Client[]> => {
  try {
    const clients = await getClientsByUserId(userId);
    const term = searchTerm.toLowerCase();
    
    return clients.filter(client =>
      client.name.toLowerCase().includes(term) ||
      client.phone.includes(term) ||
      client.email?.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    throw error;
  }
};

export const updateClient = async (id: string, clientData: Partial<Client>): Promise<Client> => {
  try {
    const clientRef = doc(db, 'clients', id); // ✅ CORRETO - string diretamente
    const updateData = updateDocumentData(clientData);
    
    await updateDoc(clientRef, updateData);

    const updatedDoc = await getDoc(clientRef);
    if (updatedDoc.exists()) {
      const data = updatedDoc.data();
      return {
        id: updatedDoc.id, // ✅ CORRETO - string
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        notes: data.notes,
        userId: data.userId,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt)
      };
    }

    throw new Error('Cliente não encontrado após atualização');
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'clients', id));
    return true;
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    return false;
  }
};

// ==================== ORDENS DE SERVIÇO (TODAS AS FUNÇÕES CORRIGIDAS) ====================

export const insertServiceOrder = async (serviceOrder: ServiceOrder): Promise<ServiceOrder> => {
  try {
    if (!serviceOrder.title || !serviceOrder.clientId || !serviceOrder.userId) {
      throw new Error('Título, cliente e usuário são obrigatórios');
    }

    const totalCost = (serviceOrder.laborCost || 0) + (serviceOrder.partsCost || 0);

    const serviceOrderData = createDocumentData({
      clientId: serviceOrder.clientId, // ✅ JÁ É string
      userId: serviceOrder.userId,
      title: serviceOrder.title.trim(),
      description: serviceOrder.description?.trim() || null,
      status: serviceOrder.status || 'pending',
      priority: serviceOrder.priority || 'medium',
      vehicleInfo: serviceOrder.vehicleInfo?.trim() || null,
      laborCost: serviceOrder.laborCost || 0,
      partsCost: serviceOrder.partsCost || 0,
      totalCost: totalCost,
      estimatedCompletion: serviceOrder.estimatedCompletion || null,
      notes: serviceOrder.notes?.trim() || null
    });

    const docRef = await addDoc(collection(db, 'serviceOrders'), serviceOrderData);

    return {
      id: docRef.id, // ✅ CORRETO - string
      ...serviceOrder,
      totalCost,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao inserir ordem de serviço:', error);
    throw error;
  }
};

export const getServiceOrdersByUserId = async (userId: string): Promise<ServiceOrder[]> => {
  try {
    const ordersRef = collection(db, 'serviceOrders');
    const q = query(ordersRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const orders: ServiceOrder[] = [];
    
    for (const orderDoc of querySnapshot.docs) {
      const orderData = orderDoc.data();
      
      let clientName = 'Cliente não identificado';
      let clientPhone = '';
      try {
        const clientDoc = await getDoc(doc(db, 'clients', orderData.clientId)); // ✅ string
        if (clientDoc.exists()) {
          const clientData = clientDoc.data();
          clientName = clientData.name;
          clientPhone = clientData.phone;
        }
      } catch (error) {
        console.warn('Erro ao buscar cliente:', error);
      }

      orders.push({
        id: orderDoc.id, // ✅ CORRETO - string
        clientId: orderData.clientId,
        userId: orderData.userId,
        title: orderData.title,
        description: orderData.description,
        status: orderData.status,
        priority: orderData.priority,
        vehicleInfo: orderData.vehicleInfo,
        laborCost: orderData.laborCost,
        partsCost: orderData.partsCost,
        totalCost: orderData.totalCost,
        estimatedCompletion: orderData.estimatedCompletion,
        actualCompletion: orderData.actualCompletion,
        notes: orderData.notes,
        clientName,
        clientPhone,
        createdAt: formatTimestamp(orderData.createdAt),
        updatedAt: formatTimestamp(orderData.updatedAt)
      });
    }

    return orders.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Erro ao buscar ordens de serviço:', error);
    throw error;
  }
};

export const getServiceOrdersByStatus = async (
  userId: string,
  status: ServiceOrder['status']
): Promise<ServiceOrder[]> => {
  try {
    const ordersRef = collection(db, 'serviceOrders');
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      where('status', '==', status)
    );
    const querySnapshot = await getDocs(q);

    const orders: ServiceOrder[] = [];
    
    for (const orderDoc of querySnapshot.docs) {
      const orderData = orderDoc.data();
      
      let clientName = 'Cliente não identificado';
      try {
        const clientDoc = await getDoc(doc(db, 'clients', orderData.clientId)); // ✅ string
        if (clientDoc.exists()) {
          clientName = clientDoc.data().name;
        }
      } catch (error) {
        console.warn('Erro ao buscar cliente:', error);
      }

      orders.push({
        id: orderDoc.id, // ✅ CORRETO - string
        clientId: orderData.clientId,
        userId: orderData.userId,
        title: orderData.title,
        description: orderData.description,
        status: orderData.status,
        priority: orderData.priority,
        vehicleInfo: orderData.vehicleInfo,
        laborCost: orderData.laborCost,
        partsCost: orderData.partsCost,
        totalCost: orderData.totalCost,
        estimatedCompletion: orderData.estimatedCompletion,
        actualCompletion: orderData.actualCompletion,
        notes: orderData.notes,
        clientName,
        createdAt: formatTimestamp(orderData.createdAt),
        updatedAt: formatTimestamp(orderData.updatedAt)
      });
    }

    return orders;
  } catch (error) {
    console.error('Erro ao buscar ordens por status:', error);
    throw error;
  }
};

export const updateServiceOrder = async (
  id: string, // ✅ CORRETO - string
  serviceOrderData: Partial<ServiceOrder>
): Promise<ServiceOrder> => {
  try {
    const orderRef = doc(db, 'serviceOrders', id); // ✅ string diretamente
    
    const updateData: any = { ...serviceOrderData };
    
    if (serviceOrderData.laborCost !== undefined || serviceOrderData.partsCost !== undefined) {
      const currentDoc = await getDoc(orderRef);
      if (currentDoc.exists()) {
        const currentData = currentDoc.data();
        const laborCost = serviceOrderData.laborCost ?? currentData.laborCost ?? 0;
        const partsCost = serviceOrderData.partsCost ?? currentData.partsCost ?? 0;
        updateData.totalCost = laborCost + partsCost;
      }
    }

    await updateDoc(orderRef, updateDocumentData(updateData));

    const updatedDoc = await getDoc(orderRef);
    if (updatedDoc.exists()) {
      const data = updatedDoc.data();
      
      let clientName = 'Cliente não identificado';
      try {
        const clientDoc = await getDoc(doc(db, 'clients', data.clientId)); // ✅ string
        if (clientDoc.exists()) {
          clientName = clientDoc.data().name;
        }
      } catch (error) {
        console.warn('Erro ao buscar cliente:', error);
      }

      return {
        id: updatedDoc.id, // ✅ CORRETO - string
        clientId: data.clientId,
        userId: data.userId,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        vehicleInfo: data.vehicleInfo,
        laborCost: data.laborCost,
        partsCost: data.partsCost,
        totalCost: data.totalCost,
        estimatedCompletion: data.estimatedCompletion,
        actualCompletion: data.actualCompletion,
        notes: data.notes,
        clientName,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt)
      };
    }

    throw new Error('Ordem de serviço não encontrada');
  } catch (error) {
    console.error('Erro ao atualizar ordem de serviço:', error);
    throw error;
  }
};

export const deleteServiceOrder = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'serviceOrders', id)); // ✅ CORRETO - string
    return true;
  } catch (error) {
    console.error('Erro ao deletar ordem de serviço:', error);
    return false;
  }
};

// ==================== AGENDAMENTOS ====================

export const insertSchedule = async (schedule: Schedule): Promise<Schedule> => {
  try {
    if (!schedule.title || !schedule.clientId || !schedule.userId || !schedule.date || !schedule.time) {
      throw new Error('Título, cliente, usuário, data e hora são obrigatórios');
    }

    const scheduleData = createDocumentData({
      clientId: schedule.clientId,
      userId: schedule.userId,
      title: schedule.title.trim(),
      description: schedule.description?.trim() || null,
      date: schedule.date,
      time: schedule.time,
      duration: schedule.duration || 60,
      status: schedule.status || 'scheduled',
      type: schedule.type || 'other',
      vehicleInfo: schedule.vehicleInfo?.trim() || null,
      notes: schedule.notes?.trim() || null,
      reminderSent: false
    });

    const docRef = await addDoc(collection(db, 'schedules'), scheduleData);

    return {
      id: docRef.id,
      ...schedule,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao inserir agendamento:', error);
    throw error;
  }
};

export const getSchedulesByUserId = async (userId: string): Promise<Schedule[]> => {
  try {
    const schedulesRef = collection(db, 'schedules');
    const q = query(schedulesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const schedules: Schedule[] = [];
    
    for (const scheduleDoc of querySnapshot.docs) {
      const scheduleData = scheduleDoc.data();
      
      let clientName = 'Cliente não identificado';
      let clientPhone = '';
      try {
        const clientDoc = await getDoc(doc(db, 'clients', scheduleData.clientId));
        if (clientDoc.exists()) {
          const clientData = clientDoc.data();
          clientName = clientData.name;
          clientPhone = clientData.phone;
        }
      } catch (error) {
        console.warn('Erro ao buscar cliente:', error);
      }

      schedules.push({
        id: scheduleDoc.id,
        clientId: scheduleData.clientId,
        userId: scheduleData.userId,
        title: scheduleData.title,
        description: scheduleData.description,
        date: scheduleData.date,
        time: scheduleData.time,
        duration: scheduleData.duration,
        status: scheduleData.status,
        type: scheduleData.type,
        vehicleInfo: scheduleData.vehicleInfo,
        notes: scheduleData.notes,
        reminderSent: scheduleData.reminderSent,
        clientName,
        clientPhone,
        createdAt: formatTimestamp(scheduleData.createdAt),
        updatedAt: formatTimestamp(scheduleData.updatedAt)
      });
    }

    return schedules.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    throw error;
  }
};

export const getSchedulesByDate = async (userId: string, date: string): Promise<Schedule[]> => {
  try {
    const schedulesRef = collection(db, 'schedules');
    const q = query(
      schedulesRef,
      where('userId', '==', userId),
      where('date', '==', date)
    );
    const querySnapshot = await getDocs(q);

    const schedules: Schedule[] = [];
    
    for (const scheduleDoc of querySnapshot.docs) {
      const scheduleData = scheduleDoc.data();
      
      let clientName = 'Cliente não identificado';
      try {
        const clientDoc = await getDoc(doc(db, 'clients', scheduleData.clientId));
        if (clientDoc.exists()) {
          clientName = clientDoc.data().name;
        }
      } catch (error) {
        console.warn('Erro ao buscar cliente:', error);
      }

      schedules.push({
        id: scheduleDoc.id,
        clientId: scheduleData.clientId,
        userId: scheduleData.userId,
        title: scheduleData.title,
        description: scheduleData.description,
        date: scheduleData.date,
        time: scheduleData.time,
        duration: scheduleData.duration,
        status: scheduleData.status,
        type: scheduleData.type,
        vehicleInfo: scheduleData.vehicleInfo,
        notes: scheduleData.notes,
        reminderSent: scheduleData.reminderSent,
        clientName,
        createdAt: formatTimestamp(scheduleData.createdAt),
        updatedAt: formatTimestamp(scheduleData.updatedAt)
      });
    }

    return schedules.sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
  } catch (error) {
    console.error('Erro ao buscar agendamentos por data:', error);
    throw error;
  }
};

export const updateSchedule = async (id: string, scheduleData: Partial<Schedule>): Promise<Schedule> => {
  try {
    const scheduleRef = doc(db, 'schedules', id);
    
    const updateData = updateDocumentData({
      ...scheduleData,
      title: scheduleData.title?.trim(),
      description: scheduleData.description?.trim() || null,
      vehicleInfo: scheduleData.vehicleInfo?.trim() || null,
      notes: scheduleData.notes?.trim() || null,
    });

    await updateDoc(scheduleRef, updateData);

    const updatedDoc = await getDoc(scheduleRef);
    if (updatedDoc.exists()) {
      const data = updatedDoc.data();
      
      let clientName = 'Cliente não identificado';
      try {
        const clientDoc = await getDoc(doc(db, 'clients', data.clientId));
        if (clientDoc.exists()) {
          clientName = clientDoc.data().name;
        }
      } catch (error) {
        console.warn('Erro ao buscar cliente:', error);
      }

      return {
        id: updatedDoc.id,
        clientId: data.clientId,
        userId: data.userId,
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        duration: data.duration,
        status: data.status,
        type: data.type,
        vehicleInfo: data.vehicleInfo,
        notes: data.notes,
        reminderSent: data.reminderSent,
        clientName,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt)
      };
    }

    throw new Error('Agendamento não encontrado após atualização');
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    throw error;
  }
};

export const deleteSchedule = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'schedules', id));
    return true;
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    return false;
  }
};

export const checkScheduleConflict = async (
  userId: string,
  date: string,
  time: string,
  duration: number,
  excludeId?: string
): Promise<boolean> => {
  try {
    const schedules = await getSchedulesByDate(userId, date);
    
    const newStart = timeToMinutes(time);
    const newEnd = newStart + duration;

    for (const schedule of schedules) {
      if (excludeId && schedule.id === excludeId) continue;
      if (schedule.status === 'cancelled') continue;

      const existingStart = timeToMinutes(schedule.time);
      const existingEnd = existingStart + schedule.duration;

      if (newStart < existingEnd && newEnd > existingStart) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar conflito:', error);
    return false;
  }
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};
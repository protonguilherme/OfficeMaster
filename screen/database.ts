import { 
  initializeApp, 
  getApps, 
  FirebaseApp 
} from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  ActionCodeSettings,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC_vi0XM7Fir9IhImPBvoIsKDhz4_D9HWU",
  authDomain: "officemaster-7ef34.firebaseapp.com",
  projectId: "officemaster-7ef34",
  storageBucket: "officemaster-7ef34.firebasestorage.app",
  messagingSenderId: "99027379557",
  appId: "1:99027379557:web:6d23ac53e9480811db6d8c"
};

// Inicializar Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);

// Configuração personalizada para email de reset
const actionCodeSettings: ActionCodeSettings = {
  url: 'https://officemaster-7ef34.firebaseapp.com/__/auth/handler',
  handleCodeInApp: false,
};

// Interfaces mantidas iguais ao arquivo original
export interface User {
  id?: string;
  firstName: string;
  lastName: string;
  workshopName: string;
  phone: string;
  email: string;
  password?: string; // Não armazenado no Firestore
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id?: string;
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
  id?: string;
  clientId: string;
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
  // Propriedades adicionais para exibição
  clientName?: string;
  clientPhone?: string;
}

export interface InventoryItem {
  id?: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  partNumber?: string;
  currentStock: number;
  minStock: number;
  unitPrice: number;
  supplier?: string;
  location?: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  workshopName: string;
  phone: string;
  email: string;
  createdAt?: string;
}

// Funções utilitárias
const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString();
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

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

// ============= INICIALIZAÇÃO =============
export const initDatabase = async (): Promise<void> => {
  try {
    console.log("Firebase/Firestore inicializado com sucesso!");
    return Promise.resolve();
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
    throw error;
  }
};

// ============= FUNÇÕES DE USUÁRIOS =============
export const insertUser = async (userData: User): Promise<User> => {
  try {
    if (!userData.email || !userData.password) {
      throw new Error("Email e senha são obrigatórios");
    }

    // Criar usuário na autenticação
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email.trim().toLowerCase(), 
      userData.password
    );

    // Salvar dados adicionais no Firestore
    const userDoc = {
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      workshopName: userData.workshopName.trim(),
      phone: userData.phone.replace(/\D/g, ''),
      email: userData.email.trim().toLowerCase(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Usar setDoc para criar o documento
    await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);

    return {
      id: userCredential.user.uid,
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      workshopName: userData.workshopName.trim(),
      phone: userData.phone.replace(/\D/g, ''),
      email: userData.email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    console.error("Código do erro:", error.code);
    
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("Este email já está cadastrado");
    } else if (error.code === 'auth/weak-password') {
      throw new Error("A senha deve ter pelo menos 6 caracteres");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("Email inválido");
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error("Cadastro com email/senha não está habilitado");
    }
    throw new Error("Erro ao criar usuário: " + error.message);
  }
};

export const getUserByEmailAndPassword = async (email: string, password: string): Promise<User | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      email.trim().toLowerCase(), 
      password
    );

    // Buscar dados adicionais no Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: userCredential.user.uid,
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
    console.error("Erro no login:", error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return null; // Credenciais inválidas
    }
    throw error;
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const userData = doc.data();
      return {
        id: doc.id,
        ...userData,
        createdAt: formatTimestamp(userData.createdAt),
        updatedAt: formatTimestamp(userData.updatedAt)
      } as User;
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar usuário por email:", error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        ...userData,
        createdAt: formatTimestamp(userData.createdAt),
        updatedAt: formatTimestamp(userData.updatedAt)
      } as User);
    });

    return users;
  } catch (error) {
    console.error("Erro ao buscar todos os usuários:", error);
    throw error;
  }
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  try {
    const userRef = doc(db, 'users', id);
    const updateData = updateDocumentData({
      firstName: userData.firstName?.trim(),
      lastName: userData.lastName?.trim(),
      workshopName: userData.workshopName?.trim(),
      phone: userData.phone?.replace(/\D/g, ''),
    });

    await updateDoc(userRef, updateData);

    // Buscar dados atualizados
    const updatedDoc = await getDoc(userRef);
    if (updatedDoc.exists()) {
      const data = updatedDoc.data();
      return {
        id: updatedDoc.id,
        ...data,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt)
      } as User;
    }

    throw new Error("Usuário não encontrado após atualização");
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'users', id));
    return true;
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return false;
  }
};

// ============= FUNÇÕES DE RESET DE SENHA =============
export const sendPasswordResetEmailCustom = async (email: string): Promise<void> => {
  try {
    // Usar configurações personalizadas para reduzir spam
    await sendPasswordResetEmail(auth, email.toLowerCase().trim(), actionCodeSettings);
    
    console.log("Email de reset enviado com configurações anti-spam");
  } catch (error) {
    console.error("Erro ao enviar email de reset:", error);
    throw error;
  }
};

// ============= FUNÇÕES DE CLIENTES =============
export const insertClient = async (client: Client): Promise<Client> => {
  try {
    if (!client.name || !client.phone || !client.userId) {
      throw new Error("Nome, telefone e usuário são obrigatórios");
    }

    const clientData = createDocumentData({
      name: client.name.trim(),
      phone: client.phone.replace(/\D/g, ''),
      email: client.email?.trim().toLowerCase() || null,
      address: client.address?.trim() || null,
      notes: client.notes?.trim() || null,
      userId: client.userId
    });

    const docRef = await addDoc(collection(db, 'clients'), clientData);

    return {
      id: docRef.id,
      ...client,
      phone: client.phone.replace(/\D/g, ''),
      email: client.email?.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Erro ao inserir cliente:", error);
    throw new Error("Erro ao criar cliente: " + (error as Error).message);
  }
};

export const getClientsByUserId = async (userId: string): Promise<Client[]> => {
  try {
    const clientsRef = collection(db, 'clients');
    const q = query(
      clientsRef, 
      where('userId', '==', userId)
      // orderBy('createdAt', 'desc') // Comentado até criar índice
    );
    const querySnapshot = await getDocs(q);

    const clients: Client[] = [];
    querySnapshot.forEach((doc) => {
      const clientData = doc.data();
      clients.push({
        id: doc.id,
        ...clientData,
        createdAt: formatTimestamp(clientData.createdAt),
        updatedAt: formatTimestamp(clientData.updatedAt)
      } as Client);
    });

    return clients;
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    throw error;
  }
};

export const getClientById = async (id: string): Promise<Client | null> => {
  try {
    const clientDoc = await getDoc(doc(db, 'clients', id));
    
    if (clientDoc.exists()) {
      const clientData = clientDoc.data();
      return {
        id: clientDoc.id,
        ...clientData,
        createdAt: formatTimestamp(clientData.createdAt),
        updatedAt: formatTimestamp(clientData.updatedAt)
      } as Client;
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar cliente por ID:", error);
    throw error;
  }
};

export const updateClient = async (id: string, clientData: Partial<Client>): Promise<Client> => {
  try {
    const clientRef = doc(db, 'clients', id);
    const updateData = updateDocumentData({
      name: clientData.name?.trim(),
      phone: clientData.phone?.replace(/\D/g, ''),
      email: clientData.email?.trim().toLowerCase() || null,
      address: clientData.address?.trim() || null,
      notes: clientData.notes?.trim() || null,
    });

    await updateDoc(clientRef, updateData);

    // Buscar dados atualizados
    const updatedDoc = await getDoc(clientRef);
    if (updatedDoc.exists()) {
      const data = updatedDoc.data();
      return {
        id: updatedDoc.id,
        ...data,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt)
      } as Client;
    }

    throw new Error("Cliente não encontrado após atualização");
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'clients', id));
    return true;
  } catch (error) {
    console.error("Erro ao deletar cliente:", error);
    return false;
  }
};

export const searchClients = async (userId: string, searchQuery: string): Promise<Client[]> => {
  try {
    // No Firestore, a busca por texto é limitada. 
    // Para uma busca mais avançada, considere usar Algolia ou implementar busca do lado do cliente
    const clientsRef = collection(db, 'clients');
    const q = query(
      clientsRef,
      where('userId', '==', userId)
      // orderBy('createdAt', 'desc') // Comentado até criar índice
    );
    const querySnapshot = await getDocs(q);

    const clients: Client[] = [];
    const searchTerm = searchQuery.trim().toLowerCase();

    querySnapshot.forEach((doc) => {
      const clientData = doc.data();
      const client = {
        id: doc.id,
        ...clientData,
        createdAt: formatTimestamp(clientData.createdAt),
        updatedAt: formatTimestamp(clientData.updatedAt)
      } as Client;

      // Filtro do lado do cliente
      if (
        client.name.toLowerCase().includes(searchTerm) ||
        client.phone.includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm)
      ) {
        clients.push(client);
      }
    });

    return clients;
  } catch (error) {
    console.error("Erro na busca de clientes:", error);
    throw error;
  }
};

// ============= FUNÇÕES DE ORDENS DE SERVIÇO =============
export const insertServiceOrder = async (serviceOrder: ServiceOrder): Promise<ServiceOrder> => {
  try {
    if (!serviceOrder.title || !serviceOrder.clientId || !serviceOrder.userId) {
      throw new Error("Título, cliente e usuário são obrigatórios");
    }

    const totalCost = (serviceOrder.laborCost || 0) + (serviceOrder.partsCost || 0);

    const serviceOrderData = createDocumentData({
      clientId: serviceOrder.clientId,
      userId: serviceOrder.userId,
      title: serviceOrder.title.trim(),
      description: serviceOrder.description?.trim() || null,
      status: serviceOrder.status || 'pending',
      priority: serviceOrder.priority || 'medium',
      vehicleInfo: serviceOrder.vehicleInfo?.trim() || null,
      laborCost: serviceOrder.laborCost || 0,
      partsCost: serviceOrder.partsCost || 0,
      totalCost,
      estimatedCompletion: serviceOrder.estimatedCompletion || null,
      notes: serviceOrder.notes?.trim() || null
    });

    const docRef = await addDoc(collection(db, 'serviceOrders'), serviceOrderData);

    return {
      id: docRef.id,
      ...serviceOrder,
      totalCost,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Erro ao inserir ordem de serviço:", error);
    throw new Error("Erro ao criar ordem de serviço: " + (error as Error).message);
  }
};

export const getServiceOrdersByUserId = async (userId: string): Promise<ServiceOrder[]> => {
  try {
    const serviceOrdersRef = collection(db, 'serviceOrders');
    const q = query(
      serviceOrdersRef,
      where('userId', '==', userId)
      // orderBy('createdAt', 'desc') // Comentado até criar índice
    );
    const querySnapshot = await getDocs(q);

    const serviceOrders: ServiceOrder[] = [];
    
    for (const orderDoc of querySnapshot.docs) {
      const orderData = orderDoc.data();
      
      // Buscar nome do cliente
      let clientName = 'Cliente não identificado';
      try {
        const clientDoc = await getDoc(doc(db, 'clients', orderData.clientId));
        if (clientDoc.exists()) {
          clientName = clientDoc.data().name;
        }
      } catch (error) {
        console.warn("Erro ao buscar cliente:", error);
      }

      serviceOrders.push({
        id: orderDoc.id,
        ...orderData,
        clientName,
        createdAt: formatTimestamp(orderData.createdAt),
        updatedAt: formatTimestamp(orderData.updatedAt)
      } as ServiceOrder);
    }

    return serviceOrders;
  } catch (error) {
    console.error("Erro ao buscar ordens de serviço:", error);
    throw error;
  }
};

export const getServiceOrderById = async (id: string): Promise<ServiceOrder | null> => {
  try {
    const serviceOrderDoc = await getDoc(doc(db, 'serviceOrders', id));
    
    if (serviceOrderDoc.exists()) {
      const orderData = serviceOrderDoc.data();
      
      // Buscar dados do cliente
      let clientName = 'Cliente não identificado';
      let clientPhone = '';
      try {
        const clientDoc = await getDoc(doc(db, 'clients', orderData.clientId));
        if (clientDoc.exists()) {
          const clientData = clientDoc.data();
          clientName = clientData.name;
          clientPhone = clientData.phone;
        }
      } catch (error) {
        console.warn("Erro ao buscar cliente:", error);
      }

      return {
        id: serviceOrderDoc.id,
        ...orderData,
        clientName,
        clientPhone,
        createdAt: formatTimestamp(orderData.createdAt),
        updatedAt: formatTimestamp(orderData.updatedAt)
      } as ServiceOrder;
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar ordem de serviço por ID:", error);
    throw error;
  }
};

export const updateServiceOrder = async (id: string, serviceOrderData: Partial<ServiceOrder>): Promise<ServiceOrder> => {
  try {
    const serviceOrderRef = doc(db, 'serviceOrders', id);
    
    let updateData: any = { ...serviceOrderData };
    
    // Recalcular custo total se necessário
    if (serviceOrderData.laborCost !== undefined || serviceOrderData.partsCost !== undefined) {
      const currentDoc = await getDoc(serviceOrderRef);
      if (currentDoc.exists()) {
        const currentData = currentDoc.data();
        const laborCost = serviceOrderData.laborCost ?? currentData.laborCost ?? 0;
        const partsCost = serviceOrderData.partsCost ?? currentData.partsCost ?? 0;
        updateData.totalCost = laborCost + partsCost;
      }
    }

    updateData = updateDocumentData(updateData);
    await updateDoc(serviceOrderRef, updateData);

    // Buscar dados atualizados com cliente
    const updatedDoc = await getDoc(serviceOrderRef);
    if (updatedDoc.exists()) {
      const data = updatedDoc.data();
      
      let clientName = 'Cliente não identificado';
      try {
        const clientDoc = await getDoc(doc(db, 'clients', data.clientId));
        if (clientDoc.exists()) {
          clientName = clientDoc.data().name;
        }
      } catch (error) {
        console.warn("Erro ao buscar cliente:", error);
      }

      return {
        id: updatedDoc.id,
        ...data,
        clientName,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt)
      } as ServiceOrder;
    }

    throw new Error("Ordem de serviço não encontrada após atualização");
  } catch (error) {
    console.error("Erro ao atualizar ordem de serviço:", error);
    throw error;
  }
};

export const deleteServiceOrder = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'serviceOrders', id));
    return true;
  } catch (error) {
    console.error("Erro ao deletar ordem de serviço:", error);
    return false;
  }
};

export const getServiceOrdersByClientId = async (clientId: string): Promise<ServiceOrder[]> => {
  try {
    const serviceOrdersRef = collection(db, 'serviceOrders');
    const q = query(
      serviceOrdersRef,
      where('clientId', '==', clientId)
      // orderBy('createdAt', 'desc') // Comentado até criar índice
    );
    const querySnapshot = await getDocs(q);

    const serviceOrders: ServiceOrder[] = [];
    querySnapshot.forEach((doc) => {
      const orderData = doc.data();
      serviceOrders.push({
        id: doc.id,
        ...orderData,
        createdAt: formatTimestamp(orderData.createdAt),
        updatedAt: formatTimestamp(orderData.updatedAt)
      } as ServiceOrder);
    });

    return serviceOrders;
  } catch (error) {
    console.error("Erro ao buscar ordens por cliente:", error);
    throw error;
  }
};

export const getServiceOrdersByStatus = async (userId: string, status: ServiceOrder['status']): Promise<ServiceOrder[]> => {
  try {
    const serviceOrdersRef = collection(db, 'serviceOrders');
    const q = query(
      serviceOrdersRef,
      where('userId', '==', userId),
      where('status', '==', status)
      // orderBy('createdAt', 'desc') // Comentado até criar índice
    );
    const querySnapshot = await getDocs(q);

    const serviceOrders: ServiceOrder[] = [];
    
    for (const orderDoc of querySnapshot.docs) {
      const orderData = orderDoc.data();
      
      let clientName = 'Cliente não identificado';
      try {
        const clientDoc = await getDoc(doc(db, 'clients', orderData.clientId));
        if (clientDoc.exists()) {
          clientName = clientDoc.data().name;
        }
      } catch (error) {
        console.warn("Erro ao buscar cliente:", error);
      }

      serviceOrders.push({
        id: orderDoc.id,
        ...orderData,
        clientName,
        createdAt: formatTimestamp(orderData.createdAt),
        updatedAt: formatTimestamp(orderData.updatedAt)
      } as ServiceOrder);
    }

    return serviceOrders;
  } catch (error) {
    console.error("Erro ao buscar ordens por status:", error);
    throw error;
  }
};

// ============= FUNÇÕES DE LOGOUT =============
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    throw error;
  }
};
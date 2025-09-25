import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./App";
import { insertClient, Client } from "./database";
import { useToast, toast } from "./ToastSystem";

type Props = NativeStackScreenProps<RootStackParamList, "AddClient">;

export default function AddClientScreen({ navigation, route }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  
  const user = route.params?.user;
  const { showToast } = useToast();

  // Validações
  const validateName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  };

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return true; // Email é opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const formatPhone = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhone(text);
    setPhone(formatted);
  };

  const handleSaveClient = async () => {
    // Validações
    if (!validateName(name)) {
      showToast(toast.error("Nome inválido", "O nome deve ter pelo menos 2 caracteres"));
      return;
    }

    if (!validatePhone(phone)) {
      showToast(toast.error("Telefone inválido", "Digite um telefone válido com DDD"));
      return;
    }

    if (!validateEmail(email)) {
      showToast(toast.error("Email inválido", "Digite um email válido ou deixe em branco"));
      return;
    }

    if (!user?.id) {
      showToast(toast.error("Erro", "Usuário não identificado"));
      return;
    }

    setLoading(true);

    try {
      const clientData: Client = {
        name: name.trim(),
        phone: phone,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        userId: user.id
      };

      const newClient = await insertClient(clientData);
      console.log("Cliente criado:", newClient);

      // Toast de sucesso
      showToast(toast.success(
        "Cliente cadastrado!", 
        `${name} foi adicionado com sucesso`,
        3000
      ));

      // Limpa o formulário
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setNotes("");

      // Volta para a lista após um pequeno delay para mostrar o toast
      setTimeout(() => {
        // Navega de volta passando um parâmetro para indicar que deve recarregar
        navigation.navigate("ClientsList", { 
          user, 
          shouldRefresh: true,
          newClientId: newClient.id 
        });
      }, 1500);

    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      
      // Verifica se é erro de duplicata
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      if (errorMessage.includes("já está cadastrado") || errorMessage.includes("UNIQUE constraint")) {
        showToast(toast.error(
          "Cliente já existe", 
          "Este telefone ou email já está cadastrado"
        ));
      } else {
        showToast(toast.error(
          "Erro ao cadastrar", 
          "Não foi possível cadastrar o cliente. Tente novamente"
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return validateName(name) && validatePhone(phone) && validateEmail(email) && !loading;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo Cliente</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {/* Nome */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome Completo *</Text>
              <TextInput
                style={[styles.input, !validateName(name) && name.length > 0 && styles.inputError]}
                placeholder="João Silva"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Telefone */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefone *</Text>
              <TextInput
                style={[styles.input, !validatePhone(phone) && phone.length > 0 && styles.inputError]}
                placeholder="(11) 99999-9999"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={15}
                editable={!loading}
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, !validateEmail(email) && email.length > 0 && styles.inputError]}
                placeholder="joao@email.com (opcional)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Endereço */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Endereço</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Rua, número, bairro, cidade (opcional)"
                value={address}
                onChangeText={setAddress}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            {/* Observações */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Observações</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notas sobre o cliente, preferências, histórico... (opcional)"
                value={notes}
                onChangeText={setNotes}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* Botão Salvar */}
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                (!isFormValid()) && styles.saveButtonDisabled
              ]} 
              onPress={handleSaveClient}
              disabled={!isFormValid()}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Salvando..." : "Salvar Cliente"}
              </Text>
            </TouchableOpacity>

            {/* Info sobre campos obrigatórios */}
            <Text style={styles.requiredInfo}>
              * Campos obrigatórios
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerRight: {
    flex: 1,
  },
  
  // SCROLL VIEW
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // FORMULÁRIO
  formContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  textArea: {
    minHeight: 80,
    maxHeight: 120,
  },
  
  // BOTÃO SALVAR
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // INFO
  requiredInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
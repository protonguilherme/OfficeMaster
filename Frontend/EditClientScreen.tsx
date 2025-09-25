import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./App";
import { updateClient } from "./database";

type Props = NativeStackScreenProps<RootStackParamList, "EditClient">;

export default function EditClientScreen({ navigation, route }: Props) {
  const { client, user } = route.params;
  
  // Estados preenchidos com dados do cliente
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [email, setEmail] = useState(client.email || "");
  const [address, setAddress] = useState(client.address || "");
  const [notes, setNotes] = useState(client.notes || "");
  const [loading, setLoading] = useState(false);

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

  // Verifica se houve mudanças
  const hasChanges = () => {
    return (
      name.trim() !== client.name ||
      phone !== client.phone ||
      email.trim() !== (client.email || '') ||
      address.trim() !== (client.address || '') ||
      notes.trim() !== (client.notes || '')
    );
  };

  const handleSaveChanges = async () => {
    // Validações
    if (!validateName(name)) {
      Alert.alert("Nome inválido", "O nome deve ter pelo menos 2 caracteres.");
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert("Telefone inválido", "Digite um telefone válido com DDD.");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Email inválido", "Digite um email válido ou deixe em branco.");
      return;
    }

    // Verifica se há mudanças
    if (!hasChanges()) {
      Alert.alert("Sem alterações", "Nenhuma alteração foi feita.");
      return;
    }

    setLoading(true);

    try {
      const updatedData = {
        name: name.trim(),
        phone: phone,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const updatedClient = await updateClient(client.id!, updatedData);
      console.log("Cliente atualizado:", updatedClient);

      Alert.alert(
        "Alterações salvas! ✅", 
        `${name} foi atualizado com sucesso.`, 
        [
          { 
            text: "OK", 
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      Alert.alert(
        "Erro ao salvar", 
        "Não foi possível salvar as alterações. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        "Descartar alterações?",
        "Você tem alterações não salvas. Deseja descartar?",
        [
          { text: "Continuar editando", style: "cancel" },
          { 
            text: "Descartar", 
            style: "destructive",
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      navigation.goBack();
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
            onPress={handleCancel}
          >
            <Text style={styles.backButtonText}>← Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Cliente</Text>
          <TouchableOpacity 
            style={[styles.saveHeaderButton, (!isFormValid() || !hasChanges()) && styles.saveHeaderButtonDisabled]}
            onPress={handleSaveChanges}
            disabled={!isFormValid() || !hasChanges()}
          >
            <Text style={[styles.saveHeaderButtonText, (!isFormValid() || !hasChanges()) && styles.saveHeaderButtonTextDisabled]}>
              Salvar
            </Text>
          </TouchableOpacity>
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

            {/* Botão Salvar (principal) */}
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                (!isFormValid() || !hasChanges()) && styles.saveButtonDisabled
              ]} 
              onPress={handleSaveChanges}
              disabled={!isFormValid() || !hasChanges()}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Salvando..." : hasChanges() ? "Salvar Alterações" : "Nenhuma alteração"}
              </Text>
            </TouchableOpacity>

            {/* Info sobre campos obrigatórios e alterações */}
            <Text style={styles.requiredInfo}>
              * Campos obrigatórios
            </Text>
            
            {hasChanges() && (
              <View style={styles.changesIndicator}>
                <Text style={styles.changesText}>✏️ Você tem alterações não salvas</Text>
              </View>
            )}
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
  saveHeaderButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  saveHeaderButtonDisabled: {
    opacity: 0.5,
  },
  saveHeaderButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  saveHeaderButtonTextDisabled: {
    color: '#ccc',
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
  
  // INFO E INDICADORES
  requiredInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  changesIndicator: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9500',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
    alignItems: 'center',
  },
  changesText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '600',
  },
});
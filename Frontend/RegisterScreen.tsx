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
  Dimensions
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./App";
import { insertUser } from "./database";
import { useToast, toast } from "./ToastSystem";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

const { height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [workshopName, setWorkshopName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { showToast } = useToast();

  // Validações
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    // Aceita telefones com 10 ou 11 dígitos (com ou sem DDD)
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  };

  const formatPhone = (text: string): string => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // Aplica máscara (XX) XXXXX-XXXX
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const handleRegister = async () => {
    // Validações detalhadas
    if (!validateName(firstName)) {
      showToast(toast.error("Nome inválido", "O nome deve ter pelo menos 2 caracteres"));
      return;
    }

    if (!validateName(lastName)) {
      showToast(toast.error("Sobrenome inválido", "O sobrenome deve ter pelo menos 2 caracteres"));
      return;
    }

    if (!validateName(workshopName)) {
      showToast(toast.error("Nome da oficina inválido", "O nome da oficina deve ter pelo menos 2 caracteres"));
      return;
    }

    if (!validatePhone(phone)) {
      showToast(toast.error("Telefone inválido", "Digite um telefone válido com DDD"));
      return;
    }

    if (!validateEmail(email)) {
      showToast(toast.error("Email inválido", "Digite um email válido (ex: usuario@email.com)"));
      return;
    }

    if (!validatePassword(password)) {
      showToast(toast.error("Senha inválida", "A senha deve ter pelo menos 6 caracteres"));
      return;
    }

    if (password !== confirmPassword) {
      showToast(toast.error("Senhas não coincidem", "As senhas digitadas não são iguais"));
      return;
    }

    setLoading(true);

    try {
      const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        workshopName: workshopName.trim(),
        phone: phone.replace(/\D/g, ''), // Salva só os números
        email: email.trim().toLowerCase(),
        password: password
      };

      console.log("Tentando criar usuário:", { ...userData, password: '***' });
      
      const newUser = await insertUser(userData);
      
      console.log("Usuário criado com sucesso:", newUser);

      // Toast de sucesso
      showToast(toast.success(
        "Conta criada com sucesso!", 
        `Bem-vindo, ${firstName}! Sua conta foi criada.`,
        4000
      ));

      // Limpa os campos após sucesso
      setTimeout(() => {
        setFirstName("");
        setLastName("");
        setWorkshopName("");
        setPhone("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        navigation.navigate("Login");
      }, 2000);

    } catch (err) {
      console.error("Erro ao criar conta:", err);
      showToast(toast.error(
        "Erro ao criar conta", 
        "Email pode já estar cadastrado ou houve erro no sistema"
      ));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhone(text);
    setPhone(formatted);
  };

  const isFormValid = () => {
    return firstName && lastName && workshopName && phone && email && password && confirmPassword && !loading;
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Voltar</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>Preencha seus dados para começar</Text>
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>
            {/* Nome e Sobrenome */}
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Nome *</Text>
                <TextInput 
                  style={[styles.input, !validateName(firstName) && firstName.length > 0 && styles.inputError]}
                  placeholder="João" 
                  value={firstName} 
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Sobrenome *</Text>
                <TextInput 
                  style={[styles.input, !validateName(lastName) && lastName.length > 0 && styles.inputError]}
                  placeholder="Silva" 
                  value={lastName} 
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Nome da Oficina */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome da Oficina *</Text>
              <TextInput 
                style={[styles.input, !validateName(workshopName) && workshopName.length > 0 && styles.inputError]}
                placeholder="Auto Mecânica Silva" 
                value={workshopName} 
                onChangeText={setWorkshopName}
                autoCapitalize="words"
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
              <Text style={styles.label}>Email *</Text>
              <TextInput 
                style={[styles.input, !validateEmail(email) && email.length > 0 && styles.inputError]}
                placeholder="joao@email.com" 
                value={email} 
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!loading}
              />
            </View>

            {/* Senha */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha *</Text>
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={[styles.passwordInput, !validatePassword(password) && password.length > 0 && styles.inputError]}
                  placeholder="Mínimo 6 caracteres" 
                  value={password} 
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirmar Senha */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Senha *</Text>
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={[styles.passwordInput, password !== confirmPassword && confirmPassword.length > 0 && styles.inputError]}
                  placeholder="Digite a senha novamente" 
                  value={confirmPassword} 
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.eyeText}>{showConfirmPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão Registrar */}
            <TouchableOpacity 
              style={[
                styles.button, 
                (!isFormValid()) && styles.buttonDisabled
              ]} 
              onPress={handleRegister}
              disabled={!isFormValid()}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {loading ? "Criando conta..." : "Criar Conta"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Link para Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Fazer Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
  },
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#f8f9fa",
    paddingTop: 50,
  },
  headerContainer: {
    marginBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: { 
    borderWidth: 1, 
    borderColor: "#e1e5e9", 
    padding: 12, 
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#ff4444",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e5e9",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  eyeText: {
    fontSize: 18,
  },
  button: { 
    backgroundColor: "#34C759", 
    padding: 16, 
    borderRadius: 8, 
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#666",
    fontSize: 16,
  },
  loginLink: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
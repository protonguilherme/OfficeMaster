import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./App";
import { getUserByEmailAndPassword } from "./database";
import { useToast, toast } from "./ToastSystem";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { showToast } = useToast();

  // Limpar campos quando a tela ganhar foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reset form quando volta para login
      setEmail("");
      setPassword("");
      setLoading(false);
    });

    return unsubscribe;
  }, [navigation]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6; // Mínimo 6 caracteres
  };

  const handleLogin = async () => {
    // Validações
    if (!email.trim()) {
      showToast(toast.error("Campo obrigatório", "Digite seu email"));
      return;
    }

    if (!validateEmail(email.trim())) {
      showToast(toast.error("Email inválido", "Digite um email válido (ex: usuario@email.com)"));
      return;
    }

    if (!password.trim()) {
      showToast(toast.error("Campo obrigatório", "Digite sua senha"));
      return;
    }

    if (!validatePassword(password)) {
      showToast(toast.error("Senha inválida", "A senha deve ter pelo menos 6 caracteres"));
      return;
    }

    setLoading(true);

    try {
      console.log("Tentando fazer login com:", email);
      const user = await getUserByEmailAndPassword(email.trim().toLowerCase(), password);
      
      if (user) {
        console.log("Login realizado com sucesso:", user);
        
        // Toast de sucesso
        showToast(toast.success(
          "Login realizado!", 
          `Bem-vindo de volta, ${user.firstName}!`,
          2000
        ));

        // Pequeno delay para mostrar o toast antes de navegar
        setTimeout(() => {
          navigation.navigate("Home", { user });
        }, 1000);
      } else {
        showToast(toast.error(
          "Acesso negado", 
          "Email ou senha incorretos. Verifique seus dados e tente novamente"
        ));
      }
    } catch (error) {
      console.error("Erro no processo de login:", error);
      
      // Tratamento de erros específicos do Firebase
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      if (errorMessage.includes("user-not-found") || errorMessage.includes("wrong-password")) {
        showToast(toast.error(
          "Credenciais inválidas", 
          "Email ou senha incorretos"
        ));
      } else if (errorMessage.includes("too-many-requests")) {
        showToast(toast.error(
          "Muitas tentativas", 
          "Aguarde alguns minutos antes de tentar novamente"
        ));
      } else if (errorMessage.includes("network")) {
        showToast(toast.error(
          "Erro de conexão", 
          "Verifique sua internet e tente novamente"
        ));
      } else {
        showToast(toast.error(
          "Erro no sistema", 
          "Ocorreu um erro inesperado. Tente novamente"
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Navega direto para a tela, sem exigir email
    navigation.navigate("ForgotPassword");
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
          {/* Logo/Título */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Office Master</Text>
            <Text style={styles.subtitle}>Faça login para continuar</Text>
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, !validateEmail(email) && email.length > 0 && styles.inputError]}
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={!loading}
              />
              {email.length > 0 && !validateEmail(email) && (
                <Text style={styles.errorText}>Digite um email válido</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, !validatePassword(password) && password.length > 0 && styles.inputError]}
                  placeholder="Sua senha"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
              {password.length > 0 && !validatePassword(password) && (
                <Text style={styles.errorText}>A senha deve ter pelo menos 6 caracteres</Text>
              )}
            </View>

            <TouchableOpacity 
              style={[
                styles.button, 
                loading && styles.buttonDisabled,
                (!email || !password || !validateEmail(email) || !validatePassword(password)) && styles.buttonDisabled
              ]} 
              onPress={handleLogin}
              disabled={loading || !email || !password || !validateEmail(email) || !validatePassword(password)}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {loading ? "Entrando..." : "Entrar"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Links */}
          <View style={styles.linksContainer}>
            <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
              <Text style={[styles.link, loading && styles.linkDisabled]}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Ainda não tem conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")} disabled={loading}>
                <Text style={[styles.registerLink, loading && styles.linkDisabled]}>Criar conta</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: "center", 
    padding: 20, 
    backgroundColor: "#f8f9fa" 
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: { 
    fontSize: 32, 
    fontWeight: "bold", 
    color: "#1a1a1a",
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
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 4,
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
    backgroundColor: "#007AFF", 
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
  linksContainer: {
    alignItems: "center",
  },
  link: { 
    color: "#007AFF", 
    textAlign: "center",
    fontSize: 16,
    marginBottom: 20,
  },
  linkDisabled: {
    color: "#ccc",
  },
  registerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  registerText: {
    color: "#666",
    fontSize: 16,
  },
  registerLink: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
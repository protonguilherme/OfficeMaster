import React, { useState } from "react";
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
import { useToast, toast } from "./ToastSystem";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./App";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

const { height } = Dimensions.get('window');

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { showToast } = useToast();
  const auth = getAuth();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showToast(toast.error("Campo obrigatório", "Digite seu email para continuar"));
      return;
    }

    if (!validateEmail(email.trim())) {
      showToast(toast.error("Email inválido", "Digite um email válido (ex: usuario@email.com)"));
      return;
    }

    setLoading(true);

    try {
      // Enviar email de reset usando Firebase Auth
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      
      console.log("Email de reset enviado para:", email);
      
      setEmailSent(true);
      
      // Toast de sucesso
      showToast(toast.success(
        "Email enviado!", 
        `Instruções enviadas para ${email}`,
        4000
      ));

    } catch (error: any) {
      console.error("Erro ao enviar email:", error);
      
      // Tratamento específico de erros do Firebase
      if (error.code === 'auth/user-not-found') {
        showToast(toast.error(
          "Email não encontrado", 
          "Este email não está cadastrado no sistema"
        ));
      } else if (error.code === 'auth/invalid-email') {
        showToast(toast.error(
          "Email inválido", 
          "Digite um email válido"
        ));
      } else if (error.code === 'auth/too-many-requests') {
        showToast(toast.error(
          "Muitas tentativas", 
          "Aguarde alguns minutos antes de tentar novamente"
        ));
      } else if (error.code === 'auth/network-request-failed') {
        showToast(toast.error(
          "Erro de conexão", 
          "Verifique sua internet e tente novamente"
        ));
      } else {
        showToast(toast.error(
          "Erro no envio", 
          "Não foi possível enviar o email. Tente novamente"
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    handleResetPassword();
  };

  const handleBackToLogin = () => {
    setEmail("");
    setEmailSent(false);
    navigation.navigate("Login");
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
              disabled={loading}
            >
              <Text style={[styles.backButtonText, loading && styles.disabledText]}>← Voltar</Text>
            </TouchableOpacity>
            
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🔑</Text>
            </View>
            
            <Text style={styles.title}>Recuperar Senha</Text>
            <Text style={styles.subtitle}>
              {!emailSent 
                ? "Digite seu email e enviaremos instruções para criar uma nova senha"
                : "Verifique seu email para continuar"
              }
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>
            {!emailSent ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email cadastrado</Text>
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

                <TouchableOpacity 
                  style={[
                    styles.button, 
                    loading && styles.buttonDisabled,
                    (!email || !validateEmail(email)) && styles.buttonDisabled
                  ]} 
                  onPress={handleResetPassword}
                  disabled={loading || !email || !validateEmail(email)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>
                    {loading ? "Enviando..." : "Enviar Instruções"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>📧</Text>
                <Text style={styles.successTitle}>Email Enviado!</Text>
                <Text style={styles.successText}>
                  Instruções foram enviadas para:
                </Text>
                <Text style={styles.emailText}>{email}</Text>
                
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsTitle}>Próximos passos:</Text>
                  <Text style={styles.instructionItem}>1. Verifique sua caixa de entrada</Text>
                  <Text style={styles.instructionItem}>2. Clique no link do email</Text>
                  <Text style={styles.instructionItem}>3. Crie sua nova senha</Text>
                  <Text style={styles.instructionItem}>4. Faça login com a nova senha</Text>
                </View>
                
                <View style={styles.actionsContainer}>
                  <TouchableOpacity 
                    style={styles.resendButton}
                    onPress={handleResendEmail}
                    disabled={loading}
                  >
                    <Text style={styles.resendButtonText}>Reenviar Email</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.loginButton}
                    onPress={handleBackToLogin}
                    disabled={loading}
                  >
                    <Text style={styles.loginButtonText}>Voltar ao Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Informações adicionais */}
          {!emailSent && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>💡 Dicas importantes:</Text>
              <Text style={styles.infoText}>• Verifique sua caixa de spam</Text>
              <Text style={styles.infoText}>• O email pode demorar alguns minutos</Text>
              <Text style={styles.infoText}>• Certifique-se de usar o email correto</Text>
              <Text style={styles.infoText}>• O link expira em 1 hora</Text>
            </View>
          )}

          {/* Link para Login */}
          {!emailSent && (
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Lembrou da senha? </Text>
              <TouchableOpacity onPress={handleBackToLogin} disabled={loading}>
                <Text style={[styles.loginLink, loading && styles.disabledText]}>
                  Fazer Login
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
    alignItems: "center",
    marginBottom: 40,
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
  disabledText: {
    color: "#ccc",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
  },
  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
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
  button: { 
    backgroundColor: "#FF9500", 
    padding: 16, 
    borderRadius: 8, 
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 16,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  successIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "center",
  },
  successText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    textAlign: "center",
    marginBottom: 20,
  },
  instructionsContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    width: "100%",
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 10,
  },
  instructionItem: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    paddingLeft: 4,
  },
  actionsContainer: {
    width: "100%",
    gap: 12,
  },
  resendButton: {
    borderWidth: 1,
    borderColor: "#FF9500",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  resendButtonText: {
    color: "#FF9500",
    fontWeight: "600",
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  infoContainer: {
    backgroundColor: "#f0f8ff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    lineHeight: 20,
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
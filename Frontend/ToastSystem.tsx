import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

// Tipos de notificação
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Context para gerenciar toasts globalmente
interface ToastContextType {
  showToast: (toast: ToastProps) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook personalizado com verificação de segurança
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback para quando o context não está disponível
    console.warn('useToast deve ser usado dentro de ToastProvider. Usando fallback.');
    return {
      showToast: (toast: ToastProps) => {
        console.log(`Toast: ${toast.title}${toast.message ? ' - ' + toast.message : ''}`);
      },
      hideToast: () => {
        console.log('Toast hidden');
      }
    };
  }
  return context;
};

// Componente individual do Toast
interface ToastComponentProps extends ToastProps {
  visible: boolean;
  onHide: () => void;
}

const ToastComponent: React.FC<ToastComponentProps> = ({
  type,
  title,
  message,
  duration = 3000,
  visible,
  onHide
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // Animação de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      onHide();
    });
  };

  const getToastStyle = (toastType: ToastType) => {
    switch (toastType) {
      case 'success':
        return { backgroundColor: '#D4F6D4', borderColor: '#34C759', icon: '✅' };
      case 'error':
        return { backgroundColor: '#FFE6E6', borderColor: '#FF3B30', icon: '❌' };
      case 'warning':
        return { backgroundColor: '#FFF8E1', borderColor: '#FF9500', icon: '⚠️' };
      case 'info':
        return { backgroundColor: '#E3F2FD', borderColor: '#007AFF', icon: 'ℹ️' };
      default:
        return { backgroundColor: '#F5F5F5', borderColor: '#8E8E93', icon: '📝' };
    }
  };

  const toastStyle = getToastStyle(type);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: toastStyle.backgroundColor,
          borderColor: toastStyle.borderColor,
        }
      ]}
    >
      <View style={styles.toastContent}>
        <Text style={styles.toastIcon}>{toastStyle.icon}</Text>
        <View style={styles.toastText}>
          <Text style={styles.toastTitle}>{title}</Text>
          {message && <Text style={styles.toastMessage}>{message}</Text>}
        </View>
      </View>
    </Animated.View>
  );
};

// Provider do Toast
interface ToastProviderProps {
  children: React.ReactNode;
}

const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<ToastProps | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = (toast: ToastProps) => {
    try {
      if (visible) {
        setVisible(false);
        setTimeout(() => {
          setCurrentToast(toast);
          setVisible(true);
        }, 300);
      } else {
        setCurrentToast(toast);
        setVisible(true);
      }
    } catch (error) {
      console.error('Erro ao mostrar toast:', error);
    }
  };

  const hideToast = () => {
    try {
      setVisible(false);
      setTimeout(() => setCurrentToast(null), 300);
    } catch (error) {
      console.error('Erro ao esconder toast:', error);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {currentToast && (
        <ToastComponent
          {...currentToast}
          visible={visible}
          onHide={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
};

// Funções de conveniência para criar toasts
export const toast = {
  success: (title: string, message?: string, duration?: number): ToastProps => ({
    type: 'success', title, message, duration,
  }),
  error: (title: string, message?: string, duration?: number): ToastProps => ({
    type: 'error', title, message, duration,
  }),
  warning: (title: string, message?: string, duration?: number): ToastProps => ({
    type: 'warning', title, message, duration,
  }),
  info: (title: string, message?: string, duration?: number): ToastProps => ({
    type: 'info', title, message, duration,
  }),
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  toastIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  toastText: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

// Exportações
export { ToastProvider };
export default ToastProvider;
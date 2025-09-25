import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  RefreshControl,
  Dimensions,
  SafeAreaView
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./App";
import { useToast, toast } from "./ToastSystem";

// Mock data - posteriormente será integrado com database real
interface InventoryItem {
  id: number;
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
}

type Props = NativeStackScreenProps<RootStackParamList, "InventoryList">;

const { width } = Dimensions.get('window');

// Componente de Item do Estoque
interface InventoryItemProps {
  item: InventoryItem;
  onPress: () => void;
  onEdit: () => void;
  onAddStock: () => void;
  onRemoveStock: () => void;
}

const InventoryItemComponent: React.FC<InventoryItemProps> = ({ 
  item, 
  onPress, 
  onEdit, 
  onAddStock, 
  onRemoveStock 
}) => {
  const getStockStatusColor = () => {
    if (item.currentStock <= 0) return '#FF3B30'; // Sem estoque - vermelho
    if (item.currentStock <= item.minStock) return '#FF9500'; // Estoque baixo - laranja
    return '#34C759'; // Estoque ok - verde
  };

  const getStockStatusText = () => {
    if (item.currentStock <= 0) return 'SEM ESTOQUE';
    if (item.currentStock <= item.minStock) return 'ESTOQUE BAIXO';
    return 'ESTOQUE OK';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <TouchableOpacity style={styles.inventoryItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
          {item.brand && (
            <Text style={styles.itemBrand}>{item.brand}</Text>
          )}
          {item.partNumber && (
            <Text style={styles.itemPartNumber}>Cód: {item.partNumber}</Text>
          )}
        </View>
        
        <View style={styles.itemMeta}>
          <View style={[styles.stockBadge, { backgroundColor: getStockStatusColor() }]}>
            <Text style={styles.stockBadgeText}>{getStockStatusText()}</Text>
          </View>
          <Text style={styles.itemPrice}>{formatCurrency(item.unitPrice)}</Text>
        </View>
      </View>

      <View style={styles.itemFooter}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockText}>
            Estoque: <Text style={styles.stockNumber}>{item.currentStock}</Text>
          </Text>
          <Text style={styles.minStockText}>
            Mín: {item.minStock}
          </Text>
          {item.location && (
            <Text style={styles.locationText}>📍 {item.location}</Text>
          )}
        </View>
        
        <View style={styles.itemActions}>
          <TouchableOpacity style={[styles.actionButton, styles.addButton]} onPress={onAddStock}>
            <Text style={styles.actionButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.removeButton]} onPress={onRemoveStock}>
            <Text style={styles.actionButtonText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={onEdit}>
            <Text style={styles.actionIcon}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Componente de Estado Vazio
const EmptyState: React.FC<{ onAddItem: () => void }> = ({ onAddItem }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>📦</Text>
    <Text style={styles.emptyTitle}>Estoque vazio</Text>
    <Text style={styles.emptyDescription}>
      Comece cadastrando suas primeiras peças e produtos para controlar seu estoque
    </Text>
    <TouchableOpacity style={styles.addFirstItemButton} onPress={onAddItem}>
      <Text style={styles.addFirstItemButtonText}>➕ Adicionar Primeiro Item</Text>
    </TouchableOpacity>
  </View>
);

// Filtro por categoria
interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  selectedCategory, 
  onCategoryChange, 
  categories 
}) => (
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.categoryFilterContainer}
  >
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === 'all' && styles.categoryButtonActive
      ]}
      onPress={() => onCategoryChange('all')}
    >
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === 'all' && styles.categoryButtonTextActive
      ]}>
        Todas
      </Text>
    </TouchableOpacity>
    
    {categories.map(category => (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryButton,
          selectedCategory === category && styles.categoryButtonActive
        ]}
        onPress={() => onCategoryChange(category)}
      >
        <Text style={[
          styles.categoryButtonText,
          selectedCategory === category && styles.categoryButtonTextActive
        ]}>
          {category}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

export default function InventoryScreen({ navigation, route }: Props) {
  // Mock data - será substituído por dados reais do database
  const [inventoryItems] = useState<InventoryItem[]>([
    {
      id: 1,
      name: "Filtro de Óleo",
      description: "Filtro de óleo para motores 1.0 a 2.0",
      category: "Filtros",
      brand: "Mann",
      partNumber: "W811/80",
      currentStock: 15,
      minStock: 5,
      unitPrice: 25.90,
      supplier: "Distribuidora ABC",
      location: "Estante A-1"
    },
    {
      id: 2,
      name: "Óleo Motor 5W30",
      description: "Óleo sintético para motores modernos",
      category: "Óleos",
      brand: "Castrol",
      partNumber: "GTX-5W30",
      currentStock: 2,
      minStock: 10,
      unitPrice: 45.90,
      supplier: "Lubrificantes XYZ",
      location: "Estante B-2"
    },
    {
      id: 3,
      name: "Pastilha de Freio Dianteira",
      description: "Pastilha cerâmica alta performance",
      category: "Freios",
      brand: "Bosch",
      partNumber: "BB1234",
      currentStock: 0,
      minStock: 4,
      unitPrice: 89.90,
      supplier: "Auto Peças Sul",
      location: "Estante C-3"
    }
  ]);

  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>(inventoryItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  
  const user = route.params?.user;
  const { showToast } = useToast();

  // Lista de categorias únicas
  const categories = Array.from(new Set(inventoryItems.map(item => item.category)));

  // Aplica filtros
  const applyFilters = () => {
    let filtered = inventoryItems;

    // Filtro por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filtro por busca
    if (searchQuery.trim() !== '') {
      const searchTerm = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        item.brand?.toLowerCase().includes(searchTerm) ||
        item.partNumber?.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredItems(filtered);
  };

  // Efeitos para aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory]);

  // Pull-to-refresh
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simula carregamento
    setTimeout(() => {
      setRefreshing(false);
      showToast(toast.info("Atualizado", "Estoque atualizado com sucesso"));
    }, 1000);
  }, []);

  // Funções de ação
  const handleAddItem = () => {
    Alert.alert("Em breve", "Tela de adicionar item será implementada!");
  };

  const handleViewItem = (item: InventoryItem) => {
    Alert.alert("Detalhes do Item", `${item.name}\nEstoque: ${item.currentStock}\nPreço: R$ ${item.unitPrice}`);
  };

  const handleEditItem = (item: InventoryItem) => {
    Alert.alert("Em breve", "Edição de itens será implementada!");
  };

  const handleAddStock = (item: InventoryItem) => {
    Alert.alert(
      "Entrada de Estoque",
      `Adicionar estoque para: ${item.name}`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: () => {
            showToast(toast.success("Entrada registrada", `+10 unidades de ${item.name}`));
          }
        }
      ]
    );
  };

  const handleRemoveStock = (item: InventoryItem) => {
    Alert.alert(
      "Saída de Estoque",
      `Remover estoque de: ${item.name}`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: () => {
            showToast(toast.warning("Saída registrada", `-1 unidade de ${item.name}`));
          }
        }
      ]
    );
  };

  // Estatísticas rápidas
  const totalItems = inventoryItems.length;
  const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minStock).length;
  const outOfStockItems = inventoryItems.filter(item => item.currentStock <= 0).length;
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Estoque</Text>
          <Text style={styles.headerSubtitle}>
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addHeaderButton} onPress={handleAddItem}>
          <Text style={styles.addHeaderButtonText}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* Estatísticas Rápidas */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>Total Itens</Text>
          </View>
          <View style={[styles.statItem, outOfStockItems > 0 && styles.statItemAlert]}>
            <Text style={styles.statValue}>{outOfStockItems}</Text>
            <Text style={styles.statLabel}>Sem Estoque</Text>
          </View>
          <View style={[styles.statItem, lowStockItems > 0 && styles.statItemWarning]}>
            <Text style={styles.statValue}>{lowStockItems}</Text>
            <Text style={styles.statLabel}>Estoque Baixo</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              }).format(totalValue)}
            </Text>
            <Text style={styles.statLabel}>Valor Total</Text>
          </View>
        </ScrollView>
      </View>

      {/* Filtro por Categoria */}
      <CategoryFilter 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
      />

      {/* Barra de Busca */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome, categoria, marca ou código..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={() => setSearchQuery("")}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de Itens */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          searchQuery.trim() === "" && selectedCategory === 'all' ? (
            <EmptyState onAddItem={handleAddItem} />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsIcon}>🔍</Text>
              <Text style={styles.noResultsTitle}>Nenhum item encontrado</Text>
              <Text style={styles.noResultsDescription}>
                {searchQuery ? `Não encontramos itens para "${searchQuery}"` : 
                 `Não há itens na categoria "${selectedCategory}"`}
              </Text>
              <TouchableOpacity 
                style={styles.clearFiltersButton} 
                onPress={() => {
                  setSearchQuery("");
                  setSelectedCategory('all');
                }}
              >
                <Text style={styles.clearFiltersButtonText}>Limpar Filtros</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.inventoryList}>
            {filteredItems.map((item) => (
              <InventoryItemComponent
                key={item.id}
                item={item}
                onPress={() => handleViewItem(item)}
                onEdit={() => handleEditItem(item)}
                onAddStock={() => handleAddStock(item)}
                onRemoveStock={() => handleRemoveStock(item)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Botão Flutuante */}
      {inventoryItems.length > 0 && (
        <TouchableOpacity style={styles.floatingButton} onPress={handleAddItem}>
          <Text style={styles.floatingButtonText}>➕</Text>
        </TouchableOpacity>
      )}
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
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerLeft: {
    flex: 1,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  addHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  addHeaderButtonText: {
    fontSize: 20,
    color: '#fff',
  },

  // ESTATÍSTICAS
  statsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
    minWidth: 80,
  },
  statItemAlert: {
    backgroundColor: '#FFE6E6',
    marginHorizontal: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statItemWarning: {
    backgroundColor: '#FFF8E1',
    marginHorizontal: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // FILTRO DE CATEGORIA
  categoryFilterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    backgroundColor: '#fff',
    marginRight: 10,
  },
  categoryButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  
  // BUSCA
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  searchInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#1a1a1a',
  },
  clearButton: {
    padding: 15,
    paddingLeft: 5,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999',
  },
  
  // SCROLL VIEW
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // LISTA DE ITENS
  inventoryList: {
    padding: 20,
    paddingTop: 10,
  },
  inventoryItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemPartNumber: {
    fontSize: 12,
    color: '#999',
  },
  itemMeta: {
    alignItems: 'flex-end',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  stockBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  stockInfo: {
    flex: 1,
  },
  stockText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  stockNumber: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  minStockText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#FF9500',
  },
  itemActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#34C759',
  },
  removeButton: {
    backgroundColor: '#FF9500',
  },
  editButton: {
    backgroundColor: '#f8f9fa',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionIcon: {
    fontSize: 14,
  },
  
  // ESTADO VAZIO
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  addFirstItemButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addFirstItemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // SEM RESULTADOS
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  noResultsIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  noResultsDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  clearFiltersButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  clearFiltersButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // BOTÃO FLUTUANTE
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
});
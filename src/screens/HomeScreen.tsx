import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import DatePicker from 'react-native-date-picker';
import { RootStackParamList, Task } from '../navigation/AppNavigator';

// --- Global Constants and Types ---
const API_URL = 'http://10.0.2.2:3000/api/tasks'; // NOTE: Use your local IP or 'localhost' if running on web/iOS simulator
const Colors = {
  primary: '#059669', // Theme Primary
  secondary: '#ECFDF5', // Theme Secondary
  text: '#1F2937',
  lightText: '#6B7280',
  white: '#FFFFFF',
  danger: '#DC2626',
};

type TaskNavigationProp = StackNavigationProp<RootStackParamList>;
type TaskDetailRouteProp = RouteProp<RootStackParamList, 'taskDetail'>;

// --- Helper Components ---

interface HeaderProps {
  title: string;
  backButton?: boolean;
  actions?: { icon: 'trash'; action: string }[];
  onBack?: () => void;
  onActionPress?: (action: string) => void;
}

const Header: React.FC<HeaderProps> = ({ title, backButton, actions, onBack, onActionPress }) => {
  const navigation = useNavigation();

  const handleBack = onBack || navigation.goBack;

  const Icon = ({ name }: { name: string }) => (
    <Text style={{ color: Colors.white, fontSize: 20 }}>
      {name === 'plus' ? '+' : name === 'trash' ? '🗑️' : '←'}
    </Text>
  );

  return (
    <View style={[styles.headerContainer, { backgroundColor: Colors.primary }]}>
      <View style={styles.headerSide}>
        {backButton && (
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <Icon name="back" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSide}>
        {actions?.map((actionItem) => (
          <TouchableOpacity
            key={actionItem.action}
            onPress={() => onActionPress && onActionPress(actionItem.action)}
            style={styles.headerButton}
          >
            <Icon name={actionItem.icon} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

interface ButtonProps {
  label: string;
  action: string;
  color: string;
  fullWidth?: boolean;
  onPress: (action: string) => void;
  disabled?: boolean;
}

const CustomButton: React.FC<ButtonProps> = ({ label, color, onPress, action, fullWidth, disabled }) => (
  <TouchableOpacity
    style={[
      styles.button,
      { backgroundColor: color, width: fullWidth ? '100%' : 'auto' },
      disabled && styles.buttonDisabled,
    ]}
    onPress={() => onPress(action)}
    disabled={disabled}
  >
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

interface InputFieldProps {
  field: {
    name: string;
    type: 'text' | 'textarea' | 'date' | 'switch';
    label: string;
    required?: boolean;
  };
  value: any;
  onChange: (name: string, value: any) => void;
}

const InputField: React.FC<InputFieldProps> = ({ field, value, onChange }) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  switch (field.type) {
    case 'text':
      return (
        <View style={styles.formGroup}>
          <Text style={styles.label}>{field.label} {field.required && <Text style={{ color: 'red' }}>*</Text>}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={(text) => onChange(field.name, text)}
          />
        </View>
      );
    case 'textarea':
      return (
        <View style={styles.formGroup}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={value}
            onChangeText={(text) => onChange(field.name, text)}
            multiline
          />
        </View>
      );
    case 'date':
      // DatePicker expects a Date object
      const dateObject = value ? new Date(value) : new Date();
      const displayDate = value ? dateObject.toLocaleDateString() : 'Tarih Seçin';
      
      return (
        <View style={styles.formGroup}>
          <Text style={styles.label}>{field.label}</Text>
          <TouchableOpacity onPress={() => setIsDatePickerOpen(true)} style={styles.dateInput}>
            <Text style={{ color: value ? Colors.text : Colors.lightText }}>{displayDate}</Text>
          </TouchableOpacity>
          <DatePicker
            modal
            open={isDatePickerOpen}
            date={dateObject}
            mode="date"
            onConfirm={(date) => {
              setIsDatePickerOpen(false);
              // Store date as ISO string
              onChange(field.name, date.toISOString());
            }}
            onCancel={() => {
              setIsDatePickerOpen(false);
            }}
            confirmText="Onayla"
            cancelText="İptal"
          />
        </View>
      );
    case 'switch':
      return (
        <View style={[styles.formGroup, styles.switchGroup]}>
          <Text style={styles.label}>{field.label}</Text>
          <Switch
            trackColor={{ false: Colors.lightText, true: Colors.primary }}
            thumbColor={Colors.white}
            ios_backgroundColor={Colors.lightText}
            onValueChange={(val) => onChange(field.name, val)}
            value={value}
          />
        </View>
      );
    default:
      return null;
  }
};

interface FormProps {
  fields: InputFieldProps['field'][];
  initialData?: Partial<Task>;
  onSubmit?: (data: Partial<Task>) => void; // Used to pass current state back to parent screen
}

const DynamicForm: React.FC<FormProps> = ({ fields, initialData = {}, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<Task>>(() => ({
    ...initialData,
    dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString() : undefined,
    status: initialData.status ?? false, 
  }));

  // Sync external initialData changes (e.g., when task detail loads)
  useEffect(() => {
    setFormData({
      ...initialData,
      dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString() : undefined,
      status: initialData.status ?? false,
    });
  }, [initialData]);

  const handleChange = (name: string, value: any) => {
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    if (onSubmit) {
      onSubmit(newData);
    }
  };
  
  return (
    <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
      {fields.map((field) => (
        <InputField
          key={field.name}
          field={field}
          value={(formData as any)[field.name]}
          onChange={handleChange}
        />
      ))}
    </ScrollView>
  );
};


// --- SCREEN taskList (Main Export) ---

export const TaskListScreen: React.FC<{ navigation: TaskNavigationProp }> = ({ navigation }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'Tümü' | 'Bekleyen' | 'Tamamlanan'>('Tümü');
  const [loading, setLoading] = useState(true);

  const fetchTasks = async (currentFilter: typeof filter) => {
    setLoading(true);
    let url = API_URL;
    if (currentFilter === 'Bekleyen') {
      url += '?status=false';
    } else if (currentFilter === 'Tamamlanan') {
      url += '?status=true';
    }

    try {
      const response = await fetch(url);
      const data: Task[] = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Alert.alert('Hata', 'Görevler yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks(filter);
    }, [filter])
  );
  
  // Handle checkbox toggle (Instant Update)
  const toggleTaskStatus = async (task: Task) => {
    const newStatus = !task.status;
    
    try {
        const response = await fetch(`${API_URL}/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
            // Optimistically update the UI until re-fetch happens
            setTasks(prevTasks => 
                prevTasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t)
            );
            // Re-fetch ensures filter status is respected
            fetchTasks(filter);
        } else {
            throw new Error('Update failed');
        }
    } catch (error) {
        Alert.alert('Hata', 'Görev durumu güncellenemedi.');
    }
  };


  const FilterBar = () => {
    const options = ['Tümü', 'Bekleyen', 'Tamamlanan'];
    return (
      <View style={styles.filterBar}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.filterOption,
              filter === option && { backgroundColor: Colors.primary },
            ]}
            onPress={() => setFilter(option as typeof filter)}
          >
            <Text style={[styles.filterText, filter === option && { color: Colors.white }]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const TaskItem: React.FC<{ task: Task }> = ({ task }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigation.navigate('taskDetail', { taskId: task.id })}
    >
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, task.status && styles.itemCompleted]}>
          {task.title}
        </Text>
        {task.dueDate && <Text style={styles.itemDate}>{new Date(task.dueDate).toLocaleDateString()}</Text>}
      </View>
      <TouchableOpacity onPress={() => toggleTaskStatus(task)} style={styles.checkboxContainer}>
        <View style={[styles.checkbox, task.status && styles.checkboxChecked]}>
          {task.status && <Text style={{ color: Colors.white, fontSize: 14 }}>✓</Text>}
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Yapılacaklar" />
      <FilterBar />

      {loading ? (
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TaskItem task={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Henüz görev yok.</Text>}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Colors.primary }]}
        onPress={() => navigation.navigate('taskAdd')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};


// --- SCREEN taskAdd ---

export const TaskAddScreen: React.FC<{ navigation: TaskNavigationProp }> = ({ navigation }) => {
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fields = [
    { name: 'title', type: 'text', label: 'Görev Başlığı', required: true },
    { name: 'description', type: 'textarea', label: 'Açıklama (Opsiyonel)' },
    { name: 'dueDate', type: 'date', label: 'Bitiş Tarihi' },
  ] as InputFieldProps['field'][];

  const handleSave = async () => {
    if (!formData.title || formData.title.trim() === '') {
      Alert.alert('Uyarı', 'Görev Başlığı zorunludur.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.status === 201) {
        navigation.goBack();
      } else {
        throw new Error('Görev eklenemedi.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Görevi kaydederken bir sorun oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Yeni Görev Ekle" backButton />
      
      <DynamicForm 
          fields={fields} 
          onSubmit={setFormData} // Pass setter directly to get real-time form updates
      />

      <View style={styles.footerButtonContainer}>
        <CustomButton
          label="Görevi Kaydet"
          color={Colors.primary}
          action="saveAndClose"
          fullWidth
          onPress={handleSave}
          disabled={isSaving || !formData.title}
        />
      </View>
    </SafeAreaView>
  );
};

// --- SCREEN taskDetail ---

export const TaskDetailScreen: React.FC<{ navigation: TaskNavigationProp; route: TaskDetailRouteProp }> = ({ navigation, route }) => {
  const { taskId } = route.params;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  // State to hold the current form values for submission
  const [currentFormData, setCurrentFormData] = useState<Partial<Task>>({}); 
  const [isUpdating, setIsUpdating] = useState(false);

  const fields = [
    { name: 'title', type: 'text', label: 'Görev Başlığı' },
    { name: 'description', type: 'textarea', label: 'Açıklama' },
    { name: 'dueDate', type: 'date', label: 'Bitiş Tarihi' },
    { name: 'status', type: 'switch', label: 'Tamamlandı' },
  ] as InputFieldProps['field'][];
  
  const fetchTask = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/${taskId}`);
      if (!response.ok) throw new Error('Task not found');
      const data: Task = await response.json();
      setTask(data);
      setCurrentFormData(data); // Initialize form data
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Görev detayları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useFocusEffect(
    useCallback(() => {
      fetchTask();
    }, [fetchTask])
  );

  const handleUpdate = async () => {
    if (!currentFormData.title || currentFormData.title.trim() === '') {
        Alert.alert('Uyarı', 'Görev Başlığı boş bırakılamaz.');
        return;
    }

    setIsUpdating(true);
    try {
      const payload = {
        title: currentFormData.title,
        description: currentFormData.description,
        dueDate: currentFormData.dueDate,
        status: currentFormData.status,
      };

      const response = await fetch(`${API_URL}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert('Başarılı', 'Görev güncellendi.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        throw new Error('Güncelleme başarısız.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Görevi güncellerken bir sorun oluştu.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Onay',
      'Bu görevi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/${taskId}`, {
                method: 'DELETE',
              });
              if (response.status === 204) {
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert('Hata', 'Görevi silerken bir sorun oluştu.');
            }
          },
        },
      ]
    );
  };
  
  const handleActionPress = (action: string) => {
    if (action === 'deleteTask') {
      handleDelete();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Görev Detayı" backButton />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Görev Detayı" backButton />
        <Text style={styles.emptyText}>Görev bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Görev Detayı"
        backButton
        actions={[{ icon: 'trash', action: 'deleteTask' }]} 
        onActionPress={handleActionPress}
      />
      
      <DynamicForm
        fields={fields}
        initialData={task}
        onSubmit={setCurrentFormData}
      />
      
      <View style={styles.footerButtonContainer}>
        <CustomButton
          label="Güncelle"
          color={Colors.primary}
          action="updateTask"
          fullWidth
          onPress={handleUpdate}
          disabled={isUpdating || !currentFormData.title}
        />
      </View>
    </SafeAreaView>
  );
};

// --- Styles ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  headerSide: {
    width: 60,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  headerButton: {
    padding: 5,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    backgroundColor: Colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  filterText: {
    color: Colors.text,
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemContent: {
    flex: 1,
    paddingRight: 10,
  },
  itemTitle: {
    fontSize: 16,
    color: Colors.text,
  },
  itemDate: {
      fontSize: 12,
      color: Colors.lightText,
      marginTop: 2,
  },
  itemCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.lightText,
  },
  checkboxContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabIcon: {
    fontSize: 30,
    color: Colors.white,
    lineHeight: 32,
  },
  // Form Styles
  formContainer: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    height: 44,
    justifyContent: 'center',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 0,
  },
  footerButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: Colors.lightText,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: Colors.lightText,
  },
});
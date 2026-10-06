import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { t } from './i18n';

const STORAGE_KEY = '@students_database';

export default function App() {
  const [students, setStudents] = useState([]);
  const [currentScreen, setCurrentScreen] = useState('list'); // 'list' (Trang 1) hoặc 'form' (Trang 3)
  const [selectedStudent, setSelectedStudent] = useState(null); // Trang 2 (Modal)

  // Form states (Trang 3)
  const [isEditing, setIsEditing] = useState(false);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');

  // 1. Tải dữ liệu ban đầu
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) setStudents(JSON.parse(data));
    } catch (e) {
      console.error(e);
    }
  };

  const saveStudentsToStorage = async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStudents(data);
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Upload ảnh từ thiết bị
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Cần cấp quyền truy cập ảnh!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  // 3. Mở form thêm mới
  const handleOpenAdd = () => {
    setIsEditing(false);
    setId(Date.now().toString());
    setName('');
    setStudentId('');
    setEmail('');
    setAvatar('');
    setCurrentScreen('form');
  };

  // 4. Mở form sửa
  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setId(item.id);
    setName(item.name);
    setStudentId(item.studentId);
    setEmail(item.email);
    setAvatar(item.avatar);
    setCurrentScreen('form');
  };

  // 5. Lưu (Thêm mới / Cập nhật có xác nhận)
  const handleSave = () => {
    if (!name.trim() || !studentId.trim() || !email.trim()) {
      Alert.alert('Lỗi', t.validateMsg);
      return;
    }

    const studentData = {
      id,
      name,
      studentId,
      email,
      avatar: avatar || 'https://via.placeholder.com/150',
    };

    if (isEditing) {
      Alert.alert(t.editConfirmTitle, t.editConfirmMsg, [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.confirm,
          onPress: () => {
            const updated = students.map((s) => (s.id === id ? studentData : s));
            saveStudentsToStorage(updated);
            setCurrentScreen('list');
          },
        },
      ]);
    } else {
      const updated = [studentData, ...students];
      saveStudentsToStorage(updated);
      setCurrentScreen('list');
    }
  };

  // 6. Xóa (có xác nhận)
  const handleDelete = (item) => {
    Alert.alert(t.deleteConfirmTitle, t.deleteConfirmMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.confirm,
        style: 'destructive',
        onPress: () => {
          const updated = students.filter((s) => s.id !== item.id);
          saveStudentsToStorage(updated);
        },
      },
    ]);
  };

  // Giao diện Trang 3: Editable Form
  if (currentScreen === 'form') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.headerTitle}>{isEditing ? t.editStudent : t.addStudent}</Text>

          <View style={styles.avatarSection}>
            <Image
              source={{ uri: avatar || 'https://via.placeholder.com/150' }}
              style={styles.avatarLarge}
            />
            <TouchableOpacity style={styles.btnSecondary} onPress={pickImage}>
              <Text style={styles.btnSecondaryText}>{t.pickImage}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.avatar} (URL):</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              value={avatar}
              onChangeText={setAvatar}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.name}:</Text>
            <TextInput
              style={styles.input}
              placeholder={t.name}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.studentId}:</Text>
            <TextInput
              style={styles.input}
              placeholder={t.studentId}
              value={studentId}
              onChangeText={setStudentId}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.email}:</Text>
            <TextInput
              style={styles.input}
              placeholder={t.email}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.button, styles.btnCancel]}
              onPress={() => setCurrentScreen('list')}
            >
              <Text style={styles.btnCancelText}>{t.cancel}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>{t.save}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Giao diện Trang 1: Danh sách sinh viên
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.headerTitle}>{t.appTitle}</Text>

        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>{t.emptyList}</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.studentItem}
              activeOpacity={0.8}
              onPress={() => setSelectedStudent(item)} // Mở Trang 2
            >
              <Image source={{ uri: item.avatar }} style={styles.avatarSmall} />

              <View style={styles.infoCol}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemSubtitle}>{item.studentId}</Text>
              </View>

              <View style={styles.btnGroup}>
                <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(item)}>
                  <Text style={styles.btnIconText}>Sửa</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.btnIconText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity style={styles.btnAdd} onPress={handleOpenAdd}>
          <Text style={styles.btnAddText}>+ {t.addStudent}</Text>
        </TouchableOpacity>

        {/* Giao diện Trang 2: Modal Chi tiết */}
        <Modal
          visible={!!selectedStudent}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedStudent(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.detailTitle}</Text>

              {selectedStudent && (
                <>
                  <Image source={{ uri: selectedStudent.avatar }} style={styles.avatarModal} />
                  <Text style={styles.modalText}>
                    <Text style={styles.boldText}>{t.name}: </Text>
                    {selectedStudent.name}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={styles.boldText}>{t.studentId}: </Text>
                    {selectedStudent.studentId}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={styles.boldText}>{t.email}: </Text>
                    {selectedStudent.email}
                  </Text>
                </>
              )}

              <TouchableOpacity
                style={[styles.button, { marginTop: 16 }]}
                onPress={() => setSelectedStudent(null)}
              >
                <Text style={styles.buttonText}>{t.close}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flex: 1, padding: 16 },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#212529',
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 10,
  },
  avatarSmall: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
  infoCol: { flex: 1, marginLeft: 12 },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  itemSubtitle: { fontSize: 14, color: '#6c757d', marginTop: 2 },
  btnGroup: { flexDirection: 'row', gap: 6 },
  editBtn: {
    backgroundColor: '#ffc107',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  deleteBtn: {
    backgroundColor: '#dc3545',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  btnIconText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  btnAdd: {
    backgroundColor: '#0d6efd',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  btnAddText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#6c757d', marginTop: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 16 },
  avatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee' },
  btnSecondary: { marginTop: 8, padding: 6 },
  btnSecondaryText: { color: '#0d6efd', fontSize: 14, fontWeight: '600' },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 4, color: '#495057' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    padding: 10,
    fontSize: 15,
  },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  button: {
    flex: 1,
    backgroundColor: '#0d6efd',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnCancel: { backgroundColor: '#e9ecef' },
  btnCancelText: { color: '#495057', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  avatarModal: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  modalText: { fontSize: 15, marginBottom: 6, alignSelf: 'flex-start' },
  boldText: { fontWeight: 'bold', color: '#333' },
});
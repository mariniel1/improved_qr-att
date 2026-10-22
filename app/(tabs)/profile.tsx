import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth, signOut } from '@/lib/auth';
import { getProfile, Profile, updateProfile } from '@/lib/profiles';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [draftName, setDraftName] = useState('');
  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Load profile
  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await getProfile(user.id);

      setProfile(data);
      setDraftName(data?.full_name ?? '');
    } catch (error: any) {
      Alert.alert(
        'Unable to Load Profile',
        error?.message || 'Something went wrong while loading your profile.'
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  // Save full name
  const handleSaveName = async () => {
    if (!user) return;

    const trimmedName = draftName.trim();

    if (!trimmedName) {
      Alert.alert('Invalid Name', 'Please enter your full name.');
      return;
    }

    setSaving(true);

    try {
      const { error } = await updateProfile(user.id, {
        full_name: trimmedName,
      });

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: trimmedName,
            }
          : prev
      );

      setDraftName(trimmedName);
      setEditing(false);

      Alert.alert('Success', 'Your name has been updated.');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to update your name.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setDraftName(profile?.full_name ?? '');
    setEditing(false);
  };

  // Sign out
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);

            try {
              await signOut();
              router.replace('/login');
            } catch (error: any) {
              Alert.alert(
                'Error',
                error?.message || 'Failed to sign out.'
              );
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  // Loading screen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
        <Text style={styles.loadingText}>
          Loading profile...
        </Text>
      </View>
    );
  }

  const fullName = profile?.full_name || 'User';
  const email = profile?.email || user?.email || 'No email';
  const role = profile?.role || 'student';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.subtitle}>
          Manage your account information
        </Text>
      </View>

      {/* Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons
            name="person"
            size={38}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.profileHeaderInfo}>
          <Text
            style={styles.profileName}
            numberOfLines={1}
          >
            {fullName}
          </Text>

          <View
            style={[
              styles.roleBadge,
              role === 'teacher'
                ? styles.teacherBadge
                : styles.studentBadge,
            ]}
          >
            <Ionicons
              name={
                role === 'teacher'
                  ? 'school-outline'
                  : 'person-outline'
              }
              size={14}
              color="#FFFFFF"
            />

            <Text style={styles.roleBadgeText}>
              {role === 'teacher' ? 'Teacher' : 'Student'}
            </Text>
          </View>
        </View>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Personal Information
        </Text>

        <View style={styles.infoCard}>
          {/* Full Name */}
          <View style={styles.infoItem}>
            <View style={styles.iconBox}>
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.label}>Full Name</Text>

              {editing ? (
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textSecondary}
                  style={styles.textInput}
                  autoFocus
                  editable={!saving}
                />
              ) : (
                <Text style={styles.value}>
                  {fullName}
                </Text>
              )}
            </View>

            {!editing && (
              <Pressable
                onPress={() => setEditing(true)}
                style={styles.editButton}
              >
                <Ionicons
                  name="create-outline"
                  size={19}
                  color={COLORS.primary}
                />
              </Pressable>
            )}
          </View>

          {/* Save / Cancel */}
          {editing && (
            <View style={styles.editActions}>
              <Pressable
                onPress={handleCancelEdit}
                disabled={saving}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSaveName}
                disabled={saving}
                style={styles.saveButton}
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.saveText}>
                      Save
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Email */}
          <View style={styles.infoItem}>
            <View style={styles.iconBox}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.label}>Email Address</Text>
              <Text style={styles.value}>
                {email}
              </Text>
            </View>
          </View>

          {/* User ID */}
          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <View style={styles.iconBox}>
              <Ionicons
                name="finger-print-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.label}>User ID</Text>
              <Text
                style={styles.userId}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {profile?.id || user?.id || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Account
        </Text>

        <View style={styles.accountCard}>
          <View style={styles.accountIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={21}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.accountInfo}>
            <Text style={styles.accountTitle}>
              Account Role
            </Text>

            <Text style={styles.accountDescription}>
              You are signed in as a{' '}
              {role === 'teacher'
                ? 'teacher'
                : 'student'}
              .
            </Text>
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.logoutContainer}>
        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
          ]}
        >
          {signingOut ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <>
              <Ionicons
                name="log-out-outline"
                size={21}
                color="#FFFFFF"
              />
              <Text style={styles.logoutText}>
                Sign Out
              </Text>
            </>
          )}
        </Pressable>
      </View>

      <Text style={styles.footerText}>
        Keep your profile information updated.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 27,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Profile Card
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  profileHeaderInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },

  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },

  teacherBadge: {
    backgroundColor: '#4A90E2',
  },

  studentBadge: {
    backgroundColor: '#22A06B',
  },

  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Sections
  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },

  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },

  value: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },

  userId: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // Edit
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textInput: {
    fontSize: 15,
    color: COLORS.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },

  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingBottom: 14,
  },

  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  saveButton: {
    minWidth: 85,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },

  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Account
  accountCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  accountIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  accountInfo: {
    flex: 1,
  },

  accountTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },

  accountDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Logout
  logoutContainer: {
    marginTop: 8,
  },

  logoutButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E5484D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  buttonPressed: {
    opacity: 0.75,
  },

  footerText: {
    textAlign: 'center',
    marginTop: 18,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
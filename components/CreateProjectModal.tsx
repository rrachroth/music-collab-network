import { useState, useEffect } from 'react';
import { User, Project } from '../utils/storage';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import { Text, View, TextInput, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import Icon from './Icon';
import Button from './Button';

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (projectData: Partial<Project>) => void;
  currentUser: User | null;
}

const GENRES = [
  'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Jazz',
  'Classical', 'Country', 'Reggae', 'Latin', 'Alternative', 'Indie'
];

const BUDGET_OPTIONS = [
  'Free/Collaboration',
  '$100-300',
  '$300-500',
  '$500-1000',
  '$1000-2000',
  '$2000+'
];

const TIMELINE_OPTIONS = [
  '1 week',
  '2 weeks',
  '1 month',
  '2-3 months',
  '3+ months',
  'Flexible'
];

export default function CreateProjectModal({ visible, onClose, onSubmit, currentUser }: CreateProjectModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [loading, setLoading] = useState(false);

  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.9);

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: modalOpacity.value,
      transform: [{ scale: modalScale.value }],
    };
  });

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: 300 });
      modalScale.value = withSpring(1, { damping: 15 });
    } else {
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.9, { duration: 200 });
    }
  }, [visible, modalOpacity, modalScale]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedGenres([]);
    setBudget('');
    setTimeline('');
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a project title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please enter a project description');
      return;
    }

    if (selectedGenres.length === 0) {
      Alert.alert('Missing Genres', 'Please select at least one genre');
      return;
    }

    if (!budget) {
      Alert.alert('Missing Budget', 'Please select a budget range');
      return;
    }

    if (!timeline) {
      Alert.alert('Missing Timeline', 'Please select a timeline');
      return;
    }

    try {
      setLoading(true);
      
      const projectData: Partial<Project> = {
        title: title.trim(),
        description: description.trim(),
        genres: selectedGenres,
        budget,
        timeline,
      };

      await onSubmit(projectData);
      resetForm();
    } catch (error) {
      console.error('❌ Error creating project:', error);
      Alert.alert('Error', 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, modalAnimatedStyle]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[commonStyles.heading, { marginBottom: 0 }]}>
                Create Project
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Title */}
              <View style={styles.section}>
                <Text style={styles.label}>Project Title *</Text>
                <TextInput
                  style={[commonStyles.input, styles.input]}
                  placeholder="e.g., Looking for vocalist for R&B track"
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>

              {/* Description */}
              <View style={styles.section}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[commonStyles.input, styles.textArea]}
                  placeholder="Describe your project, what you're looking for, and any specific requirements..."
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />
              </View>

              {/* Genres */}
              <View style={styles.section}>
                <Text style={styles.label}>Genres * ({selectedGenres.length} selected)</Text>
                <View style={styles.genreGrid}>
                  {GENRES.map((genre) => (
                    <TouchableOpacity
                      key={genre}
                      style={[
                        styles.genreChip,
                        selectedGenres.includes(genre) && styles.genreChipSelected
                      ]}
                      onPress={() => toggleGenre(genre)}
                    >
                      <Text style={[
                        styles.genreText,
                        selectedGenres.includes(genre) && styles.genreTextSelected
                      ]}>
                        {genre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Budget */}
              <View style={styles.section}>
                <Text style={styles.label}>Budget *</Text>
                <View style={styles.optionsGrid}>
                  {BUDGET_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionChip,
                        budget === option && styles.optionChipSelected
                      ]}
                      onPress={() => setBudget(option)}
                    >
                      <Text style={[
                        styles.optionText,
                        budget === option && styles.optionTextSelected
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Timeline */}
              <View style={styles.section}>
                <Text style={styles.label}>Timeline *</Text>
                <View style={styles.optionsGrid}>
                  {TIMELINE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionChip,
                        timeline === option && styles.optionChipSelected
                      ]}
                      onPress={() => setTimeline(option)}
                    >
                      <Text style={[
                        styles.optionText,
                        timeline === option && styles.optionTextSelected
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Button
                text="Cancel"
                onPress={handleClose}
                variant="ghost"
                size="md"
                style={{ flex: 1, marginRight: spacing.md }}
              />
              <Button
                text="Create Project"
                onPress={handleSubmit}
                variant="gradient"
                size="md"
                loading={loading}
                disabled={loading}
                style={{ flex: 2 }}
              />
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  modalGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundCard,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: 0,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
    marginBottom: 0,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  genreChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genreText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  genreTextSelected: {
    color: colors.text,
  },
  optionsGrid: {
    gap: spacing.sm,
  },
  optionChip: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  optionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  optionTextSelected: {
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
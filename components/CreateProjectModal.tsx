import { Text, View, TextInput, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import Button from './Button';
import Icon from './Icon';
import { User, Project } from '../utils/storage';
import { StyleSheet } from 'react-native';

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (projectData: Partial<Project>) => void;
  currentUser: User | null;
}

const GENRES = [
  'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Jazz', 'Classical', 
  'Country', 'Folk', 'Reggae', 'Blues', 'Funk', 'Soul', 'Trap', 'House'
];

const BUDGET_OPTIONS = [
  'Free', '$100-300', '$300-500', '$500-1000', '$1000-2000', '$2000+'
];

const TIMELINE_OPTIONS = [
  '1 week', '2 weeks', '1 month', '2 months', '3+ months', 'Flexible'
];

export default function CreateProjectModal({ visible, onClose, onSubmit, currentUser }: CreateProjectModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  
  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: 300 });
      modalScale.value = withSpring(1, { damping: 15 });
    } else {
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.9, { duration: 200 });
    }
  }, [visible, modalOpacity, modalScale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: modalOpacity.value,
      transform: [{ scale: modalScale.value }],
    };
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedGenres([]);
    setBudget('');
    setTimeline('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a project title');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a project description');
      return;
    }
    
    if (selectedGenres.length === 0) {
      Alert.alert('Error', 'Please select at least one genre');
      return;
    }
    
    if (!budget) {
      Alert.alert('Error', 'Please select a budget range');
      return;
    }
    
    if (!timeline) {
      Alert.alert('Error', 'Please select a timeline');
      return;
    }

    const projectData: Partial<Project> = {
      title: title.trim(),
      description: description.trim(),
      genres: selectedGenres,
      budget,
      timeline,
    };

    onSubmit(projectData);
    resetForm();
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
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, animatedStyle]}>
          <LinearGradient
            colors={colors.gradientBackground}
            style={styles.modalGradient}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Create Project</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Icon name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Title */}
                <View style={styles.section}>
                  <Text style={styles.label}>Project Title *</Text>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g., Looking for vocalist for R&B track"
                    placeholderTextColor={colors.textMuted}
                    maxLength={100}
                  />
                </View>

                {/* Description */}
                <View style={styles.section}>
                  <Text style={styles.label}>Description *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe your project, what you're looking for, and any specific requirements..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                  />
                  <Text style={styles.charCount}>
                    {description.length}/500
                  </Text>
                </View>

                {/* Genres */}
                <View style={styles.section}>
                  <Text style={styles.label}>Genres * (Select up to 3)</Text>
                  <View style={styles.genreGrid}>
                    {GENRES.map(genre => (
                      <TouchableOpacity
                        key={genre}
                        style={[
                          styles.genreChip,
                          selectedGenres.includes(genre) && styles.genreChipSelected
                        ]}
                        onPress={() => toggleGenre(genre)}
                        disabled={!selectedGenres.includes(genre) && selectedGenres.length >= 3}
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
                  <View style={styles.optionGrid}>
                    {BUDGET_OPTIONS.map(option => (
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
                  <View style={styles.optionGrid}>
                    {TIMELINE_OPTIONS.map(option => (
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

                {/* Actions */}
                <View style={styles.actions}>
                  <Button
                    text="Cancel"
                    onPress={handleClose}
                    variant="outline"
                    size="lg"
                    style={{ flex: 1, marginRight: spacing.sm }}
                  />
                  <Button
                    text="Create Project"
                    onPress={handleSubmit}
                    variant="gradient"
                    size="lg"
                    style={{ flex: 1, marginLeft: spacing.sm }}
                  />
                </View>
              </ScrollView>
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
    padding: 2,
  },
  modalContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl - 2,
    padding: spacing.lg,
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
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
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  optionChipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  optionTextSelected: {
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
});
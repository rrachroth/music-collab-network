import React, { Text, View, TextInput, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { commonStyles, colors, spacing, borderRadius, shadows } from '../styles/commonStyles';
import Button from './Button';
import Icon from './Icon';
import { User, Project } from '../utils/storage';

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
  '$50-100',
  '$100-250',
  '$250-500',
  '$500-1000',
  '$1000+',
  'Negotiable'
];

const TIMELINE_OPTIONS = [
  '1-3 days',
  '1 week',
  '2 weeks',
  '1 month',
  '2-3 months',
  'Flexible'
];

export default function CreateProjectModal({ visible, onClose, onSubmit, currentUser }: CreateProjectModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [loading, setLoading] = useState(false);
  
  const modalScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);

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
      Alert.alert('Missing Title', 'Please enter a project title.');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please enter a project description.');
      return;
    }
    
    if (selectedGenres.length === 0) {
      Alert.alert('Missing Genres', 'Please select at least one genre.');
      return;
    }
    
    setLoading(true);
    
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        genres: selectedGenres,
        budget,
        timeline,
      });
      
      handleClose();
    } catch (error) {
      console.error('Error creating project:', error);
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

  const animatedModalStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: modalScale.value }],
      opacity: modalOpacity.value,
    };
  });

  // Animate modal in/out
  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: 300 });
      modalScale.value = withSpring(1, { damping: 15 });
    } else {
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContainer, animatedModalStyle]}>
          <LinearGradient
            colors={['#0A0E1A', '#1A1F2E', '#2A1F3D']}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[commonStyles.heading, { flex: 1 }]}>
                Create New Project
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Icon name="close" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Project Title */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Project Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Looking for Vocalist - R&B Track"
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>

              {/* Description */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Describe your project, what you're looking for, and any specific requirements..."
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text style={styles.characterCount}>
                  {description.length}/500
                </Text>
              </View>

              {/* Genres */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Genres * (Select all that apply)</Text>
                <View style={styles.genreGrid}>
                  {GENRES.map(genre => (
                    <TouchableOpacity
                      key={genre}
                      style={[
                        styles.genreChip,
                        selectedGenres.includes(genre) && styles.selectedGenreChip
                      ]}
                      onPress={() => toggleGenre(genre)}
                    >
                      <Text style={[
                        styles.genreText,
                        selectedGenres.includes(genre) && styles.selectedGenreText
                      ]}>
                        {genre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Budget */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Budget (Optional)</Text>
                <View style={styles.optionGrid}>
                  {BUDGET_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionChip,
                        budget === option && styles.selectedOptionChip
                      ]}
                      onPress={() => setBudget(budget === option ? '' : option)}
                    >
                      <Text style={[
                        styles.optionText,
                        budget === option && styles.selectedOptionText
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Timeline */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Timeline (Optional)</Text>
                <View style={styles.optionGrid}>
                  {TIMELINE_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionChip,
                        timeline === option && styles.selectedOptionChip
                      ]}
                      onPress={() => setTimeline(timeline === option ? '' : option)}
                    >
                      <Text style={[
                        styles.optionText,
                        timeline === option && styles.selectedOptionText
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Preview */}
              <View style={styles.previewSection}>
                <Text style={styles.inputLabel}>Preview</Text>
                <View style={styles.previewCard}>
                  <Text style={styles.previewTitle}>
                    {title || 'Your Project Title'}
                  </Text>
                  <Text style={styles.previewAuthor}>
                    by {currentUser?.name || 'Your Name'} • {currentUser?.role || 'Your Role'}
                  </Text>
                  <View style={styles.previewGenres}>
                    {(selectedGenres.length > 0 ? selectedGenres : ['Select genres']).map(genre => (
                      <View key={genre} style={styles.previewGenreChip}>
                        <Text style={styles.previewGenreText}>{genre}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.previewDescription}>
                    {description || 'Your project description will appear here...'}
                  </Text>
                  {(budget || timeline) && (
                    <View style={styles.previewDetails}>
                      {budget && (
                        <Text style={styles.previewDetail}>Budget: {budget}</Text>
                      )}
                      {timeline && (
                        <Text style={styles.previewDetail}>Timeline: {timeline}</Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <Button
                text="Cancel"
                onPress={handleClose}
                variant="outline"
                size="md"
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                text="Create Project"
                onPress={handleSubmit}
                variant="gradient"
                size="md"
                style={{ flex: 1 }}
                loading={loading}
                disabled={loading || !title.trim() || !description.trim() || selectedGenres.length === 0}
              />
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  modalGradient: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  inputSection: {
    marginVertical: spacing.md,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
  },
  characterCount: {
    fontSize: 12,
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
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedGenreChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genreText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  selectedGenreText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedOptionChip: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  optionText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  selectedOptionText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  previewSection: {
    marginVertical: spacing.lg,
  },
  previewCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  previewAuthor: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  previewGenres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  previewGenreChip: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  previewGenreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  previewDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  previewDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  previewDetail: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
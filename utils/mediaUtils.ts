import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import { MediaFile, generateId, getCurrentTimestamp } from './storage';
import { Alert } from 'react-native';

export interface MediaPickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  mediaTypes?: ImagePicker.MediaTypeOptions;
}

export const requestPermissions = async (): Promise<boolean> => {
  try {
    console.log('🔐 Requesting media permissions...');
    
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: audioStatus } = await Audio.requestPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted' || audioStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'MusicLinked needs access to your camera, media library, and microphone to upload highlights and record audio.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    console.log('✅ All permissions granted');
    return true;
  } catch (error) {
    console.error('❌ Error requesting permissions:', error);
    return false;
  }
};

export const pickImage = async (options: MediaPickerOptions = {}): Promise<MediaFile | null> => {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: options.mediaTypes || ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect || [1, 1],
      quality: options.quality || 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mediaFile: MediaFile = {
        id: generateId(),
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'audio',
        title: `Media ${Date.now()}`,
        duration: asset.duration || 0,
        uploadedAt: getCurrentTimestamp(),
      };
      
      console.log('📸 Image picked successfully:', mediaFile.id);
      return mediaFile;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image. Please try again.');
    return null;
  }
};

export const pickVideo = async (options: MediaPickerOptions = {}): Promise<MediaFile | null> => {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: options.allowsEditing ?? true,
      quality: options.quality || 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mediaFile: MediaFile = {
        id: generateId(),
        uri: asset.uri,
        type: 'video',
        title: `Video ${Date.now()}`,
        duration: asset.duration || 0,
        uploadedAt: getCurrentTimestamp(),
      };
      
      console.log('🎥 Video picked successfully:', mediaFile.id);
      return mediaFile;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error picking video:', error);
    Alert.alert('Error', 'Failed to pick video. Please try again.');
    return null;
  }
};

export const pickAudio = async (): Promise<MediaFile | null> => {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    // For now, we'll use document picker for audio files
    // In a real app, you might want to integrate with a proper audio picker
    Alert.alert(
      'Audio Upload',
      'Audio file picking will be available in the next update. For now, you can record audio directly.',
      [{ text: 'OK' }]
    );
    
    return null;
  } catch (error) {
    console.error('❌ Error picking audio:', error);
    Alert.alert('Error', 'Failed to pick audio. Please try again.');
    return null;
  }
};

export const recordAudio = async (): Promise<MediaFile | null> => {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    console.log('🎤 Starting audio recording...');
    
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    // This is a simplified version - in a real app you'd want a proper recording UI
    Alert.alert(
      'Recording Started',
      'Audio recording functionality will be fully implemented in the next update.',
      [
        {
          text: 'Stop',
          onPress: async () => {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            if (uri) {
              const mediaFile: MediaFile = {
                id: generateId(),
                uri,
                type: 'audio',
                title: `Recording ${Date.now()}`,
                duration: 0, // Would get actual duration from recording
                uploadedAt: getCurrentTimestamp(),
              };
              return mediaFile;
            }
          }
        }
      ]
    );

    return null;
  } catch (error) {
    console.error('❌ Error recording audio:', error);
    Alert.alert('Error', 'Failed to record audio. Please try again.');
    return null;
  }
};

export const takePhoto = async (options: MediaPickerOptions = {}): Promise<MediaFile | null> => {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect || [1, 1],
      quality: options.quality || 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mediaFile: MediaFile = {
        id: generateId(),
        uri: asset.uri,
        type: 'video', // Camera can capture both
        title: `Photo ${Date.now()}`,
        duration: 0,
        uploadedAt: getCurrentTimestamp(),
      };
      
      console.log('📷 Photo taken successfully:', mediaFile.id);
      return mediaFile;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error taking photo:', error);
    Alert.alert('Error', 'Failed to take photo. Please try again.');
    return null;
  }
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const validateMediaFile = (file: MediaFile): boolean => {
  // Basic validation
  if (!file.uri || !file.type || !file.title) {
    return false;
  }
  
  // Check file size limits (would implement actual file size check)
  // For now, just basic validation
  return true;
};
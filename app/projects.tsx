import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles } from '../styles/commonStyles';
import Button from '../components/Button';
import Icon from '../components/Icon';

const MOCK_PROJECTS = [
  {
    id: '1',
    title: 'Looking for Vocalist - R&B Track',
    author: 'Alex Producer',
    authorRole: 'Producer',
    description: 'I have a smooth R&B instrumental ready and need a talented vocalist to bring it to life. Looking for someone with experience in contemporary R&B.',
    genres: ['R&B', 'Soul'],
    budget: '$500-1000',
    timeline: '2 weeks',
    applicants: 12,
    posted: '2 days ago',
    status: 'open'
  },
  {
    id: '2',
    title: 'Hip-Hop Collab - Need Rapper',
    author: 'Maya Beats',
    authorRole: 'Producer',
    description: 'Fresh hip-hop beat with a trap influence. Looking for a skilled rapper with their own style and flow. Must have recording setup.',
    genres: ['Hip-Hop', 'Trap'],
    budget: '$300-500',
    timeline: '1 week',
    applicants: 8,
    posted: '1 day ago',
    status: 'open'
  },
  {
    id: '3',
    title: 'Electronic Pop Song - Seeking Mixer',
    author: 'Jordan Synth',
    authorRole: 'Producer',
    description: 'Completed electronic pop song needs professional mixing. The track has vocals and is ready for final polish.',
    genres: ['Electronic', 'Pop'],
    budget: '$200-400',
    timeline: '3 days',
    applicants: 5,
    posted: '3 hours ago',
    status: 'open'
  }
];

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const [projects] = useState(MOCK_PROJECTS);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    console.log('📋 Projects Screen Loaded');
  }, []);

  const handleCreateProject = () => {
    console.log('➕ Creating new project');
    Alert.alert(
      'Create Project',
      'This feature will allow you to post open projects seeking collaborators. Coming soon!',
      [{ text: 'OK' }]
    );
  };

  const handleApplyToProject = (projectId: string) => {
    console.log('📝 Applying to project:', projectId);
    Alert.alert(
      'Apply to Project',
      'This feature will allow you to apply to open projects with your portfolio. Coming soon!',
      [{ text: 'OK' }]
    );
  };

  const handleViewProject = (projectId: string) => {
    console.log('👁️ Viewing project:', projectId);
    Alert.alert(
      'View Project',
      'This will show the full project details, audio samples, and application form. Coming soon!',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={[commonStyles.title, { fontSize: 20 }]}>
          Open Projects
        </Text>
        <TouchableOpacity onPress={handleCreateProject}>
          <Icon name="add" size={24} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={{ 
        flexDirection: 'row', 
        paddingHorizontal: 20, 
        marginBottom: 20 
      }}>
        {['all', 'vocals', 'production', 'mixing'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={{
              paddingHorizontal: 15,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 10,
              backgroundColor: filter === tab ? '#64B5F6' : '#162133',
              borderColor: filter === tab ? '#64B5F6' : '#90CAF9',
              borderWidth: 1
            }}
            onPress={() => setFilter(tab)}
          >
            <Text style={[
              commonStyles.text,
              { 
                fontSize: 14,
                color: filter === tab ? '#000' : '#e3e3e3',
                fontWeight: filter === tab ? 'bold' : 'normal'
              }
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {projects.map(project => (
          <TouchableOpacity
            key={project.id}
            style={[commonStyles.card, { marginBottom: 15 }]}
            onPress={() => handleViewProject(project.id)}
          >
            {/* Project Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.title, { fontSize: 18, marginBottom: 5 }]}>
                  {project.title}
                </Text>
                <Text style={[commonStyles.text, { fontSize: 14, opacity: 0.8 }]}>
                  by {project.author} • {project.authorRole}
                </Text>
              </View>
              <View style={{
                backgroundColor: project.status === 'open' ? '#2ed573' : '#ff6b6b',
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 4
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                  {project.status.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Genres */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
              {project.genres.map(genre => (
                <View key={genre} style={{
                  backgroundColor: '#64B5F6',
                  borderRadius: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  marginRight: 6,
                  marginBottom: 6
                }}>
                  <Text style={{ color: '#000', fontSize: 12, fontWeight: 'bold' }}>
                    {genre}
                  </Text>
                </View>
              ))}
            </View>

            {/* Description */}
            <Text style={[commonStyles.text, { marginBottom: 15, lineHeight: 20 }]}>
              {project.description}
            </Text>

            {/* Project Details */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
              <View>
                <Text style={[commonStyles.text, { fontSize: 12, opacity: 0.8 }]}>
                  Budget: {project.budget}
                </Text>
                <Text style={[commonStyles.text, { fontSize: 12, opacity: 0.8 }]}>
                  Timeline: {project.timeline}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[commonStyles.text, { fontSize: 12, opacity: 0.8 }]}>
                  {project.applicants} applicants
                </Text>
                <Text style={[commonStyles.text, { fontSize: 12, opacity: 0.8 }]}>
                  Posted {project.posted}
                </Text>
              </View>
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#162456',
                borderRadius: 8,
                padding: 12,
                alignItems: 'center'
              }}
              onPress={() => handleApplyToProject(project.id)}
            >
              <Text style={[commonStyles.text, { fontWeight: 'bold' }]}>
                Apply to Project
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {/* Create Project CTA */}
        <View style={[commonStyles.card, { alignItems: 'center', paddingVertical: 30 }]}>
          <Icon name="add-circle" size={60} style={{ marginBottom: 15, opacity: 0.7 }} />
          <Text style={[commonStyles.title, { fontSize: 18, marginBottom: 10 }]}>
            Have a Project?
          </Text>
          <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: 20, opacity: 0.8 }]}>
            Post your open project and find the perfect collaborators for your music.
          </Text>
          <Button
            text="Create New Project"
            onPress={handleCreateProject}
          />
        </View>
      </ScrollView>
    </View>
  );
}
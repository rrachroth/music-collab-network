
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/commonStyles';

interface IconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  style?: any;
}

export default function Icon({ name, size = 24, color = colors.text, style }: IconProps) {
  // Fallback for missing icons
  const iconName = Ionicons.glyphMap[name] ? name : 'help-circle';
  
  return (
    <Ionicons 
      name={iconName} 
      size={size} 
      color={color} 
      style={style}
    />
  );
}

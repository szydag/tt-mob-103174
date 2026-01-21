import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TaskListScreen, TaskAddScreen, TaskDetailScreen } from '../screens/HomeScreen'; // Importing all screens from the combined file

// Type definitions for Task entity
export type Task = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: boolean;
};

// Type definitions for navigation params
export type RootStackParamList = {
  taskList: undefined;
  taskAdd: undefined;
  taskDetail: { taskId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Custom headers are defined within each screen
      }}
      initialRouteName="taskList"
    >
      <Stack.Screen name="taskList" component={TaskListScreen} />
      <Stack.Screen name="taskAdd" component={TaskAddScreen} />
      <Stack.Screen name="taskDetail" component={TaskDetailScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
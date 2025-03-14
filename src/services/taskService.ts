import { supabase } from "@/integrations/supabase/client";
import { TaskType } from "@/components/Task";

/**
 * Loads tasks for a given project from Supabase
 */
export async function loadProjectTasks(projectId: string): Promise<TaskType[]> {
  // Fetch basic task data - select minimal fields to avoid type recursion
  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .select('id, name, start_date, duration, progress, parent_id, is_group, is_milestone, priority, description, project_id, created_by')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  
  if (taskError) throw taskError;
  
  if (!taskData || taskData.length === 0) {
    return [];
  }
  
  // Separately fetch dependencies with minimal fields
  const { data: dependencies, error: depError } = await supabase
    .from('task_dependencies')
    .select('predecessor_id, successor_id')
    .in('successor_id', taskData.map(t => t.id));
  
  if (depError) {
    console.error("Erro ao carregar dependências:", depError);
  }
  
  // Separately fetch assignees with minimal fields
  const { data: assignees, error: assigneeError } = await supabase
    .from('task_assignees')
    .select('task_id, user_id')
    .in('task_id', taskData.map(t => t.id));
    
  if (assigneeError) {
    console.error("Erro ao carregar responsáveis:", assigneeError);
  }
  
  // Create lookup maps for dependencies and assignees
  const dependencyMap: Record<string, string[]> = {};
  if (dependencies) {
    for (const dep of dependencies) {
      if (!dependencyMap[dep.successor_id]) {
        dependencyMap[dep.successor_id] = [];
      }
      dependencyMap[dep.successor_id].push(dep.predecessor_id);
    }
  }
  
  const assigneeMap: Record<string, string[]> = {};
  if (assignees) {
    for (const assign of assignees) {
      if (!assigneeMap[assign.task_id]) {
        assigneeMap[assign.task_id] = [];
      }
      assigneeMap[assign.task_id].push(assign.user_id);
    }
  }
  
  // Map tasks with simple object assignment to avoid deep type recursion
  const mappedTasks: TaskType[] = [];
  for (const task of taskData) {
    // Use lookup maps instead of filter operations
    const taskDeps = dependencyMap[task.id] || [];
    const taskAssignees = assigneeMap[task.id] || [];
    
    // Cast priority to the correct type with a fallback
    const priority = task.priority !== undefined 
      ? (task.priority as 1 | 2 | 3 | 4 | 5) 
      : 3;
    
    // Create the task object with explicit typing
    mappedTasks.push({
      id: task.id,
      name: task.name,
      startDate: task.start_date,
      duration: task.duration,
      isGroup: task.is_group || false,
      isMilestone: task.is_milestone || false,
      progress: task.progress || 0,
      parentId: task.parent_id || undefined,
      dependencies: taskDeps,
      assignees: taskAssignees,
      priority: priority,
      description: task.description
    });
  }
  
  return mappedTasks;
}

/**
 * Creates a new task in the database
 */
export async function createNewTask(
  projectId: string, 
  newTask: Omit<TaskType, 'id'>
): Promise<TaskType | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Você precisa estar logado para criar uma tarefa.");
  }
  
  // Ensure parent_id is correctly formatted for the database
  const parent_id = newTask.parentId || null;
  
  // Ensure priority is a valid value
  const priority = newTask.priority !== undefined 
    ? (newTask.priority as 1 | 2 | 3 | 4 | 5) 
    : 3;
      
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      name: newTask.name,
      start_date: newTask.startDate,
      duration: newTask.duration,
      progress: newTask.progress || 0,
      parent_id: parent_id,
      project_id: projectId,
      is_group: newTask.isGroup || false,
      is_milestone: newTask.isMilestone || false,
      created_by: user.id,
      priority: priority,
      description: newTask.description
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Add dependencies
  if (newTask.dependencies && newTask.dependencies.length > 0) {
    const depsToInsert = newTask.dependencies.map(depId => ({
      predecessor_id: depId,
      successor_id: data.id,
      successor_project_id: projectId
    }));
    
    const { error: depsError } = await supabase
      .from('task_dependencies')
      .insert(depsToInsert);
      
    if (depsError) throw depsError;
  }
  
  // Add assignees
  if (newTask.assignees && newTask.assignees.length > 0) {
    const assigneesToAdd = newTask.assignees.map(userId => ({
      task_id: data.id,
      user_id: userId
    }));
    
    const { error: assigneeError } = await supabase
      .from('task_assignees')
      .insert(assigneesToAdd);
      
    if (assigneeError) throw assigneeError;
  }
  
  // Construct and return the created task
  return {
    id: data.id,
    name: data.name,
    startDate: data.start_date,
    duration: data.duration,
    isGroup: data.is_group,
    isMilestone: data.is_milestone,
    progress: data.progress,
    parentId: data.parent_id,
    dependencies: newTask.dependencies,
    assignees: newTask.assignees,
    priority: data.priority !== undefined ? (data.priority as 1 | 2 | 3 | 4 | 5) : 3,
    description: data.description
  };
}

/**
 * Updates an existing task in the database
 */
export async function updateExistingTask(
  projectId: string,
  updatedTask: TaskType
): Promise<boolean> {
  // First ensure parent_id is correctly formatted for the database
  const parent_id = updatedTask.parentId || null;
  
  // Ensure priority is a valid value
  const priority = updatedTask.priority !== undefined 
    ? (updatedTask.priority as 1 | 2 | 3 | 4 | 5) 
    : 3;
      
  const { data, error } = await supabase
    .from('tasks')
    .update({
      name: updatedTask.name,
      start_date: updatedTask.startDate,
      duration: updatedTask.duration,
      progress: updatedTask.progress,
      parent_id: parent_id,
      is_group: updatedTask.isGroup || false,
      is_milestone: updatedTask.isMilestone || false,
      priority: priority,
      description: updatedTask.description
    })
    .eq('id', updatedTask.id)
    .select();
  
  if (error) throw error;
  
  // Update assignees if provided
  if (updatedTask.assignees) {
    // First fetch current assignees
    const { data: currentAssignees, error: fetchError } = await supabase
      .from('task_assignees')
      .select('user_id')
      .eq('task_id', updatedTask.id);
      
    if (fetchError) throw fetchError;
    
    const currentUserIds = currentAssignees?.map(a => a.user_id) || [];
    const updatedUserIds = updatedTask.assignees || [];
    
    // Determine which to add and which to remove
    const toAdd = updatedUserIds.filter(id => !currentUserIds.includes(id));
    const toRemove = currentUserIds.filter(id => !updatedUserIds.includes(id));
    
    // Add new assignees
    if (toAdd.length > 0) {
      const assigneesToAdd = toAdd.map(userId => ({
        task_id: updatedTask.id,
        user_id: userId
      }));
      
      const { error: insertError } = await supabase
        .from('task_assignees')
        .insert(assigneesToAdd);
        
      if (insertError) throw insertError;
    }
    
    // Remove assignees
    if (toRemove.length > 0) {
      for (const userId of toRemove) {
        const { error: deleteError } = await supabase
          .from('task_assignees')
          .delete()
          .eq('task_id', updatedTask.id)
          .eq('user_id', userId);
          
        if (deleteError) throw deleteError;
      }
    }
  }

  // Handle dependencies separately
  if (updatedTask.dependencies) {
    // Get existing dependencies
    const { data: existingDeps, error: depsError } = await supabase
      .from('task_dependencies')
      .select('predecessor_id')
      .eq('successor_id', updatedTask.id);
      
    if (depsError) throw depsError;
    
    const existingDepIds = existingDeps?.map(d => d.predecessor_id) || [];
    const newDepIds = updatedTask.dependencies || [];
    
    // Find dependencies to add and remove
    const depsToAdd = newDepIds.filter(id => !existingDepIds.includes(id));
    const depsToRemove = existingDepIds.filter(id => !newDepIds.includes(id));
    
    // Add new dependencies
    if (depsToAdd.length > 0) {
      const depsToInsert = depsToAdd.map(depId => ({
        predecessor_id: depId,
        successor_id: updatedTask.id,
        successor_project_id: projectId
      }));
      
      const { error: insertDepsError } = await supabase
        .from('task_dependencies')
        .insert(depsToInsert);
        
      if (insertDepsError) throw insertDepsError;
    }
    
    // Remove old dependencies
    if (depsToRemove.length > 0) {
      for (const depId of depsToRemove) {
        const { error: deleteDepsError } = await supabase
          .from('task_dependencies')
          .delete()
          .eq('predecessor_id', depId)
          .eq('successor_id', updatedTask.id);
          
        if (deleteDepsError) throw deleteDepsError;
      }
    }
  }
  
  return true;
}

/**
 * Creates a dependency between two tasks
 */
export async function createTaskDependency(
  projectId: string,
  sourceId: string, 
  targetId: string
): Promise<boolean> {
  // Check if this dependency already exists
  const { data: existingDep, error: checkError } = await supabase
    .from('task_dependencies')
    .select('id')
    .eq('predecessor_id', sourceId)
    .eq('successor_id', targetId)
    .maybeSingle();
    
  if (checkError) {
    console.error("Erro ao verificar dependência existente:", checkError);
    throw checkError;
  }
  
  if (existingDep) {
    console.log("Dependência já existe:", existingDep);
    return true;
  }
  
  // Insert the dependency without the successor_project_id field
  const { data, error } = await supabase
    .from('task_dependencies')
    .insert({
      predecessor_id: sourceId,
      successor_id: targetId
    })
    .select();
  
  if (error) {
    console.error("Erro ao inserir dependência:", error);
    throw error;
  }
  
  return true;
}

/**
 * Deletes a task from the database
 */
export async function deleteProjectTask(taskId: string): Promise<boolean> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
    
  if (error) throw error;
  
  return true;
}

/**
 * Fetches project members
 */
export async function getProjectMembersList(projectId: string) {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      id,
      user_id,
      role,
      profiles (
        id,
        email,
        full_name
      )
    `)
    .eq('project_id', projectId);
    
  if (error) throw error;
  
  return data.map(member => ({
    id: member.user_id,
    email: member.profiles.email,
    name: member.profiles.full_name || member.profiles.email
  }));
}

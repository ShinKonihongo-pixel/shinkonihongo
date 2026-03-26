// Test templates (test bank) management hook

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TestTemplate, TestFolder, ClassroomTest } from '../../types/classroom';
import * as classroomService from '../../services/classroom-firestore';
import { handleError } from '../../utils/error-handler';

export function useTestTemplates() {
  const [templates, setTemplates] = useState<TestTemplate[]>([]);
  const [folders, setFolders] = useState<TestFolder[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to templates and folders
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const unsubTemplates = classroomService.subscribeToTestTemplates((data) => {
      setTemplates(data);
    });
    const unsubFolders = classroomService.subscribeToTestFolders((data) => {
      setFolders(data);
      setLoading(false);
    });
    return () => {
      unsubTemplates();
      unsubFolders();
    };
  }, []);

  // Create folder
  const createFolder = useCallback(async (
    name: string,
    level: string,
    type: 'test' | 'assignment',
    createdBy: string
  ): Promise<TestFolder | null> => {
    try {
      return await classroomService.createTestFolder(name, level, type, createdBy);
    } catch (error) {
      handleError(error, { context: 'usetestUtemplates' });
      return null;
    }
  }, []);

  // Update folder
  const updateFolder = useCallback(async (
    folderId: string,
    data: { name: string }
  ): Promise<boolean> => {
    try {
      await classroomService.updateTestFolder(folderId, data);
      return true;
    } catch (error) {
      handleError(error, { context: 'usetestUtemplates' });
      return false;
    }
  }, []);

  // Delete folder
  const deleteFolder = useCallback(async (folderId: string): Promise<boolean> => {
    try {
      await classroomService.deleteTestFolder(folderId);
      return true;
    } catch (error) {
      handleError(error, { context: 'usetestUtemplates' });
      return false;
    }
  }, []);

  // Create template
  const createTemplate = useCallback(async (
    data: classroomService.TestTemplateFormData,
    createdBy: string
  ): Promise<TestTemplate | null> => {
    try {
      return await classroomService.createTestTemplate(data, createdBy);
    } catch (error) {
      handleError(error, { context: 'usetestUtemplates' });
      return null;
    }
  }, []);

  // Update template
  const updateTemplate = useCallback(async (
    templateId: string,
    data: Partial<classroomService.TestTemplateFormData>
  ): Promise<boolean> => {
    try {
      await classroomService.updateTestTemplate(templateId, data);
      return true;
    } catch (error) {
      handleError(error, { context: 'usetestUtemplates' });
      return false;
    }
  }, []);

  // Delete template
  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    try {
      await classroomService.deleteTestTemplate(templateId);
      return true;
    } catch (error) {
      handleError(error, { context: 'usetestUtemplates' });
      return false;
    }
  }, []);

  // Assign template to classroom
  const assignToClassroom = useCallback(async (
    templateId: string,
    classroomId: string,
    createdBy: string,
    options?: { deadline?: string; isPublished?: boolean }
  ): Promise<ClassroomTest | null> => {
    try {
      return await classroomService.assignTestToClassroom(templateId, classroomId, createdBy, options);
    } catch (error) {
      handleError(error, { context: 'usetestUtemplates' });
      return null;
    }
  }, []);

  // Filter helpers
  const testTemplates = useMemo(() => templates.filter(t => t.type === 'test'), [templates]);
  const assignmentTemplates = useMemo(() => templates.filter(t => t.type === 'assignment'), [templates]);
  const testFolders = useMemo(() => folders.filter(f => f.type === 'test'), [folders]);
  const assignmentFolders = useMemo(() => folders.filter(f => f.type === 'assignment'), [folders]);

  // Get folders by level and type
  const getFoldersByLevelAndType = useCallback((level: string, type: 'test' | 'assignment') => {
    return classroomService.getTestFoldersByLevelAndType(folders, level, type);
  }, [folders]);

  // Get templates by folder
  const getTemplatesByFolder = useCallback((folderId: string) => {
    return templates.filter(t => t.folderId === folderId);
  }, [templates]);

  return {
    templates,
    folders,
    testTemplates,
    assignmentTemplates,
    testFolders,
    assignmentFolders,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    assignToClassroom,
    getFoldersByLevelAndType,
    getTemplatesByFolder,
  };
}

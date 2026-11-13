import { apiRequest, apiRequestText } from '../api/http';
import type { ApiAgeBand } from '../lib/age-mode';

export interface EduMe {
  identityId: string;
  kind: 'profile' | 'learner' | 'center';
  alias: string;
  nickname: string | null;
  ageBand: ApiAgeBand | null;
  language: string | null;
  status: string | null;
  guardians: Array<{
    guardianUserId: string;
    role: 'principal' | 'secondary';
    status: 'invited' | 'active' | 'revoked';
  }> | null;
  notifications: { email: boolean; push: boolean; digest: 'off' | 'daily' | 'weekly' };
}

export type ClassroomRole = 'teacher' | 'student' | 'guardian_observer';
export type ViewerRole = ClassroomRole | 'owner' | 'center';

export interface Classroom {
  id: string;
  centerId: string | null;
  ownerIdentityId: string;
  name: string;
  description: string | null;
  language: string;
  ageMin: number | null;
  ageMax: number | null;
  status: 'active' | 'archived' | 'deleted';
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  viewerRole: ViewerRole;
}

export interface Member {
  identityId: string;
  alias: string | null;
  nickname: string | null;
  role: ClassroomRole;
  status: 'active' | 'removed';
  joinedAt: string | null;
}

export interface Invite {
  id: string;
  role: ClassroomRole;
  maxUses: number;
  uses: number;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface InviteCreated {
  inviteId: string;
  role: ClassroomRole;
  maxUses: number;
  expiresAt: string;
  code: string;
  acceptPath: string;
  link: string;
  qrPayload: string;
}

export interface Folder {
  id: string;
  classroomId: string;
  parentFolderId: string | null;
  title: string;
  position: number;
  updatedAt: string;
}

export interface PageSummary {
  id: string;
  classroomId: string;
  folderId: string | null;
  parentPageId: string | null;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  version: number;
  publishedAt: string | null;
  updatedAt: string;
}

export interface PageDetail extends PageSummary {
  contentHash: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  blocks?: unknown[];
  markdown?: string;
}

export interface Exercise {
  id: string;
  classroomId: string;
  pageId: string | null;
  createdBy: string;
  type: string;
  promptMd: string;
  publicConfig: Record<string, unknown>;
  points: number;
  attemptsAllowed: number;
  timeLimitSec: number | null;
  feedbackMode: 'immediate' | 'deferred' | 'never';
  randomize: boolean;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface AttemptStart {
  attemptId: string;
  exerciseId: string;
  classroomId: string;
  attemptNo: number;
  seed: string;
  status: string;
  startedAt: string;
  deadline: string | null;
  timeLimitSec: number | null;
  publicConfig: Record<string, unknown>;
  exercise: {
    id: string;
    type: string;
    promptMd: string;
    points: number;
    attemptsAllowed: number;
    feedbackMode: string;
  };
}

export interface AttemptResult {
  id: string;
  exerciseId: string;
  classroomId: string;
  attemptNo: number;
  status: string;
  score: number | null;
  maxScore: number;
  feedback: string | null;
  startedAt: string;
  submittedAt: string | null;
  timeSpentSec: number | null;
  deadline: string | null;
  expired: boolean;
  pendingFeedback: boolean;
  answers?: Record<string, unknown>;
}

export interface Gradebook {
  classroomId: string;
  scope: 'staff' | 'self' | 'guardian';
  gradeItems: Array<{ id: string; title: string; weight: number }>;
  exercises: Array<{
    id: string;
    pageId: string | null;
    type: string;
    label: string;
    points: number;
    attemptsAllowed: number;
    status: string;
  }>;
  students: Array<{
    identityId: string;
    alias: string | null;
    nickname: string | null;
    progress: Array<{ pageId: string; status: string; score: number | null; completedAt: string | null; updatedAt: string }>;
    attempts: Array<{ exerciseId: string; attemptNo: number; status: string; score: number | null; maxScore: number; submittedAt: string | null }>;
    grades: Array<{ gradeItemId: string; title: string; weight: number; score: number; feedback: string | null }>;
    weightedScore: number | null;
  }>;
}

export interface Thread {
  id: string;
  classroomId: string;
  kind: 'student_teacher' | 'guardian_teacher';
  teacherIdentityId: string;
  learnerIdentityId: string;
  guardianIdentityId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  authorIdentityId: string | null;
  kind: 'user' | 'system_access_notice';
  bodyMd: string;
  bodyHtml: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  deletedAt: string | null;
  canDelete: boolean;
}

export interface Comment {
  id: string;
  classroomId: string;
  pageId: string | null;
  exerciseId: string | null;
  authorIdentityId: string;
  authorAlias: string | null;
  bodyMd: string;
  bodyHtml: string;
  parentId: string | null;
  visibility: 'classroom' | 'teachers';
  createdAt: string;
  deletedAt: string | null;
}

export interface SearchResult {
  pageId: string;
  classroomId: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  updatedAt: string;
  snippet: string;
}

export async function getMe(): Promise<EduMe> {
  return apiRequest<EduMe>('/edu/v1/me', { auth: 'edu' });
}

export async function listClassrooms(): Promise<Classroom[]> {
  const data = await apiRequest<{ classrooms: Classroom[] }>('/edu/v1/classrooms', { auth: 'edu' });
  return data.classrooms;
}

export async function getClassroom(id: string): Promise<Classroom> {
  return apiRequest<Classroom>(`/edu/v1/classrooms/${encodeURIComponent(id)}`, { auth: 'edu' });
}

export async function createClassroom(input: {
  name: string;
  description?: string;
  ageMin?: number;
  ageMax?: number;
}): Promise<Classroom> {
  return apiRequest<Classroom>('/edu/v1/classrooms', {
    method: 'POST',
    auth: 'edu',
    body: input,
  });
}

export async function updateClassroom(
  id: string,
  patch: { name?: string; description?: string | null; ageMin?: number | null; ageMax?: number | null },
): Promise<Classroom> {
  return apiRequest<Classroom>(`/edu/v1/classrooms/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    auth: 'edu',
    body: patch,
  });
}

export async function archiveClassroom(id: string): Promise<Classroom> {
  return apiRequest<Classroom>(`/edu/v1/classrooms/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
    auth: 'edu',
  });
}

export async function deleteClassroom(id: string): Promise<void> {
  await apiRequest(`/edu/v1/classrooms/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: 'edu',
  });
}

export async function listMembers(classroomId: string): Promise<Member[]> {
  const data = await apiRequest<{ members: Member[] }>(
    `/edu/v1/classrooms/${encodeURIComponent(classroomId)}/members`,
    { auth: 'edu' },
  );
  return data.members;
}

export async function addMember(
  classroomId: string,
  input: { identityId: string; role: ClassroomRole },
): Promise<Member> {
  return apiRequest<Member>(`/edu/v1/classrooms/${encodeURIComponent(classroomId)}/members`, {
    method: 'POST',
    auth: 'edu',
    body: input,
  });
}

export async function updateMember(
  classroomId: string,
  input: { identityId: string; role?: ClassroomRole; status?: 'active' | 'removed' },
): Promise<void> {
  await apiRequest(`/edu/v1/classrooms/${encodeURIComponent(classroomId)}/members`, {
    method: 'PATCH',
    auth: 'edu',
    body: input,
  });
}

export async function removeMember(
  classroomId: string,
  identityId: string,
  role?: ClassroomRole,
): Promise<void> {
  await apiRequest(`/edu/v1/classrooms/${encodeURIComponent(classroomId)}/members`, {
    method: 'DELETE',
    auth: 'edu',
    body: { identityId, ...(role ? { role } : {}) },
  });
}

export async function listInvites(classroomId: string): Promise<Invite[]> {
  const data = await apiRequest<{ invites: Invite[] }>(
    `/edu/v1/classrooms/${encodeURIComponent(classroomId)}/invites`,
    { auth: 'edu' },
  );
  return data.invites;
}

export async function createInvite(
  classroomId: string,
  input: { role: 'student' | 'teacher'; maxUses: number; expiresInSec: number },
): Promise<InviteCreated> {
  return apiRequest<InviteCreated>(
    `/edu/v1/classrooms/${encodeURIComponent(classroomId)}/invites`,
    { method: 'POST', auth: 'edu', body: input },
  );
}

export async function revokeInvite(classroomId: string, inviteId: string): Promise<void> {
  await apiRequest(`/edu/v1/classrooms/${encodeURIComponent(classroomId)}/invites`, {
    method: 'DELETE',
    auth: 'edu',
    body: { inviteId },
  });
}

export async function acceptInvite(code: string): Promise<Member> {
  return apiRequest<Member>(`/edu/v1/invites/${encodeURIComponent(code)}/accept`, {
    method: 'POST',
    auth: 'edu',
    body: {},
  });
}

export async function listFolders(classroomId: string): Promise<Folder[]> {
  const data = await apiRequest<{ folders: Folder[] }>(
    `/edu/v1/classrooms/${encodeURIComponent(classroomId)}/folders`,
    { auth: 'edu' },
  );
  return data.folders;
}

export async function createFolder(
  classroomId: string,
  input: { title: string; parentFolderId?: string | null; position?: number },
): Promise<Folder> {
  return apiRequest<Folder>(`/edu/v1/classrooms/${encodeURIComponent(classroomId)}/folders`, {
    method: 'POST',
    auth: 'edu',
    body: {
      title: input.title,
      parentFolderId: input.parentFolderId ?? null,
      position: input.position ?? 0,
    },
  });
}

export async function deleteFolder(classroomId: string, folderId: string): Promise<void> {
  await apiRequest(`/edu/v1/classrooms/${encodeURIComponent(classroomId)}/folders`, {
    method: 'DELETE',
    auth: 'edu',
    body: { folderId },
  });
}

export async function listPages(classroomId: string): Promise<PageSummary[]> {
  const data = await apiRequest<{ pages: PageSummary[] }>(
    `/edu/v1/classrooms/${encodeURIComponent(classroomId)}/pages`,
    { auth: 'edu' },
  );
  return data.pages;
}

export async function getPage(pageId: string): Promise<PageDetail> {
  return apiRequest<PageDetail>(`/edu/v1/pages/${encodeURIComponent(pageId)}`, { auth: 'edu' });
}

export async function createPage(
  classroomId: string,
  input: {
    title: string;
    slug?: string;
    folderId?: string | null;
    parentPageId?: string | null;
    markdown?: string;
  },
): Promise<PageDetail> {
  return apiRequest<PageDetail>(`/edu/v1/classrooms/${encodeURIComponent(classroomId)}/pages`, {
    method: 'POST',
    auth: 'edu',
    body: {
      title: input.title,
      ...(input.slug ? { slug: input.slug } : {}),
      folderId: input.folderId ?? null,
      parentPageId: input.parentPageId ?? null,
      status: 'draft',
      ...(input.markdown ? { markdown: input.markdown } : {}),
    },
  });
}

export async function updatePage(
  classroomId: string,
  pageId: string,
  input: { title?: string; markdown?: string; folderId?: string | null; parentPageId?: string | null },
  version: number,
): Promise<PageDetail> {
  return apiRequest<PageDetail>(`/edu/v1/classrooms/${encodeURIComponent(classroomId)}/pages`, {
    method: 'PATCH',
    auth: 'edu',
    body: { pageId, version, ...input },
  });
}

export async function deletePage(classroomId: string, pageId: string): Promise<void> {
  await apiRequest(`/edu/v1/classrooms/${encodeURIComponent(classroomId)}/pages`, {
    method: 'DELETE',
    auth: 'edu',
    body: { pageId },
  });
}

export async function publishPage(pageId: string): Promise<void> {
  await apiRequest(`/edu/v1/pages/${encodeURIComponent(pageId)}/publish`, {
    method: 'POST',
    auth: 'edu',
  });
}

export async function unpublishPage(pageId: string): Promise<void> {
  await apiRequest(`/edu/v1/pages/${encodeURIComponent(pageId)}/unpublish`, {
    method: 'POST',
    auth: 'edu',
  });
}

export async function duplicatePage(pageId: string, title?: string): Promise<PageDetail> {
  return apiRequest<PageDetail>(`/edu/v1/pages/${encodeURIComponent(pageId)}/duplicate`, {
    method: 'POST',
    auth: 'edu',
    body: { ...(title ? { title } : {}) },
  });
}

export async function getPageHtml(pageId: string): Promise<string> {
  return apiRequestText(`/edu/v1/pages/${encodeURIComponent(pageId)}/export?format=html`, {
    auth: 'edu',
  });
}

export async function searchContent(query: string, classroomId?: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query });
  if (classroomId) params.set('classroomId', classroomId);
  const data = await apiRequest<{ results: SearchResult[] }>(`/edu/v1/search?${params.toString()}`, {
    auth: 'edu',
  });
  return data.results;
}

export async function listPageComments(pageId: string): Promise<Comment[]> {
  const data = await apiRequest<{ comments: Comment[] }>(
    `/edu/v1/pages/${encodeURIComponent(pageId)}/comments?limit=50`,
    { auth: 'edu' },
  );
  return data.comments;
}

export async function addPageComment(
  pageId: string,
  bodyMd: string,
  visibility: 'classroom' | 'teachers' = 'classroom',
): Promise<Comment> {
  return apiRequest<Comment>(`/edu/v1/pages/${encodeURIComponent(pageId)}/comments`, {
    method: 'POST',
    auth: 'edu',
    body: { bodyMd, visibility },
  });
}

export async function listExercises(classroomId: string): Promise<Exercise[]> {
  const data = await apiRequest<{ exercises: Exercise[] }>(
    `/edu/v1/classrooms/${encodeURIComponent(classroomId)}/exercises`,
    { auth: 'edu' },
  );
  return data.exercises;
}

export async function createExercise(
  classroomId: string,
  input: {
    pageId?: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    promptMd: string;
    publicConfig: Record<string, unknown>;
    answerKey: Record<string, unknown>;
    points?: number;
    attemptsAllowed?: number;
    status?: 'draft' | 'published';
  },
): Promise<Exercise> {
  return apiRequest<Exercise>(`/edu/v1/classrooms/${encodeURIComponent(classroomId)}/exercises`, {
    method: 'POST',
    auth: 'edu',
    body: {
      ...(input.pageId ? { pageId: input.pageId } : {}),
      type: input.type,
      promptMd: input.promptMd,
      publicConfig: input.publicConfig,
      answerKey: input.answerKey,
      points: input.points ?? 1,
      attemptsAllowed: input.attemptsAllowed ?? 1,
      status: input.status ?? 'draft',
    },
  });
}

export async function deleteExercise(classroomId: string, exerciseId: string): Promise<void> {
  await apiRequest(`/edu/v1/classrooms/${encodeURIComponent(classroomId)}/exercises`, {
    method: 'DELETE',
    auth: 'edu',
    body: { exerciseId },
  });
}

export async function startAttempt(exerciseId: string): Promise<AttemptStart> {
  return apiRequest<AttemptStart>(`/edu/v1/exercises/${encodeURIComponent(exerciseId)}/attempts`, {
    method: 'POST',
    auth: 'edu',
    body: {},
  });
}

export async function submitAttempt(
  attemptId: string,
  answers: Record<string, unknown>,
): Promise<AttemptResult> {
  return apiRequest<AttemptResult>(`/edu/v1/attempts/${encodeURIComponent(attemptId)}/submit`, {
    method: 'POST',
    auth: 'edu',
    body: { answers },
  });
}

export async function getAttemptResult(attemptId: string): Promise<AttemptResult> {
  return apiRequest<AttemptResult>(`/edu/v1/attempts/${encodeURIComponent(attemptId)}/result`, {
    auth: 'edu',
  });
}

export async function getGradebook(classroomId: string): Promise<Gradebook> {
  return apiRequest<Gradebook>(
    `/edu/v1/classrooms/${encodeURIComponent(classroomId)}/gradebook`,
    { auth: 'edu' },
  );
}

export async function addManualGrade(
  classroomId: string,
  input: { identityId: string; title: string; score: number; feedback?: string; weight?: number },
): Promise<void> {
  await apiRequest(`/edu/v1/classrooms/${encodeURIComponent(classroomId)}/grades`, {
    method: 'POST',
    auth: 'edu',
    body: input,
  });
}

export async function changeAlias(alias: string): Promise<{ alias: string }> {
  return apiRequest<{ alias: string }>('/edu/v1/me/alias', {
    method: 'PATCH',
    auth: 'edu',
    body: { alias },
  });
}

export async function updateNotificationPrefs(patch: {
  email?: boolean;
  push?: boolean;
  digest?: 'off' | 'daily' | 'weekly';
}): Promise<EduMe['notifications']> {
  return apiRequest<EduMe['notifications']>('/edu/v1/me/notification-prefs', {
    method: 'PATCH',
    auth: 'edu',
    body: patch,
  });
}

export interface Approval {
  id: string;
  action: string;
  classroomId: string | null;
  requesterIdentityId: string;
  requesterAlias: string | null;
  status: string;
  payload: Record<string, unknown>;
  expiresAt: string;
  approvedAt: string | null;
  createdAt: string;
}

export async function listApprovals(): Promise<Approval[]> {
  const data = await apiRequest<{ approvals: Approval[] }>('/edu/v1/approvals', { auth: 'edu' });
  return data.approvals;
}

export async function respondApproval(
  approvalId: string,
  approve: boolean,
  reason?: string,
): Promise<unknown> {
  return apiRequest(`/edu/v1/approvals/${encodeURIComponent(approvalId)}/respond`, {
    method: 'POST',
    auth: 'edu',
    body: { approve, ...(reason ? { reason } : {}) },
  });
}

export async function requestApproval(
  action: string,
  classroomId: string | null,
  payload: Record<string, unknown>,
): Promise<{ approvalId: string; status: string; expiresAt: string; emailUnavailable: boolean }> {
  return apiRequest('/edu/v1/approvals', {
    method: 'POST',
    auth: 'edu',
    body: { action, ...(classroomId ? { classroomId } : {}), payload },
  });
}

export interface CenterRequest {
  id: string;
  requesterUserId: string;
  legalName: string;
  taxId: string;
  reason: string;
  staffCount: number;
  participantsCount: number;
  maxStudents: number;
  status: string;
  ticketId: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function requestCenter(input: {
  legalName: string;
  taxId: string;
  reason: string;
  staffCount: number;
  participantsCount: number;
  maxStudents: number;
}): Promise<CenterRequest> {
  return apiRequest<CenterRequest>('/edu/v1/centers/requests', {
    method: 'POST',
    auth: 'edu',
    body: input,
  });
}

export async function listThreads(classroomId: string): Promise<Thread[]> {
  const data = await apiRequest<{ threads: Thread[] }>(
    `/edu/v1/classrooms/${encodeURIComponent(classroomId)}/threads?limit=50`,
    { auth: 'edu' },
  );
  return data.threads;
}

export async function createThread(
  classroomId: string,
  input: { kind: 'student_teacher' | 'guardian_teacher'; learnerIdentityId?: string; teacherIdentityId?: string },
): Promise<Thread> {
  return apiRequest<Thread>(`/edu/v1/classrooms/${encodeURIComponent(classroomId)}/threads`, {
    method: 'POST',
    auth: 'edu',
    body: input,
  });
}

export async function listMessages(threadId: string): Promise<Message[]> {
  const data = await apiRequest<{ messages: Message[] }>(
    `/edu/v1/threads/${encodeURIComponent(threadId)}/messages?limit=100`,
    { auth: 'edu' },
  );
  return data.messages;
}

export async function sendMessage(threadId: string, bodyMd: string): Promise<Message> {
  return apiRequest<Message>(`/edu/v1/threads/${encodeURIComponent(threadId)}/messages`, {
    method: 'POST',
    auth: 'edu',
    body: { bodyMd },
  });
}

export async function deleteMessage(threadId: string, messageId: string): Promise<void> {
  await apiRequest(
    `/edu/v1/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(messageId)}`,
    { method: 'DELETE', auth: 'edu' },
  );
}

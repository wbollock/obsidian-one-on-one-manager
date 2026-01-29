// ABOUTME: Type definitions for 1:1 meeting data structures
// ABOUTME: Includes meeting metadata, action items, and person profiles

export interface OneOnOneMeeting {
	person: string;
	date: string;
	mood?: string;
	topics: string[];
	actionItems: ActionItem[];
	filePath: string;
	content: string;
	privateNotes?: PrivateManagerNotes;
}

export interface ActionItem {
	text: string;
	completed: boolean;
	assignee?: string;
	dueDate?: string;
}

export interface PrivateManagerNotes {
	observations?: string;
	coachingNotes?: string;
	myReaction?: string;
	followUpForMe?: string;
}

export interface PersonProfile {
	name: string;
	role?: string;
	level?: string;
	team?: string;
	reportsTo?: string;
	startDate?: string;
	notes?: string;
	agendaItems?: AgendaItem[];
}

export interface AgendaItem {
	id: string;
	text: string;
	dateAdded: string;
	priority?: 'high' | 'medium' | 'low';
	completed?: boolean;
}

export interface PersonStats {
	person: string;
	meetingCount: number;
	lastMeeting: string;
	actionItemCompletion: number;
	moodTrend: string[];
	profile?: PersonProfile;
	goals?: Goal[];
}

export interface Goal {
	id: string;
	person: string;
	title: string;
	description: string;
	category: 'Career' | 'Technical' | 'Project' | 'Performance' | 'Learning' | 'Team' | 'Personal';
	timeframe: 'Q1' | 'Q2' | 'Q3' | 'Q4' | '6-month' | 'Annual' | 'Custom';
	year: number; // Track which year this goal belongs to
	startDate: string;
	targetDate: string;
	status: 'not-started' | 'in-progress' | 'at-risk' | 'completed' | 'abandoned';
	progress: number; // 0-100
	keyResults?: KeyResult[];
	checkIns: GoalCheckIn[];
	blockers: string[];
	supportNeeded?: string;
	successCriteria: string[];
	tags?: string[];
	linkedGoals?: string[]; // IDs of related goals
	archived?: boolean; // Mark goals from previous years as archived
}

export interface KeyResult {
	id: string;
	description: string;
	target: string;
	current: string;
	unit?: string; // e.g., '%', 'users', 'features'
	completed: boolean;
}

export interface GoalCheckIn {
	id: string;
	date: string;
	progress: number;
	status: 'on-track' | 'at-risk' | 'blocked' | 'completed';
	notes: string;
	mood?: 'confident' | 'optimistic' | 'neutral' | 'concerned' | 'stuck';
	blockers?: string[];
	wins?: string[];
	nextSteps?: string[];
	meetingLink?: string; // Link to 1:1 note where discussed
}

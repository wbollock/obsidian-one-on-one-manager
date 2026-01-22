// ABOUTME: Type definitions for 1:1 meeting data structures
// ABOUTME: Includes meeting metadata, action items, theme information, and person profiles

export interface OneOnOneMeeting {
	person: string;
	date: string;
	mood?: string;
	topics: string[];
	themes: string[];
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
	email?: string;
	slackHandle?: string;
	notes?: string;
}

export interface CoachingPlan {
	person: string;
	role?: string;
	level?: string;
	targetLevel?: string;
	startDate?: string;
	focusAreas: FocusArea[];
	growthExperiments: GrowthExperiment[];
	feedbackToDeliver: FeedbackItem[];
	discussionPatterns: Map<string, number>;
	concerns: string[];
	lastReviewDate?: string;
	nextReviewDate?: string;
}

export interface FocusArea {
	id: string;
	title: string;
	description: string;
	priority: 'high' | 'medium' | 'low';
	status: 'active' | 'completed' | 'paused';
}

export interface GrowthExperiment {
	id: string;
	title: string;
	description: string;
	startDate: string;
	endDate?: string;
	status: 'active' | 'completed' | 'cancelled';
	outcome?: string;
}

export interface FeedbackItem {
	id: string;
	feedback: string;
	dateCreated: string;
	dateDelivered?: string;
	delivered: boolean;
	priority: 'high' | 'medium' | 'low';
}

export interface PersonStats {
	person: string;
	meetingCount: number;
	lastMeeting: string;
	commonThemes: Map<string, number>;
	actionItemCompletion: number;
	moodTrend: string[];
	profile?: PersonProfile;
	coachingPlan?: CoachingPlan;
}

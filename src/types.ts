// ABOUTME: Type definitions for 1:1 meeting data structures
// ABOUTME: Includes meeting metadata, action items, and theme information

export interface OneOnOneMeeting {
	person: string;
	date: string;
	mood?: string;
	topics: string[];
	themes: string[];
	actionItems: ActionItem[];
	filePath: string;
	content: string;
}

export interface ActionItem {
	text: string;
	completed: boolean;
	assignee?: string;
	dueDate?: string;
}

export interface PersonStats {
	person: string;
	meetingCount: number;
	lastMeeting: string;
	commonThemes: Map<string, number>;
	actionItemCompletion: number;
	moodTrend: string[];
}

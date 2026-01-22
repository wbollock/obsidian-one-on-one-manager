// ABOUTME: Service for analyzing 1:1 meeting notes
// ABOUTME: Extracts themes, action items, and metadata from markdown files
import {App, TFile, moment} from 'obsidian';
import {OneOnOneMeeting, ActionItem, PersonStats} from './types';
import {OneOnOneSettings} from './settings';

export class MeetingAnalyzer {
	constructor(private app: App, private settings: OneOnOneSettings) {}

	async getAllMeetings(): Promise<OneOnOneMeeting[]> {
		const folder = this.app.vault.getAbstractFileByPath(this.settings.oneOnOneFolder);
		if (!folder) return [];

		const meetings: OneOnOneMeeting[] = [];
		const files = this.app.vault.getMarkdownFiles()
			.filter(f => f.path.startsWith(this.settings.oneOnOneFolder));

		for (const file of files) {
			const meeting = await this.parseMeeting(file);
			if (meeting) meetings.push(meeting);
		}

		return meetings.sort((a, b) => b.date.localeCompare(a.date));
	}

	async parseMeeting(file: TFile): Promise<OneOnOneMeeting | null> {
		const content = await this.app.vault.read(file);
		const cache = this.app.metadataCache.getFileCache(file);
		
		if (!cache?.frontmatter) return null;

		const frontmatter = cache.frontmatter;
		const person = frontmatter.person || 'Unknown';
		const date = frontmatter.date || file.basename;
		const mood = frontmatter.mood;
		const topics = this.parseTopics(frontmatter.topics);

		const themes = this.extractThemes(content);
		const actionItems = this.extractActionItems(content);

		return {
			person,
			date,
			mood,
			topics,
			themes,
			actionItems,
			filePath: file.path,
			content
		};
	}

	private parseTopics(topics: any): string[] {
		if (Array.isArray(topics)) return topics;
		if (typeof topics === 'string') return topics.split(',').map(t => t.trim());
		return [];
	}

	extractThemes(content: string): string[] {
		const themes = new Set<string>();
		const lowerContent = content.toLowerCase();

		for (const [theme, keywords] of Object.entries(this.settings.themeKeywords)) {
			for (const keyword of keywords) {
				if (lowerContent.includes(keyword.toLowerCase())) {
					themes.add(theme);
					break;
				}
			}
		}

		return Array.from(themes);
	}

	extractActionItems(content: string): ActionItem[] {
		const items: ActionItem[] = [];
		const lines = content.split('\n');

		for (const line of lines) {
			const todoMatch = line.match(/^[\s-]*\[([x ])\]\s+(.+)$/i);
			if (todoMatch && todoMatch[1] && todoMatch[2]) {
				const completed = todoMatch[1].toLowerCase() === 'x';
				const text = todoMatch[2].trim();
				
				const dueDateMatch = text.match(/📅\s*(\d{4}-\d{2}-\d{2})/);
				const assigneeMatch = text.match(/@(\w+)/);

				items.push({
					text: text,
					completed,
					dueDate: dueDateMatch?.[1],
					assignee: assigneeMatch?.[1]
				});
			}
		}

		return items;
	}

	async getPersonStats(person: string): Promise<PersonStats> {
		const allMeetings = await this.getAllMeetings();
		const personMeetings = allMeetings.filter(m => m.person === person);

		const commonThemes = new Map<string, number>();
		const moods: string[] = [];
		let completedActions = 0;
		let totalActions = 0;

		for (const meeting of personMeetings) {
			for (const theme of meeting.themes) {
				commonThemes.set(theme, (commonThemes.get(theme) || 0) + 1);
			}
			if (meeting.mood) moods.push(meeting.mood);
			
			for (const action of meeting.actionItems) {
				totalActions++;
				if (action.completed) completedActions++;
			}
		}

		return {
			person,
			meetingCount: personMeetings.length,
			lastMeeting: personMeetings[0]?.date || 'Never',
			commonThemes,
			actionItemCompletion: totalActions > 0 ? (completedActions / totalActions) * 100 : 0,
			moodTrend: moods
		};
	}

	async getAllPeople(): Promise<string[]> {
		const meetings = await this.getAllMeetings();
		const people = new Set(meetings.map(m => m.person));
		return Array.from(people).sort();
	}
}

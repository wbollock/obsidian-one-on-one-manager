// ABOUTME: Timeline view showing meeting history for a specific person
// ABOUTME: Chronological display of all 1:1s with themes and action items
import {ItemView, WorkspaceLeaf} from 'obsidian';
import OneOnOneManager from './main';
import {MeetingAnalyzer} from './analyzer';

export const TIMELINE_VIEW_TYPE = 'one-on-one-timeline';

export class TimelineView extends ItemView {
	plugin: OneOnOneManager;
	analyzer: MeetingAnalyzer;
	person: string;

	constructor(leaf: WorkspaceLeaf, plugin: OneOnOneManager, person: string) {
		super(leaf);
		this.plugin = plugin;
		this.analyzer = new MeetingAnalyzer(this.app, plugin.settings);
		this.person = person;
	}

	getViewType(): string {
		return TIMELINE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return `1:1 Timeline: ${this.person}`;
	}

	getIcon(): string {
		return 'clock';
	}

	async onOpen(): Promise<void> {
		await this.render();
	}

	async render(): Promise<void> {
		const container = this.containerEl.children[1];
		if (!container) return;
		
		container.empty();

		const contentEl = container.createEl('div', {cls: 'one-on-one-timeline'});

		contentEl.createEl('h1', {text: `1:1 Timeline: ${this.person}`, cls: 'timeline-title'});

		const meetings = await this.analyzer.getAllMeetings();
		const personMeetings = meetings.filter(m => m.person === this.person);

		if (personMeetings.length === 0) {
			contentEl.createEl('p', {text: 'No meetings found for this person.'});
			return;
		}

		const stats = await this.analyzer.getPersonStats(this.person);
		await this.renderStats(contentEl, stats);
		await this.renderMeetings(contentEl, personMeetings);
	}

	private async renderStats(container: HTMLElement, stats: any): Promise<void> {
		const section = container.createEl('div', {cls: 'timeline-stats'});
		
		const grid = section.createEl('div', {cls: 'stats-grid'});
		
		this.createStatCard(grid, 'Total Meetings', stats.meetingCount.toString(), '📅');
		this.createStatCard(grid, 'Last Meeting', stats.lastMeeting, '🕐');
		this.createStatCard(grid, 'Action Items Done', `${Math.round(stats.actionItemCompletion)}%`, '✓');

		if (stats.commonThemes.size > 0) {
			const themesSection = section.createEl('div', {cls: 'timeline-themes'});
			themesSection.createEl('h3', {text: 'Common Themes'});
			
			const themesGrid = themesSection.createEl('div', {cls: 'themes-grid'});
			const sortedThemes: [string, number][] = (Array.from(stats.commonThemes.entries()) as [string, number][])
				.sort((a: [string, number], b: [string, number]) => b[1] - a[1]);
			
			for (const [theme, count] of sortedThemes) {
				const badge = themesGrid.createEl('span', {cls: 'theme-badge-large'});
				badge.createEl('span', {text: theme, cls: 'theme-name'});
				badge.createEl('span', {text: count.toString(), cls: 'theme-count'});
			}
		}
	}

	private createStatCard(container: HTMLElement, label: string, value: string, icon: string): void {
		const card = container.createEl('div', {cls: 'stat-card'});
		card.createEl('div', {text: icon, cls: 'stat-icon'});
		card.createEl('div', {text: value, cls: 'stat-value'});
		card.createEl('div', {text: label, cls: 'stat-label'});
	}

	private async renderMeetings(container: HTMLElement, meetings: any[]): Promise<void> {
		const timeline = container.createEl('div', {cls: 'timeline-container'});
		timeline.createEl('h2', {text: 'Meeting History'});

		for (const meeting of meetings) {
			const item = timeline.createEl('div', {cls: 'timeline-item'});
			
			const marker = item.createEl('div', {cls: 'timeline-marker'});
			const content = item.createEl('div', {cls: 'timeline-content'});

			const header = content.createEl('div', {cls: 'meeting-header'});
			const titleLink = header.createEl('a', {
				text: meeting.date,
				cls: 'meeting-title',
				href: meeting.filePath
			});
			
			titleLink.addEventListener('click', (e) => {
				e.preventDefault();
				this.app.workspace.openLinkText(meeting.filePath, '', false);
			});

			if (meeting.mood) {
				header.createEl('span', {
					text: meeting.mood,
					cls: 'meeting-mood'
				});
			}

			if (meeting.topics.length > 0) {
				const topicsDiv = content.createEl('div', {cls: 'meeting-topics'});
				topicsDiv.createEl('strong', {text: 'Topics: '});
				topicsDiv.createEl('span', {text: meeting.topics.join(', ')});
			}

			if (meeting.themes.length > 0) {
				const themesDiv = content.createEl('div', {cls: 'meeting-themes'});
				for (const theme of meeting.themes) {
					themesDiv.createEl('span', {text: theme, cls: 'theme-badge'});
				}
			}

			if (meeting.actionItems.length > 0) {
				const actionsDiv = content.createEl('div', {cls: 'meeting-actions'});
				actionsDiv.createEl('strong', {text: 'Action Items:'});
				
				const actionsList = actionsDiv.createEl('ul', {cls: 'actions-list'});
				for (const action of meeting.actionItems) {
					const li = actionsList.createEl('li', {
						cls: action.completed ? 'action-completed' : 'action-pending'
					});
					li.createEl('span', {text: action.completed ? '✓' : '○', cls: 'action-checkbox'});
					li.createEl('span', {text: action.text, cls: 'action-text'});
				}
			}
		}
	}

	async onClose(): Promise<void> {
		// Cleanup if needed
	}
}

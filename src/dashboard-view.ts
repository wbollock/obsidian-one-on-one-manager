// ABOUTME: Dashboard view showing 1:1 analytics and visualizations
// ABOUTME: Displays meeting frequency, themes, action items, and mood trends
import {ItemView, WorkspaceLeaf} from 'obsidian';
import OneOnOneManager from './main';
import {MeetingAnalyzer} from './analyzer';

export const DASHBOARD_VIEW_TYPE = 'one-on-one-dashboard';

export class DashboardView extends ItemView {
	plugin: OneOnOneManager;
	analyzer: MeetingAnalyzer;

	constructor(leaf: WorkspaceLeaf, plugin: OneOnOneManager) {
		super(leaf);
		this.plugin = plugin;
		this.analyzer = new MeetingAnalyzer(this.app, plugin.settings);
	}

	getViewType(): string {
		return DASHBOARD_VIEW_TYPE;
	}

	getDisplayText(): string {
		return '1:1 Dashboard';
	}

	getIcon(): string {
		return 'bar-chart';
	}

	async onOpen(): Promise<void> {
		await this.render();
	}

	async render(): Promise<void> {
		const container = this.containerEl.children[1];
		if (!container) return;
		
		container.empty();

		const contentEl = container.createEl('div', {cls: 'one-on-one-dashboard'});

		contentEl.createEl('h1', {text: '1:1 Dashboard', cls: 'dashboard-title'});

		const meetings = await this.analyzer.getAllMeetings();
		const people = await this.analyzer.getAllPeople();

		await this.renderOverview(contentEl, meetings, people);
		await this.renderPeopleSection(contentEl, people);
		await this.renderThemesSection(contentEl, meetings);
		await this.renderActionItemsSection(contentEl, meetings);
	}

	private async renderOverview(container: HTMLElement, meetings: any[], people: string[]): Promise<void> {
		const section = container.createEl('div', {cls: 'dashboard-section'});
		section.createEl('h2', {text: 'Overview'});

		const stats = section.createEl('div', {cls: 'stats-grid'});

		this.createStatCard(stats, 'Total People', people.length.toString(), '👥');
		this.createStatCard(stats, 'Total Meetings', meetings.length.toString(), '📅');
		
		const thisMonth = meetings.filter(m => {
			const meetingDate = new Date(m.date);
			const now = new Date();
			return meetingDate.getMonth() === now.getMonth() && 
			       meetingDate.getFullYear() === now.getFullYear();
		}).length;
		this.createStatCard(stats, 'This Month', thisMonth.toString(), '📊');

		const allActions = meetings.flatMap(m => m.actionItems);
		const completedActions = allActions.filter(a => a.completed).length;
		const completionRate = allActions.length > 0 
			? Math.round((completedActions / allActions.length) * 100) 
			: 0;
		this.createStatCard(stats, 'Action Items Done', `${completionRate}%`, '✓');
	}

	private createStatCard(container: HTMLElement, label: string, value: string, icon: string): void {
		const card = container.createEl('div', {cls: 'stat-card'});
		card.createEl('div', {text: icon, cls: 'stat-icon'});
		card.createEl('div', {text: value, cls: 'stat-value'});
		card.createEl('div', {text: label, cls: 'stat-label'});
	}

	private async renderPeopleSection(container: HTMLElement, people: string[]): Promise<void> {
		const section = container.createEl('div', {cls: 'dashboard-section'});
		section.createEl('h2', {text: 'Team Members'});

		const grid = section.createEl('div', {cls: 'people-grid'});

		for (const person of people) {
			const stats = await this.analyzer.getPersonStats(person);
			const card = grid.createEl('div', {cls: 'person-card'});

			const header = card.createEl('div', {cls: 'person-header'});
			header.createEl('h3', {text: person});
			
			const meetingCount = card.createEl('div', {cls: 'person-stat'});
			meetingCount.createEl('span', {text: 'Meetings: '});
			meetingCount.createEl('strong', {text: stats.meetingCount.toString()});

			const lastMeeting = card.createEl('div', {cls: 'person-stat'});
			lastMeeting.createEl('span', {text: 'Last: '});
			lastMeeting.createEl('strong', {text: stats.lastMeeting});

			const completion = card.createEl('div', {cls: 'person-stat'});
			completion.createEl('span', {text: 'Action Items: '});
			completion.createEl('strong', {text: `${Math.round(stats.actionItemCompletion)}%`});

			if (stats.commonThemes.size > 0) {
				const themesDiv = card.createEl('div', {cls: 'person-themes'});
				const sortedThemes = Array.from(stats.commonThemes.entries())
					.sort((a, b) => b[1] - a[1])
					.slice(0, 3);
				
				for (const [theme, count] of sortedThemes) {
					themesDiv.createEl('span', {
						text: `${theme} (${count})`,
						cls: 'theme-badge'
					});
				}
			}

			card.addEventListener('click', () => {
				this.plugin.openTimelineView(person);
			});
		}
	}

	private async renderThemesSection(container: HTMLElement, meetings: any[]): Promise<void> {
		const section = container.createEl('div', {cls: 'dashboard-section'});
		section.createEl('h2', {text: 'Common Themes'});

		const themeCount = new Map<string, number>();
		for (const meeting of meetings) {
			for (const theme of meeting.themes) {
				themeCount.set(theme, (themeCount.get(theme) || 0) + 1);
			}
		}

		const sorted = Array.from(themeCount.entries()).sort((a, b) => b[1] - a[1]);
		
		const chart = section.createEl('div', {cls: 'bar-chart'});
		const maxCount = sorted[0]?.[1] || 1;

		for (const [theme, count] of sorted) {
			const bar = chart.createEl('div', {cls: 'bar-item'});
			const percentage = (count / maxCount) * 100;
			
			bar.createEl('div', {text: theme, cls: 'bar-label'});
			const barContainer = bar.createEl('div', {cls: 'bar-container'});
			barContainer.createEl('div', {
				cls: 'bar-fill',
				attr: {style: `width: ${percentage}%`}
			});
			bar.createEl('div', {text: count.toString(), cls: 'bar-count'});
		}
	}

	private async renderActionItemsSection(container: HTMLElement, meetings: any[]): Promise<void> {
		const section = container.createEl('div', {cls: 'dashboard-section'});
		section.createEl('h2', {text: 'Outstanding Action Items'});

		const allActions = meetings.flatMap(m => 
			m.actionItems.map((a: any) => ({...a, person: m.person, meetingDate: m.date}))
		);

		const incomplete = allActions.filter(a => !a.completed);
		
		if (incomplete.length === 0) {
			section.createEl('p', {text: 'All action items completed! 🎉'});
			return;
		}

		const list = section.createEl('div', {cls: 'action-items-list'});

		for (const action of incomplete.slice(0, 10)) {
			const item = list.createEl('div', {cls: 'action-item'});
			
			const checkbox = item.createEl('input', {type: 'checkbox'});
			checkbox.checked = false;
			
			const text = item.createEl('span', {text: action.text, cls: 'action-text'});
			
			const meta = item.createEl('span', {cls: 'action-meta'});
			meta.createEl('span', {text: action.person});
			if (action.dueDate) {
				meta.createEl('span', {text: ` • Due: ${action.dueDate}`});
			}
		}

		if (incomplete.length > 10) {
			section.createEl('p', {
				text: `... and ${incomplete.length - 10} more`,
				cls: 'action-overflow'
			});
		}
	}

	async onClose(): Promise<void> {
		// Cleanup if needed
	}
}

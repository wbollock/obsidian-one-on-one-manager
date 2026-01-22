// ABOUTME: Coaching plan view for managing development plans per person
// ABOUTME: Shows focus areas, growth experiments, feedback to deliver, and discussion patterns
import {ItemView, WorkspaceLeaf, Notice} from 'obsidian';
import OneOnOneManager from './main';
import {CoachingPlan, FocusArea, GrowthExperiment, FeedbackItem} from './types';
import {MeetingAnalyzer} from './analyzer';

export const COACHING_PLAN_VIEW_TYPE = 'coaching-plan-view';

export class CoachingPlanView extends ItemView {
	plugin: OneOnOneManager;
	person: string;
	analyzer: MeetingAnalyzer;

	constructor(leaf: WorkspaceLeaf, plugin: OneOnOneManager, person: string) {
		super(leaf);
		this.plugin = plugin;
		this.person = person;
		this.analyzer = new MeetingAnalyzer(this.app, plugin.settings);
	}

	getViewType(): string {
		return COACHING_PLAN_VIEW_TYPE;
	}

	getDisplayText(): string {
		return `Coaching Plan: ${this.person}`;
	}

	getIcon(): string {
		return 'target';
	}

	async onOpen(): Promise<void> {
		await this.render();
	}

	async render(): Promise<void> {
		const container = this.containerEl.children[1];
		if (!container) return;
		
		container.empty();

		const contentEl = container.createEl('div', {cls: 'coaching-plan-view'});

		const headerDiv = contentEl.createEl('div', {cls: 'coaching-header'});
		headerDiv.createEl('h1', {text: `Coaching Plan: ${this.person}`});

		const actionsDiv = headerDiv.createEl('div', {cls: 'coaching-actions'});
		
		const openFileBtn = actionsDiv.createEl('button', {
			text: 'Open Plan File',
			cls: 'coaching-action-btn'
		});
		openFileBtn.addEventListener('click', async () => {
			const folder = this.plugin.settings.coachingPlansFolder;
			const fileName = `${this.person.replace(/\s+/g, '-')}-coaching-plan.md`;
			const filePath = `${folder}/${fileName}`;
			await this.app.workspace.openLinkText(filePath, '', false);
		});

		const viewTimelineBtn = actionsDiv.createEl('button', {
			text: 'View Timeline',
			cls: 'coaching-action-btn'
		});
		viewTimelineBtn.addEventListener('click', () => {
			this.plugin.openTimelineView(this.person);
		});

		let plan = await this.plugin.peopleManager.getCoachingPlan(this.person);
		
		if (!plan) {
			plan = await this.createDefaultPlan();
		}

		await this.renderPlanSummary(contentEl, plan);
		await this.renderFocusAreas(contentEl, plan);
		await this.renderGrowthExperiments(contentEl, plan);
		await this.renderFeedback(contentEl, plan);
		await this.renderDiscussionPatterns(contentEl, plan);
		await this.renderTopicHistory(contentEl);
	}

	private async createDefaultPlan(): Promise<CoachingPlan> {
		const stats = await this.analyzer.getPersonStats(this.person);
		const profile = (await this.plugin.peopleManager.getAllPeople())
			.find(p => p.name === this.person);

		const plan: CoachingPlan = {
			person: this.person,
			role: profile?.role,
			level: profile?.level,
			focusAreas: [],
			growthExperiments: [],
			feedbackToDeliver: [],
			discussionPatterns: stats.commonThemes,
			concerns: []
		};

		await this.plugin.peopleManager.saveCoachingPlan(plan);
		return plan;
	}

	private async renderPlanSummary(container: HTMLElement, plan: CoachingPlan): Promise<void> {
		const section = container.createEl('div', {cls: 'coaching-section'});
		section.createEl('h2', {text: 'Overview'});

		const grid = section.createEl('div', {cls: 'stats-grid'});

		if (plan.role) {
			const roleCard = grid.createEl('div', {cls: 'stat-card'});
			roleCard.createEl('div', {text: '💼', cls: 'stat-icon'});
			roleCard.createEl('div', {text: plan.role, cls: 'stat-value-text'});
			roleCard.createEl('div', {text: 'Role', cls: 'stat-label'});
		}

		if (plan.level) {
			const levelCard = grid.createEl('div', {cls: 'stat-card'});
			levelCard.createEl('div', {text: '📊', cls: 'stat-icon'});
			const levelText = plan.targetLevel ? `${plan.level} → ${plan.targetLevel}` : plan.level;
			levelCard.createEl('div', {text: levelText, cls: 'stat-value-text'});
			levelCard.createEl('div', {text: 'Level', cls: 'stat-label'});
		}

		const focusCard = grid.createEl('div', {cls: 'stat-card'});
		focusCard.createEl('div', {text: '🎯', cls: 'stat-icon'});
		focusCard.createEl('div', {text: plan.focusAreas.length.toString(), cls: 'stat-value'});
		focusCard.createEl('div', {text: 'Focus Areas', cls: 'stat-label'});

		const feedbackCard = grid.createEl('div', {cls: 'stat-card'});
		feedbackCard.createEl('div', {text: '💬', cls: 'stat-icon'});
		const pendingFeedback = plan.feedbackToDeliver.filter(f => !f.delivered).length;
		feedbackCard.createEl('div', {text: pendingFeedback.toString(), cls: 'stat-value'});
		feedbackCard.createEl('div', {text: 'Pending Feedback', cls: 'stat-label'});
	}

	private async renderFocusAreas(container: HTMLElement, plan: CoachingPlan): Promise<void> {
		const section = container.createEl('div', {cls: 'coaching-section'});
		section.createEl('h2', {text: 'Focus Areas'});

		if (plan.focusAreas.length === 0) {
			section.createEl('p', {
				text: 'No focus areas defined. Open the plan file to add focus areas.',
				cls: 'empty-state'
			});
			return;
		}

		const list = section.createEl('div', {cls: 'focus-areas-list'});
		
		for (const area of plan.focusAreas) {
			const item = list.createEl('div', {cls: `focus-area-item priority-${area.priority}`});
			
			const header = item.createEl('div', {cls: 'focus-area-header'});
			header.createEl('h3', {text: area.title});
			
			const badges = header.createEl('div', {cls: 'focus-area-badges'});
			badges.createEl('span', {text: area.priority, cls: 'badge badge-priority'});
			badges.createEl('span', {text: area.status, cls: `badge badge-${area.status}`});
			
			item.createEl('p', {text: area.description, cls: 'focus-area-description'});
		}
	}

	private async renderGrowthExperiments(container: HTMLElement, plan: CoachingPlan): Promise<void> {
		const section = container.createEl('div', {cls: 'coaching-section'});
		section.createEl('h2', {text: 'Growth Experiments'});

		if (plan.growthExperiments.length === 0) {
			section.createEl('p', {
				text: 'No growth experiments yet. Open the plan file to add experiments.',
				cls: 'empty-state'
			});
			return;
		}

		const list = section.createEl('div', {cls: 'experiments-list'});
		
		for (const exp of plan.growthExperiments) {
			const item = list.createEl('div', {cls: 'experiment-item'});
			
			const checkbox = item.createEl('input', {type: 'checkbox'});
			checkbox.checked = exp.status === 'completed';
			checkbox.disabled = true;
			
			const content = item.createEl('div', {cls: 'experiment-content'});
			content.createEl('strong', {text: exp.title});
			content.createEl('p', {text: exp.description});
			
			if (exp.outcome) {
				const outcome = content.createEl('div', {cls: 'experiment-outcome'});
				outcome.createEl('strong', {text: 'Outcome: '});
				outcome.createEl('span', {text: exp.outcome});
			}
			
			const meta = content.createEl('div', {cls: 'experiment-meta'});
			meta.createEl('span', {text: `Status: ${exp.status}`, cls: `badge badge-${exp.status}`});
		}
	}

	private async renderFeedback(container: HTMLElement, plan: CoachingPlan): Promise<void> {
		const section = container.createEl('div', {cls: 'coaching-section'});
		section.createEl('h2', {text: 'Feedback to Deliver'});

		if (plan.feedbackToDeliver.length === 0) {
			section.createEl('p', {
				text: 'No pending feedback. Open the plan file to add feedback items.',
				cls: 'empty-state'
			});
			return;
		}

		const list = section.createEl('div', {cls: 'feedback-list'});
		
		const pending = plan.feedbackToDeliver.filter(f => !f.delivered);
		const delivered = plan.feedbackToDeliver.filter(f => f.delivered);

		if (pending.length > 0) {
			for (const item of pending) {
				const feedbackItem = list.createEl('div', {cls: 'feedback-item feedback-pending'});
				
				const checkbox = feedbackItem.createEl('input', {type: 'checkbox'});
				checkbox.checked = false;
				checkbox.disabled = true;
				
				const content = feedbackItem.createEl('div', {cls: 'feedback-content'});
				content.createEl('p', {text: item.feedback});
				
				const meta = content.createEl('div', {cls: 'feedback-meta'});
				meta.createEl('span', {text: `Priority: ${item.priority}`, cls: `badge badge-${item.priority}`});
				meta.createEl('span', {text: `Created: ${item.dateCreated}`});
			}
		}

		if (delivered.length > 0) {
			section.createEl('h3', {text: 'Delivered Feedback'});
			for (const item of delivered) {
				const feedbackItem = list.createEl('div', {cls: 'feedback-item feedback-delivered'});
				
				const checkbox = feedbackItem.createEl('input', {type: 'checkbox'});
				checkbox.checked = true;
				checkbox.disabled = true;
				
				const content = feedbackItem.createEl('div', {cls: 'feedback-content'});
				content.createEl('p', {text: item.feedback});
				
				if (item.dateDelivered) {
					content.createEl('div', {text: `Delivered: ${item.dateDelivered}`, cls: 'feedback-delivered-date'});
				}
			}
		}
	}

	private async renderDiscussionPatterns(container: HTMLElement, plan: CoachingPlan): Promise<void> {
		const section = container.createEl('div', {cls: 'coaching-section'});
		section.createEl('h2', {text: 'Discussion Patterns'});

		if (plan.discussionPatterns.size === 0) {
			section.createEl('p', {text: 'No discussion patterns yet.', cls: 'empty-state'});
			return;
		}

		const chart = section.createEl('div', {cls: 'bar-chart'});
		const sorted = Array.from(plan.discussionPatterns.entries())
			.sort((a, b) => b[1] - a[1]);
		const maxCount = sorted[0]?.[1] || 1;

		for (const [topic, count] of sorted) {
			const bar = chart.createEl('div', {cls: 'bar-item'});
			const percentage = (count / maxCount) * 100;
			
			bar.createEl('div', {text: topic, cls: 'bar-label'});
			const barContainer = bar.createEl('div', {cls: 'bar-container'});
			barContainer.createEl('div', {
				cls: 'bar-fill',
				attr: {style: `width: ${percentage}%`}
			});
			bar.createEl('div', {text: count.toString(), cls: 'bar-count'});
		}
	}

	private async renderTopicHistory(container: HTMLElement): Promise<void> {
		const section = container.createEl('div', {cls: 'coaching-section'});
		section.createEl('h2', {text: 'All Topics Discussed'});

		const meetings = await this.analyzer.getAllMeetings();
		const personMeetings = meetings.filter(m => m.person === this.person);

		const allTopics = new Map<string, string[]>();
		
		for (const meeting of personMeetings) {
			for (const topic of meeting.topics) {
				if (!allTopics.has(topic)) {
					allTopics.set(topic, []);
				}
				allTopics.get(topic)?.push(meeting.date);
			}
		}

		if (allTopics.size === 0) {
			section.createEl('p', {text: 'No topics recorded yet.', cls: 'empty-state'});
			return;
		}

		const topicsList = section.createEl('div', {cls: 'topics-history-list'});
		
		const sortedTopics = Array.from(allTopics.entries())
			.sort((a, b) => b[1].length - a[1].length);

		for (const [topic, dates] of sortedTopics) {
			const item = topicsList.createEl('div', {cls: 'topic-history-item'});
			
			const header = item.createEl('div', {cls: 'topic-history-header'});
			header.createEl('strong', {text: topic});
			header.createEl('span', {
				text: `${dates.length} time${dates.length > 1 ? 's' : ''}`,
				cls: 'topic-count-badge'
			});
			
			const datesList = item.createEl('div', {cls: 'topic-dates'});
			datesList.createEl('span', {text: dates.sort().reverse().join(', ')});
		}
	}

	async onClose(): Promise<void> {
		// Cleanup if needed
	}
}

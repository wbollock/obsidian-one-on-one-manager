// ABOUTME: View component for displaying and managing person goals
// ABOUTME: Shows current year goals, archived goals, and provides year-over-year comparison
import {ItemView, WorkspaceLeaf, Notice} from 'obsidian';
import OneOnOneManager from './main';
import {GoalsManager} from './goals-manager';
import {Goal, GoalStats} from './types';
import {GoalModal} from './goal-modal';
import {ConfirmModal} from './confirm-modal';

export const GOALS_VIEW_TYPE = 'one-on-one-goals-view';

export class GoalsView extends ItemView {
	plugin: OneOnOneManager;
	goalsManager: GoalsManager;
	person: string;
	selectedYear: number;

	constructor(leaf: WorkspaceLeaf, plugin: OneOnOneManager, person: string) {
		super(leaf);
		this.plugin = plugin;
		this.goalsManager = new GoalsManager(this.app, plugin.settings);
		this.person = person;
		this.selectedYear = new Date().getFullYear();
	}

	getViewType(): string {
		return GOALS_VIEW_TYPE;
	}

	getDisplayText(): string {
		return `Goals - ${this.person}`;
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
		if (!(container instanceof HTMLElement)) return;
		container.addClass('one-on-one-goals-view');

		// Header
		const header = container.createEl('div', {cls: 'goals-header'});
		header.createEl('h1', {text: `🎯 Goals for ${this.person}`});

		// Year selector and actions
		const toolbar = header.createEl('div', {cls: 'goals-toolbar'});

		const yearSelector = toolbar.createEl('select', {cls: 'year-selector'});
		const years = await this.goalsManager.getGoalYears(this.person);
		const currentYear = new Date().getFullYear();
		
		// Ensure current year is in the list
		if (!years.includes(currentYear)) {
			years.unshift(currentYear);
		}

		years.forEach(year => {
			const option = yearSelector.createEl('option', {
				text: year === currentYear ? `${year} (Current)` : year.toString(),
				value: year.toString()
			});
			if (year === this.selectedYear) {
				option.selected = true;
			}
		});

		yearSelector.addEventListener('change', () => {
			this.selectedYear = parseInt(yearSelector.value);
			void this.render();
		});

		const addGoalBtn = toolbar.createEl('button', {
			text: '+ new goal',
			cls: 'mod-cta'
		});
		addGoalBtn.addEventListener('click', () => {
			new GoalModal(this.app, this.plugin, this.person, null, async () => {
				await new Promise(resolve => setTimeout(resolve, 100));
				await this.render();
			}).open();
		});

		// Check if viewing previous year - offer archive option
		if (this.selectedYear < currentYear) {
			const archiveBtn = toolbar.createEl('button', {
				text: '📦 archive this year',
				cls: 'archive-year-btn'
			});
			archiveBtn.addEventListener('click', () => {
				new ConfirmModal(
					this.app,
					`Archive all goals from ${this.selectedYear}? They'll still be viewable but marked as archived.`,
					async () => {
						await this.goalsManager.archiveYearGoals(this.person, this.selectedYear);
						await this.render();
					},
					{title: 'Archive year'}
				).open();
			});
		}

		// Stats summary
		const stats = await this.goalsManager.getGoalStats(this.person, this.selectedYear);
		await this.renderStatsSummary(container, stats);

		// Goals list
		const goals = await this.goalsManager.getPersonGoals(this.person, this.selectedYear);
		const activeGoals = goals.filter(g => !g.archived && g.status !== 'completed' && g.status !== 'abandoned');
		const completedGoals = goals.filter(g => !g.archived && g.status === 'completed');
		const archivedGoals = goals.filter(g => g.archived);

		await this.renderGoalsList(container, 'Active Goals', activeGoals);
		
		if (completedGoals.length > 0) {
			await this.renderGoalsList(container, 'Completed Goals', completedGoals);
		}

		if (archivedGoals.length > 0) {
			await this.renderArchivedGoals(container, archivedGoals);
		}

		// If viewing past year with incomplete goals, offer to carry over
		if (this.selectedYear < currentYear && activeGoals.length > 0) {
			this.renderCarryoverSection(container, activeGoals);
		}
	}

	private async renderStatsSummary(container: HTMLElement, stats: GoalStats): Promise<void> {
		const statsSection = container.createEl('div', {cls: 'goals-stats-section'});

		const statsGrid = statsSection.createEl('div', {cls: 'stats-grid'});

		this.createStatCard(statsGrid, 'Total Goals', stats.total.toString(), '🎯');
		this.createStatCard(statsGrid, 'In Progress', stats.inProgress.toString(), '🔵');
		this.createStatCard(statsGrid, 'Completed', stats.completed.toString(), '✅');
		this.createStatCard(statsGrid, 'At Risk', stats.atRisk.toString(), '🔴');
		
		const avgProgress = Math.round(stats.avgProgress);
		this.createStatCard(statsGrid, 'Avg Progress', `${avgProgress}%`, '📊');
	}

	private createStatCard(container: HTMLElement, label: string, value: string, icon: string): void {
		const card = container.createEl('div', {cls: 'stat-card'});
		card.createEl('div', {text: icon, cls: 'stat-icon'});
		card.createEl('div', {text: value, cls: 'stat-value'});
		card.createEl('div', {text: label, cls: 'stat-label'});
	}

	private async renderGoalsList(container: HTMLElement, title: string, goals: Goal[]): Promise<void> {
		const section = container.createEl('div', {cls: 'goals-section'});
		section.createEl('h2', {text: title});

		if (goals.length === 0) {
			section.createEl('p', {
				text: 'No goals in this category.',
				cls: 'empty-state-text'
			});
			return;
		}

		const goalsList = section.createEl('div', {cls: 'goals-list'});

		goals.forEach(goal => {
			const goalCard = goalsList.createEl('div', {cls: 'goal-card'});
			this.renderGoalCard(goalCard, goal);
		});
	}

	private renderGoalCard(container: HTMLElement, goal: Goal): void {
		const statusEmoji = {
			'not-started': '⚪',
			'in-progress': '🔵',
			'at-risk': '🔴',
			'completed': '✅',
			'abandoned': '⚫'
		}[goal.status];

		// Header
		const header = container.createEl('div', {cls: 'goal-card-header'});
		const titleRow = header.createEl('div', {cls: 'goal-title-row'});
		titleRow.createEl('span', {text: statusEmoji, cls: 'goal-status-emoji'});
		titleRow.createEl('h3', {text: goal.title, cls: 'goal-title'});

		const meta = header.createEl('div', {cls: 'goal-meta'});
		meta.createEl('span', {text: goal.category, cls: 'goal-category'});
		meta.createEl('span', {text: goal.timeframe, cls: 'goal-timeframe'});

		// Progress bar
		const progressSection = container.createEl('div', {cls: 'goal-progress-section'});
		progressSection.createEl('span', {text: `${goal.progress}% complete`, cls: 'progress-label'});
		const progressBar = progressSection.createEl('div', {cls: 'progress-bar'});
		const progressFill = progressBar.createEl('div', {cls: 'progress-fill'});
		progressFill.style.width = `${goal.progress}%`;
		
		// Color code progress
		if (goal.progress >= 75) {
			progressFill.addClass('progress-high');
		} else if (goal.progress >= 40) {
			progressFill.addClass('progress-medium');
		} else {
			progressFill.addClass('progress-low');
		}

		// Description
		container.createEl('p', {text: goal.description, cls: 'goal-description'});

		// Timeline
		const timeline = container.createEl('div', {cls: 'goal-timeline'});
		timeline.createEl('span', {text: `📅 ${goal.startDate} → ${goal.targetDate}`});

		// Key Results
		if (goal.keyResults && goal.keyResults.length > 0) {
			const krSection = container.createEl('div', {cls: 'key-results'});
			krSection.createEl('strong', {text: 'Key results:'});
			const krList = krSection.createEl('ul');
			goal.keyResults.forEach(kr => {
				const li = krList.createEl('li');
				const checkbox = kr.completed ? '☑' : '☐';
				li.createEl('span', {text: `${checkbox} ${kr.description}: ${kr.current} / ${kr.target}`});
			});
		}

		// Blockers
		if (goal.blockers && goal.blockers.length > 0) {
			const blockersSection = container.createEl('div', {cls: 'goal-blockers'});
			blockersSection.createEl('strong', {text: '🚫 blockers:'});
			const blockersList = blockersSection.createEl('ul');
			goal.blockers.forEach(b => {
				blockersList.createEl('li', {text: b});
			});
		}

		// Actions
		const actions = container.createEl('div', {cls: 'goal-actions'});

		const editBtn = actions.createEl('button', {text: '✏️ edit', cls: 'goal-action-btn'});
		editBtn.addEventListener('click', () => {
			new GoalModal(this.app, this.plugin, this.person, goal, async () => {
				await new Promise(resolve => setTimeout(resolve, 100));
				await this.render();
			}).open();
		});

		const checkInBtn = actions.createEl('button', {text: '📝 check-in', cls: 'goal-action-btn'});
		checkInBtn.addEventListener('click', () => {
			// TODO: Open check-in modal
			new Notice('Check-in feature coming soon!');
		});

		const deleteBtn = actions.createEl('button', {text: '🗑️ delete', cls: 'goal-action-btn-danger'});
		deleteBtn.addEventListener('click', () => {
			new ConfirmModal(
				this.app,
				`Delete goal "${goal.title}"?`,
				async () => {
					await this.goalsManager.deleteGoal(this.person, goal.id);
					await this.render();
				},
				{title: 'Delete goal', confirmText: 'Delete', isDestructive: true}
			).open();
		});
	}

	private async carryOverGoals(incompleteGoals: Goal[]): Promise<void> {
		const goalIds = incompleteGoals.map(g => g.id);
		await this.goalsManager.carryoverGoals(this.person, goalIds);
		this.selectedYear = new Date().getFullYear();
		await this.render();
	}

	private async renderArchivedGoals(container: HTMLElement, goals: Goal[]): Promise<void> {
		const section = container.createEl('div', {cls: 'goals-section archived-section'});
		const header = section.createEl('h2', {text: `📦 Archived Goals (${goals.length})`});
		
		const description = section.createEl('p', {cls: 'section-description'});
		description.setText('These goals have been archived from previous years.');

		const completedCount = goals.filter(g => g.status === 'completed').length;
		section.createEl('p', {
			text: `${completedCount} of ${goals.length} archived goals were completed.`,
			cls: 'archived-stats'
		});
	}

	private renderCarryoverSection(container: HTMLElement, incompleteGoals: Goal[]): void {
		const section = container.createEl('div', {cls: 'carryover-section'});
		section.createEl('h2', {text: '🔄 carry over to current year?'});
		
		const description = section.createEl('p');
		description.setText(`You have ${incompleteGoals.length} incomplete goals from ${this.selectedYear}. Would you like to carry them over to ${new Date().getFullYear()}?`);

		const btn = section.createEl('button', {
			text: `Carry Over ${incompleteGoals.length} Goals`,
			cls: 'mod-cta'
		});

		btn.addEventListener('click', () => {
			void this.carryOverGoals(incompleteGoals);
		});
	}

	async onClose(): Promise<void> {
		// Cleanup
	}
}

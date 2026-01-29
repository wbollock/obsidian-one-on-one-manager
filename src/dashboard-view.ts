// ABOUTME: Dashboard view showing 1:1 analytics and visualizations
// ABOUTME: Displays meeting frequency, action items, and mood trends
import {ItemView, WorkspaceLeaf, Notice} from 'obsidian';
import OneOnOneManager from './main';
import {MeetingAnalyzer} from './analyzer';
import {PersonProfileModal} from './person-profile-modal';
import {CreateMeetingModal} from './create-meeting-modal';
import {AgendaItemModal} from './agenda-item-modal';

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
		
		// Save scroll position
		const scrollTop = container.scrollTop;
		
		container.empty();

		const contentEl = container.createEl('div', {cls: 'one-on-one-dashboard'});

		const headerDiv = contentEl.createEl('div', {cls: 'dashboard-header'});
		headerDiv.createEl('h1', {text: '1:1 Dashboard', cls: 'dashboard-title'});
		
		const actionsDiv = headerDiv.createEl('div', {cls: 'dashboard-actions'});
		
		const addPersonBtn = actionsDiv.createEl('button', {
			text: '+ Add Person',
			cls: 'dashboard-action-btn'
		});
		addPersonBtn.addEventListener('click', () => {
			new PersonProfileModal(this.app, this.plugin, null, async (profile) => {
				await this.plugin.peopleManager.savePersonProfile(profile);
				await this.render();
			}).open();
		});

		const refreshBtn = actionsDiv.createEl('button', {
			text: '🔄 Refresh',
			cls: 'dashboard-action-btn'
		});
		refreshBtn.addEventListener('click', async () => {
			await this.render();
			new Notice('Dashboard refreshed');
		});

		const editTemplateBtn = actionsDiv.createEl('button', {
			text: '📝 Edit 1:1 Template',
			cls: 'dashboard-action-btn',
			attr: {title: 'Edit the template used for all future 1:1 meetings'}
		});
		editTemplateBtn.addEventListener('click', async () => {
			try {
				await this.plugin.settingTab.openTemplateInNote();
			} catch (error) {
				console.error('Error opening template from dashboard:', error);
				new Notice('❌ Error opening template. Check console for details.');
			}
		});

		const meetings = await this.analyzer.getAllMeetings();
		const peopleWithMeetings = await this.analyzer.getAllPeople();
		const profiles = await this.plugin.peopleManager.getAllPeople();
		
		// Merge people from meetings and profiles
		const allPeopleSet = new Set<string>();
		for (const person of peopleWithMeetings) {
			allPeopleSet.add(person);
		}
		for (const profile of profiles) {
			allPeopleSet.add(profile.name);
		}
		const people = Array.from(allPeopleSet).sort();

		await this.renderOverview(contentEl, meetings, people);
		await this.renderPeopleSection(contentEl, people, profiles);
		await this.renderActionItemsSection(contentEl, meetings);
		
		// Restore scroll position
		setTimeout(() => {
			container.scrollTop = scrollTop;
		}, 0);
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

	private async renderPeopleSection(container: HTMLElement, people: string[], profiles: any[]): Promise<void> {
		const section = container.createEl('div', {cls: 'dashboard-section'});
		section.createEl('h2', {text: 'Team Members'});

		if (people.length === 0) {
			const emptyState = section.createEl('div', {cls: 'empty-state'});
			emptyState.createEl('div', {text: '👥', cls: 'empty-state-icon'});
			emptyState.createEl('h3', {text: 'No team members yet'});
			const emptyText = emptyState.createEl('p');
			emptyText.setText('Get started by adding a person or creating your first 1:1 note.');
			
			const emptyActions = emptyState.createEl('div', {cls: 'empty-state-actions'});
			const addPersonBtn = emptyActions.createEl('button', {
				text: '+ Add Person',
				cls: 'dashboard-action-btn'
			});
			addPersonBtn.addEventListener('click', () => {
				new PersonProfileModal(this.app, this.plugin, null, async (profile) => {
					await this.plugin.peopleManager.savePersonProfile(profile);
					await this.render();
				}).open();
			});
			
			const createMeetingBtn = emptyActions.createEl('button', {
				text: '+ Create 1:1',
				cls: 'dashboard-action-btn'
			});
			createMeetingBtn.addEventListener('click', () => {
				new CreateMeetingModal(this.app, this.plugin).open();
			});
			
			return;
		}

		const grid = section.createEl('div', {cls: 'people-grid'});

		for (const person of people) {
			const stats = await this.analyzer.getPersonStats(person);
			const profile = profiles.find(p => p.name === person);
			
			const card = grid.createEl('div', {cls: 'person-card'});

			const header = card.createEl('div', {cls: 'person-header'});
			header.createEl('h3', {text: person});
			
			if (profile) {
				if (profile.role) {
					const roleEl = card.createEl('div', {cls: 'person-role'});
					roleEl.createEl('span', {text: profile.role});
					if (profile.level) {
						roleEl.createEl('span', {text: ` (${profile.level})`, cls: 'person-level'});
					}
				}
			}
			
			const meetingCount = card.createEl('div', {cls: 'person-stat'});
			meetingCount.createEl('span', {text: 'Meetings: '});
			meetingCount.createEl('strong', {text: stats.meetingCount.toString()});

			const lastMeeting = card.createEl('div', {cls: 'person-stat'});
			lastMeeting.createEl('span', {text: 'Last: '});
			lastMeeting.createEl('strong', {text: stats.lastMeeting});

		const completion = card.createEl('div', {cls: 'person-stat'});
		completion.createEl('span', {text: 'Open Action Items: '});
		completion.createEl('strong', {text: stats.actionItemCompletion.toString()});

		// Show agenda items
		if (profile?.agendaItems && profile.agendaItems.length > 0) {
			const pendingItems = profile.agendaItems.filter((item: any) => !item.completed);
			if (pendingItems.length > 0) {
				const agendaSection = card.createEl('div', {cls: 'person-agenda-section'});
				const agendaHeader = agendaSection.createEl('div', {cls: 'person-agenda-header'});
				agendaHeader.createEl('span', {text: '📋 Agenda Items', cls: 'person-agenda-title'});
				agendaHeader.createEl('span', {text: `(${pendingItems.length})`, cls: 'person-agenda-count'});

				const agendaList = agendaSection.createEl('div', {cls: 'person-agenda-list'});
				for (const item of pendingItems.slice(0, 3)) {
					const agendaItem = agendaList.createEl('div', {cls: 'person-agenda-item'});
					
					const checkbox = agendaItem.createEl('input', {type: 'checkbox'});
					checkbox.checked = false;
					checkbox.addEventListener('click', async (e) => {
						e.stopPropagation();
						await this.plugin.peopleManager.toggleAgendaItem(person, item.id);
						// Just remove the item from DOM
						agendaItem.remove();
						// Update count
						const countEl = agendaHeader.querySelector('.person-agenda-count');
						if (countEl) {
							const newCount = pendingItems.length - 1;
							countEl.textContent = `(${newCount})`;
							if (newCount === 0) {
								agendaSection.remove();
							}
						}
					});
					
					const text = agendaItem.createEl('span', {text: item.text, cls: 'person-agenda-text'});
					if (item.priority === 'high') {
						text.style.fontWeight = '600';
						text.style.color = 'var(--text-error)';
					}
					
					const deleteBtn = agendaItem.createEl('button', {
						text: '×',
						cls: 'person-agenda-delete'
					});
					deleteBtn.addEventListener('click', async (e) => {
						e.stopPropagation();
						await this.plugin.peopleManager.removeAgendaItem(person, item.id);
						// Just remove the item from DOM
						agendaItem.remove();
						// Update count
						const countEl = agendaHeader.querySelector('.person-agenda-count');
						if (countEl) {
							const newCount = pendingItems.length - 1;
							countEl.textContent = `(${newCount})`;
							if (newCount === 0) {
								agendaSection.remove();
							}
						}
					});
				}

				if (pendingItems.length > 3) {
					agendaSection.createEl('div', {
						text: `... and ${pendingItems.length - 3} more`,
						cls: 'person-agenda-more'
					});
				}
			}
		}

		const actionsDiv = card.createEl('div', {cls: 'person-actions'});
		
		const addAgendaBtn = actionsDiv.createEl('button', {
			text: '+ Agenda',
			cls: 'person-action-btn-small',
			attr: {title: 'Add agenda item'}
		});
		addAgendaBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			new AgendaItemModal(this.app, this.plugin, person, async (newItem) => {
				// Dynamically add the new item to the card without refreshing
				let agendaSection = card.querySelector('.person-agenda-section') as HTMLElement;
				
				if (!agendaSection) {
					// Create agenda section if it doesn't exist
					agendaSection = card.createEl('div', {cls: 'person-agenda-section'});
					const agendaHeader = agendaSection.createEl('div', {cls: 'person-agenda-header'});
					agendaHeader.createEl('span', {text: '📋 Agenda Items', cls: 'person-agenda-title'});
					agendaHeader.createEl('span', {text: '(1)', cls: 'person-agenda-count'});
					agendaSection.createEl('div', {cls: 'person-agenda-list'});
					
					// Insert before actions div
					card.insertBefore(agendaSection, actionsDiv);
				} else {
					// Update count
					const countEl = agendaSection.querySelector('.person-agenda-count');
					if (countEl) {
						const currentCount = parseInt(countEl.textContent?.replace(/[()]/g, '') || '0');
						countEl.textContent = `(${currentCount + 1})`;
					}
				}
				
				// Add the new item to the list
				const agendaList = agendaSection.querySelector('.person-agenda-list');
				if (agendaList) {
					const agendaItem = agendaList.createEl('div', {cls: 'person-agenda-item'});
					
					const checkbox = agendaItem.createEl('input', {type: 'checkbox'});
					checkbox.checked = false;
					checkbox.addEventListener('click', async (clickE) => {
						clickE.stopPropagation();
						await this.plugin.peopleManager.toggleAgendaItem(person, newItem.id);
						agendaItem.remove();
						const countEl = agendaSection.querySelector('.person-agenda-count');
						if (countEl) {
							const currentCount = parseInt(countEl.textContent?.replace(/[()]/g, '') || '0');
							const newCount = currentCount - 1;
							countEl.textContent = `(${newCount})`;
							if (newCount === 0) {
								agendaSection.remove();
							}
						}
					});
					
					const text = agendaItem.createEl('span', {text: newItem.text, cls: 'person-agenda-text'});
					if (newItem.priority === 'high') {
						text.style.fontWeight = '600';
						text.style.color = 'var(--text-error)';
					}
					
					const deleteBtn = agendaItem.createEl('button', {
						text: '×',
						cls: 'person-agenda-delete'
					});
					deleteBtn.addEventListener('click', async (clickE) => {
						clickE.stopPropagation();
						await this.plugin.peopleManager.removeAgendaItem(person, newItem.id);
						agendaItem.remove();
						const countEl = agendaSection.querySelector('.person-agenda-count');
						if (countEl) {
							const currentCount = parseInt(countEl.textContent?.replace(/[()]/g, '') || '0');
							const newCount = currentCount - 1;
							countEl.textContent = `(${newCount})`;
							if (newCount === 0) {
								agendaSection.remove();
							}
						}
					});
				}
			}).open();
		});
		
		const create11Btn = actionsDiv.createEl('button', {
			text: '+ New 1:1',
			cls: 'person-action-btn'
		});
		create11Btn.addEventListener('click', (e) => {
			e.stopPropagation();
			const modal = new CreateMeetingModal(this.app, this.plugin);
			modal.person = person;
			modal.open();
		});

		const goalsBtn = actionsDiv.createEl('button', {
			text: '🎯 Goals',
			cls: 'person-action-btn-small',
			attr: {title: 'View goals'}
		});
		goalsBtn.addEventListener('click', async (e) => {
			e.stopPropagation();
			await this.plugin.openGoalsView(person);
		});

		const editBtn = actionsDiv.createEl('button', {
			text: 'Edit',
			cls: 'person-action-btn-small',
			attr: {title: 'Edit profile'}
		});
		editBtn.addEventListener('click', async (e) => {
			e.stopPropagation();
			new PersonProfileModal(this.app, this.plugin, profile, async (updatedProfile) => {
				await this.plugin.peopleManager.savePersonProfile(updatedProfile);
				// Just update the role/level display in the card
				const roleEl = card.querySelector('.person-role');
				if (roleEl) {
					roleEl.empty();
					if (updatedProfile.role) {
						roleEl.createEl('span', {text: updatedProfile.role});
						if (updatedProfile.level) {
							roleEl.createEl('span', {text: ` (${updatedProfile.level})`, cls: 'person-level'});
						}
					}
				}
			}).open();
		});

		const deleteBtn = actionsDiv.createEl('button', {
			text: 'Delete',
			cls: 'person-action-btn-small person-action-btn-delete',
			attr: {title: 'Delete person'}
		});
		deleteBtn.addEventListener('click', async (e) => {
			e.stopPropagation();
			const confirmed = confirm(`Are you sure you want to delete ${person}? This will only remove the profile, not the 1:1 meeting notes.`);
			if (confirmed) {
				await this.plugin.peopleManager.deletePersonProfile(person);
				new Notice(`Deleted ${person}`);
				// Just remove the card from DOM
				card.remove();
			}
		});

			card.addEventListener('click', () => {
				this.plugin.openTimelineView(person);
			});
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
			const emptyState = section.createEl('div', {cls: 'empty-state-success'});
			emptyState.createEl('div', {text: '🎉', cls: 'empty-state-icon'});
			emptyState.createEl('h3', {text: 'All action items completed!'});
			emptyState.createEl('p', {text: 'Great work! No outstanding action items at the moment.'});
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

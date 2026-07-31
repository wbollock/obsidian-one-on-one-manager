// ABOUTME: Dashboard view showing 1:1 analytics and visualizations
// ABOUTME: Displays meeting frequency, action items, and mood trends
import {ItemView, WorkspaceLeaf, Notice, setIcon} from 'obsidian';
import OneOnOneManager from './main';
import {MeetingAnalyzer} from './analyzer';
import {PersonProfileModal} from './person-profile-modal';
import {CreateMeetingModal} from './create-meeting-modal';
import {AgendaItemModal} from './agenda-item-modal';
import {PersonPickerModal} from './person-picker-modal';
import {ConfirmModal} from './confirm-modal';
import {AgendaItem, OneOnOneMeeting, PersonProfile} from './types';

export const DASHBOARD_VIEW_TYPE = 'one-on-one-dashboard';

export class DashboardView extends ItemView {
	plugin: OneOnOneManager;
	analyzer: MeetingAnalyzer;
	private expandedPeople: Set<string> = new Set();

	constructor(leaf: WorkspaceLeaf, plugin: OneOnOneManager) {
		super(leaf);
		this.plugin = plugin;
		this.analyzer = new MeetingAnalyzer(this.app, plugin.settings);
	}

	getViewType(): string {
		return DASHBOARD_VIEW_TYPE;
	}

	getDisplayText(): string {
		return '1:1 dashboard';
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

		const headerDiv = contentEl.createEl('div', {cls: 'dashboard-header'});
		headerDiv.createEl('h2', {text: '1:1 dashboard', cls: 'dashboard-title'});

		const actionsDiv = headerDiv.createEl('div', {cls: 'dashboard-actions'});

		const quickCreateBtn = actionsDiv.createEl('button', {
			cls: 'dashboard-action-btn clickable-icon',
			attr: {title: 'New 1:1', 'aria-label': 'New 1:1'}
		});
		setIcon(quickCreateBtn, 'calendar-plus');
		quickCreateBtn.addEventListener('click', () => {
			if (people.length === 0) {
				new Notice('Add a direct report first');
				return;
			}
			new PersonPickerModal(this.app, people, (person) => {
				const modal = new CreateMeetingModal(this.app, this.plugin, async () => {
					await new Promise(resolve => setTimeout(resolve, 100));
					await this.render();
				});
				modal.person = person;
				modal.open();
			}).open();
		});

		const addPersonBtn = actionsDiv.createEl('button', {
			cls: 'dashboard-action-btn clickable-icon',
			attr: {title: 'Add person', 'aria-label': 'Add person'}
		});
		setIcon(addPersonBtn, 'user-plus');
		addPersonBtn.addEventListener('click', () => {
			new PersonProfileModal(this.app, this.plugin, null, async (profile) => {
				try {
					await this.plugin.peopleManager.savePersonProfile(profile);
					await new Promise(resolve => setTimeout(resolve, 100));
					await this.render();
					new Notice(`✓ Added ${profile.name}`);
				} catch (error) {
					console.error('Error adding person:', error);
					new Notice('❌ error adding person');
				}
			}).open();
		});

		const refreshBtn = actionsDiv.createEl('button', {
			cls: 'dashboard-action-btn clickable-icon',
			attr: {title: 'Refresh', 'aria-label': 'Refresh'}
		});
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.addEventListener('click', () => {
			void this.handleRefreshClick();
		});

		const editTemplateBtn = actionsDiv.createEl('button', {
			cls: 'dashboard-action-btn clickable-icon',
			attr: {title: 'Edit 1:1 template', 'aria-label': 'Edit 1:1 template'}
		});
		setIcon(editTemplateBtn, 'pencil');
		editTemplateBtn.addEventListener('click', () => {
			void this.handleEditTemplateClick();
		});

		await this.renderOverview(contentEl, meetings, people);
		await this.renderPeopleSection(contentEl, people, profiles);
		await this.renderActionItemsSection(contentEl, meetings);
		
		// Restore scroll position
		setTimeout(() => {
			container.scrollTop = scrollTop;
		}, 0);
	}

	private async handleRefreshClick(): Promise<void> {
		await this.render();
		new Notice('Dashboard refreshed');
	}

	private async handleEditTemplateClick(): Promise<void> {
		try {
			await this.plugin.settingTab.openTemplateInNote();
		} catch (error) {
			console.error('Error opening template from dashboard:', error);
			new Notice('❌ error opening template. Check console for details.');
		}
	}

	private async renderOverview(container: HTMLElement, meetings: OneOnOneMeeting[], people: string[]): Promise<void> {
		const stats = container.createEl('div', {cls: 'stats-grid'});

		const thisMonth = meetings.filter(m => {
			const meetingDate = new Date(m.date);
			const now = new Date();
			return meetingDate.getMonth() === now.getMonth() && 
			       meetingDate.getFullYear() === now.getFullYear();
		}).length;

		const allActions = meetings.flatMap(m => m.actionItems);
		const completedActions = allActions.filter(a => a.completed).length;
		const completionRate = allActions.length > 0 
			? Math.round((completedActions / allActions.length) * 100) 
			: 0;

		this.createStatCard(stats, 'People', people.length.toString(), '👥');
		this.createStatCard(stats, 'Meetings', meetings.length.toString(), '📅');
		this.createStatCard(stats, 'This month', thisMonth.toString(), '📊');
		this.createStatCard(stats, 'Done', `${completionRate}%`, '✓');
	}

	private createStatCard(container: HTMLElement, label: string, value: string, icon: string): void {
		const card = container.createEl('div', {cls: 'stat-card'});
		card.createEl('span', {text: icon, cls: 'stat-icon'});
		card.createEl('span', {text: value, cls: 'stat-value'});
		card.createEl('span', {text: label, cls: 'stat-label'});
	}

	private async renderPeopleSection(container: HTMLElement, people: string[], profiles: PersonProfile[]): Promise<void> {
		const section = container.createEl('div', {cls: 'dashboard-section'});
		section.createEl('h3', {text: 'Team', cls: 'dashboard-section-title'});

		if (people.length === 0) {
			const emptyState = section.createEl('div', {cls: 'empty-state'});
			emptyState.createEl('p', {text: 'No team members yet. Add a person or create a 1:1.'});
			
			const emptyActions = emptyState.createEl('div', {cls: 'empty-state-actions'});
			const addPersonBtn = emptyActions.createEl('button', {
				text: '+ add person',
				cls: 'person-action-btn'
			});
			addPersonBtn.addEventListener('click', () => {
				new PersonProfileModal(this.app, this.plugin, null, async (profile) => {
					try {
						await this.plugin.peopleManager.savePersonProfile(profile);
						await new Promise(resolve => setTimeout(resolve, 100));
						await this.render();
						new Notice(`✓ Added ${profile.name}`);
					} catch (error) {
						console.error('Error adding person:', error);
						new Notice('❌ error adding person');
					}
				}).open();
			});
			
			const createMeetingBtn = emptyActions.createEl('button', {
				text: '+ create 1:1',
				cls: 'person-action-btn'
			});
			createMeetingBtn.addEventListener('click', () => {
				const modal = new CreateMeetingModal(this.app, this.plugin, async () => {
					await new Promise(resolve => setTimeout(resolve, 100));
					await this.render();
				});
				modal.open();
			});
			
			return;
		}

		const list = section.createEl('div', {cls: 'people-list'});

		for (const person of people) {
			const stats = await this.analyzer.getPersonStats(person);
			const profile = profiles.find(p => p.name === person);
			
			const card = list.createEl('div', {cls: 'person-card'});
			if (this.expandedPeople.has(person)) {
				card.addClass('is-expanded');
			}

			const header = card.createEl('div', {cls: 'person-header'});

			const collapseIcon = header.createEl('span', {cls: 'person-collapse-icon'});
			setIcon(collapseIcon, 'chevron-right');

			const nameWrap = header.createEl('div', {cls: 'person-name-wrap'});
			const nameEl = nameWrap.createEl('div', {text: person, cls: 'person-name'});

			const meta = nameWrap.createEl('div', {cls: 'person-meta'});
			meta.textContent = `${stats.meetingCount} mtgs · ${stats.lastMeeting}`;
			if (stats.actionItemCompletion > 0) {
				meta.textContent += ` · ${stats.actionItemCompletion} open`;
			}

			nameEl.addEventListener('click', (e) => {
				e.stopPropagation();
				void this.plugin.openTimelineView(person);
			});

			header.addEventListener('click', () => {
				const expanded = card.hasClass('is-expanded');
				card.toggleClass('is-expanded', !expanded);
				if (expanded) {
					this.expandedPeople.delete(person);
				} else {
					this.expandedPeople.add(person);
				}
			});

			const details = card.createEl('div', {cls: 'person-details'});

		// Show agenda items
		if (profile?.agendaItems && profile.agendaItems.length > 0) {
			const pendingItems = profile.agendaItems.filter((item: AgendaItem) => !item.completed);
			if (pendingItems.length > 0) {
				const agendaSection = details.createEl('div', {cls: 'person-agenda-section'});
				const agendaHeader = agendaSection.createEl('div', {cls: 'person-agenda-header'});
				agendaHeader.createEl('span', {text: '📋 agenda items', cls: 'person-agenda-title'});
				agendaHeader.createEl('span', {text: `(${pendingItems.length})`, cls: 'person-agenda-count'});

				const agendaList = agendaSection.createEl('div', {cls: 'person-agenda-list'});
				for (const item of pendingItems.slice(0, 3)) {
					const agendaItem = agendaList.createEl('div', {cls: 'person-agenda-item'});
					
					const checkbox = agendaItem.createEl('input', {type: 'checkbox'});
					checkbox.checked = false;
					checkbox.addEventListener('click', (e) => {
						e.stopPropagation();
						void (async () => {
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
						})();
					});
					
					const text = agendaItem.createEl('span', {text: item.text, cls: 'person-agenda-text'});
					if (item.priority === 'high') {
						text.addClass('is-high-priority');
					}
					
					const deleteBtn = agendaItem.createEl('button', {
						text: '×',
						cls: 'person-agenda-delete'
					});
					deleteBtn.addEventListener('click', (e) => {
						e.stopPropagation();
						void (async () => {
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
						})();
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

		const actionsDiv = details.createEl('div', {cls: 'person-actions'});
		
		const create11Btn = actionsDiv.createEl('button', {
			text: '+ new 1:1',
			cls: 'person-action-btn'
		});
		create11Btn.addEventListener('click', (e) => {
			e.stopPropagation();
			const modal = new CreateMeetingModal(this.app, this.plugin, async () => {
				// Refresh dashboard before navigating to the new meeting note
				await new Promise(resolve => setTimeout(resolve, 100));
				await this.render();
			});
			modal.person = person;
			modal.open();
		});

		const addAgendaBtn = actionsDiv.createEl('button', {
			text: '+ agenda item',
			cls: 'person-action-btn-small',
			attr: {title: 'Add agenda item'}
		});
		addAgendaBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			new AgendaItemModal(this.app, this.plugin, person, async (newItem) => {
				// Dynamically add the new item to the card without refreshing
				let agendaSection = details.querySelector('.person-agenda-section') as HTMLElement;

				if (!agendaSection) {
					// Create agenda section if it doesn't exist
					agendaSection = details.createEl('div', {cls: 'person-agenda-section'});
					const agendaHeader = agendaSection.createEl('div', {cls: 'person-agenda-header'});
					agendaHeader.createEl('span', {text: '📋 agenda items', cls: 'person-agenda-title'});
					agendaHeader.createEl('span', {text: '(1)', cls: 'person-agenda-count'});
					agendaSection.createEl('div', {cls: 'person-agenda-list'});

					// Insert before actions div
					details.insertBefore(agendaSection, actionsDiv);
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
					checkbox.addEventListener('click', (clickE) => {
						clickE.stopPropagation();
						void (async () => {
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
						})();
					});
					
					const text = agendaItem.createEl('span', {text: newItem.text, cls: 'person-agenda-text'});
					if (newItem.priority === 'high') {
						text.addClass('is-high-priority');
					}
					
					const deleteBtn = agendaItem.createEl('button', {
						text: '×',
						cls: 'person-agenda-delete'
					});
					deleteBtn.addEventListener('click', (clickE) => {
						clickE.stopPropagation();
						void (async () => {
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
						})();
					});
				}
			}).open();
		});
		

		const goalsBtn = actionsDiv.createEl('button', {
			text: '🎯 goals',
			cls: 'person-action-btn-small',
			attr: {title: 'View goals'}
		});
		goalsBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			void this.plugin.openGoalsView(person);
		});

		const editBtn = actionsDiv.createEl('button', {
			text: 'Edit',
			cls: 'person-action-btn-small',
			attr: {title: 'Edit profile'}
		});
		editBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			new PersonProfileModal(this.app, this.plugin, profile ?? null, async (updatedProfile) => {
				await this.plugin.peopleManager.savePersonProfile(updatedProfile);
				await new Promise(resolve => setTimeout(resolve, 100));
				await this.render();
			}).open();
		});

		const deleteBtn = actionsDiv.createEl('button', {
			text: 'Delete',
			cls: 'person-action-btn-small person-action-btn-delete',
			attr: {title: 'Delete person'}
		});
		deleteBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			new ConfirmModal(
				this.app,
				`Are you sure you want to delete ${person}? This will only remove the profile, not the 1:1 meeting notes.`,
				async () => {
					await this.plugin.peopleManager.deletePersonProfile(person);
					new Notice(`Deleted ${person}`);
					await this.render();
				},
				{title: 'Delete person', confirmText: 'Delete', isDestructive: true}
			).open();
		});
		}
	}

	private async renderActionItemsSection(container: HTMLElement, meetings: OneOnOneMeeting[]): Promise<void> {
		const section = container.createEl('div', {cls: 'dashboard-section'});
		section.createEl('h3', {text: 'Open action items', cls: 'dashboard-section-title'});

		const allActions = meetings.flatMap(m =>
			m.actionItems.map(a => ({...a, person: m.person, meetingDate: m.date}))
		);

		const incomplete = allActions.filter(a => !a.completed);
		
		if (incomplete.length === 0) {
			section.createEl('p', {text: '🎉 all done!', cls: 'empty-state-text'});
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
